/* ============================================================
   Dashboard – My Polls sub-page
   ============================================================ */
import { fetchDashboardMyPolls } from '@utils/dashboardData.js';
import { i18n } from '../../i18n/index.js';
import { showToast } from '@utils/toast.js';
import { formatDate } from '@utils/helpers.js';
import { deletePollById, getOrCreatePollShareCode } from '@utils/pollsData.js';
import { showConfirmModal } from '@components/confirmModal.js';
import { showShareModal } from '@components/shareModal.js';

const POLLS_PER_PAGE = 10;
const STATUS_FILTER_VALUES = ['draft', 'open', 'closed'];
const KIND_FILTER_VALUES = ['single_choice', 'multiple_choice', 'rating', 'image', 'slider', 'numeric'];
const RESPONSE_FILTER_VALUES = ['yes', 'no'];

function escapeHtmlAttr(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function statusBadge(status) {
  const label = i18n.t(`dashboard.status.${status}`) || status;
  return `<span class="vm-status-badge vm-status-badge--${status}">${label}</span>`;
}

function kindBadge(kind) {
  const label = i18n.t(`dashboard.kind.${kind}`) || kind;
  return `<span class="vm-kind-badge">${label}</span>`;
}

function deadlineText(endsAt) {
  if (!endsAt) return i18n.t('dashboard.noDeadline');
  return formatDate(endsAt);
}

function renderTable(polls) {
  const t = (k) => i18n.t(`dashboard.table.columns.${k}`);
  return `
    <div class="vm-dash-table-wrap">
      <table class="vm-dash-table vm-my-polls-table">
        <thead>
          <tr>
            <th>${t('title')}</th>
            <th>${t('type')}</th>
            <th>${t('responses')}</th>
            <th>${t('deadline')}</th>
            <th>${t('status')}</th>
            <th>${t('myResponse')}</th>
            <th>${t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          ${polls.map(p => `
          <tr>
            <td><a href="/polls/${p.id}" class="fw-semibold">${p.title}</a></td>
            <td>${kindBadge(p.kind)}</td>
            <td>${p.response_count}</td>
            <td>${deadlineText(p.ends_at)}</td>
            <td>${statusBadge(p.status)}</td>
            <td>${p.my_response
              ? `<span class="text-success fw-semibold">${i18n.t('dashboard.myResponse.yes')}</span>`
              : `<span class="text-muted">${i18n.t('dashboard.myResponse.no')}</span>`
            }</td>
            <td>
              <div class="dropdown">
                <button class="vm-actions-btn" data-bs-toggle="dropdown" aria-expanded="false">⋮</button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item" href="/polls/${p.id}">${i18n.t('dashboard.actions.view')}</a></li>
                  <li><a class="dropdown-item" href="/polls/${p.id}?edit=1">${i18n.t('dashboard.actions.edit')}</a></li>
                  <li><a class="dropdown-item" href="#" data-action="share" data-poll-id="${p.id}">${i18n.t('dashboard.actions.share')}</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger" href="#" data-action="delete" data-poll-id="${p.id}">${i18n.t('dashboard.actions.delete')}</a></li>
                </ul>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderCards(polls) {
  return `
    <div class="vm-dash-cards">
      ${polls.map(p => `
      <div class="vm-dash-card">
        <div class="vm-dash-card-title"><a href="/polls/${p.id}">${p.title}</a></div>
        <div class="vm-dash-card-meta">
          ${kindBadge(p.kind)}
          ${statusBadge(p.status)}
          <span>${p.response_count} ${i18n.t('dashboard.table.columns.responses').toLowerCase()}</span>
          ${p.ends_at ? `<span>${deadlineText(p.ends_at)}</span>` : ''}
        </div>
        <div class="vm-dash-card-actions">
          <a href="/polls/${p.id}" class="btn btn-sm btn-votamin-outline">${i18n.t('dashboard.actions.view')}</a>
          <a href="/polls/${p.id}?edit=1" class="btn btn-sm btn-votamin-outline">${i18n.t('dashboard.actions.edit')}</a>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-poll-id="${p.id}">${i18n.t('dashboard.actions.delete')}</button>
        </div>
      </div>`).join('')}
    </div>`;
}

function renderEmpty() {
  return `
    <div class="vm-empty-state">
      <div class="vm-empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <rect x="5" y="4" width="14" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M9 9h6M9 13h6M9 17h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="vm-empty-title">${i18n.t('dashboard.empty.myPolls.title')}</div>
      <a href="/polls/new" class="btn btn-votamin mt-3">${i18n.t('dashboard.empty.myPolls.cta')}</a>
    </div>`;
}

function getTotalPages(totalItems) {
  return Math.max(1, Math.ceil(totalItems / POLLS_PER_PAGE));
}

function getVisiblePageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  let start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  start = Math.max(1, end - 4);

  const pages = [];
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  return pages;
}

function renderPagination(totalItems, currentPage) {
  const totalPages = getTotalPages(totalItems);
  if (totalPages <= 1) return '';

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const from = (safePage - 1) * POLLS_PER_PAGE + 1;
  const to = Math.min(totalItems, safePage * POLLS_PER_PAGE);
  const pages = getVisiblePageNumbers(safePage, totalPages);

  const labels = {
    prev: i18n.t('dashboard.pagination.prev') || 'Previous',
    next: i18n.t('dashboard.pagination.next') || 'Next',
    page: i18n.t('dashboard.pagination.page') || 'Page',
    of: i18n.t('dashboard.pagination.of') || 'of',
    showing: i18n.t('dashboard.pagination.showing') || 'Showing'
  };

  return `
    <div class="vm-dash-pagination">
      <div class="vm-dash-pagination-info">${labels.showing} ${from}-${to} / ${totalItems}</div>
      <div class="vm-dash-pagination-controls">
        <button class="vm-page-btn" data-page="${safePage - 1}" ${safePage === 1 ? 'disabled' : ''}>${labels.prev}</button>
        ${pages.map(page => `
          <button class="vm-page-btn ${page === safePage ? 'active' : ''}" data-page="${page}">${page}</button>
        `).join('')}
        <button class="vm-page-btn" data-page="${safePage + 1}" ${safePage === totalPages ? 'disabled' : ''}>${labels.next}</button>
        <span class="vm-dash-pagination-info">${labels.page} ${safePage} ${labels.of} ${totalPages}</span>
      </div>
    </div>`;
}

export default async function render(container) {
  let activeStatuses = new Set(STATUS_FILTER_VALUES);
  let activeKinds = new Set(KIND_FILTER_VALUES);
  let activeMyResponses = new Set(RESPONSE_FILTER_VALUES);
  let searchQuery = '';
  let allPolls = [];
  let activePolls = [];
  let currentPage = 1;

  const allLabel = () => i18n.t('dashboard.filters.all');

  function getStatusOptions() {
    return STATUS_FILTER_VALUES.map((value) => ({ value, label: i18n.t(`dashboard.filters.${value}`) }));
  }

  function getKindOptions() {
    return KIND_FILTER_VALUES.map((value) => ({ value, label: i18n.t(`dashboard.kind.${value}`) }));
  }

  function getResponseOptions() {
    return RESPONSE_FILTER_VALUES.map((value) => ({ value, label: i18n.t(`dashboard.myResponse.${value}`) }));
  }

  function summarizeSelection(title, selectedValues, options) {
    if (selectedValues.size === options.length) return `${title}: ${allLabel()}`;
    if (selectedValues.size === 0) return `${title}: 0`;
    if (selectedValues.size === 1) {
      const selected = options.find((option) => selectedValues.has(option.value));
      return `${title}: ${selected?.label || '—'}`;
    }
    return `${title}: ${selectedValues.size}`;
  }

  function renderMultiSelectFilter({ id, title, group, options, selectedValues }) {
    const allSelected = selectedValues.size === options.length;

    return `
      <div class="dropdown vm-filter-dropdown" data-bs-auto-close="outside" data-filter-group="${group}">
        <button class="vm-filter-btn vm-filter-btn--dropdown" id="${id}" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
          <span class="vm-filter-summary">${summarizeSelection(title, selectedValues, options)}</span>
          <span class="vm-filter-caret">▾</span>
        </button>
        <div class="dropdown-menu vm-filter-menu" aria-labelledby="${id}">
          <button type="button" class="dropdown-item vm-filter-item" data-filter-group="${group}" data-filter-value="__all__">
            <span class="vm-filter-check ${allSelected ? 'active' : ''}">✓</span>
            <span>${i18n.t('dashboard.filters.selectAll') || 'Select all'}</span>
          </button>
          <div class="vm-filter-divider" role="separator"></div>
          ${options.map((option) => `
            <button type="button" class="dropdown-item vm-filter-item" data-filter-group="${group}" data-filter-value="${option.value}">
              <span class="vm-filter-check ${selectedValues.has(option.value) ? 'active' : ''}">✓</span>
              <span>${option.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderHeader() {
    const searchPlaceholder = i18n.t('dashboard.filters.searchPlaceholder') || 'Search poll titles...';
    const statusTitle = i18n.t('dashboard.table.columns.status');
    const typeTitle = i18n.t('dashboard.table.columns.type');
    const responseTitle = i18n.t('dashboard.table.columns.myResponse');

    return `
    <div class="vm-my-polls-page">
    <div class="vm-dash-header">
      <h3>${i18n.t('dashboard.sidebar.myPolls')}</h3>
      <a href="/polls/new" class="btn btn-votamin btn-sm">${i18n.t('dashboard.actions.createPoll')}</a>
    </div>
    <div class="vm-dash-tools mb-3" id="my-polls-filters">
      <div class="vm-dash-search-wrap">
        <input
          type="search"
          class="vm-dash-search"
          id="my-polls-search"
          value="${escapeHtmlAttr(searchQuery)}"
          placeholder="${escapeHtmlAttr(searchPlaceholder)}"
        >
      </div>
      ${renderMultiSelectFilter({ id: 'my-polls-status-btn', title: statusTitle, group: 'status', options: getStatusOptions(), selectedValues: activeStatuses })}
      ${renderMultiSelectFilter({ id: 'my-polls-kind-btn', title: typeTitle, group: 'kind', options: getKindOptions(), selectedValues: activeKinds })}
      ${renderMultiSelectFilter({ id: 'my-polls-response-btn', title: responseTitle, group: 'response', options: getResponseOptions(), selectedValues: activeMyResponses })}
      <button type="button" class="vm-filter-btn vm-filter-btn--reset" id="my-polls-reset">${i18n.t('dashboard.filters.reset') || 'Reset filters'}</button>
    </div>
    <div id="my-polls-content" class="vm-my-polls-content">
      <div class="vm-loader-wrapper"><div class="vm-loader"></div></div>
    </div>
    <div id="my-polls-pagination" class="vm-my-polls-pagination"></div>
    </div>`;
  }

  container.innerHTML = renderHeader();

  function applyClientFilters() {
    const normalizedQuery = searchQuery
      .trim()
      .toLocaleLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    activePolls = allPolls.filter((poll) => {
      const title = String(poll.title || '').toLocaleLowerCase();
      const matchesSearch = normalizedQuery.every((word) => title.includes(word));
      const matchesStatus = activeStatuses.has(poll.status);
      const matchesKind = activeKinds.has(poll.kind);
      const hasMyResponse = Boolean(poll.my_response);
      const responseValue = hasMyResponse ? 'yes' : 'no';
      const matchesResponse = activeMyResponses.has(responseValue);

      return matchesSearch && matchesStatus && matchesKind && matchesResponse;
    });
  }

  function updateFilterDropdowns() {
    const groups = [
      {
        key: 'status',
        title: i18n.t('dashboard.table.columns.status'),
        options: getStatusOptions(),
        selected: activeStatuses
      },
      {
        key: 'kind',
        title: i18n.t('dashboard.table.columns.type'),
        options: getKindOptions(),
        selected: activeKinds
      },
      {
        key: 'response',
        title: i18n.t('dashboard.table.columns.myResponse'),
        options: getResponseOptions(),
        selected: activeMyResponses
      }
    ];

    groups.forEach((group) => {
      const dropdown = container.querySelector(`.vm-filter-dropdown[data-filter-group="${group.key}"]`);
      if (!dropdown) return;

      const summaryEl = dropdown.querySelector('.vm-filter-summary');
      if (summaryEl) {
        summaryEl.textContent = summarizeSelection(group.title, group.selected, group.options);
      }

      const allCheck = dropdown.querySelector('[data-filter-value="__all__"] .vm-filter-check');
      if (allCheck) {
        allCheck.classList.toggle('active', group.selected.size === group.options.length);
      }

      dropdown.querySelectorAll('[data-filter-value]').forEach((item) => {
        const value = item.dataset.filterValue;
        if (!value || value === '__all__') return;
        const check = item.querySelector('.vm-filter-check');
        if (check) {
          check.classList.toggle('active', group.selected.has(value));
        }
      });
    });
  }

  function toggleGroupValue(group, value) {
    const groupMap = {
      status: { selected: activeStatuses, allValues: STATUS_FILTER_VALUES },
      kind: { selected: activeKinds, allValues: KIND_FILTER_VALUES },
      response: { selected: activeMyResponses, allValues: RESPONSE_FILTER_VALUES }
    };

    const entry = groupMap[group];
    if (!entry) return;

    if (value === '__all__') {
      const allSelected = entry.selected.size === entry.allValues.length;
      entry.selected.clear();
      if (!allSelected) {
        entry.allValues.forEach((item) => entry.selected.add(item));
      }
      return;
    }

    if (entry.selected.has(value)) {
      entry.selected.delete(value);
      return;
    }

    entry.selected.add(value);
  }

  function renderPollsPage() {
    const contentEl = container.querySelector('#my-polls-content');
    const paginationEl = container.querySelector('#my-polls-pagination');
    if (!contentEl) return;

    if (!activePolls.length) {
      contentEl.innerHTML = renderEmpty();
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    const totalPages = getTotalPages(activePolls.length);
    currentPage = Math.min(Math.max(1, currentPage), totalPages);

    const startIndex = (currentPage - 1) * POLLS_PER_PAGE;
    const visiblePolls = activePolls.slice(startIndex, startIndex + POLLS_PER_PAGE);

    contentEl.innerHTML = renderTable(visiblePolls) + renderCards(visiblePolls);
    if (paginationEl) {
      paginationEl.innerHTML = renderPagination(activePolls.length, currentPage);
    }
  }

  function bindFilterEvents() {
    const searchEl = container.querySelector('#my-polls-search');
    const filtersRoot = container.querySelector('#my-polls-filters');
    const resetEl = container.querySelector('#my-polls-reset');

    searchEl?.addEventListener('input', (e) => {
      searchQuery = e.target.value || '';
      currentPage = 1;
      applyClientFilters();
      renderPollsPage();
    });

    filtersRoot?.addEventListener('click', (e) => {
      const optionBtn = e.target.closest('[data-filter-group][data-filter-value]');
      if (!optionBtn) return;

      e.preventDefault();
      e.stopPropagation();
      const group = optionBtn.dataset.filterGroup;
      const value = optionBtn.dataset.filterValue;
      toggleGroupValue(group, value);
      currentPage = 1;
      updateFilterDropdowns();
      applyClientFilters();
      renderPollsPage();
    });

    resetEl?.addEventListener('click', () => {
      searchQuery = '';
      activeStatuses = new Set(STATUS_FILTER_VALUES);
      activeKinds = new Set(KIND_FILTER_VALUES);
      activeMyResponses = new Set(RESPONSE_FILTER_VALUES);
      currentPage = 1;

      if (searchEl) searchEl.value = '';
      updateFilterDropdowns();
      applyClientFilters();
      renderPollsPage();
    });
  }

  bindFilterEvents();

  async function loadPolls() {
    const contentEl = container.querySelector('#my-polls-content');
    const paginationEl = container.querySelector('#my-polls-pagination');
    contentEl.innerHTML = '<div class="vm-loader-wrapper"><div class="vm-loader"></div></div>';
    if (paginationEl) paginationEl.innerHTML = '';
    try {
      const polls = await fetchDashboardMyPolls({ status: 'all' });
      allPolls = Array.isArray(polls) ? polls : [];
      applyClientFilters();
      currentPage = 1;
      renderPollsPage();
    } catch (err) {
      console.error('Failed to load My Polls:', err);
      contentEl.innerHTML = `<div class="vm-empty-state"><div class="vm-empty-title text-danger">${i18n.t('dashboard.error') || 'Error loading polls'}</div></div>`;
    }
  }

  /* Delete handler */
  container.addEventListener('click', async (e) => {
    const pageBtn = e.target.closest('[data-page]');
    if (pageBtn) {
      e.preventDefault();
      const selectedPage = Number(pageBtn.dataset.page);
      if (!Number.isNaN(selectedPage) && selectedPage !== currentPage) {
        currentPage = selectedPage;
        renderPollsPage();
      }
      return;
    }

    const shareBtn = e.target.closest('[data-action="share"]');
    if (shareBtn) {
      e.preventDefault();
      const pollId = shareBtn.dataset.pollId;

      try {
        const shareCode = await getOrCreatePollShareCode(pollId);
        const shareUrl = `${window.location.origin}/p/${shareCode}`;
        const copied = await showShareModal(shareUrl);
        if (copied) {
          showToast(i18n.t('notifications.linkCopied') || 'Link copied.', 'info');
        }
      } catch (error) {
        console.error('Failed to share poll:', error);
        showToast(i18n.t('dashboard.shareError') || 'Error generating share link', 'error');
      }

      return;
    }

    const deleteBtn = e.target.closest('[data-action="delete"]');
    if (!deleteBtn) return;
    e.preventDefault();
    const pollId = deleteBtn.dataset.pollId;
    const confirmed = await showConfirmModal(i18n.t('dashboard.confirmDelete') || 'Are you sure you want to delete this poll?');
    if (!confirmed) return;

    deletePollById(pollId)
      .then(() => {
        showToast(i18n.t('notifications.pollDeleted'), 'info');
        loadPolls();
      })
      .catch((error) => {
        console.error('Failed to delete poll:', error);
        showToast(i18n.t('createPoll.publish.error') || 'Error deleting poll', 'error');
      });
  });

  /* Listen for language changes */
  window.addEventListener('votamin:language-changed', () => {
    container.innerHTML = renderHeader();

    bindFilterEvents();
    if (allPolls.length) {
      applyClientFilters();
      renderPollsPage();
      return;
    }
    loadPolls();
  });

  await loadPolls();
}
