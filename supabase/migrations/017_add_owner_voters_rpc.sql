-- ================================================================
-- Migration 017: Owner-only RPC for poll voters
-- Purpose: Let poll owners see who voted in their own poll without
--          relaxing global RLS access on profiles.
-- ================================================================

-- ----------------------------------------------------------------
-- Function: get_poll_voters_for_owner(p_poll_id uuid)
-- Returns:
--   - voter_user_id
--   - display_name (full_name -> email -> 'Анонимен')
--   - voted_at
--   - selections (array of selected option texts)
-- Security:
--   - SECURITY DEFINER + explicit owner check
--   - raises forbidden error when caller is not owner
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_poll_voters_for_owner(p_poll_id UUID)
RETURNS TABLE (
  voter_user_id UUID,
  display_name TEXT,
  voted_at TIMESTAMPTZ,
  selections TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.polls p
    WHERE p.id = p_poll_id
      AND p.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'forbidden'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    v.voter_user_id,
    COALESCE(NULLIF(BTRIM(pr.full_name), ''), au.email, 'Анонимен') AS display_name,
    v.created_at AS voted_at,
    COALESCE(
      ARRAY_AGG(po.text ORDER BY po.position) FILTER (WHERE po.text IS NOT NULL),
      ARRAY[]::TEXT[]
    ) AS selections
  FROM public.votes v
  LEFT JOIN public.vote_options vo
    ON vo.vote_id = v.id
  LEFT JOIN public.poll_options po
    ON po.id = vo.option_id
  LEFT JOIN public.profiles pr
    ON pr.user_id = v.voter_user_id
  LEFT JOIN auth.users au
    ON au.id = v.voter_user_id
  WHERE v.poll_id = p_poll_id
  GROUP BY v.id, v.voter_user_id, v.created_at, pr.full_name, au.email
  ORDER BY v.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_poll_voters_for_owner(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.get_poll_voters_for_owner(UUID) TO authenticated;
