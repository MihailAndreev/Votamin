-- ================================================================
-- Migration 006: RLS for participant read on voted polls
-- Purpose: Allow authenticated users to read polls they participated in
-- ================================================================

DROP POLICY IF EXISTS "participant_select_voted_polls" ON public.polls;

CREATE POLICY "participant_select_voted_polls"
ON public.polls
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.votes v
    WHERE v.poll_id = polls.id
      AND v.voter_user_id = auth.uid()
  )
);
