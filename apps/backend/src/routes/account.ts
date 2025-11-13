import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../utils/supabase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const accountSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  review_links: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
      })
    )
    .optional(),
  sms_template: z.string().optional(),
});

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', req.userId!).single();

    if (error) throw error;

    if (!data) {
      // Create user profile if it doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: req.userId!,
          email: req.userEmail!,
        })
        .select()
        .single();

      if (createError) throw createError;
      return res.json(newUser);
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch account' });
  }
});

router.put('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const validated = accountSchema.parse(req.body);

    const { data, error } = await supabase
      .from('users')
      .update(validated)
      .eq('id', req.userId!)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message || 'Failed to update account' });
  }
});

export default router;
