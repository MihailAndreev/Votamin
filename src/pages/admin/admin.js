/* ============================================================
  Admin Panel – Shell
  ============================================================ */
import './admin.css';
import { getCurrentUser, isAdmin } from '@utils/auth.js';
import { navigateTo } from '../../router.js';
import { i18n } from '../../i18n/index.js';
import { renderDashboardLayout } from '@layouts/dashboardLayout.js';

/**
 * Admin panel shell.
 * Uses the dashboard sidebar layout, then loads adminUsers
 * or adminPolls sub-modules based on the current route.
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
  const headingKey = isPollsSection ? 'admin.headingPolls' : 'admin.headingUsers';

  pageContainer.innerHTML = `
    <div class="vm-admin-panel">
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h2 class="fw-bold mb-0 text-nowrap" data-i18n="${headingKey}">${i18n.t(headingKey)}</h2>
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
