# Supabase Redirect URL Setup for Local and Production

## Problem

When logging in locally, you're being redirected to the production site instead of staying on localhost.

## Solution

Supabase requires you to configure **both** localhost and production URLs in the Supabase Dashboard.

## Steps to Fix

### 1. Go to Supabase Dashboard

1. Navigate to your Supabase project: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**

### 2. Configure Site URL

Set the **Site URL** to your production URL:

```
https://www.myrevuhq.com
```

### 3. Add Redirect URLs

In the **Redirect URLs** section, add **both** URLs (one per line):

**For Development:**

```
http://localhost:5173
http://localhost:5173/
http://localhost:5173/**
```

**For Production:**

```
https://www.myrevuhq.com
https://www.myrevuhq.com/
https://www.myrevuhq.com/**
```

**Complete Redirect URLs list should look like:**

```
http://localhost:5173
http://localhost:5173/
http://localhost:5173/**
https://www.myrevuhq.com
https://www.myrevuhq.com/
https://www.myrevuhq.com/**
```

### 4. Save Changes

Click **Save** to apply the changes.

## Why This Happens

- Supabase validates redirect URLs against the allowed list
- If your localhost URL isn't in the list, it falls back to the Site URL (production)
- The code uses `window.location.origin` which correctly detects localhost, but Supabase still needs to allow it

## Testing

After updating:

1. **Local Development**: Login should redirect to `http://localhost:5173/`
2. **Production**: Login should redirect to `https://www.myrevuhq.com/`

## Additional Notes

- The `/**` wildcard allows all paths under that domain
- You can add more development ports if needed (e.g., `http://localhost:3000`)
- Changes take effect immediately (no deployment needed)
