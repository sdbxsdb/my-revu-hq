import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { supabase } from './_utils/supabase';
import { authenticate } from './_utils/auth';
import { setCorsHeaders } from './_utils/response';
import { normalizeToE164 } from './_utils/phone';

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
      const search = req.query.search as string | undefined;
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

      // Search takes priority over letter filter
      if (search && search.trim()) {
        const searchTerm = search.trim();
        // Search in name and job_description (case-insensitive)
        query = query.or(`name.ilike.%${searchTerm}%,job_description.ilike.%${searchTerm}%`);
      } else if (firstLetter && firstLetter.length === 1) {
        // Filter by first letter of name (case-insensitive) - only if not searching
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

      // Check for duplicate phone number (only in production)
      const isProduction =
        process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

      if (isProduction) {
        // Normalize the incoming phone number to E.164 for comparison
        const incomingE164 = normalizeToE164(validated.phone.number, validated.phone.countryCode);

        if (!incomingE164) {
          return res.status(400).json({
            error: 'Invalid phone number format',
          });
        }

        // Get all existing customers for this user
        const { data: existingCustomers, error: fetchError } = await supabase
          .from('customers')
          .select('id, phone')
          .eq('user_id', auth.userId);

        if (fetchError) throw fetchError;

        // Check if any existing customer has the same phone number (normalized to E.164)
        if (existingCustomers) {
          for (const existing of existingCustomers) {
            if (existing.phone && typeof existing.phone === 'object') {
              const existingPhone = existing.phone as { countryCode: string; number: string };
              const existingE164 = normalizeToE164(existingPhone.number, existingPhone.countryCode);

              if (existingE164 && existingE164 === incomingE164) {
                return res.status(409).json({
                  error:
                    'A customer with this phone number already exists. Please use the existing customer record or edit it instead.',
                });
              }
            }
          }
        }
      }

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
