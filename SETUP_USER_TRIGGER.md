# Setup User Auto-Creation Trigger

## Problem

Users are logging in successfully but not appearing in the `users` table.

## Solution: Run the Database Trigger

**Go to Supabase SQL Editor and run this:**

```sql
-- Auto-create user profile when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Backfill Existing Users

If you already have users in `auth.users` but not in `public.users`, run this:

```sql
-- Backfill existing auth users
INSERT INTO public.users (id, email)
SELECT id, email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
```

## Verify

1. Check the `users` table in Supabase Table Editor
2. You should see all your auth users there
3. New users will be created automatically when they sign up

## How It Works

- When someone signs up (via email, password, or OAuth), Supabase creates a record in `auth.users`
- The trigger automatically creates a corresponding record in `public.users`
- The backend can then fetch/update the user profile
