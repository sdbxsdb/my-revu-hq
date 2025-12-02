# Twilio A2P 10DLC Campaign Registration - Complete Form Guide

Based on Twilio's email guidance, here's exactly what to put in each field:

---

## 1. A2P Brand
**Field:** A2P Brand
**Value:** `MYREVUHQ LTD` (should already be selected)

---

## 2. Available A2P Campaign use cases
**Field:** Available A2P Campaign use cases
**Value:** `Low Volume Mixed` (should already be selected)

---

## 3. Messaging Service
**Field:** Messaging Service
**Option:** Select "Create new Messaging Service"
- This will create a new messaging service automatically with campaign registration

---

## 4. Campaign Description
**Field:** Campaign description
**Paste this:**

```
MyRevuHQ enables business owners to send informational SMS messages requesting customer feedback after service completion. Messages are sent only after a service has been completed and are strictly informational - requesting feedback about the service the customer just received. No marketing or promotional content is included. This qualifies as "Prior Relationship - Informational" messaging under A2P 10DLC guidelines.
```

---

## 5. Sample Message #1
**Field:** Sample message #1
**Paste this:**

```
Hi John, thanks for choosing ABC Plumbing. Please rate your recent service: https://g.page/r/ABC123XYZ/review. Msg&data rates may apply. Reply STOP to opt out, HELP for help.
```

---

## 6. Sample Message #2
**Field:** Sample message #2
**Paste this:**

```
Hi Sarah, thanks for choosing XYZ Electricians. Please rate your recent service: https://g.page/r/XYZ789ABC/review. Msg&data rates may apply. Reply STOP to opt out, HELP for help.
```

---

## 7. Message Contents Checkboxes
**Field:** Message contents
**Check these boxes:**
- ✅ **"Messages will include embedded links."** (CHECKED - you include review links)
- ❌ "Messages will include phone numbers." (UNCHECKED)
- ❌ "Messages include content related to direct lending..." (UNCHECKED)
- ❌ "Messages include age-gated content..." (UNCHECKED)

---

## 8. How do end-users consent to receive messages?
**Field:** How do end-users consent to receive messages? (40-2048 characters)
**Paste this EXACT text (Twilio's required language):**

```
Customers provide their mobile number directly to the business owner at the time of service. The message sent is strictly informational and relates only to the service the customer just received. No marketing or promotional content is included. The customer's action of receiving the service establishes a prior business relationship, and providing their number constitutes consent to receive a single service-related review request. All messages include STOP/HELP instructions. The customer does not interact directly with MyRevuHQ.
```

---

## 9. Opt-In Image URL
**Field:** Opt-In Image URL
**What to do:**
1. Take a screenshot of your "Add Customer" form page (`/customers/add`)
2. Make sure it shows:
   - The form title "Add Customer"
   - The phone number input field (this is where businesses collect customer numbers)
   - The name field
   - The job description field
3. Save as PDF or image
4. Upload to Google Drive or OneDrive
5. Make it publicly accessible (anyone with link can view)
6. Copy the public link
7. Paste the link in this field

**What the screenshot proves:** It shows where business owners collect customer phone numbers, which demonstrates the "prior relationship" consent model.

---

## 10. Opt-In Keywords
**Field:** Opt-In Keywords (max 255 characters)
**Value:** Leave this BLANK
- You don't support opt-in via text keywords
- Customers provide consent when they give their phone number to the business owner

---

## 11. Opt-In Message
**Field:** Opt-In Message (20-320 characters)
**Value:** Leave this BLANK
- You don't support opt-in via text keywords
- Customers provide consent when they give their phone number to the business owner

---

## 12. Opt-Out Keywords
**Field:** Opt-Out Keywords
**Value:** `STOP, CANCEL, UNSUBSCRIBE, QUIT, END, REVOKE, STOPALL, OPTOUT`

---

## 13. Opt-Out Message
**Field:** Opt-Out Message
**Value:**

```
You have successfully been unsubscribed. You will not receive any more messages from this number. Reply START to resubscribe.
```

---

## 14. Help Keywords
**Field:** Help Keywords
**Value:** `HELP, INFO`

---

## 15. Help Message
**Field:** Help Message
**Value:**

```
Reply STOP to unsubscribe. Msg&Data Rates May Apply. Support: myrevuhq@gmail.com Privacy: https://www.myrevuhq.com/privacy Terms: https://www.myrevuhq.com/terms
```

---

## Important Notes

### ✅ DO:
- Use Twilio's EXACT consent language (field #8)
- Use the compliant sample message format (fields #5 and #6)
- Include the screenshot link showing where phone numbers are collected
- Check "Messages will include embedded links" (you include review links)
- Leave opt-in keywords/message blank (you don't use text-to-opt-in)

### ❌ DON'T:
- Don't mention "express written consent" - you're using "Prior Relationship - Informational"
- Don't add promotional content to sample messages
- Don't check boxes that don't apply
- Don't leave the consent field vague - use Twilio's exact language

---

## Summary Checklist

Before submitting, verify:
- [ ] Campaign description frames as "Prior Relationship - Informational"
- [ ] Consent explanation uses Twilio's EXACT language
- [ ] Sample messages use Twilio's format: "Hi [NAME], thanks for choosing [BUSINESS]. Please rate your recent service: [LINK]. Msg&data rates may apply. Reply STOP to opt out, HELP for help."
- [ ] "Messages will include embedded links" is CHECKED
- [ ] Opt-In Image URL has screenshot link to Add Customer form
- [ ] Opt-In Keywords and Message are BLANK
- [ ] Opt-Out and Help keywords/messages are filled in

---

## After Submission

Once submitted:
1. Wait for Twilio review (usually 1-3 business days)
2. If rejected again, check the rejection reason and adjust accordingly
3. Once approved, your US/CA messages will work properly

Good luck! 🚀

