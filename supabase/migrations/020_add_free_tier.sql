-- Add 'free' tier to subscription_tier constraint
-- This allows testing without charges

-- Drop the old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_tier_check;

-- Add new constraint including 'free'
ALTER TABLE users
ADD CONSTRAINT users_subscription_tier_check
CHECK (subscription_tier IN ('free', 'starter', 'pro', 'business', 'enterprise'));

-- Update comment
COMMENT ON COLUMN users.subscription_tier IS 'User subscription tier: free (5 SMS/month, test only), starter (15 SMS/month), pro (30 SMS/month), business (60 SMS/month), enterprise (custom/unlimited)';

