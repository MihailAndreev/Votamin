-- ============================================================
-- Migration 030: Simplify poll results visibility to 2 modes
-- ============================================================
-- Goal:
--   Migrate polls.results_visibility from legacy enum values
--   ('after_vote', 'always', 'creator_only') to:
--   ('participants', 'author')
--
-- Notes:
--   - This migration intentionally does NOT touch polls.visibility.
--   - polls.visibility remains legacy/deprecated for this use case.
--   - Mapping:
--       after_vote  -> participants
--       always      -> participants
--       creator_only-> author
--       NULL/other  -> participants

BEGIN;

-- 1) Create the new enum type.
--    We use a temporary name first, then rename it to keep the
--    canonical type name poll_results_visibility after migration.
CREATE TYPE public.poll_results_visibility_v2 AS ENUM (
  'participants',
  'author'
);

-- 2) Drop old default before changing type.
ALTER TABLE public.polls
  ALTER COLUMN results_visibility DROP DEFAULT;

-- 3) Convert existing values with explicit mapping.
ALTER TABLE public.polls
  ALTER COLUMN results_visibility
  TYPE public.poll_results_visibility_v2
  USING (
    CASE COALESCE(results_visibility::text, 'after_vote')
      WHEN 'creator_only' THEN 'author'
      WHEN 'after_vote' THEN 'participants'
      WHEN 'always' THEN 'participants'
      ELSE 'participants'
    END
  )::public.poll_results_visibility_v2;

-- 4) Set new default.
ALTER TABLE public.polls
  ALTER COLUMN results_visibility SET DEFAULT 'participants';

-- 5) Replace old type name with the new one to preserve compatibility
--    for SQL that casts to public.poll_results_visibility.
ALTER TYPE public.poll_results_visibility RENAME TO poll_results_visibility_legacy;
ALTER TYPE public.poll_results_visibility_v2 RENAME TO poll_results_visibility;

-- 6) Remove legacy enum type (safe now that no column uses it).
DROP TYPE public.poll_results_visibility_legacy;

COMMENT ON COLUMN public.polls.results_visibility
  IS 'Controls who can see aggregated poll results: participants = owner/admin + voted participants, author = owner/admin only.';

COMMIT;
