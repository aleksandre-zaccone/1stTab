import test from 'node:test';import assert from 'node:assert/strict';
import {BookmarkLibrary,META_KEY}from'../bookmark-core/library.js';import{makeExport,parseImport,importAdditive,cleanupCandidates}from'../bookmark-core/transfer.js';import{mockChrome}from'./mock-chrome.js';
test('export/import preserves metadata in a separate folder without exporting secrets',async()=>{const api=mockChrome(),lib=new BookmarkLibrary(api);await lib.migrate();await lib.setMeta('a',{tags:['work'],note:'my note',pinned:true});api.local['1stTab.openaiKey']='secret';const doc=makeExport(await lib.load());assert.ok(!JSON.stringify(doc).includes('secret'));const parsed=parseImport(JSON.stringify(doc));const before=(await lib.load()).bookmarks.length;await importAdditive(lib,parsed,'other');const s=await lib.load();assert.equal(s.bookmarks.length,before+parsed.counts.bookmarks);assert.equal(s.metadata.a.note,'my note');assert.ok(s.bookmarks.some(b=>b.id!=='a'&&s.metadata[b.id]?.note==='my note'));assert.ok(api.local['bookmarks.lastBackup.v1'])});
test('malformed or executable imports are rejected before mutations',()=>{for(const s of ['{}','bad',JSON.stringify({format:'1stTab-bookmarks',version:1,folders:[{title:'X',url:'javascript:alert(1)'}]})])assert.throws(()=>parseImport(s))});
test('cleanup conservatively groups exact URLs only',async()=>{const api=mockChrome(),lib=new BookmarkLibrary(api);await lib.create({parentId:'bar',title:'dup',url:'https://example.com/docs'});await lib.create({parentId:'bar',title:'different',url:'https://example.com/docs?x=1'});const c=cleanupCandidates((await lib.load()).tree);assert.equal(c.duplicates.length,1);assert.equal(c.duplicates[0].length,2);assert.ok(!c.emptyFolders.some(n=>n.managed))});
test('backup failure prevents any additive import changes',async()=>{const api=mockChrome(),lib=new BookmarkLibrary(api);const doc=parseImport(JSON.stringify(makeExport(await lib.load())));const before=(await lib.load()).bookmarks.length;api.storage.local.set=async()=>{throw Error('quota')};await assert.rejects(importAdditive(lib,doc,'other'),/quota/);assert.equal((await lib.load()).bookmarks.length,before)});
test('searching 10000 links remains bounded',async()=>{const{searchBookmarks}=await import('../bookmark-core/library.js');const tree=[{id:'root',children:[{id:'bar',parentId:'root',children:Array.from({length:10000},(_,i)=>({id:String(i),parentId:'bar',title:`Link ${i}`,url:`https://example.com/${i}`}))}]}];const start=performance.now();assert.equal(searchBookmarks(tree,{}, {query:'Link 9999'}).length,1);const elapsed=performance.now()-start;console.log(`10000-link index/filter: ${elapsed.toFixed(1)} ms`);assert.ok(elapsed<2000)});

test('partial imports keep accepted bookmark metadata when a later create fails',async()=>{
 const api=mockChrome(),lib=new BookmarkLibrary(api);await lib.migrate();await lib.setMeta('a',{note:'existing note'});
 const doc=parseImport(JSON.stringify({format:'1stTab-bookmarks',version:1,folders:[{title:'Accepted',url:'https://accepted.example',metadata:{tags:['keep'],note:'imported note',pinned:true}},{title:'Rejected',url:'https://rejected.example'}]}));
 const create=api.bookmarks.create;api.bookmarks.create=async value=>{if(value.title==='Rejected')throw Error('create failed');return create(value)};
 await assert.rejects(importAdditive(lib,doc,'other'),/tags and notes for imported items are retained/);
 const state=await lib.load(),accepted=state.bookmarks.find(b=>b.title==='Accepted');assert.ok(accepted);assert.equal(state.metadata[accepted.id].note,'imported note');assert.deepEqual(state.metadata[accepted.id].tags,['keep']);assert.equal(state.metadata[accepted.id].pinned,true);assert.equal(state.metadata.a.note,'existing note');
});
test('metadata write failure preserves the source recovery instruction',async()=>{
 const api=mockChrome(),lib=new BookmarkLibrary(api);await lib.migrate();const doc=parseImport(JSON.stringify(makeExport(await lib.load())));
 const set=api.storage.local.set;api.storage.local.set=async value=>{if(value[META_KEY])throw Error('quota');return set(value)};
 await assert.rejects(importAdditive(lib,doc,'other'),/Keep the source export for recovery/);assert.ok(api.local['bookmarks.lastBackup.v1']);
});
test('imports land directly in the chosen destination folder without a wrapper',async()=>{
 const api=mockChrome(),lib=new BookmarkLibrary(api);await lib.migrate();
 const doc=parseImport(JSON.stringify({format:'1stTab-bookmarks',version:1,folders:[{title:'Search',children:[{title:'Google',url:'https://www.google.com/',metadata:{tags:['search'],note:'Default',pinned:true}}]},{title:'Loose link',url:'https://loose.example'}]}));
 assert.equal(await importAdditive(lib,doc,'folder'),3);
 const state=await lib.load(),work=state.nodes.get('folder');
 assert.deepEqual(work.children.map(n=>n.title),['Other','Search','Loose link']);
 assert.ok(!state.folders.some(f=>/^Imported /.test(f.title)));
 const google=state.bookmarks.find(b=>b.url==='https://www.google.com/');assert.equal(state.nodes.get(google.parentId).parentId,'folder');assert.equal(state.metadata[google.id].note,'Default');
});
