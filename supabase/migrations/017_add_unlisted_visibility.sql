-- ============================================================
-- Migration 017: Add 'unlisted' visibility option
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'unlisted'
      AND enumtypid = 'public.poll_visibility'::regtype
  ) THEN
    ALTER TYPE public.poll_visibility ADD VALUE 'unlisted';
  END IF;
END $$;
