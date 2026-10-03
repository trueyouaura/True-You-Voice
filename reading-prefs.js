export const DEFAULT_READING=Object.freeze({focus:false,text:'standard',spacing:'comfortable',motion:'reduce',chart:'live',announce:false});
export function normalizeReading(value){
 const v=value&&typeof value==='object'?value:{};
 return {focus:v.focus===true,text:['standard','large','extra'].includes(v.text)?v.text:DEFAULT_READING.text,spacing:['standard','comfortable'].includes(v.spacing)?v.spacing:DEFAULT_READING.spacing,motion:['system','reduce'].includes(v.motion)?v.motion:DEFAULT_READING.motion,chart:['live','manual','hidden'].includes(v.chart)?v.chart:DEFAULT_READING.chart,announce:v.announce===true};
}
