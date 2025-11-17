# Stripe Multi-Currency Setup - Step by Step

## Overview
You need to create 3 separate prices (one for each currency) in Stripe, then add the Price IDs to your environment variables.

## Step-by-Step Instructions

### Step 1: Go to Stripe Dashboard
1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** for testing, or **Live mode** for production

### Step 2: Create or Select Your Product
1. Navigate to **Products** in the left sidebar
2. Either:
   - **Create a new product**: Click "Add product"
   - **Use existing**: Find "MyRevuHQ Monthly Subscription" if it exists

3. If creating new:
   - **Name**: `MyRevuHQ Monthly Subscription`
   - **Description**: `Monthly subscription for MyRevuHQ review management service`
   - Click **Save product**

### Step 3: Create GBP Price (£9.99/month)
1. On your product page, click **"Add another price"** (or "Add price" if it's a new product)
2. Fill in:
   - **Price**: `9.99`
   - **Currency**: Select **GBP** (British Pounds)
   - **Billing period**: Select **Monthly**
   - **Recurring**: Make sure it's checked
3. Click **Add price**
4. **Copy the Price ID** (starts with `price_...`) - you'll need this!

### Step 4: Create EUR Price (€11.99/month)
1. Still on the same product page, click **"Add another price"**
2. Fill in:
   - **Price**: `11.99`
   - **Currency**: Select **EUR** (Euros)
   - **Billing period**: Select **Monthly**
   - **Recurring**: Make sure it's checked
3. Click **Add price**
4. **Copy the Price ID** (starts with `price_...`)

### Step 5: Create USD Price ($9.99/month)
1. Still on the same product page, click **"Add another price"**
2. Fill in:
   - **Price**: `9.99`
   - **Currency**: Select **USD** (US Dollars)
   - **Billing period**: Select **Monthly**
   - **Recurring**: Make sure it's checked
3. Click **Add price**
4. **Copy the Price ID** (starts with `price_...`)

### Step 6: Get Your Price IDs
You should now have 3 Price IDs that look like:
- GBP: `price_1Abc123XyZ...` (for £9.99/month)
- EUR: `price_1Def456AbC...` (for €11.99/month)
- USD: `price_1Ghi789DeF...` (for $9.99/month)

**Important**: Make sure you're copying the Price IDs, not Product IDs!

### Step 7: Add to Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

#### For Production:
```
STRIPE_PRICE_ID_GBP=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_EUR=price_yyyyyyyyyyyyy
STRIPE_PRICE_ID_USD=price_zzzzzzzzzzzzz
STRIPE_PRICE_ID=price_xxxxxxxxxxxxx
```

#### For Preview/Development (if using test mode):
```
STRIPE_PRICE_ID_GBP=price_test_xxxxxxxxxxxxx
STRIPE_PRICE_ID_EUR=price_test_yyyyyyyyyyyyy
STRIPE_PRICE_ID_USD=price_test_zzzzzzzzzzzzz
STRIPE_PRICE_ID=price_test_xxxxxxxxxxxxx
```

**Note**: 
- Replace `price_xxxxxxxxxxxxx` with your actual Price IDs
- `STRIPE_PRICE_ID` is a fallback (use your GBP price ID)
- Test mode Price IDs start with `price_test_...`
- Live mode Price IDs start with `price_...`

### Step 8: Redeploy
After adding environment variables, redeploy your Vercel project for changes to take effect.

## Visual Guide

Your Stripe product should look like this:

```
Product: MyRevuHQ Monthly Subscription
├── Price 1: £9.99/month (GBP) → price_xxxxx
├── Price 2: €11.99/month (EUR) → price_yyyyy
└── Price 3: $9.99/month (USD) → price_zzzzz
```

## Testing

### Test Mode
1. Use Stripe test cards (e.g., `4242 4242 4242 4242`)
2. Test with different browser locales to verify currency detection
3. Verify the correct price appears in checkout

### Live Mode
1. Make sure all 3 prices are created in **Live mode**
2. Test with real cards (small amounts)
3. Verify currency detection works correctly

## Troubleshooting

### "Price ID not configured" error
- Check that environment variables are set correctly
- Verify Price IDs are correct (not Product IDs)
- Make sure you're using the right mode (test vs live)

### Wrong currency in checkout
- Check browser locale settings
- Verify the correct Price ID is being used
- Check Stripe Dashboard to confirm price currency

### Price mismatch
- Verify Stripe price amounts match your code:
  - GBP: £9.99
  - EUR: €11.99
  - USD: $9.99
- Update `apps/frontend/src/lib/currency.ts` if you change prices

## Quick Checklist

- [ ] Created product in Stripe
- [ ] Created GBP price (£9.99/month)
- [ ] Created EUR price (€11.99/month)
- [ ] Created USD price ($9.99/month)
- [ ] Copied all 3 Price IDs
- [ ] Added environment variables to Vercel
- [ ] Set `STRIPE_PRICE_ID` as fallback
- [ ] Redeployed application
- [ ] Tested currency detection
- [ ] Tested checkout with each currency

