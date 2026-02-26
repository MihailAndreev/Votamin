-- ================================================================
-- Migration 022: Fix admin_set_user_role 403 + harden admin RPC owners
-- ================================================================

-- Recreate role setter with stronger validation and atomic upsert.
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_target_user_id UUID,
  p_new_role TEXT   -- 'admin' | 'user'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
AS $$
BEGIN
  PERFORM public.require_admin();

  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user is required' USING ERRCODE = 'P0001';
  END IF;

  IF p_new_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Invalid role: %', p_new_role USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_target_user_id) THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_target_user_id = auth.uid() AND p_new_role = 'user' THEN
    RAISE EXCEPTION 'Cannot remove your own admin role' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.user_roles (user_id, role, updated_at)
  VALUES (p_target_user_id, p_new_role::public.user_role, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = now();

  PERFORM public._admin_log(
    'set_role',
    'user',
    p_target_user_id::TEXT,
    jsonb_build_object('new_role', p_new_role)
  );
END;
$$;

-- Make sure all admin SECURITY DEFINER functions run as postgres.
ALTER FUNCTION public.require_admin() OWNER TO postgres;
ALTER FUNCTION public._admin_log(TEXT, TEXT, TEXT, JSONB) OWNER TO postgres;
ALTER FUNCTION public.admin_get_user_stats() OWNER TO postgres;
ALTER FUNCTION public.admin_list_users(TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT) OWNER TO postgres;
ALTER FUNCTION public.admin_count_users(TEXT, TEXT, TEXT) OWNER TO postgres;
ALTER FUNCTION public.admin_set_user_role(UUID, TEXT) OWNER TO postgres;
ALTER FUNCTION public.admin_set_user_status(UUID, TEXT) OWNER TO postgres;
ALTER FUNCTION public.admin_delete_user(UUID) OWNER TO postgres;
ALTER FUNCTION public.admin_get_poll_stats() OWNER TO postgres;
ALTER FUNCTION public.admin_list_polls(TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT) OWNER TO postgres;
ALTER FUNCTION public.admin_count_polls(TEXT, TEXT, TEXT) OWNER TO postgres;
ALTER FUNCTION public.admin_update_poll(UUID, TEXT, TEXT, TEXT) OWNER TO postgres;
ALTER FUNCTION public.admin_delete_poll(UUID) OWNER TO postgres;
ALTER FUNCTION public.admin_reset_poll_votes(UUID) OWNER TO postgres;
ALTER FUNCTION public.admin_get_poll_voters(UUID) OWNER TO postgres;
ALTER FUNCTION public.admin_toggle_featured(UUID) OWNER TO postgres;
ALTER FUNCTION public.admin_duplicate_poll(UUID) OWNER TO postgres;

-- Keep execution permissions explicit for authenticated users.
REVOKE ALL ON FUNCTION public.admin_set_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated;
