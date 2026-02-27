/* ============================================================
   Votamin – Admin Data Utility
   Calls admin-only Supabase RPCs for the admin panel.
   ============================================================ */
import { supabaseClient } from './supabase.js';

// ── User Stats ───────────────────────────────────────
export async function fetchAdminUserStats() {
  const { data, error } = await supabaseClient.rpc('admin_get_user_stats');
  if (error) throw error;
  return data?.[0] || data;
}

// ── List Users ───────────────────────────────────────
export async function fetchAdminUsers({
  search = '',
  role = '',
  status = '',
  sortBy = 'created_at',
  sortDir = 'desc',
  limit = 20,
  offset = 0
} = {}) {
  const { data, error } = await supabaseClient.rpc('admin_list_users', {
    p_search: search || null,
    p_role: role || null,
    p_status: status || null,
    p_sort_by: sortBy,
    p_sort_dir: sortDir,
    p_limit: limit,
    p_offset: offset
  });
  if (error) throw error;
  return data || [];
}

// ── Count Users ──────────────────────────────────────
export async function countAdminUsers({ search = '', role = '', status = '' } = {}) {
  const { data, error } = await supabaseClient.rpc('admin_count_users', {
    p_search: search || null,
    p_role: role || null,
    p_status: status || null
  });
  if (error) throw error;
  return Number(data) || 0;
}

// ── Set User Role ────────────────────────────────────
export async function setUserRole(userId, newRole) {
  const { error } = await supabaseClient.rpc('admin_set_user_role', {
    p_target_user_id: userId,
    p_new_role: newRole
  });
  if (error) throw error;
}

// ── Delete User ──────────────────────────────────────
export async function deleteUser(userId) {
  const { error } = await supabaseClient.rpc('admin_delete_user', {
    p_target_user_id: userId
  });
  if (error) throw error;
}

// ── Poll Stats ───────────────────────────────────────
export async function fetchAdminPollStats() {
  const { data, error } = await supabaseClient.rpc('admin_get_poll_stats');
  if (error) throw error;
  return data?.[0] || data;
}

// ── List Polls ───────────────────────────────────────
export async function fetchAdminPolls({
  searchTitle = '',
  searchAuthor = '',
  status = '',
  visibility = '',
  sortBy = 'created_at',
  sortDir = 'desc',
  limit = 20,
  offset = 0
} = {}) {
  const { data, error } = await supabaseClient.rpc('admin_list_polls', {
    p_search_title: searchTitle || null,
    p_search_author: searchAuthor || null,
    p_status: status || null,
    p_visibility: visibility || null,
    p_sort_by: sortBy,
    p_sort_dir: sortDir,
    p_limit: limit,
    p_offset: offset
  });
  if (error) throw error;
  return data || [];
}

// ── Count Polls ──────────────────────────────────────
export async function countAdminPolls({ searchTitle = '', searchAuthor = '', status = '', visibility = '' } = {}) {
  const { data, error } = await supabaseClient.rpc('admin_count_polls', {
    p_search_title: searchTitle || null,
    p_search_author: searchAuthor || null,
    p_status: status || null,
    p_visibility: visibility || null
  });
  if (error) throw error;
  return Number(data) || 0;
}

// ── Update Poll ──────────────────────────────────────
export async function adminUpdatePoll(pollId, { status, visibility, title } = {}) {
  const { error } = await supabaseClient.rpc('admin_update_poll', {
    p_poll_id: pollId,
    p_status: status || null,
    p_visibility: visibility || null,
    p_title: title || null
  });
  if (error) throw error;
}

// ── Delete Poll ──────────────────────────────────────
export async function adminDeletePoll(pollId) {
  const { error } = await supabaseClient.rpc('admin_delete_poll', {
    p_poll_id: pollId
  });
  if (error) throw error;
}

// ── Reset Votes ──────────────────────────────────────
export async function adminResetPollVotes(pollId) {
  const { error } = await supabaseClient.rpc('admin_reset_poll_votes', {
    p_poll_id: pollId
  });
  if (error) throw error;
}

// ── Get Poll Voters ──────────────────────────────────
export async function adminGetPollVoters(pollId) {
  const { data, error } = await supabaseClient.rpc('admin_get_poll_voters', {
    p_poll_id: pollId
  });
  if (error) throw error;
  return data || [];
}

// ── Set User Status (block/unblock) ──────────────────
export async function setUserStatus(userId, newStatus) {
  const { error } = await supabaseClient.rpc('admin_set_user_status', {
    p_target_user_id: userId,
    p_new_status: newStatus
  });
  if (error) throw error;
}

// ── Toggle Featured Poll ─────────────────────────────
export async function adminToggleFeatured(pollId) {
  const { data, error } = await supabaseClient.rpc('admin_toggle_featured', {
    p_poll_id: pollId
  });
  if (error) throw error;
  return data; // returns new boolean value
}

// ── Duplicate Poll ───────────────────────────────────
export async function adminDuplicatePoll(pollId) {
  const { data, error } = await supabaseClient.rpc('admin_duplicate_poll', {
    p_poll_id: pollId
  });
  if (error) throw error;
  return data; // returns new poll UUID
}
