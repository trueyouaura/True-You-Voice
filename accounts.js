import { CloudClient, mergeSessions } from './cloud.js';
import { readState, writeState } from './storage.js';
const $=id=>document.getElementById(id),cacheKey=id=>`voice-studio-v1:${id}`,pendingKey=id=>`voice-studio-pending:${id}`;
const sanitize=value=>readState({getItem:()=>JSON.stringify(value)});
export function initAccounts(hooks){
 const client=new CloudClient();let owner='guest',profile={display_name:'Voice explorer',goal:'',preferences:{}},running=false,pending=false,syncTimer=null,codeEmail='',lastSent=0,applying=false,editing=false;
 let guestTheme=document.documentElement.dataset.theme;try{guestTheme=localStorage.getItem('voice-studio-guest-theme')||guestTheme;}catch{}
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}};
 const store=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
 const status=(message,error=false)=>{$('account-status').textContent=message;$('account-status').classList.toggle('error',error);};
 const ready=()=>{if(hooks.busy()){hooks.notify('Finish your session and save or discard the temporary clip before changing accounts.',true);return false;}return true;};
 function paint(){const signed=owner!=='guest';$('account-signed-out').hidden=signed&&!!client.user;$('account-signed-in').hidden=!signed;if(!editing){$('profile-name').value=profile.display_name;$('profile-goal').value=profile.goal;}$('profile-email').textContent=client.user?.email||'Sign in again to reconnect this profile.';$('profile-badge').textContent=signed?profile.display_name:'Guest';$('space-label').textContent=signed?`${profile.display_name}’S PRACTICE SPACE`:'YOUR PRACTICE SPACE';$('account-request').disabled=!client.enabled;$('account-setup').hidden=client.enabled;$('import-guest').disabled=!signed||running;$('sync-now').disabled=!signed||running;$('account-signout').disabled=running;$('delete-data').textContent=signed?'Delete this profile’s recordings from this device':'Delete guest data from this device';}
 function savedProfile(){return {display_name:profile.display_name,goal:profile.goal,preferences:{...hooks.getState().settings,theme:document.documentElement.dataset.theme}};}
 async function activate(){
  if(!client.user){paint();return;}if(!ready())return;
  editing=false;running=true;$('main').inert=true;status('Loading your profile…');
  const id=client.user.id,cached=read(cacheKey(id),null),dirty=read(pendingKey(id),null);
  try{
   const remote=await client.load();const remoteState=sanitize({settings:remote.profile?.preferences||{},sessions:remote.sessions});
   const next=dirty&&cached?sanitize({...cached,sessions:mergeSessions(remoteState.sessions,cached.sessions)}):remoteState;
   profile=dirty?.profile||remote.profile||{display_name:$('account-name').value.trim()||'Voice explorer',goal:'',preferences:{}};
   await hooks.stop();owner=id;pending=!!dirty;hooks.setState(next,id);
   const theme=(dirty?.profile||remote.profile)?.preferences?.theme||guestTheme;if(theme){applying=true;window.dispatchEvent(new CustomEvent('voice-theme-apply',{detail:theme}));applying=false;}
   store(cacheKey(id),{...next,profile:savedProfile()});paint();if(!remote.profile){pending=true;store(pendingKey(id),{profile:savedProfile()});}
   status(pending?'Profile loaded. Syncing your saved changes…':'Your profile is synced.');
  }catch(e){
   if(cached&&client.user){await hooks.stop();owner=id;profile=dirty?.profile||cached.profile||{display_name:'Voice explorer',goal:'',preferences:{}};pending=!!dirty;hooks.setState(sanitize(cached),id);if(profile.preferences?.theme){applying=true;window.dispatchEvent(new CustomEvent('voice-theme-apply',{detail:profile.preferences.theme}));applying=false;}paint();status('Using cached practice. '+e.message,true);}
   else{await client.signOut().catch(()=>{});status(e.message,true);paint();}
  }finally{running=false;$('main').inert=false;paint();}
  if(pending)sync();
 }
 async function sync(){
  if(owner==='guest'||running)return;if(!client.user||client.user.id!==owner){status('Sign in again to sync your pending practice.',true);return;}
  running=true;paint();status('Syncing…');const id=owner,snapshot=structuredClone(hooks.getState()),metadata=savedProfile();
  try{if(pending){await client.saveSessions(snapshot.sessions);await client.saveProfile(metadata);if(owner!==id)return;const current=hooks.getState();if(JSON.stringify(current)===JSON.stringify(snapshot)&&JSON.stringify(savedProfile())===JSON.stringify(metadata)){pending=false;try{localStorage.removeItem(pendingKey(id));}catch{}}}
   const remote=await client.load();if(owner!==id)return;const current=hooks.getState(),merged=pending?mergeSessions(remote.sessions,current.sessions):remote.sessions;const next=sanitize({...current,sessions:merged});if(!pending&&remote.profile){profile=remote.profile;next.settings=sanitize({settings:profile.preferences,sessions:[]}).settings;const theme=profile.preferences?.theme;if(theme){applying=true;window.dispatchEvent(new CustomEvent('voice-theme-apply',{detail:theme}));applying=false;}}hooks.setState(next,owner,false);store(cacheKey(id),{...hooks.getState(),profile:savedProfile()});status(pending?'More changes are waiting to sync.':'Synced across your devices.');
  }catch(e){status('Saved on this device; sync is pending. '+e.message,true);}
  finally{running=false;paint();if(pending&&navigator.onLine){clearTimeout(syncTimer);syncTimer=setTimeout(sync,30000);}}
 }
 function changed(){if(applying)return;if(owner==='guest'){guestTheme=document.documentElement.dataset.theme;try{localStorage.setItem('voice-studio-guest-theme',guestTheme);}catch{}return;}pending=true;store(cacheKey(owner),{...hooks.getState(),profile:savedProfile()});store(pendingKey(owner),{profile:savedProfile()});clearTimeout(syncTimer);syncTimer=setTimeout(sync,500);status('Saved on this device. Waiting to sync…');}
 $('account-email-form').onsubmit=async e=>{e.preventDefault();if(!ready())return;if(Date.now()-lastSent<60000){status('Please wait a minute before requesting another code.',true);return;}$('account-request').disabled=true;const email=$('account-email').value.trim();try{await client.sendCode(email);lastSent=Date.now();codeEmail=email;$('account-code-form').hidden=false;status('Check your email for a sign-in code. The same flow creates a new account if needed.');$('account-code').focus();}catch(e){status(e.message,true);}finally{setTimeout(()=>{$('account-request').disabled=!client.enabled;},60000);}};
 $('account-code-form').onsubmit=async e=>{e.preventDefault();if(!ready())return;$('account-verify').disabled=true;try{await client.verifyCode(codeEmail,$('account-code').value.trim(),$('account-remember').checked);$('account-code').value='';$('account-code-form').hidden=true;await activate();}catch(e){status(e.message,true);}finally{$('account-verify').disabled=false;}};
 $('profile-form').oninput=()=>{editing=true;};
 $('profile-form').onsubmit=e=>{e.preventDefault();editing=false;profile.display_name=$('profile-name').value.trim()||'Voice explorer';profile.goal=$('profile-goal').value.trim();paint();changed();};
 $('sync-now').onclick=sync;
 async function leave(){editing=false;running=true;$('main').inert=true;paint();clearTimeout(syncTimer);try{await hooks.stop();await client.signOut();}catch{hooks.notify('Signed out locally. The server could not be reached.');}finally{owner='guest';pending=false;profile={display_name:'Voice explorer',goal:'',preferences:{}};hooks.setState(readState(localStorage),'guest');applying=true;window.dispatchEvent(new CustomEvent('voice-theme-apply',{detail:guestTheme}));applying=false;running=false;$('main').inert=false;paint();status('Signed out. Guest practice stays on this device.');}}
 $('account-signout').onclick=()=>{if(!ready())return;if(pending){hooks.ask('Sign out with pending changes?','Your unsynced practice will stay cached on this device and can sync when you sign back into this account here. It will not reach other devices until then.',leave);}else leave();};
 $('import-guest').onclick=()=>hooks.ask('Add guest history to your account?','This uploads this browser’s guest session notes and pitch summaries to your private account. Recordings stay on the device.',async()=>{const guest=readState(localStorage);const current=hooks.getState();hooks.setState({...current,sessions:mergeSessions(current.sessions,guest.sessions)},owner);changed();status('Guest history added. Syncing…');});
 $('delete-cloud-history').onclick=()=>hooks.ask('Delete synced practice history?','This permanently deletes your account’s saved session history across devices. Export it first if you want to keep a copy. Your profile and local recordings remain.',async()=>{if(!ready())return;if(running)throw new Error('Please wait for sync to finish.');clearTimeout(syncTimer);running=true;$('main').inert=true;try{await client.clearPractice();hooks.setState({...hooks.getState(),sessions:[]},owner);pending=false;store(cacheKey(owner),{...hooks.getState(),profile:savedProfile()});try{localStorage.removeItem(pendingKey(owner));}catch{}status('Synced practice history deleted.');}finally{running=false;$('main').inert=false;paint();}});
 window.addEventListener('voice-theme-change',changed);
 window.addEventListener('online',sync);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&owner!=='guest'&&!hooks.busy())sync();});
 window.addEventListener('storage',e=>{if(e.key==='voice-studio-auth'&&owner!=='guest')status('Account sign-in changed in another tab. Reload before making changes.',true);});
 client.onChange=()=>paint();
 paint();activate();
 return {changed,get owner(){return owner;},get loading(){return running;}};
}
