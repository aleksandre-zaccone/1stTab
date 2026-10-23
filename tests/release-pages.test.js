import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('packaged sources and the privacy page carry the manifest version', async () => {
 const {version} = JSON.parse(await read('manifest.json'));
 assert.equal(JSON.parse(await read('package.json')).version, version);
 const label = (await read('privacy.html')).match(/<p>Version ([0-9][0-9.]*)<\/p>/)?.[1];
 assert.equal(label, version, 'privacy.html version label must match manifest.json');
});
