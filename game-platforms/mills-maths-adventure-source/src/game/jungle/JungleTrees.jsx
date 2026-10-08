import React, { useMemo } from "react";
import * as THREE from "three";

import { getJungleProps } from "../../data/jungle/jungleProps.js";
import { escarpZ, terrainHeight, PLATEAU_H, VINE_WALLS, TEMPLE, ensureJungleStructures } from "../../data/jungle/jungleLayout.js";
import { buildBroadleaf, buildConifer, buildGiant, buildPalmTrunk, buildPalmFronds, buildVineStrip } from "./jungleGeometry.js";
import { makeFoliageMaterial, getJungleTextures } from "./jungleMaterials.js";
import InstancedChunks from "./InstancedChunks.jsx";

/**
 * JUNGLE TREES — every tree in the valley + on the rim's lower slopes, as
 * tiled instanced meshes: broadleaf jungle trees (two shapes), emergent
 * giants with buttress roots, spruces/conifers, Redwood Hollow's giant
 * redwoods, and leaning palms. Plus the HANGING VINES (from the emergents,
 * some broadleaves, the cliff lips and the temple).
 */
function split(items, n) {
  const out = Array.from({ length: n }, () => []);
  items.forEach((it, i) => out[Math.floor(((it.tint * 997 + i * 0.13) % 1) * n)].push(it));
  return out;
}
const leafTint = (it, c) => {
  // Yellow-green ↔ blue-green ↔ deep green, a little brighter on the plateau.
  const t = it.tint;
  c.setRGB(0.86 + 0.22 * t, 0.94 + 0.08 * Math.sin(t * 9), 0.82 + 0.16 * (1 - t));
  if (it.deco) c.multiplyScalar(0.92);
};
const plainTint = (it, c) => c.setRGB(0.92 + 0.12 * it.tint, 0.92 + 0.1 * it.tint, 0.92 + 0.1 * it.tint);

export default function JungleTrees({ highGfx }) {
  const props = useMemo(() => getJungleProps(), []);
  const mats = useMemo(() => ({
    tree: makeFoliageMaterial({ sway: 1, leafy: true, key: "tree" }),
    giant: makeFoliageMaterial({ sway: 0.45, leafy: true, key: "giant" }),
    frond: makeFoliageMaterial({ sway: 1.6, map: getJungleTextures().palm, alphaTest: 0.32, side: THREE.DoubleSide, key: "frond" }),
    vine: makeFoliageMaterial({ sway: 2.2, map: getJungleTextures().vine, alphaTest: 0.4, side: THREE.DoubleSide, key: "vine" }),
  }), []);
  const geos = useMemo(() => {
    const p1 = buildPalmTrunk(3, { height: 8, lean: 0.2 });
    const p2 = buildPalmTrunk(8, { height: 9.4, lean: 0.14 });
    return {
      broad: [buildBroadleaf(11, { height: 10 }), buildBroadleaf(23, { height: 11.5, spread: 1.12 })],
      broadLod: [buildBroadleaf(11, { height: 10, lod: true }), buildBroadleaf(23, { height: 11.5, spread: 1.12, lod: true })],
      broadFar: [buildBroadleaf(11, { height: 10, far: true }), buildBroadleaf(23, { height: 11.5, spread: 1.12, far: true })],
      emergent: buildBroadleaf(5, { height: 17, emergent: true }),
      emergentLod: buildBroadleaf(5, { height: 17, emergent: true, lod: true }),
      conifer: [buildConifer(4, { height: 13 }), buildConifer(9, { height: 15.5 })],
      coniferLod: [buildConifer(4, { height: 13, lod: true }), buildConifer(9, { height: 15.5, lod: true })],
      coniferFar: [buildConifer(4, { height: 13, far: true }), buildConifer(9, { height: 15.5, far: true })],
      giant: [buildGiant(2, { height: 34 }), buildGiant(6, { height: 38 })],
      giantLod: [buildGiant(2, { height: 34, lod: true }), buildGiant(6, { height: 38, lod: true })],
      palmTrunk: [p1, p2],
      palmFronds: [buildPalmFronds(3, p1.userData.top), buildPalmFronds(8, p2.userData.top)],
      vine: buildVineStrip(),
    };
  }, []);
  const T = props.trees;
  const broadSplit = useMemo(() => split(T.broadleaf, 2), [T]);
  const conSplit = useMemo(() => split(T.conifer, 2), [T]);
  const giantSplit = useMemo(() => split(T.giant, 2), [T]);
  const palmSplit = useMemo(() => split(T.palm, 2).map((arr) => arr.map((p) => ({ ...p, y: p.y - 0.1 }))), [T]);
  const vines = useMemo(() => buildVines(props), [props]);
  // Low graphics: the canopy shade is baked into the ground colours instead
  // (tree shadow passes are the single biggest cost on a tablet).
  const shadows = highGfx;
  // Tiles further than this swap to the low-poly versions of the trees.
  const lodNear = highGfx ? 60 : 36;
  const lodFar = highGfx ? 150 : 100;

  return (
    <group>
      {broadSplit.map((items, i) => (
        <InstancedChunks key={`b${i}`} items={items} geometry={geos.broad[i]} lodGeometry={geos.broadLod[i]} lodDist={lodNear} farGeometry={geos.broadFar[i]} farDist={lodFar} material={mats.tree} castShadow={shadows} tintFn={leafTint} sink={0.15} />
      ))}
      <InstancedChunks items={T.emergent} geometry={geos.emergent} lodGeometry={geos.emergentLod} lodDist={lodNear + 20} material={mats.tree} castShadow={shadows} tintFn={leafTint} sink={0.2} />
      {conSplit.map((items, i) => (
        <InstancedChunks key={`c${i}`} items={items} geometry={geos.conifer[i]} lodGeometry={geos.coniferLod[i]} lodDist={lodNear} farGeometry={geos.coniferFar[i]} farDist={lodFar} material={mats.tree} castShadow={shadows} tintFn={leafTint} sink={0.15} />
      ))}
      {giantSplit.map((items, i) => (
        <InstancedChunks key={`g${i}`} items={items} geometry={geos.giant[i]} lodGeometry={geos.giantLod[i]} lodDist={lodNear + 30} material={mats.giant} castShadow={shadows} tintFn={plainTint} sink={0.3} tile={96} />
      ))}
      {palmSplit.map((items, i) => (
        <group key={`p${i}`}>
          <InstancedChunks items={items} geometry={geos.palmTrunk[i]} material={mats.tree} castShadow={shadows} tintFn={plainTint} />
          <InstancedChunks items={items} geometry={geos.palmFronds[i]} material={mats.frond} castShadow={shadows} tintFn={leafTint} />
        </group>
      ))}
      <InstancedChunks items={vines} geometry={geos.vine} material={mats.vine} castShadow={false} tintFn={leafTint} maxDist={highGfx ? 120 : 70} />
    </group>
  );
}

/** Hanging vines: from emergent canopies, some broadleaves, the cliff lips, the temple. */
function buildVines(props) {
  ensureJungleStructures();
  const out = [];
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (const t of props.trees.emergent) {
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + rnd();
      const r = (2.2 + rnd() * 2.4) * t.s;
      out.push({ x: t.x + Math.cos(a) * r, y: t.y + (13.2 + rnd() * 1.5) * t.s, z: t.z + Math.sin(a) * r, s: 1, sy: (5 + rnd() * 6) * t.s, rot: rnd() * 6.28, tint: rnd() });
    }
  }
  props.trees.broadleaf.forEach((t, i) => {
    if (t.deco || i % 4) return;
    for (let k = 0; k < 2; k++) {
      const a = rnd() * Math.PI * 2;
      const r = (1.4 + rnd() * 1.4) * t.s;
      out.push({ x: t.x + Math.cos(a) * r, y: t.y + (7.0 + rnd()) * t.s, z: t.z + Math.sin(a) * r, s: 1, sy: (2.5 + rnd() * 3) * t.s, rot: rnd() * 6.28, tint: rnd() });
    }
  });
  props.trees.giant.forEach((t) => {
    for (let k = 0; k < 4; k++) {
      const a = rnd() * Math.PI * 2;
      const r = (3 + rnd() * 2.5) * t.s;
      out.push({ x: t.x + Math.cos(a) * r, y: t.y + (17 + rnd() * 4) * t.s, z: t.z + Math.sin(a) * r, s: 1.2, sy: (6 + rnd() * 7) * t.s, rot: rnd() * 6.28, tint: rnd() });
    }
  });
  // Vine curtains over the escarpment's sheer stretches (the Vine Cliffs and
  // round the falls) — not over the climbing walls themselves (those carry
  // their own dense vine mesh).
  for (let x = -60; x <= 26; x += 0.9 + rnd() * 0.9) {
    if (x > 6 && x < 19) continue; // the falls
    if (VINE_WALLS.some((w) => x > Math.min(w.a[0], w.b[0]) - 0.6 && x < Math.max(w.a[0], w.b[0]) + 0.6)) continue;
    const z = escarpZ(x) - 3.0;
    const top = terrainHeight(x, z);
    if (top < PLATEAU_H - 1.5) continue;
    out.push({ x, y: top + 0.1, z: z + 0.8 + rnd() * 0.6, s: 1.1, sy: 4 + rnd() * 9, rot: rnd() * 0.6 - 0.3, tint: rnd() });
  }
  // Temple facade.
  if (TEMPLE) {
    const fx = TEMPLE.c[0] + 0.9;
    for (let z = TEMPLE.c[1] - 9.5; z <= TEMPLE.c[1] + 9.5; z += 0.8 + rnd() * 0.8) {
      if (Math.abs(z - TEMPLE.arch.z) < 2.6 && rnd() < 0.6) continue;
      out.push({ x: fx + rnd() * 0.3, y: TEMPLE.roofY + 0.2, z, s: 1.1, sy: 1.5 + rnd() * 5.5, rot: Math.PI / 2 + (rnd() - 0.5) * 0.4, tint: rnd() });
    }
  }
  return out;
}
