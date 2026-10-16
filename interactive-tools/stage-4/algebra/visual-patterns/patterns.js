/* =====================================================================
   VISUAL PATTERNS — THE PATTERN LIBRARY
   ---------------------------------------------------------------------
   ONE file, shared by the teaching tool (index.html beside it) and the
   worksheet creator (worksheet-creators/stage-4/algebra/visual-patterns.html).
   Add a pattern here and it appears in both. Plain script, no modules, so it
   works from file:// and from GitHub Pages alike: everything hangs off
   window.MMT_VP.

   A pattern is ONE function, fig(n), returning the pieces of figure n. Every
   piece has a STABLE id: the same chair has the same id in figure 3 and in
   figure 4. That is what lets "build figure 4 from figure 3" and "grow it to
   figure 10" be animations of the real thing rather than cross-fades — a
   piece that moves keeps its id and slides; a new piece pops in.

   Pieces are written in y-UP units (one unit = one tile) and flipped to
   screen coordinates once, in the helpers below, so every pattern reads like
   the graph-paper sketch it came from.

   Every counted piece carries g[] — its colour in each "way of seeing".
   K = the part that is always there, A/a = repeated units (alternating so
   each unit can be told apart), B/C/D/E/F = other families. The colours are
   the argument; nothing on screen ever writes the rule.

   LINEAR patterns must grow by the same amount every time — the test harness
   checks it. CHALLENGE patterns (spice:'challenge', nonlinear:true) carry
   their own count(n) and rule string; count(n) is used before drawing so a
   figure with a million cubes is never built.
   ===================================================================== */
(function(){
'use strict';

const H3 = Math.sqrt(3)/2;
const R3 = Math.sqrt(3);
const NS = 'http://www.w3.org/2000/svg';
function E(tag, attrs, parent){
  const e = document.createElementNS(NS, tag);
  if(attrs) for(const k in attrs) e.setAttribute(k, attrs[k]);
  if(parent) parent.appendChild(e);
  return e;
}

/* ---------- piece helpers (y-up in, screen out) ---------- */
function T(id,cx,cy,g){ return { id, t:'sq', x:cx, y:-(cy+1), g }; }
function Dt(id,x,y,g,r){ return { id, t:'dot', x, y:-y, r:r||0.3, g }; }
function St(id,x1,y1,x2,y2,g){
  const dx = x2-x1, dy = -(y2-y1);
  return { id, t:'stick', x:x1, y:-y1, L:Math.hypot(dx,dy), a:Math.atan2(dy,dx)*180/Math.PI, g };
}
function Pg(id,pts){ return { id, t:'poly', x:0, y:0, pts:pts.map(([x,y])=>[x,-y]), count:false }; }
function Cb(id,X,Y,Z,g){ return { id, t:'cube', X, Y, Z, x:(X-Z)*H3, y:(X+Z)*0.5-Y, g }; }
/* a square seat centred at (x,y), turned to sit square to its table edge (angle in degrees, y-up) */
function Se(id,x,y,ang,g,s){ return { id, t:'seat', x, y:-y, a:-(ang||0), s:s||0.44, g }; }
const alt = k => (k%2 ? 'a' : 'A');
const pol = (cx,cy,r,deg) => [cx + r*Math.cos(deg*Math.PI/180), cy + r*Math.sin(deg*Math.PI/180)];
/* a seat beside the edge P→Q, pushed out along the normal on the side away from (ox,oy) */
function seatOn(id, P, Q, ox, oy, g, off){
  off = off ?? 0.33;
  const mx=(P[0]+Q[0])/2, my=(P[1]+Q[1])/2;
  let nx=-(Q[1]-P[1]), ny=Q[0]-P[0]; const L=Math.hypot(nx,ny); nx/=L; ny/=L;
  if((mx-ox)*nx + (my-oy)*ny < 0){ nx=-nx; ny=-ny; }
  const ang = Math.atan2(Q[1]-P[1], Q[0]-P[0])*180/Math.PI;
  return Se(id, mx+nx*off, my+ny*off, ang, g);
}

/* =====================================================================
   THE PATTERNS
   ===================================================================== */
const PATTERNS = [

/* ============================== SWEET ============================== */
{ id:'dotArray', name:'Rows of dots', noun:['dot','dots'], spice:'sweet', base:'dot', align:'bottom',
  ways:['Columns of three','Three rows'],
  fig(n){ if(n<0) return null; const o=[];
    for(let k=0;k<n;k++) for(let r=0;r<3;r++) o.push(Dt(`d${k}_${r}`,k,r,[alt(k),['B','C','D'][r]],0.27));
    return o; } },

{ id:'pinwheel', name:'Pinwheel', noun:['square','squares'], spice:'sweet', base:'tile', align:'centre',
  ways:['Four arms','Rings of four'],
  fig(n){ if(n<0) return null; const o=[];
    for(let i=0;i<n;i++){
      o.push(T('A'+i,-1,i,['A',alt(i)])); o.push(T('B'+i,i,0,['B',alt(i)]));
      o.push(T('C'+i,0,-1-i,['C',alt(i)])); o.push(T('D'+i,-1-i,-1,['D',alt(i)]));
    } return o; } },

{ id:'lshape', name:'Corner', noun:['square','squares'], spice:'sweet', base:'tile', align:'bottom',
  ways:['A corner and two arms','A column and a row'],
  fig(n){ if(n<0) return null; const o=[T('c',0,0,['K','B'])];
    for(let i=1;i<=n;i++){ o.push(T('u'+i,0,i,['A','B'])); o.push(T('r'+i,i,0,['D','C'])); }
    return o; } },

{ id:'dominoes', name:'Dominoes', noun:['square','squares'], spice:'sweet', base:'sand', align:'bottom',
  ways:['Columns of two','Two rows'],
  fig(n){ if(n<0) return null; const o=[];
    for(let k=0;k<n;k++){ o.push(T(`c${k}_0`,k,0,[alt(k),'B'])); o.push(T(`c${k}_1`,k,1,[alt(k),'C'])); }
    return o; } },

{ id:'sqDots', name:'Square of dots', noun:['dot','dots'], spice:'sweet', base:'dot', align:'bottom',
  ways:['Four sides of n','Four corners, then four sides of n − 1'],
  fig(n){ if(n<0) return null; if(n===0) return [];
    const o=[Dt('BL',0,0,['A','K'],.27), Dt('BR',n,0,['B','K'],.27), Dt('TR',n,n,['C','K'],.27), Dt('TL',0,n,['D','K'],.27)];
    for(let i=1;i<n;i++){
      o.push(Dt('b'+i,i,0,['A','A'],.27)); o.push(Dt('r'+i,n,i,['B','B'],.27));
      o.push(Dt('t'+i,i,n,['C','C'],.27)); o.push(Dt('l'+i,0,i,['D','D'],.27));
    } return o; } },

{ id:'triDots', name:'Triangle of dots', noun:['dot','dots'], spice:'sweet', base:'mint', align:'bottom',
  ways:['Three sides of n','Three corners, then three sides of n − 1'],
  fig(n){ if(n<0) return null; if(n===0) return [];
    const o=[Dt('A',0,0,['A','K'],.27), Dt('B',n,0,['B','K'],.27), Dt('C',n/2,n*H3,['C','K'],.27)];
    for(let i=1;i<n;i++){
      o.push(Dt('b'+i,i,0,['A','A'],.27));
      o.push(Dt('r'+i,n-i/2,i*H3,['B','B'],.27));
      o.push(Dt('l'+i,i/2,i*H3,['C','C'],.27));
    } return o; } },

{ id:'dice', name:'Dice fives', noun:['dot','dots'], spice:'sweet', base:'rose', align:'bottom',
  ways:['Groups of five','The middles and the corners'],
  fig(n){ if(n<0) return null; const o=[], P=[[0,0],[1.7,0],[.85,.85],[0,1.7],[1.7,1.7]];
    for(let k=0;k<n;k++) P.forEach(([x,y],j)=>o.push(Dt(`d${k}_${j}`,3.2*k+x,y,[alt(k), j===2?'K':'B'],.3)));
    return o; } },

{ id:'caterpillar', name:'Caterpillar', noun:['dot','dots'], spice:'sweet', base:'mint', align:'bottom',
  ways:['A head with two feelers, and the body'],
  fig(n){ if(n<0) return null; const o=[];
    for(let i=0;i<n;i++) o.push(Dt('b'+i,i,0,[alt(i)],.33));
    o.push(Dt('head',n+.12,.18,['K'],.43));
    o.push(Dt('f1',n-.05,1.08,['K'],.16)); o.push(Dt('f2',n+.55,1.02,['K'],.16));
    return o; } },

{ id:'twoRows', name:'Two rows of dots', noun:['dot','dots'], spice:'sweet', base:'dot', align:'bottom',
  ways:['Two rows of n + 1','Two to start, then two more each time'],
  fig(n){ if(n<0) return null; const o=[];
    for(let x=0;x<=n;x++) for(let y=0;y<2;y++) o.push(Dt(`d${x}_${y}`,x,y,[y?'C':'B', x===0?'K':alt(x)],.28));
    return o; } },

{ id:'sepSquares', name:'Matchstick squares, apart', noun:['matchstick','matchsticks'], spice:'sweet', base:'stick', align:'bottom',
  ways:['Squares of four','Tops, bottoms, lefts and rights'],
  fig(n){ if(n<0) return null; const o=[];
    for(let k=0;k<n;k++){ const x=1.5*k;
      o.push(St('b'+k,x,0,x+1,0,[alt(k),'A'])); o.push(St('r'+k,x+1,0,x+1,1,[alt(k),'B']));
      o.push(St('t'+k,x+1,1,x,1,[alt(k),'C'])); o.push(St('l'+k,x,1,x,0,[alt(k),'D']));
    } return o; } },

{ id:'cubeTrain', name:'Cube train', noun:['cube','cubes'], spice:'sweet', base:'cube', align:'bottom',
  ways:['A chimney of two and a row of n'],
  fig(n){ if(n<0) return null; const o=[];
    for(let i=0;i<n;i++) o.push(Cb('r'+i,i,0,0,[alt(i)]));
    o.push(Cb('h1',0,1,0,['K'])); o.push(Cb('h2',0,2,0,['K']));
    return o; } },

/* =============================== MILD =============================== */
{ id:'tables', name:'Trapezium tables', noun:['seat','seats'], spice:'mild', base:'seat', align:'centre',
  ways:['Two end seats, then three for each table','Five seats, then three more each time','A top row, a bottom row and two ends'],
  fig(n){ if(n<0) return null;
    const h=1.3, tables=[], seats=[];
    for(let k=0;k<n;k++){
      const a=1.5*k, up=(k%2===0);
      const P = up ? [[a,0],[a+2,0],[a+1.5,h],[a+.5,h]] : [[a+.5,0],[a+1.5,0],[a+2,h],[a,h]];
      tables.push(Pg('tb'+k, P));
      const w1 = k===0 ? 'K' : alt(k);
      const top = up ? [a+1] : [a+.55, a+1.45];
      const bot = up ? [a+.55, a+1.45] : [a+1];
      top.forEach((x,i)=>seats.push(Se(`t${k}u${i}`,x,h+.33,0,[alt(k),w1,'B'])));
      bot.forEach((x,i)=>seats.push(Se(`t${k}d${i}`,x,-.33,0,[alt(k),w1,'C'])));
    }
    seats.push(seatOn('endL',[0,0],[.5,h],1,h/2,['K','K','K']));
    const a=1.5*(n-1), lastUp=((n-1)%2===0);
    seats.push(lastUp ? seatOn('endR',[a+2,0],[a+1.5,h],a+1,h/2,['K','K','K'])
                      : seatOn('endR',[a+1.5,0],[a+2,h],a+1,h/2,['K','K','K']));
    return tables.concat(seats); } },

{ id:'squareTables', name:'Square tables', noun:['seat','seats'], spice:'mild', base:'seat', align:'centre',
  ways:['Two at the ends, two for each table','A top row, a bottom row and two ends'],
  fig(n){ if(n<0) return null; const tb=[], st=[];
    for(let k=0;k<n;k++){
      tb.push(Pg('tb'+k,[[k,0],[k+1,0],[k+1,1],[k,1]]));
      st.push(Se('u'+k,k+.5,1.33,0,[alt(k),'B'])); st.push(Se('d'+k,k+.5,-.33,0,[alt(k),'C']));
    }
    st.push(Se('eL',-.33,.5,90,['K','K'])); st.push(Se('eR',n+.33,.5,90,['K','K']));
    return tb.concat(st); } },

{ id:'triTables', name:'Triangle tables', noun:['seat','seats'], spice:'mild', base:'seat', align:'centre',
  ways:['Two at the ends, one for each table','Three for the first table, then one more each time'],
  fig(n){ if(n<0) return null; const s=1.4, h=s*H3, tb=[], st=[];
    for(let k=0;k<n;k++){
      const a=k*s/2, up=(k%2===0);
      const P = up ? [[a,0],[a+s,0],[a+s/2,h]] : [[a,h],[a+s,h],[a+s/2,0]];
      tb.push(Pg('tb'+k,P));
      const w1 = k===0 ? 'K' : alt(k);
      st.push(up ? seatOn('s'+k,[a,0],[a+s,0],a+s/2,h/2,[alt(k),w1]) : seatOn('s'+k,[a,h],[a+s,h],a+s/2,h/2,[alt(k),w1]));
    }
    st.push(seatOn('eL',[0,0],[s/2,h],s/2,h/3,['K','K']));
    const a=(n-1)*s/2, lastUp=((n-1)%2===0);
    st.push(lastUp ? seatOn('eR',[a+s,0],[a+s/2,h],a+s/2,h/3,['K','K']) : seatOn('eR',[a+s/2,0],[a+s,h],a+s/2,2*h/3,['K','K']));
    return tb.concat(st); } },

{ id:'matchSquares', name:'Matchstick squares', noun:['matchstick','matchsticks'], spice:'mild', base:'stick', align:'bottom',
  ways:['One stick, then three for each square','Four for the first square, then three more each time','Tops, bottoms and uprights'],
  fig(n){ if(n<0) return null; const o=[St('v0',0,0,0,1,['K','K','D'])];
    for(let k=0;k<n;k++){ const w1 = k===0 ? 'K' : alt(k);
      o.push(St('t'+k,k,1,k+1,1,[alt(k),w1,'B'])); o.push(St('b'+k,k,0,k+1,0,[alt(k),w1,'C']));
      o.push(St('v'+(k+1),k+1,0,k+1,1,[alt(k),w1,'D'])); }
    return o; } },

{ id:'matchTriangles', name:'Matchstick triangles', noun:['matchstick','matchsticks'], spice:'mild', base:'stick', align:'bottom',
  ways:['One stick, then two for each triangle','Slanted sticks and flat sticks'],
  fig(n){ if(n<0) return null;
    const dj = j => j%2===0 ? [j/2,0,j/2+.5,H3] : [(j+1)/2,0,(j-1)/2+.5,H3];
    const o=[St('d0',...dj(0),['K','B'])];
    for(let k=0;k<n;k++){
      /* flats run right to left, so each corner gets one head */
      if(k%2===0) o.push(St('f'+k,k/2+1,0,k/2,0,[alt(k),'C']));
      else        o.push(St('f'+k,(k-1)/2+1.5,H3,(k-1)/2+.5,H3,[alt(k),'C']));
      o.push(St('d'+(k+1),...dj(k+1),[alt(k),'B']));
    } return o; } },

{ id:'arch', name:'Bridge', noun:['block','blocks'], spice:'mild', base:'tile', align:'bottom',
  ways:['The six that are always there, plus the middle','A top row and four legs'],
  fig(n){ if(n<0) return null; const m=n+1;
    const o=[T('legL0',0,0,['K','C']),T('legL1',0,1,['K','C']),T('legR0',m,0,['K','C']),T('legR1',m,1,['K','C']),T('topL',0,2,['K','B']),T('topR',m,2,['K','B'])];
    for(let i=1;i<=n;i++) o.push(T('top'+i,i,2,[alt(i),'B']));
    return o; } },

{ id:'growT', name:'Growing T', noun:['square','squares'], spice:'mild', base:'mint', align:'bottom',
  ways:['Four that never change, and n on each side','A column of four and two arms'],
  fig(n){ if(n<0) return null;
    const o=[T('s0',0,0,['K','B']),T('s1',0,1,['K','B']),T('s2',0,2,['K','B']),T('b0',0,3,['K','B'])];
    for(let i=1;i<=n;i++){ o.push(T('bl'+i,-i,3,['A','C'])); o.push(T('br'+i,i,3,['a','D'])); }
    return o; } },

{ id:'comb', name:'Comb', noun:['square','squares'], spice:'mild', base:'sand', align:'bottom',
  ways:['Two to start, then three more each time','A spine and some teeth'],
  fig(n){ if(n<0) return null; const o=[T('s0',0,0,['K','B']),T('t0',0,1,['K','C'])];
    for(let k=1;k<=n;k++){
      o.push(T('s'+(2*k-1),2*k-1,0,[alt(k),'B'])); o.push(T('s'+(2*k),2*k,0,[alt(k),'B'])); o.push(T('t'+(2*k),2*k,1,[alt(k),'C']));
    } return o; } },

{ id:'snake', name:'Staircase path', noun:['square','squares'], spice:'mild', base:'rose', align:'bottom',
  ways:['A start square, then steps of two','Squares across and squares up'],
  fig(n){ if(n<0) return null; const o=[T('c0',0,0,['K','K'])];
    for(let i=1;i<=n;i++){ o.push(T('r'+i,i,i-1,[alt(i),'B'])); o.push(T('u'+i,i,i,[alt(i),'C'])); }
    return o; } },

{ id:'uShape', name:'Letter U', noun:['square','squares'], spice:'mild', base:'tile', align:'bottom',
  ways:['A base of three and two sides of n','Two columns of n + 1 and one in the middle'],
  fig(n){ if(n<0) return null; const o=[T('b0',0,0,['K','B']),T('b1',1,0,['K','K']),T('b2',2,0,['K','C'])];
    for(let i=1;i<=n;i++){ o.push(T('L'+i,0,i,['A','B'])); o.push(T('R'+i,2,i,['D','C'])); }
    return o; } },

{ id:'train', name:'Train', noun:['square','squares'], spice:'mild', base:'sand', align:'bottom',
  ways:['An engine of five, and three for each wagon','Eight to start, then three more each time'],
  fig(n){ if(n<0) return null;
    const o=[T('e0',0,0,['K','K']),T('e1',1,0,['K','K']),T('e2',2,0,['K','K']),T('e3',0,1,['K','K']),T('e4',2,1,['K','K'])];
    for(let k=0;k<n;k++) for(let j=0;j<3;j++) o.push(T(`w${k}_${j}`,4+4*k+j,0,[alt(k), k===0?'K':alt(k)]));
    return o; } },

{ id:'mountain', name:'Mountain range', noun:['dot','dots'], spice:'mild', base:'dot', align:'bottom',
  ways:['One, then two more each time','Valleys and peaks'],
  fig(n){ if(n<0) return null; const o=[];
    for(let x=0;x<=2*n;x++) o.push(Dt('m'+x,x*.9,x%2,[x===0?'K':alt(Math.ceil(x/2)), x%2?'C':'B'],.3));
    return o; } },

{ id:'cubeWall', name:'Cube wall', noun:['cube','cubes'], spice:'mild', base:'cube', align:'bottom',
  ways:['Columns of two, plus one on top','Two rows of n, plus one on top'],
  fig(n){ if(n<0) return null; const o=[];
    for(let i=0;i<n;i++){ o.push(Cb(`b${i}`,i,0,0,[alt(i),'B'])); o.push(Cb(`t${i}`,i,1,0,[alt(i),'C'])); }
    o.push(Cb('top',0,2,0,['K','K']));
    return o; } },

{ id:'cubeBench', name:'Cube bench', noun:['cube','cubes'], spice:'mild', base:'cube', align:'bottom',
  ways:['Four that are always there, and n in the middle','A seat of n + 2 and two legs'],
  fig(n){ if(n<0) return null; const m=n+1;
    const o=[Cb('L',0,0,0,['K','C']),Cb('R',m,0,0,['K','C']),Cb('s0',0,1,0,['K','B']),Cb('sR',m,1,0,['K','B'])];
    for(let i=1;i<=n;i++) o.push(Cb('s'+i,i,1,0,[alt(i),'B']));
    return o; } },

/* ============================== MEDIUM ============================== */
{ id:'plus', name:'Plus sign', noun:['square','squares'], spice:'medium', base:'tile', align:'centre',
  ways:['A centre and four arms','A column and two arms','A centre and rings of four'],
  fig(n){ if(n<0) return null; const o=[T('c',0,0,['K','B','K'])];
    for(let i=1;i<=n;i++){
      o.push(T('u'+i,0,i,['A','B',alt(i)])); o.push(T('r'+i,i,0,['B','C',alt(i)]));
      o.push(T('d'+i,0,-i,['C','B',alt(i)])); o.push(T('l'+i,-i,0,['D','C',alt(i)]));
    } return o; } },

{ id:'xTiles', name:'Letter X', noun:['square','squares'], spice:'medium', base:'sand', align:'centre',
  ways:['A centre and four arms','Two diagonals that share the middle'],
  fig(n){ if(n<0) return null; const o=[T('c',0,0,['K','B'])];
    for(let i=1;i<=n;i++){
      o.push(T('ne'+i,i,i,['A','B'])); o.push(T('nw'+i,-i,i,['B','C']));
      o.push(T('sw'+i,-i,-i,['C','B'])); o.push(T('se'+i,i,-i,['D','C']));
    } return o; } },

{ id:'frame', name:'Picture frame', noun:['tile','tiles'], spice:'medium', base:'tile', align:'bottom',
  ways:['Four corners and four sides','Four sides, each with one corner','Two long rows and two short sides'],
  fig(n){ if(n<0) return null; const m=n+1;
    const o=[T('BL',0,0,['K','A','B']),T('BR',m,0,['K','B','B']),T('TL',0,m,['K','D','B']),T('TR',m,m,['K','C','B'])];
    for(let i=1;i<=n;i++){
      o.push(T('b'+i,i,0,['A','A','B'])); o.push(T('r'+i,m,i,['B','B','C']));
      o.push(T('t'+i,i,m,['C','C','B'])); o.push(T('l'+i,0,i,['D','D','C']));
    } return o; } },

{ id:'pool1', name:'Pool border', noun:['tile','tiles'], spice:'medium', base:'mint', align:'bottom',
  ways:['Six around the ends, and two for each metre of pool','A top row and a bottom row of n + 2, and two ends'],
  fig(n){ if(n<0) return null; const m=n+1;
    const o=[T('BL',0,0,['K','B']),T('EL',0,1,['K','K']),T('TL',0,2,['K','C']),T('BR',m,0,['K','B']),T('ER',m,1,['K','K']),T('TR',m,2,['K','C'])];
    for(let i=1;i<=n;i++){ o.push(T('b'+i,i,0,[alt(i),'B'])); o.push(T('t'+i,i,2,[alt(i),'C'])); }
    return o; } },

{ id:'pool2', name:'Wide pool border', noun:['tile','tiles'], spice:'medium', base:'tile', align:'bottom',
  ways:['Eight around the ends, and two for each metre of pool','A top row and a bottom row of n + 2, and two ends of two'],
  fig(n){ if(n<0) return null; const m=n+1;
    const o=[T('BL',0,0,['K','B']),T('EL1',0,1,['K','K']),T('EL2',0,2,['K','K']),T('TL',0,3,['K','C']),
             T('BR',m,0,['K','B']),T('ER1',m,1,['K','K']),T('ER2',m,2,['K','K']),T('TR',m,3,['K','C'])];
    for(let i=1;i<=n;i++){ o.push(T('b'+i,i,0,[alt(i),'B'])); o.push(T('t'+i,i,3,[alt(i),'C'])); }
    return o; } },

{ id:'ringChain', name:'Chain of rings', noun:['square','squares'], spice:'medium', base:'rose', align:'bottom',
  ways:['A column of three, then five for each ring','Columns of three, and a top and bottom for each ring'],
  fig(n){ if(n<0) return null; const o=[];
    for(let j=0;j<3;j++) o.push(T('c0_'+j,0,j,['K','B']));
    for(let k=0;k<n;k++){
      o.push(T('b'+k,2*k+1,0,[alt(k),'C'])); o.push(T('t'+k,2*k+1,2,[alt(k),'C']));
      for(let j=0;j<3;j++) o.push(T(`r${k}_${j}`,2*k+2,j,[alt(k),'B']));
    } return o; } },

{ id:'cubes', name:'Cube corner', noun:['cube','cubes'], spice:'medium', base:'cube', align:'bottom',
  ways:['A corner cube and three arms','A tower and two arms'],
  fig(n){ if(n<0) return null; const o=[Cb('c',0,0,0,['K','B'])];
    for(let i=1;i<=n;i++){ o.push(Cb('z'+i,0,0,i,['C','C'])); o.push(Cb('x'+i,i,0,0,['A','C'])); o.push(Cb('y'+i,0,i,0,['B','B'])); }
    return o; } },

{ id:'cubeStar', name:'Corner walls', noun:['cube','cubes'], spice:'medium', base:'cube', align:'bottom',
  ways:['A corner column of two, and two walls two cubes high','Two rows of 2n + 1, one on top of the other'],
  fig(n){ if(n<0) return null; const o=[Cb('c0',0,0,0,['K','B']),Cb('c1',0,1,0,['K','C'])];
    for(let i=1;i<=n;i++) for(let y=0;y<2;y++){
      o.push(Cb(`x${i}_${y}`,i,y,0,['A', y?'C':'B'])); o.push(Cb(`z${i}_${y}`,0,y,i,['D', y?'C':'B']));
    } return o; } },

{ id:'sun', name:'Sunburst', noun:['dot','dots'], spice:'medium', base:'sun', align:'centre',
  ways:['A centre and six rays','Three lines through the middle'],
  fig(n){ if(n<0) return null; const o=[Dt('c',0,0,['K','K'],.32)], R=['A','B','C','D','E','F'], L=['B','C','D','B','C','D'];
    for(let r=0;r<6;r++) for(let i=1;i<=n;i++){ const [x,y]=pol(0,0,i*.95,60*r); o.push(Dt(`r${r}_${i}`,x,y,[R[r],L[r]],.3)); }
    return o; } },

{ id:'houses', name:'Matchstick houses', noun:['matchstick','matchsticks'], spice:'medium', base:'stick', align:'bottom',
  ways:['One wall, then five for each house','Roofs on top of a row of squares','Six for the first house, then five more each time'],
  fig(n){ if(n<0) return null; const o=[St('v0',0,0,0,1,['K','D','K'])];
    for(let k=0;k<n;k++){ const w2 = k===0 ? 'K' : alt(k);
      o.push(St('f'+k,k,0,k+1,0,[alt(k),'D',w2])); o.push(St('c'+k,k,1,k+1,1,[alt(k),'D',w2]));
      o.push(St('v'+(k+1),k+1,0,k+1,1,[alt(k),'D',w2]));
      o.push(St('rl'+k,k,1,k+.5,1+H3,[alt(k),'B',w2])); o.push(St('rr'+k,k+.5,1+H3,k+1,1,[alt(k),'B',w2]));
    } return o; } },

{ id:'fence', name:'Matchstick fence', noun:['matchstick','matchsticks'], spice:'medium', base:'stick', align:'bottom',
  ways:['One post, then a post and three rails each time','Posts and rails'],
  fig(n){ if(n<0) return null; const o=[St('p0',0,0,0,1.6,['K','D'])];
    for(let k=0;k<n;k++){
      [.35,.8,1.25].forEach((y,j)=>o.push(St(`r${k}_${j}`,k,y,k+1,y,[alt(k),'B'])));
      o.push(St('p'+(k+1),k+1,0,k+1,1.6,[alt(k),'D']));
    } return o; } },

{ id:'panes', name:'Window panes', noun:['matchstick','matchsticks'], spice:'medium', base:'stick', align:'bottom',
  ways:['Two, then five more each time','Three rows of n and n + 1 columns of two'],
  fig(n){ if(n<0) return null; const o=[St('v0_0',0,0,0,1,['K','C']),St('v0_1',0,1,0,2,['K','C'])];
    for(let k=0;k<n;k++){
      for(let y=0;y<3;y++) o.push(St(`h${k}_${y}`,k,y,k+1,y,[alt(k),'B']));
      o.push(St(`v${k+1}_0`,k+1,0,k+1,1,[alt(k),'C'])); o.push(St(`v${k+1}_1`,k+1,1,k+1,2,[alt(k),'C']));
    } return o; } },

{ id:'hexChain', name:'Matchstick hexagons', noun:['matchstick','matchsticks'], spice:'medium', base:'stick', align:'centre',
  ways:['One stick, then five for each hexagon','Six for the first hexagon, then five more each time'],
  fig(n){ if(n<0) return null;
    const v=(k,d)=>pol(k*R3,0,1,d);
    const o=[St('L0',...v(0,210),...v(0,150),['K','K'])];
    for(let k=0;k<n;k++){ const w1 = k===0 ? 'K' : alt(k);
      o.push(St('tl'+k,...v(k,150),...v(k,90),[alt(k),w1])); o.push(St('tr'+k,...v(k,90),...v(k,30),[alt(k),w1]));
      o.push(St('rt'+k,...v(k,330),...v(k,30),[alt(k),w1]));
      o.push(St('br'+k,...v(k,330),...v(k,270),[alt(k),w1])); o.push(St('bl'+k,...v(k,270),...v(k,210),[alt(k),w1]));
    } return o; } },

{ id:'hexTables', name:'Hexagon tables', noun:['seat','seats'], spice:'medium', base:'seat', align:'centre',
  ways:['Two at the ends, four for each table','Top seats, bottom seats and two ends'],
  fig(n){ if(n<0) return null; const tb=[], st=[];
    const v=(k,d)=>pol(k*R3,0,1,d);
    for(let k=0;k<n;k++){
      tb.push(Pg('tb'+k,[30,90,150,210,270,330].map(d=>v(k,d))));
      const cx=k*R3;
      st.push(seatOn('tl'+k,v(k,150),v(k,90),cx,0,[alt(k),'B'],.3)); st.push(seatOn('tr'+k,v(k,90),v(k,30),cx,0,[alt(k),'B'],.3));
      st.push(seatOn('bl'+k,v(k,270),v(k,210),cx,0,[alt(k),'C'],.3)); st.push(seatOn('br'+k,v(k,330),v(k,270),cx,0,[alt(k),'C'],.3));
    }
    st.push(seatOn('eL',v(0,150),v(0,210),0,0,['K','K'],.3));
    st.push(seatOn('eR',v(n-1,30),v(n-1,330),(n-1)*R3,0,['K','K'],.3));
    return tb.concat(st); } },

/* =============================== SPICY =============================== */
{ id:'vdots', name:'V of dots', noun:['dot','dots'], spice:'spicy', base:'dot', align:'bottom',
  ways:['The point and two arms','One long arm and one short arm'],
  fig(n){ if(n<1) return null; const o=[Dt('v',0,0,['K','B'])];   /* figure 0 would need −1 dots */
    for(let i=1;i<n;i++){ o.push(Dt('L'+i,-i,i,['A','B'])); o.push(Dt('R'+i,i,i,['D','C'])); }
    return o; } },

{ id:'xDots', name:'X of dots', noun:['dot','dots'], spice:'spicy', base:'rose', align:'centre',
  ways:['A centre and four arms','Two diagonals that share the middle'],
  fig(n){ if(n<1) return null; const o=[Dt('c',0,0,['K','B'],.3)];   /* figure 0 would need −3 dots */
    for(let i=1;i<n;i++){
      o.push(Dt('ne'+i,i*.9,i*.9,['A','B'],.3)); o.push(Dt('nw'+i,-i*.9,i*.9,['B','C'],.3));
      o.push(Dt('sw'+i,-i*.9,-i*.9,['C','B'],.3)); o.push(Dt('se'+i,i*.9,-i*.9,['D','C'],.3));
    } return o; } },

{ id:'stairOutline', name:'Staircase outline', noun:['matchstick','matchsticks'], spice:'spicy', base:'stick', align:'bottom',
  ways:['A floor, a wall, treads and risers — n of each','Up the steps, then back along the wall and floor'],
  fig(n){ if(n<0) return null; const o=[];
    for(let i=0;i<n;i++){
      o.push(St('f'+i,i+1,0,i,0,['A','C']));
      o.push(St('r'+i,i,i,i,i+1,['B','B']));
      o.push(St('t'+i,i,i+1,i+1,i+1,['C','B']));
      o.push(St('w'+i,n,i,n,i+1,['D','C']));
    } return o; } },

/* ===================== CHALLENGE — NOT LINEAR ===================== */
{ id:'stairs', name:'Staircase', noun:['square','squares'], spice:'challenge', nonlinear:true, base:'mint', align:'bottom',
  rule:'n(n + 1) ÷ 2', count:n=>n*(n+1)/2,
  ways:['Columns of 1, 2, 3, …','Rows'],
  fig(n){ if(n<0) return null; const o=[];
    for(let x=0;x<n;x++) for(let y=0;y<=x;y++) o.push(T(`c${x}_${y}`,x,y,[alt(x),y%2?'C':'B']));
    return o; } },

{ id:'squares', name:'Growing squares', noun:['square','squares'], spice:'challenge', nonlinear:true, base:'tile', align:'bottom',
  rule:'n²', count:n=>n*n,
  ways:['n rows of n','Layers of odd numbers: 1, 3, 5, …'],
  fig(n){ if(n<0) return null; const o=[];
    for(let k=0;k<n;k++) for(let y=0;y<=k;y++) for(let x=0;x<=k;x++){ if(Math.max(x,y)!==k) continue; o.push(T(`c${x}_${y}`,x,y,[y%2?'C':'B',alt(k)])); }
    return o; } },

{ id:'rects', name:'Growing rectangles', noun:['square','squares'], spice:'challenge', nonlinear:true, base:'sand', align:'bottom',
  rule:'n(n + 1)', count:n=>n*(n+1),
  ways:['n rows of n + 1','A square and one more column'],
  fig(n){ if(n<0) return null; const o=[];
    for(let k=0;k<=n;k++) for(let y=0;y<n;y++) for(let x=0;x<=n;x++){
      const layer=Math.max(x, y+1); if(layer!==k) continue;
      o.push(T(`c${x}_${y}`,x,y,[y%2?'C':'B', x===n?'K':'B']));
    } return o; } },

{ id:'pyramid', name:'Step pyramid', noun:['square','squares'], spice:'challenge', nonlinear:true, base:'tile', align:'bottom',
  rule:'(n + 1)²', count:n=>(n+1)*(n+1),
  ways:['Layers','Two staircases'],
  fig(n){ if(n<0) return null; const o=[];
    for(let x=0;x<=2*n;x++){ const h=Math.min(x+1,2*n+1-x); for(let y=0;y<h;y++) o.push(T(`c${x}_${y}`,x,y,[y%2?'C':'B', x<=n?'B':'C'])); }
    return o; } },

{ id:'diamond', name:'Diamond', noun:['square','squares'], spice:'challenge', nonlinear:true, base:'rose', align:'centre',
  rule:'n² + (n − 1)²', count:n=>n<1?0:n*n+(n-1)*(n-1),
  ways:['A big square and a smaller square, woven together','Rings around the middle'],
  fig(n){ if(n<1) return null; const o=[];
    for(let r=0;r<n;r++) for(let x=-r;x<=r;x++) for(let y=-r;y<=r;y++){
      if(Math.abs(x)+Math.abs(y)!==r) continue;
      o.push(T(`c${x}_${y}`,x,y,[((x+y+n+1)%2===0)?'B':'C', r===0?'K':alt(r)]));
    } return o; } },

{ id:'squareTail', name:'Square with a tail', noun:['square','squares'], spice:'challenge', nonlinear:true, base:'mint', align:'bottom',
  rule:'n² + n + 1', count:n=>n*n+n+1,
  ways:['A square of n² and a tail of n + 1'],
  fig(n){ if(n<0) return null; const o=[];
    for(let k=0;k<n;k++) for(let y=0;y<=k;y++) for(let x=0;x<=k;x++){ if(Math.max(x,y)!==k) continue; o.push(T(`s${x}_${y}`,x,y,['B'])); }
    for(let i=0;i<=n;i++) o.push(T('t'+i,n+i,0,['C']));
    return o; } },

{ id:'cornerless', name:'Square missing a corner', noun:['square','squares'], spice:'challenge', nonlinear:true, base:'sand', align:'bottom',
  rule:'(n + 1)² − 1', count:n=>(n+1)*(n+1)-1,
  ways:['A whole square, with one taken away','Layers'],
  fig(n){ if(n<0) return null; const o=[];
    for(let k=0;k<=n;k++) for(let y=0;y<=k;y++) for(let x=0;x<=k;x++){
      if(Math.max(x,y)!==k) continue; if(x===n && y===n) continue;
      o.push(T(`c${x}_${y}`,x,y,['B',alt(k)]));
    } return o; } },

{ id:'twoBlocks', name:'Two blocks', noun:['square','squares'], spice:'challenge', nonlinear:true, base:'mint', align:'bottom',
  rule:'2n² + 2n + 3', count:n=>n<1?0:2*n*n+2*n+3,
  credit:'Adapted from visualpatterns.org (Fawn Nguyen, CC BY 4.0)',
  ways:['Two blocks of n × (n + 1), and three more'],
  fig(n){ if(n<1) return null; const o=[];
    for(let k=0;k<=n;k++) for(let y=0;y<n;y++) for(let x=0;x<=n;x++){ if(Math.max(x,y)!==k) continue; o.push(T(`L${x}_${y}`,x,y,['B'])); }
    for(let k=0;k<=n;k++) for(let j=0;j<=n;j++) for(let i=0;i<n;i++){ if(Math.max(i,j)!==k) continue; o.push(T(`U${i}_${j}`,n+1+i,n+j,['C'])); }
    o.push(T('pole',0,n,['K'])); o.push(T('link',n+1,n-1,['K'])); o.push(T('nub',n,2*n,['K']));
    return o; } },

{ id:'triangleDots', name:'Triangle numbers', noun:['dot','dots'], spice:'challenge', nonlinear:true, base:'dot', align:'bottom',
  rule:'n(n + 1) ÷ 2', count:n=>n*(n+1)/2,
  ways:['Rows of 1, 2, 3, …','Diagonals'],
  fig(n){ if(n<0) return null; const o=[];
    for(let k=0;k<n;k++) for(let j=0;j<=k;j++){ const i=k-j; o.push(Dt(`d${i}_${j}`,i+j/2,j*H3,[j%2?'C':'B',alt(k)],.3)); }
    return o; } },

{ id:'hexDots', name:'Hexagon numbers', noun:['dot','dots'], spice:'challenge', nonlinear:true, base:'sun', align:'centre',
  rule:'3n² − 3n + 1', count:n=>n<1?0:3*n*n-3*n+1,
  ways:['A centre and rings of six, twelve, eighteen, …'],
  fig(n){ if(n<1) return null; const o=[];
    for(let r=0;r<n;r++) for(let q=-r;q<=r;q++) for(let s=-r;s<=r;s++){
      if(Math.max(Math.abs(q),Math.abs(s),Math.abs(q+s))!==r) continue;
      o.push(Dt(`h${q}_${s}`,q+s/2,s*H3,[r===0?'K':alt(r)],.3));
    } return o; } },

{ id:'matchGrid', name:'Matchstick grid', noun:['matchstick','matchsticks'], spice:'challenge', nonlinear:true, base:'stick', align:'bottom',
  rule:'2n(n + 1)', count:n=>2*n*(n+1),
  ways:['Horizontal sticks and vertical sticks'],
  fig(n){ if(n<0) return null; const o=[];
    for(let k=0;k<n;k++){
      for(let x=0;x<=k;x++) for(let y=0;y<=k+1;y++){ if(Math.max(x+1,y)!==k+1) continue; o.push(St(`h${x}_${y}`,x,y,x+1,y,['B'])); }
      for(let x=0;x<=k+1;x++) for(let y=0;y<=k;y++){ if(Math.max(x,y+1)!==k+1) continue; o.push(St(`v${x}_${y}`,x,y,x,y+1,['C'])); }
    } return o; } },

{ id:'matchTriTri', name:'Triangle of matchstick triangles', noun:['matchstick','matchsticks'], spice:'challenge', nonlinear:true, base:'stick', align:'bottom',
  rule:'3n(n + 1) ÷ 2', count:n=>3*n*(n+1)/2,
  ways:['Small triangles of three, row by row'],
  fig(n){ if(n<0) return null; const o=[];
    for(let k=0;k<n;k++) for(let j=0;j<=k;j++){ const i=k-j, x=i+j/2, y=j*H3;
      o.push(St(`b${i}_${j}`,x+1,y,x,y,[alt(j)])); o.push(St(`l${i}_${j}`,x,y,x+.5,y+H3,[alt(j)])); o.push(St(`r${i}_${j}`,x+.5,y+H3,x+1,y,[alt(j)]));
    } return o; } },

{ id:'cubeCube', name:'Cube of cubes', noun:['cube','cubes'], spice:'challenge', nonlinear:true, base:'cube', align:'bottom',
  rule:'n³', count:n=>n*n*n,
  ways:['n layers of n²'],
  fig(n){ if(n<0) return null; const o=[];
    for(let k=0;k<n;k++) for(let y=0;y<=k;y++) for(let x=0;x<=k;x++) for(let z=0;z<=k;z++){
      if(Math.max(x,y,z)!==k) continue; o.push(Cb(`c${x}_${y}_${z}`,x,y,z,[alt(y)]));
    } return o; } },

{ id:'cubePyramid', name:'Cube pyramid', noun:['cube','cubes'], spice:'challenge', nonlinear:true, base:'cube', align:'bottom',
  rule:'1² + 2² + 3² + … + n²', count:n=>n*(n+1)*(2*n+1)/6,
  ways:['Layers of square numbers'],
  fig(n){ if(n<0) return null; const o=[];
    for(let k=0;k<n;k++) for(let y=0;y<=k;y++){ const side=k-y; for(let x=0;x<=side;x++) for(let z=0;z<=side;z++){
      if(Math.max(x,z)!==side) continue; o.push(Cb(`c${x}_${y}_${z}`,x,y,z,[alt(y)]));
    } } return o; } },

{ id:'doubling', name:'Doubling', noun:['square','squares'], spice:'challenge', nonlinear:true, base:'rose', align:'bottom',
  rule:'2ⁿ⁻¹  (doubling each time)', count:n=>n<1?0:Math.pow(2,n-1),
  ways:['Two copies of the figure before'],
  fig(n){ if(n<1) return null; let P=[[0,0]], w=1, h=1;
    for(let s=2;s<=n;s++){ const c=P.length; for(let i=0;i<c;i++){ const [x,y]=P[i]; P.push(s%2===0 ? [x+w,y] : [x,y+h]); } if(s%2===0) w*=2; else h*=2; }
    const half = P.length/2;
    return P.map(([x,y],i)=>T('d'+i,x,y,[n>1 && i>=half ? 'C' : 'B'])); } }
];

/* ---------- colours ---------- */
const PAL = {
  tile: { light:'#eaf3ff', mid:'#c9e0fb', side:'#93bbee', dark:'#2f63c9' },
  sand: { light:'#fbf1e2', mid:'#efd3a6', side:'#dfb371', dark:'#9a6b25' },
  mint: { light:'#e4f8f3', mid:'#aee8db', side:'#74d3bf', dark:'#23856f' },
  rose: { light:'#fdecef', mid:'#f9c6d0', side:'#f29aac', dark:'#b4234a' },
  sun:  { light:'#fff3d6', mid:'#fcd77a', side:'#f6bd3f', dark:'#a86a07' },
  seat: { light:'#ead8c6', mid:'#a8754c', side:'#8d5f39', dark:'#5a3920' },
  dot:  { light:'#e0e7ff', mid:'#6d82ef', side:'#4f63d8', dark:'#1e2f8a' },
  stick:{ light:'#fdecc8', mid:'#f3c770', side:'#e2a446', dark:'#9a5b13', head:'#d62828' },
  cube: { light:'#e8f1ff', mid:'#a9c9f6', side:'#6c9fe4', dark:'#1e3f8f' },
  ink:  { light:'#f3f4f6', mid:'#e5e7eb', side:'#c9ced6', dark:'#111827', head:'#111827' },
  K:    { light:'#f1ecff', mid:'#c4b5fd', side:'#a78bfa', dark:'#5b21b6' },
  A:    { light:'#ffedd5', mid:'#fdba74', side:'#fb923c', dark:'#c2410c' },
  a:    { light:'#fef3c7', mid:'#fbbf24', side:'#f59e0b', dark:'#92400e' },
  B:    { light:'#dcfce7', mid:'#86efac', side:'#4ade80', dark:'#15803d' },
  C:    { light:'#fce7f3', mid:'#f9a8d4', side:'#f472b6', dark:'#be185d' },
  D:    { light:'#e0f2fe', mid:'#7dd3fc', side:'#38bdf8', dark:'#0369a1' },
  E:    { light:'#fee2e2', mid:'#fca5a5', side:'#f87171', dark:'#b91c1c' },
  F:    { light:'#e0e7ff', mid:'#a5b4fc', side:'#818cf8', dark:'#3730a3' },
  N:    { light:'#ffedd5', mid:'#fb923c', side:'#f97316', dark:'#9a3412' }
};
const TABLE = { fill:'#d3e8fb', stroke:'#3f7fc2' };
const TABLE_INK = { fill:'#f3f4f6', stroke:'#111827' };

const SPICE_ORDER = ['sweet','mild','medium','spicy','challenge'];
const SPICE_NAME = { sweet:'Sweet', mild:'Mild', medium:'Medium', spicy:'Spicy', challenge:'Challenge' };

/* ---------- geometry ---------- */
function elBox(e){
  switch(e.t){
    case 'sq':   return [e.x, e.x+1, e.y, e.y+1];
    case 'dot':  return [e.x-e.r, e.x+e.r, e.y-e.r, e.y+e.r];
    case 'seat': { const r=e.s*0.72; return [e.x-r, e.x+r, e.y-r, e.y+r]; }
    case 'stick':{
      const r=e.a*Math.PI/180, x2=e.x+e.L*Math.cos(r), y2=e.y+e.L*Math.sin(r), w=.09;
      return [Math.min(e.x,x2)-w, Math.max(e.x,x2)+w, Math.min(e.y,y2)-w, Math.max(e.y,y2)+w];
    }
    case 'poly':{ const xs=e.pts.map(p=>p[0]), ys=e.pts.map(p=>p[1]); return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]; }
    case 'cube': return [e.x-H3, e.x+H3, e.y-1, e.y+1];
  }
}
function elCentre(e){
  switch(e.t){
    case 'sq': return [e.x+.5, e.y+.5];
    case 'stick':{ const r=e.a*Math.PI/180; return [e.x+e.L/2*Math.cos(r), e.y+e.L/2*Math.sin(r)]; }
    case 'poly':{ const b=elBox(e); return [(b[0]+b[1])/2,(b[2]+b[3])/2]; }
    case 'cube': return [e.x, e.y-.15];
    default: return [e.x, e.y];
  }
}
function boxOf(els){
  if(!els || !els.length) return null;
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
  for(const e of els){ const b=elBox(e); x0=Math.min(x0,b[0]); x1=Math.max(x1,b[1]); y0=Math.min(y0,b[2]); y1=Math.max(y1,b[3]); }
  return { minX:x0, maxX:x1, minY:y0, maxY:y1, w:x1-x0, h:y1-y0 };
}

/* A matchstick's head goes at whichever end is clear of the heads already
   placed. Sticks are visited in the order the pattern built them, and every
   figure's sticks are the figure before's plus new ones (patterns build in
   growth order), so a head never changes ends as the pattern grows. */
function placeHeads(els){
  if(!els) return els;
  const heads=[];
  for(const e of els){
    if(e.t!=='stick') continue;
    const r=e.a*Math.PI/180, cs=Math.cos(r), sn=Math.sin(r);
    const atEnd=[e.x+(e.L-.19)*cs, e.y+(e.L-.19)*sn], atStart=[e.x+.19*cs, e.y+.19*sn];
    const near=p=>heads.reduce((m,h)=>Math.min(m,Math.hypot(h[0]-p[0],h[1]-p[1])), 9);
    e.headAtStart = near(atEnd) < .5 && near(atStart) > near(atEnd);
    heads.push(e.headAtStart ? atStart : atEnd);
  }
  return els;
}

/* ---------- figures, counts and rules ---------- */
const CACHE = new Map();
function figure(p, n){
  if(n==null) return [];
  const key = p.id+':'+n;
  if(!CACHE.has(key)){
    if(CACHE.size > 4000) CACHE.clear();
    CACHE.set(key, placeHeads(p.fig(n)));
  }
  return CACHE.get(key);
}
function countOf(p, n){
  if(n==null) return null;
  if(p.count) return (p.nonlinear && p.fig(0)===null && n<1) ? null : p.count(n);
  const f = figure(p, n);
  return f ? f.filter(e=>e.count!==false).length : null;
}
/* pieces that would be DRAWN (including tables) — used to refuse a figure too big to build */
function sizeOf(p, n){
  if(p.count){ const c=p.count(n); return c==null ? 0 : c; }
  const f = figure(p, n); return f ? f.length : 0;
}
/* the rule, written for the answer key: "3n + 2", "4n", "n + 6", "2n − 1" */
function ruleOf(p){
  if(p.rule) return p.rule;
  const c1=countOf(p,1), c2=countOf(p,2), m=c2-c1, b=c1-m;
  let s = (m===1 ? '' : String(m)) + 'n';
  if(b>0) s += ' + ' + b; else if(b<0) s += ' − ' + (-b);
  return s;
}
function slope(p){ return p.nonlinear ? null : countOf(p,2)-countOf(p,1); }
function intercept(p){ return p.nonlinear ? null : countOf(p,1)-slope(p); }

/* ---------- drawing (shared by the board, the gallery and the worksheet) ---------- */
function drawEl(e, parent){
  const g = E('g', { class:'el' });
  g.dataset.id = e.id;
  const inner = E('g', { class:'inner' }, g);
  switch(e.t){
    case 'sq':
      E('rect', { class:'shp', x:.035, y:.035, width:.93, height:.93, rx:.1, 'stroke-width':2.2 }, inner); break;
    case 'dot':
      E('circle', { class:'shp', cx:0, cy:0, r:e.r, 'stroke-width':1.8 }, inner); break;
    case 'seat':{
      const r = E('g', { transform:`rotate(${e.a})` }, inner);
      E('rect', { class:'shp', x:-e.s/2, y:-e.s/2, width:e.s, height:e.s, rx:e.s*.16, 'stroke-width':1.8 }, r);
      break;
    }
    case 'stick':{
      const r = E('g', { transform:`rotate(${e.a})` }, inner);
      E('rect', { class:'shp', x:.06, y:-.066, width:e.L-.12, height:.132, rx:.066, 'stroke-width':1.3 }, r);
      E('ellipse', { class:'head', cx:e.headAtStart ? .19 : e.L-.19, cy:0, rx:.1, ry:.088, 'stroke-width':1 }, r);
      break;
    }
    case 'poly':
      E('polygon', { class:'deco', points:e.pts.map(p=>p.join(',')).join(' '), fill:TABLE.fill, stroke:TABLE.stroke, 'stroke-width':2, 'stroke-linejoin':'round' }, inner); break;
    case 'cube':{
      const P=(x,y,z)=>[((x-z)*H3).toFixed(4), ((x+z)*.5-y).toFixed(4)].join(',');
      E('polygon', { class:'cf top',   points:[P(0,1,0),P(1,1,0),P(1,1,1),P(0,1,1)].join(' '), 'stroke-width':1.5, 'stroke-linejoin':'round' }, inner);
      E('polygon', { class:'cf left',  points:[P(0,0,1),P(1,0,1),P(1,1,1),P(0,1,1)].join(' '), 'stroke-width':1.5, 'stroke-linejoin':'round' }, inner);
      E('polygon', { class:'cf right', points:[P(1,0,0),P(1,1,0),P(1,1,1),P(1,0,1)].join(' '), 'stroke-width':1.5, 'stroke-linejoin':'round' }, inner);
      break;
    }
  }
  /* outlines keep their width at any scale (the board, the gallery, the paper) */
  g.querySelectorAll('.shp,.head,.deco,.cf').forEach(x=>x.setAttribute('vector-effect','non-scaling-stroke'));
  g.style.transform = `translate(${e.x}px,${e.y}px)`;
  g._el = e;
  if(parent) parent.appendChild(g);
  return g;
}
function paintEl(g, key, faded){
  const e = g._el;
  g.style.opacity = faded ? '.22' : '';
  if(e.t==='poly'){
    const t = key==='ink' ? TABLE_INK : TABLE;
    const p = g.querySelector('.deco'); p.style.fill=t.fill; p.style.stroke=t.stroke;
    return;
  }
  const c = PAL[key] || PAL.tile;
  if(e.t==='cube'){
    g.querySelector('.top').style.fill = key==='ink' ? '#ffffff' : c.light;
    g.querySelector('.left').style.fill = key==='ink' ? '#e5e7eb' : c.mid;
    g.querySelector('.right').style.fill = key==='ink' ? '#b8bec8' : c.side;
    g.querySelectorAll('.cf').forEach(p=>p.style.stroke = c.dark);
    return;
  }
  const shp = g.querySelector('.shp');
  shp.style.fill = (key==='ink' && e.t==='seat') ? '#9ca3af' : c.mid;
  shp.style.stroke = c.dark;
  if(e.t==='stick'){ const h = g.querySelector('.head'); h.style.fill = c.head || c.dark; h.style.stroke = c.dark; }
}
/* draw a whole figure into a group: tables first, then pieces; cubes back to front */
function drawFigure(els, parent, key){
  const isCube = els.length && els.find(e=>e.t==='cube');
  const ord = isCube ? [...els].sort((a,b)=>(a.X+a.Y+a.Z)-(b.X+b.Y+b.Z) || a.Y-b.Y)
                     : [...els].sort((a,b)=>(a.count===false?0:1)-(b.count===false?0:1));
  ord.forEach(e=>{ const g = drawEl(e, parent); if(key) paintEl(g, key, false); g.style.transform = ''; g.setAttribute('transform', `translate(${e.x},${e.y})`); });
}

window.MMT_VP = { PATTERNS, PAL, TABLE, SPICE_ORDER, SPICE_NAME, H3, E,
  figure, countOf, sizeOf, ruleOf, slope, intercept, elBox, elCentre, boxOf, drawEl, paintEl, drawFigure, placeHeads };
})();
