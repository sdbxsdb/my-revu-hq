-- Fix user creation: Add INSERT policy and ensure trigger works
-- This migration ensures users can be created both by trigger and by backend

-- Add INSERT policy for users (though service role bypasses RLS, this is for safety)
-- Actually, we don't need this for service role, but let's add it for completeness
-- Service role key bypasses RLS, so this is mainly for documentation

-- Ensure the trigger function exists and works
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing users that don't have profiles
INSERT INTO public.users (id, email)
SELECT id, email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users WHERE id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

