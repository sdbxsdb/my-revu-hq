# Custom Domain Setup for Vercel

## Step 1: Add Custom Domain in Vercel

1. **Go to your Vercel project dashboard**
2. **Click on "Settings"** (top navigation)
3. **Click on "Domains"** (left sidebar)
4. **Click "Add"** button
5. **Enter your domain:** `myrevuhq.com` (or `www.myrevuhq.com`)
6. **Click "Add"**

Vercel will show you DNS configuration instructions.

## Step 2: Configure DNS Records

You need to add DNS records at your domain registrar (where you bought the domain).

### Option A: Root Domain (myrevuhq.com)

Add these DNS records at your domain registrar:

**For Vercel:**

- **Type:** `A` record
- **Name:** `@` (or leave blank)
- **Value:** `76.76.21.21`

**For www subdomain:**

- **Type:** `CNAME` record
- **Name:** `www`
- **Value:** `cname.vercel-dns.com.`

### Option B: Using CNAME (Recommended)

If your registrar supports it, you can use CNAME for the root domain:

- **Type:** `CNAME` record
- **Name:** `@` (or leave blank)
- **Value:** `cname.vercel-dns.com.`

**Note:** Not all registrars support CNAME for root domains. If yours doesn't, use Option A.

## Step 3: Wait for DNS Propagation

- DNS changes can take **5 minutes to 48 hours** to propagate
- Vercel will show the status in the Domains section
- When it's ready, you'll see a green checkmark ✅

## Step 4: Update Environment Variables

Once your domain is working, update your Vercel environment variables:

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Update `FRONTEND_URL`:**
   - Change from: `https://my-revu-hq.vercel.app`
   - Change to: `https://www.myrevuhq.com` (or `https://myrevuhq.com` if you're using root domain)

3. **Redeploy** your project (or wait for the next deployment)

## Step 5: Update Stripe Webhook URL

1. **Go to Stripe Dashboard** → **Developers** → **Webhooks**
2. **Click on your webhook endpoint**
3. **Click "..." menu** → **"Update endpoint"**
4. **Change the URL** from:
   - `https://my-revu-hq.vercel.app/api/billing/webhook`
   - To: `https://www.myrevuhq.com/api/billing/webhook`
5. **Click "Update endpoint"**

**Note:** You may need to update the webhook signing secret if Stripe generates a new one.

## Step 6: Update Supabase Redirect URLs (if using OAuth)

If you're using Google OAuth or other OAuth providers:

1. **Go to Supabase Dashboard** → Your Project → **Authentication** → **URL Configuration**
2. **Update "Site URL"** to: `https://www.myrevuhq.com`
3. **Add to "Redirect URLs":** `https://www.myrevuhq.com/**`

## Step 7: Test Everything

1. **Visit your custom domain:** `https://www.myrevuhq.com`
2. **Test login/authentication**
3. **Test Stripe checkout** (should redirect back to your custom domain)
4. **Check webhook deliveries** in Stripe Dashboard

## Common Issues

### Domain not resolving

- Wait longer for DNS propagation (can take up to 48 hours)
- Check DNS records are correct at your registrar
- Use a DNS checker tool: https://dnschecker.org

### SSL Certificate issues

- Vercel automatically provisions SSL certificates via Let's Encrypt
- This happens automatically after DNS is configured
- Can take a few minutes after DNS is verified

### Redirecting www to non-www (or vice versa)

- In Vercel Domains settings, you can configure redirects
- Or add both domains and set one as primary

## Quick Checklist

- [ ] Domain added in Vercel
- [ ] DNS records configured at registrar
- [ ] DNS propagation complete (green checkmark in Vercel)
- [ ] `FRONTEND_URL` updated in Vercel environment variables
- [ ] Stripe webhook URL updated
- [ ] Supabase redirect URLs updated (if using OAuth)
- [ ] Tested custom domain in browser
- [ ] Tested Stripe checkout flow
