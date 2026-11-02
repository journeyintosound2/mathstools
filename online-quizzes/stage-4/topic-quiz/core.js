/* Mills Maths Tools — Whole-topic quizzes: the DOM-free core
   ------------------------------------------------------------------------
   online-quizzes/stage-4/topic-quiz/core.js

   Everything here is pure: random helpers, number formatting, and the
   answer checkers. The quiz engine (engine.js) and every topic bank
   (banks/*.js) use it through window.MMTQCore, and the Node harness loads
   the same file, so what is tested is exactly what students are marked by.

   A checker returns one of three things:
     { ok:true }                     right
     { ok:false }                    wrong (uses up the student's attempt)
     { nudge:"…" }                   the input is unreadable, or right in
                                     value but not in the form asked for
                                     (unsimplified ratio, not in index form,
                                     not in terms of π). A nudge never uses
                                     up the attempt — the student fixes the
                                     form and checks again.
*/
(function (root) {
  "use strict";

  /* ---------- random helpers ---------- */
  const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function sample(arr, n) { return shuffle(arr).slice(0, n); }
  const chance = p => Math.random() < p;
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }
  const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
  const round = (v, dp = 0) => { const k = Math.pow(10, dp); return Math.round((v + Math.sign(v) * 1e-12) * k) / k; };

  /* ---------- formatting ---------- */
  const MINUS = "−";
  /* 12500 → "12 500" (4-digit numbers stay together, as in NESA papers);
     negatives get a real minus sign; at most `dp` decimal places, trailing
     zeros dropped unless `fixed`. */
  function fmt(v, dp = 4, fixed = false) {
    if (!isFinite(v)) return String(v);
    let s = fixed ? round(v, dp).toFixed(dp) : String(round(v, dp));
    if (/e/i.test(s)) s = round(v, dp).toFixed(dp).replace(/\.?0+$/, "");
    const neg = s.startsWith("-"); if (neg) s = s.slice(1);
    let [w, d] = s.split(".");
    if (w.length > 4) w = w.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return (neg ? MINUS : "") + w + (d !== undefined ? "." + d : "");
  }
  const money = v => (v < 0 ? MINUS : "") + "$" + Math.abs(v).toFixed(Math.abs(v) % 1 ? 2 : 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const money2 = v => "$" + Math.abs(v).toFixed(2);
  const sup = e => `<sup>${e}</sup>`;
  function frac(n, d, simplify = true) {
    if (simplify) { const g = gcd(n, d); n /= g; d /= g; }
    if (d < 0) { n = -n; d = -d; }
    if (d === 1) return fmt(n);
    return `<span class="fr">${n < 0 ? `<span class="frs">${MINUS}</span>` : ""}<span class="frn">${Math.abs(n)}</span><span class="frd">${d}</span></span>`;
  }
  const fracText = (n, d) => { const g = gcd(n, d); return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`; };
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  /* "2^3 x 3" style answer text rendered with real superscripts, for previews. */
  function prettyPowers(s) {
    return esc(s).replace(/\^\(?(-?\d+)\)?/g, (m, e) => sup(e)).replace(/\*/g, " × ").replace(/\bpi\b/gi, "π");
  }

  /* ---------- parsing ---------- */
  const SUPMAP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };
  /* Undo everything a keyboard or phone might do to a number: unicode minus
     signs, superscript digits, thin/no-break spaces, thousands commas. */
  function clean(raw) {
    let s = String(raw == null ? "" : raw).trim();
    s = s.replace(/[−–—‒]/g, "-").replace(/[   ]/g, " ");
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, m => "^" + m.split("").map(c => SUPMAP[c]).join(""));
    s = s.replace(/[×✕✖·∙]/g, "*").replace(/÷/g, "/");
    return s;
  }
  /* Drop thousands separators: "12,500" "12 500" → "12500". A comma that is
     not followed by exactly three digits is left alone. */
  function dropGroups(s) {
    return s.replace(/(\d)[ ,](?=\d{3}(?!\d))/g, "$1");
  }
  /* A plain number, a fraction "7/2", or a mixed number "3 1/2". Units and
     currency around it are ignored. Returns NaN if there is no number. */
  function parseNumber(raw, { allowPercent = false } = {}) {
    let s = clean(raw);
    if (!s) return NaN;
    let pct = false;
    if (/%\s*$/.test(s)) { pct = true; s = s.replace(/%\s*$/, ""); }
    s = s.replace(/^[a-z]\s*=\s*/i, "");          // "x = 12"
    s = s.replace(/^\$\s*/, "").replace(/^(-)\s*\$\s*/, "$1");
    // a trailing unit: cm, m^2, km/h, mL, °, "cups", "hours" …
    s = s.replace(/\s*[a-zμ°]+(\^[23])?(\/[a-z]+)?\.?\s*$/i, "");
    s = dropGroups(s.trim()).replace(/\s+/g, " ");
    let m;
    if ((m = /^(-?)(\d+) (\d+)\/(\d+)$/.exec(s))) { const v = Number(m[2]) + Number(m[3]) / Number(m[4]); return (m[1] ? -v : v) / (pct ? 100 : 1); }
    if ((m = /^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/.exec(s))) { const d = Number(m[2]); return d === 0 ? NaN : Number(m[1]) / d / (pct ? 100 : 1); }
    if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) { const v = Number(s); return pct && !allowPercent ? v : pct ? v / 100 : v; }
    return NaN;
  }
  const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

  /* ---------- checkers by answer mode ---------- */
  const CHECK = {};

  /* num: q.value; q.dp = decimal places asked for (tolerance half a unit in
     that place, plus anything computed with 3.14 if q.piApprox); q.tol */
  CHECK.num = (q, raw) => {
    const v = parseNumber(raw);
    if (isNaN(v)) return { nudge: "Type a number." };
    const vals = [q.value].concat(q.alts || []);
    let tol = q.tol != null ? q.tol : (q.dp != null ? 0.5 * Math.pow(10, -q.dp) + 1e-9 : 1e-9);
    for (const t of vals) if (Math.abs(v - t) <= tol + 1e-9 * Math.max(1, Math.abs(t))) return { ok: true };
    if (q.dp != null && q.dp > 0) {
      // A whole-number answer to a 1 dp question that is otherwise right
      const r = round(q.value, 0);
      if (v === r && Math.abs(q.value - r) > tol) return { nudge: `Give your answer correct to ${q.dp} decimal place${q.dp > 1 ? "s" : ""}.` };
    }
    return { ok: false };
  };

  /* frac: q.n/q.d exact. q.form "fraction" | "decimal" | "percent" | null (any).
     q.simplest → an unsimplified fraction is a nudge, not a wrong answer. */
  CHECK.frac = (q, raw) => {
    const s = dropGroups(clean(raw).replace(/\s+(?=[/%])|(?<=\/)\s+/g, ""));
    if (!s) return { nudge: "Type your answer." };
    const target = q.n / q.d;
    const isFrac = /^-?\d+\s*\/\s*\d+$/.test(s) || /^-?\d+ \d+\/\d+$/.test(s);
    const isPct = /%$/.test(s);
    const v = parseNumber(s, { allowPercent: true });
    if (isNaN(v)) return { nudge: "Type a fraction like 3/8, a decimal or a percentage." };
    if (!near(v, target, 1e-9)) {
      if (!isPct && !isFrac && v > 1 && near(v / 100, target)) return { nudge: "If you mean a percentage, add the % sign." };
      return { ok: false };
    }
    if (q.form === "fraction" && !isFrac && !(Number.isInteger(target) && /^-?\d+$/.test(s))) return { nudge: "Right value — now write it as a fraction." };
    if (q.form === "decimal" && (isFrac || isPct)) return { nudge: "Right value — now write it as a decimal." };
    if (q.form === "percent" && !isPct) return { nudge: "Right value — now write it as a percentage (with %)." };
    if (isFrac && q.simplest !== false) {
      const m = /(\d+)\s*\/\s*(\d+)$/.exec(s);
      if (m && gcd(Number(m[1]), Number(m[2])) !== 1) return { nudge: "Right — now simplify your fraction fully." };
    }
    return { ok: true };
  };

  /* ratio: q.parts [a,b(,c)]; q.simplest (default true) */
  CHECK.ratio = (q, raw) => {
    const s = dropGroups(clean(raw)).replace(/\bto\b/gi, ":").replace(/\s+/g, "");
    const parts = s.split(":");
    if (parts.length < 2 || parts.some(p => !/^\d*\.?\d+$/.test(p))) return { nudge: `Write a ratio like ${q.parts.map((_, i) => i + 1).join(":")}.` };
    const got = parts.map(Number);
    if (got.length !== q.parts.length) return { ok: false };
    const k = got[0] / q.parts[0];
    const prop = k > 0 && got.every((g, i) => near(g, q.parts[i] * k, 1e-9));
    if (!prop) return { ok: false };
    if (near(k, 1)) return { ok: true };
    if (q.simplest === false) return { ok: true };
    return { nudge: "Equivalent, but not in simplest form yet — divide again." };
  };

  /* pi: answer c + kπ (q.k, q.c default 0). Decimal approximations nudge. */
  function parsePi(raw) {
    let s = clean(raw).toLowerCase().replace(/pi/g, "π").replace(/\s+/g, "").replace(/\*/g, "");
    s = s.replace(/^[a-z]=/, "").replace(/(cm|mm|km|m)(\^?[23])?$/, "");
    if (!s) return null;
    s = s.replace(/\+-|-\+/g, "-").replace(/--/g, "+").replace(/\+\+/g, "+");
    if (!/^[-+]/.test(s)) s = "+" + s;
    const terms = s.match(/[-+][^-+]+/g);
    if (!terms || terms.join("") !== s) return null;
    let c = 0, k = 0;
    for (const t of terms) {
      const sign = t[0] === "-" ? -1 : 1;
      let body = t.slice(1);
      if (body.includes("π")) {
        if ((body.match(/π/g) || []).length > 1) return null;
        let rest = body.replace("π", "");
        let den = 1;
        const dm = /\/(\d*\.?\d+)$/.exec(rest);
        if (dm) { den = Number(dm[1]); rest = rest.slice(0, dm.index); }
        let coef;
        if (rest === "") coef = 1;
        else if (/^\d*\.?\d+$/.test(rest)) coef = Number(rest);
        else if (/^\d+\/\d+$/.test(rest)) { const [a, b] = rest.split("/").map(Number); coef = a / b; }
        else return null;
        k += sign * coef / den;
      } else {
        if (/^\d*\.?\d+$/.test(body)) c += sign * Number(body);
        else if (/^\d+\/\d+$/.test(body)) { const [a, b] = body.split("/").map(Number); c += sign * a / b; }
        else return null;
      }
    }
    return { c, k, hasPi: s.includes("π") };
  }
  CHECK.pi = (q, raw) => {
    const p = parsePi(raw);
    const want = { c: q.c || 0, k: q.k };
    if (!p) return { nudge: "Type your answer using π, like 12π (press the π key)." };
    if (!p.hasPi) {
      const v = p.c, exact = want.c + want.k * Math.PI;
      if (Math.abs(v - exact) <= Math.max(0.06, Math.abs(exact) * 0.002)) return { nudge: "That is the decimal value — leave your answer in terms of π." };
      return { ok: false };
    }
    return { ok: near(p.c, want.c, 1e-9) && near(p.k, want.k, 1e-9) };
  };

  /* mono: products of powers. q.factors {base: exp} where a base is a
     letter or a number; q.coef (default 1). q.kind:
       "prime"   prime factorisation: every base must be prime; q.indexForm
                 → each prime written once with an index.
       "power"   index laws with a numeric base: the answer must be one power.
       "alg"     algebraic term: coefficient × letters with indices.
     The letter x is never used as a pronumeral in these banks, so an x
     between factors is read as a times sign. */
  function parseMono(raw) {
    let s = clean(raw).replace(/\s*([*x])\s*/gi, "*").replace(/\s+/g, "*");
    s = s.replace(/^[a-wyz]=\s*/i, "");
    if (!s) return null;
    const re = /(\d+|[a-wyz])(?:\^\(?(\d+)\)?)?|\*/gi;
    let m, pos = 0; const out = []; let star = true;
    while ((m = re.exec(s))) {
      if (m.index !== pos) return null;
      pos = re.lastIndex;
      if (m[0] === "*") { if (star) return null; star = true; continue; }
      out.push({ base: m[1], exp: m[2] == null ? 1 : Number(m[2]), explicit: m[2] != null });
      star = false;
    }
    if (pos !== s.length || star) return null;
    return out;
  }
  function isPrime(n) { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
  CHECK.mono = (q, raw) => {
    const toks = parseMono(raw);
    if (!toks) return { nudge: q.kind === "alg" ? "Type a term like 6a^5 (use ^ for the index)." : "Type something like 2^3 × 5 (use ^ for an index)." };
    const want = q.factors;
    if (q.kind === "alg") {
      let coef = 1; const map = {};
      for (const t of toks) {
        if (/\d/.test(t.base)) coef *= Math.pow(Number(t.base), t.exp);
        else map[t.base] = (map[t.base] || 0) + t.exp;
      }
      const wc = q.coef == null ? 1 : q.coef;
      const keys = new Set(Object.keys(map).concat(Object.keys(want)));
      const same = coef === wc && [...keys].every(k => (map[k] || 0) === (want[k] || 0));
      if (same) {
        const seen = {}; let dup = false;
        toks.forEach(t => { if (!/\d/.test(t.base)) { if (seen[t.base]) dup = true; seen[t.base] = 1; } });
        if (dup) return { nudge: "Right — now collect each pronumeral into one power." };
        return { ok: true };
      }
      return { ok: false };
    }
    // numeric bases
    const map = {}; const count = {};
    for (const t of toks) {
      if (!/^\d+$/.test(t.base)) return { ok: false };
      const b = Number(t.base);
      if (b === 1) continue;
      map[b] = (map[b] || 0) + t.exp; count[b] = (count[b] || 0) + 1;
    }
    const valueOf = m => Object.entries(m).reduce((v, [b, e]) => v * Math.pow(Number(b), e), 1);
    const keys = new Set(Object.keys(map).concat(Object.keys(want)));
    const same = [...keys].every(k => (map[k] || 0) === (want[k] || 0));
    const wantVal = valueOf(want);
    if (q.kind === "prime") {
      if (same) {
        if (q.indexForm && Object.values(count).some(c => c > 1)) return { nudge: "Right primes — now write it using index notation (2^3, not 2 × 2 × 2)." };
        return { ok: true };
      }
      if (near(valueOf(map), wantVal)) {
        const bad = Object.keys(map).find(b => !isPrime(Number(b)));
        if (bad) return { nudge: `${bad} is not prime — keep breaking it down.` };
      }
      return { ok: false };
    }
    // power: must be one power of the right base
    if (same && Object.keys(map).length === Object.keys(want).length) {
      if (Object.values(count).some(c => c > 1)) return { nudge: "Right — now write it as a single power." };
      return { ok: true };
    }
    if (toks.length === 1 && !toks[0].explicit && Number(toks[0].base) === wantVal) return { nudge: "That is its value — the question wants it in index form, like 3^7." };
    return { ok: false };
  };

  /* coord: "(3, -2)" */
  function parseCoord(raw) {
    const s = clean(raw).replace(/\s+/g, " ").trim();
    const m = /^\(?\s*(-?\d*\.?\d+)\s*[, ;]\s*(-?\d*\.?\d+)\s*\)?$/.exec(s);
    return m ? [Number(m[1]), Number(m[2])] : null;
  }
  CHECK.coord = (q, raw) => {
    const p = parseCoord(raw);
    if (!p) return { nudge: "Write the point like (3, −2)." };
    if (near(p[0], q.y) && near(p[1], q.x) && !near(q.x, q.y)) return { ok: false, swapped: true };
    return { ok: near(p[0], q.x) && near(p[1], q.y) };
  };
  CHECK.plot = (q, pt) => {
    if (!pt) return { nudge: "Click the grid to place your point first." };
    return { ok: near(pt[0], q.x) && near(pt[1], q.y) };
  };

  /* linear: y = mx + b. q.m, q.b, q.dep (default "y"), q.ind (default "x"). */
  function parseLinear(raw, dep = "y", ind = "x") {
    let s = clean(raw).replace(/\s+/g, "").replace(/\*/g, "");
    if (!s) return null;
    const sides = s.split("=");
    if (sides.length > 2) return null;
    if (sides.length === 2) {
      if (sides[0].toLowerCase() === dep.toLowerCase()) s = sides[1];
      else if (sides[1].toLowerCase() === dep.toLowerCase()) s = sides[0];
      else return null;
    }
    s = s.replace(/\+-|-\+/g, "-").replace(/--/g, "+").replace(/\+\+/g, "+");
    if (!/^[-+]/.test(s)) s = "+" + s;
    const terms = s.match(/[-+][^-+]+/g);
    if (!terms || terms.join("") !== s) return null;
    let m = 0, b = 0;
    const numOf = t => { if (t === "") return 1; if (/^\d*\.?\d+$/.test(t)) return Number(t); const f = /^(\d+)\/(\d+)$/.exec(t); return f ? Number(f[1]) / Number(f[2]) : NaN; };
    for (const t of terms) {
      const sign = t[0] === "-" ? -1 : 1, body = t.slice(1);
      const i = body.toLowerCase().indexOf(ind.toLowerCase());
      if (i >= 0) {
        if (body.toLowerCase().split(ind.toLowerCase()).length > 2) return null;
        let before = body.slice(0, i), after = body.slice(i + 1);
        let coef = numOf(before);
        if (after) { const d = /^\/(\d*\.?\d+)$/.exec(after); if (!d) return null; coef /= Number(d[1]); }
        if (isNaN(coef)) return null;
        m += sign * coef;
      } else {
        const v = numOf(body);
        if (isNaN(v) || body === "") return null;
        b += sign * v;
      }
    }
    return { m, b };
  }
  CHECK.linear = (q, raw) => {
    const p = parseLinear(raw, q.dep || "y", q.ind || "x");
    if (!p) return { nudge: `Write a rule like ${q.dep || "y"} = 2${q.ind || "x"} + 3.` };
    return { ok: near(p.m, q.m) && near(p.b, q.b) };
  };

  CHECK.mc = (q, idx) => (idx == null ? { nudge: "Choose an answer." } : { ok: idx === q.correct });
  CHECK.tf = (q, v) => (v == null ? { nudge: "Choose True or False." } : { ok: v === q.truth });

  /* Distance to push a side label off its side (geometry engine sideLabels
     `offset`): far enough that the text clears the line however it leans. */
  function labelOffset(p, q, text, base = 20) {
    const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1;
    const nx = Math.abs(dy / len), ny = Math.abs(dx / len);
    return Math.round(base + nx * String(text).length * 5.2 + ny * 2);
  }

  function check(q, input) {
    const f = CHECK[q.mode];
    if (!f) throw new Error("Unknown answer mode " + q.mode);
    return f(q, input);
  }

  root.MMTQCore = {
    ri, pick, shuffle, sample, chance, gcd, lcm, round, isPrime,
    fmt, money, money2, sup, frac, fracText, esc, prettyPowers, MINUS,
    clean, parseNumber, labelOffset, parsePi, parseMono, parseCoord, parseLinear,
    check, CHECK
  };
})(typeof window !== "undefined" ? window : globalThis);
