/* ============================================================
   Votamin – Dashboard Layout  (Sidebar + Content area)
   ============================================================ */
import { isAdmin, logout } from '@utils/auth.js';
import { navigateTo, currentPath } from '../router.js';
import { i18n } from '../i18n/index.js';
import { showToast } from '@utils/toast.js';

const SIDEBAR_COLLAPSED_KEY = 'votamin_sidebar_collapsed';

const ICONS = {
  menu: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,
  myPolls: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="3.5" width="16" height="17" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M8 8h8M8 12h8M8 16h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,
  shared: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M15 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="currentColor"/>
      <path d="M8.7 9.6 12.3 7.5M8.7 13.4l3.6 2.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,
  account: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M4 20c1.7-3.3 4.4-5 8-5s6.3 1.7 8 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,
  adminUsers: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="9" cy="9" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="17" cy="9" r="2.25" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M3.5 20c1.2-2.6 3.1-4 5.5-4s4.3 1.4 5.5 4M14.5 20c.7-1.6 1.9-2.5 3.5-2.5 1.2 0 2.3.5 3 1.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,
  adminPolls: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 20h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <rect x="5" y="11" width="3" height="7" rx="1" fill="currentColor"/>
      <rect x="10.5" y="7" width="3" height="11" rx="1" fill="currentColor"/>
      <rect x="16" y="4" width="3" height="14" rx="1" fill="currentColor"/>
    </svg>
  `,
  logout: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M14 16l4-4-4-4M18 12H9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `
};

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
        <span class="vm-sidebar-icon">${ICONS.menu}</span>
      </button>

      <!-- Backdrop -->
      <div class="vm-sidebar-backdrop d-lg-none" id="sidebar-backdrop"></div>

      <!-- Sidebar -->
      <aside class="vm-sidebar" id="dashboard-sidebar">
        <nav class="vm-sidebar-nav">
          <div class="vm-sidebar-top">
            ${sidebarItem('/dashboard/polls',   ICONS.myPolls, 'dashboard.sidebar.myPolls',      'My Polls')}
            ${sidebarItem('/dashboard/shared',  ICONS.shared, 'dashboard.sidebar.sharedWithMe', 'Shared With Me')}
            ${sidebarItem('/dashboard/account', ICONS.account, 'dashboard.sidebar.account',      'Account')}
            <div class="vm-sidebar-admin-links d-none" id="sidebar-admin-links">
              <hr class="my-2 opacity-25">
              ${sidebarItem('/admin',       ICONS.adminUsers, 'dashboard.sidebar.adminUsers', 'Admin — Users')}
              ${sidebarItem('/admin/polls', ICONS.adminPolls, 'dashboard.sidebar.adminPolls', 'Admin — Polls')}
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
              <span class="vm-sidebar-icon">${ICONS.logout}</span>
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
