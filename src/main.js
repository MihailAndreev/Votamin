/* ============================================================
   Votamin – Application Entry Point
   ============================================================ */

/* ── Vendor CSS ───────────────────────────────────── */
import 'bootstrap/dist/css/bootstrap.min.css';

/* ── App CSS ──────────────────────────────────────── */
import '@styles/main.css';

/* ── Router ───────────────────────────────────────── */
import { addRoute, navigateTo, setNotFound, startRouter } from './router.js';

/* ── Auth ───────────────────────────────────────── */
import { initAuth, isLoggedIn } from '@utils/auth.js';

/* ── Layouts ──────────────────────────────────────── */
import { renderMainLayout }  from '@layouts/mainLayout.js';

/* ────────────────────────────────────────────────── *
 *  Register all routes
 * ────────────────────────────────────────────────── */

addRoute('/',             () => import('@pages/home/home.js'),            { layout: 'main' });
addRoute('/login',        () => import('@pages/home/home.js'),            { layout: 'main', authModal: 'login' });
addRoute('/register',     () => import('@pages/home/home.js'),            { layout: 'main', authModal: 'register' });
addRoute('/dashboard',    () => import('@pages/dashboard/dashboard.js'),  { layout: 'main', auth: true });
addRoute('/polls',        () => import('@pages/polls/polls.js'),          { layout: 'main', auth: true });
addRoute('/polls/new',    () => import('@pages/polls/new/pollNew.js'),    { layout: 'main', auth: true });
addRoute('/polls/:id',    () => import('@pages/polls/detail/pollDetail.js'), { layout: 'main', auth: true });
addRoute('/p/:code',      () => import('@pages/pollPublic/pollPublic.js'),   { layout: 'blank' });
addRoute('/admin',        () => import('@pages/admin/admin.js'),          { layout: 'main', auth: true });

setNotFound(() => import('@pages/home/home.js'));

/* ────────────────────────────────────────────────── *
 *  Start the app
 * ────────────────────────────────────────────────── */

const app = document.getElementById('app');

// Initialize auth before starting router
await initAuth();

startRouter(async (pageModule, params, route) => {
  const activeAuthModal = document.getElementById('vm-auth-modal-root-global');
  if (activeAuthModal) {
    activeAuthModal.remove();
  }
  document.body.classList.remove('vm-auth-modal-open');

  // Route guard: redirect to login if auth required but not logged in
  if (route.auth && !isLoggedIn()) {
    navigateTo('/login');
    return;
  }

  const layoutName = route.layout || 'main';

  /* Pick the right layout shell */
  let contentContainer;
  if (layoutName === 'blank') {
    app.innerHTML = '<div id="page-content" class="vm-page-enter"></div>';
    contentContainer = app.querySelector('#page-content');
  } else {
    contentContainer = renderMainLayout(app);
  }

  /* Render the page into the content container */
  if (pageModule.default) {
    await pageModule.default(contentContainer, params, route);
  }
});
