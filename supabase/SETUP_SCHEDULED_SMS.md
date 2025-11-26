# Scheduled SMS Setup Guide

This guide walks you through setting up automated SMS sending using Supabase pg_cron and Edge Functions.

## ✅ Completed

1. **Database Migration** - Added `scheduled_send_at` field and 'scheduled' status
2. **AddCustomer Page** - Date/time picker for Pro/Business tiers
3. **API Updates** - Backend accepts scheduled times
4. **Edge Function** - Created `send-scheduled-sms` function

## 🔧 Setup Required

### 1. Deploy Edge Function to Supabase (via Dashboard)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **Edge Functions** in the left sidebar
4. Click **Create a new function**
5. Name it: `send-scheduled-sms`
6. Copy the contents of `supabase/functions/send-scheduled-sms/index.ts` into the editor
7. Click **Deploy function**
8. Go to **Edge Functions Settings** (gear icon)
9. Add environment variable:
   - Key: `VERCEL_API_URL`
   - Value: `https://your-app.vercel.app` (your actual Vercel URL)

### 2. Enable pg_cron in Supabase (via Dashboard)

1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste this SQL:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create the cron job to run every minute
SELECT cron.schedule(
  'process-scheduled-sms',
  '* * * * *',  -- Every minute
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-scheduled-sms',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Verify the job was created
SELECT * FROM cron.job;
```

5. Click **Run** to execute

**Important**: Replace:

- `YOUR_PROJECT_REF` with your Supabase project reference (from Settings > General > Reference ID)
- `YOUR_SERVICE_ROLE_KEY` with your Supabase service role key (from Settings > API > Project API keys > service_role)

### 3. Update Vercel API to Accept Service Requests

The `/api/send-sms` endpoint needs to accept requests from the Edge Function. You may need to add a service key check or allow requests with a specific header.

### 4. Run Database Migration (via Dashboard)

1. Go to **SQL Editor** in your Supabase Dashboard
2. Click **New query**
3. Copy and paste this SQL:

```sql
-- Update sms_status to include 'scheduled'
ALTER TABLE customers
DROP CONSTRAINT IF EXISTS customers_sms_status_check;

ALTER TABLE customers
ADD CONSTRAINT customers_sms_status_check
CHECK (sms_status IN ('sent', 'pending', 'scheduled'));
```

4. Click **Run** to execute

````

## 📋 Remaining TODO

### CustomerList Page Updates

The `CustomerList.tsx` page needs updates to:

1. **Show Scheduled Time** for customers with `sms_status === 'scheduled'`
   - Display badge: "Scheduled" instead of "Not Sent"
   - Show scheduled date/time below the badge
   - Format: "Scheduled: 15 Jan 2024, 10:30 AM"

2. **Edit Schedule Button** for Pro/Business users
   - Add "Edit Schedule" button next to "Send SMS" for scheduled customers
   - Opens modal with DateTimePicker (same as AddCustomer)
   - Updates `scheduled_send_at` via API

3. **Send Now Override** for scheduled customers
   - "Send SMS" button should:
     - Clear `scheduled_send_at`
     - Send immediately
     - Update status to 'sent'

### API Update for Editing Schedule

Update `/api/customers/[id].ts` to accept `scheduled_send_at` parameter:

```typescript
// In the PUT/PATCH handler
if (validated.scheduledSendAt !== undefined) {
  updates.scheduled_send_at = validated.scheduledSendAt || null;
  updates.sms_status = validated.scheduledSendAt ? 'scheduled' : 'pending';
}
````

## 🧪 Testing

1. **Manual Test Edge Function** (via Dashboard):
   - Go to **Edge Functions** in Supabase Dashboard
   - Click on `send-scheduled-sms`
   - Click **Invoke function** button (or use the test feature)

   OR via terminal:

   ```bash
   curl -X POST \
     https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-scheduled-sms \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
   ```

2. **Create Test Customer**:
   - Go to Add Customer page
   - Fill in details
   - Click "Schedule Request" (Pro/Business tier required)
   - Set time 2 minutes in future
   - Verify customer shows as "scheduled" in database
   - Wait 2 minutes
   - Check pg_cron logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
   - Verify SMS was sent

3. **Monitor Cron Execution**:
   ```sql
   -- View recent cron job runs
   SELECT * FROM cron.job_run_details
   ORDER BY start_time DESC
   LIMIT 10;
   ```

## 🔍 Troubleshooting

### Cron job not running

Go to **SQL Editor** and run:

```sql
-- Check if job exists
SELECT * FROM cron.job WHERE jobname = 'process-scheduled-sms';

-- Check recent runs
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-scheduled-sms')
ORDER BY start_time DESC LIMIT 5;
```

### Edge Function errors

1. Go to **Edge Functions** in Supabase Dashboard
2. Click on `send-scheduled-sms`
3. Click **Logs** tab to view execution logs

### SMS not sending

- Check customer's `scheduled_send_at` is in the past
- Verify `sms_status` is 'scheduled'
- Check Edge Function logs for errors
- Verify Vercel API is receiving requests
- Check user has SMS credit/limit remaining

## 💰 Tier Restrictions

- **Free**: Can save customers with "Request Later" but NO scheduling
- **Pro/Business**: Full scheduling with date/time picker

This is enforced in:

- `AddCustomer.tsx`: `canSchedule` check
- `CustomerList.tsx`: Show/hide edit schedule button based on tier
