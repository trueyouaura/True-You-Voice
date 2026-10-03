// All appearance controls remain native inputs for keyboard and assistive technology.
const palettes=[
 ['trans-fem','Transgender','pride'],['nonbinary','Nonbinary','pride'],
 ['bisexual','Bisexual','pride'],['lesbian','Lesbian','pride'],['pansexual','Pansexual','pride'],['asexual','Asexual','pride'],['rainbow','Rainbow Pride','pride'],
 ['ocean','Ocean','nature'],['forest','Forest','nature'],['sunset','Sunset','nature'],
 ['blue-gold','Blue & gold','accessible'],['teal-rose','Teal & rose','accessible'],['monochrome','Monochrome','accessible'],['high-contrast','High Contrast','accessible']
];
const grid=document.getElementById('palette-grid');
let category='all';
for(const [id,name,group] of palettes){
 const label=document.createElement('label');label.className='palette-choice';label.dataset.category=group;
 const preview=document.createElement('span');preview.className='palette-preview';preview.dataset.palette=id;preview.setAttribute('aria-hidden','true');
 preview.innerHTML='<span class="preview-wave">≋</span><span class="preview-lines"><i></i><i></i></span>';
 const caption=document.createElement('span');caption.className='palette-caption';
 const input=document.createElement('input');input.type='radio';input.name='theme-palette';input.value=id;
 const title=document.createElement('span');title.textContent=name;
 const selected=document.createElement('span');selected.className='palette-selected';selected.textContent='✓ Selected';selected.setAttribute('aria-hidden','true');
 caption.append(input,title,selected);label.append(preview,caption);grid.append(label);
 input.addEventListener('change',()=>apply(id,currentTone()));
}
function currentTone(){return document.documentElement.dataset.theme.endsWith('-dark')?'dark':'light';}
function apply(palette,tone){window.dispatchEvent(new CustomEvent('voice-theme-apply',{detail:`${palette}-${tone}`}));}
function sync(){
 const theme=document.documentElement.dataset.theme,tone=currentTone(),palette=theme.slice(0,-tone.length-1);
 document.querySelectorAll('[name="theme-tone"]').forEach(input=>input.checked=input.value===tone);
 for(const input of grid.querySelectorAll('input')){
  input.checked=input.value===palette;
  const card=input.closest('label');card.querySelector('.palette-preview').dataset.theme=`${input.value}-${tone}`;
  card.querySelector('.palette-selected').hidden=!input.checked;
  card.hidden=category!=='all'&&card.dataset.category!==category;
 }
 document.getElementById('appearance-choice').textContent=`Current appearance: ${palettes.find(p=>p[0]===palette)?.[1]||palette} · ${tone==='dark'?'Dark':'Light'}`;
}
document.querySelectorAll('[name="theme-tone"]').forEach(input=>input.addEventListener('change',()=>{const tone=currentTone();apply(document.documentElement.dataset.theme.slice(0,-tone.length-1),input.value);}));
document.querySelectorAll('[data-category]:is(button)').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;document.querySelectorAll('.palette-filters button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));sync();}));
window.addEventListener('voice-theme-change',sync);
sync();
