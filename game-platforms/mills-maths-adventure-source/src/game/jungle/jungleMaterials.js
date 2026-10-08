/**
 * EMERALD JUNGLE — shared materials + procedural canvas textures (no image
 * files). One clock uniform animates everything that moves on its own: the
 * foliage's wind sway, the water's ripples + flow, the waterfall's streaks,
 * the sunbeams.
 *
 *   makeTerrainMaterial  vertex-coloured ground + a world-space shader that
 *                        turns steep faces into mossy layered ROCK and mottles
 *                        the grass so it never looks like flat paint
 *   makeFoliageMaterial  vertex colours × per-instance tint + gentle wind sway
 *                        (attribute aSway: 0 at the roots → 1 at leaf tips)
 *   makeWaterMaterial    clear teal water: flowing ripples, glints, shallow
 *                        edges, foam where it meets the banks
 *   makeFallsMaterial    the waterfall curtain: fast white streaks
 */
import * as THREE from "three";

export const jungleClock = { uTime: { value: 0 } };

// Small GLSL noise kit shared by every shader below.
export const JNOISE = /* glsl */ `
float jh2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float jh3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float jn2(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(jh2(i), jh2(i + vec2(1.0, 0.0)), u.x), mix(jh2(i + vec2(0.0, 1.0)), jh2(i + vec2(1.0, 1.0)), u.x), u.y);
}
float jn3(vec3 p){
  vec3 i = floor(p), f = fract(p); vec3 u = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(jh3(i), jh3(i + vec3(1,0,0)), u.x), mix(jh3(i + vec3(0,1,0)), jh3(i + vec3(1,1,0)), u.x), u.y);
  float b = mix(mix(jh3(i + vec3(0,0,1)), jh3(i + vec3(1,0,1)), u.x), mix(jh3(i + vec3(0,1,1)), jh3(i + vec3(1,1,1)), u.x), u.y);
  return mix(a, b, u.z);
}
float jf2(vec2 p){ return 0.55 * jn2(p) + 0.3 * jn2(p * 2.07 + 13.1) + 0.15 * jn2(p * 4.13 + 7.7); }
`;

// ---------------------------------------------------------------------------
// TERRAIN
// ---------------------------------------------------------------------------
export function makeTerrainMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vJW;\nvarying vec3 vJN;")
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvJW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvJN = normalize(mat3(modelMatrix) * objectNormal);"
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vJW;\nvarying vec3 vJN;\n${JNOISE}`)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        {
          vec3 wp = vJW;
          float steep = 1.0 - clamp(vJN.y, 0.0, 1.0);
          // Grass: two scales of mottling + tiny speckle so it reads as turf.
          float m1 = jf2(wp.xz * 0.11);
          float m2 = jn2(wp.xz * 0.9);
          diffuseColor.rgb *= 0.86 + 0.2 * m1 + 0.08 * (m2 - 0.5);
          // Rock on steep faces: layered strata, cool grey-brown, moss in
          // the ledges and a little green drip down the face.
          float rockMix = smoothstep(0.30, 0.52, steep);
          float n3 = jn3(wp * 0.33);
          float strata = 0.5 + 0.5 * sin(wp.y * 2.1 + n3 * 5.0 + jn2(wp.xz * 0.05) * 9.0);
          vec3 rock = mix(vec3(0.43, 0.41, 0.36), vec3(0.30, 0.29, 0.27), n3);
          rock *= 0.82 + 0.22 * strata;
          float ledge = smoothstep(0.6, 0.95, strata) * smoothstep(0.35, 0.75, jn3(wp * 0.5 + 4.0));
          rock = mix(rock, vec3(0.25, 0.40, 0.16), ledge * 0.75);
          rock = mix(rock, vec3(0.22, 0.34, 0.15), smoothstep(0.62, 0.82, jn3(vec3(wp.x * 0.25, wp.y * 0.06, wp.z * 0.25))) * 0.6);
          // Out on the rim mountains the faces are mostly mossy + ferny:
          // only the very steepest bits show bare rock.
          float rq = length(vec2(wp.x / 128.0, wp.z / 168.0));
          float rim = smoothstep(1.0, 1.1, rq);
          vec3 mossy = mix(vec3(0.20, 0.36, 0.14), vec3(0.30, 0.44, 0.19), jn3(wp * 0.21));
          rock = mix(rock, mossy, rim * (1.0 - smoothstep(0.72, 0.9, steep)));
          diffuseColor.rgb = mix(diffuseColor.rgb, rock, rockMix);
        }`
      );
  };
  m.customProgramCacheKey = () => "jungle-terrain-v1";
  return m;
}

// ---------------------------------------------------------------------------
// FOLIAGE (trees, palms, ferns, bushes, plants) — wind sway
// ---------------------------------------------------------------------------
const _foliage = new Map();
/**
 * `map` here is a white-on-transparent leaf SHAPE: it's used as the alphaMap
 * (cut-out) so the colour comes purely from the vertex colours — no dark
 * fringes from the canvas's transparent-black edges. `leafy` adds a
 * world-space leaf mottling to the canopy (aSway > 0.45) so the big crowns
 * read as masses of leaves rather than smooth blobs.
 */
export function makeFoliageMaterial({ sway = 1, map = null, alphaTest = 0, side = THREE.FrontSide, roughness = 0.85, emissive = null, flat = false, leafy = false, key = "" } = {}) {
  const ck = `${sway}-${map ? map.uuid : "-"}-${alphaTest}-${side}-${roughness}-${emissive}-${flat}-${leafy}-${key}`;
  if (_foliage.has(ck)) return _foliage.get(ck);
  const m = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness, metalness: 0, alphaMap: map, alphaTest, side, flatShading: flat,
    emissive: emissive ? new THREE.Color(emissive) : new THREE.Color(0, 0, 0),
    emissiveIntensity: emissive ? 1 : 0,
  });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = jungleClock.uTime;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;\nattribute float aSway;\nvarying vec3 vLeafW;\nvarying float vLeafS;")
      .replace(
        "#include <begin_vertex>",
        /* glsl */ `#include <begin_vertex>
        {
          #ifdef USE_INSTANCING
            vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          #else
            vec3 ip = vec3(modelMatrix[3][0], modelMatrix[3][1], modelMatrix[3][2]);
          #endif
          float ph = ip.x * 0.37 + ip.z * 0.23;
          float w = sin(uTime * 1.1 + ph) * 0.6 + sin(uTime * 2.3 + ph * 1.7) * 0.25 + sin(uTime * 5.1 + position.y * 2.0 + ph) * 0.08;
          float s = aSway * ${(0.16 * sway).toFixed(3)};
          transformed.x += w * s;
          transformed.z += cos(uTime * 0.9 + ph) * s * 0.55;
          vLeafS = aSway;
          #ifdef USE_INSTANCING
            vLeafW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
          #else
            vLeafW = (modelMatrix * vec4(transformed, 1.0)).xyz;
          #endif
        }`
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vLeafW;\nvarying float vLeafS;\n${JNOISE}`);
    if (side === THREE.DoubleSide) {
      // Thin two-sided leaves: light BOTH faces as if they face the sky
      // (three flips a back face's normal, which turned leaves black).
      sh.fragmentShader = sh.fragmentShader.replace(
        "#include <normal_fragment_begin>",
        /* glsl */ `#include <normal_fragment_begin>
        {
          vec3 upV = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
          vec3 n0 = normalize(vNormal);
          if (dot(n0, upV) < 0.0) n0 = -n0;
          normal = normalize(mix(n0, upV, 0.45));
        }`
      );
    }
    if (leafy) {
      sh.fragmentShader = sh.fragmentShader.replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        if (vLeafS > 0.45) {
          float n = jn3(vLeafW * 1.7) * 0.55 + jn3(vLeafW * 4.1 + 3.0) * 0.45;
          diffuseColor.rgb *= 0.74 + 0.48 * n;
          float sp = smoothstep(0.78, 0.92, jn3(vLeafW * 6.5));
          diffuseColor.rgb += vec3(0.035, 0.05, 0.012) * sp;
        }`
      );
    }
  };
  m.customProgramCacheKey = () => `jungle-foliage-${ck}`;
  _foliage.set(ck, m);
  return m;
}

// ---------------------------------------------------------------------------
// WATER
// ---------------------------------------------------------------------------
// Attributes: aFlow (u across 0..1, v along in metres), aSpeed (m/s).
export function makeWaterMaterial({ still = false } = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#2f8c84"), roughness: 0.08, metalness: 0.05,
    transparent: true, opacity: 0.84, depthWrite: false,
  });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = jungleClock.uTime;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 aFlow;\nattribute float aSpeed;\nvarying vec2 vFlow;\nvarying float vSpeed;\nvarying vec3 vWW;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvFlow = aFlow;\nvSpeed = aSpeed;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform float uTime;\nvarying vec2 vFlow;\nvarying float vSpeed;\nvarying vec3 vWW;\n${JNOISE}`)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        float edge = abs(vFlow.x - 0.5) * 2.0;
        // Shallow edges: warmer + clearer; the deep middle a richer teal.
        diffuseColor.rgb = mix(vec3(0.13, 0.42, 0.42), vec3(0.42, 0.56, 0.36), smoothstep(0.55, 1.0, edge));
        float flowV = vFlow.y - uTime * vSpeed;
        float streak = jn2(vec2(vFlow.x * 7.0, flowV * 0.55)) * jn2(vec2(vFlow.x * 3.0 + 4.0, flowV * 0.21));
        float rip = jf2(vWW.xz * 0.6 + vec2(uTime * 0.13, -uTime * 0.09));
        // Foam: where it meets the banks + bright streaks in the current.
        float foam = smoothstep(0.82, 1.0, edge) * smoothstep(0.35, 0.7, jn2(vec2(vFlow.x * 11.0, flowV * 1.3)));
        foam += smoothstep(0.42, 0.58, streak) * 0.35 * smoothstep(0.2, 1.0, vSpeed);
        diffuseColor.rgb += vec3(0.08, 0.1, 0.09) * (rip - 0.5);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.97, 0.96), clamp(foam, 0.0, 0.85));
        diffuseColor.a = mix(0.78, 0.94, clamp(foam + (1.0 - edge) * 0.25, 0.0, 1.0));`
      )
      .replace(
        "#include <normal_fragment_maps>",
        /* glsl */ `#include <normal_fragment_maps>
        {
          float fv = vFlow.y - uTime * vSpeed * 1.1;
          vec2 q = vWW.xz;
          float e = 0.35;
          float h0 = jn2(vec2(q.x * 1.3, fv * 1.6)) + jn2(q * 2.7 + uTime * 0.35) * 0.5;
          float hx = jn2(vec2((q.x + e) * 1.3, fv * 1.6)) + jn2((q + vec2(e, 0.0)) * 2.7 + uTime * 0.35) * 0.5;
          float hz = jn2(vec2(q.x * 1.3, (fv + e) * 1.6)) + jn2((q + vec2(0.0, e)) * 2.7 + uTime * 0.35) * 0.5;
          vec3 pn = normalize(vec3(-(hx - h0) * 0.9, 1.0, -(hz - h0) * 0.9));
          normal = normalize((viewMatrix * vec4(pn, 0.0)).xyz);
        }`
      );
  };
  m.customProgramCacheKey = () => `jungle-water-${still}`;
  return m;
}

// ---------------------------------------------------------------------------
// WATERFALL CURTAIN (aFlow: u across, v down in metres)
// ---------------------------------------------------------------------------
export function makeFallsMaterial({ speed = 5.5, opacity = 0.92 } = {}) {
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = jungleClock.uTime;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 aFlow;\nvarying vec2 vFlow;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvFlow = aFlow;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform float uTime;\nvarying vec2 vFlow;\n${JNOISE}`)
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        /* glsl */ `
        float v = vFlow.y * 0.42 - uTime * ${(speed / 2.4).toFixed(3)};
        float a = jn2(vec2(vFlow.x * 9.0, v)) * 0.6 + jn2(vec2(vFlow.x * 23.0, v * 2.3)) * 0.4;
        float edge = smoothstep(0.0, 0.12, vFlow.x) * smoothstep(1.0, 0.88, vFlow.x);
        vec3 col = mix(vec3(0.55, 0.78, 0.82), vec3(0.97, 1.0, 1.0), smoothstep(0.35, 0.75, a));
        float alpha = (0.45 + 0.55 * smoothstep(0.25, 0.65, a)) * edge * opacity;
        vec4 diffuseColor = vec4(col, alpha);`
      );
  };
  m.customProgramCacheKey = () => `jungle-falls-${speed}-${opacity}`;
  return m;
}

// ---------------------------------------------------------------------------
// SUNBEAM (god-ray shafts): additive, soft, fades near the camera.
// ---------------------------------------------------------------------------
export function makeSunbeamMaterial() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: jungleClock.uTime, uColor: { value: new THREE.Color("#fff3c4") }, uOpacity: { value: 0.12 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vBW; varying float vSeed;
      attribute float aSeed;
      void main(){
        vUv = uv; vSeed = aSeed;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vBW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uColor; uniform float uOpacity;
      varying vec2 vUv; varying vec3 vBW; varying float vSeed;
      ${JNOISE}
      void main(){
        float across = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
        float along = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
        float dust = 0.75 + 0.25 * jn2(vec2(vUv.x * 6.0 + vSeed * 9.0, vUv.y * 3.0 - uTime * 0.12));
        float pulse = 0.8 + 0.2 * sin(uTime * 0.6 + vSeed * 6.28);
        // Per-FRAGMENT distance, so a beam right beside the camera fades out
        // instead of washing the screen.
        float d = distance(vBW, cameraPosition);
        float near = smoothstep(10.0, 28.0, d) * (1.0 - smoothstep(120.0, 190.0, d));
        gl_FragColor = vec4(uColor * across * along * dust * pulse * uOpacity * near, 1.0);
      }`,
  });
  return m;
}

// ---------------------------------------------------------------------------
// Canvas textures (alpha cut-outs for leaves, fronds, path dirt, planks…).
// ---------------------------------------------------------------------------
function canvasTex(w, h, draw, { repeat = false, srgb = true } = {}) {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const g = cv.getContext("2d");
  draw(g, w, h);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function prand(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// A fern frond (pointing UP the texture): central rib + paired leaflets.
function drawFern(g, w, h) {
  g.clearRect(0, 0, w, h);
  const cx = w / 2;
  g.strokeStyle = "#ffffff";
  g.lineWidth = 3;
  g.beginPath(); g.moveTo(cx, h); g.lineTo(cx, 4); g.stroke();
  const n = 16;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const y = h - 8 - t * (h - 16);
    const len = (w * 0.46) * Math.sin(Math.PI * (0.12 + t * 0.88)) * (1 - t * 0.35);
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(cx, y);
      g.quadraticCurveTo(cx + s * len * 0.6, y - 10, cx + s * len, y - 16 - t * 6);
      g.quadraticCurveTo(cx + s * len * 0.55, y + 4, cx, y + 6);
      g.fillStyle = "#ffffff";
      g.fill();
    }
  }
}
// A palm frond: a solid rib band + broad, overlapping leaflets (thick enough
// that the cut-out survives mip-mapping at a distance).
function drawPalm(g, w, h) {
  g.clearRect(0, 0, w, h);
  const cx = w / 2;
  g.fillStyle = "#ffffff";
  g.fillRect(cx - 7, 0, 14, h);
  const n = 26;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const y = h - 4 - t * (h - 10);
    const len = w * 0.5 * Math.sin(Math.PI * (0.1 + t * 0.88));
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(cx, y + 12);
      g.quadraticCurveTo(cx + s * len * 0.5, y - 2, cx + s * len, y - 26);
      g.lineTo(cx + s * len * 0.9, y - 12);
      g.quadraticCurveTo(cx + s * len * 0.45, y + 10, cx, y + 24);
      g.closePath();
      g.fill();
    }
  }
}
// A big heart-shaped / split leaf (monstera-ish), stem at the bottom.
function drawBigLeaf(g, w, h) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.moveTo(w / 2, h - 4);
  g.bezierCurveTo(w * 0.02, h * 0.75, w * 0.02, h * 0.18, w / 2, 4);
  g.bezierCurveTo(w * 0.98, h * 0.18, w * 0.98, h * 0.75, w / 2, h - 4);
  g.fill();
  // Splits (monstera fenestration).
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 5; i++) {
    const y = h * (0.28 + i * 0.12);
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(w / 2 + s * w * 0.14, y);
      g.lineTo(w / 2 + s * w * 0.5, y - h * 0.05);
      g.lineTo(w / 2 + s * w * 0.5, y - h * 0.02);
      g.lineTo(w / 2 + s * w * 0.16, y + h * 0.03);
      g.fill();
    }
  }
  g.globalCompositeOperation = "source-over";
}
// A clump of grass blades.
function drawGrass(g, w, h) {
  g.clearRect(0, 0, w, h);
  const r = prand(7);
  for (let i = 0; i < 22; i++) {
    const x = w * (0.08 + r() * 0.84);
    const top = h * (0.05 + r() * 0.4);
    const bend = (r() - 0.5) * w * 0.25;
    const bw = 3 + r() * 4;
    g.beginPath();
    g.moveTo(x - bw, h);
    g.quadraticCurveTo(x + bend * 0.3, (h + top) / 2, x + bend, top);
    g.quadraticCurveTo(x + bend * 0.3 + 1, (h + top) / 2, x + bw, h);
    const shade = 200 + Math.floor(r() * 55);
    g.fillStyle = `rgb(${shade},${shade},${shade})`;
    g.fill();
  }
}
// Hanging vine strip: a stem with little leaves both sides.
function drawVine(g, w, h) {
  g.clearRect(0, 0, w, h);
  const r = prand(19);
  g.strokeStyle = "#ffffff"; g.lineWidth = 3;
  g.beginPath();
  for (let y = 0; y <= h; y += 8) {
    const x = w / 2 + Math.sin(y * 0.05) * 3;
    y ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.stroke();
  g.fillStyle = "#ffffff";
  for (let y = 6; y < h; y += 12 + r() * 6) {
    const s = r() < 0.5 ? -1 : 1;
    const x = w / 2 + Math.sin(y * 0.05) * 3;
    g.beginPath();
    g.ellipse(x + s * 8, y, 9, 4.5, s * 0.6, 0, Math.PI * 2);
    g.fill();
  }
}
function drawDirt(g, w, h, { seed = 3, base = "#8a6b45", stones = true, border = true } = {}) {
  const r = prand(seed);
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const x = r() * w, y = r() * h, s = 1 + r() * 3;
    const v = r();
    g.fillStyle = v < 0.5 ? "rgba(60,40,22,0.25)" : "rgba(190,160,110,0.22)";
    g.fillRect(x, y, s, s);
  }
  if (stones) {
    for (let i = 0; i < 26; i++) {
      const x = r() * w, y = r() * h, rr = 4 + r() * 9;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        g.beginPath();
        g.ellipse(x + ox, y + oy, rr, rr * (0.6 + r() * 0.3), r() * 3, 0, Math.PI * 2);
        g.fillStyle = ["#a29380", "#8f816f", "#b3a48e", "#7d705f"][Math.floor(r() * 4)];
        g.fill();
        g.strokeStyle = "rgba(40,30,20,0.35)"; g.lineWidth = 1.5; g.stroke();
      }
    }
  }
  if (border) {
    // Grassy fringe along both long edges (u = 0 and u = 1).
    const bw = w * 0.13;
    for (let y = 0; y < h; y += 2) {
      for (const side of [0, 1]) {
        const len = bw * (0.4 + r() * 0.9);
        g.fillStyle = `rgba(${70 + r() * 40},${120 + r() * 50},${40 + r() * 20},0.9)`;
        if (side === 0) g.fillRect(0, y, len, 2); else g.fillRect(w - len, y, len, 2);
      }
    }
  }
}
function drawStoneBlocks(g, w, h, { seed = 5, moss = 0.35 } = {}) {
  const r = prand(seed);
  g.fillStyle = "#4d4a40"; g.fillRect(0, 0, w, h);
  const rows = 4;
  for (let j = 0; j < rows; j++) {
    const y = (j / rows) * h;
    let x = j % 2 ? -w / 6 : 0;
    while (x < w) {
      const bw = w * (0.24 + r() * 0.16);
      const v = 0.85 + r() * 0.25;
      g.fillStyle = `rgb(${Math.round(150 * v)},${Math.round(146 * v)},${Math.round(128 * v)})`;
      g.fillRect(x + 2, y + 2, bw - 4, h / rows - 4);
      // Weathering speckle.
      for (let k = 0; k < 30; k++) {
        g.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.08)" : "rgba(255,255,240,0.07)";
        g.fillRect(x + r() * bw, y + r() * (h / rows), 2 + r() * 3, 2 + r() * 3);
      }
      x += bw;
    }
  }
  // Moss creeping down from the tops of blocks.
  for (let k = 0; k < 140 * moss; k++) {
    const x = r() * w, y = Math.floor(r() * rows) * (h / rows) + 2;
    const len = 4 + r() * (h / rows) * 0.6;
    g.fillStyle = `rgba(${60 + r() * 30},${110 + r() * 40},${40 + r() * 20},0.8)`;
    g.beginPath(); g.ellipse(x, y + len / 2, 3 + r() * 6, len / 2, 0, 0, Math.PI * 2); g.fill();
  }
}
function drawPlanks(g, w, h) {
  const r = prand(4);
  g.fillStyle = "#2a1a10"; g.fillRect(0, 0, w, h);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const y = (i / n) * h;
    const shade = 0.85 + r() * 0.3;
    g.fillStyle = `rgb(${Math.round(146 * shade)},${Math.round(104 * shade)},${Math.round(64 * shade)})`;
    g.fillRect(2, y + 3, w - 4, h / n - 6);
    g.strokeStyle = "rgba(70,40,20,0.35)";
    for (let k = 0; k < 4; k++) { g.beginPath(); const yy = y + 6 + r() * (h / n - 12); g.moveTo(4, yy); g.lineTo(w - 4, yy + (r() - 0.5) * 4); g.stroke(); }
    g.fillStyle = "#3a3a3a";
    [0.08, 0.92].forEach((fx) => { g.beginPath(); g.arc(w * fx, y + h / n / 2, 3, 0, 6.3); g.fill(); });
  }
}
function drawBark(g, w, h, { base = [116, 70, 48], seed = 9 } = {}) {
  const r = prand(seed);
  g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    const x = r() * w;
    const v = 0.6 + r() * 0.5;
    g.strokeStyle = `rgba(${Math.round(base[0] * v * 0.6)},${Math.round(base[1] * v * 0.6)},${Math.round(base[2] * v * 0.6)},0.7)`;
    g.lineWidth = 1 + r() * 3;
    g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y <= h; y += 16) g.lineTo(x + Math.sin(y * 0.05 + i) * 3, y);
    g.stroke();
  }
}
function drawGlow(g, w, h, inner = "rgba(255,255,220,1)", mid = "rgba(255,240,150,0.6)") {
  const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.35, mid);
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
}

let _tex = null;
export function getJungleTextures() {
  if (_tex) return _tex;
  const leafOpts = { srgb: true };
  _tex = {
    fern: canvasTex(128, 256, drawFern, leafOpts),
    palm: canvasTex(128, 512, drawPalm, leafOpts),
    bigleaf: canvasTex(256, 256, drawBigLeaf, leafOpts),
    grass: canvasTex(128, 128, drawGrass, leafOpts),
    vine: canvasTex(32, 256, drawVine, leafOpts),
    path: canvasTex(256, 256, (g, w, h) => drawDirt(g, w, h, { seed: 5 }), { repeat: true }),
    plaza: canvasTex(256, 256, (g, w, h) => drawDirt(g, w, h, { seed: 11, base: "#8d7650", border: false }), { repeat: true }),
    stone: canvasTex(256, 256, (g, w, h) => drawStoneBlocks(g, w, h, { seed: 5, moss: 0.5 }), { repeat: true }),
    stoneMossy: canvasTex(256, 256, (g, w, h) => drawStoneBlocks(g, w, h, { seed: 17, moss: 1.2 }), { repeat: true }),
    planks: canvasTex(256, 256, drawPlanks, { repeat: true }),
    bark: canvasTex(128, 256, (g, w, h) => drawBark(g, w, h), { repeat: true }),
    redBark: canvasTex(128, 256, (g, w, h) => drawBark(g, w, h, { base: [138, 66, 42], seed: 21 }), { repeat: true }),
    glow: canvasTex(64, 64, (g, w, h) => drawGlow(g, w, h)),
    mist: canvasTex(128, 128, (g, w, h) => drawGlow(g, w, h, "rgba(255,255,255,0.9)", "rgba(255,255,255,0.45)")),
  };
  return _tex;
}
