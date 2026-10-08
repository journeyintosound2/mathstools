/**
 * FRACTION FARM — materials + procedural canvas textures (no image files).
 * The foliage / water materials and the shared clock come from the jungle's
 * kit (jungleMaterials.js) so wind + water animate the same way; this adds
 * the farm's own ground shader, farm-track ruts, timber, corrugated iron,
 * weatherboards, chicken wire and painted signs.
 */
import * as THREE from "three";
import { JNOISE } from "../jungle/jungleMaterials.js";

// ---------------------------------------------------------------------------
// TERRAIN — vertex-coloured pasture + a world-space shader that mottles the
// grass, adds soft MOWN STRIPES in the paddocks' grass, and turns steep cut
// banks into crumbly earth.
// ---------------------------------------------------------------------------
export function makeFarmTerrainMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vFW;\nvarying vec3 vFN;")
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvFW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvFN = normalize(mat3(modelMatrix) * objectNormal);"
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vFW;\nvarying vec3 vFN;\n${JNOISE}`)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        {
          vec3 wp = vFW;
          float steep = 1.0 - clamp(vFN.y, 0.0, 1.0);
          // Turf: two scales of mottling + a fine speckle.
          float m1 = jf2(wp.xz * 0.09);
          float m2 = jn2(wp.xz * 0.85);
          float m3 = jn2(wp.xz * 3.1);
          diffuseColor.rgb *= 0.87 + 0.18 * m1 + 0.07 * (m2 - 0.5) + 0.05 * (m3 - 0.5);
          // Clover / buttercup flecks in the green.
          float fleck = smoothstep(0.82, 0.9, jn2(wp.xz * 1.7 + 9.0));
          float greenish = smoothstep(0.02, 0.12, diffuseColor.g - diffuseColor.r);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.12, 1.1, 0.78), fleck * greenish * 0.45);
          // Cut banks: crumbly earth with a little grass hanging on.
          float earth = smoothstep(0.42, 0.62, steep);
          vec3 soil = mix(vec3(0.42, 0.31, 0.2), vec3(0.55, 0.42, 0.28), jn2(wp.xz * 0.7 + wp.y));
          soil *= 0.85 + 0.25 * jn2(vec2(wp.x + wp.z, wp.y * 3.0));
          diffuseColor.rgb = mix(diffuseColor.rgb, soil, earth * (0.75 - 0.35 * jn2(wp.xz * 1.3)));
        }`
      );
  };
  m.customProgramCacheKey = () => "farm-terrain-v1";
  return m;
}

// ---------------------------------------------------------------------------
// Canvas textures.
// ---------------------------------------------------------------------------
function canvasTex(w, h, draw, { repeat = false, srgb = true, aniso = 4 } = {}) {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const g = cv.getContext("2d");
  draw(g, w, h);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  return t;
}
function prand(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/** A two-wheel farm track: two worn ruts, a grassy middle strip and verges (u across, v along). */
function drawTrack(g, w, h) {
  const r = prand(31);
  g.fillStyle = "#a07d52"; g.fillRect(0, 0, w, h);
  // Grainy dirt.
  for (let i = 0; i < 2600; i++) {
    const x = r() * w, y = r() * h, s = 1 + r() * 2.5;
    g.fillStyle = r() < 0.5 ? "rgba(70,48,28,0.22)" : "rgba(205,175,125,0.22)";
    g.fillRect(x, y, s, s);
  }
  // The two ruts: smoother, darker, packed.
  for (const cx of [0.3, 0.7]) {
    const grd = g.createLinearGradient(w * (cx - 0.12), 0, w * (cx + 0.12), 0);
    grd.addColorStop(0, "rgba(90,62,38,0)");
    grd.addColorStop(0.5, "rgba(90,62,38,0.42)");
    grd.addColorStop(1, "rgba(90,62,38,0)");
    g.fillStyle = grd;
    g.fillRect(w * (cx - 0.12), 0, w * 0.24, h);
    // Tyre-tread streaks along the rut.
    for (let k = 0; k < 40; k++) {
      const x = w * (cx + (r() - 0.5) * 0.12);
      g.strokeStyle = `rgba(60,40,24,${0.08 + r() * 0.12})`;
      g.lineWidth = 1 + r() * 1.5;
      g.beginPath(); g.moveTo(x, r() * h); g.lineTo(x + (r() - 0.5) * 3, r() * h); g.stroke();
    }
  }
  // Pebbles.
  for (let i = 0; i < 60; i++) {
    const x = r() * w, y = r() * h, rr = 1.5 + r() * 3.5;
    g.beginPath(); g.ellipse(x, y, rr, rr * 0.75, r() * 3, 0, Math.PI * 2);
    g.fillStyle = ["#b8a68c", "#9d8e78", "#c9b89c", "#8a7c68"][Math.floor(r() * 4)];
    g.fill();
  }
  // Grass: the middle strip + both verges, tufty.
  const tuft = (x, y, len, a) => {
    g.strokeStyle = `rgba(${70 + r() * 50},${120 + r() * 55},${40 + r() * 25},${a})`;
    g.lineWidth = 1.2 + r() * 1.4;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * len * 0.6, y - len); g.stroke();
  };
  for (let y = 0; y < h; y += 1.5) {
    // Middle strip (patchy).
    if (Math.sin(y * 0.05) + r() * 0.8 > 0.1) for (let k = 0; k < 2; k++) tuft(w * (0.5 + (r() - 0.5) * 0.12), y, 6 + r() * 8, 0.85);
    // Verges.
    for (const side of [0, 1]) {
      const n = 3;
      for (let k = 0; k < n; k++) {
        const x = side ? w * (1 - r() * r() * 0.14) : w * (r() * r() * 0.14);
        tuft(x, y, 7 + r() * 9, 0.9);
      }
    }
  }
}
/** Weathered timber boards (vertical), u across. */
function drawBoards(g, w, h, { base = [150, 104, 64], boards = 8, seed = 5, gap = "rgba(40,24,12,0.7)" } = {}) {
  const r = prand(seed);
  g.fillStyle = gap; g.fillRect(0, 0, w, h);
  for (let i = 0; i < boards; i++) {
    const x0 = (i / boards) * w;
    const v = 0.82 + r() * 0.32;
    g.fillStyle = `rgb(${Math.round(base[0] * v)},${Math.round(base[1] * v)},${Math.round(base[2] * v)})`;
    g.fillRect(x0 + 1.5, 0, w / boards - 3, h);
    for (let k = 0; k < 6; k++) {
      g.strokeStyle = `rgba(60,36,18,${0.12 + r() * 0.15})`;
      g.lineWidth = 1;
      const x = x0 + 4 + r() * (w / boards - 8);
      g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 3, h * 0.3, x - 3, h * 0.7, x + 1, h); g.stroke();
    }
    // Knots.
    if (r() < 0.6) { g.fillStyle = "rgba(70,40,20,0.5)"; g.beginPath(); g.ellipse(x0 + w / boards / 2, r() * h, 3, 5, 0, 0, 6.3); g.fill(); }
  }
}
/** Horizontal weatherboards (the farmhouse), painted. */
function drawWeatherboard(g, w, h, { base = "#f3ead6", line = "rgba(120,100,70,0.45)", boards = 12 } = {}) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < boards; i++) {
    const y = (i / boards) * h;
    const grd = g.createLinearGradient(0, y, 0, y + h / boards);
    grd.addColorStop(0, "rgba(255,255,255,0.18)");
    grd.addColorStop(0.85, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.22)");
    g.fillStyle = grd; g.fillRect(0, y, w, h / boards);
    g.strokeStyle = line; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, y + h / boards - 1); g.lineTo(w, y + h / boards - 1); g.stroke();
  }
}
/** Corrugated iron (vertical ribs), optionally rusty. */
function drawCorrugated(g, w, h, { base = [176, 182, 184], rust = 0.25, seed = 9 } = {}) {
  const r = prand(seed);
  const ribs = 16;
  for (let x = 0; x < w; x++) {
    const ph = Math.sin((x / w) * ribs * Math.PI * 2);
    const v = 0.78 + 0.22 * ph;
    g.fillStyle = `rgb(${Math.round(base[0] * v)},${Math.round(base[1] * v)},${Math.round(base[2] * v)})`;
    g.fillRect(x, 0, 1, h);
  }
  for (let i = 0; i < 90 * rust; i++) {
    const x = r() * w, y = r() * h;
    const grd = g.createRadialGradient(x, y, 0, x, y, 6 + r() * 18);
    grd.addColorStop(0, "rgba(150,74,30,0.55)");
    grd.addColorStop(1, "rgba(150,74,30,0)");
    g.fillStyle = grd; g.fillRect(x - 30, y - 30, 60, 60);
  }
  // Streaks down from the nail lines.
  for (let i = 0; i < 30; i++) {
    g.strokeStyle = `rgba(110,60,30,${0.05 + r() * 0.1 * rust * 3})`;
    const x = r() * w;
    g.beginPath(); g.moveTo(x, r() * h * 0.2); g.lineTo(x, h * (0.4 + r() * 0.6)); g.stroke();
  }
}
/** Chicken wire (hex mesh), alpha cut-out (white = wire). */
function drawWire(g, w, h) {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = "#ffffff"; g.lineWidth = 2.2;
  const s = 16;
  for (let y = 0; y < h + s; y += s) {
    for (let x = 0; x < w + s; x += s) {
      const o = (Math.floor(y / s) % 2) * (s / 2);
      g.beginPath();
      g.moveTo(x + o, y); g.lineTo(x + o + s / 2, y + s / 2); g.lineTo(x + o + s, y);
      g.stroke();
      g.beginPath(); g.moveTo(x + o + s / 2, y + s / 2); g.lineTo(x + o + s / 2, y + s); g.stroke();
    }
  }
}
/** Red barn boards with white trim lines (u across). */
function drawBarnBoards(g, w, h) {
  drawBoards(g, w, h, { base: [176, 56, 40], boards: 10, seed: 13, gap: "rgba(70,18,10,0.85)" });
}
/** Roof tiles / shingles (terracotta). */
function drawShingles(g, w, h, { base = [168, 74, 52], seed = 21 } = {}) {
  const r = prand(seed);
  const rows = 10, cols = 8;
  g.fillStyle = "#4a2418"; g.fillRect(0, 0, w, h);
  for (let j = 0; j < rows; j++) {
    for (let i = -1; i < cols; i++) {
      const x = (i + (j % 2) * 0.5) * (w / cols), y = j * (h / rows);
      const v = 0.8 + r() * 0.35;
      g.fillStyle = `rgb(${Math.round(base[0] * v)},${Math.round(base[1] * v)},${Math.round(base[2] * v)})`;
      g.beginPath();
      g.roundRect ? g.roundRect(x + 1, y + 1, w / cols - 2, h / rows + 3, [0, 0, 6, 6]) : g.rect(x + 1, y + 1, w / cols - 2, h / rows + 3);
      g.fill();
    }
  }
}
/** Hay: golden straw strands. */
function drawStraw(g, w, h) {
  const r = prand(17);
  g.fillStyle = "#d9b45a"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const x = r() * w, y = r() * h;
    g.strokeStyle = `rgba(${170 + r() * 70},${130 + r() * 60},${40 + r() * 40},0.7)`;
    g.lineWidth = 1 + r();
    const a = (r() - 0.5) * 0.7;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); g.stroke();
  }
}
/** Stone wall face (dry-stone: irregular flat stones). */
function drawDryStone(g, w, h) {
  const r = prand(41);
  g.fillStyle = "#4e4a40"; g.fillRect(0, 0, w, h);
  let y = 0;
  while (y < h) {
    const rh = 10 + r() * 12;
    let x = -r() * 20;
    while (x < w) {
      const sw = 18 + r() * 34;
      const v = 0.75 + r() * 0.4;
      g.fillStyle = `rgb(${Math.round(150 * v)},${Math.round(144 * v)},${Math.round(128 * v)})`;
      g.beginPath();
      g.ellipse(x + sw / 2, y + rh / 2, sw / 2 - 1.5, rh / 2 - 1.5, (r() - 0.5) * 0.2, 0, Math.PI * 2);
      g.fill();
      if (r() < 0.35) { g.fillStyle = "rgba(90,130,60,0.5)"; g.beginPath(); g.ellipse(x + sw / 2, y + 3, sw / 3, 3, 0, 0, 6.3); g.fill(); }
      x += sw;
    }
    y += rh;
  }
}

/** Wheat stalks + bearded ears (white alpha shape; colour from vertex colours). */
function drawWheat(g, w, h) {
  const r = prand(53);
  g.clearRect(0, 0, w, h);
  g.fillStyle = "#ffffff"; g.strokeStyle = "#ffffff";
  for (let i = 0; i < 26; i++) {
    const x0 = w * (0.06 + r() * 0.88);
    const top = h * (0.04 + r() * 0.16);
    const bend = (r() - 0.5) * w * 0.1;
    g.lineWidth = 2.2 + r() * 1.2;
    g.beginPath(); g.moveTo(x0, h); g.quadraticCurveTo(x0 + bend * 0.3, (h + top) / 2, x0 + bend, top + h * 0.12); g.stroke();
    // The ear: stacked grains + whiskers.
    const ex = x0 + bend, ey = top;
    for (let k = 0; k < 7; k++) {
      const y = ey + k * h * 0.017;
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(ex + s * 3, y, 3.4, 5.2, s * 0.4, 0, Math.PI * 2); g.fill(); }
    }
    g.lineWidth = 0.9;
    for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(ex + (r() - 0.5) * 6, ey + k * 3); g.lineTo(ex + (r() - 0.5) * 22, ey - 18 - r() * 14); g.stroke(); }
    // A leaf.
    if (r() < 0.6) { g.lineWidth = 3; g.beginPath(); const ly = h * (0.55 + r() * 0.3); g.moveTo(x0, ly); g.quadraticCurveTo(x0 + (r() < 0.5 ? -1 : 1) * 22, ly - 20, x0 + (r() < 0.5 ? -1 : 1) * 30, ly + 4); g.stroke(); }
  }
}

let _tex = null;
export function getFarmTextures() {
  if (_tex) return _tex;
  _tex = {
    track: canvasTex(256, 512, drawTrack, { repeat: true, aniso: 8 }),
    boards: canvasTex(256, 256, (g, w, h) => drawBoards(g, w, h), { repeat: true }),
    greyBoards: canvasTex(256, 256, (g, w, h) => drawBoards(g, w, h, { base: [150, 140, 124], seed: 8 }), { repeat: true }),
    barn: canvasTex(256, 256, drawBarnBoards, { repeat: true }),
    weatherboard: canvasTex(256, 256, (g, w, h) => drawWeatherboard(g, w, h), { repeat: true }),
    creamboard: canvasTex(256, 256, (g, w, h) => drawWeatherboard(g, w, h, { base: "#efe2c2" }), { repeat: true }),
    iron: canvasTex(256, 256, (g, w, h) => drawCorrugated(g, w, h), { repeat: true }),
    rustyIron: canvasTex(256, 256, (g, w, h) => drawCorrugated(g, w, h, { rust: 0.9, seed: 3 }), { repeat: true }),
    redIron: canvasTex(256, 256, (g, w, h) => drawCorrugated(g, w, h, { base: [150, 52, 40], rust: 0.15, seed: 4 }), { repeat: true }),
    greenIron: canvasTex(256, 256, (g, w, h) => drawCorrugated(g, w, h, { base: [70, 112, 82], rust: 0.1, seed: 6 }), { repeat: true }),
    wire: canvasTex(128, 128, drawWire, { repeat: true }),
    shingles: canvasTex(256, 256, (g, w, h) => drawShingles(g, w, h), { repeat: true }),
    straw: canvasTex(256, 256, drawStraw, { repeat: true }),
    drystone: canvasTex(256, 128, drawDryStone, { repeat: true }),
    wheat: canvasTex(256, 256, drawWheat, { aniso: 4 }),
  };
  return _tex;
}

/** A painted-timber sign texture with text (one or two lines). */
export function signTexture(lines, { w = 512, h = 160, bg = "#7a4f2c", fg = "#fff4dc", border = "#4f321b", font = "bold 60px Georgia, serif", sub = "bold 36px Georgia, serif", icon = "" } = {}) {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const g = cv.getContext("2d");
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  const r = prand(w + h);
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(50,28,12,${0.08 + r() * 0.12})`;
    g.lineWidth = 1 + r() * 2;
    const y = r() * h;
    g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 5, w * 0.6, y - 5, w, y + 2); g.stroke();
  }
  g.strokeStyle = border; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  g.textAlign = "center"; g.textBaseline = "middle";
  const L = Array.isArray(lines) ? lines : [lines];
  const text = (t, y, f) => {
    g.font = f;
    g.fillStyle = "rgba(30,16,6,0.5)"; g.fillText(t, w / 2 + 3, y + 3);
    g.fillStyle = fg; g.fillText(t, w / 2, y);
  };
  if (L.length === 1) text((icon ? `${icon} ` : "") + L[0], h / 2 + 2, font);
  else { text((icon ? `${icon} ` : "") + L[0], h * 0.38, font); text(L[1], h * 0.74, sub); }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A tiny flat-colour material cache (so hundreds of set-piece meshes share). */
const _mats = new Map();
export function flatMat(color, { roughness = 0.85, metalness = 0, map = null, emissive = null, side = THREE.FrontSide, transparent = false, opacity = 1, alphaTest = 0, alphaMap = null, flat = false } = {}) {
  const k = [color, roughness, metalness, map && map.uuid, emissive, side, transparent, opacity, alphaTest, alphaMap && alphaMap.uuid, flat].join("|");
  if (_mats.has(k)) return _mats.get(k);
  const m = new THREE.MeshStandardMaterial({
    color, roughness, metalness, map, side, transparent, opacity, alphaTest, alphaMap, flatShading: flat,
    emissive: emissive ? new THREE.Color(emissive) : new THREE.Color(0, 0, 0), emissiveIntensity: emissive ? 0.6 : 0,
  });
  _mats.set(k, m);
  return m;
}
