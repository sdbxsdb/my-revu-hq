-- Add consent tracking to messages table
-- This stores when the business owner (user) confirmed they had customer consent to send SMS

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS user_confirmed_customer_consent_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries when investigating spam complaints
CREATE INDEX IF NOT EXISTS idx_messages_consent_confirmed ON messages(user_confirmed_customer_consent_at)
WHERE user_confirmed_customer_consent_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN messages.user_confirmed_customer_consent_at IS 'Timestamp when the business owner (user) confirmed they had obtained customer consent to send SMS, as required by Terms and Conditions. This is required for spam complaint defense.';
