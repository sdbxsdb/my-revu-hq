import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { supabase } from '../_utils/supabase';
import { authenticate } from '../_utils/auth';
import { setCorsHeaders } from '../_utils/response';

// Initialize Stripe
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    });
  }
} catch (error) {
  // Stripe not initialized - will fail gracefully
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    setCorsHeaders(res);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await authenticate(req as any);

    // Get user's subscription info
    const { data: user } = await supabase
      .from('users')
      .select('stripe_subscription_id, stripe_customer_id, account_status')
      .eq('id', auth.userId)
      .single<{
        stripe_subscription_id: string | null;
        stripe_customer_id: string | null;
        account_status: string | null;
      }>();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If account is already cancelled or deleted, return error
    if (user.account_status === 'cancelled') {
      return res.status(400).json({ error: 'Subscription is already cancelled' });
    }

    if (user.account_status === 'deleted') {
      return res.status(400).json({ error: 'Account is already deleted' });
    }

    // Cancel Stripe subscription if it exists
    if (user.stripe_subscription_id && stripe) {
      try {
        await stripe.subscriptions.cancel(user.stripe_subscription_id);
      } catch (stripeError: any) {
        // If subscription is already cancelled in Stripe, that's okay
        // We'll still update our database
        if (!stripeError.message?.includes('No such subscription')) {
          console.error('[Cancel Subscription] Stripe error:', stripeError);
        }
      }
    }

    // Update database: set account_status to 'cancelled' and access_status to 'canceled'
    const { error: updateError } = await supabase
      .from('users')
      // @ts-ignore - Supabase types don't include these fields yet
      .update({
        account_status: 'cancelled',
        access_status: 'canceled',
        current_period_end: null,
      })
      .eq('id', auth.userId);

    if (updateError) {
      throw updateError;
    }

    setCorsHeaders(res);
    return res.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (error: any) {
    setCorsHeaders(res);
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
}
