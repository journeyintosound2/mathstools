import React, { useMemo } from "react";
import * as THREE from "three";

import { SCHOOL_TREES, SCHOOL_SHRUBS } from "../../data/schoolyard/schoolyardProps.js";
import { rng } from "../../data/schoolyard/schoolyardGeom.js";
import { terrainHeight, slopeAt, schoolSolidTopAt, nearestSchoolPath } from "../../data/schoolyard/schoolyardTerrain.js";
import { SCHOOL_FENCE } from "../../data/schoolyard/schoolyardLayout.js";
import { makeFoliageMaterial, getJungleTextures } from "../jungle/jungleMaterials.js";
import { buildRock, buildBush } from "../jungle/jungleGeometry.js";
import InstancedChunks from "../jungle/InstancedChunks.jsx";
import {
  buildFig, buildNorfolk, buildJacaranda, buildPaperbark, buildBangalow, buildTreeFern, buildFrangipani, buildBanana,
  buildCordyline, buildLomandra, buildAgapanthus, buildHedge, buildGum,
} from "./schoolGeometry.js";

/**
 * PLAYGROUND FLORA — the quad's three great figs, Norfolk Island pines along
 * the fence + round the oval, October-purple jacarandas, spotted gums +
 * paperbarks + tree ferns on the bush hill, Bangalow palms by the office,
 * frangipani, the ag plot's bananas; red cordylines, lomandra + agapanthus
 * in the planters; bushes + sandstone boulders on the hill. Tiled
 * instancing with LOD (the island's recipe).
 */
const leafTint = (it, c) => {
  const t = it.tint ?? 0.5;
  c.setRGB(0.9 + 0.2 * t, 0.96 + 0.08 * Math.sin(t * 9), 0.86 + 0.12 * (1 - t));
};
const plainTint = (it, c) => {
  const t = it.tint ?? 0.5;
  c.setRGB(0.92 + 0.12 * t, 0.92 + 0.1 * t, 0.92 + 0.1 * t);
};
function split(items, n) {
  const out = Array.from({ length: n }, () => []);
  items.forEach((it, i) => out[i % n].push(it));
  return out;
}
const withTint = (list) => list.map((t, i) => ({ ...t, tint: ((i * 0.618) % 1) }));

export function SchoolTrees({ highGfx }) {
  const tex = getJungleTextures();
  const mats = useMemo(() => ({
    tree: makeFoliageMaterial({ sway: 0.7, leafy: true, key: "sy-tree" }),
    pine: makeFoliageMaterial({ sway: 0.35, key: "sy-pine", roughness: 0.9 }),
    frond: makeFoliageMaterial({ sway: 1.4, map: tex.palm, alphaTest: 0.32, side: THREE.DoubleSide, key: "sy-frond" }),
    fern: makeFoliageMaterial({ sway: 0.8, map: tex.fern, alphaTest: 0.45, side: THREE.DoubleSide, key: "sy-fern" }),
    leaf: makeFoliageMaterial({ sway: 0.8, side: THREE.DoubleSide, key: "sy-bananaleaf", roughness: 0.6 }),
  }), [tex]);
  const geos = useMemo(() => ({
    fig: [buildFig(3), buildFig(9)], figLod: [buildFig(3, { lod: true }), buildFig(9, { lod: true })],
    norfolk: [buildNorfolk(4), buildNorfolk(12)], norfolkLod: [buildNorfolk(4, { lod: true }), buildNorfolk(12, { lod: true })],
    norfolkFar: [buildNorfolk(4, { far: true }), buildNorfolk(12, { far: true })],
    jacaranda: buildJacaranda(17), jacarandaLod: buildJacaranda(17, { lod: true }),
    gum: [buildGum(3), buildGum(21, { height: 16 })], gumLod: [buildGum(3, { lod: true }), buildGum(21, { height: 16, lod: true })],
    gumFar: [buildGum(3, { far: true }), buildGum(21, { height: 16, far: true })],
    paperbark: buildPaperbark(5), paperbarkLod: buildPaperbark(5, { lod: true }),
    bangalow: buildBangalow(7),
    treefern: [buildTreeFern(2), buildTreeFern(8)],
    frangipani: buildFrangipani(4),
    banana: buildBanana(6),
  }), []);
  const T = useMemo(() => {
    const by = {};
    for (const t of withTint(SCHOOL_TREES)) (by[t.kind] = by[t.kind] || []).push(t);
    return by;
  }, []);
  const shadows = highGfx;
  const lodNear = highGfx ? 70 : 45;
  const lodFar = highGfx ? 170 : 120;
  const figs = split(T.fig || [], 2), norfolks = split(T.norfolk || [], 2), gums = split(T.gum || [], 2), ferns = split(T.treefern || [], 2);
  return (
    <group>
      {figs.map((items, i) => <InstancedChunks key={`f${i}`} items={items} geometry={geos.fig[i]} lodGeometry={geos.figLod[i]} lodDist={lodNear + 20} material={mats.tree} castShadow={shadows} tintFn={leafTint} sink={0.1} />)}
      {norfolks.map((items, i) => <InstancedChunks key={`n${i}`} items={items} geometry={geos.norfolk[i]} lodGeometry={geos.norfolkLod[i]} lodDist={lodNear} farGeometry={geos.norfolkFar[i]} farDist={lodFar} material={mats.pine} castShadow={shadows} tintFn={leafTint} sink={0.15} />)}
      {gums.map((items, i) => <InstancedChunks key={`g${i}`} items={items} geometry={geos.gum[i]} lodGeometry={geos.gumLod[i]} lodDist={lodNear} farGeometry={geos.gumFar[i]} farDist={lodFar} material={mats.tree} castShadow={shadows} tintFn={leafTint} sink={0.15} />)}
      <InstancedChunks items={T.jacaranda || []} geometry={geos.jacaranda} lodGeometry={geos.jacarandaLod} lodDist={lodNear} material={mats.tree} castShadow={shadows} tintFn={plainTint} sink={0.1} />
      <InstancedChunks items={T.paperbark || []} geometry={geos.paperbark} lodGeometry={geos.paperbarkLod} lodDist={lodNear} material={mats.tree} castShadow={shadows} tintFn={leafTint} sink={0.1} />
      <InstancedChunks items={T.bangalow || []} geometry={geos.bangalow} material={mats.frond} castShadow={shadows} tintFn={leafTint} />
      {ferns.map((items, i) => <InstancedChunks key={`t${i}`} items={items} geometry={geos.treefern[i]} material={mats.fern} castShadow={shadows} tintFn={leafTint} maxDist={110} />)}
      <InstancedChunks items={T.frangipani || []} geometry={geos.frangipani} material={mats.tree} castShadow={shadows} tintFn={plainTint} maxDist={120} />
      <InstancedChunks items={T.banana || []} geometry={geos.banana} material={mats.leaf} castShadow={shadows} tintFn={leafTint} maxDist={120} />
    </group>
  );
}

export function SchoolShrubs({ highGfx }) {
  const mats = useMemo(() => ({
    soft: makeFoliageMaterial({ sway: 0.5, leafy: true, key: "sy-soft" }),
    strap: makeFoliageMaterial({ sway: 0.9, side: THREE.DoubleSide, key: "sy-strap" }),
    hedge: makeFoliageMaterial({ sway: 0.1, leafy: true, key: "sy-hedge" }),
    rock: makeFoliageMaterial({ sway: 0, key: "sy-rock", roughness: 0.95, flat: true }),
  }), []);
  const geos = useMemo(() => ({
    bush: [buildBush(2), buildBush(5)],
    cordyline: [buildCordyline(1), buildCordyline(4)],
    lomandra: buildLomandra(3), agapanthus: buildAgapanthus(5), hedge: buildHedge(2),
    rock: [buildRock(2), buildRock(7)],
  }), []);
  const S = useMemo(() => {
    const by = {};
    for (const t of withTint(SCHOOL_SHRUBS)) (by[t.kind] = by[t.kind] || []).push(t.kind === "hedge" ? { ...t, rot: 0 } : t);
    // Sandstone boulders scattered on the bush hill + Beacon Hill's edge.
    const R = rng(7713);
    const rocks = [];
    for (let k = 0; k < 900 && rocks.length < 90; k++) {
      const x = SCHOOL_FENCE.xMin + 2 + R() * (SCHOOL_FENCE.xMax - SCHOOL_FENCE.xMin - 4), z = SCHOOL_FENCE.zMin + 2 + R() * 30;
      if (schoolSolidTopAt(x, z) !== null || slopeAt(x, z) > 1.2) continue;
      const np = nearestSchoolPath(x, z);
      if (np && np.e < 1.5) continue;
      rocks.push({ x, z, y: terrainHeight(x, z), s: 0.5 + R() * 0.9, rot: R() * 6.28, tint: R() });
    }
    by.rock = rocks;
    return by;
  }, []);
  const near = highGfx ? 95 : 60;
  return (
    <group>
      {split(S.bush || [], 2).map((items, i) => <InstancedChunks key={`b${i}`} items={items} geometry={geos.bush[i]} material={mats.soft} tile={64} maxDist={near + 30} castShadow={highGfx} tintFn={leafTint} />)}
      {split(S.cordyline || [], 2).map((items, i) => <InstancedChunks key={`c${i}`} items={items} geometry={geos.cordyline[i]} material={mats.strap} tile={64} maxDist={near} tintFn={plainTint} />)}
      <InstancedChunks items={S.lomandra || []} geometry={geos.lomandra} material={mats.strap} tile={64} maxDist={near - 15} tintFn={leafTint} />
      <InstancedChunks items={S.agapanthus || []} geometry={geos.agapanthus} material={mats.strap} tile={64} maxDist={near - 15} tintFn={plainTint} />
      <InstancedChunks items={S.hedge || []} geometry={geos.hedge} material={mats.hedge} tile={64} maxDist={near + 30} castShadow={highGfx} tintFn={plainTint} />
      {split(S.rock || [], 2).map((items, i) => <InstancedChunks key={`r${i}`} items={items} geometry={geos.rock[i]} material={mats.rock} tile={96} castShadow tintFn={(it, c) => c.setRGB(0.95 + 0.1 * it.tint, 0.82 + 0.08 * it.tint, 0.62)} sink={0.12} />)}
    </group>
  );
}
