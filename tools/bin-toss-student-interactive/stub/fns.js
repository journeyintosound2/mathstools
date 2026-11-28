import {getAuth} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
export function getFunctions(app,region){return {app,region}}
const err=(code,msg)=>Object.assign(new Error(msg),{code:'functions/'+code});
export function httpsCallable(f,name){return async data=>{const u=getAuth(f.app).currentUser;const fn=window.__FNS[name];
  if(!fn||window.__MISSING&&window.__MISSING.includes(name))throw err('not-found','not-found');window.__CALLS=(window.__CALLS||[]).concat([[name,data]]);return {data:await fn(data,u?u.claims:null,err)}}}
