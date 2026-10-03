const settle = { title:'Arrive gently', seconds:30, copy:'Let your shoulders drop. Unclench your jaw and take a few ordinary breaths. Check that your voice feels well enough to practice.', prompt:'Easy breath. Loose jaw. No rush.', safety:'If you are already hoarse or uncomfortable, choose rest today.' };
const hum = { title:'A gentle warmup', seconds:45, copy:'Try a quiet, easy “mmm” for 2–3 seconds at your usual comfortable pitch. Release, breathe normally, and rest for a few seconds. Repeat only while it feels effortless.', prompt:'mmm … rest … mmm', safety:'Do not hold your breath or make the hum louder to find vibration. Lip vibration is optional.' };
const rest = { title:'Give your voice a break', seconds:30, copy:'Rest silently, breathe normally, and sip water if you like. Notice whether your throat still feels easy.', prompt:'You have permission to pause.', safety:'If tightness or fatigue appears, finish the session now.' };
const resonance = { title:'From hum to an easy word', seconds:60, copy:'At a comfortable pitch, let a short “mmm” open into “mee” or “moon.” Listen for a clear, easy tone. Try a slightly brighter vowel shape, then return to your usual sound. Compare without pushing.', prompt:'mmm–mee … rest … mmm–moon', safety:'Keep the jaw loose. Never force your larynx up or constrict your throat. Brightness does not need extra volume or a higher pitch.' };
const phrase = { title:'Carry ease into a sentence', seconds:60, copy:'Say the sentence once with your everyday voice. After a short rest, try the same sentence with the easy tone you just explored. Keep natural expression and ordinary breathing.', prompt:'“Maybe we could meet for coffee tomorrow.”', safety:'Aim for comfort and naturalness. You do not need to hold every syllable within a pitch band.' };
const cooldown = { title:'Return to easy speech', seconds:30, copy:'Use your easiest ordinary speaking voice. Say a short sentence, then rest. Notice one thing that felt comfortable today.', prompt:'“That is enough for today.”', safety:'Stop rather than continuing if your voice is tired. More minutes do not mean better progress.' };
export const routines = {
 daily: { name:'Daily practice', steps:[settle,hum,resonance,rest,{...phrase,seconds:105},cooldown] },
 resonance: { name:'Resonance exploration', steps:[settle,resonance,rest,{...phrase,seconds:90},cooldown] },
 warmup: { name:'Gentle warmup', steps:[settle,hum,rest,{...hum,title:'An easy variation',seconds:45,copy:'Repeat a few short, comfortable hums. If it feels easy, make a tiny pitch glide within your normal range, then return. Rest after each 2–3 second sound.',prompt:'A small glide. A long rest.'},cooldown] }
};

export const sessionLengths = [10,15,20,30,45,60];
export function buildRoutine(key, minutes=0) {
 const base=routines[key]||routines.daily;
 if(!sessionLengths.includes(minutes))return base;
 const listen={title:'Listen and notice',seconds:45,copy:'Rest your voice. If you have a saved clip, listen once. Notice ease, expression, and one sound you like. You can also imagine how you want an everyday sentence to feel.',prompt:'Listen with curiosity. Leave the judging aside.',safety:'Stay silent during this step. Playback disconnects the microphone; reconnect only if you want feedback later.'};
 const longRest={...rest,title:'A longer silent break',seconds:120,copy:'Take a full silent break. Breathe normally, sip water, and relax your jaw. Check for fatigue. Finishing early is always an option.',prompt:'Rest. Reset. Continue only if comfortable.'};
 const exercise=key==='warmup'?{...hum,seconds:45}:key==='resonance'?{...resonance,seconds:45}:{...phrase,seconds:45};
 const transfer={...phrase,title:'A small everyday conversation',seconds:45,copy:'Say one or two short sentences as though greeting a friend or ordering a drink. Explore one easy change, then rest for the rest of the step.',prompt:'“Hi! How has your day been?”'};
 const steps=[{...settle},{...hum},{...rest}];
 let remaining=minutes*60-steps.reduce((n,s)=>n+s.seconds,0)-cooldown.seconds;
 const cycle=[exercise,{...rest,seconds:45},listen,transfer,longRest];
 let index=0;
 while(remaining>0){const next=cycle[index++%cycle.length],seconds=Math.min(next.seconds,remaining);steps.push({...next,seconds});remaining-=seconds;}
 steps.push({...cooldown});
 return {name:`${base.name} · ${minutes} minutes`,steps};
}
