import * as THREE from "three";

import { JNOISE, jungleClock } from "../jungle/jungleMaterials.js";

/**
 * SNOWBALL SUMS — MATERIALS + procedural canvas TEXTURES (2026-10-08).
 *   snow terrain: wind-rippled sastrugi, fine grain, crystal GLINTS that
 *     sparkle as the camera moves, and grey-blue rock on the steep faces
 *   ice: glossy, pale-cyan with a deep-blue body, cracks + skate scratches
 *   lake water: dark, cold, rippling, a lighter fresnel sheen + foam rim
 */
export function makeSnowTerrainMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vSW;\nvarying vec3 vSN;")
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvSW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvSN = normalize(mat3(modelMatrix) * objectNormal);"
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vSW;\nvarying vec3 vSN;\n${JNOISE}`)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        vec3 sBase = diffuseColor.rgb;
        float sDark = 1.0 - smoothstep(0.004, 0.012, dot(sBase, vec3(0.3333)));
        {
          vec3 wp = vSW;
          float steep = 1.0 - clamp(vSN.y, 0.0, 1.0);
          // Wind-carved sastrugi: long soft ripples across the snowfields.
          float rip = sin(dot(wp.xz, vec2(0.55, 0.84)) * 1.9 + jn2(wp.xz * 0.07) * 6.0);
          float m1 = jf2(wp.xz * 0.06);
          float m2 = jn2(wp.xz * 1.3);
          diffuseColor.rgb *= 0.93 + 0.05 * rip * (1.0 - steep) + 0.06 * (m1 - 0.5) + 0.03 * (m2 - 0.5);
          // Cool blue in the hollows (snow scatters blue light).
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.86, 0.92, 1.04), (1.0 - smoothstep(0.2, 0.45, m1)) * 0.5);
          // Steep faces: grey-blue rock with snow caught on every ledge.
          float rock = smoothstep(0.52, 0.72, steep);
          float ledge = smoothstep(0.55, 0.75, jn2(vec2(wp.x + wp.z, wp.y * 2.6)));
          vec3 stone = mix(vec3(0.33, 0.36, 0.42), vec3(0.55, 0.58, 0.64), jn2(wp.xz * 0.6 + wp.y));
          stone *= 0.8 + 0.3 * jn2(vec2(wp.x - wp.z, wp.y * 4.0));
          diffuseColor.rgb = mix(diffuseColor.rgb, stone, rock * (1.0 - ledge * 0.65));
          // The cave's dark mouth keeps its own (unlit-looking) colour.
          diffuseColor.rgb = mix(diffuseColor.rgb, sBase, sDark);
        }`
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `#include <emissivemap_fragment>
        {
          // Crystal glints: tiny facets that catch the light as you move.
          vec3 cell = floor(vSW * 22.0);
          vec3 rd = normalize(vec3(jh3(cell) - 0.5, jh3(cell + 1.7) * 0.8 + 0.2, jh3(cell + 3.1) - 0.5));
          vec3 V = normalize(cameraPosition - vSW);
          float on = step(0.72, jh3(cell + 5.3)) * step(vSN.y, 2.0) * smoothstep(0.55, 0.85, vSN.y) * smoothstep(0.004, 0.02, dot(vColor.rgb, vec3(0.3333)));
          float g = pow(max(dot(rd, V), 0.0), 140.0) * on;
          float fade = 1.0 - smoothstep(18.0, 46.0, length(cameraPosition - vSW));
          totalEmissiveRadiance += vec3(0.95, 0.97, 1.0) * g * fade * 1.6;
        }`
      );
  };
  m.customProgramCacheKey = () => "snow-terrain-v2";
  return m;
}

/** Glossy ICE (pond, river, puddles, runouts): a crack/scratch map + a deep
 *  blue body that brightens at grazing angles. */
export function makeIceMaterial() {
  const tex = getSnowTextures().ice;
  const m = new THREE.MeshStandardMaterial({ color: "#d3f0fb", map: tex, roughness: 0.14, metalness: 0.06, transparent: true, opacity: 0.94 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vIW;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvIW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vIW;\n${JNOISE}`)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        {
          vec3 V = normalize(cameraPosition - vIW);
          float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 2.0);
          float deep = jf2(vIW.xz * 0.08);
          vec3 body = mix(vec3(0.42, 0.66, 0.82), vec3(0.62, 0.84, 0.93), deep);
          diffuseColor.rgb *= mix(body, vec3(1.0), 0.35 + 0.55 * fres);
          // Patches of frosty white.
          float frost = smoothstep(0.62, 0.8, jf2(vIW.xz * 0.21 + 3.0));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.97, 1.0), frost * 0.55);
        }`
      );
  };
  m.customProgramCacheKey = () => "snow-ice-v1";
  return m;
}

/** Cold LAKE water: deep teal-navy, rippling, a pale sky sheen at grazing
 *  angles and white foam where it laps the shore (aEdge = metres to shore). */
export function makeLakeMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: "#2a5d86", roughness: 0.22, metalness: 0.1, transparent: true, opacity: 0.93 });
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
          float w1 = jn2(p * 0.35 + vec2(uTime * 0.12, uTime * 0.05));
          float w2 = jn2(p * 0.9 - vec2(uTime * 0.2, -uTime * 0.11));
          float rip = w1 * 0.6 + w2 * 0.4;
          vec3 V = normalize(cameraPosition - vWW);
          float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
          diffuseColor.rgb = mix(vec3(0.1, 0.26, 0.4), vec3(0.2, 0.46, 0.62), rip);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.86, 0.95), fres * 0.65);
          // Sparkles on the ripple crests.
          float sp = smoothstep(0.86, 0.95, jn2(p * 2.4 + uTime * 0.6)) * smoothstep(0.55, 0.8, rip);
          diffuseColor.rgb += vec3(0.6) * sp;
          // Foam + slush at the shore.
          float foam = 1.0 - smoothstep(0.0, 1.6 + 0.6 * jn2(p * 1.5 + uTime * 0.3), vEdge);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.95, 1.0), foam * 0.85);
          diffuseColor.a = mix(0.9, 1.0, foam);
        }`
      );
  };
  m.customProgramCacheKey = () => "snow-lake-v1";
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

/** A packed-snow trail (u across, v along): sledge grooves, boot prints, ice. */
function drawTrail(g, w, h) {
  const r = prand(71);
  g.fillStyle = "#dfe7f2"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2200; i++) {
    const x = r() * w, y = r() * h, s = 1 + r() * 2.5;
    g.fillStyle = r() < 0.5 ? "rgba(150,170,200,0.16)" : "rgba(255,255,255,0.35)";
    g.fillRect(x, y, s, s);
  }
  // Two sledge grooves.
  for (const cx of [0.32, 0.68]) {
    const grd = g.createLinearGradient(w * (cx - 0.07), 0, w * (cx + 0.07), 0);
    grd.addColorStop(0, "rgba(140,165,200,0)");
    grd.addColorStop(0.5, "rgba(140,165,200,0.45)");
    grd.addColorStop(1, "rgba(140,165,200,0)");
    g.fillStyle = grd;
    g.fillRect(w * (cx - 0.07), 0, w * 0.14, h);
  }
  // Boot prints down the middle.
  for (let k = 0; k < 9; k++) {
    const y = (k / 9) * h + r() * 6, x = w * (0.5 + (k % 2 ? 0.07 : -0.07));
    g.fillStyle = "rgba(150,172,205,0.4)";
    g.beginPath(); g.ellipse(x, y, 5, 10, 0, 0, TAU_C); g.fill();
  }
  // Soft untrodden verges.
  const edge = g.createLinearGradient(0, 0, w, 0);
  edge.addColorStop(0, "rgba(250,252,255,0.95)");
  edge.addColorStop(0.12, "rgba(250,252,255,0)");
  edge.addColorStop(0.88, "rgba(250,252,255,0)");
  edge.addColorStop(1, "rgba(250,252,255,0.95)");
  g.fillStyle = edge; g.fillRect(0, 0, w, h);
}
const TAU_C = Math.PI * 2;

/** Ice: pale with cracks + skate scratches. */
function drawIce(g, w, h) {
  const r = prand(91);
  g.fillStyle = "#eef8fc"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) {
    g.strokeStyle = `rgba(150,200,225,${0.1 + r() * 0.2})`;
    g.lineWidth = 0.6 + r();
    g.beginPath();
    const x = r() * w, y = r() * h, a = r() * TAU_C, L = 30 + r() * 90;
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + 0.3) * L * 0.5, y + Math.sin(a + 0.3) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L);
    g.stroke();
  }
  // Cracks: jagged branching lines.
  for (let i = 0; i < 14; i++) {
    let x = r() * w, y = r() * h;
    g.strokeStyle = "rgba(255,255,255,0.75)";
    g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 9; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; g.lineTo(x, y); }
    g.stroke();
  }
}

/** Snow-dusted planks (bridge decks, docks): boards run across v. */
function drawSnowPlanks(g, w, h) {
  const r = prand(53);
  const n = 8;
  for (let i = 0; i < n; i++) {
    const y = (i / n) * h;
    const base = 95 + Math.floor(r() * 30);
    g.fillStyle = `rgb(${base + 30},${base + 4},${base - 22})`;
    g.fillRect(0, y, w, h / n - 2);
    for (let k = 0; k < 40; k++) {
      g.fillStyle = "rgba(60,40,25,0.18)";
      g.fillRect(r() * w, y + r() * (h / n), 10 + r() * 30, 1);
    }
    g.fillStyle = "rgba(40,28,18,0.6)";
    g.fillRect(0, y + h / n - 2, w, 2);
    // Snow drifted into the middle + along the board.
    for (let k = 0; k < 6; k++) {
      g.fillStyle = "rgba(245,249,255,0.85)";
      g.beginPath(); g.ellipse(w * (0.3 + r() * 0.4), y + h / n * 0.5, 22 + r() * 30, 3 + r() * 3, 0, 0, TAU_C); g.fill();
    }
  }
}

/** Round-log cabin walls: logs stacked along u. */
function drawLogs(g, w, h) {
  const r = prand(17);
  const n = 8;
  for (let i = 0; i < n; i++) {
    const y = (i / n) * h, lh = h / n;
    const grd = g.createLinearGradient(0, y, 0, y + lh);
    grd.addColorStop(0, "#3c2a1c");
    grd.addColorStop(0.18, "#8a6340");
    grd.addColorStop(0.5, "#a77a4f");
    grd.addColorStop(0.82, "#7a5536");
    grd.addColorStop(1, "#2e2015");
    g.fillStyle = grd; g.fillRect(0, y, w, lh);
    for (let k = 0; k < 30; k++) {
      g.fillStyle = "rgba(50,32,20,0.22)";
      g.fillRect(r() * w, y + lh * (0.25 + r() * 0.5), 14 + r() * 40, 1);
    }
    // Snow sitting on each log's top.
    g.fillStyle = "rgba(240,246,255,0.75)";
    g.fillRect(0, y, w, 2);
  }
}

/** Snowy roof shingles (rows), heavy snow in drifts. */
function drawSnowRoof(g, w, h) {
  const r = prand(23);
  g.fillStyle = "#eef3fa"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(170,190,215,${0.08 + r() * 0.12})`;
    g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 30, 3 + r() * 5, 0, 0, TAU_C); g.fill();
  }
  // Dark shingle edges peeking at the eaves (bottom rows).
  for (let row = 0; row < 3; row++) {
    const y = h - (row + 1) * 14;
    for (let x = (row % 2) * 10; x < w; x += 20) {
      if (r() < 0.55) continue;
      g.fillStyle = "rgba(70,75,95,0.6)";
      g.fillRect(x, y, 18, 6);
    }
  }
}

/** Snow blocks (the fort walls, igloo-ish masonry). */
function drawSnowBlocks(g, w, h) {
  const r = prand(41);
  g.fillStyle = "#eef4fb"; g.fillRect(0, 0, w, h);
  const rows = 4;
  for (let i = 0; i < rows; i++) {
    const y = (i / rows) * h;
    g.fillStyle = "rgba(160,185,215,0.5)";
    g.fillRect(0, y, w, 2);
    for (let x = (i % 2) * (w / 8); x < w; x += w / 4) g.fillRect(x, y, 2, h / rows);
    for (let k = 0; k < 40; k++) {
      g.fillStyle = `rgba(190,208,230,${0.1 + r() * 0.15})`;
      g.fillRect(r() * w, y + r() * (h / rows), 3, 3);
    }
  }
}

let _tex = null;
export function getSnowTextures() {
  if (_tex) return _tex;
  const trail = canvasTex(128, 256, drawTrail, { repeat: true });
  const ice = canvasTex(512, 512, drawIce, { repeat: true });
  if (ice) ice.repeat.set(1, 1);
  const planks = canvasTex(256, 256, drawSnowPlanks, { repeat: true });
  const logs = canvasTex(256, 256, drawLogs, { repeat: true });
  const roof = canvasTex(256, 256, drawSnowRoof, { repeat: true });
  const blocks = canvasTex(256, 128, drawSnowBlocks, { repeat: true });
  _tex = { trail, ice, planks, logs, roof, blocks };
  return _tex;
}

/** Cached flat materials by colour (shared across the set-pieces). */
const _flat = new Map();
export function snowFlat(color, opts = {}) {
  const k = `${color}|${JSON.stringify(opts)}`;
  if (!_flat.has(k)) _flat.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...opts }));
  return _flat.get(k);
}
