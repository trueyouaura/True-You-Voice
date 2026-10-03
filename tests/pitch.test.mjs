import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimatePitch, summarize, inputLevel, inputFloor } from '../pitch.js';
import { routines } from '../routines.js';
import { readState, writeState } from '../storage.js';
function tone(hz,rate,harmonics=false){return Float32Array.from({length:4096},(_,i)=>.2*Math.sin(2*Math.PI*hz*i/rate)+(harmonics?.1*Math.sin(4*Math.PI*hz*i/rate):0));}
for(const rate of [44100,48000])for(const hz of [70,100,160,180,220,300,440,600])test(`F0 ${hz} Hz at ${rate} samples/s`,()=>{for(const harmonic of [false,true]){const result=estimatePitch(tone(hz,rate,harmonic),rate);assert.ok(Math.abs(result.hz-hz)<2,`${result.hz} != ${hz}`);assert.ok(result.confidence>.85);}});
test('silence, DC offset, quiet input, and seeded noise rejected',()=>{assert.equal(estimatePitch(new Float32Array(4096),48000).hz,null);assert.equal(estimatePitch(new Float32Array(4096).fill(.4),48000).hz,null);assert.equal(estimatePitch(tone(200,48000).map(x=>x*.001),48000).hz,null);let seed=7;const noise=Float32Array.from({length:4096},()=>{seed=(seed*1664525+1013904223)>>>0;return (seed/2**32-.5)*.2;});assert.equal(estimatePitch(noise,48000).hz,null);});
test('summary ignores gaps and uses actual median',()=>{assert.deepEqual(summarize([null,100,200,300,400]),{median:250,low:100,high:300,count:4});assert.equal(summarize([null]),null);});
for(const rate of [44100,48000])test(`quiet desk speech retains accurate F0 at ${rate} samples/s`,()=>{
 for(const hz of [70,100,180,220,440,600]){
  const samples=tone(hz,rate,true).map(x=>x*.015);
  const detected=estimatePitch(samples,rate);
  assert.ok(Math.abs(detected.hz-hz)<2,`${hz}: ${detected.hz}`);
  assert.ok(detected.confidence>.85);
  assert.equal(estimatePitch(samples,rate,'nearby').hz,null);
 }
});
test('very quiet mode stays selective and all modes reject unvoiced noise',()=>{
 const soft=tone(180,48000).map(x=>x*.004);
 assert.equal(estimatePitch(soft,48000,'desk').hz,null);
 assert.ok(Math.abs(estimatePitch(soft,48000,'quiet').hz-180)<2);
 for(const mode of ['desk','nearby','quiet']){
  let seed=17;const noise=Float32Array.from({length:4096},()=>{seed=(seed*1664525+1013904223)>>>0;return (seed/2**32-.5)*.08;});
  assert.equal(estimatePitch(noise,48000,mode).hz,null);
  assert.equal(estimatePitch(new Float32Array(4096).fill(.02),48000,mode).hz,null);
 }
 assert.equal(inputFloor('constructor'),inputFloor('desk'));
});
test('microphone meter shows quiet speech on a bounded logarithmic scale',()=>{
 assert.equal(inputLevel(0),0);assert.equal(inputLevel(NaN),0);
 assert.equal(inputLevel(1),1);assert.equal(inputLevel(2),1);
 assert.ok(inputLevel(.002)>.2);assert.ok(inputLevel(.008)>inputLevel(.002));
});
test('desk mode accepts changing voiced sound with noise that the strict mode rejects',()=>{
 for(const rate of [44100,48000])for(const slope of [0,300,1000]){
  let seed=7;
  const speech=Float32Array.from({length:4096},(_,i)=>{
   seed=(seed*1664525+1013904223)>>>0;const t=i/rate,phase=2*Math.PI*(180*t+slope*t*t);
   return .02*((1+.4*Math.sin(2*Math.PI*15*t))*Math.sin(phase)+.3*Math.sin(2*phase)+.7*(seed/2**32-.5)*2);
  });
  const result=estimatePitch(speech,rate,'desk');
  // The comparison covers a changing pitch, rather than one exact stationary F0.
  assert.ok(result.hz>=170&&result.hz<=240,`${rate}, ${slope}: ${result.hz}`);
  assert.ok(result.confidence>=.75);
  assert.equal(estimatePitch(speech,rate,'nearby').hz,null);
 }
});
test('more tolerant speech settings still reject many independent noise frames',()=>{
 for(let seed=1;seed<=40;seed++){
  let n=seed;const noise=Float32Array.from({length:4096},()=>{n=(n*1664525+1013904223)>>>0;return (n/2**32-.5)*.03;});
  for(const mode of ['desk','quiet'])assert.equal(estimatePitch(noise,48000,mode).hz,null,`${seed}: ${mode}`);
 }
});
test('routines have advertised durations and resting steps',()=>{for(const [key,seconds] of [['daily',300],['resonance',240],['warmup',180]]){assert.equal(routines[key].steps.reduce((n,s)=>n+s.seconds,0),seconds);assert.ok(routines[key].steps.some(s=>s.title.includes('break')));}});
test('storage tolerates corruption and validates untrusted settings',()=>{assert.equal(readState({getItem:()=>'{broken'}).sessions.length,0);assert.equal(readState({getItem:()=>JSON.stringify({sessions:[],settings:{low:700,high:1}})}).settings.low,160);let text;const storage={setItem:(_,v)=>text=v,getItem:()=>text};const state={settings:{low:170,high:230,show:false},sessions:[]};writeState(storage,state);assert.deepEqual(readState(storage),state);});
