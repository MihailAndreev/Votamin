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
