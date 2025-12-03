# Enterprise Request Email Notification Setup

## Overview

When a user requests the Enterprise plan, you'll automatically receive an email notification with their details so you can follow up.

## Setup Steps

### 1. Sign Up for Resend

1. Go to https://resend.com
2. Create a free account (3,000 emails/month free)
3. Verify your email address

### 2. Get Your API Key

1. In Resend Dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it "MyRevuHQ Production" (or similar)
4. Copy the API key (starts with `re_...`)

### 3. Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

**For Production:**
```
RESEND_API_KEY=re_your_api_key_here
ADMIN_EMAIL=your-email@myrevuhq.com
RESEND_FROM_EMAIL=MyRevuHQ <onboarding@resend.dev>
```

**For Preview/Development (optional):**
```
RESEND_API_KEY=re_your_api_key_here
ADMIN_EMAIL=your-email@myrevuhq.com
RESEND_FROM_EMAIL=MyRevuHQ <onboarding@resend.dev>
```

### 4. Verify Domain (Optional but Recommended)

For better deliverability and to use your own domain:

1. In Resend Dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain: `myrevuhq.com`
4. Add the DNS records Resend provides to your domain registrar
5. Wait for verification (usually a few minutes)
6. Once verified, update `RESEND_FROM_EMAIL`:
   ```
   RESEND_FROM_EMAIL=MyRevuHQ <no-reply@myrevuhq.com>
   ```

### 5. Redeploy Your Application

After adding environment variables, redeploy:
- Vercel will automatically redeploy on next push, OR
- Go to **Deployments** → Click **Redeploy** on latest deployment

## What You'll Receive

When someone requests Enterprise, you'll get an email with:

- ✅ User's email address
- ✅ Business name (if provided)
- ✅ User ID (for database lookup)
- ✅ Stripe Customer ID (if created)
- ✅ Current subscription tier
- ✅ Account creation date
- ✅ Request timestamp
- ✅ Direct link to Stripe Dashboard (if customer exists)

## Testing

1. Request Enterprise plan as a test user
2. Check your email inbox (and spam folder)
3. Verify all details are correct

## Troubleshooting

**No emails received:**
- Check `RESEND_API_KEY` is set correctly in Vercel
- Check `ADMIN_EMAIL` is set correctly
- Check Resend Dashboard → **Logs** for delivery status
- Check spam/junk folder

**Email fails to send:**
- Check Vercel function logs for errors
- Verify Resend API key is valid
- Check Resend Dashboard for any account issues

**Want to use a different email service?**
- The code is in `api/_utils/email.ts`
- You can replace Resend with SendGrid, Mailgun, or any other service
- Just update the `sendEnterpriseRequestEmail` function

## Cost

- **Resend Free Tier**: 3,000 emails/month
- **Resend Paid**: $20/month for 50,000 emails
- For enterprise notifications, free tier should be plenty!

## Next Steps

After setup:
1. ✅ Test by requesting Enterprise plan
2. ✅ Verify email arrives with correct details
3. ✅ Set up email filters/rules to organize Enterprise requests
4. ✅ Consider adding to a CRM or support system for tracking

