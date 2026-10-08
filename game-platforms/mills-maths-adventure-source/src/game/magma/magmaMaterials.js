/**
 * MAGMA MULTIPLES — shared materials + procedural canvas textures (no image
 * files). One animated LAVA material is shared by every lava surface (sea,
 * moat, rivers, lake, pools, crater), so a single uniform tick animates them
 * all. The rock materials read a per-vertex `aGlow` attribute and add it as
 * emissive — that's how lava BANKS and the crater walls glow without any
 * extra lights.
 */
import * as THREE from "three";

export const magmaClock = { uTime: { value: 0 } };

// ---------------------------------------------------------------------------
// Animated lava: domain-warped fbm in WORLD space → churning bright channels
// between drifting dark crust plates. MeshBasicMaterial base so fog still
// applies; toneMapped off so it reads as hot (and blooms on High graphics).
// ---------------------------------------------------------------------------
const NOISE_GLSL = /* glsl */ `
float lh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float lnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(lh(i), lh(i + vec2(1.0, 0.0)), u.x), mix(lh(i + vec2(0.0, 1.0)), lh(i + vec2(1.0, 1.0)), u.x), u.y);
}
float lfbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * lnoise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; }
  return v;
}
`;

export function makeLavaMaterial({ scale = 0.16, brightness = 0.92, crustAmount = 0.92, farCrust = false } = {}) {
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = magmaClock.uTime;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vLavaW;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvLavaW = (modelMatrix * vec4(transformed, 1.0)).xyz;"
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform float uTime;\nvarying vec3 vLavaW;\n${NOISE_GLSL}`)
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        /* glsl */ `
        vec2 p = vLavaW.xz * ${scale.toFixed(3)};
        float t = uTime;
        vec2 q = vec2(lfbm(p + vec2(t * 0.05, -t * 0.03)), lfbm(p + vec2(-t * 0.04, t * 0.06) + 5.2));
        float n = lfbm(p * 1.6 + q * 1.8 + vec2(t * 0.02));
        float cells = lfbm(p * 3.5 - q + t * 0.03);
        float crust = smoothstep(0.38, 0.55, n) * smoothstep(0.3, 0.52, cells);
        ${farCrust ? "float far = smoothstep(115.0, 170.0, length(vLavaW.xz)); crust = mix(crust, max(crust, 0.55 + 0.45 * smoothstep(0.3, 0.6, n)), far);" : ""}
        vec3 hot = mix(vec3(0.92, 0.17, 0.02), vec3(1.0, 0.58, 0.10), smoothstep(0.4, 0.8, 1.0 - n));
        hot = mix(hot, vec3(1.0, 0.86, 0.45), smoothstep(0.74, 0.9, 1.0 - n) * 0.6);
        float pulse = 0.88 + 0.12 * sin(t * 1.7 + n * 9.0);
        vec3 col = mix(hot * pulse * ${brightness.toFixed(3)}, vec3(0.13, 0.035, 0.02), crust * ${crustAmount.toFixed(3)});
        vec4 diffuseColor = vec4(col, opacity);`
      );
  };
  m.customProgramCacheKey = () => `magma-lava-${scale}-${brightness}-${crustAmount}-${farCrust}`;
  return m;
}

// ---------------------------------------------------------------------------
// Falling / flowing lava (falls + volcano streams): UV-scrolled streaks.
// ---------------------------------------------------------------------------
export function makeLavaFlowMaterial({ speed = 0.9 } = {}) {
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = magmaClock.uTime;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 aFlow;\nvarying vec2 vFlow;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvFlow = aFlow;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform float uTime;\nvarying vec2 vFlow;\n${NOISE_GLSL}`)
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        /* glsl */ `
        vec2 p = vec2(vFlow.x * 3.0, vFlow.y * 0.55 - uTime * ${speed.toFixed(2)});
        float n = lfbm(p * vec2(1.0, 1.0));
        float s = lfbm(p * vec2(2.5, 0.6) + 3.1);
        float edge = smoothstep(0.0, 0.22, vFlow.x) * smoothstep(1.0, 0.78, vFlow.x);
        vec3 hot = mix(vec3(1.0, 0.33, 0.03), vec3(1.0, 0.86, 0.32), smoothstep(0.45, 0.8, s));
        vec3 col = mix(vec3(0.25, 0.05, 0.02), hot * 1.3, smoothstep(0.25, 0.55, n) * (0.55 + 0.45 * edge));
        vec4 diffuseColor = vec4(col, opacity);`
      );
  };
  m.customProgramCacheKey = () => `magma-flow-${speed}`;
  return m;
}

// ---------------------------------------------------------------------------
// Rock with per-vertex glow (vertex colours + flat shading + aGlow emissive).
// ---------------------------------------------------------------------------
export function makeGlowRockMaterial({ flat = true, roughness = 0.95, polygonOffset = 0 } = {}) {
  const m = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: flat,
    roughness,
    metalness: 0.02,
    polygonOffset: polygonOffset !== 0,
    polygonOffsetFactor: polygonOffset,
    polygonOffsetUnits: polygonOffset,
  });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = magmaClock.uTime;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aGlow;\nvarying float vGlow;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGlow = aGlow;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;\nvarying float vGlow;")
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.36, 0.07) * vGlow * (0.9 + 0.1 * sin(uTime * 1.9));"
      );
  };
  m.customProgramCacheKey = () => `magma-glowrock-${flat}-${roughness}-${polygonOffset}`;
  return m;
}

// ---------------------------------------------------------------------------
// Canvas textures.
// ---------------------------------------------------------------------------
function canvasTex(w, h, draw, repeat = true) {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const g = cv.getContext("2d");
  draw(g, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function prand(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function drawCobbles(g, w, h, { border = false, seed = 3, base = ["#a38a70", "#b19779", "#97806a", "#ab9174"], mortar = "#4f4038" } = {}) {
  const r = prand(seed);
  g.fillStyle = mortar;
  g.fillRect(0, 0, w, h);
  const cell = w / 6;
  for (let j = -1; j <= 6; j++) {
    for (let i = -1; i <= 6; i++) {
      const cx = (i + 0.5 + (j % 2 ? 0.5 : 0)) * cell + (r() - 0.5) * cell * 0.25;
      const cy = (j + 0.5) * cell + (r() - 0.5) * cell * 0.25;
      const rad = cell * (0.4 + r() * 0.06);
      const col = base[Math.floor(r() * base.length)];
      // A rounded irregular stone, drawn with wrap-around copies.
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        g.beginPath();
        const n = 7;
        for (let k = 0; k <= n; k++) {
          const a = (k / n) * Math.PI * 2;
          const rr = rad * (0.82 + 0.18 * Math.sin(a * 3 + cx));
          const x = cx + ox + Math.cos(a) * rr, y = cy + oy + Math.sin(a) * rr;
          k ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.fillStyle = col;
        g.fill();
        g.strokeStyle = "rgba(40,28,22,0.55)";
        g.lineWidth = 2;
        g.stroke();
        // Highlight on the upper-left of each stone.
        g.fillStyle = "rgba(255,240,220,0.12)";
        g.beginPath();
        g.arc(cx + ox - rad * 0.25, cy + oy - rad * 0.25, rad * 0.45, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  if (border) {
    // Dark kerb stones along both long edges (u = 0 and u = 1).
    const bw = w * 0.07;
    g.fillStyle = "#3a2c26";
    g.fillRect(0, 0, bw, h);
    g.fillRect(w - bw, 0, bw, h);
    g.fillStyle = "rgba(255,140,60,0.18)";
    g.fillRect(bw, 0, 2, h);
    g.fillRect(w - bw - 2, 0, 2, h);
  }
}

let _tex = null;
export function getMagmaTextures() {
  if (_tex) return _tex;
  _tex = {
    path: canvasTex(256, 256, (g, w, h) => drawCobbles(g, w, h, { border: true, seed: 5 })),
    plaza: canvasTex(256, 256, (g, w, h) => drawCobbles(g, w, h, { seed: 9, base: ["#8f7864", "#9d846d", "#86705d", "#a08a73"] })),
    trail: canvasTex(256, 256, (g, w, h) => drawCobbles(g, w, h, { border: true, seed: 13, base: ["#8a6e5c", "#957763", "#7e6555", "#9a7d68"], mortar: "#3f302a" })),
    planks: canvasTex(256, 256, (g, w, h) => {
      const r = prand(4);
      g.fillStyle = "#2a1a10"; g.fillRect(0, 0, w, h);
      const n = 8;
      for (let i = 0; i < n; i++) {
        const y = (i / n) * h;
        const shade = 0.85 + r() * 0.3;
        g.fillStyle = `rgb(${Math.round(132 * shade)},${Math.round(90 * shade)},${Math.round(56 * shade)})`;
        g.fillRect(2, y + 3, w - 4, h / n - 6);
        g.strokeStyle = "rgba(60,35,20,0.35)";
        for (let k = 0; k < 4; k++) { g.beginPath(); const yy = y + 6 + r() * (h / n - 12); g.moveTo(4, yy); g.lineTo(w - 4, yy + (r() - 0.5) * 4); g.stroke(); }
        g.fillStyle = "#3a3a3a";
        [0.1, 0.9].forEach((fx) => { g.beginPath(); g.arc(w * fx, y + h / n / 2, 3, 0, 6.3); g.fill(); });
      }
    }),
    grate: canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = "#1c1a1a"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "#5a5552"; g.lineWidth = 7;
      for (let i = 0; i <= 4; i++) {
        g.beginPath(); g.moveTo((i / 4) * w, 0); g.lineTo((i / 4) * w, h); g.stroke();
        g.beginPath(); g.moveTo(0, (i / 4) * h); g.lineTo(w, (i / 4) * h); g.stroke();
      }
      g.strokeStyle = "rgba(255,120,50,0.25)"; g.lineWidth = 2;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(((i + 0.5) / 4) * w, 0); g.lineTo(((i + 0.5) / 4) * w, h); g.stroke(); }
    }),
    hex: canvasTex(256, 222, (g, w, h) => {
      g.fillStyle = "#1e1716"; g.fillRect(0, 0, w, h);
      const R = w / 6;
      const hh = Math.sqrt(3) * R;
      const r = prand(8);
      for (let col = -1; col < 5; col++) {
        for (let row = -1; row < 3; row++) {
          const cx = col * 1.5 * R;
          const cy = row * hh + (col % 2 ? hh / 2 : 0);
          for (const ox of [0, w]) {
            g.beginPath();
            for (let k = 0; k <= 6; k++) {
              const a = (k / 6) * Math.PI * 2;
              const x = cx + ox + Math.cos(a) * R * 0.92, y = cy + Math.sin(a) * R * 0.92;
              k ? g.lineTo(x, y) : g.moveTo(x, y);
            }
            const s = 0.8 + r() * 0.35;
            g.fillStyle = `rgb(${Math.round(72 * s)},${Math.round(62 * s)},${Math.round(60 * s)})`;
            g.fill();
          }
        }
      }
    }),
    checker: canvasTex(128, 128, (g, w, h) => {
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
        g.fillStyle = (i + j) % 2 ? "#e9dcc4" : "#7a2a22";
        g.fillRect((i * w) / 2, (j * h) / 2, w / 2, h / 2);
      }
      g.strokeStyle = "rgba(30,15,10,0.5)"; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2);
    }),
    puff: canvasTex(128, 128, (g, w, h) => {
      const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      grd.addColorStop(0, "rgba(255,255,255,0.9)");
      grd.addColorStop(0.45, "rgba(255,255,255,0.45)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grd; g.fillRect(0, 0, w, h);
    }, false),
    ember: canvasTex(64, 64, (g, w, h) => {
      const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      grd.addColorStop(0, "rgba(255,240,180,1)");
      grd.addColorStop(0.3, "rgba(255,150,40,0.9)");
      grd.addColorStop(1, "rgba(255,60,0,0)");
      g.fillStyle = grd; g.fillRect(0, 0, w, h);
    }, false),
  };
  return _tex;
}
