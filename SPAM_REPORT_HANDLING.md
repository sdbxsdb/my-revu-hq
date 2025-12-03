# SMS Spam Report Handling Guide

## What Happens When Someone Reports Your SMS as Spam

When a recipient reports an SMS message as spam, several things happen:

### 1. **Carrier-Level Actions**
- The recipient's mobile carrier receives the spam report
- The carrier may block future messages from your number
- The carrier shares the report with other carriers (via spam reporting networks)
- Your sender reputation is negatively affected

### 2. **Twilio Actions**
- Twilio receives spam complaint notifications from carriers
- Twilio may temporarily suspend or restrict your account
- Twilio may block your phone number from sending messages
- Twilio will notify you via email about the complaint
- Your A2P 10DLC campaign reputation is affected (for US/CA)

### 3. **Regulatory Actions** (US/CA)
- Reports may be escalated to the FCC (Federal Communications Commission)
- TCPA violations can result in fines ($500-$1,500 per violation)
- Your A2P 10DLC campaign may be suspended or rejected

---

## What You Need to Do When You Receive a Spam Report

### Immediate Actions:

1. **Check Twilio Console**
   - Go to: https://console.twilio.com/
   - Navigate to: **Monitor → Logs → Messages**
   - Look for messages with status "failed" or "undelivered"
   - Check for any notifications or warnings

2. **Check Your Email**
   - Twilio will send you an email notification about the spam complaint
   - Subject line usually contains: "Spam Complaint" or "Compliance Alert"
   - Read the email carefully for specific actions required

3. **Review the Message**
   - Identify which message was reported
   - Check if it was sent to the correct recipient
   - Verify the message content complies with regulations
   - Ensure the recipient had given consent

4. **Check Customer Consent**
   - Verify the customer had opted in to receive messages
   - Check your database for the customer's `opt_out` status
   - Review when/how consent was obtained

5. **Contact Twilio Support** (if needed)
   - If your account is suspended, contact Twilio support immediately
   - Explain the situation and provide evidence of consent
   - Request account restoration if the complaint was unfounded

---

## Prevention: How to Avoid Spam Reports

### 1. **Obtain Explicit Consent**
- ✅ Always get permission before sending SMS
- ✅ Document consent (verbal or written)
- ✅ Make it clear what messages they'll receive
- ✅ Include opt-out instructions in every message

### 2. **Follow Best Practices**
- ✅ Send messages only to customers who have given consent
- ✅ Include clear opt-out instructions: "Reply STOP to opt out"
- ✅ Send messages at reasonable times (9am-9pm)
- ✅ Don't send too frequently (max 3 messages per service interaction)
- ✅ Personalize messages when possible
- ✅ Make messages relevant and valuable

### 3. **Monitor Opt-Outs**
- ✅ Check your database regularly for `opt_out = true` customers
- ✅ Never send messages to opted-out customers
- ✅ Respect STOP requests immediately

### 4. **Message Content Guidelines**
- ✅ Keep messages transactional/informational (not promotional)
- ✅ Include your business name
- ✅ Make it clear why they're receiving the message
- ✅ Include opt-out instructions (required for US/CA)
- ✅ Don't use spam trigger words (FREE, URGENT, CLICK NOW, etc.)

---

## Current Implementation Status

### ✅ What's Already Implemented:

1. **Opt-Out Handling** (`api/twilio/sms-webhook.ts`)
   - Automatically processes STOP/UNSUBSCRIBE keywords
   - Marks customers as `opt_out = true` in database
   - Prevents future messages to opted-out customers

2. **Opt-Out Prevention** (`api/send-sms.ts`)
   - Checks `opt_out` status before sending
   - Blocks sending to opted-out customers
   - Shows user-friendly error message

3. **Regulatory Compliance**
   - Includes required opt-out text for US/CA messages
   - Includes HELP instructions
   - Complies with A2P 10DLC requirements

### ⚠️ What's NOT Yet Implemented:

1. **Spam Complaint Webhook**
   - Twilio can send webhooks when spam complaints are received
   - Currently, you need to check Twilio Console manually
   - **Recommendation:** Set up spam complaint webhook (see below)

2. **Automatic Customer Blocking**
   - When spam is reported, automatically mark customer as opted out
   - Currently requires manual intervention

3. **Spam Report Alerts**
   - Email notifications to admin when spam is reported
   - Dashboard alerts for spam complaints

---

## Recommended Next Steps

### Option 1: Set Up Twilio Spam Complaint Webhook (Recommended)

Twilio can send webhooks when spam complaints are received. This allows you to:

1. **Automatically mark customers as opted out** when spam is reported
2. **Receive real-time notifications** about spam complaints
3. **Track spam complaint rates** in your database

**To implement:**

1. Create a new webhook handler: `api/twilio/spam-complaint.ts`
2. Configure in Twilio Console:
   - Go to **Phone Numbers → Active Numbers → [Your Number]**
   - Set **"SPAM COMPLAINT WEBHOOK"** URL
   - Method: POST
3. Handle the webhook to:
   - Mark customer as `opt_out = true`
   - Log the spam complaint
   - Send admin notification email

**Note:** This requires Twilio's Messaging Service configuration, not individual phone numbers.

### Option 2: Manual Monitoring (Current Approach)

1. **Set up email alerts** in Twilio Console for spam complaints
2. **Check Twilio Console weekly** for compliance issues
3. **Monitor delivery rates** - sudden drops may indicate spam filtering
4. **Review customer complaints** - if customers complain, investigate immediately

---

## If Your Account Gets Suspended

### Steps to Restore:

1. **Contact Twilio Support Immediately**
   - Email: support@twilio.com
   - Explain the situation
   - Provide evidence of consent

2. **Provide Documentation**
   - Show how consent was obtained
   - Provide customer records
   - Explain your opt-out process

3. **Review and Fix Issues**
   - Identify why the spam report occurred
   - Fix any compliance issues
   - Update your processes if needed

4. **Request Account Review**
   - Ask Twilio to review your account
   - Provide evidence of compliance
   - Request restoration

---

## Monitoring Spam Reports

### How to Check for Spam Reports:

1. **Twilio Console:**
   - Go to **Monitor → Logs → Messages**
   - Filter by status: "failed" or "undelivered"
   - Look for error codes related to spam

2. **Twilio Email Notifications:**
   - Check your email regularly
   - Look for subject lines containing "Spam" or "Compliance"

3. **Delivery Rates:**
   - Monitor your SMS delivery success rate
   - Sudden drops may indicate spam filtering
   - Check `api/twilio/status-callback.ts` logs

4. **Customer Feedback:**
   - Monitor customer complaints
   - Check support emails
   - Review social media mentions

---

## Legal Considerations

### TCPA Compliance (US):
- **Fines:** $500-$1,500 per violation
- **Class Action Lawsuits:** Can result in millions in damages
- **Consent Required:** Must be explicit and documented

### GDPR Compliance (UK/EU):
- **Fines:** Up to €20 million or 4% of annual revenue
- **Consent Required:** Must be explicit and opt-in
- **Right to Erasure:** Must delete data when requested

### Best Practice:
- Always obtain explicit consent
- Document consent (date, method, customer info)
- Provide easy opt-out mechanism
- Respect opt-outs immediately
- Monitor compliance regularly

---

## Summary

**When spam is reported:**
1. Carrier blocks your number
2. Twilio notifies you via email
3. Your account may be suspended
4. Your sender reputation is damaged

**What to do:**
1. Check Twilio Console and email
2. Verify customer consent
3. Contact Twilio support if suspended
4. Fix any compliance issues

**How to prevent:**
1. Always get explicit consent
2. Include opt-out instructions
3. Send relevant, valuable messages
4. Respect STOP requests immediately
5. Monitor delivery rates

**Current status:**
- ✅ Opt-out handling works
- ✅ Opt-out prevention works
- ⚠️ Spam complaint webhook not yet implemented
- ⚠️ Manual monitoring required

---

## Questions?

If you receive a spam complaint and need help:
1. Check this guide first
2. Review Twilio's documentation
3. Contact Twilio support
4. Review your compliance processes

Remember: Prevention is better than cure. Always ensure proper consent and compliance before sending SMS messages.

