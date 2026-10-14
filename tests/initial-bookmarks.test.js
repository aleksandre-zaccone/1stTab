import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeBookmarks,INITIAL_BOOKMARKS_KEY} from '../bookmark-core/initial-bookmarks.js';
import {BookmarkLibrary,META_KEY} from '../bookmark-core/library.js';
import {parseImport} from '../bookmark-core/transfer.js';
import {mockChrome} from './mock-chrome.js';
const text=await readFile(new URL('../initial_bookmarks.json',import.meta.url),'utf8');
const doc=parseImport(text);
const request=async()=>({ok:true,text:async()=>text});
function api(){const chrome=mockChrome();chrome.runtime={getURL:path=>'chrome-extension://test/'+path};return chrome}
test('starter file contains exactly the selected 12 favorites',()=>{
 const entries=doc.folders.flatMap(folder=>folder.children);
 assert.equal(doc.counts.folders,1);
 assert.equal(doc.counts.bookmarks,12);
 assert.deepEqual(entries.map(n=>n.url),['https://www.google.com/','https://mail.google.com/','https://drive.google.com/','https://claude.ai/','https://chatgpt.com/','https://gemini.google.com/','https://1sttab-app.web.app/','https://www.youtube.com/','https://music.youtube.com/','https://calendar.google.com/','https://duckduckgo.com/','https://brave.com/']);
 assert.ok(entries.every(n=>n.metadata.pinned));
});
test('first install adds favorites while preserving existing Chrome bookmarks',async()=>{
 const chrome=api(),lib=new BookmarkLibrary(chrome),before=await lib.load();
 assert.equal(await initializeBookmarks(chrome,request,true),12);
 const state=await lib.load();assert.equal(state.bookmarks.length,before.bookmarks.length+12);
 for(const b of before.bookmarks)assert.deepEqual(state.nodes.get(b.id),b);
 const starter=state.folders.find(n=>n.title==='1stTab');assert.equal(starter.children.length,12);
 for(const b of starter.children)assert.equal(state.metadata[b.id].pinned,true);
 assert.deepEqual(chrome.local[INITIAL_BOOKMARKS_KEY],{completed:true});
 const snapshot=JSON.stringify(state.tree);
 assert.equal(await initializeBookmarks(chrome,request,true),0);
 assert.equal(await initializeBookmarks(chrome,request),0);
 assert.equal(JSON.stringify((await lib.load()).tree),snapshot);
});
test('existing installations with no pending first-install marker never seed',async()=>{
 const chrome=api(),before=await chrome.bookmarks.getTree();let calls=0;
 assert.equal(await initializeBookmarks(chrome,async()=>{calls++;return request()}),0);
 assert.equal(calls,0);assert.deepEqual(await chrome.bookmarks.getTree(),before);
});
test('duplicate URLs are reused and keep their tags and notes',async()=>{
 const chrome=api(),lib=new BookmarkLibrary(chrome);
 const google=await lib.create({parentId:'other',title:'My Google',url:'https://www.google.com/'});
 await lib.setMeta(google.id,{tags:['personal'],note:'Keep this note',pinned:false});
 assert.equal(await initializeBookmarks(chrome,request,true),11);
 const state=await lib.load();assert.equal(state.bookmarks.filter(n=>n.url===google.url).length,1);
 assert.equal(state.nodes.get(google.id).title,'My Google');
 assert.equal(state.metadata[google.id].note,'Keep this note');
 assert.deepEqual(state.metadata[google.id].tags,['personal']);assert.equal(state.metadata[google.id].pinned,true);
});
test('partial initialization resumes without duplicating folders or bookmarks',async()=>{
 const chrome=api(),create=chrome.bookmarks.create;let count=0;
 chrome.bookmarks.create=async item=>{if(item.url&&++count===4)throw Error('Temporary failure');return create(item)};
 await assert.rejects(initializeBookmarks(chrome,request,true),/Temporary failure/);
 assert.equal(chrome.local[INITIAL_BOOKMARKS_KEY].pending,true);
 chrome.bookmarks.create=create;
 assert.equal(await initializeBookmarks(chrome,request),9);
 const state=await new BookmarkLibrary(chrome).load(),folders=state.folders.filter(n=>n.title==='1stTab');
 assert.equal(folders.length,1);assert.equal(folders[0].children.length,12);
 assert.ok(folders[0].children.every(n=>state.metadata[n.id].pinned));
});
test('concurrent first-install calls seed only once',async()=>{
 const chrome=api();const counts=await Promise.all([initializeBookmarks(chrome,request,true),initializeBookmarks(chrome,request,true)]);
 assert.equal(counts.reduce((a,b)=>a+b),12);
 const state=await new BookmarkLibrary(chrome).load();assert.equal(state.folders.find(n=>n.title==='1stTab').children.length,12);
});
test('failed metadata writes resume and restore favorite flags without duplicate URLs',async()=>{
 const chrome=api(),set=chrome.storage.local.set;let failed=false;
 chrome.storage.local.set=async value=>{if(value[META_KEY]&&Object.keys(value[META_KEY].items).length===2&&!failed){failed=true;throw Error('Storage failure')}return set(value)};
 await assert.rejects(initializeBookmarks(chrome,request,true),/Storage failure/);
 await initializeBookmarks(chrome,request);
 const state=await new BookmarkLibrary(chrome).load(),starter=state.folders.find(n=>n.title==='1stTab');
 assert.equal(starter.children.length,12);assert.ok(starter.children.every(n=>state.metadata[n.id].pinned));
});
