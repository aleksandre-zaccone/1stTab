export const WHATS_NEW_KEY='bookmarks.whatsNew.v1';

export async function recordVersionUpdate(chrome,details){
 if(details?.reason!=='update')return false;
 const version=chrome.runtime.getManifest().version;
 if(!version||version===details.previousVersion)return false;
 const {[WHATS_NEW_KEY]:saved={}}=await chrome.storage.local.get(WHATS_NEW_KEY);
 const dismissedVersions=Array.isArray(saved.dismissedVersions)?saved.dismissedVersions:[];
 await chrome.storage.local.set({[WHATS_NEW_KEY]:{
  ...saved,
  version,
  previousVersion:details.previousVersion||'',
  dismissedVersions:[...new Set(dismissedVersions)]
 }});
 return true;
}

export async function pendingVersionUpdate(chrome,version){
 const {[WHATS_NEW_KEY]:saved}=await chrome.storage.local.get(WHATS_NEW_KEY);
 if(!saved||saved.version!==version||saved.dismissedVersions?.includes(version))return null;
 return {version,previousVersion:saved.previousVersion||''};
}

export async function dismissVersionUpdate(chrome,version){
 const {[WHATS_NEW_KEY]:saved={}}=await chrome.storage.local.get(WHATS_NEW_KEY);
 const dismissedVersions=Array.isArray(saved.dismissedVersions)?saved.dismissedVersions:[];
 await chrome.storage.local.set({[WHATS_NEW_KEY]:{
  ...saved,
  dismissedVersions:[...new Set([...dismissedVersions,version])]
 }});
}
