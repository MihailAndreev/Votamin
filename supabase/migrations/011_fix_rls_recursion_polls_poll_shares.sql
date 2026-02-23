-- Migration 011: Fix remaining RLS recursion between polls and poll_shares
-- ================================================================

-- 1) Helper function: check if poll has a valid share code
CREATE OR REPLACE FUNCTION public.has_valid_share_for_poll(check_poll_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
SET row_security = off
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.poll_shares
    WHERE poll_id = check_poll_id
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$;

ALTER FUNCTION public.has_valid_share_for_poll(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.has_valid_share_for_poll(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_valid_share_for_poll(UUID) TO authenticated, anon;

-- 2) Update polls policy that previously queried poll_shares directly
DROP POLICY IF EXISTS anyone_select_polls_via_share_code ON public.polls;
CREATE POLICY anyone_select_polls_via_share_code
  ON public.polls
  FOR SELECT
  TO public
  USING (public.has_valid_share_for_poll(id));

-- 3) Update poll_shares owner policies to use is_poll_owner() instead of EXISTS(SELECT FROM polls)
DROP POLICY IF EXISTS owner_select_own_poll_shares ON public.poll_shares;
CREATE POLICY owner_select_own_poll_shares
  ON public.poll_shares
  FOR SELECT
  TO authenticated
  USING (public.is_poll_owner(poll_id));

DROP POLICY IF EXISTS owner_insert_poll_shares ON public.poll_shares;
CREATE POLICY owner_insert_poll_shares
  ON public.poll_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND public.is_poll_owner(poll_id)
  );

DROP POLICY IF EXISTS owner_delete_poll_shares ON public.poll_shares;
CREATE POLICY owner_delete_poll_shares
  ON public.poll_shares
  FOR DELETE
  TO authenticated
  USING (public.is_poll_owner(poll_id));
