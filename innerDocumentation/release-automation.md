# Chrome Web Store releases

The default `dist/1stTab-bookmarks.zip` is the local bookmark-only extension. Do not submit the optional integration candidate as this release.

## Configure once

In this repository's **Settings → Secrets and variables → Actions**, configure:

- `CHROME_EXTENSION_ID`: the existing store item's 32-letter ID, to update the same listing and installed users.
- `CHROME_PUBLISHER_ID`: Publisher → Settings in the Chrome Web Store developer dashboard.
- `CHROME_CLIENT_ID` and `CHROME_CLIENT_SECRET`: the OAuth web client with Chrome Web Store API enabled.
- `CHROME_REFRESH_TOKEN`: authorized by the account that owns the store item, using `https://www.googleapis.com/auth/chromewebstore`.

Use the [official API setup guide](https://developer.chrome.com/docs/webstore/using-api). Never commit credentials or paste them in issues. The access check only reports missing secret names and safe store status fields.

Complete the store listing and Privacy tabs, use current extension screenshots, and verify the public privacy URL: <https://1sttab-app.web.app/privacy>. Listing copy and permission explanations are in [store-submission.md](store-submission.md). Website deployment does not update the Chrome Web Store listing.

## Release a reviewed version

1. Update `manifest.json`, `package.json` and the privacy-page version label in a reviewed PR. The version must be greater than the previous uploaded store version. Merge with passing QA.
2. Create a tag such as `v2.0.0` at that exact merged commit on `main`. Source versions must match the tag; the workflow does not rewrite source files or push commits back to `main`.
3. In **Actions → Publish to Chrome Web Store → Run workflow**, choose `main`, enter the tag, and select **check**. This runs tests, packages the default ZIP, saves an artifact, validates credentials, and reads API v2 store status. It does not upload or submit.
4. Create a non-prerelease GitHub Release using the same tag. The `release: published` event rebuilds/verifies the tagged source, checks store access, uploads the package and submits it for review. Alternatively, run the workflow with **submit** for the existing tag; do not do both for the same version.
5. Inspect **Read submission status** and the Chrome Web Store dashboard. Submission is not approval: Google reviews the package and publishes it after approval under the item's existing visibility settings.

The uploader is pinned to `chrome-webstore-upload-cli@4.0.2`, which uses Chrome Web Store API v2. Calling it with **no subcommand** uploads and publishes. `upload --auto-publish` does not submit with this CLI.

## Failures and retries

- Missing secrets: configure the listed names and rerun **check**.
- OAuth HTTP 400/401: renew the owner-authorized refresh token and verify the OAuth client.
- Store HTTP 403/404: verify API enablement, OAuth scope, publisher ID, item ID and publisher membership.
- Version/tag mismatch or non-main ancestry: fix the release source through review and tag the correct commit. Never silently overwrite an existing release tag.
- Upload succeeded but submission failed: inspect the dashboard first. Complete missing listing/privacy fields and submit the already uploaded draft there. Do not blindly re-upload the same version.
- Google policy warning, rejection or takedown: read the dashboard's actual notice and resolve it before another submission.

GitHub's artifact download wraps the extension ZIP in another ZIP. Extract the artifact and upload its inner `1stTab-bookmarks.zip` for a manual submission; `manifest.json` must be at the root of the file sent to Chrome.
