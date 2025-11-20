# Stripe Tiered Pricing Setup Guide

This guide explains how to set up tiered pricing in Stripe for MyRevuHQ.

## Pricing Tiers

| Tier           | Price (GBP) | SMS Limit     | Price (EUR) | Price (USD) |
| -------------- | ----------- | ------------- | ----------- | ----------- |
| **Starter**    | £4.99       | 20 SMS/month  | €5.99       | $5.99       |
| **Pro**        | £9.99       | 50 SMS/month  | €11.99      | $11.99      |
| **Business**   | £19.99      | 100 SMS/month | €23.99      | $23.99      |
| **Enterprise** | Custom      | Custom        | Custom      | Custom      |

## Step 1: Create Products in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Products**
2. Create a product for each tier:

### Starter Product

- **Name**: `MyRevuHQ Starter`
- **Description**: `Starter plan - 20 SMS messages per month`

### Pro Product

- **Name**: `MyRevuHQ Pro`
- **Description**: `Pro plan - 50 SMS messages per month`

### Business Product

- **Name**: `MyRevuHQ Business`
- **Description**: `Business plan - 100 SMS messages per month`

## Step 2: Create Prices for Each Tier and Currency

For each product, create **3 prices** (one for each currency: GBP, EUR, USD):

### Starter Prices

1. **GBP Price**:
   - Amount: `£4.99` (499 pence)
   - Billing period: `Monthly`
   - Currency: `GBP`
   - Copy the **Price ID** (starts with `price_...`)

2. **EUR Price**:
   - Amount: `€5.99` (599 cents)
   - Billing period: `Monthly`
   - Currency: `EUR`
   - Copy the **Price ID**

3. **USD Price**:
   - Amount: `$5.99` (599 cents)
   - Billing period: `Monthly`
   - Currency: `USD`
   - Copy the \*\*Price ID`

### Pro Prices

1. **GBP Price**: `£9.99` (999 pence) - Monthly
2. **EUR Price**: `€11.99` (1199 cents) - Monthly
3. **USD Price**: `$11.99` (1199 cents) - Monthly

### Business Prices

1. **GBP Price**: `£19.99` (1999 pence) - Monthly
2. **EUR Price**: `€23.99` (2399 cents) - Monthly
3. **USD Price**: `$23.99` (2399 cents) - Monthly

## Step 3: Set Environment Variables in Vercel

Add the following environment variables to your Vercel project:

### Starter Tier

```
STRIPE_PRICE_ID_STARTER_GBP=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_STARTER_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_STARTER_USD=price_xxxxxxxxxxxxx
```

### Pro Tier

```
STRIPE_PRICE_ID_PRO_GBP=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PRO_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PRO_USD=price_xxxxxxxxxxxxx
```

### Business Tier

```
STRIPE_PRICE_ID_BUSINESS_GBP=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_BUSINESS_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_BUSINESS_USD=price_xxxxxxxxxxxxx
```

## Step 4: Verify Setup

1. **Test in Development**:
   - Start your local dev server
   - Navigate to `/billing`
   - You should see three pricing cards (Starter, Pro, Business)
   - Click "Choose Plan" on any tier
   - Verify it redirects to Stripe Checkout with the correct price

2. **Test in Production**:
   - Deploy to Vercel
   - Test the checkout flow end-to-end
   - Verify webhooks are working correctly

## Important Notes

- **Price IDs are unique**: Each price ID is specific to a tier and currency combination
- **Don't delete old prices**: If you need to change pricing, create new prices and update environment variables
- **Test mode vs Live mode**: Make sure you're using the correct Stripe API keys (test vs live) for your environment
- **Webhook events**: The existing webhook handler (`api/billing/webhook.ts`) will work with all tiers - no changes needed

## Troubleshooting

### "Price ID not configured" error

- Check that all environment variables are set in Vercel
- Verify the price IDs are correct (they should start with `price_`)
- Make sure you're using the correct Stripe mode (test vs live)

### Wrong price showing in checkout

- Verify the price ID matches the tier and currency selected
- Check that the price amount in Stripe matches the expected amount
- Clear browser cache and try again

### Currency not available

- If a currency is not configured, that pricing option will not appear
- Make sure all three currencies (GBP, EUR, USD) have prices created for each tier

## Next Steps

1. ✅ Create products in Stripe
2. ✅ Create prices for each tier and currency
3. ✅ Add environment variables to Vercel
4. ✅ Test checkout flow
5. ✅ Deploy to production

## Support

If you encounter any issues, check:

- Stripe Dashboard → Products → Verify all prices are created
- Vercel Dashboard → Settings → Environment Variables → Verify all variables are set
- Application logs for any error messages
