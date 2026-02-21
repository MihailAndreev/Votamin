/* ============================================================
   New Poll Page
   ============================================================ */
import htmlContent from './pollNew.html?raw';
import './pollNew.css';
import { getCurrentUser } from '@utils/auth.js';
import { navigateTo } from '../../../router.js';

export default function render(container) {
  if (!getCurrentUser()) {
    navigateTo('/login');
    return;
  }

  container.innerHTML = htmlContent;

  let optionCount = 2;

  /* Add option button */
  container.querySelector('#btn-add-option').addEventListener('click', () => {
    optionCount++;
    const wrapper = container.querySelector('#poll-options');
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.innerHTML = `
      <span class="input-group-text bg-white border-end-0" style="border-color:var(--vm-border);">${optionCount}.</span>
      <input type="text" class="vm-input border-start-0" placeholder="Опция ${optionCount}" required />
      <button type="button" class="btn btn-outline-danger btn-sm btn-remove-option">✕</button>
    `;
    wrapper.appendChild(div);

    div.querySelector('.btn-remove-option').addEventListener('click', () => {
      div.remove();
    });
  });

  /* Submit */
  container.querySelector('#poll-new-form').addEventListener('submit', (e) => {
    e.preventDefault();
    /* Stub: would POST to API */
    alert('Анкетата е създадена!');
    navigateTo('/polls');
  });
}
