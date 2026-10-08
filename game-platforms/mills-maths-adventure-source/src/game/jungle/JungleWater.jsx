import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  RIVER, UPPER_RIVER, TEMPLE_STREAM, FALLS_POOL, LAGOON, FALLS, escarpZ, jungleWaterAt,
} from "../../data/jungle/jungleLayout.js";
import { makeWaterMaterial, makeFallsMaterial, getJungleTextures, jungleClock } from "./jungleMaterials.js";
import { playerState } from "../sessionStore.js";

/**
 * JUNGLE WATER — the rivers (flowing ribbons with foam at the banks), the
 * falls pool, the Lily Lagoon, THE WATERFALL (a curving curtain of streaks
 * pouring off the plateau lip, with mist, spray, a foam ring and a faint
 * rainbow) and the ripples + splashes when you wade.
 */
export function riverGeometry(rv, speed, extra = 1.15) {
  const n = rv.pts.length;
  const ACROSS = [-1, -0.5, 0, 0.5, 1];
  const pos = new Float32Array(n * ACROSS.length * 3);
  const flow = new Float32Array(n * ACROSS.length * 2);
  const spd = new Float32Array(n * ACROSS.length);
  for (let i = 0; i < n; i++) {
    const [x, z] = rv.pts[i];
    const a = rv.pts[Math.max(0, i - 1)], b = rv.pts[Math.min(n - 1, i + 1)];
    const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
    const nx = -tz / tl, nz = tx / tl;
    const w = rv.hw[i] + extra;
    ACROSS.forEach((s, k) => {
      const o = i * ACROSS.length + k;
      pos[o * 3] = x + nx * w * s; pos[o * 3 + 1] = rv.lvl[i]; pos[o * 3 + 2] = z + nz * w * s;
      // u: 0..1 across with the WATER's edge (not the mesh edge) at 0/1.
      const u = 0.5 + 0.5 * s * (w / Math.max(0.5, rv.hw[i] - 0.4));
      flow[o * 2] = Math.max(-0.2, Math.min(1.2, u)); flow[o * 2 + 1] = rv.s[i];
      // Faster out of the falls pool, lazier toward the lagoon.
      spd[o] = speed * (1.25 - 0.5 * (rv.s[i] / rv.len));
    });
  }
  const idx = [];
  const W = ACROSS.length;
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < W - 1; k++) {
    const a = i * W + k, b = a + 1, c = a + W, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aFlow", new THREE.BufferAttribute(flow, 2));
  g.setAttribute("aSpeed", new THREE.BufferAttribute(spd, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  // Make sure normals face up whatever the winding.
  const nrm = g.attributes.normal;
  for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 1, 0);
  return g;
}
export function discGeometry(cx, cz, rx, rz, level, speed, swirl = 0) {
  const rings = 14, segs = 64;
  const pos = [], flow = [], spd = [], idx = [];
  for (let r = 0; r <= rings; r++) {
    const t = r / rings;
    for (let s = 0; s <= segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      const x = cx + Math.cos(a) * rx * t * 1.06, z = cz + Math.sin(a) * rz * t * 1.06;
      pos.push(x, level, z);
      flow.push(0.5 + 0.5 * t, t * Math.min(rx, rz) + swirl * a * 2);
      spd.push(speed);
    }
  }
  for (let r = 0; r < rings; r++) for (let s = 0; s < segs; s++) {
    const a = r * (segs + 1) + s, b = a + 1, c = a + segs + 1, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aFlow", new THREE.Float32BufferAttribute(flow, 2));
  g.setAttribute("aSpeed", new THREE.Float32BufferAttribute(spd, 1));
  g.setIndex(idx);
  g.setAttribute("normal", new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  return g;
}

export function JungleWaterSurfaces() {
  const mat = useMemo(() => makeWaterMaterial(), []);
  const geos = useMemo(() => ({
    river: riverGeometry(RIVER, 0.75),
    upper: riverGeometry(UPPER_RIVER, 0.9),
    stream: riverGeometry(TEMPLE_STREAM, 0.6, 0.8),
    pool: discGeometry(FALLS_POOL.center[0], FALLS_POOL.center[1], FALLS_POOL.radius, FALLS_POOL.radius, FALLS_POOL.level + 0.004, 0.5, 0.15),
    lagoon: discGeometry(LAGOON.center[0], LAGOON.center[1], LAGOON.rx, LAGOON.rz, LAGOON.level + 0.004, 0.06, 0.05),
  }), []);
  return (
    <group>
      {Object.entries(geos).map(([k, g]) => (
        <mesh key={k} geometry={g} material={mat} receiveShadow renderOrder={1} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE WATERFALL
// ---------------------------------------------------------------------------
function fallsGeometry(widthScale = 1, back = 0) {
  const F = FALLS;
  const cols = 14, rows = 34;
  const pos = [], flow = [], idx = [];
  const lipZ = F.lip[1];
  const H = F.top - F.bottom;
  for (let r = 0; r <= rows; r++) {
    const t = r / rows; // 0 at the lip → 1 at the pool
    // Arc out over the lip, then plunge with a slight forward drift.
    const drop = t * t * 0.15 + t * 0.85;
    const y = F.top - drop * H + 0.04;
    const out = 1.4 * Math.sqrt(Math.min(1, t * 3)) + t * 2.3 - back;
    const w = F.halfWidth * widthScale * (1 + t * 0.32);
    for (let c = 0; c <= cols; c++) {
      const u = c / cols;
      const bow = Math.sin(u * Math.PI) * 0.35 * (1 - t * 0.5);
      pos.push(F.lip[0] + (u - 0.5) * 2 * w, y, lipZ + out + bow);
      flow.push(u, t * H);
    }
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const a = r * (cols + 1) + c, b = a + 1, cc = a + cols + 1, d = cc + 1;
    idx.push(a, cc, b, b, cc, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aFlow", new THREE.Float32BufferAttribute(flow, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function Waterfall({ highGfx }) {
  const geos = useMemo(() => ({ front: fallsGeometry(1, 0), back: fallsGeometry(0.85, 0.35) }), []);
  const mats = useMemo(() => ({ front: makeFallsMaterial({ speed: 6.2, opacity: 0.9 }), back: makeFallsMaterial({ speed: 4.6, opacity: 0.75 }) }), []);
  const tex = getJungleTextures().mist;
  const foot = [FALLS.lip[0], FALLS_POOL.level + 0.05, FALLS.lip[1] + 3.3];
  // Mist puffs rising + spreading at the foot.
  const mist = useRef([]);
  const MIST = 14;
  const seeds = useMemo(() => Array.from({ length: MIST }, (_, i) => ({ ph: i / MIST, ox: (Math.sin(i * 7.3) * 0.5) * 6, sp: 0.7 + (i % 4) * 0.12 })), []);
  // Spray droplets.
  const SPRAY = highGfx ? 160 : 60;
  const spray = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPRAY * 3), 3));
    return g;
  }, [SPRAY]);
  const sprayS = useMemo(() => Array.from({ length: SPRAY }, () => ({ a: Math.random() * Math.PI * 2, v: 2 + Math.random() * 3, up: 3 + Math.random() * 4, ph: Math.random(), life: 0.9 + Math.random() * 0.9 })), [SPRAY]);
  const ring = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    seeds.forEach((s, i) => {
      const sp = mist.current[i];
      if (!sp) return;
      const a = (t * 0.16 * s.sp + s.ph) % 1;
      sp.position.set(foot[0] + s.ox * (0.6 + a), foot[1] + 0.6 + a * 6.5, foot[2] + a * 4.5);
      const sc = 3 + a * 9;
      sp.scale.set(sc, sc, 1);
      sp.material.opacity = Math.min(1, a * 5) * (1 - a) * 0.42;
    });
    const arr = spray.attributes.position.array;
    sprayS.forEach((s, i) => {
      const a = ((t / s.life + s.ph) % 1);
      const dt = a * s.life;
      arr[i * 3] = foot[0] + Math.cos(s.a) * s.v * dt * 0.9;
      arr[i * 3 + 1] = foot[1] + s.up * dt - 4.9 * dt * dt + 0.2;
      arr[i * 3 + 2] = foot[2] - 0.8 + Math.abs(Math.sin(s.a)) * s.v * dt;
    });
    spray.attributes.position.needsUpdate = true;
    ring.current.forEach((m, i) => {
      if (!m) return;
      const a = (t * 0.45 + i / 3) % 1;
      const sc = 1.5 + a * 6;
      m.scale.set(sc, sc, sc);
      m.material.opacity = (1 - a) * 0.55;
    });
  });
  return (
    <group>
      <mesh geometry={geos.back} material={mats.back} renderOrder={2} />
      <mesh geometry={geos.front} material={mats.front} renderOrder={3} />
      {/* Foam rings spreading where the curtain hits the pool. */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => (ring.current[i] = el)} position={[foot[0], foot[1] + 0.03 + i * 0.002, foot[2] - 0.4]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
          <ringGeometry args={[0.72, 1, 40]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
      <mesh position={[foot[0], foot[1] + 0.025, foot[2] - 0.4]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
        <circleGeometry args={[3.4, 32]} />
        <meshBasicMaterial color="#f4fbfb" transparent opacity={0.6} depthWrite={false} />
      </mesh>
      {tex && seeds.map((s, i) => (
        <sprite key={i} ref={(el) => (mist.current[i] = el)}>
          <spriteMaterial map={tex} transparent depthWrite={false} opacity={0} color="#ffffff" />
        </sprite>
      ))}
      {tex && (
        <points geometry={spray} frustumCulled={false}>
          <pointsMaterial map={tex} size={0.32} sizeAttenuation transparent depthWrite={false} color="#e8fbff" opacity={0.85} />
        </points>
      )}
      <Rainbow center={[foot[0] - 1, foot[1] + 1.2, foot[2] + 5]} />
    </group>
  );
}

/** A faint rainbow arc in the falls' mist. */
function Rainbow({ center }) {
  const geo = useMemo(() => {
    const g = new THREE.TorusGeometry(5.5, 0.4, 6, 48, Math.PI);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const bands = ["#ff4b4b", "#ff9f3a", "#ffe94a", "#5fdc5f", "#4aa8ff", "#8a5cff"].map((h) => new THREE.Color(h));
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getY(i));
      const t = Math.max(0, Math.min(0.999, (r - 5.1) / 0.8));
      const c = bands[Math.floor(t * bands.length)];
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  return (
    <mesh geometry={geo} position={center} rotation={[0, 0.25, 0]}>
      <meshBasicMaterial vertexColors transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Wading: ripple rings + little splashes round the player's legs.
// ---------------------------------------------------------------------------
export function WadeRipples({ waterAt = jungleWaterAt }) {
  const rings = useRef([]);
  const N = 7;
  const state = useRef({ last: { x: 0, z: 0 }, acc: 0, slots: Array.from({ length: N }, () => ({ born: -99, x: 0, y: 0, z: 0 })), cur: 0 });
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const S = state.current;
    const x = playerState.x, z = playerState.z, y = playerState.y || 0;
    const w = waterAt(x, z);
    const moved = Math.hypot(x - S.last.x, z - S.last.z);
    S.last.x = x; S.last.z = z;
    if (w !== null && y < w + 0.05) {
      S.acc += moved + 0.004;
      if (S.acc > (moved > 0.01 ? 0.9 : 0.6) || (moved > 0.01 && t - S.slots[(S.cur + N - 1) % N].born > 0.28)) {
        S.acc = 0;
        const sl = S.slots[S.cur];
        sl.born = t; sl.x = x; sl.y = w + 0.02; sl.z = z;
        S.cur = (S.cur + 1) % N;
      }
    }
    S.slots.forEach((sl, i) => {
      const m = rings.current[i];
      if (!m) return;
      const age = t - sl.born;
      const on = age < 1.4;
      m.visible = on;
      if (!on) return;
      m.position.set(sl.x, sl.y, sl.z);
      const sc = 0.5 + age * 1.6;
      m.scale.set(sc, sc, sc);
      m.material.opacity = (1 - age / 1.4) * 0.6;
    });
  });
  return (
    <group>
      {Array.from({ length: N }).map((_, i) => (
        <mesh key={i} ref={(el) => (rings.current[i] = el)} rotation={[-Math.PI / 2, 0, 0]} visible={false} renderOrder={5}>
          <ringGeometry args={[0.8, 1, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

export { jungleClock };
