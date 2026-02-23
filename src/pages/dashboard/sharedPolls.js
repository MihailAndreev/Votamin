/* ============================================================
   Dashboard – Shared With Me sub-page
   ============================================================ */
import { fetchDashboardSharedPolls } from '@utils/dashboardData.js';
import { i18n } from '../../i18n/index.js';
import { formatDate } from '@utils/helpers.js';

function statusBadge(status) {
  const label = i18n.t(`dashboard.status.${status}`) || status;
  return `<span class="vm-status-badge vm-status-badge--${status}">${label}</span>`;
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
            <th>${t('owner')}</th>
            <th>${t('deadline')}</th>
            <th>${t('status')}</th>
            <th>${t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          ${polls.map(p => `
          <tr>
            <td><a href="/polls/${p.id}" class="fw-semibold">${p.title}</a></td>
            <td>${p.owner_name}</td>
            <td>${deadlineText(p.ends_at)}</td>
            <td>${statusBadge(p.status)}</td>
            <td>
              <a href="/polls/${p.id}" class="btn btn-sm btn-votamin-outline">${i18n.t('dashboard.actions.view')}</a>
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
          <span>${i18n.t('dashboard.table.columns.owner')}: ${p.owner_name}</span>
          ${statusBadge(p.status)}
          ${p.ends_at ? `<span>${deadlineText(p.ends_at)}</span>` : ''}
        </div>
        <div class="vm-dash-card-actions">
          <a href="/polls/${p.id}" class="btn btn-sm btn-votamin-outline">${i18n.t('dashboard.actions.view')}</a>
        </div>
      </div>`).join('')}
    </div>`;
}

function renderEmpty() {
  return `
    <div class="vm-empty-state">
      <div class="vm-empty-icon">🤝</div>
      <div class="vm-empty-title">${i18n.t('dashboard.empty.shared.title')}</div>
      <div class="vm-empty-subtitle">${i18n.t('dashboard.empty.shared.subtitle')}</div>
    </div>`;
}

export default async function render(container) {
  container.innerHTML = `
    <div class="vm-dash-header">
      <h3>${i18n.t('dashboard.sidebar.sharedWithMe')}</h3>
    </div>
    <div class="vm-dash-filters mb-3" id="shared-filters">
      <button class="vm-filter-btn active" data-status="all">${i18n.t('dashboard.filters.all')}</button>
      <button class="vm-filter-btn" data-status="open">${i18n.t('dashboard.filters.open')}</button>
      <button class="vm-filter-btn" data-status="closed">${i18n.t('dashboard.filters.closed')}</button>
    </div>
    <div id="shared-content">
      <div class="vm-loader-wrapper"><div class="vm-loader"></div></div>
    </div>`;

  const contentEl = container.querySelector('#shared-content');
  let activeStatus = 'all';

  async function loadPolls(status) {
    contentEl.innerHTML = '<div class="vm-loader-wrapper"><div class="vm-loader"></div></div>';
    try {
      const polls = await fetchDashboardSharedPolls({ status });
      if (!polls || polls.length === 0) {
        contentEl.innerHTML = renderEmpty();
      } else {
        contentEl.innerHTML = renderTable(polls) + renderCards(polls);
      }
    } catch (err) {
      console.error('Failed to load Shared polls:', err);
      contentEl.innerHTML = `<div class="vm-empty-state"><div class="vm-empty-title text-danger">Error loading polls</div></div>`;
    }
  }

  /* Filter buttons */
  container.querySelector('#shared-filters')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-status]');
    if (!btn) return;
    activeStatus = btn.dataset.status;
    container.querySelectorAll('.vm-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadPolls(activeStatus);
  });

  await loadPolls(activeStatus);
}
