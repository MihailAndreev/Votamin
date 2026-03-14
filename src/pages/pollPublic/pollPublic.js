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
import { computePollStatus } from '@utils/helpers.js';

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

function getInviteText(inviterLabel) {
  if (typeof inviterLabel === 'string' && inviterLabel.trim()) {
    return t('inviteTextWithName').replace('{inviter}', inviterLabel.trim());
  }
  return t('inviteTextFallback');
}

function formatDateTime24h(dateValue) {
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function renderDeadlineText(endsAt) {
  if (!endsAt) {
    return i18n.t('publicPoll.deadlineBadgeNoEnd');
  }

  const formattedDate = formatDateTime24h(endsAt);
  return i18n.t('publicPoll.deadlineBadgeWithDate').replace('{date}', formattedDate || '');
}

function renderInviteLine(poll) {
  const inviterName = typeof poll.inviter_label === 'string' ? poll.inviter_label.trim() : '';
  const inviteText = getInviteText(poll.inviter_label);
  const escapedInviteText = escapeHtml(inviteText);
  const inviterMarkup = inviterName
    ? `<strong class="preview-public-invite-strong">${escapeHtml(inviterName)}</strong>`
    : '';

  const inviteWithHighlightedName = inviterMarkup
    ? escapedInviteText.replace(escapeHtml(inviterName), inviterMarkup)
    : escapedInviteText;

  const deadlineMarkup = `<strong class="preview-public-invite-strong">${escapeHtml(renderDeadlineText(poll.ends_at))}</strong>`;
  const optionsMarkup = `<strong class="preview-public-invite-strong">${escapeHtml(t(`instructions.${poll.kind}`) || '')}</strong>`;

  return `${inviteWithHighlightedName} ${deadlineMarkup} • ${optionsMarkup}`;
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
      <div class="preview-public-numeric-wrap">
        <input
          type="number"
          class="preview-public-numeric-input"
          id="public-numeric-value"
          placeholder="${escapeHtml(t('numericPlaceholder'))}"
        />
      </div>
    `;
  }

  const inputType = poll.kind === 'multiple_choice' ? 'checkbox' : 'radio';

  return `
    <div class="preview-public-options-list" id="public-options">
      ${poll.options.map((option) => `
        <label class="preview-public-option vm-card">
          <input type="${inputType}" name="vote" value="${option.id}" class="form-check-input mt-0" />
          <span class="preview-public-option-text">${escapeHtml(option.text)}</span>
        </label>
      `).join('')}
    </div>
  `;
}

function renderPublicPollMarkup(poll, hasVoted = false) {
  const isClosed = poll.status === 'closed';
  const description = poll.description || '';
  const normalizedDescription = typeof description === 'string' ? description.trim() : '';
  const hasDescription = normalizedDescription.length > 0;
  const descriptionLabel = i18n.t('createPoll.fields.description').replace(/\s*\([^)]*\)\s*$/u, '').trim();
  const poweredByHref = getCurrentUser() ? '/dashboard' : '/';
  const inviteLine = renderInviteLine(poll);
  const resultsTarget = poll.is_owner ? `/polls/${poll.id}` : `/polls/${poll.id}?from=shared`;

  return `
    <div class="min-vh-100 d-flex align-items-center justify-content-center"
         style="background: linear-gradient(135deg, var(--vm-green-light) 0%, var(--vm-white) 50%, var(--vm-orange-light) 100%);">
      <div style="width:100%; max-width:520px; padding:1rem;">
        <div class="vm-card p-4 p-md-5 preview-public-card">
          <div class="preview-public-shell">
            <div class="preview-public-header text-center d-flex flex-column align-items-center" id="public-poll-header">
              <div class="preview-public-organizer ${hasVoted ? 'd-none' : ''}">
                <span class="preview-public-inviter-text">${inviteLine}</span>
              </div>
              <div class="preview-public-organizer-divider ${hasVoted ? 'd-none' : ''}" role="presentation"></div>

              <div class="w-100 preview-public-poll-header ${hasVoted ? 'd-none' : ''}">
                <h4 class="preview-public-question fw-bold" id="public-poll-title">${escapeHtml(poll.title)}</h4>
                ${hasDescription ? `
                  <details class="preview-public-description-accordion">
                    <summary class="preview-public-description-summary"><span class="preview-public-description-summary-text">${escapeHtml(descriptionLabel)}</span></summary>
                    <p class="preview-public-description" id="public-poll-desc">${escapeHtml(normalizedDescription)}</p>
                  </details>
                  <div class="preview-public-description-divider" role="presentation"></div>
                ` : ''}
              </div>
            </div>

            <div class="${hasVoted ? 'd-none' : ''}">
              ${isClosed ? `<div class="alert alert-secondary">${escapeHtml(t('closedAlert'))}</div>` : ''}

              <form id="public-vote-form">
                ${renderOptions(poll)}
                <button type="submit" class="btn btn-votamin btn-lg w-100 preview-public-vote-btn" ${isClosed ? 'disabled' : ''}>${escapeHtml(t('voteButton'))}</button>
                ${poll.results_visibility === 'author'
                  ? `<p class="preview-public-results-note">${escapeHtml(i18n.t('createPoll.resultsVisibility.authorDesc'))}</p>`
                  : ''}
              </form>
            </div>

            <div id="public-thanks" class="text-center ${hasVoted ? '' : 'd-none'} py-4">
              <h4 class="fw-bold">${escapeHtml(t('thanksTitle'))}</h4>
              <p class="text-muted">${escapeHtml(t('thanksText'))}</p>
              <div class="d-flex flex-column gap-2 mt-2">
                ${poll.can_view_results_after_vote ? `<a href="${resultsTarget}" class="btn btn-votamin" id="public-return-results">${escapeHtml(t('returnToResults'))}</a>` : ''}
                <a href="/dashboard" class="btn btn-votamin-outline" id="public-return-dashboard">${escapeHtml(t('returnToDashboard'))}</a>
              </div>
            </div>
          </div>
        </div>
        <p class="text-center mt-3 small text-muted">
          ${escapeHtml(t('poweredBy'))}
          <a href="${poweredByHref}" class="fw-semibold d-inline-flex align-items-center vm-powered-by-link" aria-label="Votamin">
            <img src="/images/logo/logo.svg" alt="Votamin" class="vm-powered-by-logo" />
          </a>
        </p>
      </div>
    </div>
  `;
}

async function fetchPublicPollByCode(code) {
  await supabaseClient.rpc('auto_close_expired_polls');

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
    .select('id, owner_id, title, description_html, status, kind, results_visibility, ends_at')
    .eq('id', share.poll_id)
    .single();

  if (pollError) throw pollError;

  const { data: options, error: optionsError } = await supabaseClient
    .from('poll_options')
    .select('id, text, position')
    .eq('poll_id', poll.id)
    .order('position', { ascending: true });

  if (optionsError) throw optionsError;

  let inviterLabel = null;
  const { data: inviterRow, error: inviterError } = await supabaseClient
    .rpc('get_public_poll_inviter', { p_share_code: code })
    .maybeSingle();

  if (!inviterError && typeof inviterRow?.inviter_label === 'string') {
    const trimmed = inviterRow.inviter_label.trim();
    inviterLabel = trimmed || null;
  }

  return {
    ...poll,
    status: computePollStatus(poll),
    description: stripHtml(poll.description_html),
    inviter_label: inviterLabel,
    options: options || [],
  };
}

async function refreshPublicPollStatus(pollId) {
  const { data, error } = await supabaseClient
    .from('polls')
    .select('status, ends_at')
    .eq('id', pollId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return computePollStatus(data);
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

  const voteId = crypto.randomUUID();

  const votePayload = {
    id: voteId,
    poll_id: poll.id,
    voter_user_id: user.id,
    numeric_value: poll.kind === 'numeric' ? numericValue : null,
  };

  const { error: voteError } = await supabaseClient
    .from('votes')
    .insert(votePayload);

  if (voteError) throw voteError;

  if (poll.kind === 'numeric') {
    return;
  }

  const voteOptionsRows = selectedOptionIds.map((optionId) => ({
    vote_id: voteId,
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

  async function getResultsAccessAfterVote() {
    const user = getCurrentUser();
    if (!user?.id) return false;

    const { data, error } = await supabaseClient.rpc('can_view_poll_results', { p_poll_id: poll.id });
    if (error) {
      return false;
    }
    return Boolean(data);
  }

  poll.is_owner = Boolean(getCurrentUser()?.id && poll.owner_id === getCurrentUser().id);
  poll.can_view_results_after_vote = false;

  const renderPollView = () => {
    container.innerHTML = renderPublicPollMarkup(poll, hasVoted);

    const form = container.querySelector('#public-vote-form');
    const thanks = container.querySelector('#public-thanks');
    const submitBtn = form?.querySelector('button[type="submit"]');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!getCurrentUser()) {
        showToast(t('info.loginToVote'), 'info');
        navigateTo(buildLoginPathWithNext());
        return;
      }

      await supabaseClient.rpc('auto_close_expired_polls');
      const latestStatus = await refreshPublicPollStatus(poll.id);
      if (latestStatus) {
        poll.status = latestStatus;
      }

      if (poll.status !== 'open') {
        renderPollView();
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
        poll.can_view_results_after_vote = await getResultsAccessAfterVote();
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
