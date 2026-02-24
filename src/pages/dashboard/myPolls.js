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
  let activeStatus = 'all';
  let activePolls = [];
  let currentPage = 1;

  function renderHeader() {
    return `
    <div class="vm-my-polls-page">
    <div class="vm-dash-header">
      <h3>${i18n.t('dashboard.sidebar.myPolls')}</h3>
      <a href="/polls/new" class="btn btn-votamin btn-sm">${i18n.t('dashboard.actions.createPoll')}</a>
    </div>
    <div class="vm-dash-filters mb-3" id="my-polls-filters">
      <button class="vm-filter-btn active" data-status="all">${i18n.t('dashboard.filters.all')}</button>
      <button class="vm-filter-btn" data-status="draft">${i18n.t('dashboard.filters.draft')}</button>
      <button class="vm-filter-btn" data-status="open">${i18n.t('dashboard.filters.open')}</button>
      <button class="vm-filter-btn" data-status="closed">${i18n.t('dashboard.filters.closed')}</button>
    </div>
    <div id="my-polls-content" class="vm-my-polls-content">
      <div class="vm-loader-wrapper"><div class="vm-loader"></div></div>
    </div>
    <div id="my-polls-pagination" class="vm-my-polls-pagination"></div>
    </div>`;
  }

  container.innerHTML = renderHeader();

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
    container.querySelector('#my-polls-filters')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-status]');
      if (!btn) return;
      activeStatus = btn.dataset.status;
      currentPage = 1;
      container.querySelectorAll('.vm-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadPolls(activeStatus);
    });
  }

  bindFilterEvents();

  async function loadPolls(status) {
    const contentEl = container.querySelector('#my-polls-content');
    const paginationEl = container.querySelector('#my-polls-pagination');
    contentEl.innerHTML = '<div class="vm-loader-wrapper"><div class="vm-loader"></div></div>';
    if (paginationEl) paginationEl.innerHTML = '';
    try {
      const polls = await fetchDashboardMyPolls({ status });
      activePolls = Array.isArray(polls) ? polls : [];
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
        loadPolls(activeStatus);
      })
      .catch((error) => {
        console.error('Failed to delete poll:', error);
        showToast(i18n.t('createPoll.publish.error') || 'Error deleting poll', 'error');
      });
  });

  /* Listen for language changes */
  window.addEventListener('votamin:language-changed', () => {
    container.innerHTML = renderHeader();

    const activeFilterBtn = container.querySelector(`.vm-filter-btn[data-status="${activeStatus}"]`);
    container.querySelectorAll('.vm-filter-btn').forEach(b => b.classList.remove('active'));
    activeFilterBtn?.classList.add('active');

    bindFilterEvents();
    if (activePolls.length) {
      renderPollsPage();
      return;
    }
    loadPolls(activeStatus);
  });

  await loadPolls(activeStatus);
}
