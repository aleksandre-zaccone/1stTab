import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function validateRelease(tag, manifestVersion, packageVersion) {
  const version = typeof tag === 'string' && tag.startsWith('v') ? tag.slice(1) : '';
  const parts = version.split('.');
  if (version.trim() !== version || !/^(0|[1-9]\d*)(\.(0|[1-9]\d*)){0,3}$/.test(version)
      || parts.some(part => Number(part) > 65535)
      || parts.every(part => Number(part) === 0)) {
    throw new Error('Use a Chrome-compatible release tag such as v2.0.0 (1–4 integers, 0–65535).');
  }
  if (manifestVersion !== version || packageVersion !== version) {
    throw new Error(`Release ${tag} must match manifest.json (${manifestVersion}) and package.json (${packageVersion}). Update and review source versions before tagging.`);
  }
  return version;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    console.log(`Verified release version: ${validateRelease(process.argv[2], manifest.version, pkg.version)}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
