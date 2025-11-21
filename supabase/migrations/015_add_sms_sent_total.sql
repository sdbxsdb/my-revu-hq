-- Add total SMS sent counter (all-time)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS sms_sent_total INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN users.sms_sent_total IS 'Total number of SMS messages sent all-time (never resets)';

