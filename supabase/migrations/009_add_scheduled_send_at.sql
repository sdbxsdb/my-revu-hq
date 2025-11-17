-- Add scheduled_send_at field to customers table for scheduling SMS sends
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS scheduled_send_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient querying of scheduled sends
CREATE INDEX IF NOT EXISTS idx_customers_scheduled_send_at ON customers(scheduled_send_at)
WHERE scheduled_send_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN customers.scheduled_send_at IS 'Scheduled date and time to send SMS. If NULL, customer is saved for manual send later. If set, SMS will be sent automatically at this time.';


