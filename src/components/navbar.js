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
      <div class="${navContainerClass}">
        <!-- Brand -->
        <div class="d-flex align-items-center gap-3">
          <a class="navbar-brand d-flex align-items-center" href="${brandHref}">
            <img src="/images/logo/logo.svg" alt="Votamin" height="36" class="vm-brand-logo">
          </a>
          ${loggedIn ? `
            <span class="vm-navbar-user-name vm-navbar-user-name-mobile d-inline d-md-none" id="navbar-user-name-mobile">${displayName}</span>
            <span class="vm-navbar-user-name d-none d-md-inline" id="navbar-user-name">${displayName}</span>
          ` : ''}
        </div>

        <!-- Toggler -->
        <button class="navbar-toggler border-0" type="button"
                data-bs-toggle="collapse" data-bs-target="#vmNav"
                aria-controls="vmNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Links -->
        <div class="collapse navbar-collapse" id="vmNav">
          <ul class="navbar-nav ms-auto me-lg-2 align-items-lg-center gap-lg-1">
            <li class="nav-item">
              <a class="nav-link" href="${homeHref}" data-i18n="navbar.home">Начало</a>
            </li>
            ${loggedIn ? `
              <li class="nav-item">
                <a class="nav-link" href="/dashboard" data-i18n="navbar.dashboard">Табло</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="/polls" data-i18n="navbar.polls">Анкети</a>
              </li>
              <li class="nav-item d-none" id="admin-nav-item">
                <a class="nav-link" href="/admin" data-i18n="navbar.admin">Админ</a>
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
            <li class="nav-item dropdown ms-lg-2 me-lg-1">
              <a class="nav-link dropdown-toggle px-2 d-flex align-items-center" href="#" id="langDropdown" 
                 role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <span id="currentLangFlag">${getCurrentLanguageFlag()}</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="langDropdown">
                <li>
                  <a class="dropdown-item d-flex align-items-center gap-2" href="#" data-lang="en">
                    <img src="/images/flags/gb.svg" alt="English" width="20" height="15" style="border-radius: 2px;">
                    <span>English</span>
                  </a>
                </li>
                <li>
                  <a class="dropdown-item d-flex align-items-center gap-2" href="#" data-lang="bg">
                    <img src="/images/flags/bg.svg" alt="Български" width="20" height="15" style="border-radius: 2px;">
                    <span>Български</span>
                  </a>
                </li>
              </ul>
            </li>
            ${loggedIn ? `
              <li class="nav-item dropdown ms-lg-1 vm-navbar-avatar-dropdown">
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
              </li>
            ` : ''}
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
    const userNameEl = container.querySelector('#navbar-user-name');
    const userNameMobileEl = container.querySelector('#navbar-user-name-mobile');
    const avatarBtnEl = container.querySelector('#navbar-avatar-btn');

    const applyIdentity = (name, avatarUrl = null) => {
      const resolvedName = resolveDisplayName(name, currentUser?.email || '');
      const resolvedAvatar = avatarUrl || null;

      if (userNameEl) {
        userNameEl.textContent = resolvedName;
      }
      if (userNameMobileEl) {
        userNameMobileEl.textContent = resolvedName;
      }
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

  /* Language switcher handler */
  container.querySelectorAll('[data-lang]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = e.currentTarget.getAttribute('data-lang');
      i18n.setLang(lang);
      
      // Update flag display
      const flagSpan = container.querySelector('#currentLangFlag');
      if (flagSpan) {
        const flagSrc = lang === 'bg' 
          ? '/images/flags/bg.svg' 
          : '/images/flags/gb.svg';
        flagSpan.innerHTML = `<img src="${flagSrc}" alt="${lang}" width="20" height="15" style="border-radius: 2px;">`;
      }
    });
  });

  /* Collapse on mobile click */
  container.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const collapse = container.querySelector('.navbar-collapse');
      if (collapse?.classList.contains('show')) {
        import('bootstrap').then(({ Collapse }) => {
          Collapse.getInstance(collapse)?.hide();
        });
      }
    });
  });

  /* Load translations */
  i18n.loadTranslations();
}
