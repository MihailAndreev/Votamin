/* ============================================================
   Votamin – Navbar Component
   ============================================================ */
import { getCurrentUser, isAdmin, isLoggedIn, logout } from '@utils/auth.js';
import { navigateTo } from '../router.js';
import { i18n } from '../i18n/index.js';
import { supabaseClient } from '@utils/supabase.js';

function getCurrentLanguageFlag() {
  const currentLang = i18n.getCurrentLang();
  const flagSrc = currentLang === 'bg' 
    ? '/src/assets/images/flags/bg.svg' 
    : '/src/assets/images/flags/gb.svg';
  return `<img src="${flagSrc}" alt="${currentLang}" width="20" height="15" style="border-radius: 2px;">`;
}

function getDisplayName(user) {
  const fullName = user?.user_metadata?.full_name?.trim();
  if (fullName) return fullName;
  return user?.email || '';
}

function getAvatarInitials(nameOrEmail) {
  const value = nameOrEmail?.trim();
  if (!value) return '?';

  if (value.includes('@')) {
    return value.charAt(0).toUpperCase();
  }

  const nameParts = value.split(/\s+/).filter(Boolean);
  if (nameParts.length) {
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
  }

  return '?';
}

export function renderNavbar(container) {
  const loggedIn = isLoggedIn();
  const currentUser = getCurrentUser();
  const displayName = getDisplayName(currentUser);
  const avatarInitials = getAvatarInitials(displayName);
  const homeHref = loggedIn ? '/dashboard' : '/';
  const brandHref = loggedIn ? '/dashboard' : '/';

  container.innerHTML = `
    <nav class="navbar navbar-expand-lg vm-navbar sticky-top">
      <div class="container">
        <!-- Brand -->
        <div class="d-flex align-items-center gap-3">
          <a class="navbar-brand d-flex align-items-center" href="${brandHref}">
            <img src="/src/assets/images/logo/logo.svg" alt="Votamin" height="36" class="vm-brand-logo">
          </a>
          ${loggedIn ? `
            <span class="small text-muted fw-semibold d-none d-md-inline" id="navbar-user-name">${displayName}</span>
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
                    <img src="/src/assets/images/flags/gb.svg" alt="English" width="20" height="15" style="border-radius: 2px;">
                    <span>English</span>
                  </a>
                </li>
                <li>
                  <a class="dropdown-item d-flex align-items-center gap-2" href="#" data-lang="bg">
                    <img src="/src/assets/images/flags/bg.svg" alt="Български" width="20" height="15" style="border-radius: 2px;">
                    <span>Български</span>
                  </a>
                </li>
              </ul>
            </li>
            ${loggedIn ? `
              <li class="nav-item ms-lg-1">
                <button
                  type="button"
                  id="navbar-avatar-btn"
                  class="btn border rounded-circle d-inline-flex align-items-center justify-content-center fw-semibold"
                  aria-label="User profile"
                  style="width:36px;height:36px;border-color:var(--vm-border);color:var(--vm-teal);background:var(--vm-gray-100);"
                >${avatarInitials}</button>
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
      }
    });
  }

  if (loggedIn) {
    const userNameEl = container.querySelector('#navbar-user-name');
    const avatarBtnEl = container.querySelector('#navbar-avatar-btn');

    const applyIdentity = (name) => {
      const resolvedName = name?.trim() || currentUser?.email || '';
      if (userNameEl) {
        userNameEl.textContent = resolvedName;
      }
      if (avatarBtnEl) {
        avatarBtnEl.textContent = getAvatarInitials(resolvedName);
        avatarBtnEl.title = resolvedName;
      }
    };

    applyIdentity(displayName);

    if (currentUser?.id) {
      supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('user_id', currentUser.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data?.full_name?.trim()) {
            applyIdentity(data.full_name);
          }
        });
    }

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
          ? '/src/assets/images/flags/bg.svg' 
          : '/src/assets/images/flags/gb.svg';
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
