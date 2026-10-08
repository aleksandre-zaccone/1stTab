import {indexTree,META_KEY,normalizeMeta}from'./library.js';
export const UNDO_KEY='bookmarks.undo.v1';
export function fingerprint(s){const idx=indexTree(s.tree);return JSON.stringify({nodes:[...idx.nodes.values()].map(n=>({id:n.id,parentId:n.parentId,title:n.title,url:n.url||'',managed:n.managed,children:n.children?.map(c=>c.id)})).sort((a,b)=>a.id.localeCompare(b.id)),metadata:s.metadata})}
export async function recordOperation(lib,label,operation){
  // Cross-document operation lock covers before/after capture; inner repository writes use a distinct lock.
  const perform=async()=>{const before=await lib.load(),previous=(await lib.api.storage.local.get(UNDO_KEY))[UNDO_KEY];await lib.api.storage.local.set({[UNDO_KEY]:{version:1,status:'pending',label,before:{tree:before.tree,metadata:before.metadata}}});let result,error;try{result=await operation()}catch(e){error=e}const after=await lib.load();if(fingerprint(before)!==fingerprint(after))await lib.api.storage.local.set({[UNDO_KEY]:{version:1,status:'ready',label,before:{tree:before.tree,metadata:before.metadata},after:fingerprint(after)}});else if(previous)await lib.api.storage.local.set({[UNDO_KEY]:previous});else await lib.api.storage.local.remove(UNDO_KEY);if(error)throw error;return result};
  return globalThis.navigator?.locks?navigator.locks.request('1sttab-operation',perform):perform();
}
export async function undoOperation(lib){
 const run=async()=>lib.serialize(async()=>{const log=(await lib.api.storage.local.get(UNDO_KEY))[UNDO_KEY];if(!log||log.status!=='ready')throw Error('No supported operation is available to undo.');const now=await lib.load();if(fingerprint(now)!==log.after)throw Error('The library changed after this operation. Undo stopped to avoid overwriting other edits. Use snapshot import for recovery.');await lib.backup('Before undo');
 const before=indexTree(log.before.tree),current=indexTree(now.tree),mapping=new Map([...before.nodes.keys()].map(id=>[id,id]));
 // Remove newly created subtrees, highest-level first.
 const extra=[...current.nodes.values()].filter(n=>!before.nodes.has(n.id));const extraIds=new Set(extra.map(n=>n.id));for(const n of extra){if(extraIds.has(n.parentId))continue;lib.editable(now,n.id);await(n.url?lib.api.bookmarks.remove(n.id):lib.api.bookmarks.removeTree(n.id))}
 async function restore(nodes,parent){for(const n of nodes){let id=n.id;if(!current.nodes.has(n.id)){if(!parent)throw Error('Chrome root structure changed.');const made=await lib.api.bookmarks.create({parentId:parent,title:n.title,...(n.url?{url:n.url}:{})});id=made.id;mapping.set(n.id,id)}else{const existing=current.nodes.get(n.id);if(existing.title!==n.title||existing.url!==n.url){lib.editable(now,n.id);await lib.api.bookmarks.update(n.id,{title:n.title,...(n.url?{url:n.url}:{})})}if(parent&&existing.parentId!==parent){lib.editable(now,n.id);await lib.api.bookmarks.move(n.id,{parentId:parent})}}if(n.children)await restore(n.children,id)}}
 try{await restore(log.before.tree,null);
 // Restore native sibling order after recreating and moving nodes. The Chrome root is immutable.
 const restored=await lib.load();
 for(const folder of before.folders){if(!folder.parentId||folder.managed)continue;const parentId=mapping.get(folder.id);const desired=(folder.children||[]).map(n=>mapping.get(n.id));const actual=(restored.nodes.get(parentId)?.children||[]).map(n=>n.id);for(let i=0;i<desired.length;i++){if(actual[i]===desired[i])continue;lib.editable(restored,desired[i]);const from=actual.indexOf(desired[i]);if(from<0)throw Error('Restored bookmark order is incomplete.');await lib.api.bookmarks.move(desired[i],{parentId,index:i});actual.splice(i,0,actual.splice(from,1)[0]);}}
 const items={};for(const[id,m]of Object.entries(log.before.metadata))if(mapping.has(id))items[mapping.get(id)]=normalizeMeta(m);await lib.api.storage.local.set({[META_KEY]:{version:1,items}});await lib.api.storage.local.remove(UNDO_KEY)}catch(e){await lib.api.storage.local.set({[UNDO_KEY]:{...log,status:'failed'}});throw Error('Undo stopped partway through. Pre-undo snapshot retained. '+e.message)}
 });return globalThis.navigator?.locks?navigator.locks.request('1sttab-operation',run):run();
}
