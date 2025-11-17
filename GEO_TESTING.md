# Testing IP Geolocation

## How to Verify It's Working

### 1. Check Browser Console

Open your browser's developer console (F12) and look for these logs:

```
🌍 [Currency Detection] { country: "GB", method: "vercel-header", ip: "..." }
💰 [Currency Selection] { currency: "GBP", country: "GB" }
💳 [Stripe Prices] { GBP: { amount: 9.99, currency: "GBP", formatted: "£9.99" } }
💵 [Price Selection] { detectedCurrency: "GBP", priceAvailable: true }
```

### 2. Check Server Logs

In Vercel (or your deployment platform), check the function logs for:

```
[Geo] Detected country: GB (via Vercel header, IP: ...)
```

### 3. Test Different Countries

#### Using VPN (Recommended)

1. Connect to a VPN server in different countries
2. Visit the billing page
3. Check console logs to see detected country
4. Verify correct currency is displayed

#### Using Browser DevTools (Limited)

- Some browsers allow location spoofing, but IP geolocation won't be affected
- VPN is more reliable for testing

### 4. Manual API Test

You can test the endpoint directly:

```bash
# In browser console or terminal
fetch('/api/geo/detect-country')
  .then(r => r.json())
  .then(console.log)
```

Expected response:

```json
{
  "country": "GB",
  "method": "vercel-header",
  "ip": "xxx.xxx.xxx.xxx"
}
```

### 5. Expected Behavior

| Country Detected    | Currency       | Price Format |
| ------------------- | -------------- | ------------ |
| GB (United Kingdom) | GBP            | £9.99        |
| IE (Ireland)        | EUR            | €11.99       |
| US (United States)  | USD            | $9.99        |
| Other               | GBP (fallback) | £9.99        |

### 6. Troubleshooting

#### Showing $0.00 or wrong currency?

1. Check console for `🌍 [Currency Detection]` log
2. Verify country is being detected correctly
3. Check if Stripe prices include the detected currency
4. Look for errors in console

#### Not detecting country?

1. Check if you're on Vercel (headers work automatically)
2. Check server logs for `[Geo]` messages
3. Verify IP geolocation API is working (if using fallback)
4. Check network tab for `/api/geo/detect-country` response

#### Wrong currency displayed?

1. Check the country mapping in `currency.ts`:
   - IE → EUR
   - US → USD
   - GB → GBP
2. Verify Stripe has prices for all currencies
3. Check console logs to see what's being selected

### 7. Quick Test Checklist

- [ ] Console shows country detection log
- [ ] Console shows currency selection log
- [ ] Console shows Stripe prices
- [ ] Price displays correctly (not $0.00)
- [ ] Currency symbol matches detected country
- [ ] Server logs show detection method

### 8. Production Testing

In production, you can:

1. Use a VPN to test different countries
2. Ask users in different countries to check
3. Monitor server logs for detection accuracy
4. Check analytics for currency distribution
