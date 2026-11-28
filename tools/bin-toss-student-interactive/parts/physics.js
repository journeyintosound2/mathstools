/* Bin Toss physics: DOM-free, shared by the game and the Node harness. Units: metres, seconds. */
var BTP=(function(){
  const G=9.8, R=0.2, RB=0.155, H=0.42, BR=0.05, DRAG=0.1;
  const ROOM={x0:-3.6,x1:3.6,z0:-1.7,z1:9.6,h:2.8};
  const SPOTS=[
    {id:'front', name:'Front row',          short:'Front',  d:2},
    {id:'middle',name:'Middle of the room', short:'Middle', d:4},
    {id:'back',  name:'Back of the room',   short:'Back',   d:6}
  ];
  const REL={x:0.22,y:1.3};                       // the hand at release, beside the thrower
  const NOISE={speed:0.014,yaw:0.027};            // a scrunched ball never flies the same way twice
  const METER={period:2.4};                       // seconds for the power marker to go up and back
  const ANGLE={min:15,max:75};
  const spot=id=>SPOTS.find(s=>s.id===id)||SPOTS[0];
  const speedOf=p=>1.6+7.4*Math.max(0,Math.min(100,p))/100;
  const radAt=y=>RB+(R-RB)*Math.max(0,Math.min(1,y/H));
  function gauss(rnd){rnd=rnd||Math.random;let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
  function noise(rnd){return {ds:gauss(rnd)*NOISE.speed,dyaw:gauss(rnd)*NOISE.yaw}}
  function launch(spotId,angleDeg,power,nz){
    const s=spot(spotId),a=angleDeg*Math.PI/180,v=speedOf(power)*(1+(nz?nz.ds:0));
    const yaw=Math.atan2(-REL.x,-s.d)+(nz?nz.dyaw:0);            // heading from the hand to the bin, plus wobble
    const h=v*Math.cos(a);
    return {x:REL.x,y:REL.y,z:s.d,vx:h*Math.sin(yaw),vy:v*Math.sin(a),vz:h*Math.cos(yaw),t:0,inBin:false,rim:false,ceil:false,done:false,result:null,ev:null};
  }
  function step(b,dt){
    if(b.done)return b;
    b.ev=null;
    const py=b.y;
    const k=1-DRAG*dt;b.vx*=k;b.vz*=k;b.vy=(b.vy-G*dt)*k;
    b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.t+=dt;
    if(b.y>ROOM.h-BR){b.y=ROOM.h-BR;b.vy=-Math.abs(b.vy)*0.3;b.vx=b.vx*0.3+0.9;b.vz*=0.3;b.ceil=true;b.ev='ceil'}
    if(b.x<ROOM.x0+BR){b.x=ROOM.x0+BR;b.vx=Math.abs(b.vx)*0.35;b.ev='wall'}
    if(b.x>ROOM.x1-BR){b.x=ROOM.x1-BR;b.vx=-Math.abs(b.vx)*0.35;b.ev='wall'}
    if(b.z<ROOM.z0+BR){b.z=ROOM.z0+BR;b.vz=Math.abs(b.vz)*0.35;b.vx*=0.7;b.ev='wall'}
    if(b.z>ROOM.z1-BR){b.z=ROOM.z1-BR;b.vz=-Math.abs(b.vz)*0.35;b.ev='wall'}
    const d=Math.hypot(b.x,b.z)||1e-6,nx=b.x/d,nz=b.z/d;
    if(b.inBin){
      const lim=radAt(b.y)-BR;
      if(d>lim){b.x=nx*lim;b.z=nz*lim;const vn=b.vx*nx+b.vz*nz;if(vn>0){b.vx-=1.3*vn*nx;b.vz-=1.3*vn*nz}}
      if(b.y<BR+0.02){b.y=BR+0.02;b.done=true;b.result='in';b.ev='in'}
      return b;
    }
    if(py>=H&&b.y<H&&b.vy<0){                                     // crossing the rim plane on the way down
      if(d<R-BR*0.6){b.inBin=true;b.ev='drop';b.vx*=0.5;b.vz*=0.5;return b}
      if(d<R+BR*0.8){b.rim=true;b.ev='rim';b.y=H+0.002;b.vy=Math.abs(b.vy)*0.32;
        const s=d<R?-0.55:0.7;b.vx=b.vx*0.35+nx*s;b.vz=b.vz*0.35+nz*s;return b}
    }
    if(b.y<H&&d<radAt(b.y)+BR){                                   // the outside of the bin
      const lim=radAt(b.y)+BR;b.x=nx*lim;b.z=nz*lim;
      const vn=b.vx*nx+b.vz*nz;if(vn<0){b.vx-=1.35*vn*nx;b.vz-=1.35*vn*nz;b.ev='side'}
    }
    if(b.y<BR){b.y=BR;
      if(Math.abs(b.vy)<0.7){b.vy=0;const f=Math.max(0,1-3.2*dt);b.vx*=f;b.vz*=f;
        if(Math.hypot(b.vx,b.vz)<0.12){b.done=true;b.result='out'}}
      else{b.vy=-b.vy*0.36;b.vx*=0.68;b.vz*=0.68;b.ev='floor'}
    }
    if(b.t>7){b.done=true;b.result='out'}
    return b;
  }
  const DT=1/240;
  function run(spotId,angleDeg,power,nz){
    const b=launch(spotId,angleDeg,power,nz);
    let landed=null;
    while(!b.done){step(b,DT);if(!landed&&(b.ev==='floor'||b.ev==='side'||b.ev==='rim'||b.ev==='drop'||b.ev==='wall'||b.ev==='ceil'))landed={ev:b.ev,x:b.x,z:b.z}}
    return {in:b.result==='in',rim:b.rim,ceil:b.ceil,first:landed};
  }
  /* The stretch of the power meter that goes in (no wobble) for this spot and angle: the widest unbroken run. */
  const bandCache={};
  function band(spotId,angleDeg){
    const key=spotId+'|'+angleDeg;if(key in bandCache)return bandCache[key];
    let best=null,cur=null;
    for(let p=0;p<=100.001;p+=0.25){
      const rr=run(spotId,angleDeg,p,null),ok=rr.in&&!rr.ceil;
      if(ok){if(!cur)cur={lo:p,hi:p};else cur.hi=p}
      if((!ok||p>=100)&&cur){if(!best||cur.hi-cur.lo>best.hi-best.lo)best=cur;cur=null}
    }
    if(best){best.lo-=0.125;best.hi+=0.125;best.mid=(best.lo+best.hi)/2;best.w=best.hi-best.lo}
    return bandCache[key]=best;
  }
  /* why a miss missed, in words a student would use */
  function describe(res,spotId){
    if(res.in)return res.rim?'In off the rim!':'Straight in!';
    if(res.ceil)return 'It hit the ceiling';
    const f=res.first;if(!f)return 'Out';
    if(f.ev==='rim')return 'Off the rim';
    if(f.ev==='side')return 'Hit the side of the bin';
    if(f.ev==='wall')return 'Too far: it hit the wall';
    const dz=f.z, dx=f.x;
    if(Math.abs(dx)>R&&Math.abs(dz)<R+0.12)return dx>0?'Just wide to the right':'Just wide to the left';
    return dz>0?'Too short':'Too long';
  }
  return {G,R,RB,H,BR,ROOM,SPOTS,REL,NOISE,METER,ANGLE,spot,speedOf,radAt,gauss,noise,launch,step,run,band,describe,DT};
})();
if(typeof module!=='undefined')module.exports=BTP;
