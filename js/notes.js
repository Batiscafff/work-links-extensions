import { state, STORAGE_KEY } from './state.js';
import { saveLinks } from './storage.js';
import { formatNoteDate } from './utils.js';

export const SORT_ICON_DESC = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none">
  <path d="M3 6h14M3 11h9M3 16h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M20 4v14m0 0l-2.5-2.5M20 18l2.5-2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const SORT_ICON_ASC = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none">
  <path d="M3 6h5M3 11h9M3 16h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M20 20V6m0 0l-2.5 2.5M20 6l2.5 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export function getNotes(link) {
  if (typeof link.notes === 'string' && link.notes.trim()) {
    return [{ id: 'legacy', text: link.notes, createdAt: link.createdAt || Date.now() }];
  }
  return Array.isArray(link.notes) ? link.notes : [];
}

export function renderNotes(notes) {
  const list = document.getElementById('notesList');
  list.innerHTML = '';

  const filtered = state.notesSearchQuery
    ? notes.filter((n) => n.text.toLowerCase().includes(state.notesSearchQuery))
    : notes;

  const sorted = [...filtered].sort((a, b) =>
    state.notesSortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
  );

  if (!sorted.length) {
    const empty = document.createElement('div');
    empty.className  = 'notes-empty';
    empty.textContent = state.notesSearchQuery ? 'Заметки не найдены' : 'Заметок пока нет';
    list.appendChild(empty);
    return;
  }

  sorted.forEach((note) => {
    const card = document.createElement('div');
    card.className = 'note-card';

    const header = document.createElement('div');
    header.className = 'note-card-header';

    const date = document.createElement('span');
    date.className  = 'note-card-date';
    date.textContent = formatNoteDate(note.createdAt);

    const del = document.createElement('button');
    del.className = 'note-card-delete';
    del.title     = 'Удалить заметку';
    del.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`;
    del.addEventListener('click', () => deleteNote(state.currentProfileId, note.id));

    header.appendChild(date);
    header.appendChild(del);

    const text = document.createElement('div');
    text.className  = 'note-card-text';
    text.textContent = note.text;

    card.appendChild(header);
    card.appendChild(text);
    list.appendChild(card);
  });
}

export function addNote(linkId, text) {
  if (!text.trim()) return;
  const newNote = { id: Date.now().toString(), text: text.trim(), createdAt: Date.now() };
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const links = (result[STORAGE_KEY] || []).map((l) => {
      if (l.id !== linkId) return l;
      return { ...l, notes: [newNote, ...getNotes(l)] };
    });
    saveLinks(links, () => {
      const updated = state.cachedLinks.find((l) => l.id === linkId);
      if (updated) renderNotes(getNotes(updated));
      document.getElementById('noteInput').value = '';
    });
  });
}

export function deleteNote(linkId, noteId) {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const links = (result[STORAGE_KEY] || []).map((l) => {
      if (l.id !== linkId) return l;
      return { ...l, notes: getNotes(l).filter((n) => n.id !== noteId) };
    });
    saveLinks(links, () => {
      const updated = state.cachedLinks.find((l) => l.id === linkId);
      if (updated) renderNotes(getNotes(updated));
    });
  });
}

export function toggleNotesSort() {
  state.notesSortOrder = state.notesSortOrder === 'desc' ? 'asc' : 'desc';
  const btn = document.getElementById('btnNotesSort');
  btn.innerHTML = state.notesSortOrder === 'desc' ? SORT_ICON_DESC : SORT_ICON_ASC;
  btn.title     = state.notesSortOrder === 'desc' ? 'Сначала новые' : 'Сначала старые';
  btn.classList.toggle('active', state.notesSortOrder === 'asc');
  const link = state.cachedLinks.find((l) => l.id === state.currentProfileId);
  if (link) renderNotes(getNotes(link));
}

export function toggleNotesSearch() {
  const bar  = document.getElementById('notesSearchBar');
  const btn  = document.getElementById('btnNotesSearch');
  const form = document.getElementById('notesAddForm');
  const isOpen = bar.classList.toggle('active');
  btn.classList.toggle('active', isOpen);
  form.classList.toggle('hidden', isOpen);
  if (isOpen) {
    setTimeout(() => document.getElementById('notesSearchInput').focus(), 50);
  } else {
    state.notesSearchQuery = '';
    document.getElementById('notesSearchInput').value = '';
    const link = state.cachedLinks.find((l) => l.id === state.currentProfileId);
    if (link) renderNotes(getNotes(link));
  }
}
