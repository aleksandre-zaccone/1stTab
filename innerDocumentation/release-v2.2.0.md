# 2.2.0 — Manual Google Drive backup and restore

Status: local implementation / optional release candidate. Not published.

The optional package now provides an explicit Google connection, verified Drive account display, Back up now, paginated backup history, previewed additive restore, confirmed deletion and disconnect. Connection changes invalidate old previews. Requests use silent authentication after Connect, retry expired credentials once, and serialize Drive operations across extension pages. Interrupted uploads retain an uncertainty marker; refreshing history reconciles confirmed uploads.

Version 2 exports include allowlisted appearance/view preferences alongside bookmarks, folders, tags, notes and favorites. Version 1 remains readable. Preference restore is optional. Preview shows duplicate URL and metadata-difference counts; changes to the local library require a new preview. A recovery snapshot preserves the previous library and preferences. Recovery controls and bookmark Undo are available in Library tools. Undo does not restore preferences; use Recover previous preferences for that.

Multipart uploads now use real CRLF boundaries. Downloads enforce the 20 MB input limit while streaming, with schema, depth, item-count and URL validation before mutation. Unsupported native bookmark URL schemes cause a clear validation failure instead of creating an unrestorable cloud backup. Tokens and account identifiers are excluded from exports. No scheduled uploads, automatic restores or cross-device sync are included.

## Packaging and installation

Both manifests and package.json identify as 2.2.0. The default ZIP remains the local core; the optional ZIP contains Google Drive backup and restore. Publishing automation still targets the core ZIP. A publisher must explicitly choose and validate the cloud artifact's distribution before advertising or releasing it.

Build with `npm run build:optional`, extract `dist/1stTab-bookmarks-optional.zip` to a dedicated folder and load it through Chrome Extensions → Developer mode → Load unpacked. Use the extracted folder, not the repository root. After a rebuild, extract into the same folder and click Reload. For Google authorization, the publisher's OAuth client must match the loaded extension ID.

## Verification

Run `npm run test:integration`. It builds and verifies both ZIPs and executes the unit, browser and native integration suites. External Playwright/Chrome installations are supported through PLAYWRIGHT_MODULE and CHROME_PATH. Native tests use isolated profiles and do not touch a personal bookmark library.

The Drive browser test covers Connect, account display, actual multipart body parsing, backup history, cancellation, additive restore with preferences, snapshot creation, deletion and disconnect. The native Drive test uses the packaged modules and real Chrome bookmarks/storage, and verifies metadata restoration, preferences, cross-page locking and stale-preview rejection. Google authorization and transport are mocked in both suites.

Historical design-preview suites still exercise their checked-in design fixtures. The fresh-preview test builds current source and checks its starter bookmarks and recovery controls; the core browser and native suites test current runtime modules.

## External release gates

Live Google sign-in, the final extension ID/client pairing, account selection, denied/revoked consent and a real upload/download/delete round trip remain unverified. Automated mocks do not prove Google Cloud configuration or production OAuth consent. Complete the live checklist in implementation-plan-v2.2.md before publishing. No store submission, merge or deployment occurred.

## Settings and snapshot review update

AI settings, the AI provider permission and its unused runtime module are removed from the packaged extension. Backup & Google Drive is now its own Settings section immediately after Library tools, with a navigation entry and Connected / Not connected / Reconnect required indicator, account label and last successful backup time.

Restore from Google Drive opens snapshot cards with date, file size and format. New backups store summary counts for bookmarks, folders, favorites, bookmarks with notes/tags and preference availability. Older backups retain compatibility and offer Load snapshot details before restore. Restore preview includes the summary and top-level folder names; local recovery previews also show snapshot time and reason.
