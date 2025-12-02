import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { supabase } from '../_utils/supabase';
import { authenticate } from '../_utils/auth';
import { setCorsHeaders } from '../_utils/response';
import { normalizeToE164 } from '../_utils/phone';

const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z
    .object({
      countryCode: z.string(),
      number: z.string(),
    })
    .optional(),
  jobDescription: z.string().max(250, 'Job description must be 250 characters or less').optional(),
  scheduledSendAt: z.string().nullable().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(204).end();
  }

  try {
    const auth = await authenticate(req as any);

    if (req.method === 'PUT') {
      const { id } = req.query;
      const validated = updateCustomerSchema.parse(req.body);

      // First verify the customer belongs to the user
      const { data: existing, error: fetchError } = await supabase
        .from('customers')
        .select('id')
        .eq('id', id)
        .eq('user_id', auth.userId)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check for duplicate phone number if phone is being updated (only in production)
      const isProduction =
        process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

      if (validated.phone && isProduction) {
        // Normalize the incoming phone number to E.164 for comparison
        const incomingE164 = normalizeToE164(validated.phone.number, validated.phone.countryCode);

        if (!incomingE164) {
          return res.status(400).json({
            error: 'Invalid phone number format',
          });
        }

        // Get all existing customers for this user (excluding the current one being updated)
        const { data: existingCustomers, error: fetchError } = await supabase
          .from('customers')
          .select('id, phone')
          .eq('user_id', auth.userId)
          .neq('id', id);

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
                    'A customer with this phone number already exists. Please use the existing customer record instead.',
                });
              }
            }
          }
        }
      }

      const updateData: any = {};
      if (validated.name) updateData.name = validated.name;
      if (validated.phone) updateData.phone = validated.phone;
      if (validated.jobDescription !== undefined) {
        // Convert empty string to null
        updateData.job_description = validated.jobDescription?.trim() || null;
      }
      if (validated.scheduledSendAt !== undefined) {
        updateData.scheduled_send_at = validated.scheduledSendAt || null;
        // Update SMS status based on scheduled time
        if (validated.scheduledSendAt) {
          updateData.sms_status = 'scheduled';
        } else {
          // If clearing schedule, set back to pending
          updateData.sms_status = 'pending';
        }
      }

      const { data, error } = await supabase
        .from('customers')
        // @ts-ignore - Supabase types don't include all fields
        .update(updateData)
        .eq('id', id)
        .eq('user_id', auth.userId)
        .select()
        .single();

      if (error) throw error;

      return res.json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;

      // First verify the customer belongs to the user
      const { data: existing, error: fetchError } = await supabase
        .from('customers')
        .select('id')
        .eq('id', id)
        .eq('user_id', auth.userId)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('user_id', auth.userId);

      if (error) throw error;

      return res.status(204).end();
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
