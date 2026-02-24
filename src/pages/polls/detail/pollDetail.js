/* ============================================================
   Poll Detail Page  (/polls/:id)
   ============================================================ */
import './pollDetail.css';
import { getCurrentUser } from '@utils/auth.js';
import { showToast } from '@utils/toast.js';
import { i18n } from '../../../i18n/index.js';
import { navigateTo } from '../../../router.js';
import { closePollById, deletePollById, fetchPollById, updatePollById } from '@utils/pollsData.js';
import { getLoaderMarkup } from '@components/loader.js';
import { showConfirmModal } from '@components/confirmModal.js';

let removeLanguageChangedListener = null;

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

function renderPollDetailMarkup(poll, { isEditMode }) {
  const shareCode = poll.share_code || '—';
  const copyLinkHtml = poll.share_code
    ? `· <a href="#" id="copy-link" class="fw-semibold">${i18n.t('pollDetail.copyLink')}</a>`
    : '';
  const editButtonText = isEditMode ? i18n.t('pollDetail.editCancel') : i18n.t('pollDetail.editAction');

  return `
  <section class="container vm-section" style="max-width:780px;">
    <a href="/dashboard/polls" class="vm-poll-back-link mb-3 d-inline-flex align-items-center">${i18n.t('pollDetail.backToMyPolls')}</a>

    <div class="vm-card p-4 mb-4">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <h3 class="fw-bold mb-0" id="poll-title">${escapeHtml(poll.title)}</h3>
        <span class="vm-badge ms-3">${statusLabel(poll.status)}</span>
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

    <div class="d-flex gap-3 ${poll.is_owner ? '' : 'd-none'}" id="owner-actions">
      <button class="btn btn-votamin-secondary" id="btn-toggle-edit">${editButtonText}</button>
      <button class="btn btn-votamin-outline" id="btn-close-poll" ${poll.status === 'closed' ? 'disabled' : ''}>${i18n.t('pollDetail.closePoll')}</button>
      <button class="btn btn-votamin-outline" id="btn-delete-poll">${i18n.t('pollDetail.deletePoll')}</button>
    </div>
  </section>`;
}

export default async function render(container, params) {
  if (removeLanguageChangedListener) {
    removeLanguageChangedListener();
    removeLanguageChangedListener = null;
  }

  if (!getCurrentUser()) {
    navigateTo('/login');
    return;
  }

  container.innerHTML = `
    <section class="container vm-section" style="max-width:780px;">
      ${getLoaderMarkup()}
    </section>
  `;

  const pollId = params?.id;
  if (!pollId) {
    showToast(i18n.t('pollDetail.missingPollId'), 'error');
    navigateTo('/dashboard/polls');
    return;
  }

  let poll;
  try {
    poll = await fetchPollById(pollId);
  } catch (error) {
    console.error('Failed to load poll detail:', error);
    container.innerHTML = `<section class="container vm-section"><div class="vm-card p-4 text-danger">${i18n.t('pollDetail.loadFailed')}</div></section>`;
    return;
  }

  const isEditModeFromUrl = new URLSearchParams(window.location.search).get('edit') === '1';
  let isEditMode = isEditModeFromUrl && poll.is_owner;

  const renderView = () => {
    container.innerHTML = renderPollDetailMarkup(poll, { isEditMode });

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

      if (!title) {
        showToast(i18n.t('pollDetail.titleRequired'), 'error');
        return;
      }

      try {
        await updatePollById(pollId, {
          title,
          status,
          description_html: description
            ? `<p>${description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
            : null,
        });

        poll = await fetchPollById(pollId);
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
  };

  renderView();

  const handleLanguageChanged = () => {
    if (!document.body.contains(container)) {
      window.removeEventListener('votamin:language-changed', handleLanguageChanged);
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
