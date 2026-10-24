# 2.2.2 — In-app update announcement

**Status: release-content draft.** The package identifies as 2.2.2, but this
document does not mean the version has been submitted, approved, or published.
2.2.1 is the version listed in the Chrome Web Store. Complete the publisher gates
in [release-automation.md](release-automation.md) before announcing availability.

## What is new

- After an extension update, the library page and the side panel show one compact
  notice: **Updated to 1stTab 2.2.2**, a one-line summary, `View changes` and
  `Dismiss`.
- `View changes` opens the matching post on the website
  (<https://1sttab-app.web.app/news-whats-new.html>) in a new tab. Nothing opens
  automatically, and the extension does not fetch the post.
- `Dismiss` records the version, so the notice stays closed after reloads and
  browser restarts. Dismissing on one surface removes it from every other open
  surface (library page, side panel) without a reload.
- A later version announces once; a dismissed version never returns.
- First installation never announces, and reloading an unpacked build of the same
  version never announces.

## How it works

`background.js` records a version change from the `onInstalled` event with reason
`update`, so announcements require a real version change rather than a fresh
profile. State lives in `chrome.storage.local` under `bookmarks.whatsNew.v1` as
`{version, previousVersion, dismissedVersions}`; it is separate from bookmark
metadata, preferences, language choice and backup data, so uninstall cleanup and
export/import are unaffected.

`bookmark-core/whats-new.js` owns those transitions and `bookmark-core/ui.js`
renders the notice between the search row and the toolbar. The title interpolates
`chrome.runtime.getManifest().version` at runtime, so the announced version cannot
drift from the shipped manifest.

## Localization

The title, summary, `View changes` and `Dismiss` are translated in the English,
Russian, Georgian, German and Japanese catalogs.

## No new permissions

This release adds no permissions and changes no stored bookmark data.

## Release maintenance

For the next announced version, update the notice copy in the five locale catalogs
and publish the matching website post at `news-whats-new.html`. Bump
`manifest.json`, `package.json` and the `privacy.html` version label together;
`tests/release-pages.test.js` fails when they disagree.

## Local testing

Build with `bash build.sh` and load the extracted `dist/1stTab-bookmarks-2.2.2.zip`
directory through Chrome Extensions → Developer mode → Load unpacked. A fresh
install must not display the notice.

To test a real update, keep an unpacked 2.2.1 installation in a separate profile,
save a bookmark with notes and tags plus an appearance preference, replace the
contents of that same directory with the 2.2.2 build and click Reload. Keep the
directory and extension ID unchanged, open the library, and confirm the notice
appears while saved data survives. Do not uninstall the previous version.

To preview the notice on a disposable installation, run this in the extension's
service-worker console and reload the library page:

```js
await chrome.storage.local.set({'bookmarks.whatsNew.v1': {version: '2.2.2', previousVersion: '2.2.1', dismissedVersions: []}});
```

It only writes the announcement key; dismissing it afterwards restores the normal
state.

## Automated coverage

`tests/whats-new.test.js` covers update classification, first install, repeated
events, per-version dismissal and preservation of unrelated storage.
`tests/background.test.js` checks that only update installs record a version, and
`tests/browser.mjs` checks the rendered notice, its dismissal on a second surface
and the layout between the search row and the bookmark grid. The five catalogs are
checked by `tests/i18n.test.js`.
