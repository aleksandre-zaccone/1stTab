# Build, publish and Google setup, step by step

One walkthrough for everything between "the code is written" and "the new version is live in the Chrome Web Store". It complements [release-automation.md](release-automation.md) (the release checklist) and [optional-integrations.md](optional-integrations.md) (Drive data flow); when they disagree with this page, the workflow files in `.github/workflows/` and the scripts in `scripts/` win.

Two separate Google integrations exist and they use **different OAuth clients**. Mixing them up is the most common cause of "it worked yesterday":

| Purpose | Client type | Where it is used |
| --- | --- | --- |
| Uploading packages to the store | **Web application** (needs a client secret) | GitHub Actions secrets, `chrome-webstore-upload-cli` |
| Letting the extension read and write Drive | **Chrome Extension**, Item ID = store item ID | `manifest.json` → `oauth2.client_id` |

---

## Step 1 — Build and check locally

```bash
npm test          # unit tests, including manifest/package/privacy version agreement
bash build.sh     # packages dist/1stTab-bookmarks-<manifest version>.zip and verifies it
```

The ZIP name comes from `manifest.json`. `scripts/verify-package.py` checks the asset list, that every referenced local resource exists, the module import graph, source parity and package boundaries, and that the `oauth2` block has the expected shape.

Load it: extract the ZIP into a dedicated folder, open `chrome://extensions`, enable Developer mode, **Load unpacked**, pick that folder. Never load the repository root.

> An unpacked extension gets an ID derived from its **folder path**, not from the store. Move or rename the folder and it is effectively a different extension. If local Drive testing keeps breaking, add the store's public `key` to `manifest.json` so unpacked builds run with the store ID.

## Step 2 — Google Cloud: the publishing client

Project `sttab-495923` (number `254305727394`).

1. Enable **Chrome Web Store API** in that project.
2. **Clients → Create client → Web application**, name it `1stTab GitHub publishing`.
3. Authorized redirect URI: `https://developers.google.com/oauthplayground`.
4. Copy the **Client ID** and **Client secret** now. The secret is only shown once; use **Add secret** to rotate instead of recreating the client.
5. **Data Access → Add or remove scopes** must include `https://www.googleapis.com/auth/chromewebstore`. Without it the token request fails where the extension's own `drive.appdata` scope would not be affected.

## Step 3 — Mint the refresh token

The token must be authorized by the Google account that **owns the store item**, using the client from step 2.

1. Open <https://developers.google.com/oauthplayground>.
2. Gear icon → **Use your own OAuth credentials** → paste that client ID and secret.
3. Scope: `https://www.googleapis.com/auth/chromewebstore` → **Authorize APIs** → sign in as the store owner.
4. **Exchange authorization code for tokens** → copy the **refresh token** (not the access token).

CLI alternative: `npx chrome-webstore-upload-keys` does the same loopback flow. It needs a client **with a secret**, so a Chrome Extension client JSON cannot be used there; if you create a Desktop-app client for it, set all three OAuth secrets from that client.

> An OAuth app in **Testing** issues 7-day refresh tokens. Publish the app (Step 6) before minting the long-lived token, otherwise the workflow keeps dying weekly.

## Step 4 — Repository secrets

<https://github.com/aleksandre-zaccone/1stTab/settings/secrets/actions> — repository **secrets**, never variables:

| Secret | Value |
| --- | --- |
| `CHROME_CLIENT_ID` | Web application client ID |
| `CHROME_CLIENT_SECRET` | That client's secret |
| `CHROME_REFRESH_TOKEN` | Token minted in step 3 with that client |
| `CHROME_EXTENSION_ID` | Store item ID, `bigolehnkpljdbocpkljjmkkocefinbh` |
| `CHROME_PUBLISHER_ID` | Developer Dashboard → Publisher → Settings |

```bash
gh secret set CHROME_REFRESH_TOKEN --repo aleksandre-zaccone/1stTab
gh secret list --repo aleksandre-zaccone/1stTab     # shows the update timestamp
```

All three OAuth secrets must come from the same client: a token minted by one client is invalid for another.

## Step 5 — Google Cloud: the extension's Drive client

This one ships inside the package, so a mistake only becomes visible after users install it.

1. **Clients → Create client → Chrome Extension**, name `1stTab Chrome Web Store`.
2. **Item ID**: `bigolehnkpljdbocpkljjmkkocefinbh` — the store item, exactly.
3. Copy the client ID into `manifest.json` → `oauth2.client_id`. Scopes stay `https://www.googleapis.com/auth/drive.appdata`.
4. Rebuild and ship the ZIP. The manifest travels with the package; changing the client has no effect until a new version is uploaded.

`chrome.identity.getAuthToken` validates the (client, extension ID) pair before Google shows consent. A client created for an unpacked build fails with `OAuth2 request failed … invalid_client`, and the extension reports "Google rejected the OAuth client…". A Chrome Extension client cannot be repointed to another Item ID — create a new client instead.

## Step 6 — OAuth consent screen

**Google Auth Platform → Branding / Audience / Data Access.**

| Setting | Value |
| --- | --- |
| User type | **External** (Internal restricts authorization to one Workspace org) |
| Publishing status | **In production** |
| Scopes | `drive.appdata` (extension) and `chromewebstore` (publishing) |
| Test users | keep your own account listed |

Sensitive scopes (Calendar, Tasks, Gmail, …) are unnecessary: they force a verification review and a user-visible warning on a bookmark-backup permission. `drive.appdata` and `chromewebstore` are non-sensitive, so publishing is immediate.

## Step 7 — Ownership, brand verification, privacy policy

Google verifies that the publisher owns the domains used by the OAuth app.

1. **Search Console** (<https://search.google.com/search-console>) → add the site → verify ownership.
   - HTML-file method: the token file must be served at the **site root** and must actually be committed and deployed. A file sitting untracked in the repo looks identical locally and 404s in production.
   - Domain property: DNS `TXT google-site-verification=…` at the registrar.
2. **Branding → Authorized domains** must list the domain of the homepage and privacy policy (`1st-tab.com`).
3. The privacy policy itself must exist at a public URL and state, for Google user data: which scope, what data is received, purpose, storage and retention, deletion and revocation, that it is not sold or shared, and the Limited Use sentence naming the **Google API Services User Data Policy** — not the Chrome Web Store policy.
4. Sign in to Search Console with the account that owns the Cloud project, or add that account as a project Owner.

## Step 8 — Release

1. Bump `manifest.json`, `package.json` and the `privacy.html` version label together (`tests/release-pages.test.js` fails otherwise). `.github/workflows/publish.yml` also refuses a tag that does not match both source versions and a commit not reachable from `main`.
2. Feature branch → MR into `integration`. QA Build runs only for MRs into `main`.
3. `integration` → `main` MR, wait for QA Build, then merge.
4. Tag the merged `main` commit and push the tag:
   ```bash
   git fetch origin && git tag vX.Y.Z origin/main
   git -c credential.helper='!gh auth git-credential' push https://github.com/aleksandre-zaccone/1stTab.git vX.Y.Z
   ```
5. Dry run — validates version, branch, tests, ZIP, credentials and store status, uploads nothing:
   ```bash
   gh workflow run "Publish to Chrome Web Store" --repo aleksandre-zaccone/1stTab -f tag=vX.Y.Z -f operation=check
   ```
   The input is `operation` (`check` | `submit`).
6. Upload and submit by publishing a **non-prerelease** GitHub release for the same tag (a draft release does nothing):
   ```bash
   gh release create vX.Y.Z --repo aleksandre-zaccone/1stTab --target main --title "1stTab X.Y.Z" --notes-file notes.md
   ```
7. Watch the run. Success means *submitted*, not live. Review status lives in the Developer Dashboard.

## Step 9 — After approval

Install the store build (not an unpacked copy), then: **Settings → Backup & Google Drive → Connect**. The consent screen must show only "…see, create, and delete its own configuration data in your Google Drive". Run one backup and one restore. Google calls are mocked in every automated suite, so this is the only real proof that the client binding and consent configuration work.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `pathspec 'refs/tags/vX.Y.Z' did not match any file(s)` in the Publish run | The tag was never pushed | Step 8.4, then rerun |
| `invalid_client` / "Google rejected the OAuth client" when connecting Drive | Manifest client is a Chrome Extension client for a different extension ID | Step 5; ship a new package |
| Publishing fails with HTTP 401 | Refresh token belongs to another client, was revoked, or came from a Testing app and expired | Re-mint (step 3) with the client in the secrets |
| Publishing fails with 403/404 | Chrome Web Store API disabled, `chromewebstore` scope missing, or wrong item/publisher ID | Steps 2 and 6 |
| Upload succeeds, "does not meet the requirements" | Dashboard listing, privacy practices or account requirements incomplete | Resolve in the Developer Dashboard; credentials already work |
| "Home page URL is not registered to you" | Search Console ownership unproven, usually an undeployed verification file | Step 7.1 |
| "Privacy policy does not have sufficient content" | Missing scope/data/retention/deletion or Limited Use wording | Step 7.3 |
| Refresh token dies every ~7 days | OAuth app still in Testing | Step 6: publish to production, re-mint |

Never commit tokens, client secrets or the store ZIP's credentials; `dist/` is ignored but a stray `client_secret_*.json` in the repo is not.
