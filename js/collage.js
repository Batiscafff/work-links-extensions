import { avatarColor, initials } from './utils.js';

export function makeCollageSlot(participant) {
  if (participant.avatarUrl) {
    const img = document.createElement('img');
    img.className = 'collage-cell';
    img.src = participant.avatarUrl;
    img.alt = '';
    img.onerror = function () {
      const div = document.createElement('div');
      div.className        = 'collage-cell collage-initials';
      div.style.gridRow    = this.style.gridRow;
      div.style.gridColumn = this.style.gridColumn;
      div.style.background = avatarColor(participant.username);
      div.textContent      = (participant.username[0] || '?').toUpperCase();
      this.replaceWith(div);
    };
    return img;
  }
  const div = document.createElement('div');
  div.className    = 'collage-cell collage-initials';
  div.style.background = avatarColor(participant.username);
  div.textContent  = (participant.username[0] || '?').toUpperCase();
  return div;
}

export function applyCollage(el, pts) {
  el.innerHTML    = '';
  el.textContent  = '';
  el.style.background = 'var(--border)';
  el.style.display    = 'grid';
  el.style.gap        = '1px';

  if (pts.length === 1) {
    el.style.gridTemplateColumns = '1fr';
    el.style.gridTemplateRows    = '1fr';
  } else if (pts.length === 2) {
    el.style.gridTemplateColumns = '1fr 1fr';
    el.style.gridTemplateRows    = '1fr';
  } else {
    el.style.gridTemplateColumns = '1fr 1fr';
    el.style.gridTemplateRows    = '1fr 1fr';
  }

  pts.forEach((p, i) => {
    const slot = makeCollageSlot(p);
    if (pts.length === 3 && i === 0) slot.style.gridRow = '1 / span 2';
    el.appendChild(slot);
  });
}

export function setAvatarEl(el, link) {
  const pts = (Array.isArray(link.participants) ? link.participants : []).slice(0, 4);
  if (pts.length) {
    applyCollage(el, pts);
  } else {
    el.innerHTML = '';
    el.style.display             = '';
    el.style.gap                 = '';
    el.style.gridTemplateColumns = '';
    el.style.gridTemplateRows    = '';
    el.style.background          = avatarColor(link.name);
    el.textContent               = initials(link.name);
  }
}
