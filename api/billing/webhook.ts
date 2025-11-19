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

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  if (!webhookSecret) {
    return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
  }

  // Get raw body for webhook signature verification
  // Vercel automatically parses JSON, so we need to get the raw body
  // The rawBody property should be available in Vercel serverless functions
  let bodyString: string;

  // Log what we have for debugging
  console.log('[Webhook] Body type:', typeof req.body);
  console.log('[Webhook] Body is Buffer:', Buffer.isBuffer(req.body));
  console.log('[Webhook] Has rawBody property:', typeof (req as any).rawBody !== 'undefined');
  if (typeof (req as any).rawBody !== 'undefined') {
    console.log('[Webhook] rawBody type:', typeof (req as any).rawBody);
    console.log('[Webhook] rawBody is Buffer:', Buffer.isBuffer((req as any).rawBody));
  }

  // Method 1: Check if rawBody is available (Vercel-specific property)
  if (typeof (req as any).rawBody !== 'undefined') {
    if (Buffer.isBuffer((req as any).rawBody)) {
      bodyString = (req as any).rawBody.toString('utf8');
      console.log('[Webhook] Using rawBody (Buffer)');
    } else if (typeof (req as any).rawBody === 'string') {
      bodyString = (req as any).rawBody;
      console.log('[Webhook] Using rawBody (string)');
    } else {
      // Fallback: try to stringify if it's an object
      console.warn(
        '[Webhook] rawBody is an object, stringifying (may fail signature verification)'
      );
      bodyString = JSON.stringify((req as any).rawBody);
    }
  }
  // Method 2: Check if body is a Buffer (raw body)
  else if (Buffer.isBuffer(req.body)) {
    bodyString = req.body.toString('utf8');
    console.log('[Webhook] Using req.body (Buffer)');
  }
  // Method 3: Check if body is a string (raw body as string)
  else if (typeof req.body === 'string') {
    bodyString = req.body;
    console.log('[Webhook] Using req.body (string)');
  }
  // Method 4: Last resort - reconstruct from parsed JSON (will likely fail signature verification)
  else if (req.body && typeof req.body === 'object') {
    console.warn(
      '[Webhook] Body was parsed as JSON - reconstructing. Signature verification will likely fail.'
    );
    console.warn('[Webhook] This usually means Vercel parsed the body before we could access it.');
    bodyString = JSON.stringify(req.body);
  } else {
    console.error('[Webhook] Unable to get raw request body');
    return res.status(400).json({ error: 'Invalid request body format' });
  }

  console.log('[Webhook] Body string length:', bodyString.length);
  console.log('[Webhook] Body string preview:', bodyString.substring(0, 100));

  let event: Stripe.Event;

  try {
    // Use the raw body string for signature verification
    event = stripe.webhooks.constructEvent(bodyString, sig, webhookSecret);
  } catch (err: any) {
    // If signature verification fails, log details for debugging
    console.error('[Webhook] Signature verification failed:', err.message);
    console.error('[Webhook] Error type:', err.type);
    console.error('[Webhook] Body type:', typeof req.body);
    console.error('[Webhook] Body is Buffer:', Buffer.isBuffer(req.body));
    console.error('[Webhook] Body length:', body?.length);
    console.error('[Webhook] Has rawBody:', typeof (req as any).rawBody !== 'undefined');

    // For debugging: if webhook secret is missing, that's the issue
    if (!webhookSecret) {
      return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
    }

    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
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
