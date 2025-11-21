# Quick Setup: Tiered Pricing for Multiple Currencies

You already have currency detection working! You just need to add tiered prices to Stripe and environment variables to Vercel.

## What You Already Have ✅

- ✅ Currency detection (GBP, EUR, USD)
- ✅ Code that handles tiered pricing
- ✅ Code that looks up prices by tier and currency

## What You Need to Do

### Step 1: Create Tiered Prices in Stripe

You currently have **3 prices** (one per currency). You need **9 prices** (3 tiers × 3 currencies).

#### In Stripe Dashboard → Products:

**For each tier (Starter, Pro, Business), create 3 prices:**

1. **Starter Tier:**
   - GBP: £4.99/month → Copy Price ID
   - EUR: €5.99/month → Copy Price ID
   - USD: $5.99/month → Copy Price ID

2. **Pro Tier:**
   - GBP: £9.99/month → Copy Price ID
   - EUR: €11.99/month → Copy Price ID
   - USD: $11.99/month → Copy Price ID

3. **Business Tier:**
   - GBP: £19.99/month → Copy Price ID
   - EUR: €23.99/month → Copy Price ID
   - USD: $23.99/month → Copy Price ID

**Total: 9 Price IDs** (you'll have these in a list)

### Step 2: Add Environment Variables to Vercel

Go to **Vercel** → Your Project → **Settings** → **Environment Variables**

Add these **9 variables** (replace `price_xxxxx` with your actual Price IDs):

```
STRIPE_PRICE_ID_STARTER_GBP=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_STARTER_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_STARTER_USD=price_xxxxxxxxxxxxx

STRIPE_PRICE_ID_PRO_GBP=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PRO_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PRO_USD=price_xxxxxxxxxxxxx

STRIPE_PRICE_ID_BUSINESS_GBP=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_BUSINESS_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_BUSINESS_USD=price_xxxxxxxxxxxxx
```

**Important:**

- Add to **Production**, **Preview**, and **Development**
- **Redeploy** after adding variables

### Step 3: That's It! 🎉

The code already:

- ✅ Detects user's country/currency automatically
- ✅ Shows prices in the correct currency
- ✅ Uses the correct Stripe price ID when user clicks "Choose Plan"
- ✅ Format: `STRIPE_PRICE_ID_{TIER}_{CURRENCY}`

## How It Works

1. User visits billing page → Currency auto-detected (GBP/EUR/USD)
2. User selects a tier (Starter/Pro/Business) → Clicks "Choose Plan"
3. Code looks up: `STRIPE_PRICE_ID_{tier}_{currency}` from environment variables
4. Creates Stripe checkout with the correct price ID
5. User completes payment → Done!

## Quick Checklist

- [ ] Created 9 prices in Stripe (3 tiers × 3 currencies)
- [ ] Copied all 9 Price IDs
- [ ] Added 9 environment variables to Vercel
- [ ] Set for Production, Preview, and Development
- [ ] Redeployed application
- [ ] Tested checkout flow

That's all you need! The rest is already working. 🚀
