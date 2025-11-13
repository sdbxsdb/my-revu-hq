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

-- Add comment for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID (for card payments)';
COMMENT ON COLUMN users.access_status IS 'User access status to our service: active (has access), inactive (no access), past_due (payment overdue), canceled (subscription canceled). This is our app status, not Stripe subscription status.';
COMMENT ON COLUMN users.payment_method IS 'Payment method type: card or direct_debit';
COMMENT ON COLUMN users.current_period_end IS 'End date of current billing period';

