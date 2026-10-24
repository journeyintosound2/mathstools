/**
 * MMT Platform — school location fields (2026-10-24).
 *
 * ONE place that draws, wires and reads the Suburb / State / Country fields, so
 * the request form, the teacher profile and the admin console all behave the
 * same. Plain ES module, no dependencies.
 *
 *   el.innerHTML = locationFieldsHtml("rq", { suburb, state, country }, { required:true });
 *   wireLocation("rq");                  // country ↔ state field switching
 *   const loc = readLocation("rq");      // { suburb, state, country }
 *   const err = locationProblem(loc);    // "" or a sentence (for required forms)
 *   formatLocation(loc)                  // "Coffs Harbour, NSW" (country added if not Australia)
 *
 * State is a dropdown of the eight states/territories when the country is
 * Australia (suburb names repeat across states), free text anywhere else.
 * Keep AU_STATES in step with cleanLocation() in the Cloud Functions.
 */
export const AU_STATES = [
  ["NSW", "New South Wales"], ["VIC", "Victoria"], ["QLD", "Queensland"], ["SA", "South Australia"],
  ["WA", "Western Australia"], ["TAS", "Tasmania"], ["ACT", "Australian Capital Territory"], ["NT", "Northern Territory"],
];
export const COUNTRIES = [
  "Australia", "New Zealand", "United Kingdom", "Ireland", "United States", "Canada", "Singapore",
  "Hong Kong", "Malaysia", "Indonesia", "Philippines", "India", "South Africa", "United Arab Emirates",
];
const OTHER = "__other";
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const $ = (id) => document.getElementById(id);

let styled = false;
function injectStyle() {
  if (styled || typeof document === "undefined") return;
  styled = true;
  const st = document.createElement("style");
  st.textContent = `.mmt-loc{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:12px}
.mmt-loc>.field{min-width:0}
.mmt-loc select,.mmt-loc input{width:100%;box-sizing:border-box}
.mmt-loc .loc-other{margin-top:6px}
@media(max-width:600px){.mmt-loc{grid-template-columns:1fr}}`;
  document.head.appendChild(st);
}

/** The three fields as HTML. ids: <p>Suburb, <p>StateSel, <p>StateTxt, <p>Country, <p>CountryOther. */
export function locationFieldsHtml(p, v = {}, opts = {}) {
  injectStyle();
  const req = opts.required ? (opts.reqMark || '<span class="req" style="color:#dc2626;margin-left:2px">*</span>') : "";
  const country = String(v.country || opts.defaultCountry || "Australia").trim();
  const known = COUNTRIES.includes(country);
  const isAu = country === "Australia";
  const state = String(v.state || "").trim();
  const stateKnown = AU_STATES.some(([c]) => c === state);
  const ph = (t) => (opts.placeholders === false ? "" : ` placeholder="${esc(t)}"`);
  return `<div class="mmt-loc">
  <div class="field"><label for="${p}Suburb">Suburb / town${req}</label><input id="${p}Suburb" autocomplete="address-level2" maxlength="80" value="${esc(v.suburb || "")}"${ph("e.g. Coffs Harbour")}/></div>
  <div class="field"><label for="${isAu ? p + "StateSel" : p + "StateTxt"}" id="${p}StateLbl">${isAu ? "State / territory" : "State / region"}${isAu ? req : ""}</label>
    <select id="${p}StateSel" autocomplete="address-level1"${isAu ? "" : ' style="display:none"'}><option value="">Choose…</option>${AU_STATES.map(([c, n]) => `<option value="${c}" ${state === c ? "selected" : ""}>${c} — ${n}</option>`).join("")}</select>
    <input id="${p}StateTxt" autocomplete="address-level1" maxlength="60" value="${esc(isAu && stateKnown ? "" : state)}"${isAu ? ' style="display:none"' : ""}${ph("optional")}/></div>
  <div class="field"><label for="${p}Country">Country${req}</label>
    <select id="${p}Country" autocomplete="country-name">${COUNTRIES.map((c) => `<option ${c === country ? "selected" : ""}>${esc(c)}</option>`).join("")}<option value="${OTHER}" ${known ? "" : "selected"}>Other…</option></select>
    <input id="${p}CountryOther" class="loc-other" maxlength="60" value="${esc(known ? "" : country)}"${known ? ' style="display:none"' : ""}${ph("Type your country")}/></div>
</div>`;
}

/** Country changes swap the state dropdown/text box and show "Other…". Safe to call twice. */
export function wireLocation(p, onChange) {
  const c = $(p + "Country"); if (!c || c.dataset.wired) return;
  c.dataset.wired = "1";
  const sync = () => {
    const other = c.value === OTHER;
    const au = c.value === "Australia";
    $(p + "CountryOther").style.display = other ? "" : "none";
    $(p + "StateSel").style.display = au ? "" : "none";
    $(p + "StateTxt").style.display = au ? "none" : "";
    const lbl = $(p + "StateLbl");
    const req = lbl.querySelector(".req");
    lbl.firstChild.textContent = au ? "State / territory" : "State / region";
    lbl.setAttribute("for", p + (au ? "StateSel" : "StateTxt"));
    if (req) req.style.display = au ? "" : "none";
    if (other) $(p + "CountryOther").focus();
    if (onChange) onChange();
  };
  c.addEventListener("change", sync);
  [p + "Suburb", p + "StateSel", p + "StateTxt", p + "CountryOther"].forEach((id) => {
    const el = $(id); if (el && onChange) el.addEventListener("input", onChange);
  });
  const lbl = $(p + "StateLbl"); const req = lbl && lbl.querySelector(".req");
  if (req) req.style.display = c.value === "Australia" ? "" : "none";
}

/** { suburb, state, country } from the fields (trimmed, spaces collapsed). */
export function readLocation(p) {
  const t = (id) => String(($(id) && $(id).value) || "").trim().replace(/\s+/g, " ");
  const cv = $(p + "Country") ? $(p + "Country").value : "";
  const country = cv === OTHER ? t(p + "CountryOther") : cv;
  const state = country === "Australia" ? t(p + "StateSel") : t(p + "StateTxt");
  return { suburb: t(p + "Suburb"), state, country };
}

/** For required forms: "" when complete, otherwise what to fix + which field to focus. */
export function locationProblem(loc, p) {
  if (!loc.suburb) return { text: "Please enter your school's suburb or town.", focus: p && p + "Suburb" };
  if (!loc.country) return { text: "Please choose your country.", focus: p && (p + "CountryOther") };
  if (loc.country === "Australia" && !AU_STATES.some(([c]) => c === loc.state)) return { text: "Please choose your state or territory.", focus: p && p + "StateSel" };
  return null;
}

/** "Coffs Harbour, NSW" — the country is added when it isn't Australia (or always with {country:true}). */
export function formatLocation(o, opts = {}) {
  if (!o) return "";
  const parts = [o.suburb, o.state].map((x) => String(x || "").trim()).filter(Boolean);
  const country = String(o.country || "").trim();
  if (country && (opts.country || country !== "Australia")) parts.push(country);
  return parts.join(", ");
}

/** A short region label for grouping: the state in Australia, otherwise the country. */
export function regionOf(o) {
  const country = String((o && o.country) || "").trim();
  if (!country) return "";
  if (country === "Australia") return String(o.state || "").trim() ? `${o.state.trim()}, Australia` : "Australia";
  return country;
}

/**
 * Rough centre of each country — overseas teachers get one pin per country on
 * the admin map until we geocode towns. Keys match COUNTRIES (+ common extras).
 */
export const COUNTRY_CENTRES = {
  "Australia": [-25.3, 133.8], "New Zealand": [-41.0, 174.0], "United Kingdom": [54.0, -2.5], "Ireland": [53.4, -8.0],
  "United States": [39.8, -98.6], "Canada": [56.1, -106.3], "Singapore": [1.35, 103.82], "Hong Kong": [22.32, 114.17],
  "Malaysia": [4.2, 101.97], "Indonesia": [-2.5, 118.0], "Philippines": [12.9, 121.8], "India": [22.0, 79.0],
  "South Africa": [-29.0, 24.0], "United Arab Emirates": [24.0, 54.0], "Fiji": [-17.7, 178.1],
  "Papua New Guinea": [-6.3, 145.0], "Japan": [36.2, 138.3], "China": [35.9, 104.2], "Thailand": [15.9, 101.0],
  "Vietnam": [14.06, 108.28], "Germany": [51.2, 10.45], "France": [46.6, 2.2], "Netherlands": [52.13, 5.29],
  "Samoa": [-13.76, -172.1], "Tonga": [-21.18, -175.2], "Sri Lanka": [7.87, 80.77], "Pakistan": [30.4, 69.3],
  "Kenya": [0.0, 37.9], "Nigeria": [9.08, 8.68], "Brazil": [-14.2, -51.9], "Chile": [-35.7, -71.5], "Spain": [40.46, -3.75],
  "Italy": [41.87, 12.57], "Qatar": [25.35, 51.18], "Saudi Arabia": [23.9, 45.1], "South Korea": [35.9, 127.8],
  "Taiwan": [23.7, 121.0], "Nepal": [28.4, 84.1], "Bangladesh": [23.7, 90.4], "Cambodia": [12.6, 105.0],
  "Myanmar": [21.9, 95.96], "Mexico": [23.6, -102.6], "Argentina": [-38.4, -63.6], "Sweden": [60.1, 18.6],
  "Norway": [60.5, 8.5], "Denmark": [56.26, 9.5], "Switzerland": [46.8, 8.2], "Vanuatu": [-15.4, 166.96],
  "Solomon Islands": [-9.6, 160.16], "Timor-Leste": [-8.87, 125.73],
};
export function countryCentre(country) {
  const c = String(country || "").trim().toLowerCase();
  const hit = Object.keys(COUNTRY_CENTRES).find((k) => k.toLowerCase() === c);
  return hit ? COUNTRY_CENTRES[hit] : null;
}

