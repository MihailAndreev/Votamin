-- ============================================================
-- Migration 023: Fix admin_get_poll_voters to show numeric values
--
-- Issue: For numeric polls, the selections array was empty
--        because numeric values are stored in votes.numeric_value,
--        not in the vote_options junction table.
--
-- Fix: Updated admin_get_poll_voters to return numeric_value
--      cast to text for numeric polls, and selections array
--      for choice-based polls.
-- ============================================================

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
DECLARE
  v_poll_kind public.poll_kind;
BEGIN
  PERFORM public.require_admin();

  -- Get the poll kind to determine how to return selections
  SELECT kind INTO v_poll_kind FROM public.polls WHERE id = p_poll_id;

  IF v_poll_kind IS NULL THEN
    RAISE EXCEPTION 'Poll not found' USING ERRCODE = 'P0002';
  END IF;

  -- For numeric polls, return the numeric_value as an array
  IF v_poll_kind = 'numeric' THEN
    RETURN QUERY
    SELECT
      v.voter_user_id,
      COALESCE(NULLIF(BTRIM(pr.full_name), ''), au.email::TEXT, 'Anonymous') AS display_name,
      au.email::TEXT,
      v.created_at AS voted_at,
      CASE 
        WHEN v.numeric_value IS NOT NULL 
        THEN ARRAY[v.numeric_value::TEXT]::TEXT[]
        ELSE ARRAY[]::TEXT[]
      END AS selections
    FROM public.votes v
    LEFT JOIN public.profiles pr ON pr.user_id = v.voter_user_id
    LEFT JOIN auth.users au ON au.id = v.voter_user_id
    WHERE v.poll_id = p_poll_id
    ORDER BY v.created_at DESC;
  ELSE
    -- For choice-based polls, return the poll option text
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
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_poll_voters(UUID) TO authenticated;
