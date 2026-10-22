# 2.2 implementation plan — Google Drive manual backup and restore

Status: implemented locally as a 2.2.0 optional candidate; automated verification passed as recorded in release-verification.md. Live OAuth and distribution remain release gates.
Created: October 18, 2026.
Branch: feature/2.2-google-drive-backup, based on the current local integration branch.
Target release: 2.2.0.
Product scope: [next-version roadmap](bookmark-product-roadmap.html#next-versions).

## Outcome and boundaries

Users can explicitly connect Google Drive, back up their library, browse backups, preview and restore a selected backup, delete a backup, and disconnect. The local library and JSON export/import remain usable offline.

2.2 covers desktop Chrome first. Scheduled backups belong to 2.3; cross-device sync belongs to 2.4. Edge/Brave/Firefox support remains a research spike. AI behavior is outside this change.

Retain the current core and optional package split during implementation. The existing publishing workflow distributes the core ZIP; publishing cloud functionality requires a concrete packaging/release decision before launch. Do not claim Drive is available in the core release while it only exists in the optional package.

## Existing implementation and gaps

- bookmark-core/integrations.js already supports optional permission requests, Google token acquisition, appDataFolder upload/list/download/delete and disconnect. Authentication currently requests interactive sign-in for every operation. Listing requests nextPageToken but ignores it.
- bookmark-core/ui.js provides disclosure, upload, backup list, restore preview and confirmed deletion. It lacks durable connection/last-success status and account-switch protection.
- bookmark-core/transfer.js exports version 1 bookmark trees and normalized metadata. It validates imports and creates a local snapshot before additive restore. Preferences are not exported; duplicate review is not part of the current preview.
- bookmark-core/library.js preserves metadata for partially completed imports. Its current recovery snapshot covers the tree and metadata, so preference recovery must be added if preferences are restored.
- manifest.optional.json contains the OAuth client configuration and drive.appdata scope. Live authorization against the final extension ID remains unverified.
- tests/integrations.test.js covers basic permission denial, payload credential exclusion and invalid downloads. Extend coverage for the complete backup lifecycle.

## Implementation sequence

### 1. Establish the baseline and release contract

- Run the existing unit suite and build/verify both packages; record baseline failures before implementation.
- Confirm the publisher-controlled Google Cloud project, extension ID, OAuth client and consent configuration. Keep secrets out of the extension and repository.
- Decide how to expose the connected account reliably with minimal access. Do not label a Chrome profile email as the authorized Drive account without verification. If profile scopes are needed, document the scope change and consent UX before implementation.
- Record the distribution decision: keep the optional release candidate for validation; determine whether to ship it as a separately distributed package or integrate optional Drive into the primary package. Inspect workflow and manifest consequences before changing publishing.
- Define supported preference fields and unsupported-URL handling. Existing exports may contain native bookmark schemes that import rejects; preview must explain unsupported entries without silently losing data.

Exit: documented OAuth/account-display approach, package destination and backup schema contract.

### 2. Extract and harden Drive connection and requests

Primary areas: bookmark-core/integrations.js, a dedicated Drive module if useful, manifest.optional.json.

- Keep AI exports/behavior compatible while separating Drive responsibilities.
- Model disconnected, connecting, connected, reconnect-required and error states. Store only necessary non-secret account/session metadata and successful-operation timestamps locally.
- Acquire tokens silently for ordinary requests after explicit connection; prompt only from a user action. On an expired token, invalidate it and retry authentication once; avoid retry loops.
- Map denied consent, offline/timeout, 401, 403, quota/rate-limit and server errors to actionable messages.
- Bind each request and pending preview to a connection generation/account context. Disconnect/account switching must invalidate pending results and clear old account history/status. Prevent stale requests from changing the newly connected account's UI or library.
- Serialize conflicting operations across extension surfaces or use a shared coordinator. Disable duplicate submissions; handle service-worker/page interruption explicitly.
- Never log or export tokens. Disconnect removes cached credentials and granted extension access, while explaining that existing Drive backups remain.

Exit: denied/revoked access leaves local operations intact; account switching cannot apply a stale restore.

### 3. Define a backward-compatible backup document

Primary areas: bookmark-core/transfer.js, bookmark-core/preferences.js, bookmark-core/library.js.

- Introduce a versioned schema for supported preferences alongside the existing bookmark/folder metadata. Continue reading existing version 1 exports.
- Use an explicit preference allowlist and existing normalization. Exclude credentials, connection state, operation history and browser-local folder IDs unless safely remapped.
- Preserve tags, notes and favorites through round trips. Include creation time and schema/application version for diagnostics.
- Apply consistent size, depth, item-count, URL and field validation to local files and Drive downloads. Bound downloads before accepting untrusted oversized content.
- Make preference restore a separate opt-in choice in preview. Snapshot existing preferences before changes; describe recovery and partial-failure behavior.
- Reject unsupported future versions before modifying data.

Exit: v1 compatibility and new-schema round trips pass; malformed documents cannot mutate bookmarks or preferences.

### 4. Complete manual backup and history

Primary areas: Drive module, bookmark-core/ui.js.

- Separate Connect from Back up now; disclose transmitted fields before first upload.
- Capture a consistent library/preferences snapshot. Show progress and last successful backup only after confirmed upload.
- Add application/schema markers for new files while retaining discovery of legacy backups.
- Follow pagination using Load more or complete bounded traversal; avoid silently stopping at 100 files.
- Show backup name, timestamp and useful metadata; provide refresh, empty/error states and confirmed deletion.
- Do not blindly retry an upload after an ambiguous response: reconcile with an operation identifier or report unknown completion to avoid duplicate backups.
- Refresh history after upload/delete and keep failure state actionable. Deletion must not change local bookmarks.

Exit: backup history includes legacy and new backups across pages; interrupted uploads do not falsely report success.

### 5. Complete safe manual restore

Primary areas: bookmark-core/ui.js, bookmark-core/transfer.js, bookmark-core/library.js.

- Download and validate the selected backup before offering a mutation.
- Preview bookmark/folder counts, destination, duplicate URL counts, metadata differences and optional preference changes.
- Keep additive restore as the default. Explain that existing items are preserved and duplicates may be added; require explicit confirmation. Do not implement automatic overwrite/merge in 2.2.
- Create a local recovery snapshot before the first mutation; abort if snapshot storage fails.
- Recheck connection context and destination validity when confirming. Invalidate previews on account changes; recompute duplicate information if the local library changes.
- Preserve imported metadata on partial failures and report how many items were created. Prevent double submission and make recovery instructions visible.
- Cancellation and invalid input must cause zero library changes.

Exit: a user can restore to a fresh profile and recover from interrupted restore without silent data loss.

### 6. Verify the complete user flow

Automated coverage:

- Permission denial and disconnected state produce no Drive requests.
- Silent authentication, one-time token retry, revoked consent, timeouts, quota errors and disconnect.
- Account switch during upload/list/download/preview; stale results ignored.
- Pagination, legacy discovery, confirmed deletion and ambiguous upload handling.
- Version 1 and new-schema round trips, preference allowlist, credential exclusion, malformed/oversized input and unsupported versions/URLs.
- Duplicate/conflict preview, cancellation, snapshot failure, invalid destination, partial bookmark writes and preference-storage failure.
- Cross-surface repeated clicks and consistent operation status.
- Core package remains usable with no provider permissions granted; AI regression tests remain passing.

Validation commands, from the repository root:

- npm test
- bash build.sh
- npm run build:optional
- node tests/browser.mjs
- node tests/settings-browser.mjs
- node tests/workspace-customization.mjs
- node tests/native-extension.mjs
- node tests/native-extension.mjs --optional

Use the project's documented Playwright/Chrome environment variables where required. Run browser/native checks in isolated profiles.

Live publisher verification:

1. Install the actual optional package with the intended extension identity.
2. Connect a designated test Google account; verify scope and account display.
3. Upload a fixture containing nested folders, Unicode, duplicate URLs, tags, notes, favorites and preferences.
4. Restore in a separate isolated profile and compare the result.
5. Exercise account switching, revoked consent, offline failure, delete and disconnect.
6. Record browser/package version, date, results and remaining limitations without tokens or personal bookmark data.

Exit: automated suites pass and the live OAuth/Drive round trip is recorded. Mock tests alone cannot satisfy the release gate.

### 7. Prepare 2.2.0 for review

- Update manual.html, privacy.html, README.md, optional-integrations.md, store submission instructions and release-verification.md to match final behavior. Fix stale optional-package version references.
- Add release-v2.2.0.md with shipped behavior, migration and limitations.
- At release preparation, align manifest.json, manifest.optional.json and package.json versions; verify generated ZIPs and their permissions.
- Resolve the distribution decision from step 1 and test the exact artifact intended for publishing.
- Open review against integration, then follow integration → main promotion. Publishing remains a separate release action.

## Suggested reviewable changes

1. Drive connection/request layer and regression tests.
2. Backup schema/preferences compatibility and recovery safeguards.
3. Manual backup/history UI and pagination.
4. Restore preview, account safeguards and failure handling.
5. Live validation record, documentation, packaging and release version.

## Completion criteria

All seven gates pass; manual backup and restore work with the production-intended OAuth configuration; older backups remain readable; local functionality works without an account; the released artifact and user documentation agree. Scheduled jobs and sync are not prerequisites for 2.2.

## Implementation decisions and remaining gates

- Use Drive about.get with the existing drive.appdata scope for account identity; no broader identity/email scope added.
- Keep the existing core/optional package split. Publishing the cloud candidate requires an explicit publisher distribution decision.
- Export version 2 uses a portable preference allowlist; version 1 imports remain supported. Unsupported native URL schemes reject the backup before upload.
- Serialize Drive operations using a cross-page Web Lock; reject overlapping requests and invalidate previews when connection generations change.
- Recovery uses additive bookmark import and a separate previous-preferences control; bookmark Undo remains distinct.
- Automated provider tests use mocks. Live publisher OAuth configuration and account round-trip checks remain open; see release-v2.2.0.md.
