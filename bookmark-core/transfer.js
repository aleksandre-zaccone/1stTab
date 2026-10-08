import { normalizeMeta, safeUrl, indexTree } from './library.js';
export function makeExport(state) {
  function item(n) { return { title:n.title, ...(n.url ? {url:n.url,metadata:normalizeMeta(state.metadata[n.id])} : {children:(n.children||[]).map(item)}) }; }
  return {format:'1stTab-bookmarks',version:1,exportedAt:new Date().toISOString(),folders:state.tree.flatMap(r=>r.children||[]).map(item)};
}
export function parseImport(text) {
  if(text.length>20_000_000)throw Error('Import is limited to 20 MB.');
  const doc=JSON.parse(text);if(doc.format!=='1stTab-bookmarks'||doc.version!==1||!Array.isArray(doc.folders))throw Error('Choose a version 1 1stTab bookmark export.');
  let count=0,bookmarks=0,folders=0;
  function check(n,depth=0){if(++count>50000||depth>50)throw Error('Import is too large or deeply nested.');if(!n||typeof n.title!=='string'||n.title.length>500)throw Error('Invalid item title.');
    if(typeof n.url==='string'){bookmarks++;return{title:n.title,url:safeUrl(n.url),metadata:normalizeMeta(n.metadata)}}
    if(!Array.isArray(n.children))throw Error('Invalid folder.');folders++;return{title:n.title,children:n.children.map(x=>check(x,depth+1))};}
  return {folders:doc.folders.map(n=>check(n)),counts:{get bookmarks(){return bookmarks},get folders(){return folders}}};
}
export async function importAdditive(lib,doc,parentId) {
  return lib.serialize(async()=>{
    const s=await lib.load();lib.destination(s,parentId);await lib.backup('Before importing bookmarks');
    let added=0; const items={...s.metadata}; const container=await lib.api.bookmarks.create({parentId,title:`Imported ${new Date().toLocaleDateString()}`});
    async function insert(n,p){const v=await lib.api.bookmarks.create({parentId:p,title:n.title,...(n.url?{url:n.url}:{})});added++;
      if(n.url)items[v.id]=normalizeMeta(n.metadata);else for(const child of n.children)await insert(child,v.id);}
    let failure;
    try{for(const n of doc.folders)await insert(n,container.id)}catch(e){failure=e}
    // Keep metadata for every bookmark Chrome accepted, even if a later item failed.
    try{await lib.api.storage.local.set({'bookmarks.metadata.v1':{version:1,items}})}catch(e){
      throw Error(`Import stopped after ${added} items. Bookmark metadata could not be saved. Keep the source export for recovery; the pre-import snapshot is retained. ${e.message}`);
    }
    if(failure)throw Error(`Import stopped after ${added} items. Partial import is in “${container.title}”; tags and notes for imported items are retained. Existing bookmarks are unchanged. ${failure.message}`);
    return added;
  });
}
export function cleanupCandidates(tree) {
  const {bookmarks,folders}=indexTree(tree),groups=new Map();
  for(const b of bookmarks){const list=groups.get(b.url)||[];list.push(b);groups.set(b.url,list)}
  return{duplicates:[...groups.values()].filter(g=>g.length>1),emptyFolders:folders.filter(f=>f.parentId&&!f.managed&&!(f.children||[]).length)};
}
