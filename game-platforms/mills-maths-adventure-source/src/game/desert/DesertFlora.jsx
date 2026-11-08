import React, { useMemo } from "react";
import * as THREE from "three";

import { getDesertProps } from "../../data/desert/desertProps.js";
import { makeFoliageMaterial, getJungleTextures } from "../jungle/jungleMaterials.js";
import { buildPalmTrunk, buildPalmFronds, buildReeds, buildLily } from "../jungle/jungleGeometry.js";
import InstancedChunks from "../jungle/InstancedChunks.jsx";
import {
  buildSaguaro, buildBarrel, buildPricklyPear, buildShrub, buildTuft, buildBoulder, buildScree, buildBones, buildTumbleweed, buildPot,
} from "./desertGeometry.js";
import { POOL_LEVEL } from "../../data/desert/desertTerrain.js";

/**
 * DESERT FLORA — every cactus (saguaros with their arms, barrels, prickly
 * pears), the oasis + town palms, dry scrub + grass, sandstone boulders and
 * scree, bleached bones, resting tumbleweeds, pots and the oasis's reeds +
 * lilies. Each kind is one instanced draw per map tile (InstancedChunks), so
 * the camera + the shadow camera cull whole tiles; small things fade out with
 * distance and the saguaros swap to a cheap version far away.
 */
const split = (arr, n, key = (_t, i) => i) => {
  const out = Array.from({ length: n }, () => []);
  arr.forEach((t, i) => out[key(t, i) % n].push(t));
  return out;
};
const sandTint = (it, c) => c.setRGB(0.9 + 0.16 * it.tint, 0.9 + 0.12 * it.tint, 0.88 + 0.1 * it.tint);
const cactusTint = (it, c) => c.setRGB(0.86 + 0.2 * it.tint, 0.9 + 0.14 * it.tint, 0.84 + 0.12 * (1 - it.tint));
const leafTint = (it, c) => c.setRGB(0.9 + 0.18 * it.tint, 0.96 + 0.06 * Math.sin(it.tint * 9), 0.84 + 0.14 * (1 - it.tint));
const tuftTint = (it, c) => {
  // Straw out in the sand; fresh green round the oasis.
  const g = it.green || 0;
  c.setRGB(0.95 + 0.1 * it.tint - g * 0.45, 0.95 + 0.06 * it.tint - g * 0.05, 0.9 + 0.1 * it.tint - g * 0.5);
};

export default function DesertFlora({ highGfx }) {
  const P = useMemo(() => getDesertProps(), []);
  const mats = useMemo(() => ({
    cactus: makeFoliageMaterial({ sway: 0, key: "d-cactus", roughness: 0.75 }),
    plain: makeFoliageMaterial({ sway: 0, key: "d-plain", roughness: 0.95 }),
    scrub: makeFoliageMaterial({ sway: 0.5, key: "d-scrub" }),
    grass: makeFoliageMaterial({ sway: 1.4, side: THREE.DoubleSide, key: "d-grass" }),
    tree: makeFoliageMaterial({ sway: 0.6, key: "d-palm" }),
    frond: makeFoliageMaterial({ sway: 1.5, map: getJungleTextures().palm, alphaTest: 0.32, side: THREE.DoubleSide, key: "d-frond" }),
    reed: makeFoliageMaterial({ sway: 1.4, side: THREE.DoubleSide, key: "d-reed" }),
    lily: makeFoliageMaterial({ sway: 0.2, side: THREE.DoubleSide, key: "d-lily" }),
  }), []);
  const geos = useMemo(() => {
    const p1 = buildPalmTrunk(5, { height: 8.4, lean: 0.22 });
    const p2 = buildPalmTrunk(13, { height: 10, lean: 0.12 });
    return {
      saguaro: [0, 1, 2, 3].map((arms) => buildSaguaro(7 + arms * 11, arms)),
      saguaroLod: [0, 1, 2, 3].map((arms) => buildSaguaro(7 + arms * 11, arms, { lod: true })),
      barrel: [buildBarrel(3), buildBarrel(9)],
      pear: [buildPricklyPear(4), buildPricklyPear(17)],
      shrub: [buildShrub(2), buildShrub(8)],
      tuft: buildTuft(5),
      boulder: [buildBoulder(3), buildBoulder(12)],
      scree: buildScree(6),
      bones: [buildBones(1), buildBones(5)],
      tumble: buildTumbleweed(4),
      pots: [buildPot(1, 0), buildPot(2, 1), buildPot(3, 2)],
      palmTrunk: [p1, p2],
      palmFronds: [buildPalmFronds(5, p1.userData.top), buildPalmFronds(13, p2.userData.top)],
      reeds: buildReeds(3),
      lily: [buildLily(2, false), buildLily(6, true)],
    };
  }, []);
  const saguaros = useMemo(() => split(P.saguaro, 4, (t) => t.arms || 0), [P]);
  const barrels = useMemo(() => split(P.barrel, 2), [P]);
  const pears = useMemo(() => split(P.pear, 2), [P]);
  const shrubs = useMemo(() => split(P.shrub, 2), [P]);
  const boulders = useMemo(() => split(P.boulder, 2), [P]);
  const bones = useMemo(() => split(P.bones, 2), [P]);
  const pots = useMemo(() => split(P.pots, 3, (t) => t.v || 0), [P]);
  const palms = useMemo(() => split(P.palm, 2).map((a) => a.map((p) => ({ ...p, y: p.y - 0.1 }))), [P]);
  const lilies = useMemo(() => split(P.lily.map((l) => ({ ...l, y: POOL_LEVEL + 0.02 })), 2, (t) => (t.flower ? 1 : 0)), [P]);
  const tufts = useMemo(() => (highGfx ? P.tuft : P.tuft.filter((_, i) => i % 2 === 0)), [P, highGfx]);
  const shadows = highGfx;
  const small = highGfx ? 70 : 45;

  return (
    <group>
      {saguaros.map((items, i) => (
        <InstancedChunks key={`s${i}`} items={items} geometry={geos.saguaro[i]} lodGeometry={geos.saguaroLod[i]} lodDist={highGfx ? 70 : 45} material={mats.cactus} castShadow={shadows} tintFn={cactusTint} sink={0.1} />
      ))}
      {barrels.map((items, i) => <InstancedChunks key={`b${i}`} items={items} geometry={geos.barrel[i]} material={mats.cactus} castShadow={shadows} tintFn={cactusTint} maxDist={small} sink={0.05} />)}
      {pears.map((items, i) => <InstancedChunks key={`p${i}`} items={items} geometry={geos.pear[i]} material={mats.cactus} castShadow={shadows} tintFn={cactusTint} maxDist={small + 10} sink={0.05} />)}
      {palms.map((items, i) => (
        <group key={`palm${i}`}>
          <InstancedChunks items={items} geometry={geos.palmTrunk[i]} material={mats.tree} castShadow={shadows} tintFn={sandTint} />
          <InstancedChunks items={items} geometry={geos.palmFronds[i]} material={mats.frond} castShadow={shadows} tintFn={leafTint} />
        </group>
      ))}
      {shrubs.map((items, i) => <InstancedChunks key={`sh${i}`} items={items} geometry={geos.shrub[i]} material={mats.scrub} tintFn={sandTint} maxDist={small} sink={0.05} />)}
      <InstancedChunks items={tufts} geometry={geos.tuft} material={mats.grass} tintFn={tuftTint} maxDist={highGfx ? 48 : 32} />
      {boulders.map((items, i) => <InstancedChunks key={`r${i}`} items={items} geometry={geos.boulder[i]} material={mats.plain} castShadow={shadows} tintFn={sandTint} sink={0.15} />)}
      <InstancedChunks items={P.scree} geometry={geos.scree} material={mats.plain} tintFn={sandTint} maxDist={small} />
      {bones.map((items, i) => <InstancedChunks key={`bo${i}`} items={items} geometry={geos.bones[i]} material={mats.plain} tintFn={sandTint} maxDist={small} />)}
      <InstancedChunks items={P.tumble} geometry={geos.tumble} material={mats.plain} castShadow={shadows} tintFn={sandTint} maxDist={small} />
      {pots.map((items, i) => <InstancedChunks key={`pot${i}`} items={items} geometry={geos.pots[i]} material={mats.plain} castShadow={shadows} tintFn={sandTint} maxDist={small} />)}
      <InstancedChunks items={P.reeds} geometry={geos.reeds} material={mats.reed} tintFn={leafTint} maxDist={small} />
      {lilies.map((items, i) => <InstancedChunks key={`l${i}`} items={items} geometry={geos.lily[i]} material={mats.lily} tintFn={leafTint} maxDist={small} />)}
    </group>
  );
}
