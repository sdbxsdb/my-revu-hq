-- Add onboarding_completed flag to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN users.onboarding_completed IS 'Indicates if the user has completed the initial onboarding wizard';

-- Set onboarding_completed to true for all existing users
-- (Only new signups after this migration should see the onboarding wizard)
UPDATE users
SET onboarding_completed = true
WHERE created_at < NOW();

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);

