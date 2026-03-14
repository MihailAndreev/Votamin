import { supabaseClient } from '@utils/supabase.js';
import { getCurrentUser } from '@utils/auth.js';
import { computePollStatus } from '@utils/helpers.js';

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
  
  const now = new Date().toISOString();
  if (status === 'open') {
    return query.eq('status', 'open').or(`ends_at.is.null,ends_at.gt.${now}`);
  }
  if (status === 'closed') {
    return query.or(`status.eq.closed,and(status.eq.open,ends_at.lte.${now})`);
  }
  return query.eq('status', status);
}

function generateShareCode(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function syncExpiredPolls() {
  const { error } = await supabaseClient.rpc('auto_close_expired_polls');
  if (error) {
    console.warn('Failed to auto-close expired polls:', error);
  }
}

export async function fetchMyPollsList({ status = 'all' } = {}) {
  const user = requireCurrentUser();
  await syncExpiredPolls();

  let pollsQuery = supabaseClient
    .from('polls')
    .select('id, title, status, ends_at, response_count, updated_at')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  pollsQuery = applyStatusFilter(pollsQuery, status);

  const { data: polls, error: pollsError } = await pollsQuery;
  if (pollsError) throw pollsError;

  const pollIds = (polls || []).map((poll) => poll.id);
  if (pollIds.length === 0) return [];

  const { data: voteRows, error: voteRowsError } = await supabaseClient
    .from('votes')
    .select('poll_id')
    .in('poll_id', pollIds);

  if (voteRowsError) throw voteRowsError;

  const responseCountByPoll = new Map();
  (voteRows || []).forEach((row) => {
    const currentCount = responseCountByPoll.get(row.poll_id) || 0;
    responseCountByPoll.set(row.poll_id, currentCount + 1);
  });

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
    status: computePollStatus(poll),
    response_count: responseCountByPoll.get(poll.id) || 0,
    options_count: optionsCountByPoll.get(poll.id) || 0,
    share_code: shareCodeByPoll.get(poll.id) || null,
  }));
}

export async function fetchPollById(pollId) {
  if (!pollId) {
    throw new Error('Missing poll id');
  }

  const user = requireCurrentUser();
  await syncExpiredPolls();

  const { data: poll, error: pollError } = await supabaseClient
    .from('polls')
    .select('id, owner_id, title, description_html, kind, visibility, results_visibility, status, ends_at, response_count, created_at, updated_at')
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

  let resultsAccess = null;
  const { data: accessRows, error: accessError } = await supabaseClient
    .rpc('get_poll_results_access', { p_poll_id: pollId });

  if (!accessError && Array.isArray(accessRows) && accessRows.length > 0) {
    resultsAccess = accessRows[0];
  }

  let summary = null;
  const { data: summaryRows, error: summaryError } = await supabaseClient
    .rpc('get_poll_results_summary', { p_poll_id: pollId });

  if (!summaryError && Array.isArray(summaryRows) && summaryRows.length > 0) {
    summary = summaryRows[0];
  }

  const totalVotes = Number(summary?.total_votes ?? poll.response_count ?? 0);

  const normalizedOptions = Array.isArray(summary?.option_results)
    ? summary.option_results.map((item) => ({
        id: item.id,
        text: item.text,
        position: item.position,
        votes_count: item.votes_count,
        percentage: item.percentage,
      }))
    : (options || []).map((option) => ({
        ...option,
        votes_count: 0,
        percentage: 0,
      }));

  const numericSummary = (summary?.numeric_avg !== null && summary?.numeric_avg !== undefined)
    ? {
        avg: Number(summary.numeric_avg),
        min: Number(summary.numeric_min),
        max: Number(summary.numeric_max),
      }
    : null;

  return {
    id: poll.id,
    title: poll.title,
    description: stripHtml(poll.description_html),
    description_html: poll.description_html,
    kind: poll.kind,
    visibility: poll.visibility,
    results_visibility: poll.results_visibility,
    status: computePollStatus(poll),
    ends_at: poll.ends_at,
    created_at: poll.created_at,
    updated_at: poll.updated_at,
    response_count: poll.response_count,
    owner_id: poll.owner_id,
    share_code: shareRow?.share_code || null,
    is_owner: poll.owner_id === user.id,
    is_admin: Boolean(resultsAccess?.is_admin),
    has_voted: Boolean(resultsAccess?.has_voted),
    can_view_results: Boolean(summary?.can_view_results ?? resultsAccess?.can_view_results ?? (poll.owner_id === user.id)),
    options: normalizedOptions,
    total_votes: totalVotes,
    numeric_summary: numericSummary,
  };
}

export async function fetchPollVoters(pollId) {
  if (!pollId) return [];

  requireCurrentUser();

  const { data, error } = await supabaseClient.rpc('get_poll_voters_for_owner', {
    p_poll_id: pollId,
  });

  if (error) throw error;

  return (data || []).map((row) => ({
    voter_name: row.display_name || 'Анонимен',
    selections: Array.isArray(row.selections) ? row.selections : [],
    voted_at: row.voted_at,
  }));
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

export async function getOrCreatePollShareCode(pollId) {
  const user = requireCurrentUser();

  if (!pollId) {
    throw new Error('Missing poll id');
  }

  const { data: existingShare, error: fetchError } = await supabaseClient
    .from('poll_shares')
    .select('share_code')
    .eq('poll_id', pollId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existingShare?.share_code) return existingShare.share_code;

  for (let attempt = 0; attempt < 3; attempt++) {
    const candidateCode = generateShareCode();
    const { data: insertedShare, error: insertError } = await supabaseClient
      .from('poll_shares')
      .insert({
        poll_id: pollId,
        share_code: candidateCode,
        created_by: user.id,
      })
      .select('share_code')
      .single();

    if (!insertError && insertedShare?.share_code) {
      return insertedShare.share_code;
    }
  }

  const { data: fallbackShare, error: fallbackError } = await supabaseClient
    .from('poll_shares')
    .select('share_code')
    .eq('poll_id', pollId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallbackError) throw fallbackError;
  if (!fallbackShare?.share_code) {
    throw new Error('Failed to create share code');
  }

  return fallbackShare.share_code;
}
