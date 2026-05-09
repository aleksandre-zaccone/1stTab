# Phase 2: UI & UX Enhancements

This plan outlines the steps for implementing the five tasks included in Phase 2 of the free tier features.

## User Review Required

> [!NOTE]
> Please review the proposed API for the Quote of the Day and the approach to Emoji favicons to ensure it aligns with your vision.

## Open Questions

> [!TIP]
> 1. For the **Custom Font Picker**, I plan to dynamically load fonts from Google Fonts (e.g., Inter, Roboto, Outfit). Are there any specific font families you'd prefer to see?
> 2. For **Quote of the Day**, I plan to use `https://dummyjson.com/quotes/random` (fast, free, no auth, good CORS support) and cache the quote daily to prevent API spam. Does this sound good?

## Proposed Changes

---

### Key Bindings (Keyboard Shortcuts)
#### [MODIFY] app.jsx
- Add a global `keydown` event listener using `useEffect`.
- `Cmd/Ctrl + ,` will toggle the Settings dialog.
- `/` or `Cmd/Ctrl + K` will focus the global search input.

### Custom Font Picker
#### [MODIFY] app.jsx
- Add a `font` selection to the Settings dialog (System Default, Inter, Roboto, Outfit).
- Inject a dynamic `<style>` tag that applies the selected font to the document body, overriding default typography.

### Emoji-as-Favicon
#### [MODIFY] manager.jsx & app.jsx
- Add a new "Emoji Icon" text input field (max length 2) to the Bookmark Add/Edit forms.
#### [MODIFY] bookmarks.jsx
- Update the `BookmarkFavicon` component: If the bookmark data contains an `emoji`, render a customized CSS block displaying the emoji instead of fetching the remote Google Favicon image.

### Advanced Greeting
#### [MODIFY] app.jsx
- Expand the `greetingFor(now)` function. Instead of just returning "Good morning" or "Good evening", it will select from an array of motivational greetings and mantras depending on the specific time of day (e.g., early morning, midday, evening).

### Quote of the Day
#### [NEW] quote.jsx
- Create a new, lightweight `QuoteWidget` component that will rest neatly at the bottom of the dashboard.
- It will fetch a daily quote from the free JSON API, cache it in local storage (updating at midnight), and display the quote and author.
#### [MODIFY] app.jsx
- Import and mount the `QuoteWidget` below the main content/footer.
#### [MODIFY] build.sh
- Ensure `quote.jsx` is bundled in the build process.

## Verification Plan

### Automated Tests
- Run `./build.sh` to compile JSX successfully without syntax errors.

### Manual Verification
- Open the extension dashboard.
- Verify that pressing `/` focuses the search bar instantly.
- Change the custom font in Settings and visually confirm typography updates across widgets.
- Add an emoji to a test bookmark and verify it renders cleanly in both list and grid views.
- Ensure the quote fetches and displays correctly at the bottom of the screen.


Free Tier Features Implementation Plan
This document outlines the tasks required to implement the remaining "Free Tier" features based on our recommendations. No code will be changed without your explicit approval for each step.

Phase 1: Free Tier Essentials
 Task 1: Storage Layer Refactor (chrome.storage.sync)
Update loadJSON and saveJSON in data.jsx / data.js.
Migrate preferences to use chrome.storage.sync.
Keep larger payloads in chrome.storage.local.
 Task 2: Import / Export Settings & Chrome Bookmarks
Add a button in the Settings Dialog to export the current config as JSON.
Add an import function to read JSON, validate it, and restore the configuration.
Integrate with chrome.bookmarks API to allow users to directly import native bookmarks (supporting nested folder trees).
 Task 3: Multi-search-engine Support
Expand search bar logic in app.jsx to support multiple engines.
Add a default search engine picker to Settings Dialog.
Phase 2: UI & UX Enhancements
 Task 4: Keyboard Shortcuts
Implement global keyboard event listeners (e.g., Cmd/Ctrl + , for settings, / or Cmd/Ctrl + K to focus search, etc.).
 Task 5: Custom Font Picker
Add a font selection dropdown in Settings (e.g., Inter, Roboto, VT323 for arcade mode).
Inject the selected font globally via CSS variables.
 Task 6: Emoji-as-favicon
Update the bookmark icon logic (faviconUrl in data.jsx) to render a simple emoji if a standard favicon fails, or allow users to manually pick an emoji for a bookmark.
 Task 7: Advanced Greeting / Personalization
Expand the existing greetingFor(now) function in app.jsx to include rotating mantras based on the time of day.
 Task 8: Quote of the Day
Implement a small rotating quote component at the bottom of the screen.
Integrate a free API such as ZenQuotes (https://zenquotes.io/api/today) or Quotable API (https://api.quotable.io/random) which require no authentication.
Phase 3: New Widgets
 Task 9: Quick Links / Speed Dial
Add a grid-based visual component above or alongside the standard bookmarks list for top-visited sites.
 Task 10: Free To-Do List
Create a simple to-do list widget (capped at ~25 items).
Store tasks in local storage.
 Task 11: Quick Notes
Create a small scratchpad widget for a single note with a reasonable character cap.
 Task 12: Daily Backgrounds
Integrate a free image API for daily backgrounds. Since Unsplash Source is deprecated and requires API keys, use Google Chromecast Backgrounds (via clients3.google.com/cast/chromecast/home), Google Earth View images, or Picsum Photos to automatically cycle the background without API limits.
Phase 4: Architecture
 Task 13: i18n Scaffold
Replace hardcoded English strings with a simple t('key') function.
Set up a basic en.json to make adding languages easy in the future.
How to proceed: Please review this task list. If it looks good, let me know which task or phase you would like to start with, and I will propose the code changes for it!
