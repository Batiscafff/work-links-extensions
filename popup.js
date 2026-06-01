import { state }                                    from './js/state.js';
import { loadLinks }                                from './js/storage.js';
import { loadTheme, toggleTheme }                   from './js/theme.js';
import { showView }                                 from './js/views.js';
import { initCards, applySearch, toggleSearch,
         closeSearch }                              from './js/cards.js';
import { openEditView, resetAddForm, saveLink }     from './js/editor.js';
import { openProfileView }                          from './js/profile.js';
import { setAvatarEl }                              from './js/collage.js';
import { openParticipantsView, addParticipant }     from './js/participants.js';
import { addNote, getNotes, renderNotes,
         toggleNotesSort, toggleNotesSearch }       from './js/notes.js';

// Inject navigation callbacks into cards to avoid circular imports
initCards({
  onOpen: (link) => {
    const fresh = state.cachedLinks.find((l) => l.id === link.id) || link;
    openProfileView(fresh);
  },
  onEdit: (link) => openEditView(link),
});

document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadLinks(() => applySearch());
  showView('viewList');

  // ── Header / list ─────────────────────────────────
  document.getElementById('themeToggle')
    .addEventListener('click', toggleTheme);

  document.getElementById('btnSearch')
    .addEventListener('click', toggleSearch);

  document.getElementById('searchInput')
    .addEventListener('input', applySearch);

  document.getElementById('searchInput')
    .addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleSearch(); });

  document.getElementById('btnOpenAdd').addEventListener('click', () => {
    closeSearch();
    resetAddForm();
    showView('viewAdd', 'forward');
  });

  // ── Add / Edit view ───────────────────────────────
  document.getElementById('btnBack').addEventListener('click', () => {
    const returnTo = state.currentEditReturn;
    resetAddForm();
    showView(returnTo === 'viewProfile' ? 'viewProfile' : 'viewList', 'back');
  });

  document.getElementById('btnSave')
    .addEventListener('click', saveLink);

  document.getElementById('inputName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  document.getElementById('inputUrl').focus();
    if (e.key === 'Escape') showView('viewList', 'back');
  });

  document.getElementById('inputUrl').addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  saveLink();
    if (e.key === 'Escape') showView('viewList', 'back');
  });

  // ── Profile view ──────────────────────────────────
  document.getElementById('btnProfileBack')
    .addEventListener('click', () => showView('viewList', 'back'));

  document.getElementById('profileEdit').addEventListener('click', () => {
    const link = state.cachedLinks.find((l) => l.id === state.currentProfileId);
    if (link) openEditView(link, 'viewProfile');
  });

  document.getElementById('profileOpenHere').addEventListener('click', () => {
    const link = state.cachedLinks.find((l) => l.id === state.currentProfileId);
    if (!link) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.update(tabs[0].id, { url: link.url });
      window.close();
    });
  });

  document.getElementById('profileOpenNew').addEventListener('click', () => {
    const link = state.cachedLinks.find((l) => l.id === state.currentProfileId);
    if (link) window.open(link.url, '_blank');
  });

  document.getElementById('profileParticipants').addEventListener('click', () => {
    const link = state.cachedLinks.find((l) => l.id === state.currentProfileId);
    if (link) openParticipantsView(link);
  });

  // ── Notes ─────────────────────────────────────────
  document.getElementById('btnAddNote').addEventListener('click', () => {
    addNote(state.currentProfileId, document.getElementById('noteInput').value);
  });

  document.getElementById('noteInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      addNote(state.currentProfileId, document.getElementById('noteInput').value);
    }
  });

  document.getElementById('btnNotesSort')
    .addEventListener('click', toggleNotesSort);

  document.getElementById('btnNotesSearch')
    .addEventListener('click', toggleNotesSearch);

  document.getElementById('notesSearchInput').addEventListener('input', (e) => {
    state.notesSearchQuery = e.target.value.trim().toLowerCase();
    const link = state.cachedLinks.find((l) => l.id === state.currentProfileId);
    if (link) renderNotes(getNotes(link));
  });

  document.getElementById('notesSearchInput')
    .addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleNotesSearch(); });

  // ── Participants view ─────────────────────────────
  document.getElementById('btnParticipantsBack').addEventListener('click', () => {
    const link = state.cachedLinks.find((l) => l.id === state.currentParticipantsId);
    if (link) setAvatarEl(document.getElementById('profileAvatar'), link);
    showView('viewProfile', 'back');
  });

  document.getElementById('btnAddParticipant').addEventListener('click', () => {
    addParticipant(
      state.currentParticipantsId,
      document.getElementById('participantInput').value
    );
  });

  document.getElementById('participantInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addParticipant(
        state.currentParticipantsId,
        document.getElementById('participantInput').value
      );
    }
  });
});
