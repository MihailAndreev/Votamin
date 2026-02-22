-- ================================================================
-- Migration 004: Update handle_new_user trigger
-- Purpose: Use empty string instead of email for missing full_name
--          and add ON CONFLICT clauses for idempotency
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;
