-- ============================================================
-- Migration 012: Add poll_kind enum and polls.kind column
--
-- Idempotent:
--   - CREATE TYPE skipped if enum exists
--   - ADD VALUE IF NOT EXISTS for each MVP value
--   - ADD COLUMN skipped if column exists
--   - Backfill only touches single_choice/multiple_choice rows
--     (rating/numeric left untouched if set before this migration)
-- ============================================================

-- Step 1: Create poll_kind enum (skip if already exists)
DO $$ BEGIN
  CREATE TYPE public.poll_kind AS ENUM (
    'single_choice',
    'multiple_choice',
    'rating',
    'numeric'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Ensure all MVP values exist in enum
-- ADD VALUE IF NOT EXISTS is idempotent — no error if value already present
-- Note: these must run outside a transaction block in some PG versions,
-- but Supabase migrations run each file as a single transaction.
-- If this fails, split into separate migration file.
ALTER TYPE public.poll_kind ADD VALUE IF NOT EXISTS 'single_choice';
ALTER TYPE public.poll_kind ADD VALUE IF NOT EXISTS 'multiple_choice';
ALTER TYPE public.poll_kind ADD VALUE IF NOT EXISTS 'rating';
ALTER TYPE public.poll_kind ADD VALUE IF NOT EXISTS 'numeric';

-- Step 3: Add kind column with default (skip if already exists)
DO $$ BEGIN
  ALTER TABLE public.polls
    ADD COLUMN kind public.poll_kind NOT NULL DEFAULT 'single_choice';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Step 4: Backfill existing rows
-- Logic: if allow_multiple_choices is TRUE → multiple_choice, else → single_choice
-- Only touch rows that are currently single_choice or multiple_choice
-- (preserves any manually-set rating/numeric rows)
UPDATE public.polls
SET kind = CASE
  WHEN allow_multiple_choices = TRUE THEN 'multiple_choice'::public.poll_kind
  ELSE 'single_choice'::public.poll_kind
END
WHERE kind IN ('single_choice', 'multiple_choice');

COMMENT ON COLUMN public.polls.kind
  IS 'Poll type. MVP: single_choice, multiple_choice, rating, numeric. V2: slider, image.';
