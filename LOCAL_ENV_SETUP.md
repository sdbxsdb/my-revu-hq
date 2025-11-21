# Setting Up Local Environment Variables

The new tiered pricing environment variables are set in Vercel but need to be available locally for development.

## Option 1: Use Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):

   ```bash
   npm i -g vercel
   # or
   yarn global add vercel
   ```

2. **Pull environment variables from Vercel**:

   ```bash
   vercel env pull .env.local
   ```

   This will create/update `.env.local` with all environment variables from your Vercel project.

3. **Restart your dev server** to load the new variables.

## Option 2: Manual Setup

If you can't use Vercel CLI, manually add these to your `.env.local` file in the project root:

```env
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

Replace `price_xxxxxxxxxxxxx` with your actual Price IDs from Stripe.

## Option 3: Use Vercel Dev

Run your dev server through Vercel, which automatically pulls env vars:

```bash
vercel dev
```

This will start a local server that has access to all Vercel environment variables.

## Verify It's Working

After setting up, check the browser console when visiting `/billing`:

- You should see `[Billing] Received prices from Stripe:` with actual price data
- Changing currency should show different amounts (not just different symbols)
- Server logs should show `[Prices API] Successfully fetched` for each tier/currency

## Troubleshooting

If prices are still empty:

1. Check `.env.local` exists and has the variables
2. Restart your dev server completely
3. Check server logs for `[Prices API]` messages
4. Verify Price IDs in Vercel match what's in Stripe
