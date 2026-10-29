/* ===========================================================================
   MMT Screen — saving a board to the teacher's own account.

   THIS MODULE IS LOADED DYNAMICALLY, AND THAT IS NOT AN OPTIMISATION.
   It pulls the Firebase SDK from gstatic through the portal's shared client.
   If this file were a static import at the top of the board's module graph,
   then a gstatic outage, a school proxy that blocks it, or a laptop with no
   network at all would stop the WHOLE BOARD from loading — a timer and a
   traffic light taken out by a sign-in feature nobody was using. app.js
   imports this with `await import()` inside a try/catch, so the cloud button
   simply never appears and everything else is untouched.

   THERE IS NO BACKGROUND SYNC. Saving happens when the teacher presses Save,
   and at no other time. The local save in app.js already fires on every drag
   frame, debounced to 250ms; pointing that at Firestore would mean hundreds
   of writes to drag one widget across the board. An explicit button is also
   the honest model for what this is: a screen you have finished setting up
   and want on the other computer, not a document being co-edited.

   THE AUTHORITY IS STILL localStorage. A saved screen is a COPY. Opening one
   from the cloud writes it into local state and from then on the board reads
   local, exactly as it always did. Nothing on this page ever waits on the
   network to paint.
   =========================================================================== */

import {
  initPortal, loginTeacher, logout, getDb, getSession, normaliseCode, onAuth,
} from '../portal/shared/codeExchangeClient.js?v=2261aaea';

/* Same SDK version as portal/shared/firebaseConfig.js — keep them in step. */
import {
  doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

import { stripForCloud, payloadSize, MAX_BYTES, docId,
         packWidgets, unpackWidgets, widgetCount } from './screenPayload.js';

const COLLECTION = 'screens';

/* Re-exported so the board can ask about a payload without importing the
   Firebase half of this module. */
export { stripForCloud, payloadSize, MAX_BYTES, packWidgets, unpackWidgets };

export function initCloud(){ initPortal("teacher"); }

export function currentTeacher(){
  const s = getSession();
  return (s && s.role === 'teacher' && s.profile && (s.profile.teacherCode || s.profile.code)) || null;
}

/** Fires on page load once Firebase restores (or fails to restore) a session. */
export function onCloudAuth(cb){
  return onAuth(user => cb(user ? currentTeacher() : null));
}

export async function signIn(code){
  const clean = normaliseCode(code);
  if(!clean) return { ok:false, error:'Enter your teacher code.' };
  const res = await loginTeacher(clean);
  if(!res.ok) return { ok:false, error: res.error || 'Could not sign in.' };
  return { ok:true, code: currentTeacher() || clean };
}

export async function signOutTeacher(){ await logout(); }

/* ------------------------------------------------------------------ saving */
export async function saveScreen(screen){
  const teacherCode = currentTeacher();
  if(!teacherCode) return { ok:false, error:'Sign in first.' };

  const clean = stripForCloud(screen);
  const size = payloadSize(screen);
  if(size > MAX_BYTES){
    return { ok:false, error:`This screen is too big to save (${Math.round(size/1024)} KB). Try removing a widget with a lot of text in it.` };
  }

  const id = docId(teacherCode, screen.id);
  try{
    await setDoc(doc(getDb(), COLLECTION, id), {
      teacherCode,
      screenId: screen.id,
      name: screen.name || 'Untitled',
      background: screen.background || 'mmt',
      border: screen.border || null,
      /* See screenPayload.js: one JSON string, because Firestore refuses an
         array inside an array and a widget is free to hold one. */
      widgetsJson: packWidgets(screen),
      widgetCount: (clean.widgets || []).length,
      version: 2,
      updatedAt: serverTimestamp(),
    });
    return { ok:true, id, size };
  }catch(err){
    return { ok:false, error: friendly(err) };
  }
}

export async function listScreens(){
  const teacherCode = currentTeacher();
  if(!teacherCode) return { ok:false, error:'Sign in first.', screens:[] };
  try{
    /* The rules require the query to be filtered by teacherCode, exactly as
       for classes — an unfiltered list is refused, not silently emptied. */
    const q = query(collection(getDb(), COLLECTION), where('teacherCode', '==', teacherCode));
    const snap = await getDocs(q);
    const screens = snap.docs.map(d => {
      const v = d.data();
      return {
        id: d.id,
        screenId: v.screenId,
        name: v.name || 'Untitled',
        widgets: widgetCount(v),
        updatedAt: v.updatedAt && v.updatedAt.toDate ? v.updatedAt.toDate() : null,
      };
    }).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return { ok:true, screens };
  }catch(err){
    return { ok:false, error: friendly(err), screens:[] };
  }
}

export async function loadScreen(id){
  try{
    const snap = await getDoc(doc(getDb(), COLLECTION, id));
    if(!snap.exists()) return { ok:false, error:'That screen is no longer saved.' };
    const v = snap.data();
    return { ok:true, screen:{
      id: v.screenId,
      name: v.name || 'Untitled',
      background: v.background || 'mmt',
      border: v.border || null,
      widgets: unpackWidgets(v),
    }};
  }catch(err){
    return { ok:false, error: friendly(err) };
  }
}

/* ===================================================== the teacher's classes
   ONE DOCUMENT PER TEACHER, KEYED BY THEIR OWN CODE. That makes the rule for
   it trivial and tight — the document id IS the thing being scoped — and it
   means a class roll is stored once for a teacher rather than copied into
   every screen they save.

   The lists go up as a JSON string for the same reason the widgets do: the
   shape is nobody's business but this app's, and a string cannot be refused
   for having the wrong one. */
const LISTS = 'teacherLists';

export async function saveLists(lists){
  const teacherCode = currentTeacher();
  if(!teacherCode) return { ok:false, error:'Sign in first.' };
  try{
    await setDoc(doc(getDb(), LISTS, teacherCode), {
      teacherCode,
      listsJson: JSON.stringify(lists || {}),
      version: 1,
      updatedAt: serverTimestamp(),
    });
    return { ok:true };
  }catch(err){
    return { ok:false, error: friendly(err) };
  }
}

export async function loadLists(){
  const teacherCode = currentTeacher();
  if(!teacherCode) return { ok:false, error:'Sign in first.', lists:{} };
  try{
    const snap = await getDoc(doc(getDb(), LISTS, teacherCode));
    if(!snap.exists()) return { ok:true, lists:{} };
    const v = snap.data() || {};
    let lists = {};
    try{ lists = JSON.parse(v.listsJson || '{}') || {}; }catch(_){ lists = {}; }
    return { ok:true, lists };
  }catch(err){
    return { ok:false, error: friendly(err), lists:{} };
  }
}

export async function deleteScreen(id){
  try{
    await deleteDoc(doc(getDb(), COLLECTION, id));
    return { ok:true };
  }catch(err){
    return { ok:false, error: friendly(err) };
  }
}

function friendly(err){
  const m = String((err && (err.code || err.message)) || err || '');
  if(/permission|insufficient/i.test(m)) return 'Your account cannot save screens yet — the Firestore rules may not be updated.';
  if(/unavailable|network|offline/i.test(m)) return 'No connection to the server. Your screen is still saved on this computer.';
  if(/not-found/i.test(m)) return 'That screen is no longer saved.';
  /* A shape Firestore will not accept is thrown here on the laptop, before any
     network call — so blaming the connection, as this used to, sends everyone
     looking at rules and quotas for a bug that is in the data. Say what it is. */
  if(/invalid-argument|invalid data|not supported/i.test(m)){
    return 'Something on this screen could not be saved to your account. Please report it — the board is still saved on this computer.';
  }
  return 'Could not reach the server. Your screen is still saved on this computer.';
}
