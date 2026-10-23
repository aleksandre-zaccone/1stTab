import {readFileSync} from 'node:fs';

// Must match scripts/package.py: the packaged ZIP carries the manifest version.
const {version}=JSON.parse(readFileSync('manifest.json','utf8'));
export const packageZip=`dist/1stTab-bookmarks-${version}.zip`;
