# Meet Links

A Chrome extension for managing Google Meet conference links. Keep all your recurring meetings in one place and join them in one click.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen)

## Features

- **Save conferences** — store a name and Google Meet URL for each recurring meeting
- **Quick open** — open a meeting in the current tab or a new tab directly from the popup
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
| Open in current tab | Click **→** on a card |
| Open in new tab | Click **↗** on a card |
| Edit | Click the **pencil** icon → change fields → **Apply** |
| Delete | Click the **trash** icon on a card |
| Search | Click the **magnifying glass** → type to filter by name → **Esc** to close |
| Toggle theme | Click the **moon / sun** icon in the header |

## Project Structure

```
├── manifest.json       # Extension manifest (MV3)
├── popup.html          # Single HTML entry point (two views)
├── popup.css           # All styles with CSS custom properties for theming
├── popup.js            # All logic — storage, rendering, search, view switching
└── icons/
    ├── logo.png        # Original logo source
    ├── logo_cropped.png  # Square crop used in popup header
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Permissions

| Permission | Reason |
|---|---|
| `storage` | Save conference links and theme preference locally |
| `tabs` | Open a meeting URL in the current active tab |
