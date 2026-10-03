import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../themes.js',import.meta.url),'utf8');
function start(saved,blocked=false){const events={},root={dataset:{}},meta={content:''};const storage={getItem:()=>{if(blocked)throw Error('blocked');return saved;},setItem:(_,v)=>{saved=v;},removeItem:()=>{saved=null;}};const context={localStorage:storage,document:{documentElement:root,querySelector:()=>meta,getElementById:()=>null},window:{dispatchEvent(){},addEventListener:(name,handler)=>{events[name]=handler;}},Event:class{}};vm.runInNewContext(source,context);return {root,meta,events};}
test('first-time, invalid-preference and blocked-storage visitors start dark',()=>{for(const saved of [null,'invalid'])assert.equal(start(saved).root.dataset.theme,'trans-fem-dark');assert.equal(start(null,true).root.dataset.theme,'trans-fem-dark');assert.equal(start(null).meta.content,'#171923');});
test('saved light and dark appearance choices are honored before paint',()=>{for(const theme of ['trans-fem-light','trans-fem-dark','forest-light','ocean-dark'])assert.equal(start(theme).root.dataset.theme,theme);});
test('retired appearances preserve saved brightness',()=>{assert.equal(start('trans-masc-light').root.dataset.theme,'trans-fem-light');assert.equal(start('trans-masc-dark').root.dataset.theme,'trans-fem-dark');});
test('theme reset returns to dark without disabling light choices',()=>{const t=start('ocean-light');t.events['voice-theme-reset']();assert.equal(t.root.dataset.theme,'trans-fem-dark');t.events['voice-theme-apply']({detail:'trans-fem-light'});assert.equal(t.root.dataset.theme,'trans-fem-light');});
