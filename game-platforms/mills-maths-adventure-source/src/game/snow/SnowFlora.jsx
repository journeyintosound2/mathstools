import React, { useMemo } from "react";
import * as THREE from "three";

import { getSnowProps } from "../../data/snow/snowProps.js";
import {
  buildSnowFir, buildSpruce, buildSpikyPine, buildBirch, buildSnowRock, buildSnowShrub, buildDrift, buildSnowLog,
  buildSnowStump, buildTuft, buildIceCrystal,
} from "./snowGeometry.js";
import { makeFoliageMaterial } from "../jungle/jungleMaterials.js";
import InstancedChunks from "../jungle/InstancedChunks.jsx";

/**
 * SNOW FLORA — the pine forests (snow-laden firs + tall spruces on the
 * rising snowfields and mountainsides, the spiky SM64-style pines dotted over
 * the open snow, bare birches by the frozen river), snow-capped boulders and
 * jagged crags on the steep ground, and the undergrowth: snowy shrubs,
 * wind-blown drifts, fallen logs + stumps, dry grass tufts and ice crystals.
 * Tiled instancing (camera + shadow culling per tile) with LOD for the trees.
 */
const treeTint = (it, c) => {
  const t = it.tint;
  c.setRGB(0.9 + 0.14 * t, 0.94 + 0.08 * Math.sin(t * 7), 0.95 + 0.08 * (1 - t));
};
const rockTint = (it, c) => c.setRGB(0.88 + 0.16 * it.tint, 0.9 + 0.14 * it.tint, 0.94 + 0.1 * it.tint);
const plain = (it, c) => c.setRGB(1, 1, 1);
function split(items, n) {
  const out = Array.from({ length: n }, () => []);
  items.forEach((it, i) => out[Math.floor(((it.tint * 997 + i * 0.13) % 1) * n)].push(it));
  return out;
}

export function SnowTrees({ highGfx }) {
  const P = useMemo(() => getSnowProps(), []);
  const mats = useMemo(() => ({
    pine: makeFoliageMaterial({ sway: 0.3, key: "snow-pine", roughness: 0.9 }),
    // The flat star tiers light as if they face the sky (bright snow on top).
    spiky: makeFoliageMaterial({ sway: 0.3, key: "snow-spiky", roughness: 0.85 }),
    birch: makeFoliageMaterial({ sway: 0.55, key: "snow-birch", roughness: 0.9 }),
  }), []);
  const geos = useMemo(() => ({
    fir: [buildSnowFir(3), buildSnowFir(11, { height: 12 })],
    firLod: [buildSnowFir(3, { lod: true }), buildSnowFir(11, { lod: true, height: 12 })],
    firFar: [buildSnowFir(3, { far: true }), buildSnowFir(11, { far: true, height: 12 })],
    spruce: [buildSpruce(5), buildSpruce(23, { height: 15 })],
    spruceLod: [buildSpruce(5, { lod: true }), buildSpruce(23, { lod: true, height: 15 })],
    spruceFar: [buildSpruce(5, { far: true }), buildSpruce(23, { far: true, height: 15 })],
    spiky: buildSpikyPine(2), spikyLod: buildSpikyPine(2, { lod: true }),
    birch: buildBirch(4), birchLod: buildBirch(4, { lod: true }),
  }), []);
  const T = P.trees;
  const firs = useMemo(() => split(T.fir, 2), [T]);
  const spruces = useMemo(() => split(T.spruce, 2), [T]);
  const shadows = highGfx;
  const lodNear = highGfx ? 60 : 40;
  const lodFar = highGfx ? 150 : 105;
  return (
    <group>
      {firs.map((items, i) => (
        <InstancedChunks key={`f${i}`} items={items} geometry={geos.fir[i]} lodGeometry={geos.firLod[i]} lodDist={lodNear} farGeometry={geos.firFar[i]} farDist={lodFar} material={mats.pine} castShadow={shadows} tintFn={treeTint} sink={0.2} />
      ))}
      {spruces.map((items, i) => (
        <InstancedChunks key={`s${i}`} items={items} geometry={geos.spruce[i]} lodGeometry={geos.spruceLod[i]} lodDist={lodNear} farGeometry={geos.spruceFar[i]} farDist={lodFar} material={mats.pine} castShadow={shadows} tintFn={treeTint} sink={0.2} />
      ))}
      <InstancedChunks items={T.spiky} geometry={geos.spiky} lodGeometry={geos.spikyLod} lodDist={lodNear} material={mats.spiky} castShadow={shadows} receiveShadow={false} tintFn={treeTint} sink={0.15} maxDist={lodFar + 60} />
      <InstancedChunks items={T.birch} geometry={geos.birch} lodGeometry={geos.birchLod} lodDist={lodNear - 10} material={mats.birch} castShadow={shadows} tintFn={treeTint} sink={0.15} maxDist={lodFar + 40} />
    </group>
  );
}

export function SnowRocks({ highGfx }) {
  const P = useMemo(() => getSnowProps(), []);
  const mat = useMemo(() => makeFoliageMaterial({ sway: 0, key: "snow-rock", roughness: 0.92, flat: true }), []);
  const geos = useMemo(() => ({
    rock: [buildSnowRock(3), buildSnowRock(9), buildSnowRock(21)],
    crag: [buildSnowRock(5, { crag: true }), buildSnowRock(13, { crag: true })],
  }), []);
  const rocks = useMemo(() => split(P.rocks, 3), [P]);
  const crags = useMemo(() => split(P.crags.map((c) => ({ ...c, rx: c.tilt, rz: c.tilt * 0.6 })), 2), [P]);
  return (
    <group>
      {rocks.map((items, i) => (
        <InstancedChunks key={`r${i}`} items={items} geometry={geos.rock[i]} material={mat} castShadow={highGfx} tintFn={rockTint} sink={0.18} maxDist={170} />
      ))}
      {crags.map((items, i) => (
        <InstancedChunks key={`c${i}`} items={items} geometry={geos.crag[i]} material={mat} castShadow={highGfx} tintFn={rockTint} sink={0.35} tile={96} />
      ))}
    </group>
  );
}

export function SnowUndergrowth({ highGfx }) {
  const P = useMemo(() => getSnowProps(), []);
  const mats = useMemo(() => ({
    soft: makeFoliageMaterial({ sway: 0.25, key: "snow-shrub", roughness: 0.95 }),
    still: makeFoliageMaterial({ sway: 0, key: "snow-still", roughness: 0.95 }),
    tuft: makeFoliageMaterial({ sway: 1.1, key: "snow-tuft", side: THREE.DoubleSide }),
    crystal: makeFoliageMaterial({ sway: 0, key: "snow-crystal", roughness: 0.2, emissive: "#245f7c", flat: true }),
  }), []);
  const geos = useMemo(() => ({
    shrub: [buildSnowShrub(2), buildSnowShrub(7)],
    drift: buildDrift(3),
    log: buildSnowLog(1), stump: buildSnowStump(1),
    tuft: buildTuft(5), crystal: buildIceCrystal(3),
  }), []);
  const shrubs = useMemo(() => split(P.shrubs, 2), [P]);
  const drifts = useMemo(() => P.drifts.map((d) => ({ ...d, s: 1, sx: d.sx, sy: d.h * 2, sz: d.sz, tint: 0.5 })), [P]);
  const near = highGfx ? 95 : 65;
  return (
    <group>
      {shrubs.map((items, i) => (
        <InstancedChunks key={`sh${i}`} items={items} geometry={geos.shrub[i]} material={mats.soft} tile={48} maxDist={near + 30} tintFn={rockTint} sink={0.1} castShadow={highGfx} />
      ))}
      <InstancedChunks items={drifts} geometry={geos.drift} material={mats.still} tile={64} maxDist={near + 60} tintFn={plain} />
      <InstancedChunks items={P.logs} geometry={geos.log} material={mats.still} tile={48} maxDist={near + 20} tintFn={plain} castShadow={highGfx} />
      <InstancedChunks items={P.stumps} geometry={geos.stump} material={mats.still} tile={48} maxDist={near + 20} tintFn={plain} castShadow={highGfx} />
      <InstancedChunks items={highGfx ? P.tufts : P.tufts.filter((_, i) => i % 2 === 0)} geometry={geos.tuft} material={mats.tuft} tile={40} maxDist={near - 25} tintFn={rockTint} />
      <InstancedChunks items={P.crystals.map((c) => ({ ...c, rz: c.lean }))} geometry={geos.crystal} material={mats.crystal} tile={48} maxDist={near + 30} tintFn={plain} />
    </group>
  );
}
