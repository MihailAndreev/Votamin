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

function renderErrorState(message) {
  return `
    <div class="min-vh-100 d-flex align-items-center justify-content-center"
         style="background: linear-gradient(135deg, var(--vm-green-light) 0%, var(--vm-white) 50%, var(--vm-orange-light) 100%);">
      <div style="width:100%; max-width:520px; padding:1rem;">
        <div class="vm-card p-4 p-md-5 text-center">
          <h4 class="fw-bold mb-2">Анкетата не е достъпна</h4>
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
        <label class="form-label fw-semibold" for="public-numeric-value">Въведи стойност</label>
        <input
          type="number"
          class="form-control"
          id="public-numeric-value"
          placeholder="Например: 10"
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
  const description = poll.description || 'Избери своя отговор.';
  const poweredByHref = getCurrentUser() ? '/dashboard' : '/';

  return `
    <div class="min-vh-100 d-flex align-items-center justify-content-center"
         style="background: linear-gradient(135deg, var(--vm-green-light) 0%, var(--vm-white) 50%, var(--vm-orange-light) 100%);">
      <div style="width:100%; max-width:520px; padding:1rem;">
        <div class="vm-card p-4 p-md-5">
          <div class="text-center mb-4">
            <img src="/src/assets/images/logo/logo.svg" alt="Votamin" class="vm-public-brand-logo" />
            <h4 class="mt-2 fw-bold" id="public-poll-title">${escapeHtml(poll.title)}</h4>
            <p class="text-muted small" id="public-poll-desc">${escapeHtml(description)}</p>
          </div>

          ${isClosed ? '<div class="alert alert-secondary">Тази анкета е затворена.</div>' : ''}

          <form id="public-vote-form">
            ${renderOptions(poll)}
            <button type="submit" class="btn btn-votamin w-100 btn-lg" ${isClosed ? 'disabled' : ''}>Гласувай 🗳️</button>
          </form>

          <div id="public-thanks" class="text-center d-none py-4">
            <div class="fs-1 mb-2">🎉</div>
            <h4 class="fw-bold">Благодарим ти!</h4>
            <p class="text-muted">Гласът ти е получен.</p>
          </div>
        </div>
        <p class="text-center mt-3 small text-muted">
          Задвижвано от
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
  if (!error) return 'Неуспешно гласуване. Моля, опитай отново.';

  if (error.code === '23505') {
    return 'Вече си гласувал в тази анкета.';
  }

  if (error.code === '42501') {
    return 'Нямаш права да гласуваш. Влез в профила си и опитай пак.';
  }

  if (typeof error.message === 'string' && error.message.includes('poll_is_open_for_voting')) {
    return 'Анкетата вече не приема гласове.';
  }

  if (typeof error.message === 'string' && error.message.includes('max')) {
    return 'Избран е невалиден брой опции за тази анкета.';
  }

  return 'Неуспешно гласуване. Моля, опитай отново.';
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
  container.innerHTML = `
    <div class="min-vh-100 d-flex align-items-center justify-content-center"
         style="background: linear-gradient(135deg, var(--vm-green-light) 0%, var(--vm-white) 50%, var(--vm-orange-light) 100%);">
      ${getLoaderMarkup()}
    </div>
  `;

  const code = params?.code;
  if (!code) {
    container.innerHTML = renderErrorState('Липсва код за споделяне.');
    return;
  }

  let poll;
  try {
    poll = await fetchPublicPollByCode(code);
  } catch (error) {
    console.error('Failed to load public poll:', error);
    if (error.message === 'invalid_share_code') {
      container.innerHTML = renderErrorState('Невалиден линк за анкета.');
      return;
    }
    if (error.message === 'expired_share_code') {
      container.innerHTML = renderErrorState('Този линк за анкета е изтекъл.');
      return;
    }
    container.innerHTML = renderErrorState('Възникна грешка при зареждане.');
    return;
  }

  container.innerHTML = renderPublicPollMarkup(poll);

  const form = container.querySelector('#public-vote-form');
  const thanks = container.querySelector('#public-thanks');
  const submitBtn = form?.querySelector('button[type="submit"]');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!getCurrentUser()) {
      showToast('Моля, влез в профила си, за да гласуваш.', 'info');
      navigateTo(buildLoginPathWithNext());
      return;
    }

    if (poll.status !== 'open') {
      showToast('Анкетата е затворена и не приема гласове.', 'error');
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
        showToast('Въведи валидна числова стойност.', 'error');
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
      submitBtn.textContent = 'Изпращане...';
    }

    try {
      await submitPublicVote(poll, { selectedOptionIds, numericValue });
      form.classList.add('d-none');
      thanks?.classList.remove('d-none');
      showToast('Гласът ти е записан успешно.', 'success');
    } catch (error) {
      console.error('Failed to submit public vote:', error);
      if (error.message === 'auth_required') {
        showToast('Моля, влез в профила си, за да гласуваш.', 'info');
        navigateTo(buildLoginPathWithNext());
      } else {
        showToast(mapVoteErrorToMessage(error), 'error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Гласувай 🗳️';
      }
    }
  });
}
