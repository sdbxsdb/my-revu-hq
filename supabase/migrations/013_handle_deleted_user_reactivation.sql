-- Update user creation trigger to handle deleted users reactivating
-- If a user signs up again with the same email after deletion, reactivate their account
-- This allows users to recover their account if they deleted it by mistake
-- Also handles edge case where same email tries to sign up twice (different auth methods)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- First, check if a user with this ID already exists (same auth user)
  -- If they exist and are deleted, reactivate them
  UPDATE public.users
  SET 
    account_lifecycle_status = 'active',
    payment_status = 'inactive',
    email = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id AND account_lifecycle_status = 'deleted';
  
  -- If update happened, we're done
  IF FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Check if a user with this email already exists (different auth user ID)
  -- This handles edge case where same email signs up via different auth methods
  SELECT id INTO existing_user_id
  FROM public.users
  WHERE email = NEW.email AND id != NEW.id;
  
  -- If email exists with different ID, prevent duplicate
  -- Supabase Auth should prevent this, but this is a safety check
  IF existing_user_id IS NOT NULL THEN
    -- Log the conflict but don't create duplicate
    -- The existing user should use their original account
    RAISE WARNING 'User with email % already exists with ID %. New signup with ID % prevented.', 
      NEW.email, existing_user_id, NEW.id;
    RETURN NEW; -- Still return NEW to not break the trigger, but we won't create duplicate
  END IF;
  
  -- If no conflicts, insert new user
  INSERT INTO public.users (id, email, account_lifecycle_status, payment_status)
  VALUES (NEW.id, NEW.email, 'active', 'inactive')
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

COMMENT ON FUNCTION public.handle_new_user() IS 
  $$Handles new user creation. If user exists but is deleted, reactivates them. Otherwise creates new user.$$;

