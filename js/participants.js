import { state, STORAGE_KEY, AVATAR_TTL } from './state.js';
import { saveLinks } from './storage.js';
import { avatarColor } from './utils.js';
import { setProfileAvatar } from './collage.js';
import { confirmDialog } from './confirm.js';
import { showView } from './views.js';
import { applySearch } from './cards.js';

export function getParticipants(link) {
  return Array.isArray(link.participants) ? link.participants : [];
}

export async function fetchTelegramAvatar(username) {
  try {
    const resp = await fetch(`https://t.me/${username}`);
    if (!resp.ok) return null;
    const html  = await resp.text();
    const match = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/) ||
                  html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/);
    const url = match ? match[1] : null;
    if (!url || url.includes('telegram.org/img/')) return null;
    return url;
  } catch {
    return null;
  }
}

function makeParticipantInitial(username) {
  const div = document.createElement('div');
  div.className    = 'participant-avatar-initial';
  div.style.background = avatarColor(username);
  div.textContent  = (username[0] || '?').toUpperCase();
  return div;
}

export function renderParticipantsList(link) {
  const list = document.getElementById('participantsList');
  list.innerHTML = '';
  const pts = getParticipants(link);

  if (!pts.length) {
    const empty = document.createElement('div');
    empty.className   = 'participants-empty';
    empty.textContent = 'Нет участников';
    list.appendChild(empty);
    return;
  }

  pts.forEach((p) => {
    const row = document.createElement('div');
    row.className = 'participant-item';

    const ava = document.createElement('div');
    ava.className = 'participant-avatar';
    if (p.avatarUrl) {
      const img = document.createElement('img');
      img.src       = p.avatarUrl;
      img.alt       = '';
      img.className = 'participant-avatar-img';
      img.onerror   = () => img.replaceWith(makeParticipantInitial(p.username));
      ava.appendChild(img);
    } else {
      ava.appendChild(makeParticipantInitial(p.username));
    }

    const name = document.createElement('span');
    name.className   = 'participant-username';
    name.textContent = '@' + p.username;

    const del = document.createElement('button');
    del.className = 'participant-delete';
    del.title     = 'Удалить';
    del.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`;
    del.addEventListener('click', async () => {
      const ok = await confirmDialog(`Удалить участника @${p.username}?`);
      if (ok) deleteParticipant(link.id, p.username);
    });

    row.appendChild(ava);
    row.appendChild(name);
    row.appendChild(del);
    list.appendChild(row);
  });
}

export async function addParticipant(linkId, username) {
  const clean = username.replace(/^@/, '').trim();
  if (!clean) return;

  const btn   = document.getElementById('btnAddParticipant');
  const input = document.getElementById('participantInput');
  btn.disabled = true;
  btn.classList.add('loading');

  const avatarUrl = await fetchTelegramAvatar(clean);
  const newP = { username: clean, avatarUrl, cachedAt: Date.now() };

  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const links = (result[STORAGE_KEY] || []).map((l) => {
      if (l.id !== linkId) return l;
      const existing = getParticipants(l).filter((p) => p.username !== clean);
      return { ...l, participants: [...existing, newP] };
    });
    saveLinks(links, () => {
      btn.disabled = false;
      btn.classList.remove('loading');
      input.value = '';
      const updated = state.cachedLinks.find((l) => l.id === linkId);
      if (updated) {
        renderParticipantsList(updated);
        setProfileAvatar(updated);
      }
      applySearch();
    });
  });
}

export async function refreshAllAvatars(linkId, avaEl) {
  const link = state.cachedLinks.find((l) => l.id === linkId);
  if (!link) return;
  const pts = getParticipants(link);
  if (!pts.length) return;

  if (avaEl) avaEl.classList.add('loading');

  const refreshed = await Promise.all(
    pts.map(async (p) => {
      const avatarUrl = await fetchTelegramAvatar(p.username);
      return { ...p, avatarUrl, cachedAt: Date.now() };
    })
  );

  const links = state.cachedLinks.map((l) =>
    l.id === linkId ? { ...l, participants: refreshed } : l
  );
  saveLinks(links, () => {
    if (avaEl) avaEl.classList.remove('loading');
    const updated = state.cachedLinks.find((l) => l.id === linkId);
    if (updated) {
      if (state.currentProfileId === linkId)      setProfileAvatar(updated);
      if (state.currentParticipantsId === linkId) renderParticipantsList(updated);
    }
    applySearch(); // re-renders card list with fresh collages
  });
}

export function deleteParticipant(linkId, username) {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const links = (result[STORAGE_KEY] || []).map((l) => {
      if (l.id !== linkId) return l;
      return { ...l, participants: getParticipants(l).filter((p) => p.username !== username) };
    });
    saveLinks(links, () => {
      const updated = state.cachedLinks.find((l) => l.id === linkId);
      if (updated) {
        renderParticipantsList(updated);
        setProfileAvatar(updated);
      }
      applySearch();
    });
  });
}

export async function refreshStaleAvatars(linkId) {
  const link = state.cachedLinks.find((l) => l.id === linkId);
  if (!link) return;
  const pts   = getParticipants(link);
  const stale = pts.filter((p) => Date.now() - p.cachedAt > AVATAR_TTL);
  if (!stale.length) return;

  const refreshed = await Promise.all(
    pts.map(async (p) => {
      if (Date.now() - p.cachedAt <= AVATAR_TTL) return p;
      const avatarUrl = await fetchTelegramAvatar(p.username);
      return { ...p, avatarUrl: avatarUrl ?? p.avatarUrl, cachedAt: Date.now() };
    })
  );

  const links = state.cachedLinks.map((l) =>
    l.id === linkId ? { ...l, participants: refreshed } : l
  );
  saveLinks(links, () => {
    const updated = state.cachedLinks.find((l) => l.id === linkId);
    if (updated && state.currentParticipantsId === linkId) {
      renderParticipantsList(updated);
    }
  });
}

export function openParticipantsView(link) {
  state.currentParticipantsId = link.id;
  document.getElementById('participantInput').value = '';
  renderParticipantsList(link);
  showView('viewParticipants', 'forward');
  refreshStaleAvatars(link.id);
}
