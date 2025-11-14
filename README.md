# MyRevuHQ

A full-stack TypeScript web application for managing customer reviews and sending SMS review requests.

**Website:** https://myrevuhq.com

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Mantine + Tailwind
- **Backend**: Node.js + Express + TypeScript
- **Database & Auth**: Supabase
- **SMS**: Twilio

## Features

- ✅ Magic link and password authentication via Supabase
- ✅ 30-day session persistence with HTTP-only cookies
- ✅ Account setup with business info and review links
- ✅ Customer management with phone number validation
- ✅ SMS sending with customizable templates
- ✅ Monthly SMS limit (100 messages per user)
- ✅ Customer list with filtering and pagination
- ✅ Responsive, mobile-friendly UI

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn
- Supabase account (free tier works)
- Twilio account with SMS capabilities

### Installation

1. **Clone and install dependencies:**

```bash
yarn install
```

2. **Set up Supabase:**
   - Create a new Supabase project
   - Go to SQL Editor and run `supabase/migrations/000_combined_setup.sql`
   - Get your project URL and anon key from Settings > API

3. **Set up Twilio:**
   - Create a Twilio account
   - Get your Account SID and Auth Token
   - Register an alphanumeric sender ID "myrevuhq" (or use a phone number)
   - Note: Alphanumeric sender IDs may not be available in all countries

4. **Configure environment variables:**

   **Frontend** (`apps/frontend/.env.local`):

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=  # Leave empty to use Vite proxy
   ```

5. **Start development:**

   **Option 1: Frontend only (for UI development):**

   ```bash
   yarn dev
   ```

   - Frontend: http://localhost:5173
   - Note: API calls will fail unless you also run `vercel dev`

   **Option 2: Full stack (recommended):**

   ```bash
   # Terminal 1: Start Vercel dev server (API functions)
   vercel dev

   # Terminal 2: Start frontend
   yarn dev
   ```

   - Frontend: http://localhost:5173
   - API: http://localhost:3000 (via Vercel dev)
   - Vite proxy automatically routes `/api/*` to Vercel dev

## Project Structure

```
.
├── apps/
│   ├── frontend/          # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/  # Reusable components
│   │   │   ├── pages/       # Page components
│   │   │   ├── lib/         # API clients, Supabase
│   │   │   ├── hooks/       # React hooks
│   │   │   └── types/       # TypeScript types
│   │   └── package.json
├── api/                     # Vercel serverless functions
│   ├── _utils/              # Shared utilities
│   ├── auth/                # Auth routes
│   ├── billing/             # Stripe billing
│   └── *.ts                 # API route handlers
├── supabase/
│   └── migrations/          # Database migrations
├── package.json
└── README.md
```

## API Endpoints

- `POST /api/auth/sync-session` - Sync Supabase session to cookies
- `GET /api/account` - Get user account
- `PUT /api/account` - Update user account
- `GET /api/customers` - List customers (with pagination/filtering)
- `POST /api/customers` - Create customer
- `POST /api/send-sms` - Send SMS to customer

## Database Schema

- **users**: User profiles with business info and SMS template
- **customers**: Customer records with phone numbers and job descriptions
- **messages**: SMS message logs

See `supabase/migrations/000_combined_setup.sql` for full schema.

## Deployment

See [VERCEL_SERVERLESS_SETUP.md](./VERCEL_SERVERLESS_SETUP.md) for detailed deployment instructions.

- **Everything**: Deploy to Vercel (frontend + API serverless functions)

Make sure to set all environment variables in Vercel.

## Development

- `yarn dev` - Start frontend development server
- `yarn build` - Build frontend for production
- `yarn lint` - Run ESLint on frontend
- `yarn format` - Format code with Prettier
