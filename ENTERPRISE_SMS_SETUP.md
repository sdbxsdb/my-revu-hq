# Enterprise Request SMS Notification Setup

## Overview

When a user requests Enterprise plan, you'll receive an SMS notification with their details. This is simpler than email since Twilio is already configured!

## Setup Steps

### 1. Add Your Phone Number to Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Add this variable:**

```
ADMIN_PHONE_NUMBER=+447780587666
```

**Important:**
- Use E.164 format: `+[country code][number]` (e.g., `+447780587666` for UK)
- Include the `+` sign
- No spaces or dashes

**For Production:**
- Set `ADMIN_PHONE_NUMBER` to your phone number

**For Preview/Development (optional):**
- Can use same number or leave empty to skip SMS in dev

### 2. Redeploy Your Application

After adding the environment variable, redeploy:
- Vercel will automatically redeploy on next push, OR
- Go to **Deployments** → Click **Redeploy** on latest deployment

## What You'll Receive

When someone requests Enterprise, you'll get an SMS like:

```
🚀 New Enterprise Request

Email: user@example.com
Business: Acme Corp
User ID: abc-123-def-456
Stripe: cus_xyz789
```

## How It Works

1. User requests Enterprise plan
2. System saves `enterprise_requested_at` timestamp in database
3. SMS is sent to your phone number (if `ADMIN_PHONE_NUMBER` is set)
4. Email is also attempted as fallback (if Resend is configured)
5. User sees "Request Submitted" state that persists across page refreshes

## Troubleshooting

**No SMS received:**
- Check `ADMIN_PHONE_NUMBER` is set correctly in Vercel
- Verify phone number is in E.164 format (`+447780587666`)
- Check Vercel function logs for errors
- Check Twilio Dashboard → Logs for delivery status

**SMS fails but request succeeds:**
- This is expected - SMS failure won't block the request
- Check Vercel logs for error details
- Verify Twilio credentials are correct

## Email vs SMS

**SMS (Current Implementation):**
- ✅ Already configured (Twilio)
- ✅ Instant notification
- ✅ Simple setup (just add phone number)
- ❌ Limited characters (~160 chars)
- ❌ No formatting/links

**Email (Fallback):**
- ✅ Rich formatting
- ✅ More details
- ✅ Clickable links
- ❌ Requires Resend setup
- ❌ May go to spam

**Recommendation:** Use SMS as primary (already working), email as backup for detailed info.

## Database Tracking

The system now tracks enterprise requests in the database:
- `enterprise_requested_at` field in `users` table
- Persists across page refreshes
- Prevents duplicate requests
- Shows "Request Submitted" badge until you manually clear it

## Next Steps

After setup:
1. ✅ Test by requesting Enterprise plan
2. ✅ Verify SMS arrives with correct details
3. ✅ Check that "Request Submitted" state persists after refresh
4. ✅ When you set up Enterprise for a user, manually clear `enterprise_requested_at` in database (or add admin UI later)

