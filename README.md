# 1stTab v2 — Bookmark Manager

Save, organize and find Chrome bookmarks in a full-page library or bookmark-only side panel. This release replaces the old dashboard runtime; historical JSX/dashboard sources remain in the repository and are excluded from the shipping ZIP.

Fresh installations start with the Enterprise light theme and Favorites in grid view. The initial_bookmarks.json file supplies 12 starter favorites on first install; existing bookmarks are preserved and duplicate URLs are skipped. Updates do not seed the starter list again. Saved theme, sizing and folder preferences are preserved. Both package variants identify as version **2.1.1**.

## Run

Requires Chrome 116+ and Python 3. Run `bash build.sh`; extract `dist/1stTab-bookmarks.zip`, then select the extracted folder in Chrome → Extensions → Developer mode → Load unpacked. Use the packaged folder rather than the repository root, which retains legacy assets.

Click the toolbar icon on a web page to open a save form. Alt+Shift+P opens the side panel. Ctrl/Cmd+K focuses saved-link search. New tabs open the bookmark manager. Your search provider is unchanged.

## Features

- Collection workspace with colorful cards, compact bookmark cards and list rows, sticky search, collapsible folder tree and mobile drawer.
- Settings with five design themes (Prism, Atelier, Studio, Pop, Enterprise), light/dark/system color modes, independent text and icon sizes, spacing, note visibility and reduced motion. Library tools (import/export, recovery and cleanup) are grouped inside Settings. Appearance, view and sort save locally and update across surfaces.
- Native bookmark create/edit, folder actions, drag/drop moves and same-folder sorting, bulk move/tag/delete.
- Keyboard/touch bulk move dialog; native order restored by undo in Settings → Library tools.
- Saved-link title/URL/note/tag search; folder, tag, domain and favorite filters with a labeled Show/Hide control, active-filter badge and remembered visibility in every view.
- Local tags, bookmark notes and favorites; snapshot-backed migration from previous metadata.
- Versioned JSON export, additive import with preview, snapshots before import/move/delete, additive snapshot recovery and conflict-aware undo.
- Exact-URL duplicate review and empty-folder review; light/dark appearance and keyboard controls.

No account or external network service is required. Bookmarks follow Chrome’s sync settings; metadata stays on this device. Backups exclude API keys and credentials. Additive recovery can duplicate links; review the result before cleanup.

## Verify

Run `npm test`, then `bash build.sh`. Browser checks in `tests/browser.mjs`, `tests/settings-browser.mjs`, and `tests/workspace-customization.mjs` use an installed Playwright package. Set `PLAYWRIGHT_MODULE` to a module path for an external installation, and `CHROME_PATH` to use a specific Chromium binary. `CHROME_NO_SANDBOX=1` is available for isolated test environments that require it. Native checks (`node tests/native-extension.mjs`, also with `--optional`) require Chromium or Chrome for Testing with extension loading enabled; they create isolated temporary profiles. No live browser bookmark library is modified by those checks.

See `innerDocumentation/release-verification.md` for results and remaining native Chrome checks, `innerDocumentation/store-submission.md` for reviewer steps, and `innerDocumentation/bookmark-scope.md` for scope and permissions.

## Optional integrations candidate

Run `npm run build:optional` to build the separate 2.1.1 optional candidate with disabled-by-default OpenAI organization and Google Drive backup. See `innerDocumentation/optional-integrations.md` for consent, data flow and publisher OAuth setup. The default local package requires no account or provider permissions. Live provider/OAuth verification remains necessary before publishing the optional package.

## Design previews and settings checks

`python3 scripts/preview-workspace.py` bundles the real UI with the 12 first-install starter favorites into `innerDocumentation/workspace-preview.html`. Use `--design atelier` (or studio/pop) with an output path for another preset. Preview appearance settings persist per page; preview bookmark changes remain temporary. These previews never use your Chrome bookmark library.

Run `node tests/preferences.test.js` for preference bounds/defaults and `node tests/settings-browser.mjs` for themes, scaling, saved settings, system mode, responsive layout and reset. Native extension checks also verify cross-page updates and persistence after browser restart. Run `python3 scripts/build-design-styles.py` after editing design-styles.json to regenerate scoped themes.

The generated workspace preview clears mock test bookmarks and runs the real first-install initializer with initial_bookmarks.json. Older design-direction previews still contain the separate 40-bookmark test fixture; those samples are excluded from the packaged extension.

Settings now opens as a full page. Resize the folder sidebar by dragging its right edge; choose Rectangle, Square, Rounded, Circle or Sphere in Settings → Card shapes. Read the included `manual.html` guide and `terms.html` product terms from Settings. Dialog backgrounds are dimmed without blur.

## GitHub Actions and Chrome Web Store publishing

### Pipeline and branch flow

Work on a feature branch based on `integration`, merge an MR into `integration`, then promote the reviewed changes through an `integration` → `main` MR. Publishing uses a release tag whose commit is reachable from `main`.

| Workflow / event | What happens |
| --- | --- |
| [QA Build](.github/workflows/qa-build.yml): MR targeting `main` | Install dependencies, run unit tests, build and verify the ZIP, save `1stTab-QA-Build` artifact |
| MR targeting `integration` | No automatic QA from the current workflow; run local checks before merging |
| Merge into `main` | Does not by itself publish to Chrome |
| [Publish](.github/workflows/publish.yml): published non-prerelease GitHub release | Validate version and branch, test, build, save ZIP, check store access, upload and submit for review |
| Manual Publish run with `operation=check` | Validate/test/build and check credentials and item status; no upload or submission |
| Manual Publish run with `operation=submit` | Run the publishing pipeline, including upload and submission |

The publishing workflow uses Node.js 20 and `chrome-webstore-upload-cli@4.0.2`. It serializes store publishing runs rather than cancelling an earlier submission. It publishes `dist/1stTab-bookmarks.zip`, not the optional integrations package. Google review is required after submission; a successful job is not proof that the new version is already live.

### Step 1: Create Google publishing credentials

Choose one Google Cloud project for publishing; it can differ from the website's Firebase project `sttab-app`. `sttab-495923` can be used for a fresh extension setup. Keep the OAuth client ID, secret, and refresh token from the same client together.

1. In [Google Cloud Console](https://console.cloud.google.com/), select the project and enable **Chrome Web Store API**.
2. Open [Google Auth Platform](https://console.cloud.google.com/auth/overview); configure the app name and contact email if prompted.
3. Under **Clients**, create a **Web application**, named `1stTab GitHub publishing`.
4. Leave JavaScript origins empty; add `https://developers.google.com/oauthplayground` as the authorized redirect URI.
5. Save the new Client ID and Client secret immediately. Existing secret values cannot be retrieved later; use **Add secret** to rotate one on the same client.

Use the [Google OAuth client management guide](https://support.google.com/cloud/answer/15549257) for the current console controls.

### Step 2: Generate the refresh token

1. Open [OAuth Playground](https://developers.google.com/oauthplayground); click the gear and enable **Use your own OAuth credentials**.
2. Enter the client ID and secret from step 1.
3. Enter scope `https://www.googleapis.com/auth/chromewebstore`.
4. Click **Authorize APIs**; sign in with the Google account that owns the store item and allow access.
5. Click **Exchange authorization code for tokens**; save the **refresh token**, not the short-lived access token.

See [Google's publishing API setup](https://developer.chrome.com/docs/webstore/using-api). External OAuth apps in **Testing** issue refresh tokens that expire after seven days for this scope. For ongoing automation, set the app to **Production** under Audience and complete any requirements Google presents, then generate a new token. Production tokens can still expire or be revoked; see [Google's expiration rules](https://developers.google.com/identity/protocols/oauth2#expiration).

### Step 3: Save the repository secrets

Open [repository Actions secrets](https://github.com/aleksandre-zaccone/1stTab/settings/secrets/actions), then create or update these **repository secrets**, not variables:

| Secret | Value |
| --- | --- |
| `CHROME_CLIENT_ID` | Publishing Web application OAuth client ID |
| `CHROME_CLIENT_SECRET` | Secret from that same OAuth client |
| `CHROME_REFRESH_TOKEN` | Refresh token authorized by the store owner using that client |
| `CHROME_EXTENSION_ID` | Existing item ID: `bigolehnkpljdbocpkljjmkkocefinbh` |
| `CHROME_PUBLISHER_ID` | Publisher ID shown in the Developer Dashboard under Publisher → Settings |

The workflow does not read repository variables. The store item and publisher IDs stay the same when OAuth credentials are rotated. Find them in the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).

GitHub CLI can save each value interactively:

```bash
gh auth login
gh secret set CHROME_CLIENT_ID --repo aleksandre-zaccone/1stTab
gh secret set CHROME_CLIENT_SECRET --repo aleksandre-zaccone/1stTab
gh secret set CHROME_REFRESH_TOKEN --repo aleksandre-zaccone/1stTab
gh secret set CHROME_EXTENSION_ID --repo aleksandre-zaccone/1stTab
gh secret set CHROME_PUBLISHER_ID --repo aleksandre-zaccone/1stTab
```

Keep credentials out of source, logs, chat, and command arguments. When rotating a client secret, keep the previous secret enabled until the new credentials pass the access check.

### Step 4: Check access without publishing

In [Publish to Chrome Web Store](https://github.com/aleksandre-zaccone/1stTab/actions/workflows/publish.yml), choose **Run workflow**, branch `main`, an existing valid release tag, and operation **check**. For example:

```bash
gh workflow run publish.yml --repo aleksandre-zaccone/1stTab --ref main -f tag=v2.1.1 -f operation=check
gh run list --repo aleksandre-zaccone/1stTab --workflow publish.yml
gh run view RUN_ID --repo aleksandre-zaccone/1stTab --log-failed
```

Replace `RUN_ID` with the actual numeric run ID. The tag must already exist, its version must match the tagged `manifest.json` and `package.json`, and its commit must be on `main`. Passing this check proves OAuth and store-item access work; it does not validate every dashboard submission requirement.

### Step 5: Release a new version

1. On your feature branch, increase `manifest.json`, `manifest.optional.json`, and `package.json` to the same new version. Update version references and release notes. Use a version greater than the uploaded/live version.
2. Run `npm test` and `bash build.sh`; if changing the optional package, also run `npm run build:optional`.
3. Merge feature → `integration`, then open `integration` → `main`. Wait for **QA Build** to pass and review the ZIP artifact before merging.
4. Before publishing, finish the item's Store listing, Privacy practices, permission justifications, and any account requirements in the Developer Dashboard. Explain newly added permissions such as `favicon`.
5. After merging into `main`, open [GitHub Releases](https://github.com/aleksandre-zaccone/1stTab/releases) → **Draft a new release**. Create a tag matching the source version, for example `v2.1.2` for version `2.1.2`, targeting the reviewed commit on `main`. Leave **prerelease** unchecked and publish the release.
6. Watch the Publish workflow. It saves the verified ZIP artifact, checks authentication, uploads, and submits the update for Google review.
7. Confirm the submitted version and review status in the dashboard. Monitor approval there; publication follows the item's release settings.

A draft release does not trigger publishing. Do not move an existing published tag to new code or rerun an upload just to check status.

### Troubleshoot a failed publication

| Failure | Next step |
| --- | --- |
| Version/tag or branch validation fails | Match the tag to source versions and promote its commit to `main` |
| Google OAuth HTTP 401 | Verify the client ID/secret match; regenerate the refresh token with that client and update the three OAuth secrets |
| Store access HTTP 403/404 | Check API enablement, OAuth scope, item/publisher IDs, and the authorizing account's access |
| Upload succeeds but publishing says requirements are unmet | Open the dashboard and resolve its specific missing fields; credentials may already be working |
| Dashboard says Pending review | Leave the submission in review; do not rerun upload/submit |

For a missing `favicon` explanation, the current behavior can be described as: “Displays Chrome's saved website icons beside bookmarks so users can recognize their saved links.” Confirm that all explanations and privacy disclosures match the shipped package.

The API's generic publishing error may not name the incomplete field. Resolve the dashboard errors and submit the uploaded version there. If upload already succeeded, rerunning the full workflow can encounter a duplicate-version upload; prefer the dashboard for that pending package. Manual and Actions submissions use Google's same [review process](https://developer.chrome.com/docs/webstore/review-process).

The website has a separate Firebase pipeline: see its [README](https://github.com/aleksandre-zaccone/1sttab-website#github-actions-deployment-pipeline).
