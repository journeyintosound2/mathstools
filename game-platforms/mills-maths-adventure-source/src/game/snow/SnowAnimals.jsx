import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { PENGUIN_WANDER, PENGUIN_COUNT, RINK_SLIDERS, ICE_RINK, inSnowChallengeView } from "../../data/snow/snowLayout.js";
import { terrainHeight, onPad, nearestTrail, isOnSnow, slopeAt } from "../../data/snow/snowTerrain.js";
import { finish, merge } from "../jungle/jungleGeometry.js";
import { makeFoliageMaterial } from "../jungle/jungleMaterials.js";
import { isAnyChallengeActive, activeSnowChallengeKey } from "../farmChallengeActive.js";
import { playerState } from "../sessionStore.js";

/**
 * SNOW ANIMALS — the PENGUIN colony waddling round the Penguin Floe, two
 * show-offs belly-sliding across the frozen pond, and snow HARES that lollop
 * about the open snowfields (and freeze when you come close). Each animal is
 * ONE merged, vertex-coloured mesh. Everything holds still while a challenge
 * runs; anything in that challenge's shot steps out of view.
 */
const C = (h) => new THREE.Color(h);

/** One low-poly penguin (≈1 m), facing +z. */
function penguinGeometry() {
  const parts = [];
  const add = (g, col) => parts.push(finish(g, C(col), 0));
  const s = (r, w, h, d) => { const g = new THREE.SphereGeometry(r, 12, 10); g.scale(w, h, d); return g; };
  let g = s(0.32, 1, 1.35, 1); g.translate(0, 0.52, 0); add(g, "#23262e");
  g = s(0.29, 0.82, 1.2, 0.82); g.translate(0, 0.47, 0.1); add(g, "#f2f5fa");
  g = s(0.2, 1, 1, 1); g.translate(0, 1.02, 0); add(g, "#23262e");
  for (const x of [-0.08, 0.08]) {
    g = s(0.045, 1, 1, 1); g.translate(x, 1.08, 0.15); add(g, "#ffffff");
    g = s(0.02, 1, 1, 1); g.translate(x, 1.08, 0.185); add(g, "#111319");
  }
  g = new THREE.ConeGeometry(0.05, 0.18, 7); g.rotateX(Math.PI / 2); g.translate(0, 0.98, 0.2); add(g, "#e8913a");
  for (const sx of [-1, 1]) { g = s(0.18, 0.35, 1, 0.7); g.rotateZ(sx * -0.5); g.translate(sx * 0.32, 0.58, 0); add(g, "#23262e"); }
  for (const x of [-0.12, 0.12]) { g = new THREE.BoxGeometry(0.14, 0.06, 0.24); g.translate(x, 0.05, 0.08); add(g, "#e8913a"); }
  return merge(parts);
}
/** A snow HARE (white, black ear tips), facing +z, ≈0.5 m. */
function hareGeometry() {
  const parts = [];
  const add = (g, col) => parts.push(finish(g, C(col), 0));
  const s = (r, w, h, d) => { const g = new THREE.SphereGeometry(r, 10, 8); g.scale(w, h, d); return g; };
  let g = s(0.2, 0.9, 0.85, 1.3); g.translate(0, 0.24, -0.04); add(g, "#f3f5f8");
  g = s(0.12, 1, 1, 1.1); g.translate(0, 0.42, 0.2); add(g, "#f3f5f8");
  for (const x of [-0.05, 0.05]) {
    g = s(0.035, 1, 4.2, 0.6); g.rotateX(-0.35); g.rotateZ(x * 2.5); g.translate(x, 0.6, 0.14); add(g, "#eef0f4");
    g = s(0.03, 1, 1.4, 0.6); g.translate(x * 1.35, 0.74, 0.08); add(g, "#2a2a2e");
    g = s(0.018, 1, 1, 1); g.translate(x * 1.4, 0.45, 0.3); add(g, "#16161a");
  }
  g = s(0.06, 1, 1, 1); g.translate(0, 0.28, -0.3); add(g, "#ffffff");
  return merge(parts);
}

function WaddlingPenguins({ mat, geo }) {
  const refs = useRef([]);
  const pens = useRef(null);
  if (!pens.current) {
    const b = PENGUIN_WANDER;
    pens.current = Array.from({ length: PENGUIN_COUNT }, (_, i) => {
      const x = b.minX + ((i + 0.5) / PENGUIN_COUNT) * (b.maxX - b.minX);
      const z = b.minZ + (0.2 + 0.6 * (i % 2)) * (b.maxZ - b.minZ);
      return { x, z, tx: x, tz: z, speed: 0.8 + (i % 3) * 0.25, wait: 0.5 + i * 0.6, phase: i * 1.3, yaw: 0 };
    });
  }
  const ok = (x, z) => onPad("penguin-floe", x, z, 1.5);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (isAnyChallengeActive()) {
      const key = activeSnowChallengeKey();
      pens.current.forEach((p, i) => {
        const m = refs.current[i];
        if (!m) return;
        m.visible = !(key === "colony" || inSnowChallengeView(key, p.x, p.z));
        m.rotation.set(0, p.yaw, 0);
      });
      return;
    }
    const b = PENGUIN_WANDER;
    pens.current.forEach((p, i) => {
      const m = refs.current[i];
      if (!m) return;
      m.visible = true;
      const dx = p.tx - p.x, dz = p.tz - p.z;
      const d = Math.hypot(dx, dz);
      let walking = false;
      if (d < 0.3) {
        if (p.wait <= 0) p.wait = 1.2 + Math.random() * 3.5;
        p.wait -= dt;
        if (p.wait <= 0) {
          for (let k = 0; k < 8; k++) {
            const nx = b.minX + Math.random() * (b.maxX - b.minX), nz = b.minZ + Math.random() * (b.maxZ - b.minZ);
            if (ok(nx, nz)) { p.tx = nx; p.tz = nz; break; }
          }
        }
      } else {
        walking = true;
        const step = Math.min(d, p.speed * dt);
        p.x += (dx / d) * step;
        p.z += (dz / d) * step;
        p.yaw = Math.atan2(dx, dz);
      }
      const bob = walking ? Math.abs(Math.sin(t * 9 + p.phase)) * 0.05 : 0;
      m.position.set(p.x, terrainHeight(p.x, p.z) + bob, p.z);
      m.rotation.set(0, p.yaw, walking ? Math.sin(t * 9 + p.phase) * 0.16 : Math.sin(t * 0.7 + p.phase) * 0.03);
    });
  });
  return (
    <group>
      {pens.current.map((p, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} geometry={geo} material={mat} castShadow position={[p.x, terrainHeight(p.x, p.z), p.z]} />
      ))}
    </group>
  );
}

function RinkPenguins({ mat, geo }) {
  const refs = useRef([]);
  const sliders = useRef(null);
  if (!sliders.current) {
    const [cx, cz] = ICE_RINK.center;
    // Across the pond's NORTH half (the rink's number line is in the south).
    sliders.current = Array.from({ length: RINK_SLIDERS }, (_, i) => ({
      ax: cx - ICE_RINK.rx * 0.6, az: cz - 4 + (i ? 2.6 : -2.4),
      bx: cx + ICE_RINK.rx * 0.6, bz: cz - 4 + (i ? -2.2 : 2.8),
      t: i * 0.45, dir: 1, speed: 0.11 + i * 0.03, spin: 0,
    }));
  }
  const y0 = terrainHeight(ICE_RINK.center[0], ICE_RINK.center[1]);
  useFrame((state, dt) => {
    const key = activeSnowChallengeKey();
    if (isAnyChallengeActive()) {
      sliders.current.forEach((s, i) => { if (refs.current[i]) refs.current[i].visible = key !== "rink"; });
      return;
    }
    sliders.current.forEach((s, i) => {
      const m = refs.current[i];
      if (!m) return;
      m.visible = true;
      s.t += dt * s.speed * s.dir;
      if (s.t > 1) { s.t = 1; s.dir = -1; }
      if (s.t < 0) { s.t = 0; s.dir = 1; }
      const u = s.t < 0.5 ? 2 * s.t * s.t : 1 - Math.pow(-2 * s.t + 2, 2) / 2;
      const x = s.ax + (s.bx - s.ax) * u, z = s.az + (s.bz - s.az) * u;
      const heading = Math.atan2((s.bx - s.ax) * s.dir, (s.bz - s.az) * s.dir);
      const atEnd = s.t <= 0.02 || s.t >= 0.98;
      m.position.set(x, y0 + (atEnd ? 0.03 : 0.33), z);
      if (atEnd) {
        s.spin += dt * 5;
        m.rotation.set(0, s.spin, 0);
      } else {
        m.rotation.set(Math.PI / 2 - 0.18, heading, 0, "YXZ");
      }
    });
  });
  return (
    <group>
      {sliders.current.map((s, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} geometry={geo} material={mat} castShadow position={[s.ax, y0, s.az]} />
      ))}
    </group>
  );
}

/** Snow hares: hop between spots on open snow; freeze when you're close. */
const HARE_HOMES = [[-118, 80], [-60, 90], [70, 80], [118, 92], [-128, 10], [58, -30], [-30, -60], [130, 0], [-80, -40], [96, 76]];
function Hares({ mat, geo }) {
  const refs = useRef([]);
  const hares = useRef(null);
  if (!hares.current) {
    hares.current = HARE_HOMES.map(([x, z], i) => ({ hx: x, hz: z, x, z, tx: x, tz: z, wait: i * 0.7, hop: 0, yaw: i, ph: i * 2.1 }));
  }
  const spotOK = (x, z) => isOnSnow(x, z) && slopeAt(x, z) < 0.5 && !(nearestTrail(x, z)?.e < 0);
  useFrame((state, dt) => {
    if (isAnyChallengeActive()) return;
    const t = state.clock.elapsedTime;
    const px = playerState.x, pz = playerState.z;
    hares.current.forEach((h, i) => {
      const m = refs.current[i];
      if (!m) return;
      const near = Math.hypot(px - h.x, pz - h.z);
      if (near > 120) { m.visible = false; return; }
      m.visible = true;
      const dx = h.tx - h.x, dz = h.tz - h.z, d = Math.hypot(dx, dz);
      let lift = 0;
      if (d > 0.2 && near > 5) {
        h.hop += dt * 5.5;
        const step = Math.min(d, dt * 3.2);
        h.x += (dx / d) * step; h.z += (dz / d) * step;
        h.yaw = Math.atan2(dx, dz);
        lift = Math.abs(Math.sin(h.hop)) * 0.35;
      } else {
        h.wait -= dt;
        if (h.wait <= 0) {
          h.wait = 2 + Math.random() * 5;
          for (let k = 0; k < 6; k++) {
            const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 9;
            let nx = h.hx + Math.cos(a) * r, nz = h.hz + Math.sin(a) * r;
            // Hop AWAY when the player is near.
            if (near < 9) { nx = h.x + ((h.x - px) / Math.max(near, 0.1)) * 7; nz = h.z + ((h.z - pz) / Math.max(near, 0.1)) * 7; }
            if (spotOK(nx, nz)) { h.tx = nx; h.tz = nz; break; }
          }
        }
      }
      m.position.set(h.x, terrainHeight(h.x, h.z) + lift, h.z);
      m.rotation.set(lift ? -0.25 : Math.sin(t * 6 + h.ph) * 0.02, h.yaw, 0);
    });
  });
  return (
    <group>
      {hares.current.map((h, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} geometry={geo} material={mat} castShadow position={[h.x, terrainHeight(h.x, h.z), h.z]} />
      ))}
    </group>
  );
}

export default function SnowAnimals() {
  const geos = useMemo(() => ({ penguin: penguinGeometry(), hare: hareGeometry() }), []);
  const mat = useMemo(() => makeFoliageMaterial({ sway: 0, key: "snow-animal", roughness: 0.6 }), []);
  return (
    <group>
      <WaddlingPenguins geo={geos.penguin} mat={mat} />
      <RinkPenguins geo={geos.penguin} mat={mat} />
      <Hares geo={geos.hare} mat={mat} />
    </group>
  );
}
