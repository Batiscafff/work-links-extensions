// Lightweight in-popup confirmation modal. Native confirm() can dismiss the
// extension popup on some platforms, so we build our own. Promise<boolean>.
let overlay = null;

function build() {
  overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-dialog">
      <p class="confirm-message"></p>
      <div class="confirm-actions">
        <button class="confirm-btn confirm-cancel" type="button">Отмена</button>
        <button class="confirm-btn confirm-ok" type="button">Удалить</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

export function confirmDialog(message, { confirmLabel = 'Удалить' } = {}) {
  if (!overlay) build();
  overlay.querySelector('.confirm-message').textContent = message;
  overlay.querySelector('.confirm-ok').textContent      = confirmLabel;
  overlay.classList.add('active');

  const ok     = overlay.querySelector('.confirm-ok');
  const cancel = overlay.querySelector('.confirm-cancel');
  setTimeout(() => cancel.focus(), 50);

  return new Promise((resolve) => {
    const cleanup = (result) => {
      overlay.classList.remove('active');
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      overlay.removeEventListener('mousedown', onBackdrop);
      document.removeEventListener('keydown', onKey, true);
      resolve(result);
    };
    const onOk       = () => cleanup(true);
    const onCancel   = () => cleanup(false);
    const onBackdrop = (e) => { if (e.target === overlay) cleanup(false); };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cleanup(false); }
      if (e.key === 'Enter')  { e.preventDefault(); e.stopPropagation(); cleanup(true); }
    };

    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    overlay.addEventListener('mousedown', onBackdrop);
    document.addEventListener('keydown', onKey, true);
  });
}
