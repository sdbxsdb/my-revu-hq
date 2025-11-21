-- Add opt-out status and request count to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS opt_out BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_request_count INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_opt_out ON customers(opt_out);

-- Add comments for documentation
COMMENT ON COLUMN customers.opt_out IS 'Whether the customer has opted out of receiving SMS messages (via STOP keyword)';
COMMENT ON COLUMN customers.sms_request_count IS 'Number of review request SMS messages sent to this customer (max 3)';

