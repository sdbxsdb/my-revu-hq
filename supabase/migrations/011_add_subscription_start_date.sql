-- Add subscription_start_date column to store when subscription/invoice payment started
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN users.subscription_start_date IS 'Date when subscription or invoice payment started (for both card and invoice payments)';

