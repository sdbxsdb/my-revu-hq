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

  // Get route from query parameter (Vercel catch-all routes)
  // For [...route].ts, the segments are in req.query.route as an array
  const route = (req.query.route as string[]) || [];
  const routePath = Array.isArray(route) ? route.join('/') : route;

  // Route to appropriate handler
  switch (routePath) {
    case 'subscription':
      return handleSubscription(req, res);
    case 'create-checkout-session':
      return handleCreateCheckoutSession(req, res);
    case 'cancel-subscription':
      return handleCancelSubscription(req, res);
    case 'delete-account':
      return handleDeleteAccount(req, res);
    case 'request-invoice':
      return handleRequestInvoice(req, res);
    case 'prices':
      return handlePrices(req, res);
    case 'webhook':
      return handleWebhook(req, res);
    default:
      setCorsHeaders(res);
      return res.status(404).json({ error: 'Route not found' });
  }
}

// GET /api/billing/subscription
async function handleSubscription(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    setCorsHeaders(res);
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
        'stripe_customer_id, stripe_subscription_id, access_status, payment_method, current_period_end, account_status'
      )
      .eq('id', auth.userId)
      .single<{
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
        access_status: string | null;
        payment_method: string | null;
        current_period_end: string | null;
        account_status: string | null;
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
      accountStatus: user.account_status as 'active' | 'cancelled' | 'deleted' | null,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/billing/create-checkout-session
async function handleCreateCheckoutSession(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    setCorsHeaders(res);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  setCorsHeaders(res);

  try {
    const auth = await authenticate(req as any);

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    // Get currency from request body, default to GBP
    const currency = (req.body?.currency as string) || 'GBP';

    // Get the appropriate price ID based on currency
    const priceIdEnvVar = `STRIPE_PRICE_ID_${currency}`;
    const priceId = process.env[priceIdEnvVar] || process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({
        error: `Price ID not configured for currency ${currency}. Please set ${priceIdEnvVar} or STRIPE_PRICE_ID.`,
      });
    }

    // Get or create Stripe customer
    let { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', auth.userId)
      .single<{
        stripe_customer_id: string | null;
        email: string;
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

      // Save customer ID to database
      await supabase
        .from('users')
        // @ts-ignore - Supabase types don't include billing fields yet
        .update({ stripe_customer_id: customerId })
        .eq('id', auth.userId);
    }

    // Normalize FRONTEND_URL to ensure no double slashes
    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, ''); // Remove trailing slash

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/billing?success=true`,
      cancel_url: `${frontendUrl}/billing/cancel`,
    });

    return res.json({ url: session.url });
  } catch (error: any) {
    setCorsHeaders(res);
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/billing/cancel-subscription
async function handleCancelSubscription(req: VercelRequest, res: VercelResponse) {
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

// POST /api/billing/delete-account
async function handleDeleteAccount(req: VercelRequest, res: VercelResponse) {
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

    // If account is already deleted, return error
    if (user.account_status === 'deleted') {
      return res.status(400).json({ error: 'Account is already deleted' });
    }

    // Cancel Stripe subscription if it exists
    if (user.stripe_subscription_id && stripe) {
      try {
        await stripe.subscriptions.cancel(user.stripe_subscription_id);
      } catch (stripeError: any) {
        // If subscription is already cancelled, that's okay
        if (!stripeError.message?.includes('No such subscription')) {
          console.error('[Delete Account] Stripe error:', stripeError);
        }
      }
    }

    // Mark account as deleted (soft delete - keeps data but marks as deleted)
    // Note: To fully delete the auth user, you would need to use Supabase Admin API with service role key
    // For now, marking as deleted prevents access and the account_status can be used to filter deleted accounts
    const { error: updateError } = await supabase
      .from('users')
      // @ts-ignore - Supabase types don't include these fields yet
      .update({
        account_status: 'deleted',
        access_status: 'canceled',
        current_period_end: null,
      })
      .eq('id', auth.userId);

    if (updateError) {
      throw updateError;
    }

    setCorsHeaders(res);
    return res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error: any) {
    setCorsHeaders(res);
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: error.message || 'Failed to delete account' });
  }
}

// POST /api/billing/request-invoice
async function handleRequestInvoice(req: VercelRequest, res: VercelResponse) {
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

// GET /api/billing/prices
async function handlePrices(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    setCorsHeaders(res);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  setCorsHeaders(res);

  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    // Get price IDs from environment variables
    const priceIds: Record<string, string> = {
      GBP: process.env.STRIPE_PRICE_ID_GBP || process.env.STRIPE_PRICE_ID || '',
      EUR: process.env.STRIPE_PRICE_ID_EUR || '',
      USD: process.env.STRIPE_PRICE_ID_USD || '',
    };

    // Fetch prices from Stripe for all configured currencies
    const prices: Record<string, { amount: number; currency: string; formatted: string }> = {};

    for (const [currency, priceId] of Object.entries(priceIds)) {
      if (!priceId) {
        continue;
      }

      try {
        const price = await stripe.prices.retrieve(priceId);

        // Convert from cents to dollars/euros/pounds
        const amount = price.unit_amount ? price.unit_amount / 100 : 0;

        // Format price with currency symbol
        let formatted = '';
        if (currency === 'USD') {
          formatted = `$${amount.toFixed(2)}`;
        } else if (currency === 'EUR') {
          formatted = `€${amount.toFixed(2)}`;
        } else if (currency === 'GBP') {
          formatted = `£${amount.toFixed(2)}`;
        } else {
          formatted = `${amount.toFixed(2)} ${currency}`;
        }

        prices[currency] = {
          amount,
          currency: price.currency.toUpperCase(),
          formatted,
        };
      } catch (error: any) {
        // Continue with other currencies - don't add to prices object if fetch fails
      }
    }

    return res.json({ prices });
  } catch (error: any) {
    setCorsHeaders(res);
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/billing/webhook
async function handleWebhook(req: VercelRequest, res: VercelResponse) {
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
  let body: string;

  // Try multiple methods to get raw body
  if (typeof (req as any).rawBody === 'string') {
    // Vercel sometimes provides rawBody
    body = (req as any).rawBody;
  } else if (Buffer.isBuffer(req.body)) {
    body = req.body.toString('utf8');
  } else if (typeof req.body === 'string') {
    body = req.body;
  } else if (req.body && typeof req.body === 'object') {
    // Body was parsed as JSON - reconstruct it
    // IMPORTANT: This may fail signature verification if whitespace/key order differs
    // For production, consider using a middleware to capture raw body
    body = JSON.stringify(req.body);
  } else {
    console.error('[Webhook] Unable to get request body');
    return res.status(400).json({ error: 'Invalid request body format' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
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
