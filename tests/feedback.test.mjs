import {test} from 'node:test';
import assert from 'node:assert/strict';
import {voiceFeedback} from '../voice-feedback.js';
const frames=hz=>Array.from({length:40},()=>({hz}));
const goal={low:160,high:220};
test('feedback uses the chosen goal, not a universal gender target',()=>{
 assert.match(voiceFeedback(frames(130),goal).summary,/below/);
 assert.match(voiceFeedback(frames(250),goal).summary,/above/);
 assert.equal(voiceFeedback(frames(180),goal).within,1);
 assert.match(voiceFeedback(frames(180),{low:200,high:260}).summary,/below/);
});
test('gaps do not count as out-of-range voice and short or unclear clips get no range coaching',()=>{
 const report=voiceFeedback([...frames(180),...Array.from({length:20},()=>({hz:null}))],goal);
 assert.equal(report.within,1);assert.equal(report.coverage,2/3);
 assert.equal(voiceFeedback([{hz:180}],goal).within,null);
 assert.equal(voiceFeedback([...frames(180),...Array.from({length:250},()=>({hz:null}))],goal).within,null);
 assert.equal(voiceFeedback([],goal).pitch,null);
});
test('comfort overrides goal coaching and disabled or invalid goals stay optional',()=>{
 assert.match(voiceFeedback(frames(130),goal,'strain').next,/Stop practicing/);
 assert.equal(voiceFeedback(frames(130),goal,'strain').within,null);
 for(const target of [null,{low:400,high:100},{low:NaN,high:220}]){
  const report=voiceFeedback(frames(180),target);assert.equal(report.goal,null);assert.equal(report.within,null);
 }
});
test('natural pitch variation gets expression guidance rather than instructions to flatten speech',()=>{
 const report=voiceFeedback([...frames(130),...frames(180),...frames(250)],goal);
 assert.equal(report.pitch.median,180);assert.equal(report.within,1/3);assert.match(report.next,/Natural speech/);
});
