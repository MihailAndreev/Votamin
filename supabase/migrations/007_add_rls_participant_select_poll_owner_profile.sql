-- ================================================================
-- Migration 007: Public identity RPC for poll owners
-- Purpose: Expose limited profile fields (full_name, avatar_url) for polls I voted in
-- ================================================================

create or replace function public.get_shared_poll_owners()
returns table (
  user_id uuid,
  full_name text,
  avatar_url text
)
language sql
security definer
set search_path = public
as $$
  select distinct
    p.user_id,
    nullif(btrim(p.full_name), '') as full_name,
    p.avatar_url
  from public.polls poll
  join public.votes v
    on v.poll_id = poll.id
  join public.profiles p
    on p.user_id = poll.owner_id
  where v.voter_user_id = auth.uid()
    and poll.owner_id <> auth.uid()
    and poll.status <> 'draft';
$$;

revoke all on function public.get_shared_poll_owners() from public;
grant execute on function public.get_shared_poll_owners() to authenticated;
