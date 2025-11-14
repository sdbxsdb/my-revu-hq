import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { supabase } from '../_utils/supabase';
import { authenticate } from '../_utils/auth';
import { setCorsHeaders } from '../_utils/response';

// Initialize Stripe - will fail gracefully if key is missing
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    });
  }
} catch (error) {
  console.warn('Stripe not initialized - STRIPE_SECRET_KEY missing or invalid');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await authenticate(req as any);

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    // Get user's subscription data from our database (source of truth)
    const { data: user } = await supabase
      .from('users')
      .select(
        'stripe_customer_id, stripe_subscription_id, access_status, payment_method, current_period_end'
      )
      .eq('id', auth.userId)
      .single<{
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
        access_status: string | null;
        payment_method: string | null;
        current_period_end: string | null;
      }>();

    if (!user) {
      return res.json({
        accessStatus: 'inactive',
        paymentMethod: null,
      });
    }

    // If no access status, return inactive
    if (!user.access_status || user.access_status === 'inactive') {
      return res.json({
        accessStatus: 'inactive',
        paymentMethod: null,
      });
    }

    // Determine payment type based on subscription_id
    let cardLast4: string | undefined;
    let cardBrand: string | undefined;

    if (user.stripe_subscription_id) {
      // Card payment: Get card details from Stripe to display
      const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
      const paymentMethod = subscription.default_payment_method
        ? await stripe.paymentMethods.retrieve(subscription.default_payment_method as string)
        : null;

      if (paymentMethod?.type === 'card' && paymentMethod.card) {
        cardLast4 = paymentMethod.card.last4;
        cardBrand = paymentMethod.card.brand;
      }
    }

    return res.json({
      accessStatus: user.access_status,
      paymentMethod: user.payment_method as 'card' | 'direct_debit' | null,
      nextBillingDate: user.current_period_end || undefined,
      cardLast4,
      cardBrand,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: error.message });
  }
}
