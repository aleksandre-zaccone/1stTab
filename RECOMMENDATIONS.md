# Arcade Dashboard — Feature, Design & Monetization Recommendations

This document is a competitive analysis of five new-tab Chrome extensions and a roadmap for evolving your plugin (currently "Arcade Dashboard": bookmarks, world clocks, weather, Material/Arcade themes, local storage only).

## 1. Current state of your plugin

What you already have today:

- New-tab override with a 3-column layout (clocks · bookmarks · weather)
- Bookmark folders, pin/visit tracking, manager page
- World clocks (up to 3 zones)
- Weather panel (real Open-Meteo data, °F/°C toggle)
- Themes: Material Light, Material Dark, and an Arcade mode with 6 cabinet styles (Synthwave, Pac-Maze, Game Boy, Galaga, Tron, Hot Lava) plus background patterns and CRT scanlines
- Custom background image upload (up to 5 images)
- Google search bar in topbar
- Storage: only browser `localStorage` — **no cross-device sync yet**
- Manifest V3 compliant

## 2. Competitor feature matrix

| Capability | New Tab Page Ext. (PresentBoard) | Bonjourr | Tabliss | Momentum | Dashy |
|---|---|---|---|---|---|
| Pricing model | Free, ad-free | Free, open source | Free, open source | Freemium ($3.33/mo) | Freemium |
| Widget count | Large library (media, stocks, charts, calendar, analytics) | Modest, curated | ~13 widgets | ~10 widgets in free | 28+ widgets |
| Backgrounds | Custom | 4K dynamic, Unsplash, daily | Unsplash, GIPHY, gradients, upload | Daily HD, custom (Plus) | Custom, transparency per widget |
| Clock | Digital | Analog with multiple faces | Analog/digital/quotes | Digital | Multiple |
| Weather | Yes | Local forecast | Real-time | Basic free / premium Plus | Yes |
| To-do / tasks | Via widget | No | Built-in todo + notes | Yes (unlimited Plus) | Built-in + 3rd party integrations |
| Quotes / mantra | No | No | Daily quotes | Daily mantras + quotes | Inspirational quote |
| Search bar | Yes | Custom engines | Multi-engine | Multi-engine | Yes |
| Quick links | Yes (bookmarks widget) | With link groups | Speed dial | Yes | Yes |
| Custom CSS | No | Yes | Yes | No | No |
| Multiple profiles | Yes (sometimes lost — bug) | No | No | No | Up to 3 |
| Side panel | No | No | No | No | **Yes** |
| Cross-device sync | Google account sync | Firefox/Chrome sync | Settings sync between devices | Account-based | Account-based |
| Integrations (Spotify/Todoist/Asana/Calendar) | Calendar, Analytics, Stocks | None | GitHub, NBA scores | Plus only — ClickUp/Todoist/Asana | 28+ integrations including Spotify, Outlook, Google Calendar |
| AI features | No | No | No | Notes AI + Ask AI (Plus) | No |
| Focus / Pomodoro | No | No | Work-hours countdown | Focus Mode (limited free, unlimited Plus) | Timer widget |
| Soundscapes / ambient | No | No | No | Plus only | No |
| Habit tracking | No | No | No | Metrics (Plus) | No |
| Vision board | No | No | No | Plus | No |
| Tab management | Most-visited / recently closed | No | No | Tab Stash (Plus) | Tab Manager widget |
| Internationalization | — | 20+ languages | 40+ languages | English-heavy | Multi |

### Patterns worth copying

1. **Bonjourr**: minimalism wins. Custom CSS hook, automatic dark mode, link groups, font picker, emoji-as-favicon — all small things that build a loyal niche audience.
2. **Tabliss**: "no permissions required" is a marketing hook. Settings sync between devices is table-stakes.
3. **Momentum**: aspirational framing (mantras, focus, vision board) is what sells the subscription. Integrations are gated behind Plus.
4. **Dashy**: positions as a *dashboard*, not a wallpaper — 28+ integrations and a side panel reuse the same widgets when the new tab isn't visible. Profiles for work/school/personal.
5. **PresentBoard**: rich widget grid (stocks, charts, analytics) but suffers from layout fragility — a warning to ship a stable grid system before piling on widgets.

## 3. Recommended feature roadmap

Group your existing strengths (Arcade theming is genuinely differentiated — none of the competitors have anything close) with the table-stakes features users expect. Then build a Plus tier on top.

### 3.1 Free tier — must-haves to be competitive

Beyond what you already ship:

- ~~**Manifest V3 migration**~~ *(Completed)*
- **Cross-device settings sync** via `chrome.storage.sync` (covered in §6 — this is the user's specifically requested feature)
- **Quick Links / Speed Dial** as a first-class block alongside the bookmarks list (visual tile grid, not just a list)
- **To-do list** (single list, ~25 item cap on free tier)
- **Quick Notes** (single note, character cap on free tier)
- **Quote of the day** (rotating from a built-in pack)
- **Daily backgrounds**: bundled curated pack + Unsplash collection picker
- **Multi-search-engine** support (Google, DuckDuckGo, Bing, Brave, custom URL template)
- **Custom font picker** (Google Fonts integration like Bonjourr)
- **Greeting/personalization** (already partly there — extend to time-of-day mantras)
- **Emoji-as-favicon** for bookmarks (Bonjourr trick — costs nothing, looks great)
- ~~**Real weather data** (replace mock) via Open-Meteo~~ *(Completed)*
- **Keyboard shortcuts** (open settings, jump folders, focus search, toggle theme)
- **Import/export settings** as JSON (also helps support tickets)
- **i18n scaffold** — even if launched in English, structure strings now so adding languages later is cheap

### 3.2 Free tier — Arcade differentiators (your moat)

These are unique to your plugin and should stay free to drive installs:

- All current Arcade cabinet themes (Synthwave, Pac-Maze, Game Boy, Galaga, Tron, Hot Lava)
- Material Light/Dark
- Background patterns (Solid, Glow, Grid, Floor, Dots)
- CRT scanlines + vignette toggle
- 1 custom uploaded background (free) — multiple in Plus

### 3.3 Plus tier — paid upgrades

The competitor analysis shows what people will pay for: **integrations, AI, depth, and "more of everything."**

| Plus feature | Why people pay | Comparable to |
|---|---|---|
| Unlimited custom backgrounds + image library / cycling | Personalization is the #1 reason people install new-tab apps | Momentum, Bonjourr |
| **Premium Arcade themes** (e.g. Vaporwave, NES, Sega Genesis, Atari 2600, Outrun, Cyberpunk, Matrix, Windows 95, Amiga Workbench) | Your unique positioning | — |
| **Animated/parallax Arcade backgrounds** (rolling Pac-Maze ghosts, Galaga starfield, Tron grid scroll) | Premium visual polish | — |
| Unlimited to-do lists + project grouping | Replaces a separate todo app | Momentum, Dashy |
| Unlimited notes + markdown | Replaces a notes app | Momentum |
| Calendar integration (Google, Outlook, iCal) | Daily-use widget | Dashy, PresentBoard |
| Task manager integrations (Todoist, Asana, ClickUp, Linear, Trello, Jira) | Power-user moat | Momentum, Dashy |
| Music integrations (Spotify, Apple Music, YouTube Music) | Sticky daily-use | Dashy |
| Soundscapes / ambient audio (lo-fi, arcade ambience, rain, café) | Focus/work crowd | Momentum |
| Focus mode + Pomodoro timer (history, streaks, stats) | Productivity buyers | Momentum |
| Habit tracker / metrics | Self-improvement crowd | Momentum |
| Vision board / goals | Aspirational buyers | Momentum |
| RSS / news feed widget | Replaces Feedly-lite | PresentBoard |
| Stocks / crypto ticker | Finance crowd | PresentBoard |
| AI-assisted notes + "Ask AI" widget | Riding the AI wave | Momentum |
| **Multiple profiles** (Work / Personal / Gaming) | Power users | Dashy, PresentBoard |
| **Side panel** mirroring the dashboard | Sticky outside new tab | Dashy |
| World clocks: unlimited (currently capped at 3) | Easy gate | — |
| Custom CSS / advanced theme editor | Tinkerer crowd | Bonjourr, Tabliss |
| Encrypted cloud backup of all settings beyond `storage.sync`'s 100 KB cap | See §6 | — |
| Tab Stash / session save | Power users | Momentum |

### 3.4 Additional feature recommendations (New Ideas)

To further lean into the Arcade theme and make the extension more engaging, consider these additions:
- **Interactive Arcade Mini-games**: Allow users to play small snippets of classic games directly in the new tab to relax for a few minutes.
- **"High Score" Productivity System**: Gamify task completion or Pomodoro focus sessions by awarding points and achievements.
- **Arcade Soundscapes & Effects**: Introduce live CRT visual glitches (optional/occasional) or arcade hum/blips when interacting with the dashboard.
- **AI-Generated Backgrounds**: Let users generate their own pixel-art or retro-futuristic backgrounds using an AI image generation integration.
- **Chrome Bookmarks Sync / Import**: Allow users to import their native Chrome bookmarks (via the `chrome.bookmarks` API) so they don't have to start from scratch, or provide an export to sync back.

## 4. Design, style & theme recommendations

### 4.1 Visual direction

Lean into the dual personality the plugin already has — most competitors are flat/minimal, none are nostalgic. The split should be explicit:

- **"Modern" mode**: tighten Material Light/Dark to feel closer to iOS/Material You. Round corners, soft shadows, frosted-glass widget panels (`backdrop-filter: blur`), spring physics on dialogs.
- **"Arcade" mode**: keep the CRT/scanline differentiation, double down. This is your brand.

### 4.2 Specific style recommendations

- **Typography ladder**: keep Press Start 2P / VT323 for arcade; switch modern mode to Inter or Geist. Ship a font picker (Google Fonts) for free users.
- **Spacing system**: adopt a 4-px base unit, expose as CSS variables (`--s-1` through `--s-8`).
- **Color tokens**: define a single `--accent` per theme; everything else derives. Makes adding new themes (and user theme editor) trivial.
- **Component library**: standardize widgets onto a `Widget` shell (header + body + footer slots, transparent/solid/glass variants). Today bookmarks/clocks/weather each render their own chrome — unify.
- **Grid system**: Replace the fixed 3-column layout with a draggable grid (CSS Grid + react-grid-layout or similar). This is what unblocks everything else: more widgets, profiles, side panel reuse. **Critically: PresentBoard's #1 user complaint is layout breaking on resize — get this right before adding widgets.**
- **Dark/Light auto**: already supported via `prefs.theme = 'auto'`. Surface this more prominently.
- **Animation**: subtle micro-interactions on tile hover, fold-out folder transitions, arcade-mode glow pulse on accent. Respect `prefers-reduced-motion`.
- **Empty states**: every widget needs one — design upfront (a "press start" prompt for bookmarks, a "set your city" pixel cloud for weather).
- **Onboarding**: 3-screen first-run that picks theme, name, weather city, and offers Plus trial.
- **Side panel** (Plus): reuse the same widget shells in a 320 px column variant.

### 4.3 Theme catalog plan

Free: Material Light, Material Dark, Arcade (6 cabinets — Synthwave, Pac-Maze, Game Boy, Galaga, Tron, Hot Lava).

Plus: Vaporwave, NES, Sega Genesis, Atari 2600, Outrun, Cyberpunk Neon, Matrix Green, Windows 95, Amiga Workbench, Mac System 7, Solarpunk, Frutiger Aero. Plus a **theme editor** so users can fork any theme and tweak colors/fonts/effects.

## 5. Monetization strategy

### 5.1 Recommended model: **Freemium subscription with a generous free tier**

Why this fits:

- Matches Momentum and Dashy — proven market.
- Your Arcade theming is unique enough to drive organic installs even with a free tier.
- Subscriptions on Chrome extensions can be billed via Chrome Web Store's now-deprecated payments API → you'll need an external billing provider (Stripe, Paddle, LemonSqueezy, RevenueCat). Paddle and LemonSqueezy handle EU VAT for you — recommended for a solo developer.

### 5.2 Pricing

- **Free**: §3.1 + §3.2. No ads. No data sale. Make this a marketing point ("private by default, never sells your data").
- **Plus**: $2.99/month, $24/year (≈$2/mo annual). Sit just under Momentum's $3.33/mo to undercut. Consider a $59 lifetime tier — converts Momentum-fatigued users.
- **7-day free trial** of Plus on install, surfaced inside onboarding.
- **Student/educator**: 50% off with academic email verification. Cheap goodwill.

### 5.3 Auth & licensing

- Sign-in with Google OAuth (no passwords) — same identity as the user's Chrome profile, makes sync UX trivial.
- License check: small backend (Cloudflare Workers + D1, or Supabase) that issues a signed JWT after Stripe/Paddle webhook fires. Cache locally in `chrome.storage.local`, revalidate every 24h.
- Always **graceful degrade**: if license check fails, keep Plus features for 14 days before locking. Avoid the angry-review trap of "I paid and it locked me out offline."
- Family plan (3 seats, $4.99/mo) for shared households once you have traction.

### 5.4 Other revenue ideas (lower priority)

- **Theme marketplace** (revenue share with artists): one-time $1.99 themes for Plus users. Creates community + content flywheel.
- **Affiliate links** in the search bar's "search providers" dropdown (Brave, Kagi). Small but additive.
- **Sponsorships** (one curated background pack per month, clearly labeled). Easy to over-reach here — keep tasteful or skip.

Avoid: ads in the new tab, selling user data, paid email signups for the free version.

### 5.5 Conversion levers

- **Just-in-time prompts** when users hit free limits ("To add a 4th time zone, upgrade to Plus" — *not* "you've hit your limit, pay us").
- **Lockable preview**: let free users *see* a Plus theme for 60 seconds, then revert. Curiosity converts.
- **Onboarding survey** capturing the user's job/role to tailor which Plus benefit you emphasize (developers → Linear/GitHub; designers → Figma/aesthetic themes; students → focus mode).
- Track retention day 1 / day 7 / day 30. Improving D7 retention has more impact on LTV than improving conversion.

## 6. Cross-device sync (the user's explicit request)

You want settings and bookmarks to follow the user across multiple Chromes signed into the same Google account.

### 6.1 Architecture

Use a **two-tier storage strategy**:

| Tier | API | Quota | Use for | Notes |
|---|---|---|---|---|
| Tier 1 — small synced settings | `chrome.storage.sync` | 100 KB total, 8 KB per item, 512 items | All preferences (theme, units, name, weather city, time zones, layout, font, search engine) | Free, automatic, encrypted in transit, syncs whenever the user is signed into Chrome with sync enabled |
| Tier 2 — bulk data | Cloud backend (Supabase / Cloudflare D1 / Firestore) gated behind Google OAuth | Practically unlimited | Bookmarks, custom backgrounds (compressed/by URL), notes, todos, profiles | Required because bookmark sets and base64 backgrounds blow past 100 KB easily |
| Tier 0 — fallback | `chrome.storage.local` | 10 MB | Working copy + offline cache | Always the source of truth in the UI; tiers 1/2 sync against it |

### 6.2 Implementation plan

1. **Migrate to Manifest V3** first. MV3 enables service workers, which are required for reliable background sync.
2. **Refactor storage layer**: replace direct `localStorage` calls in `data.jsx` / `app.jsx` with a thin abstraction (`storage.get(key)`, `storage.set(key, val)`) that decides per-key whether it goes to `local`, `sync`, or `cloud`.
3. **Conflict resolution**: each item gets a `{ value, updatedAt, deviceId }` envelope. Last-write-wins with a 60-second clock tolerance, except for bookmarks where a merge-by-URL strategy avoids "I added a bookmark on laptop, opened phone, lost it" complaints.
4. **Sync trigger points**: on settings change (debounced 1s), on `chrome.runtime.onStartup`, on `chrome.storage.onChanged` events from other devices.
5. **Cloud tier (Plus only)**:
   - Backend: Cloudflare Workers + D1 (cheap at scale) or Supabase (faster to build).
   - Auth: Google OAuth via `chrome.identity.getAuthToken`.
   - Endpoint: `/sync` — POST a JSON Patch diff, returns merged state + new revision.
   - Encryption at rest with a per-user key derived from a passphrase the user sets (so even you can't read their bookmarks).
6. **UI**: Settings → "Sync" section showing: Last synced, device list (with names — derive from `chrome.runtime.getPlatformInfo`), "Sync now" button, "Sign out / wipe device" button.

### 6.3 What's free vs Plus for sync

- **Free**: settings sync via `chrome.storage.sync` only. Bookmarks stay local. Document this clearly.
- **Plus**: full cloud sync of bookmarks, custom backgrounds, notes, todos, profiles. End-to-end encrypted. Unlimited devices.

This is a strong upgrade hook because once a Plus user has bookmarks across 3 devices, churn is much lower.

### 6.4 Privacy & support

- Publish a clear privacy policy and a one-click "delete all my data" button in settings (GDPR + Chrome Web Store policy requirement).
- Add a `support@` email and a feedback form widget — this prevents 1-star reviews from becoming the only channel for bug reports (PresentBoard's main wound).

## 7. Suggested release order

1. **v1.1** — `chrome.storage.sync` for preferences, multi-search-engine, keyboard shortcuts, unified Widget shell, import/export. *(Note: MV3 migration and real weather are already completed!)*
2. **v1.2** — Quick Links speed dial, to-do list (free single-list), quick notes, font picker, daily quotes, emoji favicons, onboarding.
3. **v1.3** — Draggable grid layout. Replace the fixed 3-column layout. Required before piling on more widgets.
4. **v2.0** — Plus launch: cloud sync, premium Arcade themes, animated backgrounds, profiles, side panel, calendar integration, focus mode, pricing/billing.
5. **v2.1** — Music + task manager integrations (Spotify, Todoist, Linear). AI notes/ask widget.
6. **v2.2** — Theme editor + theme marketplace.
7. **v3.0** — i18n rollout, family plan, mobile companion (PWA reading from the same cloud sync).

## 8. Risks & watch-outs

- **Manifest V2 deprecation**: Chrome is actively removing MV2 extensions. Migrate before pushing any new feature. ([Chrome MV3 timeline](https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline))
- **`unsafe-eval` in your CSP** (used for Babel standalone): blocks publication on some stricter store policies and inflates bundle. Pre-compile JSX with esbuild/Vite at build time and remove `unsafe-eval`.
- **Backgrounds as base64 in storage** blow up sync quotas — store as URL or compress aggressively.
- **Trademark**: "Arcade" is fine, but "Pac-Maze," "Game Boy," "Galaga," "Tron" are trademarked names — rename internally to original-feeling alternatives ("Maze Chase," "Pocket Console," "Star Hunter," "Lightcycle Grid") to avoid takedowns once you have visibility.
- **Chrome Web Store payments**: not supported — pick an external billing provider before launching Plus.

---

**Bottom line.** Your Arcade theming is genuinely differentiated and worth keeping front-and-center. Round out the table-stakes (real weather, todos, sync, draggable grid, MV3), then build a Plus tier around premium themes, integrations, and cloud sync — pricing just under Momentum at $2.99/mo. The user's specific sync request maps cleanly onto a two-tier `chrome.storage.sync` + cloud backend model, with the cloud tier being a natural Plus upgrade.

## Sources

- [New Tab Page Extension (PresentBoard) — Chrome Web Store](https://chromewebstore.google.com/detail/new-tab-page-extension/eocahbefmnojcbnggklkhfolcekoobkd)
- [Bonjourr · Minimalist Startpage — Chrome Web Store](https://chromewebstore.google.com/detail/bonjourr-%C2%B7-minimalist-sta/dlnejlppicbjfcfcedcflplfjajinajd)
- [Bonjourr features overview](https://bonjourr.fr/docs/overview/)
- [Tabliss — A Beautiful New Tab](https://tabliss.io/)
- [Tabliss — Chrome Web Store](https://chromewebstore.google.com/detail/tabliss-a-beautiful-new-t/hipekcciheckooncpjeljhnekcoolahp)
- [Momentum — Chrome Web Store](https://chromewebstore.google.com/detail/momentum/laookkfknpbbblfpciffpaejjkokdgca)
- [Momentum Plus pricing & features](https://momentumdash.com/plus)
- [Dashy — Chrome Web Store](https://chromewebstore.google.com/detail/dashy-new-tab-dashboard-a/pohibamcjdinnoefmcggajbcblnodgoe)
- [Dashy widgets](https://www.dashyapp.com/widgets)
- [Chrome storage.sync API quotas & docs](https://developer.chrome.com/docs/extensions/reference/api/storage)
