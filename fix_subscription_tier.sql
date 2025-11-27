-- Quick fix to set subscription_tier based on stripe_price_id
-- Run this in Supabase SQL Editor

UPDATE users
SET subscription_tier = 'free'
WHERE stripe_price_id IN (
  'price_1SY6QVEAEfoPoTo8Y3t3vngs',  -- FREE GBP
  'price_1SY6QGEAEfoPoTo8i1IKmbGU',  -- FREE EUR
  'price_1SY6PyEAEfoPoTo8Fw5IbkRV'   -- FREE USD
)
AND subscription_tier IS NULL;

-- Verify the update
SELECT id, email, subscription_tier, stripe_price_id, payment_status
FROM users
WHERE stripe_price_id LIKE 'price_1SY6%';

