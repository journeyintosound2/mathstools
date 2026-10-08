import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { getFarmProps } from "../../data/farm/farmProps.js";
import {
  GRID, getFarmGrid, nearestPath, waterEdgeDist, slopeAt, outsideFence, nearestPad, ensureFarmStructures, POND_LEVEL,
} from "../../data/farm/farmTerrain.js";
import { smoothstep, fbm } from "../../data/terrainKit.js";
import { FARM_YARD, FARM_MUD, FARM_PADDOCKS, FARM_HAY_MEADOW, CHALLENGE_PAD, SHOP_AREA } from "../../data/farm/farmLayout.js";
import { FARM_FOOTPRINTS, footprintDist, paddockDist, inField } from "../../data/farm/farmProps.js";
import {
  buildGum, buildOak, buildPine, buildFruitTree, buildPoplar, buildWillow, buildAmber, buildWheat, buildCorn, buildSunflower,
  buildPumpkin, buildLavender, buildCabbage, buildLettuce, buildCarrotTops, buildVine, buildVinePost, buildRoundBale,
  buildSquareBale, buildBush,
} from "./farmGeometry.js";
import { buildFlowers, buildRock, buildReeds, buildLily, buildLog, buildStump, buildGrassTuft } from "../jungle/jungleGeometry.js";
import { makeFoliageMaterial, getJungleTextures, jungleClock } from "../jungle/jungleMaterials.js";
import { getFarmTextures } from "./farmMaterials.js";
import { getGroundColours } from "./FarmTerrain.jsx";
import { playerState } from "../sessionStore.js";
import InstancedChunks from "../jungle/InstancedChunks.jsx";

/**
 * FARM FLORA — every tree (gums, oaks, the orchard's apples + pears, the
 * drive's poplars, the pond's willows, the pine windbreak, liquid ambers),
 * every crop (wheat, corn, sunflowers, pumpkins, lavender, the veggie rows,
 * the vineyard), the hay, the undergrowth (bushes, wildflowers, rocks,
 * reeds, lilies, logs) and a GPU grass field that follows the player.
 * Tiled instancing (camera + shadow culling per tile), LOD for the trees.
 */
const leafTint = (it, c) => {
  const t = it.tint;
  c.setRGB(0.88 + 0.2 * t, 0.94 + 0.08 * Math.sin(t * 9), 0.84 + 0.14 * (1 - t));
  if (it.deco) c.multiplyScalar(0.9);
};
const plainTint = (it, c) => c.setRGB(0.92 + 0.12 * it.tint, 0.92 + 0.1 * it.tint, 0.92 + 0.1 * it.tint);
const cropTint = (it, c) => c.setRGB(0.92 + 0.14 * it.tint, 0.94 + 0.1 * it.tint, 0.9 + 0.1 * it.tint);
function split(items, n) {
  const out = Array.from({ length: n }, () => []);
  items.forEach((it, i) => out[Math.floor(((it.tint * 997 + i * 0.13) % 1) * n)].push(it));
  return out;
}

export function FarmTrees({ highGfx }) {
  const P = useMemo(() => getFarmProps(), []);
  const mats = useMemo(() => ({
    tree: makeFoliageMaterial({ sway: 0.8, leafy: true, key: "farm-tree" }),
    stiff: makeFoliageMaterial({ sway: 0.35, leafy: true, key: "farm-stiff" }),
    weep: makeFoliageMaterial({ sway: 1.4, side: THREE.DoubleSide, key: "farm-weep" }),
  }), []);
  const geos = useMemo(() => ({
    gum: [buildGum(3), buildGum(17, { height: 15.5 })],
    gumLod: [buildGum(3, { lod: true }), buildGum(17, { height: 15.5, lod: true })],
    gumFar: [buildGum(3, { far: true }), buildGum(17, { height: 15.5, far: true })],
    oak: [buildOak(31), buildOak(47)],
    oakLod: [buildOak(31, { lod: true }), buildOak(47, { lod: true })],
    oakFar: [buildOak(31, { far: true }), buildOak(47, { far: true })],
    pine: buildPine(4), pineLod: buildPine(4, { lod: true }), pineFar: buildPine(4, { far: true }),
    apple: buildFruitTree(2), appleLod: buildFruitTree(2, { lod: true }),
    pear: buildFruitTree(5, { kind: "pear" }), pearLod: buildFruitTree(5, { kind: "pear", lod: true }),
    poplar: buildPoplar(1), poplarLod: buildPoplar(1, { lod: true }),
    willow: buildWillow(1), willowLod: buildWillow(1, { lod: true }),
    amber: buildAmber(1), amberLod: buildAmber(1, { lod: true }),
  }), []);
  const T = P.trees;
  const gums = useMemo(() => split(T.gum, 2), [T]);
  const oaks = useMemo(() => split(T.oak, 2), [T]);
  const deco = useMemo(() => {
    const g = P.deco.filter((d) => d.kind === "gum"), o = P.deco.filter((d) => d.kind === "oak");
    return { gum: split(g, 2), oak: split(o, 2) };
  }, [P]);
  const shadows = highGfx;
  const lodNear = highGfx ? 60 : 38;
  const lodFar = highGfx ? 150 : 100;
  return (
    <group>
      {gums.map((items, i) => (
        <InstancedChunks key={`g${i}`} items={items} geometry={geos.gum[i]} lodGeometry={geos.gumLod[i]} lodDist={lodNear} farGeometry={geos.gumFar[i]} farDist={lodFar} material={mats.tree} castShadow={shadows} tintFn={leafTint} sink={0.15} />
      ))}
      {oaks.map((items, i) => (
        <InstancedChunks key={`o${i}`} items={items} geometry={geos.oak[i]} lodGeometry={geos.oakLod[i]} lodDist={lodNear} farGeometry={geos.oakFar[i]} farDist={lodFar} material={mats.tree} castShadow={shadows} tintFn={leafTint} sink={0.15} />
      ))}
      <InstancedChunks items={T.pine} geometry={geos.pine} lodGeometry={geos.pineLod} lodDist={lodNear} farGeometry={geos.pineFar} farDist={lodFar} material={mats.stiff} castShadow={shadows} tintFn={leafTint} sink={0.15} />
      <InstancedChunks items={T.apple} geometry={geos.apple} lodGeometry={geos.appleLod} lodDist={lodNear - 10} material={mats.stiff} castShadow={shadows} tintFn={leafTint} sink={0.08} tile={48} />
      <InstancedChunks items={T.pear} geometry={geos.pear} lodGeometry={geos.pearLod} lodDist={lodNear - 10} material={mats.stiff} castShadow={shadows} tintFn={leafTint} sink={0.08} tile={48} />
      <InstancedChunks items={T.poplar} geometry={geos.poplar} lodGeometry={geos.poplarLod} lodDist={lodNear + 20} material={mats.tree} castShadow={shadows} tintFn={leafTint} sink={0.1} />
      <InstancedChunks items={T.willow} geometry={geos.willow} lodGeometry={geos.willowLod} lodDist={lodNear} material={mats.weep} castShadow={shadows} tintFn={leafTint} sink={0.15} />
      <InstancedChunks items={T.amber} geometry={geos.amber} lodGeometry={geos.amberLod} lodDist={lodNear} material={mats.tree} castShadow={shadows} tintFn={plainTint} sink={0.1} />
      {/* The outer hills' hedgerows + copses (decorative, far → far meshes only). */}
      {deco.gum.map((items, i) => (
        <InstancedChunks key={`dg${i}`} items={items} geometry={geos.gumFar[i]} material={mats.stiff} tintFn={leafTint} sink={0.2} tile={96} />
      ))}
      {deco.oak.map((items, i) => (
        <InstancedChunks key={`do${i}`} items={items} geometry={geos.oakFar[i]} material={mats.stiff} tintFn={leafTint} sink={0.2} tile={96} />
      ))}
    </group>
  );
}

export function FarmCrops({ highGfx }) {
  const P = useMemo(() => getFarmProps(), []);
  const tex = getFarmTextures();
  const mats = useMemo(() => ({
    wheat: makeFoliageMaterial({ sway: 0.9, map: tex.wheat, alphaTest: 0.42, side: THREE.DoubleSide, key: "farm-wheat" }),
    crop: makeFoliageMaterial({ sway: 0.7, side: THREE.DoubleSide, key: "farm-crop" }),
    stiff: makeFoliageMaterial({ sway: 0, key: "farm-crop-stiff", roughness: 0.75 }),
    vine: makeFoliageMaterial({ sway: 0.3, leafy: true, side: THREE.DoubleSide, key: "farm-vine" }),
  }), [tex]);
  const geos = useMemo(() => ({
    wheat: [buildWheat(1), buildWheat(2), buildWheat(3)],
    corn: [buildCorn(1), buildCorn(7)],
    sunflower: [buildSunflower(1), buildSunflower(4)],
    pumpkin: [buildPumpkin(1), buildPumpkin(3)],
    lavender: buildLavender(1), cabbage: buildCabbage(1), lettuce: buildLettuce(1), carrot: buildCarrotTops(1),
    vine: buildVine(1), vinePost: buildVinePost(),
  }), []);
  const C = P.crops;
  const parts = useMemo(() => ({
    wheat: split(C.wheat, 3), corn: split(C.corn, 2), sunflower: split(C.sunflower, 2), pumpkin: split(C.pumpkin, 2),
  }), [C]);
  const near = highGfx ? 110 : 75;
  return (
    <group>
      {parts.wheat.map((items, i) => (
        <InstancedChunks key={`w${i}`} items={items} geometry={geos.wheat[i]} material={mats.wheat} tile={48} maxDist={near + 30} tintFn={cropTint} />
      ))}
      {parts.corn.map((items, i) => (
        <InstancedChunks key={`c${i}`} items={items} geometry={geos.corn[i]} material={mats.crop} tile={48} maxDist={near + 20} tintFn={cropTint} castShadow={highGfx} />
      ))}
      {parts.sunflower.map((items, i) => (
        <InstancedChunks key={`s${i}`} items={items.map((it) => ({ ...it, rot: (it.tint - 0.5) * 0.5 }))} geometry={geos.sunflower[i]} material={mats.crop} tile={48} maxDist={near + 20} tintFn={cropTint} />
      ))}
      {parts.pumpkin.map((items, i) => (
        <InstancedChunks key={`p${i}`} items={items} geometry={geos.pumpkin[i]} material={mats.stiff} tile={48} maxDist={near} tintFn={cropTint} />
      ))}
      <InstancedChunks items={C.lavender} geometry={geos.lavender} material={mats.crop} tile={48} maxDist={near} tintFn={cropTint} />
      <InstancedChunks items={C.cabbage} geometry={geos.cabbage} material={mats.stiff} tile={48} maxDist={near - 20} tintFn={cropTint} />
      <InstancedChunks items={C.lettuce} geometry={geos.lettuce} material={mats.crop} tile={48} maxDist={near - 20} tintFn={cropTint} />
      <InstancedChunks items={C.carrot} geometry={geos.carrot} material={mats.crop} tile={48} maxDist={near - 20} tintFn={cropTint} />
      <InstancedChunks items={C.vine} geometry={geos.vine} material={mats.vine} tile={48} maxDist={near + 30} tintFn={cropTint} castShadow={highGfx} />
      <InstancedChunks items={C.vinePost} geometry={geos.vinePost} material={mats.stiff} tile={48} maxDist={near + 30} tintFn={plainTint} />
    </group>
  );
}

export function FarmUndergrowth({ highGfx }) {
  const P = useMemo(() => getFarmProps(), []);
  const mats = useMemo(() => ({
    soft: makeFoliageMaterial({ sway: 0.5, leafy: true, key: "farm-soft" }),
    stiff: makeFoliageMaterial({ sway: 0, key: "farm-stiff-u", roughness: 0.92 }),
    rock: makeFoliageMaterial({ sway: 0, key: "farm-rock", roughness: 0.95, flat: true }),
    reed: makeFoliageMaterial({ sway: 1.2, side: THREE.DoubleSide, key: "farm-reed" }),
    lily: makeFoliageMaterial({ sway: 0, side: THREE.DoubleSide, key: "farm-lily", roughness: 0.4 }),
    hay: makeFoliageMaterial({ sway: 0, key: "farm-hay", roughness: 0.95 }),
  }), []);
  const geos = useMemo(() => ({
    bush: [buildBush(2), buildBush(5)],
    flowers: [0, 1, 2, 3, 4, 5].map((v) => buildFlowers(10 + v, v)),
    rock: [buildRock(1), buildRock(4), buildRock(9)],
    reeds: buildReeds(3),
    lily: buildLily(1, false), lilyFlower: buildLily(2, true),
    log: buildLog(3), stump: buildStump(2),
    round: buildRoundBale(), square: buildSquareBale(),
  }), []);
  const parts = useMemo(() => {
    const flowers = Array.from({ length: 6 }, () => []);
    P.flowers.forEach((f) => flowers[f.v].push(f));
    return {
      bushes: split(P.bushes, 2),
      flowers,
      rocks: split(P.rocks.map((r) => ({ ...r, rx: (r.tint - 0.5) * 0.4 })), 3),
      lilies: P.lilies.filter((l) => !l.flower).map((l) => ({ ...l, y: POND_LEVEL + 0.02 })),
      lilyFlowers: P.lilies.filter((l) => l.flower).map((l) => ({ ...l, y: POND_LEVEL + 0.02 })),
      logs: P.logs.map((l) => ({ x: l.x, y: l.y + l.r * 0.85, z: l.z, s: 1, sx: l.len, sy: l.r, sz: l.r, rot: l.rot, tint: l.tint })),
      round: P.bales.round.map((b) => ({ ...b, y: b.y - 0.06 })),
      square: P.bales.square,
    };
  }, [P]);
  const near = highGfx ? 90 : 60;
  return (
    <group>
      {parts.bushes.map((items, i) => (
        <InstancedChunks key={`b${i}`} items={items} geometry={geos.bush[i]} material={mats.soft} tile={64} maxDist={near + 30} tintFn={leafTint} castShadow={highGfx} />
      ))}
      {parts.flowers.map((items, i) => (
        <InstancedChunks key={`f${i}`} items={items} geometry={geos.flowers[i]} material={mats.soft} tile={64} maxDist={near - 20} tintFn={plainTint} />
      ))}
      {parts.rocks.map((items, i) => (
        <InstancedChunks key={`r${i}`} items={items} geometry={geos.rock[i]} material={mats.rock} tile={96} castShadow tintFn={plainTint} sink={0.08} />
      ))}
      <InstancedChunks items={P.reeds} geometry={geos.reeds} material={mats.reed} tile={96} maxDist={near + 15} tintFn={leafTint} />
      <InstancedChunks items={parts.lilies} geometry={geos.lily} material={mats.lily} tile={128} tintFn={leafTint} />
      <InstancedChunks items={parts.lilyFlowers} geometry={geos.lilyFlower} material={mats.lily} tile={128} tintFn={plainTint} />
      <InstancedChunks items={parts.logs} geometry={geos.log} material={mats.stiff} tile={128} castShadow tintFn={plainTint} />
      <InstancedChunks items={P.stumps} geometry={geos.stump} material={mats.stiff} tile={128} castShadow tintFn={plainTint} />
      <InstancedChunks items={parts.round} geometry={geos.round} material={mats.hay} tile={96} castShadow tintFn={plainTint} />
      <InstancedChunks items={parts.square} geometry={geos.square} material={mats.hay} tile={96} castShadow tintFn={plainTint} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// GPU GRASS FIELD — a fixed pool of grass tufts on a jittered lattice that
// WRAPS round the player, standing on the terrain via a height texture and
// coloured to match the ground beneath (the terrain's own vertex colours).
// Thick in the pasture, shorter in the grazed paddocks, none on the tracks,
// yards, crops, water or under buildings.
// ---------------------------------------------------------------------------
const STAGE_PADS = new Set(Object.values(CHALLENGE_PAD).filter((id) => id !== "homestead"));
const GRASS_HIGH = { FIELD: 52, SIDE: 156 };
const GRASS_LOW = { FIELD: 34, SIDE: 102 };
let _grassTex = null;
function buildGrassTextures() {
  if (_grassTex) return _grassTex;
  ensureFarmStructures();
  const { h } = getFarmGrid();
  const cols = getGroundColours();
  const { nx, nz } = GRID;
  const hData = new Uint16Array(nx * nz);
  const cData = new Uint8Array(nx * nz * 4);
  const c = new THREE.Color();
  for (let j = 0; j < nz; j++) {
    const z = GRID.zMin + j * GRID.step;
    for (let i = 0; i < nx; i++) {
      const x = GRID.xMin + i * GRID.step;
      const k = j * nx + i;
      hData[k] = THREE.DataUtils.toHalfFloat(h[k]);
      let d = 1;
      const out = outsideFence(x, z);
      if (out > 6) d = 0;
      else {
        d *= 1 - smoothstep(0, 6, out);
        d *= 1 - smoothstep(0.6, 0.9, slopeAt(x, z));
        const np = nearestPath(x, z);
        if (np) d *= smoothstep(-0.1, 1.0, np.e);
        d *= smoothstep(0.2, 1.4, waterEdgeDist(x, z));
        if (Math.hypot(x - FARM_YARD.center[0], z - FARM_YARD.center[1]) < FARM_YARD.radius + 1) d = 0;
        if (inField(x, z, 0.5)) d = 0;
        for (const p of FARM_PADDOCKS) {
          const e = paddockDist(p, x, z);
          if (e < 0) d *= p.id === "pig-pen" || p.id === "chook-run" ? 0.1 : 0.62;
        }
        if (Math.hypot(x - FARM_MUD.center[0], z - FARM_MUD.center[1]) < FARM_MUD.radius + 1) d = 0;
        const M = FARM_HAY_MEADOW;
        if (Math.hypot((x - M.c[0]) / (M.rx + 6), (z - M.c[1]) / (M.rz + 4)) < 1) d *= 0.35;
        for (const f of FARM_FOOTPRINTS) {
          if (Math.abs(x - f.x) > 20 || Math.abs(z - f.z) > 20) continue;
          if (footprintDist(f, x, z) < 0.4) { d = 0; break; }
        }
        // The challenge stages stand on clear, short turf (their props must
        // read cleanly from the challenge cameras): no tufts on those pads.
        const pd = nearestPad(x, z);
        if (pd.id && STAGE_PADS.has(pd.id)) d *= smoothstep(-0.5, 3, pd.e);
        else if (pd.e < 0 && pd.id !== "homestead" && pd.id !== "summit" && pd.id !== "arrival") d *= 0.55;
        if (Math.hypot(x - SHOP_AREA.x, z - (SHOP_AREA.z + 4)) < 9) d *= smoothstep(6, 9, Math.hypot(x - SHOP_AREA.x, z - (SHOP_AREA.z + 4)));
        d *= 0.6 + 0.4 * smoothstep(0.25, 0.6, fbm(x / 16, z / 16, 2, 71));
      }
      c.setRGB(cols[k * 3], cols[k * 3 + 1], cols[k * 3 + 2]).convertLinearToSRGB();
      cData[k * 4] = Math.round(Math.min(1, c.r) * 255);
      cData[k * 4 + 1] = Math.round(Math.min(1, c.g) * 255);
      cData[k * 4 + 2] = Math.round(Math.min(1, c.b) * 255);
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

export function FarmGrassField({ high = true }) {
  const shaderRef = useRef(null);
  const { FIELD, SIDE } = high ? GRASS_HIGH : GRASS_LOW;
  const { geo, mat } = useMemo(() => {
    const base = buildGrassTuft();
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    for (const k of Object.keys(base.attributes)) geo.setAttribute(k, base.attributes[k]);
    const N = SIDE * SIDE;
    const off = new Float32Array(N * 2);
    let s = 24680;
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
          float sc = gc.a * (0.7 + 0.75 * hs) * (1.0 - smoothstep(S * 0.32, S * 0.48, dist));
          float ang = hs * 6.2831;
          vec3 p = position * sc;
          p = vec3(p.x * cos(ang) - p.z * sin(ang), p.y * 1.15, p.x * sin(ang) + p.z * cos(ang));
          float tip = clamp(position.y / 0.5, 0.0, 1.0);
          // A rolling breeze across the paddocks + the bend away from the player.
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
    mat.customProgramCacheKey = () => `farm-grassfield-v1-${FIELD}`;
    return { geo, mat };
  }, [FIELD, SIDE]);
  useFrame(({ camera }) => {
    const sh = shaderRef.current;
    if (!sh) return;
    const cx = playerState.x * 0.75 + camera.position.x * 0.25;
    const cz = playerState.z * 0.75 + camera.position.z * 0.25;
    sh.uniforms.uCenter.value.set(cx, cz);
    sh.uniforms.uPlayer.value.set(playerState.x, playerState.y || 0, playerState.z);
  });
  return <mesh geometry={geo} material={mat} frustumCulled={false} receiveShadow />;
}
