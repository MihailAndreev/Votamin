import htmlContent from './resetPassword.html?raw';
import './resetPassword.css';
import { resetPassword } from '@utils/auth.js';
import { supabaseClient } from '@utils/supabase.js';
import { showToast } from '@utils/toast.js';
import { i18n } from '../../i18n/index.js';
import { navigateTo } from '../../router.js';

export default function render(container) {
  container.innerHTML = htmlContent;
  i18n.loadTranslations();

  const form = container.querySelector('#reset-password-form');
  const stateDiv = container.querySelector('#reset-password-state');
  const errorDiv = container.querySelector('#reset-password-error');
  const successDiv = container.querySelector('#reset-password-success');
  const newPasswordInput = container.querySelector('#reset-password-new');
  const confirmPasswordInput = container.querySelector('#reset-password-confirm');
  const submitBtn = container.querySelector('#reset-password-btn-submit');

  setupPasswordToggles(container);

  let canResetPassword = false;

  initializeRecoveryState(stateDiv).then((isReady) => {
    canResetPassword = isReady;
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const newPassword = newPasswordInput?.value || '';
    const confirmPassword = confirmPasswordInput?.value || '';

    if (!canResetPassword) {
      showError(i18n.t('notifications.resetPasswordInvalidLink'), errorDiv, successDiv);
      return;
    }

    if (!newPassword || !confirmPassword) {
      showError(i18n.t('notifications.fillAllFields'), errorDiv, successDiv);
      return;
    }

    if (newPassword.length < 6) {
      showError(i18n.t('notifications.passwordMinLength'), errorDiv, successDiv);
      return;
    }

    if (newPassword !== confirmPassword) {
      showError(i18n.t('notifications.passwordsMismatch'), errorDiv, successDiv);
      return;
    }

    setLoading(true, submitBtn);
    hideAlerts(errorDiv, successDiv);

    const { error } = await resetPassword(newPassword);

    if (error) {
      showError(error.message || i18n.t('dashboard.account.passwordError'), errorDiv, successDiv);
      setLoading(false, submitBtn);
      return;
    }

    const successMessage = i18n.t('notifications.passwordResetSuccess');
    showSuccess(successMessage, successDiv, errorDiv);
    showToast(successMessage, 'success');

    setTimeout(() => {
      navigateTo('/login');
    }, 1400);
  });
}

async function initializeRecoveryState(stateDiv) {
  const { data } = await supabaseClient.auth.getSession();

  if (data?.session) {
    stateDiv?.classList.add('d-none');
    return true;
  }

  const hasRecoveryHash = window.location.hash.includes('type=recovery');
  if (hasRecoveryHash) {
    stateDiv?.classList.add('d-none');
    return true;
  }

  if (stateDiv) {
    stateDiv.textContent = i18n.t('notifications.resetPasswordInvalidLink');
    stateDiv.classList.remove('d-none');
  }

  return false;
}

function hideAlerts(errorDiv, successDiv) {
  errorDiv?.classList.add('d-none');
  successDiv?.classList.add('d-none');
}

function showError(message, errorDiv, successDiv) {
  if (successDiv) successDiv.classList.add('d-none');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
  }
  showToast(message, 'error');
}

function showSuccess(message, successDiv, errorDiv) {
  if (errorDiv) errorDiv.classList.add('d-none');
  if (successDiv) {
    successDiv.textContent = message;
    successDiv.classList.remove('d-none');
  }
}

function setLoading(loading, button) {
  if (!button) return;
  button.disabled = loading;
  button.textContent = loading
    ? i18n.t('auth.actions.savingNewPassword')
    : i18n.t('auth.actions.saveNewPassword');
}

function setupPasswordToggles(container) {
  container.querySelectorAll('[data-toggle-password]').forEach((toggleBtn) => {
    toggleBtn.addEventListener('click', () => {
      const targetId = toggleBtn.getAttribute('data-toggle-password');
      const input = container.querySelector(`#${targetId}`);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      toggleBtn.setAttribute(
        'aria-label',
        isPassword ? i18n.t('auth.actions.hidePassword') : i18n.t('auth.actions.showPassword')
      );
    });
  });
}
