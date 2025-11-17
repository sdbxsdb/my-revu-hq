# Vercel Environment Variables Setup Guide

## Understanding Vercel Environments

Vercel has three environment types:

1. **Production** - Your live site (e.g., `www.myrevuhq.com`)
2. **Preview** - Automatic deployments from pull requests/branches
3. **Development** - Local development with `vercel dev`

## Environment Variables Strategy

### Production Environment Variables

These are used when your site is live at `www.myrevuhq.com`:

```
# Supabase (Production)
VITE_SUPABASE_URL=https://mmnabvqkstkjlkxfksbp.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_URL=https://mmnabvqkstkjlkxfksbp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Stripe (Production - use LIVE keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID=price_... (your production price ID)
STRIPE_WEBHOOK_SECRET=whsec_... (from production webhook)
FRONTEND_URL=https://www.myrevuhq.com

# Twilio (Production - optional)
TWILIO_ACCOUNT_SID=your_production_sid
TWILIO_AUTH_TOKEN=your_production_token
TWILIO_ALPHANUMERIC_SENDER_ID=myrevuhq

# API URL (leave empty in production - uses same domain)
VITE_API_URL=
```

### Preview/Development Environment Variables

These are used for preview deployments and local development:

```
# Supabase (Development/Test)
VITE_SUPABASE_URL=https://mmnabvqkstkjlkxfksbp.supabase.co
VITE_SUPABASE_ANON_KEY=your_test_anon_key (can be same as production)
SUPABASE_URL=https://mmnabvqkstkjlkxfksbp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key (can be same as production)

# Stripe (Development - use TEST keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_... (your test price ID)
STRIPE_WEBHOOK_SECRET=whsec_... (from test webhook or Stripe CLI)
FRONTEND_URL=http://localhost:5173

# Twilio (Development - optional, can use test credentials)
TWILIO_ACCOUNT_SID=your_test_sid
TWILIO_AUTH_TOKEN=your_test_token
TWILIO_ALPHANUMERIC_SENDER_ID=myrevuhq

# API URL (for local dev)
VITE_API_URL=
```

## How to Set Up in Vercel

### Step 1: Access Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** (top navigation)
3. Click **Environment Variables** (left sidebar)

### Step 2: Add Production Variables

For each variable:

1. Click **"Add New"** button
2. Enter the **Key** (e.g., `VITE_SUPABASE_URL`)
3. Enter the **Value** (your actual value)
4. **Select environments:**
   - ✅ Check **"Production"** only
   - ❌ Uncheck "Preview" and "Development"
5. Click **"Save"**

**Production-only variables:**

- `STRIPE_SECRET_KEY` (use `sk_live_...`)
- `STRIPE_WEBHOOK_SECRET` (from production webhook)
- `FRONTEND_URL` (set to `https://www.myrevuhq.com`)

### Step 3: Add Preview/Development Variables

For each variable:

1. Click **"Add New"** button
2. Enter the **Key** (same name, e.g., `VITE_SUPABASE_URL`)
3. Enter the **Value** (can be same or different from production)
4. **Select environments:**
   - ❌ Uncheck **"Production"**
   - ✅ Check **"Preview"** and **"Development"**
5. Click **"Save"**

**Preview/Development-specific variables:**

- `STRIPE_SECRET_KEY` (use `sk_test_...` for testing)
- `STRIPE_WEBHOOK_SECRET` (from test webhook or Stripe CLI)
- `FRONTEND_URL` (set to `http://localhost:5173` for dev)

### Step 4: Variables That Can Be Shared

Some variables can be the same across all environments:

**Add these for "All Environments":**

- `VITE_SUPABASE_URL` (if using same Supabase project)
- `VITE_SUPABASE_ANON_KEY` (if using same Supabase project)
- `SUPABASE_URL` (if using same Supabase project)
- `SUPABASE_SERVICE_ROLE_KEY` (if using same Supabase project)
- `TWILIO_ACCOUNT_SID` (if using same Twilio account)
- `TWILIO_AUTH_TOKEN` (if using same Twilio account)
- `TWILIO_ALPHANUMERIC_SENDER_ID` (same for all)

## Recommended Setup

### Option A: Separate Test and Production (Recommended)

**Production:**

- Stripe: Live keys (`sk_live_...`)
- Stripe: Production price ID
- Stripe: Production webhook secret
- Frontend URL: `https://www.myrevuhq.com`

**Preview/Development:**

- Stripe: Test keys (`sk_test_...`)
- Stripe: Test price ID
- Stripe: Test webhook secret (or Stripe CLI)
- Frontend URL: `http://localhost:5173`

**All Environments:**

- Supabase: Same project (can use test or production)
- Twilio: Same account (or separate test account)

### Option B: Same Keys Everywhere (Simpler, Less Secure)

Set everything for "All Environments" - easier but less secure since test keys are in production.

## Variable Checklist

### Production Only:

- [ ] `STRIPE_SECRET_KEY` = `sk_live_...`
- [ ] `STRIPE_PRICE_ID` = Production price ID
- [ ] `STRIPE_WEBHOOK_SECRET` = Production webhook secret
- [ ] `FRONTEND_URL` = `https://www.myrevuhq.com`

### Preview/Development Only:

- [ ] `STRIPE_SECRET_KEY` = `sk_test_...`
- [ ] `STRIPE_PRICE_ID` = Test price ID
- [ ] `STRIPE_WEBHOOK_SECRET` = Test webhook secret
- [ ] `FRONTEND_URL` = `http://localhost:5173`

### All Environments:

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `TWILIO_ACCOUNT_SID` (optional)
- [ ] `TWILIO_AUTH_TOKEN` (optional)
- [ ] `TWILIO_ALPHANUMERIC_SENDER_ID` (optional)
- [ ] `VITE_API_URL` = (empty string)

## Important Notes

1. **Redeploy after changes:** Environment variables are only available in new deployments
2. **Test keys in production:** Never use `sk_test_...` in production - you won't get real payments
3. **Webhook secrets:** Production and test webhooks have different secrets
4. **Frontend URL:** Must match your actual domain for Stripe redirects to work

## Quick Setup Steps

1. **Go to Vercel** → Your Project → Settings → Environment Variables
2. **For each variable:**
   - Click "Add New"
   - Enter key and value
   - Select appropriate environment(s)
   - Save
3. **Redeploy** your project (or wait for next deployment)
4. **Test** that production uses production keys and preview uses test keys

## Troubleshooting

### Still seeing dev@example.com in production?

- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set for Production
- Make sure values are not empty or placeholders
- Redeploy after adding variables

### Stripe not working in production?

- Verify `STRIPE_SECRET_KEY` is `sk_live_...` (not `sk_test_...`)
- Check `FRONTEND_URL` is set to your production domain
- Verify webhook secret matches production webhook

### Preview deployments using production keys?

- Check environment selection when adding variables
- Make sure test keys are set for Preview/Development environments
