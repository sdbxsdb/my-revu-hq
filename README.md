# Rate My Work

A full-stack TypeScript web application for managing customer reviews and sending SMS review requests.

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
   - Go to SQL Editor and run `apps/backend/supabase/migrations/001_initial_schema.sql`
   - Get your project URL and anon key from Settings > API

3. **Set up Twilio:**
   - Create a Twilio account
   - Get your Account SID and Auth Token
   - Register an alphanumeric sender ID "RateMyWork" (or use a phone number)
   - Note: Alphanumeric sender IDs may not be available in all countries

4. **Configure environment variables:**

   **Frontend** (`apps/frontend/.env.local`):

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:3001
   ```

   **Backend** (`apps/backend/.env`):

   ```env
   PORT=3001
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   TWILIO_ALPHANUMERIC_SENDER_ID=RateMyWork
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

5. **Start development servers:**

```bash
yarn dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

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
│   └── backend/             # Express backend
│       ├── src/
│       │   ├── routes/      # API routes
│       │   ├── middleware/  # Auth middleware
│       │   ├── utils/       # Supabase, Twilio clients
│       │   └── types/       # TypeScript types
│       ├── supabase/
│       │   └── migrations/  # Database migrations
│       └── package.json
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

See `apps/backend/supabase/migrations/001_initial_schema.sql` for full schema.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Railway or Render

Make sure to set all environment variables in your deployment platform.

## Development

- `yarn dev` - Start both frontend and backend in development mode
- `yarn build` - Build both apps for production
- `yarn lint` - Run ESLint on both apps
- `yarn format` - Format code with Prettier
