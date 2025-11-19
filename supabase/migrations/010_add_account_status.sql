-- Add account_status column to track account lifecycle
-- This is separate from access_status which tracks subscription/payment status
ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' 
  CHECK (account_status IN ('active', 'cancelled', 'deleted'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- Add comment for documentation
COMMENT ON COLUMN users.account_status IS 'Account lifecycle status: active (normal account), cancelled (subscription cancelled but data retained), deleted (account marked for deletion). This is separate from access_status which tracks subscription/payment status.';

