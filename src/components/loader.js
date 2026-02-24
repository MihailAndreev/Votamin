/* ============================================================
   Votamin – Loader Component
   ============================================================ */

export function renderLoader(container) {
  container.innerHTML = getLoaderMarkup();
}

export function getLoaderMarkup() {
  return `
    <div class="vm-loader-wrapper">
      <div class="vm-loader"></div>
    </div>
  `;
}
