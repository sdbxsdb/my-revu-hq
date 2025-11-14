-- Combined Migration Script for Fresh Supabase Instance
-- Run this in Supabase SQL Editor if starting fresh
-- This combines all migrations in the correct order

-- ============================================
-- Migration 001: Initial Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  business_name TEXT,
  google_review_link TEXT,
  facebook_review_link TEXT,
  other_review_link TEXT,
  sms_template TEXT,
  sms_sent_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone JSONB NOT NULL, -- {countryCode: string, number: string}
  job_description TEXT,
  sms_status TEXT NOT NULL DEFAULT 'pending' CHECK (sms_status IN ('sent', 'pending')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_sms_status ON customers(sms_status);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_customer_id ON messages(customer_id);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for customers
CREATE POLICY "Users can view own customers"
  ON customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers"
  ON customers FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to reset monthly SMS count (run monthly via cron or scheduled job)
CREATE OR REPLACE FUNCTION reset_monthly_sms_count()
RETURNS void AS $$
BEGIN
  UPDATE users SET sms_sent_this_month = 0;
END;
$$ language 'plpgsql';

-- ============================================
-- Migration 002: Add Billing Fields
-- ============================================

-- Add billing and subscription fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS access_status TEXT DEFAULT 'inactive' 
  CHECK (access_status IN ('active', 'inactive', 'past_due', 'canceled')),
ADD COLUMN IF NOT EXISTS payment_method TEXT 
  CHECK (payment_method IN ('card', 'direct_debit')),
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_access_status ON users(access_status);

-- Add comments for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID (for card payments)';
COMMENT ON COLUMN users.access_status IS 'User access status to our service: active (has access), inactive (no access), past_due (payment overdue), canceled (subscription canceled). This is our app status, not Stripe subscription status.';
COMMENT ON COLUMN users.payment_method IS 'Payment method type: card or direct_debit';
COMMENT ON COLUMN users.current_period_end IS 'End date of current billing period';

-- ============================================
-- Migration 003: Update Review Links to Array
-- ============================================

-- Create a new column for the links array
ALTER TABLE users
ADD COLUMN IF NOT EXISTS review_links JSONB DEFAULT '[]'::jsonb;

-- Migrate existing data from old columns to new array format (if any exists)
UPDATE users
SET review_links = (
  SELECT jsonb_agg(
    jsonb_build_object('name', name, 'url', url)
  )
  FROM (
    SELECT 'Google' as name, google_review_link as url WHERE google_review_link IS NOT NULL AND google_review_link != ''
    UNION ALL
    SELECT 'Facebook' as name, facebook_review_link as url WHERE facebook_review_link IS NOT NULL AND facebook_review_link != ''
    UNION ALL
    SELECT 'Other' as name, other_review_link as url WHERE other_review_link IS NOT NULL AND other_review_link != ''
  ) AS links
  WHERE url IS NOT NULL AND url != ''
)
WHERE (google_review_link IS NOT NULL 
   OR facebook_review_link IS NOT NULL 
   OR other_review_link IS NOT NULL)
   AND (review_links IS NULL OR review_links = '[]'::jsonb);

-- Add comment for documentation
COMMENT ON COLUMN users.review_links IS 'Array of review links: [{"name": "Google", "url": "https://..."}, ...]';

-- ============================================
-- Migration 004: Clarify Invoice vs Subscription
-- ============================================

-- Add comments to clarify the distinction between card subscriptions and invoice payments
COMMENT ON COLUMN users.stripe_subscription_id IS 
  'Stripe subscription ID (NULL for invoice-based payments, populated for card subscriptions)';

COMMENT ON COLUMN users.payment_method IS 
  'Payment method type: card (has stripe_subscription_id) or direct_debit (invoice-based, no stripe_subscription_id)';

-- ============================================
-- Migration 005: Rename subscription_status (SKIP - already using access_status)
-- ============================================
-- Note: This migration is skipped because we're creating access_status directly in migration 002
-- If you're migrating from an old database that has subscription_status, uncomment below:
-- ALTER TABLE users RENAME COLUMN subscription_status TO access_status;

-- Note: business_name is enforced as required at the application level (Zod validation)
-- The database column remains nullable for flexibility

-- ============================================
-- Migration 006: Auto-create User Profile
-- ============================================

-- Auto-create user profile when a new auth user is created
-- This ensures user data is stored immediately on signup/magic link/OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

