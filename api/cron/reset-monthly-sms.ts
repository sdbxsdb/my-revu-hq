import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_utils/supabase';

/**
 * Cron job to reset monthly SMS counts
 * Should be run on the 1st of each month
 * Configure in vercel.json cron jobs
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron job request
  // Vercel automatically adds 'x-vercel-cron' header for scheduled cron jobs
  // For manual testing, we can use Authorization header with CRON_SECRET
  const vercelCronHeader = req.headers['x-vercel-cron'];
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;

  // Allow if it's a Vercel cron job (has x-vercel-cron header)
  // OR if it's a manual request with correct Authorization header
  const isVercelCron = vercelCronHeader === '1';
  const isAuthorizedManual = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !isAuthorizedManual) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Call the database function to reset monthly counts
    const { error } = await supabase.rpc('reset_monthly_sms_count');

    if (error) {
      console.error('[Cron] Error resetting monthly SMS counts:', error);
      return res.status(500).json({ error: 'Failed to reset monthly SMS counts' });
    }

    return res.json({
      success: true,
      message: 'Monthly SMS counts reset successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] Error in reset-monthly-sms:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
