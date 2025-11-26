-- Add was_scheduled to messages table (not customers table)
-- Each individual message should track if it was scheduled, not the customer
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS was_scheduled BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN messages.was_scheduled IS 'Indicates if this specific message was sent via scheduled automation (true) or manually (false)';
