import {test} from 'node:test';
import assert from 'node:assert/strict';
import {faviconURL,siteFaviconURL,siteIconURL,createFaviconLoader} from '../bookmark-core/favicon.js';
const api={runtime:{getURL:path=>'chrome-extension://test'+path}};
const response=values=>({ok:true,arrayBuffer:async()=>Uint8Array.from(values).buffer});
test('favicon URLs preserve the bookmarked page and reject unsupported URLs',()=>{
 const url=new URL(faviconURL(api,'https://example.com/path?q=a&b=c#section'));
 assert.equal(url.searchParams.get('pageUrl'),'https://example.com/path?q=a&b=c#section');
 assert.equal(url.searchParams.get('size'),'256');
 assert.equal(url.searchParams.get('fallbackToHost'),'1');
 for(const page of ['javascript:alert(1)','file:///private','invalid'])assert.equal(faviconURL(api,page),null);
 assert.equal(faviconURL({runtime:{getURL:()=>'/preview'}},'https://example.com'),null);
});
test('real icons load once, while Chrome generic icons and failures use the letter fallback',async()=>{
 const calls=[];
 const load=createFaviconLoader(api,async url=>{
  const page=new URL(url).searchParams.get('pageUrl');calls.push(page);
  if(page.includes('failure'))throw Error('Request failed');
  return response(page.includes('real')?[1,2,3]:[4,5,6]);
 });
 const results=await Promise.all([load('https://real.example'),load('https://real.example')]);
 assert.deepEqual([...results[0]],[1,2,3]);
 assert.equal(calls.filter(url=>url==='https://real.example/').length,1);
 assert.equal(await load('https://missing.example'),null);
 assert.equal(await load('https://failure.example'),null);
 assert.equal(await load('javascript:alert(1)'),null);
 assert.equal(calls.filter(url=>url.includes('1sttab-favicon.invalid')).length,1);
});
test('failed default-icon detection leaves the fallback intact',async()=>{
 const load=createFaviconLoader(api,async url=>{if(url.includes('1sttab-favicon.invalid'))return {ok:false};return response([1,2,3])});
 assert.equal(await load('https://example.com'),null);
});

test('direct fallback requests only the site icon, without bookmarked paths or credentials',()=>{
 assert.equal(siteFaviconURL('https://user:pass@example.com:8443/private?q=secret#note'),'https://example.com:8443/favicon.ico');
 for(const page of ['ftp://example.com','javascript:alert(1)','invalid'])assert.equal(siteFaviconURL(page),null);
});

test('bundled icons match exact starter hosts and exist on disk',async()=>{
 const {existsSync}=await import('node:fs');
 const starter=JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../initial_bookmarks.json',import.meta.url),'utf8'));
 const paths=[];
 const visit=node=>{if(node.url){const path=siteIconURL({runtime:{getURL:p=>p}},node.url);if(path){assert.ok(existsSync(new URL('../'+path,import.meta.url)),path);paths.push(path);}}for(const child of node.children||[])visit(child);};
 // The export can nest folders; validate each starter bookmark without assuming its shape.
 const walk=value=>{if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object'){if(value.url)visit({...value,children:[]});for(const [key,nested] of Object.entries(value))if(key!=='url')walk(nested);}};
 walk(starter);assert.equal(new Set(paths).size,11);
 assert.equal(siteIconURL(api,'https://www.youtube.com/watch?v=123'),siteIconURL(api,'https://youtube.com/'));
 for(const page of ['https://google.com.example.org','https://unknown.example','https://constructor','ftp://google.com','javascript:alert(1)','invalid'])assert.equal(siteIconURL(api,page),null);
});
