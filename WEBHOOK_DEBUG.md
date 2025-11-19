# Stripe Webhook Debugging Guide

## Quick Checklist

### 1. Check Webhook URL in Stripe Dashboard

In Stripe Dashboard → Developers → Webhooks, verify:

- **Endpoint URL** should be: `https://www.myrevuhq.com/api/billing/webhook`
- **Status** should show as "Enabled" (not "Disabled")
- **Events** should include:
  - ✅ `checkout.session.completed`
  - ✅ `customer.subscription.created`
  - ✅ `customer.subscription.updated`
  - ✅ `customer.subscription.deleted`
  - ✅ `invoice.payment_succeeded`
  - ✅ `invoice.payment_failed`

### 2. Check Webhook Secret in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Verify `STRIPE_WEBHOOK_SECRET` is set:
   - Should start with `whsec_...`
   - Should match the secret from your Stripe webhook endpoint
   - **Important**: Test mode and Live mode have different secrets!

### 3. Check Webhook Logs in Stripe

In Stripe Dashboard → Developers → Webhooks → Click on your endpoint:

- **Recent events** tab shows all webhook attempts
- Look for events with red ❌ status
- Click on a failed event to see the error message

Common errors:

- **400 Bad Request** → Signature verification failed (wrong secret or body parsing issue)
- **404 Not Found** → Webhook URL is wrong
- **500 Internal Server Error** → Code error in webhook handler
- **Timeout** → Webhook took too long to respond

### 4. Test Webhook Endpoint Manually

You can test if the endpoint is accessible:

```bash
curl -X POST https://www.myrevuhq.com/api/billing/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"test": true}'
```

Expected response:

- If endpoint is accessible: `400` error (signature verification failed - this is expected)
- If endpoint is not accessible: `404` or connection error

### 5. Common Issues and Fixes

#### Issue: "Webhook signature verification failed"

**Causes:**

- `STRIPE_WEBHOOK_SECRET` is wrong or missing
- Using test mode secret with live mode (or vice versa)
- Body was parsed as JSON instead of raw string

**Fix:**

1. Go to Stripe Dashboard → Webhooks → Your endpoint → "Signing secret" → "Reveal"
2. Copy the secret (starts with `whsec_...`)
3. Update `STRIPE_WEBHOOK_SECRET` in Vercel
4. Redeploy your Vercel project

#### Issue: "404 Not Found"

**Causes:**

- Webhook URL is wrong
- Vercel deployment failed
- Route not configured correctly

**Fix:**

1. Verify webhook URL: `https://www.myrevuhq.com/api/billing/webhook`
2. Check Vercel deployment logs
3. Verify `api/billing/webhook.ts` exists in your repo

#### Issue: "500 Internal Server Error"

**Causes:**

- Code error in webhook handler
- Missing environment variables
- Database connection issue

**Fix:**

1. Check Vercel function logs (Vercel Dashboard → Your Project → Functions → webhook)
2. Look for error messages in the logs
3. Check that all required environment variables are set

#### Issue: Webhook receives events but doesn't update database

**Causes:**

- User not found in database
- Database update failing silently
- Wrong `stripe_customer_id` mapping

**Fix:**

1. Check Vercel function logs for error messages
2. Verify user has `stripe_customer_id` set in database
3. Check that webhook is processing the correct events

### 6. Enable Detailed Logging

The webhook code already has error logging. Check Vercel logs for:

- `[Webhook] Signature verification failed:` - Signature issue
- `[Webhook] Error finding user:` - User lookup issue
- `[Webhook] Error updating user:` - Database update issue

### 7. Test with Stripe CLI (Local Testing)

For local testing, use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/billing/webhook

# Trigger test event
stripe trigger checkout.session.completed --override checkout_session:mode=subscription
```

## Next Steps

1. **Check Stripe webhook logs** - Look for failed events and error messages
2. **Check Vercel function logs** - See what errors are happening server-side
3. **Verify environment variables** - Make sure `STRIPE_WEBHOOK_SECRET` is correct
4. **Test webhook endpoint** - Use Stripe CLI or manual curl test
