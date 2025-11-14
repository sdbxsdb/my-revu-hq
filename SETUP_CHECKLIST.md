# Setup Checklist

## ✅ Initial Setup

- [ ] Install dependencies: `yarn install`
- [ ] Create Supabase project
- [ ] Create Twilio account
- [ ] Configure environment variables

## Supabase Setup

- [ ] Create new Supabase project
- [ ] Run migration: `supabase/migrations/000_combined_setup.sql`
- [ ] Get project URL from Settings > API
- [ ] Get anon key from Settings > API
- [ ] Get service role key from Settings > API (keep secret!)

## Twilio Setup

- [ ] Create Twilio account
- [ ] Get Account SID from dashboard
- [ ] Get Auth Token from dashboard
- [ ] Register alphanumeric sender ID "myrevuhq" (or use phone number)
- [ ] Note: Alphanumeric IDs may require approval in some countries

## Environment Variables

### Frontend (`apps/frontend/.env.local`)

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_API_URL`

### Vercel (Environment Variables)

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_PHONE_NUMBER` (or `TWILIO_ALPHANUMERIC_SENDER_ID`)
- [ ] `FRONTEND_URL` (your Vercel URL)

## Testing

- [ ] Start dev server: `yarn dev`
- [ ] Test magic link login
- [ ] Test password login
- [ ] Complete account setup
- [ ] Add a customer
- [ ] Send test SMS
- [ ] Verify customer list

## Production Deployment

- [ ] Deploy to Vercel (frontend + API serverless functions)
- [ ] Set production environment variables in Vercel
- [ ] Test production deployment
- [ ] Set up monthly SMS reset (optional cron job)
