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
  // Also try parsing from URL path as fallback
  let routePath = '';

  if (req.query.route) {
    const route = req.query.route;
    routePath = Array.isArray(route) ? route.join('/') : String(route);
  } else if (req.url) {
    // Fallback: parse from URL path
    // URL will be like /api/billing/webhook or /api/billing/subscription
    const match = req.url.match(/\/api\/billing\/(.+)/);
    if (match) {
      routePath = match[1].split('?')[0]; // Remove query string if present
    }
  }

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
    case 'create-portal-session':
      return handleCreatePortalSession(req, res);
    case 'prices':
      return handlePrices(req, res);
    default:
      setCorsHeaders(res);
      return res.status(404).json({ error: 'Route not found', route: routePath });
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
    // Note: account_lifecycle_status may not exist in all databases, so we'll query it separately if needed
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(
        'email, stripe_customer_id, stripe_subscription_id, payment_status, payment_method, current_period_end, subscription_start_date, subscription_tier'
      )
      .eq('id', auth.userId)
      .single<{
        email: string | null;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
        payment_status: string | null;
        payment_method: string | null;
        current_period_end: string | null;
        subscription_start_date: string | null;
        subscription_tier: string | null;
      }>();

    // Try to get account_lifecycle_status separately if the column exists
    let accountLifecycleStatus: 'active' | 'cancelled' | 'deleted' | null = null;
    if (user && !userError) {
      try {
        const { data: accountData } = await supabase
          .from('users')
          .select('account_lifecycle_status')
          .eq('id', auth.userId)
          .single<{ account_lifecycle_status: string | null }>();
        accountLifecycleStatus =
          (accountData?.account_lifecycle_status as 'active' | 'cancelled' | 'deleted' | null) ||
          null;
      } catch (e) {
        // Column doesn't exist, that's okay - accountLifecycleStatus will remain null
      }
    }

    if (!user) {
      return res.json({
        accessStatus: 'inactive',
        paymentMethod: null,
      });
    }

    // If no payment status, return inactive
    if (!user.payment_status || user.payment_status === 'inactive') {
      return res.json({
        accessStatus: 'inactive',
        paymentMethod: null,
      });
    }

    // Determine payment type based on subscription_id
    let cardLast4: string | undefined;
    let cardBrand: string | undefined;
    let subscriptionStartDate: string | undefined;
    let currentPeriodStart: string | undefined;
    let currentPeriodEnd: string | undefined;

    if (user.stripe_subscription_id) {
      // Card payment: Get card details and subscription info from Stripe
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);

        // Get subscription dates
        subscriptionStartDate = subscription.created
          ? new Date(subscription.created * 1000).toISOString()
          : user.subscription_start_date || undefined;
        currentPeriodStart = subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : undefined;
        currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : undefined;

        // Get card details if available
        if (subscription.default_payment_method) {
          try {
            const paymentMethod = await stripe.paymentMethods.retrieve(
              subscription.default_payment_method as string
            );

            if (paymentMethod?.type === 'card' && paymentMethod.card) {
              cardLast4 = paymentMethod.card.last4;
              cardBrand = paymentMethod.card.brand;
            }
          } catch (pmError: any) {
            // Payment method retrieval failed
          }
        }
      } catch (stripeError: any) {
        // Fallback to database values
        subscriptionStartDate = user.subscription_start_date || undefined;
        currentPeriodEnd = user.current_period_end || undefined;
      }
    } else {
      // For invoice payments, use dates from database
      subscriptionStartDate = user.subscription_start_date || undefined;
      currentPeriodEnd = user.current_period_end || undefined;
    }

    const responseData = {
      accessStatus: user.payment_status,
      paymentMethod: user.payment_method as 'card' | 'direct_debit' | null,
      nextBillingDate: currentPeriodEnd || user.current_period_end || undefined,
      subscriptionStartDate,
      currentPeriodStart,
      currentPeriodEnd,
      cardLast4,
      cardBrand,
      accountStatus: accountLifecycleStatus,
      subscriptionTier: user.subscription_tier as
        | 'starter'
        | 'pro'
        | 'business'
        | 'enterprise'
        | null,
    };

    return res.json(responseData);
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

    // Get currency and tier from request body, default to GBP and 'pro'
    const currency = (req.body?.currency as string) || 'GBP';
    const tier = (req.body?.tier as string) || 'pro'; // starter, pro, business

    // Get the appropriate price ID based on tier and currency
    // Format: STRIPE_PRICE_ID_{TIER}_{CURRENCY} (e.g., STRIPE_PRICE_ID_STARTER_GBP)
    const priceIdEnvVar = `STRIPE_PRICE_ID_${tier.toUpperCase()}_${currency}`;
    const priceId = process.env[priceIdEnvVar];

    if (!priceId) {
      return res.status(500).json({
        error: `Price ID not configured for tier ${tier} and currency ${currency}. Please set ${priceIdEnvVar}.`,
      });
    }

    // Get or create Stripe customer
    let { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, email, account_lifecycle_status')
      .eq('id', auth.userId)
      .single<{
        stripe_customer_id: string | null;
        email: string;
        account_lifecycle_status: string | null;
      }>();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent checkout if account is deleted
    if (user.account_lifecycle_status === 'deleted') {
      return res.status(403).json({
        error: 'This account has been deleted. Please contact support if you wish to reactivate.',
      });
    }

    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user?.email || auth.userEmail!,
        metadata: {
          userId: auth.userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      // If account was cancelled, reactivate it when creating checkout
      const updateData: any = { stripe_customer_id: customerId };
      if (user.account_lifecycle_status === 'cancelled') {
        updateData.account_lifecycle_status = 'active';
      }

      await supabase
        .from('users')
        // @ts-ignore - Supabase types don't include billing fields yet
        .update(updateData)
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
      .select('stripe_subscription_id, stripe_customer_id, account_lifecycle_status')
      .eq('id', auth.userId)
      .single<{
        stripe_subscription_id: string | null;
        stripe_customer_id: string | null;
        account_lifecycle_status: string | null;
      }>();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If account is already cancelled or deleted, return error
    if (user.account_lifecycle_status === 'cancelled') {
      return res.status(400).json({ error: 'Subscription is already cancelled' });
    }

    if (user.account_lifecycle_status === 'deleted') {
      return res.status(400).json({ error: 'Account is already deleted' });
    }

    // Cancel Stripe subscription if it exists
    if (user.stripe_subscription_id && stripe) {
      try {
        await stripe.subscriptions.cancel(user.stripe_subscription_id);
      } catch (stripeError: any) {
        // If subscription is already cancelled in Stripe, that's okay
        // We'll still update our database
      }
    }

    // Update database: set account_lifecycle_status to 'cancelled' and payment_status to 'canceled'
    const { error: updateError } = await supabase
      .from('users')
      // @ts-ignore - Supabase types don't include these fields yet
      .update({
        account_lifecycle_status: 'cancelled',
        payment_status: 'canceled',
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
      .select('stripe_subscription_id, stripe_customer_id, account_lifecycle_status')
      .eq('id', auth.userId)
      .single<{
        stripe_subscription_id: string | null;
        stripe_customer_id: string | null;
        account_lifecycle_status: string | null;
      }>();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If account is already deleted, return error
    if (user.account_lifecycle_status === 'deleted') {
      return res.status(400).json({ error: 'Account is already deleted' });
    }

    // Cancel Stripe subscription if it exists
    if (user.stripe_subscription_id && stripe) {
      try {
        await stripe.subscriptions.cancel(user.stripe_subscription_id);
      } catch (stripeError: any) {
        // If subscription is already cancelled, that's okay
      }
    }

    // Mark account as deleted (soft delete - keeps data but marks as deleted)
    // Note: To fully delete the auth user, you would need to use Supabase Admin API with service role key
    // For now, marking as deleted prevents access and the account_lifecycle_status can be used to filter deleted accounts
    const { error: updateError } = await supabase
      .from('users')
      // @ts-ignore - Supabase types don't include these fields yet
      .update({
        account_lifecycle_status: 'deleted',
        payment_status: 'canceled',
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

// POST /api/billing/create-portal-session
async function handleCreatePortalSession(req: VercelRequest, res: VercelResponse) {
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

    // Get user's Stripe customer ID
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', auth.userId)
      .single<{
        stripe_customer_id: string | null;
        email: string;
      }>();

    if (!user?.stripe_customer_id) {
      return res.status(400).json({
        error: 'No Stripe customer found. Please set up a payment method first.',
      });
    }

    // Normalize FRONTEND_URL to ensure no double slashes
    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, ''); // Remove trailing slash

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${frontendUrl}/billing`,
    });

    return res.json({ url: portalSession.url });
  } catch (error: any) {
    setCorsHeaders(res);
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

    // Get price IDs for all tiers and currencies
    const tiers = ['starter', 'pro', 'business'];
    const currencies = ['GBP', 'EUR', 'USD'];
    const prices: Record<
      string,
      Record<string, { amount: number; currency: string; formatted: string }>
    > = {};

    for (const tier of tiers) {
      prices[tier] = {};
      for (const currency of currencies) {
        const priceIdEnvVar = `STRIPE_PRICE_ID_${tier.toUpperCase()}_${currency}`;
        const priceId = process.env[priceIdEnvVar];

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

          prices[tier][currency] = {
            amount,
            currency: price.currency.toUpperCase(),
            formatted,
          };
        } catch (error: any) {
          // Continue with other prices - don't add to prices object if fetch fails
        }
      }
    }

    return res.json({ prices });
  } catch (error: any) {
    setCorsHeaders(res);
    return res.status(500).json({ error: error.message });
  }
}
