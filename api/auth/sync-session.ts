import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_utils/supabase';
import { setCorsHeaders } from '../_utils/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers first to allow credentials
  const origin =
    req.headers.origin ||
    req.headers.referer?.split('/').slice(0, 3).join('/') ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
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

    const isProduction = process.env.NODE_ENV === 'production';

    const cookieStrings = [
      `access_token=${access_token}; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Lax; Max-Age=${cookieOptions.maxAge}; Path=/`,
      refresh_token
        ? `refresh_token=${refresh_token}; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Lax; Max-Age=${cookieOptions.maxAge}; Path=/`
        : '',
    ].filter(Boolean);

    res.setHeader('Set-Cookie', cookieStrings);

    return res.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to sync session' });
  }
}
