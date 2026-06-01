export const AVATAR_COLORS = [
  '#1a73e8', '#00897b', '#e8710a', '#8430ce',
  '#1e8e3e', '#d93025', '#0b57d0', '#b06000',
];

export function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function initials(name) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2);
  return words[0][0] + words[1][0];
}

export function makeIconBtn(cls, title, svgInner) {
  const btn = document.createElement('button');
  btn.className = cls;
  btn.title = title;
  btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none">${svgInner}</svg>`;
  return btn;
}

export function formatNoteDate(ts) {
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
