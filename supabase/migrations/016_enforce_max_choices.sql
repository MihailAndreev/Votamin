-- ============================================================
-- Migration 016: Trigger to enforce choice limits per poll type
--
--   single_choice / rating : max 1 option per vote
--   multiple_choice        : max N options (polls.max_choices), min 1 at app level
--   numeric                : 0 options (uses numeric_value)
--
-- Improvements:
--   - FOR UPDATE lock on vote row reduces race condition risk
--
-- Known MVP limitations:
--   - "exactly 1" for single_choice cannot be fully enforced by
--     BEFORE INSERT trigger alone (cannot enforce minimum).
--     Minimum is enforced at application layer (transaction).
--   - FOR UPDATE reduces but doesn't eliminate concurrent insert races
--     (advisory lock needed for 100% guarantee at scale).
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_enforce_max_choices()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_poll_kind     public.poll_kind;
  v_max_choices   INT;
  v_current_count INT;
BEGIN
  -- Resolve poll kind and max_choices via the vote row
  -- FOR UPDATE: locks the vote row to serialize concurrent inserts to same vote (reduces race condition)
  SELECT p.kind, p.max_choices
    INTO v_poll_kind, v_max_choices
    FROM public.votes v
    JOIN public.polls p ON p.id = v.poll_id
   WHERE v.id = NEW.vote_id
     FOR UPDATE;

  -- Count options already recorded for this vote
  SELECT COUNT(*)
    INTO v_current_count
    FROM public.vote_options
   WHERE vote_id = NEW.vote_id;

  -- ── Single Choice / Rating: max 1 option ──
  -- Note: "exactly 1" minimum is enforced at application layer.
  -- This trigger prevents >1.
  IF v_poll_kind IN ('single_choice', 'rating') THEN
    IF v_current_count >= 1 THEN
      RAISE EXCEPTION 'single_choice and rating polls allow exactly 1 option per vote. Current count: %', v_current_count;
    END IF;
  END IF;

  -- ── Multiple Choice: at least 1 enforced at app layer ──
  -- This trigger prevents exceeding max_choices (if set).
  IF v_poll_kind = 'multiple_choice' THEN
    IF v_max_choices IS NOT NULL AND v_current_count >= v_max_choices THEN
      RAISE EXCEPTION 'This poll allows at most % choices. Current count: %', v_max_choices, v_current_count;
    END IF;
  END IF;

  -- ── Numeric: no options allowed ──
  IF v_poll_kind = 'numeric' THEN
    RAISE EXCEPTION 'Numeric polls do not accept option selections. Use votes.numeric_value instead.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_max_choices
  BEFORE INSERT ON public.vote_options
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_enforce_max_choices();

COMMENT ON FUNCTION public.fn_enforce_max_choices()
  IS 'BEFORE INSERT on vote_options. Enforces: single_choice/rating max 1, multiple_choice max max_choices, numeric blocked. Minimum counts enforced at app layer.';

-- ============================================================
-- Vote shape validation: numeric_value consistency
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_enforce_vote_shape()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_kind public.poll_kind;
BEGIN
  SELECT kind INTO v_kind
  FROM public.polls
  WHERE id = NEW.poll_id;

  IF v_kind = 'numeric' THEN
    IF NEW.numeric_value IS NULL THEN
      RAISE EXCEPTION 'Numeric polls require numeric_value.';
    END IF;
  ELSE
    IF NEW.numeric_value IS NOT NULL THEN
      RAISE EXCEPTION 'Only numeric polls can use numeric_value.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_vote_shape
BEFORE INSERT OR UPDATE ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.fn_enforce_vote_shape();

COMMENT ON FUNCTION public.fn_enforce_vote_shape()
  IS 'Enforces: numeric polls require numeric_value (NOT NULL), non-numeric polls forbid it (IS NULL).';
