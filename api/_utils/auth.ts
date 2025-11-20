import type { VercelRequest } from '@vercel/node';
import { supabase } from './supabase';

export interface AuthUser {
  userId: string;
  userEmail?: string;
}

export async function authenticate(req: VercelRequest): Promise<AuthUser> {
  // Get token from Authorization header first (works in development with proxy)
  // Then fall back to cookie (works in production)
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.replace('Bearer ', '');

  const cookies = req.headers.cookie || '';
  const cookieMatch = cookies.match(/access_token=([^;]+)/);
  const tokenFromCookie = cookieMatch?.[1];

  // Prefer header token (development) over cookie (production)
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    throw new Error('Unauthorized');
  }

  // Verify token with Supabase
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return {
    userId: user.id,
    userEmail: user.email || undefined,
  };
}
