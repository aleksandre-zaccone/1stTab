import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveLanguage,formatMessage,setLanguage,t,translateError,number,date} from '../bookmark-core/i18n.js';

test('language resolution follows browser regions, manual overrides and English fallback',()=>{
 for(const language of ['en','ru','ka','de','ja'])assert.equal(resolveLanguage('auto',language+'-XX'),language);
 assert.equal(resolveLanguage('ja','de-DE'),'ja');
 assert.equal(resolveLanguage('auto','fr-FR'),'en');
 assert.equal(resolveLanguage('invalid','ka-GE'),'ka');
 assert.equal(formatMessage('Hello {name}',{name:'<script>$&{name}</script>'}),'Hello <script>$&{name}</script>');
});

test('all catalogs have matching keys and interpolation tokens; translated text stays plain',async()=>{
 const catalogs=await Promise.all(['en','ru','ka','de','ja'].map(async lang=>JSON.parse(await readFile(new URL(`../_locales/${lang}/messages.json`,import.meta.url),'utf8'))));
 for(const catalog of catalogs){assert.deepEqual(Object.keys(catalog),Object.keys(catalogs[0]));for(const [key,{message}] of Object.entries(catalog)){
  assert.ok(message);assert.deepEqual([...message.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort(),[...catalogs[0][key].message.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort());
 }}
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))});
 try{
  await setLanguage('de');assert.equal(t('Settings'),'Einstellungen');assert.equal(translateError('2 of 3 items moved. Backup retained. Invalid folder.'),'2 von 3 Elementen verschoben. Sicherung bleibt erhalten. Ungültiger Ordner.');assert.equal(number(12345),'12.345');assert.ok(date('2026-10-21T12:00:00Z'));
  assert.equal(t('Select {title}',{title:'Settings <b>ქართული</b>'}),'Settings <b>ქართული</b> auswählen');
  assert.equal(t('Unknown English fallback'),'Unknown English fallback');
  assert.equal(translateError('Import is limited to 20 MB.'),'Importe sind auf 20 MB begrenzt.');
  await setLanguage('auto','ja-JP');assert.equal(t('Settings'),'設定');
 }finally{globalThis.fetch=originalFetch;}
});
