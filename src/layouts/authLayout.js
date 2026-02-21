/* ============================================================
   Votamin – Auth Layout  (centred card, no nav/footer)
   ============================================================ */

/**
 * Minimal layout for login / register pages.
 * Returns the content container.
 */
export function renderAuthLayout(root) {
  root.innerHTML = `
    <div class="vm-auth-layout d-flex align-items-center justify-content-center min-vh-100"
         style="background: linear-gradient(135deg, var(--vm-green-light) 0%, var(--vm-white) 50%, var(--vm-orange-light) 100%);">
      <div id="page-content" class="vm-page-enter" style="width:100%; max-width:460px; padding:1rem;"></div>
    </div>
  `;

  return root.querySelector('#page-content');
}
