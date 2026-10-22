import {chromium,browserOptions} from './browser-runtime.mjs';
import {execFileSync} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import assert from 'node:assert/strict';
const extension=mkdtempSync('/tmp/1sttab-drive-extension-'),profile=mkdtempSync('/tmp/1sttab-drive-profile-');
execFileSync('python3',['-c',`import zipfile;zipfile.ZipFile('dist/1stTab-bookmarks-optional.zip').extractall('${extension}')`]);
let context;
try{
 context=await chromium.launchPersistentContext(profile,{...browserOptions,ignoreDefaultArgs:['--disable-extensions'],args:[...browserOptions.args,`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});context.setDefaultTimeout(15000);
 const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');const base=worker.url().split('/').slice(0,3).join('/')+'/';
 const page=await context.newPage();await page.goto(base+'settings.html');await page.getByText('Library ready.',{exact:true}).waitFor();
 const result=await page.evaluate(async()=>{
  const drive=await import('./bookmark-core/drive.js'),{BookmarkLibrary}=await import('./bookmark-core/library.js'),{makeExport,importAdditive}=await import('./bookmark-core/transfer.js');
  // Native storage/bookmarks/locks; provider authorization and transport are test doubles.
  const api={storage:chrome.storage,bookmarks:chrome.bookmarks,permissions:{request:async()=>true,contains:async()=>true,remove:async()=>true},identity:{getAuthToken:async()=>({token:'fixture-only'}),removeCachedAuthToken:async()=>{},clearAllCachedAuthTokens:async()=>{}}};
  const lib=new BookmarkLibrary(api),root=(await lib.load()).tree[0].children.find(n=>!n.unmodifiable),folder=await lib.create({parentId:root.id,title:'Drive native fixture'}),link=await lib.create({parentId:folder.id,title:'Unicode café',url:'https://fixture.example/path'});await lib.setMeta(link.id,{tags:['research'],note:'Restore me',pinned:true});
  let saved;
  const json=v=>new Response(JSON.stringify(v));
  const transport=async(url,options)=>{
   if(url.includes('/about?'))return json({user:{permissionId:'fixture-account',emailAddress:'fixture@example.com'}});
   if(url.includes('/upload/')){saved=JSON.parse(options.body.split('\r\n\r\n')[2].split('\r\n--')[0]);return json({id:'backup-one'})}
   if(url.includes('alt=media'))return json(saved);
   return json({files:[{id:'backup-one',name:'Fixture backup'}]});
  };
  await drive.enableDrive(api,transport);await drive.uploadBackup(api,async()=>makeExport(await lib.load(),{theme:'dark'}),transport);
  const history=await drive.listBackups(api,transport),doc=await drive.downloadBackup(api,'backup-one',transport,history.generation),dest=await lib.create({parentId:root.id,title:'Restored fixture'});
  await drive.restoreDriveBackup(api,doc,()=>importAdditive(lib,doc,dest.id,{restorePreferences:true}),transport);
  const state=await lib.load(),copy=state.bookmarks.find(b=>b.id!==link.id&&b.title==='Unicode café');
  window.nativeDriveFixture={api,drive,doc,transport};
  return {note:state.metadata[copy.id].note,pinned:state.metadata[copy.id].pinned,theme:(await chrome.storage.local.get('bookmarks.preferences.v1'))['bookmarks.preferences.v1'].theme,snapshot:!!(await chrome.storage.local.get('bookmarks.lastBackup.v1'))['bookmarks.lastBackup.v1']};
 });assert.deepEqual(result,{note:'Restore me',pinned:true,theme:'dark',snapshot:true});
 // Prove that another extension page cannot start a conflicting Drive action.
 const second=await context.newPage();await second.goto(base+'manager.html');await second.getByText('Library ready.',{exact:true}).waitFor();
 await page.evaluate(()=>{window.lockTask=navigator.locks.request('1sttab-drive',()=>new Promise(r=>{window.releaseDriveLock=r}));});await page.waitForFunction(()=>!!window.releaseDriveLock);
 const locked=await second.evaluate(async()=>{const {withDriveLock}=await import('./bookmark-core/drive.js');try{await withDriveLock(chrome,async()=>{});return false}catch(e){return e.message.includes('Another')}});assert.ok(locked);await page.evaluate(()=>window.releaseDriveLock());
 await page.evaluate(async()=>{const {api,drive}=window.nativeDriveFixture;await drive.disableDrive(api)});
 const stale=await page.evaluate(async()=>{const {api,drive,doc,transport}=window.nativeDriveFixture;try{await drive.restoreDriveBackup(api,doc,()=>{throw Error('Unexpected mutation')},transport);return false}catch(e){return /connect/i.test(e.message)}});assert.ok(stale);
 console.log('Native Drive integration passed: packaged modules, real Chrome bookmarks/storage, metadata and preference round trip, recovery snapshot, cross-page lock and stale restore rejection. OAuth/Drive transport mocked.');
}finally{await context?.close();}
