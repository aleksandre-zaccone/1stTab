import {chromium,browserOptions} from './browser-runtime.mjs';
import {execFileSync} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import assert from 'node:assert/strict';
const directory=mkdtempSync('/tmp/1sttab-preview-'),file=directory+'/preview.html';
execFileSync('python3',['scripts/preview-workspace.py',file]);
const browser=await chromium.launch(browserOptions),errors=[];
try{const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('file://'+file);await page.getByText('Library ready.',{exact:true}).waitFor();assert.equal(await page.locator('.bookmark').count(),12);await page.getByRole('button',{name:'Settings',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Preview recovery snapshot',exact:true}).count(),0);assert.deepEqual(errors,[]);console.log('Freshly generated preview passed: current modules, 12 starter favorites, Settings and removed recovery controls.');}finally{await browser.close();}
