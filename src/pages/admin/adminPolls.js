/* ============================================================
   Admin Panel – Polls Tab
   ============================================================ */
import { i18n } from '../../i18n/index.js';
import { showToast } from '@utils/toast.js';
import { showConfirmModal } from '@components/confirmModal.js';
import { navigateTo } from '../../router.js';
import {
  fetchAdminPollStats,
  fetchAdminPolls,
  countAdminPolls,
  adminUpdatePoll,
  adminDeletePoll,
  adminResetPollVotes,
  adminGetPollVoters,
  adminToggleFeatured,
  adminDuplicatePoll
} from '@utils/adminData.js';
import { formatDate } from '@utils/helpers.js';

const PAGE_SIZE = 15;

let state = {
  polls: [],
  total: 0,
  page: 1,
  searchTitle: '',
  searchAuthor: '',
  statusFilter: '',
  visibilityFilter: '',
  sortBy: 'created_at',
  sortDir: 'desc',
  stats: null,
  loading: false
};

const actionDelegationBound = new WeakSet();
let activeLanguageChangedHandler = null;
let activeSearchOutsideClickHandler = null;
let keepSearchFocus = false;
let searchCaretPosition = null;
let activeSearchFieldId = null;

function getOffset() {
  return (state.page - 1) * PAGE_SIZE;
}

function totalPages() {
  return Math.max(1, Math.ceil(state.total / PAGE_SIZE));
}

// ── Status badge helper ────────────────────────────
function statusBadge(status) {
  const map = {
    open: 'bg-success',
    closed: 'bg-danger',
    draft: 'bg-secondary'
  };
  const cls = map[status] || 'bg-secondary';
  const label = i18n.t(`dashboard.status.${status}`) || status;
  return `<span class="badge ${cls}">${label}</span>`;
}

function visibilityBadge(vis) {
  if (vis === 'public') return `<span class="badge bg-info text-dark">${i18n.t('admin.polls.public')}</span>`;
  if (vis === 'unlisted') return `<span class="badge bg-warning text-dark">${i18n.t('admin.polls.unlisted')}</span>`;
  return `<span class="badge bg-secondary">${i18n.t('admin.polls.private')}</span>`;
}

// ── Stats Cards ────────────────────────────────────
function renderStatsCards(stats) {
  if (!stats) {
    return `
      <div class="row g-2 mb-3 vm-admin-stats-row vm-admin-stats-row--polls" aria-hidden="true">
        ${Array.from({ length: 7 }).map((_, index) => `
          <div class="${index === 6 ? 'col-12 col-lg-6 col-xl' : 'col-6 col-lg-3 col-xl'}">
            <div class="vm-card p-2 text-center vm-admin-stat-card vm-admin-stat-card--skeleton">
              <div class="vm-admin-stat-skeleton-value ${index === 6 ? 'vm-admin-stat-skeleton-value--title' : ''}"></div>
              <div class="vm-admin-stat-skeleton-label"></div>
            </div>
          </div>
        `).join('')}
      </div>`;
  }
  return `
    <div class="row g-2 mb-3 vm-admin-stats-row vm-admin-stats-row--polls">
      <div class="col-6 col-lg-3 col-xl">
        <div class="vm-card p-2 text-center vm-admin-stat-card">
          <div class="fw-bold vm-gradient-text vm-admin-stat-value">${stats.total_polls ?? 0}</div>
          <div class="text-muted small" data-i18n="admin.polls.totalPolls">${i18n.t('admin.polls.totalPolls')}</div>
        </div>
      </div>
      <div class="col-6 col-lg-3 col-xl">
        <div class="vm-card p-2 text-center vm-admin-stat-card">
          <div class="fw-bold vm-admin-stat-value" style="color:var(--vm-teal);">${stats.active_polls ?? 0}</div>
          <div class="text-muted small" data-i18n="admin.polls.activePolls">${i18n.t('admin.polls.activePolls')}</div>
        </div>
      </div>
      <div class="col-6 col-lg-3 col-xl">
        <div class="vm-card p-2 text-center vm-admin-stat-card">
          <div class="fw-bold vm-admin-stat-value" style="color:var(--vm-orange);">${stats.total_votes ?? 0}</div>
          <div class="text-muted small" data-i18n="admin.polls.totalVotes">${i18n.t('admin.polls.totalVotes')}</div>
        </div>
      </div>
      <div class="col-6 col-lg-3 col-xl">
        <div class="vm-card p-2 text-center vm-admin-stat-card">
          <div class="fw-bold vm-admin-stat-value" style="color:var(--vm-yellow);">${stats.avg_votes_per_poll ?? 0}</div>
          <div class="text-muted small" data-i18n="admin.polls.avgVotes">${i18n.t('admin.polls.avgVotes')}</div>
        </div>
      </div>
      <div class="col-6 col-lg-3 col-xl">
        <div class="vm-card p-2 text-center vm-admin-stat-card">
          <div class="fw-bold vm-admin-stat-value" style="color:var(--bs-danger);">${stats.closed_polls ?? 0}</div>
          <div class="text-muted small" data-i18n="admin.polls.closedPolls">${i18n.t('admin.polls.closedPolls')}</div>
        </div>
      </div>
      <div class="col-6 col-lg-3 col-xl">
        <div class="vm-card p-2 text-center vm-admin-stat-card">
          <div class="fw-bold vm-admin-stat-value" style="color:var(--bs-secondary);">${stats.polls_with_zero_votes ?? 0}</div>
          <div class="text-muted small" data-i18n="admin.polls.zeroVotes">${i18n.t('admin.polls.zeroVotes')}</div>
        </div>
      </div>
      <div class="col-12 col-lg-6 col-xl">
        <div class="vm-card p-2 text-center vm-admin-stat-card">
          <div class="fw-bold vm-gradient-text vm-admin-stat-value vm-admin-stat-value--title text-truncate" title="${stats.most_voted_poll_title || '—'}">
            🏆 ${stats.most_voted_poll_title || '—'}
          </div>
          <div class="text-muted small">
            ${i18n.t('admin.polls.mostVoted')} (${stats.most_voted_poll_votes ?? 0} ${i18n.t('admin.polls.votesLabel')})
          </div>
        </div>
      </div>
    </div>`;
}

// ── Filters ────────────────────────────────────────
function renderFilters() {
  return `
    <div class="vm-admin-filters mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-12 col-lg-2">
          <input type="text" class="form-control form-control-sm"
                 id="admin-poll-search-title"
                 placeholder="${i18n.t('admin.polls.searchPlaceholder')}"
                 value="${state.searchTitle}">
        </div>
        <div class="col-12 col-lg-2">
          <input type="text" class="form-control form-control-sm"
                 id="admin-poll-search-author"
                 placeholder="${i18n.t('admin.polls.searchPlaceholderAuthor')}"
                 value="${state.searchAuthor}">
        </div>
        <div class="col-6 col-lg-2">
          <select class="form-select form-select-sm" id="admin-poll-status-filter">
            <option value="" ${!state.statusFilter ? 'selected' : ''}>${i18n.t('admin.polls.allStatuses')}</option>
            <option value="open" ${state.statusFilter === 'open' ? 'selected' : ''}>${i18n.t('dashboard.status.open')}</option>
            <option value="closed" ${state.statusFilter === 'closed' ? 'selected' : ''}>${i18n.t('dashboard.status.closed')}</option>
            <option value="draft" ${state.statusFilter === 'draft' ? 'selected' : ''}>${i18n.t('dashboard.status.draft')}</option>
          </select>
        </div>
        <div class="col-6 col-lg-2">
          <select class="form-select form-select-sm" id="admin-poll-vis-filter">
            <option value="" ${!state.visibilityFilter ? 'selected' : ''}>${i18n.t('admin.polls.allVisibility')}</option>
            <option value="public" ${state.visibilityFilter === 'public' ? 'selected' : ''}>${i18n.t('admin.polls.public')}</option>
            <option value="private" ${state.visibilityFilter === 'private' ? 'selected' : ''}>${i18n.t('admin.polls.private')}</option>
          </select>
        </div>
        <div class="col-6 col-lg-2">
          <select class="form-select form-select-sm" id="admin-poll-sort">
            <option value="created_at" ${state.sortBy === 'created_at' ? 'selected' : ''}>${i18n.t('admin.polls.sortNewest')}</option>
            <option value="votes" ${state.sortBy === 'votes' ? 'selected' : ''}>${i18n.t('admin.polls.sortMostVotes')}</option>
            <option value="title" ${state.sortBy === 'title' ? 'selected' : ''}>${i18n.t('admin.polls.sortTitle')}</option>
          </select>
        </div>
        <div class="col-12 col-lg-auto ms-lg-auto">
          <button class="btn btn-sm btn-votamin-outline w-100 vm-admin-filter-reset-btn" id="admin-poll-reset-filters">
            <span data-i18n="admin.polls.resetFilters">${i18n.t('admin.polls.resetFilters')}</span>
          </button>
        </div>
      </div>
    </div>`;
}

// ── Polls Table ────────────────────────────────────
function renderPollsTable() {
  if (state.loading) {
    return '<div class="vm-loader-wrapper py-5"><div class="vm-loader"></div></div>';
  }

  if (!state.polls.length) {
    return `<div class="text-center text-muted py-5" data-i18n="admin.polls.noPolls">${i18n.t('admin.polls.noPolls')}</div>`;
  }

  const renderCardActions = (pollId, pollTitle, status) => {
    const actions = [
      `<button class="btn btn-sm btn-votamin-outline" data-action="view-poll" data-pid="${pollId}">${i18n.t('admin.polls.viewDetails')}</button>`,
      `<button class="btn btn-sm btn-votamin-outline" data-action="view-voters" data-pid="${pollId}" data-title="${pollTitle}">${i18n.t('admin.polls.viewVoters')}</button>`
    ];

    if (status === 'open') {
      actions.push(`<button class="btn btn-sm btn-votamin-outline" data-action="close-poll" data-pid="${pollId}">${i18n.t('admin.polls.closePoll')}</button>`);
    }

    if (status === 'closed') {
      actions.push(`<button class="btn btn-sm btn-votamin-outline" data-action="reopen-poll" data-pid="${pollId}">${i18n.t('admin.polls.reopenPoll')}</button>`);
    }

    actions.push(`<button class="btn btn-sm btn-votamin-outline" data-action="reset-votes" data-pid="${pollId}" data-title="${pollTitle}">${i18n.t('admin.polls.resetVotes')}</button>`);
    actions.push(`<button class="btn btn-sm btn-outline-danger" data-action="delete-poll" data-pid="${pollId}" data-title="${pollTitle}">${i18n.t('admin.polls.deletePoll')}</button>`);

    return actions.join('');
  };

  const rows = state.polls.map(p => {
    const pollId = p.poll_id || p.id;
    const featuredBadge = p.featured ? ' <span class="badge bg-warning text-dark ms-1" title="Featured">⭐</span>' : '';
    return `
      <tr>
        <td>
          <div class="fw-semibold small text-truncate" style="max-width:220px;" title="${p.title}">
            ${p.title}${featuredBadge}
          </div>
        </td>
        <td class="text-muted small">${p.creator_name || p.creator_email}</td>
        <td>${statusBadge(p.status)}</td>
        <td>${visibilityBadge(p.visibility)}</td>
        <td class="text-center"><span class="text-muted small">${p.votes_count}</span></td>
        <td class="text-muted small">${p.created_at ? formatDate(p.created_at) : '—'}</td>
        <td class="text-muted small">${p.ends_at ? formatDate(p.ends_at) : '—'}</td>
        <td>
          <div class="dropdown">
            <button class="btn btn-sm btn-votamin-outline dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
              <span data-i18n="admin.actions">${i18n.t('admin.actions')}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><button class="dropdown-item" data-action="view-poll" data-pid="${pollId}">
                📊 ${i18n.t('admin.polls.viewDetails')}
              </button></li>
              <li><button class="dropdown-item" data-action="view-voters" data-pid="${pollId}" data-title="${p.title}">
                👥 ${i18n.t('admin.polls.viewVoters')}
              </button></li>
              <li><hr class="dropdown-divider"></li>
              ${p.status === 'open' ? `
                <li><button class="dropdown-item" data-action="close-poll" data-pid="${pollId}">
                  🔒 ${i18n.t('admin.polls.closePoll')}
                </button></li>
              ` : ''}
              ${p.status === 'closed' ? `
                <li><button class="dropdown-item" data-action="reopen-poll" data-pid="${pollId}">
                  🔓 ${i18n.t('admin.polls.reopenPoll')}
                </button></li>
              ` : ''}
              <li><button class="dropdown-item text-warning" data-action="reset-votes" data-pid="${pollId}" data-title="${p.title}">
                🗑 ${i18n.t('admin.polls.resetVotes')}
              </button></li>
              <li><hr class="dropdown-divider"></li>
              <li><button class="dropdown-item text-danger" data-action="delete-poll" data-pid="${pollId}" data-title="${p.title}">
                ❌ ${i18n.t('admin.polls.deletePoll')}
              </button></li>
            </ul>
          </div>
        </td>
      </tr>`;
  }).join('');

  const cards = state.polls.map((p) => {
    const pollId = p.poll_id || p.id;
    const featuredBadge = p.featured ? '<span class="badge bg-warning text-dark">⭐</span>' : '';

    return `
      <article class="vm-admin-poll-card">
        <div class="vm-admin-poll-card-head">
          <div class="vm-admin-poll-card-title" title="${p.title}">${p.title}</div>
          <div class="vm-admin-poll-card-badges">
            ${featuredBadge}
            ${statusBadge(p.status)}
            ${visibilityBadge(p.visibility)}
          </div>
        </div>
        <div class="vm-admin-poll-card-creator">${p.creator_name || p.creator_email}</div>
        <div class="vm-admin-poll-card-meta">
          <span><strong>${i18n.t('admin.polls.colParticipants')}:</strong> ${p.votes_count}</span>
          <span><strong>${i18n.t('admin.polls.colCreated')}:</strong> ${p.created_at ? formatDate(p.created_at) : '—'}</span>
          <span><strong>${i18n.t('admin.polls.colExpires')}:</strong> ${p.ends_at ? formatDate(p.ends_at) : '—'}</span>
        </div>
        <div class="vm-admin-poll-card-actions">
          ${renderCardActions(pollId, p.title, p.status)}
        </div>
      </article>
    `;
  }).join('');

  return `
    <div class="table-responsive vm-admin-polls-table-wrap">
      <table class="table table-hover align-middle mb-0 vm-admin-table vm-admin-polls-table">
        <thead>
          <tr class="text-muted small">
            <th>${i18n.t('admin.polls.colTitle')}</th>
            <th>${i18n.t('admin.polls.colCreator')}</th>
            <th>${i18n.t('admin.polls.colStatus')}</th>
            <th>${i18n.t('admin.polls.colVisibility')}</th>
            <th class="text-center">${i18n.t('admin.polls.colParticipants')}</th>
            <th>${i18n.t('admin.polls.colCreated')}</th>
            <th>${i18n.t('admin.polls.colExpires')}</th>
            <th>${i18n.t('admin.polls.colActions')}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="vm-admin-polls-cards">${cards}</div>`;
}

// ── Pagination ─────────────────────────────────────
function renderPagination() {
  const pages = totalPages();
  if (pages <= 1) return '';
  const start = getOffset() + 1;
  const end = Math.min(getOffset() + PAGE_SIZE, state.total);

  return `
    <div class="vm-admin-pagination d-flex align-items-center justify-content-between mt-3">
      <span class="text-muted small">${i18n.t('dashboard.pagination.showing')} ${start}–${end} / ${state.total}</span>
      <div class="d-flex gap-1">
        <button class="btn btn-sm btn-votamin-outline" id="admin-poll-prev" ${state.page <= 1 ? 'disabled' : ''}>
          ${i18n.t('dashboard.pagination.prev')}
        </button>
        <span class="btn btn-sm btn-votamin disabled">${state.page} / ${pages}</span>
        <button class="btn btn-sm btn-votamin-outline" id="admin-poll-next" ${state.page >= pages ? 'disabled' : ''}>
          ${i18n.t('dashboard.pagination.next')}
        </button>
      </div>
    </div>`;
}

// ── Voters Modal ───────────────────────────────────
function showVotersModal(voters, pollTitle) {
  const existing = document.getElementById('admin-voters-modal');
  if (existing) existing.remove();

  const rows = voters.map(v => `
    <tr>
      <td class="small">${v.display_name}</td>
      <td class="small text-muted">${v.email || '—'}</td>
      <td class="small text-muted">${v.voted_at ? formatDate(v.voted_at) : '—'}</td>
      <td class="small">${(v.selections || []).join(', ') || '—'}</td>
    </tr>
  `).join('');

  const modal = document.createElement('div');
  modal.id = 'admin-voters-modal';
  modal.className = 'vm-confirm-backdrop';
  modal.innerHTML = `
    <div class="vm-confirm-modal" style="max-width:700px; max-height:80vh; overflow:auto;">
      <h5 class="vm-confirm-title">👥 ${i18n.t('admin.polls.votersFor')} "${pollTitle}"</h5>
      ${voters.length ? `
        <div class="table-responsive">
          <table class="table table-sm table-hover mb-0">
            <thead>
              <tr class="text-muted small">
                <th>${i18n.t('admin.polls.voterName')}</th>
                <th>Email</th>
                <th>${i18n.t('admin.polls.votedAt')}</th>
                <th>${i18n.t('admin.polls.selections')}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="mt-2">
          <button class="btn btn-sm btn-votamin-outline" id="admin-export-voters-csv">📥 CSV</button>
        </div>
      ` : `<p class="text-muted">${i18n.t('admin.polls.noVoters')}</p>`}
      <div class="vm-confirm-actions">
        <button type="button" class="btn btn-votamin-outline" data-action="close-voters-modal">
          ${i18n.t('common.close')}
        </button>
      </div>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-action="close-voters-modal"]')) {
      modal.remove();
    }
    if (e.target.closest('#admin-export-voters-csv')) {
      exportVotersCSV(voters, pollTitle);
    }
  });

  document.body.appendChild(modal);
}

function exportVotersCSV(voters, pollTitle) {
  if (!voters.length) return;
  const header = 'Name,Email,Voted At,Selections\n';
  const rows = voters.map(v =>
    `"${v.display_name}","${v.email || ''}","${v.voted_at || ''}","${(v.selections || []).join('; ')}"`
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `voters-${pollTitle.substring(0, 30)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(i18n.t('pollDetail.voters.exportSuccess'), 'success');
}

// ── Full Render ────────────────────────────────────
function renderContent(container) {
  container.innerHTML = `
    <details class="vm-admin-stats-accordion mb-3">
      <summary class="vm-admin-stats-summary" data-i18n="admin.stats.toggle">${i18n.t('admin.stats.toggle')}</summary>
      <div class="vm-admin-stats-accordion-body pt-2">
        ${renderStatsCards(state.stats)}
      </div>
    </details>
    <div class="vm-card p-4">
      <h5 class="fw-bold mb-3" data-i18n="admin.polls.tableTitle">${i18n.t('admin.polls.tableTitle')}</h5>
      ${renderFilters()}
      ${renderPollsTable()}
      ${renderPagination()}
    </div>`;
  bindEvents(container);
  i18n.loadTranslations();

  const fallbackSearchFieldId = 'admin-poll-search-title';
  const targetSearchFieldId = activeSearchFieldId || fallbackSearchFieldId;
  const searchInput = container.querySelector(`#${targetSearchFieldId}`);
  if (keepSearchFocus && searchInput) {
    searchInput.focus();
    const targetPos = searchCaretPosition ?? searchInput.value.length;
    const safePos = Math.max(0, Math.min(targetPos, searchInput.value.length));
    searchInput.setSelectionRange(safePos, safePos);
  }
}

// ── Load Data ──────────────────────────────────────
async function loadData(container) {
  state.loading = true;
  renderContent(container);

  try {
    const [stats, polls, total] = await Promise.all([
      state.stats ? Promise.resolve(state.stats) : fetchAdminPollStats(),
      fetchAdminPolls({
        searchTitle: state.searchTitle,
        searchAuthor: state.searchAuthor,
        status: state.statusFilter,
        visibility: state.visibilityFilter,
        sortBy: state.sortBy,
        sortDir: state.sortDir,
        limit: PAGE_SIZE,
        offset: getOffset()
      }),
      countAdminPolls({
        searchTitle: state.searchTitle,
        searchAuthor: state.searchAuthor,
        status: state.statusFilter,
        visibility: state.visibilityFilter
      })
    ]);
    state.stats = stats;
    state.polls = polls;
    state.total = total;
  } catch (err) {
    console.error('Admin polls load error:', err);
    showToast(i18n.t('admin.polls.loadError'), 'error');
  } finally {
    state.loading = false;
    renderContent(container);
  }
}

// ── Event Bindings ─────────────────────────────────

function bindActionDelegation(container) {
  if (actionDelegationBound.has(container)) return;

  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const pid = btn.dataset.pid;
    const title = btn.dataset.title || '';

    if (!pid) {
      showToast('Missing poll id', 'error');
      return;
    }

    if (action === 'view-poll') {
      navigateTo(`/polls/${pid}?from=admin-polls`);
    }

    if (action === 'view-voters') {
      try {
        const voters = await adminGetPollVoters(pid);
        showVotersModal(voters, title);
      } catch (err) {
        showToast(err.message || 'Error', 'error');
      }
    }

    if (action === 'close-poll') {
      try {
        await adminUpdatePoll(pid, { status: 'closed' });
        showToast(i18n.t('notifications.pollClosed'), 'success');
        state.stats = null;
        await loadData(container);
      } catch (err) {
        showToast(err.message || 'Error', 'error');
      }
    }

    if (action === 'reopen-poll') {
      try {
        await adminUpdatePoll(pid, { status: 'open' });
        showToast(i18n.t('admin.polls.reopened'), 'success');
        state.stats = null;
        await loadData(container);
      } catch (err) {
        showToast(err.message || 'Error', 'error');
      }
    }

    if (action === 'toggle-featured') {
      try {
        const newVal = await adminToggleFeatured(pid);
        showToast(
          newVal ? i18n.t('admin.polls.featuredOn') : i18n.t('admin.polls.featuredOff'),
          'success'
        );
        state.stats = null;
        await loadData(container);
      } catch (err) {
        showToast(err.message || 'Error', 'error');
      }
    }

    if (action === 'duplicate-poll') {
      const ok = await showConfirmModal(
        `${i18n.t('admin.polls.confirmDuplicate')} "${title}"?`,
        { title: i18n.t('admin.polls.duplicatePoll'), confirmText: i18n.t('common.confirm') }
      );
      if (!ok) return;
      try {
        await adminDuplicatePoll(pid);
        showToast(i18n.t('admin.polls.duplicated'), 'success');
        state.stats = null;
        await loadData(container);
      } catch (err) {
        showToast(err.message || 'Error', 'error');
      }
    }

    if (action === 'reset-votes') {
      const ok = await showConfirmModal(
        `${i18n.t('admin.polls.confirmResetVotes')} "${title}"?`,
        { title: i18n.t('admin.polls.resetVotes'), confirmText: i18n.t('common.confirm') }
      );
      if (!ok) return;
      try {
        await adminResetPollVotes(pid);
        showToast(i18n.t('admin.polls.votesReset'), 'success');
        state.stats = null;
        await loadData(container);
      } catch (err) {
        showToast(err.message || 'Error', 'error');
      }
    }

    if (action === 'delete-poll') {
      const ok = await showConfirmModal(
        `${i18n.t('admin.polls.confirmDelete')} "${title}"?`,
        { title: i18n.t('admin.polls.deletePoll'), confirmText: i18n.t('common.confirm') }
      );
      if (!ok) return;
      try {
        await adminDeletePoll(pid);
        showToast(i18n.t('notifications.pollDeleted'), 'success');
        state.stats = null;
        await loadData(container);
      } catch (err) {
        showToast(err.message || 'Error', 'error');
      }
    }
  });

  actionDelegationBound.add(container);
}

function bindEvents(container) {
  // Search (title + author)
  const searchTitleInput = container.querySelector('#admin-poll-search-title');
  const searchAuthorInput = container.querySelector('#admin-poll-search-author');

  const bindSearchInput = (input, stateKey) => {
    if (!input) return;
    let searchTimeout = null;

    input.addEventListener('focus', () => {
      keepSearchFocus = true;
      activeSearchFieldId = input.id;
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        keepSearchFocus = false;
        activeSearchFieldId = null;
        e.currentTarget.blur();
      }
    });

    input.addEventListener('input', (e) => {
      keepSearchFocus = true;
      activeSearchFieldId = input.id;
      searchCaretPosition = e.target.selectionStart ?? e.target.value.length;
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const value = e.target.value.trim();

        if (value.length === 0) {
          if (state[stateKey] !== '') {
            state[stateKey] = '';
            state.page = 1;
            loadData(container);
          }
          return;
        }

        if (value.length < 3) {
          if (state[stateKey] !== '') {
            state[stateKey] = '';
            state.page = 1;
            loadData(container);
          }
          return;
        }

        state[stateKey] = value;
        state.page = 1;
        loadData(container);
      }, 350);
    });
  };

  bindSearchInput(searchTitleInput, 'searchTitle');
  bindSearchInput(searchAuthorInput, 'searchAuthor');

  // Status filter
  container.querySelector('#admin-poll-status-filter')?.addEventListener('change', (e) => {
    state.statusFilter = e.target.value;
    state.page = 1;
    loadData(container);
  });

  // Visibility filter
  container.querySelector('#admin-poll-vis-filter')?.addEventListener('change', (e) => {
    state.visibilityFilter = e.target.value;
    state.page = 1;
    loadData(container);
  });

  // Sort
  container.querySelector('#admin-poll-sort')?.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    state.page = 1;
    loadData(container);
  });

  // Reset filters
  container.querySelector('#admin-poll-reset-filters')?.addEventListener('click', () => {
    state.searchTitle = '';
    state.searchAuthor = '';
    state.statusFilter = '';
    state.visibilityFilter = '';
    state.sortBy = 'created_at';
    state.page = 1;
    loadData(container);
  });

  // Pagination
  container.querySelector('#admin-poll-prev')?.addEventListener('click', () => {
    if (state.page > 1) { state.page--; loadData(container); }
  });
  container.querySelector('#admin-poll-next')?.addEventListener('click', () => {
    if (state.page < totalPages()) { state.page++; loadData(container); }
  });

  bindActionDelegation(container);
}

// ── Export ──────────────────────────────────────────
export default async function render(container) {
  if (activeLanguageChangedHandler) {
    window.removeEventListener('votamin:language-changed', activeLanguageChangedHandler);
  }

  if (activeSearchOutsideClickHandler) {
    document.removeEventListener('pointerdown', activeSearchOutsideClickHandler);
  }

  activeLanguageChangedHandler = () => {
    renderContent(container);
  };
  window.addEventListener('votamin:language-changed', activeLanguageChangedHandler);

  activeSearchOutsideClickHandler = (event) => {
    const searchTitleInput = container.querySelector('#admin-poll-search-title');
    const searchAuthorInput = container.querySelector('#admin-poll-search-author');
    if (!searchTitleInput && !searchAuthorInput) return;
    if (event.target !== searchTitleInput && event.target !== searchAuthorInput) {
      keepSearchFocus = false;
      activeSearchFieldId = null;
    }
  };
  document.addEventListener('pointerdown', activeSearchOutsideClickHandler);

  state = {
    ...state,
    polls: [],
    total: 0,
    page: 1,
    searchTitle: '',
    searchAuthor: '',
    stats: null,
    loading: false
  };
  await loadData(container);
}
