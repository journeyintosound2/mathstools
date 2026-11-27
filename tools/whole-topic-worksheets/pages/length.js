/* Length (MA4-LEN-C-01) — the Length worksheet creator's own question
   generators and figures (copied from its old single-file page, with the
   options read through WSF.opt), set on the shared whole-topic frame.
   Each figure is an SVG built when the card is drawn, so the "mark equal
   sides" and "right-angle marks" switches redraw the same questions. */
(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const VIEW = { w: 420, h: 270 };

  const LANG={
    en:{dir:'ltr',question:'Q',worksheet:'Worksheet',answerKey:'Answer key',page:'Page',name:'Name',date:'Date',answer:'Answer:',topic:'Length',
      perim:'Find the perimeter of the shape.',
      comp:'Find the perimeter of the composite figure.',
      compMiss:'Find the perimeter. Not every side is labelled.',
      circum:'Find the circumference of the circle.',
      arc:'Find the length of the arc.',
      sector:'Find the perimeter of the sector.',
      namePart:'Name the part of the circle drawn in blue.',
      findR:'The circumference is given. Find the radius.',
      findD:'The circumference is given. Find the diameter.',
      giveIn:'Give your answer in {u}.',
      noteExact:'Give exact answers in terms of π.',
      noteRound:'Round answers to {n} decimal {pl}.',
      noteWhole:'Round answers to the nearest whole number.',
      working:'Working',
      noTypes:'Please tick at least one question type.',
      parts:{radius:'Radius',diameter:'Diameter',chord:'Chord',arc:'Arc',sector:'Sector',segment:'Segment',tangent:'Tangent'}},
    ar:{dir:'rtl',question:'سؤال',worksheet:'ورقة عمل',answerKey:'دليل الإجابات',page:'صفحة',name:'الاسم',date:'التاريخ',answer:'الإجابة:',topic:'الطول',
      perim:'أوجد محيط الشكل.',
      comp:'أوجد محيط الشكل المركّب.',
      compMiss:'أوجد المحيط. ليست كل الأضلاع مكتوبة.',
      circum:'أوجد محيط الدائرة.',
      arc:'أوجد طول القوس.',
      sector:'أوجد محيط القطاع الدائري.',
      namePart:'سمِّ جزء الدائرة المرسوم باللون الأزرق.',
      findR:'محيط الدائرة معطى. أوجد نصف القطر.',
      findD:'محيط الدائرة معطى. أوجد القطر.',
      giveIn:'اكتب إجابتك بوحدة {u}.',
      noteExact:'اكتب الإجابات بصورة مضبوطة بدلالة π.',
      noteRound:'قرِّب الإجابات إلى {n} منزلة عشرية.',
      noteWhole:'قرِّب الإجابات إلى أقرب عدد صحيح.',
      working:'الحل',
      noTypes:'يرجى اختيار نوع سؤال واحد على الأقل.',
      parts:{radius:'نصف القطر',diameter:'القطر',chord:'الوتر',arc:'القوس',sector:'القطاع الدائري',segment:'القطعة الدائرية',tangent:'المماس'}},
    fa:{dir:'rtl',question:'سؤال',worksheet:'برگه تمرین',answerKey:'پاسخ‌نامه',page:'صفحه',name:'نام',date:'تاریخ',answer:'پاسخ:',topic:'طول',
      perim:'محیط شکل را پیدا کنید.',
      comp:'محیط شکل مرکب را پیدا کنید.',
      compMiss:'محیط را پیدا کنید. اندازهٔ همهٔ ضلع‌ها نوشته نشده است.',
      circum:'محیط دایره را پیدا کنید.',
      arc:'طول کمان را پیدا کنید.',
      sector:'محیط قطاع دایره را پیدا کنید.',
      namePart:'نام بخشی از دایره را که با رنگ آبی کشیده شده بنویسید.',
      findR:'محیط دایره داده شده است. شعاع را پیدا کنید.',
      findD:'محیط دایره داده شده است. قطر را پیدا کنید.',
      giveIn:'پاسخ را بر حسب {u} بنویسید.',
      noteExact:'پاسخ‌ها را به‌صورت دقیق و بر حسب π بنویسید.',
      noteRound:'پاسخ‌ها را تا {n} رقم اعشار گرد کنید.',
      noteWhole:'پاسخ‌ها را به نزدیک‌ترین عدد صحیح گرد کنید.',
      working:'راه حل',
      noTypes:'لطفاً حداقل یک نوع پرسش را انتخاب کنید.',
      parts:{radius:'شعاع',diameter:'قطر',chord:'وتر',arc:'کمان',sector:'قطاع',segment:'قطعه',tangent:'مماس'}}
  };

  const fill = (str, vals) => String(str).replace(/\{(\w+)\}/g, (m, k) => vals[k] != null ? vals[k] : m);
  const randInt=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const choice=a=>a[randInt(0,a.length-1)];
  const rad=d=>d*Math.PI/180;
  const trim=v=>Number(Number(v).toFixed(4)).toString();

  function roundMode(){const v=WSF.opt('round');return v==='exact'?{exact:true,dp:1}:{exact:false,dp:Number(v)}}

  /* An answer of the form  coef·π + plus  (coef 0 => a plain length). */
  function fmtLen(coef,plus,unit){
    const R=roundMode();
    if(!coef) return `${trim(plus)} ${unit}`;
    if(R.exact){
      const c=(coef===1)?'':trim(coef);
      return plus?`${c}π + ${trim(plus)} ${unit}`:`${c}π ${unit}`;
    }
    return `${(coef*Math.PI+plus).toFixed(R.dp)} ${unit}`;
  }
  /* The way a GIVEN circumference is printed on the page. */
  function givenLen(coef,plus,unit){
    const R=roundMode();
    if(R.exact){const c=(coef===1)?'':trim(coef);return plus?`${c}π + ${trim(plus)} ${unit}`:`${c}π ${unit}`}
    return `${(coef*Math.PI+plus).toFixed(R.dp)} ${unit}`;
  }
  function fmtPlain(v,unit){const R=roundMode();const n=(Math.abs(v-Math.round(v))<1e-9)?String(Math.round(v)):v.toFixed(R.exact?2:R.dp);return `${n} ${unit}`}

  const UNITS=['mm','cm','m'];
  function unitsMixOn(){return !!WSF.opt('units')}
  function pickUnit(){return unitsMixOn()?choice(UNITS):'cm'}
  /* mm figures want bigger numbers than cm/m ones. */
  function scaleFor(u){return u==='mm'?10:1}
  function multipleIn(div,lo,hi){const o=[];for(let v=Math.ceil(lo/div)*div;v<=hi;v+=div)o.push(v);return o.length?choice(o):div*Math.max(1,Math.round(lo/div))}

  /* ==================================================================
     SVG HELPERS
     ================================================================== */
  function svgEl(tag,attrs){const e=document.createElementNS(SVG_NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e}
  function makeSvg(){return svgEl('svg',{class:'lenViz',viewBox:`0 0 ${VIEW.w} ${VIEW.h}`,preserveAspectRatio:'xMidYMid meet'})}
  const P=(x,y)=>({x,y});
  function ptAng(cx,cy,deg,r){return{x:cx+r*Math.cos(rad(deg)),y:cy-r*Math.sin(rad(deg))}}
  function polyPts(pts){return pts.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
  function drawPoly(svg,pts,cls){svg.appendChild(svgEl('polygon',{class:cls||'shape',points:polyPts(pts)}))}
  function drawLine(svg,a,b,cls){svg.appendChild(svgEl('line',{class:cls||'thin',x1:a.x.toFixed(1),y1:a.y.toFixed(1),x2:b.x.toFixed(1),y2:b.y.toFixed(1)}))}
  function drawPath(svg,d,cls){svg.appendChild(svgEl('path',{class:cls||'thin',d}))}
  function drawCircle(svg,c,r,cls){svg.appendChild(svgEl('circle',{class:cls||'thin',cx:c.x,cy:c.y,r}))}
  function drawDot(svg,c,r){svg.appendChild(svgEl('circle',{class:'dot',cx:c.x,cy:c.y,r:r||4}))}
  function drawText(svg,text,x,y,cls){const t=svgEl('text',{class:cls||'sideLabel',x:Number(x).toFixed(1),y:Number(y).toFixed(1)});t.textContent=text;svg.appendChild(t)}
  /* Anticlockwise-on-screen arc from math angle a0 to a1. */
  function arcD(cx,cy,r,a0,a1){
    const s=ptAng(cx,cy,a0,r),e=ptAng(cx,cy,a1,r);
    let sweep=((a1-a0)%360+360)%360;
    if(sweep===0)sweep=360;
    const large=sweep>180?1:0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 0 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  }
  /* Drop the leading "M x y" so an arc can be spliced into a longer path. */
  function tail(d){return d.replace(/^M[^A]*/,'')}
  function centroid(pts){let x=0,y=0;pts.forEach(p=>{x+=p.x;y+=p.y});return P(x/pts.length,y/pts.length)}
  /* Label an edge, clear of the line it belongs to. The push is along the
     edge's own normal and grows with how much of the label's box points that
     way, so a steep edge gets the same visual gap as a flat one. */
  function labelEdge(svg,a,b,c,text,gap){
    const m=P((a.x+b.x)/2,(a.y+b.y)/2);
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
    let nx=dy/len,ny=-dx/len;
    if((m.x+nx-c.x)*nx+(m.y+ny-c.y)*ny<0){nx=-nx;ny=-ny}   // point away from the centre
    const halfW=4.9*String(text).length+5, halfH=11;
    const d=(gap||9)+Math.abs(nx)*halfW+Math.abs(ny)*halfH;
    drawText(svg,text,m.x+nx*d,m.y+ny*d);
  }
  function tickEdge(svg,a,b,n){
    if(!WSF.opt('ticks')||!n)return;
    const m=P((a.x+b.x)/2,(a.y+b.y)/2),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
    const ux=dx/len,uy=dy/len,nx=dy/len,ny=-dx/len,half=8,gap=6;
    for(let i=0;i<n;i++){
      const off=(i-(n-1)/2)*gap,px=m.x+ux*off,py=m.y+uy*off;
      drawLine(svg,P(px+nx*half,py+ny*half),P(px-nx*half,py-ny*half),'tickMark');
    }
  }
  /* Right-angle square at vertex v, between the directions of p1 and p2. */
  function rightMark(svg,v,p1,p2,s){
    if(!WSF.opt('right'))return;
    s=s||13;
    const u1={x:p1.x-v.x,y:p1.y-v.y},u2={x:p2.x-v.x,y:p2.y-v.y};
    const l1=Math.hypot(u1.x,u1.y)||1,l2=Math.hypot(u2.x,u2.y)||1;
    const a=P(v.x+u1.x/l1*s,v.y+u1.y/l1*s),b=P(v.x+u2.x/l2*s,v.y+u2.y/l2*s);
    const cor=P(a.x+u2.x/l2*s,a.y+u2.y/l2*s);
    svg.appendChild(svgEl('polyline',{class:'rightMark',points:polyPts([a,cor,b])}));
  }

  /* ==================================================================
     QUESTION GENERATORS — BASIC
     Every generator returns { type, unit, answer, ... } and the matching
     DRAW[type] turns it into a figure. `hasPi` marks answers that need
     the rounding note at the top of the page.
     ================================================================== */

  function qPara(){
    const u=pickUnit(),s=scaleFor(u);
    const ab=randInt(6,18),bb=randInt(3,Math.max(4,ab-2));
    const a=ab*s,b=bb*s;
    return{type:'para',unit:u,a,b,perim:2*(a+b),answer:fmtPlain(2*(a+b),u),promptKey:'perim'};
  }
  function drawPara(q){
    const svg=makeSvg(),A=P(70,205),B=P(275,205),C=P(350,75),D=P(145,75),pts=[A,B,C,D],c=centroid(pts);
    drawPoly(svg,pts);
    labelEdge(svg,A,B,c,`${q.a} ${q.unit}`); labelEdge(svg,B,C,c,`${q.b} ${q.unit}`);
    tickEdge(svg,A,B,1); tickEdge(svg,C,D,1); tickEdge(svg,B,C,2); tickEdge(svg,D,A,2);
    return svg;
  }

  function qTrap(){
    const u=pickUnit(),s=scaleFor(u);
    const a=randInt(12,22)*s, b=randInt(5,9)*s, c=randInt(5,12)*s, d=randInt(5,12)*s;
    const q={type:'trap',unit:u,a,b,c,d,perim:a+b+c+d,promptKey:'perim'};
    maybeConvert(q,['a','b','c','d']);
    q.answer=fmtPlain(q.perim,q.unit);
    return q;
  }
  function drawTrap(q){
    const svg=makeSvg(),A=P(55,205),B=P(370,205),C=P(300,75),D=P(130,75),pts=[A,B,C,D],c=centroid(pts);
    drawPoly(svg,pts);
    labelEdge(svg,A,B,c,sideText(q,'a')); labelEdge(svg,B,C,c,sideText(q,'c'));
    labelEdge(svg,C,D,c,sideText(q,'b')); labelEdge(svg,D,A,c,sideText(q,'d'));
    return svg;
  }

  function qRhombus(){
    const u=pickUnit(),a=randInt(4,20)*scaleFor(u);
    return{type:'rhombus',unit:u,a,perim:4*a,answer:fmtPlain(4*a,u),promptKey:'perim'};
  }
  function drawRhombus(q){
    const svg=makeSvg(),A=P(210,50),B=P(345,150),C=P(210,250),D=P(75,150),pts=[A,B,C,D],c=centroid(pts);
    drawPoly(svg,pts);
    labelEdge(svg,A,B,c,`${q.a} ${q.unit}`);
    [[A,B],[B,C],[C,D],[D,A]].forEach(([p,r])=>tickEdge(svg,p,r,1));
    return svg;
  }

  function qKite(){
    const u=pickUnit(),s=scaleFor(u);
    const ab=randInt(3,10), bb=ab+randInt(3,10);
    const a=ab*s,b=bb*s;
    return{type:'kite',unit:u,a,b,perim:2*(a+b),answer:fmtPlain(2*(a+b),u),promptKey:'perim'};
  }
  function drawKite(q){
    const svg=makeSvg(),A=P(210,40),B=P(322,132),C=P(210,252),D=P(98,132),pts=[A,B,C,D],c=centroid(pts);
    drawPoly(svg,pts);
    labelEdge(svg,A,B,c,`${q.a} ${q.unit}`); labelEdge(svg,B,C,c,`${q.b} ${q.unit}`);
    tickEdge(svg,A,B,1); tickEdge(svg,D,A,1); tickEdge(svg,B,C,2); tickEdge(svg,C,D,2);
    return svg;
  }

  /* L-shape. The perimeter is 2W + 2H — the same as the rectangle that
     encloses it, which is the point of the "compare methods" box. */
  function lShape(showAll){
    const u=pickUnit(),s=scaleFor(u);
    const W=randInt(10,22)*s,H=randInt(8,18)*s;
    const nw=multipleIn(s,3*s,W-4*s);
    const nh=multipleIn(s,2*s,H-3*s);
    const q={type:'lshape',unit:u,W,H,nw,nh,showAll:!!showAll,perim:2*W+2*H,
             answer:fmtPlain(2*W+2*H,u),promptKey:showAll?'comp':'compMiss'};
    if(unitsMixOn()&&Math.random()<0.35){q.convertKey=choice(['W','H']);q.giveIn=u}
    return q;
  }
  function qComposite(){return lShape(true)}
  function qCompositeMissing(){return lShape(false)}
  /* A labelled length, printed in a different unit when this question is a
     conversion one. The answer is always in q.unit. */
  function lbl(q,key,value){
    if(q.convertKey===key){
      if(q.unit==='cm')return `${value*10} mm`;
      if(q.unit==='m')return `${value*100} cm`;
      return `${value/10} cm`;
    }
    return `${value} ${q.unit}`;
  }
  /* Drawn to scale from its own measurements, so a tall shape looks tall. */
  function drawLShape(q){
    const svg=makeSvg();
    const half=t=>4.9*String(t).length+5;
    const bottom=lbl(q,'W',q.W), left=lbl(q,'H',q.H), top=lbl(q,'top',q.W-q.nw), inV=lbl(q,'nh',q.nh);
    const rightTxt=q.showAll?lbl(q,'right',q.H-q.nh):'?', inHTxt=q.showAll?lbl(q,'nw',q.nw):'?';
    // Leave the side labels room before choosing how big the shape can be.
    const hMax=Math.max(half(left),half(rightTxt));
    const k=Math.min(Math.min(290,386-4*hMax)/q.W,184/q.H);
    const w=q.W*k,h=q.H*k,nw=q.nw*k,nh=q.nh*k;
    const x0=(VIEW.w-w)/2, yB=(VIEW.h+h)/2-4, yT=yB-h, yStep=yB-(h-nh), xStep=x0+w-nw;
    const P0=P(x0,yB),P1=P(x0+w,yB),P2=P(x0+w,yStep),P3=P(xStep,yStep),P4=P(xStep,yT),P5=P(x0,yT);
    drawPoly(svg,[P0,P1,P2,P3,P4,P5]);
    drawText(svg,bottom,x0+w/2,yB+24);                                  // bottom  W
    drawText(svg,left,x0-11-half(left),(yT+yB)/2);                      // left    H
    drawText(svg,top,x0+(w-nw)/2,yT-22);                                // top     W − nw
    // The inner vertical label sits inside the tall part, or in the notch when
    // the notch is the wider of the two.
    const inVx=(xStep-16-2*half(inV)>x0+6)?xStep-12-half(inV):xStep+12+half(inV);
    drawText(svg,inV,inVx,(yT+yStep)/2);                                // inner vertical nh
    drawText(svg,rightTxt,x0+w+11+half(rightTxt),(yStep+yB)/2,q.showAll?'sideLabel':'qMark');
    drawText(svg,inHTxt,(xStep+x0+w)/2,yStep+22,q.showAll?'sideLabel':'qMark');
    // Right-angle marks on the five convex corners; the notch corner (P3) is
    // reflex, so a square there would sit outside the shape.
    [[P0,P1,P5],[P1,P2,P0],[P2,P3,P1],[P4,P5,P3],[P5,P0,P4]].forEach(([v,x,y])=>rightMark(svg,v,x,y,12));
    return svg;
  }

  /* Naming the parts of a circle — the seven the syllabus lists. */
  const PART_KEYS=['radius','diameter','chord','arc','sector','segment','tangent'];
  function qCircleParts(){
    const part=choice(PART_KEYS);
    return{type:'circleParts',part,unit:'',promptKey:'namePart',
           answer:LANG.en.parts[part],answerLocal:k=>LANG[k].parts[part],isWord:true};
  }
  function drawCircleParts(q){
    const svg=makeSvg(),O=P(210,140),R=95;
    drawCircle(svg,O,R,'thin');
    const at=d=>ptAng(O.x,O.y,d,R);
    switch(q.part){
      case 'radius':   drawLine(svg,O,at(40),'feature'); drawDot(svg,O,4.5); break;
      case 'diameter': drawLine(svg,at(200),at(20),'feature'); drawDot(svg,O,4.5); break;
      case 'chord':    drawLine(svg,at(215),at(325),'feature'); break;
      case 'arc':      drawPath(svg,arcD(O.x,O.y,R,25,125),'feature'); break;
      case 'sector':   drawPath(svg,`M ${O.x} ${O.y} L ${at(20).x.toFixed(1)} ${at(20).y.toFixed(1)} ${tail(arcD(O.x,O.y,R,20,115))} Z`,'featureFill'); drawDot(svg,O,4.5); break;
      case 'segment':  drawPath(svg,`${arcD(O.x,O.y,R,200,340)} Z`,'featureFill'); break;
      case 'tangent':  {const t=ptAng(O.x,O.y,90,R);drawLine(svg,P(t.x-115,t.y),P(t.x+115,t.y),'feature');drawDot(svg,t,4.5);break}
    }
    return svg;
  }

  /* Circumference from r or d. */
  function qCircum(){
    const u=pickUnit(),base=randInt(2,14),v=base*scaleFor(u);
    const useRadius=Math.random()<0.55;
    const coef=useRadius?2*v:v;
    return{type:'circum',unit:u,useRadius,v,coef,hasPi:true,promptKey:'circum',
           answer:fmtLen(coef,0,u)};
  }
  function drawCircum(q){
    const svg=makeSvg(),O=P(210,140),R=100;
    drawCircle(svg,O,R,'shape open');
    drawDot(svg,O,4.5);
    if(q.useRadius){
      const e=ptAng(O.x,O.y,35,R);
      drawLine(svg,O,e,'dashed');
      drawText(svg,`${q.v} ${q.unit}`,(O.x+e.x)/2+6,(O.y+e.y)/2-16);
    }else{
      const a=ptAng(O.x,O.y,180,R),b=ptAng(O.x,O.y,0,R);
      drawLine(svg,a,b,'dashed');
      drawText(svg,`${q.v} ${q.unit}`,O.x,O.y-18);
    }
    return svg;
  }

  /* ==================================================================
     QUESTION GENERATORS — EXPECTED
     ================================================================== */

  /* θ chosen with its divisor so θ·r/180 stays tidy in exact form. */
  const ARC_ANGLES=[[30,6],[45,4],[60,3],[90,2],[120,3],[135,4],[150,6],[180,1],[270,2]];
  function pickArc(u){
    const [theta,div]=choice(ARC_ANGLES),s=scaleFor(u);
    const r=multipleIn(div*s,3*s,14*s);
    return{theta,r,coef:theta*r/180};
  }
  function qArc(){
    const u=pickUnit(),{theta,r,coef}=pickArc(u);
    return{type:'sector',unit:u,theta,r,coef,plus:0,arcOnly:true,hasPi:true,promptKey:'arc',
           answer:fmtLen(coef,0,u)};
  }
  function qSectorPerim(){
    const u=pickUnit(),{theta,r,coef}=pickArc(u);
    return{type:'sector',unit:u,theta,r,coef,plus:2*r,arcOnly:false,hasPi:true,promptKey:'sector',
           answer:fmtLen(coef,2*r,u)};
  }
  /* A 45° wedge and a 270° one have very different shapes; sizing the radius
     from the wedge's own extent keeps both filling the card, and keeps the
     label text the same physical size in every question. */
  function sectorFit(theta){
    const angs=[0,theta].concat([90,180,270].filter(a=>a<theta));
    const xs=angs.map(a=>Math.cos(rad(a))).concat([0]);
    const ys=angs.map(a=>-Math.sin(rad(a))).concat([0]);
    const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    const R=Math.min(300/(x1-x0),180/(y1-y0),145);
    const w=R*(x1-x0),h=R*(y1-y0);
    return{R,O:P((VIEW.w-w)/2-R*x0,(VIEW.h-h)/2-R*y0-6)};
  }
  function drawSector(q){
    const svg=makeSvg(),f=sectorFit(q.theta),O=f.O,R=f.R,a0=0,a1=q.theta;
    const s=ptAng(O.x,O.y,a0,R),e=ptAng(O.x,O.y,a1,R);
    if(q.arcOnly){
      drawLine(svg,O,s,'thin'); drawLine(svg,O,e,'thin');
      drawPath(svg,arcD(O.x,O.y,R,a0,a1),'feature');
    }else{
      drawPath(svg,`M ${O.x} ${O.y} L ${s.x.toFixed(1)} ${s.y.toFixed(1)} ${tail(arcD(O.x,O.y,R,a0,a1))} Z`,'shape');
    }
    drawDot(svg,O,4.5);
    // Radius label on the 0° arm — above it once the wedge wraps below.
    drawText(svg,`${q.r} ${q.unit}`,O.x+R/2,O.y+22);
    // The angle at the centre.
    const lp=ptAng(O.x,O.y,q.theta/2,q.theta>200?48:42);
    drawText(svg,`${q.theta}°`,lp.x,lp.y,'angLabel');
    drawPath(svg,arcD(O.x,O.y,q.theta>200?32:28,a0,a1),'thin');
    return svg;
  }

  /* Semicircle and quadrant. */
  function qSemiQuad(){
    const u=pickUnit(),s=scaleFor(u),half=Math.random()<0.5;
    const r=multipleIn(2*s,4*s,14*s);
    const coef=half?r:r/2, plus=2*r;
    return{type:'semiquad',unit:u,half,r,coef,plus,hasPi:true,promptKey:'perim',
           answer:fmtLen(coef,plus,u)};
  }
  function drawSemiQuad(q){
    const svg=makeSvg();
    if(q.half){
      // Left end → right end along the diameter, then the arc back over the top.
      const O=P(210,198),R=140;
      drawPath(svg,`M ${(O.x-R)} ${O.y} L ${(O.x+R)} ${O.y} ${tail(arcD(O.x,O.y,R,0,180))} Z`,'shape');
      drawLine(svg,O,ptAng(O.x,O.y,0,R),'dashed');
      drawDot(svg,O,4.5);
      drawText(svg,`${q.r} ${q.unit}`,O.x+R/2,O.y+24);
    }else{
      const O=P(135,220),R=180;
      drawPath(svg,`M ${O.x} ${O.y} L ${(O.x+R)} ${O.y} ${tail(arcD(O.x,O.y,R,0,90))} Z`,'shape');
      drawDot(svg,O,4.5);
      drawText(svg,`${q.r} ${q.unit}`,O.x+R/2,O.y+24);
      rightMark(svg,O,P(O.x+R,O.y),P(O.x,O.y-R),16);
    }
    return svg;
  }

  /* Composite figures with a curved edge. */
  function qCompCurved(){
    const u=pickUnit(),s=scaleFor(u),kind=choice(['window','stadium','threeq']);
    if(kind==='window'){
      const w=multipleIn(2*s,6*s,16*s),h=multipleIn(s,4*s,14*s);
      return{type:'compCurved',kind,unit:u,w,h,coef:w/2,plus:w+2*h,hasPi:true,promptKey:'comp',
             answer:fmtLen(w/2,w+2*h,u)};
    }
    if(kind==='stadium'){
      const w=multipleIn(s,4*s,12*s),Lg=multipleIn(s,6*s,18*s);
      return{type:'compCurved',kind,unit:u,w,Lg,coef:w,plus:2*Lg,hasPi:true,promptKey:'comp',
             answer:fmtLen(w,2*Lg,u)};
    }
    const r=multipleIn(2*s,4*s,14*s);
    return{type:'compCurved',kind,unit:u,r,coef:3*r/2,plus:2*r,hasPi:true,promptKey:'comp',
           answer:fmtLen(3*r/2,2*r,u)};
  }
  function drawCompCurved(q){
    const svg=makeSvg(),u=q.unit;
    if(q.kind==='window'){
      // Up the right wall, over the semicircular top, down the left wall.
      const x0=125,x1=295,yTop=112,yBot=234,R=(x1-x0)/2,cx=(x0+x1)/2;
      drawPath(svg,`M ${x1} ${yBot} L ${x1} ${yTop} ${tail(arcD(cx,yTop,R,0,180))} L ${x0} ${yBot} Z`,'shape');
      drawLine(svg,P(x0,yTop),P(x1,yTop),'dashed');
      drawText(svg,`${q.w} ${u}`,cx,yBot+24);
      drawText(svg,`${q.h} ${u}`,x0-36,(yTop+yBot)/2);
      rightMark(svg,P(x0,yBot),P(x1,yBot),P(x0,yTop),13);
      rightMark(svg,P(x1,yBot),P(x0,yBot),P(x1,yTop),13);
    }else if(q.kind==='stadium'){
      // Anticlockwise: bottom edge, right cap (through 0°), top edge, left cap.
      const x0=142,x1=298,yT=100,yB=190,R=(yB-yT)/2,cy=(yT+yB)/2;
      drawPath(svg,`M ${x0} ${yB} L ${x1} ${yB} ${tail(arcD(x1,cy,R,270,90))} L ${x0} ${yT} ${tail(arcD(x0,cy,R,90,270))} Z`,'shape');
      drawLine(svg,P(x0,yT),P(x0,yB),'dashed');
      drawText(svg,`${q.Lg} ${u}`,(x0+x1)/2,yT-26);
      drawText(svg,`${q.w} ${u}`,x0-R-30,cy);
    }else{
      const O=P(185,160),R=100;
      drawPath(svg,`M ${O.x} ${O.y} L ${(O.x+R)} ${O.y} ${tail(arcD(O.x,O.y,R,0,270))} Z`,'shape');
      drawDot(svg,O,4.5);
      drawText(svg,`${q.r} ${u}`,O.x+R/2,O.y+24);
      rightMark(svg,O,P(O.x+R,O.y),P(O.x,O.y+R),16);
    }
    return svg;
  }

  /* Working backwards from a circumference. */
  function qReverse(){
    const u=pickUnit(),s=scaleFor(u),r=randInt(2,15)*s,wantD=Math.random()<0.45;
    const R=roundMode();
    const shown=givenLen(2*r,0,u);
    let ans;
    if(R.exact){ans=fmtPlain(wantD?2*r:r,u)}
    else{
      const cVal=Number((2*r*Math.PI).toFixed(R.dp));
      const val=wantD?cVal/Math.PI:cVal/(2*Math.PI);
      ans=`${val.toFixed(R.dp)} ${u}`;
    }
    return{type:'reverse',unit:u,r,wantD,shown,hasPi:false,promptKey:wantD?'findD':'findR',answer:ans};
  }
  function drawReverse(q){
    const svg=makeSvg(),O=P(210,128),R=92;
    drawCircle(svg,O,R,'shape open');
    drawDot(svg,O,4.5);
    if(q.wantD){const a=ptAng(O.x,O.y,180,R),b=ptAng(O.x,O.y,0,R);drawLine(svg,a,b,'dashed');drawText(svg,'d = ?',O.x,O.y-25,'qMark')}
    else{const e=ptAng(O.x,O.y,35,R);drawLine(svg,O,e,'dashed');const m=ptAng(O.x,O.y,62,R*0.62);drawText(svg,'r = ?',m.x,m.y,'qMark')}
    drawText(svg,`C = ${q.shown}`,210,252,'givenLabel');
    return svg;
  }

  /* Unit conversion: print one labelled side in a different unit. */
  function maybeConvert(q,keys){
    if(!unitsMixOn()||Math.random()>0.4)return;
    const k=choice(keys),v=q[k];
    if(q.unit==='cm'){q.convert={key:k,text:`${v*10} mm`}}
    else if(q.unit==='m'){q.convert={key:k,text:`${v*100} cm`}}
    else{q.convert={key:k,text:`${(v/10)} cm`}}
    q.giveIn=q.unit;
  }
  function sideText(q,key){
    if(q.convert&&q.convert.key===key)return q.convert.text;
    return `${q[key]} ${q.unit}`;
  }


  const DRAW = { para: drawPara, trap: drawTrap, rhombus: drawRhombus, kite: drawKite, lshape: drawLShape,
                 circleParts: drawCircleParts, circum: drawCircum, sector: drawSector, semiquad: drawSemiQuad,
                 compCurved: drawCompCurved, reverse: drawReverse };
  const GEN = { paraPerim: qPara, trapPerim: qTrap, rhombusPerim: qRhombus, kitePerim: qKite,
                compositeRect: qComposite, circleParts: qCircleParts, circumference: qCircum,
                arcLength: qArc, sectorPerim: qSectorPerim, semiQuadrant: qSemiQuad,
                compositeCurved: qCompCurved, reverseCircle: qReverse, compositeMissing: qCompositeMissing };

  /* ---- the key's reasons ---- */
  const PART_WHY = {
    radius: 'A radius joins the centre to the circle.', diameter: 'A diameter is a chord through the centre.',
    chord: 'A chord joins two points on the circle.', arc: 'An arc is part of the circle itself.',
    sector: 'A sector is cut off by two radii and an arc.', segment: 'A segment is cut off by a chord and an arc.',
    tangent: 'A tangent touches the circle at one point.' };
  const n = v => trim(v);
  function convNote(q) {
    if (q.convert) return `${q.convert.text} = ${n(q[q.convert.key])} ${q.unit}. `;
    if (q.convertKey) return `${lbl(q, q.convertKey, q[q.convertKey])} = ${n(q[q.convertKey])} ${q.unit}. `;
    return '';
  }
  function piExpr(coef, plus) {
    const c = coef === 1 ? '' : n(coef);
    return plus ? `${c}π + ${n(plus)}` : `${c}π`;
  }
  function whyOf(q) {
    const u = q.unit, A = q.answer, R = roundMode();
    const tail = (coef, plus) => R.exact ? ` = ${A}` : ` = ${piExpr(coef, plus)} ≈ ${A}`;
    switch (q.type) {
      case 'para': return `Opposite sides are equal: P = 2 × (${n(q.a)} + ${n(q.b)}) = ${A}`;
      case 'trap': return `${convNote(q)}Add the four sides: P = ${n(q.a)} + ${n(q.b)} + ${n(q.c)} + ${n(q.d)} = ${A}`;
      case 'rhombus': return `All four sides are equal: P = 4 × ${n(q.a)} = ${A}`;
      case 'kite': return `Two pairs of equal sides: P = 2 × (${n(q.a)} + ${n(q.b)}) = ${A}`;
      case 'lshape': return `${convNote(q)}${q.showAll ? '' : `The missing sides are ${n(q.H - q.nh)} ${u} and ${n(q.nw)} ${u}. `}The steps add up to the full width and height, so P = 2 × (${n(q.W)} + ${n(q.H)}) = ${A}`;
      case 'circleParts': return PART_WHY[q.part];
      case 'circum': return q.useRadius ? `C = 2πr = 2 × π × ${n(q.v)}${tail(q.coef, 0)}` : `C = πd = π × ${n(q.v)}${tail(q.coef, 0)}`;
      case 'sector': {
        const arc = `l = ${q.theta}/360 × 2π × ${n(q.r)}`;
        return q.arcOnly ? `${arc}${tail(q.coef, 0)}` : `${arc}, then add the two radii: P = ${piExpr(q.coef, 0)} + 2 × ${n(q.r)}${tail(q.coef, q.plus)}`;
      }
      case 'semiquad': return q.half ? `Half the circle plus the diameter: P = ½ × 2π × ${n(q.r)} + 2 × ${n(q.r)}${tail(q.coef, q.plus)}`
                                     : `A quarter of the circle plus two radii: P = ¼ × 2π × ${n(q.r)} + 2 × ${n(q.r)}${tail(q.coef, q.plus)}`;
      case 'compCurved':
        if (q.kind === 'window') return `Semicircle on a ${n(q.w)} ${u} diameter, plus three straight sides: P = ½ × π × ${n(q.w)} + ${n(q.w)} + 2 × ${n(q.h)}${tail(q.coef, q.plus)}`;
        if (q.kind === 'stadium') return `The two ends make one circle of diameter ${n(q.w)} ${u}: P = π × ${n(q.w)} + 2 × ${n(q.Lg)}${tail(q.coef, q.plus)}`;
        return `Three quarters of the circle plus two radii: P = ¾ × 2π × ${n(q.r)} + 2 × ${n(q.r)}${tail(q.coef, q.plus)}`;
      case 'reverse': return q.wantD ? `C = πd, so d = C ÷ π = ${A}` : `C = 2πr, so r = C ÷ (2π) = ${A}`;
    }
    return '';
  }

  function wrapType(id) {
    return () => {
      const q = GEN[id]();
      const en = LANG.en[q.promptKey] + (q.giveIn ? ' ' + fill(LANG.en.giveIn, { u: q.giveIn }) : '');
      return {
        prompt: en,
        loc: lg => lg === 'en' || !LANG[lg] ? '' : LANG[lg][q.promptKey] + (q.giveIn ? ' ' + fill(LANG[lg].giveIn, { u: q.giveIn }) : ''),
        diagram: { build: () => DRAW[q.type](q).outerHTML, fit: 0.56 },
        answerHTML: q.isWord ? (lg => lg === 'en' || !LANG[lg] ? q.answer : `${q.answerLocal(lg)} · ${q.answer}`) : q.answer,
        why: whyOf(q),
        mode: 'none',
        key: id + JSON.stringify(Object.keys(q).filter(k => typeof q[k] !== 'function').map(k => [k, q[k]]))
      };
    };
  }
  const T = (id, level, stmt, label) => ({ id: `${level === 'basic' ? 'b' : 'e'}-${id}`, level, stmt, label, gen: wrapType(id), paper: false });

  WSF.page({
    topic: 'Length', outcome: 'MA4-LEN-C-01', langKey: 'mmt-len-ws-lang', bank: false, defaultCount: 12,
    statements: STATEMENTS,
    css: `
.lenViz .shape{fill:rgba(37,99,235,.06);stroke:#111827;stroke-width:3.2;stroke-linejoin:round;stroke-linecap:round}
.lenViz .shape.open{fill:none}
.lenViz .thin{fill:none;stroke:#94a3b8;stroke-width:2;stroke-linecap:round}
.lenViz .dashed{fill:none;stroke:#111827;stroke-width:2;stroke-dasharray:7 6;stroke-linecap:round}
.lenViz .feature{fill:none;stroke:var(--blue);stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
.lenViz .featureFill{fill:rgba(37,99,235,.16);stroke:var(--blue);stroke-width:5;stroke-linejoin:round}
.lenViz .tickMark{stroke:#111827;stroke-width:2.6;stroke-linecap:round}
.lenViz .rightMark{fill:none;stroke:#111827;stroke-width:2.2;stroke-linejoin:round}
.lenViz .dot{fill:#111827}
.lenViz .sideLabel{font-family:var(--mathFont);font-weight:1000;font-size:19px;fill:#111827;text-anchor:middle;dominant-baseline:middle;paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}
.lenViz .angLabel{font-family:var(--mathFont);font-weight:1000;font-size:18px;fill:var(--blue);text-anchor:middle;dominant-baseline:middle;paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}
.lenViz .qMark{font-family:var(--mathFont);font-weight:1000;font-size:20px;fill:#475569;text-anchor:middle;dominant-baseline:middle}
.lenViz .givenLabel{font-family:var(--mathFont);font-weight:1000;font-size:20px;fill:#111827;text-anchor:middle;dominant-baseline:middle}
.lenViz{display:block;overflow:visible}`,
    intro: () => {
      const R = roundMode(), en = R.exact ? LANG.en.noteExact : R.dp === 0 ? LANG.en.noteWhole : fill(LANG.en.noteRound, { n: R.dp, pl: R.dp === 1 ? 'place' : 'places' });
      if (WSF.isEn()) return en;
      const L2 = LANG[WSF.lang()], loc = R.exact ? L2.noteExact : R.dp === 0 ? L2.noteWhole : fill(L2.noteRound, { n: R.dp, pl: '' });
      return `<span dir="rtl">${loc}</span> · ${en}`;
    },
    options: [
      { id: 'round', type: 'select', label: 'Answers', def: '1', regen: true, choices: [['1', 'Round to 1 decimal place'], ['2', 'Round to 2 decimal places'], ['0', 'Round to the nearest whole number'], ['exact', 'Exact — in terms of π']] },
      { id: 'units', type: 'switch', label: 'Mix units (some need converting)', def: false, regen: true },
      { id: 'ticks', type: 'switch', label: 'Mark equal sides', def: true },
      { id: 'right', type: 'switch', label: 'Right-angle marks', def: true }
    ],
    paperTypes: [
      T('paraPerim', 'basic', 'perimeter', 'Perimeter — parallelogram'),
      T('trapPerim', 'basic', 'perimeter', 'Perimeter — trapezium'),
      T('rhombusPerim', 'basic', 'perimeter', 'Perimeter — rhombus'),
      T('kitePerim', 'basic', 'perimeter', 'Perimeter — kite'),
      T('compositeRect', 'basic', 'perimeter', 'Perimeter — composite figure'),
      T('circleParts', 'basic', 'circles', 'Name the parts of a circle'),
      T('circumference', 'basic', 'circles', 'Circumference from r or d'),
      T('compositeMissing', 'expected', 'perimeter', 'Composite figures — missing sides'),
      T('arcLength', 'expected', 'circles', 'Arc length'),
      T('sectorPerim', 'expected', 'circles', 'Perimeter of a sector'),
      T('semiQuadrant', 'expected', 'circles', 'Semicircles and quadrants'),
      T('compositeCurved', 'expected', 'circles', 'Composite figures with curves'),
      T('reverseCircle', 'expected', 'circles', 'Work backwards — find r or d')
    ]
  });

})();
