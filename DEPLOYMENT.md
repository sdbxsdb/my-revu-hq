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

## Backend (Railway/Render)

### Railway

1. Connect your GitHub repository
2. Set root directory to `apps/backend`
3. Add environment variables:
   - `PORT` (usually auto-set)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `NODE_ENV=production`
   - `FRONTEND_URL` (your Vercel URL)
4. Deploy

### Render

1. Create a new Web Service
2. Connect your GitHub repository
3. Set:
   - Root Directory: `apps/backend`
   - Build Command: `yarn install && yarn build`
   - Start Command: `yarn start`
4. Add the same environment variables as Railway

## Supabase Setup

1. Run the migration in `apps/backend/supabase/migrations/001_initial_schema.sql`
2. Configure Row Level Security (RLS) policies as needed
3. Set up a scheduled function to reset monthly SMS counts (optional)

## Twilio Setup

1. Register an alphanumeric sender ID "myrevuhq" in your Twilio account
2. Note: Alphanumeric sender IDs may have restrictions depending on your country
3. For production, consider using a Twilio phone number instead if alphanumeric IDs aren't supported
