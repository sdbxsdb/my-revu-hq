import type { VercelResponse } from '@vercel/node';

export function setCorsHeaders(res: VercelResponse): VercelResponse {
  const origin = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}
