import assert from 'node:assert/strict';
import {normalizePreferences as normalize} from '../bookmark-core/preferences.js';
assert.equal(normalize().design,'enterprise');
assert.equal(normalize({design:'enterprise'}).design,'enterprise');
assert.equal(normalize(null).textScale,1);
assert.equal(normalize({textScale:6,iconScale:.2}).textScale,1.4);
assert.equal(normalize({textScale:6,iconScale:.2}).iconScale,.9);
assert.equal(normalize({textScale:'wrong',iconScale:Infinity}).textScale,1);
assert.equal(normalize({textScale:'wrong',iconScale:Infinity}).iconScale,1);
assert.equal(normalize({design:'invalid',theme:'invalid',sort:'invalid'}).theme,'light');
assert.equal(normalize({design:'atelier',theme:'system'}).design,'atelier');
assert.deepEqual(normalize({collapsed:['folder',null,42],treeOpen:false}).collapsed,['folder']);
assert.equal(normalize({treeOpen:false,showNotes:false,reduceMotion:true}).treeOpen,false);
assert.equal(normalize({showNotes:false}).showNotes,false);
console.log('Preference defaults, persisted values and size bounds passed.');

assert.equal(normalize().filtersOpen,false);
assert.equal(normalize({filtersOpen:true}).filtersOpen,true);

assert.equal(normalize().sidebarWidth,270);
assert.equal(normalize({sidebarWidth:2000}).sidebarWidth,520);
assert.equal(normalize({sidebarWidth:-1}).sidebarWidth,220);
assert.equal(normalize({sidebarWidth:'invalid'}).sidebarWidth,270);
assert.equal(normalize().gridShape,'rectangle');
assert.equal(normalize({gridShape:'invalid'}).gridShape,'rectangle');
for(const gridShape of ['rectangle','square','rounded','circle','sphere'])assert.equal(normalize({gridShape}).gridShape,gridShape);

assert.equal(normalize().view,'list');
assert.equal(normalize({design:'pop',view:'grid'}).design,'pop');
assert.equal(normalize({design:'pop',view:'grid'}).view,'grid');
