import {readState} from './storage.js?v=access-1';
import {normalizeLanguage} from './personalization.js';
import {validTheme,readProfiles,saveProfiles} from './profiles-store.js?v=access-1';
import {normalizeReading} from './reading-prefs.js?v=access-1';

export const MAX_BACKUP_BYTES=200*1024*1024;
const MAX_AUDIO_BYTES=125*1024*1024;
const fail=message=>{throw new Error(message);};
const text=(value,max,fallback='')=>typeof value==='string'?value.slice(0,max):fallback;

export function validateBackup(value){
 if(value?.format!=='true-you-voice-backup'||value.version!==1)fail('Choose a True You Voice full backup, version 1. Progress-only exports cannot be restored here.');
 if(!Array.isArray(value.profiles)||!value.profiles.length||value.profiles.length>51)fail('The backup must contain between 1 and 51 profiles.');
 let bytes=0,count=0;
 const profiles=value.profiles.map(p=>{
  if(!p||typeof p.name!=='string'||!p.name.trim()||!p.state||!Array.isArray(p.state.sessions)||p.state.sessions.length>500||!Array.isArray(p.clips))fail('A profile in this backup is incomplete.');
  const s=p.state.settings;if(!s||!Number.isInteger(s.low)||!Number.isInteger(s.high)||s.low<65||s.high>650||s.low>=s.high)fail('A profile has invalid pitch preferences.');
  const state=readState({getItem:()=>JSON.stringify(p.state)});
  if(state.sessions.length!==p.state.sessions.length)fail('A profile has invalid practice history.');
  state.sessions=state.sessions.map(s=>({id:text(s.id,80),name:text(s.name,120),date:new Date(s.date).toISOString(),seconds:s.seconds,comfort:s.comfort,note:s.note,pitch:s.pitch?{median:s.pitch.median,low:s.pitch.low,high:s.pitch.high}:null}));
  const clips=p.clips.map(c=>{
   if(++count>2000)fail('This backup has too many recordings.');
   if(!c||typeof c.audio!=='string'||!c.audio.length||c.audio.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(c.audio)||typeof c.type!=='string'||!/^audio\/(webm|mp4|ogg|wav|mpeg|x-m4a)(;[a-zA-Z0-9=., -]+)?$/.test(c.type)||!Number.isFinite(c.duration)||c.duration<0||c.duration>120||!Number.isFinite(Date.parse(c.date)))fail('A recording in this backup is invalid.');
   bytes+=c.audio.length*3/4-(c.audio.endsWith('==')?2:c.audio.endsWith('=')?1:0);if(bytes>MAX_AUDIO_BYTES)fail('Audio in a backup must be under 125 MB. Back up fewer profiles or download large recordings separately.');
   return {name:text(c.name,80,'Voice practice'),date:new Date(c.date).toISOString(),duration:c.duration,type:c.type,audio:c.audio};
  });
  return {name:p.name.trim().slice(0,60),goal:text(p.goal,300),theme:validTheme(p.theme),language:normalizeLanguage(p.language),reading:normalizeReading(p.reading),state,clips};
 });
 return {format:'true-you-voice-backup',version:1,profiles};
}

export async function makeBackup(profiles,readClips,encode){
 let bytes=0;const result=[];
 for(const p of profiles){const clips=[];for(const c of await readClips(p.id)){bytes+=c.blob.size;if(bytes>MAX_AUDIO_BYTES)fail('Audio is over 125 MB. Choose one profile, omit recordings, or download recordings separately.');clips.push({name:c.name,date:c.date,duration:c.duration,type:c.blob.type,audio:await encode(c.blob)});}result.push({name:p.name,goal:p.goal,theme:p.theme,language:p.language,reading:p.reading,state:p.state,clips});}
 return validateBackup({format:'true-you-voice-backup',version:1,profiles:result});
}

// Restored owners and clips get new IDs. Existing profiles are never replaced.
export async function restoreBackup(backup,{storage,saveClips,removeClips,decode,uuid}){
 const value=validateBackup(backup),existing=readProfiles(storage);
 if(existing.length+value.profiles.length>50)fail(`This device has room for ${50-existing.length} more profiles. Select fewer profiles from the backup.`);
 const profiles=value.profiles.map(p=>({id:uuid(),name:p.name,goal:p.goal,theme:p.theme,language:p.language,reading:p.reading}));
 const clips=value.profiles.flatMap((p,i)=>p.clips.map(c=>({id:uuid(),profileId:profiles[i].id,name:c.name,date:c.date,duration:c.duration,blob:decode(c.audio,c.type)})));
 const keys=profiles.map(p=>'voice-studio-v1:'+p.id);
 try{
  if(clips.length)await saveClips(clips);
  keys.forEach((key,i)=>storage.setItem(key,JSON.stringify(value.profiles[i].state)));
  const latest=readProfiles(storage);
  if(latest.length+profiles.length>50)fail('Another tab added profiles. There is no longer enough room to restore this backup.');
  saveProfiles(storage,[...latest,...profiles]);
 }catch(error){
  for(const key of keys)try{storage.removeItem(key);}catch{}
  try{if(clips.length)await removeClips(clips.map(c=>c.id));}catch{throw new Error('Restore failed and some incomplete recordings may remain. Existing profiles were not replaced.');}
  throw new Error('Could not restore the backup. Storage may be blocked or full. Existing profiles were not replaced.');
 }
 return profiles;
}
