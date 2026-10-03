const KEY = 'voice-studio-v1';
export function readState(storage) {
  const fallback = { settings:{low:160,high:220,show:true}, sessions:[] };
  try {
    const value = JSON.parse(storage.getItem(KEY));
    if (!value || !Array.isArray(value.sessions)) return fallback;
    const s=value.settings;
    const settings=s && Number.isInteger(s.low) && Number.isInteger(s.high) && s.low>=65 && s.high<=650 && s.low<s.high ? {low:s.low,high:s.high,show:s.show!==false} : fallback.settings;
    const sessions=value.sessions.filter(s=>s && typeof s.id==='string' && typeof s.name==='string' && Number.isFinite(s.seconds) && s.seconds>0 && s.seconds<=3600 && Number.isFinite(Date.parse(s.date)) && ['easy','neutral','strain'].includes(s.comfort)).map(s=>({...s,note:typeof s.note==='string'?s.note.slice(0,500):'',pitch:s.pitch && Number.isFinite(s.pitch.median) && Number.isFinite(s.pitch.low) && Number.isFinite(s.pitch.high)?s.pitch:null})).slice(-500);
    return {settings,sessions};
  } catch { return fallback; }
}
export function writeState(storage,state) { storage.setItem(KEY,JSON.stringify(state)); }
export function clearState(storage) { storage.removeItem(KEY); }
let opening;
function database() {
  if (!opening) opening = new Promise((resolve,reject)=>{
    const req=indexedDB.open('voice-studio-clips',1);
    req.onupgradeneeded=()=>req.result.createObjectStore('clips',{keyPath:'id'});
    req.onsuccess=()=>{req.result.onversionchange=()=>{req.result.close();opening=null;};resolve(req.result);};
    req.onerror=()=>reject(req.error);
    req.onblocked=()=>reject(new Error('Close other Voice Studio tabs to use recording storage.'));
  }).catch(e=>{opening=null;throw e;});
  return opening;
}
export async function clipStore(action,value) {
  const db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('clips',action==='list'?'readonly':'readwrite');
    const store=tx.objectStore('clips');
    const req=action==='list'?store.getAll():action==='save'?store.put(value):action==='delete'?store.delete(value):store.clear();
    tx.oncomplete=()=>resolve(req.result);
    tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Storage operation was interrupted.'));
  });
}
