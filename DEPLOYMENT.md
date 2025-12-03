# Deployment Guide

## Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. **Important:** The `vercel.json` file is already configured for the monorepo
3. In Vercel dashboard, make sure:
   - Root Directory: Leave empty (root of repo) - vercel.json handles it
   - Framework Preset: Vite (or auto-detect)
   - Build Command: Will use `yarn install && yarn workspace frontend build` from vercel.json
   - Output Directory: Will use `apps/frontend/dist` from vercel.json
   - Install Command: Will use `yarn install` from vercel.json
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (your backend URL)

## API (Vercel Serverless Functions)

The API is automatically deployed as serverless functions when you deploy to Vercel. The `api/` directory contains all the serverless function handlers.

Add these environment variables in Vercel:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID` (optional)
- `TWILIO_AUTH_TOKEN` (optional)
- `TWILIO_PHONE_NUMBER` or `TWILIO_ALPHANUMERIC_SENDER_ID` (optional)
- `STRIPE_SECRET_KEY` (optional)
- `STRIPE_PRICE_ID` (optional)
- `STRIPE_WEBHOOK_SECRET` (optional)
- `FRONTEND_URL` (your Vercel URL)

## Supabase Setup

1. Run the migration in `supabase/migrations/000_combined_setup.sql`
2. Configure Row Level Security (RLS) policies as needed
3. Set up a scheduled function to reset monthly SMS counts (optional)

## Twilio Setup

1. Register an alphanumeric sender ID "myrevuhq" in your Twilio account
2. Note: Alphanumeric sender IDs may have restrictions depending on your country
3. For production, consider using a Twilio phone number instead if alphanumeric IDs aren't supported

### US/CA A2P 10DLC Setup (Required for US/Canadian SMS)

1. Complete A2P 10DLC brand and campaign registration (see `TWILIO_A2P_10DLC_FORM_GUIDE.md`)
2. Associate your US phone number with the approved campaign
3. Set environment variable: `TWILIO_US_PHONE_NUMBER=+14482886444`
4. Configure SMS webhook for incoming messages (STOP/HELP handling):
   - Go to Twilio Console → Phone Numbers → [Your US Number]
   - Set "A MESSAGE COMES IN" to: `https://yourdomain.com/api/twilio/sms-webhook`
   - Method: POST
5. See `TWILIO_WEBHOOK_SETUP.md` for detailed instructions
