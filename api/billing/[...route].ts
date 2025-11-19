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

  // Debug logging (remove in production if needed)
  console.log('[Billing Route] URL:', req.url);
  console.log('[Billing Route] Query route:', req.query.route);
  console.log('[Billing Route] Parsed routePath:', routePath);

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
    default:
      setCorsHeaders(res);
      console.error('[Billing Route] Route not found:', routePath);
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
    console.log('[Subscription API] ===== REQUEST RECEIVED =====');
    console.log('[Subscription API] Request method:', req.method);
    console.log('[Subscription API] Request URL:', req.url);

    const auth = await authenticate(req as any);
    console.log('[Subscription API] ✅ User authenticated:', {
      userId: auth.userId,
      userEmail: auth.user?.email || 'N/A',
    });

    if (!stripe) {
      console.error('[Subscription API] Stripe not configured');
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    // Get user's subscription data from our database (source of truth)
    // Note: account_status may not exist in all databases, so we'll query it separately if needed
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(
        'email, stripe_customer_id, stripe_subscription_id, access_status, payment_method, current_period_end, subscription_start_date'
      )
      .eq('id', auth.userId)
      .single<{
        email: string | null;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
        access_status: string | null;
        payment_method: string | null;
        current_period_end: string | null;
        subscription_start_date: string | null;
      }>();

    // Try to get account_status separately if the column exists
    let accountStatus: 'active' | 'cancelled' | 'deleted' | null = null;
    if (user && !userError) {
      try {
        const { data: accountData } = await supabase
          .from('users')
          .select('account_status')
          .eq('id', auth.userId)
          .single<{ account_status: string | null }>();
        accountStatus =
          (accountData?.account_status as 'active' | 'cancelled' | 'deleted' | null) || null;
      } catch (e) {
        // Column doesn't exist, that's okay - accountStatus will remain null
        console.log('[Subscription API] account_status column does not exist, skipping');
      }
    }

    console.log('[Subscription API] ===== START SUBSCRIPTION CHECK =====');
    console.log('[Subscription API] Authenticated User ID:', auth.userId);
    console.log('[Subscription API] Database query result:', {
      user: user
        ? {
            email: user.email,
            stripe_customer_id: user.stripe_customer_id,
            stripe_subscription_id: user.stripe_subscription_id,
            access_status: user.access_status,
            payment_method: user.payment_method,
            current_period_end: user.current_period_end,
            subscription_start_date: user.subscription_start_date,
          }
        : null,
      accountStatus,
      error: userError,
      hasUser: !!user,
    });

    if (!user) {
      console.log('[Subscription API] ❌ User not found in database - returning inactive');
      console.log('[Subscription API] ===== END SUBSCRIPTION CHECK =====');
      return res.json({
        accessStatus: 'inactive',
        paymentMethod: null,
      });
    }

    console.log('[Subscription API] ✅ User found in database');
    console.log('[Subscription API] User email:', user.email);
    console.log('[Subscription API] User access_status:', user.access_status);
    console.log('[Subscription API] User payment_method:', user.payment_method);
    console.log('[Subscription API] User stripe_subscription_id:', user.stripe_subscription_id);

    // If no access status, return inactive
    if (!user.access_status || user.access_status === 'inactive') {
      console.log(
        '[Subscription API] ❌ User has inactive or missing access_status:',
        user.access_status
      );
      console.log('[Subscription API] ===== END SUBSCRIPTION CHECK =====');
      return res.json({
        accessStatus: 'inactive',
        paymentMethod: null,
      });
    }

    console.log(
      '[Subscription API] ✅ User has active access_status, proceeding to fetch Stripe data'
    );

    // Determine payment type based on subscription_id
    let cardLast4: string | undefined;
    let cardBrand: string | undefined;
    let subscriptionStartDate: string | undefined;
    let currentPeriodStart: string | undefined;
    let currentPeriodEnd: string | undefined;

    if (user.stripe_subscription_id) {
      // Card payment: Get card details and subscription info from Stripe
      console.log(
        '[Subscription API] Fetching subscription from Stripe:',
        user.stripe_subscription_id
      );
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
        console.log('[Subscription API] Stripe subscription retrieved:', {
          id: subscription.id,
          status: subscription.status,
          created: subscription.created,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          default_payment_method: subscription.default_payment_method,
        });

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

        console.log('[Subscription API] Parsed subscription dates:', {
          subscriptionStartDate,
          currentPeriodStart,
          currentPeriodEnd,
        });

        // Get card details if available
        if (subscription.default_payment_method) {
          console.log(
            '[Subscription API] Fetching payment method:',
            subscription.default_payment_method
          );
          try {
            const paymentMethod = await stripe.paymentMethods.retrieve(
              subscription.default_payment_method as string
            );
            console.log('[Subscription API] Payment method retrieved:', {
              id: paymentMethod.id,
              type: paymentMethod.type,
              card: paymentMethod.card
                ? {
                    brand: paymentMethod.card.brand,
                    last4: paymentMethod.card.last4,
                    exp_month: paymentMethod.card.exp_month,
                    exp_year: paymentMethod.card.exp_year,
                  }
                : null,
            });

            if (paymentMethod?.type === 'card' && paymentMethod.card) {
              cardLast4 = paymentMethod.card.last4;
              cardBrand = paymentMethod.card.brand;
              console.log('[Subscription API] Card details extracted:', {
                last4: cardLast4,
                brand: cardBrand,
              });
            } else {
              console.log('[Subscription API] Payment method is not a card or has no card data');
            }
          } catch (pmError: any) {
            console.error('[Subscription API] Error retrieving payment method:', {
              message: pmError.message,
              code: pmError.code,
              type: pmError.type,
            });
          }
        } else {
          console.log('[Subscription API] No default_payment_method on subscription');
        }
      } catch (stripeError: any) {
        console.error('[Subscription API] Error retrieving subscription from Stripe:', {
          message: stripeError.message,
          code: stripeError.code,
          type: stripeError.type,
          subscription_id: user.stripe_subscription_id,
        });
        // Fallback to database values
        subscriptionStartDate = user.subscription_start_date || undefined;
        currentPeriodEnd = user.current_period_end || undefined;
      }
    } else {
      // For invoice payments, use dates from database
      console.log(
        '[Subscription API] No stripe_subscription_id, using database values for invoice payment'
      );
      subscriptionStartDate = user.subscription_start_date || undefined;
      currentPeriodEnd = user.current_period_end || undefined;
    }

    // Consolidate all data for logging
    const responseData = {
      accessStatus: user.access_status,
      paymentMethod: user.payment_method as 'card' | 'direct_debit' | null,
      nextBillingDate: currentPeriodEnd || user.current_period_end || undefined,
      subscriptionStartDate,
      currentPeriodStart,
      currentPeriodEnd,
      cardLast4,
      cardBrand,
      accountStatus: accountStatus,
    };

    // Comprehensive log with all user and subscription data
    console.log('[Subscription API] ===== COMPLETE SUBSCRIPTION DATA =====');
    console.log('[Subscription API] User ID:', auth.userId);
    console.log('[Subscription API] User Email:', user.email || 'N/A');
    console.log('[Subscription API] Database User Data:', {
      stripe_customer_id: user.stripe_customer_id,
      stripe_subscription_id: user.stripe_subscription_id,
      access_status: user.access_status,
      payment_method: user.payment_method,
      current_period_end: user.current_period_end,
      account_status: user.account_status,
      subscription_start_date: user.subscription_start_date,
    });
    console.log('[Subscription API] Stripe Subscription Data:', {
      subscriptionStartDate,
      currentPeriodStart,
      currentPeriodEnd,
      cardLast4,
      cardBrand,
    });
    console.log('[Subscription API] Final Response Data:', responseData);
    console.log('[Subscription API] =======================================');

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
