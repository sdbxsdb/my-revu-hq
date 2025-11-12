# Billing & Payment Setup Guide

## Overview

The billing system supports two payment methods:

1. **Monthly Card Subscription** (£10/month) - Automated via Stripe
2. **Invoice/Direct Debit** - Manual setup for larger companies

## Important: Card Details Display

**We do NOT store full card details on our servers** - Stripe handles all sensitive payment data securely and is PCI compliant.

However, **Stripe's API does return safe-to-display payment method information** that we can show to users:

- `last4`: Last 4 digits of the card (e.g., "4242")
- `brand`: Card brand (e.g., "visa", "mastercard", "amex")
- `exp_month` and `exp_year`: Expiry date

These details come from Stripe's `PaymentMethod` object when you retrieve it via:

```typescript
const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
// paymentMethod.card.last4
// paymentMethod.card.brand
```

This is safe to display and is how most SaaS applications show card information to users.

## Security Best Practices

✅ **Never store card details** - Use Stripe's secure tokenization
✅ **Use Stripe Elements** - Stripe's pre-built secure card input components
✅ **PCI Compliance** - Stripe handles all PCI requirements
✅ **Server-side validation** - All payment operations happen on the backend

## Recommended: Stripe Integration

### Why Stripe?

- Industry standard for payment processing
- Handles PCI compliance automatically
- Supports subscriptions, invoices, and direct debits
- Excellent developer experience
- Strong security and fraud protection
- Supports UK direct debits via Stripe Billing

### Setup Steps

#### 1. Install Stripe Backend Package

```bash
cd apps/backend
yarn add stripe
```

#### 2. Environment Variables

Add to `apps/backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_... # Get from Stripe Dashboard
STRIPE_PUBLISHABLE_KEY=pk_test_... # For frontend (optional if using Checkout)
STRIPE_WEBHOOK_SECRET=whsec_... # For webhook verification
STRIPE_PRICE_ID=price_... # Create a price in Stripe Dashboard for £10/month
```

#### 3. Create Stripe Price

In Stripe Dashboard:

1. Go to Products → Create Product
2. Name: "Rate My Work Monthly Subscription"
3. Pricing: £10.00/month, recurring
4. Copy the Price ID (starts with `price_`)

#### 4. Backend Routes to Create

Create `apps/backend/src/routes/billing.ts`:

```typescript
import { Router } from 'express';
import Stripe from 'stripe';
import { authenticate, AuthRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Get subscription status
router.get('/subscription', authenticate, async (req: AuthRequest, res) => {
  try {
    // Get user's Stripe customer ID from database
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', req.userId!)
      .single();

    if (!user?.stripe_customer_id) {
      return res.json({
        status: 'inactive',
        paymentMethod: null,
      });
    }

    // Get subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      limit: 1,
    });

    const subscription = subscriptions.data[0];

    if (!subscription) {
      return res.json({
        status: 'inactive',
        paymentMethod: null,
      });
    }

    // Get payment method details from Stripe
    // Stripe returns safe-to-display card information (last4, brand) even though
    // we don't store full card details on our servers
    let cardLast4: string | undefined;
    let cardBrand: string | undefined;

    const paymentMethod = subscription.default_payment_method
      ? await stripe.paymentMethods.retrieve(subscription.default_payment_method as string)
      : null;

    if (paymentMethod?.type === 'card' && paymentMethod.card) {
      cardLast4 = paymentMethod.card.last4; // e.g., "4242"
      cardBrand = paymentMethod.card.brand; // e.g., "visa", "mastercard", "amex"
    }

    res.json({
      status: subscription.status,
      paymentMethod:
        paymentMethod?.type === 'card'
          ? 'card'
          : paymentMethod?.type === 'us_bank_account'
            ? 'direct_debit'
            : null,
      nextBillingDate: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : undefined,
      cardLast4, // Safe to display - from Stripe's PaymentMethod.card.last4
      cardBrand, // Safe to display - from Stripe's PaymentMethod.card.brand
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Stripe Checkout session for subscription
router.post('/create-checkout-session', authenticate, async (req: AuthRequest, res) => {
  try {
    // Get or create Stripe customer
    let { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', req.userId!)
      .single();

    let customerId = user?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user?.email || req.userEmail!,
        metadata: {
          userId: req.userId!,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', req.userId!);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/billing?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/billing?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Request invoice setup (manual process)
router.post('/request-invoice', authenticate, async (req: AuthRequest, res) => {
  try {
    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('email, business_name')
      .eq('id', req.userId!)
      .single();

    // TODO: Send email to admin/support team
    // Or create a ticket in your support system
    // Or store in a database table for manual processing

    res.json({ message: 'Invoice setup requested' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle subscription events
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      // Update subscription status in database
      const subscription = event.data.object as Stripe.Subscription;
      // Find user by Stripe customer ID and update subscription status
      break;

    case 'customer.subscription.deleted':
      // Handle cancellation
      break;

    case 'invoice.payment_succeeded':
      // Handle successful payment
      break;

    case 'invoice.payment_failed':
      // Handle failed payment
      break;
  }

  res.json({ received: true });
});

export default router;
```

#### 5. Database Migration

Add to `apps/backend/supabase/migrations/002_billing.sql`:

```sql
-- Add billing columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE;

-- Create index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
```

#### 6. Register Routes

In `apps/backend/src/index.ts`, add:

```typescript
import billingRouter from './routes/billing';
app.use('/api/billing', billingRouter);
```

#### 7. Frontend Integration

The frontend is already set up. Update `Billing.tsx` to use the API:

```typescript
// Replace the TODO comments with actual API calls
const { data: subscription } = await apiClient.getSubscription();
```

## Alternative: Manual Invoice Processing

For the invoice/direct debit option, you can:

1. **Store requests in database** - Create a `billing_requests` table
2. **Email notifications** - Send email to your team when requested
3. **Manual processing** - Your team sets up invoices manually
4. **Stripe Invoicing** - Use Stripe's invoicing feature for automated invoices

## Testing

### Stripe Test Mode

1. Use test API keys from Stripe Dashboard
2. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`

### Webhook Testing

Use Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:3001/api/billing/webhook
```

## Security Checklist

- ✅ Never store card numbers
- ✅ Use HTTPS in production
- ✅ Verify webhook signatures
- ✅ Validate all inputs server-side
- ✅ Use environment variables for secrets
- ✅ Implement rate limiting on payment endpoints
- ✅ Log payment events for audit trail

## Next Steps

1. Set up Stripe account
2. Install Stripe package
3. Create database migration
4. Implement backend routes
5. Test with Stripe test mode
6. Set up webhook endpoint
7. Update frontend to use real API calls
