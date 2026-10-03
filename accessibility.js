import {normalizeReading} from './reading-prefs.js?v=access-1';
const $=id=>document.getElementById(id);
export function initAccessibility(hooks){
 function render(){const p=normalizeReading(hooks.getPreferences()),root=document.documentElement;root.dataset.focus=String(p.focus);root.dataset.text=p.text;root.dataset.spacing=p.spacing;root.dataset.motion=p.motion;root.dataset.chart=p.chart;
  $('reading-focus').checked=p.focus;$('reading-size').value=p.text;$('reading-spacing').value=p.spacing;$('reading-motion').value=p.motion;$('reading-chart').value=p.chart;$('reading-announce').checked=p.announce;
  $('focus-toggle').setAttribute('aria-pressed',String(p.focus));$('focus-toggle').textContent=p.focus?'Focus view: on':'Focus view: off';$('chart-refresh').hidden=p.chart!=='manual';hooks.onChange(p);
 }
 function save(p){try{hooks.savePreferences(normalizeReading(p));$('reading-status').textContent='Reading and comfort settings saved for this profile.';render();}catch{$('reading-status').textContent='Could not save these settings. Browser storage may be blocked or full.';}}
 $('reading-form').addEventListener('change',()=>save({focus:$('reading-focus').checked,text:$('reading-size').value,spacing:$('reading-spacing').value,motion:$('reading-motion').value,chart:$('reading-chart').value,announce:$('reading-announce').checked}));
 $('focus-toggle').onclick=()=>save({...hooks.getPreferences(),focus:!hooks.getPreferences().focus});
 $('reading-reset').onclick=()=>save(normalizeReading());
 window.addEventListener('voice-profile-reading',()=>{render();$('reading-status').textContent='';});
 render();
}
