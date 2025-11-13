-- Add comment to clarify the distinction between card subscriptions and invoice payments
-- 
-- CARD PAYMENTS (Automatic Subscription):
-- - stripe_subscription_id IS NOT NULL (has active Stripe subscription)
-- - payment_method = 'card'
-- - access_status = 'active' (managed by Stripe webhooks)
-- - Payments are automatic via Stripe Checkout
--
-- INVOICE PAYMENTS (Manual):
-- - stripe_subscription_id IS NULL (no Stripe subscription)
-- - stripe_customer_id IS NOT NULL (customer exists in Stripe)
-- - payment_method = 'direct_debit'
-- - access_status = 'active' (set manually or via invoice.payment_succeeded webhook)
-- - Invoices are created manually in Stripe Dashboard or via API
-- - When invoice is paid, invoice.payment_succeeded webhook updates access_status

COMMENT ON COLUMN users.stripe_subscription_id IS 
  'Stripe subscription ID (NULL for invoice-based payments, populated for card subscriptions)';

COMMENT ON COLUMN users.payment_method IS 
  'Payment method type: card (has stripe_subscription_id) or direct_debit (invoice-based, no stripe_subscription_id)';

