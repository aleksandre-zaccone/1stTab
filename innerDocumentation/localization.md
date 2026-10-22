# Interface languages (ALE-99)

The v2.2 interface supports English (`en`), Russian (`ru`), Georgian (`ka`), German (`de`) and Japanese (`ja`). Settings → Language defaults to Automatic — browser language. Chrome's `i18n.getUILanguage()` selects the language; browser previews use `navigator.language`. Regional variants use their base language, and unsupported languages fall back to English.

A manual selection is stored in `chrome.storage.local` as `bookmarks.language.v1`. It survives restarts and propagates to open manager, settings and side-panel pages. The selection is deliberately separate from portable appearance preferences, so restoring another device's backup does not change the local interface language. Switching language preserves search filters, selected bookmarks and unsaved dialog fields.

## Translation files

Each language has a Chrome-format catalog at `_locales/<code>/messages.json`. The catalogs use identical keys. English messages are also the source strings for the shared `bookmark-core/i18n.js` helper. Calls use `t('Select {title}', {title: bookmark.title})`; placeholders are interpolated as text, never HTML. User titles, folder names, URLs, notes and tags are never translated. Design names such as Enterprise and Atelier remain names.

`Intl.NumberFormat`, `Intl.DateTimeFormat` and `Intl.PluralRules` use the selected interface locale. Optional `_one` message variants handle singular count messages; the base message handles other forms. Missing messages fall back to English. Service-layer errors remain canonical for classification and storage, and known error messages are translated when displayed. Unknown browser/provider diagnostics are preserved.

Both manifests use `default_locale: en` and localized name, description, action tooltip and shortcut description. Chrome controls those manifest strings using its own language; the in-app override does not change Chrome's extension-management interface. No new permissions or remote translation service are required.

## Adding or editing translations

1. Keep the same message key in every catalog. Preserve all `{placeholder}` names. Treat values such as bookmark titles and version identifiers as literal user data.
2. When changing an English source message, update its call sites and each translation together. Use descriptive, stable keys; do not translate keys.
3. For a new language, add its catalog and native-language label/code in `LANGUAGES`, and extend the package verification/test locale lists.
4. Run `npm test`, package verification, and the `i18n-browser.mjs` / `i18n-native.mjs` suites. Native tests need a Chromium build that accepts unpacked extensions.
5. Ask native speakers to review wording before publication, especially Georgian and Japanese. The initial translations have automated completeness/interpolation checks, not professional linguistic review.

The standalone generated preview embeds the catalogs and uses the same translation helper. User guide and legal documents are separate English documents; this change localizes their navigation labels, not their document bodies.

## Verification

Coverage includes browser-language detection, regional/unsupported fallback, all five manual choices, localized counts, catalog/placeholder parity, translated dialogs and accessibility names, unchanged bookmark content, filter preservation, narrow-screen layout, real Chrome manager/panel propagation, unsaved dialog preservation, persisted language after browser restart, and packaged manifest/catalog loading.
