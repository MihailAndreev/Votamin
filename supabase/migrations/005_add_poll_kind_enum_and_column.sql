-- ================================================================
-- Migration 005: Add poll_kind enum + polls.kind with legacy backfill
-- Purpose: Introduce explicit poll type for Dashboard "Type" column
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'poll_kind'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.poll_kind AS ENUM (
      'single_choice',
      'multiple_choice',
      'rating',
      'image',
      'slider',
      'numeric'
    );
  END IF;
END
$$;

ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS kind public.poll_kind NOT NULL DEFAULT 'single_choice';

-- Legacy backfill:
-- - multiple_choice when allow_multiple_choices = true
-- - single_choice otherwise
UPDATE public.polls
SET kind = CASE
  WHEN allow_multiple_choices IS TRUE THEN 'multiple_choice'::public.poll_kind
  ELSE 'single_choice'::public.poll_kind
END
WHERE kind = 'single_choice'::public.poll_kind
   OR kind IS NULL;
