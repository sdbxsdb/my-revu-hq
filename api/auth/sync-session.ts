import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_utils/supabase';
import { setCorsHeaders } from '../_utils/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { access_token, refresh_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'Missing access token' });
    }

    // Verify the token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(access_token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Set HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    };

    res.setHeader(
      'Set-Cookie',
      [
        `access_token=${access_token}; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Lax; Max-Age=${cookieOptions.maxAge}; Path=/`,
        refresh_token
          ? `refresh_token=${refresh_token}; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Lax; Max-Age=${cookieOptions.maxAge}; Path=/`
          : '',
      ].filter(Boolean)
    );

    return res.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to sync session' });
  }
}
