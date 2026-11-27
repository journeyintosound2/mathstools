/* Algebraic Techniques (MA4-ALG-C-01) — the Algebraic Techniques worksheet
   creator's own question generators (copied from its old single-file page)
   set on the shared whole-topic frame. Short expression questions of a kind
   become parts (a), (b) … of one question. */
(() => {
  function xmur3(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=(h<<13)|(h>>>19)}return function(){h=Math.imul(h^(h>>>16),2246822507);h=Math.imul(h^(h>>>13),3266489909);h^=h>>>16;return h>>>0}}
  function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
  let rng=Math.random;
  function reseed(){let seed=String(Date.now());try{const a=new Uint32Array(1);crypto.getRandomValues(a);seed+='-'+a[0]}catch(e){}rng=mulberry32(xmur3(seed)())}
  const LANG={
    en:{dir:'ltr',question:'Q',worksheet:'Worksheet',answerKey:'Answer key',page:'Page',name:'Name',date:'Date',answer:'Answer:',topic:'Algebraic Techniques',
      identify:'Identify the {part}.',
      notation:'Rewrite using algebraic notation.',
      words:'Write an algebraic expression for:',
      eval1:'Substitute the value and evaluate.',
      eval2:'Substitute the values and evaluate.',
      simplify:'Simplify.',
      expand:'Expand.',
      factorise:'Factorise.',
      expandSimplify:'Expand and simplify.',
      table:'Complete the table of values.',
      working:'Working',
      noTypes:'Please tick at least one question type.',
      parts:{coefficient:'coefficient',pronumeral:'pronumeral',constant:'constant'},
      stems:{more5:v=>`5 more than ${v}`,inc7:v=>`${v} increased by 7`,less3:v=>`3 less than ${v}`,dec4:v=>`${v} decreased by 4`,twice:v=>`twice ${v}`,thrice:v=>`three times ${v}`,div2:v=>`${v} divided by 2`,half:v=>`half of ${v}`,twicePlus3:v=>`three more than twice ${v}`,threeMinus5:v=>`five less than three times ${v}`,sum7times2:v=>`the sum of ${v} and 7, multiplied by 2`,halfPlus6:v=>`half of (${v} + 6)`,diff10:v=>`the difference between 10 and ${v}`}},
    ar:{dir:'rtl',question:'سؤال',worksheet:'ورقة عمل',answerKey:'دليل الإجابات',page:'صفحة',name:'الاسم',date:'التاريخ',answer:'الإجابة:',topic:'التقنيات الجبرية',
      identify:'حدّد {part}.',
      notation:'أعد الكتابة بالصيغة الجبرية.',
      words:'اكتب تعبيرًا جبريًا لـ:',
      eval1:'عوّض بالقيمة المعطاة واحسب قيمة التعبير.',
      eval2:'عوّض بالقيم المعطاة واحسب قيمة التعبير.',
      simplify:'بسّط.',
      expand:'وسّع.',
      factorise:'حلّل إلى عوامل.',
      expandSimplify:'وسّع وبسّط.',
      table:'أكمل جدول القيم.',
      working:'الحل',
      noTypes:'يرجى اختيار نوع سؤال واحد على الأقل.',
      parts:{coefficient:'المعامل',pronumeral:'المتغير',constant:'الثابت'},
      stems:{more5:v=>`5 أكثر من ${v}`,inc7:v=>`${v} زاد بمقدار 7`,less3:v=>`3 أقل من ${v}`,dec4:v=>`${v} نقص بمقدار 4`,twice:v=>`ضعف ${v}`,thrice:v=>`ثلاثة أمثال ${v}`,div2:v=>`${v} مقسوم على 2`,half:v=>`نصف ${v}`,twicePlus3:v=>`3 أكثر من ضعف ${v}`,threeMinus5:v=>`5 أقل من ثلاثة أمثال ${v}`,sum7times2:v=>`مجموع ${v} و7 مضروب في 2`,halfPlus6:v=>`نصف (${v} + 6)`,diff10:v=>`الفرق بين 10 و ${v}`}},
    fa:{dir:'rtl',question:'سؤال',worksheet:'برگه تمرین',answerKey:'پاسخ‌نامه',page:'صفحه',name:'نام',date:'تاریخ',answer:'پاسخ:',topic:'تکنیک‌های جبری',
      identify:'{part} را مشخص کنید.',
      notation:'با نمادگذاری جبری بازنویسی کنید.',
      words:'برای عبارت زیر یک عبارت جبری بنویسید:',
      eval1:'مقدار داده‌شده را جایگذاری و عبارت را محاسبه کنید.',
      eval2:'مقدارهای داده‌شده را جایگذاری و عبارت را محاسبه کنید.',
      simplify:'ساده کنید.',
      expand:'بسط دهید.',
      factorise:'عامل‌گیری کنید.',
      expandSimplify:'بسط دهید و ساده کنید.',
      table:'جدول مقدارها را کامل کنید.',
      working:'راه حل',
      noTypes:'لطفاً حداقل یک نوع پرسش را انتخاب کنید.',
      parts:{coefficient:'ضریب',pronumeral:'حرف جبری',constant:'عدد ثابت'},
      stems:{more5:v=>`5 بیشتر از ${v}`,inc7:v=>`${v} به اندازهٔ 7 افزایش یافته است`,less3:v=>`3 کمتر از ${v}`,dec4:v=>`${v} به اندازهٔ 4 کاهش یافته است`,twice:v=>`دو برابر ${v}`,thrice:v=>`سه برابر ${v}`,div2:v=>`${v} تقسیم بر 2`,half:v=>`نصف ${v}`,twicePlus3:v=>`3 بیشتر از دو برابر ${v}`,threeMinus5:v=>`5 کمتر از سه برابر ${v}`,sum7times2:v=>`مجموع ${v} و 7، ضربدر 2`,halfPlus6:v=>`نصف (${v} + 6)`,diff10:v=>`اختلاف بین 10 و ${v}`}}
  };
  reseed();
  const randInt=(a,b)=>Math.floor(rng()*(b-a+1))+a;
  const choice=a=>a[randInt(0,a.length-1)];
  const shuffle=arr=>{const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t}return a||1}
  function stripHTML(html){const d=document.createElement('div');d.innerHTML=String(html);return d.textContent||''}
  const fmtInt=n=>n<0?`−${Math.abs(n)}`:`${n}`;

  const OTHER_VARS=['a','b','c','d','e','f','y','p','w','k'];
  const pickVar=()=>rng()<.30?'x':choice(OTHER_VARS);
  function pickOther(...used){let v=pickVar(),g=0;while(used.includes(v)&&g++<50)v=pickVar();return v}
  const vH=v=>`<span class="var">${v}</span>`;
  const fracHTML=(top,bottom)=>`<span class="frac"><span class="top">${top}</span><span class="bar"></span><span class="bottom">${bottom}</span></span>`;
  const sortVars=vars=>(vars||[]).slice().sort((a,b)=>a.localeCompare(b));
  /* One term, no sign. v may be a multi-letter key such as 'ab'. */
  function termHTML(coeff,v){
    if(v==null)return String(Math.abs(coeff));
    const vp=v.split('').map(vH).join('');
    return Math.abs(coeff)===1?vp:`${Math.abs(coeff)}${vp}`;
  }
  function exprHTML(terms){
    return terms.map((t,i)=>{const neg=t.coeff<0;const sign=i===0?(neg?'−':''):(neg?' − ':' + ');return sign+termHTML(t.coeff,t.v)}).join('');
  }
  function collect(terms){
    const map=new Map();let c=0;
    for(const t of terms){if(t.v==null)c+=t.coeff;else map.set(t.v,(map.get(t.v)||0)+t.coeff)}
    const outTerms=sortVars([...map.keys()]).filter(v=>map.get(v)!==0).map(v=>({coeff:map.get(v),v}));
    if(c!==0||!outTerms.length)outTerms.push({coeff:c,v:null});
    return outTerms;
  }
  function monomialHTML(coeff,vars){
    const vp=sortVars(vars).map(vH).join('');
    if(!vp)return String(coeff);
    return coeff===1?vp:`${coeff}${vp}`;
  }
  const varKey=vars=>sortVars(vars).join('')||null;

  /* ==================================================================
     QUESTION GENERATORS
     Each returns { key, ...content, answer } where `key` is the prompt
     line. Content is one of: expr (+ given), words, or table.
     ================================================================== */
  const WORD_STEMS_BASIC=[
    {key:'more5',build:v=>`${vH(v)} + 5`},{key:'inc7',build:v=>`${vH(v)} + 7`},
    {key:'less3',build:v=>`${vH(v)} − 3`},{key:'dec4',build:v=>`${vH(v)} − 4`},
    {key:'twice',build:v=>`2${vH(v)}`},{key:'thrice',build:v=>`3${vH(v)}`},
    {key:'div2',build:v=>fracHTML(vH(v),'2')},{key:'half',build:v=>fracHTML(vH(v),'2')}];
  const WORD_STEMS_EXPECTED=[
    {key:'twicePlus3',build:v=>`2${vH(v)} + 3`},{key:'threeMinus5',build:v=>`3${vH(v)} − 5`},
    {key:'sum7times2',build:v=>`2(${vH(v)} + 7)`},{key:'halfPlus6',build:v=>fracHTML(`${vH(v)} + 6`,'2')},
    {key:'diff10',build:v=>`10 − ${vH(v)}`}];

  function factorQ(exprTerms,outside,inner){
    const o=outside===1?'':outside===-1?'−':fmtInt(outside);
    return {key:'factorise',expr:exprHTML(exprTerms),answer:`${o}(${exprHTML(inner)})`,why:`Take out the highest common factor, ${outside===-1?'−1':fmtInt(outside)}.`};
  }
  function coprimePair(lo,hi,lo2,hi2){let a,b,g=0;do{a=randInt(lo,hi);b=randInt(lo2,hi2)}while(gcd(a,b)!==1&&g++<80);return[a,b]}

  const GEN={
    /* ---------------- BASIC ---------------- */
    identify_part(){
      const v=pickVar(),a=randInt(2,9),b=randInt(1,9),part=choice(['coefficient','pronumeral','constant']);
      return {key:'identify',part,expr:`${a}${vH(v)} + ${b}`,answer:part==='coefficient'?String(a):part==='pronumeral'?vH(v):String(b)};
    },
    notation(){
      const v=pickVar(),a=randInt(2,9),c=randInt(1,9),kind=choice(['mult','power','bracket','divide']);
      if(kind==='mult')return {key:'notation',expr:`${a} × ${vH(v)}`,answer:`${a}${vH(v)}`};
      if(kind==='power')return {key:'notation',expr:`${vH(v)} × ${vH(v)}`,answer:`${vH(v)}²`};
      if(kind==='divide')return {key:'notation',expr:`${vH(v)} ÷ ${a}`,answer:fracHTML(vH(v),String(a))};
      return {key:'notation',expr:`${a} × (${vH(v)} + ${c})`,answer:`${a}(${vH(v)} + ${c})`};
    },
    words_to_expr(){const v=pickVar(),s=choice(WORD_STEMS_BASIC);return {key:'words',stem:s.key,v,answer:s.build(v)}},
    sub_one(){
      const v=pickVar(),val=randInt(-5,10),kind=choice(['av','vplus','vminus']),a=randInt(2,9),b=randInt(1,9);
      let expr,value;
      if(kind==='av'){expr=`${a}${vH(v)}`;value=a*val}
      else if(kind==='vplus'){expr=`${vH(v)} + ${b}`;value=val+b}
      else{expr=`${vH(v)} − ${b}`;value=val-b}
      const sub=kind==='av'?`${a} × ${val<0?`(${fmtInt(val)})`:val}`:kind==='vplus'?`${fmtInt(val)} + ${b}`:`${fmtInt(val)} − ${b}`;
      return {key:'eval1',expr,given:`${vH(v)} = ${fmtInt(val)}`,answer:fmtInt(value),why:`${sub} = ${fmtInt(value)}`};
    },
    like_terms(){
      const v=pickVar(),op=choice(['+','-']);let a=randInt(1,9),b=randInt(1,9);
      if(op==='-')while(a===b)b=randInt(1,9);          // never collapse to 0v
      const value=op==='+'?a+b:a-b;
      const t1=termHTML(a,v),t2=termHTML(b,v);
      return {key:'simplify',expr:op==='+'?`${t1} + ${t2}`:`${t1} − ${t2}`,answer:exprHTML([{coeff:value,v}]),why:`Like terms: ${a} ${op==='+'?'+':'−'} ${b} = ${value}`};
    },
    mul_single_term(){const v=pickVar(),a=randInt(2,9),b=randInt(2,9);return {key:'simplify',expr:`${a}${vH(v)} × ${b}`,answer:exprHTML([{coeff:a*b,v}]),why:`${a} × ${b} = ${a*b}`}},
    div_single_term(){const v=pickVar(),a=randInt(2,9),b=randInt(2,9);return {key:'simplify',expr:fracHTML(`${a*b}${vH(v)}`,String(b)),answer:exprHTML([{coeff:a,v}]),why:`${a*b} ÷ ${b} = ${a}`}},
    expand_bracket(){
      const v=pickVar(),k=randInt(2,9),c=randInt(1,9),plus=rng()<.5;
      return {key:'expand',expr:`${k}(${vH(v)} ${plus?'+':'−'} ${c})`,answer:exprHTML([{coeff:k,v},{coeff:plus?k*c:-k*c,v:null}]),why:`${k} × ${vH(v)} ${plus?'+':'−'} ${k} × ${c}`};
    },
    factorise_number(){
      const v=pickVar(),g=randInt(2,8),[a,b]=coprimePair(1,9,1,9);
      return factorQ([{coeff:g*a,v},{coeff:g*b,v:null}],g,[{coeff:a,v},{coeff:b,v:null}]);
    },

    /* ---------------- EXPECTED ---------------- */
    translate_rich(){const v=pickVar(),s=choice(WORD_STEMS_EXPECTED);return {key:'words',stem:s.key,v,answer:s.build(v)}},
    factorise_expected(){
      const t=choice(['two_vars','negative_all','negative_mixed','three_terms','three_terms_neg']);
      const v1=pickVar(),v2=pickOther(v1),g=randInt(2,9);let inner,outside=g;
      if(t==='two_vars'){const[a,b]=coprimePair(1,7,1,7);inner=[{coeff:a,v:v1},{coeff:b,v:v2}]}
      else if(t==='negative_all'){outside=-g;const[a,b]=coprimePair(1,7,1,7);inner=[{coeff:a,v:v1},{coeff:b,v:null}]}
      else if(t==='negative_mixed'){const[a,b]=coprimePair(2,7,1,7);inner=[{coeff:a,v:v1},{coeff:-b,v:null}]}
      else{
        let a,b,c,gd=0;do{a=randInt(1,6);b=randInt(1,6);c=randInt(1,8)}while(gcd(gcd(a,b),c)!==1&&gd++<50);
        inner=shuffle([{coeff:a,v:v1},{coeff:t==='three_terms_neg'?-b:b,v:v2},{coeff:c,v:null}]);
        if(inner[0].coeff<0)inner=[inner[1],inner[0],inner[2]];   // don't lead with a negative inside
      }
      return factorQ(inner.map(x=>({coeff:outside*x.coeff,v:x.v})),outside,inner);
    },
    sub_two(){
      const v=pickVar(),x=randInt(-4,8),a=randInt(2,5),b=randInt(1,9),kind=choice(['plus','minus','linear']);
      let expr,val;
      if(kind==='plus'){expr=`${a}(${vH(v)} + ${b})`;val=a*(x+b)}
      else if(kind==='minus'){expr=`${a}(${vH(v)} − ${b})`;val=a*(x-b)}
      else{expr=`${a}${vH(v)} + ${b}`;val=a*x+b}
      const xs=x<0?`(${fmtInt(x)})`:String(x);
      const sub=kind==='plus'?`${a} × (${xs} + ${b})`:kind==='minus'?`${a} × (${xs} − ${b})`:`${a} × ${xs} + ${b}`;
      return {key:'eval1',expr,given:`${vH(v)} = ${fmtInt(x)}`,answer:fmtInt(val),why:`${sub} = ${fmtInt(val)}`};
    },
    sub_two_vars(){
      const v1=pickVar(),v2=pickOther(v1),kind=choice(['sumConst','productConst','coeffSum','mixedCoeff','difference','bracketMul','varDivPlus']);
      let x=randInt(1,10);const y=randInt(1,10);let expr,val;
      if(kind==='sumConst'){const c=randInt(1,12);expr=`${vH(v1)} + ${vH(v2)} + ${c}`;val=x+y+c}
      else if(kind==='productConst'){const c=randInt(1,12);expr=`${vH(v1)}${vH(v2)} + ${c}`;val=x*y+c}
      else if(kind==='coeffSum'){const a=randInt(2,12);expr=`${a}${vH(v1)} + ${vH(v2)}`;val=a*x+y}
      else if(kind==='mixedCoeff'){const a=randInt(2,12),b=randInt(2,12);expr=`${a}${vH(v1)} + ${b}${vH(v2)}`;val=a*x+b*y}
      else if(kind==='difference'){const a=randInt(2,12);expr=`${a}${vH(v1)} − ${vH(v2)}`;val=a*x-y}
      else if(kind==='bracketMul'){const a=randInt(2,12);expr=`${a}(${vH(v1)} + ${vH(v2)})`;val=a*(x+y)}
      else{const d=randInt(2,6);x=d*randInt(1,5);expr=`${fracHTML(vH(v1),String(d))} + ${vH(v2)}`;val=x/d+y}
      return {key:'eval2',expr,given:`${vH(v1)} = ${fmtInt(x)},&nbsp; ${vH(v2)} = ${fmtInt(y)}`,answer:fmtInt(val)};
    },
    simplify_mixed(){
      const total=randInt(3,6),constTerms=Math.min(randInt(0,2),total-2),varTerms=total-constTerms;
      const groups=randInt(1,Math.max(1,Math.min(3,Math.floor(varTerms/2))));
      const vars=[];while(vars.length<groups)vars.push(pickOther(...vars));
      const counts=Array(groups).fill(2);let rem=varTerms-2*groups;while(rem-->0)counts[randInt(0,groups-1)]++;
      const terms=[];
      vars.forEach((v,i)=>{for(let k=0;k<counts[i];k++)terms.push({coeff:choice([1,-1])*randInt(1,9),v})});
      for(let k=0;k<constTerms;k++)terms.push({coeff:choice([1,-1])*randInt(1,15),v:null});
      const mixed=shuffle(terms);
      return {key:'simplify',expr:exprHTML(mixed),answer:exprHTML(collect(mixed))};
    },
    multiply_terms(){
      const pron=randInt(1,3),f=[],used=[];
      for(let i=0;i<4-pron;i++)f.push({num:randInt(2,9)});
      for(let i=0;i<pron;i++){const v=pickOther(...used);used.push(v);f.push({v})}
      const s=shuffle(f);
      const n=s.filter(x=>x.num).reduce((p,x)=>p*x.num,1);
      return {key:'simplify',expr:s.map(x=>x.num?String(x.num):vH(x.v)).join('<span class="mulSign">×</span>'),answer:monomialHTML(n,used)};
    },
    expand_simplify(){
      const t=choice(['c_plus_k','k_plus_var','two_var_plus','two_var_big']);let expr,fin;
      if(t==='c_plus_k'){
        const v=pickVar(),c0=randInt(1,9),k=randInt(2,6),b=randInt(1,9),sg=choice([1,-1]);
        expr=`${c0} + ${k}(${vH(v)} ${sg>0?'+':'−'} ${b})`;fin=[{coeff:k,v},{coeff:c0+k*sg*b,v:null}];
      }else if(t==='k_plus_var'){
        const v=pickVar(),k=randInt(2,6),b=randInt(1,9),m=randInt(1,6),addC=randInt(0,9),sgB=choice([1,-1]),sgM=choice([1,-1]);
        expr=`${k}(${vH(v)} ${sgB>0?'+':'−'} ${b}) ${sgM>0?'+':'−'} ${termHTML(m,v)}${addC?` + ${addC}`:''}`;
        fin=[{coeff:k+sgM*m,v},{coeff:k*sgB*b+addC,v:null}];
      }else if(t==='two_var_plus'){
        const v1=pickVar(),v2=pickOther(v1),k=randInt(2,5),a=randInt(1,4),b=randInt(1,4),e1=randInt(0,6),e2=randInt(0,6);
        expr=`${k}(${termHTML(a,v1)} + ${termHTML(b,v2)})${e2?` + ${termHTML(e2,v2)}`:''}${e1?` + ${termHTML(e1,v1)}`:''}`;
        fin=[{coeff:k*a+e1,v:v1},{coeff:k*b+e2,v:v2}];
      }else{
        const v1=pickVar(),v2=pickOther(v1),k=randInt(2,4),a=randInt(1,5),b=randInt(1,5),c0=randInt(1,9),oa=randInt(0,5),ob=randInt(0,5);
        expr=`${k}(${termHTML(a,v1)} − ${termHTML(b,v2)} + ${c0})${oa?` + ${termHTML(oa,v1)}`:''}${ob?` − ${termHTML(ob,v2)}`:''}`;
        fin=[{coeff:k*a+oa,v:v1},{coeff:-(k*b+ob),v:v2},{coeff:k*c0,v:null}];
      }
      return {key:'expandSimplify',expr,answer:exprHTML(collect(fin)),why:'Expand the bracket, then collect like terms.'};
    },
    alg_frac(){
      for(let tries=0;tries<300;tries++){
        const t=choice(['numOnly','oneCommon','twoCancelOne','twoCancelToVarOverVar']);
        const v1=pickVar(),v2=pickOther(v1);
        const top=randInt(2,9)*randInt(2,6),bot=randInt(2,9)*randInt(2,6),g=gcd(top,bot);
        if(g===1)continue;
        let tv,bv;
        if(t==='numOnly'){tv=[v1];bv=[]}
        else if(t==='oneCommon'){tv=[v1];bv=[v1]}
        else if(t==='twoCancelOne'){tv=[v1,v2];bv=[v1]}
        else{tv=[v1,v2];bv=[v1,pickOther(v1,v2)]}
        const rt=tv.slice(),rb=bv.slice();
        for(const v of tv){const i=rt.indexOf(v),j=rb.indexOf(v);if(i>=0&&j>=0){rt.splice(i,1);rb.splice(j,1)}}
        const a=top/g,b=bot/g;
        if(b===1&&!rb.length)continue;
        return {key:'simplify',expr:fracHTML(monomialHTML(top,tv),monomialHTML(bot,bv)),answer:fracHTML(monomialHTML(a,rt),monomialHTML(b,rb))};
      }
      return {key:'simplify',expr:fracHTML(`32${vH('a')}${vH('x')}`,`24${vH('a')}`),answer:fracHTML(`4${vH('x')}`,'3')};
    },
    pattern_table(ctx){
      const forms=['n_plus_b','n_minus_b','an','an_plus_b','an_minus_b'];
      const form=forms[(ctx&&ctx.tableIndex||0)%forms.length];
      const m=randInt(2,6),b=randInt(1,9),ns=[1,2,3,4],n=vH('n');
      let expr,vals;
      if(form==='n_plus_b'){expr=`${n} + ${b}`;vals=ns.map(k=>k+b)}
      else if(form==='n_minus_b'){expr=`${n} − ${b}`;vals=ns.map(k=>k-b)}
      else if(form==='an'){expr=`${m}${n}`;vals=ns.map(k=>m*k)}
      else if(form==='an_plus_b'){expr=`${m}${n} + ${b}`;vals=ns.map(k=>m*k+b)}
      else{expr=`${m}${n} − ${b}`;vals=ns.map(k=>m*k-b)}
      return {key:'table',table:{expr,ns,vals},answer:vals.map(fmtInt).join(', '),why:`Substitute each value of ${n} into ${expr}.`};
    }
  };


  const fill = (str, vals) => String(str).replace(/\{(\w+)\}/g, (m, k) => vals[k] != null ? vals[k] : m);
  const leadOf = (q, code) => { const T = LANG[code]; return q.key === 'identify' ? fill(T.identify, { part: T.parts[q.part] }) : T[q.key]; };
  const table = (q, key) => `<table class="dtab atTab"><tr><th>${vH('n')}</th>${q.table.ns.map(n => `<th>${n}</th>`).join('')}</tr><tr><th>${q.table.expr}</th>${key ? q.table.vals.map(v => `<td class="k">${fmtInt(v)}</td>`).join('') : q.table.ns.map(() => '<td class="blank"></td>').join('')}</tr></table>`;

  function wrapType(id) {
    return () => {
      reseed();
      const q = GEN[id]({ tableIndex: Math.floor(Math.random() * 5) });
      const lead = leadOf(q, 'en');
      const out = { mode: 'none', why: q.why || '', loc: lg => lg === 'en' || !LANG[lg] ? '' : leadOf(q, lg), key: id + '|' + (q.expr || '') + (q.given || '') + (q.stem || '') + (q.v || '') + JSON.stringify(q.table || '') };
      if (q.table) {
        out.prompt = `${lead}${table(q, false)}`; out.keyPrompt = `${lead}${table(q, true)}`;
        out.noAnswerBox = true; out.answerHTML = q.answer; out.noWorking = true;
      } else if (q.stem) {
        out.prompt = `${lead}<span class="big"><span class="atWords">“${LANG.en.stems[q.stem](vH(q.v))}”</span></span>`;
        out.answerHTML = q.answer;
      } else {
        out.prompt = `${lead}<span class="big">${q.expr}${q.given ? `<span class="atGiven">, &nbsp;${q.given}</span>` : ''}</span>`;
        out.answerHTML = q.answer;
      }
      return out;
    };
  }
  const T = (id, level, stmt, label) => ({ id: `${level === 'basic' ? 'b' : 'e'}-${id}`, level, stmt, label, gen: wrapType(id), paper: false });

  WSF.page({
    topic: 'Algebraic Techniques', outcome: 'MA4-ALG-C-01', langKey: 'mmt-alg-ws-lang', bank: false, defaultCount: 16,
    statements: STATEMENTS,
    css: `
.var{font-family:var(--mathFont);font-style:italic;font-weight:500}
.frac{display:inline-flex;flex-direction:column;align-items:stretch;justify-content:center;vertical-align:middle;line-height:1.05;margin:0 2px;min-width:1.1em;font-family:var(--mathFont)}
.frac .top,.frac .bottom{text-align:center;padding:0 3px;white-space:nowrap}.frac .bar{height:0;border-top:1.3px solid currentColor;margin:1px 0}
.mulSign{display:inline-block;padding:0 .25em;font-style:normal}
.atWords{font-family:var(--uiFont);font-weight:750;font-size:.82em}
.atGiven{color:#1d4ed8}
.atTab th,.atTab td{min-width:10mm;height:7.4mm;font-family:var(--mathFont);font-weight:500;font-size:14px}
.atTab td.k{color:#15803d;font-weight:700}`,
    paperTypes: [
      T('identify_part', 'basic', 'pronumerals', 'Coefficient, pronumeral or constant'),
      T('notation', 'basic', 'pronumerals', 'Rewrite in algebraic notation'),
      T('words_to_expr', 'basic', 'expressions-substitution', 'Words → expression'),
      T('sub_one', 'basic', 'expressions-substitution', 'Substitute — one step'),
      T('like_terms', 'basic', 'laws-properties', 'Collect like terms'),
      T('mul_single_term', 'basic', 'laws-properties', 'Multiply a single term'),
      T('div_single_term', 'basic', 'laws-properties', 'Divide a single term'),
      T('expand_bracket', 'basic', 'distributive', 'Expand a single bracket'),
      T('factorise_number', 'basic', 'factorise', 'Factorise — common number'),
      T('pattern_table', 'expected', 'pronumerals', 'Complete a table of values'),
      T('translate_rich', 'expected', 'expressions-substitution', 'Words → expression (multi-step)'),
      T('sub_two', 'expected', 'expressions-substitution', 'Substitute — two-step'),
      T('sub_two_vars', 'expected', 'expressions-substitution', 'Substitute — two pronumerals'),
      T('simplify_mixed', 'expected', 'laws-properties', 'Simplify — mixed like terms'),
      T('multiply_terms', 'expected', 'laws-properties', 'Multiplying terms'),
      T('alg_frac', 'expected', 'laws-properties', 'Algebraic fractions'),
      T('expand_simplify', 'expected', 'distributive', 'Expand and simplify'),
      T('factorise_expected', 'expected', 'factorise', 'Factorising')
    ]
  });
})();
