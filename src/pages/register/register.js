/* ============================================================
   Register Page
   ============================================================ */
import htmlContent from './register.html?raw';
import './register.css';
import { login, register } from '@utils/auth.js';
import { showToast } from '@utils/toast.js';
import { i18n } from '../../i18n/index.js';
import { navigateTo } from '../../router.js';

export default function render(container) {
  container.innerHTML = htmlContent;

  const form = container.querySelector('#register-form');
  const errorDiv = container.querySelector('#register-error');
  const submitBtn = container.querySelector('#register-btn');

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
      navigateTo('/dashboard');
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
      navigateTo('/dashboard');
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
  btn.textContent = loading ? '⏳ Регистрация...' : 'Регистрация';
}
