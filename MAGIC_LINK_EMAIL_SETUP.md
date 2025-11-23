# Magic Link Email Customization Setup

## Overview

By default, Supabase sends magic link emails from `noreply@mail.app.supabase.io`. To customize the sender address and email content, you need to configure a custom SMTP server and email templates in the Supabase Dashboard.

## Step 1: Set Up Custom SMTP Server

This changes the "from" email address so emails appear to come from your email address instead of Supabase.

### Option A: Use Gmail (Quick Setup)

You can use a Gmail account (e.g., `myrevuhq@gmail.com`) for the SMTP server. This is the quickest option but has some limitations (see below).

**Setup Steps:**

1. **Enable 2-Factor Authentication on your Gmail account:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification if not already enabled
   - This is required to generate an App Password

2. **Generate an App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other (Custom name)" as the device
   - Enter "MyRevuHQ Supabase" as the name
   - Click "Generate"
   - **Copy the 16-character password** (you'll need this for Supabase)

3. **Configure in Supabase:**
   - Go to your Supabase Dashboard: https://supabase.com/dashboard
   - Navigate to **Authentication** → **Settings**
   - Scroll down to **SMTP Configuration**
   - Enable **Enable Custom SMTP**
   - Enter these Gmail SMTP settings:
     - **SMTP Host**: `smtp.gmail.com`
     - **SMTP Port**: `587` (use TLS)
     - **SMTP User**: Your full Gmail address (e.g., `myrevuhq@gmail.com`)
     - **SMTP Password**: The 16-character App Password you generated (not your regular Gmail password)
     - **Sender Name**: `MyRevuHQ` (or whatever you prefer)
     - **Sender Email**: `myrevuhq@gmail.com` (your Gmail address)
   - Click **Save**

**Gmail Limitations:**

- ⚠️ **Sending Limits**: Free Gmail accounts can send up to 500 emails per day
- ⚠️ **Professional Appearance**: Emails will come from `@gmail.com` instead of your custom domain
- ⚠️ **Deliverability**: May be more likely to go to spam folders
- ✅ **Cost**: Free
- ✅ **Easy Setup**: Quick to configure

**For Production/High Volume:**
If you expect to send more than 500 emails per day or want a more professional appearance, consider using a custom domain with Google Workspace or a dedicated email service (see Option B below).

### Option B: Use a Service Like SendGrid, Mailgun, or AWS SES

1. **Sign up for an SMTP service:**
   - [SendGrid](https://sendgrid.com/) - Free tier: 100 emails/day
   - [Mailgun](https://www.mailgun.com/) - Free tier: 5,000 emails/month
   - [AWS SES](https://aws.amazon.com/ses/) - Very affordable, pay-as-you-go
   - [Resend](https://resend.com/) - Modern API-first service

2. **Get your SMTP credentials:**
   - SMTP Host (e.g., `smtp.sendgrid.net`)
   - SMTP Port (usually `587` for TLS or `465` for SSL)
   - SMTP Username
   - SMTP Password
   - Sender Email (e.g., `no-reply@myrevuhq.com`)
   - Sender Name (e.g., `MyRevuHQ`)

3. **Configure in Supabase:**
   - Go to your Supabase Dashboard: https://supabase.com/dashboard
   - Navigate to **Authentication** → **Settings**
   - Scroll down to **SMTP Configuration**
   - Enable **Enable Custom SMTP**
   - Enter your SMTP details:
     - **SMTP Host**: Your SMTP server hostname
     - **SMTP Port**: Usually `587` (TLS) or `465` (SSL)
     - **SMTP User**: Your SMTP username
     - **SMTP Password**: Your SMTP password
     - **Sender Name**: The name that appears in the "from" field (e.g., `MyRevuHQ`)
     - **Sender Email**: The email address that appears in the "from" field (e.g., `no-reply@myrevuhq.com`)
   - Click **Save**

### Option B: Use Your Own Email Server

If you have your own email server, use its SMTP settings instead.

## Step 2: Customize the Magic Link Email Template

This changes the email content, subject line, and styling.

1. **Go to Email Templates:**
   - In Supabase Dashboard, navigate to **Authentication** → **Email Templates**
   - Click on **Magic Link** template

2. **Customize the Subject Line:**

   ```
   Sign in to MyRevuHQ
   ```

3. **Customize the Email Body:**

   You can use HTML and the following template variables:
   - `{{ .ConfirmationURL }}` - The magic link URL
   - `{{ .SiteURL }}` - Your application's site URL
   - `{{ .Token }}` - A 6-digit OTP code (alternative to clicking the link)
   - `{{ .Email }}` - The user's email address

   **Example Custom Template:**

   ```html
   <h2>Welcome to MyRevuHQ!</h2>
   <p>Click the button below to sign in to your account:</p>
   <p>
     <a
       href="{{ .ConfirmationURL }}"
       style="background-color: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;"
     >
       Sign In to MyRevuHQ
     </a>
   </p>
   <p>Or copy and paste this link into your browser:</p>
   <p style="word-break: break-all;">{{ .ConfirmationURL }}</p>
   <p>This link will expire in 1 hour.</p>
   <p>If you didn't request this email, you can safely ignore it.</p>
   <hr />
   <p style="color: #666; font-size: 12px;">
     © MyRevuHQ - Helping businesses grow with better reviews
   </p>
   ```

4. **Click Save** to apply your changes

## Step 3: Test the Customized Email

1. Go to your login page
2. Enter your email address
3. Click "Send Magic Link"
4. Check your email inbox
5. Verify:
   - ✅ Email comes from your custom sender address (not Supabase)
   - ✅ Email has your custom subject line
   - ✅ Email has your custom content and styling
   - ✅ Magic link works correctly

## Quick Setup with Resend (Recommended)

Resend is a modern email service that's easy to set up:

1. **Sign up:** https://resend.com
2. **Verify your domain** (optional but recommended for better deliverability)
3. **Get SMTP credentials:**
   - Go to **Settings** → **SMTP**
   - Use these settings:
     - **Host**: `smtp.resend.com`
     - **Port**: `587`
     - **Username**: `resend`
     - **Password**: Your Resend API key
     - **Sender Email**: `no-reply@yourdomain.com` (or use Resend's default)
     - **Sender Name**: `MyRevuHQ`

4. **Enter these in Supabase SMTP settings**

## Troubleshooting

**Emails not sending:**

- Check SMTP credentials are correct
- Verify SMTP port (587 for TLS, 465 for SSL)
- Check if your email service requires domain verification
- Check Supabase logs in Dashboard → Logs → Auth

**Emails going to spam:**

- Verify your domain with your SMTP provider
- Set up SPF and DKIM records for your domain
- Use a professional sender name and email address

**Template variables not working:**

- Make sure you're using the exact variable names: `{{ .ConfirmationURL }}`
- Variables are case-sensitive
- Check Supabase documentation for available variables

## Notes

- Custom SMTP is required to change the "from" address
- Email templates can be customized even without custom SMTP
- Changes take effect immediately (no deployment needed)
- You can preview templates in the Supabase Dashboard before saving
