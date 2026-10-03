/* Development-only integration fixture. NEVER included in the Pages artifact.
   Generates synthetic audio with Web Audio; does not request physical microphone access. */
let testAudio, testStream, testGain, testNoise, testOscillator, requestedAudio, mode='tone', resolveDelayed;
Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async constraints=>{
 requestedAudio=constraints.audio;
 if(mode==='deny')throw new DOMException('Test denial','NotAllowedError');
 if(mode==='delayed')await new Promise(resolve=>resolveDelayed=resolve);
 testAudio=new AudioContext();await testAudio.resume();
 const oscillator=testAudio.createOscillator(),gain=testAudio.createGain(),destination=testAudio.createMediaStreamDestination();
 oscillator.frequency.value=180;gain.gain.value=.2;testGain=gain;testOscillator=oscillator;oscillator.connect(gain);gain.connect(destination);oscillator.start();
 const noise=testAudio.createBufferSource(),buffer=testAudio.createBuffer(1,48000,testAudio.sampleRate);let seed=19;const channel=buffer.getChannelData(0);for(let i=0;i<channel.length;i++){seed=(seed*1664525+1013904223)>>>0;channel[i]=(seed/2**32-.5)*2;}noise.buffer=buffer;noise.loop=true;testNoise=testAudio.createGain();testNoise.gain.value=0;noise.connect(testNoise);testNoise.connect(destination);noise.start();
 testStream=destination.stream;return testStream;
}});
window.addEventListener('DOMContentLoaded',async()=>{
 const out=document.createElement('section');out.id='test-results';out.className='card';out.setAttribute('aria-label','Integration test results');document.querySelector('main').prepend(out);
 const start=document.createElement('button');start.textContent='Run integration checks';out.append(start);start.onclick=async()=>{start.disabled=true;const backup=localStorage.getItem('voice-studio-v1'),micBackup=localStorage.getItem('true-you-voice-mic-mode'); const wait=ms=>new Promise(r=>setTimeout(r,ms)),$=id=>document.getElementById(id),results=[];
 const check=(condition,label)=>{results.push({label,pass:!!condition});const p=document.createElement('p');p.textContent=`${condition?'PASS':'FAIL'}: ${label}`;out.append(p);if(!condition)throw Error(label);};
 async function until(fn){for(let n=0;n<50;n++){if(fn())return;await wait(100);}throw Error('Timed out waiting for app');}
 try{
   await wait(100);
   $('range-low').value='240';$('range-high').value='200';$('range-form').requestSubmit();check($('notice').textContent.includes('lower limit'),'Invalid pitch range is rejected');
   $('range-low').value='170';$('range-high').value='230';$('range-form').requestSubmit();check(JSON.parse(localStorage.getItem('voice-studio-v1')).settings.low===170,'Range persists locally');
   $('mic-toggle').click();await until(()=>$('mic-badge').textContent==='Microphone live');await until(()=>Math.abs(Number($('pitch-value').textContent)-180)<2);check(true,'Worker receives Web Audio and detects synthetic 180 Hz');
   const chooseMic=value=>{$('mic-sensitivity').value=value;$('mic-sensitivity').dispatchEvent(new Event('change'));};
   chooseMic('desk');testGain.gain.value=.003;await wait(500);await until(()=>Math.abs(Number($('pitch-value').textContent)-180)<2);check($('signal').textContent.includes('quiet')&&$('level').value>.2,'Desk mode tracks quiet speech and shows a useful input level');
   chooseMic('nearby');await until(()=>$('pitch-value').textContent==='—');check(true,'Nearby mode filters quiet input without reconnecting');
   chooseMic('quiet');testGain.gain.value=.0008;await wait(500);await until(()=>Math.abs(Number($('pitch-value').textContent)-180)<2);check(localStorage.getItem('true-you-voice-mic-mode')==='quiet','Very quiet mode tracks softer speech and saves the device preference');
   chooseMic('desk');testGain.gain.value=.2;
   check(requestedAudio.noiseSuppression&&requestedAudio.autoGainControl&&requestedAudio.echoCancellation,'Capture requests browser support for noise reduction and input level');
   testGain.gain.value=.003;testNoise.gain.value=.003;testOscillator.frequency.setValueAtTime(160,testAudio.currentTime);testOscillator.frequency.linearRampToValueAtTime(220,testAudio.currentTime+2);await wait(400);let tracked=0;for(let n=0;n<10;n++){await wait(150);const hz=Number($('pitch-value').textContent);if(hz>=150&&hz<=235)tracked++;}check(tracked>=8,'Filtered analysis follows changing quiet voiced sound with equally loud broadband noise');
   testGain.gain.value=0;await wait(600);await until(()=>$('pitch-value').textContent==='—');check(true,'Noise alone leaves a gap rather than holding the last voiced reading');
   testNoise.gain.value=0;testGain.gain.value=.2;testOscillator.frequency.setValueAtTime(180,testAudio.currentTime);
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
 finally{testStream?.getTracks().forEach(t=>t.stop());await testAudio?.close();if(backup===null)localStorage.removeItem('voice-studio-v1');else localStorage.setItem('voice-studio-v1',backup);if(micBackup===null)localStorage.removeItem('true-you-voice-mic-mode');else localStorage.setItem('true-you-voice-mic-mode',micBackup);}};
});
