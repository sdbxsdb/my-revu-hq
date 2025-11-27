# Dashboard & Onboarding Setup Guide

## Overview

I've created a Dashboard page that serves dual purposes:
1. **Onboarding Wizard** - For new users to guide them through first setup
2. **Quick Access Hub** - For returning users to access all features easily

## Features

### For New Users (Onboarding Wizard):
- ✅ Step-by-step wizard with progress tracking
- ✅ Guides users through:
  1. Adding their first customer
  2. Choosing a pricing plan
  3. Sending their first SMS review request
- ✅ Shows completion badges for completed steps
- ✅ "Skip for now" option to go straight to dashboard
- ✅ Automatically tracks progress

### For Returning Users (Dashboard):
- ✅ Quick stats cards (Total Customers, Messages Sent, Current Plan)
- ✅ Quick action buttons to:
  - Add new customer
  - View customer list
  - View analytics (with tier check)
  - Access account settings
- ✅ Clean, organized layout

## Setup Instructions

### 1. Run the Database Migration

Apply the migration to add the `onboarding_completed` field:

```bash
# If using Supabase CLI:
supabase migration up

# OR in Supabase Dashboard SQL Editor:
# Copy and paste the contents of: supabase/migrations/019_add_onboarding_completed.sql
```

The migration adds:
- `onboarding_completed` BOOLEAN field to users table (defaults to `false`)
- Index for faster queries
- Proper comments

### 2. Update Supabase Redirect URL

New users verifying their email should be redirected to the dashboard:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Update **Site URL** to: `https://www.myrevuhq.com/dashboard`
3. Add to **Redirect URLs**:
   - `https://www.myrevuhq.com/dashboard`
   - `https://www.myrevuhq.com/*` (if not already there)
4. Click **Save**

### 3. Test the Flow

1. **Test Onboarding (New User)**:
   - Sign up for a new account
   - Verify your email by clicking the link
   - You should land on the onboarding wizard
   - Follow the steps to complete onboarding

2. **Test Dashboard (Returning User)**:
   - Log in with an existing account
   - You should see the dashboard with quick stats and actions
   - Click the Dashboard link in the sidebar to return anytime

## Files Changed

### New Files:
- `apps/frontend/src/pages/Dashboard.tsx` - New Dashboard/Onboarding component
- `supabase/migrations/019_add_onboarding_completed.sql` - Database migration
- `DASHBOARD_ONBOARDING_SETUP.md` - This setup guide

### Modified Files:
- `api/account.ts` - Added `onboarding_completed` field support
- `apps/frontend/src/lib/api.ts` - Updated `updateAccount` signature
- `apps/frontend/src/App.tsx` - Added `/dashboard` route
- `apps/frontend/src/pages/Login.tsx` - Changed redirect to `/dashboard`
- `apps/frontend/src/components/Layout.tsx` - Logo now links to `/dashboard`
- `apps/frontend/src/components/Sidebar.tsx` - Added Dashboard navigation item

## Navigation Changes

- **New Dashboard link** at the top of the sidebar (for logged-in users)
- **Logo click** now navigates to Dashboard (instead of Customer List)
- **After login** redirects to Dashboard (instead of Customer List)
- **After email verification** redirects to Dashboard (shows onboarding)

## How Onboarding Works

1. **First Login After Verification**:
   - User lands on Dashboard
   - `onboarding_completed` is `false` in database
   - Onboarding wizard is shown

2. **Wizard Tracks Progress**:
   - Checks if user has added customers
   - Checks if user has a paid plan
   - Checks if user has sent any messages
   - Shows active step based on completion

3. **Completing Onboarding**:
   - User can click "Go to Dashboard" after completing all steps
   - Or click "Skip for now" at any time
   - Updates `onboarding_completed` to `true` in database
   - Shows dashboard view from then on

4. **Returning Users**:
   - `onboarding_completed` is `true`
   - Dashboard view is shown with quick access
   - Can still access all features normally

## Design

The Dashboard/Onboarding uses:
- Dark theme matching MyRevuHQ (#0a0a0a, #1a1a1a, #2a2a2a)
- Teal accents (#14b8a6)
- Mantine Stepper component for wizard
- Card-based layout for quick stats
- Mobile-responsive design

## Benefits

✅ **Better First-Time Experience** - Guides new users step-by-step
✅ **Faster Onboarding** - Users understand how to use the platform
✅ **Quick Access** - Returning users can navigate faster
✅ **Reduced Confusion** - Clear path to getting started
✅ **Flexible** - Users can skip wizard if they want

## Troubleshooting

**Wizard not showing for new users:**
- Check database: `SELECT onboarding_completed FROM users WHERE id = 'user_id';`
- Should be `false` for new users
- Manually set to `false` if needed: `UPDATE users SET onboarding_completed = false WHERE id = 'user_id';`

**Redirect not working after email verification:**
- Check Supabase URL Configuration settings
- Ensure Site URL is set to `/dashboard`
- Clear browser cache and try again

**Dashboard link not appearing:**
- Ensure you're logged in
- Check that Dashboard route is properly registered in App.tsx
- Check browser console for errors

