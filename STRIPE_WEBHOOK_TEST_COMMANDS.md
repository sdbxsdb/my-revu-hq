# Stripe Webhook Test Commands

Use these commands to test all webhook events that your application handles.

## Prerequisites

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI: `stripe login`
3. Make sure you're in test mode: Check the toggle in Stripe Dashboard

## Test All Webhook Events

### 1. Test Checkout Session Completed (Subscription)

This fires when a user completes checkout for a subscription.

```bash
stripe trigger checkout.session.completed --override checkout_session:mode=subscription
```

**What it tests:**

- User subscription creation
- Database update with `stripe_subscription_id`
- `access_status` set to `active`
- `current_period_end` set

---

### 2. Test Customer Subscription Created

This fires when a subscription is created.

```bash
stripe trigger customer.subscription.created
```

**What it tests:**

- Subscription creation
- Database update with subscription details
- `access_status` update

---

### 3. Test Customer Subscription Updated

This fires when a subscription is updated (e.g., plan change, renewal).

```bash
stripe trigger customer.subscription.updated
```

**What it tests:**

- Subscription updates
- Database update with new subscription details
- `current_period_end` update

---

### 4. Test Customer Subscription Deleted

This fires when a subscription is cancelled.

```bash
stripe trigger customer.subscription.deleted
```

**What it tests:**

- Subscription cancellation
- Database update: `access_status` set to `canceled`
- `current_period_end` cleared

---

### 5. Test Invoice Payment Succeeded

This fires when an invoice payment succeeds.

```bash
stripe trigger invoice.payment_succeeded
```

**What it tests:**

- Invoice payment processing
- For subscription invoices: Updates `access_status` and `current_period_end`
- For standalone invoices: Updates `access_status` to `active`

**Note:** This will create a subscription invoice by default. To test a standalone invoice (no subscription), you'll need to create one manually in Stripe Dashboard.

---

### 6. Test Invoice Payment Failed

This fires when an invoice payment fails.

```bash
stripe trigger invoice.payment_failed
```

**What it tests:**

- Payment failure handling
- Database update: `access_status` set to `past_due` (for non-subscription invoices)

---

## Test All Events at Once

Run all events in sequence:

```bash
echo "Testing all webhook events..."
stripe trigger checkout.session.completed --override checkout_session:mode=subscription
sleep 2
stripe trigger customer.subscription.created
sleep 2
stripe trigger customer.subscription.updated
sleep 2
stripe trigger invoice.payment_succeeded
sleep 2
stripe trigger invoice.payment_failed
sleep 2
stripe trigger customer.subscription.deleted
echo "All tests complete!"
```

## Monitor Webhook Delivery

While testing, you can monitor webhook delivery in real-time:

1. **Stripe Dashboard:**
   - Go to: Developers → Webhooks → Your endpoint
   - Click on "Event deliveries" tab
   - You'll see all webhook attempts in real-time

2. **Vercel Logs:**
   - Go to: Vercel Dashboard → Your Project → Functions → `api/billing/webhook`
   - View logs to see processing details

## Verify Database Updates

After each test, check your Supabase database:

```sql
-- Check user subscription status
SELECT
  id,
  email,
  stripe_customer_id,
  stripe_subscription_id,
  access_status,
  current_period_end,
  payment_method
FROM users
WHERE stripe_customer_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

## Common Issues

### Webhook returns 400/500

- Check Vercel logs for error details
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly in Vercel
- Make sure you're using the correct webhook secret for test mode

### Signature verification fails

- This usually means the raw body wasn't received correctly
- Check Vercel logs for `[Webhook]` messages
- If `ALLOW_UNVERIFIED_WEBHOOKS=true` is set, it will still process (testing only)

### Database not updating

- Check Vercel logs for database errors
- Verify the `stripe_customer_id` in the webhook matches a user in your database
- Check Supabase RLS policies allow updates

## Production Testing

**⚠️ IMPORTANT:** These commands use Stripe's test mode. For production testing:

1. Switch to **Live Mode** in Stripe Dashboard
2. Use real webhook events from actual customer transactions
3. Test in a staging environment first if possible
4. Monitor webhook delivery carefully

## Next Steps

After testing all events:

1. ✅ Verify all events are processed correctly
2. ✅ Check database updates are accurate
3. ✅ Test with real checkout flow on your site
4. ✅ Monitor webhook delivery in production
