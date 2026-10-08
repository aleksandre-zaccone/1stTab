# 1stTab bookmark product specification

Single purpose: help users save, organize, and retrieve their Chrome bookmarks.

## Launch matrix
| Capability | Purpose | Entry point |
| --- | --- | --- |
| Create/edit bookmarks and folders | Save and organize links | Library, bookmark panel |
| Save current page | Capture a chosen link | Explicit toolbar action with activeTab |
| Folder tree, drag/drop and bulk move | Organize saved links | Library |
| Title/URL search; folder/tag/domain/favorite filters | Retrieve saved links | Library and panel |
| Bookmark tags, notes, favorites | Add context to a saved link | Bookmark editor |
| Import/export and pre-edit snapshots | Preserve the library | Library settings |
| Light/dark theme and keyboard controls | Make bookmark management accessible | Shared settings |

## New-tab behavior
Per the user’s updated preference, replace the new-tab page with the bookmark manager itself. All visible functionality remains bookmark-related. General web search and unrelated dashboard widgets stay excluded.

## Follow-up
Local duplicate cleanup, empty-folder review, recoverable changes, optional bookmark-specific AI and cloud backup. Link-health checks and a companion web library require separate design and validation.

## Excluded from this extension
General web search; independent notes/tasks/weather/clocks/finance/quotes; calendar; hardware monitoring; tab/session administration; media tools; general AI chat, page summarization, screenshots, writing/translation and video tools. Legacy source may remain for reference, but must not be reachable or shipped in the release.

## Permission budget and call sites
- bookmarks: shared repository reads and explicitly requested native create/update/move/remove operations; event subscriptions refresh both surfaces.
- storage: versioned local bookmark metadata, preferences, migration snapshots and operation recovery. Never assume metadata sync follows Chrome bookmark sync.
- sidePanel: bookmark-only panel opened by supported user action.
- activeTab: toolbar click supplies temporary access to the selected page title/URL. Persistent panel actions do not assume a valid activeTab grant.
- No required host permissions or OAuth in the local MVP. No ordinary operation uploads bookmark data. Use bundled fallback icons.
- Remove history, tabs, sessions, tabGroups, system.*, identity, alarms and favicon from the MVP manifest after related calls are removed. Opening extension pages or saved links alone does not require tabs permission.
- AI/cloud permissions remain optional future integrations with disclosure and consent. Never request speculative access.

## Data rules
Native chrome.bookmarks is the source of truth. Preserve user bookmarks, managed restrictions and legacy metadata. Migration is versioned, repeatable and snapshot-backed; no promotional seeding. Exports exclude secrets. Bulk deletion/move and import require preview/confirmation and recovery snapshots. Imported URLs and AI output are untrusted.

## Release acceptance
All visible actions support bookmark management. Packaged library/panel/settings load locally without missing assets or unrelated handlers. Verify meaningful CRUD/migration/import failure cases, keyboard access, offline behavior, permission denial and a 10,000-bookmark fixture. Keep store/website/privacy/manual descriptions aligned with implemented features. Store approval is not guaranteed.
