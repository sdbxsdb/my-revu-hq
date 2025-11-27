import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { supabase } from './_utils/supabase';
import { authenticate } from './_utils/auth';
import { setCorsHeaders } from './_utils/response';

const accountSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').optional(),
  review_links: z
    .array(
      z.object({
        name: z.string().min(1, 'Link name is required'),
        url: z
          .string()
          .min(1, 'URL is required')
          .refine(
            (url) => {
              try {
                new URL(url);
                return true;
              } catch {
                return false;
              }
            },
            { message: 'Invalid URL format' }
          ),
      })
    )
    .optional(),
  sms_template: z.string().max(500, 'SMS template must be 500 characters or less').optional(),
  include_name_in_sms: z.boolean().optional(),
  include_job_in_sms: z.boolean().optional(),
  onboarding_completed: z.boolean().optional(),
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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', auth.userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Create user profile if it doesn't exist
        const { data: newUser, error: createError } = await supabase
          .from('users')
          // @ts-ignore - Supabase types don't include all fields
          .insert({
            id: auth.userId,
            email: auth.userEmail,
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }
        return res.json(newUser);
      }

      return res.json(data);
    }

    if (req.method === 'PUT') {
      // Filter out empty or invalid review links before validation
      if (req.body.review_links) {
        req.body.review_links = req.body.review_links.filter(
          (link: any) => link.name?.trim() && link.url?.trim() && link.url.startsWith('http')
        );
      }

      const validated = accountSchema.parse(req.body);

      const { data, error } = await supabase
        .from('users')
        // @ts-ignore - Supabase types don't include all fields
        .update(validated)
        .eq('id', auth.userId)
        .select()
        .single();

      if (error) throw error;

      return res.json(data);
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
