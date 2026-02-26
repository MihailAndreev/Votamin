import htmlContent from './forgotPassword.html?raw';
import './forgotPassword.css';
import { checkEmailExists, forgotPassword } from '@utils/auth.js';
import { showToast } from '@utils/toast.js';
import { i18n } from '../../i18n/index.js';

function getSafeNext() {
  const next = new URLSearchParams(window.location.search).get('next');
  if (!next || !next.startsWith('/')) return '';
  if (next.startsWith('/login') || next.startsWith('/register')) return '';
  return next;
}

function preserveNextOnBackLink(container) {
  const next = getSafeNext();
  if (!next) return;

  const backLink = container.querySelector('#forgot-password-back-link');
  if (backLink) {
    backLink.setAttribute('href', `/login?next=${encodeURIComponent(next)}`);
  }
}

export default function render(container) {
  container.innerHTML = htmlContent;
  i18n.loadTranslations();
  preserveNextOnBackLink(container);

  const form = container.querySelector('#forgot-password-form');
  const emailInput = container.querySelector('#forgot-password-email');
  const errorDiv = container.querySelector('#forgot-password-error');
  const successDiv = container.querySelector('#forgot-password-success');
  const submitBtn = container.querySelector('#forgot-password-btn-submit');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput?.value?.trim() || '';
    if (!email) {
      showError(i18n.t('notifications.fillAllFields'), errorDiv, successDiv);
      return;
    }

    setLoading(true, submitBtn);
    hideAlerts(errorDiv, successDiv);

    try {
      const emailExists = await checkEmailExists(email);
      if (!emailExists) {
        showTranslatedError('notifications.emailNotFound', errorDiv, successDiv);
        showToast(i18n.t('notifications.emailNotFound'), 'error');
        return;
      }

      await forgotPassword(email, `${window.location.origin}/reset-password`);
      showTranslatedSuccess('notifications.resetPasswordEmailSent', successDiv, errorDiv);
      showToast(i18n.t('notifications.resetPasswordEmailSent'), 'success');
    } catch (error) {
      showError(error?.message || i18n.t('notifications.resetPasswordInvalidLink'), errorDiv, successDiv);
    } finally {
      setLoading(false, submitBtn);
    }
  });
}

function hideAlerts(errorDiv, successDiv) {
  if (errorDiv) {
    errorDiv.classList.add('d-none');
    delete errorDiv.dataset.i18n;
  }
  if (successDiv) {
    successDiv.classList.add('d-none');
    delete successDiv.dataset.i18n;
  }
}

function showError(message, errorDiv, successDiv) {
  if (successDiv) {
    successDiv.classList.add('d-none');
    delete successDiv.dataset.i18n;
  }
  if (errorDiv) {
    delete errorDiv.dataset.i18n;
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
  }
  showToast(message, 'error');
}

function showTranslatedError(key, errorDiv, successDiv) {
  if (successDiv) {
    successDiv.classList.add('d-none');
    delete successDiv.dataset.i18n;
  }
  if (errorDiv) {
    errorDiv.dataset.i18n = key;
    errorDiv.textContent = i18n.t(key);
    errorDiv.classList.remove('d-none');
  }
}

function showTranslatedSuccess(key, successDiv, errorDiv) {
  if (errorDiv) {
    errorDiv.classList.add('d-none');
    delete errorDiv.dataset.i18n;
  }
  if (successDiv) {
    successDiv.dataset.i18n = key;
    successDiv.textContent = i18n.t(key);
    successDiv.classList.remove('d-none');
  }
}

function setLoading(loading, button) {
  if (!button) return;
  button.disabled = loading;
  button.textContent = loading
    ? i18n.t('auth.actions.sendingResetLink')
    : i18n.t('auth.actions.sendResetLink');
}
