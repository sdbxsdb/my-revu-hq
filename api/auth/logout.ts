import type { VercelRequest, VercelResponse } from '@vercel/node';
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

  res.setHeader('Set-Cookie', [
    'access_token=; Max-Age=0; Path=/',
    'refresh_token=; Max-Age=0; Path=/',
  ]);

  return res.json({ success: true });
}
