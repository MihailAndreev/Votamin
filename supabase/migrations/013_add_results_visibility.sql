-- ============================================================
-- Migration 013: Add poll_results_visibility enum and polls.results_visibility column
-- ============================================================

-- Step 1: Create enum
CREATE TYPE public.poll_results_visibility AS ENUM (
  'after_vote',
  'always',
  'creator_only'
);

-- Step 2: Add column with default
ALTER TABLE public.polls
  ADD COLUMN results_visibility public.poll_results_visibility
    NOT NULL DEFAULT 'after_vote';

COMMENT ON COLUMN public.polls.results_visibility
  IS 'Controls who can see poll results. after_vote = only after voting, always = everyone, creator_only = only poll owner.';
