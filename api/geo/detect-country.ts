import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../_utils/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
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
    // Vercel provides geolocation headers
    // x-vercel-ip-country: Country code (e.g., "GB", "US", "IE")
    const vercelCountry = req.headers['x-vercel-ip-country'] as string;
    const cloudflareCountry = req.headers['cf-ipcountry'] as string;
    const countryCode = vercelCountry || cloudflareCountry || null;

    // Get client IP for logging
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress;

    // Log detection method for debugging
    const detectionMethod = vercelCountry
      ? 'Vercel header'
      : cloudflareCountry
        ? 'Cloudflare header'
        : 'IP geolocation API';

    if (!countryCode) {
      // Fallback: Try to get from IP using a free service
      if (clientIp) {
        try {
          // Use ipapi.co free tier (1000 requests/day)
          const geoResponse = await fetch(`https://ipapi.co/${clientIp}/country_code/`, {
            headers: {
              'User-Agent': 'MyRevuHQ/1.0',
            },
          });

          if (geoResponse.ok) {
            const country = await geoResponse.text();
            if (country && country.length === 2) {
              const detectedCountry = country.trim().toUpperCase();
              console.log(
                `[Geo] Detected country: ${detectedCountry} (via IP API, IP: ${clientIp})`
              );
              return res.json({
                country: detectedCountry,
                method: 'ip-api',
                ip: clientIp,
              });
            }
          }
        } catch (error) {
          console.error('[Geo] IP geolocation failed:', error);
        }
      }

      // Final fallback to GBP
      console.log(`[Geo] No country detected, defaulting to GB (IP: ${clientIp})`);
      return res.json({
        country: 'GB',
        method: 'fallback',
        ip: clientIp,
      });
    }

    const detectedCountry = countryCode.toUpperCase();
    console.log(
      `[Geo] Detected country: ${detectedCountry} (via ${detectionMethod}, IP: ${clientIp})`
    );
    return res.json({
      country: detectedCountry,
      method: detectionMethod.toLowerCase().replace(' ', '-'),
      ip: clientIp,
    });
  } catch (error: any) {
    setCorsHeaders(res);
    console.error('[Geo] Error detecting country:', error);
    return res.status(500).json({ error: error.message });
  }
}
