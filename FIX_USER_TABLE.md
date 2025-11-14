# Fix: Users Not Appearing in Tables

## Problem

Users are signing up successfully (visible in Supabase Auth) but not appearing in the `users` table.

## Solution: Run the Database Trigger

The trigger that auto-creates user profiles needs to be set up. Run this SQL in your Supabase SQL Editor:

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

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## For Existing Users

If you already have users in `auth.users` but not in `public.users`, run this to backfill:

```sql
-- Backfill existing auth users into users table
INSERT INTO public.users (id, email)
SELECT id, email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
```

## Verify

After running the trigger:

1. Check the `users` table in Supabase Table Editor
2. Sign up a new user
3. They should automatically appear in the `users` table
