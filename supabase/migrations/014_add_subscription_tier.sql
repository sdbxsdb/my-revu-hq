-- Add subscription tier and Stripe price ID to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_tier TEXT 
  CHECK (subscription_tier IN ('starter', 'pro', 'business', 'enterprise')),
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- Add comments for documentation
COMMENT ON COLUMN users.subscription_tier IS 'User subscription tier: starter (20 SMS/month), pro (50 SMS/month), business (100 SMS/month), enterprise (custom/unlimited)';
COMMENT ON COLUMN users.stripe_price_id IS 'Stripe price ID for the current subscription (used to identify tier)';

