-- ============================================================
-- Migration 033: Shared polls IDs RPC (RLS-safe after results hardening)
-- ============================================================
-- Purpose:
-- - Keep "Shared with me" listing independent from participant SELECT on votes.
-- - After migration 032, participant may be blocked from selecting own vote rows
--   for author-only polls, but still must see shared poll cards.

CREATE OR REPLACE FUNCTION public.get_shared_poll_ids()
RETURNS TABLE (
  poll_id UUID
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT DISTINCT v.poll_id
  FROM public.votes v
  JOIN public.polls p ON p.id = v.poll_id
  WHERE v.voter_user_id = auth.uid()
    AND p.owner_id <> auth.uid()
    AND p.status <> 'draft';
$$;

ALTER FUNCTION public.get_shared_poll_ids() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_shared_poll_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_poll_ids() TO authenticated;

COMMENT ON FUNCTION public.get_shared_poll_ids()
  IS 'Returns poll IDs where current user has voted and is not the owner; used by Shared with me list.';
