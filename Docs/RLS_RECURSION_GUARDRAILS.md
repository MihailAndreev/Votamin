# RLS Recursion Guardrails

## Why this exists

Votamin had multiple `infinite recursion detected in policy for relation` errors caused by bidirectional policy dependencies between tables.

## Cycles that were fixed

### Cycle A: `polls` ↔ `votes`

- `polls.participant_select_voted_polls` called `has_voted_in_poll(id)`
- `has_voted_in_poll()` queried `votes`
- `votes.owner_*` policies queried `polls`
- This re-entered `polls` policies and produced recursion

### Cycle B: `polls` ↔ `poll_shares`

- `polls.anyone_select_polls_via_share_code` queried `poll_shares`
- `poll_shares.owner_*` policies queried `polls`
- This re-entered `polls` policies and produced recursion

## Hardening pattern used

For cross-table checks inside policies, use helper functions with:

- `SECURITY DEFINER`
- `LANGUAGE plpgsql` (not `sql`, to avoid SQL inlining)
- `SET search_path = public`
- `SET row_security = off`
- owner set to `postgres` (BYPASSRLS in Supabase)
- `REVOKE ALL ... FROM PUBLIC` + explicit `GRANT EXECUTE` only to required roles

## Functions introduced/updated

- `has_voted_in_poll(uuid)`
- `is_poll_owner(uuid)`
- `poll_is_open_for_voting(uuid)`
- `is_admin(uuid)` (includes anti-enumeration check)
- `has_valid_share_for_poll(uuid)`

## Policies switched to helper functions

- `votes.owner_select_votes_on_own_polls` → `is_poll_owner(poll_id)`
- `votes.owner_delete_votes_from_own_polls` → `is_poll_owner(poll_id)`
- `polls.anyone_select_polls_via_share_code` → `has_valid_share_for_poll(id)`
- `poll_shares.owner_select_own_poll_shares` → `is_poll_owner(poll_id)`
- `poll_shares.owner_insert_poll_shares` → `is_poll_owner(poll_id)`
- `poll_shares.owner_delete_poll_shares` → `is_poll_owner(poll_id)`

## Anti-enumeration rule for `is_admin`

`is_admin(check_user_id)` returns `FALSE` unless `check_user_id` equals `auth.uid()`:

```sql
IF auth.uid() IS NULL OR check_user_id IS DISTINCT FROM auth.uid() THEN
  RETURN FALSE;
END IF;
```

This keeps policy behavior correct while preventing arbitrary role probing.

## Operational checklist for new RLS policies

Before adding a policy with `EXISTS (SELECT ... FROM other_table ...)`:

1. Check if the other table has policies that read back from the current table.
2. If yes, move the cross-table check into a hardened helper function.
3. Keep policy expressions simple and one-directional.
4. Re-run smoke tests for both `anon` and `authenticated` contexts.

## Related migrations

- `009_fix_rls_recursion_plpgsql`
- `010_fix_remaining_rls_functions`
- `011_fix_rls_recursion_polls_poll_shares`
