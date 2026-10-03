import {summarize} from './pitch.js?v=speech-mic-2';

export const practicePrompts = {
 coffee:{label:'Everyday sentence',text:'Maybe we could meet for coffee tomorrow. I would love to hear how your day has been.'},
 greeting:{label:'A friendly greeting',text:'Hi, it is good to see you. How has your day been? Mine has been pretty quiet so far.'},
 counting:{label:'Counting with expression',text:'One, two, three, four, five. Six, seven, eight, nine, ten.'}
};

export function voiceFeedback(frames, goal, comfort='easy') {
 const voiced=frames.filter(f=>Number.isFinite(f.hz)&&f.hz>=65&&f.hz<=650);
 const pitch=summarize(voiced.map(f=>f.hz));
 const coverage=frames.length?voiced.length/frames.length:0;
 const validGoal=goal&&Number.isFinite(goal.low)&&Number.isFinite(goal.high)&&goal.low>=65&&goal.high<=650&&goal.low<goal.high;
 const reliable=voiced.length>=12&&coverage>=.2;
 const result={pitch,coverage,reliable,goal:validGoal?{low:goal.low,high:goal.high}:null,within:null,summary:'',next:''};
 if(comfort==='strain'){
  result.summary='Rest comes first.';
  result.next='Stop practicing for now. Do not repeat the recording to chase a range. If discomfort or hoarseness persists, seek qualified voice care.';
  return result;
 }
 if(voiced.length<12||coverage<.2){
  result.summary='There is not enough clear voiced sound for useful pitch feedback.';
  result.next='Try a quieter room and check microphone sensitivity. When comfortable, read one short sentence at your usual volume. Silence and sounds such as s and f normally leave gaps; you do not need to fill the whole recording.';
  return result;
 }
 if(validGoal){
  result.within=voiced.filter(f=>f.hz>=goal.low&&f.hz<=goal.high).length/voiced.length;
  if(pitch.median<goal.low){
   result.summary='Your middle pitch was below your chosen range.';
   result.next='If a higher pitch feels comfortable, try a tiny upward glide, rest, then carry that easy pitch into the first few words. Keep ordinary volume. You can also choose a closer range; never squeeze or push to reach a number.';
  }else if(pitch.median>goal.high){
   result.summary='Your middle pitch was above your chosen range.';
   result.next='Try the sentence once at your easiest speaking pitch. After a rest, explore a small downward glide if it feels comfortable. Avoid pressing your voice down or adding vocal fry to reach the range.';
  }else{
   result.summary='Your middle pitch was inside your chosen range.';
   result.next=result.within<.6?'Your pitch moved outside the range often. Natural speech has rises and falls; the goal is a comfortable speaking pattern, not keeping every syllable in a band. Listen back, then try one short phrase with easy expression.':'Keep the ease you found. Listen back for natural expression and comfort, then carry it into a short everyday sentence. There is no need to flatten your melody or raise your pitch further.';
  }
 }else{
  result.summary='Here is the pitch pattern from your recording.';
  result.next='Listen for comfort and natural expression. If you want feedback against a Hz range, enable the optional pitch guide in Settings and choose comfortable limits.';
 }
 if(coverage<.5)result.next+=' Many frames were unclear or silent, so treat these estimates cautiously.';
 return result;
}
