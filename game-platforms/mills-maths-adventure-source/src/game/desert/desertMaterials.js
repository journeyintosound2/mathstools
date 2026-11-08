import * as THREE from "three";

import { JNOISE, jungleClock } from "../jungle/jungleMaterials.js";

/**
 * SUNSTONE DESERT — MATERIALS + procedural canvas TEXTURES (2026-11-08).
 *   sand terrain: wind ripples across the open sand, fine grain, warm
 *     sparkles that glint as the camera moves, and LAYERED SANDSTONE on every
 *     steep face (cream / ochre / rust / red bands with ledges, like the
 *     canyon walls of Lanayru + Gobi's Valley)
 *   quicksand: a slowly turning swirl of wet, dark sand with popping bubbles
 *   oasis water: clear turquoise, rippling, a bright sheen + foam at the edge
 *   crystal: glassy, tinted, glowing faintly from inside
 * All textures are drawn on canvases — no files to download.
 */
export const desertClock = jungleClock; // (ticked by JungleClock)

// The strata palette — a shared GLSL function (terrain, mesas, the pyramid's cliff).
const STRATA = /* glsl */ `
vec3 dStrata(vec3 wp) {
  float y = wp.y + 1.6 * jn2(wp.xz * 0.045) + 0.6 * jn2(wp.xz * 0.21);
  float band = y * 0.42;
  float k = fract(band);
  float id = floor(band);
  float h = jh2(vec2(id, 3.7));
  vec3 a = vec3(0.93, 0.78, 0.55);   // cream
  vec3 b = vec3(0.85, 0.58, 0.34);   // ochre
  vec3 c = vec3(0.72, 0.38, 0.24);   // rust
  vec3 d = vec3(0.60, 0.30, 0.22);   // red-brown
  vec3 col = h < 0.3 ? a : h < 0.55 ? b : h < 0.8 ? c : d;
  col *= 0.9 + 0.12 * jn2(vec2(wp.x + wp.z, y * 8.0));
  // A darker ledge line at the top of each band.
  col *= 1.0 - 0.22 * smoothstep(0.9, 0.98, k);
  return col;
}`;

export function makeDesertTerrainMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vDW;\nvarying vec3 vDN;")
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvDW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvDN = normalize(mat3(modelMatrix) * objectNormal);"
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vDW;\nvarying vec3 vDN;\n${JNOISE}\n${STRATA}`)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        vec3 dBase = diffuseColor.rgb;
        {
          vec3 wp = vDW;
          float steep = 1.0 - clamp(vDN.y, 0.0, 1.0);
          // Wind ripples: long wavy lines across the sand (wind from the WSW).
          vec2 wd = vec2(0.94, -0.34);
          float warp = jn2(wp.xz * 0.06) * 7.0 + jn2(wp.xz * 0.23) * 1.6;
          float rip = sin(dot(wp.xz, wd) * 2.6 + warp);
          float ripS = smoothstep(0.25, 1.0, rip) - smoothstep(-1.0, -0.4, rip) * 0.6;
          float flatK = smoothstep(0.35, 0.12, steep);
          float m1 = jf2(wp.xz * 0.05);
          float m2 = jn2(wp.xz * 1.7);
          diffuseColor.rgb *= 0.95 + 0.07 * ripS * flatK + 0.08 * (m1 - 0.5) + 0.05 * (m2 - 0.5);
          // Steep faces: layered sandstone (bands + ledges), sand caught on the ledges.
          float rock = smoothstep(0.42, 0.62, steep);
          vec3 strata = dStrata(wp);
          float sandy = smoothstep(0.6, 0.85, jn2(vec2(wp.x - wp.z, wp.y * 1.7) * 0.8)) * 0.35;
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(strata, dBase, sandy), rock);
        }`
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `#include <emissivemap_fragment>
        {
          // Sun-warmed sparkles: tiny quartz grains that catch the light.
          vec3 cell = floor(vDW * 18.0);
          vec3 rd = normalize(vec3(jh3(cell) - 0.5, jh3(cell + 1.7) * 0.8 + 0.25, jh3(cell + 3.1) - 0.5));
          vec3 V = normalize(cameraPosition - vDW);
          float on = step(0.93, jh3(cell + 5.3)) * smoothstep(0.7, 0.9, vDN.y);
          float g = pow(max(dot(rd, V), 0.0), 220.0) * on;
          float fade = 1.0 - smoothstep(10.0, 28.0, length(cameraPosition - vDW));
          totalEmissiveRadiance += vec3(1.0, 0.92, 0.75) * g * fade * 0.7;
        }`
      );
  };
  m.customProgramCacheKey = () => "desert-terrain-v1";
  return m;
}

/** Layered sandstone for mesa-like props (the horizon buttes, the arch, the drum). */
export function makeStrataMaterial({ tint = "#ffffff", key = "" } = {}) {
  const m = new THREE.MeshStandardMaterial({ color: tint, roughness: 0.95, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vSW;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvSW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vSW;\n${JNOISE}\n${STRATA}`)
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= dStrata(vSW);");
  };
  m.customProgramCacheKey = () => `desert-strata-${key}-${tint}`;
  return m;
}

/**
 * QUICKSAND — attributes: aLocal (x, z from the pit's middle, metres),
 * aDepth (metres in from the edge). A dark, wet, slowly turning swirl; the
 * soft edge fades into damp sand; bubbles swell and pop.
 */
export function makeQuicksandMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.45, metalness: 0.02, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = jungleClock.uTime;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 aLocal;\nattribute float aDepth;\nvarying vec2 vQL;\nvarying float vQD;\nvarying vec3 vQW;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvQL = aLocal;\nvQD = aDepth;\nvQW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform float uTime;\nvarying vec2 vQL;\nvarying float vQD;\nvarying vec3 vQW;\n${JNOISE}`)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        {
          float r = length(vQL);
          float a = atan(vQL.y, vQL.x);
          // A slow THREE-armed spiral (like water draining), tighter toward the middle.
          float warp = 0.5 * jn2(vQL * 0.4 + uTime * 0.04);
          float spiral = sin(a * 3.0 + log(r + 0.6) * 4.2 - uTime * 0.55 + warp * 3.0);
          float rings = sin(r * 1.4 - uTime * 0.8 + jn2(vQL * 0.7) * 2.0);
          float bands = smoothstep(-0.4, 0.8, spiral) * 0.7 + smoothstep(-0.2, 0.9, rings) * 0.3;
          float grain = jn2(vQW.xz * 3.6 + vec2(uTime * 0.03));
          float deep = smoothstep(0.6, 4.5, vQD);
          vec3 damp = vec3(0.74, 0.55, 0.34);
          vec3 lightWet = vec3(0.68, 0.48, 0.28), darkWet = vec3(0.34, 0.21, 0.11);
          vec3 wet = mix(darkWet, lightWet, bands);
          wet = mix(wet, vec3(0.30, 0.19, 0.10), deep * 0.45);
          vec3 col = mix(damp, wet, smoothstep(0.05, 0.9, vQD));
          col *= 0.9 + 0.16 * grain;
          // Bubbles: cells that swell, glint and pop.
          vec2 cellP = vQL * 0.75;
          vec2 ci = floor(cellP);
          vec2 cf = fract(cellP) - 0.5;
          float seed = jh2(ci);
          float life = fract(uTime * (0.22 + seed * 0.25) + seed * 7.0);
          float rad = 0.06 + 0.24 * life;
          vec2 off = (vec2(jh2(ci + 2.3), jh2(ci + 5.1)) - 0.5) * 0.45;
          float ring = smoothstep(rad - 0.05, rad, length(cf - off)) * (1.0 - smoothstep(rad, rad + 0.04, length(cf - off)));
          float bub = ring * step(0.5, seed) * smoothstep(1.0, 2.0, vQD) * (1.0 - life);
          col = mix(col, vec3(0.82, 0.66, 0.44), bub * 0.8);
          diffuseColor.rgb = col;
        }`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor = mix(0.85, 0.28, smoothstep(0.6, 2.0, vQD));"
      );
  };
  m.customProgramCacheKey = () => "desert-quicksand-v2";
  return m;
}

/** OASIS water — clear turquoise; aEdge = metres in from the shore. */
export function makeOasisWaterMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: "#2fb8c0", roughness: 0.34, metalness: 0, transparent: true, opacity: 0.86, envMapIntensity: 0.4 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = jungleClock.uTime;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aEdge;\nvarying float vEdge;\nvarying vec3 vWW;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvEdge = aEdge;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform float uTime;\nvarying float vEdge;\nvarying vec3 vWW;\n${JNOISE}`)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        {
          vec2 p = vWW.xz;
          float w1 = jn2(p * 0.45 + vec2(uTime * 0.16, uTime * 0.07));
          float w2 = jn2(p * 1.2 - vec2(uTime * 0.22, -uTime * 0.13));
          float rip = w1 * 0.6 + w2 * 0.4;
          vec3 V = normalize(cameraPosition - vWW);
          float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
          float depth = smoothstep(0.0, 4.5, vEdge);
          vec3 shallow = vec3(0.28, 0.66, 0.62), deepC = vec3(0.06, 0.44, 0.56);
          diffuseColor.rgb = mix(shallow, deepC, depth) * (0.92 + 0.16 * rip);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.97, 1.0), fres * 0.35);
          // Caustic glints on the ripple crests.
          float sp = smoothstep(0.86, 0.95, jn2(p * 2.6 + uTime * 0.7)) * smoothstep(0.55, 0.8, rip);
          diffuseColor.rgb += vec3(0.55) * sp;
          float foam = (1.0 - smoothstep(0.0, 0.45 + 0.35 * jn2(p * 2.0 + uTime * 0.4), vEdge)) * step(0.02, vEdge);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.96, 0.94), foam * 0.3);
          diffuseColor.a = mix(0.5, 0.93, max(depth, foam * 0.5));
        }`
      );
  };
  m.customProgramCacheKey = () => "desert-oasis-v2";
  return m;
}

/** CRYSTAL — glassy, tinted, glowing faintly from inside (colour per mesh). */
export function makeCrystalMaterial(color) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: 0.08, metalness: 0, transmission: 0.0, transparent: true, opacity: 0.78,
    emissive: color, emissiveIntensity: 0.32, clearcoat: 1, clearcoatRoughness: 0.08, flatShading: true,
  });
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
const TAU = Math.PI * 2;

/** A caravan track (u across, v along): packed sand, wheel ruts, hoof prints. */
function drawSandTrack(g, w, h) {
  const r = prand(11);
  g.fillStyle = "#d8b47c"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    const x = r() * w, y = r() * h, s = 1 + r() * 2.2;
    g.fillStyle = r() < 0.5 ? "rgba(150,110,60,0.18)" : "rgba(255,240,205,0.28)";
    g.fillRect(x, y, s, s);
  }
  for (const cx of [0.3, 0.7]) {
    const grd = g.createLinearGradient(w * (cx - 0.06), 0, w * (cx + 0.06), 0);
    grd.addColorStop(0, "rgba(140,100,55,0)"); grd.addColorStop(0.5, "rgba(140,100,55,0.42)"); grd.addColorStop(1, "rgba(140,100,55,0)");
    g.fillStyle = grd; g.fillRect(w * (cx - 0.06), 0, w * 0.12, h);
  }
  for (let k = 0; k < 10; k++) {
    const y = (k / 10) * h + r() * 8, x = w * (0.5 + (k % 2 ? 0.06 : -0.06));
    g.fillStyle = "rgba(130,92,50,0.35)";
    g.beginPath(); g.ellipse(x, y, 4.5, 6, 0, 0, TAU); g.fill();
  }
  const edge = g.createLinearGradient(0, 0, w, 0);
  edge.addColorStop(0, "rgba(236,204,150,0.95)"); edge.addColorStop(0.14, "rgba(236,204,150,0)");
  edge.addColorStop(0.86, "rgba(236,204,150,0)"); edge.addColorStop(1, "rgba(236,204,150,0.95)");
  g.fillStyle = edge; g.fillRect(0, 0, w, h);
}
/** Warm sandstone cobbles (the bazaar's main street). */
function drawCobbles(g, w, h) {
  const r = prand(21);
  g.fillStyle = "#b8956a"; g.fillRect(0, 0, w, h);
  const rows = 8;
  for (let j = 0; j < rows; j++) {
    const y0 = (j / rows) * h, rh = h / rows;
    let x = j % 2 ? -w / 12 : 0;
    while (x < w) {
      const cw = w / 6 * (0.8 + r() * 0.4);
      const shade = 200 + Math.floor(r() * 40);
      g.fillStyle = `rgb(${shade},${Math.floor(shade * 0.82)},${Math.floor(shade * 0.6)})`;
      g.beginPath();
      if (g.roundRect) g.roundRect(x + 2, y0 + 2, cw - 4, rh - 4, 6); else g.rect(x + 2, y0 + 2, cw - 4, rh - 4);
      g.fill();
      x += cw;
    }
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(90,60,30,${r() * 0.12})`; g.fillRect(r() * w, r() * h, 2, 2); }
}
/** Big pale stone slabs (the Obelisk Avenue + the pyramid ring paths). */
function drawSlabs(g, w, h) {
  const r = prand(31);
  g.fillStyle = "#8f8270"; g.fillRect(0, 0, w, h);
  const n = 4;
  for (let j = 0; j < n; j++) for (let i = 0; i < 2; i++) {
    const x = (i / 2) * w + (j % 2 ? w / 4 : 0), y = (j / n) * h;
    for (const dx of [0, -w]) {
      const s = 196 + Math.floor(r() * 30);
      g.fillStyle = `rgb(${s},${Math.floor(s * 0.93)},${Math.floor(s * 0.82)})`;
      g.fillRect(x + dx + 3, y + 3, w / 2 - 6, h / n - 6);
    }
  }
  for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(80,70,55,${r() * 0.14})`; g.fillRect(r() * w, r() * h, 2, 2); }
  for (let i = 0; i < 18; i++) {
    g.strokeStyle = "rgba(90,80,64,0.35)"; g.lineWidth = 1;
    g.beginPath(); const x = r() * w, y = r() * h; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 40, y + (r() - 0.5) * 40); g.stroke();
  }
}
/** Golden sandstone blocks (the pyramid, the obelisks' bases, walls). */
function drawBricks(g, w, h, { seed = 41, base = [222, 178, 110], rows = 6, cols = 4 } = {}) {
  const r = prand(seed);
  g.fillStyle = `rgb(${base[0] - 60},${base[1] - 60},${base[2] - 50})`; g.fillRect(0, 0, w, h);
  for (let j = 0; j < rows; j++) {
    const y = (j / rows) * h, rh = h / rows;
    const off = j % 2 ? w / cols / 2 : 0;
    for (let i = -1; i < cols; i++) {
      const x = off + (i / cols) * w;
      const k = 0.86 + r() * 0.22;
      g.fillStyle = `rgb(${Math.floor(base[0] * k)},${Math.floor(base[1] * k)},${Math.floor(base[2] * k)})`;
      g.fillRect(x + 2, y + 2, w / cols - 4, rh - 4);
      // Weathering: a lighter top edge + a few pits.
      g.fillStyle = "rgba(255,240,210,0.22)"; g.fillRect(x + 2, y + 2, w / cols - 4, 3);
      for (let p = 0; p < 6; p++) { g.fillStyle = `rgba(90,60,30,${0.12 + r() * 0.15})`; g.fillRect(x + 4 + r() * (w / cols - 10), y + 4 + r() * (rh - 10), 2 + r() * 3, 2 + r() * 2); }
    }
  }
}
/** Smooth plaster (white — tinted by the material colour), softly mottled. */
function drawPlaster(g, w, h) {
  const r = prand(51);
  g.fillStyle = "#f4f0ea"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) {
    const x = r() * w, y = r() * h, rr = 10 + r() * 40;
    const grd = g.createRadialGradient(x, y, 0, x, y, rr);
    grd.addColorStop(0, `rgba(${r() < 0.5 ? "200,180,150" : "255,255,255"},${0.1 + r() * 0.12})`);
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(120,100,80,${r() * 0.06})`; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
  // A dusty skirt along the bottom.
  const grd = g.createLinearGradient(0, h, 0, h * 0.82);
  grd.addColorStop(0, "rgba(190,150,100,0.45)"); grd.addColorStop(1, "rgba(190,150,100,0)");
  g.fillStyle = grd; g.fillRect(0, h * 0.82, w, h * 0.18);
}
/** Awning stripes (white + grey — tinted by the material colour). */
function drawStripes(g, w, h) {
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? "#ffffff" : "#c9c4bc";
    g.fillRect((i / 8) * w, 0, w / 8, h);
  }
  // A scalloped hem.
  g.fillStyle = "rgba(0,0,0,0.12)";
  for (let i = 0; i < 8; i++) { g.beginPath(); g.arc((i + 0.5) * (w / 8), h, w / 16, Math.PI, 0); g.fill(); }
}
/** The carved hieroglyph wall — eyes, birds, suns, waves… and Egyptian numerals. */
function drawGlyphs(g, w, h) {
  const r = prand(61);
  drawBricks(g, w, h, { seed: 62, base: [214, 172, 112], rows: 4, cols: 3 });
  g.strokeStyle = "rgba(92,58,26,0.85)";
  g.fillStyle = "rgba(92,58,26,0.85)";
  g.lineWidth = 4; g.lineCap = "round";
  const cols = 7, rows = 5;
  const cw = w / cols, ch = h / rows;
  const glyph = (k, cx, cy, s) => {
    g.beginPath();
    switch (k) {
      case 0: // an eye
        g.ellipse(cx, cy, s * 0.42, s * 0.2, 0, 0, TAU); g.stroke();
        g.beginPath(); g.arc(cx, cy, s * 0.1, 0, TAU); g.fill();
        g.beginPath(); g.moveTo(cx - s * 0.1, cy + s * 0.2); g.lineTo(cx - s * 0.18, cy + s * 0.42); g.stroke();
        break;
      case 1: // the sun
        g.arc(cx, cy, s * 0.24, 0, TAU); g.stroke();
        g.beginPath(); g.arc(cx, cy, s * 0.06, 0, TAU); g.fill();
        break;
      case 2: // water
        for (let j = -1; j <= 1; j++) { g.beginPath(); for (let x = -0.4; x <= 0.4; x += 0.05) g.lineTo(cx + x * s, cy + j * s * 0.2 + Math.sin(x * 22) * s * 0.05); g.stroke(); }
        break;
      case 3: // a bird
        g.moveTo(cx - s * 0.35, cy + s * 0.3); g.quadraticCurveTo(cx - s * 0.1, cy - s * 0.1, cx + s * 0.1, cy - s * 0.25);
        g.lineTo(cx + s * 0.3, cy - s * 0.2); g.moveTo(cx + s * 0.1, cy - s * 0.25); g.lineTo(cx + s * 0.05, cy + s * 0.25); g.stroke();
        break;
      case 4: // an ankh-like key
        g.ellipse(cx, cy - s * 0.2, s * 0.13, s * 0.17, 0, 0, TAU); g.stroke();
        g.beginPath(); g.moveTo(cx, cy - s * 0.03); g.lineTo(cx, cy + s * 0.4); g.moveTo(cx - s * 0.25, cy + s * 0.05); g.lineTo(cx + s * 0.25, cy + s * 0.05); g.stroke();
        break;
      case 5: // numeral ONE (a stroke) ×3
        for (let j = -1; j <= 1; j++) { g.beginPath(); g.moveTo(cx + j * s * 0.16, cy - s * 0.3); g.lineTo(cx + j * s * 0.16, cy + s * 0.3); g.stroke(); }
        break;
      case 6: // numeral TEN (a heel bone ∩)
        g.moveTo(cx - s * 0.2, cy + s * 0.3); g.lineTo(cx - s * 0.2, cy - s * 0.05); g.arc(cx, cy - s * 0.05, s * 0.2, Math.PI, 0); g.lineTo(cx + s * 0.2, cy + s * 0.3); g.stroke();
        break;
      default: // numeral HUNDRED (a coil)
        for (let a = 0; a < TAU * 1.6; a += 0.2) g.lineTo(cx + Math.cos(a) * a * s * 0.04, cy + Math.sin(a) * a * s * 0.04 - s * 0.05);
        g.stroke(); g.beginPath(); g.moveTo(cx, cy + s * 0.05); g.lineTo(cx, cy + s * 0.35); g.stroke();
    }
  };
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) glyph(Math.floor(r() * 8), (i + 0.5) * cw, (j + 0.5) * ch, Math.min(cw, ch) * 0.8);
  // A carved border.
  g.lineWidth = 8; g.strokeStyle = "rgba(92,58,26,0.6)"; g.strokeRect(6, 6, w - 12, h - 12);
}
/** A painted board: a title + a line, for signs. */
function drawSign(g, w, h, { title, line = "", bg = "#f2d27a", fg = "#5a2e0e", border = "#8a4a1a", icon = "" }) {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = border; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `bold ${Math.floor(h * 0.3)}px "MMA Rounded", "Trebuchet MS", sans-serif`;
  g.fillText(`${icon}${title}`, w / 2, line ? h * 0.4 : h / 2);
  if (line) { g.font = `bold ${Math.floor(h * 0.17)}px "MMA Rounded", "Trebuchet MS", sans-serif`; g.fillText(line, w / 2, h * 0.74); }
}
/** Weathered wooden planks (the boardwalk, bridges, the ladders). */
function drawPlanks(g, w, h) {
  const r = prand(71);
  g.fillStyle = "#6e4a2a"; g.fillRect(0, 0, w, h);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const k = 0.82 + r() * 0.3;
    g.fillStyle = `rgb(${Math.floor(170 * k)},${Math.floor(124 * k)},${Math.floor(80 * k)})`;
    g.fillRect(2, (i / n) * h + 2, w - 4, h / n - 4);
    for (let l = 0; l < 5; l++) {
      g.strokeStyle = `rgba(80,50,25,${0.15 + r() * 0.2})`; g.lineWidth = 1;
      const y = (i / n) * h + 4 + r() * (h / n - 8);
      g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 3, w * 0.6, y - 3, w, y); g.stroke();
    }
    g.fillStyle = "#3a2614"; g.beginPath(); g.arc(8, (i + 0.5) * (h / n), 2.5, 0, TAU); g.arc(w - 8, (i + 0.5) * (h / n), 2.5, 0, TAU); g.fill();
  }
}
/** A soft round glow (sparkles, dust, the sun disc). */
function drawGlow(g, w, h, inner = "rgba(255,250,220,1)", mid = "rgba(255,220,140,0.5)") {
  const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  grd.addColorStop(0, inner); grd.addColorStop(0.35, mid); grd.addColorStop(1, "rgba(255,200,120,0)");
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
}
/** A puff of blown sand (soft, irregular). */
function drawDust(g, w, h) {
  const r = prand(81);
  for (let i = 0; i < 26; i++) {
    const x = w * (0.25 + r() * 0.5), y = h * (0.25 + r() * 0.5), rr = w * (0.08 + r() * 0.18);
    const grd = g.createRadialGradient(x, y, 0, x, y, rr);
    grd.addColorStop(0, "rgba(255,236,200,0.22)"); grd.addColorStop(1, "rgba(255,236,200,0)");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }
}

let _tex = null;
export function getDesertTextures() {
  if (_tex) return _tex;
  if (typeof document === "undefined") return {};
  _tex = {
    track: canvasTex(128, 256, drawSandTrack, { repeat: true }),
    cobbles: canvasTex(256, 256, drawCobbles, { repeat: true }),
    slabs: canvasTex(256, 256, drawSlabs, { repeat: true }),
    bricks: canvasTex(256, 256, (g, w, h) => drawBricks(g, w, h), { repeat: true }),
    bricksPale: canvasTex(256, 256, (g, w, h) => drawBricks(g, w, h, { seed: 44, base: [236, 212, 168], rows: 5, cols: 3 }), { repeat: true }),
    bricksRed: canvasTex(256, 256, (g, w, h) => drawBricks(g, w, h, { seed: 45, base: [200, 120, 80], rows: 5, cols: 3 }), { repeat: true }),
    plaster: canvasTex(256, 256, drawPlaster, { repeat: true }),
    stripes: canvasTex(128, 64, drawStripes, { repeat: true }),
    glyphs: canvasTex(512, 384, drawGlyphs),
    planks: canvasTex(128, 128, drawPlanks, { repeat: true }),
    glow: canvasTex(64, 64, (g, w, h) => drawGlow(g, w, h)),
    dust: canvasTex(64, 64, drawDust),
    warn: canvasTex(256, 160, (g, w, h) => drawSign(g, w, h, { title: "QUICKSAND!", line: "Keep off the swirly sand", bg: "#ffd23f", fg: "#3a1a06", border: "#c0391b", icon: "⚠ " })),
  };
  return _tex;
}
/** A one-off text board (welcome sign, temple plaque). Cached by text. */
const _boards = new Map();
export function signTexture(title, line = "", opts = {}) {
  const k = `${title}|${line}|${JSON.stringify(opts)}`;
  if (_boards.has(k)) return _boards.get(k);
  const t = canvasTex(512, 256, (g, w, h) => drawSign(g, w, h, { title, line, ...opts }));
  _boards.set(k, t);
  return t;
}

// ---------------------------------------------------------------------------
// Shared flat-colour materials (cached).
// ---------------------------------------------------------------------------
const _mats = new Map();
export function desertMat(color, { map = null, rough = 0.9, metal = 0, emissive = null, ei = 0, flat = false, side = THREE.FrontSide, transparent = false, opacity = 1 } = {}) {
  const key = `${color}|${map ? map.uuid : "-"}|${rough}|${metal}|${emissive}|${ei}|${flat}|${side}|${transparent}|${opacity}`;
  if (_mats.has(key)) return _mats.get(key);
  const m = new THREE.MeshStandardMaterial({
    color, map, roughness: rough, metalness: metal, flatShading: flat, side, transparent, opacity,
    emissive: emissive ? new THREE.Color(emissive) : new THREE.Color(0, 0, 0), emissiveIntensity: ei,
  });
  _mats.set(key, m);
  return m;
}
