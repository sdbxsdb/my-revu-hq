import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_utils/supabase';
import { setCorsHeaders } from '../_utils/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(204).end();
  }

  const route = (req.query.route as string[]) || [];
  const endpoint = route[0] || '';

  // Set CORS headers for all routes
  const origin =
    req.headers.origin ||
    req.headers.referer?.split('/').slice(0, 3).join('/') ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    // Route: /api/auth/check-email
    if (endpoint === 'check-email' && req.method === 'GET') {
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
    }

    // Route: /api/auth/logout
    if (endpoint === 'logout' && req.method === 'POST') {
      res.setHeader('Set-Cookie', [
        'access_token=; Max-Age=0; Path=/',
        'refresh_token=; Max-Age=0; Path=/',
      ]);

      return res.json({ success: true });
    }

    // Route: /api/auth/sync-session
    if (endpoint === 'sync-session' && req.method === 'POST') {
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
    }

    // Unknown route
    return res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
