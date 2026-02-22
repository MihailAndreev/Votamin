-- ================================================================
-- Migration 002: Add handle_new_user trigger
-- Purpose: Auto-create profile + user_role when new user signs up
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- Function: Auto-create profile + user_role on signup
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with email as initial full_name
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );

  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');

  RETURN new;
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- Trigger: on_auth_user_created
-- Fires: After new user is created in auth.users
-- ────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
