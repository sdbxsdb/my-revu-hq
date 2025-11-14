# Stripe Setup Guide

## Step 1: Create Stripe Account & Get Keys

1. **Sign up for Stripe** at https://stripe.com
2. **Get your API keys** from Stripe Dashboard:
   - Go to **Developers → API keys**
   - You'll see:
     - **Publishable key** (starts with `pk_test_` or `pk_live_`)
     - **Secret key** (starts with `sk_test_` or `sk_live_`)
   - For testing, use the **Test mode** keys (they have `_test_` in them)
   - For production, use the **Live mode** keys

## Step 2: Create a Product & Price in Stripe

1. Go to **Products** in Stripe Dashboard
2. Click **"Add product"**
3. Fill in:
   - **Name**: "MyRevuHQ Monthly Subscription"
   - **Description**: "Monthly subscription for MyRevuHQ review management service"
   - **Pricing**:
     - **Price**: £10.00 (or your preferred amount)
     - **Billing period**: Monthly (recurring)
4. Click **"Save product"**
5. **Copy the Price ID** (starts with `price_...`) - you'll need this!

## Step 3: Install Stripe Package

```bash
cd apps/backend
yarn add stripe
```

## Step 4: Set Up Webhook Endpoint

### For Local Development (Testing)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3001/api/billing/webhook
   ```
4. This will give you a **webhook signing secret** (starts with `whsec_...`)

### For Production (Vercel/Backend)

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **"Add endpoint"**
3. Enter your backend URL: `https://your-backend-url.com/api/billing/webhook`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. **Copy the webhook signing secret** (starts with `whsec_...`)

## Step 5: Environment Variables

### Backend Environment Variables (Railway/Render)

Add these to your backend hosting platform (Railway/Render):

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_... # From webhook endpoint
STRIPE_PRICE_ID=price_... # From the product you created

# Optional (if you need publishable key on backend)
STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
```

**Important Notes:**

- Use `_test_` keys for testing/development
- Use `_live_` keys for production
- Never commit these keys to git!

### Frontend Environment Variables (Vercel)

Add these to Vercel dashboard:

```env
# Stripe (if needed on frontend - usually only if using Stripe Elements)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
```

**Note:** If you're using Stripe Checkout (redirect-based), you might not need the publishable key on the frontend.

## Step 6: Update Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following variables:

### For Development/Preview:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### For Production:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

4. Click **"Save"** for each environment

## Step 7: Update Backend Environment Variables

### Railway:

1. Go to your Railway project
2. Click on your backend service
3. Go to **Variables** tab
4. Add:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_ID`
   - `STRIPE_PUBLISHABLE_KEY` (optional)

### Render:

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add the same variables as above

## Step 8: Create Billing Routes

Make sure you have the billing routes file at `apps/backend/src/routes/billing.ts` (see `BILLING_SETUP.md` for the full implementation).

Then add it to `apps/backend/src/index.ts`:

```typescript
import billingRoutes from './routes/billing.js';

// ... existing code ...

app.use('/api/billing', billingRoutes);
```

## Step 9: Test the Integration

1. **Test with Stripe test cards:**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Use any future expiry date and any CVC

2. **Test webhook locally:**

   ```bash
   stripe listen --forward-to localhost:3001/api/billing/webhook
   ```

3. **Test in production:**
   - Make a test payment
   - Check Stripe Dashboard → Events to see webhook deliveries
   - Verify your database is updated correctly

## Environment Variables Summary

### Backend (Railway/Render):

- ✅ `STRIPE_SECRET_KEY` - Required
- ✅ `STRIPE_WEBHOOK_SECRET` - Required
- ✅ `STRIPE_PRICE_ID` - Required
- ⚠️ `STRIPE_PUBLISHABLE_KEY` - Optional (only if needed)

### Frontend (Vercel):

- ⚠️ `VITE_STRIPE_PUBLISHABLE_KEY` - Optional (only if using Stripe Elements, not needed for Checkout)

## Security Checklist

- ✅ Never commit API keys to git
- ✅ Use test keys for development
- ✅ Use live keys only in production
- ✅ Verify webhook signatures (handled in code)
- ✅ Use HTTPS in production
- ✅ Keep webhook secrets secure

## Next Steps

1. ✅ Create Stripe account
2. ✅ Get API keys
3. ✅ Create product & price
4. ✅ Set up webhook endpoint
5. ✅ Add environment variables to Vercel (frontend)
6. ✅ Add environment variables to Railway/Render (backend)
7. ✅ Test with test cards
8. ✅ Deploy and test in production
