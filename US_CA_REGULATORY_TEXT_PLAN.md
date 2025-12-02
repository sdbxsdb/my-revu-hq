# Plan: Add Regulatory Text for US/CA SMS Messages

## Current Situation
- SMS messages currently have NO regulatory/compliance text at the end
- Twilio requires specific text for US/CA messages: "Msg&data rates may apply. Reply STOP to opt out, HELP for help."
- Code already detects country code (US/CA) - we just need to add the text conditionally

## What We're Changing

### 1. Update `api/send-sms.ts` (Main SMS sending endpoint)
**Location:** After line 189 (after review links are added, before phone number conversion)

**Change:**
- Check if `isoCountryCode === 'US' || isoCountryCode === 'CA'`
- If yes, append regulatory text: `\n\nMsg&data rates may apply. Reply STOP to opt out, HELP for help.`
- If no (UK, IE, other countries), don't add anything (keep current behavior)

**Code location:** Around line 189-190, after review links are added

### 2. Update `supabase/functions/send-scheduled-sms/index.ts` (Scheduled SMS cron job)
**Location:** Same place - after building message body, before sending

**Change:**
- Same logic - check country code and add regulatory text for US/CA only
- This ensures scheduled messages also get the compliance text

## Exact Text to Add (Twilio's Required Format)
```
Msg&data rates may apply. Reply STOP to opt out, HELP for help.
```

**Note:** This is slightly different from what we might have had before. Twilio's exact format uses:
- "Msg&data" (not "Msg & Data")
- "Reply STOP to opt out" (not "Reply STOP to unsubscribe")
- "HELP for help" (not "Text HELP")

## Implementation Details

### Where to detect country:
- Already detected at line 205-206: `const parsed = parsePhoneNumberFromString(phoneNumber); const isoCountryCode = parsed?.country || countryCode;`
- We can use this `isoCountryCode` variable

### When to add text:
- After all message content is built (name, template, job description, review links)
- Before sending to Twilio
- Only for US/CA customers

### Example Message Output:

**US/CA Customer:**
```
Hi John,

Thanks for choosing ABC Plumbing. Please rate your recent service: https://g.page/r/ABC123/review

Msg&data rates may apply. Reply STOP to opt out, HELP for help.
```

**UK/IE Customer (no change):**
```
Hi John,

Thanks for choosing ABC Plumbing. Please rate your recent service: https://g.page/r/ABC123/review
```

## Files to Modify

1. ✅ `api/send-sms.ts` - Add regulatory text for US/CA
   - **Note:** Scheduled SMS calls this same endpoint, so no changes needed to `supabase/functions/send-scheduled-sms/index.ts`

## Testing Considerations

- Test with US phone number → should see regulatory text
- Test with CA phone number → should see regulatory text  
- Test with UK phone number → should NOT see regulatory text
- Test with IE phone number → should NOT see regulatory text
- Test with other countries → should NOT see regulatory text

## Why This Approach?

1. **Compliance:** Meets Twilio's A2P 10DLC requirements for US/CA
2. **Non-intrusive:** Only adds text where legally required
3. **Consistent:** Same logic in both regular and scheduled SMS
4. **Exact format:** Uses Twilio's exact required text format

---

## Ready to Implement?

This is a straightforward change:
- Add conditional check for US/CA
- Append regulatory text if country is US/CA
- Apply to both regular and scheduled SMS endpoints

Let me know if you want me to proceed!

