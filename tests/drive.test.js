import test from 'node:test';
import assert from 'node:assert/strict';
import {mockChrome} from './mock-chrome.js';
import {BookmarkLibrary} from '../bookmark-core/library.js';
import {makeExport,parseImport,importAdditive,importReview,MAX_IMPORT_BYTES} from '../bookmark-core/transfer.js';
import {enableDrive,disableDrive,uploadBackup,listBackups,downloadBackup,deleteBackup,restoreDriveBackup,driveStatus,DRIVE_KEY} from '../bookmark-core/drive.js';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
function fixture(){
 const api=mockChrome(),auth=[],calls=[];let allowed=false,user='one';
 api.permissions={request:async()=>allowed=true,contains:async()=>allowed,remove:async()=>{allowed=false;return true}};
 api.identity={getAuthToken:async options=>{auth.push(options);return {token:'private-token'}},removeCachedAuthToken:async()=>{},clearAllCachedAuthTokens:async()=>{}};
 const fetcher=async(url,options)=>{calls.push({url,options});if(url.includes('/about?'))return json({user:{permissionId:user,emailAddress:user+'@example.com'}});return json({files:[]})};
 return {api,auth,calls,fetcher,setUser:value=>user=value};
}
test('Drive connection is explicit, verifies authorized account, and never stores credentials',async()=>{
 const f=fixture();await assert.rejects(listBackups(f.api,f.fetcher),/Connect/);assert.equal(f.calls.length,0);
 await enableDrive(f.api,f.fetcher);assert.equal((await driveStatus(f.api)).account.label,'one@example.com');await listBackups(f.api,f.fetcher);
 assert.deepEqual(f.auth.map(v=>v.interactive),[true,false]);assert.ok(!JSON.stringify(f.api.local).includes('private-token'));
 await disableDrive(f.api);assert.equal((await driveStatus(f.api)).status,'disconnected');assert.ok(!JSON.stringify(f.api.local).includes('one@example.com'));
});
test('multipart upload is valid, portable and credential-free; failures retain uncertainty',async()=>{
 const f=fixture();await enableDrive(f.api,f.fetcher);const lib=new BookmarkLibrary(f.api);let sent;
 const doc=makeExport(await lib.load(),{theme:'dark',secret:'hidden',collapsed:['local-id']});
 const upload=async(url,options)=>{if(url.includes('/about?'))return f.fetcher(url,options);sent=options.body;return json({id:'backup',name:'Saved'})};
 await uploadBackup(f.api,()=>doc,upload);assert.ok(sent.includes('\r\nContent-Type:'));assert.ok(!sent.includes('\\r\\n'));assert.ok(sent.includes('appDataFolder'));assert.ok(!sent.includes('private-token'));assert.ok(!sent.includes('hidden'));assert.ok(!sent.includes('local-id'));assert.ok((await driveStatus(f.api)).lastBackupAt);
 await assert.rejects(uploadBackup(f.api,()=>doc,async(url,options)=>{if(url.includes('/about?'))return f.fetcher(url,options);throw Error('network-secret')}),/completion is unknown/);
 const status=await driveStatus(f.api);assert.ok(status.pendingUpload);assert.ok(!status.error.includes('network-secret'));
 const history=await listBackups(f.api,async(url,options)=>url.includes('/about?')?f.fetcher(url,options):json({files:[{id:'found',createdTime:'2026-10-18',appProperties:{operationId:status.pendingUpload}}]}));assert.equal(history.files.length,1);assert.equal((await driveStatus(f.api)).pendingUpload,null);
});
test('history traverses pages and detects a repeated cursor',async()=>{
 const f=fixture();await enableDrive(f.api,f.fetcher);
 const request=async(url,opts)=>url.includes('/about?')?f.fetcher(url,opts):json(new URL(url).searchParams.has('pageToken')?{files:[{id:'second'}]}:{files:[{id:'legacy'}],nextPageToken:'next'});
 assert.deepEqual((await listBackups(f.api,request)).files.map(v=>v.id),['legacy','second']);
 await assert.rejects(listBackups(f.api,async(url,opts)=>url.includes('/about?')?f.fetcher(url,opts):json({files:[],nextPageToken:'loop'})),/incomplete/);
});
test('401 retries once with silent authentication; persistent denial requires reconnect',async()=>{
 const f=fixture();await enableDrive(f.api,f.fetcher);let tries=0,removed=0;f.api.identity.removeCachedAuthToken=async()=>removed++;
 const request=async(url,opts)=>url.includes('/about?')?f.fetcher(url,opts):++tries===1?json({},401):json({files:[]});
 await listBackups(f.api,request);assert.equal(tries,2);assert.equal(removed,1);assert.ok(f.auth.slice(1).every(v=>v.interactive===false));
 await assert.rejects(listBackups(f.api,async(url,opts)=>url.includes('/about?')?f.fetcher(url,opts):json({},401)),/Reconnect/);assert.equal((await driveStatus(f.api)).status,'reconnect-required');
});
test('switching Google accounts or disconnecting invalidates restore previews',async()=>{
 const f=fixture();await enableDrive(f.api,f.fetcher);const lib=new BookmarkLibrary(f.api),doc=makeExport(await lib.load());
 const fetcher=async(url,opts)=>url.includes('/about?')?f.fetcher(url,opts):json(doc);
 const preview=await downloadBackup(f.api,'valid',fetcher);let applied=false;
 f.setUser('two');await assert.rejects(restoreDriveBackup(f.api,preview,async()=>applied=true,f.fetcher),/account changed/);assert.equal(applied,false);
 await enableDrive(f.api,f.fetcher);await assert.rejects(restoreDriveBackup(f.api,preview,async()=>applied=true,f.fetcher),/connection changed/);assert.equal(applied,false);
});
test('download limits, malformed documents and unsafe IDs fail before mutations',async()=>{
 const f=fixture();await enableDrive(f.api,f.fetcher);const route=response=>async(url,opts)=>url.includes('/about?')?f.fetcher(url,opts):response();
 await assert.rejects(downloadBackup(f.api,'bad/id',f.fetcher),/Invalid backup ID/);
 await assert.rejects(downloadBackup(f.api,'valid',route(()=>json({}))),/version 1 or 2/);
 await assert.rejects(downloadBackup(f.api,'valid',route(()=>new Response('x',{headers:{'content-length':String(MAX_IMPORT_BYTES+1)}}))),/20 MB/);
 await assert.rejects(downloadBackup(f.api,'valid',route(()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(MAX_IMPORT_BYTES+1));c.close()}})))),/20 MB/);
});
test('concurrent operations reject duplicate submissions and serialize disconnect with restore',async()=>{
 const f=fixture();await enableDrive(f.api,f.fetcher);let release,entered;const ready=new Promise(r=>entered=r),gate=new Promise(r=>release=r);
 const pending=listBackups(f.api,async(url,opts)=>{if(url.includes('/about?'))return f.fetcher(url,opts);entered();await gate;return json({files:[]})});await ready;
 await assert.rejects(listBackups(f.api,f.fetcher),/Another/);await assert.rejects(disableDrive(f.api),/Another/);release();await pending;await disableDrive(f.api);
});
test('delete is account-bound and does not change the local library',async()=>{
 const f=fixture();await enableDrive(f.api,f.fetcher);const before=await f.api.bookmarks.getTree(),s=await driveStatus(f.api);let deleted=false;
 await deleteBackup(f.api,'backup',async(url,opts)=>{if(url.includes('/about?'))return f.fetcher(url,opts);assert.equal(opts.method,'DELETE');deleted=true;return new Response(null,{status:204})},s.generation);
 assert.ok(deleted);assert.deepEqual(await f.api.bookmarks.getTree(),before);
});
test('version 2 restores portable preferences only on request and snapshots previous preferences',async()=>{
 const api=mockChrome(),lib=new BookmarkLibrary(api);await lib.migrate();api.local['bookmarks.preferences.v1']={theme:'light',collapsed:['bar']};
 const doc=parseImport(JSON.stringify(makeExport(await lib.load(),{theme:'dark',collapsed:['alien'],apiKey:'secret'})));
 await importAdditive(lib,doc,'other');assert.equal(api.local['bookmarks.preferences.v1'].theme,'light');
 await importAdditive(lib,doc,'other',{restorePreferences:true});assert.equal(api.local['bookmarks.preferences.v1'].theme,'dark');assert.deepEqual(api.local['bookmarks.preferences.v1'].collapsed,['bar']);assert.equal(api.local['bookmarks.lastBackup.v1'].preferences.theme,'light');
 assert.throws(()=>parseImport(JSON.stringify({format:'1stTab-bookmarks',version:3,folders:[]})),/version/);
});
test('restore review detects duplicates and stale edits before mutation',async()=>{
 const api=mockChrome(),lib=new BookmarkLibrary(api),state=await lib.load(),doc=parseImport(JSON.stringify(makeExport(state)));const review=importReview(state,doc);assert.equal(review.duplicates,3);
 await lib.update('a',{title:'Changed title'});const before=await api.bookmarks.getTree();await assert.rejects(importAdditive(lib,doc,'other',{expectedReview:JSON.stringify(review)}),/library changed/);assert.deepEqual(await api.bookmarks.getTree(),before);
});
test('preference storage failure reports completed imports and retains recovery',async()=>{
 const api=mockChrome(),lib=new BookmarkLibrary(api),doc=parseImport(JSON.stringify(makeExport(await lib.load(),{theme:'dark'})));const set=api.storage.local.set;
 api.storage.local.set=async value=>{if(value['bookmarks.preferences.v1'])throw Error('quota');return set(value)};
 await assert.rejects(importAdditive(lib,doc,'other',{restorePreferences:true}),/preferences could not be restored/);assert.ok(api.local['bookmarks.lastBackup.v1']);
});
test('denied permission and failed authentication never upload or leak underlying errors',async()=>{
 const f=fixture();f.api.permissions.request=async()=>false;await assert.rejects(enableDrive(f.api,f.fetcher),/declined/);assert.equal(f.calls.length,0);
 f.api.permissions.request=async()=>true;f.api.permissions.contains=async()=>true;f.api.identity.getAuthToken=async()=>{throw Error('private credential detail')};await assert.rejects(enableDrive(f.api,f.fetcher),/Reconnect/);assert.equal(f.calls.length,0);assert.ok(!JSON.stringify(f.api.local).includes('private credential detail'));
});
test('rate limits and missing backups provide actionable failures without local changes',async()=>{
 const f=fixture();await enableDrive(f.api,f.fetcher);const before=await f.api.bookmarks.getTree();
 for(const [status,message] of [[403,/denied access/],[429,/rate limit/],[404,/no longer exists/],[503,/503/]])await assert.rejects(listBackups(f.api,async(url,opts)=>url.includes('/about?')?f.fetcher(url,opts):json({},status)),message);
 assert.deepEqual(await f.api.bookmarks.getTree(),before);
});

test('auth diagnostics identify common setup errors without revealing raw error details',async()=>{
 const {authErrorMessage}=await import('../bookmark-core/drive.js');
 const api={runtime:{id:'abcdefghijklmnopabcdefghijklmnop'}};
 for(const [message,expected] of [['OAuth2 request failed: invalid_client private-token',/Item ID must match/],['The user is not signed in.',/Sign in to this Chrome profile/],['The user did not approve access.',/cancelled/],['access_denied private-token',/test user/],['network failure private-token',/network connection/],['unknown private-token',/Verify the publisher/]]){
  const result=authErrorMessage(Error(message),api);assert.match(result,expected);assert.ok(result.includes(api.runtime.id));assert.ok(!result.includes('private-token'));
 }
});
test('snapshot summary includes metadata counts and portable preference availability',async()=>{
 const {backupSummary}=await import('../bookmark-core/transfer.js');
 const api=mockChrome(),lib=new BookmarkLibrary(api);await lib.setMeta('a',{pinned:true,note:'Research',tags:['work']});
 const summary=backupSummary(parseImport(JSON.stringify(makeExport(await lib.load(),{theme:'dark'}))));
 assert.deepEqual(summary,{bookmarks:3,folders:4,favorites:1,notes:1,tagged:1,preferences:true});
 const f=fixture();await enableDrive(f.api,f.fetcher);let properties;
 await uploadBackup(f.api,async()=>makeExport(await lib.load(),{}),async(url,opts)=>{if(url.includes('/about?'))return f.fetcher(url,opts);properties=JSON.parse(opts.body.split('\r\n\r\n')[1].split('\r\n--')[0]).appProperties;return json({id:'backup'})});
 assert.equal(properties.bookmarks,'3');assert.equal(properties.folders,'4');assert.equal(properties.favorites,'1');assert.equal(properties.preferences,'true');
});
