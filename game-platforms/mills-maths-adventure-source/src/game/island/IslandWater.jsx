import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { playerState } from "../sessionStore.js";
import { makeOceanMaterial } from "./islandMaterials.js";
import { makeFallsMaterial, getJungleTextures } from "../jungle/jungleMaterials.js";
import { makeLavaMaterial, makeLavaFlowMaterial, getMagmaTextures } from "../magma/magmaMaterials.js";
import {
  terrainHeight, LAVA_STREAM, CRATER_LAVA_Y, isLavaAt, SEA_Y,
} from "../../data/island/islandTerrain.js";
import { EMERALD_FALLS, EMBER_PEAK } from "../../data/island/islandLayout.js";

/**
 * ISLAND WATER — the sea (one big animated plane at sea level: turquoise
 * shallows over the sand, deep blue beyond, rolling swell, sparkles, foam
 * lapping the beaches — the lagoon is just the sea coming inland), Emerald
 * Falls pouring off the bluff (curtain, mist, spray, foam rings, a rainbow),
 * Ember Peak's lava (the crater pool + the stream down its flank, steaming
 * where it meets the sea, a smoke plume over the crater) and the splash /
 * hot-foot puff when the player is bounced back out of the deep or the lava.
 */
export function Ocean() {
  const mat = useMemo(() => makeOceanMaterial(), []);
  const geo = useMemo(() => {
    // Dense near the island (the shader's foam + depth), sparse out to the horizon.
    const g = new THREE.CircleGeometry(900, 160, 0, Math.PI * 2);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  return <mesh geometry={geo} material={mat} position={[0, SEA_Y, 0]} renderOrder={1} />;
}

// ---------------------------------------------------------------------------
// EMERALD FALLS — a curtain from the bluff's lip down to the lagoon.
// ---------------------------------------------------------------------------
function fallsGeometry(widthScale = 1, back = 0) {
  const F = EMERALD_FALLS;
  const dx = F.foot[0] - F.lip[0], dz = F.foot[1] - F.lip[1];
  const L = Math.hypot(dx, dz) || 1;
  const ux = dx / L, uz = dz / L; // outward (from the cliff toward the lagoon)
  const sx = -uz, sz = ux; // across
  const top = terrainHeight(F.lip[0], F.lip[1]) + 0.05;
  const bottom = SEA_Y;
  const H = top - bottom;
  const cols = 12, rows = 28;
  const pos = [], flow = [], idx = [];
  for (let r = 0; r <= rows; r++) {
    const t = r / rows;
    const drop = t * t * 0.15 + t * 0.85;
    const y = top - drop * H;
    const out = 0.8 * Math.sqrt(Math.min(1, t * 3)) + t * L * 0.75 - back;
    const w = (F.width / 2) * widthScale * (1 + t * 0.35);
    for (let c = 0; c <= cols; c++) {
      const u = c / cols;
      const bow = Math.sin(u * Math.PI) * 0.3 * (1 - t * 0.5);
      const a = (u - 0.5) * 2 * w;
      pos.push(F.lip[0] + sx * a + ux * (out + bow), y, F.lip[1] + sz * a + uz * (out + bow));
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
  return { g, top, foot: [F.lip[0] + ux * (L * 0.8 + 0.6), SEA_Y, F.lip[1] + uz * (L * 0.8 + 0.6)], ux, uz };
}
export function EmeraldFalls({ highGfx }) {
  const built = useMemo(() => ({ front: fallsGeometry(1, 0), back: fallsGeometry(0.85, 0.3) }), []);
  const mats = useMemo(() => ({ front: makeFallsMaterial({ speed: 6, opacity: 0.9 }), back: makeFallsMaterial({ speed: 4.4, opacity: 0.72 }) }), []);
  const tex = getJungleTextures().mist;
  const foot = built.front.foot;
  const mist = useRef([]);
  const MIST = highGfx ? 12 : 6;
  const seeds = useMemo(() => Array.from({ length: MIST }, (_, i) => ({ ph: i / MIST, ox: Math.sin(i * 7.3) * 2.5, sp: 0.7 + (i % 4) * 0.12 })), [MIST]);
  const SPRAY = highGfx ? 110 : 40;
  const spray = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPRAY * 3), 3));
    return g;
  }, [SPRAY]);
  const sprayS = useMemo(() => Array.from({ length: SPRAY }, () => ({ a: Math.random() * Math.PI * 2, v: 1.5 + Math.random() * 2.5, up: 2.5 + Math.random() * 3.5, ph: Math.random(), life: 0.8 + Math.random() * 0.8 })), [SPRAY]);
  const ring = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const far = Math.hypot(playerState.x - foot[0], playerState.z - foot[2]) > 120;
    seeds.forEach((s, i) => {
      const sp = mist.current[i];
      if (!sp) return;
      sp.visible = !far;
      const a = (t * 0.16 * s.sp + s.ph) % 1;
      sp.position.set(foot[0] + s.ox * (0.6 + a) + built.front.ux * a * 3, foot[1] + 0.5 + a * 5.5, foot[2] + built.front.uz * a * 3);
      const sc = 2.5 + a * 7;
      sp.scale.set(sc, sc, 1);
      sp.material.opacity = Math.min(1, a * 5) * (1 - a) * 0.4;
    });
    const arr = spray.attributes.position.array;
    sprayS.forEach((s, i) => {
      const a = ((t / s.life + s.ph) % 1);
      const dt = a * s.life;
      arr[i * 3] = foot[0] + Math.cos(s.a) * s.v * dt * 0.9;
      arr[i * 3 + 1] = foot[1] + s.up * dt - 4.9 * dt * dt + 0.15;
      arr[i * 3 + 2] = foot[2] + Math.sin(s.a) * s.v * dt * 0.9;
    });
    spray.attributes.position.needsUpdate = true;
    ring.current.forEach((m, i) => {
      if (!m) return;
      const a = (t * 0.45 + i / 3) % 1;
      const sc = 1.2 + a * 5;
      m.scale.set(sc, sc, sc);
      m.material.opacity = (1 - a) * 0.55;
    });
  });
  return (
    <group>
      <mesh geometry={built.back.g} material={mats.back} renderOrder={2} />
      <mesh geometry={built.front.g} material={mats.front} renderOrder={3} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => (ring.current[i] = el)} position={[foot[0], foot[1] + 0.04 + i * 0.002, foot[2]]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
          <ringGeometry args={[0.72, 1, 40]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
      <mesh position={[foot[0], foot[1] + 0.03, foot[2]]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
        <circleGeometry args={[2.6, 32]} />
        <meshBasicMaterial color="#f4fbfb" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      {tex && seeds.map((s, i) => (
        <sprite key={i} ref={(el) => (mist.current[i] = el)}>
          <spriteMaterial map={tex} transparent depthWrite={false} opacity={0} color="#ffffff" />
        </sprite>
      ))}
      {tex && (
        <points geometry={spray} frustumCulled={false}>
          <pointsMaterial map={tex} size={0.3} sizeAttenuation transparent depthWrite={false} color="#e8fbff" opacity={0.85} />
        </points>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// EMBER PEAK'S LAVA — the crater pool + the stream (a ribbon draped down the
// carved channel), a crater glow, a smoke plume and steam at the sea.
// ---------------------------------------------------------------------------
function streamGeometry() {
  const pts = LAVA_STREAM.pts;
  const pos = [], flow = [], speed = [], idx = [];
  let v = 0, base = -1;
  const half = LAVA_STREAM.hw + 0.25;
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
    const nx = -tz / tl, nz = tx / tl;
    if (i > 0) v += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    const ok = terrainHeight(x, z) > SEA_Y + 0.05 && Math.hypot(x - EMBER_PEAK.c[0], z - EMBER_PEAK.c[1]) > EMBER_PEAK.craterR * 0.8;
    if (!ok) { base = -1; continue; }
    const vi = pos.length / 3;
    for (const s of [-1, 0, 1]) {
      const px = x + nx * half * s, pz = z + nz * half * s;
      pos.push(px, terrainHeight(x + nx * LAVA_STREAM.hw * s * 0.6, z + nz * LAVA_STREAM.hw * s * 0.6) + 0.1, pz);
      flow.push((s + 1) / 2, v);
      speed.push(1.2);
    }
    if (base >= 0) for (let k = 0; k < 2; k++) idx.push(base + k, base + k + 1, vi + k, base + k + 1, vi + k + 1, vi + k);
    base = vi;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aFlow", new THREE.Float32BufferAttribute(flow, 2));
  g.setAttribute("aSpeed", new THREE.Float32BufferAttribute(speed, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
/** Where the stream meets the sea (steam rises there). */
function streamMouth() {
  const pts = LAVA_STREAM.pts;
  for (let i = 0; i < pts.length; i++) if (terrainHeight(pts[i][0], pts[i][1]) < SEA_Y + 0.3) return pts[i];
  return pts[pts.length - 1];
}
export function IslandLava({ highGfx }) {
  const stream = useMemo(streamGeometry, []);
  const lavaMat = useMemo(() => makeLavaMaterial({ scale: 0.22, brightness: 1.0, crustAmount: 0.85 }), []);
  const flowMat = useMemo(() => makeLavaFlowMaterial({ speed: 0.8 }), []);
  const puff = getMagmaTextures().puff;
  const mouth = useMemo(streamMouth, []);
  const plume = useRef([]);
  const steam = useRef([]);
  const N = highGfx ? 12 : 7;
  const seeds = useMemo(() => Array.from({ length: N }, (_, i) => ({ ph: i / N, ox: Math.sin(i * 12.9) * 2, oz: Math.cos(i * 7.1) * 2, spin: (i % 2 ? 1 : -1) * 0.05 })), [N]);
  const [cx, cz] = EMBER_PEAK.c;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    seeds.forEach((p, i) => {
      const s = plume.current[i];
      if (s) {
        const a = ((t / 13 + p.ph) % 1);
        s.position.set(cx + p.ox + a * 18, CRATER_LAVA_Y + 1 + a * 34, cz + p.oz - a * 10);
        const sc = 3.5 + a * 18;
        s.scale.set(sc, sc, 1);
        s.material.opacity = Math.min(1, a * 6) * (1 - a) * 0.5;
        s.material.rotation += p.spin * 0.016;
      }
      const st = steam.current[i];
      if (st) {
        const a = ((t / 5 + p.ph) % 1);
        st.position.set(mouth[0] + p.ox * 0.8 + a * 2, SEA_Y + 0.4 + a * 7, mouth[1] + p.oz * 0.8 - a * 1.5);
        const sc = 1.5 + a * 6;
        st.scale.set(sc, sc, 1);
        st.material.opacity = Math.min(1, a * 5) * (1 - a) * 0.55;
      }
    });
  });
  return (
    <group>
      {/* The crater's lava pool. */}
      <mesh position={[cx, CRATER_LAVA_Y, cz]} rotation={[-Math.PI / 2, 0, 0]} material={lavaMat}>
        <circleGeometry args={[EMBER_PEAK.craterR * 1.02, 40]} />
      </mesh>
      <mesh geometry={stream} material={flowMat} />
      <pointLight position={[cx, CRATER_LAVA_Y + 3.5, cz]} color="#ff6a2a" intensity={highGfx ? 40 : 28} distance={34} decay={1.6} />
      {puff && seeds.map((p, i) => (
        <sprite key={`p${i}`} ref={(el) => (plume.current[i] = el)}>
          <spriteMaterial map={puff} transparent depthWrite={false} opacity={0} color="#7a716c" fog />
        </sprite>
      ))}
      {puff && seeds.map((p, i) => (
        <sprite key={`s${i}`} ref={(el) => (steam.current[i] = el)}>
          <spriteMaterial map={puff} transparent depthWrite={false} opacity={0} color="#f2f2f0" fog />
        </sprite>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Bounce-back effects: a splash in the sea, a puff of smoke off the lava.
// ---------------------------------------------------------------------------
export function HazardEffects() {
  const ring = useRef();
  const ring2 = useRef();
  const puffTex = getMagmaTextures().puff;
  const puffs = useRef([]);
  const last = useRef({ t: 0, lava: false, x: 0, z: 0, y: 0 });
  useFrame(() => {
    const h = playerState.lavaHit;
    if (h && h.t !== last.current.t) last.current = { t: h.t, lava: isLavaAt(h.x, h.z), x: h.x, z: h.z, y: h.y };
    const L = last.current;
    const age = (Date.now() - L.t) / 1000;
    const on = Boolean(L.t) && age < 1.0;
    for (const [r, k] of [[ring.current, 0], [ring2.current, 0.25]]) {
      if (!r) continue;
      const a = age - k;
      r.visible = on && !L.lava && a > 0;
      if (!r.visible) continue;
      r.position.set(L.x, SEA_Y + 0.05, L.z);
      r.scale.setScalar(0.6 + a * 3);
      r.material.opacity = 0.85 * (1 - a);
    }
    puffs.current.forEach((s, i) => {
      if (!s) return;
      s.visible = on;
      if (!on) return;
      const a = (i / puffs.current.length) * Math.PI * 2;
      const base = L.lava ? L.y : SEA_Y;
      s.position.set(L.x + Math.cos(a) * age * 1.1, base + 0.3 + age * (1.4 + (i % 3) * 0.4), L.z + Math.sin(a) * age * 1.1);
      const sc = 0.5 + age * 1.6;
      s.scale.set(sc, sc, 1);
      s.material.opacity = (1 - age) * 0.8;
      s.material.color.set(L.lava ? (i % 2 ? "#ffcc99" : "#80766f") : "#ffffff");
    });
  });
  return (
    <group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false} renderOrder={5}>
        <ringGeometry args={[0.6, 1, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} depthWrite={false} />
      </mesh>
      <mesh ref={ring2} rotation={[-Math.PI / 2, 0, 0]} visible={false} renderOrder={5}>
        <ringGeometry args={[0.75, 1, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} depthWrite={false} />
      </mesh>
      {puffTex && Array.from({ length: 6 }).map((_, i) => (
        <sprite key={i} ref={(el) => (puffs.current[i] = el)} visible={false}>
          <spriteMaterial map={puffTex} transparent depthWrite={false} opacity={0} />
        </sprite>
      ))}
    </group>
  );
}
