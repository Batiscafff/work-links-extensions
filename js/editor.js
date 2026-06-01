import { state, STORAGE_KEY } from './state.js';
import { saveLinks, validateUrl } from './storage.js';
import { showView } from './views.js';
import { applySearch } from './cards.js';
import { openProfileView } from './profile.js';

export function openEditView(link, returnTo = 'viewList') {
  state.currentEditId     = link.id;
  state.currentEditReturn = returnTo;
  document.getElementById('inputName').value = link.name;
  document.getElementById('inputUrl').value  = link.url;
  document.getElementById('urlError').textContent = '';
  document.getElementById('inputUrl').classList.remove('error');
  document.getElementById('addViewTitle').textContent = 'Редактировать';
  document.getElementById('btnSaveLabel').textContent = 'Применить';
  showView('viewAdd', 'forward');
  setTimeout(() => document.getElementById('inputName').focus(), 50);
}

export function resetAddForm() {
  state.currentEditId     = null;
  state.currentEditReturn = 'viewList';
  document.getElementById('inputName').value = '';
  document.getElementById('inputUrl').value  = '';
  document.getElementById('urlError').textContent = '';
  document.getElementById('inputUrl').classList.remove('error');
  document.getElementById('addViewTitle').textContent = 'Новая конференция';
  document.getElementById('btnSaveLabel').textContent = 'Добавить';
}

export function saveLink() {
  const nameInput = document.getElementById('inputName');
  const urlInput  = document.getElementById('inputUrl');
  const urlError  = document.getElementById('urlError');

  const name = nameInput.value.trim();
  const url  = urlInput.value.trim();

  urlInput.classList.remove('error');
  urlError.textContent = '';

  if (!name) { nameInput.focus(); return; }

  if (!validateUrl(url)) {
    urlInput.classList.add('error');
    urlError.textContent = 'Введите ссылку вида https://meet.google.com/…';
    urlInput.focus();
    return;
  }

  chrome.storage.local.get(STORAGE_KEY, (result) => {
    let links = result[STORAGE_KEY] || [];

    if (state.currentEditId) {
      links = links.map((l) =>
        l.id === state.currentEditId ? { ...l, name, url } : l
      );
    } else {
      links = [{ id: Date.now().toString(), name, url, createdAt: Date.now() }, ...links];
    }

    const returnTo = state.currentEditReturn;
    const editedId = state.currentEditId;
    saveLinks(links, () => {
      resetAddForm();
      applySearch();
      if (returnTo === 'viewProfile') {
        const updated = state.cachedLinks.find((l) => l.id === editedId);
        if (updated) { openProfileView(updated, 'back'); return; }
      }
      showView('viewList', 'back');
    });
  });
}
