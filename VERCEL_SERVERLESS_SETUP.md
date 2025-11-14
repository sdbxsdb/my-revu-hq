# Vercel Serverless Functions Setup

Your backend has been converted to Vercel serverless functions! Everything now runs on Vercel - no need for Railway or Render.

## What Changed

- ✅ Express backend converted to Vercel serverless functions
- ✅ All API routes moved to `api/` directory
- ✅ Frontend updated to use same-domain API calls in production
- ✅ Everything stays in one GitHub repo, one deployment

## File Structure

```
api/
├── _utils/           # Shared utilities (auth, supabase, twilio, response helpers)
├── auth/             # Authentication routes
│   ├── sync-session.ts
│   └── logout.ts
├── account.ts        # Account management
├── customers.ts      # Customer list/create
├── customers/[id].ts # Customer update
├── send-sms.ts       # SMS sending
└── billing/          # Stripe billing
    ├── subscription.ts
    ├── create-checkout-session.ts
    ├── request-invoice.ts
    └── webhook.ts
```

## Environment Variables

Add these to your Vercel project (Settings → Environment Variables):

### Required:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `FRONTEND_URL` - Your Vercel deployment URL (e.g., `https://myrevuhq.com`)

### Optional (for SMS):

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER` or `TWILIO_ALPHANUMERIC_SENDER_ID`

### Optional (for Stripe):

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`

### Frontend (Vercel):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` - Leave empty in production (uses same domain), or set to `http://localhost:3001` for local dev

## Local Development

For local development, you can still run the Express backend:

```bash
# Terminal 1: Backend (Express)
cd apps/backend
yarn dev

# Terminal 2: Frontend
cd apps/frontend
yarn dev
```

The frontend will automatically use `http://localhost:3001` in development mode.

## Deployment

1. **Push to GitHub** - All your code is already in the repo
2. **Vercel will auto-deploy** - It detects the `api/` directory and creates serverless functions
3. **Add environment variables** in Vercel dashboard
4. **Done!** - Everything runs on Vercel

## API Endpoints

All endpoints are now at `/api/*` on your Vercel domain:

- `POST /api/auth/sync-session` - Sync Supabase session
- `POST /api/auth/logout` - Logout
- `GET /api/account` - Get account
- `PUT /api/account` - Update account
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/[id]` - Update customer
- `POST /api/send-sms` - Send SMS
- `GET /api/billing/subscription` - Get subscription status
- `POST /api/billing/create-checkout-session` - Create Stripe checkout
- `POST /api/billing/request-invoice` - Request invoice setup
- `POST /api/billing/webhook` - Stripe webhook

## Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-vercel-domain.com/api/billing/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret
5. Add `STRIPE_WEBHOOK_SECRET` to Vercel environment variables

## Benefits

✅ **One deployment** - Everything on Vercel  
✅ **No extra costs** - Vercel free tier is generous  
✅ **Automatic scaling** - Serverless functions scale automatically  
✅ **Same domain** - No CORS issues  
✅ **Simple setup** - Just push to GitHub

## Notes

- The old Express backend in `apps/backend/` is still there for local development
- In production, Vercel uses the `api/` directory for serverless functions
- All environment variables go in Vercel (no separate backend hosting needed)
