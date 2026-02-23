/* ============================================================
   Votamin – Dashboard Data Layer
   ============================================================ */
import { supabaseClient } from '@utils/supabase.js';
import { getCurrentUser } from '@utils/auth.js';

const UNKNOWN_OWNER_NAME = 'Unknown';

function requireCurrentUser() {
  const user = getCurrentUser();
  if (!user?.id) {
    throw new Error('User is not authenticated');
  }
  return user;
}

function normalizeOwnerName(fullName) {
  if (typeof fullName !== 'string') return null;
  const trimmed = fullName.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function applyPollStatusFilter(query, status) {
  if (!status || status === 'all') return query;
  return query.eq('status', status);
}

function mapOwnerRows(ownerRows) {
  return new Map(
    (ownerRows || []).map((owner) => [owner.user_id, {
      full_name: normalizeOwnerName(owner.full_name),
      avatar_url: owner.avatar_url || null,
    }])
  );
}

export async function fetchDashboardMyPolls({ status = 'all' } = {}) {
  const user = requireCurrentUser();

  let pollsQuery = supabaseClient
    .from('polls')
    .select('id, title, kind, response_count, ends_at, status, owner_id, updated_at')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  pollsQuery = applyPollStatusFilter(pollsQuery, status);

  const { data: polls, error: pollsError } = await pollsQuery;
  if (pollsError) throw pollsError;

  const pollIds = (polls || []).map((poll) => poll.id);
  if (pollIds.length === 0) return [];

  const { data: myVotes, error: votesError } = await supabaseClient
    .from('votes')
    .select('poll_id')
    .eq('voter_user_id', user.id)
    .in('poll_id', pollIds);

  if (votesError) throw votesError;

  const votedPollIds = new Set((myVotes || []).map((vote) => vote.poll_id));

  return polls.map((poll) => ({
    ...poll,
    my_response: votedPollIds.has(poll.id),
  }));
}

export async function fetchDashboardSharedPolls({ status = 'all' } = {}) {
  const user = requireCurrentUser();

  const { data: voteRows, error: votesError } = await supabaseClient
    .from('votes')
    .select('poll_id')
    .eq('voter_user_id', user.id);

  if (votesError) throw votesError;

  const pollIds = [...new Set((voteRows || []).map((row) => row.poll_id).filter(Boolean))];
  if (pollIds.length === 0) return [];

  let sharedPollsQuery = supabaseClient
    .from('polls')
    .select('id, title, owner_id, ends_at, status, kind, response_count, updated_at')
    .in('id', pollIds)
    .neq('owner_id', user.id)
    .neq('status', 'draft')
    .order('updated_at', { ascending: false });

  sharedPollsQuery = applyPollStatusFilter(sharedPollsQuery, status);

  const { data: sharedPolls, error: sharedPollsError } = await sharedPollsQuery;
  if (sharedPollsError) throw sharedPollsError;

  let ownersById = new Map();
  const { data: ownerRows, error: ownersError } = await supabaseClient.rpc('get_shared_poll_owners');
  if (!ownersError) {
    ownersById = mapOwnerRows(ownerRows);
  }

  return (sharedPolls || []).map((poll) => {
    const owner = ownersById.get(poll.owner_id);
    return {
      ...poll,
      owner_name: owner?.full_name ?? UNKNOWN_OWNER_NAME,
      owner_avatar_url: owner?.avatar_url ?? null,
    };
  });
}

export const dashboardDataApi = {
  fetchDashboardMyPolls,
  fetchDashboardSharedPolls,
};
