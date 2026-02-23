/* ============================================================
   Votamin – Dashboard Layout  (Sidebar + Content area)
   ============================================================ */
import { isAdmin, logout } from '@utils/auth.js';
import { navigateTo, currentPath } from '../router.js';
import { i18n } from '../i18n/index.js';
import { showToast } from '@utils/toast.js';

const SIDEBAR_COLLAPSED_KEY = 'votamin_sidebar_collapsed';

function isCollapsed() {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
}

function setCollapsed(val) {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, val ? '1' : '0');
}

function sidebarItem(href, icon, labelKey, fallback) {
  const active = currentPath() === href;
  return `
    <a href="${href}"
       class="vm-sidebar-link${active ? ' active' : ''}"
       data-i18n-title="${labelKey}">
      <span class="vm-sidebar-icon">${icon}</span>
      <span class="vm-sidebar-label" data-i18n="${labelKey}">${fallback}</span>
    </a>`;
}

export function renderDashboardLayout(contentContainer) {
  const collapsed = isCollapsed();

  contentContainer.innerHTML = `
    <div class="vm-dash-wrapper${collapsed ? ' vm-sidebar-collapsed' : ''}">
      <!-- Mobile toggle -->
      <button class="vm-sidebar-mobile-toggle d-lg-none btn btn-sm btn-votamin-outline"
              id="sidebar-mobile-toggle" aria-label="Toggle menu">
        <span class="vm-sidebar-icon">☰</span>
      </button>

      <!-- Backdrop -->
      <div class="vm-sidebar-backdrop d-lg-none" id="sidebar-backdrop"></div>

      <!-- Sidebar -->
      <aside class="vm-sidebar" id="dashboard-sidebar">
        <nav class="vm-sidebar-nav">
          <div class="vm-sidebar-top">
            ${sidebarItem('/dashboard/polls',   '📋', 'dashboard.sidebar.myPolls',      'My Polls')}
            ${sidebarItem('/dashboard/shared',  '🤝', 'dashboard.sidebar.sharedWithMe', 'Shared With Me')}
            ${sidebarItem('/dashboard/account', '👤', 'dashboard.sidebar.account',      'Account')}
            <div class="vm-sidebar-admin-links d-none" id="sidebar-admin-links">
              <hr class="my-2 opacity-25">
              ${sidebarItem('/admin',       '🛡️', 'dashboard.sidebar.adminUsers', 'Admin — Users')}
              ${sidebarItem('/admin/polls', '📊', 'dashboard.sidebar.adminPolls', 'Admin — Polls')}
            </div>
          </div>
          <div class="vm-sidebar-bottom">
            <button class="vm-sidebar-link vm-sidebar-collapse-btn d-none d-lg-flex"
                    id="sidebar-collapse-btn"
                    data-i18n-title="dashboard.sidebar.collapse"
                    title="${i18n.t('dashboard.sidebar.collapse')}">
              <span class="vm-sidebar-icon" id="collapse-icon">${collapsed ? '»' : '«'}</span>
              <span class="vm-sidebar-label" data-i18n="dashboard.sidebar.collapse">Collapse</span>
            </button>
            <button class="vm-sidebar-link vm-sidebar-logout-btn" id="sidebar-logout-btn">
              <span class="vm-sidebar-icon">🚪</span>
              <span class="vm-sidebar-label" data-i18n="dashboard.sidebar.logout">Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      <!-- Main content area -->
      <section class="vm-dash-content" id="dashboard-page-content">
        <div class="vm-loader-wrapper"><div class="vm-loader"></div></div>
      </section>
    </div>`;

  /* ── Admin links ──────────────────────────────── */
  isAdmin().then((admin) => {
    if (admin) {
      contentContainer.querySelector('#sidebar-admin-links')?.classList.remove('d-none');
    }
  });

  /* ── Collapse toggle (desktop) ────────────────── */
  const wrapper = contentContainer.querySelector('.vm-dash-wrapper');
  const collapseBtn = contentContainer.querySelector('#sidebar-collapse-btn');
  const collapseIcon = contentContainer.querySelector('#collapse-icon');

  collapseBtn?.addEventListener('click', () => {
    const nowCollapsed = wrapper.classList.toggle('vm-sidebar-collapsed');
    setCollapsed(nowCollapsed);
    collapseIcon.textContent = nowCollapsed ? '»' : '«';
  });

  /* ── Mobile offcanvas ─────────────────────────── */
  const sidebar = contentContainer.querySelector('#dashboard-sidebar');
  const mobileToggle = contentContainer.querySelector('#sidebar-mobile-toggle');
  const backdrop = contentContainer.querySelector('#sidebar-backdrop');

  function openMobileSidebar() {
    sidebar.classList.add('vm-sidebar-open');
    backdrop.classList.add('vm-backdrop-visible');
  }
  function closeMobileSidebar() {
    sidebar.classList.remove('vm-sidebar-open');
    backdrop.classList.remove('vm-backdrop-visible');
  }

  mobileToggle?.addEventListener('click', openMobileSidebar);
  backdrop?.addEventListener('click', closeMobileSidebar);
  sidebar?.querySelectorAll('.vm-sidebar-link').forEach((link) => {
    link.addEventListener('click', closeMobileSidebar);
  });

  /* ── Logout ───────────────────────────────────── */
  contentContainer.querySelector('#sidebar-logout-btn')?.addEventListener('click', async () => {
    const { error } = await logout();
    if (!error) {
      navigateTo('/');
      return;
    }
    showToast(error?.message || i18n.t('notifications.logoutFailed'), 'error');
  });

  /* ── i18n ─────────────────────────────────────── */
  i18n.loadTranslations();

  return contentContainer.querySelector('#dashboard-page-content');
}
