/* Development-only palette checks. Linear-sRGB Machado matrices from Colour's
   published dataset, https://github.com/colour-science/colour/blob/develop/colour/blindness/datasets/machado2010.py
   Coefficients are numeric reference data. Tritan transforms are approximations;
   grayscale does not model achromatopsia's acuity or light-sensitivity effects. */
const simulations={
 normal:[[1,0,0],[0,1,0],[0,0,1]],
 'protan-0.5':[[.458064,.679578,-.137642],[.092785,.846313,.060902],[-.007494,-.016807,1.024301]],
 'protan-1.0':[[.152286,1.052583,-.204868],[.114503,.786281,.099216],[-.003882,-.048116,1.051998]],
 'deutan-0.5':[[.547494,.607765,-.155259],[.181692,.781742,.036566],[-.010410,.027275,.983136]],
 'deutan-1.0':[[.367322,.860646,-.227968],[.280085,.672501,.047413],[-.011820,.042940,.968881]],
 'tritan-0.5-approx':[[1.017277,.027029,-.044306],[-.006113,.958479,.047634],[.006379,.248708,.744913]],
 'tritan-1.0-approx':[[1.255528,-.076749,-.178779],[-.078411,.930809,.147602],[.004733,.691367,.303900]],
 grayscale:[[.2126,.7152,.0722],[.2126,.7152,.0722],[.2126,.7152,.0722]]
};
const pairs=[['ink','paper',4.5],['muted','paper',4.5],['ink','bg',4.5],['muted','soft',4.5],['ink','next',4.5],['button-ink','green',4.5],['button-ink','hover',4.5],['green','paper',4.5],['chart-ink','chart-bg',4.5],['danger-ink','danger-bg',4.5],['error-ink','error-bg',4.5],['input-line','input',3],['focus','paper',3],['chart-stroke','chart-bg',3],['chart-stroke','band',3],['chart-ink','band',3]];
window.addEventListener('DOMContentLoaded',()=>{
 const out=document.createElement('section');out.id='appearance-results';out.className='card';document.querySelector('main').prepend(out);const start=document.createElement('button');start.textContent='Run appearance checks';out.append(start);
 start.onclick=async()=>{start.disabled=true;const saved=document.documentElement.dataset.theme,keys=['voice-studio-theme','voice-studio-guest-theme','voice-studio-profiles','voice-studio-v1'],backups=new Map(keys.map(k=>[k,localStorage.getItem(k)]));const result={themes:[],failures:[],checks:0};
 const rgb=h=>[1,3,5].map(i=>Number('0x'+h.slice(i,i+2))/255),linear=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
 const transformed=(c,m)=>m.map(row=>Math.max(0,Math.min(1,row.reduce((s,v,i)=>s+v*linear(c[i]),0))));
 const lum=c=>c.reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
 try{for(const theme of window.TrueYouThemes){window.dispatchEvent(new CustomEvent('voice-theme-apply',{detail:theme}));await new Promise(r=>requestAnimationFrame(r));const styles=getComputedStyle(document.documentElement),color=n=>styles.getPropertyValue('--'+n).trim();const base=rgb(color('chart-bg')),tint=color('chart-band'),alpha=Number('0x'+tint.slice(7,9))/255,band=rgb(tint).map((c,i)=>c*alpha+base[i]*(1-alpha));let minimum=21;
 for(const [name,matrix]of Object.entries(simulations))for(const [a,b,min]of pairs){const aa=lum(transformed(rgb(color(a)),matrix)),bb=lum(transformed(b==='band'?band:rgb(color(b)),matrix)),ratio=(Math.max(aa,bb)+.05)/(Math.min(aa,bb)+.05);result.checks++;minimum=Math.min(minimum,ratio);if(ratio<min)result.failures.push({theme,simulation:name,pair:a+'/'+b,ratio,minimum:min});}
 result.themes.push({theme,minimumRatio:minimum});}
 out.dataset.report=JSON.stringify(result);out.append(Object.assign(document.createElement('h2'),{textContent:result.failures.length?`${result.failures.length} contrast checks need attention`:`${result.checks} appearance checks passed across ${result.themes.length} themes`}));const p=document.createElement('p');p.textContent='Simulations are approximations, not clinical certification or a complete accessibility audit.';out.append(p);if(result.failures.length)out.append(Object.assign(document.createElement('pre'),{textContent:JSON.stringify(result.failures,null,2)}));
 }catch(e){out.append(Object.assign(document.createElement('h2'),{textContent:'Appearance check failed: '+e.message}));}
 finally{window.dispatchEvent(new CustomEvent('voice-theme-apply',{detail:saved}));for(const[k,v]of backups){if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}}
 };
});
