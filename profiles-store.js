import {normalizeLanguage} from './personalization.js?v=profile-language-1';
export const PROFILES_KEY='voice-studio-profiles';
const themes=['trans-fem-light','trans-fem-dark','nonbinary-light','nonbinary-dark','blue-gold-light','blue-gold-dark','teal-rose-light','teal-rose-dark','monochrome-light','monochrome-dark','ocean-light','ocean-dark','forest-light','forest-dark','sunset-light','sunset-dark','bisexual-light','bisexual-dark','lesbian-light','lesbian-dark','pansexual-light','pansexual-dark','asexual-light','asexual-dark','rainbow-light','rainbow-dark','high-contrast-light','high-contrast-dark'];
export const validTheme=value=>themes.includes(value)?value:value==='trans-masc-dark'?'trans-fem-dark':'trans-fem-light';
export function readProfiles(storage){
 try{const data=JSON.parse(storage.getItem(PROFILES_KEY));if(!Array.isArray(data))return [];
 const seen=new Set();return data.filter(p=>p&&/^[a-zA-Z0-9-]{1,80}$/.test(p.id)&&p.id!=='guest'&&typeof p.name==='string'&&p.name.trim()&&!seen.has(p.id)&&(seen.add(p.id),true)).slice(0,50).map(p=>({id:p.id,name:p.name.trim().slice(0,60),goal:typeof p.goal==='string'?p.goal.slice(0,300):'',theme:validTheme(p.theme),language:normalizeLanguage(p.language)}));
 }catch{return [];}
}
export function saveProfiles(storage,profiles){storage.setItem(PROFILES_KEY,JSON.stringify(profiles));}
export function mergeSessions(a,b){const records=new Map([...a,...b].map(s=>[s.id,s]));return [...records.values()].sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-500);}
