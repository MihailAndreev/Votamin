/* ============================================================
   Votamin – Footer Component
   ============================================================ */

export function renderFooter(container) {
  container.innerHTML = `
    <div class="vm-footer py-4 mt-auto border-top" style="background:var(--vm-gray-100);">
      <div class="container">
        <div class="row align-items-center gy-3">
          <div class="col-md-4 text-center text-md-start">
            <a href="#/" class="d-inline-flex align-items-center justify-content-center justify-content-md-start text-decoration-none">
              <img src="/src/assets/images/logo/logo.svg" alt="Votamin" height="36" class="vm-brand-logo">
            </a>
          </div>
          <div class="col-md-4 text-center">
            <a href="#/" class="text-muted small me-3">Начало</a>
            <a href="#/login" class="text-muted small me-3">Вход</a>
            <a href="#/register" class="text-muted small">Регистрация</a>
          </div>
          <div class="col-md-4 text-center text-md-end">
            <small class="text-muted">&copy; ${new Date().getFullYear()} Votamin. Всички права запазени.</small>
          </div>
        </div>
      </div>
    </div>
  `;
}
