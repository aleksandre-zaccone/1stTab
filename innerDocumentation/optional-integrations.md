# Optional bookmark integrations — release candidate

Build `python3 scripts/package.py --optional` and `python3 scripts/verify-package.py --optional`. The resulting `dist/1stTab-bookmarks-optional.zip` uses version 2.0.0 and optional identity/OpenAI/Google API access. The default 2.0.0 ZIP retains only local functionality. Extract the selected ZIP before loading; do not rename the optional manifest in a working tree as a deployment shortcut.

## AI organization
Select 1–100 bookmarks, open Settings → Library tools → Optional AI organization, and inspect the displayed URLs and recipient disclosure. Supply your own OpenAI API key and a supported model ID. The key remains in the dialog and is not persisted. Grant provider access, then request suggestions. Only selected IDs/titles/URLs and writable folder IDs/names are sent. An optional find query is sent when you ask to retrieve links from the selected set; returned matches are displayed without mutations. Notes and unselected links are excluded. Returned IDs/folders are validated; suggestions start unchecked and require user selection before applying. The user may revoke host access at any time. Provider costs and data retention follow the provider account; no claims about zero provider retention are made.

## Google Drive
Connect grants optional identity and only the Google API host. OAuth requests drive.appdata, not Calendar, Tasks or email. Backups contain bookmarks/notes/tags, never keys/tokens, and use the private appDataFolder. Uploads are explicit; there is no timer or auto-upload. Restore previews an additive import and can create duplicates. Backups remain until the user explicitly deletes them. Disconnect clears Chrome cached tokens and removes extension permission; users can separately revoke the app in Google account settings.

The repository's existing OAuth client ID is retained only in the optional manifest. The publisher must verify that Google Cloud's OAuth client and consent screen are authorized for the final extension ID and scopes before release. A live sign-in/provider round trip cannot be validated without that configuration and an authorized account. Failed auth reports actionable configuration instructions and leaves the local library usable.

## Validation
Tests cover denied permissions with zero network calls, minimal AI payloads, invalid provider output/IDs, provider failures, credential exclusion, Drive appDataFolder uploads and invalid downloads. Native/browser validation exercises disabled integration UI and user consent forms without using real accounts. Live provider billing, OAuth consent and backup retention/deletion must be checked by the publisher before releasing the optional package.
