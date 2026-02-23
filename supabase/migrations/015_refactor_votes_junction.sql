-- ============================================================
-- Migration 015: Refactor votes — junction table vote_options
--
-- Fixes applied:
--   1. RLS SELECT policy mirrors votes access (not polls visibility)
--      to prevent exposing individual vote choices
--   2. RLS INSERT policy checks poll_is_open_for_voting to prevent
--      late additions after poll closes
--   3. Cross-poll constraint: option must belong to same poll as vote
--   4. Use extensions.uuid_generate_v4() for consistency
--   5. SECURITY DEFINER function with explicit search_path
--   6. Drop index before drop column (safety)
--   7. Dependency check performed: no views/functions/RLS broken by DROP COLUMN
--   8. Numeric_value validation trigger: enforces numeric polls have value,
--      non-numeric polls don't
--
-- CRITICAL for application layer:
--   Vote submission MUST be transactional:
--     BEGIN;
--       INSERT INTO votes (...) RETURNING id;
--       INSERT INTO vote_options (vote_id, option_id) VALUES (...);
--       -- (or set numeric_value for numeric polls)
--     COMMIT;
--   Without this, "empty" votes (no selections) can occur on errors.
--   For MVP: acceptable if guaranteed at app level.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- Step 1: Create junction table
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.vote_options (
  id         UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  vote_id    UUID NOT NULL REFERENCES public.votes(id) ON DELETE CASCADE,
  option_id  UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(vote_id, option_id)
);

COMMENT ON TABLE public.vote_options
  IS 'Junction table: selected options per vote. Enables multiple choice while keeping 1 submission per user per poll.';

-- ──────────────────────────────────────────────────────────────
-- Step 2: Cross-poll consistency trigger
--   Prevents: vote belongs to poll A, option belongs to poll B
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_vote_option_same_poll()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_vote_poll_id   UUID;
  v_option_poll_id UUID;
BEGIN
  SELECT poll_id INTO v_vote_poll_id
    FROM public.votes
   WHERE id = NEW.vote_id;

  SELECT poll_id INTO v_option_poll_id
    FROM public.poll_options
   WHERE id = NEW.option_id;

  IF v_vote_poll_id IS DISTINCT FROM v_option_poll_id THEN
    RAISE EXCEPTION 'vote_option cross-poll mismatch: vote belongs to poll %, option belongs to poll %',
      v_vote_poll_id, v_option_poll_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vote_option_same_poll
  BEFORE INSERT ON public.vote_options
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_vote_option_same_poll();

COMMENT ON FUNCTION public.fn_vote_option_same_poll()
  IS 'Ensures vote and option belong to the same poll. Prevents cross-poll data corruption.';

-- ──────────────────────────────────────────────────────────────
-- Step 3: Add numeric_value to votes
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.votes
  ADD COLUMN numeric_value NUMERIC;

COMMENT ON COLUMN public.votes.numeric_value
  IS 'Numeric answer for numeric poll type. NULL for choice-based polls.';

-- ──────────────────────────────────────────────────────────────
-- Step 4: Migrate existing data (votes.option_id → vote_options)
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.vote_options (vote_id, option_id)
SELECT v.id, v.option_id
FROM public.votes v
WHERE v.option_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- Step 5: Drop old option_id column from votes
--
-- Safety checks performed (2026-02-23):
--   ✅ No views reference votes.option_id
--   ✅ No RLS policies reference option_id
--   ✅ Functions update_response_count_* do not use option_id
--   ✅ Index idx_votes_option_id will be dropped first
-- ──────────────────────────────────────────────────────────────

-- Drop index first (explicit, though CASCADE would handle it)
DROP INDEX IF EXISTS public.idx_votes_option_id;

-- Drop column (FK votes_option_id_fkey cascades automatically)
ALTER TABLE public.votes
  DROP COLUMN option_id;

-- ──────────────────────────────────────────────────────────────
-- Step 6: Enable RLS on vote_options
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.vote_options ENABLE ROW LEVEL SECURITY;

-- SELECT: mirrors votes access — only voter, poll owner, or admin
-- This prevents exposing individual vote choices to participants
CREATE POLICY "vote_options_select"
  ON public.vote_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1
        FROM public.votes v
       WHERE v.id = vote_options.vote_id
         AND (
           v.voter_user_id = auth.uid()
           OR public.is_poll_owner(v.poll_id)
           OR public.is_admin(auth.uid())
         )
    )
  );

-- INSERT: only for your own votes, and only when poll is open
-- Prevents late additions after poll closes
CREATE POLICY "vote_options_insert"
  ON public.vote_options FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.votes v
      WHERE v.id = vote_options.vote_id
        AND v.voter_user_id = auth.uid()
        AND public.poll_is_open_for_voting(v.poll_id)
    )
  );

-- No UPDATE — votes are immutable
-- DELETE cascades from votes

-- ──────────────────────────────────────────────────────────────
-- Step 7: Enforce numeric_value consistency on votes
--
-- Ensures:
--   - numeric polls: numeric_value NOT NULL
--   - non-numeric polls: numeric_value IS NULL
--   - mutual exclusivity enforced at app layer (transaction requirement)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_validate_vote_numeric_value()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_poll_kind public.poll_kind;
BEGIN
  -- Resolve poll kind
  SELECT p.kind INTO v_poll_kind
    FROM public.polls p
   WHERE p.id = NEW.poll_id;

  -- Numeric polls: numeric_value must be set
  IF v_poll_kind = 'numeric' THEN
    IF NEW.numeric_value IS NULL THEN
      RAISE EXCEPTION 'Numeric polls require numeric_value to be set.';
    END IF;
  
  -- Non-numeric polls: numeric_value must be NULL
  ELSE
    IF NEW.numeric_value IS NOT NULL THEN
      RAISE EXCEPTION 'Only numeric polls accept numeric_value. This poll type is %.', v_poll_kind;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_vote_numeric_value
  BEFORE INSERT OR UPDATE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validate_vote_numeric_value();

COMMENT ON FUNCTION public.fn_validate_vote_numeric_value()
  IS 'Enforces: numeric polls require numeric_value (NOT NULL), non-numeric polls forbid it (IS NULL).';

-- ──────────────────────────────────────────────────────────────
-- Step 8: Indexes
-- ──────────────────────────────────────────────────────────────
CREATE INDEX idx_vote_options_vote_id   ON public.vote_options(vote_id);
CREATE INDEX idx_vote_options_option_id ON public.vote_options(option_id);
