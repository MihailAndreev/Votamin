-- Adds RPC for forgot-password flow to check if an email exists in auth.users
-- NOTE: This allows email enumeration and should be used only if explicitly required.

CREATE OR REPLACE FUNCTION public.auth_email_exists(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  normalized_email TEXT;
BEGIN
  normalized_email := LOWER(TRIM(check_email));

  IF normalized_email IS NULL OR normalized_email = '' THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE LOWER(u.email) = normalized_email
  );
END;
$$;

REVOKE ALL ON FUNCTION public.auth_email_exists(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_email_exists(TEXT) TO anon, authenticated;
