-- Rename status columns to be more descriptive
-- access_status -> payment_status (tracks payment/subscription status)
-- account_status -> account_lifecycle_status (tracks account lifecycle state)

-- Rename access_status to payment_status
ALTER TABLE users 
RENAME COLUMN access_status TO payment_status;

-- Update the check constraint
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_access_status_check;

ALTER TABLE users
ADD CONSTRAINT users_payment_status_check 
CHECK (payment_status IN ('active', 'inactive', 'past_due', 'canceled'));

-- Update index name
DROP INDEX IF EXISTS idx_users_access_status;
CREATE INDEX IF NOT EXISTS idx_users_payment_status ON users(payment_status);

-- Update comment (using $$ syntax to avoid quote escaping issues)
COMMENT ON COLUMN users.payment_status IS 
  $$Payment/subscription status: active (has paid and has access), inactive (has not paid), past_due (payment failed but in grace period), canceled (subscription/payment canceled). This determines if the user can use the service.$$;

-- Rename account_status to account_lifecycle_status
ALTER TABLE users 
RENAME COLUMN account_status TO account_lifecycle_status;

-- Update the check constraint
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_account_status_check;

ALTER TABLE users
ADD CONSTRAINT users_account_lifecycle_status_check 
CHECK (account_lifecycle_status IN ('active', 'cancelled', 'deleted'));

-- Update index name
DROP INDEX IF EXISTS idx_users_account_status;
CREATE INDEX IF NOT EXISTS idx_users_account_lifecycle_status ON users(account_lifecycle_status);

-- Update comment (using $$ syntax to avoid quote escaping issues)
COMMENT ON COLUMN users.account_lifecycle_status IS 
  $$Account lifecycle status: active (normal account), cancelled (subscription cancelled but data retained), deleted (account marked for deletion). This is separate from payment_status which tracks subscription/payment status.$$;

