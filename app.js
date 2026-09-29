const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>'₹'+Math.round(n).toLocaleString('en-IN');
let db={shop:'Sharma Kirana',customers:{},entries:[]};
try{const d=JSON.parse(localStorage.getItem('khata')||'null');if(d&&d.entries)db=d}catch(e){}
const persist=()=>{try{localStorage.setItem('khata',JSON.stringify(db))}catch(e){}};

/* ---------- Devanagari -> rough Latin, so spoken Hindi text is understood ---------- */
const DV={'अ':'a','आ':'a','इ':'i','ई':'i','उ':'u','ऊ':'u','ए':'e','ऐ':'ai','ओ':'o','औ':'au','ऑ':'o'};
const CN={'क':'k','ख':'kh','ग':'g','घ':'gh','च':'ch','छ':'chh','ज':'j','झ':'jh','ट':'t','ठ':'th','ड':'d','ढ':'dh','ण':'n','त':'t','थ':'th','द':'d','ध':'dh','न':'n','प':'p','फ':'f','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'v','श':'sh','ष':'sh','स':'s','ह':'h','ड़':'d','ढ़':'dh','ज़':'z'};
const VW={'ा':'a','ि':'i','ी':'i','ु':'u','ू':'u','े':'e','ै':'ai','ो':'o','ौ':'au','ॉ':'o','ृ':'ri'};
function deva(s){
  s=s.replace(/[०-९]/g,d=>'०१२३४५६७८९'.indexOf(d)).replace(/रु\./g,'rs ').replace(/रु\b/g,'rs');
  const ch=[...s];let o='';
  for(let i=0;i<ch.length;i++){
    const c=ch[i],n=ch[i+1];
    if(CN[c]){o+=CN[c];
      if(VW[n]){o+=VW[n];i++}
      else if(n==='्'){i++}
      else if(n&&/[\u0900-\u097F]/.test(n)&&n!=='ं'&&n!=='ँ'&&n!=='ः'){o+='a'}
      else if(n==='ं'||n==='ँ'){o+='a'}
    }else if(DV[c])o+=DV[c];
    else if(c==='ं'||c==='ँ')o+='n';
    else if(c==='ः'||c==='्'||c==='़'){}
    else o+=c;
  }
  return o;
}

/* ---------- Hinglish sentence understanding ---------- */
const STOP=new Set('ne ko se ka ki ke aaj aj kal abhi today yesterday of goods good saman samaan maal rupees rupaye rupaiye rupay rupya rupye rs rupee inr credit udhaar udhar uthar paid pay payment diye diya die di de gaya gayi gaye liya liye le lo has have gave given wapas vapas jama chukaya chuka chukaye received mila mile cleared settled took take taken kharida bought mujhe mujhko humko hume the a on from by to me aur and baaki baki bhar cash upi online phonepe gpay paytm hai tha thi hain total ek do entry add likh likho likhna khata khate mein men for i worth dena dijiye kar kiya kiye lekar sabun atta dal chawal cheeni tel'.split(' '));
const HON=new Set(['ji','bhai','bhaiya','didi','aunty','auntie','uncle','sir','madam','mam','sahab','saab']);
const W={dhai:2.5,dedh:1.5,sawa:1.25,bees:20,tees:30,chalis:40,pachas:50};
const S={ek:1,do:2,teen:3,char:4,chaar:4,paanch:5,panch:5,chhe:6,che:6,saat:7,aath:8,nau:9,das:10};
const M={sau:100,hazaar:1000,hazar:1000,hajar:1000,thousand:1000,hundred:100,lakh:100000};
const NUMRE=/^(?:rs|₹)?(\d+(?:\.\d+)?)(k|rs)?$/;
const isN=t=>NUMRE.test(t)||W[t]!==undefined||S[t]!==undefined||M[t]!==undefined;
const RX_C=/\b(udhaar|udhar|uthar|credit|baaki|baki|took|taken|take|liya|liye|lekar|goods|saman|samaan|maal|kharida|bought|purchase)\b|\ble (gaya|gayi|gaye)\b/g;
const RX_P=/\b(paid|pay|payment|jama|wapas|vapas|returned?|chukaya|chukaye|chuka|received|mila|mile|cleared|settled|gave)\b|\bde (gaya|gayi|gaye)\b|\bbhar diy[ae]\b/g;

const norm=n=>n.toLowerCase().split(/\s+/).filter(w=>w&&!HON.has(w)).join(' ');
function lev(a,b){const m=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=m[0];m[0]=i;for(let j=1;j<=b.length;j++){const t=m[j];m[j]=Math.min(m[j]+1,m[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return m[b.length]}
function findCust(name){
  const k=norm(name);if(!k)return null;
  if(db.customers[k])return{key:k,exact:true};
  let best=null,bd=9;
  for(const c in db.customers){const d=lev(k,c),th=c.length>=7?2:1;if(d<=th&&d<bd){bd=d;best=c}}
  return best?{key:best,exact:false}:null;
}
const cap=s=>s.replace(/\b[a-z]/g,c=>c.toUpperCase());

function parseSeg(seg,prevName){
  const toks=seg.replace(/[^a-z0-9₹.\s]/g,' ').split(/\s+/).map(t=>t.replace(/^\.+|\.+$/g,'')).filter(Boolean);
  const nums=[];
  for(let i=0;i<toks.length;i++){
    const t=toks[i],m=NUMRE.exec(t);let v=null;
    if(m){v=parseFloat(m[1]);if(m[2]==='k')v*=1000;if(M[toks[i+1]]){v*=M[toks[i+1]];i++}}
    else if(W[t]!==undefined){v=W[t];if(M[toks[i+1]]){v*=M[toks[i+1]];i++}}
    else if(S[t]!==undefined&&M[toks[i+1]]){v=S[t]*M[toks[i+1]];i++}
    else if(M[t])v=M[t];
    if(v!=null)nums.push(v);
  }
  const uniq=[...new Set(nums)];
  let nm=[];
  const mk=toks.findIndex(t=>t==='ne'||t==='ko'||t==='se');
  if(mk>0){for(let j=mk-1;j>=0&&nm.length<3;j--){const t=toks[j];if(STOP.has(t)||isN(t))break;nm.unshift(t)}}
  if(!nm.length){let i=0;while(i<toks.length&&(STOP.has(toks[i])||isN(toks[i])))i++;
    for(;i<toks.length&&nm.length<3;i++){const t=toks[i];if(STOP.has(t)||isN(t))break;nm.push(t)}}
  const s=toks.join(' ');
  let c=(s.match(RX_C)||[]).length,p=2*(s.match(RX_P)||[]).length;
  if(/\b(diya|diye|die|di)\b/.test(s)){
    if(/\b(mujhe|mujhko|humko|hume)\b/.test(s)||/\bne\b/.test(s)&&!/\bko\b/.test(s))p+=2;
    else if(/\bko\b/.test(s))c+=2;
  }
  return{name:nm.length?cap(nm.join(' ')):(prevName||''),inherited:!nm.length&&!!prevName,amt:uniq[0]||0,many:uniq.length>1?uniq:null,type:p>c?'payment':c>p?'credit':null};
}
function understand(text){
  let t=deva(text).toLowerCase().replace(/(\d),(?=\d{3}\b)/g,'$1').replace(/\/-/g,' ');
  let segs=t.split(/\s*[;,]\s*|\s+(?:aur|and)\s+/).filter(x=>x.trim());
  if(segs.filter(x=>/\d|\bsau\b|hazaar|dhai|dedh|sawa/.test(x)).length<2)segs=[t];
  const out=[];let prev='';
  for(const sg of segs){const e=parseSeg(sg,prev);if(e.name)prev=e.name;out.push(e)}
  return out;
}

/* ---------- Ledger maths ---------- */
const bal=k=>db.entries.reduce((a,e)=>e.key===k?a+(e.type==='credit'?e.amt:-e.amt):a,0);

/* ---------- Confirmation step ---------- */
let pending=[];
function showConfirm(list){
  pending=list;const box=$('#confirm');
  box.hidden=false;
  box.innerHTML='<h3>Is this right? Check before saving.</h3>'+list.map((e,i)=>{
    const w=[];
    if(!e.name)w.push("Couldn't find a customer name. Type it in.");
    else{
      const f=findCust(e.name);
      if(f&&!f.exact){e.name=db.customers[f.key].name;w.push(`Matched to existing customer “${esc(e.name)}”. Change it if that's wrong.`)}
      else if(!f)w.push(Object.keys(db.customers).length?`New customer. “${esc(e.name)}” will be added to your khata.`:`First customer. “${esc(e.name)}” will be added.`);
    }
    if(e.inherited)w.push('Name carried over from the previous part of your sentence.');
    if(!e.amt)w.push("Couldn't find an amount. Type it in.");
    if(e.many)w.push(`More than one amount heard (${e.many.map(fmt).join(', ')}). Using ${fmt(e.amt)}. Please check.`);
    if(!e.type)w.push("Couldn't tell if this is credit or payment. Pick one.");
    if(e.amt>=5000)w.push('Large amount. Please double-check.');
    const f2=e.name&&findCust(e.name);
    if(e.type==='payment'&&f2&&e.amt>bal(f2.key)&&bal(f2.key)>=0)w.push(`This payment is more than ${esc(e.name)} owes (${fmt(bal(f2.key))}). The extra will show as advance.`);
    return `<div class="ent" data-i="${i}">
      <div class="row"><label>Customer<input class="n" list="cl" value="${esc(e.name)}"></label>
      <label>Amount (₹)<input class="a" type="number" min="1" step="any" value="${e.amt||''}"></label></div>
      <div class="seg"><label><input type="radio" name="t${i}" value="credit" ${e.type==='credit'?'checked':''}> Credit (took goods)</label>
      <label><input type="radio" name="t${i}" value="payment" ${e.type==='payment'?'checked':''}> Payment (paid money)</label></div>
      ${w.length?'<ul class="warn">'+w.map(x=>'<li>'+x+'</li>').join('')+'</ul>':''}</div>`;
  }).join('')+'<div class="err" id="err"></div><div class="bar"><button class="primary" id="save">Save to ledger</button><button id="cancel">Cancel</button></div>';
  $('#save').onclick=saveEntries;
  $('#cancel').onclick=()=>{box.hidden=true;box.innerHTML=''};
}
function saveEntries(){
  const rows=[...document.querySelectorAll('#confirm .ent')];let ok=true;const add=[];
  rows.forEach(r=>{
    const name=cap(r.querySelector('.n').value.trim()),amt=parseFloat(r.querySelector('.a').value),tp=r.querySelector('input[type=radio]:checked');
    const good=name&&amt>0&&tp;r.classList.toggle('bad',!good);
    if(!good)ok=false;else add.push({name,amt,type:tp.value});
  });
  if(!ok){$('#err').textContent='Each entry needs a customer name, an amount and a type (credit or payment).';return}
  const ids=[];
  add.forEach(a=>{
    const k=norm(a.name);
    if(!db.customers[k])db.customers[k]={name:a.name,phone:''};
    const id=Date.now()+Math.random();ids.push(id);
    db.entries.push({id,key:k,type:a.type,amt:a.amt,ts:Date.now()});
  });
  persist();$('#confirm').hidden=true;$('#confirm').innerHTML='';$('#say').value='';render();
  toast(`Saved ${add.length} ${add.length>1?'entries':'entry'}`,()=>{db.entries=db.entries.filter(e=>!ids.includes(e.id));persist();render()});
}

/* ---------- Views ---------- */
function render(){
  $('#shop').value=db.shop;
  $('#cl').innerHTML=Object.values(db.customers).map(c=>`<option value="${esc(c.name)}">`).join('');
  const rows=Object.keys(db.customers).map(k=>({k,n:db.customers[k].name,b:bal(k)})).filter(r=>r.b!==0).sort((a,b)=>b.b-a.b);
  const owed=rows.filter(r=>r.b>0),total=owed.reduce((a,r)=>a+r.b,0),mx=owed[0]?owed[0].b:1;
  $('#tot').innerHTML=owed.length?`Total to collect <b>${fmt(total)}</b> from ${owed.length} ${owed.length>1?'customers':'customer'}`:'';
  $('#debtors').innerHTML=rows.length?rows.map(r=>r.b>0
    ?`<button class="owe" data-k="${esc(r.k)}"><span class="nm">${esc(r.n)}</span><span class="tr"><i style="width:${Math.max(4,r.b/mx*100)}%"></i></span><span class="am cr">${fmt(r.b)}</span></button>`
    :`<button class="owe" data-k="${esc(r.k)}"><span class="nm">${esc(r.n)}</span><span class="tr"></span><span class="am pd">advance ${fmt(-r.b)}</span></button>`).join(''):'<div class="empty">Nobody owes anything yet. Add your first entry on the left.</div>';
  document.querySelectorAll('.owe').forEach(b=>b.onclick=()=>openCust(b.dataset.k));
  weekly();
}
function weekly(){
  const days=[];
  for(let i=6;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);days.push({d,c:0,p:0})}
  db.entries.forEach(e=>{const t=new Date(e.ts);t.setHours(0,0,0,0);const x=days.find(y=>+y.d===+t);if(x)x[e.type==='credit'?'c':'p']+=e.amt});
  const C=days.reduce((a,d)=>a+d.c,0),P=days.reduce((a,d)=>a+d.p,0);
  $('#stats').innerHTML=`<div>Credit given<b class="cr">${fmt(C)}</b></div><div>Payments received<b class="pd">${fmt(P)}</b></div><div>Net change in dues<b>${C-P>=0?'+':'-'}${fmt(Math.abs(C-P))}</b></div>`;
  const mx=Math.max(1,...days.map(d=>Math.max(d.c,d.p))),H=150,bw=22;
  let g='';
  days.forEach((d,i)=>{
    const x=20+i*82,hc=d.c/mx*H,hp=d.p/mx*H;
    g+=`<rect x="${x}" y="${170-hc}" width="${bw}" height="${hc}" rx="3" fill="var(--red)"/><rect x="${x+bw+4}" y="${170-hp}" width="${bw}" height="${hp}" rx="3" fill="var(--green)"/>`;
    if(d.c)g+=`<text x="${x+bw/2}" y="${165-hc}" font-size="11" text-anchor="middle" fill="var(--ink)">${fmt(d.c)}</text>`;
    if(d.p)g+=`<text x="${x+bw*1.5+4}" y="${165-hp}" font-size="11" text-anchor="middle" fill="var(--ink)">${fmt(d.p)}</text>`;
    g+=`<text x="${x+bw+2}" y="190" font-size="12" text-anchor="middle" fill="var(--muted)">${d.d.toLocaleDateString('en-IN',{weekday:'short'})}</text>`;
  });
  $('#chart').innerHTML=`<svg viewBox="0 0 600 200" role="img" aria-label="Daily credit and payments for the last 7 days"><line x1="10" x2="590" y1="170" y2="170" stroke="var(--edge)"/>${g}</svg>`;
}

/* ---------- Customer dialog + reminders ---------- */
const MSG={
  hi:(n,a,s)=>`नमस्ते ${n} जी, ${s} में आपके खाते में ${a} बकाया है। कृपया सुविधानुसार भुगतान कर दें। धन्यवाद।`,
  en:(n,a,s)=>`Hello ${n}, a gentle reminder that ${a} is pending on your account at ${s}. Please pay when convenient. Thank you.`,
  hg:(n,a,s)=>`Namaste ${n} ji, ${s} mein aapke khate mein ${a} baaki hai. Jab suvidha ho, kripya de dijiye. Dhanyawad.`
};
function openCust(k){
  const c=db.customers[k],b=bal(k),d=$('#dlg');let lang='hg';
  const hist=db.entries.filter(e=>e.key===k).sort((a,b)=>b.ts-a.ts).slice(0,10);
  d.innerHTML=`<h2>${esc(c.name)} — ${b>0?'owes '+fmt(b):b<0?'advance '+fmt(-b):'settled'}</h2>
  <ul class="hist">${hist.map(e=>`<li><span>${new Date(e.ts).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} · ${e.type==='credit'?'Credit':'Payment'}</span><b class="${e.type==='credit'?'cr':'pd'}">${e.type==='credit'?'+':'-'}${fmt(e.amt)}</b></li>`).join('')}</ul>
  ${b>0?`<div class="tabs"><button data-l="hg" class="sel">Hinglish</button><button data-l="hi">हिन्दी</button><button data-l="en">English</button></div>
  <textarea id="msg" aria-label="Reminder message"></textarea>
  <label style="font-size:.85rem;color:var(--muted)">Phone (optional) <input id="ph" value="${esc(c.phone||'')}" inputmode="tel" placeholder="98xxxxxxxx" style="border:1px solid var(--edge);border-radius:6px;padding:4px 8px"></label>
  <div class="bar"><a class="btn wa" id="wa" target="_blank" rel="noopener">Send on WhatsApp</a><a class="btn" id="sms">Send SMS</a><button id="cp">Copy</button></div>`:'<p class="empty">No amount is due, so no reminder is needed.</p>'}
  <div class="bar" style="justify-content:flex-end"><button id="cl2">Close</button></div>`;
  const upd=()=>{
    if(b<=0)return;
    const m=$('#msg',d).value,ph=($('#ph',d).value||'').replace(/\D/g,''),full=ph.length===10?'91'+ph:ph;
    $('#wa',d).href=`https://wa.me/${full}?text=${encodeURIComponent(m)}`;
    $('#sms',d).href=`sms:${ph}?body=${encodeURIComponent(m)}`;
  };
  const setMsg=()=>{if(b>0){$('#msg',d).value=MSG[lang](c.name,fmt(b),db.shop||'our shop');upd()}};
  if(b>0){
    d.querySelectorAll('.tabs button').forEach(t=>t.onclick=()=>{lang=t.dataset.l;d.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('sel',x===t));setMsg()});
    $('#msg',d).oninput=upd;
    $('#ph',d).oninput=()=>{c.phone=$('#ph',d).value;persist();upd()};
    $('#cp',d).onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText($('#msg',d).value);toast('Message copied')};
    setMsg();
  }
  $('#cl2',d).onclick=()=>d.close();
  d.showModal();
}

/* ---------- Toast, input, voice ---------- */
let tt;
function toast(msg,undo){
  const t=$('#toast');t.innerHTML=esc(msg)+(undo?' <button id="undo">Undo</button>':'');t.style.display='flex';
  if(undo)$('#undo').onclick=()=>{undo();t.style.display='none'};
  clearTimeout(tt);tt=setTimeout(()=>t.style.display='none',5000);
}
function run(){
  const v=$('#say').value.trim();
  if(!v){$('#say').focus();return}
  showConfirm(understand(v));
}
$('#go').onclick=run;
$('#say').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();run()}});
$('#shop').oninput=e=>{db.shop=e.target.value;persist()};
['Ramesh took 200 rupees of goods today','Suresh ne 500 rupaye diye','Sunita ko 350 ka saman diya','Ramesh ji ne 1500 jama kiye','Mohan udhaar 2 sau, Geeta ne 100 diye','रमेश ने 200 रुपये का सामान लिया'].forEach(x=>{
  const b=document.createElement('button');b.textContent=x;b.onclick=()=>{$('#say').value=x;run()};$('#chips').appendChild(b);
});
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!SR){$('#mic').style.display='none';$('#lang').style.display='none'}
else{
  let rec=null;
  $('#mic').onclick=()=>{
    if(rec){rec.stop();return}
    rec=new SR();rec.lang=$('#lang').value;rec.interimResults=true;rec.continuous=false;
    rec.onresult=e=>{$('#say').value=[...e.results].map(r=>r[0].transcript).join(' ')};
    rec.onerror=e=>{toast(e.error==='not-allowed'?'Microphone blocked. Allow it in the browser, or type instead.':'Could not hear that. Try again or type.')};
    rec.onend=()=>{rec=null;$('#mic').classList.remove('on');$('#mic').textContent='🎤 Speak';if($('#say').value.trim())run()};
    $('#mic').classList.add('on');$('#mic').textContent='Listening… tap to stop';
    try{rec.start()}catch(e){rec=null}
  };
}

/* ---------- Demo / reset ---------- */
$('#demo').onclick=()=>{
  const D=86400000,now=Date.now(),rows=[['Ramesh Gupta','credit',850,5],['Ramesh Gupta','credit',200,2],['Ramesh Gupta','payment',300,1],['Sunita Devi','credit',1200,6],['Sunita Devi','payment',400,3],['Mohan Lal','credit',2300,4],['Mohan Lal','credit',450,0],['Geeta','credit',180,1],['Geeta','payment',180,0],['Suresh Yadav','credit',640,2]];
  db={shop:db.shop||'Sharma Kirana',customers:{},entries:[]};
  rows.forEach(([n,t,a,ago],i)=>{const k=norm(n);db.customers[k]=db.customers[k]||{name:n,phone:''};db.entries.push({id:i+1,key:k,type:t,amt:a,ts:now-ago*D-i*1000})});
  persist();render();toast('Demo data loaded');
};
$('#clear').onclick=()=>{if(confirm('Delete all customers and entries from this browser?')){db={shop:db.shop,customers:{},entries:[]};persist();render()}};
render();
