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

function statusBadge(status) {
  if (status === 'open') return '<span class="vm-badge ms-2">Активна</span>';
  if (status === 'closed') return '<span class="vm-badge vm-badge--orange ms-2">Затворена</span>';
  return '<span class="vm-badge vm-badge--orange ms-2">Чернова</span>';
}

function renderEmptyState() {
  return `
    <div class="col-12">
      <div class="vm-card p-4 text-center">
        <p class="text-muted mb-3">Нямаш анкети за този филтър.</p>
        <a href="/polls/new" class="btn btn-votamin">+ Нова анкета</a>
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
        <p class="text-muted small mb-3">${poll.response_count} гласа · ${poll.options_count} опции</p>
        <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
          <small class="text-muted">Код: <strong>${poll.share_code || '—'}</strong></small>
          <div class="d-flex align-items-center gap-2">
            <a href="/polls/${poll.id}" class="small fw-semibold">Виж</a>
            <span class="text-muted">·</span>
            <a href="/polls/${poll.id}?edit=1" class="small fw-semibold">Редакция</a>
            <span class="text-muted">·</span>
            <a href="#" class="small fw-semibold text-danger" data-action="delete" data-poll-id="${poll.id}">Изтрий</a>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

export default function render(container) {
  if (!getCurrentUser()) {
    navigateTo('/login');
    return;
  }

  container.innerHTML = htmlContent;

  let activeStatus = 'all';
  const filtersEl = container.querySelector('#polls-filters');
  const gridEl = container.querySelector('#polls-grid');

  const setFilterButtonState = (status) => {
    filtersEl?.querySelectorAll('[data-status]').forEach((button) => {
      const isActive = button.dataset.status === status;
      button.classList.toggle('btn-votamin', isActive);
      button.classList.toggle('btn-votamin-outline', !isActive);
    });
  };

  const loadPolls = async () => {
    gridEl.innerHTML = `<div class="col-12">${getLoaderMarkup()}</div>`;
    try {
      const polls = await fetchMyPollsList({ status: activeStatus });
      gridEl.innerHTML = polls.length ? renderCards(polls) : renderEmptyState();
    } catch (error) {
      console.error('Failed to load polls list:', error);
      gridEl.innerHTML = '<div class="col-12"><div class="vm-card p-4 text-danger">Грешка при зареждане на анкетите.</div></div>';
    }
  };

  filtersEl?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-status]');
    if (!button) return;
    activeStatus = button.dataset.status;
    setFilterButtonState(activeStatus);
    loadPolls();
  });

  gridEl?.addEventListener('click', (event) => {
    const deleteTrigger = event.target.closest('[data-action="delete"]');
    if (!deleteTrigger) return;
    event.preventDefault();

    const pollId = deleteTrigger.dataset.pollId;
    if (!pollId) return;
    if (!confirm('Сигурен ли си, че искаш да изтриеш тази анкета?')) return;

    deletePollById(pollId)
      .then(() => {
        showToast('Анкетата е изтрита.', 'info');
        loadPolls();
      })
      .catch((error) => {
        console.error('Failed to delete poll from list page:', error);
        showToast('Грешка при изтриване на анкетата.', 'error');
      });
  });

  setFilterButtonState(activeStatus);
  loadPolls();
}
