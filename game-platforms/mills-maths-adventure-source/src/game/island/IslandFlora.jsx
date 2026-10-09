import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { getIslandProps, jungleness, volcanicness, inIslandField, nearestFootprint } from "../../data/island/islandProps.js";
import {
  GRID, getIslandGrid, nearestPath, slopeAt, snowCover, coastSD, lagoonEdgeDist, plazaOct, islandSolidTopAt, terrainHeight,
} from "../../data/island/islandTerrain.js";
import { ISLAND_FIELDS, PLAZA, ISLAND_HAY_BALES } from "../../data/island/islandLayout.js";
import { smoothstep, fbm, rng } from "../../data/terrainKit.js";
import {
  buildBroadleaf, buildPalmTrunk, buildPalmFronds, buildFern, buildBigLeaf, buildBush, buildFlowers, buildReeds, buildRock,
  buildLog, buildGrassTuft,
} from "../jungle/jungleGeometry.js";
import { buildGum, buildOak, buildPine, buildWheat, buildSunflower, buildRoundBale } from "../farm/farmGeometry.js";
import { buildSnowFir, buildSpruce, buildSnowRock } from "../snow/snowGeometry.js";
import { buildShell, buildBasalt } from "./islandGeometry.js";
import { makeFoliageMaterial, getJungleTextures, jungleClock } from "../jungle/jungleMaterials.js";
import { getIslandGroundColours } from "./IslandTerrain.jsx";
import { getIslandHeightTexture, ISLAND_GRID_VEC } from "./islandMaterials.js";
import { playerState } from "../sessionStore.js";
import InstancedChunks from "../jungle/InstancedChunks.jsx";
import { getFarmTextures } from "../farm/farmMaterials.js";

/**
 * ISLAND FLORA — every palm (leaning out over the beaches and round the
 * lagoon), the lagoon's little jungle, the meadow copses of round oaks +
 * gums, Frosty Peak's snowy firs + spruces with pines below, the
 * undergrowth (bushes, ferns, big leaves, wildflower drifts, reeds), the
 * boulders (mossy, snowy, basalt), the beachcombing (shells, starfish,
 * conches, driftwood), the farm's wheat + sunflowers + hay, and a GPU grass
 * field that follows the player. Tiled instancing + LOD, as the other worlds.
 */
const leafTint = (it, c) => {
  const t = it.tint;
  c.setRGB(0.9 + 0.2 * t, 0.96 + 0.08 * Math.sin(t * 9), 0.84 + 0.14 * (1 - t));
};
const plainTint = (it, c) => c.setRGB(0.92 + 0.12 * it.tint, 0.92 + 0.1 * it.tint, 0.92 + 0.1 * it.tint);
const snowTint = (it, c) => c.setRGB(0.92 + 0.12 * it.tint, 0.95 + 0.07 * Math.sin(it.tint * 7), 0.97 + 0.06 * (1 - it.tint));
function split(items, n) {
  const out = Array.from({ length: n }, () => []);
  items.forEach((it, i) => out[Math.floor(((it.tint * 997 + i * 0.13) % 1) * n)].push(it));
  return out;
}

export function IslandTrees({ highGfx, title = false }) {
  const P = useMemo(() => getIslandProps(), []);
  const tex = getJungleTextures();
  const mats = useMemo(() => ({
    tree: makeFoliageMaterial({ sway: 0.9, leafy: true, key: "isl-tree" }),
    stiff: makeFoliageMaterial({ sway: 0.3, key: "isl-pine", roughness: 0.9 }),
    frond: makeFoliageMaterial({ sway: 1.7, map: tex.palm, alphaTest: 0.32, side: THREE.DoubleSide, key: "isl-frond" }),
  }), [tex]);
  const geos = useMemo(() => {
    const p1 = buildPalmTrunk(3, { height: 8.4, lean: 0.34 });
    const p2 = buildPalmTrunk(8, { height: 9.6, lean: 0.24 });
    return {
      palmTrunk: [p1, p2],
      palmFronds: [buildPalmFronds(3, p1.userData.top), buildPalmFronds(8, p2.userData.top)],
      broad: [buildBroadleaf(11, { height: 9 }), buildBroadleaf(23, { height: 10.5, spread: 1.12 })],
      broadLod: [buildBroadleaf(11, { height: 9, lod: true }), buildBroadleaf(23, { height: 10.5, spread: 1.12, lod: true })],
      oak: [buildOak(31), buildOak(47)],
      oakLod: [buildOak(31, { lod: true }), buildOak(47, { lod: true })],
      oakFar: [buildOak(31, { far: true }), buildOak(47, { far: true })],
      gum: buildGum(3), gumLod: buildGum(3, { lod: true }), gumFar: buildGum(3, { far: true }),
      fir: [buildSnowFir(3, { height: 9 }), buildSnowFir(11, { height: 11 })],
      firLod: [buildSnowFir(3, { lod: true, height: 9 }), buildSnowFir(11, { lod: true, height: 11 })],
      firFar: [buildSnowFir(3, { far: true, height: 9 }), buildSnowFir(11, { far: true, height: 11 })],
      spruce: buildSpruce(5, { height: 12 }), spruceLod: buildSpruce(5, { lod: true, height: 12 }), spruceFar: buildSpruce(5, { far: true, height: 12 }),
      pine: buildPine(4, { height: 10 }), pineLod: buildPine(4, { height: 10, lod: true }), pineFar: buildPine(4, { height: 10, far: true }),
    };
  }, []);
  const T = P.trees;
  const palms = useMemo(() => split(T.palm, 2).map((a) => a.map((p) => ({ ...p, y: p.y - 0.1 }))), [T]);
  const broads = useMemo(() => split(T.broad, 2), [T]);
  const oaks = useMemo(() => split([...T.oak, ...T.round.map((r) => ({ ...r, s: r.s * 0.8 }))], 2), [T]);
  const firs = useMemo(() => split(T.fir, 2), [T]);
  const shadows = highGfx && !title;
  const lodNear = highGfx ? 60 : 38;
  const lodFar = highGfx ? 150 : 100;
  return (
    <group>
      {palms.map((items, i) => (
        <group key={`p${i}`}>
          <InstancedChunks items={items} geometry={geos.palmTrunk[i]} material={mats.tree} castShadow={shadows} tintFn={plainTint} />
          <InstancedChunks items={items} geometry={geos.palmFronds[i]} material={mats.frond} castShadow={shadows} tintFn={leafTint} />
        </group>
      ))}
      {broads.map((items, i) => (
        <InstancedChunks key={`b${i}`} items={items} geometry={geos.broad[i]} lodGeometry={geos.broadLod[i]} lodDist={lodNear} material={mats.tree} castShadow={shadows} tintFn={leafTint} sink={0.15} />
      ))}
      {oaks.map((items, i) => (
        <InstancedChunks key={`o${i}`} items={items} geometry={geos.oak[i]} lodGeometry={geos.oakLod[i]} lodDist={lodNear} farGeometry={geos.oakFar[i]} farDist={lodFar} material={mats.tree} castShadow={shadows} tintFn={leafTint} sink={0.15} />
      ))}
      <InstancedChunks items={T.gum} geometry={geos.gum} lodGeometry={geos.gumLod} lodDist={lodNear} farGeometry={geos.gumFar} farDist={lodFar} material={mats.tree} castShadow={shadows} tintFn={leafTint} sink={0.15} />
      {firs.map((items, i) => (
        <InstancedChunks key={`f${i}`} items={items} geometry={geos.fir[i]} lodGeometry={geos.firLod[i]} lodDist={lodNear} farGeometry={geos.firFar[i]} farDist={lodFar} material={mats.stiff} castShadow={shadows} tintFn={snowTint} sink={0.2} />
      ))}
      <InstancedChunks items={T.spruce} geometry={geos.spruce} lodGeometry={geos.spruceLod} lodDist={lodNear} farGeometry={geos.spruceFar} farDist={lodFar} material={mats.stiff} castShadow={shadows} tintFn={snowTint} sink={0.2} />
      <InstancedChunks items={T.pine} geometry={geos.pine} lodGeometry={geos.pineLod} lodDist={lodNear} farGeometry={geos.pineFar} farDist={lodFar} material={mats.stiff} castShadow={shadows} tintFn={leafTint} sink={0.15} />
    </group>
  );
}

export function IslandUndergrowth({ highGfx }) {
  const P = useMemo(() => getIslandProps(), []);
  const tex = getJungleTextures();
  const mats = useMemo(() => ({
    fern: makeFoliageMaterial({ sway: 0.9, map: tex.fern, alphaTest: 0.45, side: THREE.DoubleSide, key: "isl-fern" }),
    leaf: makeFoliageMaterial({ sway: 0.8, map: tex.bigleaf, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.55, key: "isl-bigleaf" }),
    soft: makeFoliageMaterial({ sway: 0.5, leafy: true, key: "isl-soft" }),
    stiff: makeFoliageMaterial({ sway: 0, key: "isl-stiff", roughness: 0.92 }),
    rock: makeFoliageMaterial({ sway: 0, key: "isl-rock", roughness: 0.95, flat: true }),
    reed: makeFoliageMaterial({ sway: 1.2, side: THREE.DoubleSide, key: "isl-reed" }),
    shell: makeFoliageMaterial({ sway: 0, key: "isl-shell", roughness: 0.5 }),
  }), [tex]);
  const geos = useMemo(() => ({
    fern: [buildFern(1), buildFern(7)],
    leaf: [buildBigLeaf(3), buildBigLeaf(9)],
    bush: [buildBush(2), buildBush(5)],
    flowers: [0, 1, 2, 3, 4, 5].map((v) => buildFlowers(10 + v, v)),
    rock: [buildRock(1), buildRock(4), buildRock(9)],
    snowRock: [buildSnowRock(3), buildSnowRock(9)],
    basalt: [buildBasalt(2), buildBasalt(7)],
    reeds: buildReeds(3),
    log: buildLog(3),
    shell: [buildShell(0), buildShell(1), buildShell(2)],
  }), []);
  const parts = useMemo(() => {
    const flowers = Array.from({ length: 6 }, () => []);
    P.flowers.forEach((f) => flowers[f.v].push(f));
    const shells = [[], [], []];
    P.shells.forEach((s) => shells[s.v].push(s));
    return {
      ferns: split(P.ferns, 2), leaves: split(P.leaves, 2), bushes: split(P.bushes, 2), flowers,
      rocks: split(P.rocks, 3), snowRocks: split(P.snowRocks, 2), basalt: split(P.basalt, 2), shells,
      logs: P.logs.map((l) => ({ x: l.x, y: l.y + l.r * 0.8, z: l.z, s: 1, sx: l.len, sy: l.r, sz: l.r, rot: l.rot, tint: l.tint })),
    };
  }, [P]);
  const near = highGfx ? 90 : 60;
  return (
    <group>
      {parts.ferns.map((items, i) => (
        <InstancedChunks key={`f${i}`} items={items} geometry={geos.fern[i]} material={mats.fern} tile={48} maxDist={near} tintFn={leafTint} />
      ))}
      {parts.leaves.map((items, i) => (
        <InstancedChunks key={`l${i}`} items={items} geometry={geos.leaf[i]} material={mats.leaf} tile={48} maxDist={near - 10} tintFn={leafTint} />
      ))}
      {parts.bushes.map((items, i) => (
        <InstancedChunks key={`b${i}`} items={items} geometry={geos.bush[i]} material={mats.soft} tile={64} maxDist={near + 30} tintFn={leafTint} castShadow={highGfx} />
      ))}
      {parts.flowers.map((items, i) => (
        <InstancedChunks key={`fl${i}`} items={items} geometry={geos.flowers[i]} material={mats.soft} tile={64} maxDist={near - 20} tintFn={plainTint} />
      ))}
      {parts.rocks.map((items, i) => (
        <InstancedChunks key={`r${i}`} items={items} geometry={geos.rock[i]} material={mats.rock} tile={96} castShadow tintFn={plainTint} sink={0.1} />
      ))}
      {parts.snowRocks.map((items, i) => (
        <InstancedChunks key={`sr${i}`} items={items} geometry={geos.snowRock[i]} material={mats.rock} tile={96} castShadow tintFn={plainTint} sink={0.1} />
      ))}
      {parts.basalt.map((items, i) => (
        <InstancedChunks key={`ba${i}`} items={items} geometry={geos.basalt[i]} material={mats.rock} tile={96} castShadow tintFn={plainTint} sink={0.12} />
      ))}
      {parts.shells.map((items, i) => (
        <InstancedChunks key={`sh${i}`} items={items} geometry={geos.shell[i]} material={mats.shell} tile={64} maxDist={45} tintFn={plainTint} />
      ))}
      <InstancedChunks items={P.reeds} geometry={geos.reeds} material={mats.reed} tile={96} maxDist={near + 10} tintFn={leafTint} />
      <InstancedChunks items={parts.logs} geometry={geos.log} material={mats.stiff} tile={128} castShadow tintFn={plainTint} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE FARM'S CROPS — wheat + sunflowers in their fields, round hay bales.
// ---------------------------------------------------------------------------
export function IslandCrops({ highGfx }) {
  const tex = getFarmTextures();
  const mats = useMemo(() => ({
    wheat: makeFoliageMaterial({ sway: 0.9, map: tex.wheat, alphaTest: 0.42, side: THREE.DoubleSide, key: "isl-wheat" }),
    crop: makeFoliageMaterial({ sway: 0.7, side: THREE.DoubleSide, key: "isl-crop" }),
    hay: makeFoliageMaterial({ sway: 0, key: "isl-hay", roughness: 0.95 }),
  }), [tex]);
  const geos = useMemo(() => ({ wheat: buildWheat(1), sunflower: buildSunflower(1), bale: buildRoundBale() }), []);
  const items = useMemo(() => {
    const R = rng(4242);
    const wheat = [], sun = [];
    for (const f of ISLAND_FIELDS) {
      const step = f.kind === "wheat" ? 0.62 : 1.2;
      for (let x = f.c[0] - f.rx; x <= f.c[0] + f.rx; x += step) {
        for (let z = f.c[1] - f.rz; z <= f.c[1] + f.rz; z += step) {
          const jx = x + (R() - 0.5) * step * 0.5, jz = z + (R() - 0.5) * step * 0.5;
          if (Math.hypot((jx - f.c[0]) / f.rx, (jz - f.c[1]) / f.rz) > 0.96) continue;
          const it = { x: jx, z: jz, y: terrainHeight(jx, jz), s: 0.85 + R() * 0.3, rot: f.kind === "sunflower" ? (R() - 0.5) * 0.5 : R() * 6.28, tint: R() };
          (f.kind === "wheat" ? wheat : sun).push(it);
        }
      }
    }
    const bales = ISLAND_HAY_BALES.map(([x, z, r], i) => ({ x, z, y: terrainHeight(x, z) - 0.06, s: 1, rot: r, tint: (i * 0.37) % 1 }));
    return { wheat, sun, bales };
  }, []);
  return (
    <group>
      <InstancedChunks items={items.wheat} geometry={geos.wheat} material={mats.wheat} tile={48} maxDist={highGfx ? 140 : 90} tintFn={plainTint} />
      <InstancedChunks items={items.sun} geometry={geos.sunflower} material={mats.crop} tile={48} maxDist={highGfx ? 140 : 90} tintFn={plainTint} />
      <InstancedChunks items={items.bales} geometry={geos.bale} material={mats.hay} tile={96} castShadow tintFn={plainTint} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// GPU GRASS FIELD — a pool of grass tufts on a jittered lattice that wraps
// round the player (the farm's recipe), standing on the terrain via the
// height texture, coloured to match the ground. Meadows only: none on the
// sand, the snow, the ash, the paths, the plaza or the crops.
// ---------------------------------------------------------------------------
const GRASS_HIGH = { FIELD: 52, SIDE: 150 };
const GRASS_LOW = { FIELD: 34, SIDE: 96 };
let _grassTex = null;
function buildGrassColourTexture() {
  if (_grassTex) return _grassTex;
  const { h } = getIslandGrid();
  const { col, mix } = getIslandGroundColours();
  const { nx, nz } = GRID;
  const cData = new Uint8Array(nx * nz * 4);
  const c = new THREE.Color();
  for (let j = 0; j < nz; j++) {
    const z = GRID.zMin + j * GRID.step;
    for (let i = 0; i < nx; i++) {
      const x = GRID.xMin + i * GRID.step;
      const k = j * nx + i;
      let d = 0;
      if (h[k] > 0.9) {
        d = 1 - Math.max(mix[k * 4], mix[k * 4 + 1], mix[k * 4 + 2]) * 1.4;
        if (d > 0) {
          d *= 1 - smoothstep(0.55, 0.85, slopeAt(x, z));
          const np = nearestPath(x, z);
          if (np) d *= smoothstep(-0.2, 1.1, np.e);
          if (plazaOct(x, z) < PLAZA.apothem + 3.5) d = 0;
          if (islandSolidTopAt(x, z) !== null) d = 0;
          if (inIslandField(x, z, 0.6)) d = 0;
          if (d > 0 && nearestFootprint(x, z).e < 0.3) d *= 0.2;
          d *= smoothstep(0.2, 1.6, lagoonEdgeDist(x, z));
          d *= 0.55 + 0.45 * smoothstep(0.22, 0.6, fbm(x / 16, z / 16, 2, 77));
        }
      }
      c.setRGB(col[k * 3], col[k * 3 + 1], col[k * 3 + 2]).convertLinearToSRGB();
      cData[k * 4] = Math.round(Math.min(1, c.r) * 255);
      cData[k * 4 + 1] = Math.round(Math.min(1, c.g) * 255);
      cData[k * 4 + 2] = Math.round(Math.min(1, c.b) * 255);
      cData[k * 4 + 3] = Math.round(Math.max(0, Math.min(1, d)) * 255);
    }
  }
  const ct = new THREE.DataTexture(cData, nx, nz, THREE.RGBAFormat, THREE.UnsignedByteType);
  ct.magFilter = ct.minFilter = THREE.LinearFilter;
  ct.colorSpace = THREE.SRGBColorSpace;
  ct.needsUpdate = true;
  _grassTex = ct;
  return ct;
}

export function IslandGrassField({ high = true }) {
  const shaderRef = useRef(null);
  const { FIELD, SIDE } = high ? GRASS_HIGH : GRASS_LOW;
  const { geo, mat } = useMemo(() => {
    const base = buildGrassTuft();
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    for (const k of Object.keys(base.attributes)) geo.setAttribute(k, base.attributes[k]);
    const N = SIDE * SIDE;
    const off = new Float32Array(N * 2);
    let s = 13579;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const cell = FIELD / SIDE;
    for (let j = 0; j < SIDE; j++) for (let i = 0; i < SIDE; i++) {
      const k = j * SIDE + i;
      off[k * 2] = (i + 0.1 + r() * 0.8) * cell;
      off[k * 2 + 1] = (j + 0.1 + r() * 0.8) * cell;
    }
    geo.setAttribute("aOff", new THREE.InstancedBufferAttribute(off, 2));
    geo.instanceCount = N;
    const ht = getIslandHeightTexture();
    const ct = buildGrassColourTexture();
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true, alphaMap: getJungleTextures().grass, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9,
    });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = jungleClock.uTime;
      sh.uniforms.uCenter = { value: new THREE.Vector2() };
      sh.uniforms.uPlayer = { value: new THREE.Vector3() };
      sh.uniforms.uH = { value: ht };
      sh.uniforms.uC = { value: ct };
      sh.uniforms.uGrid = { value: ISLAND_GRID_VEC() };
      sh.vertexShader = sh.vertexShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          uniform float uTime; uniform vec2 uCenter; uniform vec3 uPlayer;
          uniform sampler2D uH; uniform sampler2D uC; uniform vec4 uGrid;
          attribute vec2 aOff;
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
          float sc = gc.a * (0.7 + 0.75 * hs) * (1.0 - smoothstep(S * 0.32, S * 0.48, dist));
          float ang = hs * 6.2831;
          vec3 p = position * sc;
          p = vec3(p.x * cos(ang) - p.z * sin(ang), p.y * 1.15, p.x * sin(ang) + p.z * cos(ang));
          float tip = clamp(position.y / 0.5, 0.0, 1.0);
          float gust = sin(uTime * 0.8 + wp.x * 0.05 + wp.y * 0.03) * 0.5 + 0.5;
          p.x += sin(uTime * 1.7 + wp.x * 0.35 + wp.y * 0.2) * (0.05 + 0.07 * gust) * tip * sc;
          p.z += cos(uTime * 1.3 + wp.x * 0.2) * 0.03 * tip * sc;
          vec2 dd = wp - uPlayer.xz;
          float dl = length(dd);
          float push = (1.0 - smoothstep(0.0, 1.3, dl)) * step(abs(uPlayer.y - gy), 1.2) * tip;
          p.xz += (dl > 0.001 ? dd / dl : vec2(0.0)) * push * 0.45 * sc;
          p.y *= 1.0 - push * 0.45;
          vec3 transformed = p + vec3(wp.x, gy - 0.02, wp.y);
          vGrassTint = gc.rgb * (0.86 + 0.28 * hs);
          #ifdef USE_COLOR
            vColor.rgb *= vGrassTint * 1.22;
          #endif`
        );
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vGrassTint;")
        .replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\nnormal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);");
      shaderRef.current = sh;
    };
    mat.customProgramCacheKey = () => `island-grassfield-v1-${FIELD}`;
    return { geo, mat };
  }, [FIELD, SIDE]);
  useFrame(({ camera }) => {
    const sh = shaderRef.current;
    if (!sh) return;
    sh.uniforms.uCenter.value.set(playerState.x * 0.75 + camera.position.x * 0.25, playerState.z * 0.75 + camera.position.z * 0.25);
    sh.uniforms.uPlayer.value.set(playerState.x, playerState.y || 0, playerState.z);
  });
  return <mesh geometry={geo} material={mat} frustumCulled={false} receiveShadow />;
}

export { jungleness, volcanicness, snowCover, coastSD };
