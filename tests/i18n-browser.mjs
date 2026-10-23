import {chromium,browserOptions} from './browser-runtime.mjs';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('.'),errors=[];
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!path.startsWith(root+'/'))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch(browserOptions);
 const context=await browser.newContext({locale:'de-DE'});
 const mock=(await readFile('tests/mock-chrome.js','utf8')).replace('export function mockChrome','function mockChrome');
 await context.addInitScript({content:mock+`;window.chrome=mockChrome();chrome.i18n={getUILanguage:()=>navigator.language};chrome.runtime={getURL:p=>location.origin+'/'+p,getManifest:()=>({version:'2.2.0'})};chrome.tabs={create:async()=>{}};`});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/settings.html`);
 await page.getByRole('heading',{name:'Einstellungen',exact:true}).waitFor();
 assert.equal(await page.locator('html').getAttribute('lang'),'de');
 assert.equal(await page.locator('#language-choice').inputValue(),'auto');
 const before=await page.evaluate(async()=>JSON.stringify(await chrome.bookmarks.getTree()));
 for(const [code,title] of [['ru','Настройки'],['ka','პარამეტრები'],['ja','設定'],['en','Settings'],['de','Einstellungen']]){
  await page.locator('#language-choice').selectOption(code);
  await page.getByRole('heading',{name:title,exact:true}).waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),code);
  assert.equal(await page.evaluate(async()=> (await chrome.storage.local.get('bookmarks.language.v1'))['bookmarks.language.v1']),code);
 }
 assert.equal(await page.evaluate(async()=>JSON.stringify(await chrome.bookmarks.getTree())),before);
 await page.locator('#language-choice').selectOption('ja');
 await page.getByRole('heading',{name:'設定',exact:true}).waitFor();
 await page.getByRole('button',{name:'ライブラリに戻る',exact:true}).click();
 await page.getByRole('button',{name:'ブックマークを追加',exact:true}).first().click();
 await page.getByRole('dialog',{name:'ブックマークを保存',exact:true}).waitFor();
 await page.getByLabel('タイトル',{exact:true}).fill('Settings — ქართული 日本語');
 await page.getByLabel('URL',{exact:true}).fill('https://example.org/language-test');
 await page.getByRole('button',{name:'保存',exact:true}).click();
 await page.locator('#folders .shortcut').first().click();
 await page.getByRole('link',{name:'Settings — ქართული 日本語',exact:true}).waitFor();
 await page.locator('#search').fill('ქართული');
 await page.locator('.settings-button').click();
 await page.locator('#language-choice').selectOption('en');
 await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();
 await page.getByRole('button',{name:'Back to library',exact:true}).click();
 assert.equal(await page.locator('#search').inputValue(),'ქართული');
 await page.getByRole('link',{name:'Settings — ქართული 日本語',exact:true}).waitFor();
 // Simulate a storage change from another extension page.
 await page.evaluate(()=>chrome.storage.local.set({'bookmarks.language.v1':'ru'}));
 await page.getByRole('button',{name:'Настройки',exact:true}).waitFor();
 await page.getByRole('link',{name:'Settings — ქართული 日本語',exact:true}).waitFor();
 assert.equal(await page.locator('#search').inputValue(),'ქართული');
 await page.locator('.settings-button').click();await page.locator('#language-choice').selectOption('auto');
 await page.getByRole('heading',{name:'Einstellungen',exact:true}).waitFor();
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'German settings must fit mobile width');
 assert.deepEqual(errors,[]);console.log('Localization browser checks passed: detection, five languages, storage, cross-page changes, dialogs, user data, filters and mobile layout.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
