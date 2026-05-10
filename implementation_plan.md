### Manual Verification
- [x] Open the extension dashboard.
- [x] Verify that pressing `/` focuses the search bar instantly.
- [x] Change the custom font in Settings and visually confirm typography updates across widgets.
- [x] Add an emoji to a test bookmark and verify it renders cleanly in both list and grid views.
- [x] Ensure the quote fetches and displays correctly at the bottom of the screen.


Free Tier Features Implementation Plan
This document outlines the tasks required to implement the remaining "Free Tier" features based on our recommendations.

Phase 1: Free Tier Essentials
 [x] Task 1: Storage Layer Refactor (chrome.storage.sync)
  - Updated `useStorage` in `data.jsx` to support `chrome.storage.sync`.
  - Migrated preferences and zones to use sync storage.
  - Kept larger payloads (bookmarks, uploads) in `chrome.storage.local`.

 [x] Task 2: Import / Export Settings & Chrome Bookmarks
  - Added export functionality in `data.jsx` (`exportAllData`).
  - Added import functionality with sync support (`importAllData`).
  - Integrated `chrome.bookmarks` API for native bookmark import (`importChromeBookmarks`).

 [x] Task 3: Multi-search-engine Support
  - Expanded search logic in `app.jsx` to support Google, DuckDuckGo, Bing, and Brave.
  - Added search engine selection in settings (though UI is compact).

Phase 2: UI & UX Enhancements
 [x] Task 4: Keyboard Shortcuts
  - Implemented `/`, `Ctrl+K` for search focus and `Ctrl+,` for settings in `app.jsx`.

 [x] Task 5: Custom Font Picker
  - Added font selection (Inter, Roboto, Outfit, VT323) in Settings.
  - Implemented dynamic Google Fonts loading and CSS variable injection in `app.jsx`.

 [x] Task 6: Emoji-as-favicon
  - Updated `BookmarkDialog` to allow emoji input.
  - Updated `BookmarkFavicon` in `bookmarks.jsx` to prioritize emoji rendering.

 [x] Task 7: Advanced Greeting / Personalization
  - Expanded `greetingFor` in `app.jsx` with time-based rotating messages.

 [x] Task 8: Quote of the Day
  - Implemented `QuoteWidget` in `quote.js` using DummyJSON API.

Phase 3: New Widgets
 [ ] Task 9: Quick Links / Speed Dial
  - Add a grid-based visual component above or alongside the standard bookmarks list for top-visited sites.
  - Note: "Pinned" strip exists, but automatic "Top Visited" logic is pending.

 [ ] Task 10: Free To-Do List
  - Create a simple to-do list widget (capped at ~25 items).
  - Store tasks in local storage.

 [ ] Task 11: Quick Notes
  - Create a small scratchpad widget for a single note with a reasonable character cap.

 [ ] Task 12: Daily Backgrounds
  - Integrate a free image API for daily backgrounds (e.g., Picsum or Unsplash).

Phase 4: Architecture
 [ ] Task 13: i18n Scaffold
  - Replace hardcoded English strings with a simple `t('key')` function.
  - Set up a basic `en.json`.

How to proceed: Phase 1 and 2 are complete. We should now move to Phase 3, starting with Task 9 (Quick Links) or Task 10 (To-Do List).
