import {makeBackup,validateBackup,restoreBackup,MAX_BACKUP_BYTES} from './backup-data.js?v=dark-default-1';
import {clipStore} from './storage.js?v=dark-default-1';
const $=id=>document.getElementById(id);
const encode=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(Error('Could not read a saved recording.'));reader.readAsDataURL(blob);});
const decode=(audio,type)=>{const binary=atob(audio),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return new Blob([bytes],{type});};

export function initLaunch(hooks){
 let working=false,pending=null,backupURL=null;
 const status=message=>{$('backup-status').textContent=message;};
 const ready=()=>{if(working||hooks.busy()){status('Disconnect your microphone and finish your session, reflection, or temporary recording before managing backups.');return false;}return true;};
 async function work(action,focusId){working=true;$('main').inert=true;$('backup-status').setAttribute('aria-busy','true');try{await action();}catch(e){status(e.message||'Could not complete the backup action. Please try again.');}finally{working=false;$('main').inert=false;$('backup-status').removeAttribute('aria-busy');if(focusId&&!document.querySelector('dialog[open]'))($(focusId).hidden?$('backup-download'):$(focusId)).focus();}}
 $('backup-download').onclick=()=>{if(!ready())return;work(async()=>{status('Preparing your private backup…');$('backup-save').hidden=true;if(backupURL){URL.revokeObjectURL(backupURL);backupURL=null;}const profiles=hooks.snapshot($('backup-scope').value==='all');const data=await makeBackup(profiles,id=>$('backup-audio').checked?clipStore('list',undefined,id):[],encode);backupURL=URL.createObjectURL(new Blob([JSON.stringify({...data,createdAt:new Date().toISOString()})],{type:'application/json'}));$('backup-save').href=backupURL;$('backup-save').hidden=false;$('backup-save').click();status(`Backup ready: ${data.profiles.length} profile(s), ${data.profiles.reduce((n,p)=>n+p.clips.length,0)} recording(s). If the download did not start, choose Save backup file. Keep it somewhere private.`);},'backup-save');};
 window.addEventListener('pagehide',()=>{if(backupURL)URL.revokeObjectURL(backupURL);backupURL=null;$('backup-save').hidden=true;});
 $('backup-file').onchange=()=>{const file=$('backup-file').files[0];$('backup-file').value='';if(!file||!ready())return;work(async()=>{status('Checking the backup locally…');if(file.size>MAX_BACKUP_BYTES)throw Error('Choose a backup smaller than 200 MB.');pending=validateBackup(JSON.parse(await file.text()));const select=$('restore-selection');select.replaceChildren(new Option('All profiles in this backup','all'));pending.profiles.forEach((p,i)=>select.add(new Option(p.name,String(i))));select.value=pending.profiles.length===1?'0':'all';preview();$('restore-dialog').showModal();$('restore-cancel').focus();status('Backup checked. Review the profiles before restoring.');});};
 function selected(){return $('restore-selection').value==='all'?pending.profiles:[pending.profiles[Number($('restore-selection').value)]];}
 function preview(){const profiles=selected();$('restore-summary').textContent=`${profiles.length} profile(s), ${profiles.reduce((n,p)=>n+p.state.sessions.length,0)} practice session(s), and ${profiles.reduce((n,p)=>n+p.clips.length,0)} recording(s). Profiles will be added as separate copies; existing data stays in place.`;}
 $('restore-selection').onchange=preview;
 $('restore-cancel').onclick=()=>$('restore-dialog').close();
 $('restore-dialog').addEventListener('close',()=>{pending=null;});
 $('restore-confirm').onclick=()=>{if(!ready()||!pending)return;const data={...pending,profiles:selected()};$('restore-dialog').close();work(async()=>{status('Restoring your backup…');await restoreBackup(data,{storage:localStorage,saveClips:clips=>clipStore('saveMany',clips),removeClips:ids=>clipStore('deleteMany',ids),decode,uuid:()=>crypto.randomUUID()});await hooks.refresh();status('Backup restored. Select a restored profile above to use it.');},'profile-select');};

 const welcome=$('welcome-dialog');
 function openWelcome(){if(working||document.querySelector('dialog[open]'))return;welcome.showModal();$('welcome-close').focus();}
 function dismiss(){try{localStorage.setItem('true-you-voice-welcome-v1','seen');}catch{}welcome.close();}
 $('welcome-open').onclick=openWelcome;$('welcome-close').onclick=dismiss;
 $('welcome-profile').onclick=()=>{dismiss();location.hash='settings';$('new-profile-name').focus();};
 $('welcome-practice').onclick=()=>{dismiss();location.hash='practice';$('session-start').focus();};
 welcome.addEventListener('cancel',()=>{try{localStorage.setItem('true-you-voice-welcome-v1','seen');}catch{}});
 // Keep welcome out of development fixtures, and defer until profile startup settles.
 if(!location.pathname.startsWith('/__'))setTimeout(()=>{try{if(!localStorage.getItem('true-you-voice-welcome-v1')&&!hooks.busy())openWelcome();}catch{}},350);
}
