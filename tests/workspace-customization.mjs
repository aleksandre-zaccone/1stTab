import {chromium, browserOptions} from './browser-runtime.mjs';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
const browser=await chromium.launch(browserOptions);
const errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),p=await context.newPage();p.setDefaultTimeout(7000);p.on('pageerror',e=>errors.push(e.message));
 const url='file://'+resolve('innerDocumentation/design-directions/enterprise.html');await p.goto(url);await p.getByText('Library ready.',{exact:true}).waitFor();
 const width=()=>p.locator('#folders').evaluate(n=>n.getBoundingClientRect().width);
 const separator=p.getByRole('separator',{name:'Resize folder sidebar'});const box=await separator.boundingBox(),before=await width();
 await p.mouse.move(box.x+box.width/2,box.y+100);await p.mouse.down();await p.mouse.move(box.x+box.width/2+94,box.y+100,{steps:10});await p.mouse.up();assert.ok(Math.abs(await width()-before-94)<2);
 await separator.focus();await p.keyboard.press('ArrowRight');assert.ok(Math.abs(await width()-before-104)<2);await p.keyboard.press('End');assert.equal(Math.round(await width()),520);await p.keyboard.press('Home');assert.equal(Math.round(await width()),220);await p.keyboard.press('Shift+ArrowRight');assert.equal(Math.round(await width()),270);
 await p.reload();await p.getByText('Library ready.',{exact:true}).waitFor();assert.equal(Math.round(await width()),270);
 await p.getByRole('searchbox').fill('Figma');await p.getByRole('checkbox',{name:'Select Figma',exact:true}).check();await p.getByRole('button',{name:'Settings',exact:true}).click();const settings=p.locator('#settings-page');assert.equal(await settings.isVisible(),true);assert.equal(await p.getByRole('dialog').count(),0);assert.equal(new URL(p.url()).hash,'#settings');assert.equal(await p.locator('#library-page').isVisible(),false);
 await p.goBack();assert.equal(await p.getByRole('searchbox').inputValue(),'Figma');assert.equal(await p.getByRole('checkbox',{name:'Select Figma',exact:true}).isChecked(),true);await p.goForward();assert.equal(await settings.isVisible(),true);await settings.getByRole('button',{name:'Back to library',exact:true}).click();await p.getByRole('searchbox').fill('');await p.getByRole('button',{name:'Grid view',exact:true}).click();await p.getByRole('button',{name:'Settings',exact:true}).click();assert.equal(await settings.getByLabel('Bookmark view',{exact:true}).inputValue(),'grid');await settings.getByRole('button',{name:'Back to library',exact:true}).click();await p.getByRole('button',{name:'Clear',exact:true}).click();
 await p.getByRole('button',{name:'New collection',exact:true}).click();assert.equal(await p.getByRole('dialog').evaluate(n=>getComputedStyle(n,'::backdrop').backdropFilter),'none');await p.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
 for(const size of [{width:1440,height:1000},{width:390,height:844}]){
  await p.setViewportSize(size);
  for(const shape of ['rectangle','square','rounded','circle','sphere']){
   await p.getByRole('button',{name:'Settings',exact:true}).click();await settings.locator(`[name=gridShape][value=${shape}]`).check();
   await settings.getByLabel('Text size',{exact:true}).fill('1.4');await settings.getByLabel('Icon size',{exact:true}).fill('1.5');await settings.getByRole('button',{name:'Preview in card view',exact:true}).click();
   const geometry=await p.locator('.bookmark').first().evaluate(n=>{const r=n.getBoundingClientRect();return {width:r.width,height:r.height,overflow:document.documentElement.scrollWidth>innerWidth,actions:[...n.querySelectorAll('button,input')].map(c=>{const b=c.getBoundingClientRect();return {label:c.getAttribute('aria-label')||c.textContent,inside:b.left>=r.left&&b.right<=r.right&&b.top>=r.top&&b.bottom<=r.bottom,ellipse:((b.x+b.width/2-r.x-r.width/2)/(r.width/2))**2+((b.y+b.height/2-r.y-r.height/2)/(r.height/2))**2}})}});
   assert.equal(geometry.overflow,false,`${shape} ${size.width} overflow`);if(shape!=='rectangle')assert.ok(Math.abs(geometry.width-geometry.height)<2,`${shape} aspect ratio ${JSON.stringify(geometry)}`);for(const a of geometry.actions){assert.ok(a.inside,`${shape}: ${a.label} clipped`);if(['circle','sphere'].includes(shape))assert.ok(a.ellipse<1,`${shape}: ${a.label} outside circle`)}
   if(shape==='sphere')await p.screenshot({path:`tests/shapes-${size.width}.png`});
  }
  if(size.width===390)assert.equal(await separator.isVisible(),false);
 }
 await p.reload();await p.getByText('Library ready.',{exact:true}).waitFor();assert.equal(await p.locator('html').getAttribute('data-grid-shape'),'sphere');
 await p.getByRole('button',{name:'List view',exact:true}).click();assert.ok((await p.locator('.bookmark').first().boundingBox()).height<180);
 await p.setViewportSize({width:1440,height:1000});await p.getByRole('button',{name:'Settings',exact:true}).click();await settings.getByRole('button',{name:'Reset appearance',exact:true}).click();await settings.locator('[name=design][value=enterprise]').check();await p.screenshot({path:'tests/settings-page-enterprise.png',fullPage:true});
 for(const [label,path,heading] of [['How it works ↗','manual.html','How it works'],['Terms & conditions ↗','terms.html','Terms & conditions']]){
  const href=await settings.getByRole('link',{name:label,exact:true}).getAttribute('href');assert.ok(href.endsWith(path));const docs=await context.newPage();docs.on('pageerror',e=>errors.push(e.message));await docs.goto(new URL(href,p.url()).href);await docs.getByRole('heading',{name:heading,exact:true}).waitFor();assert.ok((await docs.getByRole('link',{name:'Settings',exact:true}).getAttribute('href')).endsWith('enterprise.html#settings'));await docs.screenshot({path:`tests/${path}.png`});assert.equal(await docs.locator('body').evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await docs.close();
 }
 assert.deepEqual(errors,[]);console.log('Customization passed: sidebar pointer/keyboard resize and persistence; full-page Settings and Back/Forward preserve search/selection; five shapes at maximum sizes on desktop/mobile; no dialog blur; guide and Terms links.');
}finally{await browser.close()}
