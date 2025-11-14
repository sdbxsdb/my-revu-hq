# Local Development Guide

## Quick Start

For full local development (frontend + API):

```bash
# Terminal 1: Start Vercel dev server (runs API serverless functions)
vercel dev

# Terminal 2: Start frontend
yarn dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3000 (Vercel dev)
- Vite automatically proxies `/api/*` requests to Vercel dev

## Frontend Only

If you only need to work on the frontend UI:

```bash
yarn dev
```

Note: API calls will fail unless `vercel dev` is also running.

## Environment Variables

### For Vercel Dev (`vercel dev`)

Create a `.env.local` file in the root directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:5173
TWILIO_ACCOUNT_SID=your_twilio_sid (optional)
TWILIO_AUTH_TOKEN=your_twilio_token (optional)
STRIPE_SECRET_KEY=your_stripe_key (optional)
STRIPE_PRICE_ID=your_price_id (optional)
STRIPE_WEBHOOK_SECRET=your_webhook_secret (optional)
```

### For Frontend (`yarn dev`)

Create `apps/frontend/.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=  # Leave empty to use Vite proxy
```

## How It Works

1. **Vercel Dev** (`vercel dev`):
   - Runs on port 3000
   - Executes your serverless functions from the `api/` directory
   - Handles all `/api/*` routes

2. **Vite Dev Server** (`yarn dev`):
   - Runs on port 5173
   - Serves the React frontend
   - Proxies `/api/*` requests to `http://localhost:3000`

3. **API Calls**:
   - Frontend makes requests to `/api/account`, `/api/customers`, etc.
   - Vite proxy forwards them to Vercel dev
   - Vercel dev executes the serverless functions
   - Response is returned to the frontend

## Troubleshooting

### "404 Not Found" errors

Make sure `vercel dev` is running. The API functions only work when Vercel dev is active.

### Port conflicts

- Vercel dev uses port 3000 by default
- Vite uses port 5173 by default
- If ports are in use, Vercel/Vite will prompt you to use a different port

### Environment variables not working

- Vercel dev reads from `.env.local` in the root directory
- Frontend reads from `apps/frontend/.env.local`
- Make sure both files exist and have the correct variables
