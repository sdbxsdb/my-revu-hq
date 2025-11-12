# Setup Checklist

## ✅ Initial Setup

- [ ] Install dependencies: `yarn install`
- [ ] Create Supabase project
- [ ] Create Twilio account
- [ ] Configure environment variables

## Supabase Setup

- [ ] Create new Supabase project
- [ ] Run migration: `apps/backend/supabase/migrations/001_initial_schema.sql`
- [ ] Get project URL from Settings > API
- [ ] Get anon key from Settings > API
- [ ] Get service role key from Settings > API (keep secret!)

## Twilio Setup

- [ ] Create Twilio account
- [ ] Get Account SID from dashboard
- [ ] Get Auth Token from dashboard
- [ ] Register alphanumeric sender ID "RateMyWork" (or use phone number)
- [ ] Note: Alphanumeric IDs may require approval in some countries

## Environment Variables

### Frontend (`apps/frontend/.env.local`)
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_API_URL`

### Backend (`apps/backend/.env`)
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_PHONE_NUMBER` (or `TWILIO_ALPHANUMERIC_SENDER_ID`)
- [ ] `FRONTEND_URL`

## Testing

- [ ] Start dev servers: `yarn dev`
- [ ] Test magic link login
- [ ] Test password login
- [ ] Complete account setup
- [ ] Add a customer
- [ ] Send test SMS
- [ ] Verify customer list

## Production Deployment

- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway/Render
- [ ] Set production environment variables
- [ ] Test production deployment
- [ ] Set up monthly SMS reset (optional cron job)

