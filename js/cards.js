import { state } from './state.js';
import { deleteLink } from './storage.js';
import { makeIconBtn } from './utils.js';
import { setAvatarEl } from './collage.js';

// Injected by initCards() in popup.js to avoid circular deps with profile/editor
let _onOpen = null;
let _onEdit = null;

export function initCards({ onOpen, onEdit }) {
  _onOpen = onOpen;
  _onEdit = onEdit;
}

export function applySearch() {
  const q        = document.getElementById('searchInput').value.trim().toLowerCase();
  const filtered = q
    ? state.cachedLinks.filter((l) => l.name.toLowerCase().includes(q))
    : state.cachedLinks;
  renderList(filtered);
}

export function toggleSearch() {
  const bar    = document.getElementById('searchBar');
  const btn    = document.getElementById('btnSearch');
  const isOpen = bar.classList.toggle('active');
  btn.classList.toggle('active', isOpen);
  if (isOpen) {
    setTimeout(() => document.getElementById('searchInput').focus(), 50);
  } else {
    document.getElementById('searchInput').value = '';
    renderList(state.cachedLinks);
  }
}

export function closeSearch() {
  const bar = document.getElementById('searchBar');
  if (!bar.classList.contains('active')) return;
  bar.classList.remove('active');
  document.getElementById('btnSearch').classList.remove('active');
  document.getElementById('searchInput').value = '';
}

export function createCard(link) {
  const card = document.createElement('div');
  card.className = 'card';

  const avatar = document.createElement('div');
  avatar.className = 'card-avatar';
  setAvatarEl(avatar, link);

  const body   = document.createElement('div');
  body.className = 'card-body';

  const nameEl = document.createElement('div');
  nameEl.className  = 'card-name';
  nameEl.textContent = link.name;

  const urlEl = document.createElement('div');
  urlEl.className  = 'card-url';
  urlEl.textContent = link.url.replace('https://', '');

  body.appendChild(nameEl);
  body.appendChild(urlEl);

  const openNewBtn = makeIconBtn(
    'card-action card-open-new', 'Открыть в новой вкладке',
    `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
     <polyline points="15 3 21 3 21 9" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"/>
     <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2"
      stroke-linecap="round"/>`
  );
  const openHereBtn = makeIconBtn(
    'card-action card-open-here', 'Открыть в этой вкладке',
    `<path d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
  );
  const editBtn = makeIconBtn(
    'card-action card-edit', 'Редактировать',
    `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
     <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
  );
  const delBtn = makeIconBtn(
    'card-action card-delete', 'Удалить',
    `<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
  );

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  actions.appendChild(openHereBtn);
  actions.appendChild(openNewBtn);
  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  card.appendChild(avatar);
  card.appendChild(body);
  card.appendChild(actions);

  openNewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.open(link.url, '_blank');
  });
  openHereBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.update(tabs[0].id, { url: link.url });
      window.close();
    });
  });
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (_onEdit) _onEdit(link);
  });
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteLink(link.id, () => applySearch());
  });
  card.addEventListener('click', () => {
    const fresh = state.cachedLinks.find((l) => l.id === link.id) || link;
    if (_onOpen) _onOpen(fresh);
  });

  return card;
}

export function renderList(links) {
  const container = document.getElementById('linkList');
  container.innerHTML = '';

  if (!links || links.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M5 8.5C5 7.67 5.67 7 6.5 7h7C14.33 7 15 7.67 15 8.5v7c0 .83-.67 1.5-1.5 1.5h-7C5.67 17 5 16.33 5 15.5v-7z" stroke="#80868b" stroke-width="1.5"/>
          <path d="M16 10.5l3-2v7l-3-2v-3z" stroke="#80868b" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
        <p>Нет ссылок — нажмите «Добавить»</p>
      </div>`;
    return;
  }

  [...links].sort((a, b) => b.createdAt - a.createdAt)
    .forEach((link) => container.appendChild(createCard(link)));
}
