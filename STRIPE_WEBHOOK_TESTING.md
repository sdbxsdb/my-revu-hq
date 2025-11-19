# Testing Stripe Webhooks Locally

## Option 1: Stripe Dashboard (Easiest)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Click **"Send test webhook"** button
4. Select an event type (e.g., `checkout.session.completed`)
5. Click **"Send test webhook"**
6. Check your Vercel function logs to see if it was received

## Option 2: Stripe CLI (Best for Local Development)

### Install Stripe CLI

**macOS:**

```bash
brew install stripe/stripe-cli/stripe
```

**Windows/Linux:**
Download from: https://github.com/stripe/stripe-cli/releases

### Login to Stripe

```bash
stripe login
```

### Forward Webhooks to Local Server

```bash
# Forward webhooks to your local server
stripe listen --forward-to http://localhost:5173/api/billing/webhook

# Or forward to production (for testing production webhook)
stripe listen --forward-to https://www.myrevuhq.com/api/billing/webhook
```

This will give you a webhook signing secret (starts with `whsec_...`). Use this for local testing.

### Trigger Test Events

In another terminal, trigger test events:

```bash
# Test subscription checkout (this is what you need!)
stripe trigger checkout.session.completed --override checkout_session:mode=subscription

# OR test subscription created directly (simpler)
stripe trigger customer.subscription.created

# Test checkout.session.completed (one-time payment - won't work for subscriptions)
stripe trigger checkout.session.completed

# Test subscription updated
stripe trigger customer.subscription.updated

# Test payment succeeded
stripe trigger invoice.payment_succeeded

# Test payment failed
stripe trigger invoice.payment_failed
```

## Option 3: Use Stripe Test Mode

1. Make sure you're in **Test Mode** in Stripe Dashboard (toggle in top right)
2. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`
3. Use any future expiry date (e.g., `12/34`)
4. Use any 3-digit CVC (e.g., `123`)
5. Complete checkout - webhook will fire automatically

## Testing Checklist

- [ ] `checkout.session.completed` - Updates `access_status` to `'active'`
- [ ] `customer.subscription.created` - Sets `stripe_subscription_id`
- [ ] `customer.subscription.updated` - Updates subscription status
- [ ] `customer.subscription.deleted` - Sets `access_status` to `'canceled'`
- [ ] `invoice.payment_succeeded` - Updates for invoice payments
- [ ] `invoice.payment_failed` - Sets `access_status` to `'past_due'`

## Verify Database Updates

After triggering a webhook, check your Supabase database:

```sql
SELECT
  id,
  email,
  stripe_customer_id,
  stripe_subscription_id,
  access_status,
  payment_method,
  current_period_end
FROM users
WHERE email = 'your-test-email@example.com';
```

## Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → **Functions**
2. Click on `api/billing/webhook`
3. View **Logs** tab
4. Look for `[Webhook]` log messages

## Common Issues

**400 Bad Request:**

- Check `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
- Make sure you're using the correct webhook secret (test vs production)

**User not found:**

- Make sure `stripe_customer_id` is set in database before webhook fires
- Check if user exists with matching email

**Signature verification failed:**

- Ensure webhook secret matches Stripe Dashboard
- Check that body is not being parsed as JSON before verification
