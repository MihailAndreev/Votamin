-- ================================================================
-- Migration 019: Public RPC for home page stats
-- Purpose: Expose aggregated platform statistics to anonymous users
--          without relaxing table-level RLS policies.
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_home_public_stats()
RETURNS TABLE (
  users_count BIGINT,
  polls_count BIGINT,
  votes_count BIGINT,
  open_polls_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    (SELECT COUNT(*)::BIGINT FROM public.profiles) AS users_count,
    (SELECT COUNT(*)::BIGINT FROM public.polls) AS polls_count,
    (SELECT COUNT(*)::BIGINT FROM public.votes) AS votes_count,
    (
      SELECT COUNT(*)::BIGINT
      FROM public.polls p
      WHERE p.status = 'open'
        AND (p.starts_at IS NULL OR now() >= p.starts_at)
        AND (p.ends_at IS NULL OR now() < p.ends_at)
    ) AS open_polls_count;
$$;

REVOKE ALL ON FUNCTION public.get_home_public_stats() FROM public;
GRANT EXECUTE ON FUNCTION public.get_home_public_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_home_public_stats() TO authenticated;