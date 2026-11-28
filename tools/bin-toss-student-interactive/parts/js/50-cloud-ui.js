/* ---------------- sign-in and saving ----------------
   Firebase only loads when it is needed (dynamic import), so the game still runs when gstatic.com is blocked or offline. */
const AUTH={mode:'guest',student:null,teacher:null,saving:false,saveBroken:false};
let cloudP=null;
function cloud(){if(!cloudP)cloudP=import('./cloud.js?v=CLOUDV').catch(e=>{console.warn('cloud unavailable',e);cloudP=null;return null});return cloudP}
const CODE_KEY='mmt-btg-code';
function accountBoxH(){
  if(AUTH.mode==='student')return `<div class="acct on"><span class="dot">●</span><div><b>${esc(AUTH.student.name)}</b><small>${t('Your throws are saved for your class.')}</small></div><button class="lnk" data-act="signOut">${t('Sign out')}</button></div>`;
  return `<div class="acct"><div class="acctT"><b>${t('Have a student code?')}</b><small>${t('Sign in to add your throws to the class data. Or just play as a guest.')}</small></div>
    <div class="acctF"><input id="btCode" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${esc(t('Student code'))}" aria-label="${esc(t('Student code'))}"><button class="pb sm" id="btCodeGo" data-act="signIn">${t('Sign in')}</button></div><div class="acctMsg" id="btCodeMsg"></div></div>`;
}
function paintAccount(){
  const c=$('acctChip');
  c.innerHTML=AUTH.mode==='student'?`<span class="chipOn">● ${esc(AUTH.student.firstName||AUTH.student.name)}</span>`:`<span class="chipOff">${t('Guest')}</span><span class="chipGo">${t('Sign in')}</span>`;
  $('teachBtn').classList.toggle('on',!!AUTH.teacher);
}
async function signIn(){
  const inp=$('btCode'),msg=$('btCodeMsg');if(!inp)return;const code=String(inp.value||'').trim().toUpperCase().replace(/[^A-Z0-9-]/g,'');
  if(!code){msg.textContent=t('Type your student code.');return}
  msg.className='acctMsg';msg.textContent=t('Checking…');$('btCodeGo').disabled=true;
  const cl=await cloud();
  if(!cl){msg.className='acctMsg bad';msg.textContent=t('Sign-in isn’t available right now. You can still play as a guest.');$('btCodeGo').disabled=false;return}
  const r=await cl.studentSignIn(code);$('btCodeGo')&&($('btCodeGo').disabled=false);
  if(!r.ok){msg.className='acctMsg bad';msg.textContent=r.error||t('Could not sign in.');return}
  afterStudentSignIn(code,r.profile);toast('✓ '+t('Signed in as {n}',{n:esc(r.profile.name)}));
  if(curPanel)curPanel();
}
function afterStudentSignIn(code,profile){
  AUTH.mode='student';AUTH.student=profile;try{sessionStorage.setItem(CODE_KEY,code)}catch(e){}
  loadStore(BASE_KEY+'.s.'+code);world.kid.use(S.char);poolIds=null;paintAccount();paintGoalBtn();paintCharBtn();queueUpload(true);
}
async function signOut(){
  const cl=await cloud();if(cl)try{await cl.studentSignOut()}catch(e){}
  AUTH.mode='guest';AUTH.student=null;try{sessionStorage.removeItem(CODE_KEY)}catch(e){}
  loadStore(BASE_KEY);world.kid.use(S.char);poolIds=null;paintAccount();paintGoalBtn();paintCharBtn();introPanel();
}
async function restoreStudent(){
  let code=null;try{code=sessionStorage.getItem(CODE_KEY)}catch(e){}
  if(!code)return;const cl=await cloud();if(!cl)return;const r=await cl.studentSignIn(code);
  if(r.ok){afterStudentSignIn(code,r.profile);if(curPanel)curPanel()}
}
/* Throws are sent in batches; anything not yet sent waits on the device (marked up:0) and goes next time. */
function pending(){const out=[];for(const s of P.SPOTS)S.data[s.id].forEach(r=>{if(r.up===0)out.push([s.id,r])});return out}
const pendingCount=()=>AUTH.mode==='student'?pending().length:0;
async function queueUpload(force){
  if(AUTH.mode!=='student'||AUTH.saving||AUTH.saveBroken)return;const pd=pending();if(!pd.length||(!force&&pd.length<BATCH))return;
  AUTH.saving=true;const cl=await cloud();if(!cl){AUTH.saving=false;return}
  const take=pd.slice(0,20),preds={};for(const s of P.SPOTS)if(S.pred[s.id]!=null&&!S.predSent[s.id]&&take.some(x=>x[0]===s.id))preds[s.id]=S.pred[s.id];
  const r=await cl.recordThrows({throws:take.map(([s,x])=>({s,a:x.a,p:x.p,i:x.in?1:0,h:x.h?1:0})),preds});
  AUTH.saving=false;
  if(r.ok){take.forEach(x=>{x[1].up=1});for(const k in preds)S.predSent[k]=true;save();renderStatus();if(pending().length>=(force?1:BATCH))queueUpload(force)}
  else if(r.missing){AUTH.saveBroken=true;toast(t('Saving to your class isn’t switched on yet. Your throws are kept on this device.'))}
  else console.warn('save throws',r.error);
}
async function saveResult(right,total){
  if(AUTH.mode!=='student')return;const cl=await cloud();if(!cl)return;queueUpload(true);
  const best=S.days.length?Math.max(...S.days.map(d=>d.profit)):0;
  const types=QZ.items.map((it,k)=>({typeId:'bt-'+it.key,label:it.label,correct:QZ.res[k].ok?1:0,total:1}));
  types.push('throws:'+allThrows(),'days:'+S.days.length,'bestProfit:'+best,'spot:'+QZ.spot);if(L()!=='en')types.push('lang:'+L());if(PREF.hard)types.push('hard:on');
  const r=await cl.saveAchievement({tool:'bin-toss-student-interactive',topic:'statistics-probability',score:right,total,masteryTopic:'bin-toss',types,
    certificateText:`Bin Toss: ${right}/${total} · ${allThrows()} throws · best day ${money(best)}`});
  const m=$('saveMsg');if(m)m.textContent=r&&r.saved?'✓ '+t('Saved to your dashboard. Your teacher can see this result.'):t('Could not save this result. Show your teacher this screen.');
}

/* ---------------- teacher ---------------- */
function teacherPanel(){
  if(AUTH.teacher){teacherDash();return}
  const back=phase;helpPanel.back=back;
  setPanel(()=>panel(`<div class="eyebrow">Teacher</div><h2>See your class's throws</h2>
    <p>Sign in with your teacher code to see every throw your students have made, your class's predictions and results, and the totals for all MMT students.</p>
    <div class="acct"><div class="acctF"><input id="tCode" autocomplete="off" autocapitalize="characters" placeholder="Teacher code" aria-label="Teacher code"><input id="tPin" type="password" placeholder="PIN" aria-label="PIN" hidden><button class="pb sm" id="tGo" data-act="tSignIn">Sign in</button></div><div class="acctMsg" id="tMsg"></div></div>
    <div class="pBtns"><button class="pb" data-act="board">Class board (no sign-in)</button><button class="pb" data-act="closeHelp">Close</button></div>`,{wide:true}));
}
async function tSignIn(){
  const code=String($('tCode').value||'').trim().toUpperCase(),pin=$('tPin').value,msg=$('tMsg');if(!code){msg.textContent='Type your teacher code.';return}
  msg.className='acctMsg';msg.textContent='Checking…';const cl=await cloud();if(!cl){msg.className='acctMsg bad';msg.textContent='Sign-in isn’t available right now.';return}
  const r=await cl.teacherSignIn(code,pin);
  if(!r.ok){msg.className='acctMsg bad';msg.textContent=r.error;if(/pin/i.test(r.error||''))$('tPin').hidden=false;return}
  AUTH.teacher=r.profile;paintAccount();teacherDash();
}
async function restoreTeacher(){const cl=await cloud();if(!cl)return;const p=await cl.teacherRestore();if(p){AUTH.teacher=p;paintAccount()}}
const TD={cls:'all',spot:'back',sample:'class',data:null};
const SPOT_COL={front:'#2563eb',middle:'#c2410c',back:'#0f766e'};
async function teacherDash(reload){
  phase='teacher';hideGame();helpPanel.back=helpPanel.back||'intro';
  if(!TD.data||reload){setPanel(()=>panel(`<div class="eyebrow">Teacher view</div><h2>Loading your class's throws…</h2>`,{xwide:true}));
    const cl=await cloud();try{TD.data=await cl.loadTeacher()}catch(e){TD.data={error:String(e&&e.message||e)}}}
  setPanel(renderDash);
}
function sumSpots(docs){const o={};for(const s of P.SPOTS)o[s.id]={n:0,in:0,predSum:0,predN:0,ang:{},cpN:[],cpIn:[]};
  for(const d of docs)for(const s of P.SPOTS){const x=d.spots&&d.spots[s.id];if(!x)continue;const y=o[s.id];y.n+=x.n||0;y.in+=x.in||0;y.predSum+=x.predSum||0;y.predN+=x.predN||0;
    for(const a in x.ang||{}){y.ang[a]=y.ang[a]||{n:0,in:0};y.ang[a].n+=x.ang[a].n||0;y.ang[a].in+=x.ang[a].in||0}
    if(docs.length===1){y.cpN=x.cpN||[];y.cpIn=x.cpIn||[]}}
  return o}
function renderDash(){
  const D=TD.data||{};const nm=AUTH.teacher&&(AUTH.teacher.teacherName||AUTH.teacher.name)||'';
  if(D.error){panel(`<div class="eyebrow">Teacher view</div><h2>Couldn't load the class data</h2><p>${esc(D.error)}</p><p class="small">If this is the first time, the Bin Toss rules may not be published yet in the Firebase Console.</p><div class="pBtns"><button class="pb" data-act="tReload">Try again</button><button class="pb" data-act="closeHelp">Close</button></div>`,{xwide:true});return}
  const classes=D.classes||[],cl=TD.cls==='all'?classes:classes.filter(c=>c.className===TD.cls),cs=sumSpots(cl),gs=D.glob?D.glob.spots:{},pr=D.pred||{};
  const studs=(D.students||[]).filter(s=>TD.cls==='all'||s.className===TD.cls).sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  const kpi=P.SPOTS.map(s=>{const c=cs[s.id],g=gs[s.id]||{n:0,in:0};return `<tr><td><b style="color:${SPOT_COL[s.id]}">●</b> ${s.name} <small>(${s.d} m)</small></td>
    <td class="r"><input class="tPred" type="number" min="0" max="100" step="1" data-spot="${s.id}" value="${pr[s.id]!=null?pr[s.id]:''}" placeholder="–" aria-label="Your prediction for ${s.name}">%</td>
    <td class="r">${c.predN?Math.round(c.predSum/c.predN)+'% <small>('+c.predN+')</small>':'–'}</td>
    <td class="r"><b>${c.n?pct(c.in,c.n):'–'}</b> <small>${c.n?c.in+'/'+c.n:''}</small></td>
    <td class="r"><b>${g.n?pct(g.in,g.n):'–'}</b> <small>${g.n?g.n.toLocaleString('en-AU')+' throws':''}</small></td></tr>`}).join('');
  const totC=P.SPOTS.reduce((a,s)=>a+cs[s.id].n,0),totG=P.SPOTS.reduce((a,s)=>a+((gs[s.id]||{}).n||0),0);
  const stRows=studs.map(s=>`<tr><td>${esc(s.name||s.studentCode)}<small> ${esc(s.className||'')}</small></td>${P.SPOTS.map(p=>{const x=s.spots&&s.spots[p.id];return `<td class="r">${x&&x.n?`${x.in}/${x.n} <small>${pct(x.in,x.n)}</small>`:'–'}</td>`}).join('')}<td class="r">${s.n||0}</td><td class="r"><small>${P.SPOTS.map(p=>{const x=s.spots&&s.spots[p.id];return x&&x.pred!=null?x.pred+'%':'–'}).join(' · ')}</small></td></tr>`).join('');
  const recentSrc=TD.sample==='all'?(D.glob?D.glob.recent:[]):cl.flatMap(c=>c.recent||[]);
  const recent=recentSrc.map(parseRec).filter(Boolean).sort((a,b)=>b.ts-a.ts).slice(0,40);
  panel(`<div class="dashHead"><div><div class="eyebrow">Teacher view · ${esc(nm)}</div><h2>Bin Toss: your class's throws</h2></div>
      <div class="dashCtl"><label>Class <select id="tdCls">${['all',...classes.map(c=>c.className)].map(c=>`<option value="${esc(c)}" ${TD.cls===c?'selected':''}>${c==='all'?'All my classes':esc(c)}</option>`).join('')}</select></label>
      <button class="pb sm" data-act="tReload">↻ Refresh</button><button class="pb sm" data-act="csv">Download all throws (CSV)</button><button class="pb sm" data-act="board">Class board</button><button class="pb sm" data-act="tSignOut">Sign out</button></div></div>
    <div class="kpis"><div><small>Your class</small><b>${totC.toLocaleString('en-AU')}</b><span>throws</span></div><div><small>Students</small><b>${studs.length}</b><span>with data</span></div><div><small>All MMT students</small><b>${totG.toLocaleString('en-AU')}</b><span>throws</span></div></div>
    <h3 class="h3">Predictions and results</h3>
    <table class="tb dash"><thead><tr><th>Spot</th><th class="r">Your prediction</th><th class="r">Class prediction (average)</th><th class="r">Class result</th><th class="r">All MMT students</th></tr></thead><tbody>${kpi}</tbody></table>
    <div class="small">Type your predictions before the class plays, then press <button class="lnk" data-act="tSavePred">Save my predictions</button>. Students see them only at the very end, beside their own. <span id="tPredMsg"></span></div>
    <div class="dashGrid"><div><h3 class="h3">How the class estimate settles</h3>${settleChart(cs,TD.cls==='all'&&classes.length>1)}</div>
      <div><h3 class="h3">Chance of in by angle <span class="segMini">${P.SPOTS.map(s=>`<button class="${TD.spot===s.id?'on':''}" data-act="tdSpot" data-v="${s.id}">${s.short}</button>`).join('')}</span></h3>${angleChart(cs[TD.spot],gs[TD.spot])}</div></div>
    <h3 class="h3">Students</h3>
    <div class="tScroll"><table class="tb dash"><thead><tr><th>Student</th>${P.SPOTS.map(s=>`<th class="r">${s.short} (${s.d} m)</th>`).join('')}<th class="r">Throws</th><th class="r">Predictions F · M · B</th></tr></thead><tbody>${stRows||'<tr><td colspan="6">No throws saved yet. Students sign in with their code on the game\'s first screen.</td></tr>'}</tbody></table></div>
    <h3 class="h3">A sample of recent throws <span class="segMini"><button class="${TD.sample==='class'?'on':''}" data-act="tdSample" data-v="class">Your class</button><button class="${TD.sample==='all'?'on':''}" data-act="tdSample" data-v="all">All MMT</button></span></h3>
    <div class="tScroll short"><table class="tb dash"><thead><tr><th>When</th><th>Spot</th><th class="r">Angle</th><th class="r">Power</th><th>Result</th></tr></thead><tbody>${recent.map(r=>`<tr><td><small>${ago(r.ts)}</small></td><td>${P.spot(r.s).name}</td><td class="r">${r.a}°</td><td class="r">${r.p}%</td><td>${r.i?'<b class="pos">In ✓</b>':'<span class="neg">Out ✗</span>'}${r.h?' <small>hard</small>':''}</td></tr>`).join('')||'<tr><td colspan="5">None yet.</td></tr>'}</tbody></table></div>
    <div class="pBtns"><button class="pb" data-act="closeHelp">Back to the game</button></div>`,{xwide:true});
}
const SPC={f:'front',m:'middle',b:'back'};
function parseRec(s){const p=String(s).split('|');if(p.length<5)return null;return {s:SPC[p[0]]||'back',a:+p[1],p:+p[2],i:p[3]==='1',ts:+p[4],h:p[5]==='1'}}
function ago(ts){const s=Math.max(0,Date.now()/1000-ts);return s<90?'just now':s<5400?Math.round(s/60)+' min ago':s<172800?Math.round(s/3600)+' h ago':Math.round(s/86400)+' days ago'}
function settleChart(cs,mixed){
  if(mixed)return `<p class="small">Choose one class to see how its estimate settled throw by throw.</p>`;
  const W=520,H=220,Lm=44,Rm=70,T=12,B=30,pw=W-Lm-Rm,ph=H-T-B;let maxN=0;for(const s of P.SPOTS)maxN=Math.max(maxN,...(cs[s.id].cpN||[0]));
  if(!maxN)return `<p class="small">The graph appears once a spot has 10 throws.</p>`;
  const X=n=>Lm+n/maxN*pw,Y=v=>T+ph-v/100*ph;let g='';
  for(const v of [0,25,50,75,100])g+=`<path d="M${Lm} ${Y(v)}H${W-Rm}" stroke="#e2e8f0"/><text x="${Lm-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="#64748b">${v}%</text>`;
  const st=niceStep(maxN);for(let k=st;k<=maxN;k+=st)g+=`<text x="${X(k)}" y="${H-12}" text-anchor="middle" font-size="11" fill="#64748b">${k}</text>`;
  g+=`<text x="${W-Rm}" y="${H-1}" text-anchor="end" font-size="10.5" font-weight="700" fill="#94a3b8">throws</text>`;
  for(const s of P.SPOTS){const c=cs[s.id];if(!c.cpN||!c.cpN.length)continue;const d=c.cpN.map((n,i)=>`${i?'L':'M'}${X(n).toFixed(1)} ${Y(c.cpIn[i]/n*100).toFixed(1)}`).join('');const ln=c.cpN.length-1,ly=Y(c.cpIn[ln]/c.cpN[ln]*100);
    g+=`<path d="${d}" fill="none" stroke="${SPOT_COL[s.id]}" stroke-width="2.2" stroke-linejoin="round"/><circle cx="${X(c.cpN[ln])}" cy="${ly}" r="4.5" fill="${SPOT_COL[s.id]}" stroke="#fff" stroke-width="2"/><text x="${X(c.cpN[ln])+8}" y="${ly+4}" font-size="11.5" font-weight="800" fill="#0f172a">${s.short}</text>`}
  return `<svg viewBox="0 0 ${W} ${H}" class="dashSvg" role="img" aria-label="Class relative frequency of in, by number of throws">${g}</svg>`;
}
function angleChart(c,g){
  const W=520,H=220,Lm=44,Rm=12,T=12,B=30,pw=W-Lm-Rm,ph=H-T-B,angs=[];for(let a=15;a<=75;a+=5)angs.push(a);
  const bw=pw/angs.length,X=i=>Lm+i*bw,Y=v=>T+ph-v/100*ph;let s='';
  for(const v of [0,25,50,75,100])s+=`<path d="M${Lm} ${Y(v)}H${W-Rm}" stroke="#e2e8f0"/><text x="${Lm-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="#64748b">${v}%</text>`;
  let any=false;
  angs.forEach((a,i)=>{const ga=g&&g.ang&&g.ang[a],ca=c&&c.ang&&c.ang[a];s+=`<text x="${X(i)+bw/2}" y="${H-12}" text-anchor="middle" font-size="10.5" fill="#64748b">${a}°</text>`;
    if(ga&&ga.n>=5){any=true;const v=ga.in/ga.n*100;s+=`<rect x="${X(i)+3}" y="${Y(v)}" width="${bw-6}" height="${Math.max(0,T+ph-Y(v))}" rx="3" fill="#99f6e4"><title>All MMT, ${a}°: ${pct(ga.in,ga.n)} of ${ga.n}</title></rect>`}
    if(ca&&ca.n>=3){any=true;const v=ca.in/ca.n*100;s+=`<circle cx="${X(i)+bw/2}" cy="${Y(v)}" r="6" fill="#0f766e" stroke="#fff" stroke-width="2"><title>Your class, ${a}°: ${pct(ca.in,ca.n)} of ${ca.n}</title></circle>`}});
  if(!any)return `<p class="small">Not enough throws at this spot yet.</p>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="dashSvg" role="img" aria-label="Chance of in by throwing angle">${s}</svg><div class="legendS"><span><i style="background:#99f6e4"></i>All MMT students</span><span><i class="dotL"></i>Your class</span><span>Angles with fewer than 5 throws are left out.</span></div>`;
}
async function tSavePred(){
  const o={};document.querySelectorAll('.tPred').forEach(i=>{const v=i.value===''?null:clamp(Math.round(+i.value),0,100);o[i.dataset.spot]=v});
  const cl=await cloud(),m=$('tPredMsg');const r=await cl.savePredictions(o);
  if(r.ok){TD.data.pred=o;m.textContent='✓ Saved';m.className='pos'}else{m.textContent='Could not save: '+r.error;m.className='neg'}
}
async function downloadCSV(){
  const cl=await cloud();const rows=await cl.loadAllThrows();
  const head=['Student','Class','Spot','Distance (m)','Angle','Power (%)','Result','Hard mode','Saved at'];
  const q=v=>{let s=String(v==null?'':v);if(/^[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
  const lines=[head.map(q).join(',')].concat(rows.map(r=>[r.name,r.className,P.spot(r.s).name,P.spot(r.s).d,r.a,r.p,r.i?'In':'Out',r.h?'Yes':'No',r.at].map(q).join(',')));
  const blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Bin Toss throws - ${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();
}

/* ---------------- class board: everyone's estimate of the same chance ---------------- */
function boardPanel(){
  phase='board';hideGame();helpPanel.back=helpPanel.back||'intro';
  setPanel(()=>{const sp=PREF.boardSpot,ent=PREF.board.filter(e=>e.spot===sp),tot=ent.reduce((a,e)=>a+e.n,0),ins=ent.reduce((a,e)=>a+e.a,0);
    const ests=ent.map(e=>e.a/e.n*100),mean=ests.length?ests.reduce((a,b)=>a+b,0)/ests.length:0;
    panel(`<div class="dashHead"><div><div class="eyebrow">Class board</div><h2>Everyone's estimate of the same chance</h2></div>
      <div class="segMini">${P.SPOTS.map(s=>`<button class="${sp===s.id?'on':''}" data-act="bSpot" data-v="${s.id}">${s.name} (${s.d} m)</button>`).join('')}</div></div>
      <p class="small">Students read out their result from <b>My results</b> (for example <b>7/25</b>). Type each one and press Enter.${AUTH.teacher?' Or <button class="lnk" data-act="bFill">fill it from your class\'s saved throws</button>.':''}</p>
      <div class="acctF"><input id="bName" placeholder="Name (optional)" aria-label="Name"><input id="bVal" placeholder="7/25" aria-label="In out of throws" dir="ltr"><button class="pb sm" data-act="bAdd">Add</button></div><div class="acctMsg" id="bMsg"></div>
      ${boardPlot(ests,tot?ins/tot*100:null,mean)}
      <div class="kpis"><div><small>Estimates</small><b>${ent.length}</b></div><div><small>Spread</small><b>${ests.length?Math.round(Math.min(...ests))+'–'+Math.round(Math.max(...ests))+'%':'–'}</b></div><div><small>All the throws together</small><b>${tot?pct(ins,tot):'–'}</b><span>${tot?ins+' in out of '+tot:''}</span></div></div>
      <div class="chips">${ent.map((e,i)=>`<span class="chipE">${esc(e.name||'')} <b dir="ltr">${e.a}/${e.n}</b> <button class="x" data-act="bDel" data-v="${PREF.board.indexOf(e)}" aria-label="Remove">×</button></span>`).join('')}</div>
      <p class="small">Ask: why are the estimates different? Which ones would you trust most? Why is "all the throws together" the best estimate?</p>
      <div class="pBtns"><button class="pb" data-act="bClear">Clear this spot</button><button class="pb" data-act="${AUTH.teacher?'teacher':'closeHelp'}">${AUTH.teacher?'Teacher view':'Close'}</button></div>`,{xwide:true})});
  setTimeout(()=>{const i=$('bVal');if(i)i.focus()},80);
}
function boardPlot(ests,pool,mean){
  const W=760,H=150,Lm=20,Rm=20,pw=W-Lm-Rm,X=v=>Lm+v/100*pw,base=110;let s='';
  for(let v=0;v<=100;v+=10)s+=`<path d="M${X(v)} ${base}v6" stroke="#94a3b8"/><text x="${X(v)}" y="${base+20}" text-anchor="middle" font-size="12" fill="#64748b">${v}%</text>`;
  s+=`<path d="M${Lm} ${base}H${W-Rm}" stroke="#334155" stroke-width="1.5"/>`;
  const stack={};ests.forEach(v=>{const b=Math.round(v/2)*2;stack[b]=(stack[b]||0)+1;s+=`<circle cx="${X(v)}" cy="${base-8-(stack[b]-1)*13}" r="6" fill="#2563eb" stroke="#fff" stroke-width="1.5"/>`});
  if(pool!=null)s+=`<path d="M${X(pool)} 8V${base}" stroke="#0f766e" stroke-width="2.5" stroke-dasharray="5 4"/><text x="${X(pool)+6}" y="20" font-size="12.5" font-weight="800" fill="#0f766e">All together ${Math.round(pool*10)/10}%</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="dashSvg wide" role="img" aria-label="Dot plot of each student's estimate">${s}</svg>`;
}
function boardAdd(){
  const v=String($('bVal').value||'').trim(),m=v.match(/^(\d+)\s*(?:\/|out of|of)\s*(\d+)$/i),msg=$('bMsg');
  if(!m||+m[2]<1||+m[1]>+m[2]){msg.className='acctMsg bad';msg.textContent='Type it as in/throws, for example 7/25.';return}
  PREF.board.push({spot:PREF.boardSpot,name:String($('bName').value||'').trim().slice(0,30),a:+m[1],n:+m[2]});savePrefs();curPanel();
}
function boardFill(){
  const studs=(TD.data&&TD.data.students||[]).filter(s=>TD.cls==='all'||s.className===TD.cls);let k=0;
  PREF.board=PREF.board.filter(e=>e.spot!==PREF.boardSpot);
  for(const s of studs){const x=s.spots&&s.spots[PREF.boardSpot];if(x&&x.n){PREF.board.push({spot:PREF.boardSpot,name:(s.name||'').split(' ')[0],a:x.in,n:x.n});k++}}
  savePrefs();curPanel();
}
