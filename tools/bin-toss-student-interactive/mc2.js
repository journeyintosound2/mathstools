const B=require('./parts/physics.js');const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
function model(id,t){const wb=t.map(x=>({x,b:B.band(id,x.a)})).filter(o=>o.b);const as=wb.map(o=>o.x.a).sort((a,b)=>a-b);const ang=as[Math.floor(as.length/2)];const b=B.band(id,ang);
  const e=wb.map(o=>Math.abs(o.x.p-o.b.mid)).sort((a,b)=>a-b);return{angle:ang,mid:b.mid,sigma:cl(e[Math.floor(e.length/2)]/0.6745,1.6,7)}}
const ups=200/B.METER.period;
for(const id of ['front','middle','back'])for(const sg of [0.03,0.05,0.08]){
  let pt=0,pc=0,N=300;const a=id==='back'?35:45,b=B.band(id,a);
  for(let k=0;k<N;k++){const t=[];for(let i=0;i<10;i++){const p=cl(b.mid+B.gauss()*sg*ups,0,100);const r=B.run(id,a,p,B.noise());t.push({a,p,in:r.in});pt+=r.in/10}
    const m=model(id,t);for(let i=0;i<10;i++)pc+=B.run(id,m.angle,cl(m.mid+B.gauss()*m.sigma,0,100),B.noise()).in/10}
  console.log(id,sg,'player',(pt/N*100).toFixed(0)+'%','customers',(pc/N*100).toFixed(0)+'%')}
// sandbagger: power 0 every time from the front
const t=[];for(let i=0;i<10;i++)t.push({a:45,p:0,in:false});const m=model('front',t);let k=0;for(let i=0;i<2000;i++)k+=B.run('front',m.angle,cl(m.mid+B.gauss()*m.sigma,0,100),B.noise()).in;console.log('sandbag front: data 0%, customers',(k/20).toFixed(0)+'%')
