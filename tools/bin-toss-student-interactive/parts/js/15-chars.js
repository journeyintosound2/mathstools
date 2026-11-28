/* ---------------- characters from Mills Maths Adventure ----------------
   All 21 models share one 24-bone skeleton (Hips, Spine…, RightArm, RightForeArm, RightHand…) but none has a throwing clip.
   So the throw is made in code: the arm bones are AIMED at directions for each moment of the throw (hold, wind up, release,
   follow through). One set of directions works for every character, whatever its size or shape. Walking uses each model's
   own walk clip, with the hip translation taken out so the code decides where the figure goes. */
const CHARS=[
  {id:'main1',name:'Explorer'},{id:'main2',name:'Cool Cat'},{id:'main3',name:'DJ Goat'},
  {id:'pip',name:'Pip'},{id:'fern',name:'Fern'},{id:'alby',name:'Alby'},{id:'pete',name:'Pete'},
  {id:'mills',name:'Mr. Mills'},{id:'pearce',name:'Mr. Pearce'},{id:'mahoney',name:'Ms. Mahoney'},{id:'ewings',name:'Ms. Ewings'},
  {id:'dawson',name:'Mr. Dawson'},{id:'heywood',name:'Mr. Heywood'},{id:'morgan',name:'Mr. Morgan'},{id:'bacon',name:'Ms. Bacon'},{id:'brookes',name:'Ms. Brookes'},
  {id:'farmer',name:'Sunny'},{id:'farmer1',name:'The Milkman'},{id:'trevor',name:'Trevor'},{id:'steve',name:'Steve'},{id:'robot',name:'Robot'}
];
const WALK_CLIP={main1:'Running'};                              // main1's clip names are shifted: "Running" holds the walk
const CHAR_URL='../../../../../game-platforms/mills-maths-adventure/models/characters/';
const charName=id=>(CHARS.find(c=>c.id===id)||{name:''}).name;
const gltf=new GLTFLoader();gltf.setMeshoptDecoder(MeshoptDecoder);
const modelCache={};
function loadModel(id){
  return modelCache[id]||(modelCache[id]=gltf.loadAsync(CHAR_URL+id+'.glb').then(g=>{
    const sc=g.scene;sc.updateMatrixWorld(true);const bx=new THREE.Box3().setFromObject(sc),h=bx.max.y-bx.min.y;let sh=h*.7;
    sc.traverse(o=>{if(o.isBone&&o.name==='RightArm'){const v=new THREE.Vector3();o.getWorldPosition(v);sh=v.y-bx.min.y}});
    let walk=g.animations.find(c=>c.name===(WALK_CLIP[id]||'Walking'))||g.animations.find(c=>/walk/i.test(c.name))||null;
    if(walk){walk=walk.clone();walk.tracks=walk.tracks.filter(tr=>!/^Hips\.position$/.test(tr.name))}
    return {scene:sc,walk,scale:clamp(1.05/sh,1.25/h,1.5/h),minY:bx.min.y};   // shoulders near 1.05 m; between 1.25 m and 1.5 m tall
  }).catch(e=>{delete modelCache[id];throw e}));
}
function makeActor(m){
  const root=new THREE.Group(),inner=skClone(m.scene);inner.rotation.y=Math.PI;inner.scale.setScalar(m.scale);inner.position.y=-m.minY*m.scale;root.add(inner);
  const B={},all=[];inner.traverse(o=>{if(o.isBone){B[o.name]=o;all.push([o,o.quaternion.clone(),o.position.clone()])}if(o.isMesh){o.castShadow=true;o.frustumCulled=false}});
  const bind={};for(const n of ['RightArm','RightForeArm','LeftArm','LeftForeArm','Spine','Spine01','Spine02'])if(B[n])bind[n]=B[n].quaternion.clone();
  const low=B.Hips?B.Hips.children.find(c=>c.isBone&&/^Spine/.test(c.name)):null;
  let mixer=null,walk=null;if(m.walk){mixer=new THREE.AnimationMixer(inner);walk=mixer.clipAction(m.walk)}
  return {root,B,bind,low,all,mixer,walk};
}
function restAll(a){for(const [b,q,p] of a.all){b.quaternion.copy(q);b.position.copy(p)}}
// directions in the figure's own frame: +x right, +y up, -z forward
const POSE={hold:{U:[.5,-.35,.2],F:[.05,.95,-.3],lean:0},wind:{U:[.45,.05,.8],F:[.1,.75,.65],lean:.2},rel:{U:[.2,.6,-.75],F:[.02,.8,-.6],lean:-.1},fol:{U:[.05,-.2,-.95],F:[-.15,-.6,-.75],lean:-.28}};
const SHAPES={
  cheer:{RU:[.4,.9,-.1],RF:[.12,1,-.1],LU:[-.4,.9,-.1],LF:[-.12,1,-.1],lean:.1},           // a winner: both arms up
  groan:{RU:[.75,.55,-.2],RF:[-.75,.55,-.1],LU:[-.75,.55,-.2],LF:[.75,.55,-.1],lean:.18}, // the stall owner pays out: hands on head
  pump:{RU:[.55,-.1,-.25],RF:[-.1,.95,-.25],lean:-.05}                                    // the stall owner keeps the money: fist pump
};
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_d=new THREE.Vector3(),_t=new THREE.Vector3(),_q=new THREE.Quaternion(),_qw=new THREE.Quaternion(),_qp=new THREE.Quaternion(),_qr=new THREE.Quaternion();
function turnWorld(bone,q){bone.getWorldQuaternion(_qw);bone.parent.getWorldQuaternion(_qp);bone.quaternion.copy(_qp.invert().multiply(_q.copy(q).multiply(_qw)))}
function aimBone(bone,child,dir){if(!bone||!child)return;bone.updateWorldMatrix(true,true);_a.setFromMatrixPosition(bone.matrixWorld);_b.setFromMatrixPosition(child.matrixWorld);
  _d.subVectors(_b,_a).normalize();turnWorld(bone,_qr.setFromUnitVectors(_d,dir))}
function poseActor(a,x){
  for(const n in a.bind)a.B[n].quaternion.copy(a.bind[n]);
  if(x==null){a.root.updateMatrixWorld(true);return}
  let A,Bk,k;if(x>=3.3){A=POSE.hold;Bk=POSE.wind;k=(x-3.3)/.4}else if(x>=2.786){A=POSE.rel;Bk=POSE.hold;k=(x-2.786)/.514}else{A=POSE.rel;Bk=POSE.fol;k=(2.786-x)/1.086}
  k=clamp(k,0,1);a.root.updateWorldMatrix(true,false);a.root.getWorldQuaternion(_qp);const rq=_qp.clone();
  const lean=A.lean+(Bk.lean-A.lean)*k;
  if(a.low&&lean){_t.set(1,0,0).applyQuaternion(rq);turnWorld(a.low,_qr.setFromAxisAngle(_t,lean))}
  const dir=(u,v)=>_t.set(u[0]+(v[0]-u[0])*k,u[1]+(v[1]-u[1])*k,u[2]+(v[2]-u[2])*k).normalize().applyQuaternion(rq);
  aimBone(a.B.RightArm,a.B.RightForeArm,dir(A.U,Bk.U).clone());aimBone(a.B.RightForeArm,a.B.RightHand,dir(A.F,Bk.F).clone());
  a.root.updateMatrixWorld(true);
}
function poseShape(a,sh){
  for(const n in a.bind)a.B[n].quaternion.copy(a.bind[n]);
  a.root.updateWorldMatrix(true,false);a.root.getWorldQuaternion(_qp);const rq=_qp.clone(),d=v=>new THREE.Vector3(v[0],v[1],v[2]).normalize().applyQuaternion(rq);
  if(a.low&&sh.lean){_t.set(1,0,0).applyQuaternion(rq);turnWorld(a.low,_qr.setFromAxisAngle(_t,sh.lean))}
  if(sh.RU){aimBone(a.B.RightArm,a.B.RightForeArm,d(sh.RU));aimBone(a.B.RightForeArm,a.B.RightHand,d(sh.RF))}
  if(sh.LU){aimBone(a.B.LeftArm,a.B.LeftForeArm,d(sh.LU));aimBone(a.B.LeftForeArm,a.B.LeftHand,d(sh.LF))}
  a.root.updateMatrixWorld(true);
}
/* A figure on the floor: one of the Adventure characters, or the simple block kid until its model has loaded (or if it can't). */
class Fig{
  constructor(shirt,o){this.g=new THREE.Group();this.box=makeKid(shirt,o);this.g.add(this.box.g);this.actors={};this.actor=null;this.id=null;this.armX=3.3;this.mode='arm';this.walking=false;scene.add(this.g)}
  use(id){this.id=id||null;if(!id){this.swap(null);return Promise.resolve()}
    if(this.actors[id]){this.swap(this.actors[id]);return Promise.resolve()}
    return loadModel(id).then(m=>{if(!this.actors[id])this.actors[id]=makeActor(m);if(this.id===id)this.swap(this.actors[id])}).catch(e=>{console.warn('character',id,e);if(this.id===id)this.swap(null)})}
  swap(a){if(this.actor&&this.actor!==a){this.stopWalk();this.g.remove(this.actor.root)}this.actor=a;this.box.g.visible=!a;if(a){this.g.add(a.root);this.reapply()}}
  reapply(){if(this.walking&&this.actor&&this.actor.walk){this.actor.walk.reset().play();return}if(this.mode==='arm')this.setArm(this.armX);else this.shape(this.mode)}
  tint(c){this.box.sm.color.set(c)}
  cheer(){this.shape('cheer')}
  shape(name){this.mode=name;const sh=SHAPES[name];this.box.arm.rotation.x=name==='pump'?3.0:3.05;if(this.actor&&!this.walking){restAll(this.actor);poseShape(this.actor,sh)}}
  setArm(x){this.mode='arm';this.armX=x;this.box.arm.rotation.x=x==null?0:x;if(this.actor&&!this.walking){if(this._restNeeded){restAll(this.actor);this._restNeeded=false}poseActor(this.actor,x)}}
  startWalk(){this.walking=true;const a=this.actor;if(a&&a.walk){a.walk.reset();a.walk.timeScale=1.15;a.walk.play()}}
  stopWalk(){if(!this.walking)return;this.walking=false;const a=this.actor;if(a&&a.walk){a.walk.stop();restAll(a);this._restNeeded=false}this.box.g.position.y=0}
  update(dt){if(this.walking){if(this.actor&&this.actor.mixer)this.actor.mixer.update(dt);else this.box.g.position.y=Math.abs(Math.sin(performance.now()/90))*.05}}
  hand(out){this.g.updateMatrixWorld(true);
    if(this.actor&&this.actor.B.RightHand){const B=this.actor.B;out.setFromMatrixPosition(B.RightHand.matrixWorld);if(B.RightForeArm){_a.setFromMatrixPosition(B.RightForeArm.matrixWorld);_d.subVectors(out,_a).normalize();out.addScaledVector(_d,.07)}return out}
    out.set(0,-.36,0);return this.box.arm.localToWorld(out)}
}
function buildQueue(){for(let i=0;i<9;i++){const k=new Fig(QCOL[i%QCOL.length],{skin:SKIN[i%6],hair:HAIR[(i*5)%6]});k.setArm(null);k.g.visible=false;world.queue.push(k)}}

let sun=null;
function initScene(){
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();scene.background=new THREE.Color('#dbeafe');
  camera=new THREE.PerspectiveCamera(50,1,.1,40);
  scene.add(new THREE.HemisphereLight('#ffffff','#f3e6c8',1.5));
  scene.add(new THREE.AmbientLight('#ffffff',.75));
  sun=new THREE.DirectionalLight('#fff7e6',1.25);sun.position.set(5.5,5.5,6.5);sun.target.position.set(0,0,3);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);const sc=sun.shadow.camera;sc.left=-7;sc.right=7;sc.top=8;sc.bottom=-8;sc.near=.5;sc.far=20;sun.shadow.bias=-.0006;sun.shadow.radius=4;
  scene.add(sun,sun.target);
  buildRoom();buildBin();buildMarkers();buildAim();buildConfetti();buildQueue();
  world.kid=new Fig('#2563eb');if(S.char)world.kid.use(S.char);
  world.owner=new Fig('#2563eb');world.owner.g.visible=false;
  world.walker=new Fig('#2563eb');world.walker.g.visible=false;
  world.ball=makeBallMesh();scene.add(world.ball);
  applyGfx();resize();window.addEventListener('resize',resize);
}
const lowGfx=()=>PREF.low===true;
function applyGfx(){
  if(!renderer)return;const low=lowGfx();
  renderer.setPixelRatio(low?1:Math.min(2,window.devicePixelRatio||1));
  sun.castShadow=!low;renderer.shadowMap.needsUpdate=true;resize();
}
function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<.8?70:w/h<1.25?60:50;camera.updateProjectionMatrix()}
