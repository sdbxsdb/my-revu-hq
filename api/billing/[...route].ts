import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { supabase } from '../_utils/supabase';
import { authenticate } from '../_utils/auth';
import { setCorsHeaders } from '../_utils/response';
import { sendEnterpriseRequestEmail } from '../_utils/email';
import { sendSMS } from '../_utils/twilio';

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
    case 'sync-subscription':
      return handleSyncSubscription(req, res);
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
    case 'change-tier':
      return handleChangeTier(req, res);
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
        'email, stripe_customer_id, stripe_subscription_id, payment_status, payment_method, current_period_end, subscription_start_date, subscription_tier, enterprise_requested_at'
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
        enterprise_requested_at: string | null;
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
        | 'free'
        | 'starter'
        | 'pro'
        | 'business'
        | 'enterprise'
        | null,
      enterpriseRequestedAt: user.enterprise_requested_at || null,
    };

    return res.json(responseData);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/billing/sync-subscription
// Manually syncs subscription from Stripe (for local testing when webhooks don't work)
async function handleSyncSubscription(req: VercelRequest, res: VercelResponse) {
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

    // Get user data
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', auth.userId)
      .single<{
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
      }>();

    if (!user || !user.stripe_customer_id) {
      return res.status(404).json({ error: 'No Stripe customer found' });
    }

    // Get the latest subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      limit: 1,
      status: 'all',
    });

    if (subscriptions.data.length === 0) {
      return res.json({ message: 'No subscriptions found' });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price?.id || null;

    // Determine tier from price ID
    const getTierFromPriceId = (priceId: string | null): string | null => {
      if (!priceId) return null;
      const tiers = ['free', 'starter', 'pro', 'business'];
      const currencies = ['GBP', 'EUR', 'USD'];

      console.log('🔍 Looking for price ID:', priceId);

      for (const tier of tiers) {
        for (const currency of currencies) {
          const envVar = `STRIPE_PRICE_ID_${tier.toUpperCase()}_${currency}`;
          const envValue = process.env[envVar];
          console.log(`  Checking ${envVar}:`, envValue);
          if (envValue === priceId) {
            console.log(`✅ Found match! Tier: ${tier}`);
            return tier;
          }
        }
      }
      console.log('❌ No tier found for price ID');
      return null;
    };

    let tier = getTierFromPriceId(priceId);
    console.log('🎯 Final tier:', tier);

    // Fallback: If no tier found but we have the free price IDs, set to free
    if (
      !tier &&
      priceId &&
      (priceId === 'price_1SY6QVEAEfoPoTo8Y3t3vngs' || // FREE GBP
        priceId === 'price_1SY6QGEAEfoPoTo8i1IKmbGU' || // FREE EUR
        priceId === 'price_1SY6PyEAEfoPoTo8Fw5IbkRV') // FREE USD
    ) {
      console.log('🔧 Fallback: Setting tier to free for known free price ID');
      tier = 'free';
    }

    // Update database
    const updateData: any = {
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      subscription_tier: tier,
      payment_status:
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
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    };

    // Reactivate account if subscription is active
    if (subscription.status === 'active') {
      updateData.account_lifecycle_status = 'active';
    }

    await supabase
      .from('users')
      // @ts-ignore
      .update(updateData)
      .eq('id', auth.userId);

    return res.json({
      message: 'Subscription synced successfully',
      tier,
      status: subscription.status,
    });
  } catch (error: any) {
    setCorsHeaders(res);
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
    const tier = (req.body?.tier as string) || 'pro'; // free, starter, pro, business

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

    // Get frontend URL from request origin (for ngrok/tunnel support)
    let frontendUrl = '';
    const origin = req.headers.origin as string | undefined;
    const referer = req.headers.referer as string | undefined;

    if (origin) {
      // Use the origin from the request (works for ngrok, localhost, production)
      frontendUrl = origin.replace(/\/$/, '');
      console.log('🔧 Using request origin for checkout redirect:', frontendUrl);
    } else if (referer) {
      // Extract base URL from referer
      const refererUrl = new URL(referer);
      frontendUrl = `${refererUrl.protocol}//${refererUrl.host}`;
      console.log('🔧 Using referer for checkout redirect:', frontendUrl);
    } else {
      // Fallback to env var
      frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
      console.log('🔧 Using FRONTEND_URL for checkout redirect:', frontendUrl);
    }

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
      metadata: {
        userId: auth.userId,
        tier: tier,
        priceId: priceId,
      },
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

    // Get user details (including subscription tier and account creation date)
    let { data: user } = await supabase
      .from('users')
      .select(
        'stripe_customer_id, email, business_name, subscription_tier, created_at, enterprise_requested_at'
      )
      .eq('id', auth.userId)
      .single<{
        stripe_customer_id: string | null;
        email: string;
        business_name: string | null;
        subscription_tier: string | null;
        created_at: string;
        enterprise_requested_at: string | null;
      }>();

    // Check if already requested (prevent duplicate requests)
    if (user?.enterprise_requested_at) {
      return res.json({
        message: 'Enterprise request already submitted',
        alreadyRequested: true,
      });
    }

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

    // Mark enterprise as requested in database
    const now = new Date().toISOString();
    await supabase
      .from('users')
      // @ts-ignore - Supabase types don't include billing fields yet
      .update({ enterprise_requested_at: now })
      .eq('id', auth.userId);

    // Send SMS notification to admin (simpler than email, already configured)
    const adminPhone = process.env.ADMIN_PHONE_NUMBER; // e.g., +447780587666
    if (adminPhone) {
      try {
        const messageBody = `🚀 New Enterprise Request\n\nEmail: ${user?.email || auth.userEmail}\n${user?.business_name ? `Business: ${user.business_name}\n` : ''}User ID: ${auth.userId}\n${customerId ? `Stripe: ${customerId}` : ''}`;
        await sendSMS(adminPhone, messageBody, 'GB'); // Default to GB for admin
        console.log(`[Billing] Enterprise request SMS sent to ${adminPhone}`);
      } catch (smsError) {
        console.error('[Billing] Failed to send enterprise request SMS:', smsError);
      }
    }

    // Also try email notification (fallback)
    try {
      await sendEnterpriseRequestEmail({
        userEmail: user?.email || auth.userEmail!,
        userId: auth.userId,
        businessName: user?.business_name || null,
        stripeCustomerId: customerId,
        accountCreatedAt: user?.created_at,
        currentTier: user?.subscription_tier || null,
      });
    } catch (emailError) {
      // Log error but don't fail the request
      console.error('[Billing] Failed to send enterprise request email:', emailError);
    }

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
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', auth.userId)
      .single();

    const user = userData as {
      stripe_customer_id: string | null;
      email: string;
    } | null;

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
    // TEMPORARY: Include 'free' tier in all environments for testing (remove before final launch)
    const tiers = ['free', 'starter', 'pro', 'business'];
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

// POST /api/billing/change-tier
async function handleChangeTier(req: VercelRequest, res: VercelResponse) {
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

    const { tier, currency } = req.body as { tier: string; currency?: string };

    if (!tier || !['starter', 'pro', 'business'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier. Must be starter, pro, or business.' });
    }

    // Get user's current subscription
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id, stripe_price_id')
      .eq('id', auth.userId)
      .single();

    const user = userData as {
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      stripe_price_id: string | null;
    } | null;

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripe_subscription_id) {
      return res.status(400).json({
        error: 'No active subscription found. Please create a subscription first.',
      });
    }

    // Determine currency - use provided currency or detect from current subscription
    let targetCurrency = currency;
    if (!targetCurrency) {
      // Try to get currency from current price ID
      if (user.stripe_price_id) {
        const currentPrice = await stripe.prices.retrieve(user.stripe_price_id);
        targetCurrency = currentPrice.currency.toUpperCase();
      } else {
        // Fallback to GBP
        targetCurrency = 'GBP';
      }
    }

    // Get the new price ID
    const priceIdEnvVar = `STRIPE_PRICE_ID_${tier.toUpperCase()}_${targetCurrency}`;
    const newPriceId = process.env[priceIdEnvVar];

    if (!newPriceId) {
      return res.status(500).json({
        error: `Price ID not configured for tier ${tier} and currency ${targetCurrency}. Please set ${priceIdEnvVar}.`,
      });
    }

    // Check if user is already on this tier
    if (user.stripe_price_id === newPriceId) {
      return res.status(400).json({
        error: `You are already on the ${tier} plan.`,
      });
    }

    // Retrieve the subscription
    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);

    // Update the subscription to the new price
    // Stripe will automatically handle prorating
    const updatedSubscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'always_invoice', // Prorate and invoice immediately
    });

    return res.json({
      success: true,
      message: `Successfully changed to ${tier} plan`,
      subscriptionId: updatedSubscription.id,
      // The webhook will update the tier in the database automatically
    });
  } catch (error: any) {
    setCorsHeaders(res);
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: error.message || 'Failed to change tier' });
  }
}
