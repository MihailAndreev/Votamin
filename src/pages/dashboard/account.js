/* ============================================================
   Dashboard – Account sub-page (MVP)
   ============================================================ */
import { getCurrentUser, logout } from '@utils/auth.js';
import { supabaseClient } from '@utils/supabase.js';
import { i18n } from '../../i18n/index.js';
import { showToast } from '@utils/toast.js';
import { navigateTo } from '../../router.js';

export default async function render(container) {
  const user = getCurrentUser();
  const email = user?.email || '';

  function renderContent() {
    return `
    <div class="vm-dash-header">
      <h3>${i18n.t('dashboard.account.title')}</h3>
    </div>
    <div class="vm-account-section">
      <div class="vm-account-field">
        <label>${i18n.t('dashboard.account.emailLabel')}</label>
        <div class="vm-account-value">${email}</div>
      </div>

      <hr>

      <h5 class="fw-bold mb-3">${i18n.t('dashboard.account.changePassword')}</h5>
      <form id="change-password-form" autocomplete="off">
        <div class="mb-3">
          <label for="new-password">${i18n.t('dashboard.account.newPassword')}</label>
          <input type="password" id="new-password" class="vm-input" minlength="6"
                 placeholder="${i18n.t('auth.placeholders.passwordMin')}" required />
        </div>
        <div class="mb-3">
          <label for="confirm-password">${i18n.t('dashboard.account.confirmPassword')}</label>
          <input type="password" id="confirm-password" class="vm-input" minlength="6"
                 placeholder="${i18n.t('auth.placeholders.password')}" required />
        </div>
        <button type="submit" class="btn btn-votamin">${i18n.t('dashboard.account.savePassword')}</button>
      </form>

      <hr class="mt-4">
      <button class="btn btn-votamin-outline mt-2" id="account-logout-btn">${i18n.t('dashboard.sidebar.logout')}</button>
    </div>`;
  }

  container.innerHTML = renderContent();

  function attachEventListeners() {
    /* Change password */
    container.querySelector('#change-password-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPw = container.querySelector('#new-password').value;
      const confirmPw = container.querySelector('#confirm-password').value;

      if (newPw.length < 6) {
        showToast(i18n.t('notifications.passwordMinLength'), 'error');
        return;
      }
      if (newPw !== confirmPw) {
        showToast(i18n.t('notifications.passwordsMismatch'), 'error');
        return;
      }

      const { error } = await supabaseClient.auth.updateUser({ password: newPw });
      if (error) {
        showToast(i18n.t('dashboard.account.passwordError'), 'error');
      } else {
        showToast(i18n.t('dashboard.account.passwordChanged'), 'success');
        container.querySelector('#new-password').value = '';
        container.querySelector('#confirm-password').value = '';
      }
    });

    /* Logout */
    container.querySelector('#account-logout-btn')?.addEventListener('click', async () => {
      const { error } = await logout();
      if (!error) {
        navigateTo('/');
      } else {
        showToast(error?.message || i18n.t('notifications.logoutFailed'), 'error');
      }
    });
  }

  attachEventListeners();

  /* Listen for language changes */
  window.addEventListener('votamin:language-changed', () => {
    container.innerHTML = renderContent();
    attachEventListeners();
  });
}
