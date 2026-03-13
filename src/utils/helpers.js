/* ============================================================
   Votamin – Misc Helpers
   ============================================================ */

/** Shorthand for querySelector */
export const $ = (sel, root = document) => root.querySelector(sel);

/** Shorthand for querySelectorAll */
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Create an HTML element from a template string */
export function htmlToElement(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstChild;
}

/** Compute the real status of a poll based on its ends_at date */
export function computePollStatus(poll) {
  if (!poll) return 'draft';
  if (poll.status === 'closed') return 'closed';
  if (poll.status === 'open' && poll.ends_at) {
    if (new Date(poll.ends_at).getTime() <= Date.now()) {
      return 'closed';
    }
  }
  return poll.status;
}

/** Inject CSS text into the <head>  (deduped by id) */
export function injectCSS(id, cssText) {
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = cssText;
  document.head.appendChild(style);
}

/** Remove injected CSS by id */
export function removeCSS(id) {
  document.getElementById(id)?.remove();
}

let blockingModalDepth = 0;

function setBlockingModalState(isOpen) {
  document.body.classList.toggle('vm-modal-open', isOpen);
}

/**
 * Start a blocking modal session:
 * - locks page scroll/interactions via body class
 * - pushes history state so mobile/browser Back closes the modal first
 */
export function beginBlockingModalSession(onBackRequest) {
  blockingModalDepth += 1;
  setBlockingModalState(true);

  const modalStateId = `vm-modal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let historyEntryActive = false;

  const onPopState = (event) => {
    if (!historyEntryActive) return;
    if (event.state?.__vmModalId === modalStateId) return;

    historyEntryActive = false;
    window.removeEventListener('popstate', onPopState);
    onBackRequest?.();
  };

  try {
    const nextState = { ...(window.history.state || {}), __vmModalId: modalStateId };
    window.history.pushState(nextState, '', window.location.href);
    historyEntryActive = true;
    window.addEventListener('popstate', onPopState);
  } catch {
    historyEntryActive = false;
  }

  let finished = false;

  return function endBlockingModalSession(options = {}) {
    const { closedByPopState = false } = options;
    if (finished) return;
    finished = true;

    if (historyEntryActive) {
      historyEntryActive = false;
      window.removeEventListener('popstate', onPopState);
      if (!closedByPopState) {
        try {
          window.history.back();
        } catch {
          // no-op fallback when history is unavailable
        }
      }
    }

    blockingModalDepth = Math.max(0, blockingModalDepth - 1);
    if (blockingModalDepth === 0) {
      setBlockingModalState(false);
    }
  };
}

/** Generate a random short code */
export function shortCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Format a date nicely */
export function formatDate(d) {
  return new Date(d).toLocaleDateString('bg-BG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
