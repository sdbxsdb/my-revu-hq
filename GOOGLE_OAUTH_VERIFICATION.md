# Google OAuth Verification - Step by Step Guide

You need to fix two issues:

1. **Verify domain ownership** of `https://www.myrevuhq.com`
2. **Add privacy policy link** to your homepage

## Issue 1: Verify Domain Ownership

### Step 1: Go to Google Search Console

1. Navigate to [Google Search Console](https://search.google.com/search-console)
2. Sign in with the same Google account you used for OAuth setup

### Step 2: Add Your Property (Domain)

1. Click **"Add Property"** (or use the property dropdown)
2. Select **"Domain"** (not URL prefix)
3. Enter: `myrevuhq.com` (without www or https)
4. Click **"Continue"**

### Step 3: Verify Domain Ownership

Google will give you several verification options. Choose the **DNS verification** method:

1. **Copy the TXT record** that Google provides (it will look like: `google-site-verification=xxxxx`)
2. **Add it to your DNS** at your domain registrar (where you bought `myrevuhq.com`):
   - Go to your domain registrar (e.g., Namecheap, GoDaddy, etc.)
   - Find DNS management for `myrevuhq.com`
   - Add a new **TXT record**:
     - **Name/Host**: `@` or leave blank (depends on your registrar)
     - **Type**: `TXT`
     - **Value**: Paste the verification string from Google
     - **TTL**: `3600` (or default)
   - **Save** the DNS record

### Step 4: Verify in Google Search Console

1. Go back to Google Search Console
2. Click **"Verify"**
3. Wait a few minutes for DNS to propagate (can take up to 48 hours, but usually 5-30 minutes)
4. Once verified, you'll see a success message

**Note:** If verification fails, wait a bit longer for DNS propagation, then try again.

## Issue 2: Add Privacy Policy Link to Homepage

### Step 1: Update the About Page

The About page (`/about`) is your homepage. We need to add a privacy policy link.

1. The About page should already have a link to `/privacy` in the footer or somewhere visible
2. If not, we'll add it (see code changes below)

### Step 2: Verify the Link is Visible

1. Visit `https://www.myrevuhq.com/about` (or just `https://www.myrevuhq.com` if that's your homepage)
2. Make sure there's a visible link to `https://www.myrevuhq.com/privacy`
3. The link should be easily accessible (not hidden in a menu)

## Step 3: Reply to Google's Email

Once you've completed both steps:

1. **Reply directly to the email** from `api-oauth-dev-verification-reply@google.com`
2. **Confirm** that you've:
   - Verified domain ownership in Google Search Console
   - Added a privacy policy link to your homepage
3. **Wait for Google's response** (usually 1-3 business days)

## Quick Checklist

- [ ] Added TXT record to DNS for domain verification
- [ ] Verified domain in Google Search Console
- [ ] Added privacy policy link to homepage (`/about` page)
- [ ] Verified link is visible and accessible
- [ ] Replied to Google's verification email

## Troubleshooting

**DNS verification not working?**

- Wait 24-48 hours for DNS propagation
- Check DNS records using: https://dnschecker.org
- Make sure you added the TXT record at the root domain level

**Privacy policy link not showing?**

- Make sure the link is in the visible content (not behind a login)
- Test the link works: `https://www.myrevuhq.com/privacy`
- The link should be easily findable on the homepage
