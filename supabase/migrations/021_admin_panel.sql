-- ================================================================
-- Migration 021: Admin Panel – Schema, RPCs & Audit Log
--
-- Creates:
--   • admin_audit_log table + RLS
--   • require_admin() DRY helper
--   • _admin_log() internal audit logger
--   • profiles.status column (active | blocked) + RLS guards
--   • polls.featured column
--   • 15 admin-only RPC functions (all SECURITY DEFINER)
-- ================================================================

-- ----------------------------------------------------------------
-- 0) Schema additions
-- ----------------------------------------------------------------

-- 0a) Audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,               -- 'user' | 'poll' | 'vote'
  target_id TEXT,                          -- user_id or poll_id etc.
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin   ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target  ON public.admin_audit_log(target_type, target_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_select_audit_log ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY admin_insert_audit_log ON public.admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Table-level GRANT so RLS can actually evaluate
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;

-- 0b) profiles.status for block/unblock
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'blocked'));

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- 0c) polls.featured flag
ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_polls_featured ON public.polls(featured) WHERE featured = true;

-- ----------------------------------------------------------------
-- 1) RLS guards: blocked users cannot create polls or cast votes
-- RESTRICTIVE so they AND with existing permissive policies
-- ----------------------------------------------------------------
CREATE POLICY blocked_users_no_poll_insert ON public.polls
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND status = 'blocked'
    )
  );

CREATE POLICY blocked_users_no_poll_update ON public.polls
  AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND status = 'blocked'
    )
  );

CREATE POLICY blocked_users_no_vote_insert ON public.votes
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND status = 'blocked'
    )
  );

-- ----------------------------------------------------------------
-- 2) require_admin() – DRY helper (internal only, never GRANT)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.require_admin()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
END;
$$;

ALTER FUNCTION public.require_admin() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.require_admin() FROM PUBLIC;

-- ----------------------------------------------------------------
-- 3) _admin_log() – internal audit logger (called from RPCs only)
--    SECURITY DEFINER + row_security=off → never grant to users
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._admin_log(
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  INSERT INTO public.admin_audit_log(admin_user_id, action, target_type, target_id, details)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_details);
END;
$$;

ALTER FUNCTION public._admin_log(TEXT, TEXT, TEXT, JSONB) OWNER TO postgres;
REVOKE ALL ON FUNCTION public._admin_log(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;

-- ----------------------------------------------------------------
-- 4) admin_get_user_stats – dashboard cards
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_get_user_stats()
RETURNS TABLE (
  total_users BIGINT,
  admin_users BIGINT,
  new_today BIGINT,
  new_this_week BIGINT,
  active_7d BIGINT,
  active_30d BIGINT,
  inactive_30d BIGINT,
  blocked_users BIGINT
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
    (SELECT COUNT(*)::BIGINT FROM public.profiles) AS total_users,
    (SELECT COUNT(*)::BIGINT FROM public.user_roles WHERE role = 'admin') AS admin_users,
    (SELECT COUNT(*)::BIGINT FROM public.profiles WHERE created_at::date = CURRENT_DATE) AS new_today,
    (SELECT COUNT(*)::BIGINT FROM public.profiles WHERE created_at >= date_trunc('week', CURRENT_DATE)) AS new_this_week,
    (SELECT COUNT(DISTINCT au.id)::BIGINT
     FROM auth.users au
     WHERE au.last_sign_in_at >= (now() - interval '7 days')
    ) AS active_7d,
    (SELECT COUNT(DISTINCT au.id)::BIGINT
     FROM auth.users au
     WHERE au.last_sign_in_at >= (now() - interval '30 days')
    ) AS active_30d,
    (SELECT COUNT(DISTINCT au.id)::BIGINT
     FROM auth.users au
     WHERE au.last_sign_in_at < (now() - interval '30 days')
        OR au.last_sign_in_at IS NULL
    ) AS inactive_30d,
    (SELECT COUNT(*)::BIGINT FROM public.profiles WHERE status = 'blocked') AS blocked_users;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_user_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_user_stats() TO authenticated;

-- ----------------------------------------------------------------
-- 5) admin_list_users – paginated list with profile + role + status
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_search TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_dir TEXT DEFAULT 'desc',
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  status TEXT,
  registered_at TIMESTAMPTZ,
  last_sign_in TIMESTAMPTZ,
  polls_created BIGINT,
  votes_given BIGINT
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
    pr.user_id,
    au.email::TEXT,
    pr.full_name,
    pr.avatar_url,
    COALESCE(ur.role::TEXT, 'user') AS role,
    COALESCE(pr.status, 'active')::TEXT AS status,
    pr.created_at AS registered_at,
    au.last_sign_in_at AS last_sign_in,
    COALESCE(pc.cnt, 0)::BIGINT AS polls_created,
    COALESCE(vc.cnt, 0)::BIGINT AS votes_given
  FROM public.profiles pr
  JOIN auth.users au ON au.id = pr.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = pr.user_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM public.polls p WHERE p.owner_id = pr.user_id
  ) pc ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM public.votes v WHERE v.voter_user_id = pr.user_id
  ) vc ON TRUE
  WHERE
    (p_search IS NULL OR p_search = '' OR au.email ILIKE '%' || p_search || '%' OR pr.full_name ILIKE '%' || p_search || '%')
    AND (p_role IS NULL OR p_role = '' OR COALESCE(ur.role::TEXT, 'user') = p_role)
    AND (p_status IS NULL OR p_status = '' OR COALESCE(pr.status, 'active') = p_status)
  ORDER BY
    CASE WHEN p_sort_by = 'email'         AND p_sort_dir = 'asc'  THEN au.email END ASC,
    CASE WHEN p_sort_by = 'email'         AND p_sort_dir = 'desc' THEN au.email END DESC,
    CASE WHEN p_sort_by = 'full_name'     AND p_sort_dir = 'asc'  THEN pr.full_name END ASC,
    CASE WHEN p_sort_by = 'full_name'     AND p_sort_dir = 'desc' THEN pr.full_name END DESC,
    CASE WHEN p_sort_by = 'polls_created' AND p_sort_dir = 'asc'  THEN COALESCE(pc.cnt, 0) END ASC,
    CASE WHEN p_sort_by = 'polls_created' AND p_sort_dir = 'desc' THEN COALESCE(pc.cnt, 0) END DESC,
    CASE WHEN p_sort_by = 'votes_given'   AND p_sort_dir = 'asc'  THEN COALESCE(vc.cnt, 0) END ASC,
    CASE WHEN p_sort_by = 'votes_given'   AND p_sort_dir = 'desc' THEN COALESCE(vc.cnt, 0) END DESC,
    CASE WHEN p_sort_by = 'created_at'    AND p_sort_dir = 'asc'  THEN pr.created_at END ASC,
    CASE WHEN p_sort_by = 'created_at'    AND p_sort_dir = 'desc' THEN pr.created_at END DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users(TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users(TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated;

-- ----------------------------------------------------------------
-- 6) admin_count_users – pagination count
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_count_users(
  p_search TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result BIGINT;
BEGIN
  PERFORM public.require_admin();

  SELECT COUNT(*) INTO result
  FROM public.profiles pr
  JOIN auth.users au ON au.id = pr.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = pr.user_id
  WHERE
    (p_search IS NULL OR p_search = '' OR au.email ILIKE '%' || p_search || '%' OR pr.full_name ILIKE '%' || p_search || '%')
    AND (p_role IS NULL OR p_role = '' OR COALESCE(ur.role::TEXT, 'user') = p_role)
    AND (p_status IS NULL OR p_status = '' OR COALESCE(pr.status, 'active') = p_status);

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_count_users(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_count_users(TEXT, TEXT, TEXT) TO authenticated;

-- ----------------------------------------------------------------
-- 7) admin_set_user_role – make admin / remove admin
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_target_user_id UUID,
  p_new_role TEXT   -- 'admin' | 'user'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.require_admin();

  IF p_target_user_id = auth.uid() AND p_new_role = 'user' THEN
    RAISE EXCEPTION 'Cannot remove your own admin role' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.user_roles
  SET role = p_new_role::user_role, updated_at = now()
  WHERE user_id = p_target_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (p_target_user_id, p_new_role::user_role);
  END IF;

  PERFORM public._admin_log(
    'set_role',
    'user',
    p_target_user_id::TEXT,
    jsonb_build_object('new_role', p_new_role)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated;

-- ----------------------------------------------------------------
-- 8) admin_set_user_status – block / unblock
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_user_status(
  p_target_user_id UUID,
  p_new_status TEXT  -- 'active' | 'blocked'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.require_admin();

  IF p_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own status' USING ERRCODE = 'P0001';
  END IF;

  IF p_new_status NOT IN ('active', 'blocked') THEN
    RAISE EXCEPTION 'Invalid status: %', p_new_status USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.profiles
  SET status = p_new_status, updated_at = now()
  WHERE user_id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM public._admin_log(
    'set_status',
    'user',
    p_target_user_id::TEXT,
    jsonb_build_object('new_status', p_new_status)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_status(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(UUID, TEXT) TO authenticated;

-- ----------------------------------------------------------------
-- 9) admin_delete_user – removes auth.users (cascades)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.require_admin();

  IF p_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete yourself' USING ERRCODE = 'P0001';
  END IF;

  PERFORM public._admin_log(
    'delete_user',
    'user',
    p_target_user_id::TEXT,
    jsonb_build_object('email', (SELECT email FROM auth.users WHERE id = p_target_user_id))
  );

  DELETE FROM auth.users WHERE id = p_target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

-- ----------------------------------------------------------------
-- 10) admin_get_poll_stats – dashboard cards
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_get_poll_stats()
RETURNS TABLE (
  total_polls BIGINT,
  active_polls BIGINT,
  closed_polls BIGINT,
  draft_polls BIGINT,
  total_votes BIGINT,
  avg_votes_per_poll NUMERIC,
  polls_with_zero_votes BIGINT,
  most_voted_poll_id UUID,
  most_voted_poll_title TEXT,
  most_voted_poll_votes BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  mv_id UUID;
  mv_title TEXT;
  mv_votes BIGINT;
BEGIN
  PERFORM public.require_admin();

  SELECT p.id, p.title, p.response_count::BIGINT
  INTO mv_id, mv_title, mv_votes
  FROM public.polls p
  ORDER BY p.response_count DESC
  LIMIT 1;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::BIGINT FROM public.polls) AS total_polls,
    (SELECT COUNT(*)::BIGINT FROM public.polls WHERE status = 'open') AS active_polls,
    (SELECT COUNT(*)::BIGINT FROM public.polls WHERE status = 'closed') AS closed_polls,
    (SELECT COUNT(*)::BIGINT FROM public.polls WHERE status = 'draft') AS draft_polls,
    (SELECT COUNT(*)::BIGINT FROM public.votes) AS total_votes,
    (SELECT COALESCE(ROUND(AVG(response_count)::NUMERIC, 1), 0) FROM public.polls WHERE response_count > 0) AS avg_votes_per_poll,
    (SELECT COUNT(*)::BIGINT FROM public.polls WHERE response_count = 0) AS polls_with_zero_votes,
    mv_id AS most_voted_poll_id,
    mv_title AS most_voted_poll_title,
    COALESCE(mv_votes, 0) AS most_voted_poll_votes;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_poll_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_poll_stats() TO authenticated;

-- ----------------------------------------------------------------
-- 11) admin_list_polls – paginated list with creator info + featured
-- ----------------------------------------------------------------
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
    p.response_count AS votes_count,
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
    CASE WHEN p_sort_by = 'votes'      AND p_sort_dir = 'asc'  THEN p.response_count END ASC,
    CASE WHEN p_sort_by = 'votes'      AND p_sort_dir = 'desc' THEN p.response_count END DESC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_dir = 'asc'  THEN p.created_at END ASC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_dir = 'desc' THEN p.created_at END DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_polls(TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_polls(TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated;

-- ----------------------------------------------------------------
-- 12) admin_count_polls – pagination count
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_count_polls(
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_visibility TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result BIGINT;
BEGIN
  PERFORM public.require_admin();

  SELECT COUNT(*) INTO result
  FROM public.polls p
  WHERE
    (p_search IS NULL OR p_search = '' OR p.title ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR p_status = '' OR p.status::TEXT = p_status)
    AND (p_visibility IS NULL OR p_visibility = '' OR p.visibility::TEXT = p_visibility);

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_count_polls(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_count_polls(TEXT, TEXT, TEXT) TO authenticated;

-- ----------------------------------------------------------------
-- 13) admin_update_poll – change status, visibility, title
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_poll(
  p_poll_id UUID,
  p_status TEXT DEFAULT NULL,
  p_visibility TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.require_admin();

  UPDATE public.polls
  SET
    status = COALESCE(p_status::poll_status, status),
    visibility = COALESCE(p_visibility::poll_visibility, visibility),
    title = COALESCE(NULLIF(p_title, ''), title),
    updated_at = now()
  WHERE id = p_poll_id;

  PERFORM public._admin_log(
    'update_poll',
    'poll',
    p_poll_id::TEXT,
    jsonb_build_object('status', p_status, 'visibility', p_visibility, 'title', p_title)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_poll(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_poll(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- ----------------------------------------------------------------
-- 14) admin_delete_poll
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_delete_poll(p_poll_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.require_admin();

  PERFORM public._admin_log(
    'delete_poll',
    'poll',
    p_poll_id::TEXT,
    jsonb_build_object('title', (SELECT title FROM public.polls WHERE id = p_poll_id))
  );

  DELETE FROM public.polls WHERE id = p_poll_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_poll(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_poll(UUID) TO authenticated;

-- ----------------------------------------------------------------
-- 15) admin_reset_poll_votes
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_reset_poll_votes(p_poll_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.require_admin();

  DELETE FROM public.votes WHERE poll_id = p_poll_id;
  UPDATE public.polls SET response_count = 0, updated_at = now() WHERE id = p_poll_id;

  PERFORM public._admin_log(
    'reset_votes',
    'poll',
    p_poll_id::TEXT,
    '{}'::JSONB
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reset_poll_votes(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reset_poll_votes(UUID) TO authenticated;

-- ----------------------------------------------------------------
-- 16) admin_get_poll_voters – voters list for any poll
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_get_poll_voters(p_poll_id UUID)
RETURNS TABLE (
  voter_user_id UUID,
  display_name TEXT,
  email TEXT,
  voted_at TIMESTAMPTZ,
  selections TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
AS $$
BEGIN
  PERFORM public.require_admin();

  RETURN QUERY
  SELECT
    v.voter_user_id,
    COALESCE(NULLIF(BTRIM(pr.full_name), ''), au.email::TEXT, 'Anonymous') AS display_name,
    au.email::TEXT,
    v.created_at AS voted_at,
    COALESCE(
      ARRAY_AGG(po.text ORDER BY po.position) FILTER (WHERE po.text IS NOT NULL),
      ARRAY[]::TEXT[]
    ) AS selections
  FROM public.votes v
  LEFT JOIN public.vote_options vo ON vo.vote_id = v.id
  LEFT JOIN public.poll_options po ON po.id = vo.option_id
  LEFT JOIN public.profiles pr ON pr.user_id = v.voter_user_id
  LEFT JOIN auth.users au ON au.id = v.voter_user_id
  WHERE v.poll_id = p_poll_id
  GROUP BY v.id, v.voter_user_id, v.created_at, pr.full_name, au.email
  ORDER BY v.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_poll_voters(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_poll_voters(UUID) TO authenticated;

-- ----------------------------------------------------------------
-- 17) admin_toggle_featured – toggle featured flag on poll
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_toggle_featured(p_poll_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  new_val BOOLEAN;
BEGIN
  PERFORM public.require_admin();

  UPDATE public.polls
  SET featured = NOT COALESCE(featured, false), updated_at = now()
  WHERE id = p_poll_id
  RETURNING featured INTO new_val;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Poll not found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM public._admin_log(
    'toggle_featured',
    'poll',
    p_poll_id::TEXT,
    jsonb_build_object('featured', new_val)
  );

  RETURN new_val;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_toggle_featured(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_toggle_featured(UUID) TO authenticated;

-- ----------------------------------------------------------------
-- 18) admin_duplicate_poll – deep copy poll + options as draft
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_duplicate_poll(p_poll_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  new_poll_id UUID;
  src RECORD;
BEGIN
  PERFORM public.require_admin();

  SELECT * INTO src FROM public.polls WHERE id = p_poll_id;
  IF src IS NULL THEN
    RAISE EXCEPTION 'Poll not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.polls (
    owner_id, title, description_html, status, visibility,
    kind, max_choices, results_visibility, theme,
    starts_at, ends_at, response_count, featured
  )
  VALUES (
    src.owner_id,
    src.title || ' (copy)',
    src.description_html,
    'draft',
    src.visibility,
    src.kind,
    src.max_choices,
    src.results_visibility,
    src.theme,
    NULL, NULL, 0, false
  )
  RETURNING id INTO new_poll_id;

  INSERT INTO public.poll_options (poll_id, text, position, image_url)
  SELECT new_poll_id, po.text, po.position, po.image_url
  FROM public.poll_options po
  WHERE po.poll_id = p_poll_id
  ORDER BY po.position;

  PERFORM public._admin_log(
    'duplicate_poll',
    'poll',
    p_poll_id::TEXT,
    jsonb_build_object('new_poll_id', new_poll_id, 'title', src.title)
  );

  RETURN new_poll_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_duplicate_poll(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_duplicate_poll(UUID) TO authenticated;

-- ================================================================
-- END OF MIGRATION 021
-- ================================================================
