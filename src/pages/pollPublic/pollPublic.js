/* ============================================================
   Public Poll Page  (/p/:code)
   ============================================================ */
import './pollPublic.css';
import { showToast } from '@utils/toast.js';
import { i18n } from '../../i18n/index.js';
import { supabaseClient } from '@utils/supabase.js';
import { getLoaderMarkup } from '@components/loader.js';
import { getCurrentUser } from '@utils/auth.js';
import { navigateTo } from '../../router.js';

let removeLanguageChangedListener = null;

function buildLoginPathWithNext() {
  const next = `${window.location.pathname}${window.location.search}`;
  return `/login?next=${encodeURIComponent(next)}`;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function t(key) {
  return i18n.t(`publicPoll.${key}`);
}

function renderErrorState(message) {
  return `
    <div class="min-vh-100 d-flex align-items-center justify-content-center"
         style="background: linear-gradient(135deg, var(--vm-green-light) 0%, var(--vm-white) 50%, var(--vm-orange-light) 100%);">
      <div style="width:100%; max-width:520px; padding:1rem;">
        <div class="vm-card p-4 p-md-5 text-center">
          <h4 class="fw-bold mb-2">${escapeHtml(t('notAccessibleTitle'))}</h4>
          <p class="text-muted mb-0">${escapeHtml(message)}</p>
        </div>
      </div>
    </div>
  `;
}

function renderOptions(poll) {
  if (poll.kind === 'numeric') {
    return `
      <div class="mb-4">
        <label class="form-label fw-semibold" for="public-numeric-value">${escapeHtml(t('numericLabel'))}</label>
        <input
          type="number"
          class="form-control"
          id="public-numeric-value"
          placeholder="${escapeHtml(t('numericPlaceholder'))}"
        />
      </div>
    `;
  }

  const inputType = poll.kind === 'multiple_choice' ? 'checkbox' : 'radio';

  return `
    <div class="d-grid gap-2 mb-4" id="public-options">
      ${poll.options.map((option) => `
        <label class="vm-vote-option vm-card p-3 d-flex align-items-center gap-3">
          <input type="${inputType}" name="vote" value="${option.id}" class="form-check-input mt-0" style="width:1.2em;height:1.2em;" />
          <span class="fw-semibold">${escapeHtml(option.text)}</span>
        </label>
      `).join('')}
    </div>
  `;
}

function renderPublicPollMarkup(poll) {
  const isClosed = poll.status === 'closed';
  const description = poll.description || '';
  const poweredByHref = getCurrentUser() ? '/dashboard' : '/';

  return `
    <div class="min-vh-100 d-flex align-items-center justify-content-center"
         style="background: linear-gradient(135deg, var(--vm-green-light) 0%, var(--vm-white) 50%, var(--vm-orange-light) 100%);">
      <div style="width:100%; max-width:520px; padding:1rem;">
        <div class="vm-card p-4 p-md-5">
          <div class="text-center mb-4">
            <img src="/src/assets/images/logo/logo.svg" alt="Votamin" class="vm-public-brand-logo" />
            <h4 class="vm-public-poll-title fw-bold" id="public-poll-title">${escapeHtml(poll.title)}</h4>
            ${description ? `<p class="text-muted small" id="public-poll-desc">${escapeHtml(description)}</p>` : ''}
          </div>

          ${isClosed ? `<div class="alert alert-secondary">${escapeHtml(t('closedAlert'))}</div>` : ''}

          <form id="public-vote-form">
            ${renderOptions(poll)}
            <button type="submit" class="btn btn-votamin w-100 btn-lg" ${isClosed ? 'disabled' : ''}>${escapeHtml(t('voteButton'))}</button>
          </form>

          <div id="public-thanks" class="text-center d-none py-4">
            <h4 class="fw-bold">${escapeHtml(t('thanksTitle'))}</h4>
            <p class="text-muted">${escapeHtml(t('thanksText'))}</p>
            <a href="/dashboard" class="btn btn-votamin mt-2" id="public-return-dashboard">${escapeHtml(t('returnToDashboard'))}</a>
          </div>
        </div>
        <p class="text-center mt-3 small text-muted">
          ${escapeHtml(t('poweredBy'))}
          <a href="${poweredByHref}" class="fw-semibold d-inline-flex align-items-center vm-powered-by-link" aria-label="Votamin">
            <img src="/src/assets/images/logo/logo.svg" alt="Votamin" class="vm-powered-by-logo" />
          </a>
        </p>
      </div>
    </div>
  `;
}

async function fetchPublicPollByCode(code) {
  const { data: share, error: shareError } = await supabaseClient
    .from('poll_shares')
    .select('poll_id, expires_at')
    .eq('share_code', code)
    .maybeSingle();

  if (shareError) throw shareError;
  if (!share?.poll_id) {
    throw new Error('invalid_share_code');
  }

  if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
    throw new Error('expired_share_code');
  }

  const { data: poll, error: pollError } = await supabaseClient
    .from('polls')
    .select('id, title, description_html, status, kind')
    .eq('id', share.poll_id)
    .single();

  if (pollError) throw pollError;

  const { data: options, error: optionsError } = await supabaseClient
    .from('poll_options')
    .select('id, text, position')
    .eq('poll_id', poll.id)
    .order('position', { ascending: true });

  if (optionsError) throw optionsError;

  return {
    ...poll,
    description: stripHtml(poll.description_html),
    options: options || [],
  };
}

function mapVoteErrorToMessage(error) {
  if (!error) return t('errors.voteFailed');

  if (error.code === '23505') {
    return t('errors.alreadyVoted');
  }

  if (error.code === '42501') {
    return t('errors.noPermission');
  }

  if (typeof error.message === 'string' && error.message.includes('poll_is_open_for_voting')) {
    return t('errors.pollNotOpen');
  }

  if (typeof error.message === 'string' && error.message.includes('max')) {
    return t('errors.invalidOptionCount');
  }

  return t('errors.voteFailed');
}

async function submitPublicVote(poll, { selectedOptionIds, numericValue }) {
  const user = getCurrentUser();
  if (!user?.id) {
    throw new Error('auth_required');
  }

  const votePayload = {
    poll_id: poll.id,
    voter_user_id: user.id,
    numeric_value: poll.kind === 'numeric' ? numericValue : null,
  };

  const { data: voteRow, error: voteError } = await supabaseClient
    .from('votes')
    .insert(votePayload)
    .select('id')
    .single();

  if (voteError) throw voteError;

  if (poll.kind === 'numeric') {
    return;
  }

  const voteOptionsRows = selectedOptionIds.map((optionId) => ({
    vote_id: voteRow.id,
    option_id: optionId,
  }));

  const { error: voteOptionsError } = await supabaseClient
    .from('vote_options')
    .insert(voteOptionsRows);

  if (voteOptionsError) throw voteOptionsError;
}

export default async function render(container, params) {
  if (removeLanguageChangedListener) {
    removeLanguageChangedListener();
    removeLanguageChangedListener = null;
  }

  container.innerHTML = `
    <div class="min-vh-100 d-flex align-items-center justify-content-center"
         style="background: linear-gradient(135deg, var(--vm-green-light) 0%, var(--vm-white) 50%, var(--vm-orange-light) 100%);">
      ${getLoaderMarkup()}
    </div>
  `;

  const code = params?.code;
  if (!code) {
    container.innerHTML = renderErrorState(t('errors.missingCode'));
    return;
  }

  let poll;
  try {
    poll = await fetchPublicPollByCode(code);
  } catch (error) {
    console.error('Failed to load public poll:', error);
    if (error.message === 'invalid_share_code') {
      container.innerHTML = renderErrorState(t('errors.invalidLink'));
      return;
    }
    if (error.message === 'expired_share_code') {
      container.innerHTML = renderErrorState(t('errors.expiredLink'));
      return;
    }
    container.innerHTML = renderErrorState(t('errors.loadFailed'));
    return;
  }

  let hasVoted = false;

  const renderPollView = () => {
    container.innerHTML = renderPublicPollMarkup(poll);

    const form = container.querySelector('#public-vote-form');
    const thanks = container.querySelector('#public-thanks');
    const submitBtn = form?.querySelector('button[type="submit"]');

    if (hasVoted) {
      form?.classList.add('d-none');
      thanks?.classList.remove('d-none');
    }

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!getCurrentUser()) {
        showToast(t('info.loginToVote'), 'info');
        navigateTo(buildLoginPathWithNext());
        return;
      }

      if (poll.status !== 'open') {
        showToast(t('errors.pollNotOpen'), 'error');
        return;
      }

      let selectedOptionIds = [];
      let numericValue = null;

      if (poll.kind === 'numeric') {
        const numericInput = form.querySelector('#public-numeric-value');
        if (!numericInput?.value?.trim()) {
          showToast(i18n.t('notifications.selectOption'), 'error');
          return;
        }
        numericValue = Number(numericInput.value);
        if (!Number.isFinite(numericValue)) {
          showToast(t('errors.invalidNumeric'), 'error');
          return;
        }
      } else {
        const selected = form.querySelectorAll('input[name="vote"]:checked');
        if (!selected.length) {
          showToast(i18n.t('notifications.selectOption'), 'error');
          return;
        }
        selectedOptionIds = Array.from(selected).map((input) => input.value);
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = t('submitting');
      }

      try {
        await submitPublicVote(poll, { selectedOptionIds, numericValue });
        hasVoted = true;
        renderPollView();
        showToast(t('success.voteSaved'), 'success');
      } catch (error) {
        console.error('Failed to submit public vote:', error);
        if (error.message === 'auth_required') {
          showToast(t('info.loginToVote'), 'info');
          navigateTo(buildLoginPathWithNext());
        } else {
          showToast(mapVoteErrorToMessage(error), 'error');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = t('voteButton');
        }
      }
    });
  };

  renderPollView();

  const handleLanguageChanged = () => {
    if (!document.body.contains(container)) {
      window.removeEventListener('votamin:language-changed', handleLanguageChanged);
      removeLanguageChangedListener = null;
      return;
    }

    renderPollView();
  };

  window.addEventListener('votamin:language-changed', handleLanguageChanged);
  removeLanguageChangedListener = () => {
    window.removeEventListener('votamin:language-changed', handleLanguageChanged);
  };
}
