/* ============================================================
   Register Page
   ============================================================ */
import htmlContent from './register.html?raw';
import './register.css';
import { login, register } from '@utils/auth.js';
import { showToast } from '@utils/toast.js';
import { i18n } from '../../i18n/index.js';
import { navigateTo } from '../../router.js';

function getPostAuthRedirect() {
  const next = new URLSearchParams(window.location.search).get('next');
  if (!next || !next.startsWith('/')) return '/dashboard';
  if (next.startsWith('/login') || next.startsWith('/register')) return '/dashboard';
  return next;
}

function preserveNextQueryOnAuthLinks(container) {
  const next = new URLSearchParams(window.location.search).get('next');
  if (!next) return;

  const loginLink = container.querySelector('a[href="/login"]');
  if (loginLink) {
    loginLink.setAttribute('href', `/login?next=${encodeURIComponent(next)}`);
  }
}

export default function render(container) {
  container.innerHTML = htmlContent;
  i18n.loadTranslations();
  preserveNextQueryOnAuthLinks(container);

  const form = container.querySelector('#register-form');
  const errorDiv = container.querySelector('#register-error');
  const submitBtn = container.querySelector('#register-btn');

  setupPasswordToggles(container);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email     = form.querySelector('#reg-email').value.trim();
    const password  = form.querySelector('#reg-password').value;
    const password2 = form.querySelector('#reg-password2').value;

    // Валидация
    if (!email || !password) {
      showError(i18n.t('notifications.fillAllFields'), errorDiv);
      return;
    }

    if (password.length < 6) {
      showError(i18n.t('notifications.passwordMinLength'), errorDiv);
      return;
    }

    if (password !== password2) {
      showError(i18n.t('notifications.passwordsMismatch'), errorDiv);
      return;
    }

    // Регистрация
    setLoading(true, submitBtn);
    errorDiv.classList.add('d-none');

    const { data, error } = await register(email, password);

    if (error) {
      showError(error.message, errorDiv);
      setLoading(false, submitBtn);
      return;
    }

    if (data?.session) {
      showToast(i18n.t('notifications.userCreated'), 'info');
      navigateTo(getPostAuthRedirect());
      return;
    }

    if (data?.user) {
      const { data: loginData, error: loginError } = await login(email, password);

      if (loginError || !loginData?.session) {
        showError(i18n.t('notifications.registerAutoLoginFailed'), errorDiv);
        setLoading(false, submitBtn);
        return;
      }

      showToast(i18n.t('notifications.userCreated'), 'info');
      navigateTo(getPostAuthRedirect());
    }
  });
}

function showError(message, errorDiv) {
  showToast(message, 'error');
  errorDiv.textContent = message;
  errorDiv.classList.remove('d-none');
}

function setLoading(loading, btn) {
  btn.disabled = loading;
  btn.textContent = loading
    ? i18n.t('auth.actions.registerLoading')
    : i18n.t('auth.actions.register');
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
