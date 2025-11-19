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

// Helper function to get raw body from request
async function getRawBody(req: VercelRequest): Promise<string> {
  // Method 1: Check if rawBody is available (Vercel-specific)
  if (typeof (req as any).rawBody !== 'undefined') {
    if (Buffer.isBuffer((req as any).rawBody)) {
      return (req as any).rawBody.toString('utf8');
    } else if (typeof (req as any).rawBody === 'string') {
      return (req as any).rawBody;
    }
  }

  // Method 2: Check if body is already a Buffer or string (raw)
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }
  if (typeof req.body === 'string') {
    return req.body;
  }

  // Method 3: Try to read from stream (if not already consumed)
  if ((req as any).readable && typeof (req as any).on === 'function') {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      (req as any).on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      (req as any).on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf8'));
      });
      (req as any).on('error', reject);
    });
  }

  // Method 4: Last resort - reconstruct from parsed JSON
  // This will likely fail signature verification, but we'll try
  if (req.body && typeof req.body === 'object') {
    console.warn(
      '[Webhook] Body was parsed as JSON - reconstructing. Signature verification may fail.'
    );
    return JSON.stringify(req.body);
  }

  throw new Error('Unable to get raw request body');
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

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  if (!webhookSecret) {
    return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
  }

  // Get raw body for webhook signature verification
  let bodyString: string = '';
  try {
    bodyString = await getRawBody(req);
    console.log('[Webhook] Got raw body, length:', bodyString.length);
  } catch (error: any) {
    console.error('[Webhook] Error getting raw body:', error);
    // If we can't get raw body, try to use parsed body as fallback
    if (req.body && typeof req.body === 'object') {
      console.warn('[Webhook] Using parsed body as fallback');
      bodyString = JSON.stringify(req.body);
    } else {
      return res.status(400).json({ error: 'Invalid request body format' });
    }
  }

  let event: Stripe.Event;

  try {
    // Use the raw body string for signature verification
    event = stripe.webhooks.constructEvent(bodyString, sig, webhookSecret);
    console.log('[Webhook] Signature verification successful, event type:', event.type);
  } catch (err: any) {
    // If signature verification fails, check if body was reconstructed from JSON
    // This happens when Vercel parses the body before we can access it
    const isReconstructed = req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body);

    // Allow skipping signature verification in development/testing
    // Set ALLOW_UNVERIFIED_WEBHOOKS=true in Vercel environment variables for testing
    const allowUnverified = process.env.ALLOW_UNVERIFIED_WEBHOOKS === 'true';

    console.log('[Webhook] allowUnverified flag:', allowUnverified);
    console.log('[Webhook] isReconstructed:', isReconstructed);
    console.log('[Webhook] Environment variables check:', {
      ALLOW_UNVERIFIED_WEBHOOKS: process.env.ALLOW_UNVERIFIED_WEBHOOKS,
      NODE_ENV: process.env.NODE_ENV,
    });

    if (isReconstructed && allowUnverified) {
      // If body was parsed and we're allowing unverified webhooks, construct event from parsed body
      // WARNING: This skips signature verification - only use for testing!
      console.warn(
        '[Webhook] Signature verification failed (body was parsed). Constructing event from parsed body (UNVERIFIED - TESTING ONLY).'
      );
      event = {
        id: (req.body as any).id,
        object: 'event',
        api_version: (req.body as any).api_version,
        created: (req.body as any).created,
        data: (req.body as any).data,
        livemode: (req.body as any).livemode,
        pending_webhooks: (req.body as any).pending_webhooks,
        request: (req.body as any).request,
        type: (req.body as any).type,
      } as Stripe.Event;
      console.log('[Webhook] Event constructed from parsed body, type:', event.type);
    } else {
      // In production or if it's not a parsing issue, fail
      console.error('[Webhook] Signature verification failed:', err.message);
      console.error('[Webhook] Error type:', err.type);
      console.error('[Webhook] Body string length:', bodyString?.length || 0);
      if (bodyString) {
        console.error('[Webhook] Body string preview:', bodyString.substring(0, 100));
      }

      // For debugging: if webhook secret is missing, that's the issue
      if (!webhookSecret) {
        return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
      }

      return res
        .status(400)
        .json({ error: `Webhook signature verification failed: ${err.message}` });
    }
  }

  // Handle subscription events
  switch (event.type) {
    case 'checkout.session.completed':
      // Handle successful checkout completion - this fires immediately when payment succeeds
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === 'subscription' && session.subscription && session.customer) {
        try {
          // Fetch the subscription to get full details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

          const customerId =
            typeof session.customer === 'string'
              ? session.customer
              : (session.customer as Stripe.Customer).id;

          // Find user by stripe_customer_id
          const { data: checkoutUser, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single<{ id: string }>();

          if (userError) {
            console.error('[Webhook] Error finding user:', userError);
            // Try to find by customer email as fallback
            if (session.customer_email) {
              const { data: userByEmail } = await supabase
                .from('users')
                .select('id, stripe_customer_id')
                .eq('email', session.customer_email)
                .single<{ id: string; stripe_customer_id: string | null }>();

              if (userByEmail) {
                // Update customer_id if missing, then update subscription
                if (!userByEmail.stripe_customer_id) {
                  await supabase
                    .from('users')
                    // @ts-ignore
                    .update({ stripe_customer_id: customerId })
                    .eq('id', userByEmail.id);
                }

                // Update subscription details
                const { error: updateError } = await supabase
                  .from('users')
                  // @ts-ignore - Supabase types don't include billing fields yet
                  .update({
                    stripe_subscription_id: subscription.id,
                    access_status: subscription.status === 'active' ? 'active' : 'inactive',
                    payment_method: 'card',
                    current_period_end: (subscription as any).current_period_end
                      ? new Date((subscription as any).current_period_end * 1000).toISOString()
                      : null,
                  })
                  .eq('id', userByEmail.id);

                if (updateError) {
                  console.error('[Webhook] Error updating user by email:', updateError);
                }
              }
            }
          } else if (checkoutUser) {
            // Update subscription details
            const { error: updateError } = await supabase
              .from('users')
              // @ts-ignore - Supabase types don't include billing fields yet
              .update({
                stripe_subscription_id: subscription.id,
                access_status: subscription.status === 'active' ? 'active' : 'inactive',
                payment_method: 'card',
                subscription_start_date: subscription.created
                  ? new Date(subscription.created * 1000).toISOString()
                  : null,
                current_period_end: (subscription as any).current_period_end
                  ? new Date((subscription as any).current_period_end * 1000).toISOString()
                  : null,
              })
              .eq('id', checkoutUser.id);

            if (updateError) {
              console.error('[Webhook] Error updating user:', updateError);
            }
          }
        } catch (error: any) {
          console.error('[Webhook] Error processing checkout.session.completed:', error);
        }
      }
      break;

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
            subscription_start_date: subscription.created
              ? new Date(subscription.created * 1000).toISOString()
              : null,
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
              subscription_start_date: invoice.created
                ? new Date(invoice.created * 1000).toISOString()
                : null,
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
