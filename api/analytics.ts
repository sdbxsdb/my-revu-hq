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
      .select('sent_at, customer_id, was_scheduled')
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

    // For Business tier, get customer insights
    let insights: {
      notContacted5Days: Array<{
        id: string;
        name: string;
        phone: { countryCode: string; number: string };
        job_description: string | null;
        lastContacted: string | null;
        daysSinceContact: number;
        createdAt: string;
      }>;
      notContacted10Days: Array<{
        id: string;
        name: string;
        phone: { countryCode: string; number: string };
        job_description: string | null;
        lastContacted: string | null;
        daysSinceContact: number;
        createdAt: string;
      }>;
      notContacted30Days: Array<{
        id: string;
        name: string;
        phone: { countryCode: string; number: string };
        job_description: string | null;
        lastContacted: string | null;
        daysSinceContact: number;
        createdAt: string;
      }>;
      approachingLimit: Array<{
        id: string;
        name: string;
        phone: { countryCode: string; number: string };
        job_description: string | null;
        messageCount: number;
        createdAt: string;
      }>;
    } | null = null;

    if (tier === 'business') {
      const fiveDaysAgo = new Date(now);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const tenDaysAgo = new Date(now);
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get all customers
      const { data: allCustomers, error: customersError } = await supabase
        .from('customers')
        .select('id, name, phone, job_description, sent_at, sms_request_count, opt_out, created_at')
        .eq('user_id', auth.userId)
        .eq('opt_out', false); // Exclude opted-out customers

      if (!customersError && allCustomers) {
        // Helper function to calculate days since contact
        const calculateDaysSinceContact = (customer: any) => {
          if (customer.sent_at) {
            const lastContacted = new Date(customer.sent_at);
            return Math.floor((now.getTime() - lastContacted.getTime()) / (1000 * 60 * 60 * 24));
          } else {
            const created = new Date(customer.created_at);
            return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          }
        };

        // Helper function to create customer insight object
        const createInsight = (customer: any) => {
          const lastContacted = customer.sent_at ? new Date(customer.sent_at) : null;
          const daysSinceContact = calculateDaysSinceContact(customer);

          return {
            id: customer.id,
            name: customer.name,
            phone: customer.phone || { countryCode: '', number: 'N/A' },
            job_description: customer.job_description,
            lastContacted: customer.sent_at,
            daysSinceContact,
            createdAt: customer.created_at,
          };
        };

        // Customers not contacted in 5+ days (but less than 10)
        const notContacted5Days = allCustomers
          .filter((customer) => {
            const daysSinceContact = calculateDaysSinceContact(customer);
            return daysSinceContact >= 5 && daysSinceContact < 10;
          })
          .map(createInsight)
          .sort((a, b) => b.daysSinceContact - a.daysSinceContact);

        // Customers not contacted in 10+ days (but less than 30)
        const notContacted10Days = allCustomers
          .filter((customer) => {
            const daysSinceContact = calculateDaysSinceContact(customer);
            return daysSinceContact >= 10 && daysSinceContact < 30;
          })
          .map(createInsight)
          .sort((a, b) => b.daysSinceContact - a.daysSinceContact);

        // Customers not contacted in 30+ days
        const notContacted30Days = allCustomers
          .filter((customer) => {
            const daysSinceContact = calculateDaysSinceContact(customer);
            return daysSinceContact >= 30;
          })
          .map(createInsight)
          .sort((a, b) => b.daysSinceContact - a.daysSinceContact);

        // Customers approaching 3-message limit (2 messages sent)
        const approachingLimit = allCustomers
          .filter((customer) => {
            const count = customer.sms_request_count || 0;
            return count >= 2 && count < 3; // 2 messages = approaching limit
          })
          .map((customer) => ({
            id: customer.id,
            name: customer.name,
            phone: customer.phone || { countryCode: '', number: 'N/A' },
            job_description: customer.job_description,
            messageCount: customer.sms_request_count || 0,
            createdAt: customer.created_at,
          }))
          .sort((a, b) => b.messageCount - a.messageCount); // Highest count first

        insights = {
          notContacted5Days,
          notContacted10Days,
          notContacted30Days,
          approachingLimit,
        };
      }
    }

    return res.json({
      tier,
      monthlyStats: monthlyArray,
      totalMessages: messages?.length || 0,
      ...(insights ? { insights } : {}),
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: error.message || 'Failed to load analytics' });
  }
}
