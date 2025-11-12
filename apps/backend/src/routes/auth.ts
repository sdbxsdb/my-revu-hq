import { Router } from 'express';
import { supabase } from '../utils/supabase';

const router = Router();

// This endpoint is called by the frontend to sync Supabase session to HTTP-only cookies
router.post('/sync-session', async (req, res) => {
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
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    res.cookie('access_token', access_token, cookieOptions);
    if (refresh_token) {
      res.cookie('refresh_token', refresh_token, cookieOptions);
    }

    res.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to sync session' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.json({ success: true });
});

export default router;

