import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  COW_WANDER, DAIRY_COW_WANDER, SHEEP_WANDER, PIG_WANDER, CHOOK_WANDER, RABBIT_WANDER, FARM_POND,
} from "../../data/farm/farmLayout.js";
import { terrainHeight, farmWaterAt, POND_LEVEL, slopeAt } from "../../data/farm/farmTerrain.js";
import { FARM_FOOTPRINTS, footprintDist } from "../../data/farm/farmProps.js";
import { buildAnimalParts, ANIMAL_RIGS, buildDuck, buildRabbit } from "./farmGeometry.js";
import { makeFoliageMaterial } from "../jungle/jungleMaterials.js";
import { playerState } from "../sessionStore.js";

/**
 * FARM ANIMALS — the cattle in their paddock, the dairy herd, a flock of
 * sheep grazing the Downs, pigs in the pen, chooks scratching round the
 * coop, ducks paddling the pond and rabbits in the carrot patch. Each
 * species is three instanced meshes (body, head, legs): they amble to new
 * spots, lower their heads to graze, swing their legs as they walk and
 * follow the rolling ground. They shy away from a player who walks up.
 */
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const _mh = new THREE.Matrix4();
const _ml = new THREE.Matrix4();

function rngFor(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
/** A spot in the wander box that's dry, not steep and not in a building. */
function pickSpot(b, R) {
  for (let k = 0; k < 20; k++) {
    const x = b.minX + R() * (b.maxX - b.minX), z = b.minZ + R() * (b.maxZ - b.minZ);
    if (farmWaterAt(x, z) !== null || slopeAt(x, z) > 0.55) continue;
    if (FARM_FOOTPRINTS.some((f) => Math.abs(f.x - x) < 14 && Math.abs(f.z - z) < 14 && footprintDist(f, x, z) < 1.2)) continue;
    return [x, z];
  }
  return [(b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2];
}

function Herd({ kind, zone, count, seed, speed = 0.6, scale = 1, shy = 3 }) {
  const parts = useMemo(() => buildAnimalParts(kind), [kind]);
  const rig = ANIMAL_RIGS[kind];
  const mat = useMemo(() => makeFoliageMaterial({ sway: 0, key: `farm-animal-${kind}`, roughness: 0.85 }), [kind]);
  const body = useRef(), head = useRef(), legs = useRef();
  const herd = useMemo(() => {
    const R = rngFor(seed);
    return Array.from({ length: count }, () => {
      const [x, z] = pickSpot(zone, R);
      return { x, z, tx: x, tz: z, yaw: R() * 6.28, wait: R() * 4, graze: R(), phase: R() * 6.28, sp: speed * (0.8 + R() * 0.4), R, s: scale * (0.9 + R() * 0.2) };
    });
  }, [zone, count, seed, speed, scale]);
  useLayoutEffect(() => {
    for (const r of [body, head, legs]) if (r.current) r.current.frustumCulled = false;
  }, []);
  useFrame(({ camera }, dt0) => {
    const dt = Math.min(dt0, 0.05);
    const cx = (zone.minX + zone.maxX) / 2, cz = (zone.minZ + zone.maxZ) / 2;
    // Far away? Skip the work (and hide).
    const far = Math.hypot(camera.position.x - cx, camera.position.z - cz) > 170;
    for (const r of [body, head, legs]) if (r.current) r.current.visible = !far;
    if (far) return;
    const t = performance.now() / 1000;
    herd.forEach((a, i) => {
      // Shy: step away from a player who walks right up.
      const pdx = a.x - playerState.x, pdz = a.z - playerState.z;
      const pd = Math.hypot(pdx, pdz);
      if (pd < shy && pd > 0.01) {
        const [nx, nz] = [a.x + (pdx / pd) * 4, a.z + (pdz / pd) * 4];
        a.tx = Math.max(zone.minX, Math.min(zone.maxX, nx));
        a.tz = Math.max(zone.minZ, Math.min(zone.maxZ, nz));
        a.wait = 0;
      }
      const dx = a.tx - a.x, dz = a.tz - a.z;
      const d = Math.hypot(dx, dz);
      let walking = false;
      if (d < 0.3) {
        a.wait -= dt;
        if (a.wait <= 0) {
          const [nx, nz] = pickSpot(zone, a.R);
          // Mostly short ambles.
          a.tx = a.x + (nx - a.x) * 0.45; a.tz = a.z + (nz - a.z) * 0.45;
          a.wait = 3 + a.R() * 7;
          a.graze = a.R();
        }
      } else {
        const step = Math.min(d, a.sp * (pd < shy ? 2.2 : 1) * dt);
        a.x += (dx / d) * step; a.z += (dz / d) * step;
        const want = Math.atan2(dx, dz);
        let dy = want - a.yaw;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        a.yaw += dy * Math.min(1, dt * 4);
        walking = true;
      }
      const y = terrainHeight(a.x, a.z);
      // Pitch to the ground along the heading.
      const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
      const pitch = Math.atan2(terrainHeight(a.x + fx * 0.6, a.z + fz * 0.6) - terrainHeight(a.x - fx * 0.6, a.z - fz * 0.6), 1.2);
      const bob = walking ? Math.abs(Math.sin(t * 6 * a.sp + a.phase)) * 0.04 : 0;
      _e.set(-pitch, a.yaw, 0, "YXZ");
      _q.setFromEuler(_e);
      _p.set(a.x, y + bob, a.z);
      _s.set(a.s, a.s, a.s);
      _m.compose(_p, _q, _s);
      body.current.setMatrixAt(i, _m);
      // Head: down to graze while standing (a slow nod), up when walking.
      const grazing = !walking && a.graze > 0.3;
      const nod = grazing ? 0.75 + Math.sin(t * 1.3 + a.phase) * 0.12 : Math.sin(t * 2 + a.phase) * 0.05;
      _mh.makeRotationX(nod);
      _mh.setPosition(rig.neck[0], rig.neck[1], rig.neck[2]);
      _mh.premultiply(_m);
      head.current.setMatrixAt(i, _mh);
      rig.legs.forEach((L, k) => {
        const swing = walking ? Math.sin(t * 7 * a.sp + a.phase + (k % 2 === (k < 2 ? 0 : 1) ? 0 : Math.PI)) * 0.45 : 0;
        _ml.makeRotationX(swing);
        _ml.setPosition(L[0], L[1], L[2]);
        _ml.premultiply(_m);
        legs.current.setMatrixAt(i * rig.legs.length + k, _ml);
      });
    });
    body.current.instanceMatrix.needsUpdate = true;
    head.current.instanceMatrix.needsUpdate = true;
    legs.current.instanceMatrix.needsUpdate = true;
  });
  if (!parts) return null;
  return (
    <group>
      <instancedMesh ref={body} args={[parts.body, mat, count]} castShadow />
      <instancedMesh ref={head} args={[parts.head, mat, count]} castShadow />
      <instancedMesh ref={legs} args={[parts.leg, mat, count * rig.legs.length]} castShadow />
    </group>
  );
}

/** Ducks paddling slow loops round the pond (a couple of ducklings in tow). */
function Ducks() {
  const geos = useMemo(() => [buildDuck(1), buildDuck(2)], []);
  const mat = useMemo(() => makeFoliageMaterial({ sway: 0, key: "farm-duck", roughness: 0.7 }), []);
  const refs = useRef([]);
  const ducks = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    r: 2.5 + (i % 3) * 2.2, a: i * 1.1, sp: (0.12 + (i % 2) * 0.05) * (i % 2 ? 1 : -1), drake: i % 2, s: i >= 4 ? 0.55 : 1,
  })), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ducks.forEach((d, i) => {
      const g = refs.current[i];
      if (!g) return;
      const lead = i >= 4 ? ducks[i - 4] : d;
      const a = lead.a + t * lead.sp - (i >= 4 ? 0.25 * Math.sign(lead.sp) * (i - 3) : 0);
      const r = lead.r + Math.sin(t * 0.2 + i) * 0.6;
      const x = FARM_POND.center[0] + Math.cos(a) * r, z = FARM_POND.center[1] + Math.sin(a) * r;
      g.position.set(x, POND_LEVEL + Math.sin(t * 2 + i) * 0.015, z);
      g.rotation.y = Math.atan2(-Math.sin(a) * Math.sign(lead.sp), Math.cos(a) * Math.sign(lead.sp)) + Math.PI / 2 * 0;
      const vx = -Math.sin(a) * Math.sign(lead.sp), vz = Math.cos(a) * Math.sign(lead.sp);
      g.rotation.y = Math.atan2(vx, vz);
    });
  });
  return (
    <group>
      {ducks.map((d, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={geos[d.drake]} material={mat} scale={d.s} castShadow />
      ))}
    </group>
  );
}

/** Rabbits that hop about the carrot patch (and bolt from the player). */
function Rabbits() {
  const geo = useMemo(() => buildRabbit(3), []);
  const mat = useMemo(() => makeFoliageMaterial({ sway: 0, key: "farm-rabbit", roughness: 0.9 }), []);
  const refs = useRef([]);
  const bunnies = useMemo(() => {
    const R = rngFor(77);
    return Array.from({ length: 5 }, () => {
      const [x, z] = pickSpot(RABBIT_WANDER, R);
      return { x, z, tx: x, tz: z, hop: 0, wait: R() * 3, yaw: R() * 6.28, R };
    });
  }, []);
  useFrame((_, dt0) => {
    const dt = Math.min(dt0, 0.05);
    const B = RABBIT_WANDER;
    bunnies.forEach((b, i) => {
      const g = refs.current[i];
      if (!g) return;
      const pd = Math.hypot(b.x - playerState.x, b.z - playerState.z);
      if (pd < 4 && b.hop <= 0) {
        b.tx = Math.max(B.minX, Math.min(B.maxX, b.x + (b.x - playerState.x) * 2));
        b.tz = Math.max(B.minZ, Math.min(B.maxZ, b.z + (b.z - playerState.z) * 2));
        b.wait = 0;
      }
      const dx = b.tx - b.x, dz = b.tz - b.z, d = Math.hypot(dx, dz);
      if (d < 0.2) {
        b.wait -= dt;
        if (b.wait <= 0) { [b.tx, b.tz] = pickSpot(B, b.R); b.tx = b.x + (b.tx - b.x) * 0.35; b.tz = b.z + (b.tz - b.z) * 0.35; b.wait = 1.5 + b.R() * 4; }
        b.hop = 0;
      } else {
        b.hop += dt * 3.2;
        const step = Math.min(d, (pd < 4 ? 4.5 : 2.2) * dt);
        b.x += (dx / d) * step; b.z += (dz / d) * step;
        b.yaw = Math.atan2(dx, dz);
      }
      const y = terrainHeight(b.x, b.z) + (b.hop > 0 ? Math.abs(Math.sin(b.hop * Math.PI)) * 0.28 : 0);
      g.position.set(b.x, y, b.z);
      g.rotation.y = b.yaw;
    });
  });
  return (
    <group>
      {bunnies.map((b, i) => <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={geo} material={mat} castShadow />)}
    </group>
  );
}

export default function FarmAnimals() {
  return (
    <group>
      <Herd kind="hereford" zone={COW_WANDER} count={6} seed={11} speed={0.55} shy={2.6} />
      <Herd kind="holstein" zone={DAIRY_COW_WANDER} count={5} seed={23} speed={0.5} shy={2.6} />
      <Herd kind="sheep" zone={SHEEP_WANDER} count={16} seed={37} speed={0.55} shy={3.2} />
      <Herd kind="pig" zone={PIG_WANDER} count={7} seed={41} speed={0.5} shy={1.8} />
      <Herd kind="chook" zone={CHOOK_WANDER} count={9} seed={53} speed={0.55} shy={1.6} />
      <Ducks />
      <Rabbits />
    </group>
  );
}
