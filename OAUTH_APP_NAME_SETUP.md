# How to Change Google OAuth App Name from Supabase URL to "MyRevuHQ"

The Google sign-in prompt shows the Supabase URL because that's what's configured in your Google OAuth application. To change it to show "MyRevuHQ", follow these steps:

## Step 1: Go to Google Cloud Console

1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the one you created for OAuth)

## Step 2: Configure OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services** → **OAuth consent screen**
2. You'll see the current configuration showing your app details

## Step 3: Update App Information

1. **App name**: Change this to **"MyRevuHQ"** (or whatever you want users to see)
2. **User support email**: Set to your support email (e.g., `myrevuhq@gmail.com`)
3. **App logo** (optional): Upload your MyRevuHQ logo if you have one
4. **Application home page**: Set to `https://www.myrevuhq.com`
5. **Application privacy policy link**: Set to `https://www.myrevuhq.com/privacy`
6. **Application terms of service link**: Set to `https://www.myrevuhq.com/terms`
7. **Authorized domains**: Add `myrevuhq.com` (if not already there)

## Step 4: Save and Publish

1. Click **Save and Continue** through all the steps
2. If your app is in "Testing" mode, you may need to:
   - Add test users, OR
   - Publish the app (if you're ready for production)

## Step 5: Test

1. Go to your login page
2. Click "Continue with Google"
3. You should now see "MyRevuHQ" instead of the Supabase URL in the Google sign-in prompt

## Notes

- Changes may take a few minutes to propagate
- If you're using a custom domain in Supabase (Pro plan), that can also help with branding
- The app name you set here will appear in the "to continue to" section of the Google sign-in prompt
