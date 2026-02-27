/* ============================================================
   Admin Panel – Shell (tabs: Users / Polls)
   ============================================================ */
import './admin.css';
import { getCurrentUser, isAdmin } from '@utils/auth.js';
import { navigateTo } from '../../router.js';
import { i18n } from '../../i18n/index.js';
import { renderDashboardLayout } from '@layouts/dashboardLayout.js';

/**
 * Admin panel shell.
 * Uses the dashboard sidebar layout, then renders a tab container
 * that loads adminUsers or adminPolls sub-modules.
 */
export default async function render(container, params, route) {
  if (!getCurrentUser()) {
    navigateTo('/login');
    return;
  }

  const admin = await isAdmin();
  if (!admin) {
    navigateTo('/dashboard');
    return;
  }

  /* Render sidebar */
  const pageContainer = renderDashboardLayout(container);

  /* Determine active section from URL */
  const activePath = window.location.pathname;
  const isPollsSection = activePath === '/admin/polls';

  pageContainer.innerHTML = `
    <div class="vm-admin-panel">
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h2 class="fw-bold mb-0" data-i18n="admin.title">${i18n.t('admin.title')}</h2>
          <p class="text-muted small mb-0" data-i18n="admin.subtitle">${i18n.t('admin.subtitle')}</p>
        </div>
      </div>

      <!-- Tab content -->
      <div id="admin-tab-content">
        <div class="vm-loader-wrapper py-5"><div class="vm-loader"></div></div>
      </div>
    </div>
  `;

  i18n.loadTranslations();

  /* Load the right sub-module */
  const tabContent = pageContainer.querySelector('#admin-tab-content');

  if (isPollsSection) {
    const mod = await import('./adminPolls.js');
    await mod.default(tabContent);
  } else {
    const mod = await import('./adminUsers.js');
    await mod.default(tabContent);
  }
}
