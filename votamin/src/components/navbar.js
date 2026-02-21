/* ============================================================
   Votamin – Navbar Component
   ============================================================ */
import { isLoggedIn, logout } from '@utils/auth.js';
import { navigateTo } from '../router.js';

export function renderNavbar(container) {
  const loggedIn = isLoggedIn();

  container.innerHTML = `
    <nav class="navbar navbar-expand-lg vm-navbar sticky-top">
      <div class="container">
        <!-- Brand -->
        <a class="navbar-brand d-flex align-items-center gap-2 fw-bold" href="#/">
          <span class="vm-brand-icon">
            <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
              <defs>
                <linearGradient id="nb" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#22c55e"/>
                  <stop offset="100%" style="stop-color:#f97316"/>
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r="30" fill="url(#nb)"/>
              <text x="32" y="44" text-anchor="middle" font-size="32" font-weight="bold" fill="#fff" font-family="Arial,sans-serif">V</text>
            </svg>
          </span>
          <span class="vm-gradient-text fs-4">Votamin</span>
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
              <a class="nav-link" href="#/">Начало</a>
            </li>
            ${loggedIn ? `
              <li class="nav-item">
                <a class="nav-link" href="#/dashboard">Табло</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#/polls">Анкети</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#/admin">Админ</a>
              </li>
              <li class="nav-item ms-lg-2">
                <button class="btn btn-votamin-outline btn-sm" id="btn-logout">Изход</button>
              </li>
            ` : `
              <li class="nav-item ms-lg-2">
                <a class="btn btn-votamin-outline btn-sm" href="#/login">Вход</a>
              </li>
              <li class="nav-item">
                <a class="btn btn-votamin btn-sm" href="#/register">Регистрация</a>
              </li>
            `}
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
}
