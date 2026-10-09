/**
 * NUMBER ISLAND — materials + procedural canvas textures (no image files).
 * The foliage material + the shared clock come from the jungle's kit
 * (jungleMaterials.js) so wind + water animate the same way everywhere.
 *
 *   makeIslandTerrainMaterial  vertex-coloured ground + a world-space shader:
 *                              mottled turf + clover flecks, rippled sand
 *                              that glistens wet at the waterline, sparkling
 *                              snow, gritty ash, layered rock on steep faces
 *   makeOceanMaterial          the sea: shallow turquoise over the sand →
 *                              deep blue, rolling waves, sun glints and
 *                              shoreline foam that laps up the beaches (it
 *                              reads the terrain's height texture for depth)
 *   getIslandTextures          cobbles, sandy paths, plaza paving, ashlar
 *                              walls, planks, roof tiles, slate, sign boards
 */
import * as THREE from "three";
import { JNOISE, jungleClock } from "../jungle/jungleMaterials.js";
import { GRID, getIslandGrid } from "../../data/island/islandTerrain.js";

// ---------------------------------------------------------------------------
// The terrain's height as a texture (the ocean + the grass field read it).
// ---------------------------------------------------------------------------
let _hTex = null;
export function getIslandHeightTexture() {
  if (_hTex) return _hTex;
  const { h } = getIslandGrid();
  const { nx, nz } = GRID;
  const data = new Uint16Array(nx * nz);
  for (let k = 0; k < nx * nz; k++) data[k] = THREE.DataUtils.toHalfFloat(h[k]);
  const t = new THREE.DataTexture(data, nx, nz, THREE.RedFormat, THREE.HalfFloatType);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  _hTex = t;
  return t;
}
export const ISLAND_GRID_VEC = () => new THREE.Vector4(GRID.xMin, GRID.zMin, GRID.xMax - GRID.xMin, GRID.zMax - GRID.zMin);

// ---------------------------------------------------------------------------
// TERRAIN — attribute aMix = (sand, snow, ash, wet) weights per vertex.
// ---------------------------------------------------------------------------
export function makeIslandTerrainMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = jungleClock.uTime;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec4 aMix;\nvarying vec4 vMix;\nvarying vec3 vIW;\nvarying vec3 vIN;")
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvIW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvIN = normalize(mat3(modelMatrix) * objectNormal);\nvMix = aMix;"
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform float uTime;\nvarying vec4 vMix;\nvarying vec3 vIW;\nvarying vec3 vIN;\n${JNOISE}`)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        {
          vec3 wp = vIW;
          float steep = 1.0 - clamp(vIN.y, 0.0, 1.0);
          float sand = vMix.x, snow = vMix.y, ash = vMix.z, wet = vMix.w;
          float grass = clamp(1.0 - sand - snow - ash, 0.0, 1.0);
          // Turf: two scales of mottling + clover flecks.
          float m1 = jf2(wp.xz * 0.085);
          float m2 = jn2(wp.xz * 0.9);
          float m3 = jn2(wp.xz * 3.3);
          vec3 c = diffuseColor.rgb;
          c *= mix(1.0, 0.88 + 0.2 * m1 + 0.07 * (m2 - 0.5) + 0.05 * (m3 - 0.5), grass);
          float fleck = smoothstep(0.83, 0.91, jn2(wp.xz * 1.6 + 9.0)) * grass;
          c = mix(c, c * vec3(1.15, 1.12, 0.74), fleck * 0.5);
          // Sand: wind ripples + grains; darker + glossier where it's wet.
          float rip = sin(wp.x * 2.3 + wp.z * 0.9 + jn2(wp.xz * 0.35) * 5.0) * 0.5 + 0.5;
          c *= mix(1.0, 0.93 + 0.08 * rip + 0.06 * (m3 - 0.5), sand);
          c = mix(c, c * vec3(0.78, 0.76, 0.72), wet * 0.65);
          // Snow: soft blue hollows + crystal glints.
          float sn = jf2(wp.xz * 0.21);
          c = mix(c, c * vec3(0.9, 0.95, 1.04), snow * smoothstep(0.35, 0.75, sn) * 0.5);
          // Ash: dark grit with ember-red flecks.
          float grit = jn2(wp.xz * 2.6);
          c *= mix(1.0, 0.82 + 0.3 * grit, ash);
          c = mix(c, vec3(0.55, 0.16, 0.07), ash * smoothstep(0.88, 0.95, jn2(wp.xz * 1.9 + 3.0)) * 0.45);
          // Steep faces: layered rock (cliffs, the bluff, the volcano's cone).
          // (Snow only clings to the gentler ground: on the mountain the
          // steeper faces + gully walls show bare rock sooner.)
          float rockMix = mix(smoothstep(0.34, 0.56, steep), smoothstep(0.15, 0.32, steep), snow) * (1.0 - snow * 0.12);
          float n3 = jn3(wp * 0.31);
          float strata = 0.5 + 0.5 * sin(wp.y * 2.2 + n3 * 5.0 + jn2(wp.xz * 0.05) * 9.0);
          vec3 rock = mix(vec3(0.52, 0.47, 0.40), vec3(0.37, 0.34, 0.31), n3);
          rock = mix(rock, vec3(0.20, 0.17, 0.16), ash * 0.8);
          rock *= 0.82 + 0.24 * strata;
          float ledge = smoothstep(0.62, 0.95, strata) * smoothstep(0.35, 0.75, jn3(wp * 0.5 + 4.0)) * (1.0 - ash);
          rock = mix(rock, vec3(0.32, 0.52, 0.22), ledge * 0.6 * (1.0 - snow));
          rock = mix(rock, vec3(0.93, 0.96, 1.0), ledge * snow);
          c = mix(c, rock, rockMix);
          diffuseColor.rgb = c;
        }`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.35, vMix.w * 0.8);
        roughnessFactor = mix(roughnessFactor, 0.6, vMix.y * 0.5);`
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `#include <emissivemap_fragment>
        {
          // Snow + wet-sand glints that twinkle as the camera moves.
          vec3 vd = normalize(cameraPosition - vIW);
          float tw = jn2(vIW.xz * 7.0 + vd.xz * 3.0 + uTime * 0.05);
          float glint = smoothstep(0.93, 0.985, tw) * (vMix.y * 0.9 + vMix.w * 0.5);
          totalEmissiveRadiance += vec3(0.9, 0.95, 1.0) * glint * 0.55;
        }`
      );
  };
  m.customProgramCacheKey = () => "island-terrain-v2";
  return m;
}

// ---------------------------------------------------------------------------
// OCEAN — one big plane at sea level. Depth comes from the terrain height
// texture; outside the grid it's simply deep.
// ---------------------------------------------------------------------------
export function makeOceanMaterial() {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#1f9fc0"), roughness: 0.12, metalness: 0.05, transparent: true, depthWrite: false,
  });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = jungleClock.uTime;
    sh.uniforms.uH = { value: getIslandHeightTexture() };
    sh.uniforms.uGrid = { value: ISLAND_GRID_VEC() };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vOW;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvOW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>\nuniform float uTime;\nuniform sampler2D uH;\nuniform vec4 uGrid;\nvarying vec3 vOW;\n${JNOISE}
        float oceanDepth(vec2 p){
          vec2 uv = (p - uGrid.xy) / uGrid.zw;
          if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 40.0;
          return -texture2D(uH, uv).r;
        }`
      )
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        {
          vec2 p = vOW.xz;
          float depth = oceanDepth(p);
          // Shallow turquoise over the sand → teal → deep sea blue.
          vec3 shallow = vec3(0.45, 0.88, 0.86);
          vec3 mid = vec3(0.07, 0.62, 0.74);
          vec3 deep = vec3(0.04, 0.33, 0.62);
          vec3 col = mix(shallow, mid, smoothstep(0.1, 1.6, depth));
          col = mix(col, deep, smoothstep(1.5, 9.0, depth));
          // Caustic shimmer in the shallows.
          float ca = jn2(p * 0.9 + vec2(uTime * 0.21, uTime * 0.13)) * jn2(p * 1.3 - vec2(uTime * 0.17, -uTime * 0.11));
          col += vec3(0.16, 0.2, 0.16) * smoothstep(0.32, 0.6, ca) * (1.0 - smoothstep(0.2, 2.2, depth));
          // Rolling swell (darker troughs) out at sea.
          float swell = jf2(p * 0.045 + vec2(uTime * 0.02, uTime * 0.012));
          col *= 0.92 + 0.14 * swell;
          // Shoreline FOAM: bands that lap in toward the beach + a lacy rim.
          float lap = sin(depth * 9.0 - uTime * 1.6 + jn2(p * 0.25) * 6.0) * 0.5 + 0.5;
          float lace = jn2(p * 2.4 + uTime * 0.3);
          float foam = smoothstep(0.42, 0.0, depth) * (0.55 + 0.45 * lace);
          foam += smoothstep(0.85, 1.0, lap) * smoothstep(0.75, 0.1, depth) * 0.75 * lace;
          // White caps on the far swell.
          foam += smoothstep(0.76, 0.86, jn2(p * 0.18 + uTime * 0.05) * swell) * smoothstep(6.0, 14.0, depth) * 0.35;
          col = mix(col, vec3(0.96, 0.99, 1.0), clamp(foam, 0.0, 0.9));
          diffuseColor.rgb = col;
          // See the sand through the shallows; opaque out at sea.
          diffuseColor.a = clamp(mix(0.38, 0.97, smoothstep(0.05, 2.4, depth)) + foam * 0.5, 0.0, 1.0);
        }`
      )
      .replace(
        "#include <normal_fragment_maps>",
        /* glsl */ `#include <normal_fragment_maps>
        {
          vec2 q = vOW.xz;
          float e = 0.4;
          float t = uTime;
          float h0 = jn2(q * 0.55 + vec2(t * 0.35, t * 0.22)) + 0.5 * jn2(q * 1.4 - vec2(t * 0.4, -t * 0.3));
          float hx = jn2((q + vec2(e, 0.0)) * 0.55 + vec2(t * 0.35, t * 0.22)) + 0.5 * jn2((q + vec2(e, 0.0)) * 1.4 - vec2(t * 0.4, -t * 0.3));
          float hz = jn2((q + vec2(0.0, e)) * 0.55 + vec2(t * 0.35, t * 0.22)) + 0.5 * jn2((q + vec2(0.0, e)) * 1.4 - vec2(t * 0.4, -t * 0.3));
          vec3 pn = normalize(vec3(-(hx - h0) * 0.7, 1.0, -(hz - h0) * 0.7));
          normal = normalize((viewMatrix * vec4(pn, 0.0)).xyz);
        }`
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `#include <emissivemap_fragment>
        {
          // Sun sparkles dancing on the water.
          float sp = jn2(vOW.xz * 1.7 + vec2(uTime * 0.9, -uTime * 0.7)) * jn2(vOW.xz * 2.9 - vec2(uTime * 0.6, uTime * 0.8));
          float d = length(cameraPosition.xz - vOW.xz);
          totalEmissiveRadiance += vec3(1.0, 0.98, 0.9) * smoothstep(0.42, 0.55, sp) * 0.65 * smoothstep(260.0, 40.0, d);
        }`
      );
  };
  m.customProgramCacheKey = () => "island-ocean-v1";
  return m;
}

// ---------------------------------------------------------------------------
// Canvas textures.
// ---------------------------------------------------------------------------
function canvasTex(w, h, draw, { repeat = false, srgb = true, aniso = 8 } = {}) {
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
const rgb = (r, g, b, a = 1) => `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;

/** Rounded cobbles in warm sandstone (Main Street) — u across, v along. */
function drawCobble(g, w, h, { base = [196, 168, 128], mortar = "#7d6a52", seed = 3, cols = 7, rows = 14 } = {}) {
  const r = prand(seed);
  g.fillStyle = mortar; g.fillRect(0, 0, w, h);
  const cw = w / cols, chh = h / rows;
  for (let j = 0; j < rows; j++) {
    const off = (j % 2) * cw * 0.5;
    for (let i = -1; i <= cols; i++) {
      const x = i * cw + off + (r() - 0.5) * cw * 0.12, y = j * chh + (r() - 0.5) * chh * 0.12;
      const v = 0.8 + r() * 0.35;
      const tint = r() < 0.18 ? [0.86, 0.95, 1.05] : r() < 0.3 ? [1.08, 0.96, 0.88] : [1, 1, 1];
      g.fillStyle = rgb(base[0] * v * tint[0], base[1] * v * tint[1], base[2] * v * tint[2]);
      g.beginPath();
      g.roundRect(x + 2, y + 2, cw - 4, chh - 4, Math.min(cw, chh) * 0.32);
      g.fill();
      // A soft top-left highlight + bottom-right shade so each stone domes.
      const gr = g.createLinearGradient(x, y, x + cw, y + chh);
      gr.addColorStop(0, "rgba(255,255,255,0.18)"); gr.addColorStop(0.55, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,0,0.18)");
      g.fillStyle = gr; g.fill();
    }
  }
  // A little moss + grit in the joints.
  for (let k = 0; k < 900; k++) {
    g.fillStyle = r() < 0.5 ? "rgba(90,120,60,0.25)" : "rgba(60,48,36,0.25)";
    g.fillRect(r() * w, r() * h, 1.5, 1.5);
  }
}
/** A sandy footpath with soft edges, pebbles + grass at the verges. */
function drawSandPath(g, w, h, { base = "#d9c08f", edge = [98, 150, 62], seed = 11 } = {}) {
  const r = prand(seed);
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 3200; i++) {
    const x = r() * w, y = r() * h, s = 1 + r() * 2.2;
    g.fillStyle = r() < 0.5 ? "rgba(150,118,72,0.22)" : "rgba(255,240,205,0.25)";
    g.fillRect(x, y, s, s);
  }
  // Footworn middle (slightly darker, smoother).
  const mid = g.createLinearGradient(0, 0, w, 0);
  mid.addColorStop(0.2, "rgba(130,100,60,0)"); mid.addColorStop(0.5, "rgba(130,100,60,0.18)"); mid.addColorStop(0.8, "rgba(130,100,60,0)");
  g.fillStyle = mid; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    const x = r() * w, y = r() * h, rr = 1.5 + r() * 3.5;
    g.beginPath(); g.ellipse(x, y, rr, rr * 0.75, r() * 3, 0, Math.PI * 2);
    g.fillStyle = ["#c9b28a", "#a99a80", "#e2d3b2", "#9a8b72"][Math.floor(r() * 4)];
    g.fill();
  }
  const tuft = (x, y, len) => {
    g.strokeStyle = rgb(edge[0] + r() * 40, edge[1] + r() * 40, edge[2] + r() * 20, 0.9);
    g.lineWidth = 1.2 + r() * 1.4;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * len * 0.6, y - len); g.stroke();
  };
  for (let y = 0; y < h; y += 1.5) {
    for (const side of [0, 1]) for (let k = 0; k < 3; k++) tuft(side ? w * (1 - r() * r() * 0.13) : w * (r() * r() * 0.13), y, 6 + r() * 9);
  }
  // Soft fade at the edges (alpha) so the ribbon melts into the grass.
  const id = g.getImageData(0, 0, w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / (w - 1);
    const e = Math.min(u, 1 - u);
    const a = Math.min(1, e / 0.1);
    id.data[(y * w + x) * 4 + 3] = Math.round(255 * a);
  }
  g.putImageData(id, 0, 0);
}
/** Plaza paving: big pale flagstones in a radial-ish running bond. */
function drawPaving(g, w, h) {
  const r = prand(21);
  g.fillStyle = "#9c917e"; g.fillRect(0, 0, w, h);
  const n = 6;
  const cw = w / n, chh = h / n;
  for (let j = 0; j < n; j++) {
    const off = (j % 2) * cw * 0.5;
    for (let i = -1; i <= n; i++) {
      const v = 0.86 + r() * 0.2;
      g.fillStyle = rgb(232 * v, 222 * v, 200 * v);
      g.fillRect(i * cw + off + 2, j * chh + 2, cw - 4, chh - 4);
      for (let k = 0; k < 40; k++) {
        g.fillStyle = r() < 0.5 ? "rgba(120,104,80,0.12)" : "rgba(255,255,255,0.12)";
        g.fillRect(i * cw + off + r() * cw, j * chh + r() * chh, 2, 2);
      }
    }
  }
}
/** Dressed stone blocks (ashlar) for walls, the arch, the plinths. */
function drawAshlar(g, w, h, { base = [206, 190, 160], seed = 31, rows = 6, cols = 4 } = {}) {
  const r = prand(seed);
  g.fillStyle = "#6f6352"; g.fillRect(0, 0, w, h);
  const bh = h / rows;
  for (let j = 0; j < rows; j++) {
    const bw = w / cols;
    const off = (j % 2) * bw * 0.5;
    for (let i = -1; i <= cols; i++) {
      const v = 0.82 + r() * 0.26;
      g.fillStyle = rgb(base[0] * v, base[1] * v, base[2] * v);
      g.fillRect(i * bw + off + 2.5, j * bh + 2.5, bw - 5, bh - 5);
      const gr = g.createLinearGradient(0, j * bh, 0, (j + 1) * bh);
      gr.addColorStop(0, "rgba(255,255,255,0.14)"); gr.addColorStop(1, "rgba(0,0,0,0.12)");
      g.fillStyle = gr; g.fillRect(i * bw + off + 2.5, j * bh + 2.5, bw - 5, bh - 5);
    }
  }
  for (let k = 0; k < 600; k++) {
    g.fillStyle = r() < 0.6 ? "rgba(80,70,55,0.18)" : "rgba(110,140,70,0.16)";
    g.fillRect(r() * w, r() * h, 2, 2);
  }
}
/** Sun-bleached planks (jetty, bridge), u across. */
function drawPlanks(g, w, h, { base = [176, 138, 92], boards = 6, seed = 41 } = {}) {
  const r = prand(seed);
  g.fillStyle = "#4a3523"; g.fillRect(0, 0, w, h);
  const bh = h / boards;
  for (let j = 0; j < boards; j++) {
    const v = 0.85 + r() * 0.25;
    g.fillStyle = rgb(base[0] * v, base[1] * v, base[2] * v);
    g.fillRect(0, j * bh + 2, w, bh - 4);
    for (let k = 0; k < 10; k++) {
      g.strokeStyle = `rgba(80,52,30,${0.1 + r() * 0.14})`;
      g.lineWidth = 1;
      const y = j * bh + 4 + r() * (bh - 8);
      g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 2, w * 0.7, y - 2, w, y + 1); g.stroke();
    }
    for (const x of [w * 0.12, w * 0.88]) {
      g.fillStyle = "rgba(40,30,20,0.6)";
      g.beginPath(); g.arc(x, j * bh + bh / 2, 2.2, 0, Math.PI * 2); g.fill();
    }
  }
}
/** Terracotta roof tiles (rows of curved tiles), u across, v down the slope. */
function drawRoofTiles(g, w, h, { base = [200, 92, 60], seed = 51 } = {}) {
  const r = prand(seed);
  g.fillStyle = rgb(base[0] * 0.55, base[1] * 0.55, base[2] * 0.55); g.fillRect(0, 0, w, h);
  const rows = 8, cols = 8;
  const tw = w / cols, th = h / rows;
  for (let j = 0; j < rows; j++) {
    for (let i = -1; i <= cols; i++) {
      const x = i * tw + (j % 2) * tw * 0.5;
      const v = 0.85 + r() * 0.25;
      const gr = g.createLinearGradient(x, 0, x + tw, 0);
      gr.addColorStop(0, rgb(base[0] * v * 0.75, base[1] * v * 0.75, base[2] * v * 0.75));
      gr.addColorStop(0.45, rgb(base[0] * v * 1.08, base[1] * v * 1.08, base[2] * v * 1.08));
      gr.addColorStop(1, rgb(base[0] * v * 0.7, base[1] * v * 0.7, base[2] * v * 0.7));
      g.fillStyle = gr;
      g.beginPath();
      g.roundRect(x + 1, j * th, tw - 2, th + 2, [0, 0, tw * 0.4, tw * 0.4]);
      g.fill();
    }
  }
}
/** Whitewashed plaster with a little texture. */
function drawPlaster(g, w, h) {
  const r = prand(61);
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.035)" : "rgba(255,255,255,0.4)";
    g.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3);
  }
}
/** Weatherboards (horizontal), white base (tinted by the material colour). */
function drawWeatherboard(g, w, h) {
  const r = prand(71);
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h);
  const n = 12, bh = h / n;
  for (let j = 0; j < n; j++) {
    const gr = g.createLinearGradient(0, j * bh, 0, (j + 1) * bh);
    gr.addColorStop(0, "rgba(0,0,0,0.0)"); gr.addColorStop(0.85, "rgba(0,0,0,0.05)"); gr.addColorStop(1, "rgba(0,0,0,0.22)");
    g.fillStyle = gr; g.fillRect(0, j * bh, w, bh);
  }
  for (let i = 0; i < 500; i++) { g.fillStyle = "rgba(0,0,0,0.04)"; g.fillRect(r() * w, r() * h, 3, 1); }
}

let _tex = null;
export function getIslandTextures() {
  if (_tex) return _tex;
  if (typeof document === "undefined") return {};
  const rep = (t, x, y) => { if (t) t.repeat.set(x, y); return t; };
  _tex = {
    cobble: canvasTex(256, 512, (g, w, h) => drawCobble(g, w, h), { repeat: true }),
    sandPath: canvasTex(128, 256, (g, w, h) => drawSandPath(g, w, h), { repeat: true }),
    snowPath: canvasTex(128, 256, (g, w, h) => drawSandPath(g, w, h, { base: "#eef3fb", edge: [200, 214, 232], seed: 13 }), { repeat: true }),
    ashPath: canvasTex(128, 256, (g, w, h) => drawSandPath(g, w, h, { base: "#5f5551", edge: [70, 62, 58], seed: 17 }), { repeat: true }),
    paving: canvasTex(512, 512, drawPaving, { repeat: true }),
    ashlar: canvasTex(256, 256, (g, w, h) => drawAshlar(g, w, h), { repeat: true }),
    ashlarDark: canvasTex(256, 256, (g, w, h) => drawAshlar(g, w, h, { base: [150, 140, 126], seed: 33 }), { repeat: true }),
    planks: canvasTex(256, 256, (g, w, h) => drawPlanks(g, w, h), { repeat: true }),
    roof: canvasTex(256, 256, (g, w, h) => drawRoofTiles(g, w, h, { base: [255, 255, 255] }), { repeat: true }),
    plaster: canvasTex(256, 256, drawPlaster, { repeat: true }),
    weatherboard: canvasTex(256, 256, drawWeatherboard, { repeat: true }),
  };
  rep(_tex.paving, 1, 1);
  return _tex;
}

/** A painted wooden sign board (lines of text) as a texture. */
export function islandSignTexture(lines, { w = 512, h = 160, bg = "#2f5d8a", fg = "#fff7e0", border = "#1d3d5c", font = "900 64px 'MMA Display', 'Trebuchet MS', sans-serif", sub = "700 34px 'MMA Rounded', 'Trebuchet MS', sans-serif" } = {}) {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const g = cv.getContext("2d");
  g.fillStyle = border; g.fillRect(0, 0, w, h);
  g.fillStyle = bg; g.beginPath(); g.roundRect(10, 10, w - 20, h - 20, 18); g.fill();
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
  const arr = Array.isArray(lines) ? lines : [lines];
  arr.forEach((ln, i) => {
    g.font = i === 0 ? font : sub;
    const y = arr.length === 1 ? h / 2 : h * (0.38 + i * 0.36);
    g.fillText(ln, w / 2, y + 2);
  });
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const _flat = new Map();
/** A cached plain material (keeps StaticBatch merging + shader count low). */
export function islandFlat(color, { roughness = 0.85, metalness = 0, map = null, emissive = null, emissiveIntensity = 1, side = THREE.FrontSide, transparent = false, opacity = 1, flat = false, toneMapped = true } = {}) {
  const k = `${color}|${roughness}|${metalness}|${map ? map.uuid : "-"}|${emissive}|${emissiveIntensity}|${side}|${transparent}|${opacity}|${flat}|${toneMapped}`;
  if (_flat.has(k)) return _flat.get(k);
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color), roughness, metalness, map, side, transparent, opacity, flatShading: flat, toneMapped,
    emissive: emissive ? new THREE.Color(emissive) : new THREE.Color(0, 0, 0), emissiveIntensity: emissive ? emissiveIntensity : 0,
  });
  _flat.set(k, m);
  return m;
}
