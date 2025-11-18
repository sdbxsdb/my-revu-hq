import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { supabase } from '../_utils/supabase';
import { authenticate } from '../_utils/auth';
import { setCorsHeaders } from '../_utils/response';

const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z
    .object({
      countryCode: z.string(),
      number: z.string(),
    })
    .optional(),
  jobDescription: z.string().optional(),
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

      const updateData: any = {};
      if (validated.name) updateData.name = validated.name;
      if (validated.phone) updateData.phone = validated.phone;
      if (validated.jobDescription !== undefined) {
        updateData.job_description = validated.jobDescription || null;
      }

      const { data, error } = await supabase
        .from('customers')
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
