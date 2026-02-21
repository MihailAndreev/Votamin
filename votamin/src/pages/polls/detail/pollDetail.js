/* ============================================================
   Poll Detail Page  (/polls/:id)
   ============================================================ */
import htmlContent from './pollDetail.html?raw';
import './pollDetail.css';
import { getCurrentUser } from '@utils/auth.js';
import { navigateTo } from '../../../router.js';

export default function render(container, params) {
  if (!getCurrentUser()) {
    navigateTo('/login');
    return;
  }

  container.innerHTML = htmlContent;

  /* Copy share link */
  container.querySelector('#copy-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    const code = container.querySelector('#poll-code').textContent;
    const url  = `${location.origin}${location.pathname}#/p/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      e.target.textContent = 'Копирано ✓';
      setTimeout(() => e.target.textContent = 'Копирай линк', 2000);
    });
  });

  /* Close poll */
  container.querySelector('#btn-close-poll')?.addEventListener('click', () => {
    alert('Анкетата е затворена (stub)');
  });

  /* Delete poll */
  container.querySelector('#btn-delete-poll')?.addEventListener('click', () => {
    if (confirm('Сигурен ли си, че искаш да изтриеш тази анкета?')) {
      navigateTo('/polls');
    }
  });
}
