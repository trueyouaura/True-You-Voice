/* Development-only integration fixture. NEVER included in the Pages artifact.
   Generates synthetic audio with Web Audio; does not request physical microphone access. */
let testAudio, testStream, mode='tone', resolveDelayed;
Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{
 if(mode==='deny')throw new DOMException('Test denial','NotAllowedError');
 if(mode==='delayed')await new Promise(resolve=>resolveDelayed=resolve);
 testAudio=new AudioContext();await testAudio.resume();
 const oscillator=testAudio.createOscillator(),gain=testAudio.createGain(),destination=testAudio.createMediaStreamDestination();
 oscillator.frequency.value=180;gain.gain.value=.2;oscillator.connect(gain);gain.connect(destination);oscillator.start();
 testStream=destination.stream;return testStream;
}});
window.addEventListener('DOMContentLoaded',async()=>{
 const out=document.createElement('section');out.id='test-results';out.className='card';out.setAttribute('aria-label','Integration test results');document.querySelector('main').prepend(out);
 const start=document.createElement('button');start.textContent='Run integration checks';out.append(start);start.onclick=async()=>{start.disabled=true;const backup=localStorage.getItem('voice-studio-v1'); const wait=ms=>new Promise(r=>setTimeout(r,ms)),$=id=>document.getElementById(id),results=[];
 const check=(condition,label)=>{results.push({label,pass:!!condition});const p=document.createElement('p');p.textContent=`${condition?'PASS':'FAIL'}: ${label}`;out.append(p);if(!condition)throw Error(label);};
 async function until(fn){for(let n=0;n<50;n++){if(fn())return;await wait(100);}throw Error('Timed out waiting for app');}
 try{
   await wait(100);
   $('range-low').value='240';$('range-high').value='200';$('range-form').requestSubmit();check($('notice').textContent.includes('lower limit'),'Invalid pitch range is rejected');
   $('range-low').value='170';$('range-high').value='230';$('range-form').requestSubmit();check(JSON.parse(localStorage.getItem('voice-studio-v1')).settings.low===170,'Range persists locally');
   $('mic-toggle').click();await until(()=>$('mic-badge').textContent==='Microphone live');await until(()=>Math.abs(Number($('pitch-value').textContent)-180)<2);check(true,'Worker receives Web Audio and detects synthetic 180 Hz');
   $('record-toggle').click();await wait(1500);$('record-toggle').click();await until(()=>!$('clip-draft').hidden);check($('draft-audio').src.startsWith('blob:'),'Real MediaRecorder produces a local playable blob');
   $('clip-name').value='Integration test clip';$('clip-save').click();await until(()=>$('clips-list').textContent.includes('Integration test clip'));check(true,'Recording saves to IndexedDB and appears in library');
   const clipAudio=$('clips-list').querySelector('audio');await until(()=>clipAudio.readyState>=1);check(clipAudio.error===null,'Recorded audio metadata loads without decoding errors');
   $('clips-list').querySelector('.controls button:last-child').click();$('confirm-ok').click();await until(()=>!$('clips-list').textContent.includes('Integration test clip'));check(true,'Recording deletion succeeds');
   location.hash='practice';await wait(100);$('session-start').click();await wait(1300);$('session-pause').click();const t=$('timer').textContent;await wait(500);check($('timer').textContent===t,'Paused practice timer remains still');$('session-pause').click();await wait(700);$('session-end').click();check(!$('session-review').hidden,'Finishing a session opens comfort reflection');
   $('reflection').value='<script>unsafe</script>'; $('session-save').click();await wait(150);check($('sessions-list').textContent.includes('<script>unsafe</script>')&&!$('sessions-list').querySelector('script'),'Notes render as text, never executable HTML');
   mode='deny';$('mic-toggle').click();await until(()=>$('notice').textContent.includes('denied'));check($('mic-badge').textContent==='Microphone off','Permission denial is recoverable');
   mode='delayed';$('mic-toggle').click();await until(()=>!!resolveDelayed);$('mic-toggle').click();resolveDelayed();await wait(300);check(testStream.getTracks().every(t=>t.readyState==='ended')&&$('mic-badge').textContent==='Microphone off','Cancelled permission request cannot leave microphone running');
   out.prepend(Object.assign(document.createElement('h2'),{textContent:`${results.length} integration checks passed`}));
 }catch(e){out.prepend(Object.assign(document.createElement('h2'),{textContent:'Integration check failed: '+e.message}));}
 finally{testStream?.getTracks().forEach(t=>t.stop());await testAudio?.close();if(backup===null)localStorage.removeItem('voice-studio-v1');else localStorage.setItem('voice-studio-v1',backup);}};
});
