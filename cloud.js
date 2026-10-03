import { cloudConfig } from './cloud-config.js';
const AUTH_KEY='voice-studio-auth';
export function validateConfig(config){
 if(!config.url&&!config.publicKey)return false;
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.url))throw new Error('Account service URL is not valid.');
 if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publicKey))throw new Error('Use a Supabase publishable key, never a secret or service-role key.');
 return true;
}
export function mergeSessions(remote,local){
 const records=new Map();
 for(const item of [...remote,...local])if(item&&typeof item.id==='string')records.set(item.id,item);
 return [...records.values()].sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-500);
}
export class CloudClient {
 constructor(config=cloudConfig,options={}){
  this.config=config;this.enabled=validateConfig(config);this.fetch=options.fetch||globalThis.fetch;
  this.tabStorage=options.tabStorage||globalThis.sessionStorage;this.rememberStorage=options.rememberStorage||globalThis.localStorage;
  this.auth=null;this.remember=false;this.refreshing=null;this.onChange=()=>{};
  if(this.enabled){try{const remembered=this.rememberStorage?.getItem(AUTH_KEY),tab=this.tabStorage?.getItem(AUTH_KEY);this.auth=JSON.parse(remembered||tab||'null');this.remember=!!remembered;if(!this.auth?.user?.id||!this.auth.access_token||!this.auth.refresh_token)this.auth=null;}catch{this.auth=null;}}
 }
 get user(){return this.auth?.user||null;}
 saveAuth(auth,remember=this.remember){this.auth=auth;this.remember=remember;try{this.tabStorage?.removeItem(AUTH_KEY);this.rememberStorage?.removeItem(AUTH_KEY);if(auth)(remember?this.rememberStorage:this.tabStorage)?.setItem(AUTH_KEY,JSON.stringify(auth));}catch{/* The session still works in memory. */}this.onChange(this.user);}
 async raw(path,{method='GET',body,token,headers={}}={}){
  if(!this.enabled)throw new Error('Accounts are awaiting server setup. Guest practice is available.');
  let response;try{response=await this.fetch(this.config.url.replace(/\/$/,'')+path,{method,headers:{apikey:this.config.publicKey,...(token?{Authorization:`Bearer ${token}`} : {}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000),credentials:'omit',cache:'no-store'});}catch{throw new Error('Cannot reach your account. Check your connection and try again.');}
  const text=await response.text();let data;try{data=text?JSON.parse(text):null;}catch{throw new Error('Account service returned an unexpected response.');}
  if(!response.ok){const error=new Error(data?.msg||data?.error_description||data?.message||'Account request failed. Please try again.');error.status=response.status;throw error;}
  return data;
 }
 async sendCode(email){return this.raw('/auth/v1/otp',{method:'POST',body:{email,create_user:true}});}
 async verifyCode(email,token,remember){const auth=await this.raw('/auth/v1/verify',{method:'POST',body:{email,token,type:'email'}});if(!auth?.access_token||!auth.user?.id)throw new Error('Could not verify this sign-in.');this.saveAuth({...auth,expires_at:auth.expires_at||Math.floor(Date.now()/1000)+auth.expires_in},remember);return this.user;}
 async accessToken(){
  if(!this.auth)throw new Error('Sign in to sync your practice.');
  if(this.auth.expires_at>Date.now()/1000+60)return this.auth.access_token;
  if(!this.refreshing){const refresh=async()=>{
    if(this.remember){try{const latest=JSON.parse(this.rememberStorage.getItem(AUTH_KEY));if(latest?.user?.id===this.user.id&&latest.expires_at>Date.now()/1000+60){this.auth=latest;return latest.access_token;}}catch{}}
    const previous=this.auth;try{const auth=await this.raw('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:previous.refresh_token}});if(this.auth!==previous)throw new Error('Account changed while refreshing.');this.saveAuth({...auth,expires_at:auth.expires_at||Math.floor(Date.now()/1000)+auth.expires_in});return auth.access_token;}catch(e){if([400,401,403].includes(e.status))this.saveAuth(null);throw e;}
   };this.refreshing=(globalThis.navigator?.locks?globalThis.navigator.locks.request('voice-studio-auth-refresh',refresh):refresh()).finally(()=>{this.refreshing=null;});}
  return this.refreshing;
 }
 async request(path,options={}){const token=await this.accessToken();return this.raw(path,{...options,token});}
 async load(){const id=this.user.id;const [profiles,sessions]=await Promise.all([this.request(`/rest/v1/voice_profiles?user_id=eq.${id}&select=*`),this.request(`/rest/v1/voice_sessions?user_id=eq.${id}&select=payload&order=created_at.desc&limit=500`)]);if(this.user?.id!==id)throw new Error('Account changed while loading.');return {profile:profiles?.[0]||null,sessions:(sessions||[]).map(s=>s.payload)};}
 async saveProfile(profile){return this.request('/rest/v1/voice_profiles?on_conflict=user_id',{method:'POST',body:{...profile,user_id:this.user.id},headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});}
 async saveSessions(sessions){if(!sessions.length)return;const id=this.user.id;return this.request('/rest/v1/voice_sessions?on_conflict=id',{method:'POST',body:sessions.map(payload=>({id:payload.id,user_id:id,created_at:payload.date,payload})),headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});}
 async clearPractice(){const id=this.user.id;return this.request(`/rest/v1/voice_sessions?user_id=eq.${id}`,{method:'DELETE'});}
 async signOut(){try{if(this.auth)await this.request('/auth/v1/logout?scope=local',{method:'POST'});}finally{this.saveAuth(null);}}
}
