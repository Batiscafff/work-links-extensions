import { THEME_KEY } from './state.js';

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

export function loadTheme() {
  chrome.storage.local.get(THEME_KEY, (result) => {
    applyTheme(result[THEME_KEY] === 'dark', false);
  });
}

export function applyTheme(isDark, save = true) {
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

export function toggleTheme() {
  applyTheme(!document.body.classList.contains('dark'));
}
