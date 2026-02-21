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
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email    = form.querySelector('#login-email').value.trim();
    const password = form.querySelector('#login-password').value;

    if (!email || !password) return;

    /* Stub: accept any credentials */
    login({ email, name: email.split('@')[0] });
    navigateTo('/dashboard');
  });
}
