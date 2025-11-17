# Deployment Checklist - Multi-Currency Setup

## After Adding Environment Variables

### 1. Redeploy Your Application

**Option A: Automatic (via Git)**

- If you have auto-deploy enabled, just push to your main branch:
  ```bash
  git add .
  git commit -m "Add multi-currency support"
  git push
  ```

**Option B: Manual Redeploy**

- Go to Vercel Dashboard → Your Project
- Click "Deployments" tab
- Click "..." on the latest deployment
- Select "Redeploy"
- Or trigger a new deployment by making a small change

### 2. Verify Environment Variables Are Active

After redeploying, check that the new environment variables are being used:

1. Go to Vercel → Your Project → Functions → Logs
2. Visit your billing page
3. Look for logs like:
   ```
   [Prices API] Price ID configuration: { GBP: '✅ Set', EUR: '✅ Set', USD: '✅ Set' }
   ```

### 3. Test Currency Detection

1. Visit your production billing page
2. Open browser console (F12)
3. You should see:
   ```
   🌍 [Currency Detection] { country: "US", method: "vercel-header", ... }
   💰 [Currency Selection] { currency: "USD", ... }
   💳 [Stripe Prices] { GBP: {...}, EUR: {...}, USD: {...} }
   💵 [Price Selection] { detectedCurrency: "USD", priceAvailable: true }
   ```

### 4. Expected Results

| Your Location  | Detected Country | Currency | Price Should Show |
| -------------- | ---------------- | -------- | ----------------- |
| United States  | US               | USD      | $9.99             |
| Ireland        | IE               | EUR      | €11.99            |
| United Kingdom | GB               | GBP      | £9.99             |

### 5. Troubleshooting

**If prices still only show GBP:**

- Check Vercel logs for `[Prices API] Price ID configuration`
- Verify all three environment variables are set
- Make sure you redeployed after adding variables

**If wrong currency shows:**

- Check console logs for detected country
- Verify Stripe price IDs are correct
- Check that prices exist in Stripe for all currencies

**If $0.00 shows:**

- Check that Stripe price IDs are valid
- Verify prices exist in Stripe Dashboard
- Check server logs for errors fetching prices
