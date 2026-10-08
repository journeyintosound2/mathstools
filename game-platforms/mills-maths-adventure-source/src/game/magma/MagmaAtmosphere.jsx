import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { playerState } from "../sessionStore.js";
import { magmaClock, getMagmaTextures } from "./magmaMaterials.js";
import { VOLCANO, CRATER_LAVA_Y } from "../../data/magma/magmaLayout.js";

/**
 * MAGMA ATMOSPHERE — the clock that animates every lava surface, the
 * player-following sun, the crater's glow + smoke plume + embers, ambient
 * drifting embers/ash, the distant volcano skyline and the "hot-foot" puff
 * when the player touches lava.
 */

/** Ticks the shared lava uniform once per frame. */
export function LavaClock() {
  useFrame((state) => { magmaClock.uTime.value = state.clock.elapsedTime; });
  return null;
}

/**
 * A low, warm-red SUNSET key light that follows the player. The world is far
 * bigger than one shadow frustum (±40 m), so the light and its target ride
 * along — shadows stay crisp wherever you explore.
 */
const SUN_OFFSET = new THREE.Vector3(-34, 30, 22);
export function MagmaLighting({ highGfx }) {
  const light = useRef();
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    // Snap to a 2 m grid so shadow texels don't swim while walking.
    const px = Math.round(playerState.x / 2) * 2, pz = Math.round(playerState.z / 2) * 2;
    const py = playerState.y || 0;
    l.position.set(px + SUN_OFFSET.x, py + SUN_OFFSET.y, pz + SUN_OFFSET.z);
    target.position.set(px, py, pz);
    target.updateMatrixWorld();
  });
  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={light}
        target={target}
        intensity={1.45}
        color="#ffb27a"
        castShadow
        shadow-mapSize={highGfx ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.04}
        shadow-camera-left={-42}
        shadow-camera-right={42}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
        shadow-camera-near={1}
        shadow-camera-far={140}
      />
      {/* The crater's glow — the one real point light up top. */}
      <pointLight position={[0, CRATER_LAVA_Y + 4, 0]} color="#ff6a2a" intensity={highGfx ? 60 : 45} distance={46} decay={1.6} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Crater smoke plume (billboard puffs rising, growing and fading) + embers.
// ---------------------------------------------------------------------------
const PLUME_COUNT = 16;
export function CraterPlume() {
  const tex = getMagmaTextures().puff;
  const refs = useRef([]);
  const puffs = useMemo(
    () => Array.from({ length: PLUME_COUNT }, (_, i) => ({
      phase: i / PLUME_COUNT,
      ox: (Math.sin(i * 12.9) * 0.5) * 4,
      oz: (Math.cos(i * 7.1) * 0.5) * 4,
      spin: (i % 2 ? 1 : -1) * (0.05 + (i % 5) * 0.02),
    })),
    []
  );
  const LIFE = 14;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    puffs.forEach((p, i) => {
      const s = refs.current[i];
      if (!s) return;
      const a = ((t / LIFE + p.phase) % 1);
      const y = VOLCANO.height - 3 + a * 46;
      // Drift down-wind (toward +x / −z) as it rises.
      s.position.set(p.ox + a * 26, y, p.oz - a * 12);
      const sc = 5 + a * 26;
      s.scale.set(sc, sc, 1);
      s.material.opacity = Math.min(1, a * 6) * (1 - a) * 0.55;
      s.material.rotation += p.spin * 0.016;
      const g = 0.32 - a * 0.12;
      s.material.color.setRGB(g + 0.08, g, g - 0.02);
    });
  });
  if (!tex) return null;
  return (
    <group>
      {puffs.map((p, i) => (
        <sprite key={i} ref={(el) => (refs.current[i] = el)}>
          <spriteMaterial map={tex} transparent depthWrite={false} opacity={0} color="#4a4442" fog />
        </sprite>
      ))}
    </group>
  );
}

/** Embers: additive points spat up from a source, falling back on an arc. */
export function EmberFountain({ origin = [0, VOLCANO.height - 6, 0], count = 140, spread = 6, height = 18, size = 0.55 }) {
  const tex = getMagmaTextures().ember;
  const pts = useRef();
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => ({
    a: Math.random() * Math.PI * 2, r: Math.random() * spread, v: 0.5 + Math.random(), ph: Math.random(),
    life: 2.5 + Math.random() * 2.5,
  })), [count, spread]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const arr = geo.attributes.position.array;
    seeds.forEach((s, i) => {
      const a = ((t / s.life + s.ph) % 1);
      const up = height * s.v * (a - a * a * 0.9);
      const out = s.r * (0.3 + a) ;
      arr[i * 3] = origin[0] + Math.cos(s.a) * out;
      arr[i * 3 + 1] = origin[1] + up * 1.6;
      arr[i * 3 + 2] = origin[2] + Math.sin(s.a) * out;
    });
    geo.attributes.position.needsUpdate = true;
  });
  if (!tex) return null;
  return (
    <points ref={pts} geometry={geo} frustumCulled={false}>
      <pointsMaterial map={tex} size={size} sizeAttenuation transparent depthWrite={false} blending={THREE.AdditiveBlending} color="#ffb070" toneMapped={false} />
    </points>
  );
}

/** Ambient embers + ash drifting around the camera (High graphics). */
export function AmbientEmbers({ count = 220, radius = 34 }) {
  const tex = getMagmaTextures().ember;
  const { camera } = useThree();
  const seeds = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 2 * radius, y: Math.random() * 18, z: (Math.random() - 0.5) * 2 * radius,
    vy: 0.25 + Math.random() * 0.6, sway: Math.random() * 6.28,
  })), [count, radius]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const arr = geo.attributes.position.array;
    const cx = camera.position.x, cz = camera.position.z, cy = playerState.y || 0;
    seeds.forEach((s, i) => {
      s.y += s.vy * dt;
      if (s.y > 18) s.y = 0;
      // Wrap around the camera so the field always surrounds the view.
      let x = s.x + Math.sin(t * 0.4 + s.sway) * 0.8;
      let z = s.z + Math.cos(t * 0.3 + s.sway) * 0.8;
      x = ((x - cx + radius) % (2 * radius) + 2 * radius) % (2 * radius) - radius + cx;
      z = ((z - cz + radius) % (2 * radius) + 2 * radius) % (2 * radius) - radius + cz;
      arr[i * 3] = x; arr[i * 3 + 1] = cy - 2 + s.y; arr[i * 3 + 2] = z;
    });
    geo.attributes.position.needsUpdate = true;
  });
  if (!tex) return null;
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial map={tex} size={0.28} sizeAttenuation transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} color="#ff9a4a" toneMapped={false} />
    </points>
  );
}

// ---------------------------------------------------------------------------
// Distant skyline: other volcanoes out across the lava sea, glowing tops, and
// jagged sea stacks closer in.
// ---------------------------------------------------------------------------
export function DistantVolcanoes() {
  const items = useMemo(() => {
    const out = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (i % 2) * 0.21 + 0.3;
      const r = 205 + ((i * 53) % 70);
      out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, h: 46 + ((i * 37) % 44), w: 44 + ((i * 29) % 30), smoke: i % 3 === 0 });
    }
    return out;
  }, []);
  // Jagged rock islets out in the lava sea (clusters of faceted boulders).
  const stacks = useMemo(() => {
    const out = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + Math.sin(i * 3.1) * 0.1;
      const r = 128 + ((i * 41) % 34);
      const n = 2 + (i % 3);
      for (let k = 0; k < n; k++) {
        const h = 3 + ((i * 17 + k * 5) % 9);
        out.push({ x: Math.cos(a) * r + (k - 1) * 2.4, z: Math.sin(a) * r + ((k * 7) % 3) - 1, h, w: 2.2 + ((i + k) % 3) * 0.8, rot: i + k * 1.3 });
      }
    }
    return out;
  }, []);
  return (
    <group>
      {items.map((v, i) => (
        <group key={i} position={[v.x, -1, v.z]}>
          <mesh>
            <cylinderGeometry args={[v.w * 0.09, v.w, v.h, 10, 1, true]} />
            <meshStandardMaterial color="#2c1a1c" flatShading roughness={1} />
          </mesh>
          <mesh position={[0, v.h / 2 + 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[v.w * 0.085, 10]} />
            <meshBasicMaterial color="#ff6a20" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {stacks.map((s, i) => (
        <mesh key={`s${i}`} position={[s.x, s.h * 0.3 - 0.8, s.z]} rotation={[s.rot * 0.2, s.rot, s.rot * 0.1]} scale={[s.w, s.h * 0.55, s.w * 0.9]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#2e2221" flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Hot-foot puff: when the Player reports a lava touch (playerState.lavaHit),
// a burst of smoke + sparks pops at that spot.
// ---------------------------------------------------------------------------
export function HotFootPuff() {
  const tex = getMagmaTextures().puff;
  const group = useRef();
  const puffs = useRef([]);
  const last = useRef(0);
  const start = useRef(-99);
  const at = useRef([0, 0, 0]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const hit = playerState.lavaHit;
    if (hit && hit.t !== last.current) {
      last.current = hit.t;
      start.current = t;
      at.current = [hit.x, hit.y, hit.z];
    }
    const age = t - start.current;
    const on = age < 1.1;
    if (group.current) group.current.visible = on;
    if (!on) return;
    puffs.current.forEach((s, i) => {
      if (!s) return;
      const a = (i / 6) * Math.PI * 2;
      s.position.set(at.current[0] + Math.cos(a) * age * 1.2, at.current[1] + 0.3 + age * (1.6 + (i % 3) * 0.5), at.current[2] + Math.sin(a) * age * 1.2);
      const sc = 0.6 + age * 1.8;
      s.scale.set(sc, sc, 1);
      s.material.opacity = (1 - age / 1.1) * 0.8;
    });
  });
  if (!tex) return null;
  return (
    <group ref={group} visible={false}>
      {Array.from({ length: 6 }).map((_, i) => (
        <sprite key={i} ref={(el) => (puffs.current[i] = el)}>
          <spriteMaterial map={tex} transparent depthWrite={false} opacity={0} color={i % 2 ? "#ffd2a0" : "#8a807a"} />
        </sprite>
      ))}
    </group>
  );
}
