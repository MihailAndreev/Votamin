-- ============================================================
-- Migration 025: Fix admin_list_polls to show accurate participant count
--
-- Issue: admin_list_polls was using polls.response_count which
--        may be inaccurate. Need to count actual unique voters
--        from the votes table instead.
--
-- Fix: Updated admin_list_polls to calculate vote count from
--      the votes table for accurate participant count display.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_list_polls(
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_visibility TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_dir TEXT DEFAULT 'desc',
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  poll_id UUID,
  title TEXT,
  description_html TEXT,
  creator_email TEXT,
  creator_name TEXT,
  owner_id UUID,
  status TEXT,
  visibility TEXT,
  kind TEXT,
  votes_count INT,
  featured BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  results_visibility TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.require_admin();

  RETURN QUERY
  SELECT
    p.id AS poll_id,
    p.title,
    p.description_html,
    au.email::TEXT AS creator_email,
    COALESCE(NULLIF(BTRIM(pr.full_name), ''), au.email::TEXT) AS creator_name,
    p.owner_id,
    p.status::TEXT,
    p.visibility::TEXT,
    COALESCE(p.kind::TEXT, 'single_choice') AS kind,
    COALESCE((SELECT COUNT(DISTINCT voter_user_id) FROM public.votes v WHERE v.poll_id = p.id), 0)::INT AS votes_count,
    COALESCE(p.featured, false) AS featured,
    p.created_at,
    p.updated_at,
    p.starts_at,
    p.ends_at,
    COALESCE(p.results_visibility::TEXT, 'after_vote') AS results_visibility
  FROM public.polls p
  JOIN auth.users au ON au.id = p.owner_id
  LEFT JOIN public.profiles pr ON pr.user_id = p.owner_id
  WHERE
    (p_search IS NULL OR p_search = '' OR p.title ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR p_status = '' OR p.status::TEXT = p_status)
    AND (p_visibility IS NULL OR p_visibility = '' OR p.visibility::TEXT = p_visibility)
  ORDER BY
    CASE WHEN p_sort_by = 'title'      AND p_sort_dir = 'asc'  THEN p.title END ASC,
    CASE WHEN p_sort_by = 'title'      AND p_sort_dir = 'desc' THEN p.title END DESC,
    CASE WHEN p_sort_by = 'votes'      AND p_sort_dir = 'asc'  THEN (SELECT COUNT(DISTINCT voter_user_id) FROM public.votes v WHERE v.poll_id = p.id) END ASC,
    CASE WHEN p_sort_by = 'votes'      AND p_sort_dir = 'desc' THEN (SELECT COUNT(DISTINCT voter_user_id) FROM public.votes v WHERE v.poll_id = p.id) END DESC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_dir = 'asc'  THEN p.created_at END ASC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_dir = 'desc' THEN p.created_at END DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_polls(TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated;
