# Meet Links

A Chrome extension for managing Google Meet conference links. Keep all your recurring meetings in one place and join them in one click.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen)

## Features

- **Save conferences** — store a name and Google Meet URL for each recurring meeting
- **Quick open** — open a meeting in the current tab or a new tab directly from the popup
- **Conference profile** — click any card to open a detail view with action buttons
- **Participants** — attach Telegram usernames to a conference; avatars are fetched automatically from public profiles and displayed as a collage (up to 4), cached for one week
- **Notes** — add multiple timestamped notes to each conference; sort by newest or oldest, search notes by text, delete individually
- **Edit & delete** — update or remove any entry at any time
- **Search** — filter conferences by name in real time
- **Dark / light theme** — toggle with a single click, preference is saved
- **Persistent storage** — all data survives browser restarts via `chrome.storage.local`

## Installation

No build step required — load the extension directly from the source folder.

1. Clone or download this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the repository folder
5. The Meet Links icon will appear in your toolbar

To apply changes after editing source files, click the **↺ reload** button on the extensions page.

## Usage

| Action | How |
|---|---|
| Add a conference | Click **+** in the header → fill in name and Meet URL → **Add** |
| Open profile | Click anywhere on a card (name / avatar area) |
| Open in current tab | Click **→** on a card or **Эта вкладка** in the profile |
| Open in new tab | Click **↗** on a card or **Новая вкладка** in the profile |
| Edit | Click the **pencil** icon on a card or in the profile header |
| Delete | Click the **trash** icon on a card |
| Manage participants | Open profile → click the **person** icon → add @username → avatar is fetched automatically |
| Remove a participant | Open participants view → click **✕** next to a username |
| Add a note | Open profile → type in the notes field → **Добавить** or **Ctrl+Enter** |
| Delete a note | Open profile → click **✕** on a note card |
| Search notes | Open profile → click the **magnifying glass** in the notes toolbar → type to filter → **Esc** to close |
| Sort notes | Open profile → click the **sort** icon in the notes toolbar to toggle newest/oldest first |
| Search conferences | Click the **magnifying glass** in the main header → type to filter by name → **Esc** to close |
| Toggle theme | Click the **moon / sun** icon in the header |

## Project Structure

```
├── manifest.json          # Extension manifest (MV3)
├── popup.html             # Single HTML entry point — all views
├── popup.css              # All styles with CSS custom properties for theming
├── popup.js               # Entry point — DOMContentLoaded, event listeners, wires modules
├── js/
│   ├── state.js           # Shared mutable state object + constants
│   ├── storage.js         # chrome.storage helpers: saveLinks, loadLinks, deleteLink
│   ├── views.js           # showView — CSS animation view switcher
│   ├── theme.js           # loadTheme, applyTheme, toggleTheme
│   ├── utils.js           # Pure helpers: avatarColor, initials, makeIconBtn, formatNoteDate
│   ├── collage.js         # Avatar collage: makeCollageSlot, applyCollage, setAvatarEl
│   ├── notes.js           # Notes CRUD, renderNotes, toggleNotesSort, toggleNotesSearch
│   ├── profile.js         # openProfileView
│   ├── cards.js           # createCard, renderList, search (applySearch, toggleSearch)
│   ├── editor.js          # openEditView, resetAddForm, saveLink
│   └── participants.js    # Participants CRUD, avatar fetch, renderParticipantsList
└── icons/
    ├── logo.png           # Original logo source
    ├── logo_cropped.png   # Square crop used in popup header
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Permissions

| Permission | Reason |
|---|---|
| `storage` | Save conference links and theme preference locally |
| `tabs` | Open a meeting URL in the current active tab |
| `host_permissions: https://t.me/*` | Fetch participant profile photos from Telegram public pages |
