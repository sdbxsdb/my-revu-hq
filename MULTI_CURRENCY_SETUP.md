# Multi-Currency Setup Guide

## Overview

The application now supports multi-currency pricing for GBP (£9.99), EUR (€11.99), and USD ($9.99). Currency is automatically detected from the user's browser locale and timezone.

## How It Works

### Frontend Detection

The app detects currency using:

1. Browser locale (e.g., `en-IE`, `en-US`, `en-GB`)
2. Timezone (e.g., `Europe/Dublin`, `America/New_York`)
3. Falls back to GBP if detection fails

### Stripe Integration

- Each currency requires a separate Stripe Price ID
- The API selects the correct price ID based on the currency sent from the frontend
- Stripe handles currency conversion and payment processing

## Stripe Setup

### 1. Create Products and Prices in Stripe

For each currency, create a recurring price:

#### GBP (United Kingdom)

1. Go to Stripe Dashboard → Products
2. Create/select your product: "MyRevuHQ Monthly Subscription"
3. Add a recurring price:
   - Amount: **£9.99**
   - Billing period: **Monthly**
   - Currency: **GBP**
4. Copy the Price ID (starts with `price_...`)

#### EUR (Ireland)

1. Add another price to the same product:
   - Amount: **€11.99** (or your EUR equivalent)
   - Billing period: **Monthly**
   - Currency: **EUR**
2. Copy the Price ID

#### USD (United States)

1. Add another price to the same product:
   - Amount: **$9.99**
   - Billing period: **Monthly**
   - Currency: **USD**
2. Copy the Price ID

### 2. Set Environment Variables

In Vercel (or your deployment platform), add these environment variables:

```bash
# Default/fallback price ID (GBP)
STRIPE_PRICE_ID=price_xxxxxxxxxxxxx

# Currency-specific price IDs
STRIPE_PRICE_ID_GBP=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_EUR=price_yyyyyyyyyyyyy
STRIPE_PRICE_ID_USD=price_zzzzzzzzzzzzz
```

**Note:** `STRIPE_PRICE_ID` is used as a fallback if a currency-specific price ID is not found.

### 3. Local Development

Add to your `.env` file (or `apps/frontend/.env`):

```bash
STRIPE_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_GBP=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_EUR=price_yyyyyyyyyyyyy
STRIPE_PRICE_ID_USD=price_zzzzzzzzzzzzz
```

## Currency Detection

The app detects currency in this order:

1. **Browser Locale**: Checks for country code in locale string
   - `en-IE` → EUR
   - `en-US` → USD
   - `en-GB` → GBP

2. **Timezone**: Falls back to timezone detection
   - `Europe/Dublin` → EUR
   - `America/*` or `US/*` → USD
   - `Europe/London` or `GB` → GBP

3. **Default**: Falls back to GBP if detection fails

## Price Display

Prices are automatically formatted with the correct currency symbol:

- GBP: `£9.99`
- EUR: `€11.99`
- USD: `$9.99`

## Testing

### Test Currency Detection

1. **GBP**: Set browser locale to `en-GB` or timezone to `Europe/London`
2. **EUR**: Set browser locale to `en-IE` or timezone to `Europe/Dublin`
3. **USD**: Set browser locale to `en-US` or timezone to `America/New_York`

### Test Stripe Checkout

1. Visit the billing page
2. Click "Subscribe with Card"
3. Verify the checkout shows the correct currency and price
4. Complete a test payment (use Stripe test cards)

## Currency Prices

Current pricing:

- **GBP**: £9.99/month
- **EUR**: €11.99/month (adjust as needed)
- **USD**: $9.99/month

To update prices, edit `apps/frontend/src/lib/currency.ts`:

```typescript
const CURRENCY_MAP: Record<Country, CurrencyInfo> = {
  GB: {
    currency: 'GBP',
    country: 'GB',
    symbol: '£',
    price: 9.99, // Update here
  },
  IE: {
    currency: 'EUR',
    country: 'IE',
    symbol: '€',
    price: 11.99, // Update here
  },
  US: {
    currency: 'USD',
    country: 'US',
    symbol: '$',
    price: 9.99, // Update here
  },
};
```

**Important**: After updating prices in code, you must also update the corresponding Stripe Price IDs or create new ones.

## Troubleshooting

### Wrong Currency Detected

- Check browser locale settings
- Verify timezone detection
- Manually override by editing `detectCurrency()` function

### Stripe Price ID Not Found

- Verify environment variables are set correctly
- Check that price IDs match the currency
- Ensure `STRIPE_PRICE_ID` is set as fallback

### Price Mismatch

- Ensure Stripe price amounts match the prices in `currency.ts`
- Verify the correct price ID is being used for each currency
