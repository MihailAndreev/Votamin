let toastRoot = null;

function getToastRoot() {
  if (toastRoot && document.body.contains(toastRoot)) {
    return toastRoot;
  }

  toastRoot = document.createElement('div');
  toastRoot.className = 'vm-toast-root';
  document.body.appendChild(toastRoot);
  return toastRoot;
}

export function showToast(message, type = 'info', duration = 3500) {
  if (!message) return;

  const root = getToastRoot();
  const toast = document.createElement('div');
  toast.className = `vm-toast vm-toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;

  root.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  const hide = () => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 220);
  };

  const timeoutId = setTimeout(hide, duration);

  toast.addEventListener('click', () => {
    clearTimeout(timeoutId);
    hide();
  });
}