import {portablePreferences, PREFS_KEY} from './preferences.js';
export const MAX_IMPORT_BYTES=20_000_000;
import { normalizeMeta, safeUrl, indexTree } from './library.js';
export function makeExport(state, preferences) {
  function item(n) { return { title:n.title, ...(n.url ? {url:n.url,metadata:normalizeMeta(state.metadata[n.id])} : {children:(n.children||[]).map(item)}) }; }
  return {format:'1stTab-bookmarks',version:preferences===undefined?1:2,...(preferences===undefined?{}:{preferences:portablePreferences(preferences)}),exportedAt:new Date().toISOString(),folders:state.tree.flatMap(r=>r.children||[]).map(item)};
}
export function parseImport(text) {
  if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_IMPORT_BYTES)throw Error('Import is limited to 20 MB.');
  const doc=JSON.parse(text);if(!doc||doc.format!=='1stTab-bookmarks'||![1,2].includes(doc.version)||!Array.isArray(doc.folders))throw Error('Choose a version 1 or 2 1stTab bookmark export.');
  let count=0,bookmarks=0,folders=0;
  function check(n,depth=0){if(++count>50000||depth>50)throw Error('Import is too large or deeply nested.');if(!n||typeof n.title!=='string'||n.title.length>500)throw Error('Invalid item title.');
    if(typeof n.url==='string'){bookmarks++;return{title:n.title,url:safeUrl(n.url),metadata:normalizeMeta(n.metadata)}}
    if(!Array.isArray(n.children))throw Error('Invalid folder.');folders++;return{title:n.title,children:n.children.map(x=>check(x,depth+1))};}
  if(doc.version===2&&(!doc.preferences||typeof doc.preferences!=='object'||Array.isArray(doc.preferences)))throw Error('Invalid backup preferences.');
  return {...(doc.version===2?{preferences:portablePreferences(doc.preferences)}:{}),folders:doc.folders.map(n=>check(n)),counts:{get bookmarks(){return bookmarks},get folders(){return folders}}};
}
export async function importAdditive(lib,doc,parentId,{restorePreferences=false,expectedReview}={}) {
  return lib.serialize(async()=>{
    const s=await lib.load();const target=lib.destination(s,parentId);if(expectedReview&&JSON.stringify(importReview(s,doc))!==expectedReview)throw Error('The library changed. Preview the restore again before importing.');await lib.backup('Before importing bookmarks');
    let added=0; const items={...s.metadata};
    async function insert(n,p){const v=await lib.api.bookmarks.create({parentId:p,title:n.title,...(n.url?{url:n.url}:{})});added++;
      if(n.url)items[v.id]=normalizeMeta(n.metadata);else for(const child of n.children)await insert(child,v.id);}
    let failure;
    try{for(const n of doc.folders)await insert(n,parentId)}catch(e){failure=e}
    // Keep metadata for every bookmark Chrome accepted, even if a later item failed.
    try{await lib.api.storage.local.set({'bookmarks.metadata.v1':{version:1,items}})}catch(e){
      throw Error(`Import stopped after ${added} items. Bookmark metadata could not be saved. Keep the source export for recovery; the pre-import snapshot is retained. ${e.message}`);
    }
    if(failure)throw Error(`Import stopped after ${added} items. Items added before the failure remain in “${target.title||'Untitled folder'}”; tags and notes for imported items are retained. Existing bookmarks are unchanged. ${failure.message}`);
    if(restorePreferences&&doc.preferences)try{const previous=(await lib.api.storage.local.get(PREFS_KEY))[PREFS_KEY]||{};await lib.api.storage.local.set({[PREFS_KEY]:{...previous,...portablePreferences(doc.preferences)}})}catch{throw Error(`Imported ${added} items, but preferences could not be restored. The pre-import snapshot is retained.`)}
    return added;
  });
}
export function cleanupCandidates(tree) {
  const {bookmarks,folders}=indexTree(tree),groups=new Map();
  for(const b of bookmarks){const list=groups.get(b.url)||[];list.push(b);groups.set(b.url,list)}
  return{duplicates:[...groups.values()].filter(g=>g.length>1),emptyFolders:folders.filter(f=>f.parentId&&!f.managed&&!(f.children||[]).length)};
}

export function importReview(state,doc){
 const byUrl=new Map();for(const b of state.bookmarks){let url=b.url;try{url=safeUrl(url)}catch{}const list=byUrl.get(url)||[];list.push(b);byUrl.set(url,list);}
 let duplicates=0,metadataDifferences=0;const seen=new Set();
 function walk(nodes){for(const n of nodes){if(n.url){const matches=byUrl.get(n.url)||[];if(matches.length||seen.has(n.url))duplicates++;if(matches.some(b=>JSON.stringify(normalizeMeta(state.metadata[b.id]))!==JSON.stringify(normalizeMeta(n.metadata))))metadataDifferences++;seen.add(n.url);}else walk(n.children);}}walk(doc.folders);
 return {duplicates,metadataDifferences,revision:JSON.stringify({tree:state.tree,metadata:state.metadata})};
}

export function backupSummary(doc){
 const summary={bookmarks:0,folders:0,favorites:0,notes:0,tagged:0,preferences:Boolean(doc.preferences)};
 function walk(nodes){for(const n of nodes){if(n.url){summary.bookmarks++;const m=normalizeMeta(n.metadata);if(m.pinned)summary.favorites++;if(m.note)summary.notes++;if(m.tags.length)summary.tagged++;}else{summary.folders++;walk(n.children||[]);}}}walk(doc.folders);return summary;
}
