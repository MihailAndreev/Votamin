import { supabaseClient } from '@utils/supabase.js';

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export async function fetchHomePublicStats() {
  const { data, error } = await supabaseClient.rpc('get_home_public_stats');
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;

  return {
    usersCount: toNumber(row?.users_count),
    pollsCount: toNumber(row?.polls_count),
    votesCount: toNumber(row?.votes_count),
    openPollsCount: toNumber(row?.open_polls_count),
  };
}
