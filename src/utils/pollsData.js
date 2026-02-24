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

function generateShareCode(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
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
    created_at: poll.created_at,
    updated_at: poll.updated_at,
    response_count: poll.response_count,
    owner_id: poll.owner_id,
    share_code: shareRow?.share_code || null,
    is_owner: poll.owner_id === user.id,
    options: normalizedOptions,
    total_votes: totalVotes,
    numeric_summary: numericSummary,
  };
}

export async function fetchPollVoters(pollId) {
  if (!pollId) return [];

  const { data: votes, error: votesError } = await supabaseClient
    .from('votes')
    .select('id, voter_user_id, created_at')
    .eq('poll_id', pollId)
    .order('created_at', { ascending: false });

  if (votesError) throw votesError;
  if (!votes || votes.length === 0) return [];

  const voteIds = votes.map((v) => v.id);
  const voterIds = [...new Set(votes.map((v) => v.voter_user_id))];

  // Fetch selected options per vote
  const { data: selections, error: selError } = await supabaseClient
    .from('vote_options')
    .select('vote_id, option_id')
    .in('vote_id', voteIds);

  if (selError) throw selError;

  // Fetch option texts
  const { data: options } = await supabaseClient
    .from('poll_options')
    .select('id, text')
    .eq('poll_id', pollId);

  const optionTextMap = new Map((options || []).map((o) => [o.id, o.text]));

  // Fetch voter profiles
  const { data: profiles } = await supabaseClient
    .from('profiles')
    .select('user_id, full_name')
    .in('user_id', voterIds);

  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name || 'Анонимен']));

  // Build selections per vote
  const selectionsByVote = new Map();
  (selections || []).forEach((s) => {
    const arr = selectionsByVote.get(s.vote_id) || [];
    arr.push(optionTextMap.get(s.option_id) || '—');
    selectionsByVote.set(s.vote_id, arr);
  });

  return votes.map((v) => ({
    voter_name: profileMap.get(v.voter_user_id) || 'Анонимен',
    selections: selectionsByVote.get(v.id) || [],
    voted_at: v.created_at,
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
