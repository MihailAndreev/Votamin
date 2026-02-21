/* ============================================================
   Register Page
   ============================================================ */
import htmlContent from './register.html?raw';
import './register.css';
import { login } from '@utils/auth.js';
import { navigateTo } from '../../router.js';

export default function render(container) {
  container.innerHTML = htmlContent;

  const form = container.querySelector('#register-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name      = form.querySelector('#reg-name').value.trim();
    const email     = form.querySelector('#reg-email').value.trim();
    const password  = form.querySelector('#reg-password').value;
    const password2 = form.querySelector('#reg-password2').value;

    if (!name || !email || !password) return;
    if (password !== password2) {
      alert('Паролите не съвпадат');
      return;
    }

    /* Stub: auto-login after registration */
    login({ name, email });
    navigateTo('/dashboard');
  });
}
