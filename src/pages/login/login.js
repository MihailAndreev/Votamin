/* ============================================================
   Login Page
   ============================================================ */
import htmlContent from './login.html?raw';
import './login.css';
import { login } from '@utils/auth.js';
import { navigateTo } from '../../router.js';

export default function render(container) {
  container.innerHTML = htmlContent;

  const form = container.querySelector('#login-form');
  const errorDiv = container.querySelector('#login-error');
  const submitBtn = container.querySelector('#login-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = form.querySelector('#login-email').value.trim();
    const password = form.querySelector('#login-password').value;

    if (!email || !password) {
      showError('Попълни всички полета', errorDiv);
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
      navigateTo('/dashboard');
    }
  });
}

function showError(message, errorDiv) {
  errorDiv.textContent = message;
  errorDiv.classList.remove('d-none');
}

function setLoading(loading, btn) {
  btn.disabled = loading;
  btn.textContent = loading ? '⏳ Вход...' : 'Вход';
}
