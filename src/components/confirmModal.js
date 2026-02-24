import { i18n } from '../i18n/index.js';

let modalStylesInjected = false;

function injectStyles() {
  if (modalStylesInjected) return;

  const style = document.createElement('style');
  style.id = 'vm-confirm-modal-styles';
  style.textContent = `
    .vm-confirm-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 1rem;
    }

    .vm-confirm-modal {
      width: 100%;
      max-width: 460px;
      background: var(--vm-white);
      border-radius: var(--vm-radius-xl, 16px);
      border: 1px solid var(--vm-gray-200);
      box-shadow: var(--vm-shadow-lg, 0 20px 25px -5px rgba(0,0,0,.1));
      padding: 1.25rem;
    }

    .vm-confirm-title {
      margin: 0 0 .5rem;
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--vm-gray-900);
    }

    .vm-confirm-message {
      margin: 0;
      color: var(--vm-gray-700);
      line-height: 1.5;
    }

    .vm-confirm-actions {
      margin-top: 1rem;
      display: flex;
      justify-content: flex-end;
      gap: .5rem;
    }
  `;

  document.head.appendChild(style);
  modalStylesInjected = true;
}

export function showConfirmModal(message, options = {}) {
  injectStyles();

  const title = options.title || i18n.t('common.confirmAction');
  const confirmText = options.confirmText || i18n.t('common.confirm');
  const cancelText = options.cancelText || i18n.t('common.cancel');

  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.className = 'vm-confirm-backdrop';
    root.innerHTML = `
      <div class="vm-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="vm-confirm-title">
        <h5 class="vm-confirm-title" id="vm-confirm-title">${title}</h5>
        <p class="vm-confirm-message">${message}</p>
        <div class="vm-confirm-actions">
          <button type="button" class="btn btn-votamin-outline" data-action="cancel">${cancelText}</button>
          <button type="button" class="btn btn-votamin" data-action="confirm">${confirmText}</button>
        </div>
      </div>
    `;

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

    root.addEventListener('click', (event) => {
      if (event.target === root) {
        close(false);
        return;
      }

      const trigger = event.target.closest('[data-action]');
      if (!trigger) return;

      close(trigger.dataset.action === 'confirm');
    });

    document.addEventListener('keydown', onKeyDown);
    document.body.appendChild(root);
  });
}