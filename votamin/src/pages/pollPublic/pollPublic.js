/* ============================================================
   Public Poll Page  (/p/:code)
   ============================================================ */
import htmlContent from './pollPublic.html?raw';
import './pollPublic.css';

export default function render(container, params) {
  container.innerHTML = htmlContent;

  const form   = container.querySelector('#public-vote-form');
  const thanks = container.querySelector('#public-thanks');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const selected = form.querySelector('input[name="vote"]:checked');
    if (!selected) {
      alert('Моля, избери опция');
      return;
    }

    /* Stub: would POST vote to API */
    form.classList.add('d-none');
    thanks.classList.remove('d-none');
  });
}
