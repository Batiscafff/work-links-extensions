export const STORAGE_KEY = 'meetLinks';
export const THEME_KEY   = 'theme';
export const AVATAR_TTL  = 24 * 60 * 60 * 1000;

export const state = {
  cachedLinks:           [],
  currentProfileId:      null,
  currentParticipantsId: null,
  currentEditId:         null,
  currentEditReturn:     'viewList',
  notesSortOrder:        'desc',
  notesSearchQuery:      '',
};
