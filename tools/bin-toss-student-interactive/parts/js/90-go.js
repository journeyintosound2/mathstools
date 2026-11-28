/* ---------------- input ---------------- */
function act(){if(phase==='aim')lockAngle();else if(phase==='power')doThrow();else if(phase==='replay')endReplay()}
$('actBtn').addEventListener('click',act);
$('unlockBtn').addEventListener('click',unlock);
$('skipBtn').addEventListener('click',skipStall);
$('replayTag').addEventListener('click',endReplay);
(function angleSlider(){
  const tr=$('angTrack'),tk=$('angTicks');let h='';
  for(let a=15;a<=75;a+=15){const f=(a-P.ANGLE.min)/(P.ANGLE.max-P.ANGLE.min)*100;h+=`<div class="tick" style="bottom:${f}%"></div><div class="tickL" style="bottom:${f}%">${a}°</div>`}
  tk.innerHTML=h;
  const fromY=y=>{const r=tr.getBoundingClientRect();return P.ANGLE.min+(1-clamp((y-r.top)/r.height,0,1))*(P.ANGLE.max-P.ANGLE.min)};
  let drag=false;
  tr.addEventListener('pointerdown',e=>{if(phase!=='aim')return;drag=true;tr.setPointerCapture(e.pointerId);setAngle(fromY(e.clientY));e.preventDefault()});
  tr.addEventListener('pointermove',e=>{if(drag&&phase==='aim'){const a=Math.round(fromY(e.clientY));if(a!==angle)setAngle(a)}});
  const end=()=>{if(drag){drag=false;save()}};tr.addEventListener('pointerup',end);tr.addEventListener('pointercancel',end);
})();
const OVERLAY_OK=['intro','spot','char','results','price','day','aim','quiz','reveal','predict','teacher','board'];
function reopen(b){
  closePanel();
  if(b==='intro')introPanel();else if(b==='spot')spotPanel();else if(b==='char')charPanel();else if(b==='results')resultsPanel();
  else if(b==='price')pricePanel();else if(b==='day'){phase='day';dayPanel(dayPanel.day||S.days[S.days.length-1],S.days.length)}
  else if(b==='quiz'){phase='quiz';quizPanel()}else if(b==='reveal'&&revealPanel.data){phase='reveal';curPanel=null;revealPanel()}
  else if(b==='predict')predictPanel(S.spot);else if(b==='teacher')teacherDash();else if(b==='board')boardPanel();
  else if(b==='aim'||b==='power'){phase=b;setCtl()}else introPanel();
}
function closeHelp(){const b=helpPanel.back;helpPanel.back=null;reopen(b)}
document.addEventListener('keydown',e=>{
  const k=e.key,id=e.target.id;
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)){
    if(k==='Enter'){if(id==='btCode')signIn();else if(id==='tCode'||id==='tPin')tSignIn();else if(id==='qIn')qAnswer();else if(id==='bVal'||id==='bName')boardAdd();else if(id==='predIn'&&!$('openBtn').disabled)ACT.open()}
    return}
  if(k==='Escape'){if(!$('setMenu').hidden){closeMenu();return}if(phase==='replay'){endReplay();return}if(helpPanel.back){closeHelp();return}if(phase==='power'){unlock();return}}
  if(!veil.hidden&&!veil.classList.contains('clear'))return;
  if(k===' '||k==='Enter'){if(e.target.closest&&e.target.closest('button')&&e.target.id!=='actBtn')return;e.preventDefault();act()}
  else if(k==='ArrowUp'&&phase==='aim'){e.preventDefault();setAngle(angle+1)}
  else if(k==='ArrowDown'&&phase==='aim'){e.preventDefault();setAngle(angle-1)}
  else if(/^[123]$/.test(k)&&phase==='spot')pickSpot(P.SPOTS[+k-1].id);
});
function overlay(fn){if(!OVERLAY_OK.includes(phase)||helpPanel.back)return;fn()}
const ACT={
  spots(){closePanel();spotPanel()},pick(el){pickSpot(el.dataset.v)},chars(){closePanel();charPanel()},
  char(el){S.char=el.dataset.v;poolIds=null;save();world.kid.use(S.char);closePanel();spotPanel()},
  more(){closePanel();stall=null;hideStallCast();clearThrows();world.kid.tint('#2563eb');world.kid.use(S.char);placeKid();batchLeft=BATCH;startAim()},
  toPrice(){if(cnt(S.spot).n<MIN_DATA)return;closePanel();queueUpload(true);world.kid.tint('#2563eb');world.kid.use(S.char);placeKid();pricePanel()},
  price(el){S.price=clamp(S.price+ +el.dataset.v,1,ceilFor(S.prize));paintPrice();SFX.tick()},
  prize(el){S.prize=+el.dataset.v;S.price=Math.min(S.price,ceilFor(S.prize)-1);save();curPanel();SFX.tick()},
  dayPred(el){dayPred.result=el.dataset.v;paintPrice();SFX.tick()},
  open(){const w=parseInt(($('predIn')||{}).value,10);dayPred.winners=isFinite(w)?w:null;openStall({...dayPred})},
  predGo(el){const v=+$('spotPred').value;S.pred[el.dataset.v]=v;save();closePanel();startAim(true)},
  predSkip(){closePanel();startAim(true)},
  long(el){longRun(+el.dataset.v)},
  quiz(){closePanel();QZ=null;quizPanel()},qCheck(){qAnswer()},mc(el){qAnswer(+el.dataset.v)},
  qNext(){if(QZ.i<QZ.items.length-1){QZ.i++;curPanel()}else quizDone()},qAgain(){QZ=null;quizPanel()},
  qLeave(){closePanel();if(S.spot&&cnt(S.spot).n>=MIN_DATA){placeKid();pricePanel()}else spotPanel()},
  reveal(){revealPanel()},
  closeHelp,signIn(){signIn()},signOut(){signOut()},copySum(){navigator.clipboard&&navigator.clipboard.writeText(summaryText()).then(()=>toast('✓ '+t('Copied')))},
  teacher(){helpPanel.back=helpPanel.back||phase;teacherPanel()},tSignIn(){tSignIn()},tReload(){teacherDash(true)},
  async tSignOut(){const cl=await cloud();if(cl)await cl.teacherSignOut();AUTH.teacher=null;TD.data=null;paintAccount();closeHelp()},
  tSavePred(){tSavePred()},csv(){downloadCSV()},tdSpot(el){TD.spot=el.dataset.v;curPanel()},tdSample(el){TD.sample=el.dataset.v;curPanel()},
  board(){helpPanel.back=helpPanel.back||phase;boardPanel()},bSpot(el){PREF.boardSpot=el.dataset.v;savePrefs();curPanel()},bAdd(){boardAdd()},
  bDel(el){PREF.board.splice(+el.dataset.v,1);savePrefs();curPanel()},bClear(){PREF.board=PREF.board.filter(e=>e.spot!==PREF.boardSpot);savePrefs();curPanel()},bFill(){boardFill()},
  doReset(){S.spot=null;S.data={front:[],middle:[],back:[]};S.days=[];S.price=10;S.prize=50;S.pred={};S.predSent={};S.goals={};S.quiz=null;S.angle={front:45,middle:40,back:35};
    const ch=S.char;save();clearThrows();stall=null;poolIds=null;helpPanel.back=null;paintGoalBtn();closePanel();S.char=ch;introPanel()},
  cancelReset(){closeHelp()}
};
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(el&&ACT[el.dataset.act]&&!el.disabled){ac();ACT[el.dataset.act](el)}});
document.addEventListener('input',e=>{const id=e.target.id;
  if(id==='priceIn'){S.price=+e.target.value;paintPrice()}else if(id==='predIn')e.target.value=e.target.value.replace(/\D/g,'');else if(id==='spotPred')paintPred()});
document.addEventListener('change',e=>{if(e.target.id==='tdCls'){TD.cls=e.target.value;curPanel()}});
$('helpBtn').addEventListener('click',()=>overlay(helpPanel));
$('logBtn').addEventListener('click',()=>overlay(logPanel));
$('goalBtn').addEventListener('click',()=>overlay(goalsPanel));
$('acctChip').addEventListener('click',()=>{if(AUTH.mode==='student'){overlay(logPanel);return}if(['intro','spot','char','results','price','day','aim'].includes(phase)&&!helpPanel.back){closePanel();introPanel();setTimeout(()=>{const i=$('btCode');if(i)i.focus()},120)}});
$('teachBtn').addEventListener('click',()=>{if(['intro','spot','char','results','price','day','aim','quiz','reveal'].includes(phase)&&!helpPanel.back)ACT.teacher()});
/* settings menu */
const setMenu=$('setMenu');
function openMenu(){paintMenu();setMenu.hidden=false;$('setBtn').setAttribute('aria-expanded','true')}
function closeMenu(){setMenu.hidden=true;$('setBtn').setAttribute('aria-expanded','false')}
$('setBtn').addEventListener('click',e=>{e.stopPropagation();setMenu.hidden?openMenu():closeMenu()});
document.addEventListener('click',e=>{if(!setMenu.hidden&&!e.target.closest('#setMenu')&&!e.target.closest('#setBtn'))closeMenu()});
function paintMenu(){
  setMenu.innerHTML=`<div class="mHead">${t('Language')}</div><div class="segMini lang">${[['en','English'],['ar','العربية'],['fa','فارسی']].map(([k,n])=>`<button class="${L()===k?'on':''}" data-set="lang" data-v="${k}">${n}</button>`).join('')}</div>
    <label class="sw"><input type="checkbox" data-set="sound" ${PREF.sound?'checked':''}><span class="track"></span><span>${t('Sound')}</span></label>
    <label class="sw"><input type="checkbox" data-set="hard" ${PREF.hard?'checked':''}><span class="track"></span><span>${t('Hard mode')}<small>${t('No sweet spot, faster meter')}</small></span></label>
    <div class="mHead">${t('Graphics')}</div><div class="segMini">${[['auto','Auto'],['low','Low'],['high','High']].map(([k,n])=>`<button class="${(PREF.low===null?'auto':PREF.low?'low':'high')===k?'on':''}" data-set="gfx" data-v="${k}">${t(n)}</button>`).join('')}</div>
    <small class="mNote">${t('Low graphics: fewer people in the queue and no shadows, for older devices.')}</small>
    <div class="mRule"></div><button class="mItem" data-set="reset">${t('Start again')}<small>${t('Clear your throws and stall days')}</small></button>`;
}
setMenu.addEventListener('click',e=>{const el=e.target.closest('[data-set]');if(!el||el.tagName==='INPUT')return;const k=el.dataset.set;
  if(k==='lang')setLang(el.dataset.v);else if(k==='gfx'){PREF.low=el.dataset.v==='auto'?null:el.dataset.v==='low';savePrefs();applyGfx();if(stall)layoutQueue(false);paintMenu()}
  else if(k==='reset'){closeMenu();if(!['intro','spot','char','results','price','day','aim'].includes(phase))return;helpPanel.back=phase;
    setPanel(()=>panel(`<div class="eyebrow">${t('Start again')}</div><h2>${tt('Clear all your throws and stall days?')}</h2><p>${tt('This removes your data from every spot and your stall log on this device.')}</p>
      <div class="pBtns"><button class="pb main" data-act="doReset">${t('Yes, start again')}</button><button class="pb" data-act="cancelReset" data-focus>${t('Keep my data')}</button></div>`))}});
setMenu.addEventListener('change',e=>{const k=e.target.dataset.set;if(k==='sound'){PREF.sound=e.target.checked;savePrefs();if(PREF.sound)SFX.lock()}
  else if(k==='hard'){PREF.hard=e.target.checked;savePrefs();drawZone();renderStatus();if(phase==='power')hint(PREF.hard?t('Hard mode: time it without the green'):t('Press THROW! when the marker is in the green'))}});
function setLang(l){PREF.lang=l;savePrefs();paintStatic();paintMenu();renderStatus();setCtl();paintAccount();if(curPanel)curPanel()}
function paintStatic(){document.querySelectorAll('[data-t]').forEach(el=>{el.textContent=t(el.dataset.t)});document.body.classList.toggle('rtlLang',L()!=='en')}
// tap a floor marker to choose it
const ray=new THREE.Raycaster(),ptr=new THREE.Vector2();
function markerAt(e){const r=canvas.getBoundingClientRect();ptr.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ptr,camera);
  const hit=ray.intersectObjects(P.SPOTS.map(s=>world.markers[s.id].disc))[0];return hit?hit.object.userData.spot:null}
canvas.addEventListener('pointerdown',e=>{if(phase==='spot'){const id=markerAt(e);if(id)pickSpot(id)}else if(phase==='replay')endReplay()});
canvas.addEventListener('pointermove',e=>{canvas.style.cursor=phase==='spot'&&markerAt(e)?'pointer':'default'});

/* ---------------- go ---------------- */
try{
  initScene();paintStatic();paintAccount();paintGoalBtn();camFor('overview',true);
  $('loading').hidden=true;
  introPanel();
  requestAnimationFrame(frame);
  restoreStudent();restoreTeacher();
}catch(err){$('loading').innerHTML='This game needs 3D graphics (WebGL), which this browser or device has switched off.<br><br><small>'+esc(err.message||err)+'</small>';console.error(err)}
window.__BTG__={S,P,PREF,AUTH,TD,get phase(){return phase},get stall(){return stall},get QZ(){return QZ},pickSpot,setAngle,lockAngle,doThrow,customerModel,queueFor,cnt,skipStall,CHARS,world,loadModel,
  forceThrow(a,p){setAngle(a,true);phase='power';power=p;doThrow()},get sim(){return sim},setPower(p){power=p},setLang,longRun,buildQuiz,pending,summaryText};
