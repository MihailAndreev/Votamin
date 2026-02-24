/* ============================================================
   Home Page
   ============================================================ */
import htmlContent from './home.html?raw';
import './home.css';
import { i18n } from '../../i18n/index.js';
import renderLoginForm from '../login/login.js';
import renderRegisterForm from '../register/register.js';
import { navigateTo } from '../../router.js';
import { fetchHomePublicStats } from '../../utils/homeData.js';

export default function render(container, _params, route) {
  removeAuthModal();

  container.innerHTML = `<div class="vm-home-content">${htmlContent}</div>`;

  loadHomeStats(container);

  i18n.loadTranslations();

  const modalType = route?.authModal;
  if (modalType === 'login' || modalType === 'register') {
    openAuthModal(container, modalType);
  }
}

function formatStatValue(value) {
  return new Intl.NumberFormat(i18n.currentLang === 'bg' ? 'bg-BG' : 'en-US').format(value);
}

async function loadHomeStats(container) {
  const usersEl = container.querySelector('#vm-home-stat-users');
  const pollsEl = container.querySelector('#vm-home-stat-polls');
  const votesEl = container.querySelector('#vm-home-stat-votes');
  const openPollsEl = container.querySelector('#vm-home-stat-open-polls');

  if (!usersEl || !pollsEl || !votesEl || !openPollsEl) return;

  try {
    const stats = await fetchHomePublicStats();
    usersEl.textContent = formatStatValue(stats.usersCount);
    pollsEl.textContent = formatStatValue(stats.pollsCount);
    votesEl.textContent = formatStatValue(stats.votesCount);
    openPollsEl.textContent = formatStatValue(stats.openPollsCount);
  } catch (error) {
    console.error('Failed to load home stats:', error);
  }
}

function openAuthModal(container, modalType) {
  const homeContent = container.querySelector('.vm-home-content');
  if (!homeContent) return;

  homeContent.classList.add('vm-home-content--blur');

  const modalRoot = document.createElement('div');
  modalRoot.id = 'vm-auth-modal-root-global';
  modalRoot.innerHTML = `
    <div class="vm-auth-modal-backdrop" id="vm-auth-modal-backdrop">
      <div class="vm-auth-modal-card" id="vm-auth-modal-card"></div>
    </div>
  `;
  document.body.appendChild(modalRoot);
  document.body.classList.add('vm-auth-modal-open');

  const modalCard = modalRoot.querySelector('#vm-auth-modal-card');
  if (modalType === 'login') {
    renderLoginForm(modalCard);
  } else {
    renderRegisterForm(modalCard);
  }

  i18n.loadTranslations();

  const backdrop = modalRoot.querySelector('#vm-auth-modal-backdrop');
  backdrop?.addEventListener('click', (event) => {
    if (event.target === backdrop) {
      navigateTo('/');
    }
  });
}

function removeAuthModal() {
  const existing = document.getElementById('vm-auth-modal-root-global');
  if (existing) {
    existing.remove();
  }
  document.body.classList.remove('vm-auth-modal-open');
}
