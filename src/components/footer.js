/* ============================================================
   Votamin – Footer Component
   ============================================================ */
import { i18n } from '../i18n/index.js';
import { isLoggedIn, logout } from '@utils/auth.js';
import { showToast } from '@utils/toast.js';
import { navigateTo } from '../router.js';

export function renderFooter(container) {
  const year = new Date().getFullYear();
  const loggedIn = isLoggedIn();
  const homeHref = loggedIn ? '/dashboard' : '/';
  const brandHref = loggedIn ? '/dashboard' : '/';

  container.innerHTML = `
    <div class="vm-footer py-2 mt-auto border-top" style="background:var(--vm-gray-100);">
      <div class="container">
        <div class="row align-items-center gy-2">
          <div class="col-md-4 text-center text-md-start">
            <a href="${brandHref}" class="d-inline-flex align-items-center justify-content-center justify-content-md-start text-decoration-none">
              <img src="/images/logo/logo.svg" alt="Votamin" height="24" class="vm-brand-logo">
            </a>
          </div>
          <div class="col-md-4 text-center">
            <a href="${homeHref}" class="text-muted small me-3" data-i18n="footer.home">Начало</a>
            ${loggedIn ? `
              <a href="/dashboard" class="text-muted small me-3" data-i18n="footer.dashboard">Табло</a>
              <a href="#" class="text-muted small" id="footer-logout" data-i18n="footer.logout">Изход</a>
            ` : `
              <a href="/login" class="text-muted small me-3" data-i18n="footer.login">Вход</a>
              <a href="/register" class="text-muted small" data-i18n="footer.register">Регистрация</a>
            `}
          </div>
          <div class="col-md-4 text-center text-md-end">
            <small class="text-muted" style="font-size:0.8rem;">&copy; ${year} Votamin. <span data-i18n="footer.rights">Всички права запазени.</span></small>
          </div>
        </div>
      </div>
    </div>
  `;

  const footerLogout = container.querySelector('#footer-logout');
  if (footerLogout) {
    footerLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      const { error } = await logout();
      if (!error) {
        navigateTo('/');
        return;
      }
      showToast(error?.message || i18n.t('notifications.logoutFailed'), 'error');
    });
  }

  i18n.loadTranslations();
}
