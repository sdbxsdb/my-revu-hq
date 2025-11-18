# Apple Pay Domain Verification

This directory is for hosting the Apple Pay domain verification file.

## Setup Instructions

1. Go to Stripe Dashboard → Settings → Payment methods → Apple Pay
2. Add your domain: `myrevuhq.com`
3. Download the verification file provided by Stripe
4. Place it here with the exact name: `apple-developer-merchantid-domain-association`
5. Deploy to Vercel
6. Verify the domain in Stripe Dashboard

The file will be accessible at:
`https://myrevuhq.com/.well-known/apple-developer-merchantid-domain-association`

## Important Notes

- The file name must be exactly: `apple-developer-merchantid-domain-association` (no extension)
- The file must be accessible over HTTPS
- After deployment, verify in Stripe Dashboard that the domain is verified
