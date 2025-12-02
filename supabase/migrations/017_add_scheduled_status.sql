-- Update sms_status to include 'scheduled' for scheduled SMS sends
ALTER TABLE customers
DROP CONSTRAINT IF EXISTS customers_sms_status_check;

ALTER TABLE customers
ADD CONSTRAINT customers_sms_status_check
CHECK (sms_status IN ('sent', 'pending', 'scheduled'));

-- Add comment for documentation
COMMENT ON COLUMN customers.sms_status IS 'Status of SMS: pending (not yet sent), scheduled (waiting for scheduled_send_at time), sent (successfully sent)';


