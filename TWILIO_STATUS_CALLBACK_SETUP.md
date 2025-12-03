# Twilio Status Callback Setup - Delivery Tracking

This guide explains how to set up Twilio's delivery status tracking to monitor SMS delivery in real-time.

---

## What This Does

The status callback system tracks SMS delivery status:

- **queued** → Message received by Twilio, waiting to send
- **sending** → Currently being sent to carrier
- **sent** → Accepted by carrier
- **delivered** ✅ → Successfully delivered to recipient
- **failed** ❌ → Delivery failed (invalid number, blocked, etc.)
- **undelivered** ❌ → Carrier couldn't deliver (number offline, out of service)

---

## Setup Method (Automatic - Recommended)

Your app is already configured to include the status callback URL when sending messages! 

✅ No manual Twilio configuration needed.

The status callback URL is automatically passed with each SMS:
```
https://your-domain.com/api/twilio/status-callback
```

---

## Alternative Setup (Manual - Optional)

If you want to configure the callback globally for all messages from your number:

### For US/CA Phone Number:

1. **Go to Twilio Console:** https://console.twilio.com/
2. **Navigate to:** Phone Numbers → Manage → Active numbers  
3. **Click on your US phone number:** e.g., `(448) 288-6444`
4. **Scroll to "Messaging Configuration"**
5. **Set "STATUS CALLBACK URL":**
   - **URL:** `https://your-domain.com/api/twilio/status-callback`
   - **HTTP Method:** `POST`
6. **Click "Save"**

### For Messaging Service (Alternative):

1. **Go to:** Messaging → Services
2. **Click your messaging service** (e.g., "Low Volume Mixed A2P Messaging Service")
3. **Go to "Integration" tab**
4. **Set "STATUS CALLBACK URL":**
   - **URL:** `https://your-domain.com/api/twilio/status-callback`
   - **HTTP Method:** `POST`
5. **Click "Save"**

---

## How It Works

### The Flow:

1. **User sends SMS** via your app → Twilio receives it
2. **Your app stores Twilio Message SID** in database
3. **Twilio processes the message** through these stages:
   - queued → sending → sent → delivered (or failed)
4. **At each stage**, Twilio POSTs to your status callback URL
5. **Your webhook** receives the update and updates the database
6. **User sees delivery status** in Customer List with icons:
   - ✅ Green checkmark = Delivered
   - ⏳ Yellow hourglass = Sent, awaiting delivery
   - ❌ Red X = Failed
   - 🕒 Gray clock = Queued
   - 🔵 Blue spinning = Sending

---

## Database Schema

The delivery tracking uses these fields in the `messages` table:

```sql
- twilio_message_sid TEXT       -- Twilio message ID (e.g., SM123abc...)
- delivery_status TEXT           -- Current status (queued, sent, delivered, etc.)
- delivery_error_code TEXT       -- Error code if failed (e.g., 30003, 30006)
- delivery_error_message TEXT    -- Human-readable error message
- updated_at TIMESTAMP           -- Last status update time
```

---

## Testing

### Test Delivery Tracking:

1. **Run the database migration:**
   ```sql
   -- Run in Supabase SQL Editor
   -- File: supabase/migrations/019_add_delivery_tracking.sql
   ```

2. **Send a test SMS:**
   - Add a customer in your app
   - Send them an SMS
   - Watch the status in Customer List

3. **Check delivery status:**
   - Initially shows: 🕒 Queued
   - After a few seconds: ⏳ Sent
   - Within 1-2 minutes: ✅ Delivered (or ❌ Failed)

### View Webhook Logs:

**In Vercel:**
1. Go to **Vercel → Your Project → Logs**
2. Filter for "[Status Callback]"
3. You should see logs like:
   ```
   [Status Callback] Message SM123abc status: delivered
   [Status Callback] Updated message abc-123 to status: delivered
   ```

**In Twilio:**
1. Go to **Twilio Console → Monitor → Logs → Messages**
2. Click on a sent message
3. Scroll to "Message Events" section
4. See status progression and webhook calls

---

## Status Meanings

| Status | Icon | Meaning | Typical Time |
|--------|------|---------|--------------|
| `queued` | 🕒 Gray clock | Waiting to send | Instant |
| `sending` | 🔵 Blue spinner | Being sent to carrier | 1-2 seconds |
| `sent` | ⏳ Yellow hourglass | Accepted by carrier | 2-5 seconds |
| `delivered` | ✅ Green check | Successfully delivered | 10-60 seconds |
| `failed` | ❌ Red X | Delivery failed | 5-30 seconds |
| `undelivered` | ❌ Red X | Carrier couldn't deliver | 1-5 minutes |

---

## Common Error Codes

When a message fails, you'll see error codes:

| Code | Meaning | Fix |
|------|---------|-----|
| 30003 | Unreachable carrier | Number may be invalid or out of service |
| 30006 | Landline | Can't send SMS to landlines |
| 30007 | Carrier filter | Message blocked by carrier (spam) |
| 21408 | Permission denied | Number opted out or blocked |
| 21610 | Unsubscribed | Customer replied STOP |

---

## Troubleshooting

### Status Not Updating:

1. **Check webhook is receiving calls:**
   - Look in Vercel logs for "[Status Callback]"
   - Check Twilio message logs for webhook success (200)

2. **Check database migration:**
   - Run: `SELECT * FROM messages LIMIT 1;`
   - Verify `delivery_status` and `twilio_message_sid` columns exist

3. **Check Message SID is being stored:**
   - Send a test SMS
   - Check database: `SELECT twilio_message_sid, delivery_status FROM messages ORDER BY sent_at DESC LIMIT 1;`
   - Should see Twilio SID (starts with "SM")

### Status Stuck on "Queued":

- May be a Twilio delay (wait 5-10 minutes)
- Check Twilio message logs for errors
- Verify phone number is valid and can receive SMS

### Status Callbacks Not Received:

1. **Verify webhook URL is accessible:**
   - Try: `curl https://your-domain.com/api/twilio/status-callback`
   - Should return 405 Method Not Allowed (correct for GET)

2. **Check Twilio webhook configuration:**
   - Go to message in Twilio logs
   - Look for webhook attempts and responses

3. **Check environment variable:**
   - Verify `FRONTEND_URL` is set correctly in Vercel
   - Should be your production domain

---

## Security (Optional Enhancement)

For production, consider validating webhook requests are from Twilio:

```typescript
import { validateRequest } from 'twilio';

// In your webhook handler
const signature = req.headers['x-twilio-signature'];
const url = `https://your-domain.com/api/twilio/status-callback`;
const params = req.body;

const isValid = validateRequest(
  process.env.TWILIO_AUTH_TOKEN!,
  signature,
  url,
  params
);

if (!isValid) {
  return res.status(403).json({ error: 'Invalid signature' });
}
```

---

## Performance Notes

- **Webhook calls are async** - Don't slow down SMS sending
- **Status updates are eventual** - May take seconds to minutes
- **Idempotent** - Safe to receive duplicate status callbacks
- **Database indexed** - Fast lookups by Message SID

---

## Next Steps

1. ✅ Run database migration (019_add_delivery_tracking.sql)
2. ✅ Deploy your application
3. ✅ Send a test SMS
4. ✅ Watch delivery status update in real-time
5. ✅ Monitor webhook logs for any issues

Delivery tracking is now fully automatic! 🎉

