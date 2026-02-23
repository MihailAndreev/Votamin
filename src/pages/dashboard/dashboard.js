/* ============================================================
   Dashboard Page – Shell (sidebar layout + sub-page routing)
   ============================================================ */
import './dashboard.css';
import { getCurrentUser } from '@utils/auth.js';
import { navigateTo } from '../../router.js';
import { renderDashboardLayout } from '@layouts/dashboardLayout.js';

/**
 * Dashboard shell: renders the sidebar layout, then delegates
 * to the sub-page module supplied via `route._dashSubPage`.
 * If no sub-page is set, redirects to /dashboard/polls.
 */
export default async function render(container, params, route) {
  if (!getCurrentUser()) {
    navigateTo('/login');
    return;
  }

  /* If user hits /dashboard exactly, redirect to /dashboard/polls */
  if (!route._dashSubPage) {
    navigateTo('/dashboard/polls');
    return;
  }

  /* Render sidebar + shell, get the inner content area */
  const pageContainer = renderDashboardLayout(container);

  /* Load the sub-page module and render into content area */
  const subMod = await route._dashSubPage();
  if (subMod.default) {
    await subMod.default(pageContainer, params, route);
  }
}

