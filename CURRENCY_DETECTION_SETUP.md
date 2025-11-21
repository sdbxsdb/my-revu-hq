# Currency Detection & Multi-Currency Setup Guide

This guide explains how currency detection works and what you need to configure in Stripe and Vercel.

## How Currency Detection Works

### Automatic Detection Flow

1. **User visits billing page** → Frontend calls `/api/geo/detect-country`
2. **API detects country** using:
   - **Vercel header** (`x-vercel-ip-country`) - Primary method
   - **Cloudflare header** (`cf-ipcountry`) - Fallback
   - **IP geolocation API** (ipapi.co) - Final fallback
3. **Country mapped to currency**:
   - `GB` → `GBP` (£)
   - `IE` → `EUR` (€)
   - `US` → `USD` ($)
   - Other countries → `GBP` (default)
4. **Billing page displays** prices in the detected currency

### Supported Countries & Currencies

| Country Code | Country        | Currency | Symbol      |
| ------------ | -------------- | -------- | ----------- |
| GB           | United Kingdom | GBP      | £           |
| IE           | Ireland        | EUR      | €           |
| US           | United States  | USD      | $           |
| \*           | All others     | GBP      | £ (default) |

## What You Need to Do

### Step 1: Create Products & Prices in Stripe

You need to create **3 products** (Starter, Pro, Business) with **3 prices each** (one per currency).

#### In Stripe Dashboard:

1. Go to **Products** → **Add Product**

2. **Create Starter Product:**
   - Name: `MyRevuHQ Starter`
   - Description: `Starter plan - 20 SMS messages per month`
   - Create **3 prices**:
     - **GBP**: £4.99/month (499 pence)
     - **EUR**: €5.99/month (599 cents)
     - **USD**: $5.99/month (599 cents)
   - Copy each **Price ID** (starts with `price_...`)

3. **Create Pro Product:**
   - Name: `MyRevuHQ Pro`
   - Description: `Pro plan - 50 SMS messages per month`
   - Create **3 prices**:
     - **GBP**: £9.99/month (999 pence)
     - **EUR**: €11.99/month (1199 cents)
     - **USD**: $11.99/month (1199 cents)
   - Copy each **Price ID**

4. **Create Business Product:**
   - Name: `MyRevuHQ Business`
   - Description: `Business plan - 100 SMS messages per month`
   - Create **3 prices**:
     - **GBP**: £19.99/month (1999 pence)
     - **EUR**: €23.99/month (2399 cents)
     - **USD**: $23.99/month (2399 cents)
   - Copy each **Price ID**

**Total: 9 Price IDs** (3 tiers × 3 currencies)

### Step 2: Add Environment Variables to Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add:

#### Starter Tier

```
STRIPE_PRICE_ID_STARTER_GBP=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_STARTER_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_STARTER_USD=price_xxxxxxxxxxxxx
```

#### Pro Tier

```
STRIPE_PRICE_ID_PRO_GBP=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PRO_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PRO_USD=price_xxxxxxxxxxxxx
```

#### Business Tier

```
STRIPE_PRICE_ID_BUSINESS_GBP=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_BUSINESS_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_BUSINESS_USD=price_xxxxxxxxxxxxx
```

**Important:**

- Add these to **Production**, **Preview**, and **Development** environments
- After adding, **redeploy** your application for changes to take effect

### Step 3: Verify Currency Detection

#### Testing Locally

Currency detection uses Vercel headers, which aren't available locally. For local testing:

1. **Manual override**: The billing page allows users to manually select a currency
2. **VPN testing**: Use a VPN to test from different countries
3. **Default**: Local development defaults to GBP

#### Testing in Production

1. **From UK**: Should auto-detect GBP (£)
2. **From Ireland**: Should auto-detect EUR (€)
3. **From USA**: Should auto-detect USD ($)
4. **From other countries**: Should default to GBP (£)

### Step 4: How It Works in Code

#### Backend (`api/geo/detect-country.ts`)

- Uses Vercel's `x-vercel-ip-country` header (automatic)
- Falls back to Cloudflare or IP geolocation API
- Returns country code (GB, IE, US, etc.)

#### Frontend (`apps/frontend/src/lib/currency.ts`)

- Maps country codes to currencies:
  ```typescript
  GB → GBP (£)
  IE → EUR (€)
  US → USD ($)
  ```

#### Billing Page (`apps/frontend/src/pages/Billing.tsx`)

- Detects country on page load
- Sets default currency based on country
- Shows prices in detected currency
- User can manually switch currencies

#### API (`api/billing/[...route].ts`)

- Receives `currency` and `tier` from frontend
- Looks up price ID: `STRIPE_PRICE_ID_{TIER}_{CURRENCY}`
- Creates Stripe checkout session with correct price

## Troubleshooting

### Currency Not Detecting Correctly

**Problem**: User from US sees GBP instead of USD

**Solutions**:

1. Check Vercel deployment - geo headers only work in production
2. Verify environment variables are set correctly
3. Check browser console for errors
4. User can manually select currency using the currency buttons

### "Price ID not configured" Error

**Problem**: Error when clicking "Choose Plan"

**Solutions**:

1. Verify all 9 environment variables are set in Vercel
2. Check price IDs are correct (start with `price_`)
3. Ensure you're using the correct Stripe mode (test vs live)
4. Redeploy after adding environment variables

### Prices Not Showing

**Problem**: Prices show as "N/A" or don't load

**Solutions**:

1. Check `/api/billing/prices` endpoint is working
2. Verify Stripe API keys are set correctly
3. Check that prices exist in Stripe Dashboard
4. Verify price IDs match environment variables

## Notes

- **Vercel Geo Headers**: Only available in production deployments, not in local development
- **Currency Selection**: Users can manually override auto-detected currency
- **Default Currency**: If detection fails, defaults to GBP
- **Price Updates**: To change prices, create new prices in Stripe and update environment variables

## Quick Checklist

- [ ] Created 3 products in Stripe (Starter, Pro, Business)
- [ ] Created 9 prices in Stripe (3 tiers × 3 currencies)
- [ ] Copied all 9 Price IDs from Stripe
- [ ] Added all 9 environment variables to Vercel
- [ ] Set variables for Production, Preview, and Development
- [ ] Redeployed application after adding variables
- [ ] Tested currency detection from different countries
- [ ] Verified checkout works with each currency
