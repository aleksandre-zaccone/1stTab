import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRelease } from '../scripts/check-release.mjs';
import { checkStoreAccess } from '../scripts/check-store-access.mjs';

test('release tags must match both source versions and Chrome version rules', () => {
  assert.equal(validateRelease('v2.0.0', '2.0.0', '2.0.0'), '2.0.0');
  assert.equal(validateRelease('v65535.0.1.0', '65535.0.1.0', '65535.0.1.0'), '65535.0.1.0');
  for (const tag of [undefined, '2.0.0', 'v0.0.0', 'v02.0.0', 'v2.0.0-beta', 'v65536.0', 'v1.2.3.4.5', 'v2.0.0\n']) {
    assert.throws(() => validateRelease(tag, '2.0.0', '2.0.0'));
  }
  assert.throws(() => validateRelease('v2.0.1', '2.0.0', '2.0.1'), /must match/);
  assert.throws(() => validateRelease('v2.0.0', '2.0.0', '1.1.1'), /must match/);
  assert.throws(() => validateRelease('v2.0.0\n', '2.0.0\n', '2.0.0\n'), /Chrome-compatible/);
});

const env = { EXTENSION_ID: 'a'.repeat(32), PUBLISHER_ID: 'publisher', CLIENT_ID: 'test-client', CLIENT_SECRET: 'secret-value', REFRESH_TOKEN: 'refresh-value' };
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status });

test('missing or invalid store configuration makes no network calls', async () => {
  const noRequest = () => { throw new Error('Unexpected network call'); };
  await assert.rejects(checkStoreAccess({}, noRequest), /CHROME_EXTENSION_ID.*CHROME_PUBLISHER_ID.*CHROME_CLIENT_ID.*CHROME_CLIENT_SECRET.*CHROME_REFRESH_TOKEN/);
  await assert.rejects(checkStoreAccess({ ...env, EXTENSION_ID: 'wrong' }, noRequest), /32-letter/);
});

test('access check uses API v2 and reports only store status', async () => {
  const calls = [];
  const result = await checkStoreAccess(env, async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1 ? reply({ access_token: 'access-secret' }) : reply({
      publicKey: 'excluded', arbitrary: 'excluded',
      publishedItemRevisionStatus: { state: 'PUBLISHED', distributionChannels: [{ crxVersion: '1.0.0', deployPercentage: 100 }] },
      submittedItemRevisionStatus: { state: 'PENDING_REVIEW', distributionChannels: [{ crxVersion: '2.0.0' }] },
    });
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.body.get('refresh_token'), env.REFRESH_TOKEN);
  assert.equal(calls[1].url, `https://chromewebstore.googleapis.com/v2/publishers/publisher/items/${env.EXTENSION_ID}:fetchStatus`);
  assert.equal(calls[1].options.headers.Authorization, 'Bearer access-secret');
  assert.equal(result.submitted.state, 'PENDING_REVIEW');
  assert.equal(result.published.distributionChannels[0].crxVersion, '1.0.0');
  assert.doesNotMatch(JSON.stringify(result), /secret|excluded|refresh-value/);
});

test('access failures do not expose token response or network exception secrets', async () => {
  await assert.rejects(checkStoreAccess(env, async () => reply({ error: 'secret-value' }, 401)), error => /HTTP 401/.test(error.message) && !error.message.includes('secret-value'));
  await assert.rejects(checkStoreAccess(env, async () => { throw new Error('refresh-value'); }), /Could not reach Google OAuth/);
  await assert.rejects(checkStoreAccess(env, async () => reply({})), /did not return an access token/);
  await assert.rejects(checkStoreAccess(env, async () => new Response('secret-value')), /invalid response/);
  let calls = 0;
  await assert.rejects(checkStoreAccess(env, async () => ++calls === 1 ? reply({ access_token: 'access-secret' }) : reply({ error: 'access-secret' }, 403)), error => /HTTP 403/.test(error.message) && !error.message.includes('access-secret'));
});
