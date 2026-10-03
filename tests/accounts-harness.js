/* Development-only fake auth/REST. No email or account network calls. */
const fakeProfiles=new Map(),fakeSessions=new Map(),realNow=Date.now;let timeOffset=0;
Date.now=()=>realNow()+timeOffset;
const backupKeys=['voice-studio-v1','voice-studio-auth','voice-studio-theme'],backups=new Map(backupKeys.map(k=>[k,localStorage.getItem(k)]));
const tabBackup=sessionStorage.getItem('voice-studio-auth');
localStorage.removeItem('voice-studio-auth');sessionStorage.removeItem('voice-studio-auth');
const users={a:'10000000-0000-4000-8000-000000000001',b:'10000000-0000-4000-8000-000000000002'};
const realFetch=window.fetch;
window.fetch=async(url,opts={})=>{
 if(!String(url).includes('.supabase.co'))return realFetch(url,opts);
 const path=new URL(url).pathname,body=opts.body?JSON.parse(opts.body):null,who=opts.headers?.Authorization?.endsWith('token-b')?'b':'a',id=users[who];
 let data=null;
 if(path.endsWith('/otp'))data={};
 else if(path.endsWith('/verify')){const w=body.email.startsWith('b@')?'b':'a';data={user:{id:users[w],email:body.email},access_token:'token-'+w,refresh_token:'refresh-'+w,expires_in:3600};}
 else if(path.includes('voice_profiles')){if(opts.method==='POST')fakeProfiles.set(id,body);else data=fakeProfiles.has(id)?[fakeProfiles.get(id)]:[];}
 else if(path.includes('voice_sessions')){if(opts.method==='POST')fakeSessions.set(id,body);else if(opts.method==='DELETE')fakeSessions.delete(id);else data=(fakeSessions.get(id)||[]).map(s=>({payload:s.payload}));}
 else if(!path.endsWith('/logout'))throw Error('Unexpected fake request '+path);
 return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
};
window.addEventListener('DOMContentLoaded',()=>{
 const out=document.createElement('section');out.className='card';out.id='account-test-results';document.querySelector('main').prepend(out);
 const start=document.createElement('button');start.textContent='Run profile checks';out.append(start);
 start.onclick=async()=>{start.disabled=true;const $=id=>document.getElementById(id),wait=ms=>new Promise(r=>setTimeout(r,ms));let count=0;
 const check=(ok,label)=>{const p=document.createElement('p');p.textContent=(ok?'PASS: ':'FAIL: ')+label;out.append(p);if(!ok)throw Error(label);count++;};
 const until=async fn=>{for(let n=0;n<80;n++){if(fn())return;await wait(100);}throw Error('Timed out');};
 const login=async(w,name)=>{timeOffset+=61000;$('account-request').disabled=false;$('account-name').value=name;$('account-email').value=w+'@example.invalid';$('account-email-form').requestSubmit();await until(()=>!$('account-code-form').hidden);$('account-code').value='123456';$('account-code-form').requestSubmit();await until(()=>$('profile-badge').textContent===name);await until(()=>/synced/i.test($('account-status').textContent));};
 try{
  location.hash='account';await login('a','Profile A');check(fakeProfiles.get(users.a).display_name==='Profile A','New profile is saved to its own account');
  $('profile-goal').value='Easy speech';$('profile-form').requestSubmit();await until(()=>fakeProfiles.get(users.a).goal==='Easy speech');check(true,'Profile edits sync');
  $('theme-select').value='nonbinary-dark';$('theme-select').dispatchEvent(new Event('change'));await until(()=>fakeProfiles.get(users.a).preferences.theme==='nonbinary-dark');check(true,'Theme syncs with profile');
  location.hash='practice';$('session-length').value='60';$('session-length').dispatchEvent(new Event('change'));check($('session-total').textContent.includes('60:00'),'Hour session has correct total');$('session-start').click();await wait(1200);$('session-end').click();$('reflection').value='A private note';$('session-save').click();await until(()=>fakeSessions.get(users.a)?.length===1);check(true,'Saved practice syncs');
  location.hash='account';await until(()=>$('account-signout').disabled===false);$('account-signout').click();await until(()=>$('profile-badge').textContent==='Guest');check(!$('sessions-list').textContent.includes('A private note'),'Guest view excludes account history');
  await login('b','Profile B');check(!$('sessions-list').textContent.includes('A private note')&&$('profile-goal').value==='','Second account excludes first account history and goal');
  $('account-signout').click();await until(()=>$('profile-badge').textContent==='Guest');await login('a','Profile A');check($('profile-goal').value==='Easy speech'&&$('sessions-list').textContent.includes('A private note'),'Returning account restores its own cloud profile and history');
  out.prepend(Object.assign(document.createElement('h2'),{textContent:count+' profile checks passed'}));
 }catch(e){out.prepend(Object.assign(document.createElement('h2'),{textContent:'Profile check failed: '+e.message}));}
 finally{Date.now=realNow;window.fetch=realFetch;for(const[k,v]of backups){if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}for(const id of Object.values(users)){localStorage.removeItem('voice-studio-v1:'+id);localStorage.removeItem('voice-studio-pending:'+id);}if(tabBackup===null)sessionStorage.removeItem('voice-studio-auth');else sessionStorage.setItem('voice-studio-auth',tabBackup);}
 };
});
