/* ============================================================
   Admin Panel – Users Tab
   ============================================================ */
import { i18n } from '../../i18n/index.js';
import { showToast } from '@utils/toast.js';
import { showConfirmModal } from '@components/confirmModal.js';
import { getCurrentUser } from '@utils/auth.js';
import {
  fetchAdminUserStats,
  fetchAdminUsers,
  countAdminUsers,
  setUserRole,
  deleteUser,
  setUserStatus
} from '@utils/adminData.js';
import { formatDate } from '@utils/helpers.js';

const PAGE_SIZE = 15;

let state = {
  users: [],
  total: 0,
  page: 1,
  search: '',
  roleFilter: '',
  statusFilter: '',
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

function getOffset() {
  return (state.page - 1) * PAGE_SIZE;
}

function totalPages() {
  return Math.max(1, Math.ceil(state.total / PAGE_SIZE));
}

// ── Stats Cards ────────────────────────────────────
function renderStatsCards(stats) {
  if (!stats) {
    return `
      <div class="row g-2 mb-3 vm-admin-stats-row" aria-hidden="true">
        ${Array.from({ length: 8 }).map(() => `
          <div class="col-6 col-lg-3 col-xl">
            <div class="vm-card p-2 text-center vm-admin-stat-card vm-admin-stat-card--skeleton">
              <div class="vm-admin-stat-skeleton-value"></div>
              <div class="vm-admin-stat-skeleton-label"></div>
            </div>
          </div>
        `).join('')}
      </div>`;
  }
  return `
    <div class="row g-2 mb-3 vm-admin-stats-row">
      <div class="col-6 col-lg-3 col-xl">
        <div class="vm-card p-2 text-center vm-admin-stat-card">
          <div class="fw-bold vm-gradient-text vm-admin-stat-value">${stats.total_users ?? 0}</div>
          <div class="text-muted small" data-i18n="admin.users.totalUsers">${i18n.t('admin.users.totalUsers')}</div>
        </div>
      </div>
      <div class="col-6 col-lg-3 col-xl">
        <div class="vm-card p-2 text-center vm-admin-stat-card">
          <div class="fw-bold vm-admin-stat-value" style="color:var(--vm-orange);">${stats.admin_users ?? 0}</div>
          <div class="text-muted small" data-i18n="admin.users.adminCount">${i18n.t('admin.users.adminCount')}</div>
        </div>
      </div>
      <div class="col-6 col-lg-3 col-xl">
        <div class="vm-card p-2 text-center vm-admin-stat-card">
          <div class="fw-bold vm-admin-stat-value" style="color:var(--vm-teal);">${stats.new_today ?? 0}</div>
          <div class="text-muted small" data-i18n="admin.users.newToday">${i18n.t('admin.users.newToday')}</div>
        </div>
      </div>
      <div class="col-6 col-lg-3 col-xl">
        <div class="vm-card p-2 text-center vm-admin-stat-card">
          <div class="fw-bold vm-admin-stat-value" style="color:var(--vm-yellow);">${stats.new_this_week ?? 0}</div>
          <div class="text-muted small" data-i18n="admin.users.newThisWeek">${i18n.t('admin.users.newThisWeek')}</div>
        </div>
      </div>
      <div class="col-6 col-lg-3 col-xl">
        <div class="vm-card p-2 text-center vm-admin-stat-card">
          <div class="fw-bold vm-admin-stat-value" style="color:var(--bs-success);">${stats.active_7d ?? 0}</div>
          <div class="text-muted small" data-i18n="admin.users.active7d">${i18n.t('admin.users.active7d')}</div>
        </div>
      </div>
      <div class="col-6 col-lg-3 col-xl">
        <div class="vm-card p-2 text-center vm-admin-stat-card">
          <div class="fw-bold vm-admin-stat-value" style="color:var(--bs-info);">${stats.active_30d ?? 0}</div>
          <div class="text-muted small" data-i18n="admin.users.active30d">${i18n.t('admin.users.active30d')}</div>
        </div>
      </div>
      <div class="col-6 col-lg-3 col-xl">
        <div class="vm-card p-2 text-center vm-admin-stat-card">
          <div class="fw-bold vm-admin-stat-value" style="color:var(--bs-secondary);">${stats.inactive_30d ?? 0}</div>
          <div class="text-muted small" data-i18n="admin.users.inactive30d">${i18n.t('admin.users.inactive30d')}</div>
        </div>
      </div>
      <div class="col-6 col-lg-3 col-xl">
        <div class="vm-card p-2 text-center vm-admin-stat-card">
          <div class="fw-bold vm-admin-stat-value" style="color:var(--bs-danger);">${stats.blocked_users ?? 0}</div>
          <div class="text-muted small" data-i18n="admin.users.blockedUsers">${i18n.t('admin.users.blockedUsers')}</div>
        </div>
      </div>
    </div>`;
}

// ── Filters Bar ────────────────────────────────────
function renderFilters() {
  return `
    <div class="vm-admin-filters mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-12 col-md-4">
          <input type="text" class="form-control form-control-sm"
                 id="admin-user-search"
                 placeholder="${i18n.t('admin.users.searchPlaceholder')}"
                 value="${state.search}">
        </div>
        <div class="col-6 col-md-2">
          <select class="form-select form-select-sm" id="admin-user-role-filter">
            <option value="" ${!state.roleFilter ? 'selected' : ''}>${i18n.t('admin.users.allRoles')}</option>
            <option value="user" ${state.roleFilter === 'user' ? 'selected' : ''}>${i18n.t('admin.users.roleUser')}</option>
            <option value="admin" ${state.roleFilter === 'admin' ? 'selected' : ''}>${i18n.t('admin.users.roleAdmin')}</option>
          </select>
        </div>
        <div class="col-6 col-md-2">
          <select class="form-select form-select-sm" id="admin-user-status-filter">
            <option value="" ${!state.statusFilter ? 'selected' : ''}>${i18n.t('admin.users.allStatuses')}</option>
            <option value="active" ${state.statusFilter === 'active' ? 'selected' : ''}>${i18n.t('admin.users.statusActive')}</option>
            <option value="blocked" ${state.statusFilter === 'blocked' ? 'selected' : ''}>${i18n.t('admin.users.statusBlocked')}</option>
          </select>
        </div>
        <div class="col-6 col-md-auto ms-md-auto">
          <button class="btn btn-sm btn-votamin-outline w-100 vm-admin-filter-reset-btn" id="admin-user-reset-filters">
            <span data-i18n="admin.users.resetFilters">${i18n.t('admin.users.resetFilters')}</span>
          </button>
        </div>
      </div>
    </div>`;
}

// ── Users Table ────────────────────────────────────
function renderUsersTable() {
  if (state.loading) {
    return '<div class="vm-loader-wrapper py-5"><div class="vm-loader"></div></div>';
  }

  if (!state.users.length) {
    return `<div class="text-center text-muted py-5" data-i18n="admin.users.noUsers">${i18n.t('admin.users.noUsers')}</div>`;
  }

  const currentUserId = getCurrentUser()?.id;
  const sortIcon = (col) => {
    if (state.sortBy !== col) return '';
    return state.sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  const renderCardActions = (user, isSelf, isAdminUser, isBlocked) => {
    const actions = [];

    if (isAdminUser && !isSelf) {
      actions.push(`
        <button class="btn btn-sm btn-votamin-outline" data-action="remove-admin" data-uid="${user.user_id}">
          ${i18n.t('admin.users.removeAdmin')}
        </button>
      `);
    }

    if (!isAdminUser) {
      actions.push(`
        <button class="btn btn-sm btn-votamin-outline" data-action="make-admin" data-uid="${user.user_id}">
          ${i18n.t('admin.users.makeAdmin')}
        </button>
      `);
    }

    if (!isSelf) {
      if (isBlocked) {
        actions.push(`
          <button class="btn btn-sm btn-votamin-outline" data-action="unblock-user" data-uid="${user.user_id}" data-email="${user.email}">
            ${i18n.t('admin.users.unblockUser')}
          </button>
        `);
      } else {
        actions.push(`
          <button class="btn btn-sm btn-votamin-outline" data-action="block-user" data-uid="${user.user_id}" data-email="${user.email}">
            ${i18n.t('admin.users.blockUser')}
          </button>
        `);
      }

      actions.push(`
        <button class="btn btn-sm btn-outline-danger" data-action="delete-user" data-uid="${user.user_id}" data-email="${user.email}">
          ${i18n.t('admin.users.deleteUser')}
        </button>
      `);
    }

    return actions.join('');
  };

  const rows = state.users.map(u => {
    const isSelf = u.user_id === currentUserId;
    const isAdminUser = u.role === 'admin';
    const isBlocked = u.status === 'blocked';
    const roleBadge = isAdminUser
      ? '<span class="badge bg-warning text-dark">Admin</span>'
      : '<span class="badge bg-secondary">User</span>';
    const statusBadge = isBlocked
      ? `<span class="badge bg-danger">${i18n.t('admin.users.statusBlocked')}</span>`
      : `<span class="badge bg-success">${i18n.t('admin.users.statusActive')}</span>`;

    return `
      <tr${isBlocked ? ' class="table-danger bg-opacity-10"' : ''}>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div>
              <div class="fw-semibold small">${u.full_name || '—'}</div>
              <div class="text-muted" style="font-size:0.78rem;">${u.email}</div>
            </div>
          </div>
        </td>
        <td>${roleBadge}</td>
        <td>${statusBadge}</td>
        <td class="text-muted small">${u.registered_at ? formatDate(u.registered_at) : '—'}</td>
        <td class="text-muted small">${u.last_sign_in ? formatDate(u.last_sign_in) : '—'}</td>
        <td class="text-center"><span class="text-muted small">${u.polls_created}</span></td>
        <td class="text-center"><span class="text-muted small">${u.votes_given}</span></td>
        <td>
          <div class="dropdown">
            <button class="btn btn-sm btn-votamin-outline dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
              <span data-i18n="admin.actions">${i18n.t('admin.actions')}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              ${isAdminUser && !isSelf ? `
                <li><button class="dropdown-item" data-action="remove-admin" data-uid="${u.user_id}">
                  <span data-i18n="admin.users.removeAdmin">${i18n.t('admin.users.removeAdmin')}</span>
                </button></li>
              ` : ''}
              ${!isAdminUser ? `
                <li><button class="dropdown-item" data-action="make-admin" data-uid="${u.user_id}">
                  <span data-i18n="admin.users.makeAdmin">${i18n.t('admin.users.makeAdmin')}</span>
                </button></li>
              ` : ''}
              ${!isSelf ? `
                <li><hr class="dropdown-divider"></li>
                ${isBlocked ? `
                  <li><button class="dropdown-item text-success" data-action="unblock-user" data-uid="${u.user_id}" data-email="${u.email}">
                    🔓 <span data-i18n="admin.users.unblockUser">${i18n.t('admin.users.unblockUser')}</span>
                  </button></li>
                ` : `
                  <li><button class="dropdown-item text-warning" data-action="block-user" data-uid="${u.user_id}" data-email="${u.email}">
                    🚫 <span data-i18n="admin.users.blockUser">${i18n.t('admin.users.blockUser')}</span>
                  </button></li>
                `}
                <li><hr class="dropdown-divider"></li>
                <li><button class="dropdown-item text-danger" data-action="delete-user" data-uid="${u.user_id}" data-email="${u.email}">
                  <span data-i18n="admin.users.deleteUser">${i18n.t('admin.users.deleteUser')}</span>
                </button></li>
              ` : ''}
            </ul>
          </div>
        </td>
      </tr>`;
  }).join('');

  const cards = state.users.map((u) => {
    const isSelf = u.user_id === currentUserId;
    const isAdminUser = u.role === 'admin';
    const isBlocked = u.status === 'blocked';
    const roleBadge = isAdminUser
      ? '<span class="badge bg-warning text-dark">Admin</span>'
      : '<span class="badge bg-secondary">User</span>';
    const statusBadge = isBlocked
      ? `<span class="badge bg-danger">${i18n.t('admin.users.statusBlocked')}</span>`
      : `<span class="badge bg-success">${i18n.t('admin.users.statusActive')}</span>`;

    return `
      <article class="vm-admin-user-card${isBlocked ? ' vm-admin-user-card--blocked' : ''}">
        <div class="vm-admin-user-card-head">
          <div class="vm-admin-user-card-name">${u.full_name || '—'}</div>
          <div class="vm-admin-user-card-badges">
            ${roleBadge}
            ${statusBadge}
          </div>
        </div>
        <div class="vm-admin-user-card-email">${u.email}</div>
        <div class="vm-admin-user-card-meta">
          <span><strong>${i18n.t('admin.users.colRegistered')}:</strong> ${u.registered_at ? formatDate(u.registered_at) : '—'}</span>
          <span><strong>${i18n.t('admin.users.colLastLogin')}:</strong> ${u.last_sign_in ? formatDate(u.last_sign_in) : '—'}</span>
          <span><strong>${i18n.t('admin.users.colPolls')}:</strong> ${u.polls_created}</span>
          <span><strong>${i18n.t('admin.users.colVotes')}:</strong> ${u.votes_given}</span>
        </div>
        <div class="vm-admin-user-card-actions">
          ${renderCardActions(u, isSelf, isAdminUser, isBlocked)}
        </div>
      </article>
    `;
  }).join('');

  return `
    <div class="table-responsive vm-admin-users-table-wrap">
      <table class="table table-hover align-middle mb-0 vm-admin-table vm-admin-users-table">
        <thead>
          <tr class="text-muted small">
            <th class="vm-sortable" data-sort="email">${i18n.t('admin.users.colUser')}${sortIcon('email')}</th>
            <th>${i18n.t('admin.users.colRole')}</th>
            <th>${i18n.t('admin.users.colStatus')}</th>
            <th class="vm-sortable" data-sort="created_at">${i18n.t('admin.users.colRegistered')}${sortIcon('created_at')}</th>
            <th>${i18n.t('admin.users.colLastLogin')}</th>
            <th class="text-center vm-sortable" data-sort="polls_created">${i18n.t('admin.users.colPolls')}${sortIcon('polls_created')}</th>
            <th class="text-center vm-sortable" data-sort="votes_given">${i18n.t('admin.users.colVotes')}${sortIcon('votes_given')}</th>
            <th>${i18n.t('admin.users.colActions')}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="vm-admin-users-cards">${cards}</div>`;
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
        <button class="btn btn-sm btn-votamin-outline" id="admin-user-prev" ${state.page <= 1 ? 'disabled' : ''}>
          ${i18n.t('dashboard.pagination.prev')}
        </button>
        <span class="btn btn-sm btn-votamin disabled">${state.page} / ${pages}</span>
        <button class="btn btn-sm btn-votamin-outline" id="admin-user-next" ${state.page >= pages ? 'disabled' : ''}>
          ${i18n.t('dashboard.pagination.next')}
        </button>
      </div>
    </div>`;
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
      <h5 class="fw-bold mb-3" data-i18n="admin.users.tableTitle">${i18n.t('admin.users.tableTitle')}</h5>
      ${renderFilters()}
      ${renderUsersTable()}
      ${renderPagination()}
    </div>`;
  bindEvents(container);
  i18n.loadTranslations();

  const searchInput = container.querySelector('#admin-user-search');
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
    const [stats, users, total] = await Promise.all([
      state.stats ? Promise.resolve(state.stats) : fetchAdminUserStats(),
      fetchAdminUsers({
        search: state.search,
        role: state.roleFilter,
        status: state.statusFilter,
        sortBy: state.sortBy,
        sortDir: state.sortDir,
        limit: PAGE_SIZE,
        offset: getOffset()
      }),
      countAdminUsers({ search: state.search, role: state.roleFilter, status: state.statusFilter })
    ]);
    state.stats = stats;
    state.users = users;
    state.total = total;
  } catch (err) {
    console.error('Admin users load error:', err);
    showToast(i18n.t('admin.users.loadError'), 'error');
  } finally {
    state.loading = false;
    renderContent(container);
  }
}

// ── Event Bindings ─────────────────────────────────
let searchTimeout = null;

function bindActionDelegation(container) {
  if (actionDelegationBound.has(container)) return;

  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const uid = btn.dataset.uid;

    if (action === 'make-admin') {
      const ok = await showConfirmModal(i18n.t('admin.users.confirmMakeAdmin'), {
        title: i18n.t('admin.users.makeAdmin'),
        confirmText: i18n.t('common.confirm')
      });
      if (!ok) return;
      try {
        await setUserRole(uid, 'admin');
        showToast(i18n.t('admin.users.roleUpdated'), 'success');
        state.stats = null;
        await loadData(container);
      } catch (err) {
        showToast(err.message || i18n.t('admin.users.roleError'), 'error');
      }
    }

    if (action === 'remove-admin') {
      const ok = await showConfirmModal(i18n.t('admin.users.confirmRemoveAdmin'), {
        title: i18n.t('admin.users.removeAdmin'),
        confirmText: i18n.t('common.confirm')
      });
      if (!ok) return;
      try {
        await setUserRole(uid, 'user');
        showToast(i18n.t('admin.users.roleUpdated'), 'success');
        state.stats = null;
        await loadData(container);
      } catch (err) {
        showToast(err.message || i18n.t('admin.users.roleError'), 'error');
      }
    }

    if (action === 'delete-user') {
      const email = btn.dataset.email || '';
      const ok = await showConfirmModal(
        `${i18n.t('admin.users.confirmDeleteUser')} (${email})`,
        {
          title: i18n.t('admin.users.deleteUser'),
          confirmText: i18n.t('common.confirm')
        }
      );
      if (!ok) return;
      try {
        await deleteUser(uid);
        showToast(i18n.t('admin.users.userDeleted'), 'success');
        state.stats = null;
        await loadData(container);
      } catch (err) {
        showToast(err.message || i18n.t('admin.users.deleteError'), 'error');
      }
    }

    if (action === 'block-user') {
      const email = btn.dataset.email || '';
      const ok = await showConfirmModal(
        `${i18n.t('admin.users.confirmBlock')} (${email})`,
        {
          title: i18n.t('admin.users.blockUser'),
          confirmText: i18n.t('common.confirm')
        }
      );
      if (!ok) return;
      try {
        await setUserStatus(uid, 'blocked');
        showToast(i18n.t('admin.users.userBlocked'), 'success');
        state.stats = null;
        await loadData(container);
      } catch (err) {
        showToast(err.message || i18n.t('admin.users.blockError'), 'error');
      }
    }

    if (action === 'unblock-user') {
      try {
        await setUserStatus(uid, 'active');
        showToast(i18n.t('admin.users.userUnblocked'), 'success');
        state.stats = null;
        await loadData(container);
      } catch (err) {
        showToast(err.message || i18n.t('admin.users.blockError'), 'error');
      }
    }
  });

  actionDelegationBound.add(container);
}

function bindEvents(container) {
  // Search
  const searchInput = container.querySelector('#admin-user-search');
  searchInput?.addEventListener('focus', () => {
    keepSearchFocus = true;
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      keepSearchFocus = false;
      e.currentTarget.blur();
    }
  });

  searchInput?.addEventListener('input', (e) => {
    keepSearchFocus = true;
    searchCaretPosition = e.target.selectionStart ?? e.target.value.length;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const value = e.target.value.trim();

      if (value.length === 0) {
        if (state.search !== '') {
          state.search = '';
          state.page = 1;
          loadData(container);
        }
        return;
      }

      if (value.length < 3) {
        if (state.search !== '') {
          state.search = '';
          state.page = 1;
          loadData(container);
        }
        return;
      }

      state.search = value;
      state.page = 1;
      loadData(container);
    }, 350);
  });

  // Role filter
  container.querySelector('#admin-user-role-filter')?.addEventListener('change', (e) => {
    state.roleFilter = e.target.value;
    state.page = 1;
    loadData(container);
  });

  // Status filter
  container.querySelector('#admin-user-status-filter')?.addEventListener('change', (e) => {
    state.statusFilter = e.target.value;
    state.page = 1;
    loadData(container);
  });

  // Reset filters
  container.querySelector('#admin-user-reset-filters')?.addEventListener('click', () => {
    state.search = '';
    state.roleFilter = '';
    state.statusFilter = '';
    state.page = 1;
    loadData(container);
  });

  // Sorting
  container.querySelectorAll('.vm-sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (state.sortBy === col) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortBy = col;
        state.sortDir = 'desc';
      }
      state.page = 1;
      loadData(container);
    });
  });

  // Pagination
  container.querySelector('#admin-user-prev')?.addEventListener('click', () => {
    if (state.page > 1) { state.page--; loadData(container); }
  });
  container.querySelector('#admin-user-next')?.addEventListener('click', () => {
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
    const searchInput = container.querySelector('#admin-user-search');
    if (!searchInput) return;
    if (event.target !== searchInput) {
      keepSearchFocus = false;
    }
  };
  document.addEventListener('pointerdown', activeSearchOutsideClickHandler);

  // Reset state
  state = { ...state, users: [], total: 0, page: 1, stats: null, loading: false };
  await loadData(container);
}
