/* ============================================================
   Votamin – Main Layout  (Navbar + Content + Footer)
   ============================================================ */
import { renderNavbar }  from '@components/navbar.js';
import { renderFooter }  from '@components/footer.js';

/**
 * Render the main layout shell into `root` and return
 * the #page-content element where pages inject their HTML.
 */
export function renderMainLayout(root) {
  root.innerHTML = `
    <header id="main-header"></header>
    <main id="page-content" class="vm-page-enter"></main>
    <footer id="main-footer"></footer>
  `;

  renderNavbar(root.querySelector('#main-header'));
  renderFooter(root.querySelector('#main-footer'));

  return root.querySelector('#page-content');
}
