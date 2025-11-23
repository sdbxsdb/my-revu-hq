import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_utils/supabase';
import { authenticate } from './_utils/auth';
import { setCorsHeaders } from './_utils/response';

/**
 * Get analytics data for Pro and Business tiers
 * Pro: Monthly message counts
 * Business: Monthly message counts + customer details
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await authenticate(req as any);

    // Get user's subscription tier
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', auth.userId)
      .single<{ subscription_tier: string | null }>();

    if (userError) throw userError;
    if (!user) throw new Error('User not found');

    const tier = user.subscription_tier;

    // Only Pro and Business tiers have access to analytics
    if (tier !== 'pro' && tier !== 'business') {
      return res.status(403).json({
        error: 'Analytics are only available for Pro and Business plans',
      });
    }

    // Get monthly message counts (last 12 months)
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('sent_at, customer_id')
      .eq('user_id', auth.userId)
      .gte('sent_at', twelveMonthsAgo.toISOString())
      .order('sent_at', { ascending: false });

    if (messagesError) throw messagesError;

    // Group messages by month
    const monthlyStats: Record<
      string,
      {
        month: string;
        year: number;
        count: number;
        customers?: Array<{
          id: string;
          name: string;
          phone: string;
          job_description: string | null;
          sent_at: string;
        }>;
      }
    > = {};

    messages?.forEach((message) => {
      const date = new Date(message.sent_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          month: monthName,
          year: date.getFullYear(),
          count: 0,
          ...(tier === 'business' ? { customers: [] } : {}),
        };
      }

      monthlyStats[monthKey].count++;
    });

    // For Business tier, get customer details
    if (tier === 'business' && messages && messages.length > 0) {
      const customerIds = [...new Set(messages.map((m) => m.customer_id))];

      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, name, phone, job_description')
        .eq('user_id', auth.userId)
        .in('id', customerIds);

      if (customersError) throw customersError;

      const customerMap = new Map(
        customers?.map((c) => [
          c.id,
          {
            name: c.name,
            phone: c.phone?.number || 'N/A',
            job_description: c.job_description,
          },
        ]) || []
      );

      // Add customer details to monthly stats
      messages.forEach((message) => {
        const date = new Date(message.sent_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const customer = customerMap.get(message.customer_id);

        if (customer && monthlyStats[monthKey]?.customers) {
          monthlyStats[monthKey].customers!.push({
            id: message.customer_id,
            name: customer.name,
            phone: customer.phone,
            job_description: customer.job_description,
            sent_at: message.sent_at,
          });
        }
      });
    }

    // Convert to array and sort by date (newest first)
    const monthlyArray = Object.values(monthlyStats).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month.localeCompare(a.month);
    });

    return res.json({
      tier,
      monthlyStats: monthlyArray,
      totalMessages: messages?.length || 0,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: error.message || 'Failed to load analytics' });
  }
}
