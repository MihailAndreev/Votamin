import { i18n } from '../i18n/index.js';

let modalStylesInjected = false;

function injectStyles() {
  if (modalStylesInjected) return;

  const style = document.createElement('style');
  style.id = 'vm-share-modal-styles';
  style.textContent = `
    .vm-share-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 1rem;
    }

    .vm-share-modal {
      width: 100%;
      max-width: 520px;
      background: var(--vm-white);
      border-radius: var(--vm-radius-xl, 16px);
      border: 1px solid var(--vm-gray-200);
      box-shadow: var(--vm-shadow-lg, 0 20px 25px -5px rgba(0,0,0,.1));
      padding: 1.25rem;
    }

    .vm-share-title {
      margin: 0 0 .5rem;
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--vm-gray-900);
    }

    .vm-share-subtitle {
      margin: 0 0 .9rem;
      color: var(--vm-gray-700);
      line-height: 1.5;
    }

    .vm-share-label {
      display: block;
      margin-bottom: .35rem;
      color: var(--vm-gray-700);
      font-weight: 600;
      font-size: .92rem;
    }

    .vm-share-input {
      width: 100%;
      border: 1px solid var(--vm-gray-300);
      border-radius: var(--vm-radius-md, 10px);
      padding: .65rem .75rem;
      background: var(--vm-white);
      color: var(--vm-gray-900);
    }

    .vm-share-actions {
      margin-top: 1rem;
      display: flex;
      justify-content: flex-end;
      gap: .5rem;
    }
  `;

  document.head.appendChild(style);
  modalStylesInjected = true;
}

export function showShareModal(shareUrl) {
  injectStyles();

  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.className = 'vm-share-backdrop';
    root.innerHTML = `
      <div class="vm-share-modal" role="dialog" aria-modal="true" aria-labelledby="vm-share-title">
        <h5 class="vm-share-title" id="vm-share-title">${i18n.t('dashboard.shareModal.title')}</h5>
        <p class="vm-share-subtitle">${i18n.t('dashboard.shareModal.subtitle')}</p>

        <label class="vm-share-label" for="vm-share-input">${i18n.t('dashboard.shareModal.linkLabel')}</label>
        <input id="vm-share-input" class="vm-share-input" type="text" value="${shareUrl}" readonly />

        <div class="vm-share-actions">
          <button type="button" class="btn btn-votamin-outline" data-action="close">${i18n.t('dashboard.shareModal.close')}</button>
          <button type="button" class="btn btn-votamin" data-action="copy">${i18n.t('dashboard.shareModal.copy')}</button>
        </div>
      </div>
    `;

    const input = root.querySelector('#vm-share-input');
    const copyBtn = root.querySelector('[data-action="copy"]');

    const close = (result) => {
      document.removeEventListener('keydown', onKeyDown);
      root.remove();
      resolve(result);
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        close(false);
      }
    };

    root.addEventListener('click', async (event) => {
      if (event.target === root) {
        close(false);
        return;
      }

      const trigger = event.target.closest('[data-action]');
      if (!trigger) return;

      if (trigger.dataset.action === 'close') {
        close(false);
        return;
      }

      if (trigger.dataset.action === 'copy') {
        input?.focus();
        input?.select();

        let copied = false;
        if (navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(shareUrl);
            copied = true;
          } catch {
            copied = false;
          }
        }

        if (!copied) {
          try {
            copied = document.execCommand('copy');
          } catch {
            copied = false;
          }
        }

        if (copied) {
          copyBtn.textContent = i18n.t('dashboard.shareModal.copied');
          setTimeout(() => {
            copyBtn.textContent = i18n.t('dashboard.shareModal.copy');
          }, 1600);
          close(true);
        }
      }
    });

    document.addEventListener('keydown', onKeyDown);
    document.body.appendChild(root);
    input?.focus();
    input?.select();
  });
}