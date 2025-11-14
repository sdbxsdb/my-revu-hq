# OAuth Setup Guide (Google & Facebook)

To enable Google and Facebook sign-in, you need to configure OAuth providers in Supabase.

## Step 1: Configure OAuth in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/mmnabvqkstkjlkxfksbp
2. Navigate to **Authentication** → **Providers** in the left sidebar
3. Enable and configure each provider:

### Google OAuth

1. Click on **Google** provider
2. Toggle **Enable Google provider**
3. You'll need to create a Google OAuth application:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or select existing)
   - Enable **Google+ API**
   - Go to **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `https://mmnabvqkstkjlkxfksbp.supabase.co/auth/v1/callback`
     - `http://localhost:5173` (for local development)
   - Copy the **Client ID** and **Client Secret**
4. Paste them into Supabase Google provider settings
5. Click **Save**

### Facebook OAuth

1. Click on **Facebook** provider
2. Toggle **Enable Facebook provider**
3. You'll need to create a Facebook App:
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app
   - Add **Facebook Login** product
   - In **Settings** → **Basic**, add:
     - **App Domains**: `supabase.co`
     - **Valid OAuth Redirect URIs**:
       - `https://mmnabvqkstkjlkxfksbp.supabase.co/auth/v1/callback`
       - `http://localhost:5173` (for local development)
   - Copy the **App ID** and **App Secret**
4. Paste them into Supabase Facebook provider settings
5. Click **Save**

## Step 2: Run Database Migration

Run the migration to auto-create user profiles:

1. Go to **SQL Editor** in Supabase
2. Run: `supabase/migrations/006_auto_create_user_profile.sql`

Or if you haven't run the combined migration yet, it's already included in `supabase/migrations/000_combined_setup.sql`.

## Step 3: Test

1. Start your app: `yarn dev`
2. Go to the login page
3. Click "Continue with Google" or "Continue with Facebook"
4. Complete the OAuth flow
5. You should be automatically signed in and redirected

## Notes

- The database trigger automatically creates a user record in the `users` table when someone signs up via any method (magic link, password, OAuth)
- OAuth users will have their email automatically populated from their OAuth provider
- Users can still use magic link or password login even if OAuth is enabled
