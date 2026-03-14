-- ============================================================
-- Migration 031: Unified results access contract (RPC)
-- ============================================================
-- Purpose:
-- - Provide a single backend rule for results visibility checks.
-- - Expose access meta to UI via RPC.
-- - Remove legacy fallback label from admin_list_polls output.

-- ----------------------------------------------------------------
-- 1) can_view_poll_results(p_poll_id)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_view_poll_results(p_poll_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_id UUID;
  v_results_visibility public.poll_results_visibility;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT p.owner_id, p.results_visibility
    INTO v_owner_id, v_results_visibility
  FROM public.polls p
  WHERE p.id = p_poll_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_owner_id = auth.uid() THEN
    RETURN TRUE;
  END IF;

  IF public.is_admin(auth.uid()) THEN
    RETURN TRUE;
  END IF;

  IF v_results_visibility = 'participants'::public.poll_results_visibility THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.votes v
      WHERE v.poll_id = p_poll_id
        AND v.voter_user_id = auth.uid()
    );
  END IF;

  RETURN FALSE;
END;
$$;

ALTER FUNCTION public.can_view_poll_results(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.can_view_poll_results(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_poll_results(UUID) TO authenticated;

COMMENT ON FUNCTION public.can_view_poll_results(UUID)
  IS 'Returns whether current authenticated user can view aggregated results for a poll.';

-- ----------------------------------------------------------------
-- 2) get_poll_results_access(p_poll_id)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_poll_results_access(p_poll_id UUID)
RETURNS TABLE (
  is_owner BOOLEAN,
  is_admin BOOLEAN,
  has_voted BOOLEAN,
  results_visibility TEXT,
  can_view_results BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_id UUID;
  v_results_visibility public.poll_results_visibility;
  v_uid UUID;
BEGIN
  v_uid := auth.uid();

  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  SELECT p.owner_id, p.results_visibility
    INTO v_owner_id, v_results_visibility
  FROM public.polls p
  WHERE p.id = p_poll_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    (v_owner_id = v_uid) AS is_owner,
    public.is_admin(v_uid) AS is_admin,
    EXISTS (
      SELECT 1
      FROM public.votes v
      WHERE v.poll_id = p_poll_id
        AND v.voter_user_id = v_uid
    ) AS has_voted,
    v_results_visibility::TEXT AS results_visibility,
    public.can_view_poll_results(p_poll_id) AS can_view_results;
END;
$$;

ALTER FUNCTION public.get_poll_results_access(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_poll_results_access(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_poll_results_access(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_poll_results_access(UUID)
  IS 'Returns access meta for poll results (owner/admin/voted/visibility/can_view_results).';

-- ----------------------------------------------------------------
-- 3) Keep admin_list_polls aligned with new visibility values
-- ----------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_list_polls(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT);

CREATE OR REPLACE FUNCTION public.admin_list_polls(
  p_search_title TEXT DEFAULT NULL,
  p_search_author TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_results_visibility TEXT DEFAULT NULL,
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
SET search_path = ''
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
    COALESCE(p.kind::TEXT, 'single_choice') AS kind,
    COALESCE((SELECT COUNT(DISTINCT voter_user_id) FROM public.votes v WHERE v.poll_id = p.id), 0)::INT AS votes_count,
    COALESCE(p.featured, false) AS featured,
    p.created_at,
    p.updated_at,
    p.starts_at,
    p.ends_at,
    COALESCE(p.results_visibility::TEXT, 'participants') AS results_visibility
  FROM public.polls p
  JOIN auth.users au ON au.id = p.owner_id
  LEFT JOIN public.profiles pr ON pr.user_id = p.owner_id
  WHERE
    (
      p_search_title IS NULL OR
      p_search_title = '' OR
      p.title ILIKE '%' || p_search_title || '%'
    )
    AND (
      p_search_author IS NULL OR
      p_search_author = '' OR
      au.email ILIKE '%' || p_search_author || '%' OR
      COALESCE(NULLIF(BTRIM(pr.full_name), ''), au.email::TEXT) ILIKE '%' || p_search_author || '%'
    )
    AND (p_status IS NULL OR p_status = '' OR p.status::TEXT = p_status)
    AND (p_results_visibility IS NULL OR p_results_visibility = '' OR p.results_visibility::TEXT = p_results_visibility)
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

ALTER FUNCTION public.admin_list_polls(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_list_polls(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_polls(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated;

DROP FUNCTION IF EXISTS public.admin_count_polls(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.admin_count_polls(
  p_search_title TEXT DEFAULT NULL,
  p_search_author TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_results_visibility TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count BIGINT;
BEGIN
  PERFORM public.require_admin();

  SELECT COUNT(*)
  INTO v_count
  FROM public.polls p
  JOIN auth.users au ON au.id = p.owner_id
  LEFT JOIN public.profiles pr ON pr.user_id = p.owner_id
  WHERE
    (
      p_search_title IS NULL OR
      p_search_title = '' OR
      p.title ILIKE '%' || p_search_title || '%'
    )
    AND (
      p_search_author IS NULL OR
      p_search_author = '' OR
      au.email ILIKE '%' || p_search_author || '%' OR
      COALESCE(NULLIF(BTRIM(pr.full_name), ''), au.email::TEXT) ILIKE '%' || p_search_author || '%'
    )
    AND (p_status IS NULL OR p_status = '' OR p.status::TEXT = p_status)
    AND (p_results_visibility IS NULL OR p_results_visibility = '' OR p.results_visibility::TEXT = p_results_visibility);

  RETURN v_count;
END;
$$;

ALTER FUNCTION public.admin_count_polls(TEXT, TEXT, TEXT, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_count_polls(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_count_polls(TEXT, TEXT, TEXT, TEXT) TO authenticated;
