-- Add SMS personalization settings to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS include_name_in_sms BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS include_job_in_sms BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN users.include_name_in_sms IS 'Whether to include customer name in SMS messages';
COMMENT ON COLUMN users.include_job_in_sms IS 'Whether to include job description in SMS messages';


