/* ============================================================
   Dashboard – Shared With Me sub-page
   ============================================================ */
import { fetchDashboardSharedPolls } from '@utils/dashboardData.js';
import { i18n } from '../../i18n/index.js';
import { formatDate } from '@utils/helpers.js';
 
function escapeHtmlAttr(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
 
function formatTimeOnly(dateValue) {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString('bg-BG', {
    hour: '2-digit',
    minute: '2-digit'
  });
}
 
function renderDateWithHover(dateValue, fallbackText) {
  if (!dateValue) {
    return fallbackText;
  }

  const displayValue = formatDate(dateValue);
  const hoverValue = formatTimeOnly(dateValue);

  if (!hoverValue) {
    return displayValue;
  }

  return `\n    <span\n      class="vm-date-hover-tooltip"\n      data-tooltip="${escapeHtmlAttr(hoverValue)}"\n      tabindex="0"\n      aria-label="${escapeHtmlAttr(hoverValue)}"\n    >${displayValue}</span>\n  `;
}

function statusBadge(status) {
  const label = i18n.t(`dashboard.status.${status}`) || status;
  return `<span class="vm-status-badge vm-status-badge--${status}">${label}</span>`;
}

function modifiedText(updatedAt) {
  if (!updatedAt) return i18n.t('dashboard.noModifiedDate');
  return formatDate(updatedAt);
}

function deadlineText(endsAt) {
  if (!endsAt) return i18n.t('dashboard.noDeadline');
  return formatDate(endsAt);
}

function resultsVisibilityBadge(value) {
  const label = i18n.t(`createPoll.resultsVisibility.${value}`) || '—';
  return `<span class="vm-results-visibility-badge">${label}</span>`;
}

function renderTable(polls) {
  const t = (k) => i18n.t(`dashboard.table.columns.${k}`);
  return `
    <div class="vm-dash-table-wrap">
      <table class="vm-dash-table vm-shared-polls-table">
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
            <td><a href="/polls/${p.id}?from=shared" class="fw-semibold">${p.title}</a></td>
            <td>${p.owner_name}</td>
            <td>${renderDateWithHover(p.ends_at, i18n.t('dashboard.noDeadline'))}</td>
            <td>${statusBadge(p.status)}</td>
            <td>
              <a href="/polls/${p.id}?from=shared" class="btn btn-sm btn-votamin-outline">${i18n.t('dashboard.actions.view')}</a>
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
        <div class="vm-dash-card-title"><a href="/polls/${p.id}?from=shared">${p.title}</a></div>
          <div class="vm-dash-card-meta">
          <span>${i18n.t('dashboard.table.columns.owner')}: ${p.owner_name}</span>
          ${statusBadge(p.status)}
          ${resultsVisibilityBadge(p.results_visibility)}
          <span>${i18n.t('dashboard.table.columns.deadline')}: ${renderDateWithHover(p.ends_at, i18n.t('dashboard.noDeadline'))}</span>
          <span>${i18n.t('dashboard.table.columns.modified')}: ${modifiedText(p.updated_at)}</span>
        </div>
        <div class="vm-dash-card-actions">
          <a href="/polls/${p.id}?from=shared" class="btn btn-sm btn-votamin-outline">${i18n.t('dashboard.actions.view')}</a>
        </div>
      </div>`).join('')}
    </div>`;
}

function renderEmpty() {
  return `
    <div class="vm-empty-state">
      <div class="vm-empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M7 12 5 10a2 2 0 0 1 0-2.8l1.6-1.6a2 2 0 0 1 2.8 0l2.1 2.1M17 12l2-2a2 2 0 0 0 0-2.8l-1.6-1.6a2 2 0 0 0-2.8 0l-2.1 2.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="m9.3 12.7 2.1 2.1a2 2 0 0 0 2.8 0l2.5-2.5a2 2 0 0 0 0-2.8M14.7 12.7l-2.1 2.1a2 2 0 0 1-2.8 0l-2.5-2.5a2 2 0 0 1 0-2.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="vm-empty-title">${i18n.t('dashboard.empty.shared.title')}</div>
      <div class="vm-empty-subtitle">${i18n.t('dashboard.empty.shared.subtitle')}</div>
    </div>`;
}

export default async function render(container) {
  let activeStatus = 'all';

  function renderHeader() {
    return `
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
  }

  container.innerHTML = renderHeader();

  const contentEl = container.querySelector('#shared-content');

  async function loadPolls(status) {
    const contentEl = container.querySelector('#shared-content');
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
      contentEl.innerHTML = `<div class="vm-empty-state"><div class="vm-empty-title text-danger">${i18n.t('dashboard.error') || 'Error loading polls'}</div></div>`;
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

  /* Listen for language changes */
  window.addEventListener('votamin:language-changed', () => {
    container.innerHTML = renderHeader();
    container.querySelector('#shared-filters')?.addEventListener('click', (e) => {
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
