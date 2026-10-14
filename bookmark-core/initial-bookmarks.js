import {BookmarkLibrary,META_KEY,normalizeMeta,safeUrl} from './library.js';
import {parseImport} from './transfer.js';
export const INITIAL_BOOKMARKS_KEY='bookmarks.initialBookmarks.v1';
const libraries=new WeakMap();
export async function initializeBookmarks(api,request=fetch,firstInstall=false){
 let lib=libraries.get(api);if(!lib){lib=new BookmarkLibrary(api);libraries.set(api,lib)}
 if(firstInstall)await lib.serialize(async()=>{
  const data=await api.storage.local.get(INITIAL_BOOKMARKS_KEY);
  if(!data[INITIAL_BOOKMARKS_KEY])await api.storage.local.set({[INITIAL_BOOKMARKS_KEY]:{pending:true}});
 });
 const data=await api.storage.local.get(INITIAL_BOOKMARKS_KEY);
 if(!data[INITIAL_BOOKMARKS_KEY]?.pending)return 0;
 await lib.migrate();
 return lib.serialize(async()=>{
  const data=await api.storage.local.get(INITIAL_BOOKMARKS_KEY);
  if(!data[INITIAL_BOOKMARKS_KEY]?.pending)return 0;
  const response=await request(api.runtime.getURL('initial_bookmarks.json'));
  if(!response.ok)throw Error('Unable to load starter bookmarks.');
  const doc=parseImport(await response.text()),state=await lib.load();
  const destination=state.folders.find(n=>n.parentId&&!n.managed&&!state.nodes.get(n.parentId)?.parentId);
  if(!destination)throw Error('No writable Chrome bookmark root is available.');
  const metadata={...state.metadata},known=new Map();let added=0;
  for(const bookmark of state.bookmarks)if(!bookmark.managed){try{known.set(safeUrl(bookmark.url),bookmark)}catch{}}
  async function insert(item,parentId){
   if(item.url){
    let bookmark=known.get(item.url);
    if(!bookmark){bookmark=await api.bookmarks.create({parentId,title:item.title,url:item.url});known.set(item.url,bookmark);added++}
    metadata[bookmark.id]={...normalizeMeta(metadata[bookmark.id]||item.metadata),pinned:true};
    await api.storage.local.set({[META_KEY]:{version:1,items:metadata}});
   }else{
    let folder=state.folders.find(n=>n.parentId===parentId&&n.title===item.title&&!n.managed);
    if(!folder){folder=await api.bookmarks.create({parentId,title:item.title});state.folders.push(folder)}
    for(const child of item.children)await insert(child,folder.id);
   }
  }
  for(const item of doc.folders)await insert(item,destination.id);
  await api.storage.local.set({[INITIAL_BOOKMARKS_KEY]:{completed:true}});
  return added;
 });
}
