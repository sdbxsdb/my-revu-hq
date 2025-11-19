import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_utils/supabase';
import { setCorsHeaders } from '../_utils/response';

// GET /api/auth/check-email?email=...
// Check if an email already exists in the database
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    setCorsHeaders(res);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  setCorsHeaders(res);

  try {
    const email = req.query.email as string;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists in our database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" - that's fine, means email doesn't exist
      throw error;
    }

    return res.json({
      exists: !!user,
      createdAt: user?.created_at || null,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to check email' });
  }
}
