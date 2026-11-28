/* ---------------- HUD ---------------- */
function show(id,on){$(id).hidden=!on}
function hint(s){const h=$('hint');if(s){h.textContent=s;h.hidden=false}else h.hidden=true}
function pop(html,ms){const p=$('pop');p.innerHTML=html;clearTimeout(pop.t);pop.t=setTimeout(()=>{p.innerHTML=''},ms||1300)}
function toast(html){const el=$('toast');el.innerHTML=html;el.hidden=false;el.classList.remove('go');void el.offsetWidth;el.classList.add('go');clearTimeout(toast.t);toast.t=setTimeout(()=>{el.hidden=true},3400)}
function renderStatus(){
  const el=$('statusCard');if(!S.spot||!['aim','power','wind','fly','after','replay','walk','results'].includes(phase)&&!stall){show('status',false);return}
  const s=curSpot(),c=cnt(S.spot);
  if(stall){
    const d=stall,pr=d.i*d.price-d.wins*d.prize;
    el.innerHTML=`<div class="stTop"><span class="chip money">${t('Stall open')}</span><span class="stSpot">${spotName(S.spot)}</span></div>
      <div class="qRow"><span>${t('Cost to play')} <b><bdi dir="ltr">${money(d.price)}</bdi></b> · ${t('Prize')} <b><bdi dir="ltr">${money(d.prize)}</bdi></b></span></div>
      <div class="qRow"><span>${t('Customer')} <b><bdi dir="ltr">${Math.min(d.i+(phase==='day'?0:1),d.n)} / ${d.n}</bdi></b></span><span>${t('Winners')} <b>${d.wins}</b></span></div>
      <div class="moneyG"><div class="cnt"><small>${t('Collected')}</small><b><bdi dir="ltr">${money(d.i*d.price)}</bdi></b></div><div class="cnt"><small>${t('Paid out')}</small><b><bdi dir="ltr">${money(d.wins*d.prize)}</bdi></b></div>
      <div class="cnt wide"><small>${t('Profit')}</small><b class="${pr>0?'pos':pr<0?'neg':''}"><bdi dir="ltr">${money(pr)}</bdi></b></div></div>`;
    show('status',true);return}
  const tr=S.data[S.spot];
  const dots=tr.slice(-30).map((x,i)=>`<i class="${x.in?'in':'out'}"></i>`).join('')+(batchLeft>0?'<i class="now"></i>'+'<i></i>'.repeat(Math.max(0,batchLeft-1)):'');
  el.innerHTML=`<div class="stTop"><span class="chip">${t('Practice')}${PREF.hard?' · '+t('Hard'):''}</span><span class="stSpot">${spotName(S.spot)} · <bdi dir="ltr">${s.d} m</bdi></span></div>
    <div class="stThrow">${batchLeft>0?t('Throw {n} of {m}',{n:c.n+1,m:c.n+batchLeft}):t('{n} throws',{n:c.n})}</div><div class="dots">${dots}</div>
    <div class="counts"><div class="cnt in"><small>${t('In')} ✓</small><b>${c.in}</b></div><div class="cnt out"><small>${t('Out')} ✗</small><b>${c.out}</b></div>
      <div class="cnt p"><small>${t('Chance of in')}</small><b>${c.n?`<bdi dir="ltr">${c.in}/${c.n} <span>= ${pct(c.in,c.n)}</span></bdi>`:'–'}</b></div></div>
    <div class="stLinks"><button class="lnk" data-act="spots">${t('Change spot')}</button><button class="lnk" data-act="chars">${t('Change character')}</button>${c.n>=MIN_DATA?`<button class="lnk go" data-act="toPrice">${t('Open the stall')} ›</button>`:''}</div>
    ${AUTH.mode==='student'?`<div class="saveLine ${pendingCount()?'wait':''}">${pendingCount()?t('{n} throws waiting to save',{n:pendingCount()}):t('Your throws are saved for your class')+' ✓'}</div>`:''}`;
  show('status',true);
}
function setCtl(){
  const aim=phase==='aim',pw=phase==='power';
  $('ctlAngle').className='ctl '+(aim?'on':'off');$('ctlPower').className='ctl '+(pw?'on':'off');
  $('pill1').className=aim?'on':'done';$('pill2').className=pw?'on':'';
  $('pill1').textContent='1 '+t('Angle');$('pill2').textContent='2 '+t('Power');
  $('hAngle').textContent=t('Angle');$('hPower').textContent=t('Power');$('angNote').textContent=t('Drag up for a higher throw');
  const b=$('actBtn');b.disabled=!(aim||pw);b.className='bigBtn'+(pw?' throw':'');b.innerHTML=pw?t('THROW!')+' <kbd>Space</kbd>':t('Lock in angle')+' <kbd>Space</kbd>';
  $('unlockBtn').hidden=!pw;$('unlockBtn').innerHTML='&#8592; '+t('change the angle');drawZone();
}

/* ---------------- panels ---------------- */
const veil=$('veil');let curPanel=null;
function panel(html,o){veil.className=o&&o.clear?'clear':'';veil.innerHTML=`<div class="panel ${o&&o.wide?'wide':''} ${o&&o.xwide?'xwide':''}" role="dialog" aria-modal="true">${html}</div>`;veil.hidden=false;
  const f=veil.querySelector('[data-focus]');if(f)setTimeout(()=>f.focus({preventScroll:true}),60)}
function closePanel(){veil.hidden=true;veil.innerHTML='';curPanel=null}
function setPanel(fn){curPanel=fn;fn()}                   // remembered so a language change can redraw it
const prizeSVG=p=>`<svg viewBox="0 0 230 120" aria-hidden="true"><rect x="3" y="3" width="224" height="114" rx="12" fill="#fde68a" stroke="#b45309" stroke-width="3"/><rect x="13" y="13" width="204" height="94" rx="8" fill="none" stroke="#d97706" stroke-width="2" stroke-dasharray="5 4"/><circle cx="60" cy="60" r="30" fill="#fbbf24" stroke="#b45309" stroke-width="2.5"/><text x="60" y="71" text-anchor="middle" font-size="30" font-weight="900" fill="#92400e" font-family="system-ui,sans-serif">$</text><text x="152" y="66" text-anchor="middle" font-size="${p>=100?38:44}" font-weight="900" fill="#78350f" font-family="system-ui,sans-serif">$${p}</text><text x="152" y="92" text-anchor="middle" font-size="16" font-weight="900" letter-spacing="4" fill="#92400e" font-family="system-ui,sans-serif">PRIZE</text></svg>`;
function hideGame(){show('controls',false);show('status',false);show('skip',false);hint('');world.kid.g.visible=false;world.ball.visible=false;world.arrow.visible=world.arc.visible=world.baseLine.visible=false;hideStallCast()}
const hasData=()=>P.SPOTS.some(s=>S.data[s.id].length);

function introPanel(){
  phase='intro';hideGame();camFor('overview');
  setPanel(()=>panel(`<div class="prizeRow">${prizeSVG(S.prize)}<div><div class="eyebrow">${t('School fete')}</div><h2>${tt('You’re running the bin toss stall',null,'span')}</h2></div></div>
    <p style="margin-top:12px">${tt('Anyone who throws the paper ball <b>into the bin</b> wins a prize. Your job: choose a <b>cost to play</b> so the stall makes money.')}</p>
    <div class="steps3"><div><b><i>1</i>${t('Practise')}</b>${tt('Pick a spot and throw. Every throw is data: in or out.')}</div>
      <div><b><i>2</i>${t('Set your price')}</b>${tt('Use your data to work out how often people will win.')}</div>
      <div><b><i>3</i>${t('Open the stall')}</b>${tt('Customers line up. Count the money. Did you make a profit?')}</div></div>
    ${accountBoxH()}
    <div class="pBtns"><button class="pb main" data-act="${S.char?'spots':'chars'}" data-focus>${hasData()?t('Keep going')+' ›':t('Let’s go')+' ›'}</button></div>`));
}
function charPanel(back){
  phase='char';hideGame();camFor('overview');helpPanel.back=null;charPanel.back=back||null;
  setPanel(()=>panel(`<div class="eyebrow">${t('Choose your character')}</div><h2>${tt('Who’s throwing?')}</h2>
    <div class="chGrid">${CHARS.map((c,i)=>`<button class="chCard${S.char===c.id?' on':''}" data-act="char" data-v="${c.id}" ${S.char===c.id?'data-focus':''}><span class="chImg" style="background-position:${(i%7)/6*100}% ${Math.floor(i/7)/2*100}%"></span><b>${esc(c.name)}</b></button>`).join('')}</div>
    <p class="small">${tt('Characters from Mills Maths Adventure. They all throw the same: only your angle and timing matter.')}</p>
    ${charPanel.back?`<div class="pBtns"><button class="pb" data-act="charBack">&#8592; ${t('Back')}</button></div>`:''}`,{wide:true}));
}
/* the topbar shows the current character's face; it is also the way to change character mid-game */
const FACE_Y={3:40,5:30,6:0,16:20,20:4};
function paintCharBtn(){const b=$('charBtn');if(!b)return;const i=CHARS.findIndex(c=>c.id===S.char);b.hidden=i<0;if(i<0)return;
  const k=($('charFace').offsetWidth||34)/76,x=(i%7)*160+42,y=Math.floor(i/7)*200+(FACE_Y[i]!=null?FACE_Y[i]:8);
  $('charFace').style.backgroundPosition=`${-x*k}px ${-y*k}px`;b.title=t('Change character')+': '+charName(S.char);b.setAttribute('aria-label',b.title)}
function spotPanel(){
  phase='spot';stall=null;hideGame();camFor('overview');for(const s of P.SPOTS){const m=world.markers[s.id];m.g.visible=true;m.disc.visible=true}
  setPanel(()=>panel(`<div class="eyebrow">${t('Choose your spot')}</div><h2>${tt('Where will people throw from?')}</h2>
    <div class="spotCards">${P.SPOTS.map(s=>{const c=cnt(s.id);return `<button class="spotCard" data-act="pick" data-v="${s.id}"><div class="m"><bdi dir="ltr">${s.d}</bdi> <small>${t('metres')}</small></div><b>${spotName(s.id)}</b>
      <span class="${c.n?'has':''}">${c.n?t('Your data: {a} in out of {n} ({p})',{a:c.in,n:c.n,p:pct(c.in,c.n)}):t('No throws yet')}</span></button>`}).join('')}</div>
    <p class="small">${tt('You can also tap an orange marker on the floor. Each spot keeps its own data.')} <button class="lnk" data-act="chars">${t('Change character')}${S.char?': '+esc(charName(S.char)):''}</button></p>`,{clear:true}));
}
/* Before the first throw from a spot: predict, so the data has something to be compared with. */
function predictPanel(id){
  phase='predict';show('controls',false);hint('');
  const v=S.pred[id]!=null?S.pred[id]:50;
  setPanel(()=>{panel(`<div class="eyebrow">${t('Before you throw')} · ${spotName(id)}</div><h2>${tt('What percentage of your throws will go in from here?')}</h2>
    <div class="lsl"><div class="lslRead" id="predRead">${v}%</div><input type="range" id="spotPred" min="0" max="100" step="5" value="${v}" aria-label="${esc(t('Your prediction as a percentage'))}">
      <div class="lslWords"><span>${t('Impossible')}</span><span>${t('Unlikely')}</span><span>${t('Even chance')}</span><span>${t('Likely')}</span><span>${t('Certain')}</span></div></div>
    <p class="small">${tt('Your prediction is kept. At the end you’ll see how close you were.')}</p>
    <div class="pBtns"><button class="pb main" data-act="predGo" data-v="${id}" data-focus>${t('Lock it in and throw')} ›</button><button class="pb" data-act="predSkip">${t('Skip')}</button></div>`);paintPred()});
}
function paintPred(){const i=$('spotPred');if(!i)return;const v=+i.value;$('predRead').textContent=v+'%';$('predRead').style.color=lcol(v/100);i.style.setProperty('--fill',v+'%')}
function lcol(p){const st=[[239,68,68],[249,115,22],[234,179,8],[34,197,94],[59,130,246]],x=clamp(p,0,1)*4,i=Math.min(3,Math.floor(x)),f=x-i,a=st[i],b=st[i+1];return `rgb(${a.map((v,k)=>Math.round(v+(b[k]-v)*f)).join(',')})`}

function resultsPanel(){
  phase='results';show('controls',false);hint('');world.arrow.visible=world.arc.visible=world.baseLine.visible=false;renderStatus();
  setPanel(()=>{const c=cnt(S.spot),dec=Math.round(c.p*1000)/1000,pr=S.pred[S.spot];
    const rows=P.SPOTS.map(x=>{const k=cnt(x.id);return `<tr class="${x.id===S.spot?'cur':''}"><td>${spotName(x.id)} (<bdi dir="ltr">${x.d} m</bdi>)</td><td class="r">${k.n?k.in:'–'}</td><td class="r">${k.n||'–'}</td><td class="r">${k.n?pct(k.in,k.n):'–'}</td><td class="r">${S.pred[x.id]!=null?S.pred[x.id]+'%':'–'}</td></tr>`}).join('');
    panel(`<div class="eyebrow">${t('Your data')} · ${spotName(S.spot)}</div>
      <div class="bigFrac"><div class="n"><bdi dir="ltr">${c.in}</bdi> <small>${t('in out of')}</small> <bdi dir="ltr">${c.n}</bdi></div>
        <div class="eq" dir="ltr">P(in) ≈ ${fracH(c.in,c.n)} = ${dec} = ${pct(c.in,c.n)}</div></div>
      <p>${tt('This is your <b>estimate</b> of the chance that a throw from here goes in.')} ${c.n<30?tt('More throws give a better estimate.'):tt('That’s a solid amount of data.')}${pr!=null?' '+tt('You predicted {p}%.',{p:pr}):''}</p>
      <table class="tb"><thead><tr><th>${t('Spot')}</th><th class="r">${t('In')}</th><th class="r">${t('Throws')}</th><th class="r">P(in)</th><th class="r">${t('Predicted')}</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="pBtns"><button class="pb main" data-act="toPrice" data-focus>${t('Set my price')} ›</button><button class="pb" data-act="more">${t('Throw {n} more',{n:BATCH})}</button><button class="pb" data-act="spots">${t('Change spot')}</button></div>`)});
}
function queueH(n){let h='';for(let i=0;i<n;i++)h+=`<i style="--c:${QCOL[i%QCOL.length]}"></i>`;return h}
let dayPred=null;
function pricePanel(){
  phase='price';stall=null;show('controls',false);show('skip',false);hint('');camFor('stall');renderStatus();stallPool();dayPred={result:null,winners:null};
  if(S.price>=ceilFor(S.prize))S.price=Math.max(1,Math.round(ceilFor(S.prize)*.4));
  setPanel(()=>{const c=cnt(S.spot),cl=ceilFor(S.prize);
    panel(`<div class="eyebrow">${t('Open the stall')} · ${spotName(S.spot)}</div><h2>${tt('How much will you charge to play?')}</h2>
      <p>${tt('Your data from here: <b>{a} in out of {n}</b> ({p}). Your customers throw about as well as you.',{a:c.in,n:c.n,p:pct(c.in,c.n)})}</p>
      <div class="prizePick"><span>${t('Prize')}</span>${PRIZES.map(p=>`<button class="seg ${S.prize===p?'on':''}" data-act="prize" data-v="${p}"><bdi dir="ltr">$${p}</bdi></button>`).join('')}</div>
      <div class="priceRow"><button class="stepper" data-act="price" data-v="-1" aria-label="${esc(t('Cheaper'))}">−</button><div class="priceBig" id="priceBig"></div><button class="stepper" data-act="price" data-v="1" aria-label="${esc(t('Dearer'))}">+</button>
        <input class="hr" type="range" id="priceIn" min="1" max="${cl}" step="1" value="${S.price}" aria-label="${esc(t('Cost to play in dollars'))}"></div>
      <div class="qRow" style="margin-top:2px"><span>${t('In the queue')}: <b class="qCount" id="qCount"></b></span><span id="ceilNote"></span></div>
      <div class="queue" id="queueIcons"></div>
      <div class="predBox"><div class="predQ">${tt('Before you open: will today make a profit or a loss?')}</div>
        <div class="segRow"><button class="seg" data-act="dayPred" data-v="profit">${t('Profit')}</button><button class="seg" data-act="dayPred" data-v="loss">${t('Loss')}</button></div>
        <div class="predRow"><label for="predIn">${t('I expect about')}</label><input id="predIn" inputmode="numeric" maxlength="3" placeholder="?" aria-label="${esc(t('How many winners do you expect?'))}"><span>${t('winners')}</span><small>(${t('optional')})</small></div></div>
      <div class="pBtns"><button class="pb main" id="openBtn" data-act="open" disabled>${t('Open the stall')} ›</button><button class="pb" data-act="more">${t('More practice')}</button><button class="pb" data-act="spots">${t('Change spot')}</button></div>`);paintPrice()});
}
function paintPrice(){
  if(!$('priceBig'))return;const n=queueFor(S.price,S.prize),cl=ceilFor(S.prize);
  $('priceBig').textContent='$'+S.price;$('qCount').innerHTML=n?t(n===1?'{n} person':'{n} people',{n}):t('nobody');$('queueIcons').innerHTML=n?queueH(n):`<span class="nobody">${t('Nobody will pay that much to win {p}.',{p:money(S.prize)})}</span>`;
  $('priceIn').value=S.price;$('priceIn').max=cl;$('ceilNote').innerHTML=t('Nobody pays {c} or more',{c:money(cl)});
  document.querySelectorAll('[data-act=dayPred]').forEach(b=>b.classList.toggle('on',dayPred&&dayPred.result===b.dataset.v));
  const ob=$('openBtn');if(ob){ob.disabled=!n||!(dayPred&&dayPred.result);ob.title=!n?t('Nobody will pay that much. Try a lower price.'):!(dayPred&&dayPred.result)?t('Choose profit or loss first'):''}
}
function starsH(p){const k=p>=100?3:p>=50?2:p>0?1:0;return `<div class="stars" title="${k}"><b>${'★'.repeat(k)}</b>${'★'.repeat(3-k)}</div>`}
function logH(){
  if(!S.days.length)return `<p style="margin:8px 0 0">${t('No stall days yet.')}</p>`;
  const rows=S.days.map((d,i)=>`<tr><td>${i+1}</td><td>${t(P.spot(d.spot).short)}</td><td class="r"><bdi dir="ltr">${money(d.price)}</bdi></td><td class="r"><bdi dir="ltr">${money(d.prize||50)}</bdi></td><td class="r">${d.n}</td><td class="r">${d.wins}</td><td class="r ${d.profit>0?'pos':d.profit<0?'neg':''}"><b><bdi dir="ltr">${money(d.profit)}</bdi></b></td></tr>`).join('');
  return `<table class="tb"><thead><tr><th>${t('Day')}</th><th>${t('Spot')}</th><th class="r">${t('Cost')}</th><th class="r">${t('Prize')}</th><th class="r">${t('Players')}</th><th class="r">${t('Winners')}</th><th class="r">${t('Profit')}</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function dayPanel(d,num){
  setPanel(()=>{const c={p:d.p},col=d.n*d.price,paid=d.wins*d.prize,pr=d.profit,be=d.p*d.prize,exp=d.p*d.n,pp=Math.round(d.p*100)/100;
    let verdict;
    if(d.price<be-.5)verdict=tt('You charged <b>{c}</b>, which is <b>below</b> break-even. Each player costs you about {b} in prizes, so in the long run this price loses money.',{c:money(d.price),b:money2(be)});
    else if(d.price>be+.5)verdict=tt('You charged <b>{c}</b>, which is <b>above</b> break-even, so you expect a profit in the long run.',{c:money(d.price)});
    else verdict=tt('You charged almost exactly the break-even price, so you expect to make about $0. Chance decides the rest.');
    const luck=(d.price>be+.5&&pr<0)?' '+tt('Today chance went against you: with only {n} players, that can happen.',{n:d.n}):(d.price<be-.5&&pr>0)?' '+tt('Today went your way, but that was luck.'):'';
    const sameSpot=S.days.filter(x=>x.spot===d.spot),cn=sameSpot.reduce((a,x)=>a+x.n,0),cw=sameSpot.reduce((a,x)=>a+x.wins,0);
    const predOK=d.pred?((d.pred==='profit'&&pr>0)||(d.pred==='loss'&&pr<0)):null;
    panel(`<div class="dayHead"><div><div class="eyebrow">${t('Day {n}',{n:num})} · ${spotName(d.spot)}</div><h2>${pr>0?tt('Your stall made {m}!',{m:money(pr)}):pr<0?tt('Your stall lost {m}',{m:money(-pr)}):tt('You broke even: $0')}</h2></div>${starsH(pr)}</div>
      <table class="tb" dir="ltr"><tbody><tr><td>${t('We collected')}</td><td>${d.n} × ${money(d.price)}</td><td class="r"><b>${money(col)}</b></td></tr>
        <tr><td>${t('We paid out')}</td><td>${d.wins} × ${money(d.prize)}</td><td class="r"><b>${money(paid)}</b></td></tr>
        <tr class="tot"><td>${t('Profit')}</td><td>${money(col)} − ${money(paid)}</td><td class="r ${pr>0?'pos':pr<0?'neg':''}">${money(pr)}</td></tr></tbody></table>
      ${d.pred?`<div class="note ${predOK?'green':'red'}">${predOK?'✓ ':'✗ '}${tt(d.pred==='profit'?'You predicted a profit.':'You predicted a loss.')}${d.predW!=null?' '+tt('You expected about {w} winners; there were {x}.',{w:d.predW,x:d.wins}):''}</div>`:''}
      <div class="note blue">${tt('<b>What your data said:</b> P(in) ≈ {p}, so about {pp} × {n} = <b>{e}</b> winners. There were <b>{w}</b>.',{p:pct(Math.round(d.p*1000),1000),pp,n:d.n,e:Math.round(exp*10)/10,w:d.wins})}</div>
      <div class="note violet">${tt('<b>Break-even price</b> = P(in) × prize ≈ {pp} × {z} = <b>{b}</b>.',{pp,z:money(d.prize),b:money2(be)})} ${verdict}${luck}</div>
      ${sameSpot.length>1?`<div class="note amber">${tt('All your customers from here so far: <b>{w} in out of {n}</b> ({p}). More trials, better estimate.',{w:cw,n:cn,p:pct(cw,cn)})}</div>`:''}
      <div class="longRun" id="longRun"><div class="lrHead"><b>${t('What happens in the long run?')}</b><span>${t('Same price, same customers, many more players:')}</span>
        <button class="pb sm" data-act="long" data-v="100">${t('{n} players',{n:100})}</button><button class="pb sm" data-act="long" data-v="1000">${t('{n} players',{n:1000})}</button></div><div id="lrOut"></div></div>
      <div class="pBtns"><button class="pb main" data-act="toPrice" data-focus>${t('Try another price')} ›</button><button class="pb quizB" data-act="quiz">${t('Check your understanding')} ›</button><button class="pb" data-act="more">${t('More practice')}</button><button class="pb" data-act="spots">${t('Change spot')}</button></div>
      <details class="log"><summary>${t('Stall log')} (${S.days.length})</summary>${logH()}</details>`,{wide:true})});
  dayPanel.day=d;
}
function helpPanel(){
  const back=phase;
  setPanel(()=>panel(`<div class="eyebrow">${t('How to play')}</div><h2>${tt('Throw, collect data, set a price')}</h2>
    <p>${tt('<b>1. Angle.</b> Drag the blue slider up or down (or use the arrow keys). The green sweet spot on the power meter shows how much power that angle needs.')}</p>
    <p>${tt('<b>2. Power.</b> Lock in the angle, then press <b>THROW!</b> (or Space) when the marker is in the green. A scrunched-up ball wobbles, so even a good throw can miss.')}</p>
    <p>${tt('<b>3. Data.</b> Every throw is recorded as in or out. In ÷ throws is your estimate of the chance: P(in).')}</p>
    <p>${tt('<b>4. The stall.</b> Choose a cost to play. Customers throw about as well as you. Each one pays you the cost; each winner takes the prize. Profit = collected − paid out. Nobody will pay half the prize or more.')}</p>
    <div class="pBtns"><button class="pb main" data-act="closeHelp" data-focus>${t('Got it')}</button></div>`));
  helpPanel.back=back;
}
function logPanel(){const back=phase;
  setPanel(()=>panel(`<div class="eyebrow">${t('My results')}</div><h2>${tt('Your data and your stall days')}</h2>
    <table class="tb"><thead><tr><th>${t('Spot')}</th><th class="r">${t('In')}</th><th class="r">${t('Throws')}</th><th class="r">P(in)</th><th class="r">${t('Predicted')}</th></tr></thead><tbody>
    ${P.SPOTS.map(x=>{const k=cnt(x.id);return `<tr><td>${spotName(x.id)}</td><td class="r">${k.n?k.in:'–'}</td><td class="r">${k.n||'–'}</td><td class="r">${k.n?pct(k.in,k.n):'–'}</td><td class="r">${S.pred[x.id]!=null?S.pred[x.id]+'%':'–'}</td></tr>`}).join('')}</tbody></table>
    <h3 class="h3">${t('Stall days')}</h3>${logH()}
    <div class="shareBox"><div class="eyebrow">${t('Share with your teacher')}</div><code id="shareTxt" dir="ltr">${esc(summaryText())}</code><button class="pb sm" data-act="copySum">${t('Copy')}</button></div>
    <div class="pBtns"><button class="pb main" data-act="closeHelp" data-focus>${t('Close')}</button></div>`,{wide:true}));helpPanel.back=back}
function summaryText(){
  const nm=AUTH.mode==='student'&&AUTH.student?AUTH.student.name+' · ':'';
  const parts=P.SPOTS.filter(x=>cnt(x.id).n).map(x=>{const k=cnt(x.id);return `${P.spot(x.id).short} ${x.d}m: ${k.in}/${k.n} (${pct(k.in,k.n)})`});
  const best=S.days.length?Math.max(...S.days.map(d=>d.profit)):null;
  return `Bin Toss · ${nm}${parts.join(' · ')||'no throws yet'}${best!=null?` · best day ${money(best)}`:''}${S.quiz?` · check ${S.quiz.best}/${S.quiz.total}`:''}`;
}
