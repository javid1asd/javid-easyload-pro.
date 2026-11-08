const $=id=>document.getElementById(id);
const EMPTY={customers:[]};
let db=loadDB();
const day=()=>new Date().toISOString().slice(0,10);
const fmt=n=>new Intl.NumberFormat('ps-AF',{maximumFractionDigits:2}).format(Number(n)||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function loadDB(){try{const x=JSON.parse(localStorage.getItem('javidLedger')||'null');return x&&Array.isArray(x.customers)?x:{customers:[]}}catch{return {customers:[]}}}
function save(){localStorage.setItem('javidLedger',JSON.stringify(db))}
function balance(c){return (c.entries||[]).reduce((s,e)=>s+(e.type==='load'?Number(e.amount):-Number(e.amount)),0)}
function allEntries(){return db.customers.flatMap(c=>(c.entries||[]).map(e=>({...e,name:c.name,phone:c.phone,customerId:c.id}))).sort((a,b)=>(b.ts||0)-(a.ts||0))}
function money(n){return fmt(n)+' ؋'}
function render(){
 const es=allEntries(),today=es.filter(e=>e.day===day());
 $('due').textContent=money(db.customers.reduce((s,c)=>s+Math.max(0,balance(c)),0));
 $('count').textContent=fmt(db.customers.length);
 $('todayLoad').textContent=money(today.filter(e=>e.type==='load').reduce((s,e)=>s+Number(e.amount),0));
 $('todayPaid').textContent=money(today.filter(e=>e.type==='paid').reduce((s,e)=>s+Number(e.amount),0));
 const selected=$('customer').value;
 $('customer').innerHTML='<option value="">مشتری انتخاب کړه</option>'+db.customers.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}${c.phone?' · '+esc(c.phone):''}</option>`).join('');
 if(db.customers.some(c=>c.id===selected))$('customer').value=selected;
 const q=$('search').value.trim().toLocaleLowerCase();
 const matches=db.customers.filter(c=>(c.name+' '+(c.phone||'')).toLocaleLowerCase().includes(q));
 $('list').innerHTML=matches.map(c=>`<div class="entry"><span><b>${esc(c.name)}</b><br><small class="muted">${esc(c.phone||'شمېره نشته')} · ${c.entries.length} معاملې</small><br><b class="${balance(c)>0?'red':'green'}">${money(balance(c))}</b></span><span class="entry-actions"><button class="edit-btn" data-edit="${esc(c.id)}">سمون</button><button class="delete-btn" data-delete="${esc(c.id)}">حذف</button></span></div>`).join('')||'<p class="muted">مشتری ونه موندل شو</p>';
 const f=$('filter').value;
 $('history').innerHTML=es.filter(e=>!f||e.day===f).map(e=>`<div class="entry"><span><b>${esc(e.name)}</b><br><span class="muted">${esc(e.date||'')} · ${esc(e.note||'')}</span><br>${e.type==='load'?'لوډ / ورکړه':'پیسې ترلاسه شوې'}</span><b class="${e.type==='load'?'red':'green'}">${e.type==='load'?'+':'−'}${money(e.amount)}</b></div>`).join('')||'<p class="muted">معامله نشته</p>';
}
$('add').onclick=()=>{const name=$('name').value.trim();if(!name)return alert('د مشتری نوم ولیکه');db.customers.push({id:Date.now().toString(),name,phone:$('phone').value.trim(),entries:[]});$('name').value='';$('phone').value='';save();render()};
$('save').onclick=()=>{const c=db.customers.find(c=>c.id===$('customer').value),amount=Number($('amount').value);if(!c||!Number.isFinite(amount)||amount<=0)return alert('مشتری او سم مبلغ انتخاب کړه');const d=new Date();c.entries.push({amount,type:$('type').value,note:$('note').value.trim(),ts:d.getTime(),day:day(),date:d.toLocaleString()});$('amount').value='';$('note').value='';save();render()};
$('search').oninput=render;$('filter').onchange=render;$('clearFilter').onclick=()=>{$('filter').value='';render()};
$('list').onclick=e=>{
 const edit=e.target.closest('[data-edit]')?.dataset.edit,del=e.target.closest('[data-delete]')?.dataset.delete;
 if(edit){const c=db.customers.find(x=>x.id===edit);if(!c)return;const name=prompt('د مشتری نوی نوم:',c.name);if(name===null)return;if(!name.trim())return alert('نوم تش نه شي پاتې کېدای');const phone=prompt('د موبایل نوی نمبر:',c.phone||'');if(phone===null)return;c.name=name.trim();c.phone=phone.trim();save();render()}
 if(del){const c=db.customers.find(x=>x.id===del);if(!c)return;if(!confirm(`ایا ${c.name} او د هغه ټولې معاملې حذف کړې؟ دا کار بېرته نه راګرځي.`))return;db.customers=db.customers.filter(x=>x.id!==del);save();render()}
};
function periodEntries(period){const now=new Date(),y=now.getFullYear(),m=String(now.getMonth()+1).padStart(2,'0'),prefix=period==='day'?day():period==='month'?`${y}-${m}`:period==='year'?String(y):'';return allEntries().filter(e=>!prefix||String(e.day||'').startsWith(prefix))}
function showReport(){const es=periodEntries($('reportPeriod').value),sum=t=>es.filter(e=>e.type===t).reduce((s,e)=>s+Number(e.amount),0);$('report').innerHTML=[['معاملې',es.length],['ټول ورکړل شوی لوډ',money(sum('load'))],['ټولې ترلاسه شوې پیسې',money(sum('paid'))],['خالص توپیر',money(sum('load')-sum('paid'))]].map(([a,b])=>`<div class="report-item">${a}<strong>${b}</strong></div>`).join('')}
$('makeReport').onclick=showReport;showReport();
function download(name,data,type){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('backup').onclick=()=>download('javid-easyload-backup-'+day()+'.json',JSON.stringify({version:1,exportedAt:new Date().toISOString(),data:db},null,2),'application/json');
$('restoreBtn').onclick=()=>$('restoreFile').click();
$('restoreFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text()),incoming=parsed.data||parsed;if(!incoming||!Array.isArray(incoming.customers))throw Error();if(!confirm('اوسني حسابونه به د دې بیک اپ په معلوماتو بدل شي. دوام ورکوې؟'))return;db=incoming;save();render();alert('بیک اپ په بریالیتوب بېرته راوګرځول شو.')}catch{alert('دا بیک اپ سم JSON فایل نه دی.')}finally{e.target.value=''}};
$('export').onclick=()=>{const rows=[['Customer','Phone','Date','Type','Amount','Note']];db.customers.forEach(c=>(c.entries||[]).forEach(e=>rows.push([c.name,c.phone,e.date,e.type,e.amount,e.note])));const csv='\ufeff'+rows.map(r=>r.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(',')).join('\n');download('javid-ledger.csv',csv,'text/csv;charset=utf-8')};

// PIN lock: first use asks the owner to create a 4–8 digit PIN.
const PIN_KEY='javidEasyLoadPin';
const lock=$('lockScreen');
function openLock(){lock.classList.remove('hidden');$('pinInput').value='';$('pinError').textContent='';$('lockMessage').textContent=localStorage.getItem(PIN_KEY)?'خپل پټ کوډ ولیکه':'لومړی خپل ۴ تر ۸ شمېرو پټ کوډ جوړ کړه';$('pinSubmit').textContent=localStorage.getItem(PIN_KEY)?'داخل شه':'پټ کوډ ثبت کړه';}
$('pinSubmit').onclick=()=>{const pin=$('pinInput').value;if(!/^\d{4,8}$/.test(pin)){$('pinError').textContent='پټ کوډ باید ۴ تر ۸ شمېرې وي';return}const saved=localStorage.getItem(PIN_KEY);if(!saved){localStorage.setItem(PIN_KEY,pin);lock.classList.add('hidden');return}if(pin===saved){lock.classList.add('hidden');$('pinError').textContent=''}else{$('pinError').textContent='پټ کوډ ناسم دی'}};
$('pinInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('pinSubmit').click()});
$('lockNow').onclick=openLock;
if(localStorage.getItem(PIN_KEY))openLock();
render();
