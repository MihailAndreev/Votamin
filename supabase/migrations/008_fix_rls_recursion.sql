-- Migration 008: Fix RLS infinite recursion
-- ================================================================
-- Purpose: Prevent infinite recursion between polls and votes RLS policies
--
-- Issue: 
--   participant_select_voted_polls checks votes table
--   votes table policies check polls table
--   → circular dependency causes "infinite recursion detected" error
--
-- Solution:
--   Create a SECURITY DEFINER function has_voted_in_poll() that bypasses RLS
--   Use this function in the participant_select_voted_polls policy
-- ================================================================

-- 1. Create SECURITY DEFINER function to check if user voted in poll
CREATE OR REPLACE FUNCTION has_voted_in_poll(poll_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT EXISTS (
    SELECT 1 FROM votes 
    WHERE poll_id = poll_uuid 
    AND voter_user_id = auth.uid()
  );
$$;

-- 2. Drop existing participant_select_voted_polls policy if it exists
DROP POLICY IF EXISTS participant_select_voted_polls ON polls;

-- 3. Recreate participant_select_voted_polls using the SECURITY DEFINER function
CREATE POLICY participant_select_voted_polls ON polls
  FOR SELECT
  USING (
    -- Participant can see polls they've voted in (via the helper function)
    has_voted_in_poll(id)
  );
