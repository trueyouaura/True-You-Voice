import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildRoutine,sessionLengths} from '../routines.js';
for(const key of ['daily','warmup','resonance'])for(const minutes of sessionLengths)test(`${key}: ${minutes} minute block has exact timing and silent breaks`,()=>{const plan=buildRoutine(key,minutes);assert.equal(plan.steps.reduce((n,s)=>n+s.seconds,0),minutes*60);assert.ok(plan.steps.every(s=>s.seconds>0&&s.seconds<=120));const silent=plan.steps.filter(s=>/break|Listen|Arrive/.test(s.title)).reduce((n,s)=>n+s.seconds,0);assert.ok(silent>minutes*60*.5);assert.equal(plan.steps.at(-1).title,'Return to easy speech');});
