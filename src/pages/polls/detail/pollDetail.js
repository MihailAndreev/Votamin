/* ============================================================
   Poll Detail Page  (/polls/:id)
   ============================================================ */
import './pollDetail.css';
import { getCurrentUser } from '@utils/auth.js';
import { showToast } from '@utils/toast.js';
import { i18n } from '../../../i18n/index.js';
import { navigateTo } from '../../../router.js';
import { closePollById, deletePollById, fetchPollById, updatePollById, fetchPollVoters, getOrCreatePollShareCode } from '@utils/pollsData.js';
import { getLoaderMarkup } from '@components/loader.js';
import { showConfirmModal } from '@components/confirmModal.js';

let removeLanguageChangedListener = null;
let removeExportOutsideClickListener = null;

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function statusLabel(status) {
  return i18n.t(`pollDetail.status.${status}`) || status;
}

function renderResultsSection(poll) {
  if (poll.kind === 'numeric') {
    if (!poll.numeric_summary) {
      return `<p class="text-muted mb-0">${i18n.t('pollDetail.noAnswersYet')}</p>`;
    }

    return `
      <div class="d-flex flex-column gap-2">
        <div><strong>${i18n.t('pollDetail.avg')}:</strong> ${poll.numeric_summary.avg}</div>
        <div><strong>${i18n.t('pollDetail.min')}:</strong> ${poll.numeric_summary.min}</div>
        <div><strong>${i18n.t('pollDetail.max')}:</strong> ${poll.numeric_summary.max}</div>
      </div>
    `;
  }

  if (!poll.options.length) {
    return `<p class="text-muted mb-0">${i18n.t('pollDetail.noOptions')}</p>`;
  }

  return poll.options.map((option) => `
    <div class="mb-3">
      <div class="d-flex justify-content-between mb-1">
        <span class="fw-semibold small">${escapeHtml(option.text)}</span>
        <span class="small text-muted">${option.percentage}% (${option.votes_count})</span>
      </div>
      <div class="progress" style="height:10px; border-radius:var(--vm-radius-full);">
        <div class="progress-bar" style="width:${option.percentage}%" role="progressbar"></div>
      </div>
    </div>
  `).join('');
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return i18n.t('pollDetail.sidebar.justNow');
  if (minutes < 60) return `${minutes} ${i18n.t('pollDetail.sidebar.minutesAgo')}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${i18n.t('pollDetail.sidebar.hoursAgo')}`;
  const days = Math.floor(hours / 24);
  return `${days} ${i18n.t('pollDetail.sidebar.daysAgo')}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function slugifyFileName(value) {
  return String(value || 'poll')
    .toLowerCase()
    .replace(/[^a-z0-9а-я]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'poll';
}

function buildExcelSheetName(value) {
  const raw = String(value || 'voters')
    .replace(/[\\/*?:\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!raw) return 'voters';
  return raw.slice(0, 31);
}

function getExportRows(poll) {
  const voters = Array.isArray(poll?._voters) ? poll._voters : [];
  return voters.map((voter, index) => ({
    '#': index + 1,
    voter: voter.voter_name || 'Анонимен',
    selections: Array.isArray(voter.selections) ? voter.selections.join(', ') : '',
    voted_at: formatDateTime(voter.voted_at),
  }));
}

function downloadTextFile(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => {
    const text = String(value ?? '');
    if (text.includes('"') || text.includes(',') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(',')),
  ];

  return lines.join('\n');
}

async function exportVotersList(poll, format) {
  const rows = getExportRows(poll);
  if (!rows.length) {
    showToast(i18n.t('pollDetail.voters.exportNoData'), 'info');
    return;
  }

  const dateStamp = new Date().toISOString().slice(0, 10);
  const baseFileName = `voters-${slugifyFileName(poll?.title)}-${dateStamp}`;

  try {
    if (format === 'csv') {
      const csv = toCsv(rows);
      downloadTextFile(`${baseFileName}.csv`, `\uFEFF${csv}`, 'text/csv;charset=utf-8;');
      showToast(i18n.t('pollDetail.voters.exportSuccess'), 'success');
      return;
    }

    if (format === 'json') {
      const json = JSON.stringify(rows, null, 2);
      downloadTextFile(`${baseFileName}.json`, json, 'application/json;charset=utf-8;');
      showToast(i18n.t('pollDetail.voters.exportSuccess'), 'success');
      return;
    }

    if (format === 'xlsx') {
      const XLSX = await import('xlsx/xlsx.mjs');
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, buildExcelSheetName(baseFileName));
      XLSX.writeFile(workbook, `${baseFileName}.xlsx`);
      showToast(i18n.t('pollDetail.voters.exportSuccess'), 'success');
    }
  } catch (error) {
    console.error('Failed to export voters:', error);
    showToast(i18n.t('pollDetail.voters.exportFailed') || 'Export failed', 'error');
  }
}

function renderLeftSidebar(poll) {
  const t = (k) => i18n.t(`pollDetail.sidebar.${k}`);

  const lastVote = poll._voters && poll._voters.length > 0
    ? timeAgo(poll._voters[0].voted_at)
    : '—';

  return `
    <aside class="vm-poll-sidebar vm-poll-sidebar--left">
      <div class="vm-sidebar-section">
        <h6 class="vm-sidebar-title">${t('metricsTitle')}</h6>
        <ul class="vm-sidebar-kpi">
          <li>
            <span class="vm-kpi-label">${t('participants')}</span>
            <span class="vm-kpi-value">${poll.total_votes}</span>
          </li>
          <li>
            <span class="vm-kpi-label">${t('status')}</span>
            <span class="vm-kpi-value">${statusLabel(poll.status)}</span>
          </li>
          <li>
            <span class="vm-kpi-label">${t('modified')}</span>
            <span class="vm-kpi-value">${formatDateTime(poll.updated_at)}</span>
          </li>
          <li>
            <span class="vm-kpi-label">${t('lastActivity')}</span>
            <span class="vm-kpi-value">${lastVote}</span>
          </li>
          <li>
            <span class="vm-kpi-label">${t('created')}</span>
            <span class="vm-kpi-value">${formatDateTime(poll.created_at)}</span>
          </li>
        </ul>
      </div>

      ${poll.is_owner ? `
      <div class="vm-sidebar-section vm-sidebar-section--admin">
        <h6 class="vm-sidebar-title">${t('adminTitle')}</h6>
        <ul class="vm-sidebar-kpi">
          <li>
            <span class="vm-kpi-label">${t('shareCode')}</span>
            <span class="vm-kpi-value">${escapeHtml(poll.share_code || '—')}</span>
          </li>
          <li>
            <span class="vm-kpi-label">${t('visibility')}</span>
            <span class="vm-kpi-value">${poll.visibility || '—'}</span>
          </li>
          <li>
            <span class="vm-kpi-label">${t('kind')}</span>
            <span class="vm-kpi-value">${i18n.t(`dashboard.kind.${poll.kind}`) || poll.kind}</span>
          </li>
        </ul>
      </div>` : ''}
    </aside>`;
}

function renderRightSidebar(poll) {
  const t = (k) => i18n.t(`pollDetail.voters.${k}`);
  const voters = poll._voters || [];
  const INITIAL_SHOW = 5;

  if (!poll.is_owner) {
    return `<aside class="vm-poll-sidebar vm-poll-sidebar--right"></aside>`;
  }

  if (voters.length === 0) {
    return `
      <aside class="vm-poll-sidebar vm-poll-sidebar--right">
        <div class="vm-sidebar-section">
          <h6 class="vm-sidebar-title">${t('title')} (0)</h6>
          <p class="text-muted small">${t('noVoters')}</p>
        </div>
      </aside>`;
  }

  const voterItems = voters.map((v, idx) => `
    <li class="vm-voter-item ${idx >= INITIAL_SHOW ? 'vm-voter-hidden' : ''}">
      <div class="vm-voter-name">${escapeHtml(v.voter_name)}</div>
      <div class="vm-voter-choice">${escapeHtml(v.selections.join(', ') || '—')}</div>
      <div class="vm-voter-time">${timeAgo(v.voted_at)}</div>
    </li>
  `).join('');

  const showMoreBtn = voters.length > INITIAL_SHOW
    ? `<button class="vm-voters-show-more" id="btn-show-more-voters">${t('showMore')} (${voters.length - INITIAL_SHOW})</button>`
    : '';

  return `
    <aside class="vm-poll-sidebar vm-poll-sidebar--right">
      <div class="vm-sidebar-section">
        <div class="vm-sidebar-head">
          <h6 class="vm-sidebar-title mb-0">${t('title')} (${voters.length})</h6>
          <details class="vm-export-menu">
            <summary class="vm-export-trigger">${t('export')}</summary>
            <div class="vm-export-list">
              <button type="button" class="vm-export-item" data-export-format="csv">${t('csv')}</button>
              <button type="button" class="vm-export-item" data-export-format="json">${t('json')}</button>
              <button type="button" class="vm-export-item" data-export-format="xlsx">${t('excel')}</button>
            </div>
          </details>
        </div>
        <ul class="vm-voters-list">
          ${voterItems}
        </ul>
        ${showMoreBtn}
      </div>
    </aside>`;
}

function renderBackLinks({ isFromAdminPolls }) {
  const backToMyPolls = `
    <a href="/dashboard/polls" class="vm-poll-back-link mb-3 d-inline-flex align-items-center">${i18n.t('pollDetail.backToMyPolls')}</a>
  `;

  if (!isFromAdminPolls) {
    return backToMyPolls;
  }

  return `
    <div class="d-flex flex-wrap gap-2 mb-3 vm-poll-back-links">
      ${backToMyPolls}
      <a href="/admin/polls" class="vm-poll-back-link vm-poll-back-link--admin d-inline-flex align-items-center">${i18n.t('pollDetail.backToAdminPolls')}</a>
    </div>
  `;
}

function renderPollDetailMarkup(poll, { isEditMode, isFromAdminPolls }) {
  const shareCode = poll.share_code || '—';
  const copyLinkHtml = poll.share_code
    ? `· <a href="#" id="copy-link" class="fw-semibold">${i18n.t('pollDetail.copyLink')}</a>`
    : '';
  const editButtonText = isEditMode ? i18n.t('pollDetail.editCancel') : i18n.t('pollDetail.editAction');

  return `
  <section class="container vm-section vm-poll-detail-wrapper">
    ${renderBackLinks({ isFromAdminPolls })}

    <div class="vm-poll-detail-grid">
      ${renderLeftSidebar(poll)}

      <main class="vm-poll-detail-center">
        <div class="vm-card p-4 mb-4">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h3 class="fw-bold mb-0" id="poll-title">${escapeHtml(poll.title)}</h3>
            <span class="vm-badge ms-3 ${poll.status === 'draft' ? 'vm-poll-status-badge--draft' : ''}">${statusLabel(poll.status)}</span>
          </div>
          <p class="text-muted" id="poll-desc">${escapeHtml(poll.description || i18n.t('pollDetail.noDescription'))}</p>
          <small class="text-muted">${i18n.t('pollDetail.shareCode')} <strong id="poll-code">${escapeHtml(shareCode)}</strong>
            ${copyLinkHtml}
          </small>
        </div>

        <div class="vm-card p-4 mb-4 ${poll.is_owner ? '' : 'd-none'}" id="poll-edit-card">
          <h5 class="fw-bold mb-3">${i18n.t('pollDetail.editTitle')}</h5>
          <div id="poll-edit-view" class="${isEditMode ? '' : 'd-none'}">
            <div class="mb-3">
              <label class="form-label">${i18n.t('pollDetail.titleLabel')}</label>
              <input class="form-control" id="edit-title" type="text" maxlength="200" value="${escapeHtml(poll.title)}" />
            </div>
            <div class="mb-3">
              <label class="form-label">${i18n.t('pollDetail.descriptionLabel')}</label>
              <textarea class="form-control" id="edit-description" rows="3">${escapeHtml(poll.description || '')}</textarea>
            </div>
            <div class="mb-3">
              <label class="form-label">${i18n.t('pollDetail.statusLabel')}</label>
              <select class="form-select" id="edit-status">
                <option value="draft" ${poll.status === 'draft' ? 'selected' : ''}>${i18n.t('pollDetail.status.draft')}</option>
                <option value="open" ${poll.status === 'open' ? 'selected' : ''}>${i18n.t('pollDetail.status.open')}</option>
                <option value="closed" ${poll.status === 'closed' ? 'selected' : ''}>${i18n.t('pollDetail.status.closed')}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">${i18n.t('pollDetail.visibilityLabel')}</label>
              <select class="form-select" id="edit-visibility">
                <option value="public" ${poll.visibility === 'public' ? 'selected' : ''}>${i18n.t('pollDetail.visibility.public')}</option>
                <option value="private" ${poll.visibility === 'private' ? 'selected' : ''}>${i18n.t('pollDetail.visibility.private')}</option>
              </select>
            </div>
            <button class="btn btn-votamin" id="btn-save-edit">${i18n.t('pollDetail.saveChanges')}</button>
          </div>
          <div id="poll-edit-hint" class="${isEditMode ? 'd-none' : ''}">
            <p class="text-muted mb-0">${i18n.t('pollDetail.editHint')}</p>
          </div>
        </div>

        <div class="vm-card p-4 mb-4">
          <h5 class="fw-bold mb-4">${i18n.t('pollDetail.resultsTitle')} <span class="text-muted fw-normal small">(${poll.total_votes} ${i18n.t('pollDetail.votesSuffix')})</span></h5>
          ${renderResultsSection(poll)}
        </div>

        <div class="d-flex gap-3 vm-owner-actions ${poll.is_owner ? '' : 'd-none'}" id="owner-actions">
          <button class="btn btn-votamin-secondary" id="btn-toggle-edit">${editButtonText}</button>
          <button class="btn btn-votamin-outline" id="btn-close-poll" ${poll.status === 'closed' ? 'disabled' : ''}>${i18n.t('pollDetail.closePoll')}</button>
          <button class="btn btn-votamin-outline" id="btn-delete-poll">${i18n.t('pollDetail.deletePoll')}</button>
          ${isEditMode && poll.status === 'draft'
            ? `<button class="btn btn-votamin vm-owner-actions__publish" id="btn-publish-poll">${i18n.t('createPoll.actions.publish')}</button>`
            : ''}
        </div>
      </main>

      ${renderRightSidebar(poll)}
    </div>
  </section>`;
}

export default async function render(container, params) {
  if (removeLanguageChangedListener) {
    removeLanguageChangedListener();
    removeLanguageChangedListener = null;
  }

  if (removeExportOutsideClickListener) {
    removeExportOutsideClickListener();
    removeExportOutsideClickListener = null;
  }

  if (!getCurrentUser()) {
    navigateTo('/login');
    return;
  }

  container.innerHTML = `
    <section class="container vm-section vm-poll-detail-wrapper">
      ${getLoaderMarkup()}
    </section>
  `;

  const pollId = params?.id;
  const isFromAdminPolls = new URLSearchParams(window.location.search).get('from') === 'admin-polls';
  if (!pollId) {
    showToast(i18n.t('pollDetail.missingPollId'), 'error');
    navigateTo('/dashboard/polls');
    return;
  }

  let poll;
  try {
    poll = await fetchPollById(pollId);
    if (poll.is_owner) {
      try {
        poll._voters = await fetchPollVoters(pollId);
      } catch (voterErr) {
        console.warn('Failed to load voters:', voterErr);
        poll._voters = [];
      }
    } else {
      poll._voters = [];
    }
  } catch (error) {
    console.error('Failed to load poll detail:', error);
    container.innerHTML = `<section class="container vm-section"><div class="vm-card p-4 text-danger">${i18n.t('pollDetail.loadFailed')}</div></section>`;
    return;
  }

  const isEditModeFromUrl = new URLSearchParams(window.location.search).get('edit') === '1';
  let isEditMode = isEditModeFromUrl && poll.is_owner;

  const ensureShareCodeForOpenPoll = async () => {
    if (!poll?.is_owner) return;
    if (poll.status !== 'open') return;
    if (poll.share_code) return;

    await getOrCreatePollShareCode(pollId);
  };

  const renderView = () => {
    container.innerHTML = renderPollDetailMarkup(poll, { isEditMode, isFromAdminPolls });

    if (removeExportOutsideClickListener) {
      removeExportOutsideClickListener();
      removeExportOutsideClickListener = null;
    }

    const handleOutsideExportClick = (event) => {
      const openMenus = container.querySelectorAll('.vm-export-menu[open]');
      if (!openMenus.length) return;

      openMenus.forEach((menu) => {
        if (!menu.contains(event.target)) {
          menu.removeAttribute('open');
        }
      });
    };

    document.addEventListener('click', handleOutsideExportClick);
    removeExportOutsideClickListener = () => {
      document.removeEventListener('click', handleOutsideExportClick);
    };

    const copyLink = container.querySelector('#copy-link');
    copyLink?.addEventListener('click', (e) => {
      e.preventDefault();
      const code = container.querySelector('#poll-code')?.textContent;
      if (!code || code === '—') return;

      const url = `${location.origin}/p/${code}`;
      navigator.clipboard.writeText(url).then(() => {
        copyLink.textContent = i18n.t('pollDetail.copied');
        showToast(i18n.t('notifications.linkCopied'), 'info');
        setTimeout(() => {
          copyLink.textContent = i18n.t('pollDetail.copyLink');
        }, 2000);
      }).catch(() => {
        showToast(i18n.t('notifications.linkCopyFailed'), 'error');
      });
    });

    container.querySelector('#btn-toggle-edit')?.addEventListener('click', () => {
      isEditMode = !isEditMode;
      renderView();
    });

    container.querySelector('#btn-save-edit')?.addEventListener('click', async () => {
      const title = container.querySelector('#edit-title')?.value?.trim();
      const description = container.querySelector('#edit-description')?.value?.trim();
      const status = container.querySelector('#edit-status')?.value;
      const visibility = container.querySelector('#edit-visibility')?.value;

      if (!title) {
        showToast(i18n.t('pollDetail.titleRequired'), 'error');
        return;
      }

      try {
        await updatePollById(pollId, {
          title,
          status,
          visibility,
          description_html: description
            ? `<p>${description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
            : null,
        });

        if (status === 'open') {
          await getOrCreatePollShareCode(pollId);
        }

        poll = await fetchPollById(pollId);
        if (poll.is_owner) {
          poll._voters = await fetchPollVoters(pollId);
        }
        isEditMode = false;
        renderView();
        showToast(i18n.t('pollDetail.updated'), 'success');
      } catch (error) {
        console.error('Failed to update poll:', error);
        showToast(i18n.t('pollDetail.updateFailed'), 'error');
      }
    });

    container.querySelector('#btn-close-poll')?.addEventListener('click', async () => {
      try {
        await closePollById(pollId);
        poll = await fetchPollById(pollId);
        if (poll.is_owner) {
          poll._voters = await fetchPollVoters(pollId);
        }
        renderView();
        showToast(i18n.t('notifications.pollClosed'), 'info');
      } catch (error) {
        console.error('Failed to close poll:', error);
        showToast(i18n.t('pollDetail.closeFailed'), 'error');
      }
    });

    container.querySelector('#btn-delete-poll')?.addEventListener('click', async () => {
      const confirmed = await showConfirmModal(i18n.t('pollDetail.deleteConfirm'));
      if (!confirmed) {
        return;
      }

      try {
        await deletePollById(pollId);
        showToast(i18n.t('notifications.pollDeleted'), 'info');
        navigateTo('/dashboard/polls');
      } catch (error) {
        console.error('Failed to delete poll:', error);
        showToast(i18n.t('pollDetail.deleteFailed'), 'error');
      }
    });

    container.querySelector('#btn-publish-poll')?.addEventListener('click', async () => {
      try {
        await updatePollById(pollId, { status: 'open' });
        await getOrCreatePollShareCode(pollId);
        poll = await fetchPollById(pollId);
        if (poll.is_owner) {
          poll._voters = await fetchPollVoters(pollId);
        }
        isEditMode = false;
        renderView();
        showToast(i18n.t('createPoll.publish.published'), 'success');
      } catch (error) {
        console.error('Failed to publish poll:', error);
        showToast(i18n.t('createPoll.publish.error'), 'error');
      }
    });

    // Show more voters button
    container.querySelector('#btn-show-more-voters')?.addEventListener('click', (e) => {
      container.querySelectorAll('.vm-voter-hidden').forEach((el) => el.classList.remove('vm-voter-hidden'));
      e.target.remove();
    });

    container.querySelectorAll('[data-export-format]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        const format = event.currentTarget.getAttribute('data-export-format');
        await exportVotersList(poll, format);

        const details = event.currentTarget.closest('.vm-export-menu');
        if (details?.hasAttribute('open')) {
          details.removeAttribute('open');
        }
      });
    });
  };

  try {
    await ensureShareCodeForOpenPoll();
    poll = await fetchPollById(pollId);
    if (poll.is_owner) {
      poll._voters = await fetchPollVoters(pollId);
    }
  } catch (error) {
    console.error('Failed to ensure share code for open poll:', error);
  }

  renderView();

  const handleLanguageChanged = () => {
    if (!document.body.contains(container)) {
      window.removeEventListener('votamin:language-changed', handleLanguageChanged);
      if (removeExportOutsideClickListener) {
        removeExportOutsideClickListener();
        removeExportOutsideClickListener = null;
      }
      removeLanguageChangedListener = null;
      return;
    }

    renderView();
  };

  window.addEventListener('votamin:language-changed', handleLanguageChanged);
  removeLanguageChangedListener = () => {
    window.removeEventListener('votamin:language-changed', handleLanguageChanged);
  };
}
