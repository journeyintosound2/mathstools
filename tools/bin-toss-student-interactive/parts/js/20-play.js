/* ---------------- camera rig ---------------- */
const cam={pos:new THREE.Vector3(3,2.6,9),tgt:new THREE.Vector3(0,.8,2),gp:new THREE.Vector3(3,2.6,9),gt:new THREE.Vector3(0,.8,2),sway:0};
function camTo(p,tg,snap){cam.gp.set(...p);cam.gt.set(...tg);if(snap){cam.pos.copy(cam.gp);cam.tgt.copy(cam.gt)}}
function camFor(mode,snap){
  const d=S.spot?P.spot(S.spot).d:4,narrow=camera.aspect<.8;
  if(mode==='overview')camTo([2.6,2.5,9.2],[-.2,.6,2.6],snap);
  else if(mode==='throw')camTo(narrow?[.9,2.15,d+3.1]:[1.45,2.05,d+2.9],[narrow?.1:-.35,.55,d-3],snap);
  else if(mode==='stall')camTo(narrow?[1.6,3.0,d+3.4]:[2.7,2.75,d+3.3],[-.7,.5,d-2.4],snap);
  else if(mode==='replay')camTo([1.05,.8,.95],[0,.4,.05],snap);
}

/* ---------------- game state (not saved) ---------------- */
let phase='load',batchLeft=0,angle=45,bandNow=null,power=0,meterT=0,sim=null,simAcc=0,timeScale=1,trail=null,firstEv=null,armT=0,
    stall=null,afterT=0,cheerT=0,launchPlan=null,rec=null,rimIdx=-1,replay=null,walk=null,ownerT=0,streak=0,hardStreak=0;
const curSpot=()=>P.spot(S.spot);
const meterPeriod=()=>PREF.hard?1.6:P.METER.period;

function setAngle(a,quiet){
  angle=clamp(Math.round(a),P.ANGLE.min,P.ANGLE.max);if(S.spot)S.angle[S.spot]=angle;
  const f=(angle-P.ANGLE.min)/(P.ANGLE.max-P.ANGLE.min);
  $('angRead').textContent=angle;$('angThumb').style.bottom=f*100+'%';$('angFill').style.height=f*100+'%';$('angTrack').setAttribute('aria-valuenow',angle);
  bandNow=S.spot?P.band(S.spot,angle):null;drawZone();aimArrow();if(!quiet)SFX.tick();
}
function drawZone(){
  const z=$('zone'),zl=$('zoneL'),nt=$('zoneNote');
  if(PREF.hard){z.hidden=true;zl.hidden=true;nt.className='noZone hardNote';nt.textContent=t('Hard mode: no sweet spot');return}
  if(bandNow){z.hidden=false;zl.hidden=false;z.style.bottom=bandNow.lo+'%';z.style.height=Math.max(1.6,bandNow.w)+'%';zl.style.bottom=bandNow.mid+'%';zl.textContent=t('sweet spot');nt.className='zoneNote';nt.textContent=phase==='power'?t('Stop it in the green'):t('Green = it goes in')}
  else{z.hidden=true;zl.hidden=true;nt.className='noZone';nt.textContent=t('No sweet spot at this angle')}
}
function aimArrow(){
  if(!S.spot){world.arrow.visible=world.arc.visible=world.baseLine.visible=false;return}
  const d=curSpot().d,a=angle*Math.PI/180,yaw=Math.atan2(-P.REL.x,-d),dir=new THREE.Vector3(Math.cos(a)*Math.sin(yaw),Math.sin(a),Math.cos(a)*Math.cos(yaw));
  const o=new THREE.Vector3(P.REL.x,P.REL.y,d);
  world.arrow.position.copy(o);world.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
  const pts=[];for(let i=0;i<=20;i++){const k=a*i/20;pts.push(new THREE.Vector3(o.x+.34*Math.cos(k)*Math.sin(yaw),o.y+.34*Math.sin(k),o.z+.34*Math.cos(k)*Math.cos(yaw)))}
  world.arc.geometry.setFromPoints(pts);
  world.baseLine.geometry.setFromPoints([o,new THREE.Vector3(o.x+.8*Math.sin(yaw),o.y,o.z+.8*Math.cos(yaw))]);world.baseLine.computeLineDistances();
  const show=phase==='aim'||phase==='power';world.arrow.visible=world.arc.visible=world.baseLine.visible=show;
}
function placeKid(){
  const d=curSpot().d;world.kid.g.position.set(0,0,d);world.kid.g.rotation.y=0;world.kid.g.visible=true;world.kid.setArm(3.3);holdBall();
  for(const s of P.SPOTS){world.markers[s.id].g.visible=true;world.markers[s.id].disc.visible=s.id!==S.spot;world.markers[s.id].ring.material.opacity=0}
}
const handPos=new THREE.Vector3();
function holdBall(){world.kid.hand(handPos);world.ball.position.copy(handPos);world.ball.visible=true}
function clearThrows(){for(const tr of world.trails)scene.remove(tr);world.trails=[];for(const l of world.litter)scene.remove(l);world.litter=[]}

/* ---------------- practice ---------------- */
function pickSpot(id){
  if(S.spot!==id)clearThrows();S.spot=id;save();stall=null;closePanel();hideStallCast();
  world.kid.tint('#2563eb');world.kid.use(S.char);placeKid();camFor('throw');
  batchLeft=BATCH;
  if(S.pred[id]==null&&!cnt(id).n){predictPanel(id);return}
  startAim(true);
}
function startAim(first){
  phase='aim';stall=null;closePanel();show('controls',true);show('skip',false);setAngle(S.angle[S.spot]||45,true);world.kid.setArm(3.3);holdBall();setCtl();renderStatus();aimArrow();camFor('throw');
  hint(first&&!cnt(S.spot).n?t('Drag the angle slider, then lock it in'):'');
}
function lockAngle(){if(phase!=='aim')return;phase='power';meterT=0;power=0;SFX.lock();setCtl();hint(PREF.hard?t('Hard mode: time it without the green'):t('Press THROW! when the marker is in the green'))}
function unlock(){if(phase!=='power')return;phase='aim';setCtl();$('mark').style.bottom='0%';$('powRead').textContent='0';hint('')}
function doThrow(){
  if(phase!=='power')return;phase='wind';armT=0;setCtl();hint('');
  launchPlan={spot:S.spot,angle,power,nz:(window.__BTG__&&window.__BTG__.nz)||P.noise()};
}
function release(){
  const Lp=launchPlan;sim=P.launch(Lp.spot,Lp.angle,Lp.power,Lp.nz);simAcc=0;firstEv=null;phase='fly';SFX.whoosh();
  world.arrow.visible=world.arc.visible=world.baseLine.visible=false;
  trail={pts:[new THREE.Vector3(sim.x,sim.y,sim.z)],n:0};rec=[sim.x,sim.y,sim.z];rimIdx=-1;
}
function landed(){
  const isIn=sim.result==='in',res={in:isIn,rim:sim.rim,ceil:sim.ceil,first:firstEv},why=P.describe(res,S.spot);
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(trail.pts),new THREE.LineBasicMaterial({color:isIn?'#15803d':'#ef4444',transparent:true,opacity:stall?.28:.5}));
  scene.add(line);world.trails.push(line);while(world.trails.length>(stall?14:8))scene.remove(world.trails.shift());
  if(isIn){world.ball.visible=false;burst();SFX.in();cheerT=stall?.7:1.15;world.kid.cheer()}
  else{const l=world.ball.clone();l.material=world.ball.material;scene.add(l);world.litter.push(l);while(world.litter.length>(lowGfx()?15:40))scene.remove(world.litter.shift());world.ball.visible=false;SFX.out()}
  if(stall){
    const d=stall;d.i++;if(isIn)d.wins++;
    pop(`<span class="pp ${isIn?'in':'out'}">${isIn?t('IN')+' ✓':t('OUT')+' ✗'}</span><span class="cash ${isIn?'neg':'pos'}"><bdi dir="ltr">${isIn?`+${money(d.price)} − ${money(d.prize)}`:`+${money(d.price)}`}</bdi></span>`,800);
    setTimeout(isIn?SFX.pay:SFX.coin,isIn?350:60);ownerReact(isIn);renderStatus();phase='after';afterT=isIn?.75:.4;return;
  }
  const r={a:launchPlan.angle,p:Math.round(launchPlan.power*10)/10,in:isIn};if(PREF.hard)r.h=1;if(AUTH.mode==='student')r.up=0;
  S.data[S.spot].push(r);batchLeft--;save();
  streak=isIn?streak+1:0;if(PREF.hard&&isIn)hardStreak++;
  pop(`<span class="pp ${isIn?'in':'out'}">${isIn?t('IN')+' ✓':t('OUT')+' ✗'}</span><span class="why">${t(why)}</span>`,1300);
  renderStatus();checkGoals({throwIn:isIn});queueUpload();
  phase='after';afterT=1.25;
  if(sim.rim&&rimIdx>=0&&!lowGfx())startReplay();
}
function afterThrow(){
  cheerT=0;world.kid.g.position.y=0;
  if(stall){if(stall.i>=stall.n){endDay();return}nextCustomer();return}
  if(batchLeft<=0){resultsPanel();return}
  startAim();
}

/* ---------------- slow-motion replay of rim shots ---------------- */
function startReplay(){
  const from=Math.max(0,rimIdx-96),pts=[];for(let i=from*3;i<rec.length;i+=3)pts.push([rec[i],rec[i+1],rec[i+2]]);
  replay={pts,t:0,dur:pts.length/120/.32,keep:{p:cam.pos.clone(),t:cam.tgt.clone()}};phase='replay';
  world.ball.visible=true;camFor('replay',true);$('replayTag').hidden=false;
}
function endReplay(){if(!replay)return;replay=null;$('replayTag').hidden=true;world.ball.visible=false;camFor('throw',true);phase='after';afterT=.35}

/* ---------------- the stall ---------------- */
/* Customers throw about as well as the student did: same favourite angle, and the same spread of power around the sweet spot.
   The spread is measured robustly (median miss), so throwing badly on purpose in practice does not make customers bad. */
function customerModel(id){
  const tr=S.data[id],withBand=tr.map(x=>({x,b:P.band(id,x.a)})).filter(o=>o.b);
  let ang;
  if(withBand.length){const as=withBand.map(o=>o.x.a).sort((a,b)=>a-b);ang=as[Math.floor(as.length/2)]}
  else{ang=40;let best=null;for(let a=P.ANGLE.min;a<=P.ANGLE.max;a+=5){const b=P.band(id,a);if(b&&(!best||b.w>best.w)){best=b;ang=a}}}
  const b=P.band(id,ang);
  const errs=withBand.map(o=>Math.abs(o.x.p-o.b.mid)).sort((a,b)=>a-b);
  const med=errs.length?errs[Math.floor(errs.length/2)]:4;
  return {angle:ang,mid:b.mid,sigma:clamp(med/0.6745,1.6,7)};
}
const customerThrow=(id,m)=>P.run(id,m.angle,clamp(m.mid+P.gauss()*m.sigma,0,100),P.noise()).in;
let poolIds=null;
function stallPool(){if(!poolIds){const o=CHARS.map(c=>c.id).filter(id=>id!==S.char);for(let i=o.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[o[i],o[j]]=[o[j],o[i]]}poolIds=o.slice(0,4);poolIds.forEach(id=>loadModel(id).catch(()=>{}))}return poolIds}
function openStall(pred){
  const n=queueFor(S.price,S.prize);if(n<1)return;
  closePanel();clearThrows();save();
  stall={spot:S.spot,price:S.price,prize:S.prize,n,i:0,wins:0,pred,model:customerModel(S.spot),pool:stallPool(),fps:{t:0,f:0}};
  timeScale=1.9;show('controls',false);show('skip',true);hint('');camFor('stall');
  world.kid.g.visible=false;world.ball.visible=false;placeOwner();layoutQueue(true);renderStatus();SFX.lock();
  phase='after';afterT=.5;
}
function placeOwner(){
  const o=world.owner,d=curSpot().d;o.tint('#2563eb');o.use(S.char);o.g.position.set(.62,0,-.38);o.g.rotation.y=Math.atan2(.62,-(d+.38));o.setArm(null);o.g.visible=true;
}
function ownerReact(isIn){const o=world.owner;if(!o.g.visible)return;o.shape(isIn?'groan':'pump');ownerT=isIn?1.1:.7}
function hideStallCast(){world.queue.forEach(k=>k.g.visible=false);world.owner.g.visible=false;world.walker.g.visible=false;world.walker.stopWalk()}
const queueSpot=(j,d)=>{const col=j%3,row=Math.floor(j/3);return [-1.25-col*.48,Math.min(P.ROOM.z1-.5,d+.35+row*.5)]};
function layoutQueue(first){
  const d=curSpot().d,left=stall.n-stall.i-(first?0:1),cap=lowGfx()?3:9;
  world.queue.forEach((k,j)=>{const on=j<Math.min(left,cap);k.g.visible=on;if(!on)return;const [x,z]=queueSpot(j,d);k.tx=x;k.tz=z;
    if(!k.placed||first){k.g.position.set(x,0,z);k.placed=true}k.g.rotation.y=.5;
    const ci=stall.i+(first?0:1)+j;k.tint(QCOL[ci%QCOL.length]);const cid=stall.pool[ci%stall.pool.length];if(k.id!==cid)k.use(cid);k.setArm(null)});
}
function nextCustomer(){
  const d=stall,m=d.model,cid=d.pool[d.i%d.pool.length],col=QCOL[d.i%QCOL.length],dz=curSpot().d;
  world.kid.g.visible=false;world.ball.visible=false;
  launchPlan={spot:d.spot,angle:m.angle,power:clamp(m.mid+P.gauss()*m.sigma,0,100),nz:P.noise()};
  if(lowGfx()){toLine(cid,col);return}
  const [x,z]=queueSpot(0,dz),w=world.walker;w.tint(col);w.use(cid);w.g.position.set(x,0,z);w.g.visible=true;w.startWalk();
  if(world.queue[0])world.queue[0].g.visible=false;
  layoutQueue(false);
  walk={x0:x,z0:z,t:0,dur:Math.hypot(x,z-dz)/1.35,cid,col};phase='walk';
}
function toLine(cid,col){
  const w=world.walker;w.stopWalk();w.g.visible=false;walk=null;
  world.kid.tint(col);world.kid.use(cid);world.kid.g.rotation.y=0;world.kid.g.position.set(0,0,curSpot().d);world.kid.g.visible=true;world.kid.setArm(3.3);holdBall();
  if(lowGfx())layoutQueue(false);
  phase='wind';armT=-.15;renderStatus();
}
function skipStall(){
  if(!stall||phase==='day')return;const d=stall,m=d.model;
  if(phase==='fly'){while(!sim.done)P.step(sim,P.DT);d.i++;if(sim.result==='in')d.wins++}
  if(phase==='wind'||phase==='walk'){}
  while(d.i<d.n){d.i++;if(customerThrow(d.spot,m))d.wins++}
  world.ball.visible=false;$('pop').innerHTML='';endDay();
}
function endDay(){
  phase='day';show('skip',false);const d=stall,c=cnt(d.spot),pr=d.n*d.price-d.wins*d.prize;
  const day={spot:d.spot,price:d.price,prize:d.prize,n:d.n,wins:d.wins,profit:pr,p:c.p,pred:d.pred&&d.pred.result||null,predW:d.pred&&d.pred.winners!=null?d.pred.winners:null,at:Date.now()};
  S.days.push(day);save();renderStatus();hideStallCast();world.kid.g.visible=false;
  if(pr>0)SFX.win();
  checkGoals({day});
  dayPanel(day,S.days.length);
}

/* ---------------- main loop ---------------- */
let last=0;
function frame(now){
  const dt=Math.min(.1,(now-last)/1000||0);last=now;
  cam.sway+=dt;const k=1-Math.pow(.0015,dt);
  const gt=cam.gt.clone();if(phase==='fly'&&sim)gt.lerp(new THREE.Vector3(sim.x,sim.y,sim.z),.3);
  cam.pos.lerp(cam.gp,k);cam.tgt.lerp(gt,k);
  camera.position.copy(cam.pos);if(phase==='intro'||phase==='spot'||phase==='char'){camera.position.x+=Math.sin(cam.sway*.35)*.25;camera.position.y+=Math.sin(cam.sway*.27)*.06}
  camera.lookAt(cam.tgt);
  if(phase==='spot')for(const s of P.SPOTS){const m=world.markers[s.id];m.ring.material.opacity=.45+.35*Math.sin(cam.sway*4);m.ring.scale.setScalar(1+.08*Math.sin(cam.sway*4))}
  if(phase==='aim'){const pp=window.__BTG__&&window.__BTG__.pausePose;world.kid.setArm(pp!==undefined?pp:3.3+Math.sin(cam.sway*2.2)*.04);holdBall()}
  if(phase==='power'){
    meterT+=dt;const ph=(meterT/meterPeriod())%1;power=ph<.5?ph*200:(1-ph)*200;
    $('mark').style.bottom=power+'%';$('powRead').textContent=Math.round(power);
    world.kid.setArm(3.3+power/100*.35);holdBall();
  }
  if(phase==='walk'&&walk){
    walk.t+=dt*timeScale;const u=Math.min(1,walk.t/walk.dur),w=world.walker,dz=curSpot().d;
    const x=walk.x0*(1-u),z=walk.z0+(dz-walk.z0)*u;w.g.position.set(x,0,z);w.g.rotation.y=u<.85?Math.atan2(-(0-walk.x0),-(dz-walk.z0)):0;
    w.update(dt*timeScale);if(u>=1)toLine(walk.cid,walk.col);
  }
  if(phase==='wind'){
    armT+=dt*(stall?timeScale:1);const w=.2,sw=.11;let su=0;
    if(armT<0){}else if(armT<w)world.kid.setArm(3.3+(armT/w)*.4);
    else{const u=Math.min(1,(armT-w)/sw);su=u;world.kid.setArm(3.7-(3.7-2.786)*u*u);if(u>=1){release()}}
    if(phase==='wind'){holdBall();if(su>0&&launchPlan)world.ball.position.lerp(_a.set(P.REL.x,P.REL.y,P.spot(launchPlan.spot).d),su*su*su)}
  }
  if(phase==='fly'){
    simAcc+=dt*(stall?timeScale:1);
    if(world.kid.armX>1.7&&world.kid.mode==='arm')world.kid.setArm(Math.max(1.7,world.kid.armX-dt*7));
    while(simAcc>=P.DT&&!sim.done){P.step(sim,P.DT);simAcc-=P.DT;
      if(sim.ev){if(!firstEv&&sim.ev!=='in')firstEv={ev:sim.ev,x:sim.x,z:sim.z};
        if(sim.ev==='rim'&&rimIdx<0)rimIdx=rec.length/3;
        if(sim.ev==='floor'||sim.ev==='wall'||sim.ev==='ceil'||sim.ev==='side')SFX.thud();else if(sim.ev==='rim')SFX.rim()}
      if(++trail.n%2===0)rec.push(sim.x,sim.y,sim.z);
      if(trail.n%6===0&&!sim.inBin&&trail.pts.length<400&&!firstEv)trail.pts.push(new THREE.Vector3(sim.x,sim.y,sim.z))}
    world.ball.position.set(sim.x,sim.y,sim.z);world.ball.rotation.x+=dt*9;world.ball.rotation.z+=dt*6;
    if(sim.done)landed();
  }
  if(phase==='replay'&&replay){
    replay.t+=dt;const i=Math.min(replay.pts.length-1,Math.floor(replay.t*120*.32));const p=replay.pts[i];world.ball.position.set(p[0],p[1],p[2]);world.ball.rotation.x+=dt*3;
    if(replay.t>=replay.dur+.5)endReplay();
  }
  if(cheerT>0){cheerT-=dt;world.kid.g.position.y=cheerT>0?Math.abs(Math.sin(cheerT*11))*.13:0}
  if(ownerT>0){ownerT-=dt;if(ownerT<=0)world.owner.setArm(null)}
  if(phase==='after'){afterT-=dt;if(afterT<=0)afterThrow()}
  if(stall){
    world.queue.forEach(q=>{if(!q.g.visible)return;q.g.position.x+=(q.tx-q.g.position.x)*Math.min(1,dt*6);q.g.position.z+=(q.tz-q.g.position.z)*Math.min(1,dt*6)});
    autoGfx(dt);
  }
  updConfetti(dt);
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}
/* If the stall is running slowly (older iPads), switch to low graphics once, by itself. */
function autoGfx(dt){
  if(PREF.low!==null||!stall)return;const f=stall.fps;f.t+=dt;f.f++;
  if(f.t>=3){if(f.f/f.t<24){PREF.low=true;savePrefs();applyGfx();layoutQueue(false);toast(t('Switched to low graphics to keep it smooth'))}else{PREF.low=PREF.low===null?null:PREF.low;f.t=-1e9}}
}
