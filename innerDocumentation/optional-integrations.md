# Google Drive integration — current package

Google Drive backup and restore are included in the default `dist/1stTab-bookmarks.zip`. Drive access remains optional: a fresh install requests no Google identity or API host access, and connecting Drive requests those permissions only after the user chooses Connect Google Drive. Local bookmark management and JSON export/import continue to work when permission is denied.

## Google Drive — 2.2 manual backup and restore

Connect requests optional identity and the Google API host, with only drive.appdata. The Drive about endpoint verifies the authorized account and supplies its display label; no identity.email or Gmail scope is used. Connection state, account identifier/label, last successful operation times and unresolved upload markers stay local and are excluded from exports. Tokens remain in Chrome's identity cache.

Settings → Backup & Google Drive has separate Connect Google Drive, Review Google Drive backup, Back up now, Disconnect and Refresh buttons. Review Google Drive backup opens saved snapshots directly; Refresh fetches the latest snapshots. Backup history includes older files and follows pagination. Select a snapshot in the list and choose Restore to inspect counts, duplicate URLs, metadata differences and destination, then optionally restore appearance/view preferences. Restore is additive, never overwrites existing bookmarks, and snapshots the current library/preferences first. Unsupported URLs or corrupt/oversized documents fail validation before upload/restore. Version 1 backups remain readable; version 2 includes an explicit portable preference allowlist.

Connect is the only interactive authentication action. Later requests authenticate silently; expired tokens are invalidated and retried once. Connection changes invalidate old history/restore previews. A cross-page operation lock prevents concurrent Drive mutations. Unknown upload completion is shown explicitly; refresh history before trying another upload. Successful matching history entries reconcile pending uploads. Backups remain until explicitly deleted. Disconnect clears connection metadata, cached tokens and extension permissions; Google account settings can revoke the grant separately.

There are no scheduled uploads or automatic restores in this release. The publishing workflow uploads the default ZIP, which now includes the opt-in Drive feature. Store listing and privacy disclosures must describe Drive access as optional and explain the data sent when a user starts a backup.

The OAuth client in `manifest.json` must be authorized for the production extension ID in the publisher's Google Cloud project. Enable Drive API and configure consent/testing users there. No client secret belongs in the extension. Live sign-in, account selection, revoked consent and a backup/restore round trip remain publisher verification gates.

References: [Chrome identity](https://developer.chrome.com/docs/extensions/reference/api/identity), [Drive about.get scopes](https://developers.google.com/workspace/drive/api/reference/rest/v3/about/get), [multipart upload format](https://developers.google.com/workspace/drive/api/guides/manage-uploads).

## Validation
Tests cover denied permissions with zero network calls, account changes, snapshot counts, provider failures, credential exclusion, Drive appDataFolder uploads and invalid downloads. Native/browser validation exercises the default package's disabled integration UI and user consent forms without using real accounts. Live OAuth consent and backup retention/deletion must be checked by the publisher before release.

The AI settings and provider permission have been removed. Backup & Google Drive is a separate Settings section beside Library tools, with a live local connection indicator. Snapshot list rows show counts for new backups; older backup counts appear in the restore preview. Counts describe the saved snapshot, not the current library.

Snapshot selection is single-choice. Restore and Delete stay disabled until a snapshot is selected; Refresh clears the selection. Restore opens the existing preview and Delete requires confirmation.

The snapshot dialog offers only Restore, Delete, Refresh and Close. Snapshot details stay in the list; there is no separate details action or panel.
