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
  console.warn('Stripe not initialized - STRIPE_SECRET_KEY missing or invalid');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await authenticate(req as any);

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    // Get or create Stripe customer (needed for invoices)
    let { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, email, business_name')
      .eq('id', auth.userId)
      .single<{
        stripe_customer_id: string | null;
        email: string;
        business_name: string | null;
      }>();

    let customerId = user?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user?.email || auth.userEmail!,
        metadata: {
          userId: auth.userId,
        },
      });
      customerId = customer.id;
      await supabase
        .from('users')
        // @ts-ignore - Supabase types don't include billing fields yet
        .update({ stripe_customer_id: customerId })
        .eq('id', auth.userId);
    }

    // TODO: Send email to admin/support team with customer details
    // Or create a ticket in your support system
    // Or store in a database table for manual processing

    return res.json({ message: 'Invoice setup requested' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: error.message });
  }
}
