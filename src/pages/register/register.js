/* ============================================================
   Register Page
   ============================================================ */
import htmlContent from './register.html?raw';
import './register.css';
import { register } from '@utils/auth.js';
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
      showError('Попълни всички полета', errorDiv);
      return;
    }

    if (password.length < 6) {
      showError('Паролата трябва да е минимум 6 символа', errorDiv);
      return;
    }

    if (password !== password2) {
      showError('Паролите не съвпадат', errorDiv);
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

    if (data?.user) {
      // Успешна регистрация
      // User трябва да потвърди email преди да може да влезе
      alert('✅ Регистрация успешна! Проверете вашия email за потвърждение.');
      navigateTo('/login');
    }
  });
}

function showError(message, errorDiv) {
  errorDiv.textContent = message;
  errorDiv.classList.remove('d-none');
}

function setLoading(loading, btn) {
  btn.disabled = loading;
  btn.textContent = loading ? '⏳ Регистрација...' : 'Регистрация';
}
