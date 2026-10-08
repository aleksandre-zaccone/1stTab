# Store submission preparation

## Single purpose
Help users save, organize and retrieve their Chrome bookmarks.

## Proposed listing
1stTab — Bookmark Manager: save pages, organize bookmark folders, add tags and bookmark notes, and quickly find saved links. Manage your existing Chrome bookmarks in a full-page library or side panel. Export your library and import a previously exported file with a preview. Review exact duplicate URLs before deleting anything.

## Permission explanations
- bookmarks: read and edit the native bookmark tree following user actions; refresh changes across surfaces.
- storage: keep local bookmark metadata, preferences and recovery snapshots; migrate legacy metadata safely.
- activeTab: read the current page URL/title after the toolbar icon is clicked; no background reading of pages.
- sidePanel: display the bookmark manager while the user browses.

## Reviewer walkthrough
1. Load the packaged folder on Chrome 116+; no login or payment required. Open a new tab and verify it displays the bookmark manager.
2. Open a normal HTTPS page and click the toolbar icon. Review title/URL, choose a folder and save.
3. Search for the bookmark. Add a note/tag/favorite and test filters.
4. Create a folder and select a bookmark. Move selected, inspect preview and confirm. Cancel a deletion and check the item remains.
5. Press Alt+Shift+P and compare the bookmark panel with the full-page library. Edit a bookmark and verify the other surface refreshes.
6. Export a JSON library copy; import that file and inspect counts/destination before confirming. Verify imported links appear in a separate folder.
7. After a delete, Restore snapshot adds a copy of the snapshot; it does not overwrite existing bookmarks. Duplicates can be reviewed locally.
8. Open the separate Settings page. Resize the folder sidebar, change card shapes, and test keyboard navigation and narrow panel width. Open How it works, Terms & conditions, and Privacy from Settings.
9. Verify version 2.0.0. A fresh profile starts in Enterprise light / List view; upgrading preserves saved preferences.

## Required publisher steps
Host the exact current privacy policy on a stable public URL and enter that URL in the developer dashboard. Capture real extension screenshots. Confirm packaged Chrome toolbar/shortcut behavior, restart handling and native managed-bookmark restrictions. Compare the rejection notice if supplied. No upload or publication has been performed by this implementation.
