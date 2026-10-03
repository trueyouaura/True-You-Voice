import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_READING,normalizeReading} from '../reading-prefs.js';
import {makeBackup,validateBackup,restoreBackup} from '../backup-data.js';
test('reading defaults reduce movement and keep screen reader pitch announcements opt-in',()=>{
 assert.deepEqual(normalizeReading(),{focus:false,text:'standard',spacing:'comfortable',motion:'reduce',chart:'live',announce:false});
 assert(Object.isFrozen(DEFAULT_READING));
});
test('invalid saved reading choices cannot apply arbitrary display settings',()=>{
 assert.deepEqual(normalizeReading({focus:'true',text:'tiny',spacing:null,motion:'always',chart:'upload',announce:1}),normalizeReading());
 assert.deepEqual(normalizeReading(null),normalizeReading());
});
test('reading preferences survive backup and restore into a separate profile',async()=>{
 const reading={focus:true,text:'extra',spacing:'standard',motion:'system',chart:'hidden',announce:true};
 const b=await makeBackup([{id:'source',name:'Example',reading,state:{settings:{low:160,high:220,show:true},sessions:[]}}],async()=>[],async()=>'',false);
 assert.deepEqual(validateBackup(b).profiles[0].reading,reading);
 const map=new Map();await restoreBackup(b,{storage:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)},uuid:()=> 'copy',saveClips:async()=>{},removeClips:async()=>{}});
 assert.deepEqual(JSON.parse(map.get('voice-studio-profiles'))[0].reading,reading);
});
