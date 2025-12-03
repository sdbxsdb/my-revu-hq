-- Add enterprise request tracking to users table
-- This allows us to persist the "Request Submitted" state across page refreshes

ALTER TABLE users
ADD COLUMN IF NOT EXISTS enterprise_requested_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_enterprise_requested ON users(enterprise_requested_at)
WHERE enterprise_requested_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.enterprise_requested_at IS 'Timestamp when user requested Enterprise plan. NULL means not requested yet.';

