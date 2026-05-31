'use strict';

const STORAGE_KEY = 'meetLinks';
const THEME_KEY   = 'theme';

const ICON_MOON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
  <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const ICON_SUN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
  <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42
           M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
    stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

/* ── Тема ──────────────────────────────────────── */
function loadTheme() {
  chrome.storage.local.get(THEME_KEY, (result) => {
    applyTheme(result[THEME_KEY] === 'dark', false);
  });
}

function applyTheme(isDark, save = true) {
  document.body.classList.toggle('dark', isDark);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.innerHTML = isDark ? ICON_SUN : ICON_MOON;
    btn.title     = isDark ? 'Светлая тема' : 'Тёмная тема';
  }
  if (save) {
    chrome.storage.local.set({ [THEME_KEY]: isDark ? 'dark' : 'light' });
  }
}

function toggleTheme() {
  applyTheme(!document.body.classList.contains('dark'));
}

/* ── Переключение видов ────────────────────────── */
function showView(id, direction) {
  document.querySelectorAll('.view').forEach((v) => {
    v.classList.remove('active', 'anim-forward', 'anim-back');
  });
  const view = document.getElementById(id);
  view.classList.add('active');
  if (direction === 'forward') view.classList.add('anim-forward');
  if (direction === 'back')    view.classList.add('anim-back');

  if (id === 'viewAdd') {
    setTimeout(() => document.getElementById('inputName').focus(), 50);
  }
}

/* ── Профиль ───────────────────────────────────── */
let currentProfileId = null;

function getNotes(link) {
  if (typeof link.notes === 'string' && link.notes.trim()) {
    return [{ id: 'legacy', text: link.notes, createdAt: link.createdAt || Date.now() }];
  }
  return Array.isArray(link.notes) ? link.notes : [];
}

function formatNoteDate(ts) {
  const d     = new Date(ts);
  const today = new Date();
  const yest  = new Date(today);
  yest.setDate(today.getDate() - 1);
  const time  = d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return `Сегодня, ${time}`;
  if (d.toDateString() === yest.toDateString())  return `Вчера, ${time}`;
  const opts = { day: 'numeric', month: 'long' };
  if (d.getFullYear() !== today.getFullYear()) opts.year = 'numeric';
  return `${d.toLocaleDateString('ru', opts)}, ${time}`;
}

function renderNotes(notes) {
  const list = document.getElementById('notesList');
  list.innerHTML = '';

  if (!notes.length) {
    const empty = document.createElement('div');
    empty.className = 'notes-empty';
    empty.textContent = 'Заметок пока нет';
    list.appendChild(empty);
    return;
  }

  [...notes].sort((a, b) => b.createdAt - a.createdAt).forEach((note) => {
    const card = document.createElement('div');
    card.className = 'note-card';

    const header = document.createElement('div');
    header.className = 'note-card-header';

    const date = document.createElement('span');
    date.className = 'note-card-date';
    date.textContent = formatNoteDate(note.createdAt);

    const del = document.createElement('button');
    del.className = 'note-card-delete';
    del.title = 'Удалить заметку';
    del.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2"
        stroke-linecap="round"/>
    </svg>`;
    del.addEventListener('click', () => deleteNote(currentProfileId, note.id));

    header.appendChild(date);
    header.appendChild(del);

    const text = document.createElement('div');
    text.className = 'note-card-text';
    text.textContent = note.text;

    card.appendChild(header);
    card.appendChild(text);
    list.appendChild(card);
  });
}

function addNote(linkId, text) {
  if (!text.trim()) return;
  const newNote = { id: Date.now().toString(), text: text.trim(), createdAt: Date.now() };
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const links = (result[STORAGE_KEY] || []).map((l) => {
      if (l.id !== linkId) return l;
      return { ...l, notes: [newNote, ...getNotes(l)] };
    });
    saveLinks(links, () => {
      const updated = cachedLinks.find((l) => l.id === linkId);
      if (updated) renderNotes(getNotes(updated));
      document.getElementById('noteInput').value = '';
    });
  });
}

function deleteNote(linkId, noteId) {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const links = (result[STORAGE_KEY] || []).map((l) => {
      if (l.id !== linkId) return l;
      return { ...l, notes: getNotes(l).filter((n) => n.id !== noteId) };
    });
    saveLinks(links, () => {
      const updated = cachedLinks.find((l) => l.id === linkId);
      if (updated) renderNotes(getNotes(updated));
    });
  });
}

function openProfileView(link, direction = 'forward') {
  currentProfileId = link.id;
  document.getElementById('profileTitle').textContent = link.name;

  const avatar = document.getElementById('profileAvatar');
  avatar.style.background = avatarColor(link.name);
  avatar.textContent = initials(link.name);

  document.getElementById('profileName').textContent = link.name;
  document.getElementById('profileUrl').textContent  = link.url.replace('https://', '');
  document.getElementById('noteInput').value = '';
  renderNotes(getNotes(link));

  showView('viewProfile', direction);
}

/* ── Карточки ──────────────────────────────────── */
const AVATAR_COLORS = [
  '#1a73e8', '#00897b', '#e8710a', '#8430ce',
  '#1e8e3e', '#d93025', '#0b57d0', '#b06000',
];

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initials(name) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2);
  return words[0][0] + words[1][0];
}

/* ── Поиск ─────────────────────────────────────── */
let cachedLinks = [];

function applySearch() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const filtered = q
    ? cachedLinks.filter((l) => l.name.toLowerCase().includes(q))
    : cachedLinks;
  renderList(filtered);
}

function toggleSearch() {
  const bar = document.getElementById('searchBar');
  const btn = document.getElementById('btnSearch');
  const isOpen = bar.classList.toggle('active');
  btn.classList.toggle('active', isOpen);
  if (isOpen) {
    setTimeout(() => document.getElementById('searchInput').focus(), 50);
  } else {
    document.getElementById('searchInput').value = '';
    renderList(cachedLinks);
  }
}

function closeSearch() {
  const bar = document.getElementById('searchBar');
  if (!bar.classList.contains('active')) return;
  bar.classList.remove('active');
  document.getElementById('btnSearch').classList.remove('active');
  document.getElementById('searchInput').value = '';
}

/* ── Хранилище ─────────────────────────────────── */
function validateUrl(url) {
  return url.startsWith('https://meet.google.com/');
}

function loadLinks() {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    cachedLinks = result[STORAGE_KEY] || [];
    applySearch();
  });
}

function saveLinks(links, callback) {
  chrome.storage.local.set({ [STORAGE_KEY]: links }, () => {
    cachedLinks = links;
    if (callback) callback(links);
  });
}

function deleteLink(id) {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const links = (result[STORAGE_KEY] || []).filter((l) => l.id !== id);
    saveLinks(links, () => applySearch());
  });
}

let currentEditId     = null;
let currentEditReturn = 'viewList';

function openEditView(link, returnTo = 'viewList') {
  currentEditId     = link.id;
  currentEditReturn = returnTo;
  document.getElementById('inputName').value = link.name;
  document.getElementById('inputUrl').value  = link.url;
  document.getElementById('urlError').textContent = '';
  document.getElementById('inputUrl').classList.remove('error');
  document.getElementById('addViewTitle').textContent = 'Редактировать';
  document.getElementById('btnSaveLabel').textContent = 'Применить';
  showView('viewAdd', 'forward');
  setTimeout(() => document.getElementById('inputName').focus(), 50);
}

function resetAddForm() {
  currentEditId     = null;
  currentEditReturn = 'viewList';
  document.getElementById('inputName').value = '';
  document.getElementById('inputUrl').value  = '';
  document.getElementById('urlError').textContent = '';
  document.getElementById('inputUrl').classList.remove('error');
  document.getElementById('addViewTitle').textContent = 'Новая конференция';
  document.getElementById('btnSaveLabel').textContent = 'Добавить';
}

function saveLink() {
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

    if (currentEditId) {
      links = links.map((l) =>
        l.id === currentEditId ? { ...l, name, url } : l
      );
    } else {
      links = [{ id: Date.now().toString(), name, url, createdAt: Date.now() }, ...links];
    }

    const returnTo = currentEditReturn;
    const editedId = currentEditId;
    saveLinks(links, () => {
      resetAddForm();
      applySearch();
      if (returnTo === 'viewProfile') {
        const updated = cachedLinks.find((l) => l.id === editedId);
        if (updated) { openProfileView(updated, 'back'); return; }
      }
      showView('viewList', 'back');
    });
  });
}

/* ── Рендер ────────────────────────────────────── */
function makeIconBtn(cls, title, svgInner) {
  const btn = document.createElement('button');
  btn.className = cls;
  btn.title = title;
  btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none">${svgInner}</svg>`;
  return btn;
}

function createCard(link) {
  const card   = document.createElement('div');
  card.className = 'card';

  const avatar = document.createElement('div');
  avatar.className = 'card-avatar';
  avatar.style.background = avatarColor(link.name);
  avatar.textContent = initials(link.name);

  const body   = document.createElement('div');
  body.className = 'card-body';

  const nameEl = document.createElement('div');
  nameEl.className = 'card-name';
  nameEl.textContent = link.name;

  const urlEl  = document.createElement('div');
  urlEl.className = 'card-url';
  urlEl.textContent = link.url.replace('https://', '');

  body.appendChild(nameEl);
  body.appendChild(urlEl);

  const openNewBtn = makeIconBtn(
    'card-action card-open-new',
    'Открыть в новой вкладке',
    `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
     <polyline points="15 3 21 3 21 9" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"/>
     <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2"
      stroke-linecap="round"/>`
  );

  const openHereBtn = makeIconBtn(
    'card-action card-open-here',
    'Открыть в этой вкладке',
    `<path d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
  );

  const editBtn = makeIconBtn(
    'card-action card-edit',
    'Редактировать',
    `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
     <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
  );

  const delBtn = makeIconBtn(
    'card-action card-delete',
    'Удалить',
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
    openEditView(link);
  });

  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteLink(link.id);
  });

  card.addEventListener('click', () => {
    const fresh = cachedLinks.find((l) => l.id === link.id) || link;
    openProfileView(fresh);
  });

  return card;
}

function renderList(links) {
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

  const sorted = [...links].sort((a, b) => b.createdAt - a.createdAt);
  sorted.forEach((link) => container.appendChild(createCard(link)));
}

/* ── Инициализация ─────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadLinks();
  showView('viewList'); // без анимации при первой загрузке

  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  document.getElementById('btnSearch').addEventListener('click', toggleSearch);

  document.getElementById('searchInput').addEventListener('input', applySearch);

  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleSearch();
  });

  document.getElementById('btnOpenAdd').addEventListener('click', () => {
    closeSearch();
    resetAddForm();
    showView('viewAdd', 'forward');
  });

  document.getElementById('btnBack').addEventListener('click', () => {
    resetAddForm();
    showView('viewList', 'back');
  });

  document.getElementById('btnSave').addEventListener('click', saveLink);

  document.getElementById('inputName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  document.getElementById('inputUrl').focus();
    if (e.key === 'Escape') showView('viewList', 'back');
  });

  document.getElementById('inputUrl').addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  saveLink();
    if (e.key === 'Escape') showView('viewList', 'back');
  });

  document.getElementById('btnProfileBack').addEventListener('click', () => {
    showView('viewList', 'back');
  });

  document.getElementById('profileEdit').addEventListener('click', () => {
    const link = cachedLinks.find((l) => l.id === currentProfileId);
    if (link) openEditView(link, 'viewProfile');
  });

  document.getElementById('profileOpenHere').addEventListener('click', () => {
    const link = cachedLinks.find((l) => l.id === currentProfileId);
    if (!link) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.update(tabs[0].id, { url: link.url });
      window.close();
    });
  });

  document.getElementById('profileOpenNew').addEventListener('click', () => {
    const link = cachedLinks.find((l) => l.id === currentProfileId);
    if (link) window.open(link.url, '_blank');
  });

  document.getElementById('btnAddNote').addEventListener('click', () => {
    addNote(currentProfileId, document.getElementById('noteInput').value);
  });

  document.getElementById('noteInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      addNote(currentProfileId, document.getElementById('noteInput').value);
    }
  });
});
