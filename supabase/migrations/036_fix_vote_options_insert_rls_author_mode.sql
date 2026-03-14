-- ============================================================
-- Migration 036: Fix vote_options INSERT RLS in author-only mode
-- ============================================================
-- Problem:
-- - vote_options_insert policy validates vote ownership via subquery to public.votes.
-- - After tightening SELECT RLS on votes (results_visibility=author), participants
--   cannot read their own vote rows, so WITH CHECK fails with 42501.
-- - This can happen after vote row is already inserted, causing false UI error.
--
-- Solution:
-- - Use SECURITY DEFINER helper that checks vote ownership/open state without
--   depending on caller SELECT visibility on public.votes.

CREATE OR REPLACE FUNCTION public.can_insert_vote_option(p_vote_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_voter_user_id UUID;
  v_poll_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT v.voter_user_id, v.poll_id
    INTO v_voter_user_id, v_poll_id
  FROM public.votes v
  WHERE v.id = p_vote_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN v_voter_user_id = auth.uid()
     AND public.poll_is_open_for_voting(v_poll_id);
END;
$$;

ALTER FUNCTION public.can_insert_vote_option(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.can_insert_vote_option(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_insert_vote_option(UUID) TO authenticated;

DROP POLICY IF EXISTS vote_options_insert ON public.vote_options;

CREATE POLICY vote_options_insert
  ON public.vote_options
  FOR INSERT
  WITH CHECK (public.can_insert_vote_option(vote_id));

COMMENT ON FUNCTION public.can_insert_vote_option(UUID)
  IS 'Checks if current auth user owns the vote and poll is open; used by vote_options insert RLS without relying on votes SELECT visibility.';

COMMENT ON POLICY vote_options_insert ON public.vote_options
  IS 'Allows inserting vote_options when current user owns referenced vote and poll is open (via SECURITY DEFINER helper).';
