/* ============================================================
   Dashboard – My Polls sub-page
   ============================================================ */
import { fetchDashboardMyPolls } from '@utils/dashboardData.js';
import { i18n } from '../../i18n/index.js';
import { showToast } from '@utils/toast.js';
import { formatDate } from '@utils/helpers.js';
import { deletePollById } from '@utils/pollsData.js';

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
      <table class="vm-dash-table">
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
      <div class="vm-empty-icon">📋</div>
      <div class="vm-empty-title">${i18n.t('dashboard.empty.myPolls.title')}</div>
      <a href="/polls/new" class="btn btn-votamin mt-3">${i18n.t('dashboard.empty.myPolls.cta')}</a>
    </div>`;
}

export default async function render(container) {
  let activeStatus = 'all';
  function renderHeader() {
    return `
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
    <div id="my-polls-content">
      <div class="vm-loader-wrapper"><div class="vm-loader"></div></div>
    </div>`;
  }

  container.innerHTML = renderHeader();

  async function loadPolls(status) {
    const contentEl = container.querySelector('#my-polls-content');
    contentEl.innerHTML = '<div class="vm-loader-wrapper"><div class="vm-loader"></div></div>';
    try {
      const polls = await fetchDashboardMyPolls({ status });
      if (!polls || polls.length === 0) {
        contentEl.innerHTML = renderEmpty();
      } else {
        contentEl.innerHTML = renderTable(polls) + renderCards(polls);
      }
    } catch (err) {
      console.error('Failed to load My Polls:', err);
      contentEl.innerHTML = `<div class="vm-empty-state"><div class="vm-empty-title text-danger">${i18n.t('dashboard.error') || 'Error loading polls'}</div></div>`;
    }
  }

  /* Filter buttons */
  container.querySelector('#my-polls-filters')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-status]');
    if (!btn) return;
    activeStatus = btn.dataset.status;
    container.querySelectorAll('.vm-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadPolls(activeStatus);
  });

  /* Delete handler */
  container.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('[data-action="delete"]');
    if (!deleteBtn) return;
    e.preventDefault();
    const pollId = deleteBtn.dataset.pollId;
    if (!confirm(i18n.t('dashboard.confirmDelete') || 'Are you sure you want to delete this poll?')) return;

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
    container.querySelector('#my-polls-filters')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-status]');
      if (!btn) return;
      activeStatus = btn.dataset.status;
      container.querySelectorAll('.vm-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadPolls(activeStatus);
    });
    loadPolls(activeStatus);
  });

  await loadPolls(activeStatus);
}
