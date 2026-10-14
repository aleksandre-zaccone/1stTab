// Official high-resolution starter icons are bundled for reliable, sharp rendering.
const siteIcons={
 'google.com':'google.png','mail.google.com':'gmail.png','drive.google.com':'drive.png',
 'claude.ai':'claude.svg','gemini.google.com':'gemini.png','1sttab-app.web.app':'1sttab.png',
 'youtube.com':'youtube.png','music.youtube.com':'youtube-music.png',
 'calendar.google.com':'calendar.png','duckduckgo.com':'duckduckgo.png','brave.com':'brave.png'
};
export function siteIconURL(api,pageURL){
 try{
  const page=new URL(pageURL);if(!['http:','https:'].includes(page.protocol))return null;
  const host=page.hostname.replace(/^www\./,'');
  const file=Object.hasOwn(siteIcons,host)?siteIcons[host]:null;
  return file?api.runtime.getURL('icons/sites/'+file):null;
 }catch{return null}
}
export function siteFaviconURL(pageURL){
 try{const page=new URL(pageURL);return ['http:','https:'].includes(page.protocol)?new URL('/favicon.ico',page.origin).href:null}catch{return null}
}
// Chrome supplies cached site icons, including a generic globe for missing icons.
export function faviconURL(api,pageURL){
 try{
  const page=new URL(pageURL);
  if(!['http:','https:','ftp:'].includes(page.protocol))return null;
  const url=new URL(api.runtime.getURL('/_favicon/'));
  if(url.protocol!=='chrome-extension:')return null;
  url.searchParams.set('pageUrl',page.href);
  url.searchParams.set('size','256');
  url.searchParams.set('fallbackToHost','1');
  return url.href;
 }catch{return null}
}
export function createFaviconLoader(api,request=fetch){
 const cache=new Map();let missingIcon;
 async function bytes(url){const response=await request(url);if(!response.ok)throw Error('Icon unavailable');return new Uint8Array(await response.arrayBuffer())}
 return function load(pageURL){
  const url=faviconURL(api,pageURL);if(!url)return Promise.resolve(null);
  if(cache.has(url))return cache.get(url);
  const result=(async()=>{
   try{
    // A reserved .invalid address yields Chrome's generic missing-icon image.
    missingIcon??=bytes(faviconURL(api,'https://1sttab-favicon.invalid/'));
    const [icon,missing]=await Promise.all([bytes(url),missingIcon]);
    if(!icon.length||icon.length===missing.length&&icon.every((byte,i)=>byte===missing[i]))return null;
    return icon;
   }catch{return null}
  })();
  if(cache.size>=256)cache.delete(cache.keys().next().value);
  cache.set(url,result);return result;
 };
}
