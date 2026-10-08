# Workspace settings

Settings is a separate page, with section navigation and Back to library. Open the Settings gear at the top right beside search, or use Chrome’s Extension options. Changes are immediate and stored on this device; the new-tab manager and side panel stay in sync. Appearance and workspace preferences never mutate bookmarks.

Version 2.0.0 starts fresh installations in Enterprise light / List view. Existing saved preferences are preserved. Reset appearance restores the Enterprise visual defaults, while keeping the selected view and sort.

## Available now

| Section | Setting | Behavior |
| --- | --- | --- |
| Appearance | Design | Prism, Atelier, Studio, Pop and Enterprise, with miniature previews |
| Appearance | Color mode | Light, Dark or Follow system, including live OS theme changes |
| Text & icons | Text size | 90–140%; titles, labels, notes and forms scale together |
| Text & icons | Icon size | 90–150%; bookmark tiles and action icons scale independently of text |
| Workspace | Bookmark view | Cards or List, remembered when reopening |
| Workspace | Default sort | Manual order, Name A–Z or Newest first; display sorts preserve native order |
| Workspace | Spacing | Comfortable or Compact |
| Workspace | Show bookmark notes | Hide notes for a denser library without deleting them |
| Workspace | Reduce motion | Remove animations, transitions and card hover movement |
| Card shapes | Shape | Rectangle, Square, Rounded, Circle or Sphere; card view only |
| Sidebar | Width | Drag its right edge, use arrow keys, or double-click to reset; saved locally |
| Library tools | Data and recovery | Export/import, undo, snapshot recovery, cleanup, help/privacy links and optional integrations |

Reset appearance restores the default visual preferences. It keeps the view, sort, tree expansion and bookmark data. No new permissions or remote assets are needed.

Interactive HTML previews remember appearance per preview file; sample bookmarks remain temporary and are isolated from Chrome’s real bookmark library.

## Recommended next settings

These are suggestions, not implemented controls:

1. **Default save collection (high priority).** Choose the destination used by the toolbar capture action, with a safe fallback if that folder is deleted.
2. **Open links in a new or current tab (high priority).** Make the primary bookmark link match the user’s workflow; preserve normal Ctrl/Cmd-click behavior.
3. **Start in All bookmarks, Favorites or the last collection (medium priority).** Reduce navigation for people who work from a single collection.
4. **Visible details (medium priority).** Let users show or hide tags and domain labels, like the existing note setting.

Data tools such as export, import and recovery live in Settings → Library tools. Additional settings should support saving, finding and organizing bookmarks.

## Compact workspace

The library heading shows only the selected folder and counts. The duplicate Collections heading, persistent status footer, footer undo shortcut and per-bookmark Organize button are removed. Search and Settings stay visible as the page scrolls. Drag and drop continues to move/sort bookmarks; bulk Move selected provides a keyboard/touch alternative. Undo lives in Settings → Library tools. Success announcements remain available to screen readers; errors remain visible.

Enterprise adds neutral white/slate surfaces, navy controls, quiet borders and restrained typography in light and dark modes. Theme selection does not change bookmark data or view preferences. The Enterprise sample preview starts in List view.

## Filters in every view

The Show filters / Hide filters button is available in cards and lists, with the collection tree open or closed. The open/closed preference saves locally. Hiding controls preserves the current filters; a count badge indicates active collection/tag/domain/favorites filters. Reset filters clears them. Clicking a bookmark tag opens the controls so the applied filter is visible.

The guide, Terms and Privacy are linked from Settings. Preview pages use a Settings hash route; the extension uses its real settings.html options page. Back/Forward navigation preserves the active library state within the session. Add/edit dialogs dim the page without applying a background blur.
