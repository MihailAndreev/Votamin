-- Migration 010: Secure remaining helper functions and prevent user enumeration
-- ================================================================

-- 1. Бетониране на poll_is_open_for_voting
CREATE OR REPLACE FUNCTION public.poll_is_open_for_voting(check_poll_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
SET row_security = off
LANGUAGE plpgsql
AS $$
DECLARE
  is_open BOOLEAN;
BEGIN
  SELECT (
    status = 'open'
    AND (starts_at IS NULL OR now() >= starts_at)
    AND (ends_at IS NULL OR now() < ends_at)
  )
  INTO is_open
  FROM public.polls 
  WHERE id = check_poll_id;
  
  RETURN COALESCE(is_open, FALSE);
END;
$$;

ALTER FUNCTION public.poll_is_open_for_voting(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.poll_is_open_for_voting(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.poll_is_open_for_voting(UUID) TO authenticated;


-- 2. Бетониране на is_admin със защита срещу user enumeration
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
SET row_security = off
LANGUAGE plpgsql
AS $$
DECLARE
  is_user_admin BOOLEAN;
BEGIN
  -- ЗАЩИТА: Позволяваме проверка само за текущо логнатия потребител.
  IF auth.uid() IS NULL OR check_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN FALSE;
  END IF;

  SELECT (role = 'admin') 
  INTO is_user_admin 
  FROM public.user_roles 
  WHERE user_id = check_user_id;
  
  RETURN COALESCE(is_user_admin, FALSE);
END;
$$;

ALTER FUNCTION public.is_admin(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, anon;
