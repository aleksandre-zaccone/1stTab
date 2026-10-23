import test from 'node:test';
import assert from 'node:assert/strict';
import {dismissVersionUpdate,pendingVersionUpdate,recordVersionUpdate,WHATS_NEW_KEY} from '../bookmark-core/whats-new.js';

function chromeWith(initial={}){
 const stored={...initial};
 return{
  stored,
  runtime:{getManifest:()=>({version:'2.2.2'})},
  storage:{local:{
   get:async key=>({[key]:structuredClone(stored[key])}),
   set:async values=>Object.assign(stored,structuredClone(values))
  }}
 };
}

test('first installs and non-update install reasons do not create an announcement',async()=>{
 const chrome=chromeWith();
 assert.equal(await recordVersionUpdate(chrome,{reason:'install'}),false);
 assert.equal(await recordVersionUpdate(chrome,{reason:'chrome_update'}),false);
 assert.equal(chrome.stored[WHATS_NEW_KEY],undefined);
 assert.equal(await pendingVersionUpdate(chrome,'2.2.2'),null);
});

test('updates show once per version and dismissal survives restarts without touching other data',async()=>{
 const chrome=chromeWith({
  'bookmarks.preferences.v1':{theme:'dark'},
  'bookmarks.metadata.v1':{example:{tags:['work']}}
 });
 assert.equal(await recordVersionUpdate(chrome,{reason:'update',previousVersion:'2.2.1'}),true);
 assert.deepEqual(await pendingVersionUpdate(chrome,'2.2.2'),{version:'2.2.2',previousVersion:'2.2.1'});
 await dismissVersionUpdate(chrome,'2.2.2');
 assert.equal(await pendingVersionUpdate(chrome,'2.2.2'),null);
 assert.deepEqual(chrome.stored['bookmarks.preferences.v1'],{theme:'dark'});
 assert.deepEqual(chrome.stored['bookmarks.metadata.v1'],{example:{tags:['work']}});
});

test('a subsequent version appears even when the prior version was dismissed',async()=>{
 const chrome=chromeWith({[WHATS_NEW_KEY]:{version:'2.2.1',previousVersion:'2.2.0',dismissedVersions:['2.2.1']}});
 chrome.runtime.getManifest=()=>({version:'2.2.2'});
 await recordVersionUpdate(chrome,{reason:'update',previousVersion:'2.2.1'});
 assert.deepEqual(await pendingVersionUpdate(chrome,'2.2.2'),{version:'2.2.2',previousVersion:'2.2.1'});
 assert.deepEqual(chrome.stored[WHATS_NEW_KEY].dismissedVersions,['2.2.1']);
});

test('same-version events are not treated as an update',async()=>{
 const chrome=chromeWith();
 assert.equal(await recordVersionUpdate(chrome,{reason:'update',previousVersion:'2.2.2'}),false);
 assert.equal(chrome.stored[WHATS_NEW_KEY],undefined);
});
