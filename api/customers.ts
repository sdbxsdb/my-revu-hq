import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { supabase } from './_utils/supabase';
import { authenticate } from './_utils/auth';
import { setCorsHeaders } from './_utils/response';

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.object({
    countryCode: z.string(),
    number: z.string(),
  }),
  jobDescription: z.string().max(250, 'Job description must be 250 characters or less').optional(),
  scheduledSendAt: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(204).end();
  }

  try {
    const auth = await authenticate(req as any);

    if (req.method === 'GET') {
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');
      const status = req.query.status as string | undefined;
      const firstLetter = req.query.firstLetter as string | undefined;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('user_id', auth.userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('sms_status', status);
      }

      if (firstLetter && firstLetter.length === 1) {
        // Filter by first letter of name (case-insensitive)
        const letter = firstLetter.toUpperCase();
        query = query.ilike('name', `${letter}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch messages for each customer
      const customersWithMessages = await Promise.all(
        (data || []).map(async (customer) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('sent_at, was_scheduled')
            .eq('customer_id', customer.id)
            .order('sent_at', { ascending: false });

          return {
            ...customer,
            messages: messages || [],
          };
        })
      );

      // Get total count without filters for display
      const { count: totalCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.userId);

      return res.json({
        customers: customersWithMessages,
        total: count || 0,
        totalCount: totalCount || 0, // Total count without any filters
      });
    }

    if (req.method === 'POST') {
      const validated = customerSchema.parse(req.body);

      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: auth.userId,
          name: validated.name,
          phone: validated.phone,
          job_description: validated.jobDescription?.trim() || null,
          sms_status: validated.scheduledSendAt ? 'scheduled' : 'pending',
          scheduled_send_at: validated.scheduledSendAt || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: error.message || 'Failed to process request' });
  }
}
