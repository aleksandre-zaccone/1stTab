# 1stTab

A new-tab dashboard for Chrome with bookmarks, world clocks, weather, and a split personality: clean Material Light/Dark for everyday work, and a CRT-flavored Arcade mode with six retro cabinet themes when you want your browser to feel like a 1985 game room.

> Part of the **1st** product family by Ablotia.

## Features

- **New-tab override** with a 3-column layout: clocks · bookmarks · weather
- **Bookmark manager** — folders, pinning, visit tracking, tags, descriptions
- **World clocks** — up to three time zones at a glance
- **Weather panel** — °F / °C toggle, editable city
- **Search bar** — type a query for Google search, paste a URL to open directly
- **Themes**
  - Material Light
  - Material Dark
  - Arcade — six cabinet styles: Synthwave, Pac-Maze, Game Boy, Galaga, Tron, Hot Lava
- **Custom backgrounds** — upload your own or pick from built-in patterns (solid, glow, grid, floor, dots)
- **CRT scanlines + vignette** in arcade mode
- **Local-only storage** — nothing leaves your browser (cloud sync coming in Plus tier)

## Install (development)

1. Clone this repo:
   ```bash
   git clone https://github.com/<your-username>/1st-tab.git
   ```
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the cloned folder
5. Open a new tab — 1stTab should now greet you

## Project structure

```
.
├── manifest.json        # Chrome extension manifest
├── newtab.html          # New-tab override entry point
├── dashboard.css        # All styles (themes, layout, components)
├── app.jsx              # App shell, settings, root render
├── data.jsx             # Storage layer, defaults, hooks
├── icons.jsx            # Inline SVG icon set
├── clocks.jsx           # World clocks panel
├── weather.jsx          # Weather panel
├── bookmarks.jsx        # Bookmarks hero / grid / folder rail
├── tweaks-panel.jsx     # In-page tweaks panel components
├── manager.html         # Bookmarks manager standalone page
├── manager.jsx          # Manager-page entry
├── manager-app.jsx      # Manager UI (search, edit dialogs, bulk ops)
└── icons/               # 16/48/128 px extension icons
```

## Roadmap

See [`RECOMMENDATIONS.md`](./RECOMMENDATIONS.md) for the full competitive analysis and feature roadmap, including:

- Manifest V3 migration
- Real weather (Open-Meteo)
- Cross-device sync (`chrome.storage.sync` + cloud backend)
- Quick links speed dial, todos, notes, daily quotes, font picker
- Draggable grid layout
- **1stTab Plus** — paid tier with premium themes, integrations (Calendar, Todoist, Spotify, Linear), focus mode, AI notes, profiles, and side panel

## Tech notes

- Currently Manifest V2 — V3 migration is the next priority
- React 18 + Babel-standalone (no build step in dev). Production build will pre-compile JSX to remove `unsafe-eval` from CSP.

## License

TBD — defaulting to "all rights reserved" until a license decision is made.
