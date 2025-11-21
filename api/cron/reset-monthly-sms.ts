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
    // Try RPC function first, fallback to direct UPDATE if it fails
    let resetSuccess = false;

    // Attempt 1: Use RPC function
    const { error: rpcError } = await supabase.rpc('reset_monthly_sms_count');

    if (!rpcError) {
      resetSuccess = true;
    } else {
      console.warn('[Cron] RPC function failed, trying direct UPDATE:', rpcError);

      // Attempt 2: Direct UPDATE query (more reliable)
      const { error: updateError, count } = await supabase
        .from('users')
        // @ts-ignore - Supabase types don't include all fields
        .update({ sms_sent_this_month: 0 })
        .neq('sms_sent_this_month', 0); // Only update non-zero values

      if (updateError) {
        console.error('[Cron] Direct UPDATE also failed:', updateError);
        return res.status(500).json({
          error: 'Failed to reset monthly SMS counts',
          rpcError: rpcError.message,
          updateError: updateError.message,
        });
      }

      resetSuccess = true;
      console.log(`[Cron] Reset ${count || 0} user(s) via direct UPDATE`);
    }

    // Verify the reset worked
    const { data: checkData, error: checkError } = await supabase
      .from('users')
      .select('id, sms_sent_this_month')
      .neq('sms_sent_this_month', 0)
      .limit(1);

    return res.json({
      success: true,
      message: 'Monthly SMS counts reset successfully',
      timestamp: new Date().toISOString(),
      method: resetSuccess ? (rpcError ? 'direct-update' : 'rpc-function') : 'failed',
      verification: checkError
        ? 'Could not verify'
        : checkData?.length === 0
          ? 'Verified: All counts reset'
          : `Warning: ${checkData?.length || 0} user(s) still have non-zero counts`,
    });
  } catch (error: any) {
    console.error('[Cron] Error in reset-monthly-sms:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
