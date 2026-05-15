# 1stTab — Phase 4 Feature Plan
## Free vs. Plus Tier Breakdown

> Updated: 2026-05-14 · Branch: release/v3

---

## Summary Table

| Feature | Free | Plus |
|---|---|---|
| **Sync & Storage** | | |
| Settings sync (chrome.storage.sync) | ✓ | ✓ |
| Todo + Notes sync | ✓ | ✓ |
| Quick Links sync | ✓ | ✓ |
| Full bookmark sync (Google Drive) | — | ✓ |
| Google Drive backup / restore | — | ✓ |
| Auto-backup | — | ✓ |
| **Dashboard** | | |
| Draggable widget grid | ✓ | ✓ |
| Global search (bookmarks, notes, links) | ✓ | ✓ |
| Focus Mode (hide all, show clock + quote) | ✓ | ✓ |
| Custom greeting templates | ✓ | ✓ |
| Custom backgrounds | 1 upload | Unlimited + gallery |
| **Widgets** | | |
| Widget Manager (on/off + configure) | ✓ | ✓ |
| Crypto price ticker | ✓ | ✓ |
| FX / Currency rates | ✓ | ✓ |
| Pomodoro / Focus Timer | ✓ | ✓ |
| Browser history | ✓ | ✓ |
| Stock quotes | — | ✓ |
| Analog clock faces | — | ✓ |
| **Limits** | | |
| World clocks | 3 | Unlimited |
| To-do lists | 1 list, 25 items | Unlimited |
| Notes | 1 note, 2 000 chars | Unlimited |
| Arcade themes | All 6 | All 6 + premium |
| **Side Panel** | | |
| Tab Management | ✓ | ✓ |
| System Monitor (CPU, RAM, Storage) | ✓ | ✓ |
| Section collapse + reorder | ✓ | ✓ |
| Chrome theme / system color matching | ✓ | ✓ |
| Left / right panel positioning (detach) | ✓ | ✓ |
| Keyboard shortcut (Alt+Shift+P) | ✓ | ✓ |
| Google Calendar | — | ✓ |
| Google Tasks | — | ✓ |
| **AI** | | |
| AI Bookmark Assistant (Claude API) | — | ✓ |
| Smart Bookmark Tagging (AI) | — | ✓ |
| **Appearance** | | |
| Custom CSS editor | — | ✓ |
| Multi-profile (Work / Personal / Gaming) | — | ✓ |
| **Phase 5 (Future)** | | |
| RSS / News feed | 1 feed | Unlimited |
| Habit Tracker | 3 habits | Unlimited |
| CPU temperature (native helper) | — | ✓ |

---

---

# FREE TIER

Everything below ships in the free extension — no account, no payment required.

---

## F1. Dashboard

### Draggable Widget Grid
Replace the fixed 3-column layout with a drag-and-drop CSS grid. Users can move Clocks, Weather, Bookmarks, Todo, Notes, and Finance widgets to any position. Layout saved in `prefs.layout`.

**Implementation:** CSS Grid + native HTML5 drag events (no library). Store a `gridArea` map per widget ID.

**Why it matters:** The biggest UX complaint about new-tab dashboards is rigidity. This turns 1stTab from a "view" into a personal workspace.

### Global Search
A full-text search bar in the topbar that searches across all bookmarks, folders, notes, and quick links simultaneously. Results appear as a dropdown with keyboard navigation (`↑ ↓ Enter`).

**Implementation:** Client-side linear scan (bookmark counts stay under 1 000 for 99% of users — no library needed). Highlight matched terms in results.

### Focus Mode
One keypress (`F`) hides everything except the current time and a motivational quote. All widgets, bookmarks, and the topbar collapse. A second press restores everything.

**Implementation:** `document.documentElement.classList.toggle('focus-mode')` + CSS rules scoped to that class.

### Custom Greeting Templates
Users write their own greeting strings with variables: `{name}`, `{time}`, `{day}`, `{weather}`. Multiple greetings cycle randomly on each new tab.

**Example:** `"Ready to build, {name}? It's {day}."` or `"☀️ {weather} — good {time}, {name}."`

---

## F2. Sync & Storage

### Settings Sync (`chrome.storage.sync`)
Preferences (theme, font, name, weather city, world clocks, search engine) automatically follow the user across all Chrome instances signed in to the same Google account. No sign-in required beyond being logged into Chrome.

**Limit:** 100 KB total / 8 KB per item — sufficient for all preferences.

### Todo & Notes Sync
Todos (capped at 25 items) and Notes (capped at 2 000 characters) fit inside the sync quota. Both sync automatically with zero user action.

### Quick Links Sync
Visit frequency data for the Speed Dial widget syncs so the same top sites appear on all devices.

### Conflict Resolution
For all synced keys: compare `updatedAt` timestamps — most recent write wins. Todos use merge-by-ID with 7-day soft-delete tombstones to prevent ghost reappearances after a device comes back online.

---

## F3. Widgets (Free)

### Widget Manager
A **Widgets** tab in Settings with an on/off toggle and inline Configure panel for every widget. State stored in `prefs.widgets` and synced.

### Crypto Price Ticker
Live prices and 24h % change for user-selected coins (BTC, ETH, SOL, BNB, XRP + any CoinGecko coin ID).

**API:** CoinGecko `simple/price` — free, no API key, ~30 req/min limit.
**Refresh:** Every 60 seconds (configurable).

### FX / Currency Rates
Live exchange rates between a user-selected base currency and up to 6 target currencies.

**API:** open.er-api.com — free, no API key, 1 500 req/month.
**Refresh:** Every hour.

### Pomodoro / Focus Timer
Configurable work/break countdown. Soft chime (Web Audio API) on cycle end. Session history stored locally.

**Note:** Moved from Plus to Free — timers are baseline productivity that competitors like Momentum give away free. The Plus differentiation comes from AI coaching and cross-device streak sync.

### Browser History Widget
Compact list of the last 10 visited sites with favicons, titles, and timestamps.

**API:** `chrome.history.search` — no external request.
**Permission required:** `history`.

---

## F4. Side Panel (Free)

### Tab Management
A **Tabs** section in the panel with:
- Live tab list grouped by window (updates instantly)
- Click to switch, close, mute/unmute, pin/unpin
- Search/filter by title or URL
- Tab groups (color + label)
- Recently closed (last 10)

**New permissions:** `tabs`, `sessions`, `tabGroups`.

### System Monitor
CPU usage %, RAM used/total bar, and storage drives at the bottom of the panel. Refreshes every 2 seconds.

**New permissions:** `system.cpu`, `system.memory`, `system.storage`.

### Section Collapse & Reorder
Each panel section gets a collapse toggle. Users drag sections to reorder. Both states saved in `prefs.panelLayout`.

**Implementation:** CSS `details`/`summary` for collapse; native drag events for reorder.

### Chrome Theme / System Color Matching
Panel respects `prefers-color-scheme` and uses CSS system color keywords (`Canvas`, `CanvasText`) to blend with the user's OS and Chrome theme without the Chrome theme API.

A **"Match Chrome theme"** toggle in Settings switches between system-matched and the current Arcade/Material theme.

### Left / Right Positioning (Detach)
A **Detach** button opens the panel as a standalone popup window (`chrome.windows.create`). The user can drag it to the left side. Chrome remembers position.

**Setting:** `prefs.panelPosition: 'right' | 'detached'`

### Keyboard Shortcut
`Alt+Shift+P` opens or closes the panel. Configurable in Chrome's native keyboard shortcuts UI (`chrome://extensions/shortcuts`).

---

## F5. Limits in Free Tier

| Item | Free limit | Why |
|---|---|---|
| World clocks | 3 | Matches the 3-column layout |
| To-do lists | 1 list, 25 items | Fits in sync quota |
| Notes | 1 note, 2 000 chars | Fits in sync quota |
| Custom backgrounds | 1 upload | localStorage size |
| Arcade themes | All 6 existing | No artificial lock on what's already built |

---

---

# PLUS TIER

Everything below requires an active Plus subscription. All Plus code is gated behind a single helper:

```js
function isPlusUser() {
  return loadJSON('1stTab.plus', { active: false }).active === true;
}

function requirePlus(featureName, callback) {
  if (isPlusUser()) { callback(); return; }
  showUpgradeModal(featureName); // links to 1sttab.com/upgrade
}
```

---

## P1. Sync & Backup (Plus)

### Full Bookmark Sync
Bookmarks can exceed the 100 KB `chrome.storage.sync` limit so they require cloud storage. Full sync writes to Google Drive AppData.

**Free alternative:** Bookmarks stay on-device; JSON export/import always available.

### Google Drive Backup
Full snapshot of all 1stTab data (bookmarks, settings, todos, notes, quick links, custom backgrounds) stored as JSON in the user's Google Drive **AppData folder** (hidden from normal Drive view).

**Flow:**
1. Settings → Backup & Restore → "Back up now"
2. One-time Google sign-in via `chrome.identity`
3. Data uploaded to Drive AppData
4. Last 5 backups retained; oldest auto-pruned

### Google Drive Restore
List of last 5 backups (date, size, source device). Select one → confirm → data overwritten → extension reloads.

### Auto-Backup
Options: Off (default) · On first open each day · Every new tab open (max 1/day). Runs silently in the background service worker.

---

## P2. Google Workspace (Plus)

### Google Calendar in Panel
Today's and next 3 days' events from the user's primary Google Calendar, grouped by day. Click an event to open it in Google Calendar. "Add event" opens the new-event page.

**API:** Google Calendar API v3 (`calendar.readonly` scope)
**Auth:** `chrome.identity.getAuthToken` (shared OAuth flow with Drive and Tasks)
**Refresh:** Every 15 minutes, or on panel open.

**Why Plus?** Google Calendar API has per-project quotas that cost money at scale.

### Google Tasks in Panel
Active tasks with checkboxes. Check off in the panel → marked complete in Google Tasks. Add new tasks inline.

**API:** Google Tasks API v1 (`tasks` scope — read + write)
**Auth:** Same OAuth token as Calendar (scopes requested together at first auth)

**Why Plus?** Same quota reasoning as Calendar.

---

## P3. AI Features (Plus)

### AI Bookmark Assistant
An in-panel chat input for querying saved bookmarks in plain English:

- *"Find me that article about React performance"*
- *"What did I save about vacation spots?"*
- *"Summarize my 'Work' folder bookmarks"*

**Implementation:** User provides their own Claude API key (stored in `chrome.storage.local`, never leaves the device). Bookmark metadata (name, URL, description, tags) is sent as context. Page content is never sent.

**Why Plus?** The API key requirement is a natural gate. Plus users are power users already paying for AI services.

### Smart Bookmark Tagging
When a user adds or edits a bookmark, 1stTab suggests 3 tags based on the URL domain and title. One-click to accept all, or pick individually.

**Implementation:** Single Claude API call on bookmark save. Debounced, clearly opt-in. Requires Plus and a Claude API key.

---

## P4. Power Features (Plus)

### Multi-Profile Support
Work / Personal / Gaming profiles — each with their own bookmarks, theme, widgets, and panel layout. Switch via a profile chip in the topbar.

**Implementation:** Separate storage namespace per profile (`1stTab.profiles.{id}.*`). Profile switcher stores `1stTab.activeProfile`.

### Custom CSS Editor
A code editor textarea in Settings → Appearance. CSS is injected as a `<style>` tag on every new-tab load. Full control over colors, fonts, spacing, and layout.

**Implementation:** `<textarea>` saved to `prefs.customCSS`, injected via a `<style id="user-css">` tag.

### Unlimited Custom Backgrounds + Gallery
Lift the 1-upload cap. Plus users can upload as many backgrounds as their browser storage allows, and access a curated gallery of 15–20 high-quality wallpapers bundled in the extension (no external fetch needed).

### Stock Quotes Widget
Live bid/ask prices and daily % change for user-specified ticker symbols (AAPL, TSLA, MSFT, etc.).

**API:** Finnhub — user supplies their own free API key in Settings.
**Why Plus?** Stock data APIs are commercially restricted. Gating behind Plus encourages users to use their own key or justifies the cost of a paid data plan.
**Refresh:** Every 5 minutes during market hours.

### Analog Clock Faces
Replaces or supplements the digital time display. Three SVG faces: minimal, retro, pixel (matches Arcade theme).

---

## P5. Limits in Plus Tier

| Item | Plus |
|---|---|
| World clocks | Unlimited |
| To-do lists | Unlimited lists, unlimited items |
| Notes | Unlimited notes, unlimited length |
| Custom backgrounds | Unlimited uploads + gallery |
| Arcade themes | All 6 existing + future premium themes |

---

---

# FUTURE (Phase 5)

Not in scope for Phase 4. Noted here for roadmap continuity.

### RSS / News Feed Widget
User-supplied RSS URL → parsed client-side → headline list. Free: 1 feed. Plus: unlimited feeds + multi-column layout.

### Habit Tracker Widget
Daily checkbox streaks with calendar heatmap. Free: 3 habits. Plus: unlimited + weekly/monthly charts.

### Native Messaging Host
A small local binary (distributed as an installer) communicating with the extension via `chrome.runtime.connectNative`. Unlocks:
- CPU/GPU temperature
- Fan speed
- System notifications
- File system access

**Strong differentiator** — no new-tab extension does this today. Plus-only.

### AI Daily Briefing
On first new tab of the day, a Claude API call summarizes: calendar events, open tasks, top bookmarks accessed recently, and (if RSS is configured) top headlines. Shown as a collapsible card. Plus-only.

---

---

# Implementation Plans

## Free Tier — Sprint Plan

### Sprint 1 — Core UX (2–3 weeks)
1. **Draggable widget grid** — CSS Grid + native drag. `prefs.layout`.
2. **Global search** — Client-side full-text, instant dropdown.
3. **Focus Mode** — `classList.toggle('focus-mode')`, keyboard shortcut `F`.
4. **Custom greeting templates** — Variable substitution, multiple greetings, random cycle.

### Sprint 2 — Sync & Storage (2 weeks)
1. **Sync migration** — Move todos, notes, quick links, prefs to `chrome.storage.sync`.
2. **Conflict resolution** — `updatedAt` comparison, merge-by-ID for todos.
3. **Storage quota guard** — Warn at 80 KB, graceful fallback to local.

### Sprint 3 — Finance Widgets (1–2 weeks)
1. **Widget Manager** — On/off toggle + configure panel in Settings.
2. **Crypto ticker** — CoinGecko, 60s refresh, coin selector.
3. **FX rates** — open.er-api.com, hourly refresh, base currency selector.

### Sprint 4 — Panel v2 (2–3 weeks)
1. **Tab Management** — Live list, click to switch, close, mute, pin, search, tab groups.
2. **System Monitor** — CPU %, RAM bar, storage. 2s refresh.
3. **Section collapse + reorder** — `details`/`summary` + drag. Save to prefs.
4. **Theme matching** — `prefers-color-scheme` + system CSS colors.

### Sprint 5 — Polish (1 week)
1. **Browser history widget** — `chrome.history.search`, last 10 sites.
2. **Panel keyboard shortcut** — `Alt+Shift+P`.
3. **Pomodoro timer** — Work/break cycle, Web Audio chime, session log.

---

## Plus Tier — Sprint Plan

> Wire up the licensing system before starting any Plus sprint (see Publishing section below).

### Sprint 1 — Google Auth & Drive (3 weeks)
1. **`chrome.identity` OAuth** — Request `drive.appdata`, `calendar.readonly`, `tasks` scopes together.
2. **Token storage** — Access + refresh tokens in `chrome.storage.local`.
3. **Drive backup** — JSON serialization, upload, list, restore (last 5 backups).
4. **Auto-backup toggle** — Background service worker, max 1/day.

### Sprint 2 — Google Workspace Panel (2 weeks)
1. **Calendar section** — Events for today + 3 days, grouped by day.
2. **Tasks section** — Fetch tasks, check off inline, add task input.
3. **Auth error handling** — Token refresh, offline graceful fallback.

### Sprint 3 — AI Features (2 weeks)
1. **API key settings UI** — Settings → Plus → AI. Stored in `chrome.storage.local`.
2. **AI Bookmark Assistant** — Panel chat input, bookmark metadata as context, streamed response.
3. **Smart Bookmark Tagging** — Suggest 3 tags on save, one-click accept.

### Sprint 4 — Power Features (2 weeks)
1. **Multi-profile** — Profile switcher, separate storage namespaces.
2. **Custom CSS editor** — Textarea in Settings, `<style>` injection on load.
3. **Unlimited backgrounds + gallery** — Lift cap, bundle curated images.
4. **Stock quotes** — Finnhub, user API key, market-hours-aware.
5. **Analog clock faces** — SVG renderer, 3 styles.

### Sprint 5 — Full Bookmark Sync (1 week)
1. **Serialization** — Chunk large sets across multiple Drive AppData files.
2. **Incremental sync** — Upload diffs only (added/modified/deleted IDs).
3. **Conflict UI** — Show diff, let user choose which version wins.

---

---

# Publishing: Free vs. Pro

## The core question: one extension or two?

---

## Option A — Single Extension, Feature Gating ✓ Recommended

One Chrome Web Store listing. All users install the same `.crx`. Plus features unlock after license verification.

**How it works:**
1. User installs the extension (free)
2. User visits `1sttab.com/upgrade`, pays via Lemon Squeezy
3. Lemon Squeezy generates a license key, emails it to the user
4. User enters the key in Settings → Plus
5. Extension calls `POST https://api.1sttab.com/verify` with the key
6. Server returns `{ active: true, expiry: "2027-05-14" }`
7. Response cached in `chrome.storage.local` for 30 days (offline resilience)

**Pros:**
- Zero upgrade friction — users never reinstall
- One codebase, one review cycle, one listing
- Free users see tasteful "Upgrade" prompts inside the UI they already love
- Industry standard: Momentum, Grammarly, Vimium C all use this model
- A/B test upgrade prompts easily

**Cons:**
- Needs a small backend (a single Cloudflare Worker is enough — ~10 lines)
- Plus features live in the binary (cosmetic gates can be bypassed by a determined developer, acceptable for this audience)

**Bypass risk is low:** AI and Google Workspace features require server-side API keys and OAuth anyway. A bypass doesn't help without the user's own API key.

---

## Option B — Two Separate Extensions

Two listings: **1stTab** (free) and **1stTab Plus** (paid one-time via Chrome Web Store).

**Pros:** No backend needed. Clean separation.

**Cons:**
- Users must uninstall and reinstall to upgrade — the worst UX in extensions
- Manual data migration step (most users will lose data)
- Two codebases or a complex build system
- Two review cycles per release
- Split ratings and reviews — harder to build social proof
- Chrome Web Store one-time purchases not available in all regions

**Verdict:** Avoid. Only viable for a simple, server-free tool with no sync or AI roadmap.

---

## Option C — Free Extension + Paid Web App (Hybrid)

The extension is always free. A companion web app is the paid product communicating via `chrome.runtime.sendMessage`.

**Verdict:** Avoid. Adds enormous complexity for no UX gain over Option A.

---

## Decision Matrix

| Criterion | Option A (Single) | Option B (Two) | Option C (Hybrid) |
|---|---|---|---|
| Upgrade friction | None | High (reinstall) | Medium |
| Data continuity on upgrade | ✓ Automatic | ✗ Manual export/import | ✓ |
| Backend required | Minimal (1 Worker) | None | Yes (complex) |
| Codebase complexity | Low | High | Very high |
| Revenue model flexibility | Subscription + one-time | One-time only | Subscription |
| Industry precedent | Momentum, Grammarly | Rare | Very rare |
| **Recommendation** | **✓ Use this** | Avoid | Avoid |

---

## Licensing Stack (Minimal, $0/month to start)

```
User pays → Lemon Squeezy → webhook → Cloudflare Worker → chrome.storage.local
```

**Lemon Squeezy** handles billing, license keys, customer portal, VAT/tax globally.

**Cloudflare Worker** (free tier):
```js
export default {
  async fetch(request) {
    const { key } = await request.json();
    const res = await fetch(`https://api.lemonsqueezy.com/v1/licenses/validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${LS_API_KEY}` },
      body: JSON.stringify({ license_key: key }),
    });
    const data = await res.json();
    return Response.json({
      active: data.valid,
      expiry: data.license_key?.expires_at,
    });
  }
};
```

**Total infrastructure cost at 0–1 000 users: $0/month.**

---

## Pricing

| Plan | Price | Rationale |
|---|---|---|
| Free | $0 | Generous free tier drives installs and word of mouth |
| Plus Monthly | $3.99/mo | Under the "impulse buy" threshold |
| Plus Annual | $29.99/yr (~$2.50/mo) | ~37% discount, reduces churn |
| Lifetime | $79 one-time | Converts users who resist subscriptions |

**Comparable:** Momentum Plus $3.33/mo (annual) · Toby Pro $3/mo · 1stTab's AI features justify parity or a slight premium.

---

## Manifest Permissions for Phase 4

```json
"permissions": [
  "storage",
  "bookmarks",
  "sidePanel",
  "identity",
  "tabs",
  "sessions",
  "tabGroups",
  "system.cpu",
  "system.memory",
  "system.storage",
  "history"
],
"host_permissions": [
  "https://api.open-meteo.com/*",
  "https://geocoding-api.open-meteo.com/*",
  "https://www.google.com/s2/favicons*",
  "https://www.googleapis.com/*",
  "https://api.coingecko.com/*",
  "https://open.er-api.com/*",
  "https://finnhub.io/*",
  "https://api.anthropic.com/*",
  "https://api.1sttab.com/*"
]
```
