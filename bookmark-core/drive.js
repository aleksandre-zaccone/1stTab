import {makeExport, parseImport, backupSummary, MAX_IMPORT_BYTES} from './transfer.js';
export const DRIVE_ORIGIN='https://www.googleapis.com/*';
export const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.appdata';
export const DRIVE_KEY='bookmarks.drive.v1';
const API='https://www.googleapis.com/drive/v3/';
const queues=new WeakMap();
// Shared by all extension pages. No token is stored in extension storage.
export function withDriveLock(api,task){
 const run=()=>globalThis.navigator?.locks?navigator.locks.request('1sttab-drive', {ifAvailable:true},lock=>{if(!lock)throw Error('Another Google Drive operation is running. Try again when it finishes.');return task()}):task();
 if(queues.has(api))return Promise.reject(Error('Another Google Drive operation is running. Try again when it finishes.'));
 const result=Promise.resolve().then(run);queues.set(api,result);return result.finally(()=>queues.delete(api));
}
export async function driveStatus(api){return (await api.storage.local.get(DRIVE_KEY))[DRIVE_KEY]||{status:'disconnected'};}
const save=(api,s)=>api.storage.local.set({[DRIVE_KEY]:s});
const generation=()=>crypto.randomUUID();
export function authErrorMessage(error,api){
 const detail=typeof error?.message==='string'?error.message:'';
 // Classify known failures without displaying raw provider errors or credentials.
 let reason='Chrome could not authorize Google Drive. Verify the publisher OAuth client and consent configuration.';
 if(/invalid.client|bad client|OAuth2.*client/i.test(detail))reason='Google rejected the OAuth client. Its application type must be Chrome Extension and its Item ID must match this extension.';
 else if(/not signed in|not signed-in|sign.in required/i.test(detail))reason='Chrome has no signed-in Google account available. Sign in to this Chrome profile, then try Connect again.';
 else if(/user rejected|user did not approve|cancelled|canceled/i.test(detail))reason='Google sign-in or consent was cancelled. Choose Connect again and complete the consent screen.';
 else if(/access.denied|not authorized|not permitted/i.test(detail))reason='Google denied access. Check the consent audience and, if the app is in testing, add your Google account as a test user.';
 else if(/interaction.required/i.test(detail))reason='Google needs interactive authorization. Choose Connect Google Drive again.';
 else if(/network|connection|offline/i.test(detail))reason='Chrome could not reach Google. Check your network connection and try again.';
 const id=api.runtime?.id;
 return 'Reconnect Google Drive. '+reason+(typeof id==='string'&&/^[a-p]{32}$/.test(id)?' Loaded extension ID: '+id+'.':' Find the loaded extension ID on chrome://extensions.');
}
async function token(api,interactive=false){
 if(!await api.permissions.contains({permissions:['identity'],origins:[DRIVE_ORIGIN]}))throw Error('Connect Google Drive first.');
 try{const r=await api.identity.getAuthToken({interactive,scopes:[DRIVE_SCOPE]});const t=typeof r==='string'?r:r?.token;if(!t)throw Error();return t}catch(error){throw Error(authErrorMessage(error,api));}
}
function serviceError(status){return Error(status===401?'Reconnect Google Drive. Authorization expired.':status===403?'Google Drive denied access. Check consent and storage quota, then try again.':status===429?'Google Drive rate limit reached. Try again later.':status===404?'This backup no longer exists. Refresh backup history.':`Google Drive request failed (${status}). Try again later.`);}
async function request(api,session,path,options={},fetcher=fetch){
 let r;
 for(let attempt=0;attempt<2;attempt++){
  try{r=await fetcher(path.startsWith('https://')?path:API+path,{...options,headers:{...options.headers,Authorization:`Bearer ${session.token}`},signal:AbortSignal.timeout(30000)});}catch{throw Error('Google Drive could not be reached. Check your connection and try again.');}
  if(r.status!==401||attempt)break;
  await api.identity.removeCachedAuthToken({token:session.token});session.token=await token(api);
  // A refreshed credential must still belong to the connected Drive account.
  if(session.accountId){const who=await account(api,{token:session.token},fetcher);if(who.id!==session.accountId)throw Error('Google account changed. Disconnect and reconnect before continuing.');}
 }
 if(!r.ok)throw serviceError(r.status);return r;
}
async function account(api,session,fetcher){
 const {user}=await (await request(api,session,'about?fields=user(permissionId,emailAddress,displayName)',{},fetcher)).json();
 if(!user?.permissionId)throw Error('Could not verify the Google Drive account. Reconnect before continuing.');
 return {id:user.permissionId,label:user.emailAddress||user.displayName||'Google Drive account'};
}
export async function enableDrive(api,fetcher=fetch){
 // Request access synchronously from the user's gesture, before waiting for a lock.
 if(!await api.permissions.request({permissions:['identity'],origins:[DRIVE_ORIGIN]}))throw Error('Cloud backup access was declined. Local export remains available.');
 return withDriveLock(api,async()=>{
  await save(api,{status:'connecting',generation:generation()});
  try{const session={token:await token(api,true)},user=await account(api,session,fetcher);const s={status:'connected',generation:generation(),account:user};await save(api,s);return s;}
  catch(e){await save(api,{status:'reconnect-required',generation:generation(),error:e.message});throw e;}
 });
}
async function sessionFor(api,expected,fetcher){
 const s=await driveStatus(api);
 if(s.status!=='connected')throw Error('Connect or reconnect Google Drive first.');
 if(expected&&s.generation!==expected)throw Error('Google connection changed. Refresh backup history and preview again.');
 const session={...s,token:await token(api),accountId:s.account.id};
 const who=await account(api,session,fetcher);
 if(who.id!==s.account.id){await save(api,{status:'reconnect-required',generation:generation(),error:'Google account changed. Reconnect.'});throw Error('Google account changed. Disconnect and reconnect before continuing.');}
 return session;
}
async function operation(api,expected,fetcher,task){return withDriveLock(api,async()=>{
 try{const session=await sessionFor(api,expected,fetcher);return await task(session);}
 catch(e){const s=await driveStatus(api);if(s.status==='connected')await save(api,{...s,status:/Reconnect|reconnect/.test(e.message)?'reconnect-required':s.status,error:e.message});throw e;}
});}
export async function uploadBackup(api,state,fetcher=fetch){return operation(api,null,fetcher,async s=>{
 const doc=typeof state==='function'?await state():makeExport(state);
 // Fail before transmission for documents that could not be restored.
 const summary=backupSummary(parseImport(JSON.stringify(doc)));
 const boundary='1sttab_'+generation(),operationId=generation();
 const meta={name:`1stTab bookmarks ${doc.exportedAt}.json`,parents:['appDataFolder'],mimeType:'application/json',appProperties:{application:'1stTab',schema:String(doc.version),operationId,...Object.fromEntries(Object.entries(summary).map(([key,value])=>[key,String(value)]))}};
 const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(doc)}\r\n--${boundary}--\r\n`;
 // Persist uncertainty before sending so closing the page cannot hide an ambiguous upload.
 await save(api,{...await driveStatus(api),pendingUpload:operationId,error:''});
 let result;
 try{result=await (await request(api,s,'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime',{method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body},fetcher)).json();if(!result.id)throw Error();}
 catch(e){throw Error('Backup completion is unknown. Refresh backup history before uploading again; the backup may already exist. '+e.message);}
 await save(api,{...await driveStatus(api),lastBackupAt:new Date().toISOString(),pendingUpload:null,error:''});return result;
});}
export async function listBackups(api,fetcher=fetch){return operation(api,null,fetcher,async s=>{
 const files=[],seen=new Set();let pageToken;
 do{const q=new URLSearchParams({spaces:'appDataFolder',fields:'files(id,name,createdTime,size,appProperties),nextPageToken',orderBy:'createdTime desc',pageSize:'100',q:"trashed = false and (appProperties has { key='application' and value='1stTab' } or name contains '1stTab bookmarks')"});if(pageToken)q.set('pageToken',pageToken);
 const data=await (await request(api,s,`files?${q}`,{},fetcher)).json();if(!Array.isArray(data.files))throw Error('Google Drive returned invalid backup history.');files.push(...data.files);pageToken=data.nextPageToken;
 if(pageToken&&(seen.has(pageToken)||seen.size>=100))throw Error('Backup history is too large or incomplete. Try again later.');seen.add(pageToken);
 }while(pageToken);
 const current=await driveStatus(api),found=current.pendingUpload&&files.find(f=>f.appProperties?.operationId===current.pendingUpload);
 await save(api,{...current,...(found?{pendingUpload:null,lastBackupAt:found.createdTime}:{}),error:''});
 return {files,generation:s.generation};
});}
function fileId(id){if(typeof id!=='string'||!/^[a-zA-Z0-9_-]+$/.test(id))throw Error('Invalid backup ID.');return id;}
async function boundedText(response){
 if(Number(response.headers?.get('content-length'))>MAX_IMPORT_BYTES)throw Error('Import is limited to 20 MB.');
 if(!response.body?.getReader){const text=await response.text();if(new TextEncoder().encode(text).length>MAX_IMPORT_BYTES)throw Error('Import is limited to 20 MB.');return text;}
 const reader=response.body.getReader(),decoder=new TextDecoder();let bytes=0,text='';
 try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>MAX_IMPORT_BYTES)throw Error('Import is limited to 20 MB.');text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}finally{await reader.cancel();}
}
export async function downloadBackup(api,id,fetcher=fetch,expected){fileId(id);return operation(api,expected,fetcher,async s=>{
 const doc=parseImport(await boundedText(await request(api,s,`files/${id}?alt=media`,{},fetcher)));return {...doc,driveGeneration:s.generation};
});}
export async function deleteBackup(api,id,fetcher=fetch,expected){fileId(id);return operation(api,expected,fetcher,s=>request(api,s,`files/${id}`,{method:'DELETE'},fetcher));}
export async function restoreDriveBackup(api,doc,task,fetcher=fetch){return operation(api,doc.driveGeneration,fetcher,async()=>{if(!doc.driveGeneration)throw Error('Refresh backup history and preview again.');const result=await task();await save(api,{...await driveStatus(api),lastRestoreAt:new Date().toISOString(),error:''});return result;});}
export async function disableDrive(api){return withDriveLock(api,async()=>{
 await save(api,{status:'disconnected',generation:generation()});
 try{await api.identity?.clearAllCachedAuthTokens();}finally{await api.permissions.remove({permissions:['identity'],origins:[DRIVE_ORIGIN]});}
});}
