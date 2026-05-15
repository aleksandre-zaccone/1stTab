# 1stTab — Phase 4 Feature Recommendations
# Free vs. Plus Tier Breakdown

> Updated: 2026-05-14
> Branch: release/v3
> Scope: Sync, Backup, Finance Widgets, Side Panel v2, Google Workspace integrations, AI features, monetization strategy

---

## How to read this document

Each feature is tagged:
- **[FREE]** — ships in the free tier, no account or payment required
- **[PLUS]** — requires a paid Plus subscription
- **[FUTURE]** — recommended for a later phase, not Phase 4

---

## 1. Cross-Device Sync

### [FREE] Settings sync via `chrome.storage.sync`
Preferences (theme, font, name, weather city, world clocks, search engine) automatically follow the user across all Chrome instances signed in to the same Google account. No sign-in required beyond being logged into Chrome.

**How it works:** `chrome.storage.sync` encrypts and replicates small key-value pairs via the user's existing Google account. Chrome handles the sync transport — the extension just reads and writes to the storage API.

**Limit:** 100 KB total / 8 KB per item. Sufficient for all preferences.

### [FREE] Todo & Notes sync
Todos (capped at 25 items) and Quick Notes (capped at 2 000 characters) are small enough to fit comfortably inside the 100 KB sync quota. Both will sync automatically with zero user action.

### [FREE] Quick Links visit counts sync
The visit frequency data used by the Speed Dial / Quick Links widget is synced so the same "top sites" appear on all devices.

### [PLUS] Full bookmark sync
Bookmark sets can exceed the 100 KB `chrome.storage.sync` limit. Full bookmark sync requires cloud storage (Google Drive AppData, see §2). Gated behind Plus to cover API and storage costs.

**Free alternative:** Bookmarks remain on the local device and can be exported/imported as JSON.

### [FREE] Conflict resolution — last-write-wins
For all synced keys, the extension compares `updatedAt` timestamps. The more recent write wins. Todos use a merge-by-ID strategy with 7-day soft-delete tombstones to prevent ghost reappearances.

---

## 2. Google Drive Backup & Restore

### [PLUS] Manual backup to Google Drive
Users can take a full snapshot of all their 1stTab data (bookmarks, settings, todos, notes, quick links, custom backgrounds) and store it as a JSON file in their Google Drive **AppData folder** (hidden from their normal Drive view).

**Why Plus?** Requires Google OAuth (`chrome.identity`) and Google Drive API access — both have usage quotas that scale with user count.

**Flow:**
1. Click "Back up now" in Settings → Backup & Restore.
2. One-time Google sign-in prompt (uses the same account as Chrome).
3. Data serialized to JSON and uploaded to Drive AppData.
4. Last 5 backups retained; oldest auto-pruned.

### [PLUS] Restore from Google Drive backup
Users see a list of their last 5 backups (date, size, source device). Selecting one and confirming overwrites current data and reloads the extension.

### [PLUS] Auto-backup
Options: Off (default), On first open each day, or Every time a new tab opens (max 1/day). Runs silently in the background service worker.

**Recommendation:** Default to Off to avoid surprising users with unexpected OAuth prompts on first install.

---

## 3. Finance Widgets

### [FREE] Crypto price ticker
Displays live prices and 24-hour % change for user-selected coins (BTC, ETH, SOL, BNB, XRP, and any custom CoinGecko coin ID).

**API:** CoinGecko `simple/price` — free, no API key, rate-limited to ~30 req/min.
**Refresh:** Every 60 seconds (configurable).
**Why free?** CoinGecko's free tier is generous enough for a single-user extension.

### [FREE] FX / Currency rates
Displays live exchange rates between a user-selected base currency and up to 6 target currencies. Supports all major fiat currencies.

**API:** open.er-api.com — free, no API key, 1 500 requests/month (daily refresh easily fits).
**Refresh:** Every hour.

### [PLUS] Stock quotes
Displays live bid/ask prices and daily % change for user-specified ticker symbols (e.g. AAPL, TSLA, MSFT).

**API:** Finnhub — free tier requires a personal API key. Users supply their own key in Settings.
**Why Plus?** Stock market data APIs are commercially restricted. Gating behind Plus encourages users to supply their own key or justifies the cost of a paid data plan.
**Refresh:** Every 5 minutes during market hours.

### [FREE] Widget Manager (enable / disable / configure)
A dedicated **Widgets tab** in Settings lists every widget with an on/off toggle and an inline Configure panel. Widget state is stored in `prefs.widgets` (synced across devices for free-tier users).

---

## 4. Side Panel Enhancements

### [FREE] Chrome theme / system color matching
The panel respects `prefers-color-scheme` and uses CSS system color keywords so it blends with the user's OS and Chrome theme without needing the Chrome theme API.

### [FREE] Left / Right panel positioning
A **"Detach"** button opens the panel as a standalone popup window (`chrome.windows.create`). The user can drag it to the left side of their screen.

### [FREE] Tab Management
A **Tabs** section in the panel lists all open tabs grouped by window with click-to-switch, close, mute/unmute, pin/unpin, search/filter, tab groups, and recently closed.

**New permissions required:** `tabs`, `sessions`, `tabGroups`.

### [FREE] System Monitor
CPU usage %, RAM used/total, and storage drives shown at the bottom of the panel. Refreshes every 2 seconds.

**New permissions required:** `system.cpu`, `system.memory`, `system.storage`.

### [PLUS] Google Calendar in panel
Today's and next 3 days' events from the user's primary Google Calendar.

### [PLUS] Google Tasks in panel
Active tasks with checkboxes, add/complete/delete inline. Two-way sync with Google Tasks.

### [FREE] Panel section collapse / reorder
Each panel section gets a collapse toggle and drag-to-reorder. Order saved in `prefs`.

---

## 5. Additional Recommendations

### [FREE] Pomodoro / Focus Timer
A configurable work/break countdown timer. Plays a soft chime on cycle end. Session history stored locally.

**Update from previous plan:** Moving to Free — timers are a baseline productivity feature that competitors like Momentum offer free. The differentiation is in the Plus tier's AI coaching and streak analytics.

### [PLUS] Analog clock faces
Multiple faces: simple, retro, pixel. Matches the Arcade theme.

### [FREE] Keyboard shortcut to open/close panel
`Alt+Shift+P` (configurable in Chrome's keyboard shortcuts UI).

### [PLUS] Multi-profile support
Work / Personal / Gaming profiles, each with their own bookmarks, theme, widgets, and panel layout.

---

## 6. New Recommended Features (Phase 4 Additions)

### [FREE] Draggable widget grid on main dashboard
Replace the fixed 3-column layout with a drag-and-drop grid. Users can move Clocks, Weather, Bookmarks, Todo, Notes, Finance widgets to any position. Layout saved in `prefs.layout`.

**Implementation:** CSS Grid + native HTML5 drag events (no library needed). Store a `gridArea` map per widget ID.

**Why important:** The biggest UX complaint about new-tab dashboards is rigidity. This turns 1stTab from a "view" into a workspace.

### [FREE] Bookmark search (global, instant)
A full-text search bar in the topbar that searches across all bookmarks, folders, notes, and quick links simultaneously. Results shown as a dropdown with keyboard navigation.

**Implementation:** Client-side Trie or simple linear scan (bookmark counts stay under 1 000 for 99% of users — no library needed).

### [FREE] Browser history widget
A compact panel section showing the last 10 visited sites with favicons, titles, and timestamps.

**API:** `chrome.history.search` — no external network request.
**Permission required:** `history`.

### [PLUS] AI Bookmark Assistant (Claude API)
An in-panel chat input that lets users ask questions about their saved bookmarks:
- "Find me that article about React performance"
- "What did I save about vacation spots?"
- "Summarize the description of my 'Work' bookmarks"

**Implementation:** Send bookmark metadata (name, URL, description, tags) as context to Claude API. User provides their own API key (stored in `prefs`, never leaves the device).

**Why Plus?** API key requirement is a natural gate. Plus users are power users who already pay for AI services.

**Privacy note:** Only metadata is sent, never page content. Clearly disclosed in the UI.

### [PLUS] Smart Bookmark Tagging (AI)
When a user adds a new bookmark, 1stTab suggests 3 tags based on the URL domain and page title using a Claude API call. One-click to accept.

**Implementation:** Single API call on bookmark save. Debounced, opt-in, requires Plus.

### [FREE] Custom new-tab greeting messages
Instead of "Good morning, [Name]" — users can write their own greeting templates with variables: `{name}`, `{time}`, `{day}`, `{weather}`. Cycles through multiple greetings randomly.

### [PLUS] Appearance: Custom CSS editor
A code editor in Settings → Appearance where Plus users can write custom CSS that's injected into the new-tab page. Full control over colors, fonts, spacing.

**Implementation:** A `<textarea>` saved to `prefs.customCSS`, injected via a `<style>` tag on load.

### [FREE] One-click "Focus Mode"
Hides everything except the current time and a motivational quote. All widgets, bookmarks, and the topbar collapse. Accessible via a keyboard shortcut (`F` key) or a button in the topbar.

**Implementation:** `document.documentElement.classList.toggle('focus-mode')` + CSS rules.

### [PLUS] Unlimited custom backgrounds + background gallery
Free tier: 1 uploaded background. Plus: unlimited uploads + a curated gallery of high-quality backgrounds (stored in the extension, not fetched from a server).

### [FUTURE] RSS / News feed widget
User-supplied RSS URL → parsed client-side → rendered as a headline list. Free: 1 feed. Plus: unlimited feeds.

### [FUTURE] Habit Tracker widget
Daily checkbox streaks. Free: 3 habits. Plus: unlimited habits + weekly/monthly charts.

### [FUTURE] Native messaging host (Phase 5)
A small local binary unlocking CPU/GPU temperature, fan speed, and file system access. Strong differentiator — no new-tab extension does this today.

---

## 7. Free vs. Plus — Summary Table

| Feature | Free | Plus |
|---|---|---|
| Settings sync | ✓ | ✓ |
| Todo + Notes sync | ✓ | ✓ |
| Quick Links sync | ✓ | ✓ |
| Bookmark sync | — | ✓ |
| Google Drive backup / restore | — | ✓ |
| Auto-backup | — | ✓ |
| Crypto price widget | ✓ | ✓ |
| FX rates widget | ✓ | ✓ |
| Stock quotes widget | — | ✓ |
| Widget Manager | ✓ | ✓ |
| Draggable widget grid | ✓ | ✓ |
| Global bookmark search | ✓ | ✓ |
| Browser history widget | ✓ | ✓ |
| Focus Mode | ✓ | ✓ |
| Custom greeting templates | ✓ | ✓ |
| Pomodoro / Focus Timer | ✓ | ✓ |
| Panel: Tab Management | ✓ | ✓ |
| Panel: System Monitor | ✓ | ✓ |
| Panel: Section collapse + reorder | ✓ | ✓ |
| Panel: Chrome theme matching | ✓ | ✓ |
| Panel: Left/right positioning | ✓ | ✓ |
| Panel: Google Calendar | — | ✓ |
| Panel: Google Tasks | — | ✓ |
| Analog clock faces | — | ✓ |
| Multi-profile (Work/Personal/Gaming) | — | ✓ |
| AI Bookmark Assistant (Claude API) | — | ✓ |
| Smart Bookmark Tagging (AI) | — | ✓ |
| Custom CSS editor | — | ✓ |
| Custom backgrounds | 1 upload | Unlimited + gallery |
| World clocks | 3 | Unlimited |
| To-do lists | 1 list, 25 items | Unlimited |
| Notes | 1 note, 2 000 chars | Unlimited |
| Arcade themes | All 6 | All 6 + premium |
| CPU temperature (native helper) | — | ✓ (Phase 5) |
| RSS / News feed | 1 feed | Unlimited (Phase 5) |
| Habit Tracker | 3 habits | Unlimited (Phase 5) |

---

## 8. Manifest permissions needed for Phase 4

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
  "https://api.anthropic.com/*"
]
```

---

## 9. Implementation Plan — Free Tier

Priority order based on user value vs. implementation complexity.

### Sprint 1 — Core UX (2–3 weeks)
**Goal:** Make the base experience best-in-class before adding paid features.

1. **Draggable widget grid** — Replace fixed 3-column layout with a drag-and-drop CSS grid. Store layout in `prefs.layout`. Biggest daily-use improvement.
2. **Global bookmark search** — Full-text search across bookmarks, notes, quick links. Client-side, instant results dropdown.
3. **Focus Mode** — Single CSS class toggle hiding everything except clock + quote. Keyboard shortcut `F`.
4. **Custom greeting templates** — Let users define greeting strings with `{name}`, `{time}`, `{day}` variables.

### Sprint 2 — Sync & Storage (2 weeks)
**Goal:** Migrate to `chrome.storage.sync` for zero-friction cross-device continuity.

1. **Sync migration** — Move todos, notes, quick links, prefs to `chrome.storage.sync`. Keep bookmarks in `localStorage` (too large for sync quota).
2. **Conflict resolution** — `updatedAt` timestamp comparison, merge-by-ID for todos.
3. **Storage quota guard** — Warn user if approaching 100 KB sync limit, fall back gracefully to local.

### Sprint 3 — Finance Widgets (1–2 weeks)
**Goal:** Add the most-requested "live data" widgets.

1. **Widget Manager** — On/off toggle + configure panel in Settings → Widgets.
2. **Crypto ticker** — CoinGecko API, 60s refresh, coin selector UI.
3. **FX rates** — open.er-api.com, hourly refresh, base currency selector.

### Sprint 4 — Panel v2 (2–3 weeks)
**Goal:** Make the side panel genuinely useful for daily tab management.

1. **Tab Management section** — Live tab list, click to switch, close, mute, pin. Search/filter. Tab groups.
2. **System Monitor section** — CPU %, RAM bar, storage. 2s refresh.
3. **Panel collapse/reorder** — `details`/`summary` collapse + drag reorder. Save to prefs.
4. **Panel theme matching** — `prefers-color-scheme` + system CSS colors.

### Sprint 5 — Polish (1 week)
1. **Browser history widget** — `chrome.history.search`, last 10 sites, favicons.
2. **Keyboard shortcut** — `Alt+Shift+P` to open/close panel.
3. **Pomodoro timer** — Work/break cycle, Web Audio API chime, session log.

---

## 10. Implementation Plan — Plus Tier

### Prerequisites
Before building Plus features, wire up the licensing system (see §12).
All Plus-gated code should be wrapped in a single helper:

```js
function isPlusUser() {
  return loadJSON('1stTab.plus', { active: false }).active === true;
}

function requirePlus(featureName, callback) {
  if (isPlusUser()) { callback(); return; }
  showUpgradeModal(featureName); // links to the upgrade page
}
```

### Sprint 1 — Google Auth & Drive (3 weeks)
This unlocks Calendar, Tasks, and Drive backup in one auth implementation.

1. **`chrome.identity` OAuth flow** — Request tokens for `drive.appdata`, `calendar.readonly`, `tasks` scopes in a single prompt.
2. **Token storage** — Store access + refresh tokens in `chrome.storage.local` (encrypted with the extension's own ID as key).
3. **Google Drive backup** — Serialize all data to JSON, upload to AppData folder. List and restore previous backups.
4. **Auto-backup toggle** — Background service worker checks `prefs.autoBackup` on tab open, max 1/day.

### Sprint 2 — Google Workspace Panel (2 weeks)
1. **Google Calendar section** — Fetch events for today + 3 days, grouped by day, click to open in Calendar.
2. **Google Tasks section** — Fetch active tasks, check off inline, add new task input at top.
3. **Unified auth error handling** — Token expiry → auto refresh → graceful fallback if offline.

### Sprint 3 — AI Features (2 weeks)
1. **API key settings** — Input in Settings → Plus → AI. Key stored in `chrome.storage.local`, never sent to any proxy.
2. **AI Bookmark Assistant** — Panel chat input, sends bookmark metadata as context to Claude API, streams response.
3. **Smart Bookmark Tagging** — On bookmark save, suggest 3 tags via a single Claude API call. One-click accept.

### Sprint 4 — Power Features (2 weeks)
1. **Multi-profile support** — Profile switcher UI, separate storage namespaces per profile.
2. **Custom CSS editor** — Code editor textarea in Settings → Appearance, injected as `<style>` on load.
3. **Unlimited backgrounds + gallery** — Lift the 1-upload cap. Bundle a curated gallery (10–15 images, ~2–5 MB total).
4. **Stock quotes widget** — Finnhub API, user-supplied API key, market-hours-aware refresh.
5. **Analog clock faces** — SVG clock renderer with 3 face styles.

### Sprint 5 — Full Bookmark Sync (1 week)
1. **Bookmark serialization** — Chunk large bookmark sets into multiple Drive AppData files if needed.
2. **Incremental sync** — Only upload diffs (added/modified/deleted IDs) to avoid re-uploading everything.
3. **Conflict UI** — If two devices made conflicting edits, show a simple diff and let the user choose.

---

## 11. How to Publish: Free vs. Pro Version

### The core question: one extension or two?

There are three approaches used in the Chrome extension market:

---

### Option A — Single Extension, Feature Gating (Recommended)

One Chrome Web Store listing. All users install the same `.crx` file. Plus features are unlocked by verifying a license key or JWT token against your backend.

**How it works:**
1. User installs the extension (free)
2. User visits `1sttab.com/upgrade`, pays via Stripe/Paddle/Lemon Squeezy
3. Payment processor sends a webhook to your server
4. Your server generates a signed JWT or license key tied to the user's email
5. User pastes the key into Settings → Plus, or clicks a link that deep-links into the extension
6. Extension sends the key to your server for validation; server returns `{ active: true, plan: 'plus', expiry: '...' }`
7. Extension stores the result in `chrome.storage.local`; polls for renewal once per day

**Verification endpoint (minimal):**
```
POST https://api.1sttab.com/verify
{ "key": "1STPLUS-XXXX-XXXX" }
→ { "active": true, "email": "user@example.com", "expiry": "2027-05-14" }
```

**Pros:**
- Users upgrade without reinstalling — zero friction
- One codebase, one review cycle, one store listing
- Free users see tasteful "unlock" prompts inside the UI they already love
- Industry standard: Momentum, Grammarly, Vimium C all use this model
- Easier to A/B test upgrade prompts

**Cons:**
- Plus features are technically in the extension binary (obfuscated but not impossible to bypass)
- Requires a small backend (can start with a serverless function on Vercel/Cloudflare Workers — ~5 min setup)
- If the backend goes down, license checks fail (mitigated by caching the last valid response for 30 days)

**Bypass risk:** For 1stTab, the Plus features (AI, Google auth, multi-profile) require server-side API calls anyway. A user who bypasses the gate still can't use AI without their own API key or access Google Calendar without OAuth. The gate for cosmetic features (analog clocks, CSS editor) is bypassable by a determined developer, but this is acceptable — power users who can bypass it are not your paying customer segment.

---

### Option B — Two Separate Extensions

Two Chrome Web Store listings: **1stTab** (free) and **1stTab Plus**.

**How it works:**
- 1stTab (free): stripped-down extension, no Plus code at all
- 1stTab Plus: full extension, no license check needed, purchased directly from the Chrome Web Store via a one-time payment (Chrome Web Store supports this)
- Data migration: the free extension exports a JSON file, the Plus extension imports it on first run

**Pros:**
- Plus version can be purchased directly in the Chrome Web Store (no external payment needed)
- No backend required
- Clean separation — free users never see locked features

**Cons:**
- **Users must uninstall one and install the other to upgrade** — the single biggest friction point in extension UX
- **Data migration is a manual step** — many users will lose their bookmarks and settings
- Two codebases (or complex shared build system with feature flags)
- Two review cycles for every release — doubles QA time
- Chrome Web Store one-time payment is only available in select regions
- Chrome Web Store takes 5% of revenue (small, but noted)
- Two listings means split reviews, split ratings — harder to build social proof

**When to choose this:** Only if you want to sell at a one-time price with no recurring subscription and have no plans for server-side features. Not recommended for 1stTab given the cloud sync and AI roadmap.

---

### Option C — Free Extension + Web App (Hybrid)

The extension is always free. A companion web app (`app.1sttab.com`) is the paid product, providing sync, backup, and AI features through a web interface that communicates with the extension via `chrome.runtime.sendMessage`.

**Not recommended for 1stTab** — adds massive complexity (web app development, cross-origin messaging, auth in two places) for no real UX gain over Option A.

---

### Verdict: Go with Option A

| Criterion | Option A (Single) | Option B (Two) | Option C (Hybrid) |
|---|---|---|---|
| Upgrade friction | None | High (reinstall) | Medium |
| Data continuity | ✓ | Manual migration | ✓ |
| Backend required | Minimal | No | Yes (complex) |
| Code complexity | Low | High | Very high |
| Revenue flexibility | Subscription or one-time | One-time only | Subscription |
| Industry precedent | Momentum, Grammarly | Rare | Very rare |
| **Recommendation** | **✓ Use this** | Avoid | Avoid |

---

### Licensing backend (minimal viable setup)

You don't need a full server. Start with:

```
Lemon Squeezy (payment) → webhook → Cloudflare Worker (verify endpoint) → chrome.storage.local
```

**Lemon Squeezy** handles:
- Subscription billing (monthly/annual)
- License key generation
- Upgrade/downgrade/cancellation
- Customer portal (users manage their own subscription)
- VAT/tax compliance globally

**Cloudflare Worker** (free tier, ~10 lines of code):
- Receives `/verify` requests from the extension
- Calls Lemon Squeezy API to check license status
- Returns `{ active, expiry }`
- Caches response for 1 hour to stay within free tier limits

**Total infrastructure cost at 0–1 000 users: $0/month.**

---

### Pricing recommendation

| Plan | Price | Rationale |
|---|---|---|
| Free | $0 | Generous free tier drives installs and word of mouth |
| Plus Monthly | $3.99/mo | Under the "impulse buy" threshold for productivity tools |
| Plus Annual | $29.99/yr (~$2.50/mo) | ~37% discount incentivizes commitment, reduces churn |
| Lifetime | $79 (one-time) | Optional. Converts power users who resist subscriptions. Cap sales if support cost grows. |

**Comparable:** Momentum Plus is $3.33/mo (annual). Toby Pro is $3/mo. 1stTab's AI features justify parity or slight premium.

---

## 12. Implementation Priority Order (Full Roadmap)

### Phase 4 — Free tier first
1. Draggable widget grid
2. Global search
3. Finance widgets (Crypto + FX)
4. Sync migration (`chrome.storage.sync`)
5. Tab Management in panel
6. System Monitor in panel
7. Focus Mode + Pomodoro timer
8. Browser history widget

### Phase 4 — Plus tier (after licensing backend is live)
9. Licensing backend (Lemon Squeezy + Cloudflare Worker)
10. Google Auth + Drive backup/restore
11. Google Calendar + Tasks in panel
12. AI Bookmark Assistant + Smart Tagging
13. Multi-profile support
14. Custom CSS editor + unlimited backgrounds
15. Stock quotes widget + Analog clocks

### Phase 5
16. Native messaging host (CPU temperature, fan speed)
17. RSS feed widget
18. Habit Tracker
19. AI daily briefing (summarize calendar + tasks + top news on new tab open)
