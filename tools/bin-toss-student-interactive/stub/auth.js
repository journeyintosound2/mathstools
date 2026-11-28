const auths={};
export function getAuth(app){const n=app.name;return auths[n]||(auths[n]={app,currentUser:null,cbs:[],authStateReady:async()=>{}})}
export async function signInWithCustomToken(auth,token){const c=window.__TOKENS[token];if(!c)throw Object.assign(new Error('bad token'),{code:'auth/invalid'});auth.currentUser={uid:token,claims:c};window.__AUTHS=auths;auth.cbs.forEach(f=>f(auth.currentUser))}
export async function signOut(auth){auth.currentUser=null;auth.cbs.forEach(f=>f(null))}
export function onAuthStateChanged(auth,cb){auth.cbs.push(cb);setTimeout(()=>cb(auth.currentUser),0);return ()=>{}}
