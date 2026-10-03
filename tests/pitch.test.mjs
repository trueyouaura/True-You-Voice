import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimatePitch, summarize } from '../pitch.js';
import { routines } from '../routines.js';
import { readState, writeState } from '../storage.js';
function tone(hz,rate,harmonics=false){return Float32Array.from({length:4096},(_,i)=>.2*Math.sin(2*Math.PI*hz*i/rate)+(harmonics?.1*Math.sin(4*Math.PI*hz*i/rate):0));}
for(const rate of [44100,48000])for(const hz of [70,100,160,180,220,300,440,600])test(`F0 ${hz} Hz at ${rate} samples/s`,()=>{for(const harmonic of [false,true]){const result=estimatePitch(tone(hz,rate,harmonic),rate);assert.ok(Math.abs(result.hz-hz)<2,`${result.hz} != ${hz}`);assert.ok(result.confidence>.85);}});
test('silence, DC offset, quiet input, and seeded noise rejected',()=>{assert.equal(estimatePitch(new Float32Array(4096),48000).hz,null);assert.equal(estimatePitch(new Float32Array(4096).fill(.4),48000).hz,null);assert.equal(estimatePitch(tone(200,48000).map(x=>x*.001),48000).hz,null);let seed=7;const noise=Float32Array.from({length:4096},()=>{seed=(seed*1664525+1013904223)>>>0;return (seed/2**32-.5)*.2;});assert.equal(estimatePitch(noise,48000).hz,null);});
test('summary ignores gaps and uses actual median',()=>{assert.deepEqual(summarize([null,100,200,300,400]),{median:250,low:100,high:300,count:4});assert.equal(summarize([null]),null);});
test('routines have advertised durations and resting steps',()=>{for(const [key,seconds] of [['daily',300],['resonance',240],['warmup',180]]){assert.equal(routines[key].steps.reduce((n,s)=>n+s.seconds,0),seconds);assert.ok(routines[key].steps.some(s=>s.title.includes('break')));}});
test('storage tolerates corruption and validates untrusted settings',()=>{assert.equal(readState({getItem:()=>'{broken'}).sessions.length,0);assert.equal(readState({getItem:()=>JSON.stringify({sessions:[],settings:{low:700,high:1}})}).settings.low,160);let text;const storage={setItem:(_,v)=>text=v,getItem:()=>text};const state={settings:{low:170,high:230,show:false},sessions:[]};writeState(storage,state);assert.deepEqual(readState(storage),state);});
