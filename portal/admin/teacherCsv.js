/**
 * Teacher CSV round trip for the admin console.
 *
 *   Export → fill in the blanks (by hand, or ask Claude) → drop the file back in.
 *
 * Rules (kept deliberately safe):
 *  - Rows are matched by "Teacher code". Unknown codes are listed and skipped.
 *  - A blank cell means "leave it as it is" — the import only fills in or overrides.
 *  - Status / Classes / Active students / Last sign-in columns are ignored (read-only).
 *  - A School ID found on the official list fills in the official name, suburb, state,
 *    postcode, sector, type and map location (the official record wins).
 *  - Changing the school or location without a School ID clears the old ID, and the map
 *    pin moves to the new suburb's centre (or is cleared if the suburb isn't known).
 * Pure functions only — no Firebase here, so it can be tested on its own.
 */

export const EXPORT_COLUMNS = [
  ["teacherCode", "Teacher code"], ["teacherName", "Name"], ["email", "Email"], ["position", "Role"],
  ["school", "School"], ["schoolId", "School ID"], ["sector", "Sector"], ["schoolType", "School type"],
  ["suburb", "Suburb"], ["state", "State"], ["postcode", "Postcode"], ["country", "Country"],
  ["lat", "Latitude"], ["lng", "Longitude"], ["locSource", "Location source"], ["emailUpdates", "Update emails"],
];
export const READ_ONLY_COLUMNS = ["Status", "Classes", "Active students", "Last sign-in"];

const ALIASES = {
  teacherCode: ["teachercode", "code", "teacher"], teacherName: ["name", "teachername", "fullname"],
  email: ["email", "emailaddress", "schoolemail"], position: ["role", "position", "roleposition"],
  school: ["school", "schoolname"], schoolId: ["schoolid", "acarasmlid", "schoolcode"],
  sector: ["sector", "schoolsector"], schoolType: ["schooltype", "type"],
  suburb: ["suburb", "town", "suburbtown", "city", "towncity"], state: ["state", "region", "stateregion", "stateterritory"],
  postcode: ["postcode", "postalcode", "zip"], country: ["country"],
  lat: ["latitude", "lat"], lng: ["longitude", "lng", "lon", "long"],
  locSource: ["locationsource", "locsource"], emailUpdates: ["updateemails", "emailupdates", "updates"],
};
const HEADER_TO_FIELD = new Map(Object.entries(ALIASES).flatMap(([f, list]) => list.map((a) => [a, f])));
const hkey = (h) => String(h || "").toLowerCase().replace(/[^a-z0-9]/g, "");

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const SECTORS = ["Government", "Catholic", "Independent"];
const LOC_SOURCES = ["school", "suburb", "country", "manual"];
const PIN_WORD = { school: "at the school", suburb: "suburb centre", country: "country centre", manual: "typed in" };
const AU = [["NSW", "new south wales"], ["VIC", "victoria"], ["QLD", "queensland"], ["SA", "south australia"],
  ["WA", "western australia"], ["TAS", "tasmania"], ["ACT", "australian capital territory"], ["NT", "northern territory"]];

// ---------------------------------------------------------------- CSV text
/** RFC 4180-ish parser: quotes, doubled quotes, commas/newlines in quotes, CRLF, BOM; also ; or tab delimited. */
export function parseCsv(text) {
  text = String(text || "").replace(/^﻿/, "");
  const first = text.split(/\r?\n/, 1)[0] || "";
  const count = (ch) => first.split(ch).length - 1;
  const delim = count("\t") > count(",") && count("\t") > count(";") ? "\t" : count(";") > count(",") ? ";" : ",";
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"' && cell === "") q = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => String(x).trim() !== ""));
}

export function toCsv(rows) {
  const q = (v) => { const x = String(v ?? ""); return /[",\n\r]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; };
  return "﻿" + rows.map((r) => r.map(q).join(",")).join("\r\n") + "\r\n"; // BOM so Excel keeps accents
}

/** One export row per teacher (plus the read-only info columns at the end). */
export function exportRows(teachers, statsFor) {
  const head = EXPORT_COLUMNS.map(([, h]) => h).concat(READ_ONLY_COLUMNS);
  const body = teachers.slice().sort((a, b) => String(a.teacherName || "").localeCompare(String(b.teacherName || ""))).map((t) => {
    const s = statsFor ? statsFor(t) : {};
    return EXPORT_COLUMNS.map(([f]) => f === "emailUpdates" ? (t.emailUpdates === false ? "Off" : "On") : (f === "lat" || f === "lng") ? (typeof t[f] === "number" ? t[f] : "") : (t[f] ?? ""))
      .concat([t.active === false ? "Inactive" : "Active", s.classes || "", s.activeStudents ?? "", s.lastSignIn || ""]);
  });
  return [head, ...body];
}

// ---------------------------------------------------------------- cleaning
const tidy = (v) => String(v ?? "").replace(/\s+/g, " ").trim();
function cleanState(v, country) {
  const s = tidy(v); if (!s) return { v: "" };
  if (country && country !== "Australia") return { v: s.slice(0, 60) };
  const k = s.toLowerCase().replace(/[^a-z ]/g, "").trim();
  const hit = AU.find(([c, n]) => c.toLowerCase() === k || n === k);
  return hit ? { v: hit[0] } : { v: "", err: `State "${s}" isn't an Australian state or territory` };
}
function cleanCountry(v) {
  const s = tidy(v); if (!s) return "";
  return /^(au|aus|australia|oz)$/i.test(s) ? "Australia" : /^(nz|new zealand|aotearoa)$/i.test(s) ? "New Zealand" : /^(uk|united kingdom|england|great britain)$/i.test(s) ? "United Kingdom" : /^(us|usa|united states)$/i.test(s) ? "United States" : s.slice(0, 60);
}
function cleanBool(v) {
  const s = tidy(v).toLowerCase(); if (!s) return { v: undefined };
  if (["on", "yes", "y", "true", "1"].includes(s)) return { v: true };
  if (["off", "no", "n", "false", "0"].includes(s)) return { v: false };
  return { v: undefined, err: `Update emails "${v}" should be On or Off` };
}
const numOrNull = (v) => { const s = tidy(v); if (!s) return null; const n = Number(s); return Number.isFinite(n) ? n : NaN; };
const same = (a, b) => (a ?? "") === (b ?? "") || (a == null && b === "") || (a === "" && b == null);

/**
 * Work out what an imported CSV would change. Nothing is written here.
 * @returns {{ rows: Array, unknown: string[], dupes: string[], missingCode: number, columns: string[], ignored: string[], error?: string }}
 * Each row: { teacher, changes: {field: newValue}, diffs: [{field,label,from,to}], notes: [], problems: [] }
 */
export function planImport(csvRows, teachers, { schools = null, suburbs = null, matchSuburb = null, countryCentre = null } = {}) {
  if (!csvRows.length) return { error: "That file is empty." };
  const header = csvRows[0];
  const fields = header.map((h) => HEADER_TO_FIELD.get(hkey(h)) || null);
  if (!fields.includes("teacherCode")) return { error: 'There\'s no "Teacher code" column, so the rows can\'t be matched to teachers. Start from Export CSV and keep that column.' };
  const columns = [...new Set(fields.filter(Boolean))];
  const ignored = header.filter((h, i) => !fields[i] && tidy(h));
  const byCode = new Map(teachers.map((t) => [String(t.teacherCode).toUpperCase(), t]));
  const emailOwner = new Map(teachers.filter((t) => t.email).map((t) => [String(t.email).toLowerCase(), t.teacherCode]));
  const out = { rows: [], unknown: [], dupes: [], missingCode: 0, columns, ignored };
  const seen = new Set();
  const label = Object.fromEntries(EXPORT_COLUMNS);

  for (const r of csvRows.slice(1)) {
    const cell = {}; fields.forEach((f, i) => { if (f && cell[f] === undefined) cell[f] = r[i] ?? ""; });
    const code = tidy(cell.teacherCode).toUpperCase();
    if (!code) { out.missingCode++; continue; }
    const t = byCode.get(code);
    if (!t) { out.unknown.push(code); continue; }
    if (seen.has(code)) { out.dupes.push(code); continue; }
    seen.add(code);
    const want = {}, notes = [], problems = [];
    const give = (f, v) => { if (v !== undefined && v !== "") want[f] = v; };

    // simple text fields
    if (tidy(cell.teacherName)) give("teacherName", tidy(cell.teacherName).slice(0, 80));
    if (tidy(cell.position)) give("position", tidy(cell.position).slice(0, 80));
    if (tidy(cell.email)) {
      const e = tidy(cell.email).toLowerCase();
      if (!EMAIL_RE.test(e)) problems.push(`Email "${cell.email}" doesn't look right — left as it is`);
      else { give("email", e); const o = emailOwner.get(e); if (o && o !== t.teacherCode) notes.push(`⚠️ ${e} is also on ${o}`); }
    }
    const eu = cleanBool(cell.emailUpdates); if (eu.err) problems.push(eu.err); else if (eu.v !== undefined) want.emailUpdates = eu.v;

    // location + school
    const country = cleanCountry(cell.country);
    if (country) want.country = country;
    const effCountry = want.country || t.country || "Australia";
    if (tidy(cell.school)) give("school", tidy(cell.school).slice(0, 120));
    if (tidy(cell.suburb)) give("suburb", tidy(cell.suburb).slice(0, 80));
    if (tidy(cell.state)) { const st = cleanState(cell.state, effCountry); if (st.err) problems.push(st.err); else give("state", st.v); }
    if (tidy(cell.postcode)) give("postcode", tidy(cell.postcode).replace(/[^A-Za-z0-9 -]/g, "").slice(0, 10));
    if (tidy(cell.sector)) { const s = SECTORS.find((x) => x.toLowerCase() === tidy(cell.sector).toLowerCase()); if (s) want.sector = s; else problems.push(`Sector "${cell.sector}" should be Government, Catholic or Independent`); }
    if (tidy(cell.schoolType)) give("schoolType", tidy(cell.schoolType).slice(0, 30));
    const lat = numOrNull(cell.lat), lng = numOrNull(cell.lng);
    let coords = null;
    if (lat !== null || lng !== null) {
      if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) problems.push("Latitude/Longitude need to be two numbers (e.g. -30.29 and 153.11) — left as they are");
      else coords = { lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5 };
    }
    const src = tidy(cell.locSource).toLowerCase();

    const sid = tidy(cell.schoolId).replace(/[^A-Za-z0-9-]/g, "").slice(0, 24);
    if (sid) {
      const o = schools && schools.byId ? schools.byId.get(sid) : null;
      if (o) {
        if (want.school && want.school !== o.name) notes.push(`School ID ${sid} is "${o.name}" — using the official name`);
        Object.assign(want, { school: o.name, schoolId: o.id, sector: o.sector || "", schoolType: o.type || "", suburb: o.suburb, state: o.state, postcode: o.postcode || "", country: "Australia", lat: o.lat, lng: o.lng, locSource: "school" });
        coords = null;
      } else if (sid === t.schoolId) { /* unchanged, fine */ }
      else if (schools && schools.list && schools.list.length) problems.push(`School ID ${sid} isn't on the school list — left as it is`);
      else want.schoolId = sid; // list not installed: trust it
    }
    if (coords) { want.lat = coords.lat; want.lng = coords.lng; want.locSource = LOC_SOURCES.includes(src) ? src : "manual"; }

    // Did the school or place change without an official ID? Then the old ID / pin no longer apply.
    const schoolChanged = want.school !== undefined && !same(want.school, t.school);
    const placeChanged = ["suburb", "state", "country"].some((f) => want[f] !== undefined && !same(want[f], t[f]));
    if (!want.schoolId && (schoolChanged || placeChanged) && t.schoolId) {
      want.schoolId = ""; if (!want.sector) want.sector = t.sector && !schoolChanged ? t.sector : ""; if (!want.schoolType) want.schoolType = "";
      if (!want.postcode && placeChanged) want.postcode = "";
      notes.push("No longer linked to the official school list (school or place changed)");
    }
    if (want.lat === undefined && placeChanged) {
      const sub = want.suburb ?? t.suburb, st = want.state ?? t.state, co = want.country ?? t.country;
      const m = co === "Australia" && sub && matchSuburb && suburbs ? matchSuburb(suburbs, sub, st) : null;
      if (m) { want.lat = m.lat; want.lng = m.lng; want.locSource = "suburb"; notes.push(`📍 Pinned at the centre of ${m.name}, ${m.state}`); }
      else if (co && co !== "Australia") { const c = countryCentre ? countryCentre(co) : null; want.lat = c ? c[0] : null; want.lng = c ? c[1] : null; want.locSource = c ? "country" : ""; notes.push(c ? `🌏 Pinned at the centre of ${co}` : "No map pin (country not on the list)"); }
      else if (typeof t.lat === "number") { want.lat = null; want.lng = null; want.locSource = ""; notes.push("Old map pin removed — the new suburb isn't on the suburb list"); }
    }
    if (want.country === "Australia" || (!want.country && effCountry === "Australia")) {
      if ((want.suburb !== undefined || want.state !== undefined) && !(want.state ?? t.state)) problems.push("Australian locations need a State (e.g. NSW)");
    }

    // keep only real changes
    const changes = {}, diffs = [];
    for (const [f, v] of Object.entries(want)) {
      const cur = t[f];
      const eq = f === "emailUpdates" ? (cur !== false) === v : f === "lat" || f === "lng" ? (typeof cur === "number" ? cur : null) === v : same(v, cur);
      if (eq) continue;
      changes[f] = v;
      if (!["lat", "lng", "locSource"].includes(f)) diffs.push({ field: f, label: label[f] || f, from: f === "emailUpdates" ? (cur === false ? "Off" : "On") : cur ?? "", to: f === "emailUpdates" ? (v ? "On" : "Off") : v ?? "" });
    }
    if (["lat", "lng", "locSource"].some((f) => f in changes)) {
      const pin = (o) => (typeof o.lat === "number" && typeof o.lng === "number" ? `${o.lat.toFixed(3)}, ${o.lng.toFixed(3)}${o.locSource ? ` (${PIN_WORD[o.locSource] || o.locSource})` : ""}` : "");
      diffs.push({ field: "pin", label: "Map pin", from: pin(t), to: pin({ lat: changes.lat !== undefined ? changes.lat : t.lat, lng: changes.lng !== undefined ? changes.lng : t.lng, locSource: changes.locSource !== undefined ? changes.locSource : t.locSource }) });
    }
    out.rows.push({ teacher: t, changes, diffs, notes, problems });
  }
  return out;
}
