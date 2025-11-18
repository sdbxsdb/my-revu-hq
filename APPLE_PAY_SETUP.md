# Apple Pay Setup Guide

## Overview

Apple Pay will automatically appear in Stripe Checkout once your domain is verified with Apple. No code changes are required for the checkout flow - Stripe handles it automatically.

## Steps to Enable Apple Pay

### 1. Register Apple Merchant ID (if not already done)

- Log in to [Apple Developer account](https://developer.apple.com/)
- Navigate to "Certificates, Identifiers & Profiles" → "Identifiers" → "Merchant IDs"
- Create a new Merchant ID (e.g., `merchant.com.myrevuhq`)
- Note: This is only required if you want to use Apple Pay in native iOS apps. For web-only, you can skip this step.

### 2. Enable Apple Pay in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) → Settings → Payment methods
2. Click on "Apple Pay"
3. Click "Add domain"
4. Enter your domain: `myrevuhq.com`
5. Stripe will provide a verification file: `apple-developer-merchantid-domain-association`
6. Download this file

### 3. Host the Verification File

The file needs to be accessible at:

```
https://myrevuhq.com/.well-known/apple-developer-merchantid-domain-association
```

**For Vercel deployment:**

1. Create the directory: `apps/frontend/public/.well-known/`
2. Place the verification file there: `apps/frontend/public/.well-known/apple-developer-merchantid-domain-association`
3. Deploy to Vercel
4. The file will be automatically served at the correct path

### 4. Verify Domain in Stripe

1. After deploying, go back to Stripe Dashboard
2. Click "Verify" next to your domain
3. Stripe will check that the file is accessible
4. Once verified, Apple Pay will automatically appear in Checkout sessions

## How It Works

Once verified:

- **Stripe Checkout**: Apple Pay will automatically appear as a payment option for users on:
  - iOS Safari
  - macOS Safari
  - Other supported Apple devices/browsers
- **No code changes needed**: The current checkout session code already supports Apple Pay automatically
- **User experience**: Users will see Apple Pay button in the Stripe Checkout page if they're on a supported device

## Testing

1. Test on an iOS device (iPhone/iPad) using Safari
2. Test on macOS using Safari
3. Navigate to billing page and click "Subscribe with Card"
4. In the Stripe Checkout, you should see the Apple Pay button at the top
5. Click it to test the payment flow

## Troubleshooting

- **Apple Pay not showing**:
  - Verify the domain verification file is accessible
  - Check that you're testing on a supported device/browser
  - Ensure your site is served over HTTPS
  - Check Stripe Dashboard to confirm domain is verified

- **Verification file not found**:
  - Ensure the file is in `apps/frontend/public/.well-known/`
  - Check that Vercel is serving static files from the public directory
  - Verify the file name is exactly: `apple-developer-merchantid-domain-association` (no extension)

## Optional: Payment Request Button (Frontend Integration)

If you want to show Apple Pay directly on your billing page (before redirecting to checkout), you can use Stripe's Payment Request Button. This requires:

- Installing `@stripe/stripe-js` (if not already installed)
- Adding a Payment Request Button component
- This is optional - the current Checkout flow will work fine with Apple Pay once domain is verified
