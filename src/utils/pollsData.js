import { supabaseClient } from '@utils/supabase.js';
import { getCurrentUser } from '@utils/auth.js';

function requireCurrentUser() {
  const user = getCurrentUser();
  if (!user?.id) {
    throw new Error('User is not authenticated');
  }
  return user;
}

function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function applyStatusFilter(query, status) {
  if (!status || status === 'all') return query;
  return query.eq('status', status);
}

export async function fetchMyPollsList({ status = 'all' } = {}) {
  const user = requireCurrentUser();

  let pollsQuery = supabaseClient
    .from('polls')
    .select('id, title, status, response_count, updated_at')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  pollsQuery = applyStatusFilter(pollsQuery, status);

  const { data: polls, error: pollsError } = await pollsQuery;
  if (pollsError) throw pollsError;

  const pollIds = (polls || []).map((poll) => poll.id);
  if (pollIds.length === 0) return [];

  const { data: optionRows, error: optionsError } = await supabaseClient
    .from('poll_options')
    .select('poll_id')
    .in('poll_id', pollIds);

  if (optionsError) throw optionsError;

  const optionsCountByPoll = new Map();
  (optionRows || []).forEach((row) => {
    const currentCount = optionsCountByPoll.get(row.poll_id) || 0;
    optionsCountByPoll.set(row.poll_id, currentCount + 1);
  });

  const { data: shareRows } = await supabaseClient
    .from('poll_shares')
    .select('poll_id, share_code, created_at')
    .in('poll_id', pollIds)
    .order('created_at', { ascending: false });

  const shareCodeByPoll = new Map();
  (shareRows || []).forEach((row) => {
    if (!shareCodeByPoll.has(row.poll_id)) {
      shareCodeByPoll.set(row.poll_id, row.share_code);
    }
  });

  return polls.map((poll) => ({
    ...poll,
    options_count: optionsCountByPoll.get(poll.id) || 0,
    share_code: shareCodeByPoll.get(poll.id) || null,
  }));
}

export async function fetchPollById(pollId) {
  if (!pollId) {
    throw new Error('Missing poll id');
  }

  const user = requireCurrentUser();

  const { data: poll, error: pollError } = await supabaseClient
    .from('polls')
    .select('id, owner_id, title, description_html, kind, visibility, status, ends_at, response_count, created_at, updated_at')
    .eq('id', pollId)
    .single();

  if (pollError) throw pollError;

  const { data: options, error: optionsError } = await supabaseClient
    .from('poll_options')
    .select('id, text, position')
    .eq('poll_id', pollId)
    .order('position', { ascending: true });

  if (optionsError) throw optionsError;

  const { data: shareRow } = await supabaseClient
    .from('poll_shares')
    .select('share_code')
    .eq('poll_id', pollId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: voteRows, error: voteRowsError } = await supabaseClient
    .from('votes')
    .select('id, numeric_value')
    .eq('poll_id', pollId);

  if (voteRowsError) throw voteRowsError;

  const voteIds = (voteRows || []).map((row) => row.id);
  const numericValues = (voteRows || []).map((row) => row.numeric_value).filter((value) => typeof value === 'number');

  let optionSelections = [];
  if (voteIds.length > 0) {
    const { data: selections, error: selectionsError } = await supabaseClient
      .from('vote_options')
      .select('option_id')
      .in('vote_id', voteIds);

    if (selectionsError) throw selectionsError;
    optionSelections = selections || [];
  }

  const optionCountMap = new Map();
  optionSelections.forEach((selection) => {
    const currentCount = optionCountMap.get(selection.option_id) || 0;
    optionCountMap.set(selection.option_id, currentCount + 1);
  });

  const totalVotes = voteRows?.length || 0;
  const normalizedOptions = (options || []).map((option) => {
    const votesCount = optionCountMap.get(option.id) || 0;
    const percentage = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
    return {
      ...option,
      votes_count: votesCount,
      percentage,
    };
  });

  const numericSummary = numericValues.length > 0
    ? {
        avg: Number((numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length).toFixed(2)),
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
      }
    : null;

  return {
    id: poll.id,
    title: poll.title,
    description: stripHtml(poll.description_html),
    description_html: poll.description_html,
    kind: poll.kind,
    visibility: poll.visibility,
    status: poll.status,
    ends_at: poll.ends_at,
    response_count: poll.response_count,
    owner_id: poll.owner_id,
    share_code: shareRow?.share_code || null,
    is_owner: poll.owner_id === user.id,
    options: normalizedOptions,
    total_votes: totalVotes,
    numeric_summary: numericSummary,
  };
}

export async function updatePollById(pollId, updates) {
  requireCurrentUser();

  const { data, error } = await supabaseClient
    .from('polls')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pollId)
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function closePollById(pollId) {
  return updatePollById(pollId, { status: 'closed' });
}

export async function deletePollById(pollId) {
  requireCurrentUser();

  const { error } = await supabaseClient
    .from('polls')
    .delete()
    .eq('id', pollId);

  if (error) throw error;
}
