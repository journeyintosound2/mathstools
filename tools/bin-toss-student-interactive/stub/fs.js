import {getAuth} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
const ST=window.__FS=window.__FS||{};let auto=0;
export function getFirestore(app){return {app}}
export function doc(db,col,id){return {db,col,id}}
export function collection(db,col){return {db,col}}
export function where(f,op,v){return {f,op,v}}
export function query(c,...w){return {db:c.db,col:c.col,w}}
export function serverTimestamp(){return {__ts:Date.now()}}
const tok=db=>{const u=getAuth(db.app).currentUser;return u?u.claims:null};
function canRead(col,id,data,t){
  if(col==='binTossStats'){if(/^global_s\d+$/.test(id))return true;if(!t||!data)return false;
    if(t.role==='teacher')return data.teacherCode===t.teacherCode;if(t.role==='student')return data.teacherCode===t.teacherCode&&data.className===t.className;return false}
  if(col==='binTossStudents')return !!t&&((t.role==='student'&&t.studentCode===id)||(t.role==='teacher'&&data&&data.teacherCode===t.teacherCode));
  if(col==='binTossThrows')return !!t&&data&&((t.role==='student'&&data.studentCode===t.studentCode)||(t.role==='teacher'&&data.teacherCode===t.teacherCode));
  if(col==='binTossPredictions')return !!t&&((t.role==='teacher'&&t.teacherCode===id)||(t.role==='student'&&t.teacherCode===id));
  return false}
const deny=()=>Object.assign(new Error('Missing or insufficient permissions.'),{code:'permission-denied'});
const snap=(id,d)=>({id,exists:()=>d!=null,data:()=>d});
export async function getDoc(r){const t=tok(r.db),d=(ST[r.col]||{})[r.id];if(!canRead(r.col,r.id,d||null,t)&&!(d==null&&r.col==='binTossPredictions'&&canRead(r.col,r.id,null,t)))throw deny();return snap(r.id,d==null?null:JSON.parse(JSON.stringify(d)))}
export async function getDocs(q){const t=tok(q.db),all=ST[q.col]||{};const out=[];
  for(const id in all){const d=all[id];if(q.w.every(w=>d[w.f]===w.v)){if(!canRead(q.col,id,d,t))throw deny();out.push(snap(id,JSON.parse(JSON.stringify(d))))}}
  // a real query must be provably safe: emulate by requiring the teacher/student constraint
  if(t&&t.role==='teacher'&&!q.w.some(w=>w.f==='teacherCode'&&w.v===t.teacherCode))throw deny();
  return {docs:out,empty:!out.length}}
export async function setDoc(r,data,o){const t=tok(r.db);
  if(r.col!=='binTossPredictions'||!t||t.role!=='teacher'||t.teacherCode!==r.id||data.teacherCode!==t.teacherCode)throw deny();
  ST[r.col]=ST[r.col]||{};ST[r.col][r.id]=Object.assign(o&&o.merge?ST[r.col][r.id]||{}:{},data)}
export async function addDoc(c,data){const t=tok(c.db);if(c.col!=='achievements'||!t||t.role!=='student'||data.studentCode!==t.studentCode)throw deny();
  ST[c.col]=ST[c.col]||{};const id='a'+(++auto);ST[c.col][id]=data;return {id}}
