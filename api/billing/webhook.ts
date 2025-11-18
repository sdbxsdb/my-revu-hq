import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { supabase } from '../_utils/supabase';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
  }

  // Get raw body for webhook signature verification
  // Vercel provides raw body as Buffer or string for webhooks
  const body = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle subscription events
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;
      const { data: subUser } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', subscription.customer as string)
        .single<{ id: string }>();

      if (subUser) {
        await supabase
          .from('users')
          // @ts-ignore - Supabase types don't include billing fields yet
          .update({
            stripe_subscription_id: subscription.id,
            access_status:
              subscription.status === 'active'
                ? 'active'
                : subscription.status === 'past_due'
                  ? 'past_due'
                  : subscription.status === 'canceled'
                    ? 'canceled'
                    : 'inactive',
            payment_method: 'card',
            current_period_end: (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : null,
          })
          .eq('id', subUser.id);
      }
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object as Stripe.Subscription;
      const { data: deletedUser } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', deletedSub.customer as string)
        .single<{ id: string }>();

      if (deletedUser) {
        await supabase
          .from('users')
          // @ts-ignore - Supabase types don't include billing fields yet
          .update({
            access_status: 'canceled',
            current_period_end: null,
          })
          .eq('id', deletedUser.id);
      }
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      const { data: invoiceUser } = await supabase
        .from('users')
        .select('id, stripe_subscription_id')
        .eq('stripe_customer_id', invoice.customer as string)
        .single<{
          id: string;
          stripe_subscription_id: string | null;
        }>();

      if (invoiceUser) {
        // Only update if this is an invoice payment (no subscription_id)
        if (!invoiceUser.stripe_subscription_id && (invoice as any).subscription === null) {
          await supabase
            .from('users')
            // @ts-ignore - Supabase types don't include billing fields yet
            .update({
              access_status: 'active',
              payment_method: 'direct_debit',
              current_period_end: invoice.period_end
                ? new Date(invoice.period_end * 1000).toISOString()
                : null,
            })
            .eq('id', invoiceUser.id);
        }
      }
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      const { data: failedUser } = await supabase
        .from('users')
        .select('id, stripe_subscription_id')
        .eq('stripe_customer_id', failedInvoice.customer as string)
        .single<{
          id: string;
          stripe_subscription_id: string | null;
        }>();

      if (failedUser && !failedUser.stripe_subscription_id) {
        await supabase
          .from('users')
          // @ts-ignore - Supabase types don't include billing fields yet
          .update({
            access_status: 'past_due',
          })
          .eq('id', failedUser.id);
      }
      break;
  }

  return res.json({ received: true });
}
