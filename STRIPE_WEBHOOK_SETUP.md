# Stripe Webhook Setup Guide

## Quick Setup Steps

### 1. Fix the URL Error (Local Development)

The error "Invalid URL: An explicit scheme (such as https) must be provided" means `FRONTEND_URL` is not set.

**For local development**, add to your `.env` file or Vercel environment variables:

```
FRONTEND_URL=http://localhost:5173
```

**For production**, set in Vercel:

```
FRONTEND_URL=https://your-domain.com
```

### 2. Set Up Stripe Webhook Endpoint

1. **Go to Stripe Dashboard** → **Developers** → **Webhooks**
2. **Click "Add endpoint"**
3. **Enter your webhook URL:**
   - **For production (Vercel):** `https://your-domain.vercel.app/api/billing/webhook`
   - **For local testing:** Use Stripe CLI (see below)
4. **Select events to listen to:**
   Click "+ Select events" and choose:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. **Click "Add endpoint"**
6. **Copy the webhook signing secret:**
   - Click on your newly created endpoint
   - Under "Signing secret", click "Reveal"
   - Copy the secret (starts with `whsec_...`)

### 3. Add Environment Variables to Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Add these variables:**

#### For All Environments:

```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_PRICE_ID=price_... (from your product)
FRONTEND_URL=https://your-domain.vercel.app (or http://localhost:5173 for local)
```

#### For Production Only:

```
STRIPE_WEBHOOK_SECRET=whsec_... (from webhook endpoint)
```

**Important:**

- Use `sk_test_` keys for development/preview
- Use `sk_live_` keys for production
- The webhook secret is different for test vs live mode

### 4. Create Product & Price in Stripe

1. Go to **Products** in Stripe Dashboard
2. Click **"Add product"**
3. Fill in:
   - **Name**: "MyRevuHQ Monthly Subscription"
   - **Price**: £10.00
   - **Billing period**: Monthly (recurring)
4. Click **"Save product"**
5. **Copy the Price ID** (starts with `price_...`)

### 5. Local Development Testing

For local testing, use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/billing/webhook
```

This will give you a webhook signing secret (starts with `whsec_...`) that you can use for local testing.

### 6. Required Environment Variables Summary

**Vercel Environment Variables:**

| Variable                | Description                | Example                        |
| ----------------------- | -------------------------- | ------------------------------ |
| `STRIPE_SECRET_KEY`     | Stripe secret key          | `sk_test_...` or `sk_live_...` |
| `STRIPE_PRICE_ID`       | Price ID from your product | `price_...`                    |
| `FRONTEND_URL`          | Your frontend URL          | `https://myrevuhq.vercel.app`  |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret     | `whsec_...`                    |

### 7. Test the Integration

1. **Test with Stripe test cards:**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Use any future expiry date (e.g., 12/25) and any CVC (e.g., 123)

2. **Check webhook deliveries:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click on your endpoint
   - View "Recent deliveries" to see if webhooks are being received

3. **Verify database updates:**
   - After successful payment, check your Supabase `users` table
   - Should see `access_status: 'active'`, `payment_method: 'card'`, etc.

## Troubleshooting

### Error: "Invalid URL: An explicit scheme (such as https) must be provided"

- **Fix:** Set `FRONTEND_URL` environment variable with full URL including `http://` or `https://`

### Webhooks not being received

- Check that webhook URL is correct
- Verify webhook secret is set correctly
- Check Stripe Dashboard → Webhooks → Recent deliveries for errors
- Make sure your Vercel deployment is live and accessible

### Payment succeeds but status doesn't update

- Check webhook is configured correctly
- Verify webhook secret matches
- Check Supabase database for errors
- Look at Vercel function logs for webhook handler errors
