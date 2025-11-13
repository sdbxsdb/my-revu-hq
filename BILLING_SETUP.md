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

#### 3. Run Database Migration

Run the migration to add billing fields to the users table:

```bash
# If using Supabase CLI
supabase migration up

# Or run the SQL directly in Supabase Dashboard SQL Editor
# File: apps/backend/supabase/migrations/002_add_billing_fields.sql
```

This adds the following fields to the `users` table:

- `stripe_customer_id` - Links user to Stripe customer
- `stripe_subscription_id` - Tracks Stripe subscription (for card payments)
- `access_status` - User access status to our service: active (has access), inactive (no access), past_due (payment overdue), canceled (subscription canceled). This is our app's status, not Stripe's subscription status.
- `payment_method` - Payment type: card or direct_debit
- `current_period_end` - End date of current billing period

**Important: Subscription Data Source**

- **Our DB is the source of truth** - We store subscription status in our database
- **Stripe webhooks keep it in sync** - When subscriptions change in Stripe, webhooks update our DB
- **Why this approach?**
  - Fast queries (no Stripe API calls on every page load)
  - Works even if Stripe API is temporarily down
  - Provides audit trail and backup
  - Card details (last4, brand) are fetched from Stripe API when needed (not stored)

#### 4. Create Stripe Price

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
    // Get user's subscription data from our database (source of truth)
    const { data: user } = await supabase
      .from('users')
      .select(
        'stripe_customer_id, stripe_subscription_id, access_status, payment_method, current_period_end'
      )
      .eq('id', req.userId!)
      .single();

    if (!user) {
      return res.json({
        status: 'inactive',
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
    // UI Logic:
    // - If stripe_subscription_id exists → Card payment → Show card details
    // - If no subscription_id but access_status = 'active' and payment_method = 'direct_debit' → Invoice payment → Show invoice message
    // - Otherwise → No payment → Show subscription form
    let cardLast4: string | undefined;
    let cardBrand: string | undefined;

    if (user.stripe_subscription_id) {
      // Card payment: Get card details from Stripe to display
      const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
      const paymentMethod = subscription.default_payment_method
        ? await stripe.paymentMethods.retrieve(subscription.default_payment_method as string)
        : null;

      if (paymentMethod?.type === 'card' && paymentMethod.card) {
        cardLast4 = paymentMethod.card.last4; // e.g., "4242"
        cardBrand = paymentMethod.card.brand; // e.g., "visa", "mastercard", "amex"
      }
    }
    // For invoice payments (no subscription_id), we don't have card details to show

    res.json({
      accessStatus: user.access_status, // Our app's access status, not Stripe's
      paymentMethod: user.payment_method as 'card' | 'direct_debit' | null,
      nextBillingDate: user.current_period_end || undefined,
      cardLast4, // Only populated for card payments
      cardBrand, // Only populated for card payments
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
    // Get or create Stripe customer (needed for invoices)
    let { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, email, business_name')
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
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', req.userId!);
    }

    // TODO: Send email to admin/support team with customer details
    // Or create a ticket in your support system
    // Or store in a database table for manual processing
    //
    // Admin will then:
    // 1. Go to Stripe Dashboard → Customers → Find customer
    // 2. Create invoice manually OR use Stripe Billing to set up recurring invoices
    // 3. When invoice is paid, invoice.payment_succeeded webhook will update our DB

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
      // Card-based subscription: Update subscription status in database
      const subscription = event.data.object as Stripe.Subscription;
      const { data: subUser } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', subscription.customer as string)
        .single();

      if (subUser) {
        await supabase
          .from('users')
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
            payment_method: 'card', // Card subscriptions always use 'card'
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          })
          .eq('id', subUser.id);
      }
      break;

    case 'customer.subscription.deleted':
      // Card subscription canceled: Set status to canceled, keep subscription_id for history
      const deletedSub = event.data.object as Stripe.Subscription;
      const { data: deletedUser } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', deletedSub.customer as string)
        .single();

      if (deletedUser) {
        await supabase
          .from('users')
          .update({
            access_status: 'canceled',
            current_period_end: null,
          })
          .eq('id', deletedUser.id);
      }
      break;

    case 'invoice.payment_succeeded':
      // Handle successful invoice payment (for invoice-based customers)
      const invoice = event.data.object as Stripe.Invoice;
      const { data: invoiceUser } = await supabase
        .from('users')
        .select('id, stripe_subscription_id')
        .eq('stripe_customer_id', invoice.customer as string)
        .single();

      if (invoiceUser) {
        // Only update if this is an invoice payment (no subscription_id)
        // If subscription_id exists, subscription webhooks handle it
        if (!invoiceUser.stripe_subscription_id && invoice.subscription === null) {
          await supabase
            .from('users')
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
      // Handle failed invoice payment
      const failedInvoice = event.data.object as Stripe.Invoice;
      const { data: failedUser } = await supabase
        .from('users')
        .select('id, stripe_subscription_id')
        .eq('stripe_customer_id', failedInvoice.customer as string)
        .single();

      if (failedUser && !failedUser.stripe_subscription_id) {
        // For invoice-based payments, mark as past_due on failure
        await supabase
          .from('users')
          .update({
            access_status: 'past_due',
          })
          .eq('id', failedUser.id);
      }
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

## Invoice vs Card Payment: How to Distinguish

**Card Payments (Automatic Subscription):**

- User goes through Stripe Checkout → Creates subscription
- `stripe_subscription_id` is populated (NOT NULL)
- `payment_method = 'card'`
- Payments are automatic via Stripe
- Webhooks: `customer.subscription.*` events update our DB

**Invoice Payments (Manual):**

- User requests invoice setup → Creates Stripe customer (if needed)
- `stripe_subscription_id` is NULL (no subscription)
- `stripe_customer_id` is populated (customer exists in Stripe)
- `payment_method = 'direct_debit'`
- Admin manually creates invoice in Stripe Dashboard
- Webhooks: `invoice.payment_succeeded` updates our DB

**Key Logic:**

```typescript
// Check if card-based subscription
if (user.stripe_subscription_id) {
  // Card payment - automatic subscription
} else if (user.payment_method === 'direct_debit' && user.access_status === 'active') {
  // Invoice payment - manual invoicing
}
```

## Manual Invoice Processing Workflow

When a customer requests invoice setup:

1. **Customer requests invoice** → `POST /api/billing/request-invoice`
   - Creates Stripe customer (if doesn't exist)
   - Stores `stripe_customer_id` in our DB
   - Sends notification to admin team

2. **Admin creates invoice in Stripe Dashboard:**
   - Go to Stripe Dashboard → Customers → Find customer
   - Click "Create invoice" or use Stripe Billing for recurring invoices
   - Add line item: "Rate My Work Monthly Subscription - £10.00"
   - Send invoice to customer

3. **Customer pays invoice** → Stripe sends `invoice.payment_succeeded` webhook
   - Webhook handler updates our DB:
     - `access_status = 'active'` (user has access because invoice was paid)
     - `payment_method = 'direct_debit'`
     - `current_period_end = invoice.period_end`
     - `stripe_subscription_id` stays NULL

4. **For recurring invoices:**
   - Use Stripe Billing to set up recurring invoices
   - Stripe automatically creates invoices each month
   - Each payment triggers `invoice.payment_succeeded` webhook

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
