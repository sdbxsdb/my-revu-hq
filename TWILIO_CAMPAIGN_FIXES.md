# Twilio Campaign Fixes - Step by Step Plan

Based on Twilio's feedback, here's what needs to be changed:

## Summary of Changes Needed

1. **Campaign Description** - Update to clarify "Prior Relationship - Informational" messaging
2. **Consent Explanation** - Use Twilio's exact provided language
3. **Create Opt-In Screenshot** - Screenshot of Add Customer form (where phone numbers are collected)
4. **Update Sample Messages** - Use Twilio's compliant format
5. **Update SMS Message Template** - Ensure messages match Twilio's format

---

## Step 1: Update Campaign Description

**Current:** "MyRevuHQ is a platform that allows local businesses to request customer reviews through SMS..."

**New:** Frame it as "Prior Relationship - Informational" messaging:

```
MyRevuHQ enables business owners to send informational SMS messages requesting customer feedback after service completion. Messages are sent only after a service has been completed and are strictly informational - requesting feedback about the service the customer just received. No marketing or promotional content is included. This qualifies as "Prior Relationship - Informational" messaging under A2P 10DLC guidelines.
```

---

## Step 2: Update Consent Explanation (Use Twilio's Exact Language)

**Copy/paste this into the "How do end-users consent to receive messages?" field:**

```
Customers provide their mobile number directly to the business owner at the time of service. The message sent is strictly informational and relates only to the service the customer just received. No marketing or promotional content is included. The customer's action of receiving the service establishes a prior business relationship, and providing their number constitutes consent to receive a single service-related review request. All messages include STOP/HELP instructions. The customer does not interact directly with MyRevuHQ.
```

---

## Step 3: Create Opt-In Screenshot

**What to screenshot:**
- The "Add Customer" form in MyRevuHQ
- This shows where business owners collect customer phone numbers
- Should show: Name field, Phone Number field, Job Description field

**Steps:**
1. Take a screenshot of the Add Customer page (`/customers/add`)
2. Make sure it shows the phone number input field clearly
3. Save as PDF or image
4. Upload to Google Drive or OneDrive
5. Make it publicly accessible (anyone with link can view)
6. Copy the public link

**What the screenshot should show:**
- Form title: "Add Customer"
- Phone number input field (this is where businesses collect customer numbers)
- Name field
- Job description field (shows it's service-related)

---

## Step 4: Update Sample Messages (Use Twilio's Format)

**Twilio's Required Format:**
```
Hi [CUSTOMER], thanks for choosing [BUSINESS NAME]. Please rate your recent service: [LINK]. Msg&data rates may apply. Reply STOP to opt out, HELP for help.
```

**Update Sample Message #1:**
```
Hi John, thanks for choosing ABC Plumbing. Please rate your recent service: https://g.page/r/ABC123XYZ/review. Msg&data rates may apply. Reply STOP to opt out, HELP for help.
```

**Update Sample Message #2:**
```
Hi Sarah, thanks for choosing XYZ Electricians. Please rate your recent service: https://g.page/r/XYZ789ABC/review. Msg&data rates may apply. Reply STOP to opt out, HELP for help.
```

**Update Sample Message #3:**
```
Hi Mike, thanks for choosing Smith Contractors. Please rate your recent service: https://g.page/r/SMITH456/review. Msg&data rates may apply. Reply STOP to opt out, HELP for help.
```

---

## Step 5: Update SMS Message Template in Code

**Current format** (in `api/send-sms.ts`):
- May include multiple review links
- May have different opt-out language

**New format** (to match Twilio's requirements):
- Single review link (or primary link)
- Exact opt-out language: "Msg&data rates may apply. Reply STOP to opt out, HELP for help."

**Note:** We need to check if we should update the actual SMS template or just the sample messages. Twilio is reviewing the sample messages, but we should ensure real messages are also compliant.

---

## Step 6: Message Contents Checkboxes

**Verify these are checked:**
- ✅ "Messages will include embedded links" (checked)
- ❌ "Messages will include phone numbers" (unchecked - unless you include phone numbers)
- ❌ "Messages include content related to direct lending..." (unchecked)
- ❌ "Messages include age-gated content..." (unchecked)

---

## Action Items Checklist

- [ ] Update Campaign Description in Twilio console
- [ ] Update "How do end-users consent" field with Twilio's exact language
- [ ] Take screenshot of Add Customer form
- [ ] Upload screenshot to Google Drive/OneDrive (make public)
- [ ] Add screenshot link to "Opt-In Image URL" field in Twilio
- [ ] Update Sample Message #1 with Twilio's format
- [ ] Update Sample Message #2 with Twilio's format
- [ ] Update Sample Message #3 with Twilio's format
- [ ] Verify Message Contents checkboxes are correct
- [ ] Resubmit campaign

---

## Important Notes

1. **Stay Informational Only:** If you ever add promotional content (discounts, upsells, etc.), you'll need express written consent with an unchecked box. Keep it strictly review requests.

2. **The screenshot is critical:** This is what Twilio reviewers need to see to verify how phone numbers are collected. Make sure it's clear and shows the phone number field.

3. **Sample messages must match real messages:** The sample messages you submit should be representative of what actually gets sent. If your real messages are different, update them to match.

4. **Opt-out must be included:** Every message must include "Reply STOP to opt out, HELP for help."

---

## Next Steps

Once you've completed all the steps above, resubmit the campaign. The key changes are:
1. Using Twilio's exact consent language
2. Providing the screenshot proof
3. Using compliant sample message format

Let me know when you're ready to implement Step 5 (updating the actual SMS template in code) if needed!

