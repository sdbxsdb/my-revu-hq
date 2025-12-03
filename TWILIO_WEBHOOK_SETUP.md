# Twilio SMS Webhook Setup Guide

This guide explains how to configure Twilio to handle incoming SMS messages (STOP, HELP, START keywords).

---

## What This Does

The webhook handler (`api/twilio/sms-webhook.ts`) automatically processes incoming SMS replies:

- **STOP, CANCEL, UNSUBSCRIBE, etc.** → Marks customer as opted out in database
- **START, UNSTOP, YES** → Re-subscribes customer (removes opt-out flag)
- **HELP, INFO** → Twilio handles automatically with configured message
- **Other messages** → Logged but no action taken

---

## Setup Instructions

### 1. Deploy Your Application

Make sure your app is deployed to Vercel (or your production environment) so the webhook URL is accessible.

Your webhook URL will be:
```
https://your-domain.com/api/twilio/sms-webhook
```

Example:
```
https://myrevuhq.com/api/twilio/sms-webhook
```

---

### 2. Configure Twilio Phone Number

#### For US/CA Phone Number:

1. **Go to Twilio Console:** https://console.twilio.com/
2. **Navigate to:** Phone Numbers → Manage → Active numbers
3. **Click on your US phone number:** e.g., `(448) 288-6444`
4. **Scroll to "Messaging Configuration"**
5. **Set "A MESSAGE COMES IN" webhook:**
   - **Webhook URL:** `https://your-domain.com/api/twilio/sms-webhook`
   - **HTTP Method:** `POST`
   - **Fallback URL:** (optional, same as webhook URL)
6. **Click "Save"**

#### For Alphanumeric Sender ID (UK/IE):

**Note:** Alphanumeric sender IDs (like "MyRevuHq") are **one-way only**. Customers cannot reply to them.

For UK/IE:
- Replies are not possible with alphanumeric sender IDs
- STOP/HELP keywords are not applicable
- No webhook configuration needed

If you want two-way SMS in UK/IE, you need to use a phone number instead of an alphanumeric ID.

---

### 3. Test the Webhook

#### Test Opt-Out:

1. **Send an SMS to a customer** using your app
2. **Reply with "STOP"** from the customer's phone
3. **Check the database:** The customer's `opt_out` field should be `true`
4. **Try sending another SMS:** The app should prevent sending and show "opted out" message

#### Test Opt-In:

1. **Reply with "START"** from a phone that previously opted out
2. **Check the database:** The customer's `opt_out` field should be `false`
3. **Try sending an SMS:** Should work normally

#### Test Help:

1. **Reply with "HELP"** from any phone
2. **Should receive:** The help message configured in your A2P 10DLC campaign

---

### 4. Verify Webhook is Working

**Check Twilio Logs:**

1. Go to **Twilio Console → Monitor → Logs → Messages**
2. Send a test SMS and reply with "STOP"
3. Look for the incoming message log entry
4. Verify:
   - Status: "delivered" or "received"
   - Webhook URL: Your configured URL
   - Webhook Status: 200 (success)

**Check Your Application Logs:**

If using Vercel:
1. Go to **Vercel → Your Project → Logs**
2. Filter for "SMS Webhook"
3. You should see logs like:
   ```
   [SMS Webhook] Received message from +14155551234: STOP
   [SMS Webhook] Customer abc-123 (John Doe) opted out
   ```

---

## Webhook Response Format

The webhook returns TwiML (Twilio Markup Language) responses:

### Opt-Out Response:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>You have successfully been unsubscribed. You will not receive any more messages from this number. Reply START to resubscribe.</Message>
</Response>
```

### Opt-In Response:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>You have successfully been re-subscribed. You may receive messages from this number again. Reply STOP to opt out.</Message>
</Response>
```

### No Response (for HELP or other messages):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>
```

---

## Important Notes

### A2P 10DLC Compliance:

✅ **Required:** You MUST have this webhook configured for A2P 10DLC compliance in US/CA.

✅ **Automatic Handling:** Twilio also handles STOP/START automatically at the carrier level, but this webhook ensures your database stays in sync.

### Security:

- The webhook is publicly accessible (Twilio needs to reach it)
- Twilio sends data as `application/x-www-form-urlencoded`
- For production, consider validating the request is from Twilio using `X-Twilio-Signature` header

### Rate Limiting:

- The webhook handles errors gracefully
- Always returns 200 to prevent Twilio from retrying
- Database updates are idempotent (safe to retry)

---

## Troubleshooting

### Webhook Not Receiving Messages:

1. **Check webhook URL:** Make sure it's accessible from the internet
2. **Check Twilio configuration:** Verify the webhook URL is correct
3. **Check HTTP method:** Must be POST
4. **Check Vercel logs:** Look for incoming requests

### Opt-Out Not Working:

1. **Check phone number format:** Webhook receives E.164 format (+14155551234)
2. **Check database:** Verify customer exists with matching phone number
3. **Check logs:** Look for "Customer opted out" message
4. **Check normalization:** Phone numbers must match after E.164 normalization

### Replies Not Sending:

1. **Alphanumeric sender ID:** Cannot receive replies (one-way only)
2. **Use phone number:** Must use a real phone number for two-way SMS
3. **Check carrier:** Some carriers don't support replies to short codes

---

## Testing Locally

To test locally with ngrok:

1. **Install ngrok:** https://ngrok.com/
2. **Start your dev server:** `yarn dev`
3. **Start ngrok:** `ngrok http 3000`
4. **Copy ngrok URL:** e.g., `https://abc123.ngrok.io`
5. **Update Twilio webhook:** `https://abc123.ngrok.io/api/twilio/sms-webhook`
6. **Test by sending SMS and replying with STOP**

---

## Next Steps

After configuring the webhook:

1. ✅ Test opt-out flow
2. ✅ Test opt-in flow
3. ✅ Monitor logs for a few days
4. ✅ Add webhook signature validation (optional, for security)
5. ✅ Set up alerts for webhook failures (optional)

Your SMS opt-out handling is now compliant and automatic! 🎉

