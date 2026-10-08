# Companion web-library exploration

Initial companion: an offline-capable website accepting a user-selected versioned JSON export, validating it locally and rendering a searchable library. The website cannot access chrome.bookmarks directly. Import does not authorize a connection to the browser or an upload. Use textContent for imported content and safe URL validation; never embed executable export fields.

Connection design for a later release: explicit extension-to-service authorization, per-user authentication and minimal metadata scope; short-lived tokens; encrypt transport; isolate users on the server; versioned export schema; append/merge preview and conflict resolution; no background sync until separately enabled. Do not use broad externally_connectable access. Access to the extension should be restricted to the configured companion origin and a verified message schema if such a bridge is ever implemented.

Acceptance for this exploration: document the import-only MVP and safe live-connection boundary. The bookmark product website currently provides install guidance/privacy/support; it does not claim direct browser access or live synchronization. Live service deployment, authentication and storage need their own scoped project.
