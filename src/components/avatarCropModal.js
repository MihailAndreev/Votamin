import { i18n } from '../i18n/index.js';

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected) return;

  const style = document.createElement('style');
  style.id = 'vm-avatar-crop-modal-styles';
  style.textContent = `
    .vm-avatar-crop-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2100;
      background: rgba(15, 23, 42, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .vm-avatar-crop-modal {
      width: 100%;
      max-width: 520px;
      background: var(--vm-white);
      border: 1px solid var(--vm-gray-200);
      border-radius: var(--vm-radius-xl, 16px);
      box-shadow: var(--vm-shadow-lg, 0 20px 25px -5px rgba(0,0,0,.1));
      padding: 1rem;
    }

    .vm-avatar-crop-title {
      margin: 0 0 0.35rem;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--vm-gray-900);
    }

    .vm-avatar-crop-subtitle {
      margin: 0 0 0.8rem;
      color: var(--vm-gray-700);
      font-size: 0.92rem;
    }

    .vm-avatar-crop-frame {
      width: min(100%, 320px);
      aspect-ratio: 1 / 1;
      margin: 0 auto;
      border-radius: 999px;
      border: 1px solid var(--vm-border);
      overflow: hidden;
      background: var(--vm-gray-100);
      cursor: grab;
      touch-action: none;
      user-select: none;
    }

    .vm-avatar-crop-frame:active {
      cursor: grabbing;
    }

    .vm-avatar-crop-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    .vm-avatar-crop-controls {
      margin-top: 0.9rem;
    }

    .vm-avatar-crop-label {
      display: block;
      color: var(--vm-gray-700);
      font-size: 0.85rem;
      margin-bottom: 0.25rem;
      font-weight: 600;
    }

    .vm-avatar-crop-range {
      width: 100%;
    }

    .vm-avatar-crop-actions {
      margin-top: 0.95rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `;

  document.head.appendChild(style);
  stylesInjected = true;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image_load_failed'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('image_read_failed'));
    reader.readAsDataURL(file);
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export async function showAvatarCropModal(file) {
  injectStyles();

  const image = await loadImage(file);
  const cropSize = 320;

  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.className = 'vm-avatar-crop-backdrop';
    root.innerHTML = `
      <div class="vm-avatar-crop-modal" role="dialog" aria-modal="true" aria-labelledby="vm-avatar-crop-title">
        <h5 class="vm-avatar-crop-title" id="vm-avatar-crop-title">${i18n.t('dashboard.account.cropTitle')}</h5>
        <p class="vm-avatar-crop-subtitle">${i18n.t('dashboard.account.cropSubtitle')}</p>
        <div class="vm-avatar-crop-frame" id="vm-avatar-crop-frame">
          <canvas class="vm-avatar-crop-canvas" id="vm-avatar-crop-canvas" width="${cropSize}" height="${cropSize}"></canvas>
        </div>
        <div class="vm-avatar-crop-controls">
          <label class="vm-avatar-crop-label" for="vm-avatar-crop-zoom">${i18n.t('dashboard.account.cropZoom')}</label>
          <input id="vm-avatar-crop-zoom" class="vm-avatar-crop-range" type="range" min="1" max="4" step="0.01" value="1" />
        </div>
        <div class="vm-avatar-crop-actions">
          <button type="button" class="btn btn-votamin-outline" data-action="cancel">${i18n.t('common.cancel')}</button>
          <button type="button" class="btn btn-votamin" data-action="save">${i18n.t('common.confirm')}</button>
        </div>
      </div>
    `;

    const canvas = root.querySelector('#vm-avatar-crop-canvas');
    const frame = root.querySelector('#vm-avatar-crop-frame');
    const ctx = canvas.getContext('2d');
    const zoomInput = root.querySelector('#vm-avatar-crop-zoom');

    const baseScale = Math.max(cropSize / image.width, cropSize / image.height);
    let scale = baseScale;
    let offsetX = (cropSize - image.width * scale) / 2;
    let offsetY = (cropSize - image.height * scale) / 2;

    zoomInput.value = '1';

    function clampOffsets() {
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;

      const minX = cropSize - drawWidth;
      const maxX = 0;
      const minY = cropSize - drawHeight;
      const maxY = 0;

      offsetX = clamp(offsetX, minX, maxX);
      offsetY = clamp(offsetY, minY, maxY);
    }

    function draw() {
      ctx.clearRect(0, 0, cropSize, cropSize);
      ctx.drawImage(image, offsetX, offsetY, image.width * scale, image.height * scale);
    }

    clampOffsets();
    draw();

    let dragging = false;
    let startX = 0;
    let startY = 0;

    const onPointerMove = (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      startX = event.clientX;
      startY = event.clientY;
      offsetX += dx;
      offsetY += dy;
      clampOffsets();
      draw();
    };

    const onPointerUp = () => {
      dragging = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    frame.addEventListener('pointerdown', (event) => {
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    });

    zoomInput.addEventListener('input', () => {
      const zoomFactor = Number(zoomInput.value);
      const nextScale = baseScale * zoomFactor;

      const centerX = cropSize / 2;
      const centerY = cropSize / 2;
      const imageX = (centerX - offsetX) / scale;
      const imageY = (centerY - offsetY) / scale;

      scale = nextScale;
      offsetX = centerX - imageX * scale;
      offsetY = centerY - imageY * scale;
      clampOffsets();
      draw();
    });

    const close = (result) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('keydown', onKeyDown);
      root.remove();
      resolve(result);
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        close(null);
      }
    };

    root.addEventListener('click', async (event) => {
      if (event.target === root) {
        close(null);
        return;
      }

      const action = event.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'cancel') {
        close(null);
        return;
      }

      if (action === 'save') {
        canvas.toBlob((blob) => {
          if (!blob) {
            close(null);
            return;
          }
          close(blob);
        }, 'image/jpeg', 0.9);
      }
    });

    document.addEventListener('keydown', onKeyDown);
    document.body.appendChild(root);
  });
}
