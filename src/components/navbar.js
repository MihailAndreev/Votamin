/* ============================================================
   Votamin – Navbar Component
   ============================================================ */
import { isLoggedIn, logout } from '@utils/auth.js';
import { navigateTo } from '../router.js';
import { i18n } from '../i18n/index.js';

function getCurrentLanguageFlag() {
  const currentLang = i18n.getCurrentLang();
  const flagSrc = currentLang === 'bg' 
    ? '/src/assets/images/flags/bg.svg' 
    : '/src/assets/images/flags/gb.svg';
  return `<img src="${flagSrc}" alt="${currentLang}" width="20" height="15" style="border-radius: 2px;">`;
}

export function renderNavbar(container) {
  const loggedIn = isLoggedIn();

  container.innerHTML = `
    <nav class="navbar navbar-expand-lg vm-navbar sticky-top">
      <div class="container">
        <!-- Brand -->
        <a class="navbar-brand d-flex align-items-center" href="#/">
          <img src="/src/assets/images/logo/logo.svg" alt="Votamin" height="36" class="vm-brand-logo">
        </a>

        <!-- Toggler -->
        <button class="navbar-toggler border-0" type="button"
                data-bs-toggle="collapse" data-bs-target="#vmNav"
                aria-controls="vmNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Links -->
        <div class="collapse navbar-collapse" id="vmNav">
          <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            <li class="nav-item">
              <a class="nav-link" href="#/" data-i18n="navbar.home">Начало</a>
            </li>
            ${loggedIn ? `
              <li class="nav-item">
                <a class="nav-link" href="#/dashboard" data-i18n="navbar.dashboard">Табло</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#/polls" data-i18n="navbar.polls">Анкети</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#/admin" data-i18n="navbar.admin">Админ</a>
              </li>
              <li class="nav-item ms-lg-2">
                <button class="btn btn-votamin-outline btn-sm" id="btn-logout" data-i18n="navbar.logout">Изход</button>
              </li>
            ` : `
              <li class="nav-item ms-lg-2">
                <a class="btn btn-votamin-outline btn-sm" href="#/login" data-i18n="navbar.login">Вход</a>
              </li>
              <li class="nav-item">
                <a class="btn btn-votamin btn-sm" href="#/register" data-i18n="navbar.register">Регистрация</a>
              </li>
            `}
            <!-- Language Switcher -->
            <li class="nav-item dropdown ms-lg-2">
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
          </ul>
        </div>
      </div>
    </nav>
  `;

  /* Logout handler */
  const btnLogout = container.querySelector('#btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      logout();
      navigateTo('/');
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
