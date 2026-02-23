-- ============================================================
-- Migration 014: Add polls.theme column
-- ============================================================

ALTER TABLE public.polls
  ADD COLUMN theme TEXT NOT NULL DEFAULT 'default';

COMMENT ON COLUMN public.polls.theme
  IS 'Visual theme for the poll. Predefined values: default, dark, colorful, minimal.';
