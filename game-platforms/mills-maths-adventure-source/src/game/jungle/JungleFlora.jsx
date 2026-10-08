import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { getJungleProps } from "../../data/jungle/jungleProps.js";
import {
  GRID, getJungleGrid, rimCoords, nearestPath, waterEdgeDist, slopeAt, JUNGLE_SPOTS, ARRIVAL_GLADE,
  TEMPLE_ANCHOR, GREAT_TREE, fbm, vnoise, smoothstep, escarpZ, PLATEAU_H, ensureJungleStructures,
  structureTopAt, terrainHeight,
} from "../../data/jungle/jungleLayout.js";
import {
  buildFern, buildBush, buildBigLeaf, buildFlowers, buildMushrooms, buildReeds, buildRock, buildLily,
  buildLog, buildStump, buildGrassTuft,
} from "./jungleGeometry.js";
import { makeFoliageMaterial, getJungleTextures, jungleClock, JNOISE } from "./jungleMaterials.js";
import { playerState } from "../sessionStore.js";
import InstancedChunks from "./InstancedChunks.jsx";

/**
 * JUNGLE FLORA — the undergrowth that makes it feel lush: a GPU grass field
 * that follows the player (blades bend away as you walk through), ferns,
 * bushes, big monstera/elephant-ear leaves, flower clumps, mushrooms (the
 * glade's glow), reeds at the water's edge, mossy boulders, lily pads,
 * fallen logs and stumps. Small things only draw near the camera.
 */
const tintGreen = (it, c) => c.setRGB(0.88 + 0.2 * it.tint, 0.95 + 0.07 * it.tint, 0.84 + 0.12 * (1 - it.tint));
const tintPlain = (it, c) => c.setRGB(0.9 + 0.15 * it.tint, 0.9 + 0.15 * it.tint, 0.9 + 0.15 * it.tint);

export default function JungleFlora({ highGfx }) {
  const P = useMemo(() => getJungleProps(), []);
  const tex = getJungleTextures();
  const mats = useMemo(() => ({
    fern: makeFoliageMaterial({ sway: 0.9, map: tex.fern, alphaTest: 0.45, side: THREE.DoubleSide, key: "fern" }),
    leaf: makeFoliageMaterial({ sway: 0.8, map: tex.bigleaf, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.55, key: "bigleaf" }),
    soft: makeFoliageMaterial({ sway: 0.5, leafy: true, key: "soft" }),
    stiff: makeFoliageMaterial({ sway: 0, key: "stiff", roughness: 0.92 }),
    rock: makeFoliageMaterial({ sway: 0, key: "rock", roughness: 0.95, flat: true }),
    reed: makeFoliageMaterial({ sway: 1.2, side: THREE.DoubleSide, key: "reed" }),
    glow: makeFoliageMaterial({ sway: 0, key: "glowshroom", emissive: "#1e7fa8" }),
    lily: makeFoliageMaterial({ sway: 0, side: THREE.DoubleSide, key: "lily", roughness: 0.4 }),
  }), [tex]);
  const geos = useMemo(() => ({
    fern: [buildFern(1), buildFern(7)],
    bush: [buildBush(2), buildBush(5)],
    bigleaf: [buildBigLeaf(3), buildBigLeaf(9)],
    flowers: [0, 1, 2, 3, 4, 5].map((v) => buildFlowers(10 + v, v)),
    mush: { red: buildMushrooms(4, "red"), brown: buildMushrooms(6, "brown"), glow: buildMushrooms(8, "glow") },
    reeds: buildReeds(3),
    rock: [buildRock(1), buildRock(4), buildRock(9)],
    lily: buildLily(1, false),
    lilyFlower: buildLily(2, true),
    log: buildLog(3),
    stump: buildStump(2),
  }), []);
  const parts = useMemo(() => {
    const by = (arr, n, key = "tint") => {
      const out = Array.from({ length: n }, () => []);
      arr.forEach((it, i) => out[Math.min(n - 1, Math.floor(((it[key] * 7.31 + i * 0.37) % 1) * n))].push(it));
      return out;
    };
    const ferns = highGfx ? P.ferns : P.ferns.filter((_, i) => i % 2 === 0);
    const mush = { red: [], brown: [], glow: [] };
    P.mushrooms.forEach((m, i) => (m.glow ? (i % 3 === 0 ? mush.red : mush.glow) : i % 2 ? mush.red : mush.brown).push(m));
    return {
      ferns: by(ferns, 2),
      bushes: by(P.bushes, 2),
      bigleaf: by(P.bigleaf, 2),
      flowers: by(P.flowers, 6),
      mush,
      rocks: by(P.rocks.map((r) => ({ ...r, sy: r.steep ? 1.3 : 1, rx: (r.tint - 0.5) * 0.4 })), 3),
      lilies: P.lilies.filter((l) => !l.flower),
      lilyFlowers: P.lilies.filter((l) => l.flower),
      logs: P.logs.map((l) => ({ x: l.x, y: l.y + l.r * 0.75, z: l.z, s: 1, sx: l.len, sy: l.r, sz: l.r, rot: -l.rot, tint: l.tint })),
    };
  }, [P, highGfx]);
  // Draw distances (tile centre → camera). Small things fade out early; the
  // sparse kinds use bigger tiles so they cost fewer draw calls.
  const near = highGfx ? 80 : 55;

  return (
    <group>
      <GrassField key={highGfx ? "hi" : "lo"} high={highGfx} />
      {parts.ferns.map((items, i) => (
        <InstancedChunks key={`f${i}`} items={items} geometry={geos.fern[i]} material={mats.fern} tile={48} maxDist={near} tintFn={tintGreen} />
      ))}
      {parts.bushes.map((items, i) => (
        <InstancedChunks key={`b${i}`} items={items} geometry={geos.bush[i]} material={mats.soft} tile={64} maxDist={near + 20} tintFn={tintGreen} castShadow={highGfx} />
      ))}
      {parts.bigleaf.map((items, i) => (
        <InstancedChunks key={`l${i}`} items={items} geometry={geos.bigleaf[i]} material={mats.leaf} tile={80} maxDist={near + 5} tintFn={tintGreen} />
      ))}
      {parts.flowers.map((items, i) => (
        <InstancedChunks key={`fl${i}`} items={items} geometry={geos.flowers[i]} material={mats.soft} tile={96} maxDist={near - 10} tintFn={tintPlain} />
      ))}
      <InstancedChunks items={parts.mush.red} geometry={geos.mush.red} material={mats.stiff} tile={96} maxDist={near - 10} tintFn={tintPlain} />
      <InstancedChunks items={parts.mush.brown} geometry={geos.mush.brown} material={mats.stiff} tile={96} maxDist={near - 10} tintFn={tintPlain} />
      <InstancedChunks items={parts.mush.glow} geometry={geos.mush.glow} material={mats.glow} tile={96} maxDist={near + 15} tintFn={tintPlain} />
      <InstancedChunks items={P.reeds} geometry={geos.reeds} material={mats.reed} tile={96} maxDist={near + 15} tintFn={tintGreen} />
      {parts.rocks.map((items, i) => (
        <InstancedChunks key={`r${i}`} items={items} geometry={geos.rock[i]} material={mats.rock} tile={96} castShadow tintFn={tintPlain} sink={0.08} />
      ))}
      <InstancedChunks items={P.cliffRocks} geometry={geos.rock[1]} material={mats.rock} tile={96} castShadow tintFn={tintPlain} />
      <InstancedChunks items={parts.lilies} geometry={geos.lily} material={mats.lily} tile={128} tintFn={tintGreen} />
      <InstancedChunks items={parts.lilyFlowers} geometry={geos.lilyFlower} material={mats.lily} tile={128} tintFn={tintPlain} />
      <InstancedChunks items={parts.logs} geometry={geos.log} material={mats.stiff} tile={128} castShadow tintFn={tintPlain} />
      <InstancedChunks items={P.stumps} geometry={geos.stump} material={mats.stiff} tile={128} castShadow tintFn={tintPlain} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// GPU GRASS FIELD — a fixed pool of grass tufts on a jittered lattice that
// WRAPS round the player (each tuft re-homes to the nearest copy of its lattice
// cell), standing on the terrain via a height texture and coloured to match
// the ground beneath via a colour+density texture. No CPU work per frame.
// ---------------------------------------------------------------------------
// High: a 50 m wrapping patch, 150 tufts a side (22 500 tufts). Low: the same
// density over a 32 m patch (9 216 tufts) — the meadows never look bald.
const GRASS_HIGH = { FIELD: 50, SIDE: 150 };
const GRASS_LOW = { FIELD: 32, SIDE: 96 };

let _grassTex = null;
function buildGrassTextures() {
  if (_grassTex) return _grassTex;
  ensureJungleStructures();
  const { h } = getJungleGrid();
  const { nx, nz } = GRID;
  const hData = new Uint16Array(nx * nz);
  const cData = new Uint8Array(nx * nz * 4);
  const ga = new THREE.Color("#4f8f30"), gb = new THREE.Color("#8cc252"), gf = new THREE.Color("#3d6b26"), gp = new THREE.Color("#7cb04c");
  const c = new THREE.Color(), cs = new THREE.Color();
  for (let j = 0; j < nz; j++) {
    const z = GRID.zMin + j * GRID.step;
    for (let i = 0; i < nx; i++) {
      const x = GRID.xMin + i * GRID.step;
      const k = j * nx + i;
      hData[k] = THREE.DataUtils.toHalfFloat(h[k]);
      // Density: open meadows thick, forest floor thin, none on paths /
      // water / rock / clearings' worn middles / structures / the rim face.
      let d = 1;
      const rc = rimCoords(x, z);
      if (rc.q > rc.edge + 0.03) d = 0;
      else {
        const sl = slopeAt(x, z);
        d *= 1 - smoothstep(0.55, 0.85, sl);
        const np = nearestPath(x, z);
        if (np) d *= smoothstep(-0.2, 0.9, np.e);
        d *= smoothstep(0.2, 1.6, waterEdgeDist(x, z));
        for (const s of JUNGLE_SPOTS) {
          const dd = Math.hypot(x - s.center[0], z - s.center[1]);
          if (dd < s.radius) d *= 0.35 + 0.65 * smoothstep(s.radius * 0.45, s.radius, dd);
        }
        const ag = Math.hypot(x - ARRIVAL_GLADE.center[0], z - ARRIVAL_GLADE.center[1]);
        if (ag < ARRIVAL_GLADE.radius) d *= 0.4 + 0.6 * smoothstep(5, ARRIVAL_GLADE.radius, ag);
        if (Math.hypot(x - TEMPLE_ANCHOR.c[0], z - TEMPLE_ANCHOR.c[1]) < 9) d = 0;
        if (Math.hypot(x - GREAT_TREE.center[0], z - GREAT_TREE.center[1]) < GREAT_TREE.trunkR + 1) d = 0;
        const st = structureTopAt(x, z, Infinity);
        if (st !== null && st > h[k] + 0.3) d = 0;
        d *= 0.55 + 0.45 * smoothstep(0.25, 0.6, fbm(x / 16, z / 16, 2, 71));
      }
      c.copy(ga).lerp(gb, smoothstep(0.3, 0.75, fbm(x / 30, z / 30, 2, 61)));
      if (z < escarpZ(x) - 3 && h[k] > PLATEAU_H - 2) c.lerp(gp, 0.45);
      c.lerp(gf, 0.3 * vnoise(x / 9, z / 9, 64));
      // (THREE.Color holds LINEAR values; store sRGB bytes — the texture is
      // tagged sRGB so the GPU hands the shader linear colour again.)
      cs.copy(c).convertLinearToSRGB();
      cData[k * 4] = Math.round(cs.r * 255);
      cData[k * 4 + 1] = Math.round(cs.g * 255);
      cData[k * 4 + 2] = Math.round(cs.b * 255);
      cData[k * 4 + 3] = Math.round(Math.max(0, Math.min(1, d)) * 255);
    }
  }
  const ht = new THREE.DataTexture(hData, nx, nz, THREE.RedFormat, THREE.HalfFloatType);
  ht.magFilter = ht.minFilter = THREE.LinearFilter;
  ht.needsUpdate = true;
  const ct = new THREE.DataTexture(cData, nx, nz, THREE.RGBAFormat, THREE.UnsignedByteType);
  ct.magFilter = ct.minFilter = THREE.LinearFilter;
  ct.colorSpace = THREE.SRGBColorSpace;
  ct.needsUpdate = true;
  _grassTex = { ht, ct };
  return _grassTex;
}

function GrassField({ high = true }) {
  const ref = useRef();
  const shaderRef = useRef(null);
  const { FIELD, SIDE } = high ? GRASS_HIGH : GRASS_LOW;
  const { geo, mat } = useMemo(() => {
    const base = buildGrassTuft();
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    for (const k of Object.keys(base.attributes)) geo.setAttribute(k, base.attributes[k]);
    const N = SIDE * SIDE;
    const off = new Float32Array(N * 2);
    let s = 12345;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const cell = FIELD / SIDE;
    for (let j = 0; j < SIDE; j++) for (let i = 0; i < SIDE; i++) {
      const k = j * SIDE + i;
      off[k * 2] = (i + 0.1 + r() * 0.8) * cell;
      off[k * 2 + 1] = (j + 0.1 + r() * 0.8) * cell;
    }
    geo.setAttribute("aOff", new THREE.InstancedBufferAttribute(off, 2));
    geo.instanceCount = N;
    const { ht, ct } = buildGrassTextures();
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true, alphaMap: getJungleTextures().grass, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9,
    });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = jungleClock.uTime;
      sh.uniforms.uCenter = { value: new THREE.Vector2() };
      sh.uniforms.uPlayer = { value: new THREE.Vector3() };
      sh.uniforms.uH = { value: ht };
      sh.uniforms.uC = { value: ct };
      sh.uniforms.uGrid = { value: new THREE.Vector4(GRID.xMin, GRID.zMin, GRID.xMax - GRID.xMin, GRID.zMax - GRID.zMin) };
      sh.vertexShader = sh.vertexShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          uniform float uTime; uniform vec2 uCenter; uniform vec3 uPlayer;
          uniform sampler2D uH; uniform sampler2D uC; uniform vec4 uGrid;
          attribute vec2 aOff; attribute float aSway;
          varying vec3 vGrassTint;
          float gh(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }`
        )
        .replace(
          "#include <beginnormal_vertex>",
          "vec3 objectNormal = vec3(0.0, 1.0, 0.0);\n#ifdef USE_TANGENT\nvec3 objectTangent = vec3(1.0, 0.0, 0.0);\n#endif"
        )
        .replace(
          "#include <begin_vertex>",
          /* glsl */ `
          float S = ${FIELD.toFixed(1)};
          vec2 wp = aOff + floor((uCenter - aOff) / S + 0.5) * S;
          float hs = gh(floor(wp * 3.1));
          vec2 guv = (wp - uGrid.xy) / uGrid.zw;
          float gy = texture2D(uH, guv).r;
          vec4 gc = texture2D(uC, guv);
          float dist = distance(wp, uCenter);
          float sc = gc.a * (0.65 + 0.7 * hs) * (1.0 - smoothstep(S * 0.32, S * 0.48, dist));
          float ang = hs * 6.2831;
          vec3 p = position * sc;
          p = vec3(p.x * cos(ang) - p.z * sin(ang), p.y, p.x * sin(ang) + p.z * cos(ang));
          // Wind + bend away from the player.
          float tip = clamp(position.y / 0.5, 0.0, 1.0);
          p.x += sin(uTime * 1.6 + wp.x * 0.35 + wp.y * 0.2) * 0.07 * tip * sc;
          vec2 dd = wp - uPlayer.xz;
          float dl = length(dd);
          float push = (1.0 - smoothstep(0.0, 1.3, dl)) * step(abs(uPlayer.y - gy), 1.2) * tip;
          p.xz += (dl > 0.001 ? dd / dl : vec2(0.0)) * push * 0.45 * sc;
          p.y *= 1.0 - push * 0.45;
          vec3 transformed = p + vec3(wp.x, gy - 0.02, wp.y);
          vGrassTint = gc.rgb * (0.85 + 0.3 * hs);
          #ifdef USE_COLOR
            vColor.rgb *= vGrassTint * 1.25;
          #endif`
        );
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vGrassTint;")
        // Grass is lit like the turf it grows from (never a flipped, dark back face).
        .replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\nnormal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);");
      shaderRef.current = sh;
    };
    mat.customProgramCacheKey = () => `jungle-grassfield-v1-${FIELD}`;
    return { geo, mat };
  }, [FIELD, SIDE]);
  useFrame(({ camera }) => {
    const sh = shaderRef.current;
    if (!sh) return;
    // Centre the patch a little ahead of the camera, toward the player.
    const cx = playerState.x * 0.75 + camera.position.x * 0.25;
    const cz = playerState.z * 0.75 + camera.position.z * 0.25;
    sh.uniforms.uCenter.value.set(cx, cz);
    sh.uniforms.uPlayer.value.set(playerState.x, playerState.y || 0, playerState.z);
  });
  return <mesh ref={ref} geometry={geo} material={mat} frustumCulled={false} receiveShadow />;
}
