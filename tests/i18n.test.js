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

test('What’s new notice translations preserve the release details and controls',async()=>{
 const translations={
  en:['Updated to 1stTab 2.2.2','This release adds an in-app update notice in all five supported languages.','View changes','Dismiss'],
  ru:['1stTab обновлён до версии 2.2.2','В этом выпуске появилось встроенное уведомление об обновлении на всех пяти поддерживаемых языках.','Что нового','Закрыть'],
  ka:['1stTab განახლდა 2.2.2 ვერსიამდე','ამ ვერსიაში დამატებულია განახლების შეტყობინება, რომელიც ხუთივე მხარდაჭერილ ენაზეა ხელმისაწვდომი.','რა შეიცვალა','დახურვა'],
  de:['1stTab wurde auf Version 2.2.2 aktualisiert','Diese Version ergänzt einen Update-Hinweis in allen fünf unterstützten Sprachen.','Änderungen ansehen','Schließen'],
  ja:['1stTab がバージョン 2.2.2 に更新されました','このリリースでは、対応する5言語でアプリ内の更新通知を表示します。','変更内容を見る','閉じる']
 };
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))});
 try{
  for(const[language,expected]of Object.entries(translations)){
   await setLanguage(language);
   assert.deepEqual([
    t('Updated to 1stTab {version}',{version:'2.2.2'}),
    t('This release adds an in-app update notice in all five supported languages.'),
    t('View changes'),
    t('Dismiss')
   ],expected,`Unexpected announcement copy for ${language}`);
  }
 }finally{globalThis.fetch=originalFetch;await setLanguage('en');}
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

test('reviewed number forms handle singulars, Russian teens and compound counts',async()=>{
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))});
 const counts=[0,1,2,5,11,21,22,25,101,221];
 try{
  await setLanguage('ru');
  const pixels=['пикселей','пиксель','пикселя','пикселей','пикселей','пиксель','пикселя','пикселей','пиксель','пиксель'];
  const bookmarks=['закладкам','закладке','закладкам','закладкам','закладкам','закладке','закладкам','закладкам','закладке','закладке'];
  for(const [i,count] of counts.entries()){
   assert.equal(t('{count} pixels',{count}),`${count} ${pixels[i]}`);
   assert.equal(t('Tag {count} bookmarks',{count}),`Добавить теги к ${count} ${bookmarks[i]}`);
  }
  await setLanguage('en');
  for(const count of counts)assert.equal(t('Imported {count} items.',{count}),`Imported ${count} ${count===1?'item':'items'}.`);
  assert.equal(translateError('1 sorting steps applied. Backup retained. Invalid folder.'),'1 sorting step applied. Backup retained. Invalid folder.');
  for(const count of [0,1,2])for(const folders of [0,1,2]){
   assert.equal(t('Bookmarks: {count} · Collections: {folders}',{count,folders}),`Bookmarks: ${count} · Collections: ${folders}`);
  }
  await setLanguage('de');
  for(const count of counts)assert.equal(t('Imported {count} items.',{count}),`${count} ${count===1?'Element':'Elemente'} importiert.`);
  assert.equal(t('{count} active filters. Hiding the controls keeps filters applied.',{count:1}),'1 aktiver Filter. Beim Ausblenden der Steuerelemente bleibt der Filter aktiv.');
  for(const count of [0,1,2])for(const folders of [0,1,2]){
   assert.equal(t('Bookmarks: {count} · Collections: {folders}',{count,folders}),`Lesezeichen: ${count} · Sammlungen: ${folders}`);
  }
  assert.equal(translateError('1 of 1 items moved. Backup retained. Invalid folder.'),'1 von 1 Element verschoben. Sicherung bleibt erhalten. Ungültiger Ordner.');
  await setLanguage('ja');
  assert.equal(t('Confirm delete'),'削除する');
  assert.equal(t('Confirm import'),'インポートする');
  assert.equal(t('Confirm move'),'移動する');
  assert.equal(t('Confirm cloud deletion'),'バックアップを削除する');
 }finally{globalThis.fetch=originalFetch;}
});
