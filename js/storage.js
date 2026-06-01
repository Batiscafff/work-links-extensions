import { state, STORAGE_KEY } from './state.js';

export function saveLinks(links, callback) {
  chrome.storage.local.set({ [STORAGE_KEY]: links }, () => {
    state.cachedLinks = links;
    if (callback) callback(links);
  });
}

export function loadLinks(callback) {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    state.cachedLinks = result[STORAGE_KEY] || [];
    if (callback) callback(state.cachedLinks);
  });
}

export function deleteLink(id, callback) {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const links = (result[STORAGE_KEY] || []).filter((l) => l.id !== id);
    saveLinks(links, callback);
  });
}

export function validateUrl(url) {
  return url.startsWith('https://meet.google.com/');
}
