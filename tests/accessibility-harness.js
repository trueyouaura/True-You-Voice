/* Development-only checks use disposable profiles and restore browser storage. */
window.addEventListener('DOMContentLoaded',()=>{
 const $=id=>document.getElementById(id),out=document.createElement('section');out.id='access-results';out.className='card';document.querySelector('main').prepend(out);const run=document.createElement('button');run.textContent='Run accessibility checks';out.append(run);
 run.onclick=async()=>{
  run.disabled=true;let count=0;const before=new Map(Array.from({length:localStorage.length},(_,i)=>{const k=localStorage.key(i);return [k,localStorage.getItem(k)];}));
  const wait=ms=>new Promise(r=>setTimeout(r,ms));const until=async fn=>{for(let i=0;i<100;i++){if(fn())return;await wait(40);}throw Error('Timed out');};
  const check=(ok,label)=>{const p=document.createElement('p');p.textContent=(ok?'PASS: ':'FAIL: ')+label;out.append(p);if(!ok)throw Error(label);count++;};
  const change=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new Event('change',{bubbles:true}));};
  const create=async name=>{$('new-profile-name').value=name;$('profile-create-form').requestSubmit();await until(()=>$('profile-badge').textContent===name);return $('profile-select').value;};
  let frame;
  try{
   $('welcome-close').click();location.hash='settings';await wait(100);const owner=await create('Reading fixture A');
   change('reading-size','extra');change('reading-chart','hidden');$('focus-toggle').click();
   check(document.documentElement.dataset.text==='extra'&&getComputedStyle(document.documentElement).fontSize==='20px','Extra large text applies');
   check(document.documentElement.dataset.focus==='true'&&$('focus-toggle').getAttribute('aria-pressed')==='true','Focus view has an accessible on/off state');
   location.hash='studio';await wait(80);check(getComputedStyle($('chart-panel')).display==='none'&&getComputedStyle(document.querySelector('.intention')).display==='none'&&getComputedStyle($('studio-safety')).display!=='none','Focus view and chart hiding preserve visible safety guidance');
   location.hash='settings';await wait(80);await create('Reading fixture B');check(document.documentElement.dataset.text==='standard'&&document.documentElement.dataset.focus==='false','New profiles start with their own reading preferences');
   change('profile-select',owner);await until(()=>$('profile-badge').textContent==='Reading fixture A');check(document.documentElement.dataset.text==='extra'&&document.documentElement.dataset.focus==='true','Switching profiles restores reading preferences');
   change('reading-chart','manual');location.hash='studio';await wait(80);check(!$('chart-refresh').hidden&&getComputedStyle($('chart-panel')).display!=='none','Manual chart has a visible update control');$('chart-refresh').click();
   location.hash='practice';await wait(80);change('session-length','untimed');$('session-start').click();await wait(1100);
   const first=$('step-title').textContent,announcement=$('step-announcement').textContent;check($('timer').textContent==='Your pace'&&!$('session-next').hidden,'No-countdown practice exposes manual step controls');
   await wait(800);check($('step-title').textContent===first&&$('step-announcement').textContent===announcement,'Elapsed time does not advance the step or repeatedly announce it');
   $('session-pause').click();check($('session-next').disabled&&$('session-pause').getAttribute('aria-pressed')==='true','Pausing disables the next-step control');$('session-pause').click();$('session-next').click();check($('step-title').textContent!==first&&$('step-announcement').textContent.includes('Step 2'),'Next step advances one step and announces it');
   while($('session-review').hidden&&$('session-next').textContent!=='Finish practice')$('session-next').click();
   if($('session-review').hidden)$('session-next').click();check(!$('session-review').hidden&&$('session-next').hidden,'The last manual step finishes and opens reflection');$('session-discard').click();
   frame=document.createElement('iframe');frame.title='Narrow layout fixture';frame.style.width='320px';frame.style.height='800px';frame.src='/#settings';out.append(frame);await new Promise(r=>frame.onload=r);await wait(250);
   const d=frame.contentDocument;
   for(const route of ['settings','studio','practice','recordings','progress','care']){frame.contentWindow.location.hash=route;await wait(80);check(d.documentElement.scrollWidth<=d.documentElement.clientWidth,`320px layout has no horizontal page overflow: ${route}`);}
   check(getComputedStyle(d.documentElement).fontSize==='20px','Narrow layouts retain extra large profile text');
   check($('timer').getAttribute('aria-live')===null&&$('step-announcement').getAttribute('aria-live')==='polite','Timers stay silent while step announcements are available');
   location.hash='settings';$('reading-reset').click();check(document.documentElement.dataset.motion==='reduce'&&!$('reading-announce').checked,'Reset reduces movement and disables pitch announcements');
   out.append(Object.assign(document.createElement('strong'),{textContent:`ALL ${count} ACCESSIBILITY CHECKS PASSED`}));
  }catch(e){out.append(Object.assign(document.createElement('strong'),{textContent:`FAILED: ${e.message}`}));}
  finally{frame?.remove();if(!$('session-review').hidden)$('session-discard').click();if(!$('session-end').disabled){$('session-end').click();$('session-discard').click();}for(const k of Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)))if(!before.has(k))localStorage.removeItem(k);for(const [k,v]of before)localStorage.setItem(k,v);}
 };
});
