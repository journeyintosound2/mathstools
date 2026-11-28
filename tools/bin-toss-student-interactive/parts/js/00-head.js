import * as THREE from './three.module.min.js?v=954c1c22';
import {GLTFLoader} from './GLTFLoader.js?v=GLTFV';
import {MeshoptDecoder} from './meshopt_decoder.module.js?v=MESHV';
import {clone as skClone} from './SkeletonUtils.js?v=SKELV';
const P=window.BTP,$=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const BATCH=10,MIN_DATA=10,MAXQ=40,PRIZES=[20,50,100];
const money=v=>(v<0?'−$':'$')+Math.abs(Math.round(v)).toLocaleString('en-AU');
const money2=v=>{const r=Math.round(v*100)/100;return (r<0?'−$':'$')+(Number.isInteger(r)?Math.abs(r):Math.abs(r).toFixed(2))};
const pctN=(a,n)=>n?Math.round(a/n*1000)/10:0;
const pct=(a,n)=>n?pctN(a,n)+'%':'–';
const gcd=(a,b)=>b?gcd(b,a%b):a;
const fracH=(a,n)=>{const g=gcd(a,n)||1;return `<span class="fr"><span>${a/g}</span><span>${n/g}</span></span>`};
const ceilFor=prize=>prize/2;                                   // nobody pays half the prize or more to play
const queueFor=(price,prize)=>Math.max(0,Math.round(MAXQ*(1-price/ceilFor(prize))));

/* ---------------- languages: English source text is the key ---------------- */
const I18N=window.BT_I18N||{};
const PREFS_KEY='mmt.binTossGame.prefs';
const PREF={lang:'en',sound:true,low:null,hard:false,board:[],boardSpot:'back'};
try{Object.assign(PREF,JSON.parse(localStorage.getItem(PREFS_KEY)||'{}'))}catch(e){}
const savePrefs=()=>{try{localStorage.setItem(PREFS_KEY,JSON.stringify(PREF))}catch(e){}};
const L=()=>PREF.lang;
const fillV=(s,v)=>v?s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m):s;
/* a var can be {spot:id}: the English line gets the English spot name, the translated line the translated one */
const resolveV=(v,en)=>{if(!v)return v;const o={};for(const k in v){const x=v[k];o[k]=x&&typeof x==='object'&&x.spot?(en||L()==='en'?P.spot(x.spot).name.toLowerCase():t(P.spot(x.spot).name)):x}return o};
const mathV=v=>{if(!v)return v;const o={};for(const k in v){const x=v[k];o[k]=(typeof x==='number'||/^[−\-$\d.,%/ ]+$/.test(String(x)))?`<bdi dir="ltr">${x}</bdi>`:x}return o};
/* t(): one language, for buttons and labels. tt(): chosen language on top, English beneath, for sentences. */
function t(en,v){const e=I18N[en],s=(L()!=='en'&&e&&e[L()])||en;v=resolveV(v);return fillV(s,L()==='en'?v:mathV(v))}
function tt(en,v,tag){const tg=tag||'span';if(L()==='en'||!(I18N[en]&&I18N[en][L()]))return fillV(en,resolveV(v,true));
  return `<${tg} class="tl" dir="rtl" lang="${L()}">${fillV(I18N[en][L()],mathV(resolveV(v)))}</${tg}><${tg} class="el">${fillV(en,resolveV(v,true))}</${tg}>`}

/* ---------------- saved state: one store for guests, one per signed-in student ---------------- */
const BASE_KEY='mmt.binTossGame.v1';
let STORE=BASE_KEY;
const blank=()=>({spot:null,data:{front:[],middle:[],back:[]},days:[],angle:{front:45,middle:40,back:35},price:10,prize:50,char:null,pred:{},predSent:{},goals:{},quiz:null,seen:false});
const S=blank();
function loadStore(key){
  STORE=key;const b=blank();for(const k in S)delete S[k];Object.assign(S,b);
  try{const s=JSON.parse(localStorage.getItem(key)||'null');
    if(s&&s.data){for(const k of ['spot','days','price','prize','char','pred','predSent','goals','quiz','seen'])if(k in s&&s[k]!=null)S[k]=s[k];
      for(const sp of P.SPOTS){if(Array.isArray(s.data[sp.id]))S.data[sp.id]=s.data[sp.id];if(s.angle&&s.angle[sp.id])S.angle[sp.id]=s.angle[sp.id]}
      if(!P.SPOTS.some(x=>x.id===S.spot))S.spot=null;if(!PRIZES.includes(S.prize))S.prize=50}
    if(key===BASE_KEY&&typeof s?.sound==='boolean'&&!localStorage.getItem(PREFS_KEY)){PREF.sound=s.sound}
  }catch(e){}
}
loadStore(BASE_KEY);
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(S))}catch(e){}};
const cnt=id=>{const t=S.data[id]||[],n=t.length,k=t.filter(x=>x.in).length;return{n,in:k,out:n-k,p:n?k/n:0}};
const allThrows=()=>P.SPOTS.reduce((a,s)=>a+S.data[s.id].length,0);
const spotName=id=>t(P.spot(id).name);

/* ---------------- sound (tiny synth, no files) ---------------- */
let AC=null;
function ac(){if(!PREF.sound)return null;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();return AC}catch(e){return null}}
function tone(f,d,type,vol,when,slide){const a=ac();if(!a)return;const tm=a.currentTime+(when||0),o=a.createOscillator(),g=a.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f,tm);if(slide)o.frequency.exponentialRampToValueAtTime(slide,tm+d);
  g.gain.setValueAtTime(0,tm);g.gain.linearRampToValueAtTime(vol||.12,tm+.01);g.gain.exponentialRampToValueAtTime(.0001,tm+d);
  o.connect(g).connect(a.destination);o.start(tm);o.stop(tm+d+.02)}
function noiseS(d,vol,freq,when){const a=ac();if(!a)return;const tm=a.currentTime+(when||0),n=Math.floor(a.sampleRate*d),buf=a.createBuffer(1,n,a.sampleRate),ch=buf.getChannelData(0);
  for(let i=0;i<n;i++)ch[i]=(Math.random()*2-1)*(1-i/n);
  const src=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();src.buffer=buf;f.type='bandpass';f.frequency.value=freq||900;f.Q.value=.7;g.gain.value=vol||.1;
  src.connect(f).connect(g).connect(a.destination);src.start(tm)}
const SFX={
  tick:()=>tone(660,.05,'square',.03),lock:()=>{tone(520,.08,'triangle',.1);tone(780,.1,'triangle',.1,.07)},
  whoosh:()=>noiseS(.28,.16,700),thud:()=>noiseS(.09,.12,220),rim:()=>{tone(300,.12,'triangle',.12,0,180);noiseS(.06,.08,1400)},
  in:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,.16,'triangle',.13,i*.08));noiseS(.2,.06,2400,.05)},
  out:()=>tone(220,.28,'sine',.1,0,150),coin:()=>{tone(1320,.07,'square',.05);tone(1760,.12,'square',.05,.06)},
  pay:()=>{tone(330,.14,'sawtooth',.06,0,220);tone(247,.2,'sawtooth',.06,.12,160)},win:()=>{[392,523,659,784,1047,1319].forEach((f,i)=>tone(f,.2,'triangle',.12,i*.09))},
  badge:()=>{[784,988,1319].forEach((f,i)=>tone(f,.18,'triangle',.11,i*.1))}
};
