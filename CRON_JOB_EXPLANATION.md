# How the Scheduled SMS Cron Job Works

## Overview

The scheduled SMS feature allows users to set a specific date and time for when an SMS review request should be automatically sent to a customer. This is handled by a Vercel Cron job that runs every minute.

## How It Works

### 1. User Schedules an SMS

When a user adds or edits a customer and enables "Schedule SMS to send later":

- They select a **date** (using the date picker)
- They select a **time** using three dropdowns:
  - **Hour**: 1-12
  - **Minute**: 00, 15, 30, or 45
  - **AM/PM**: AM or PM (defaults to 7:00 PM)
- The date and time are combined and converted to a 24-hour format ISO timestamp
- This timestamp is stored in the `scheduled_send_at` column in the `customers` table

### 2. Database Storage

- The `scheduled_send_at` field stores a `TIMESTAMP WITH TIME ZONE` in UTC
- Example: If a user schedules for "Jan 15, 2024 at 7:00 PM" in their timezone, it's stored as the equivalent UTC timestamp
- The customer's `sms_status` remains `'pending'` until the SMS is sent

### 3. Vercel Cron Job

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-scheduled-sms",
      "schedule": "* * * * *" // Runs every minute
    }
  ]
}
```

**Schedule format**: `* * * * *` means:

- Every minute
- Every hour
- Every day
- Every month
- Every day of the week

### 4. Cron Job Execution (Every Minute)

When the cron job runs (`/api/cron/send-scheduled-sms`):

1. **Authentication**: Verifies the request using `CRON_SECRET` environment variable
2. **Query Scheduled Customers**: Finds all customers where:
   - `sms_status = 'pending'`
   - `scheduled_send_at IS NOT NULL`
   - `scheduled_send_at <= NOW()` (the scheduled time has arrived or passed)
3. **For Each Customer**:
   - Checks if the user has an active subscription (`access_status = 'active'`)
   - Checks if the user hasn't exceeded their monthly SMS limit (100 SMS/month)
   - Builds the SMS message using the user's template and review links
   - Formats the phone number to E.164 format for Twilio
   - Sends the SMS via Twilio
   - Updates the customer record:
     - Sets `sms_status = 'sent'`
     - Sets `sent_at = NOW()`
   - Increments the user's `sms_sent_this_month` counter
4. **Returns Results**: Reports how many SMS were sent successfully and how many failed

### 5. Example Flow

**User Action**:

- User adds customer "John Doe" on Jan 10, 2024
- Schedules SMS for "Jan 15, 2024 at 7:00 PM"
- Customer saved with `scheduled_send_at = '2024-01-15T19:00:00Z'` (UTC)

**Cron Job**:

- Jan 15, 2024 at 7:00 PM UTC: Cron job runs
- Finds John Doe's customer record (scheduled time has arrived)
- Checks user's payment status ✓
- Checks SMS limit (e.g., 45/100 used) ✓
- Sends SMS via Twilio ✓
- Updates customer: `sms_status = 'sent'`, `sent_at = '2024-01-15T19:00:00Z'`
- Updates user: `sms_sent_this_month = 46`

## Important Notes

### Timezone Handling

- All times are stored in UTC in the database
- The frontend converts the user's local time selection to UTC before saving
- The cron job compares against UTC time (`NOW()` in PostgreSQL is UTC)
- This ensures consistent behavior regardless of user's timezone

### Error Handling

- If a user's subscription is inactive, the SMS is skipped (not sent)
- If the monthly SMS limit is reached, the SMS is skipped
- If Twilio fails to send, the error is logged but doesn't stop other SMS from being sent
- Failed SMS remain with `sms_status = 'pending'` and can be retried manually

### Security

- The cron endpoint is protected by `CRON_SECRET`
- Only Vercel's cron system can trigger it (with the correct secret)
- Regular HTTP requests without the secret will be rejected with 401 Unauthorized

### Monitoring

- The cron job returns JSON with success/error counts
- Vercel logs all cron executions
- Failed SMS can be identified by customers with `scheduled_send_at <= NOW()` but `sms_status = 'pending'`

## Setup Requirements

1. **Environment Variable**: `CRON_SECRET` must be set in Vercel
2. **Database Migration**: The `scheduled_send_at` column must exist (migration `009_add_scheduled_send_at.sql`)
3. **Vercel Configuration**: The cron job must be configured in `vercel.json`
4. **Deployment**: The cron job only runs in production (not in local development)

## Local Development

- The cron job won't run automatically in local development
- To test scheduled SMS locally, you can:
  1. Manually call the endpoint with the correct `CRON_SECRET` header
  2. Or temporarily set `scheduled_send_at` to a past date and manually trigger the endpoint
