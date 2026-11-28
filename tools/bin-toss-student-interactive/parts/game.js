import * as THREE from './three.module.min.js?v=954c1c22';
import {GLTFLoader} from './GLTFLoader.js?v=63b7d938';
import {MeshoptDecoder} from './meshopt_decoder.module.js?v=cd7a7b72';
import {clone as skClone} from './SkeletonUtils.js?v=1bac8aac';
const P=window.BTP,$=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const PRIZE=50,BATCH=10,MIN_DATA=10,MAXQ=28;
const money=v=>(v<0?'−$':'$')+Math.abs(Math.round(v)).toLocaleString('en-AU');
const pct=(a,n)=>n?Math.round(a/n*1000)/10+'%':'–';
const gcd=(a,b)=>b?gcd(b,a%b):a;
const fracH=(a,n)=>{const g=gcd(a,n)||1;return `<span class="fr"><span>${a/g}</span><span>${n/g}</span></span>`};
const queueFor=price=>Math.max(0,Math.round(MAXQ*(1-price/PRIZE)));

/* ---------------- saved state ---------------- */
const STORE='mmt.binTossGame.v1';
const S={spot:null,data:{front:[],middle:[],back:[]},days:[],angle:{front:45,middle:40,back:35},price:10,sound:true,seen:false,char:null};
try{const s=JSON.parse(localStorage.getItem(STORE)||'null');
  if(s&&s.data){for(const k of ['spot','days','price','sound','seen','char'])if(k in s)S[k]=s[k];
    for(const sp of P.SPOTS){if(Array.isArray(s.data[sp.id]))S.data[sp.id]=s.data[sp.id];if(s.angle&&s.angle[sp.id])S.angle[sp.id]=s.angle[sp.id]}
    if(!P.SPOTS.some(x=>x.id===S.spot))S.spot=null}}catch(e){}
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(S))}catch(e){}};
const cnt=id=>{const t=S.data[id]||[],n=t.length,k=t.filter(x=>x.in).length;return{n,in:k,out:n-k,p:n?k/n:0}};

/* ---------------- sound (tiny synth, no files) ---------------- */
let AC=null;
function ac(){if(!S.sound)return null;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();return AC}catch(e){return null}}
function tone(f,d,type,vol,when,slide){const a=ac();if(!a)return;const t=a.currentTime+(when||0),o=a.createOscillator(),g=a.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||.12,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g).connect(a.destination);o.start(t);o.stop(t+d+.02)}
function noiseS(d,vol,freq,when){const a=ac();if(!a)return;const t=a.currentTime+(when||0),n=Math.floor(a.sampleRate*d),buf=a.createBuffer(1,n,a.sampleRate),ch=buf.getChannelData(0);
  for(let i=0;i<n;i++)ch[i]=(Math.random()*2-1)*(1-i/n);
  const src=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();src.buffer=buf;f.type='bandpass';f.frequency.value=freq||900;f.Q.value=.7;g.gain.value=vol||.1;
  src.connect(f).connect(g).connect(a.destination);src.start(t)}
const SFX={
  tick:()=>tone(660,.05,'square',.03),lock:()=>{tone(520,.08,'triangle',.1);tone(780,.1,'triangle',.1,.07)},
  whoosh:()=>noiseS(.28,.16,700),thud:()=>noiseS(.09,.12,220),rim:()=>{tone(300,.12,'triangle',.12,0,180);noiseS(.06,.08,1400)},
  in:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,.16,'triangle',.13,i*.08));noiseS(.2,.06,2400,.05)},
  out:()=>tone(220,.28,'sine',.1,0,150),coin:()=>{tone(1320,.07,'square',.05);tone(1760,.12,'square',.05,.06)},
  pay:()=>{tone(330,.14,'sawtooth',.06,0,220);tone(247,.2,'sawtooth',.06,.12,160)},win:()=>{[392,523,659,784,1047,1319].forEach((f,i)=>tone(f,.2,'triangle',.12,i*.09))}
};

/* ---------------- three.js scene ---------------- */
let renderer,scene,camera;
const canvas=$('c'),stage=$('stage');
const R=P.ROOM;
const M=(color,o)=>new THREE.MeshStandardMaterial(Object.assign({color,roughness:.9,metalness:0,flatShading:true},o||{}));
const box=(w,h,d,mat,x,y,z,o)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);if(!o||o.cast!==false)m.castShadow=true;if(o&&o.recv)m.receiveShadow=true;return m};
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
const world={kid:null,ball:null,bin:null,arrow:null,arc:null,markers:{},trails:[],litter:[],queue:[],confetti:null};

function buildRoom(){
  const g=new THREE.Group();scene.add(g);
  const W=R.x1-R.x0,L=R.z1-R.z0,cz=(R.z0+R.z1)/2;
  // floor: pale timber boards
  const ft=canvasTex(512,512,(c,w,h)=>{c.fillStyle='#d9b98a';c.fillRect(0,0,w,h);
    for(let i=0;i<8;i++){c.fillStyle=['#d4b282','#dcbd90','#cfab79','#d9b98a'][i%4];c.fillRect(i*64,0,64,h);c.fillStyle='rgba(120,80,40,.25)';c.fillRect(i*64,0,2,h);
      for(let j=0;j<3;j++){c.fillRect(i*64,((i*173+j*190)%h),64,2)}}});
  ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.repeat.set(W/2.4,L/2.4);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(W,L),new THREE.MeshStandardMaterial({map:ft,roughness:.95}));
  floor.rotation.x=-Math.PI/2;floor.position.set(0,0,cz);floor.receiveShadow=true;g.add(floor);
  // ceiling + light panels
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(W,L),new THREE.MeshBasicMaterial({color:'#eef2f7'}));ceil.rotation.x=Math.PI/2;ceil.position.set(0,R.h,cz);g.add(ceil);
  const lp=new THREE.MeshBasicMaterial({color:'#ffffff'});
  for(const z of [0.6,3.4,6.2,8.6])for(const x of [-1.6,1.6]){const p=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.5),lp);p.rotation.x=Math.PI/2;p.position.set(x,R.h-.01,z);g.add(p)}
  // walls
  const wall=new THREE.MeshLambertMaterial({color:'#fbf3dd'}),skirt=M('#b7c7de');
  const mk=(w,h,x,y,z,ry)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),wall);m.position.set(x,y,z);m.rotation.y=ry;m.receiveShadow=true;g.add(m);return m};
  mk(W,R.h,0,R.h/2,R.z0,0);mk(W,R.h,0,R.h/2,R.z1,Math.PI);mk(L,R.h,R.x0,R.h/2,cz,Math.PI/2);mk(L,R.h,R.x1,R.h/2,cz,-Math.PI/2);
  g.add(box(W,.12,.03,skirt,0,.06,R.z0+.015,{cast:false}),box(W,.12,.03,skirt,0,.06,R.z1-.015,{cast:false}),box(.03,.12,L,skirt,R.x0+.015,.06,cz,{cast:false}),box(.03,.12,L,skirt,R.x1-.015,.06,cz,{cast:false}));
  // whiteboard on the front wall
  const wb=canvasTex(1024,420,(c,w,h)=>{c.fillStyle='#fdfefe';c.fillRect(0,0,w,h);
    c.fillStyle='#1d4ed8';c.font='900 76px system-ui,sans-serif';c.textAlign='left';c.fillText('School fete stall',44,96);
    c.fillStyle='#b91c1c';c.font='900 64px system-ui,sans-serif';c.fillText('In the bin = win $50!',44,186);
    c.fillStyle='#0f172a';c.font='700 50px system-ui,sans-serif';c.fillText('P(in) = ?',44,290);c.fillText('Cost to play = $ ?',44,362);
    c.strokeStyle='#15803d';c.lineWidth=7;c.setLineDash([18,14]);c.beginPath();c.moveTo(640,370);c.quadraticCurveTo(790,120,930,330);c.stroke();c.setLineDash([]);
    c.fillStyle='#15803d';c.fillRect(900,330,64,58);c.fillStyle='#fff';c.beginPath();c.arc(640,370,16,0,7);c.fill();c.strokeStyle='#64748b';c.lineWidth=4;c.stroke()});
  const board=new THREE.Mesh(new THREE.PlaneGeometry(3.3,1.35),new THREE.MeshBasicMaterial({map:wb}));board.position.set(0,1.62,R.z0+.045);g.add(board);
  g.add(box(3.42,1.47,.04,M('#94a3b8'),0,1.62,R.z0+.01,{cast:false}),box(3.3,.05,.1,M('#cbd5e1'),0,.92,R.z0+.07,{cast:false}));
  // clock + poster
  const ck=canvasTex(256,256,(c)=>{c.fillStyle='#fff';c.beginPath();c.arc(128,128,120,0,7);c.fill();c.lineWidth=12;c.strokeStyle='#1e3a6e';c.stroke();c.fillStyle='#0f172a';
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;c.fillRect(128+Math.sin(a)*98-4,128-Math.cos(a)*98-4,8,8)}
    c.lineCap='round';c.lineWidth=10;c.strokeStyle='#0f172a';c.beginPath();c.moveTo(128,128);c.lineTo(128+38,128-46);c.stroke();c.lineWidth=7;c.beginPath();c.moveTo(128,128);c.lineTo(128-12,128-86);c.stroke()});
  const clock=new THREE.Mesh(new THREE.CircleGeometry(.2,24),new THREE.MeshBasicMaterial({map:ck}));clock.position.set(2.5,2.25,R.z0+.02);g.add(clock);
  const poster=(x,y,z,ry,w,h,col,lines)=>{const t=canvasTex(256,340,(c,W2,H2)=>{c.fillStyle=col;c.fillRect(0,0,W2,H2);c.fillStyle='rgba(255,255,255,.92)';c.fillRect(14,14,W2-28,H2-28);c.fillStyle=col;c.textAlign='center';
      lines.forEach((l,i)=>{c.font=(i?'800 34px':'900 44px')+' system-ui,sans-serif';c.fillText(l,W2/2,84+i*58)})});
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));m.position.set(x,y,z);m.rotation.y=ry;g.add(m)};
  poster(-2.6,1.7,R.z0+.02,0,.7,.93,'#7c3aed',['CHANCE','0 = never','½ = even','1 = certain']);
  poster(R.x0+.02,1.6,1.2,Math.PI/2,.7,.93,'#0e7490',['FAIR TEST','same spot','same ball','same bin']);
  poster(R.x0+.02,1.6,5.2,Math.PI/2,.7,.93,'#b45309',['P(in)','+ P(out)','= 1','']);
  // windows on the right wall (the light comes from here)
  const sky=canvasTex(256,256,(c,w,h)=>{const gr=c.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#7dd3fc');gr.addColorStop(.7,'#e0f2fe');c.fillStyle=gr;c.fillRect(0,0,w,h);
    c.fillStyle='#86efac';c.beginPath();c.ellipse(70,270,130,70,0,0,7);c.fill();c.fillStyle='#4ade80';c.beginPath();c.ellipse(210,280,120,80,0,0,7);c.fill();
    c.fillStyle='#fff';[[60,60,34],[95,52,26],[180,90,28]].forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r,0,7);c.fill()})});
  for(const z of [0.6,3.4,6.2,8.6]){const w=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.25),new THREE.MeshBasicMaterial({map:sky}));w.position.set(R.x1-.02,1.65,z);w.rotation.y=-Math.PI/2;g.add(w);
    const fr=M('#ffffff');g.add(box(.05,1.35,.07,fr,R.x1-.03,1.65,z-.87,{cast:false}),box(.05,1.35,.07,fr,R.x1-.03,1.65,z+.87,{cast:false}),box(.05,.07,1.8,fr,R.x1-.03,2.3,z,{cast:false}),box(.05,.07,1.8,fr,R.x1-.03,1.0,z,{cast:false}),box(.04,1.3,.04,fr,R.x1-.03,1.65,z,{cast:false}))}
  // door on the left wall
  g.add(box(.05,2.05,.95,M('#8b5e3c'),R.x0+.03,1.03,-.7,{cast:false}),box(.07,.05,.05,M('#facc15'),R.x0+.08,1.0,-.38,{cast:false}));
  // pinboard on the back wall
  g.add(box(2.6,1.1,.04,M('#c08457'),0,1.6,R.z1-.03,{cast:false}));
  ['#fca5a5','#fde68a','#86efac','#93c5fd','#c4b5fd','#fdba74','#f9a8d4','#67e8f9'].forEach((c,i)=>g.add(box(.32,.42,.02,M(c),-1.0+(i%4)*.66,1.85-Math.floor(i/4)*.5,R.z1-.06,{cast:false})));
  // desks pushed to the sides for the stall
  const top=M('#e8d3b0'),leg=M('#64748b'),seatC=['#2563eb','#16a34a','#f97316','#7c3aed'];
  const desk=(x,z,i)=>{const d=new THREE.Group();d.add(box(1.1,.05,.6,top,0,.72,0,{recv:true}));
    for(const sx of [-.5,.5])for(const sz of [-.25,.25])d.add(box(.04,.7,.04,leg,sx,.35,sz));
    const sm=M(seatC[i%4]);const side=x<0?1:-1;
    d.add(box(.4,.04,.4,sm,0,.44,side*.55),box(.4,.42,.04,sm,0,.68,side*.74));for(const sx of [-.17,.17])for(const sz of [.38,.72])d.add(box(.03,.44,.03,leg,sx,.22,side*sz));
    d.position.set(x,0,z);d.rotation.y=Math.PI/2;g.add(d)};
  [0.9,2.4,3.9,5.4,6.9,8.4].forEach((z,i)=>{desk(-3.0,z,i);desk(3.0,z,i+2)});
  // teacher's desk, books, plant
  const td=new THREE.Group();td.add(box(1.5,.06,.7,M('#a16207'),0,.76,0,{recv:true}),box(1.4,.6,.04,M('#854d0e'),0,.42,-.3),box(.05,.74,.6,M('#854d0e'),-.7,.37,0),box(.05,.74,.6,M('#854d0e'),.7,.37,0));
  td.add(box(.3,.05,.22,M('#dc2626'),-.4,.815,.05),box(.28,.05,.2,M('#2563eb'),-.4,.865,.05),box(.34,.24,.03,M('#1e293b'),.3,.92,-.1),box(.16,.02,.12,M('#475569'),.3,.8,-.02));
  td.position.set(-2.3,0,-.9);g.add(td);
  const plant=new THREE.Group();plant.add(new THREE.Mesh(new THREE.CylinderGeometry(.16,.12,.3,8),M('#c2410c')));plant.children[0].position.y=.15;
  for(let i=0;i<5;i++){const lf=new THREE.Mesh(new THREE.ConeGeometry(.1,.55,5),M('#16a34a'));lf.position.set(Math.sin(i*1.26)*.1,.55,Math.cos(i*1.26)*.1);lf.rotation.set(Math.cos(i*1.26)*.5,0,-Math.sin(i*1.26)*.5);lf.castShadow=true;plant.add(lf)}
  plant.position.set(2.9,0,-1.2);g.add(plant);
  // bookshelf in the back corner
  const bs=new THREE.Group();bs.add(box(1.2,1.1,.3,M('#b08968'),0,.55,0));
  ['#ef4444','#3b82f6','#22c55e','#eab308','#a855f7','#f97316','#14b8a6','#ec4899'].forEach((c,i)=>bs.add(box(.09,.26,.2,M(c),-.42+i*.12,.38+(i%2)*.36,.07)));
  bs.position.set(-2.7,0,R.z1-.25);g.add(bs);
  // metre strip down the aisle
  const strip=canvasTex(128,2048,(c,w,h)=>{c.clearRect(0,0,w,h);const pm=h/7;c.fillStyle='rgba(255,255,255,.75)';c.fillRect(54,0,20,h);
    for(let m=0;m<=7;m++){const y=h-m*pm;c.fillStyle='#1e3a6e';c.fillRect(34,clamp(y-4,0,h-8),60,8);if(m&&m<7){c.font='900 44px system-ui,sans-serif';c.textAlign='center';c.save();c.translate(104,y+16);c.fillText('',0,0);c.restore()}}
    for(let m=0;m<70;m++){if(m%10)c.fillRect(48,h-m*pm/10-1,32,3)}});
  const st=new THREE.Mesh(new THREE.PlaneGeometry(.22,7),new THREE.MeshBasicMaterial({map:strip,transparent:true,depthWrite:false}));st.rotation.x=-Math.PI/2;st.position.set(-.75,.004,3.5);g.add(st);
  for(let m=1;m<=6;m++){const t=canvasTex(128,64,(c)=>{c.font='900 44px system-ui,sans-serif';c.textAlign='center';c.fillStyle='#1e3a6e';c.fillText(m+' m',64,48)});
    const l=new THREE.Mesh(new THREE.PlaneGeometry(.4,.2),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));l.rotation.x=-Math.PI/2;l.position.set(-1.08,.005,m);g.add(l)}
}
function buildBin(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(P.R,P.RB,P.H,20,1,true),new THREE.MeshStandardMaterial({color:'#16a34a',roughness:.6,side:THREE.DoubleSide}));body.position.y=P.H/2;body.castShadow=true;
  const base=new THREE.Mesh(new THREE.CircleGeometry(P.RB,20),M('#14532d',{flatShading:false}));base.rotation.x=-Math.PI/2;base.position.y=.012;
  const rim=new THREE.Mesh(new THREE.TorusGeometry(P.R,.014,8,28),M('#14532d',{flatShading:false}));rim.rotation.x=Math.PI/2;rim.position.y=P.H;
  const band=new THREE.Mesh(new THREE.CylinderGeometry(P.R*.985+.003,P.R*.95+.003,.07,20,1,true),M('#15803d',{flatShading:false}));band.position.y=P.H-.1;
  g.add(body,base,rim,band);scene.add(g);world.bin=g;
}
function makeKid(shirt,o){
  o=o||{};const g=new THREE.Group(),sm=M(shirt),skin=M(o.skin||'#f1c9a5'),hair=M(o.hair||'#3f2d20'),pants=M('#1e293b');
  g.add(box(.13,.62,.15,pants,-.09,.31,0),box(.13,.62,.15,pants,.09,.31,0),box(.15,.06,.22,M('#f8fafc'),-.09,.03,-.03),box(.15,.06,.22,M('#f8fafc'),.09,.03,-.03));
  const torso=box(.38,.5,.22,sm,0,.87,0);g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.15,10,8),skin);head.position.set(0,1.29,0);head.castShadow=true;g.add(head);
  const hr=new THREE.Mesh(new THREE.SphereGeometry(.158,10,8,0,Math.PI*2,0,Math.PI*.55),hair);hr.position.set(0,1.3,.012);g.add(hr);
  g.add(box(.09,.4,.1,sm,-.235,.88,0));
  const arm=new THREE.Group();arm.position.set(P.REL.x,1.0,.12);
  arm.add(box(.09,.32,.1,sm,0,-.14,0));const hand=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),skin);hand.position.y=-.32;arm.add(hand);
  g.add(arm);arm.rotation.x=3.3;
  return {g,arm,sm,torso};
}
function makeBallMesh(){
  const geo=new THREE.IcosahedronGeometry(P.BR,1),pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){const k=.82+Math.random()*.3;pos.setXYZ(i,pos.getX(i)*k,pos.getY(i)*k,pos.getZ(i)*k)}
  geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,flatShading:true}));m.castShadow=true;return m;
}
function buildMarkers(){
  for(const s of P.SPOTS){
    const g=new THREE.Group();
    const t=canvasTex(256,256,(c)=>{c.clearRect(0,0,256,256);c.fillStyle='#f97316';c.beginPath();c.arc(128,128,120,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(128,128,100,0,7);c.fill();
      c.fillStyle='#c2410c';c.textAlign='center';c.font='900 78px system-ui,sans-serif';c.fillText(s.d+' m',128,128);c.font='900 40px system-ui,sans-serif';c.fillText(s.short.toUpperCase(),128,182)});
    const disc=new THREE.Mesh(new THREE.CircleGeometry(.42,28),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));disc.rotation.x=-Math.PI/2;disc.rotation.z=0;disc.position.y=.012;
    const tape=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.07),new THREE.MeshBasicMaterial({color:'#f97316'}));tape.rotation.x=-Math.PI/2;tape.position.set(0,.01,-.22);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.46,.56,32),new THREE.MeshBasicMaterial({color:'#2563eb',transparent:true,opacity:0,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.014;
    g.add(tape,disc,ring);g.position.set(.9,0,s.d);scene.add(g);disc.userData.spot=s.id;world.markers[s.id]={g,disc,ring,tape};
    tape.position.x=-.9;                                    // the tape sits across the aisle at the throw line
  }
}
function buildAim(){
  const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:'#f97316'});
  const sh=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.62,8),mat);sh.position.y=.31;
  const hd=new THREE.Mesh(new THREE.ConeGeometry(.05,.16,10),mat);hd.position.y=.7;g.add(sh,hd);scene.add(g);world.arrow=g;
  const arc=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:'#1d4ed8'}));scene.add(arc);world.arc=arc;
  const base=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color:'#1d4ed8',dashSize:.05,gapSize:.04}));scene.add(base);world.baseLine=base;
}
function buildConfetti(){
  const N=90,m=new THREE.InstancedMesh(new THREE.PlaneGeometry(.045,.03),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),N);
  const cols=['#f97316','#2563eb','#22c55e','#facc15','#ec4899','#a855f7'],c=new THREE.Color();
  for(let i=0;i<N;i++)m.setColorAt(i,c.set(cols[i%cols.length]));
  m.count=0;m.frustumCulled=false;scene.add(m);world.confetti={m,p:[],N};
}
function burst(){
  const c=world.confetti;c.p=[];for(let i=0;i<c.N;i++){const a=Math.random()*Math.PI*2,s=.6+Math.random()*1.6;
    c.p.push({x:0,y:P.H+.05,z:0,vx:Math.cos(a)*s,vy:2.2+Math.random()*2.4,vz:Math.sin(a)*s,r:Math.random()*6,w:(Math.random()-.5)*14,life:1.6+Math.random()*.8})}
  c.m.count=c.N;
}
const dummy=new THREE.Object3D();
function updConfetti(dt){
  const c=world.confetti;if(!c.m.count)return;let alive=0;
  c.p.forEach((p,i)=>{p.life-=dt;p.vy-=5.5*dt;p.vx*=1-1.2*dt;p.vz*=1-1.2*dt;p.x+=p.vx*dt;p.y=Math.max(.01,p.y+p.vy*dt);p.z+=p.vz*dt;p.r+=p.w*dt;
    dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.r,p.r*.7,p.r*.3);const s=p.life>0?1:0;dummy.scale.setScalar(s);dummy.updateMatrix();c.m.setMatrixAt(i,dummy.matrix);if(p.life>0)alive++});
  c.m.instanceMatrix.needsUpdate=true;if(!alive)c.m.count=0;
}
const QCOL=['#ef4444','#f59e0b','#10b981','#06b6d4','#8b5cf6','#ec4899','#84cc16','#f97316','#14b8a6','#6366f1','#e11d48','#0ea5e9'];
const SKIN=['#f1c9a5','#e0ac69','#c68642','#8d5524','#ffdbac','#d9a066'],HAIR=['#3f2d20','#111827','#7c4a1e','#d4a017','#4b2e83','#a8552a'];

/* ---------------- characters from Mills Maths Adventure ----------------
   All 21 models share one 24-bone skeleton (Hips, Spine…, RightArm, RightForeArm, RightHand…) but none has a throwing clip.
   So the throw is made in code: the arm bones are AIMED at directions for each moment of the throw (hold, wind up, release,
   follow through). One set of directions works for every character, whatever its size or shape. */
const CHARS=[
  {id:'main1',name:'Explorer',grp:'Students'},{id:'main2',name:'Cool Cat',grp:'Students'},{id:'main3',name:'DJ Goat',grp:'Students'},
  {id:'pip',name:'Pip',grp:'Number Island'},{id:'fern',name:'Fern',grp:'Number Island'},{id:'alby',name:'Alby',grp:'Number Island'},{id:'pete',name:'Pete',grp:'Number Island'},
  {id:'mills',name:'Mr. Mills',grp:'Staff'},{id:'pearce',name:'Mr. Pearce',grp:'Staff'},{id:'mahoney',name:'Ms. Mahoney',grp:'Staff'},{id:'ewings',name:'Ms. Ewings',grp:'Staff'},
  {id:'dawson',name:'Mr. Dawson',grp:'Staff'},{id:'heywood',name:'Mr. Heywood',grp:'Staff'},{id:'morgan',name:'Mr. Morgan',grp:'Staff'},{id:'bacon',name:'Ms. Bacon',grp:'Staff'},{id:'brookes',name:'Ms. Brookes',grp:'Staff'},
  {id:'farmer',name:'Sunny',grp:'Fraction Farm'},{id:'farmer1',name:'The Milkman',grp:'Fraction Farm'},{id:'trevor',name:'Trevor',grp:'Fraction Farm'},{id:'steve',name:'Steve',grp:'Fraction Farm'},{id:'robot',name:'Robot',grp:'Fraction Farm'}
];
const CHAR_URL='../../../../../game-platforms/mills-maths-adventure/models/characters/';
const charName=id=>(CHARS.find(c=>c.id===id)||{name:''}).name;
const gltf=new GLTFLoader();gltf.setMeshoptDecoder(MeshoptDecoder);
const modelCache={};
function loadModel(id){
  return modelCache[id]||(modelCache[id]=gltf.loadAsync(CHAR_URL+id+'.glb').then(g=>{
    const sc=g.scene;sc.updateMatrixWorld(true);const bx=new THREE.Box3().setFromObject(sc),h=bx.max.y-bx.min.y;let sh=h*.7;
    sc.traverse(o=>{if(o.isBone&&o.name==='RightArm'){const v=new THREE.Vector3();o.getWorldPosition(v);sh=v.y-bx.min.y}});
    return {scene:sc,scale:clamp(1.05/sh,1.25/h,1.5/h),minY:bx.min.y};         // shoulders near 1.05 m; between 1.25 m and 1.5 m tall
  }).catch(e=>{delete modelCache[id];throw e}));
}
function makeActor(m){
  const root=new THREE.Group(),inner=skClone(m.scene);inner.rotation.y=Math.PI;inner.scale.setScalar(m.scale);inner.position.y=-m.minY*m.scale;root.add(inner);
  const B={};inner.traverse(o=>{if(o.isBone)B[o.name]=o;if(o.isMesh){o.castShadow=true;o.frustumCulled=false}});
  const bind={};for(const n of ['RightArm','RightForeArm','LeftArm','LeftForeArm','Spine','Spine01','Spine02'])if(B[n])bind[n]=B[n].quaternion.clone();
  const low=B.Hips?B.Hips.children.find(c=>c.isBone&&/^Spine/.test(c.name)):null;
  return {root,B,bind,low};
}
// directions in the thrower's own frame: +x right, +y up, -z forward
const POSE={hold:{U:[.5,-.35,.2],F:[.05,.95,-.3],lean:0},wind:{U:[.45,.05,.8],F:[.1,.75,.65],lean:.2},rel:{U:[.2,.6,-.75],F:[.02,.8,-.6],lean:-.1},fol:{U:[.05,-.2,-.95],F:[-.15,-.6,-.75],lean:-.28}};
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_d=new THREE.Vector3(),_t=new THREE.Vector3(),_q=new THREE.Quaternion(),_qw=new THREE.Quaternion(),_qp=new THREE.Quaternion(),_qr=new THREE.Quaternion();
function turnWorld(bone,q){bone.getWorldQuaternion(_qw);bone.parent.getWorldQuaternion(_qp);bone.quaternion.copy(_qp.invert().multiply(_q.copy(q).multiply(_qw)))}
function aimBone(bone,child,dir){if(!bone||!child)return;bone.updateWorldMatrix(true,true);_a.setFromMatrixPosition(bone.matrixWorld);_b.setFromMatrixPosition(child.matrixWorld);
  _d.subVectors(_b,_a).normalize();turnWorld(bone,_qr.setFromUnitVectors(_d,dir))}
function poseActor(a,x){
  for(const n in a.bind)a.B[n].quaternion.copy(a.bind[n]);
  if(x==null){a.root.updateMatrixWorld(true);return}
  let A,Bk,t;if(x>=3.3){A=POSE.hold;Bk=POSE.wind;t=(x-3.3)/.4}else if(x>=2.786){A=POSE.rel;Bk=POSE.hold;t=(x-2.786)/.514}else{A=POSE.rel;Bk=POSE.fol;t=(2.786-x)/1.086}
  t=clamp(t,0,1);a.root.updateWorldMatrix(true,false);a.root.getWorldQuaternion(_qp);const rq=_qp.clone();
  const lean=A.lean+(Bk.lean-A.lean)*t;
  if(a.low&&lean){_t.set(1,0,0).applyQuaternion(rq);turnWorld(a.low,_qr.setFromAxisAngle(_t,lean))}
  const dir=(u,v)=>_t.set(u[0]+(v[0]-u[0])*t,u[1]+(v[1]-u[1])*t,u[2]+(v[2]-u[2])*t).normalize().applyQuaternion(rq);
  aimBone(a.B.RightArm,a.B.RightForeArm,dir(A.U,Bk.U).clone());aimBone(a.B.RightForeArm,a.B.RightHand,dir(A.F,Bk.F).clone());
  a.root.updateMatrixWorld(true);
}
// a winner throws both arms up
const CHEER={RU:[.4,.9,-.1],RF:[.12,1,-.1],LU:[-.4,.9,-.1],LF:[-.12,1,-.1]};
function poseCheer(a){
  for(const n in a.bind)a.B[n].quaternion.copy(a.bind[n]);
  a.root.updateWorldMatrix(true,false);a.root.getWorldQuaternion(_qp);const rq=_qp.clone(),d=v=>new THREE.Vector3(v[0],v[1],v[2]).normalize().applyQuaternion(rq);
  if(a.low){_t.set(1,0,0).applyQuaternion(rq);turnWorld(a.low,_qr.setFromAxisAngle(_t,.1))}
  aimBone(a.B.RightArm,a.B.RightForeArm,d(CHEER.RU));aimBone(a.B.RightForeArm,a.B.RightHand,d(CHEER.RF));
  aimBone(a.B.LeftArm,a.B.LeftForeArm,d(CHEER.LU));aimBone(a.B.LeftForeArm,a.B.LeftHand,d(CHEER.LF));a.root.updateMatrixWorld(true);
}
/* A figure on the floor: one of the Adventure characters, or the simple block kid until its model has loaded (or if it can't). */
class Fig{
  constructor(shirt,o){this.g=new THREE.Group();this.box=makeKid(shirt,o);this.g.add(this.box.g);this.actors={};this.actor=null;this.id=null;this.armX=3.3;scene.add(this.g)}
  use(id){this.id=id||null;if(!id){this.swap(null);return Promise.resolve()}
    if(this.actors[id]){this.swap(this.actors[id]);return Promise.resolve()}
    return loadModel(id).then(m=>{if(!this.actors[id])this.actors[id]=makeActor(m);if(this.id===id)this.swap(this.actors[id])}).catch(e=>{console.warn('character',id,e);if(this.id===id)this.swap(null)})}
  swap(a){if(this.actor&&this.actor!==a)this.g.remove(this.actor.root);this.actor=a;this.box.g.visible=!a;if(a){this.g.add(a.root);this.setArm(this.armX)}}
  tint(c){this.box.sm.color.set(c)}
  cheer(){this.box.arm.rotation.x=3.05;if(this.actor)poseCheer(this.actor)}
  setArm(x){this.armX=x;this.box.arm.rotation.x=x==null?0:x;if(this.actor)poseActor(this.actor,x)}
  hand(out){this.g.updateMatrixWorld(true);
    if(this.actor&&this.actor.B.RightHand){const B=this.actor.B;out.setFromMatrixPosition(B.RightHand.matrixWorld);if(B.RightForeArm){_a.setFromMatrixPosition(B.RightForeArm.matrixWorld);_d.subVectors(out,_a).normalize();out.addScaledVector(_d,.07)}return out}
    out.set(0,-.36,0);return this.box.arm.localToWorld(out)}
}
function buildQueue(){for(let i=0;i<9;i++){const k=new Fig(QCOL[i%QCOL.length],{skin:SKIN[i%6],hair:HAIR[(i*5)%6]});k.setArm(null);k.g.visible=false;world.queue.push(k)}}

function initScene(){
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();scene.background=new THREE.Color('#dbeafe');
  camera=new THREE.PerspectiveCamera(50,1,.1,40);
  scene.add(new THREE.HemisphereLight('#ffffff','#f3e6c8',1.5));
  scene.add(new THREE.AmbientLight('#ffffff',.75));
  const sun=new THREE.DirectionalLight('#fff7e6',1.25);sun.position.set(5.5,5.5,6.5);sun.target.position.set(0,0,3);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);const sc=sun.shadow.camera;sc.left=-7;sc.right=7;sc.top=8;sc.bottom=-8;sc.near=.5;sc.far=20;sun.shadow.bias=-.0006;sun.shadow.radius=4;
  scene.add(sun,sun.target);
  buildRoom();buildBin();buildMarkers();buildAim();buildConfetti();buildQueue();
  world.kid=new Fig('#2563eb');if(S.char)world.kid.use(S.char);
  world.ball=makeBallMesh();scene.add(world.ball);
  resize();window.addEventListener('resize',resize);
}
function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<.8?70:w/h<1.25?60:50;camera.updateProjectionMatrix()}

/* ---------------- camera rig ---------------- */
const cam={pos:new THREE.Vector3(3,2.6,9),tgt:new THREE.Vector3(0,.8,2),gp:new THREE.Vector3(3,2.6,9),gt:new THREE.Vector3(0,.8,2),sway:0};
function camTo(p,t,snap){cam.gp.set(...p);cam.gt.set(...t);if(snap){cam.pos.copy(cam.gp);cam.tgt.copy(cam.gt)}}
function camFor(mode){
  const d=S.spot?P.spot(S.spot).d:4,narrow=camera.aspect<.8;
  if(mode==='overview')camTo([2.6,2.5,9.2],[-.2,.6,2.6]);
  else if(mode==='throw')camTo(narrow?[.9,2.15,d+3.1]:[1.45,2.05,d+2.9],[narrow?.1:-.35,.55,d-3]);
  else if(mode==='stall')camTo(narrow?[1.6,3.0,d+3.4]:[2.7,2.75,d+3.3],[-.7,.5,d-2.4]);
}

/* ---------------- game state (not saved) ---------------- */
let cheerT=0;
let phase='load',batchLeft=0,angle=45,bandNow=null,power=0,meterT=0,sim=null,simAcc=0,timeScale=1,trail=null,firstEv=null,armT=0,stall=null,afterT=0,customerKid=null;
const curSpot=()=>P.spot(S.spot);

function setAngle(a,quiet){
  angle=clamp(Math.round(a),P.ANGLE.min,P.ANGLE.max);if(S.spot)S.angle[S.spot]=angle;
  const f=(angle-P.ANGLE.min)/(P.ANGLE.max-P.ANGLE.min);
  $('angRead').textContent=angle;$('angThumb').style.bottom=f*100+'%';$('angFill').style.height=f*100+'%';$('angTrack').setAttribute('aria-valuenow',angle);
  bandNow=S.spot?P.band(S.spot,angle):null;drawZone();aimArrow();if(!quiet)SFX.tick();
}
function drawZone(){
  const z=$('zone'),zl=$('zoneL'),nt=$('zoneNote');
  if(bandNow){z.hidden=false;zl.hidden=false;z.style.bottom=bandNow.lo+'%';z.style.height=Math.max(1.6,bandNow.w)+'%';zl.style.bottom=bandNow.mid+'%';nt.className='zoneNote';nt.textContent=phase==='power'?'Stop it in the green':'Green = it goes in'}
  else{z.hidden=true;zl.hidden=true;nt.className='noZone';nt.textContent='No sweet spot at this angle'}
}
function aimArrow(){
  if(!S.spot){world.arrow.visible=world.arc.visible=world.baseLine.visible=false;return}
  const d=curSpot().d,a=angle*Math.PI/180,yaw=Math.atan2(-P.REL.x,-d),dir=new THREE.Vector3(Math.cos(a)*Math.sin(yaw),Math.sin(a),Math.cos(a)*Math.cos(yaw));
  const o=new THREE.Vector3(P.REL.x,P.REL.y,d);
  world.arrow.position.copy(o);world.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
  const pts=[];for(let i=0;i<=20;i++){const t=a*i/20;pts.push(new THREE.Vector3(o.x+.34*Math.cos(t)*Math.sin(yaw),o.y+.34*Math.sin(t),o.z+.34*Math.cos(t)*Math.cos(yaw)))}
  world.arc.geometry.setFromPoints(pts);
  world.baseLine.geometry.setFromPoints([o,new THREE.Vector3(o.x+.8*Math.sin(yaw),o.y,o.z+.8*Math.cos(yaw))]);world.baseLine.computeLineDistances();
  const show=phase==='aim'||phase==='power';world.arrow.visible=world.arc.visible=world.baseLine.visible=show;
}
function placeKid(){
  const d=curSpot().d;world.kid.g.position.set(0,0,d);world.kid.g.visible=true;world.kid.setArm(3.3);holdBall();
  for(const s of P.SPOTS){world.markers[s.id].g.visible=true;world.markers[s.id].disc.visible=s.id!==S.spot;world.markers[s.id].ring.material.opacity=0}
}
const handPos=new THREE.Vector3();
function holdBall(){world.kid.hand(handPos);world.ball.position.copy(handPos);world.ball.visible=true}
function clearThrows(){for(const t of world.trails)scene.remove(t);world.trails=[];for(const l of world.litter)scene.remove(l);world.litter=[]}

/* ---------------- HUD ---------------- */
function show(id,on){$(id).hidden=!on}
function hint(t){const h=$('hint');if(t){h.textContent=t;h.hidden=false}else h.hidden=true}
function pop(html,ms){const p=$('pop');p.innerHTML=html;clearTimeout(pop.t);pop.t=setTimeout(()=>{p.innerHTML=''},ms||1300)}
function renderStatus(){
  const el=$('statusCard');if(!S.spot){show('status',false);return}
  const s=curSpot(),c=cnt(S.spot);
  if(stall){
    const d=stall;el.innerHTML=`<div class="stTop"><span class="chip money">Stall open</span><span class="stSpot">${s.name}</span></div>
      <div class="qRow"><span>Cost to play <b>${money(d.price)}</b> · Prize <b>$50</b></span></div>
      <div class="qRow"><span>Customer <b>${Math.min(d.i+(phase==='day'?0:1),d.n)}</b> of <b>${d.n}</b></span><span>Winners <b>${d.wins}</b></span></div>
      <div class="moneyG"><div class="cnt"><small>Collected</small><b>${money(d.i*d.price)}</b></div><div class="cnt"><small>Paid out</small><b>${money(d.wins*PRIZE)}</b></div>
      <div class="cnt wide"><small>Profit</small><b class="${d.i*d.price-d.wins*PRIZE>0?'pos':d.i*d.price-d.wins*PRIZE<0?'neg':''}">${money(d.i*d.price-d.wins*PRIZE)}</b></div></div>`;
    show('status',true);return}
  const t=S.data[S.spot],start=Math.max(0,t.length-(BATCH-batchLeft)-(t.length%BATCH===0&&batchLeft===0?BATCH:0));
  const dots=t.map((x,i)=>`<i class="${x.in?'in':'out'}" title="Throw ${i+1}: ${x.in?'in':'out'}"></i>`).join('')+(batchLeft>0?'<i class="now"></i>'+'<i></i>'.repeat(batchLeft-1):'');
  el.innerHTML=`<div class="stTop"><span class="chip">Practice</span><span class="stSpot">${s.name} · ${s.d} m</span></div>
    <div class="stThrow">${batchLeft>0?`Throw ${c.n+1} of ${c.n+batchLeft}`:`${c.n} throws`}</div><div class="dots">${dots}</div>
    <div class="counts"><div class="cnt in"><small>In ✓</small><b>${c.in}</b></div><div class="cnt out"><small>Out ✗</small><b>${c.out}</b></div>
      <div class="cnt p"><small>Chance of in</small><b>${c.n?`${c.in}/${c.n} <span>= ${pct(c.in,c.n)}</span>`:'–'}</b></div></div>
    <div class="stLinks"><button class="lnk" data-act="spots">Change spot</button>${c.n>=MIN_DATA?'<button class="lnk go" data-act="toPrice">Open the stall ›</button>':''}</div>`;
  show('status',true);
}
function setCtl(){
  const aim=phase==='aim',pw=phase==='power';
  $('ctlAngle').className='ctl '+(aim?'on':'off');$('ctlPower').className='ctl '+(pw?'on':'off');
  $('pill1').className=aim?'on':'done';$('pill2').className=pw?'on':'';
  const b=$('actBtn');b.disabled=!(aim||pw);b.className='bigBtn'+(pw?' throw':'');b.innerHTML=pw?'THROW! <kbd>Space</kbd>':'Lock in angle <kbd>Space</kbd>';
  $('unlockBtn').hidden=!pw;drawZone();
}

/* ---------------- panels ---------------- */
const veil=$('veil');
function panel(html,o){veil.className=o&&o.clear?'clear':'';veil.innerHTML=`<div class="panel ${o&&o.wide?'wide':''}" role="dialog" aria-modal="true">${html}</div>`;veil.hidden=false;const f=veil.querySelector('[data-focus]');if(f)setTimeout(()=>f.focus(),60)}
function closePanel(){veil.hidden=true;veil.innerHTML=''}
const PRIZE_SVG=`<svg viewBox="0 0 230 120" aria-hidden="true"><rect x="3" y="3" width="224" height="114" rx="12" fill="#fde68a" stroke="#b45309" stroke-width="3"/><rect x="13" y="13" width="204" height="94" rx="8" fill="none" stroke="#d97706" stroke-width="2" stroke-dasharray="5 4"/><circle cx="60" cy="60" r="30" fill="#fbbf24" stroke="#b45309" stroke-width="2.5"/><text x="60" y="71" text-anchor="middle" font-size="30" font-weight="900" fill="#92400e" font-family="system-ui,sans-serif">$</text><text x="152" y="66" text-anchor="middle" font-size="44" font-weight="900" fill="#78350f" font-family="system-ui,sans-serif">$50</text><text x="152" y="92" text-anchor="middle" font-size="16" font-weight="900" letter-spacing="4" fill="#92400e" font-family="system-ui,sans-serif">PRIZE</text></svg>`;
function introPanel(){
  phase='intro';hideGame();camFor('overview');
  panel(`<div class="prizeRow">${PRIZE_SVG}<div><div class="eyebrow">School fete</div><h2>You’re running the bin toss stall</h2></div></div>
    <p style="margin-top:12px">Anyone who throws the paper ball <b>into the bin</b> wins <b>$50</b>. Your job: choose a <b>cost to play</b> so the stall makes money.</p>
    <div class="steps3"><div><b><i>1</i>Practise</b>Pick a spot and throw. Every throw is data: in or out.</div>
      <div><b><i>2</i>Set your price</b>Use your data to work out how often people will win.</div>
      <div><b><i>3</i>Open the stall</b>Customers line up. Count the money. Did you make a profit?</div></div>
    <div class="pBtns"><button class="pb main" data-act="${S.char?'spots':'chars'}" data-focus>${hasData()?'Keep going ›':'Let’s go ›'}</button></div>`);
}
const hasData=()=>P.SPOTS.some(s=>S.data[s.id].length);
function spotPanel(){
  phase='spot';stall=null;hideGame();camFor('overview');for(const s of P.SPOTS){const m=world.markers[s.id];m.g.visible=true;m.disc.visible=true}
  panel(`<div class="eyebrow">Choose your spot</div><h2>Where will people throw from?</h2>
    <div class="spotCards">${P.SPOTS.map(s=>{const c=cnt(s.id);return `<button class="spotCard" data-act="pick" data-v="${s.id}"><div class="m">${s.d} <small>metres</small></div><b>${s.name}</b>
      <span class="${c.n?'has':''}">${c.n?`Your data: ${c.in} in out of ${c.n} (${pct(c.in,c.n)})`:'No throws yet'}</span></button>`}).join('')}</div>
    <p style="margin:12px 0 0;font-size:.88rem;color:#64748b">You can also tap an orange marker on the floor. Each spot keeps its own data. <button class="lnk" data-act="chars" style="margin-left:6px">Change character${S.char?': '+esc(charName(S.char)):''}</button></p>`,{clear:true});
}
function resultsPanel(){
  phase='results';show('controls',false);hint('');world.arrow.visible=world.arc.visible=world.baseLine.visible=false;
  const c=cnt(S.spot),s=curSpot(),dec=Math.round(c.p*1000)/1000;
  const rows=P.SPOTS.map(x=>{const k=cnt(x.id);return `<tr class="${x.id===S.spot?'cur':''}"><td>${x.name} (${x.d} m)</td><td class="r">${k.n?k.in:'–'}</td><td class="r">${k.n||'–'}</td><td class="r">${k.n?pct(k.in,k.n):'–'}</td></tr>`}).join('');
  panel(`<div class="eyebrow">Your data · ${s.name}</div>
    <div class="bigFrac"><div class="n">${c.in} <small>in out of</small> ${c.n}</div>
      <div class="eq">P(in) ≈ ${fracH(c.in,c.n)} = ${dec} = ${pct(c.in,c.n)}</div></div>
    <p>This is your <b>estimate</b> of the chance that a throw from here goes in. ${c.n<30?'More throws give a better estimate.':'That’s a solid amount of data.'}</p>
    <table class="tb"><thead><tr><th>Spot</th><th class="r">In</th><th class="r">Throws</th><th class="r">P(in)</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="pBtns"><button class="pb main" data-act="toPrice" data-focus>Set my price ›</button><button class="pb" data-act="more">Throw ${BATCH} more</button><button class="pb" data-act="spots">Change spot</button></div>`);
}
function queueH(n){let h='';for(let i=0;i<n;i++)h+=`<i style="--c:${QCOL[i%QCOL.length]}"></i>`;return h}
function pricePanel(){
  phase='price';stall=null;stallPool();show('controls',false);show('skip',false);hint('');camFor('stall');renderStatus();
  const c=cnt(S.spot),s=curSpot();
  panel(`<div class="eyebrow">Open the stall · ${s.name}</div><h2>How much will you charge to play?</h2>
    <p>Your data from here: <b>${c.in} in out of ${c.n}</b> (${pct(c.in,c.n)}). Your customers throw about as well as you. Every winner costs you <b>$50</b>.</p>
    <div class="priceRow"><button class="stepper" data-act="price" data-v="-1" aria-label="Cheaper">−</button><div class="priceBig" id="priceBig"></div><button class="stepper" data-act="price" data-v="1" aria-label="Dearer">+</button>
      <input class="hr" type="range" id="priceIn" min="1" max="49" step="1" value="${S.price}" aria-label="Cost to play in dollars"></div>
    <div class="qRow" style="margin-top:2px"><span>In the queue: <b class="qCount" id="qCount"></b></span><span>The dearer it is, the shorter the queue</span></div>
    <div class="queue" id="queueIcons"></div>
    <div class="predRow"><label for="predIn">I expect about</label><input id="predIn" inputmode="numeric" maxlength="2" placeholder="?" aria-label="How many winners do you expect?"><span>winners</span><small>(optional: check your thinking)</small></div>
    <div class="pBtns"><button class="pb main" data-act="open" data-focus>Open the stall ›</button><button class="pb" data-act="more">More practice</button><button class="pb" data-act="spots">Change spot</button></div>`);
  paintPrice();
}
function paintPrice(){const n=queueFor(S.price);$('priceBig').textContent='$'+S.price;$('qCount').textContent=n+(n===1?' person':' people');$('queueIcons').innerHTML=queueH(n);$('priceIn').value=S.price}
function starsH(p){const k=p>=150?3:p>=75?2:p>0?1:0;return `<div class="stars" title="${k} star${k===1?'':'s'}"><b>${'★'.repeat(k)}</b>${'★'.repeat(3-k)}</div>`}
function logH(){
  if(!S.days.length)return '<p style="margin:8px 0 0">No stall days yet.</p>';
  let N=0,Wn=0;const rows=S.days.map((d,i)=>{N+=d.n;Wn+=d.wins;return `<tr><td>${i+1}</td><td>${P.spot(d.spot).short}</td><td class="r">${money(d.price)}</td><td class="r">${d.n}</td><td class="r">${d.wins}</td><td class="r ${d.profit>0?'pos':d.profit<0?'neg':''}"><b>${money(d.profit)}</b></td></tr>`}).join('');
  return `<table class="tb"><thead><tr><th>Day</th><th>Spot</th><th class="r">Cost</th><th class="r">Players</th><th class="r">Winners</th><th class="r">Profit</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function dayPanel(){
  phase='day';show('skip',false);const d=stall,c=cnt(d.spot),col=d.n*d.price,paid=d.wins*PRIZE,pr=col-paid,be=c.p*PRIZE,exp=c.p*d.n;
  const day={spot:d.spot,price:d.price,n:d.n,wins:d.wins,profit:pr};S.days.push(day);save();renderStatus();
  const best=Math.max(...S.days.map(x=>x.profit)),isBest=pr===best&&S.days.length>1&&pr>0;
  const sameSpot=S.days.filter(x=>x.spot===d.spot),cn=sameSpot.reduce((a,x)=>a+x.n,0),cw=sameSpot.reduce((a,x)=>a+x.wins,0);
  const expTxt=Math.round(exp*10)/10;
  let verdict;
  if(d.price<be-.5)verdict=`You charged <b>${money(d.price)}</b>, which is <b>below</b> break-even. Each player costs you about ${money(be)} in prizes, so in the long run this price loses money${pr>0?', even though today went your way':''}.`;
  else if(d.price>be+.5)verdict=`You charged <b>${money(d.price)}</b>, which is <b>above</b> break-even, so you expect a profit${pr<0?'. Today chance went against you: with only '+d.n+' players, that can happen':''}.`;
  else verdict=`You charged almost exactly the break-even price, so you expect to make about $0. Chance decides the rest.`;
  const pred=d.pred!=null?`<br>You predicted <b>${d.pred}</b> winner${d.pred===1?'':'s'}.`:'';
  if(pr>0)SFX.win();
  panel(`<div class="dayHead"><div><div class="eyebrow">Day ${S.days.length} · ${P.spot(d.spot).name}</div><h2>${pr>0?`Your stall made ${money(pr)}!`:pr<0?`Your stall lost ${money(-pr)}`:'You broke even: $0'}</h2></div>${starsH(pr)}</div>
    <table class="tb"><tbody><tr><td>We collected</td><td>${d.n} × ${money(d.price)}</td><td class="r"><b>${money(col)}</b></td></tr>
      <tr><td>We paid out</td><td>${d.wins} winner${d.wins===1?'':'s'} × $50</td><td class="r"><b>${money(paid)}</b></td></tr>
      <tr class="tot"><td>Profit</td><td>${money(col)} − ${money(paid)}</td><td class="r ${pr>0?'pos':pr<0?'neg':''}">${money(pr)}</td></tr></tbody></table>
    <div class="note blue"><b>What your data said:</b> P(in) ≈ ${pct(c.in,c.n)}, so about ${Math.round(c.p*100)/100} × ${d.n} = <b>${expTxt}</b> winners. There ${d.wins===1?'was':'were'} <b>${d.wins}</b>.${pred}</div>
    <div class="note violet"><b>Break-even price</b> = P(in) × $50 ≈ ${Math.round(c.p*100)/100} × $50 = <b>${money(be)}</b>. ${verdict}</div>
    ${sameSpot.length>1?`<div class="note amber">All your customers from here so far: <b>${cw} in out of ${cn}</b> (${pct(cw,cn)}). Your own throws said ${pct(c.in,c.n)}. More trials, better estimate.</div>`:''}
    ${isBest?'<p style="margin:10px 0 0;font-weight:900;color:#b45309">★ Your best day so far!</p>':''}
    <div class="pBtns"><button class="pb main" data-act="toPrice" data-focus>Try another price ›</button><button class="pb" data-act="more">More practice</button><button class="pb" data-act="spots">Change spot</button></div>
    <details class="log"><summary>Stall log (${S.days.length} day${S.days.length===1?'':'s'})</summary>${logH()}</details>`,{wide:true});
}
function helpPanel(){
  const back=phase;
  panel(`<div class="eyebrow">How to play</div><h2>Throw, collect data, set a price</h2>
    <p><b>1. Angle.</b> Drag the blue slider up or down (or use <span class="kbd">↑</span> <span class="kbd">↓</span>). The green sweet spot on the power meter shows how much power that angle needs. Some angles have a bigger sweet spot than others.</p>
    <p><b>2. Power.</b> Lock in the angle, then press <b>THROW!</b> (or <span class="kbd">Space</span>) when the marker is in the green. A scrunched-up ball wobbles, so even a good throw can miss.</p>
    <p><b>3. Data.</b> Every throw is recorded as in or out. In ÷ throws is your estimate of the chance: P(in).</p>
    <p><b>4. The stall.</b> Choose a cost to play. Customers throw about as well as you. Each one pays you the cost; each winner takes $50. Profit = collected − paid out.</p>
    <div class="pBtns"><button class="pb main" data-act="closeHelp" data-focus>Got it</button></div>`);
  helpPanel.back=back;
}
function logPanel(){const back=phase;
  panel(`<div class="eyebrow">Stall log</div><h2>Every day you’ve opened</h2>${logH()}
    <div class="pBtns"><button class="pb main" data-act="closeHelp" data-focus>Close</button></div>`,{wide:true});helpPanel.back=back}
function charPanel(){
  phase='char';hideGame();camFor('overview');helpPanel.back=null;
  panel(`<div class="eyebrow">Choose your character</div><h2>Who’s throwing?</h2>
    <div class="chGrid">${CHARS.map((c,i)=>`<button class="chCard${S.char===c.id?' on':''}" data-act="char" data-v="${c.id}" ${S.char===c.id?'data-focus':''}><span class="chImg" style="background-position:${(i%7)/6*100}% ${Math.floor(i/7)/2*100}%"></span><b>${c.name}</b></button>`).join('')}</div>
    <p style="margin:12px 0 0;font-size:.85rem;color:#64748b">Characters from Mills Maths Adventure. They all throw the same: only your angle and timing matter.</p>`,{wide:true});
}
function hideGame(){show('controls',false);show('status',false);show('skip',false);hint('');world.kid.g.visible=false;world.ball.visible=false;world.arrow.visible=world.arc.visible=world.baseLine.visible=false;world.queue.forEach(k=>k.g.visible=false)}

/* ---------------- practice flow ---------------- */
function pickSpot(id){
  if(S.spot!==id)clearThrows();S.spot=id;save();stall=null;closePanel();world.queue.forEach(k=>k.g.visible=false);
  world.kid.tint('#2563eb');world.kid.use(S.char);placeKid();camFor('throw');
  const c=cnt(id);batchLeft=BATCH;startAim(true);
  if(!c.n)pop(`<span class="why">${curSpot().name}: ${BATCH} practice throws</span>`,1800);
}
function startAim(first){
  phase='aim';stall=null;show('controls',true);show('skip',false);setAngle(S.angle[S.spot]||45,true);world.kid.setArm(3.3);holdBall();setCtl();renderStatus();aimArrow();camFor('throw');
  hint(first&&!cnt(S.spot).n?'Drag the angle slider, then lock it in':'');
}
function lockAngle(){if(phase!=='aim')return;phase='power';meterT=0;power=0;SFX.lock();setCtl();hint('Press THROW! when the marker is in the green')}
function unlock(){if(phase!=='power')return;phase='aim';setCtl();$('mark').style.bottom='0%';$('powRead').textContent='0';hint('')}
function doThrow(){
  if(phase!=='power')return;phase='wind';armT=0;setCtl();hint('');
  launchPlan={spot:S.spot,angle,power,nz:P.noise()};
}
let launchPlan=null;
function release(){
  const L=launchPlan;sim=P.launch(L.spot,L.angle,L.power,L.nz);simAcc=0;firstEv=null;phase='fly';SFX.whoosh();
  world.arrow.visible=world.arc.visible=world.baseLine.visible=false;
  trail={pts:[new THREE.Vector3(sim.x,sim.y,sim.z)],n:0};
}
function landed(){
  const isIn=sim.result==='in',res={in:isIn,rim:sim.rim,ceil:sim.ceil,first:firstEv},why=P.describe(res,S.spot);
  // keep the arc of this throw, faintly, like a record on the air
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(trail.pts),new THREE.LineBasicMaterial({color:isIn?'#15803d':'#ef4444',transparent:true,opacity:stall?.28:.5}));
  scene.add(line);world.trails.push(line);while(world.trails.length>(stall?14:8))scene.remove(world.trails.shift());
  if(isIn){world.ball.visible=false;burst();SFX.in();cheerT=stall?.7:1.15;world.kid.cheer()}
  else{const l=world.ball.clone();l.material=world.ball.material;scene.add(l);world.litter.push(l);while(world.litter.length>40)scene.remove(world.litter.shift());world.ball.visible=false;SFX.out()}
  if(stall){
    const d=stall;d.i++;if(isIn)d.wins++;
    pop(`<span class="pp ${isIn?'in':'out'}">${isIn?'IN ✓':'OUT ✗'}</span><span class="cash ${isIn?'neg':'pos'}">${isIn?`+${money(d.price)} − $50`:`+${money(d.price)}`}</span>`,800);
    setTimeout(isIn?SFX.pay:SFX.coin,isIn?350:60);renderStatus();phase='after';afterT=isIn?.75:.4;return;
  }
  S.data[S.spot].push({a:launchPlan.angle,p:Math.round(launchPlan.power*10)/10,in:isIn});batchLeft--;save();
  pop(`<span class="pp ${isIn?'in':'out'}">${isIn?'IN ✓':'OUT ✗'}</span><span class="why">${why}</span>`,1300);
  renderStatus();phase='after';afterT=1.25;
}
function afterThrow(){
  cheerT=0;world.kid.g.position.y=0;
  if(stall){if(stall.i>=stall.n){dayPanel();return}nextCustomer();return}
  if(batchLeft<=0){resultsPanel();return}
  startAim();
}

/* ---------------- the stall ---------------- */
/* Customers throw about as well as the student did: same favourite angle, and the same spread of power around the sweet spot.
   The spread is measured robustly (median miss), so throwing badly on purpose in practice does not make customers bad. */
function customerModel(id){
  const t=S.data[id],withBand=t.map(x=>({x,b:P.band(id,x.a)})).filter(o=>o.b);
  let ang;
  if(withBand.length){const as=withBand.map(o=>o.x.a).sort((a,b)=>a-b);ang=as[Math.floor(as.length/2)]}
  else{ang=40;let best=null;for(let a=P.ANGLE.min;a<=P.ANGLE.max;a+=5){const b=P.band(id,a);if(b&&(!best||b.w>best.w)){best=b;ang=a}}}
  const b=P.band(id,ang);
  const errs=withBand.map(o=>Math.abs(o.x.p-o.b.mid)).sort((a,b)=>a-b);
  const med=errs.length?errs[Math.floor(errs.length/2)]:4;
  return {angle:ang,mid:b.mid,sigma:clamp(med/0.6745,1.6,7)};
}
function openStall(){
  const pv=$('predIn')?parseInt($('predIn').value,10):NaN,n=queueFor(S.price);
  if(n<1){pop('<span class="why">Nobody will pay that much. Try a lower price.</span>',1800);return}
  closePanel();clearThrows();save();
  stall={spot:S.spot,price:S.price,n,i:0,wins:0,pred:isFinite(pv)?pv:null,model:customerModel(S.spot),pool:stallPool()};
  timeScale=1.9;show('controls',false);show('skip',true);hint('');camFor('stall');placeKid();layoutQueue();renderStatus();SFX.lock();
  phase='after';afterT=.8;
}
let poolIds=null;
function stallPool(){if(!poolIds){const o=CHARS.map(c=>c.id).filter(id=>id!==S.char);for(let i=o.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[o[i],o[j]]=[o[j],o[i]]}poolIds=o.slice(0,4);poolIds.forEach(id=>loadModel(id).catch(()=>{}))}return poolIds}
function layoutQueue(){
  const d=curSpot().d,left=stall.n-stall.i-1;
  world.queue.forEach((k,j)=>{const on=j<left;k.g.visible=on;if(!on)return;const col=j%3,row=Math.floor(j/3);
    k.tx=-1.25-col*.48;k.tz=Math.min(R.z1-.5,d+.35+row*.5);if(!k.placed){k.g.position.set(k.tx,0,k.tz);k.placed=true}k.g.rotation.y=.5;
    k.tint(QCOL[(stall.i+1+j)%QCOL.length]);const cid=stall.pool[(stall.i+1+j)%stall.pool.length];if(k.id!==cid)k.use(cid)});
}
function nextCustomer(){
  const d=stall,m=d.model;world.kid.tint(QCOL[d.i%QCOL.length]);world.kid.use(d.pool[d.i%d.pool.length]);world.kid.setArm(3.3);holdBall();layoutQueue();world.kid.g.position.y=0;
  launchPlan={spot:d.spot,angle:m.angle,power:clamp(m.mid+P.gauss()*m.sigma,0,100),nz:P.noise()};
  phase='wind';armT=0;renderStatus();
}
function skipStall(){
  if(!stall||phase==='day')return;const d=stall,m=d.model;
  if(phase==='fly'||phase==='wind'){const r=sim&&phase==='fly'?null:null}
  // finish the throw in the air as it would have landed, then run the rest without drawing them
  if(phase==='fly'){while(!sim.done)P.step(sim,P.DT);d.i++;if(sim.result==='in')d.wins++}
  while(d.i<d.n){const r=P.run(d.spot,m.angle,clamp(m.mid+P.gauss()*m.sigma,0,100),P.noise());d.i++;if(r.in)d.wins++}
  world.ball.visible=false;$('pop').innerHTML='';dayPanel();
}

/* ---------------- main loop ---------------- */
let last=0;
function frame(now){
  const dt=Math.min(.1,(now-last)/1000||0);last=now;
  // camera
  cam.sway+=dt;const k=1-Math.pow(.0015,dt);
  const gt=cam.gt.clone();if(phase==='fly'&&sim)gt.lerp(new THREE.Vector3(sim.x,sim.y,sim.z),.3);
  cam.pos.lerp(cam.gp,k);cam.tgt.lerp(gt,k);
  camera.position.copy(cam.pos);if(phase==='intro'||phase==='spot'){camera.position.x+=Math.sin(cam.sway*.35)*.25;camera.position.y+=Math.sin(cam.sway*.27)*.06}
  camera.lookAt(cam.tgt);
  // markers pulse while choosing
  if(phase==='spot')for(const s of P.SPOTS){const m=world.markers[s.id];m.ring.material.opacity=.45+.35*Math.sin(cam.sway*4);m.ring.scale.setScalar(1+.08*Math.sin(cam.sway*4))}
  if(phase==='aim'){const pp=window.__BTG__&&window.__BTG__.pausePose;world.kid.setArm(pp!==undefined?pp:3.3+Math.sin(cam.sway*2.2)*.04);holdBall()}
  if(phase==='power'){
    meterT+=dt;const ph=(meterT/P.METER.period)%1;power=ph<.5?ph*200:(1-ph)*200;
    $('mark').style.bottom=power+'%';$('powRead').textContent=Math.round(power);
    world.kid.setArm(3.3+power/100*.35);holdBall();
  }
  if(phase==='wind'){
    armT+=dt*(stall?timeScale:1);const w=.2,sw=.11;
    let sw_u=0;if(armT<w)world.kid.setArm(3.3+(armT/w)*.4);
    else{const u=Math.min(1,(armT-w)/sw);sw_u=u;world.kid.setArm(3.7-(3.7-2.786)*u*u);if(u>=1){release()}}
    if(phase==='wind'){holdBall();if(sw_u>0&&launchPlan)world.ball.position.lerp(_a.set(P.REL.x,P.REL.y,P.spot(launchPlan.spot).d),sw_u*sw_u*sw_u)}
  }
  if(phase==='fly'){
    simAcc+=dt*(stall?timeScale:1);
    if(world.kid.armX>1.7)world.kid.setArm(Math.max(1.7,world.kid.armX-dt*7));
    while(simAcc>=P.DT&&!sim.done){P.step(sim,P.DT);simAcc-=P.DT;
      if(sim.ev){if(!firstEv&&sim.ev!=='in')firstEv={ev:sim.ev,x:sim.x,z:sim.z};
        if(sim.ev==='floor'||sim.ev==='wall'||sim.ev==='ceil'||sim.ev==='side')SFX.thud();else if(sim.ev==='rim')SFX.rim()}
      if(++trail.n%6===0&&!sim.inBin&&trail.pts.length<400&&!firstEv)trail.pts.push(new THREE.Vector3(sim.x,sim.y,sim.z))}
    world.ball.position.set(sim.x,sim.y,sim.z);world.ball.rotation.x+=dt*9;world.ball.rotation.z+=dt*6;
    if(sim.done)landed();
  }
  if(cheerT>0){cheerT-=dt*(stall?1:1);world.kid.g.position.y=cheerT>0?Math.abs(Math.sin(cheerT*11))*.13:0}
  if(phase==='after'){afterT-=dt;if(afterT<=0)afterThrow()}
  // queue shuffles forward; winners hop
  if(stall)world.queue.forEach(q=>{if(!q.g.visible)return;q.g.position.x+=(q.tx-q.g.position.x)*Math.min(1,dt*6);q.g.position.z+=(q.tz-q.g.position.z)*Math.min(1,dt*6)});
  updConfetti(dt);
  if(world.bin.scale.y!==1)world.bin.scale.y+=(1-world.bin.scale.y)*Math.min(1,dt*10);
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}

/* ---------------- input ---------------- */
function act(){if(phase==='aim')lockAngle();else if(phase==='power')doThrow()}
$('actBtn').addEventListener('click',act);
$('unlockBtn').addEventListener('click',unlock);
$('skipBtn').addEventListener('click',skipStall);
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
document.addEventListener('keydown',e=>{
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)){if(e.key==='Enter'&&e.target.id==='predIn')openStall();return}
  const k=e.key;
  if(!veil.hidden&&!veil.classList.contains('clear')){if(k==='Escape'&&(helpPanel.back))closeHelp();return}
  if(k===' '||k==='Enter'){if(e.target.closest&&e.target.closest('button')&&e.target.id!=='actBtn')return;e.preventDefault();act()}
  else if(k==='ArrowUp'&&phase==='aim'){e.preventDefault();setAngle(angle+1)}
  else if(k==='ArrowDown'&&phase==='aim'){e.preventDefault();setAngle(angle-1)}
  else if(k==='Escape'&&phase==='power')unlock();
  else if(/^[123]$/.test(k)&&phase==='spot')pickSpot(P.SPOTS[+k-1].id);
});
function closeHelp(){const b=helpPanel.back;helpPanel.back=null;closePanel();if(b==='intro')introPanel();else if(b==='spot')spotPanel();else if(b==='char')charPanel();else if(b==='results')resultsPanel();else if(b==='price')pricePanel();else if(b==='day'){phase='day';pricePanel()}else phase=b}
const ACT={
  spots(){closePanel();spotPanel()},pick(el){pickSpot(el.dataset.v)},
  more(){closePanel();stall=null;world.queue.forEach(k=>k.g.visible=false);clearThrows();world.kid.tint('#2563eb');world.kid.use(S.char);placeKid();batchLeft=BATCH;startAim()},
  toPrice(){if(cnt(S.spot).n<MIN_DATA)return;closePanel();world.kid.tint('#2563eb');world.kid.use(S.char);placeKid();pricePanel()},
  price(el){S.price=clamp(S.price+ +el.dataset.v,1,49);paintPrice();SFX.tick()},open(){openStall()},closeHelp
};
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(el&&ACT[el.dataset.act]){ac();ACT[el.dataset.act](el)}});
document.addEventListener('input',e=>{if(e.target.id==='priceIn'){S.price=+e.target.value;paintPrice()}else if(e.target.id==='predIn')e.target.value=e.target.value.replace(/\D/g,'')});
$('helpBtn').addEventListener('click',()=>{if(['aim','intro','spot','char','results','price','day'].includes(phase)&&!helpPanel.back)helpPanel()});
$('logBtn').addEventListener('click',()=>{if(['aim','intro','spot','char','results','price','day'].includes(phase)&&!helpPanel.back)logPanel()});
function paintSound(){const b=$('soundBtn');b.setAttribute('aria-pressed',String(S.sound));b.innerHTML=S.sound?'&#128266;':'&#128263;'}
$('soundBtn').addEventListener('click',()=>{S.sound=!S.sound;save();paintSound();if(S.sound)SFX.lock()});
$('resetBtn').addEventListener('click',()=>{
  helpPanel.back=null;
  panel(`<div class="eyebrow">Start again</div><h2>Clear all your throws and stall days?</h2><p>This removes your data from every spot and your stall log on this device.</p>
    <div class="pBtns"><button class="pb main" data-act="doReset">Yes, start again</button><button class="pb" data-act="cancelReset" data-focus>Keep my data</button></div>`);
  ACT.cancelReset.back=phase;
});
ACT.char=el=>{S.char=el.dataset.v;poolIds=null;save();world.kid.use(S.char);closePanel();spotPanel()};
ACT.chars=()=>{closePanel();charPanel()};
ACT.doReset=()=>{S.spot=null;S.char=null;poolIds=null;world.kid.use(null);S.data={front:[],middle:[],back:[]};S.days=[];S.price=10;S.angle={front:45,middle:40,back:35};save();clearThrows();stall=null;closePanel();introPanel()};
ACT.cancelReset=()=>{const b=ACT.cancelReset.back;closePanel();if(b==='intro')introPanel();else if(b==='spot')spotPanel();else if(b==='char')charPanel();else if(b==='results')resultsPanel();else if(b==='price'||b==='day')pricePanel();else if(b==='aim'||b==='power'){phase=b}else if(stall){phase='after';afterT=.2}};
// tap a floor marker to choose it
const ray=new THREE.Raycaster(),ptr=new THREE.Vector2();
function markerAt(e){const r=canvas.getBoundingClientRect();ptr.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ptr,camera);
  const hit=ray.intersectObjects(P.SPOTS.map(s=>world.markers[s.id].disc))[0];return hit?hit.object.userData.spot:null}
veil.addEventListener('pointerdown',e=>{if(phase==='spot'&&e.target===veil){}});
canvas.addEventListener('pointerdown',e=>{if(phase==='spot'){const id=markerAt(e);if(id)pickSpot(id)}});
canvas.addEventListener('pointermove',e=>{canvas.style.cursor=phase==='spot'&&markerAt(e)?'pointer':'default'});

/* ---------------- go ---------------- */
try{
  initScene();paintSound();camFor('overview');cam.pos.copy(cam.gp);cam.tgt.copy(cam.gt);
  $('loading').hidden=true;
  introPanel();
  requestAnimationFrame(frame);
}catch(err){$('loading').innerHTML='This game needs 3D graphics (WebGL), which this browser or device has switched off.<br><br><small>'+esc(err.message||err)+'</small>';console.error(err)}
window.__BTG__={S,P,get phase(){return phase},get stall(){return stall},pickSpot,setAngle,lockAngle,doThrow,customerModel,queueFor,cnt,skipStall,CHARS,world,loadModel,
  forceThrow(a,p){setAngle(a,true);phase='power';power=p;doThrow()},get sim(){return sim},setPower(p){power=p}};
