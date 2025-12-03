-- Add delivery tracking fields to messages table
-- This enables tracking of SMS delivery status from Twilio

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS twilio_message_sid TEXT,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'queued',
ADD COLUMN IF NOT EXISTS delivery_error_code TEXT,
ADD COLUMN IF NOT EXISTS delivery_error_message TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Set old messages (without twilio_message_sid) to NULL delivery_status
-- This way the UI won't show confusing status icons for pre-tracking messages
-- Only messages with twilio_message_sid will show delivery status
UPDATE messages
SET delivery_status = NULL
WHERE twilio_message_sid IS NULL;

-- For messages that have twilio_message_sid but are still "queued" (sent before status callback was enabled)
-- Mark them as "sent" since we can't get delivery status retroactively
-- Users can see they were sent, but won't have delivery confirmation
UPDATE messages
SET delivery_status = 'sent'
WHERE twilio_message_sid IS NOT NULL 
  AND (delivery_status = 'queued' OR delivery_status IS NULL);

-- Create index for faster lookups by Twilio SID (used by status callback webhook)
CREATE INDEX IF NOT EXISTS idx_messages_twilio_sid ON messages(twilio_message_sid);

-- Create index for delivery status queries
CREATE INDEX IF NOT EXISTS idx_messages_delivery_status ON messages(delivery_status);

-- Add trigger for updated_at (drop first if exists to avoid error)
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN messages.twilio_message_sid IS 'Twilio message SID (e.g., SM123abc...) for tracking delivery status';
COMMENT ON COLUMN messages.delivery_status IS 'Current delivery status: queued, sending, sent, delivered, failed, undelivered';
COMMENT ON COLUMN messages.delivery_error_code IS 'Twilio error code if delivery failed (e.g., 30003, 30006)';
COMMENT ON COLUMN messages.delivery_error_message IS 'Human-readable error message if delivery failed';
COMMENT ON COLUMN messages.updated_at IS 'Timestamp of last status update from Twilio';

