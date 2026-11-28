const B=require('./parts/physics.js');
for(const s of B.SPOTS){
  let row=s.id+': ';let best=null;
  for(let a=15;a<=75;a+=5){const b=B.band(s.id,a);row+=a+'°:'+(b?b.w.toFixed(1)+'@'+b.mid.toFixed(0):'-')+'  ';if(b&&(!best||b.w>best.w))best={a,...b}}
  console.log(row);
  const ups=200/B.METER.period;
  for(const sig of [0.03,0.045,0.065]){let n=4000,k=0;
    for(let i=0;i<n;i++){const p=best.mid+B.gauss()*sig*ups;if(B.run(s.id,best.a,p,B.noise()).in)k++}
    process.stdout.write(`  σ=${sig*1000}ms: ${(k/n*100).toFixed(0)}%`)}
  console.log('  best angle',best.a);
}
