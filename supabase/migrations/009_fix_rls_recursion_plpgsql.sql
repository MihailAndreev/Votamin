-- Migration 009: Fix RLS infinite recursion with plpgsql, SECURITY DEFINER, and row_security = off
-- ================================================================

-- 1. Пренаписваме has_voted_in_poll на plpgsql с изключен RLS
CREATE OR REPLACE FUNCTION public.has_voted_in_poll(check_poll_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
SET row_security = off
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.votes
    WHERE poll_id = check_poll_id
      AND voter_user_id = auth.uid()
  );
END;
$$;

ALTER FUNCTION public.has_voted_in_poll(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.has_voted_in_poll(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_voted_in_poll(UUID) TO authenticated;


-- 2. Създаваме is_poll_owner като SECURITY DEFINER (plpgsql) с изключен RLS
CREATE OR REPLACE FUNCTION public.is_poll_owner(poll_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
SET row_security = off
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.polls
    WHERE id = poll_uuid
      AND owner_id = auth.uid()
  );
END;
$$;

ALTER FUNCTION public.is_poll_owner(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_poll_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_poll_owner(UUID) TO authenticated;


-- 3. Обновяваме политиките в таблицата votes
DROP POLICY IF EXISTS owner_select_votes_on_own_polls ON votes;
CREATE POLICY owner_select_votes_on_own_polls ON votes
  FOR SELECT
  TO authenticated
  USING (public.is_poll_owner(poll_id));

DROP POLICY IF EXISTS owner_delete_votes_from_own_polls ON votes;
CREATE POLICY owner_delete_votes_from_own_polls ON votes
  FOR DELETE
  TO authenticated
  USING (public.is_poll_owner(poll_id));
