/* ============================================================
   Polls List Page
   ============================================================ */
import htmlContent from './polls.html?raw';
import './polls.css';
import { getCurrentUser } from '@utils/auth.js';
import { navigateTo } from '../../router.js';
import { deletePollById, fetchMyPollsList } from '@utils/pollsData.js';
import { showToast } from '@utils/toast.js';
import { getLoaderMarkup } from '@components/loader.js';
import { i18n } from '../../i18n/index.js';
import { showConfirmModal } from '@components/confirmModal.js';

const POLLS_PER_PAGE = 9;

function statusBadge(status) {
  if (status === 'open') return `<span class="vm-badge ms-2">${i18n.t('pollsList.status.open')}</span>`;
  if (status === 'closed') return `<span class="vm-badge vm-badge--orange ms-2">${i18n.t('pollsList.status.closed')}</span>`;
  return `<span class="vm-badge vm-badge--orange ms-2">${i18n.t('pollsList.status.draft')}</span>`;
}

function renderEmptyState() {
  return `
    <div class="col-12">
      <div class="vm-card p-4 text-center">
        <p class="text-muted mb-3">${i18n.t('pollsList.empty.noPollsForFilter')}</p>
        <a href="/polls/new" class="btn btn-votamin">${i18n.t('dashboard.actions.createPoll')}</a>
      </div>
    </div>
  `;
}

function renderCards(polls) {
  return polls.map((poll) => `
    <div class="col-md-6 col-lg-4">
      <div class="vm-card p-4 h-100">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h6 class="fw-bold mb-0">${poll.title}</h6>
          ${statusBadge(poll.status)}
        </div>
        <p class="text-muted small mb-3">${poll.response_count} ${i18n.t('pollsList.stats.votes')} · ${poll.options_count} ${i18n.t('pollsList.stats.options')}</p>
        <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
          <small class="text-muted">${i18n.t('pollsList.code')} <strong>${poll.share_code || '—'}</strong></small>
          <div class="d-flex align-items-center gap-2">
            <a href="/polls/${poll.id}" class="small fw-semibold">${i18n.t('pollsList.actions.view')}</a>
            <span class="text-muted">·</span>
            <a href="/polls/${poll.id}?edit=1" class="small fw-semibold">${i18n.t('pollsList.actions.edit')}</a>
            <span class="text-muted">·</span>
            <a href="#" class="small fw-semibold text-danger" data-action="delete" data-poll-id="${poll.id}">${i18n.t('pollsList.actions.delete')}</a>
          </div>
        </div>
      </div>
    </div>
  `).join('');
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
        ${pages.map((page) => `
          <button class="vm-page-btn ${page === safePage ? 'active' : ''}" data-page="${page}">${page}</button>
        `).join('')}
        <button class="vm-page-btn" data-page="${safePage + 1}" ${safePage === totalPages ? 'disabled' : ''}>${labels.next}</button>
        <span class="vm-dash-pagination-info">${labels.page} ${safePage} ${labels.of} ${totalPages}</span>
      </div>
    </div>
  `;
}

export default function render(container) {
  if (!getCurrentUser()) {
    navigateTo('/login');
    return;
  }

  container.innerHTML = htmlContent;
  i18n.loadTranslations();

  let activeStatus = 'all';
  let activePolls = [];
  let currentPage = 1;
  const filtersEl = container.querySelector('#polls-filters');
  const gridEl = container.querySelector('#polls-grid');
  const paginationEl = container.querySelector('#polls-pagination');

  const setFilterButtonState = (status) => {
    filtersEl?.querySelectorAll('[data-status]').forEach((button) => {
      const isActive = button.dataset.status === status;
      button.classList.toggle('active', isActive);
    });
  };

  const loadPolls = async () => {
    gridEl.innerHTML = `<div class="col-12">${getLoaderMarkup()}</div>`;
    if (paginationEl) paginationEl.innerHTML = '';
    try {
      const polls = await fetchMyPollsList({ status: activeStatus });
      activePolls = Array.isArray(polls) ? polls : [];
      currentPage = 1;
      renderPollsPage();
    } catch (error) {
      console.error('Failed to load polls list:', error);
      gridEl.innerHTML = `<div class="col-12"><div class="vm-card p-4 text-danger">${i18n.t('pollsList.errors.loadFailed')}</div></div>`;
      if (paginationEl) paginationEl.innerHTML = '';
    }
  };

  const renderPollsPage = () => {
    if (!activePolls.length) {
      gridEl.innerHTML = renderEmptyState();
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    const totalPages = getTotalPages(activePolls.length);
    currentPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (currentPage - 1) * POLLS_PER_PAGE;
    const visiblePolls = activePolls.slice(startIndex, startIndex + POLLS_PER_PAGE);

    gridEl.innerHTML = renderCards(visiblePolls);
    if (paginationEl) {
      paginationEl.innerHTML = renderPagination(activePolls.length, currentPage);
    }
  };

  filtersEl?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-status]');
    if (!button) return;
    activeStatus = button.dataset.status;
    currentPage = 1;
    setFilterButtonState(activeStatus);
    loadPolls();
  });

  paginationEl?.addEventListener('click', (event) => {
    const pageButton = event.target.closest('[data-page]');
    if (!pageButton) return;

    event.preventDefault();
    const selectedPage = Number(pageButton.dataset.page);
    if (Number.isNaN(selectedPage) || selectedPage === currentPage) return;

    currentPage = selectedPage;
    renderPollsPage();
  });

  gridEl?.addEventListener('click', async (event) => {
    const deleteTrigger = event.target.closest('[data-action="delete"]');
    if (!deleteTrigger) return;
    event.preventDefault();

    const pollId = deleteTrigger.dataset.pollId;
    if (!pollId) return;
    const confirmed = await showConfirmModal(i18n.t('pollsList.errors.deleteConfirm'));
    if (!confirmed) return;

    deletePollById(pollId)
      .then(() => {
        showToast(i18n.t('notifications.pollDeleted'), 'info');
        loadPolls();
      })
      .catch((error) => {
        console.error('Failed to delete poll from list page:', error);
        showToast(i18n.t('pollsList.errors.deleteFailed'), 'error');
      });
  });

  const handleLanguageChanged = () => {
    if (!document.body.contains(container)) {
      window.removeEventListener('votamin:language-changed', handleLanguageChanged);
      return;
    }

    i18n.loadTranslations();
    setFilterButtonState(activeStatus);
    loadPolls();
  };

  window.addEventListener('votamin:language-changed', handleLanguageChanged);

  setFilterButtonState(activeStatus);
  loadPolls();
}
