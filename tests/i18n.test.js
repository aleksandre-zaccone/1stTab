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
  await setLanguage('de');assert.equal(t('Settings'),'Einstellungen');assert.equal(translateError('2 of 3 items moved. Backup retained. Invalid folder.'),'2 von 3 Elementen verschoben. Sicherung bleibt erhalten. Ungültiger Ordner.');assert.equal(t('Move {count} items',{count:1}),'1 Element verschieben');assert.equal(t('Move {count} items',{count:2}),'2 Elemente verschieben');assert.equal(t('Delete {count} items?',{count:1}),'1 Element löschen?');assert.equal(t('Imported {count} items.',{count:1}),'1 Element importiert.');assert.equal(t('{count} saved places',{count:1}),'1 gespeicherte Seite');assert.equal(t('{count} active filters. Hiding the controls keeps filters applied.',{count:1}),'1 aktiver Filter. Beim Ausblenden der Steuerelemente bleibt der Filter aktiv.');assert.equal(number(12345),'12.345');assert.ok(date('2026-10-21T12:00:00Z'));
  await setLanguage('ru');assert.equal(t('Move {count} items',{count:1}),'Переместить 1 элемент');assert.equal(t('Move {count} items',{count:2}),'Переместить 2 элемента');assert.equal(t('Move {count} items',{count:5}),'Переместить 5 элементов');assert.equal(t('Delete {count} items?',{count:2}),'Удалить 2 элемента?');assert.equal(t('Imported {count} items.',{count:1}),'Импортирован 1 элемент.');assert.equal(t('Imported {count} items.',{count:2}),'Импортировано 2 элемента.');assert.equal(t('Imported {count} items.',{count:5}),'Импортировано 5 элементов.');assert.equal(t('Tag {count} bookmarks',{count:1}),'Добавить теги к 1 закладке');assert.equal(t('Tags added to {count} bookmarks. Undo available.',{count:1}),'Теги добавлены к 1 закладке. Это действие можно отменить.');
  await setLanguage('de');
  assert.equal(t('Select {title}',{title:'Settings <b>ქართული</b>'}),'Settings <b>ქართული</b> auswählen');
  assert.equal(t('Unknown English fallback'),'Unknown English fallback');
  assert.equal(translateError('Import is limited to 20 MB.'),'Importe sind auf 20 MB begrenzt.');
  await setLanguage('auto','ja-JP');assert.equal(t('Settings'),'設定');
 }finally{globalThis.fetch=originalFetch;}
});
