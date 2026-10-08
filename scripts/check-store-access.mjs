import { pathToFileURL } from 'node:url';

const required = ['EXTENSION_ID', 'PUBLISHER_ID', 'CLIENT_ID', 'CLIENT_SECRET', 'REFRESH_TOKEN'];

// Only safe status fields are returned; OAuth responses and credentials must never be logged.
export async function checkStoreAccess(env = process.env, request = fetch) {
  const missing = required.filter(name => !env[name]?.trim());
  if (missing.length) throw new Error(`Missing GitHub Actions secrets: ${missing.map(name => `CHROME_${name}`).join(', ')}`);
  if (!/^[a-p]{32}$/.test(env.EXTENSION_ID)) throw new Error('CHROME_EXTENSION_ID must be the 32-letter Chrome Web Store item ID.');

  let tokenResponse;
  try {
    tokenResponse = await request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: env.CLIENT_ID,
        client_secret: env.CLIENT_SECRET,
        refresh_token: env.REFRESH_TOKEN,
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new Error('Could not reach Google OAuth. Check the connection and retry.');
  }
  if (!tokenResponse.ok) throw new Error(`Google OAuth failed (HTTP ${tokenResponse.status}). Check CHROME_CLIENT_ID, CHROME_CLIENT_SECRET and CHROME_REFRESH_TOKEN.`);
  const token = await tokenResponse.json().catch(() => { throw new Error('Google OAuth returned an invalid response.'); });
  if (typeof token.access_token !== 'string' || !token.access_token) throw new Error('Google OAuth did not return an access token.');

  let response;
  try {
    response = await request(`https://chromewebstore.googleapis.com/v2/publishers/${encodeURIComponent(env.PUBLISHER_ID)}/items/${env.EXTENSION_ID}:fetchStatus`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new Error('Could not reach the Chrome Web Store API. Check the connection and retry.');
  }
  if (!response.ok) throw new Error(`Chrome Web Store access failed (HTTP ${response.status}). Check publisher/item IDs, API enablement and the owning account's chromewebstore OAuth scope.`);
  const status = await response.json().catch(() => { throw new Error('Chrome Web Store returned an invalid response.'); });
  const revision = value => value ? {
    state: value.state,
    distributionChannels: value.distributionChannels?.map(channel => ({
      crxVersion: channel.crxVersion, deployPercentage: channel.deployPercentage,
    })),
  } : null;
  return {
    published: revision(status.publishedItemRevisionStatus),
    submitted: revision(status.submittedItemRevisionStatus),
    lastAsyncUploadState: status.lastAsyncUploadState ?? null,
    takenDown: status.takenDown === true,
    warned: status.warned === true,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await checkStoreAccess(), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
