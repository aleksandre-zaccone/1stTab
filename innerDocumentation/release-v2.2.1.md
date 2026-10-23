# 2.2.1 — Multilingual bookmarks and optional Drive backup

**Status: release-content draft.** The package identifies as 2.2.1, but this document does not mean the version has been submitted, approved, or published. Complete the publisher gates in [release-automation.md](release-automation.md) before announcing availability.

## What is new

- Use 1stTab in English, Russian, Georgian, German, or Japanese. Choose a language in Settings or follow the browser language. Bookmarks, folders, tags, notes, and URLs remain user content and are not translated.
- Create and review manual Google Drive backups from Settings. Drive access is optional and is requested only when the user connects. Backups use Google's private `appDataFolder`; restore is additive and includes a preview.
- Keep using the local bookmark library and JSON export/import without signing in or enabling Drive.

## Important limits

- Backups are user-started; scheduled backups and continuous cross-device sync are not included.
- Restore adds data and can create duplicate links. Review the preview before confirming.
- Disconnecting does not delete backups already stored in Google Drive. Delete them from 1stTab before disconnecting, or revoke the grant through Google account settings.
- Google authorization depends on the publisher's OAuth configuration for the installed extension ID. Automated tests mock Google responses; they do not validate the live publisher configuration.

## Website announcement draft

### Meet 1stTab 2.2.1: your bookmark library, in five languages

The 2.2.1 update makes 1stTab available in English, Russian, Georgian, German, and Japanese. Choose a language in Settings or let 1stTab follow your browser language while your saved bookmarks stay exactly as you wrote them.

This version also brings optional manual Google Drive backup and restore into the default extension. Connect only when you choose to; each backup is started by you and stored in the app-private Drive folder. Restore shows a preview and adds bookmarks rather than replacing your library. You can continue to organize bookmarks and use local export/import without connecting an account.

Scheduled backups and continuous sync are not part of this release. Google Drive access and public availability depend on the publisher's OAuth and Chrome Web Store review configuration. We will update this announcement when the reviewed version is available in the Store.
