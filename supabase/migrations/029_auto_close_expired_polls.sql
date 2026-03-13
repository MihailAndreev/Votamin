-- ============================================================
-- Migration 029: Auto-close expired polls (helpers + scheduler)
-- ============================================================

-- Safety check: public.polls.id must be uuid
DO $$
DECLARE
  v_type text;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
    INTO v_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'polls'
    AND a.attname = 'id'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF v_type IS DISTINCT FROM 'uuid' THEN
    RAISE EXCEPTION 'Expected public.polls.id to be uuid, got: %', coalesce(v_type, 'NULL');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_polls_open_ends_at
  ON public.polls (ends_at)
  WHERE status = 'open' AND ends_at IS NOT NULL;

-- Per-poll helper
CREATE OR REPLACE FUNCTION public.auto_close_poll_if_expired(p_poll_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_rows integer := 0;
BEGIN
  UPDATE public.polls
     SET status = 'closed',
         updated_at = now()
   WHERE id = p_poll_id
     AND status = 'open'
     AND ends_at IS NOT NULL
     AND ends_at <= now();

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$;

ALTER FUNCTION public.auto_close_poll_if_expired(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.auto_close_poll_if_expired(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auto_close_poll_if_expired(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.auto_close_poll_if_expired(uuid) TO authenticated;

COMMENT ON FUNCTION public.auto_close_poll_if_expired(uuid)
  IS 'Closes one open poll if ends_at <= now(). Returns true if status changed.';

-- Bulk helper
CREATE OR REPLACE FUNCTION public.auto_close_expired_polls()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  closed_count integer := 0;
BEGIN
  UPDATE public.polls
     SET status = 'closed',
         updated_at = now()
   WHERE status = 'open'
     AND ends_at IS NOT NULL
     AND ends_at <= now();

  GET DIAGNOSTICS closed_count = ROW_COUNT;
  RETURN closed_count;
END;
$$;

ALTER FUNCTION public.auto_close_expired_polls() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.auto_close_expired_polls() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auto_close_expired_polls() TO service_role;

COMMENT ON FUNCTION public.auto_close_expired_polls()
  IS 'Closes all open polls with ends_at <= now(). Returns number of affected rows.';

-- Scheduler (true automatic close, ~1 min latency)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid
    INTO v_job_id
    FROM cron.job
   WHERE jobname = 'auto-close-expired-polls-every-minute'
   LIMIT 1;

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'auto-close-expired-polls-every-minute',
  '* * * * *',
  $$SELECT public.auto_close_expired_polls();$$
);
