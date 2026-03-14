-- ============================================================
-- Migration 034: Aggregated poll results RPC (RLS-safe)
-- ============================================================
-- Purpose:
-- - Provide aggregated results for poll detail without relying on client
--   direct SELECT over public.votes/public.vote_options.
-- - Preserve product rule:
--   * owner/admin always see results
--   * voted participants see results only when results_visibility = participants
--   * when results are restricted, return total participants only.

CREATE OR REPLACE FUNCTION public.get_poll_results_summary(p_poll_id UUID)
RETURNS TABLE (
  total_votes INT,
  can_view_results BOOLEAN,
  kind TEXT,
  numeric_avg NUMERIC,
  numeric_min NUMERIC,
  numeric_max NUMERIC,
  option_results JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_kind public.poll_kind;
  v_can_view BOOLEAN;
  v_total_votes INT;
BEGIN
  SELECT p.kind, COALESCE(p.response_count, 0)
    INTO v_kind, v_total_votes
  FROM public.polls p
  WHERE p.id = p_poll_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_can_view := public.can_view_poll_results(p_poll_id);

  IF v_can_view THEN
    IF v_kind = 'numeric'::public.poll_kind THEN
      RETURN QUERY
      SELECT
        v_total_votes,
        TRUE,
        v_kind::TEXT,
        ROUND(AVG(v.numeric_value)::NUMERIC, 2) AS numeric_avg,
        MIN(v.numeric_value) AS numeric_min,
        MAX(v.numeric_value) AS numeric_max,
        '[]'::JSONB AS option_results
      FROM public.votes v
      WHERE v.poll_id = p_poll_id
        AND v.numeric_value IS NOT NULL;

      IF NOT FOUND THEN
        RETURN QUERY
        SELECT v_total_votes, TRUE, v_kind::TEXT, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, '[]'::JSONB;
      END IF;

      RETURN;
    END IF;

    RETURN QUERY
    WITH option_counts AS (
      SELECT
        po.id,
        po.text,
        po.position,
        COALESCE(COUNT(vo.option_id), 0)::INT AS votes_count
      FROM public.poll_options po
      LEFT JOIN public.vote_options vo ON vo.option_id = po.id
      LEFT JOIN public.votes v ON v.id = vo.vote_id AND v.poll_id = p_poll_id
      WHERE po.poll_id = p_poll_id
      GROUP BY po.id, po.text, po.position
      ORDER BY po.position
    )
    SELECT
      v_total_votes,
      TRUE,
      v_kind::TEXT,
      NULL::NUMERIC,
      NULL::NUMERIC,
      NULL::NUMERIC,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', oc.id,
            'text', oc.text,
            'position', oc.position,
            'votes_count', oc.votes_count,
            'percentage', CASE WHEN v_total_votes > 0 THEN ROUND((oc.votes_count::NUMERIC / v_total_votes::NUMERIC) * 100)::INT ELSE 0 END
          )
          ORDER BY oc.position
        ),
        '[]'::JSONB
      ) AS option_results
    FROM option_counts oc;

    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v_total_votes,
    FALSE,
    v_kind::TEXT,
    NULL::NUMERIC,
    NULL::NUMERIC,
    NULL::NUMERIC,
    '[]'::JSONB;
END;
$$;

ALTER FUNCTION public.get_poll_results_summary(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_poll_results_summary(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_poll_results_summary(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_poll_results_summary(UUID)
  IS 'Returns poll total participants and (if allowed) aggregated option/numeric results.';
