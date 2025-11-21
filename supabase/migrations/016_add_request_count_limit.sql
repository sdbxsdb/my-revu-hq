-- Add request count tracking to customers table
-- This tracks how many SMS review requests have been sent to each customer
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS sms_request_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS opt_out BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_opt_out ON customers(opt_out);
CREATE INDEX IF NOT EXISTS idx_customers_sms_request_count ON customers(sms_request_count);

-- Add comments for documentation
COMMENT ON COLUMN customers.sms_request_count IS 'Number of SMS review requests sent to this customer (max 3)';
COMMENT ON COLUMN customers.opt_out IS 'Whether the customer has opted out of receiving SMS messages';

