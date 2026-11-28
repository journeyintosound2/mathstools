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

