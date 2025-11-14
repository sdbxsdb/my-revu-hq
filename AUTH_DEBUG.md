# Authentication Debugging Guide

## Quick Checks

### 1. Check Environment Variables

Open your browser console and look for these logs when the page loads:

- `Checking initial session...`
- `Supabase URL: Set` or `Supabase URL: Missing`
- `Supabase Key: Set` or `Supabase Key: Missing`

**If you see "Missing"**, your environment variables aren't set correctly.

### 2. Check Your `.env.local` File

Make sure `apps/frontend/.env.local` exists and contains:

```env
VITE_SUPABASE_URL=https://mmnabvqkstkjlkxfksbp.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=
```

**Important**:

- The file must be named `.env.local` (not `.env`)
- You must restart your dev server after changing env vars
- The values must NOT have quotes around them

### 3. Check Supabase Configuration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/mmnabvqkstkjlkxfksbp
2. Go to **Settings** → **API**
3. Verify:
   - **Project URL** matches your `VITE_SUPABASE_URL`
   - **anon/public key** matches your `VITE_SUPABASE_ANON_KEY`

### 4. Check Authentication Settings

In Supabase Dashboard:

1. Go to **Authentication** → **Settings**
2. Check **Site URL**: Should be `http://localhost:5173` for local dev
3. Check **Redirect URLs**: Should include `http://localhost:5173/**`

### 5. Check Browser Console Errors

When you try to log in, check the console for:

- `Attempting password login for: [email]`
- `Password login result: Success` or error messages
- Any red error messages

### 6. Check Network Tab

In browser DevTools → Network tab:

- Look for requests to `supabase.co/auth/v1/token`
- Check if they're returning 200 (success) or errors
- Check if requests to `/api/auth/sync-session` are working

## Common Issues

### Issue: "Session check timeout"

**Cause**: Supabase client can't connect to Supabase
**Fix**:

- Check your internet connection
- Verify `VITE_SUPABASE_URL` is correct
- Check if Supabase project is paused (free tier pauses after inactivity)

### Issue: Password login just spins

**Cause**: Login is hanging or failing silently
**Fix**:

- Check console for error messages
- Verify email/password are correct
- Check if user exists in Supabase Auth (Dashboard → Authentication → Users)

### Issue: Refresh redirects to login

**Cause**: Session isn't being restored from localStorage
**Fix**:

- Check browser console for session check logs
- Verify `persistSession: true` in supabase client config
- Check if cookies/localStorage are being blocked

## What to Share for Debugging

If issues persist, share:

1. Browser console logs (all messages, especially errors)
2. Network tab screenshot showing failed requests
3. Your `.env.local` file (with values redacted - just show if they're set)
4. Supabase Dashboard → Authentication → Users (screenshot showing if user exists)
