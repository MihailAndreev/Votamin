/* ============================================================
   Public Poll Page  (/p/:code)
   ============================================================ */
import htmlContent from './pollPublic.html?raw';
import './pollPublic.css';
import { showToast } from '@utils/toast.js';
import { i18n } from '../../i18n/index.js';

export default function render(container, params) {
  container.innerHTML = htmlContent;

  const form   = container.querySelector('#public-vote-form');
  const thanks = container.querySelector('#public-thanks');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const selected = form.querySelector('input[name="vote"]:checked');
    if (!selected) {
      showToast(i18n.t('notifications.selectOption'), 'error');
      return;
    }

    /* Stub: would POST vote to API */
    form.classList.add('d-none');
    thanks.classList.remove('d-none');
  });
}
