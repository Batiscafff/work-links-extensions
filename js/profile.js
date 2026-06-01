import { state } from './state.js';
import { setAvatarEl } from './collage.js';
import { getNotes, renderNotes } from './notes.js';
import { showView } from './views.js';

export function openProfileView(link, direction = 'forward') {
  state.currentProfileId = link.id;

  state.notesSearchQuery = '';
  document.getElementById('notesSearchInput').value = '';
  const notesBar = document.getElementById('notesSearchBar');
  if (notesBar.classList.contains('active')) {
    notesBar.classList.remove('active');
    document.getElementById('btnNotesSearch').classList.remove('active');
    document.getElementById('notesAddForm').classList.remove('hidden');
  }

  document.getElementById('profileTitle').textContent = link.name;
  setAvatarEl(document.getElementById('profileAvatar'), link);
  document.getElementById('profileName').textContent = link.name;
  document.getElementById('profileUrl').textContent  = link.url.replace('https://', '');
  document.getElementById('noteInput').value = '';
  renderNotes(getNotes(link));

  showView('viewProfile', direction);
}
