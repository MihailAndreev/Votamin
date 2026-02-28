-- ================================================================
-- Migration 028: Public poll inviter label RPC
-- Purpose: For shared poll page, return inviter display label with
--          fallback order: full_name -> email.
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_public_poll_inviter(p_share_code TEXT)
RETURNS TABLE (
  inviter_label TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    COALESCE(
      NULLIF(BTRIM(pr.full_name), ''),
      NULLIF(BTRIM(au.email), '')
    ) AS inviter_label
  FROM public.poll_shares ps
  JOIN public.polls poll
    ON poll.id = ps.poll_id
  LEFT JOIN public.profiles pr
    ON pr.user_id = poll.owner_id
  LEFT JOIN auth.users au
    ON au.id = poll.owner_id
  WHERE ps.share_code = p_share_code
    AND (ps.expires_at IS NULL OR ps.expires_at >= NOW())
  ORDER BY ps.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_poll_inviter(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_poll_inviter(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_poll_inviter(TEXT) TO authenticated;
