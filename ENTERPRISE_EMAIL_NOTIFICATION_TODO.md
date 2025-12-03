# Enterprise Invoice Request Email Notification - TODO

## What Needs to Be Done

When a user requests an invoice (Enterprise tier), we need to send an email notification to admin/support team.

## Current State

- ✅ Invoice request is saved to database (`stripe_customer_id` is stored)
- ❌ No email notification sent
- ❌ Admin has to manually check database

## Implementation Options

### Option 1: Use Resend (Recommended - Modern & Simple)

**Pros:**
- Modern API-first service
- Easy to set up
- Good deliverability
- Free tier: 3,000 emails/month

**Setup Steps:**

1. **Sign up for Resend:**
   - Go to https://resend.com
   - Create account
   - Get API key from dashboard

2. **Add to Vercel Environment Variables:**
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ADMIN_EMAIL=your-email@myrevuhq.com
   ```

3. **Install Resend SDK:**
   ```bash
   yarn add resend
   ```

4. **Create email utility** (`api/_utils/email.ts`):
   ```typescript
   import { Resend } from 'resend';

   const resend = new Resend(process.env.RESEND_API_KEY);

   export async function sendEnterpriseInvoiceRequestEmail(
     userEmail: string,
     userName: string | null,
     businessName: string | null,
     userId: string
   ) {
     const adminEmail = process.env.ADMIN_EMAIL || 'support@myrevuhq.com';
     
     await resend.emails.send({
       from: 'MyRevuHQ <no-reply@myrevuhq.com>',
       to: adminEmail,
       subject: `New Enterprise Invoice Request - ${businessName || userEmail}`,
       html: `
         <h2>New Enterprise Invoice Request</h2>
         <p><strong>User Email:</strong> ${userEmail}</p>
         <p><strong>User Name:</strong> ${userName || 'N/A'}</p>
         <p><strong>Business Name:</strong> ${businessName || 'N/A'}</p>
         <p><strong>User ID:</strong> ${userId}</p>
         <p><strong>Requested At:</strong> ${new Date().toISOString()}</p>
         <hr>
         <p>Please set up invoice billing for this customer in Stripe.</p>
       `,
     });
   }
   ```

5. **Update `api/billing/[...route].ts`** in `handleRequestInvoice`:
   ```typescript
   import { sendEnterpriseInvoiceRequestEmail } from '../_utils/email';
   
   // After saving stripe_customer_id, send email:
   await sendEnterpriseInvoiceRequestEmail(
     auth.userEmail,
     userData?.business_name || null,
     userData?.business_name || null,
     auth.userId
   );
   ```

### Option 2: Use Supabase Edge Function (If Already Using Supabase)

You could create a Supabase Edge Function that sends emails, but Resend is simpler for this use case.

### Option 3: Use SendGrid (Alternative)

Similar to Resend but more established. Free tier: 100 emails/day.

## What Information to Include in Email

- User email address
- User name / business name
- User ID (for database lookup)
- Timestamp of request
- Link to Stripe customer (if available)

## Testing

After implementation:
1. Request invoice as Enterprise user
2. Check admin email inbox
3. Verify email contains all necessary information
4. Test error handling (what if email fails to send?)

## Error Handling

- If email fails to send, log error but don't fail the request
- User should still see success message
- Log email failures for debugging

