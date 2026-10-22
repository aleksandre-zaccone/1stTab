// Chrome-format catalogs also serve the in-app language override.
export const LANGUAGE_KEY='bookmarks.language.v1';
export const LANGUAGES=[['auto','Automatic — browser language'],['en','English'],['ru','Русский'],['ka','ქართული'],['de','Deutsch'],['ja','日本語']];
const supported=new Set(LANGUAGES.slice(1).map(([code])=>code));
export function resolveLanguage(choice,browserLanguage='en') {
 if(supported.has(choice))return choice;
 const base=String(browserLanguage).toLowerCase().split(/[-_]/)[0];
 return supported.has(base)?base:'en';
}
export function formatMessage(message,values={}) {
 return message.replace(/\{(\w+)\}/g,(match,key)=>Object.hasOwn(values,key)?String(values[key]):match);
}
let locale='en',english={},catalog={},keys=new Map(),revision=0;
const cache=new Map();
export const currentLanguage=()=>locale;
async function load(code){
 if(!cache.has(code))cache.set(code,fetch(new URL(`../_locales/${code}/messages.json`,import.meta.url)).then(r=>{if(!r.ok)throw Error('Could not load language file.');return r.json();}).catch(error=>{cache.delete(code);throw error;}));
 return cache.get(code);
}
export async function setLanguage(choice, browserLanguage=globalThis.chrome?.i18n?.getUILanguage?.()||globalThis.navigator?.language||'en'){
 const version=++revision,next=resolveLanguage(choice,browserLanguage);
 const [base,messages]=await Promise.all([load('en'),load(next)]);
 if(version!==revision)return false;
 const changed=next!==locale;english=base;catalog=messages;locale=next;
 keys=new Map(Object.entries(base).filter(([key])=>!/_((?:zero|one|two|few|many|other))$/.test(key)).map(([key,value])=>[value.message,key]));
 if(globalThis.document)document.documentElement.lang=next;
 return changed;
}
export function t(source,values={}) {
 const key=keys.get(source),plural=typeof values.count==='number'?new Intl.PluralRules(locale).select(values.count):null;
 const variant=plural&&key?key+'_'+plural:null;
 const message=catalog[variant]?.message||catalog[key]?.message||english[variant]?.message||english[key]?.message||source;
 return formatMessage(message,Object.fromEntries(Object.entries(values).map(([key,value])=>[key,typeof value==='number'?number(value):value])));
}
export const number=value=>new Intl.NumberFormat(locale).format(value);
export const date=value=>new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));

// Translate only application-generated error text at the UI boundary. Keep stored
// errors and service-layer classifications stable and preserve unknown diagnostics.
export function translateError(text){
 if(!text)return '';
 if(keys.has(text))return t(text);
 // These templates are emitted only by the data layer. Interpolate names and
 // underlying diagnostics without translating user-owned folder names.
 for(const source of keys.keys()){
  if(!source.includes('{')||!(/^(Import|Imported|\{applied\})/.test(source)))continue;
  const names=[];
  const pattern=source.split(/(\{\w+\})/).map(part=>{
   if(/^\{\w+\}$/.test(part)){names.push(part.slice(1,-1));return part==='{title}'?'(.*?)':part==='{detail}'?'([\\s\\S]*)':'(\\d+)';}
   return part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  }).join('');
  const match=new RegExp('^'+pattern+'$').exec(text);
  if(match)return t(source,Object.fromEntries(names.map((name,i)=>[name,name==='detail'?translateError(match[i+1]):name==='title'?match[i+1]:Number(match[i+1])])));
 }
 const request=/^Google Drive request failed \((\d+)\)\. Try again later\.$/.exec(text);
 if(request)return t('Google Drive request failed ({status}). Try again later.',{status:request[1]});
 const id=/^ Loaded extension ID: ([a-p]{32})\.$/.exec(text);
 if(id)return t(' Loaded extension ID: {id}.',{id:id[1]});
 const prefix=[...keys.keys()].filter(source=>source.length>15&&!source.includes('{')&&text.startsWith(source)).sort((a,b)=>b.length-a.length)[0];
 return prefix?t(prefix)+translateError(text.slice(prefix.length)):text;
}
