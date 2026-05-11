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
   git clone https://github.com/aleksandre-zaccone/1stTab.git
   ```
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the cloned folder
5. Open a new tab — 1stTab should now greet you

## Branching & Deployment

```
feature/my-feature
       │
       ▼
     test        ← staging / QA branch
       │
       ▼
     main        ← triggers pipeline automatically
```

### Branch rules

| Branch | Purpose |
|---|---|
| `feature/*` | Individual feature or fix work |
| `test` | Staging — merge features here for QA before release |
| `main` | Production — merging here triggers publish to Chrome Web Store |

### Release flow

1. Create a feature branch off `test`:
   ```bash
   git checkout test && git pull
   git checkout -b feature/my-feature
   ```
2. Do your work, push, and open a PR **into `test`**
3. Verify the feature on the unpacked extension loaded from your local clone
4. When ready to release, open a PR **from `test` into `main`**
5. Merging into `main` automatically:
   - Bumps the patch version in `manifest.json` (e.g. `1.0.1 → 1.0.2`)
   - Builds `1stTab.zip` via `build.sh`
   - Uploads and submits to the Chrome Web Store for review
   - Commits the version bump back to `main` with `[skip ci]`

### Build locally

```bash
npm install
bash build.sh
# produces 1stTab.zip ready for manual upload if needed
```

## Project structure

```
.
├── manifest.json        # Chrome extension manifest (version is auto-bumped on release)
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
├── privacy.html         # Privacy Policy page
├── terms.html           # Terms of Service page
├── build.sh             # Production build script
└── icons/               # 16/48/128 px extension icons
```

## Tech notes

- React 18 + Babel-standalone (no build step in dev). Production build pre-compiles JSX via esbuild.
- Manifest V3

## License

MIT — see [`LICENSE`](./LICENSE) for details.
