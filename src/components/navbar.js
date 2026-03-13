/* ============================================================
   Votamin – Navbar Component
   ============================================================ */
import { getCurrentUser, isAdmin, isLoggedIn, logout } from '@utils/auth.js';
import { showToast } from '@utils/toast.js';
import { navigateTo } from '../router.js';
import { i18n } from '../i18n/index.js';
import { fetchProfile, getAvatarInitials, resolveDisplayName } from '@utils/profile.js';

let activeProfileUpdatedHandler = null;

function getCurrentLanguageFlag() {
  const currentLang = i18n.getCurrentLang();
  const flagSrc = currentLang === 'bg' 
    ? '/images/flags/bg.svg' 
    : '/images/flags/gb.svg';
  return `<img src="${flagSrc}" alt="${currentLang}" width="20" height="15" style="border-radius: 2px;">`;
}

function getDisplayName(user) {
  const fullName = user?.user_metadata?.full_name?.trim();
  if (fullName) return fullName;
  return user?.email || '';
}

function renderAvatarInner(displayName, avatarUrl) {
  if (avatarUrl) {
    return `<img src="${avatarUrl}" alt="${displayName}" class="vm-navbar-avatar-image">`;
  }
  return `<span class="vm-navbar-avatar-initials">${getAvatarInitials(displayName)}</span>`;
}

export function renderNavbar(container) {
  const loggedIn = isLoggedIn();
  const currentUser = getCurrentUser();
  const displayName = getDisplayName(currentUser);
  const homeHref = loggedIn ? '/dashboard' : '/';
  const brandHref = loggedIn ? '/dashboard' : '/';
  const navContainerClass = loggedIn ? 'container-fluid px-3 px-lg-4' : 'container';

  container.innerHTML = `
    <nav class="navbar navbar-expand-lg vm-navbar sticky-top">
      <div class="${navContainerClass} vm-navbar-main-row">
        <a class="navbar-brand d-flex align-items-center" href="${brandHref}">
          <img src="/images/logo/logo.svg" alt="Votamin" height="36" class="vm-brand-logo">
        </a>

        <div class="vm-navbar-controls">
          ${loggedIn ? `
            <div class="dropdown vm-navbar-avatar-dropdown">
              <button
                type="button"
                id="navbar-avatar-btn"
                class="btn vm-navbar-avatar-btn dropdown-toggle"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                data-i18n-aria-label="navbar.accountMenu"
                aria-label="${i18n.t('navbar.accountMenu')}"
              >${renderAvatarInner(displayName, null)}</button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li>
                  <a class="dropdown-item" href="/dashboard/account" data-i18n="navbar.account">${i18n.t('navbar.account')}</a>
                </li>
              </ul>
            </div>
          ` : ''}

          <!-- Toggler -->
          <button class="navbar-toggler border-0" type="button"
              id="vm-nav-toggle"
                  aria-controls="vmNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
        </div>

        <!-- Links -->
        <div class="collapse navbar-collapse" id="vmNav">
          <ul class="navbar-nav ms-auto me-lg-2 align-items-lg-center gap-lg-1">
            <li class="nav-item">
              <a class="nav-link" href="${homeHref}" data-mobile-close-nav="1" data-i18n="navbar.home">Начало</a>
            </li>
            ${loggedIn ? `
              <li class="nav-item">
                <a class="nav-link" href="/dashboard" data-mobile-close-nav="1" data-i18n="navbar.dashboard">Табло</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="/polls" data-mobile-close-nav="1" data-i18n="navbar.polls">Анкети</a>
              </li>
              <li class="nav-item d-none" id="admin-nav-item">
                <a class="nav-link" href="/admin" data-mobile-close-nav="1" data-i18n="navbar.admin">Админ</a>
              </li>
              <li class="nav-item ms-lg-2">
                <button class="btn btn-votamin-outline btn-sm" id="btn-logout" data-i18n="navbar.logout">Изход</button>
              </li>
            ` : `
              <li class="nav-item ms-lg-2">
                <a class="btn btn-votamin-outline btn-sm" href="/login" data-i18n="navbar.login">Вход</a>
              </li>
              <li class="nav-item">
                <a class="btn btn-votamin btn-sm" href="/register" data-i18n="navbar.register">Регистрация</a>
              </li>
            `}
            <!-- Language Switcher -->
            <li class="nav-item dropdown ms-lg-2 me-lg-1" style="position: relative;">
              <button class="nav-link px-2 d-flex align-items-center dropdown-toggle border-0 bg-transparent" id="langDropdownToggle" aria-expanded="false" type="button" aria-label="Language options">
                <span id="currentLangFlag">${getCurrentLanguageFlag()}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end" id="langDropdownMenu" style="min-width: unset; position: absolute; z-index: 1050; padding: 0.5rem 0;">
                <li><button class="dropdown-item d-flex justify-content-center align-items-center lang-switch-btn" type="button" data-lang="en" style="padding: 0.25rem 1rem;">
                  <img src="/images/flags/gb.svg" width="24" class="shadow-sm rounded-1" alt="en">
                </button></li>
                <li><button class="dropdown-item d-flex justify-content-center align-items-center lang-switch-btn" type="button" data-lang="bg" style="padding: 0.25rem 1rem;">
                  <img src="/images/flags/bg.svg" width="24" class="shadow-sm rounded-1" alt="bg">
                </button></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `;

  /* Logout handler */
  const btnLogout = container.querySelector('#btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      const { error } = await logout();
      if (!error) {
        navigateTo('/');
        return;
      }
      showToast(error?.message || i18n.t('notifications.logoutFailed'), 'error');
    });
  }

  if (loggedIn) {
    const avatarBtnEl = container.querySelector('#navbar-avatar-btn');

    const applyIdentity = (name, avatarUrl = null) => {
      const resolvedName = resolveDisplayName(name, currentUser?.email || '');
      const resolvedAvatar = avatarUrl || null;

      if (avatarBtnEl) {
        avatarBtnEl.innerHTML = renderAvatarInner(resolvedName, resolvedAvatar);
        avatarBtnEl.title = resolvedName;
      }
    };

    applyIdentity(displayName, null);

    if (currentUser?.id) {
      fetchProfile(currentUser.id)
        .then(({ data, error }) => {
          if (!error) {
            applyIdentity(data?.full_name, data?.avatar_url);
          }
        });
    }

    if (activeProfileUpdatedHandler) {
      window.removeEventListener('votamin:profile-updated', activeProfileUpdatedHandler);
    }

    activeProfileUpdatedHandler = (event) => {
      const detail = event?.detail || {};
      applyIdentity(detail.full_name, detail.avatar_url);
    };
    window.addEventListener('votamin:profile-updated', activeProfileUpdatedHandler);

    const adminNavItem = container.querySelector('#admin-nav-item');
    isAdmin().then((admin) => {
      if (admin && adminNavItem) {
        adminNavItem.classList.remove('d-none');
      }
    });
  }

  function applyLanguage(lang) {
    if (!lang) return;
    i18n.setLang(lang);

    const flagSpan = container.querySelector('#currentLangFlag');
    if (flagSpan) {
      const flagSrc = lang === 'bg'
        ? '/images/flags/bg.svg'
        : '/images/flags/gb.svg';
      flagSpan.innerHTML = `<img src="${flagSrc}" alt="${lang}" width="20" height="15" style="border-radius: 2px;">`;
    }
  }

  /* Language switcher handler (Custom) */
  const langDropdownToggle = container.querySelector('#langDropdownToggle');
  const langDropdownMenu = container.querySelector('#langDropdownMenu');

  langDropdownToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Stop Bootstrap from interfering
    langDropdownMenu?.classList.toggle('show');
  });

  const closeDropdownOutside = (e) => {
    if (!langDropdownToggle?.contains(e.target) && !langDropdownMenu?.contains(e.target)) {
      langDropdownMenu?.classList.remove('show');
    }
  };
  document.addEventListener('click', closeDropdownOutside);

  container.querySelectorAll('.lang-switch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Restrict bubbling to the mobile nav
      const lang = e.currentTarget.getAttribute('data-lang');
      applyLanguage(lang);
      langDropdownMenu?.classList.remove('show');
    });
  });

  /* Collapse on mobile click */
  const navToggleBtn = container.querySelector('#vm-nav-toggle');
  const navCollapseEl = container.querySelector('#vmNav');

  async function setNavbarCollapsed(shouldCollapse) {
    if (!navCollapseEl) return;

    const { Collapse } = await import('bootstrap');
    const collapseInstance = Collapse.getOrCreateInstance(navCollapseEl, { toggle: false });

    if (shouldCollapse) {
      collapseInstance.hide();
    } else {
      collapseInstance.show();
    }

    navToggleBtn?.setAttribute('aria-expanded', shouldCollapse ? 'false' : 'true');
  }

  navToggleBtn?.addEventListener('click', async () => {
    const isOpen = navCollapseEl?.classList.contains('show');
    await setNavbarCollapsed(Boolean(isOpen));
  });

  navCollapseEl?.addEventListener('click', async (event) => {
    const closeTrigger = event.target.closest('[data-mobile-close-nav="1"]');
    if (!closeTrigger) return;

    if (navCollapseEl.classList.contains('show')) {
      await setNavbarCollapsed(true);
    }
  });

  /* Load translations */
  i18n.loadTranslations();
}
