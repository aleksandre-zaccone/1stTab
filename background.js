import {initializeBookmarks} from './bookmark-core/initial-bookmarks.js';

chrome.runtime.onInstalled.addListener(async details=>{
  if(details.reason!=='install')return;
  try{await initializeBookmarks(chrome,fetch,true)}catch(e){console.error('Unable to initialize bookmarks:',e.message)}
});
chrome.runtime.onStartup.addListener(async()=>{
  try{await initializeBookmarks(chrome)}catch(e){console.error('Unable to finish initializing bookmarks:',e.message)}
});

chrome.action.onClicked.addListener(async tab => {
  try {
    if (tab.url && /^(https?|ftp):/.test(tab.url)) {
      await chrome.storage.local.set({'bookmarks.capture.v1':{url:tab.url,title:tab.title||tab.url,createdAt:Date.now()}});
    }
    await chrome.tabs.create({url:chrome.runtime.getURL('manager.html')});
  } catch(e) { console.error('Unable to open bookmark library:', e.message); }
});
chrome.commands.onCommand.addListener(async (command,tab) => {
  if(command==='open-panel' && tab?.windowId!=null) {
    chrome.sidePanel.open({windowId:tab.windowId}).catch(e=>console.error('Unable to open bookmark panel:',e.message));
  }
});
