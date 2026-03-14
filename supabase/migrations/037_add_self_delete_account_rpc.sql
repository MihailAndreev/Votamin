-- ============================================================
-- Migration 037: Add self-delete account RPC
-- ============================================================
-- Allows an authenticated user to permanently delete their own account.
-- Uses SECURITY DEFINER (owner postgres) because deleting from auth.users
-- requires elevated privileges.
--
-- Cleanup strategy:
--   1) delete user's avatar objects from storage.objects (best effort)
--   2) delete auth.users row
--      -> cascades to profiles, user_roles, polls, poll_shares, votes
--      -> cascades further to poll_options and vote_options via poll/vote FKs

CREATE OR REPLACE FUNCTION public.self_delete_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET row_security = off
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001';
  END IF;

  -- Best-effort cleanup of avatars uploaded in the app bucket.
  -- The app stores avatars under path: {user_id}/{filename}.
  -- Do not block account deletion if storage cleanup fails.
  BEGIN
    DELETE FROM storage.objects so
    WHERE so.bucket_id = 'avatars'
      AND (
        so.name LIKE v_user_id::TEXT || '/%'
        OR so.owner = v_user_id
      );
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  DELETE FROM auth.users
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

ALTER FUNCTION public.self_delete_account() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.self_delete_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.self_delete_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.self_delete_account() TO authenticated;

COMMENT ON FUNCTION public.self_delete_account()
  IS 'Deletes currently authenticated user and their avatar storage objects. Deleting auth.users cascades to app tables via FKs.';
