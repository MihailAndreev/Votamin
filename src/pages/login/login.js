/* ============================================================
   Login Page
   ============================================================ */
import htmlContent from './login.html?raw';
import './login.css';
import { login } from '@utils/auth.js';
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

  const registerLink = container.querySelector('a[href="/register"]');
  if (registerLink) {
    registerLink.setAttribute('href', `/register?next=${encodeURIComponent(next)}`);
  }
}

function getSafeNextQuerySuffix() {
  const next = new URLSearchParams(window.location.search).get('next');
  if (!next || !next.startsWith('/')) return '';
  if (next.startsWith('/login') || next.startsWith('/register')) return '';
  return `?next=${encodeURIComponent(next)}`;
}

export default function render(container) {
  container.innerHTML = htmlContent;
  i18n.loadTranslations();
  preserveNextQueryOnAuthLinks(container);

  const form = container.querySelector('#login-form');
  const errorDiv = container.querySelector('#login-error');
  const submitBtn = container.querySelector('#login-btn');
  const forgotBtn = container.querySelector('#forgot-password-btn');

  setupPasswordToggles(container);

  forgotBtn?.addEventListener('click', () => {
    navigateTo(`/forgot-password${getSafeNextQuerySuffix()}`);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = form.querySelector('#login-email').value.trim();
    const password = form.querySelector('#login-password').value;

    if (!email || !password) {
      showError(i18n.t('notifications.fillAllFields'), errorDiv);
      return;
    }

    // Вход
    setLoading(true, submitBtn);
    errorDiv.classList.add('d-none');

    const { data, error } = await login(email, password);

    if (error) {
      showError(error.message, errorDiv);
      setLoading(false, submitBtn);
      return;
    }

    if (data?.session) {
      // Успешен вход
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
    ? i18n.t('auth.actions.loginLoading')
    : i18n.t('auth.actions.login');
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
