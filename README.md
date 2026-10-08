# 1stTab v2 — Bookmark Manager

Save, organize and find Chrome bookmarks in a full-page library or bookmark-only side panel. This release replaces the old dashboard runtime; historical JSX/dashboard sources remain in the repository and are excluded from the shipping ZIP.

Fresh installations start with the Enterprise light theme and list view. Saved theme, view, sizing and folder preferences are preserved. Both package variants identify as version **2.0.0**.

## Run

Requires Chrome 116+ and Python 3. Run `bash build.sh`; extract `dist/1stTab-bookmarks.zip`, then select the extracted folder in Chrome → Extensions → Developer mode → Load unpacked. Use the packaged folder rather than the repository root, which retains legacy assets.

Click the toolbar icon on a web page to open a save form. Alt+Shift+P opens the side panel. Ctrl/Cmd+K focuses saved-link search. New tabs open the bookmark manager. Your search provider is unchanged.

## Features

- Collection workspace with colorful cards, compact bookmark cards and list rows, sticky search, collapsible folder tree and mobile drawer.
- Settings with five design themes (Prism, Atelier, Studio, Pop, Enterprise), light/dark/system color modes, independent text and icon sizes, spacing, note visibility and reduced motion. Library tools (import/export, recovery and cleanup) are grouped inside Settings. Appearance, view and sort save locally and update across surfaces.
- Native bookmark create/edit, folder actions, drag/drop moves and same-folder sorting, bulk move/tag/delete.
- Keyboard/touch bulk move dialog; native order restored by undo in Settings → Library tools.
- Saved-link title/URL/note/tag search; folder, tag, domain and favorite filters with a labeled Show/Hide control, active-filter badge and remembered visibility in every view.
- Local tags, bookmark notes and favorites; snapshot-backed migration from previous metadata.
- Versioned JSON export, additive import with preview, snapshots before import/move/delete, additive snapshot recovery and conflict-aware undo.
- Exact-URL duplicate review and empty-folder review; light/dark appearance and keyboard controls.

No account or external network service is required. Bookmarks follow Chrome’s sync settings; metadata stays on this device. Backups exclude API keys and credentials. Additive recovery can duplicate links; review the result before cleanup.

## Verify

Run `npm test`, then `bash build.sh`. Browser checks in `tests/browser.mjs`, `tests/settings-browser.mjs`, and `tests/workspace-customization.mjs` use an installed Playwright package. Set `PLAYWRIGHT_MODULE` to a module path for an external installation, and `CHROME_PATH` to use a specific Chromium binary. `CHROME_NO_SANDBOX=1` is available for isolated test environments that require it. Native checks (`node tests/native-extension.mjs`, also with `--optional`) require Chromium or Chrome for Testing with extension loading enabled; they create isolated temporary profiles. No live browser bookmark library is modified by those checks.

See `innerDocumentation/release-verification.md` for results and remaining native Chrome checks, `innerDocumentation/store-submission.md` for reviewer steps, and `innerDocumentation/bookmark-scope.md` for scope and permissions.

## Optional integrations candidate

Run `npm run build:optional` to build the separate 2.0.0 optional candidate with disabled-by-default OpenAI organization and Google Drive backup. See `innerDocumentation/optional-integrations.md` for consent, data flow and publisher OAuth setup. The default local package requires no account or provider permissions. Live provider/OAuth verification remains necessary before publishing the optional package.

## Design previews and settings checks

`python3 scripts/preview-workspace.py` bundles the real UI with sample bookmarks into `innerDocumentation/workspace-preview.html`. Use `--design atelier` (or studio/pop) with an output path for another preset. Preview appearance settings persist per page; sample bookmark changes remain temporary. These previews never use your Chrome bookmark library.

Run `node tests/preferences.test.js` for preference bounds/defaults and `node tests/settings-browser.mjs` for themes, scaling, saved settings, system mode, responsive layout and reset. Native extension checks also verify cross-page updates and persistence after browser restart. Run `python3 scripts/build-design-styles.py` after editing design-styles.json to regenerate scoped themes.

The interactive design previews contain 40 sample bookmarks across 21 folders/subfolders and 43 tags, including Design, Build, Work, Research, Inspiration and Learning. These samples are excluded from the packaged extension and never seed your actual Chrome bookmarks.

Settings now opens as a full page. Resize the folder sidebar by dragging its right edge; choose Rectangle, Square, Rounded, Circle or Sphere in Settings → Card shapes. Read the included `manual.html` guide and `terms.html` product terms from Settings. Dialog backgrounds are dimmed without blur.
