/**
 * MMT Platform — school picker (2026-10-24).
 *
 * One component for every "which school?" question: the request-access form,
 * the teacher's profile, and the admin console (create / edit / approve /
 * school details). Plain ES module; loads its data lazily from ./geo/.
 *
 *   const sp = mountSchoolPicker(el, { prefix:"rq", value, required:true, onChange });
 *   sp.get()      → { school, schoolId, sector, schoolType, suburb, state, postcode,
 *                     country, lat, lng, locSource }   (locSource: school|suburb|country|"")
 *   sp.problem()  → null, or { text, focus } for a required form
 *   sp.set(value) / sp.ready (Promise, data loaded)
 *
 * Flow, chosen so the commonest case is one field:
 *   Australia (default) → type the school's name → pick it. Suburb, state,
 *     postcode, sector and map coordinates all come from the official list.
 *   "My school isn't listed" → type the name + pick the SUBURB from the ABS list
 *     (fills the state; coordinates = suburb centre).
 *   "Another country" → country, school name, town (free text); the map pin is
 *     the country's centre for now.
 *
 * Data: geo/schools-au.json + geo/suburbs-au.json, built by
 * tools/geo/build-geo-data.py. If a file is missing the picker still works —
 * search simply offers "My school isn't listed".
 */
import { AU_STATES, COUNTRIES, countryCentre, formatLocation } from "./location.js";

const BASE = new URL("./geo/", import.meta.url).href;
const OTHER = "__other";
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------------------------------------------------------------- data
const ALIASES = { st: ["saint"], saint: ["st"], mt: ["mount"], mount: ["mt"], hs: ["high"], ps: ["public"], "&": ["and"] };
export function norm(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/['’`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function tokens(s) {
  const out = [];
  norm(s).split(" ").filter(Boolean).forEach((t) => { out.push(t); (ALIASES[t] || []).forEach((a) => out.push(a)); });
  return out;
}
/** Grouping key for a school name: same idea as the admin console's schoolKey(). */
export function nameKey(s) {
  const W = { hs: "high", ps: "public", cs: "central", sc: "secondary college", shs: "high", st: "saint", mt: "mount" };
  return norm(s).split(" ").filter((w) => w && w !== "the" && w !== "school").map((w) => W[w] || w).join(" ");
}

let schoolsP = null, suburbsP = null;
export function loadSchools() {
  if (!schoolsP) schoolsP = fetch(BASE + "schools-au.json").then((r) => (r.ok ? r.json() : null)).catch(() => null).then((j) => {
    const rows = (j && j.rows) || [];
    const list = rows.map((r) => {
      const o = { id: String(r[0]), name: r[1], suburb: r[2], state: r[3], postcode: String(r[4] || ""), sector: r[5], type: r[6], lat: r[7], lng: r[8] };
      o._name = tokens(o.name); o._all = o._name.concat(tokens(o.suburb), [norm(o.state), o.postcode]); o._n = norm(o.name); o._key = nameKey(o.name);
      return o;
    });
    return { list, source: (j && j.source) || "", byId: new Map(list.map((o) => [o.id, o])) };
  });
  return schoolsP;
}
export function loadSuburbs() {
  if (!suburbsP) suburbsP = fetch(BASE + "suburbs-au.json").then((r) => (r.ok ? r.json() : null)).catch(() => null).then((j) => {
    const rows = (j && j.rows) || [];
    return { list: rows.map((r) => ({ name: r[0], state: r[1], lat: r[2], lng: r[3], _n: norm(r[0]), _t: tokens(r[0]) })) };
  });
  return suburbsP;
}

const prefixHit = (qt, toks) => toks.some((t) => t.startsWith(qt));
/** Best schools for a typed query (every word must start a word of the name/suburb/state/postcode). */
export function searchSchools(data, q, { prefer = "NSW", limit = 8 } = {}) {
  const qt = tokens(q); const qn = norm(q);
  if (!qn || qn.length < 2) return [];
  const out = [];
  for (const s of data.list) {
    if (!qt.every((t) => prefixHit(t, s._all) || (ALIASES[t] || []).some((a) => prefixHit(a, s._all)))) continue;
    let score = 0;
    if (s._n.startsWith(qn)) score += 60;
    else if (s._n.includes(qn)) score += 25;
    score += 12 * qt.filter((t) => prefixHit(t, s._name)).length;
    if (qt[0] && s._name[0] && s._name[0].startsWith(qt[0])) score += 10;
    if (s.state === prefer) score += 6;
    score -= s.name.length / 40;
    out.push([score, s]);
  }
  return out.sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name)).slice(0, limit).map((x) => x[1]);
}
export function searchSuburbs(data, q, { prefer = "NSW", limit = 8 } = {}) {
  const qt = tokens(q); const qn = norm(q);
  if (!qn || qn.length < 2) return [];
  const out = [];
  for (const s of data.list) {
    if (!qt.every((t) => prefixHit(t, s._t))) continue;
    let score = s._n === qn ? 100 : s._n.startsWith(qn) ? 50 : 0;
    if (s.state === prefer) score += 6;
    score -= s.name.length / 40;
    out.push([score, s]);
  }
  return out.sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name)).slice(0, limit).map((x) => x[1]);
}
/** For the admin back-fill: candidate official schools for a typed name (+ suburb/state when known). */
export function matchSchool(data, name, { suburb = "", state = "" } = {}) {
  const k = nameKey(name); if (!k) return [];
  let c = data.list.filter((s) => s._key === k);
  if (!c.length) c = searchSchools(data, name, { prefer: state || "NSW", limit: 5 });
  if (state) { const f = c.filter((s) => s.state === state); if (f.length) c = f; }
  if (suburb) { const f = c.filter((s) => norm(s.suburb) === norm(suburb)); if (f.length) c = f; }
  return c;
}
export function matchSuburb(data, suburb, state) {
  const n = norm(suburb); if (!n) return null;
  const c = data.list.filter((s) => s._n === n || norm(s.name.replace(/\s*\(.*\)$/, "")) === n);
  return (state ? c.find((s) => s.state === state) : null) || (c.length === 1 ? c[0] : null);
}

// ---------------------------------------------------------------- styles
let styled = false;
function injectStyle() {
  if (styled) return; styled = true;
  const st = document.createElement("style");
  st.textContent = `
.sp{--sp-accent:var(--mmt-blue,var(--brand,#1d4ed8));--sp-line:#cbd5e1;--sp-muted:#64748b}
.sp .sp-seg{display:inline-flex;gap:4px;background:#eef2f7;border-radius:999px;padding:4px;margin:0 0 12px}
.sp .sp-seg button{appearance:none;border:0;background:transparent;border-radius:999px;padding:7px 14px;font:inherit;font-size:.86rem;font-weight:700;color:#334155;cursor:pointer;min-height:0}
.sp .sp-seg button[aria-checked="true"]{background:#fff;color:var(--sp-accent);box-shadow:0 1px 3px rgba(15,23,42,.12)}
.sp label.sp-lbl{display:block;font-weight:700;font-size:.82rem;color:#334155;margin:0 0 6px}
.sp .sp-req{color:#dc2626;margin-left:2px}
.sp .sp-box{position:relative}
.sp input.sp-in,.sp select.sp-in{width:100%;box-sizing:border-box;padding:11px 12px;border:1.5px solid var(--sp-line);border-radius:11px;font:inherit;font-size:.95rem;letter-spacing:0;background:#fff;outline:none}
.sp input.sp-in:focus,.sp select.sp-in:focus{border-color:var(--sp-accent);box-shadow:0 0 0 4px rgba(37,99,235,.14)}
.sp input.sp-in.bad{border-color:#f87171}
.sp .sp-list{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:50;margin:0;padding:6px;list-style:none;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 14px 34px rgba(15,23,42,.16);max-height:320px;overflow:auto}
.sp .sp-list[hidden]{display:none}
.sp .sp-opt{padding:9px 11px;border-radius:9px;cursor:pointer;line-height:1.35}
.sp .sp-opt[aria-selected="true"],.sp .sp-opt:hover{background:#eff6ff}
.sp .sp-opt b{display:block;color:#0f172a;font-size:.92rem}
.sp .sp-opt small{color:var(--sp-muted);font-size:.78rem}
.sp .sp-opt mark{background:#fef08a;color:inherit;border-radius:3px;padding:0 1px}
.sp .sp-empty{padding:10px 11px;color:var(--sp-muted);font-size:.85rem}
.sp .sp-tag{display:inline-block;font-size:.68rem;font-weight:800;border-radius:999px;padding:1px 7px;margin-left:4px;vertical-align:1px;background:#eef2f7;color:#475569}
.sp .sp-tag.Government{background:#e0f2fe;color:#075985}.sp .sp-tag.Catholic{background:#fef3c7;color:#92400e}.sp .sp-tag.Independent{background:#ede9fe;color:#5b21b6}
.sp .sp-card{display:flex;gap:12px;align-items:center;border:1.5px solid #bbf7d0;background:#f0fdf4;border-radius:12px;padding:11px 13px}
.sp .sp-card .ic{font-size:1.3rem}
.sp .sp-card .tx{flex:1;min-width:0}
.sp .sp-card b{display:block;color:#0f172a}
.sp .sp-card small{color:#166534;font-size:.8rem}
.sp .sp-help{font-size:.8rem;color:var(--sp-muted);margin-top:7px;line-height:1.5}
.sp .sp-link{appearance:none;border:0;background:none;padding:0;min-height:0;font:inherit;font-weight:700;color:var(--sp-accent);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.sp .sp-btn{appearance:none;border:1px solid #cbd5e1;background:#fff;border-radius:9px;padding:6px 11px;min-height:0;font:inherit;font-size:.82rem;font-weight:700;color:#334155;cursor:pointer}
.sp .sp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sp .sp-f{margin-bottom:12px;min-width:0}
.sp .sp-src{font-size:.72rem;color:#94a3b8;margin-top:8px}
@media(max-width:600px){.sp .sp-grid{grid-template-columns:1fr}}`;
  document.head.appendChild(st);
}

function highlight(text, q) {
  const qt = tokens(q).filter((t) => t.length > 1);
  let h = esc(text);
  qt.forEach((t) => { h = h.replace(new RegExp(`(^|[^a-z0-9>])(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"), "$1<mark>$2</mark>"); });
  return h;
}

// ---------------------------------------------------------------- combobox
function combobox(input, list, { search, render, onPick, empty }) {
  let items = [], active = -1;
  const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); active = -1; };
  const paint = () => {
    list.innerHTML = items.length ? items.map((it, i) => `<li id="${list.id}-${i}" class="sp-opt" role="option" aria-selected="${i === active}" data-i="${i}">${render(it)}</li>`).join("")
      : `<li class="sp-empty" role="presentation">${empty()}</li>`;
    input.setAttribute("aria-activedescendant", active >= 0 ? `${list.id}-${active}` : "");
  };
  const run = async () => {
    const q = input.value;
    if (norm(q).length < 2) { close(); return; }
    items = await search(q);
    if (input.value !== q) return;
    if (!items.length && !empty()) { close(); return; }
    active = items.length ? 0 : -1;
    list.hidden = false; input.setAttribute("aria-expanded", "true"); paint();
  };
  input.addEventListener("input", run);
  input.addEventListener("focus", () => { if (norm(input.value).length >= 2) run(); });
  input.addEventListener("keydown", (e) => {
    if (list.hidden) { if (e.key === "ArrowDown") run(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(items.length - 1, active + 1); paint(); scrollActive(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(0, active - 1); paint(); scrollActive(); }
    else if (e.key === "Enter") { if (active >= 0 && items[active]) { e.preventDefault(); e.stopPropagation(); const it = items[active]; close(); onPick(it); } }
    else if (e.key === "Escape") { e.stopPropagation(); close(); }
  });
  const scrollActive = () => { const el = list.querySelector(`[data-i="${active}"]`); if (el) el.scrollIntoView({ block: "nearest" }); };
  list.addEventListener("mousedown", (e) => {
    const li = e.target.closest("[data-i]"); if (!li) return;
    e.preventDefault(); const it = items[+li.dataset.i]; close(); onPick(it);
  });
  let blurT = 0;
  input.addEventListener("blur", () => { clearTimeout(blurT); blurT = setTimeout(() => { if (document.activeElement !== input) close(); }, 120); });
  return { close };
}

// ---------------------------------------------------------------- component
export function mountSchoolPicker(el, opts = {}) {
  injectStyle();
  const p = opts.prefix || "sp";
  const req = opts.required ? '<span class="sp-req">*</span>' : "";
  const prefer = opts.preferState || "NSW";
  const $ = (id) => el.querySelector("#" + p + id);
  let mode = "au";                 // au | os
  let manual = false;              // "My school isn't listed"
  let chosen = null;               // official school object (AU listed)
  let suburb = null;               // { name, state, lat, lng } (AU manual)
  let osCountry = "";
  let noSchools = false, noSub = false; // data files missing/unreachable → typed fallback, never a dead end

  el.classList.add("sp");
  el.innerHTML = `
  <div class="sp-seg" role="radiogroup" aria-label="Where is your school?">
    <button type="button" role="radio" data-mode="au" id="${p}ModeAu">🇦🇺 In Australia</button>
    <button type="button" role="radio" data-mode="os" id="${p}ModeOs">🌏 Another country</button>
  </div>
  <div class="sp-au" id="${p}Au">
    <div id="${p}Card" hidden></div>
    <div id="${p}Search">
      <label class="sp-lbl" for="${p}Q">${esc(opts.label || "School")}${req}</label>
      <div class="sp-box"><input class="sp-in" id="${p}Q" type="text" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${p}List" placeholder="Start typing the school's name or suburb…"/>
        <ul class="sp-list" id="${p}List" role="listbox" hidden></ul></div>
      <div class="sp-help">Choose it from the list. Can't find it? <button type="button" class="sp-link" id="${p}ToManual">My school isn't listed</button></div>
    </div>
    <div id="${p}Manual" hidden>
      <div class="sp-f"><label class="sp-lbl" for="${p}MName">School name${req}</label><input class="sp-in" id="${p}MName" maxlength="120" autocomplete="organization" placeholder="e.g. Coffs Harbour Christian Community School"/></div>
      <div class="sp-f"><label class="sp-lbl" for="${p}MSub">Suburb / town${req}</label>
        <div id="${p}SubCard" hidden></div>
        <div class="sp-box" id="${p}SubBox"><input class="sp-in" id="${p}MSub" type="text" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${p}SubList" placeholder="Start typing the suburb or town…"/>
          <ul class="sp-list" id="${p}SubList" role="listbox" hidden></ul></div>
        <select class="sp-in" id="${p}MState" aria-label="State or territory" style="margin-top:6px" hidden><option value="">State / territory…</option>${AU_STATES.map(([c, n]) => `<option value="${c}">${esc(n)}</option>`).join("")}</select></div>
      <div class="sp-help" id="${p}ToSearchWrap"><button type="button" class="sp-link" id="${p}ToSearch">← Search the school list instead</button></div>
    </div>
  </div>
  <div class="sp-os" id="${p}Os" hidden>
    <div class="sp-grid">
      <div class="sp-f"><label class="sp-lbl" for="${p}OsCountry">Country${req}</label>
        <select class="sp-in" id="${p}OsCountry"><option value="">Choose…</option>${COUNTRIES.filter((c) => c !== "Australia").map((c) => `<option>${esc(c)}</option>`).join("")}<option value="${OTHER}">Other…</option></select>
        <input class="sp-in" id="${p}OsOther" maxlength="60" placeholder="Type the country" style="margin-top:6px" hidden/></div>
      <div class="sp-f"><label class="sp-lbl" for="${p}OsSchool">School name${req}</label><input class="sp-in" id="${p}OsSchool" maxlength="120" autocomplete="organization"/></div>
      <div class="sp-f"><label class="sp-lbl" for="${p}OsTown">Town / city${req}</label><input class="sp-in" id="${p}OsTown" maxlength="80" autocomplete="address-level2"/></div>
      <div class="sp-f"><label class="sp-lbl" for="${p}OsRegion">State / region <span style="font-weight:500;color:#64748b">(optional)</span></label><input class="sp-in" id="${p}OsRegion" maxlength="60" autocomplete="address-level1"/></div>
    </div>
  </div>
  <div class="sp-src" id="${p}Src"></div>`;

  const changed = () => { if (opts.onChange) opts.onChange(api.get()); };

  function paint() {
    $("ModeAu").setAttribute("aria-checked", mode === "au"); $("ModeOs").setAttribute("aria-checked", mode === "os");
    $("Au").hidden = mode !== "au"; $("Os").hidden = mode !== "os";
    const showCard = mode === "au" && !manual && !!chosen;
    $("Card").hidden = !showCard; $("Search").hidden = !(mode === "au" && !manual && !chosen); $("Manual").hidden = !(mode === "au" && manual);
    if (showCard) {
      $("Card").innerHTML = `<div class="sp-card"><span class="ic">✅</span><span class="tx"><b>${esc(chosen.name)}</b><small>${esc([chosen.suburb, chosen.state, chosen.postcode].filter(Boolean).join(" "))}${chosen.sector ? ` · ${esc(chosen.sector)}` : ""}${chosen.type ? ` · ${esc(chosen.type)}` : ""}</small></span><button type="button" class="sp-btn" id="${p}Change">Change</button></div>`;
      $("Change").onclick = () => { chosen = null; paint(); changed(); setTimeout(() => { $("Q").value = ""; $("Q").focus(); }, 0); };
    }
    $("SubCard").hidden = !suburb; $("SubBox").hidden = !!suburb;
    $("MState").hidden = !noSub; $("ToSearchWrap").hidden = noSchools;
    if (suburb) {
      $("SubCard").innerHTML = `<div class="sp-card" style="padding:8px 11px"><span class="ic">📍</span><span class="tx"><b>${esc(suburb.name)}, ${esc(suburb.state)}</b></span><button type="button" class="sp-btn" id="${p}SubChange">Change</button></div>`;
      $("SubChange").onclick = () => { suburb = null; paint(); changed(); setTimeout(() => { $("MSub").value = ""; $("MSub").focus(); }, 0); };
    }
  }

  el.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { mode = b.dataset.mode; paint(); changed(); }));
  $("ToManual").addEventListener("click", () => { manual = true; if (!$("MName").value) $("MName").value = $("Q").value.trim(); paint(); changed(); setTimeout(() => $("MName").focus(), 0); });
  $("ToSearch").addEventListener("click", () => { manual = false; paint(); changed(); setTimeout(() => $("Q").focus(), 0); });
  $("OsCountry").addEventListener("change", () => { $("OsOther").hidden = $("OsCountry").value !== OTHER; if (!$("OsOther").hidden) $("OsOther").focus(); changed(); });
  ["MName", "MSub", "MState", "OsSchool", "OsTown", "OsRegion", "OsOther"].forEach((id) => $(id).addEventListener("input", () => { $(id).classList.remove("bad"); changed(); }));

  combobox($("Q"), $("List"), {
    search: async (q) => searchSchools(await loadSchools(), q, { prefer }),
    render: (s) => `<b>${highlight(s.name, $("Q").value)}</b><small>${highlight([s.suburb, s.state, s.postcode].filter(Boolean).join(" "), $("Q").value)}</small>${s.sector ? `<span class="sp-tag ${esc(s.sector)}">${esc(s.sector)}</span>` : ""}`,
    onPick: (s) => { chosen = s; $("Q").classList.remove("bad"); paint(); changed(); },
    empty: () => `No school matches. Check the spelling, or choose <b>My school isn't listed</b>.`,
  });
  combobox($("MSub"), $("SubList"), {
    search: async (q) => searchSuburbs(await loadSuburbs(), q, { prefer }),
    render: (s) => `<b>${highlight(s.name, $("MSub").value)}</b><small>${esc(s.state)}</small>`,
    onPick: (s) => { suburb = s; $("MSub").classList.remove("bad"); paint(); changed(); },
    empty: () => (noSub ? "" : `No suburb or town matches that.`),
  });

  const api = {
    get() {
      if (mode === "os") {
        const country = $("OsCountry").value === OTHER ? $("OsOther").value.trim() : $("OsCountry").value;
        const c = countryCentre(country);
        return { school: $("OsSchool").value.trim().replace(/\s+/g, " "), schoolId: "", sector: "", schoolType: "", suburb: $("OsTown").value.trim(), state: $("OsRegion").value.trim(), postcode: "", country,
          lat: c ? c[0] : null, lng: c ? c[1] : null, locSource: c ? "country" : "" };
      }
      if (!manual && chosen) return { school: chosen.name, schoolId: chosen.id, sector: chosen.sector || "", schoolType: chosen.type || "", suburb: chosen.suburb, state: chosen.state, postcode: chosen.postcode || "", country: "Australia", lat: chosen.lat, lng: chosen.lng, locSource: "school" };
      if (manual && noSub) return { school: $("MName").value.trim().replace(/\s+/g, " "), schoolId: "", sector: "", schoolType: "", suburb: $("MSub").value.trim().replace(/\s+/g, " "), state: $("MState").value, postcode: "", country: "Australia", lat: null, lng: null, locSource: "" };
      if (manual) return { school: $("MName").value.trim().replace(/\s+/g, " "), schoolId: "", sector: "", schoolType: "", suburb: suburb ? suburb.name : "", state: suburb ? suburb.state : "", postcode: "", country: "Australia",
        lat: suburb ? suburb.lat : null, lng: suburb ? suburb.lng : null, locSource: suburb && suburb.lat != null ? "suburb" : "" };
      return { school: "", schoolId: "", sector: "", schoolType: "", suburb: "", state: "", postcode: "", country: "Australia", lat: null, lng: null, locSource: "" };
    },
    problem() {
      const bad = (id, text) => { const x = $(id); if (x) x.classList.add("bad"); return { text, focus: p + id }; };
      if (mode === "os") {
        const v = api.get();
        if (!v.country) return bad($("OsCountry").value === OTHER ? "OsOther" : "OsCountry", "Please choose the country.");
        if (!v.school) return bad("OsSchool", "Please enter the school's name.");
        if (!v.suburb) return bad("OsTown", "Please enter the town or city.");
        return null;
      }
      if (!manual && !chosen) return bad("Q", "Please choose your school from the list — or choose “My school isn't listed”.");
      if (manual) {
        if (!$("MName").value.trim()) return bad("MName", "Please enter your school's name.");
        if (noSub) { if (!$("MSub").value.trim()) return bad("MSub", "Please enter your suburb or town."); if (!$("MState").value) return bad("MState", "Please choose the state or territory."); }
        else if (!suburb) return bad("MSub", "Please choose your suburb or town from the list.");
      }
      return null;
    },
    set(v) {
      v = v || {}; chosen = null; suburb = null; manual = false;
      const country = String(v.country || "").trim();
      mode = country && country !== "Australia" ? "os" : "au";
      if (mode === "os") {
        const known = COUNTRIES.includes(country);
        $("OsCountry").value = known ? country : OTHER; $("OsOther").hidden = known; $("OsOther").value = known ? "" : country;
        $("OsSchool").value = v.school || ""; $("OsTown").value = v.suburb || ""; $("OsRegion").value = v.state || "";
      } else if (v.schoolId) {
        chosen = { id: v.schoolId, name: v.school || "", suburb: v.suburb || "", state: v.state || "", postcode: v.postcode || "", sector: v.sector || "", type: v.schoolType || "", lat: v.lat, lng: v.lng };
        loadSchools().then((d) => { const o = d.byId.get(String(v.schoolId)); if (o && chosen && chosen.id === o.id) { chosen = o; paint(); } });
      } else if (v.school) {
        manual = true; $("MName").value = v.school;
        if (v.suburb && v.state) {
          suburb = { name: v.suburb, state: v.state, lat: v.lat ?? null, lng: v.lng ?? null };
          $("MSub").value = v.suburb; $("MState").value = v.state;
          if (suburb.lat == null) loadSuburbs().then((d) => { const m = matchSuburb(d, v.suburb, v.state); if (m && suburb && suburb.name === v.suburb) { suburb.lat = m.lat; suburb.lng = m.lng; changed(); } });
        }
      }
      paint();
    },
    focus() { const t = mode === "os" ? $("OsCountry") : manual ? $("MName") : chosen ? $("Change") : $("Q"); if (t) t.focus(); },
    ready: Promise.all([loadSchools(), loadSuburbs()]).then(([s, sub]) => {
      noSchools = !s.list.length; noSub = !sub.list.length;
      if (noSub && suburb) { $("MSub").value = suburb.name; $("MState").value = suburb.state; suburb = null; }
      if (noSchools && mode === "au" && !chosen && !manual) { manual = true; if (!$("MName").value) $("MName").value = $("Q").value.trim(); }
      paint(); changed();
      $("Src").textContent = s.list.length ? `School list: ${s.source}. Suburbs: ABS (CC BY 4.0).` : "";
    }),
  };
  api.set(opts.value || {});
  return api;
}

/** One-line description of a picked school, e.g. "Coffs Harbour High School — Coffs Harbour, NSW". */
export function describeSchool(v) {
  const loc = formatLocation(v);
  return [v.school, loc].filter(Boolean).join(" — ");
}
