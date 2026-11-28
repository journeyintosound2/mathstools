/* ---------------- challenges ---------------- */
const GOALS=[
  {id:'streak3',name:'Get 3 in a row'},
  {id:'back',name:'Get one in from the back'},
  {id:'throws50',name:'Throw 50 times'},
  {id:'allSpots',name:'Throw 10 times from every spot'},
  {id:'hard5',name:'Get 5 in using hard mode'},
  {id:'profit',name:'Make a profit'},
  {id:'big',name:'Make $100 in one day'},
  {id:'twoSpots',name:'Make a profit from two different spots'},
  {id:'even',name:'Finish a day within $10 of $0'},
  {id:'predict',name:'Predict a day right: profit or loss'},
  {id:'quiz',name:'Get every question right in the check'}
];
function award(id){if(S.goals[id])return;S.goals[id]=Date.now();save();SFX.badge();toast(`🏆 <b>${t('Challenge complete')}</b><br>${t(GOALS.find(g=>g.id===id).name)}`);paintGoalBtn()}
function checkGoals(ev){
  ev=ev||{};
  if(streak>=3)award('streak3');
  if(ev.throwIn&&S.spot==='back')award('back');
  if(allThrows()>=50)award('throws50');
  if(P.SPOTS.every(s=>S.data[s.id].length>=10))award('allSpots');
  if(P.SPOTS.reduce((a,s)=>a+S.data[s.id].filter(x=>x.h&&x.in).length,0)>=5)award('hard5');
  const d=ev.day;
  if(d){if(d.profit>0)award('profit');if(d.profit>=100)award('big');
    if(new Set(S.days.filter(x=>x.profit>0).map(x=>x.spot)).size>=2)award('twoSpots');
    if(Math.abs(d.profit)<=10)award('even');
    if(d.pred&&((d.pred==='profit'&&d.profit>0)||(d.pred==='loss'&&d.profit<0)))award('predict')}
  if(ev.quizPerfect)award('quiz');
}
function paintGoalBtn(){const n=GOALS.filter(g=>S.goals[g.id]).length;$('goalCount').textContent=`${n}/${GOALS.length}`}
function goalsPanel(){const back=phase;
  setPanel(()=>panel(`<div class="eyebrow">${t('Challenges')}</div><h2>${tt('How many can you complete?')}</h2>
    <ul class="goals">${GOALS.map(g=>`<li class="${S.goals[g.id]?'done':''}"><span class="gi">${S.goals[g.id]?'🏆':'○'}</span>${tt(g.name)}</li>`).join('')}</ul>
    <div class="pBtns"><button class="pb main" data-act="closeHelp" data-focus>${t('Close')}</button></div>`));helpPanel.back=back}

/* ---------------- the long run: same price, same customers, many more players ---------------- */
function longRun(n){
  const d=dayPanel.day;if(!d)return;const m=customerModel(d.spot),ys=[];let prof=0,w=0;
  for(let i=0;i<n;i++){const ok=customerThrow(d.spot,m);if(ok)w++;prof+=d.price-(ok?d.prize:0);ys.push(prof)}
  const perExp=d.price-d.p*d.prize,per=prof/n;
  $('lrOut').innerHTML=lineChartH({series:[{name:t('Profit'),ys,color:'#7c3aed'}],ref:{name:t('What your data predicts'),slope:perExp},xLab:t('players'),yFmt:money,end:money(prof),id:'lr'})+
    `<p class="lrTxt">${tt('After {n} players: <b>{w}</b> winners ({p}), profit <b>{m}</b>. That is {per} per player. Your data predicted about {pe} per player (price − P(in) × prize).',{n,w,p:pct(w,n),m:money(prof),per:money2(per),pe:money2(perExp)})}</p>`;
  wireChart('lr',ys,money);
}
/* one-axis line chart; a dashed reference line through 0 with a given slope */
function lineChartH(o){
  const W=560,H=200,Lm=56,Rm=16,T=14,B=30,pw=W-Lm-Rm,ph=H-T-B,n=o.series[0].ys.length;
  const ref=o.ref?Array.from({length:n},(_,i)=>(i+1)*o.ref.slope):[];
  const all=[0,...o.series.flatMap(s=>s.ys),...ref],lo=Math.min(...all),hi=Math.max(...all),st=niceStep(Math.max(1,hi-lo)),yMin=Math.floor(lo/st)*st,yMax=Math.max(yMin+st,Math.ceil(hi/st)*st);
  const X=i=>Lm+(n<=1?pw/2:i/(n-1)*pw),Y=v=>T+ph-(v-yMin)/(yMax-yMin)*ph;
  let g='';for(let v=yMin;v<=yMax+1e-9;v+=st)g+=`<path d="M${Lm} ${Y(v)}H${W-Rm}" stroke="${v===0?'#94a3b8':'#e2e8f0'}" stroke-width="1"/><text x="${Lm-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="#64748b">${o.yFmt(v)}</text>`;
  const xs=niceStep(n);for(let k=xs;k<=n;k+=xs)g+=`<text x="${X(k-1)}" y="${H-12}" text-anchor="middle" font-size="11" fill="#64748b">${k}</text>`;
  g+=`<text x="${W-Rm}" y="${H-1}" text-anchor="end" font-size="10.5" font-weight="700" fill="#94a3b8">${esc(o.xLab)}</text>`;
  const path=ys=>ys.map((v,i)=>`${i?'L':'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('');
  let s='';if(o.ref)s+=`<path d="${path(ref)}" fill="none" stroke="#475569" stroke-width="2" stroke-dasharray="6 5"/><text x="${X(Math.floor(n*.62))}" y="${Y(ref[Math.floor(n*.62)]||0)+(o.ref.slope<0?22:-10)}" text-anchor="middle" font-size="11.5" font-weight="800" fill="#334155" paint-order="stroke" stroke="#fff" stroke-width="4">${esc(o.ref.name)}</text>`;
  for(const se of o.series)s+=`<path class="ln" d="${path(se.ys)}" fill="none" stroke="${se.color}" stroke-width="2.2" stroke-linejoin="round"/>`;
  const ly=o.series[0].ys[n-1];s+=`<circle cx="${X(n-1)}" cy="${Y(ly)}" r="5" fill="${o.series[0].color}" stroke="#fff" stroke-width="2"/><text x="${X(n-1)-8}" y="${Y(ly)+(Y(ly)<T+20?18:-10)}" text-anchor="end" font-size="12.5" font-weight="900" fill="#0f172a" paint-order="stroke" stroke="#fff" stroke-width="4">${esc(o.end)}</text>`;
  return `<div class="chartBox" data-chart="${o.id}" data-n="${n}" data-l="${Lm}" data-pw="${pw}"><svg viewBox="0 0 ${W} ${H}" dir="ltr" role="img" aria-label="${esc(o.series[0].name)}">${g}${s}<path class="xh" stroke="#334155" stroke-width="1" opacity=".5"/><rect class="hit" x="${Lm}" y="${T}" width="${pw}" height="${ph}" fill="transparent"/></svg><div class="tip" hidden></div></div>`;
}
function niceStep(n){const raw=n/5,p=Math.pow(10,Math.floor(Math.log10(raw||1)));for(const m of [1,2,5,10])if(m*p>=raw)return m*p;return 10*p}
function wireChart(id,ys,fmt){
  const box=document.querySelector(`.chartBox[data-chart="${id}"]`);if(!box)return;const svg=box.querySelector('svg'),hit=box.querySelector('.hit'),tip=box.querySelector('.tip'),xh=box.querySelector('.xh');
  const n=+box.dataset.n,Lm=+box.dataset.l,pw=+box.dataset.pw,pts=svg.querySelector('.ln').getAttribute('d').slice(1).split('L').map(s=>s.split(' ').map(Number));
  hit.addEventListener('pointermove',e=>{const b=svg.getBoundingClientRect(),sx=(e.clientX-b.left)/b.width*560,i=clamp(Math.round((sx-Lm)/pw*(n-1)),0,n-1),[px,py]=pts[i];
    xh.setAttribute('d',`M${px} 14V170`);tip.hidden=false;tip.style.left=(px/560*100)+'%';tip.style.top=(py/200*b.height)+'px';
    tip.textContent=`${t('Player')} ${i+1}: ${fmt(ys[i])}`});
  hit.addEventListener('pointerleave',()=>{tip.hidden=true;xh.setAttribute('d','')});
}

/* ---------------- check for understanding ---------------- */
let QZ=null;
function quizSpot(){let best=null;for(const s of P.SPOTS){const c=cnt(s.id);if(c.n>=MIN_DATA&&(!best||c.n>cnt(best).n))best=s.id}return best}
function buildQuiz(){
  const sp=quizSpot();if(!sp)return null;const c=cnt(sp),ex=c.in/c.n*100,prize=S.prize;
  const m=[20,40,50,60,80,200].sort(()=>Math.random()-.5)[0];
  const sh=(a)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  return {spot:sp,i:0,items:[
    {key:'estimate',label:'Estimate a probability',q:['From the {s} you got <b>{a} in out of {n}</b>. What is P(in) as a percentage?',{s:{spot:sp},a:c.in,n:c.n}],unit:'%',ans:ex,ok:v=>Math.abs(v-ex)<=.51,show:`${Math.round(ex*10)/10}%`,
      why:['{a} ÷ {n} = {d}, and {d} × 100 = {p}%.',{a:c.in,n:c.n,d:Math.round(c.in/c.n*1000)/1000,p:Math.round(ex*10)/10}],nudge:v=>v>0&&v<=1&&ex>1?'Write it as a percentage, for example 30 rather than 0.3.':null},
    {key:'complement',label:'Complementary events',q:['From the same spot, what is P(out) as a percentage?'],unit:'%',ans:100-ex,ok:(v,prev)=>Math.abs(v-(100-ex))<=.51||(prev!=null&&Math.abs(v-(100-prev))<=.51),show:`${Math.round((100-ex)*10)/10}%`,
      why:['Every throw is either in or out, so P(out) = 100% − P(in) = {p}%.',{p:Math.round((100-ex)*10)/10}]},
    {key:'expected',label:'Expected number',q:['If <b>{m}</b> people play from the {s}, about how many winners would you expect?',{m,s:{spot:sp}}],unit:'',ans:ex/100*m,ok:v=>Math.abs(v-ex/100*m)<=1.01,show:String(Math.round(ex/100*m*10)/10),
      why:['P(in) × players = {p} × {m} ≈ {e}.',{p:Math.round(c.in/c.n*1000)/1000,m,e:Math.round(ex/100*m*10)/10}]},
    {key:'breakeven',label:'Break-even price',q:['The prize is <b>{z}</b>. Using your P(in), what cost to play would make about <b>$0</b> profit in the long run?',{z:money(prize)}],unit:'$',ans:ex/100*prize,ok:v=>Math.abs(v-ex/100*prize)<=1.01,show:money2(ex/100*prize),
      why:['Each player wins {z} with chance P(in), so on average each player costs P(in) × {z} = {b}.',{z:money(prize),b:money2(ex/100*prize)}]},
    {key:'luck',label:'Chance and variation',q:['A stall charged <b>more</b> than its break-even price, but lost money on a day with 15 players. What is the best explanation?'],
      opts:sh([{t:'With only 15 players, chance can go against you. Over many players it evens out.',ok:true},{t:'The price must have been below break-even after all.'},{t:'The chance of getting it in changed during the day.'},{t:'Break-even prices don’t work for games of chance.'}]),
      why:['A small number of players is a small sample. The long-run results get closer to what the probability predicts.']},
    {key:'sample',label:'Sample size',q:['Mia got <b>3 in out of 10</b>. Leo, from the same spot, got <b>45 in out of 150</b>. Whose estimate of P(in) is more reliable?'],
      opts:sh([{t:'Leo’s, because it is based on more throws.',ok:true},{t:'Mia’s, because a short test is fairer.'},{t:'They are equally reliable, because both are 30%.'},{t:'Neither: experiments can’t estimate a probability.'}]),
      why:['Both give 30%, but 150 throws is a bigger sample than 10, so Leo’s estimate is likely to be closer to the true chance.']}
  ],res:[],given:[]};
}
function quizPanel(){
  if(!QZ||QZ.done){QZ=buildQuiz();if(!QZ){toast(t('Throw at least {n} times from one spot first.',{n:MIN_DATA}));return}}
  phase='quiz';hideGame();
  setPanel(()=>{const it=QZ.items[QZ.i],r=QZ.res[QZ.i];
    const body=it.opts?`<div class="mc">${it.opts.map((o,k)=>`<button class="mcO ${r?(o.ok?'right':(QZ.given[QZ.i]===k?'wrong':'')):''}" data-act="mc" data-v="${k}" ${r?'disabled':''}>${tt(o.t)}</button>`).join('')}</div>`
      :`<div class="numRow" dir="ltr">${it.unit==='$'?'<span class="u">$</span>':''}<input id="qIn" inputmode="decimal" autocomplete="off" ${r?'disabled':''} value="${r?esc(QZ.given[QZ.i]):''}" aria-label="${esc(t('Your answer'))}">${it.unit==='%'?'<span class="u">%</span>':''}<button class="pb main sm" data-act="qCheck" ${r?'disabled':''}>${t('Check')}</button></div><div class="nudge" id="qNudge"></div>`;
    const fb=r?`<div class="note ${r.ok?'green':'red'}">${r.ok?'✓ '+t('Correct!'):'✗ '+t('Not quite. The answer is {a}.',{a:it.opts?'':`<bdi dir="ltr">${it.show}</bdi>`}).replace(/\s+\.$/,'.')} ${tt(it.why[0],it.why[1])}</div>`:'';
    panel(`<div class="dayHead"><div class="eyebrow">${t('Check your understanding')} · ${t('Question {i} of {n}',{i:QZ.i+1,n:QZ.items.length})}</div><div class="qDots">${QZ.items.map((x,k)=>`<i class="${QZ.res[k]?(QZ.res[k].ok?'ok':'no'):k===QZ.i?'now':''}"></i>`).join('')}</div></div>
      <div class="chipK">${t(it.label)}</div><h2 class="qH">${tt(it.q[0],it.q[1])}</h2>${body}${fb}
      <div class="pBtns">${r?`<button class="pb main" data-act="qNext" data-focus>${QZ.i<QZ.items.length-1?t('Next question')+' ›':t('See my results')+' ›'}</button>`:''}<button class="pb" data-act="qLeave">${t('Back to the game')}</button></div>`,{wide:true});
    if(!r&&!it.opts)setTimeout(()=>{const i=$('qIn');if(i)i.focus({preventScroll:true})},80)});
}
function qAnswer(v){
  const it=QZ.items[QZ.i];if(QZ.res[QZ.i])return;
  if(it.opts){const ok=!!it.opts[v].ok;QZ.given[QZ.i]=v;QZ.res[QZ.i]={ok}}
  else{const raw=String($('qIn').value||'').replace(/[$%,\s]/g,'');const x=parseFloat(raw);
    if(!isFinite(x)){$('qNudge').textContent=t('Type a number.');return}
    const nd=it.nudge&&it.nudge(x);if(nd&&!QZ.nudged){QZ.nudged=true;$('qNudge').textContent=t(nd);return}
    const prev=QZ.i===1&&QZ.res[0]?parseFloat(QZ.given[0]):null;
    QZ.given[QZ.i]=raw;QZ.res[QZ.i]={ok:!!it.ok(x,prev)}}
  QZ.nudged=false;(QZ.res[QZ.i].ok?SFX.in:SFX.out)();curPanel();
}
function quizDone(){
  QZ.done=true;const right=QZ.res.filter(r=>r.ok).length,total=QZ.items.length;
  S.quiz={best:Math.max(right,S.quiz?S.quiz.best:0),total,last:right,at:Date.now()};save();
  if(right===total)checkGoals({quizPerfect:true});
  saveResult(right,total);
  setPanel(()=>panel(`<div class="eyebrow">${t('Check your understanding')}</div><h2>${tt('You got {r} out of {n}',{r:right,n:total})}</h2>
    <ul class="qSum">${QZ.items.map((it,k)=>`<li class="${QZ.res[k].ok?'ok':'no'}">${QZ.res[k].ok?'✓':'✗'} ${t(it.label)}${QZ.res[k].ok?'':` — <bdi dir="ltr">${it.opts?'':it.show}</bdi>`}</li>`).join('')}</ul>
    <div id="saveMsg" class="small"></div>
    <div class="pBtns"><button class="pb main" data-act="reveal" data-focus>${t('See the big picture')} ›</button><button class="pb" data-act="qAgain">${t('Try new questions')}</button><button class="pb" data-act="qLeave">${t('Back to the game')}</button></div>`,{wide:true}));
}

/* ---------------- the big picture: you, your class, every MMT student, and the predictions ---------------- */
async function revealPanel(){
  phase='reveal';hideGame();
  setPanel(()=>panel(`<div class="eyebrow">${t('The big picture')}</div><h2>${tt('Loading everyone’s throws…')}</h2>`,{wide:true}));
  let glob=null,cls=null,tp=null;
  try{const cl=await cloud();if(cl){glob=await cl.loadGlobal();if(AUTH.mode==='student'){const r=await cl.loadStudentReveal();cls=r.cls;tp=r.pred}}}catch(e){console.warn(e)}
  revealPanel.data={glob,cls,tp};
  setPanel(()=>{const {glob,cls,tp}=revealPanel.data;
    const rows=P.SPOTS.map(s=>{const me=cnt(s.id),c=cls&&cls.spots&&cls.spots[s.id],g=glob&&glob.spots[s.id];
      const mk=(v,cl,lab)=>v==null?'':`<i class="mk ${cl}" style="left:${clamp(v,0,100)}%" title="${esc(lab)}: ${Math.round(v)}%"></i>`;
      const cavg=c&&c.predN?c.predSum/c.predN:null;
      return `<div class="rvRow"><div class="rvName"><b>${spotName(s.id)}</b><small dir="ltr">${s.d} m</small></div>
        <div class="rvAxis">${[0,25,50,75,100].map(v=>`<span class="tk" style="left:${v}%">${v}%</span>`).join('')}
          ${mk(g&&g.n?g.in/g.n*100:null,'all',t('All MMT students'))}${mk(c&&c.n?c.in/c.n*100:null,'cls',t('Your class'))}${mk(me.n?me.p*100:null,'me',t('You'))}
          ${mk(S.pred[s.id],'pme',t('Your prediction'))}${mk(cavg,'pcls',t('Class prediction'))}${mk(tp&&tp[s.id]!=null?tp[s.id]:null,'ptch',t('Teacher’s prediction'))}</div>
        <div class="rvNums" dir="ltr">${me.n?`${t('You')}: ${me.in}/${me.n} = ${pct(me.in,me.n)}`:''}${c&&c.n?` · ${t('Class')}: ${pct(c.in,c.n)} (${c.n})`:''}${g&&g.n?` · ${t('All MMT')}: <b>${pct(g.in,g.n)}</b> (${g.n.toLocaleString('en-AU')})`:''}</div></div>`}).join('');
    const tot=glob?P.SPOTS.reduce((a,s)=>a+(glob.spots[s.id]?glob.spots[s.id].n:0),0):0;
    panel(`<div class="eyebrow">${t('The big picture')}</div><h2>${glob&&tot?tt('{n} throws by MMT students so far',{n:tot.toLocaleString('en-AU')}):tt('How does your estimate compare?')}</h2>
      <div class="rvLegend"><span><i class="mk me"></i>${t('You')}</span>${cls?`<span><i class="mk cls"></i>${t('Your class')}</span>`:''}${glob&&tot?`<span><i class="mk all"></i>${t('All MMT students')}</span>`:''}<span><i class="mk pme"></i>${t('Your prediction')}</span>${cls?`<span><i class="mk pcls"></i>${t('Class prediction')}</span>`:''}${tp?`<span><i class="mk ptch"></i>${t('Teacher’s prediction')}</span>`:''}</div>
      ${rows}
      <p class="small">${glob&&tot?tt('The more throws, the closer the estimate gets to the true chance. Thousands of throws make a very good estimate.'):tt('Sign in with your student code to add your throws to the class data and see everyone’s results.')}</p>
      <div class="pBtns"><button class="pb main" data-act="qLeave" data-focus>${t('Back to the game')}</button></div>`,{wide:true})});
}
