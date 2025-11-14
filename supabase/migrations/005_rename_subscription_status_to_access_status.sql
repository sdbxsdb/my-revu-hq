-- Rename subscription_status to access_status to clarify it's our app's access status, not Stripe's
-- This makes it clear that access_status represents whether the user has access to our service,
-- regardless of payment method (card subscription or invoice payment)

ALTER TABLE users 
RENAME COLUMN subscription_status TO access_status;

-- Update the check constraint
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_subscription_status_check;

ALTER TABLE users
ADD CONSTRAINT users_access_status_check 
CHECK (access_status IN ('active', 'inactive', 'past_due', 'canceled'));

-- Update index name
DROP INDEX IF EXISTS idx_users_subscription_status;
CREATE INDEX IF NOT EXISTS idx_users_access_status ON users(access_status);

-- Update comment
COMMENT ON COLUMN users.access_status IS 
  'User access status to our service: active (has access), inactive (no access), past_due (payment overdue), canceled (subscription canceled). This is our app status, not Stripe subscription status.';

