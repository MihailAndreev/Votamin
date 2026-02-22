/* ============================================================
   Poll Detail Page  (/polls/:id)
   ============================================================ */
import htmlContent from './pollDetail.html?raw';
import './pollDetail.css';
import { getCurrentUser } from '@utils/auth.js';
import { showToast } from '@utils/toast.js';
import { i18n } from '../../../i18n/index.js';
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
    const url  = `${location.origin}/p/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      e.target.textContent = 'Копирано ✓';
      showToast(i18n.t('notifications.linkCopied'), 'info');
      setTimeout(() => e.target.textContent = 'Копирай линк', 2000);
    }).catch(() => {
      showToast(i18n.t('notifications.linkCopyFailed'), 'error');
    });
  });

  /* Close poll */
  container.querySelector('#btn-close-poll')?.addEventListener('click', () => {
    showToast(i18n.t('notifications.pollClosed'), 'info');
  });

  /* Delete poll */
  container.querySelector('#btn-delete-poll')?.addEventListener('click', () => {
    if (confirm('Сигурен ли си, че искаш да изтриеш тази анкета?')) {
      showToast(i18n.t('notifications.pollDeleted'), 'info');
      navigateTo('/polls');
    }
  });
}
