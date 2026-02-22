/* ============================================================
  Votamin – Simple SPA Router (history-based)
  ============================================================ */

/**
 * @typedef {Object} Route
 * @property {string}   path       – pattern like "/polls/:id"
 * @property {Function} loader     – async () => pageModule
 * @property {string}   [layout]   – "main" | "auth" | "blank"
 * @property {boolean}  [auth]     – requires login?
 */

const routes = [];
let notFoundHandler = null;

/* ── Public API ───────────────────────────────────── */

export function addRoute(path, loader, options = {}) {
  routes.push({ path, loader, ...options });
}

export function setNotFound(loader) {
  notFoundHandler = loader;
}

export function navigateTo(path) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function currentPath() {
  return window.location.pathname || '/';
}

/**
 * Start listening for browser history changes and do the initial render.
 * @param {Function} renderFn – (pageModule, params, route) => void
 */
export function startRouter(renderFn) {
  const handle = async () => {
    const path = currentPath();
    const match = matchRoute(path);

    if (match) {
      const mod = await match.route.loader();
      renderFn(mod, match.params, match.route);
    } else if (notFoundHandler) {
      const mod = await notFoundHandler();
      renderFn(mod, {}, { layout: 'main' });
    }
  };

  window.addEventListener('popstate', handle);

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || !href.startsWith('/')) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;

    event.preventDefault();
    navigateTo(href);
  });

  handle(); // initial
}

/* ── Internal helpers ─────────────────────────────── */

function matchRoute(path) {
  for (const route of routes) {
    const params = matchPath(route.path, path);
    if (params !== null) return { route, params };
  }
  return null;
}

/**
 * Matches a URL path against a pattern.
 * Supports static segments & named params (:id, :code …).
 * Returns an object of params or null.
 */
function matchPath(pattern, path) {
  const patternParts = pattern.replace(/\/+$/, '').split('/');
  const pathParts    = path.replace(/\/+$/, '').split('/');

  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}
