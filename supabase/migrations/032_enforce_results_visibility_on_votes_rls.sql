-- ============================================================
-- Migration 032: Enforce results visibility on result-data tables
-- ============================================================
-- Purpose:
-- - Task 4 (RLS/data exposure hardening).
-- - Ensure participants cannot read result data rows when
--   polls.results_visibility = 'author'.
--
-- Scope:
-- - Tightens SELECT access on public.votes and public.vote_options.
-- - Uses unified contract from migration 031:
--   public.can_view_poll_results(p_poll_id uuid).
--
-- Notes:
-- - Owner and admin access remain unchanged.
-- - Participant poll access (public/shared/voted poll page access)
--   remains unchanged.
-- - This migration is intentionally focused on result-data rows.

-- ----------------------------------------------------------------
-- 1) votes: participant can read own vote only when results are visible
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS participant_select_own_votes_only ON public.votes;

CREATE POLICY participant_select_own_votes_only
  ON public.votes
  FOR SELECT
  TO authenticated
  USING (
    voter_user_id = auth.uid()
    AND public.can_view_poll_results(poll_id)
  );

COMMENT ON POLICY participant_select_own_votes_only ON public.votes
  IS 'Participant can read own vote only if can_view_poll_results(poll_id) is true.';

-- ----------------------------------------------------------------
-- 2) vote_options: participant can read own vote_options only when results are visible
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS vote_options_select ON public.vote_options;

CREATE POLICY vote_options_select
  ON public.vote_options
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.votes v
      WHERE v.id = vote_options.vote_id
        AND (
          (v.voter_user_id = auth.uid() AND public.can_view_poll_results(v.poll_id))
          OR public.is_poll_owner(v.poll_id)
          OR public.is_admin(auth.uid())
        )
    )
  );

COMMENT ON POLICY vote_options_select ON public.vote_options
  IS 'Participant can read own vote_options only if can_view_poll_results(v.poll_id) is true; owner/admin unchanged.';

-- ----------------------------------------------------------------
-- Verification queries (run manually after apply)
-- ----------------------------------------------------------------
-- 1) Confirm updated policy expressions:
--    SELECT tablename, policyname, qual
--    FROM pg_policies
--    WHERE schemaname = 'public'
--      AND tablename IN ('votes', 'vote_options')
--      AND policyname IN ('participant_select_own_votes_only', 'vote_options_select');
--
-- 2) Scenario check with non-owner voted participant and author-only poll:
--    - SELECT * FROM public.votes WHERE poll_id = '<author-only-poll-id>';
--      Expected: 0 rows for participant
--    - SELECT * FROM public.vote_options vo
--      JOIN public.votes v ON v.id = vo.vote_id
--      WHERE v.poll_id = '<author-only-poll-id>';
--      Expected: 0 rows for participant
--
-- 3) Scenario check with participants-visible poll (and participant has voted):
--    - queries above should return participant own row set per existing RLS model.
