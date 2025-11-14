import type { VercelRequest } from '@vercel/node';
import { supabase } from './supabase';

export interface AuthUser {
  userId: string;
  userEmail?: string;
}

export async function authenticate(req: VercelRequest): Promise<AuthUser> {
  // Get token from cookie or Authorization header
  const cookies = req.headers.cookie || '';
  const cookieMatch = cookies.match(/access_token=([^;]+)/);
  const token = cookieMatch?.[1] || req.headers.authorization?.replace('Bearer ', '');

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
