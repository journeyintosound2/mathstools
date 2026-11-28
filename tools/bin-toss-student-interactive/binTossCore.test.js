const c=require('../../game-platforms/mills-maths-adventure-source/functions/binTossCore');let ok=0,bad=[];const chk=(n,v)=>{v?ok++:bad.push(n)};
const T=(s,a,p,i,h=0)=>({s,a,p,i,h});
// validation
const thr=e=>{try{c.validate(e);return false}catch(x){return true}};
chk('empty refused',thr({throws:[]}));chk('21 refused',thr({throws:Array(21).fill(T('back',35,70,1))}));
chk('bad spot',thr({throws:[T('roof',35,70,1)]}));chk('angle 14',thr({throws:[T('back',14,70,1)]}));chk('angle 45.5',thr({throws:[T('back',45.5,70,1)]}));
chk('power 101',thr({throws:[T('back',35,101,1)]}));chk('power NaN',thr({throws:[T('back',35,'x',1)]}));chk('null data',thr(null));
const v=c.validate({throws:[T('back',35,79.14,5,'y')],preds:{back:33.6,front:-5,middle:'abc',roof:9}});
chk('rounds + coerces',v.throws[0].p===79.1&&v.throws[0].i===1&&v.throws[0].h===1);chk('preds clamped, junk dropped',v.preds.back===34&&v.preds.front===0&&!('middle'in v.preds)&&!('roof'in v.preds));
// class key
chk('class key',c.classKey('7A / Maths')==='7A_Maths'&&c.classDocId('JONES1','')==='c_JONES1__none');
// rate
chk('rate fresh',c.rate(null,20,1000).ok);chk('rate over',!c.rate({rate:{t:990,c:50}},20,1000).ok);chk('rate window resets',c.rate({rate:{t:900,c:60}},20,1000).ok);
// aggregates over many batches, checked against a straight count
let sd=null,cd=null,gd=null,all=[],now=1700000000;const info={studentCode:'S1',teacherCode:'T1',className:'7A',name:'Ava B'};
for(let b=0;b<40;b++){const thr=[];for(let k=0;k<1+Math.floor(Math.random()*20);k++){const s=['front','middle','back'][Math.floor(Math.random()*3)];thr.push(T(s,15+Math.floor(Math.random()*61),Math.random()*100,Math.random()<.4?1:0))}
  const cl=c.validate({throws:thr,preds:b===0?{back:30}:(b===5?{back:80,front:60}:{})});all.push(...cl.throws);
  const before=sd;sd=c.applyStudent(sd,cl,info,now,{t:now,c:1});cd=c.applyClass(cd,cl,before,info,now);gd=c.applyGlobal(gd,cl,now);now+=7}
for(const s of ['front','middle','back']){const xs=all.filter(x=>x.s===s),n=xs.length,i=xs.reduce((a,x)=>a+x.i,0);
  chk('student '+s,sd.spots[s].n===n&&sd.spots[s].in===i);chk('class '+s,cd.spots[s].n===n&&cd.spots[s].in===i);chk('global '+s,gd.spots[s].n===n&&gd.spots[s].in===i);
  const angN=Object.values(cd.spots[s].ang).reduce((a,x)=>a+x.n,0);chk('angles add up '+s,angN===n);
  chk('checkpoints every 10 '+s,cd.spots[s].cpN.length===Math.floor(n/10)&&cd.spots[s].cpN.every((v,k)=>v===(k+1)*10));
  // checkpoint in-count matches a straight count of the first cpN throws
  chk('checkpoint counts '+s,cd.spots[s].cpN.every((v,k)=>cd.spots[s].cpIn[k]===xs.slice(0,v).reduce((a,x)=>a+x.i,0)))}
chk('student pred kept once (first wins)',sd.spots.back.pred===30&&sd.spots.front.pred===60);
chk('class pred counted once per student per spot',cd.spots.back.predN===1&&cd.spots.back.predSum===30&&cd.spots.front.predN===1);
chk('ring sizes',cd.recent.length===Math.min(120,all.length)&&gd.recent.length===Math.min(40,all.length));
chk('ring format',/^[fmb]\|\d+\|[\d.]+\|[01]\|\d+\|[01]$/.test(cd.recent[0]));
chk('no names in class/global',!JSON.stringify(cd).includes('Ava')&&!JSON.stringify(gd).includes('Ava'));
chk('student totals',sd.n===all.length&&sd.in===all.reduce((a,x)=>a+x.i,0));
const raw=c.rawBatch(c.validate({throws:[T('back',35,70,1),T('front',45,30,0)]}),info,5);chk('raw batch',raw.n===2&&raw.ins===1&&raw.throws.length===2&&raw.teacherCode==='T1');
// a second student in the same class adds their prediction
const s2=c.applyStudent(null,c.validate({throws:[T('back',35,70,0)],preds:{back:50}}),{...info,studentCode:'S2'},now,{});
const cd2=c.applyClass(cd,c.validate({throws:[T('back',35,70,0)],preds:{back:50}}),null,info,now);chk('second student pred',cd2.spots.back.predN===2&&cd2.spots.back.predSum===80);
// checkpoint cap
let big=null;for(let k=0;k<250;k++)big=c.applyClass(big,c.validate({throws:Array(10).fill(T('back',35,70,1))}),null,info,now);chk('checkpoints capped',big.spots.back.cpN.length<=200&&big.spots.back.cpN.at(-1)===2500);
// doc size stays small
chk('class doc < 60 KB',JSON.stringify(big).length<60000);
console.log(ok,'ok',bad.length?'BAD '+bad:'');
