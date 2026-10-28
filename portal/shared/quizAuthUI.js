/**
 * MMT SHARED QUIZ AUTH UI — the student-code login overlay, the "Signed in as…"
 * chip and window.MMTSave(), extracted verbatim from the 12 platform-template
 * quizzes that each carried a byte-identical copy of it.
 *
 * Load it from the SITE ROOT, in place of that block, as the LAST thing before
 * </body> so it runs at the same point in parsing the inline block used to:
 *
 *   <script src="/portal/shared/quizAuthUI.js"></script>
 *
 * It injects its own overlay markup, so the page needs no extra HTML. A page
 * may still provide #mmtAuthSlot to place the sign-in chip in its own header.
 *
 * Behaviour is unchanged from the inline version. Opening a quiz straight off
 * disk (file://) can no longer reach this file, so the quiz runs with no login
 * and no save — the same demo-mode outcome the inline block produced locally.
 */
/* MMT student-code login + secure achievement save + sign-in banner.
   Self-contained: shows a login overlay on load (above the quiz's own menu),
   dynamically imports the shared secure quiz client so the page still runs
   offline/locally (demo mode = no save), and exposes window.MMTSave(payload)
   for the quiz to call when a student finishes. Never stores typed answers.

   It also paints a status chip — "Signed in as NAME", or "Guest mode" with a
   Sign in button — into #mmtAuthSlot if the page provides one, otherwise pinned
   top-right; and it keeps every .certSub line honest, so the certificate only
   mentions Google Classroom when the result is NOT going to a dashboard. */
(function(){
  "use strict";

  /* ---- the markup this module owns (was inline in each quiz) ---- */
  var AUTH_HTML = "<div id=\"mmtLoginOverlay\" style=\"position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;\">\n  <div style=\"background:#fff;border-radius:22px;box-shadow:0 20px 60px rgba(0,0,0,.28);max-width:460px;width:100%;overflow:hidden;\">\n    <div style=\"font-weight:1000;font-size:22px;padding:20px 22px 6px;color:#111827;\">Student login</div>\n    <div style=\"padding:6px 22px 20px;\">\n      <p style=\"color:#6b7280;font-weight:600;font-size:15px;line-height:1.45;margin:0 0 14px;\">Enter your MMT student code so your result saves to your teacher&rsquo;s dashboard. No code? Press <b>Skip</b> to do the quiz without saving.</p>\n      <label for=\"mmtCodeInput\" style=\"display:block;font-weight:900;color:#111827;margin-bottom:6px;\">Student code</label>\n      <input id=\"mmtCodeInput\" autocomplete=\"off\" placeholder=\"enter code here\" style=\"width:100%;height:52px;border:2px solid #e5e7eb;border-radius:14px;padding:0 14px;font-size:20px;font-weight:900;outline:none;text-transform:uppercase;box-sizing:border-box;\" />\n      <div style=\"display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;\">\n        <button id=\"mmtLoginBtn\" type=\"button\" style=\"flex:1;min-width:120px;border:none;border-radius:14px;padding:13px 18px;font-weight:1000;font-size:16px;cursor:pointer;background:#2563eb;color:#fff;\">Start</button>\n        <button id=\"mmtSkipBtn\" type=\"button\" style=\"flex:1;min-width:120px;border:none;border-radius:14px;padding:13px 18px;font-weight:1000;font-size:16px;cursor:pointer;background:#f3f4f6;color:#111827;\">Skip student code</button>\n      </div>\n      <div id=\"mmtLoginMsg\" style=\"margin-top:10px;font-weight:900;font-size:14px;min-height:18px;\"></div>\n    </div>\n  </div>\n</div>\n<div id=\"mmtSaveStatus\" style=\"display:none;position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483001;background:#111827;color:#fff;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-weight:900;font-size:14px;padding:10px 18px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.3);\"></div>";
  (function inject(){
    if(document.getElementById("mmtLoginOverlay")) return;
    var holder=document.createElement("div");
    holder.innerHTML=AUTH_HTML;
    while(holder.firstChild) document.body.appendChild(holder.firstChild);
  })();
  var MMT=null, tried=false, mode="pending", student=null;
  var UIFONT="system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  function normalise(c){ return String(c||"").trim().toUpperCase().replace(/[^A-Z0-9-]/g,""); }
  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  async function load(){
    if(tried) return MMT; tried=true;
    try{ var mod=await import("/portal/shared/quizClient.js"); MMT=mod.MMTQuiz; MMT.init(); }
    catch(e){ MMT=null; console.warn("MMT quiz client unavailable — demo mode only:", e&&e.message); }
    return MMT;
  }
  var overlay=document.getElementById("mmtLoginOverlay");
  var codeInput=document.getElementById("mmtCodeInput");
  var loginBtn=document.getElementById("mmtLoginBtn");
  var skipBtn=document.getElementById("mmtSkipBtn");
  var msg=document.getElementById("mmtLoginMsg");
  var statusEl=document.getElementById("mmtSaveStatus");
  function hideOverlay(){ if(overlay) overlay.style.display="none"; }
  function openOverlay(){
    if(!overlay) return;
    if(msg){ msg.textContent=""; }
    overlay.style.display="flex";
    setTimeout(function(){ try{ codeInput.focus(); codeInput.select(); }catch(e){} }, 60);
  }
  function showStatus(t){ if(!statusEl) return; statusEl.textContent=t; statusEl.style.display="block"; }

  /* ---- who am I: the chip in the banner ---- */
  var chip=null;
  function studentName(){
    if(!student) return "";
    return student.name || [student.firstName,student.surname].filter(Boolean).join(" ") || student.studentCode || "";
  }
  function ensureChip(){
    if(chip) return chip;
    var slot=document.getElementById("mmtAuthSlot");
    chip=document.createElement("div");
    chip.id="mmtAuthChip";
    // a slotted chip sits in the page's own flow, so it stays behind the quiz's
    // modals rather than bleeding over them; the unslotted fallback pins itself
    // top-right at a z-index below the usual modal layer
    chip.style.cssText="display:inline-flex;align-items:center;gap:8px;font-family:"+UIFONT
      +";font-weight:900;font-size:13px;line-height:1;white-space:nowrap;"
      + (slot ? "" : "position:fixed;top:10px;right:10px;z-index:40;");
    (slot||document.body).appendChild(chip);
    return chip;
  }
  function paintChip(){
    var c=ensureChip();
    if(mode==="pending"){ c.innerHTML=""; return; }
    if(mode==="registered"){
      c.innerHTML='<span style="display:inline-flex;align-items:center;gap:7px;background:#dcfce7;color:#166534;'
        +'border:1px solid #86efac;border-radius:999px;padding:7px 13px;">'
        +'<span aria-hidden="true" style="font-size:9px;">&#9679;</span>Signed in as '+esc(studentName())+'</span>';
      return;
    }
    c.innerHTML='<span style="display:inline-flex;align-items:center;gap:7px;background:#f3f4f6;color:#4b5563;'
      +'border:1px solid #e5e7eb;border-radius:999px;padding:7px 13px;">'
      +'<span aria-hidden="true" style="font-size:9px;">&#9675;</span>Guest mode</span>'
      +'<button type="button" id="mmtChipSignIn" style="border:none;border-radius:999px;padding:7px 14px;'
      +'font-family:inherit;font-weight:900;font-size:13px;cursor:pointer;background:#2563eb;color:#fff;">Sign in</button>';
    var b=document.getElementById("mmtChipSignIn");
    if(b) b.addEventListener("click", openOverlay);
  }

  /* ---- the certificate line: Google Classroom only when nothing is being saved ---- */
  function paintCert(text){
    var els=document.querySelectorAll(".certSub");
    for(var i=0;i<els.length;i++) els[i].textContent=text;
  }
  function certResting(){
    paintCert(mode==="registered"
      ? "This result saves to "+studentName()+"'s dashboard."
      : "Screenshot this and paste into Google Classroom.");
  }
  function setMode(m, profile){
    mode=m; student=profile||null;
    paintChip(); certResting();
  }

  async function doLogin(){
    msg.style.color="#6b7280"; msg.textContent="Checking…";
    var code=normalise(codeInput.value); codeInput.value=code;
    if(!code){ msg.style.color="#dc2626"; msg.textContent="Please type your student code, or press Skip."; return; }
    await load();
    if(!MMT){ msg.style.color="#dc2626"; msg.textContent="Login isn’t available here — press Skip to do the quiz."; return; }
    try{
      var r=await MMT.signIn(code);
      if(r&&r.ok){ setMode("registered", r.profile); msg.style.color="#16a34a";
        msg.textContent="Signed in as "+(studentName()||code); setTimeout(hideOverlay,450); }
      else { msg.style.color="#dc2626"; msg.textContent=(r&&r.error)||"Could not sign in."; }
    }catch(e){ msg.style.color="#dc2626"; msg.textContent="Could not sign in. You can Skip to continue."; }
  }
  if(loginBtn) loginBtn.addEventListener("click", doLogin);
  if(skipBtn) skipBtn.addEventListener("click", function(){
    setMode("skip", null);
    if(MMT){ try{MMT.skipDemo();}catch(e){} }
    hideOverlay();
  });
  if(codeInput){
    codeInput.addEventListener("keydown", function(e){ if(e.key==="Enter"){ e.preventDefault(); e.stopPropagation(); doLogin(); } });
    setTimeout(function(){ try{ codeInput.focus(); }catch(e){} }, 60);
  }

  /* ---- opened from the Student Platform: sign straight in ----
     The portal adds a one-use ticket to the link (see portalHandoff.js); the
     helper types the code into this overlay and presses Start, so sign-in still
     goes through doLogin exactly as if the student had typed it. Any other way
     of opening the quiz still shows the overlay as before. */
  function hasHandoff(){ try{ return /(^#|&)mmt-handoff=/.test(location.hash||"") || !!sessionStorage.getItem("mmt-handoff-tab"); }catch(e){ return false; } }
  if(hasHandoff()){
    if(msg){ msg.style.color="#6b7280"; msg.textContent="Signing you in from your dashboard…"; }
    var hs=document.createElement("script");
    hs.src="/portal/shared/portalHandoff.js?v=16b9c759";
    hs.onload=function(){ if(!window.MMTHandoff || !window.MMTHandoff.autofill("#mmtCodeInput","#mmtLoginBtn")){ if(msg) msg.textContent=""; } };
    hs.onerror=function(){ if(msg) msg.textContent=""; };
    document.head.appendChild(hs);
  }

  window.MMTSave=async function(payload){
    payload=payload||{};
    if(mode!=="registered"){
      paintCert("Screenshot this and paste into Google Classroom.");
      showStatus("Not saved — no student code"); return {skipped:true};
    }
    showStatus("Saving…");
    paintCert("Saving to "+studentName()+"'s dashboard…");
    try{
      await load();
      if(MMT&&MMT.getMode&&MMT.getMode()==="registered"){
        var r=await MMT.saveAchievement(payload);
        var ok=!!(r&&r.saved);
        showStatus(ok ? "Saved to your dashboard ✓" : "Not saved");
        paintCert(ok ? "Saved to "+studentName()+"'s dashboard ✓ — your teacher can see this result."
                     : "Could not save this one — screenshot it and send it to your teacher.");
        return r;
      }
      showStatus("Not saved");
      paintCert("Could not save this one — screenshot it and send it to your teacher.");
      return {skipped:true};
    }catch(e){
      showStatus("Save failed (your result still counts locally)");
      paintCert("Could not save this one — screenshot it and send it to your teacher.");
      return {error:true};
    }
  };
  window.MMTMode=function(){ return mode; };
  // helpers so a quiz's own certificate / clipboard text can drop the Google
  // Classroom instruction when the result is already going to a dashboard
  function certTail(){ return mode==="registered" ? "" : " Paste a screenshot into Google Classroom."; }
  function shareLine(){
    return mode==="registered"
      ? "Saved to "+studentName()+"'s dashboard — your teacher can see this result."
      : "Submit a screenshot or paste this into Google Classroom.";
  }
  window.MMTAuth={ mode:function(){ return mode; }, student:function(){ return student; },
                   name:studentName, signedIn:function(){ return mode==="registered"; },
                   signIn:openOverlay, certTail:certTail, shareLine:shareLine };
  paintChip();
  load(); /* warm up so sign-in is instant */
})();
