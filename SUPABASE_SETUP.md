# Supabase Setup Guide

## ✅ Environment Variables Configured

Your `.env` files have been created with your Supabase credentials:

- `apps/backend/.env` - Backend environment variables
- `apps/frontend/.env` - Frontend environment variables

## 📋 Next Steps: Database Setup

### Step 1: Run Database Migrations

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/mmnabvqkstkjlkxfksbp
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file: `apps/backend/supabase/migrations/000_combined_setup.sql`
5. Copy the entire contents of that file
6. Paste it into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)

This will create all the necessary tables, indexes, RLS policies, and functions.

### Step 2: Verify Tables Were Created

After running the migration, verify the tables exist:

1. Go to **Table Editor** in the Supabase dashboard
2. You should see these tables:
   - `users` - User profiles
   - `customers` - Customer records
   - `messages` - SMS message history

### Step 3: Test Local Development

1. **Start the backend:**

   ```bash
   cd apps/backend
   yarn dev
   ```

2. **Start the frontend (in a new terminal):**

   ```bash
   cd apps/frontend
   yarn dev
   ```

3. Visit `http://localhost:5173` and try to sign up/login

## 🔐 Production Environment Variables

### Vercel (Frontend)

Add these in your Vercel project settings:

- `VITE_SUPABASE_URL` = `https://mmnabvqkstkjlkxfksbp.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = (your anon key)
- `VITE_API_URL` = (your backend URL, e.g., `https://your-backend.railway.app`)

### Backend Hosting (Railway/Render)

Add these in your backend hosting platform:

- `SUPABASE_URL` = `https://mmnabvqkstkjlkxfksbp.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = (your service role key - keep secret!)
- `FRONTEND_URL` = (your Vercel URL, e.g., `https://my-revu-hq.vercel.app`)
- `NODE_ENV` = `production`
- `PORT` = (usually auto-set by platform)

## 🔒 Security Notes

- ✅ `.env` files are already in `.gitignore` - they won't be committed
- ⚠️ **Never commit** your `SUPABASE_SERVICE_ROLE_KEY` - it has admin access
- ⚠️ The `anon` key is safe for frontend use (it's restricted by RLS policies)

## 📝 What the Migration Creates

- **Tables:**
  - `users` - User profiles with billing info
  - `customers` - Customer records with phone numbers
  - `messages` - SMS message history

- **Security:**
  - Row Level Security (RLS) enabled on all tables
  - Policies ensure users can only access their own data

- **Features:**
  - Automatic `updated_at` timestamps
  - Monthly SMS count tracking
  - Stripe billing integration fields
  - Review links array support

## 🆘 Troubleshooting

**Migration fails with "relation already exists":**

- Some tables might already exist. The migration uses `IF NOT EXISTS` so it should be safe, but if you get errors, you can run the individual migration files in order (001, 002, 003, 004).

**Can't connect to Supabase:**

- Verify your credentials in the `.env` files
- Check that your Supabase project is active
- Make sure you're using the correct project URL

**RLS policies blocking access:**

- RLS policies require users to be authenticated
- Make sure you're logged in when testing
- Check that `auth.uid()` matches the user ID in the tables
