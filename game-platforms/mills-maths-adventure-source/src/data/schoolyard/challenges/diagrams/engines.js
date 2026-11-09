/**
 * Playground diagram engines — one shared loader.
 *
 * Each `*-engine.js` beside this file is the Revision Generator's own engine,
 * copied verbatim. It's a plain side-effect script that puts itself on the
 * window as `MMT_<NAME>_ENGINE` (e.g. `MMT_RATES_ENGINE`), so we import them
 * for the side effect only and then look them up by name through `getEngine`.
 * The lookup mirrors `engineFor` in the website's `topic-quiz/engine.js`.
 *
 * To add another engine: drop the file next to this one, add it to `ENGINES`
 * below. Everything else resolves by name.
 */
import "./rates-engine.js";
import "./pythagoras-engine.js";
import "./geometry-engine.js";
import "./area-engine.js";
import "./volume-engine.js";
import "./length-engine.js";
import "./linear-engine.js";
import "./statistics-engine.js";
import "./probability-engine.js";
import "./plane-engine.js";
import "./manipulatives-engine.js";
import "./measure-engine.js";
import "./grid-engine.js";
import "./solids-engine.js";
import "./angle-engine.js";
import "./integer-engine.js";
import "./fdp-engine.js";
import "./algebra-engine.js";
import "./equation-engine.js";
import C from "../questionCore.js";

export const ENGINES = [
  "rates-engine", "pythagoras-engine", "geometry-engine", "area-engine",
  "volume-engine", "length-engine", "linear-engine", "statistics-engine",
  "probability-engine", "plane-engine", "manipulatives-engine", "measure-engine",
  "grid-engine", "solids-engine", "angle-engine",
  "integer-engine", "fdp-engine", "algebra-engine", "equation-engine",
];

/** Look up an engine by its name (matches the `engine:` key in a bank diagram). */
export function getEngine(name) {
  if (typeof window === "undefined") return null;
  const key = "MMT_" + String(name).replace(/-engine$/, "").toUpperCase().replace(/-/g, "_") + "_ENGINE";
  return window[key] || null;
}

/* ======================= Cartesian plane ===========================
   Copied from the website's topic-quiz/engine.js `grid()` so a bank's
   `{ grid:{…} }` diagram and a `mode:"plot"` question look and behave the
   same in the game as on the site.
   opts: xMin,xMax,yMin,yMax, cell (px), points:[{x,y,label,color}],
   lines:[{m,b,color,label}], interactive, onPick(x,y) */
export function grid(o) {
  const NS = "http://www.w3.org/2000/svg";
  const xMin = o.xMin ?? -6, xMax = o.xMax ?? 6, yMin = o.yMin ?? -6, yMax = o.yMax ?? 6;
  const cell = o.cell || 34, pad = 26;
  const W = (xMax - xMin) * cell + pad * 2, H = (yMax - yMin) * cell + pad * 2;
  const X = (x) => pad + (x - xMin) * cell, Y = (y) => pad + (yMax - y) * cell;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("class", "qgrid" + (o.interactive ? " pick" : ""));
  svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "Cartesian plane");
  const el = (n, a, txt) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; };
  for (let x = xMin; x <= xMax; x++) el("line", { x1: X(x), y1: Y(yMin), x2: X(x), y2: Y(yMax), class: "gl" });
  for (let y = yMin; y <= yMax; y++) el("line", { x1: X(xMin), y1: Y(y), x2: X(xMax), y2: Y(y), class: "gl" });
  if (yMin <= 0 && yMax >= 0) el("line", { x1: X(xMin) - 6, y1: Y(0), x2: X(xMax) + 10, y2: Y(0), class: "ax" });
  if (xMin <= 0 && xMax >= 0) el("line", { x1: X(0), y1: Y(yMin) + 6, x2: X(0), y2: Y(yMax) - 10, class: "ax" });
  if (yMin <= 0 && yMax >= 0) { el("path", { d: `M${X(xMax) + 14},${Y(0)} l-10,-5 v10 z`, class: "axh" }); el("text", { x: X(xMax) + 12, y: Y(0) - 10, class: "axl" }, "x"); }
  if (xMin <= 0 && xMax >= 0) { el("path", { d: `M${X(0)},${Y(yMax) - 14} l-5,10 h10 z`, class: "axh" }); el("text", { x: X(0) + 12, y: Y(yMax) - 8, class: "axl" }, "y"); }
  const ox = xMin <= 0 && xMax >= 0 ? X(0) : X(xMin), oy = yMin <= 0 && yMax >= 0 ? Y(0) : Y(yMin);
  const step = o.labelStep || 1;
  for (let x = xMin; x <= xMax; x += step) if (x !== 0) el("text", { x: X(x), y: oy + 15, class: "tk", "text-anchor": "middle" }, C.fmt(x));
  for (let y = yMin; y <= yMax; y += step) if (y !== 0) el("text", { x: ox - 7, y: Y(y) + 4, class: "tk", "text-anchor": "end" }, C.fmt(y));
  if (xMin <= 0 && xMax >= 0 && yMin <= 0 && yMax >= 0) el("text", { x: X(0) - 7, y: Y(0) + 15, class: "tk", "text-anchor": "end" }, "0");
  const placed = [], cross = [];
  (o.lines || []).forEach((L, i) => (o.lines || []).slice(i + 1).forEach((M2) => { if (L.m !== M2.m) { const x = (M2.b - L.b) / (L.m - M2.m); cross.push([X(x), Y(L.m * x + L.b)]); } }));
  (o.lines || []).forEach((L) => {
    const pts = [];
    const add = (x, y) => { if (x >= xMin - 1e-9 && x <= xMax + 1e-9 && y >= yMin - 1e-9 && y <= yMax + 1e-9) pts.push([x, y]); };
    add(xMin, L.m * xMin + L.b); add(xMax, L.m * xMax + L.b);
    if (L.m !== 0) { add((yMin - L.b) / L.m, yMin); add((yMax - L.b) / L.m, yMax); }
    pts.sort((a, b) => a[0] - b[0]);
    if (pts.length >= 2) {
      const a = pts[0], b = pts[pts.length - 1];
      el("line", { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), class: "ln", stroke: L.color || "#be123c" });
      if (L.label) {
        let best = null, bestD = -1;
        [0.85, 0.72, 0.15, 0.28, 0.5].forEach((t) => {
          const px = X(a[0] + (b[0] - a[0]) * t), py = Y(a[1] + (b[1] - a[1]) * t);
          const d = Math.min(1e9, ...placed.concat(cross).map((q) => Math.hypot(q[0] - px, q[1] - py)));
          if (d > bestD + 0.5) { bestD = d; best = [px, py]; }
        });
        placed.push(best);
        let dx = X(b[0]) - X(a[0]), dy = Y(b[1]) - Y(a[1]); const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
        let nx = -dy, ny = dx; if (ny > 0) { nx = -nx; ny = -ny; }
        const anchor = Math.abs(nx) < 0.35 ? "middle" : nx > 0 ? "start" : "end";
        const tx = el("text", { x: best[0] + nx * 12, y: best[1] + ny * 12 + (ny > -0.5 ? 5 : 0), class: "lnl", fill: L.color || "#be123c", "text-anchor": anchor }, L.label);
        tx.setAttribute("paint-order", "stroke");
      }
    }
  });
  (o.points || []).forEach((p) => {
    el("circle", { cx: X(p.x), cy: Y(p.y), r: 6.5, class: "pt", fill: p.color || "#1d4ed8" });
    if (p.label) { const t = el("text", { x: X(p.x) + 9, y: Y(p.y) - 9, class: "ptl" }, p.label); t.setAttribute("paint-order", "stroke"); }
  });
  if (o.interactive) {
    const ghost = el("circle", { r: 7, class: "ghost", cx: -50, cy: -50 });
    const mine = el("circle", { r: 8, class: "mine", cx: -50, cy: -50 });
    const toLattice = (ev) => {
      const r = svg.getBoundingClientRect();
      const sx = (ev.clientX - r.left) * W / r.width, sy = (ev.clientY - r.top) * H / r.height;
      const x = Math.round(xMin + (sx - pad) / cell), y = Math.round(yMax - (sy - pad) / cell);
      if (x < xMin || x > xMax || y < yMin || y > yMax) return null;
      return [x, y];
    };
    svg.addEventListener("pointermove", (ev) => { if (svg.classList.contains("locked")) return; const p = toLattice(ev); if (p) { ghost.setAttribute("cx", X(p[0])); ghost.setAttribute("cy", Y(p[1])); } });
    svg.addEventListener("pointerleave", () => { ghost.setAttribute("cx", -50); });
    svg.addEventListener("click", (ev) => {
      if (svg.classList.contains("locked")) return;
      const p = toLattice(ev); if (!p) return;
      mine.setAttribute("cx", X(p[0])); mine.setAttribute("cy", Y(p[1]));
      o.onPick && o.onPick(p[0], p[1]);
    });
    svg.markAnswer = (pt, ok, truth) => {
      svg.classList.add("locked"); ghost.setAttribute("cx", -50);
      if (pt) { mine.setAttribute("cx", X(pt[0])); mine.setAttribute("cy", Y(pt[1])); mine.setAttribute("class", "mine " + (ok ? "good" : "bad")); }
      if (!ok && truth) el("circle", { cx: X(truth[0]), cy: Y(truth[1]), r: 9, class: "truth" });
    };
    svg.setPoint = (pt) => { if (pt) { mine.setAttribute("cx", X(pt[0])); mine.setAttribute("cy", Y(pt[1])); } };
  }
  return svg;
}

/**
 * Render a diagram into `host` exactly as the website's whole-topic quizzes
 * do: `{html}` is inserted as is, `{grid}` draws a Cartesian plane, and an
 * `{engine, config}` diagram is rendered and then TRIMMED to its ink and
 * drawn at natural size × `scale`, so labels are the same size question to
 * question. Returns true on success.
 */
export function drawDiagram(host, d) {
  if (!host) return false;
  host.innerHTML = "";
  if (!d) return false;
  if (d.html) { host.innerHTML = d.html; return true; }
  if (d.grid) { host.appendChild(grid(d.grid)); return true; }
  const E = getEngine(d.engine);
  if (!E || typeof E.render !== "function") { host.innerHTML = `<div class="diagMissing">Diagram unavailable</div>`; return false; }
  const holder = document.createElement("div"); holder.className = "engHolder";
  host.appendChild(holder);
  try { E.render(holder, d.config || {}); }
  catch (e) { if (typeof console !== "undefined") console.warn("[playground diagram]", d.engine, e); holder.innerHTML = `<div class="diagMissing">Diagram unavailable</div>`; return false; }
  holder.querySelectorAll("svg").forEach((svg) => {
    if (svg.parentElement && svg.parentElement.closest("svg")) return;
    try {
      const bb = svg.getBBox();
      if (bb.width > 4 && bb.height > 4) {
        const p = 10;
        svg.setAttribute("viewBox", `${bb.x - p} ${bb.y - p} ${bb.width + 2 * p} ${bb.height + 2 * p}`);
        svg.removeAttribute("width"); svg.removeAttribute("height");
        const k = d.scale || 1.15;
        svg.style.width = Math.round((bb.width + 2 * p) * k) + "px";
        svg.style.maxWidth = "100%"; svg.style.height = "auto";
        if (d.maxH) svg.style.maxHeight = d.maxH + "px";
      }
    } catch (e) { /* not laid out yet; leave it */ }
  });
  return true;
}
