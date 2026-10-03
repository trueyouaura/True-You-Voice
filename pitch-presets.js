// Optional interface guides, not clinical targets or gender categories.
export const PITCH_PRESETS=Object.freeze([
 {id:'starting',label:'App starting guide · 160–220 Hz',low:160,high:220,description:'The app’s original example band. Keep it only if it feels comfortable; it is not a recommended range for everyone.'},
 {id:'lower',label:'Lower pitch exploration · 100–150 Hz',low:100,high:150,description:'An optional lower band. Try this only when speaking here feels easy; do not force your voice downward.'},
 {id:'middle',label:'Middle pitch exploration · 140–190 Hz',low:140,high:190,description:'An optional middle band for exploring an easy speaking pitch. Natural speech can move outside it.'},
 {id:'higher',label:'Higher pitch exploration · 180–240 Hz',low:180,high:240,description:'An optional higher band. Explore gently only if comfortable; never squeeze or push to reach it.'}
]);
export function matchPitchPreset(low,high){return PITCH_PRESETS.find(p=>p.low===Number(low)&&p.high===Number(high))?.id||'custom';}
