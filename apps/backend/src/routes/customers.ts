import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../utils/supabase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.object({
    countryCode: z.string(),
    number: z.string(),
  }),
  jobDescription: z.string().optional(),
});

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('sms_status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      customers: data || [],
      total: count || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch customers' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const validated = customerSchema.parse(req.body);

    const { data, error } = await supabase
      .from('customers')
      .insert({
        user_id: req.userId!,
        name: validated.name,
        phone: validated.phone,
        job_description: validated.jobDescription,
        sms_status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message || 'Failed to create customer' });
  }
});

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

router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validated = updateCustomerSchema.parse(req.body);

    // First verify the customer belongs to the user
    const { data: existing, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId!)
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
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message || 'Failed to update customer' });
  }
});

export default router;
