# Scheduled SMS Setup

## Step 1: Install Packages

Run this command in your terminal:

```bash
cd apps/frontend
yarn add @mantine/dates dayjs
```

Or if you're in the root directory:

```bash
yarn workspace frontend add @mantine/dates dayjs
```

## Step 2: Run Database Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL:

```sql
-- Add scheduled_send_at field to customers table for scheduling SMS sends
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS scheduled_send_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient querying of scheduled sends
CREATE INDEX IF NOT EXISTS idx_customers_scheduled_send_at ON customers(scheduled_send_at)
WHERE scheduled_send_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN customers.scheduled_send_at IS 'Scheduled date and time to send SMS. If NULL, customer is saved for manual send later. If set, SMS will be sent automatically at this time.';
```

## Step 3: Add CRON_SECRET to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add a new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: Generate a random secure string (e.g., use `openssl rand -hex 32`)
   - **Environment**: Production (and Preview if you want to test)

This secret protects your cron endpoint from unauthorized access.

## Step 4: Deploy

After installing packages and running the migration, deploy to Vercel. The cron job will automatically start running every minute to send scheduled SMS messages.

## How It Works

1. **User schedules SMS**: When adding a customer, user can toggle "Schedule SMS to send later" and pick a date (and optionally a time)
2. **Customer saved**: Customer is saved with `scheduled_send_at` timestamp
3. **Cron job runs**: Every minute, Vercel calls `/api/cron/send-scheduled-sms`
4. **SMS sent**: The cron job finds customers with `scheduled_send_at <= now` and sends their SMS automatically
5. **Status updated**: Customer status is updated to `sent` and `sent_at` is recorded

## Testing

To test locally:

1. Add a customer with a scheduled time in the near future (e.g., 2 minutes from now)
2. Wait for the scheduled time
3. The cron job will send the SMS automatically

Note: For local testing, you may need to manually trigger the cron endpoint or wait for Vercel's cron to run in production.

