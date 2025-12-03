# Documentation Required for Spam Complaints

When someone reports your SMS as spam, you'll need to provide evidence to Twilio and/or regulators proving that:
1. The recipient gave consent to receive messages
2. You have an existing business relationship
3. The message was transactional/informational (not promotional)
4. You provided opt-out mechanisms

---

## What You Need to Provide

### 1. **Customer Record & Business Relationship Evidence**

#### ✅ What We Currently Store (Available):
- **Customer Name** (`customers.name`)
- **Phone Number** (`customers.phone` - country code + number)
- **Job Description** (`customers.job_description`) - **This is KEY evidence of business relationship**
- **Date Customer Added** (`customers.created_at`) - Shows when relationship started
- **Date SMS Sent** (`customers.sent_at`) - Shows when message was sent
- **Message Count** (`customers.sms_request_count`) - Shows how many messages sent (max 3)
- **Opt-Out Status** (`customers.opt_out`) - Shows if they opted out

#### ✅ What We Store in Messages Table:
- **Full Message Content** (`messages.body`) - Exact text sent
- **Message Timestamp** (`messages.sent_at`) - When message was sent
- **Twilio Message SID** (`messages.twilio_message_sid`) - For Twilio verification
- **Delivery Status** (`messages.delivery_status`) - Shows delivery confirmation

#### ✅ What We Store in Users Table:
- **Business Name** (`users.business_name`) - Your business identity
- **Account Created Date** (`users.created_at`) - Shows account age
- **SMS Template** (`users.sms_template`) - Shows message content policy

---

### 2. **Consent Documentation** (CRITICAL)

#### ⚠️ What's Currently Missing (You Need to Document):

**Consent Method & Date:**
- How consent was obtained (verbal, written, form, etc.)
- When consent was obtained (date/time)
- What the customer was told about receiving SMS
- Evidence of consent (screenshot, form, notes, etc.)

**Recommended: Add to Database:**
```sql
-- Suggested migration to add consent tracking
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS consent_method TEXT, -- 'verbal', 'written', 'form', 'email'
ADD COLUMN IF NOT EXISTS consent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS consent_notes TEXT; -- What was said/agreed to
```

**For Now: Document Externally:**
- Keep records of how/when consent was obtained
- Store in CRM, notes, or separate documentation system
- Include: date, method, what was communicated

---

### 3. **Message Content Evidence**

#### ✅ What to Provide:

1. **Exact Message Sent:**
   - Copy from `messages.body` in database
   - Include full text including regulatory text
   - Show it's transactional (review request, not promotional)

2. **Message Context:**
   - Show it relates to a specific service/job (`job_description`)
   - Show it was sent after service completion (`sent_at` vs `created_at`)
   - Show it's informational (review request, not sales pitch)

3. **Regulatory Compliance:**
   - Show opt-out instructions included ("Reply STOP to opt out")
   - Show HELP instructions included ("Reply HELP for help")
   - Show regulatory text for US/CA ("Msg&data rates may apply")

---

### 4. **Business Relationship Evidence**

#### ✅ What to Provide:

1. **Service Relationship:**
   - **Job Description** (`customers.job_description`) - **This is your strongest evidence**
   - Shows customer received a service
   - Shows specific work was completed
   - Example: "Kitchen renovation", "Plumbing repair", "Garden landscaping"

2. **Timeline:**
   - **Customer Added Date** (`customers.created_at`) - When relationship started
   - **SMS Sent Date** (`customers.sent_at`) - When message was sent
   - Shows message was sent after service (not cold outreach)

3. **Message Frequency:**
   - **Request Count** (`customers.sms_request_count`) - Shows max 3 messages
   - Shows you're not spamming (limited to 3 per customer)
   - Shows compliance with your own policy

---

### 5. **Opt-Out Mechanism Evidence**

#### ✅ What to Provide:

1. **Opt-Out Instructions:**
   - Show message includes: "Reply STOP to opt out"
   - Show message includes: "Reply HELP for help"
   - Show regulatory text for US/CA

2. **Opt-Out Handling:**
   - Show `opt_out` status in database
   - Show webhook handler processes STOP keywords
   - Show system prevents sending to opted-out customers

3. **Opt-Out Response:**
   - Show automatic confirmation sent when STOP received
   - Show customer was immediately unsubscribed

---

## Sample Documentation Package

When responding to a spam complaint, provide:

### Package 1: Customer Record Export

```json
{
  "customer": {
    "id": "abc-123-def-456",
    "name": "John Smith",
    "phone": {
      "countryCode": "44",
      "number": "07780586444"
    },
    "job_description": "Kitchen renovation - completed 15 Nov 2024",
    "created_at": "2024-11-10T10:00:00Z",
    "sent_at": "2024-11-15T14:30:00Z",
    "sms_request_count": 1,
    "opt_out": false
  },
  "message": {
    "id": "msg-123",
    "body": "Hi John Smith,\n\nYou recently had ABC Plumbing for work. We'd greatly appreciate a review on one or all of the following links:\n\nGoogle: https://g.page/r/ABCPlumbing/review\n\nMsg&data rates may apply. Reply STOP to opt out, HELP for help.",
    "sent_at": "2024-11-15T14:30:00Z",
    "twilio_message_sid": "SM123abc456def789",
    "delivery_status": "delivered"
  },
  "business": {
    "name": "ABC Plumbing",
    "account_created": "2024-01-15T09:00:00Z"
  }
}
```

### Package 2: Consent Documentation

**Template:**
```
CONSENT RECORD - Customer: John Smith
Phone: +44 7780 586444
Date: 10 November 2024
Method: Verbal consent at time of service
Context: Customer provided phone number when booking kitchen renovation
Consent Statement: "I asked the customer if they would like to receive a review request SMS after the work is completed. Customer agreed and provided their mobile number."
Witness: [Your name/employee name]
```

### Package 3: Business Relationship Evidence

**Template:**
```
BUSINESS RELATIONSHIP EVIDENCE
- Service Provided: Kitchen renovation
- Service Date: 10-15 November 2024
- Customer: John Smith
- Phone: +44 7780 586444
- Invoice/Work Order: [Reference number if available]
- Payment Received: [Date/amount if available]
- SMS Sent: 15 November 2024 (after service completion)
```

### Package 4: Message Compliance Evidence

**Template:**
```
MESSAGE COMPLIANCE CHECKLIST
✅ Message is transactional (review request, not promotional)
✅ Message relates to specific service (kitchen renovation)
✅ Message sent after service completion
✅ Includes opt-out instructions ("Reply STOP to opt out")
✅ Includes HELP instructions ("Reply HELP for help")
✅ Includes regulatory text (US/CA: "Msg&data rates may apply")
✅ Limited to 3 messages per customer (currently sent: 1)
✅ Customer has not opted out
```

---

## How to Generate Documentation from Database

### SQL Query to Export Customer Record:

```sql
SELECT 
  c.id AS customer_id,
  c.name AS customer_name,
  c.phone->>'countryCode' AS country_code,
  c.phone->>'number' AS phone_number,
  c.job_description,
  c.created_at AS customer_added_date,
  c.sent_at AS sms_sent_date,
  c.sms_request_count,
  c.opt_out,
  u.business_name,
  u.created_at AS account_created_date,
  m.body AS message_content,
  m.sent_at AS message_sent_at,
  m.twilio_message_sid,
  m.delivery_status
FROM customers c
JOIN users u ON c.user_id = u.id
LEFT JOIN messages m ON m.customer_id = c.id
WHERE c.phone->>'number' = '07780586444' -- Replace with reported phone number
ORDER BY m.sent_at DESC
LIMIT 1;
```

### Export Format (CSV/JSON):

Run the query above and export as:
- CSV for easy reading
- JSON for programmatic processing
- PDF for formal submission

---

## What to Include in Your Response to Twilio

### Email Template:

```
Subject: Spam Complaint Response - Message SID: SM123abc456def789

Dear Twilio Support,

I am writing in response to the spam complaint received for message SID: SM123abc456def789.

I can provide evidence that this message was sent with proper consent and complies with all regulations:

1. BUSINESS RELATIONSHIP:
   - Customer: [Name]
   - Service Provided: [Job Description]
   - Service Date: [Date]
   - Message Sent: [Date] (after service completion)

2. CONSENT OBTAINED:
   - Method: [Verbal/Written/Form]
   - Date: [Date]
   - Details: [What was communicated]

3. MESSAGE COMPLIANCE:
   - Message Type: Transactional (review request)
   - Includes Opt-Out: Yes ("Reply STOP to opt out")
   - Includes HELP: Yes ("Reply HELP for help")
   - Regulatory Text: Yes (for US/CA)
   - Message Count: [X] of 3 maximum

4. OPT-OUT MECHANISM:
   - System processes STOP keywords automatically
   - Customer can opt out at any time
   - Opted-out customers are blocked from receiving messages

I have attached:
- Customer record export (JSON)
- Consent documentation
- Message content
- Business relationship evidence

Please let me know if you need any additional information.

Best regards,
[Your Name]
[Your Business Name]
[Your Contact Information]
```

---

## What Regulators Need (FCC/TCPA - US Only)

### Required Documentation:

1. **Express Written Consent:**
   - Signed form or electronic signature
   - Clear disclosure of SMS messaging
   - Opt-in checkbox (unchecked by default)
   - Date and time of consent

2. **Business Relationship:**
   - Invoice or work order
   - Service completion date
   - Payment receipt
   - Customer contact information

3. **Message Content:**
   - Full text of message sent
   - Proof it's transactional (not promotional)
   - Proof it relates to the service provided

4. **Opt-Out Mechanism:**
   - Evidence of opt-out instructions
   - Evidence of opt-out processing
   - Evidence customer can unsubscribe

---

## Current Gaps & Recommendations

### ⚠️ Missing from Current System:

1. **Consent Tracking:**
   - No `consent_method` field
   - No `consent_date` field
   - No `consent_notes` field

2. **Consent Documentation:**
   - No way to upload/store consent forms
   - No way to link consent to customer record
   - No consent audit trail

### ✅ Recommendations:

1. **Add Consent Fields to Database:**
   ```sql
   ALTER TABLE customers
   ADD COLUMN IF NOT EXISTS consent_method TEXT,
   ADD COLUMN IF NOT EXISTS consent_date TIMESTAMP WITH TIME ZONE,
   ADD COLUMN IF NOT EXISTS consent_notes TEXT;
   ```

2. **Update Add Customer Form:**
   - Add field to record consent method
   - Add field to record consent date
   - Add field for consent notes

3. **Create Consent Documentation Template:**
   - Provide template for users to document consent
   - Store externally (CRM, notes, etc.)
   - Link to customer record

4. **Add Export Functionality:**
   - Create admin tool to export customer records
   - Include all consent and relationship data
   - Format for Twilio/regulator submission

---

## Quick Response Checklist

When you receive a spam complaint:

- [ ] **Immediately:** Check Twilio Console for complaint details
- [ ] **Within 24 hours:** Gather customer record from database
- [ ] **Within 24 hours:** Gather message content from database
- [ ] **Within 24 hours:** Document consent method/date (if not in DB)
- [ ] **Within 48 hours:** Prepare documentation package
- [ ] **Within 48 hours:** Respond to Twilio with evidence
- [ ] **Ongoing:** Monitor for additional complaints
- [ ] **Ongoing:** Review and improve consent process

---

## Summary

**What You Currently Have:**
- ✅ Customer records (name, phone, job description)
- ✅ Message content and timestamps
- ✅ Business relationship evidence (job description)
- ✅ Opt-out status tracking
- ✅ Message count tracking

**What You Need to Provide:**
- ✅ Customer record export (SQL query above)
- ✅ Message content (from `messages` table)
- ✅ Business relationship evidence (job description)
- ⚠️ Consent documentation (may need to document externally)
- ✅ Opt-out mechanism evidence (from Terms & webhook)

**What's Missing (Recommended to Add):**
- ⚠️ Consent method tracking
- ⚠️ Consent date tracking
- ⚠️ Consent notes/documentation

**Action Items:**
1. Use SQL query to export customer records when needed
2. Document consent externally until DB fields are added
3. Prepare response template (email above)
4. Consider adding consent tracking fields to database

---

## Questions?

If you receive a spam complaint:
1. Export customer record using SQL query
2. Gather message content from database
3. Document consent method/date (if not in DB)
4. Prepare response using email template
5. Submit to Twilio within 48 hours

Remember: The stronger your documentation, the better your defense against spam complaints.

