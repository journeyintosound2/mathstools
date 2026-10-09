import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { playerState } from "../sessionStore.js";

/**
 * PLAYGROUND ATMOSPHERE — a bright Coffs Coast morning: the sun climbing out
 * of the sea (behind you as you arrive, so the school's front is sunlit)
 * follows the player so shadows work across the whole campus; seagulls wheel
 * over the beach + the oval; a flock of rainbow lorikeets darts between the
 * trees; a few yachts drift on the harbour (in SchoolBackdrop).
 */
export const SCHOOL_SUN_DIR = new THREE.Vector3(34, 52, 44).normalize();
const SUN_OFFSET = SCHOOL_SUN_DIR.clone().multiplyScalar(90);

export function SchoolLighting({ highGfx }) {
  const light = useRef();
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    // Snap to a 2 m grid so the shadow texels don't swim while you walk.
    const px = Math.round(playerState.x / 2) * 2, pz = Math.round(playerState.z / 2) * 2;
    const py = Math.round((playerState.y || 0) / 2) * 2;
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
        intensity={2.0}
        color="#fff4e2"
        castShadow
        shadow-mapSize={highGfx ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-camera-near={1}
        shadow-camera-far={230}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// SEAGULLS — circling over Jetty Beach, the harbour, the oval + the quad.
// ---------------------------------------------------------------------------
const FLOCKS = [[60, 215, 26], [190, 290, 24], [-70, 250, 30], [-92, 83, 22], [10, 30, 26], [260, 380, 30]];
const GULL_WING = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0.08); s.lineTo(0.55, 0.12); s.lineTo(1.05, -0.02); s.lineTo(0.5, -0.1); s.lineTo(0, -0.08); s.closePath();
  const g = new THREE.ShapeGeometry(s);
  g.rotateX(-Math.PI / 2);
  return g;
})();
export function SchoolGulls() {
  const gulls = useMemo(() => FLOCKS.flatMap(([cx, cz, y], fi) => Array.from({ length: 4 }, (_, k) => ({
    c: [cx, cz], r: 14 + k * 5 + fi * 2, y: y + k * 2.4, sp: (0.15 + k * 0.025) * (fi % 2 ? -1 : 1), ph: k * 1.7 + fi,
  }))), []);
  const refs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    gulls.forEach((g, i) => {
      const o = refs.current[i];
      if (!o) return;
      const far = Math.hypot(g.c[0] - playerState.x, g.c[1] - playerState.z) > 260;
      o.visible = !far;
      if (far) return;
      const a = t * g.sp + g.ph;
      o.position.set(g.c[0] + Math.cos(a) * g.r, g.y + Math.sin(t * 0.6 + g.ph) * 1.5, g.c[1] + Math.sin(a) * g.r);
      o.rotation.set(0, -a + (g.sp > 0 ? Math.PI : 0), g.sp > 0 ? 0.28 : -0.28);
      const burst = Math.sin(t * 0.5 + g.ph * 2) > 0.55;
      const flap = burst ? Math.sin(t * 9 + g.ph) * 0.55 : 0.12 + Math.sin(t * 1.3 + g.ph) * 0.05;
      o.children[1].rotation.z = flap;
      o.children[2].rotation.z = -flap;
    });
  });
  const white = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.8, side: THREE.DoubleSide }), []);
  const grey = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c3cbd4", roughness: 0.8, side: THREE.DoubleSide }), []);
  const beak = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f2b632" }), []);
  return (
    <group>
      {gulls.map((g, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} scale={0.9}>
          <mesh material={white} scale={[0.22, 0.2, 0.62]}><sphereGeometry args={[1, 10, 6]} /></mesh>
          <group position={[0.12, 0.05, 0]}><mesh geometry={GULL_WING} material={grey} /></group>
          <group position={[-0.12, 0.05, 0]} scale={[-1, 1, 1]}><mesh geometry={GULL_WING} material={grey} /></group>
          <mesh position={[0, 0.06, 0.62]} rotation={[Math.PI / 2, 0, 0]} material={beak}><coneGeometry args={[0.05, 0.2, 6]} /></mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// RAINBOW LORIKEETS — a noisy little flock looping between the quad's figs,
// the front lawn's trees and the courtyard.
// ---------------------------------------------------------------------------
const LORI_LOOPS = [
  { pts: [[-30, 16], [-4, 30], [18, 14], [52, 40], [80, 60]], y: 13 },
  { pts: [[-60, 66], [-24, 102], [30, 100], [76, 82], [36, 64]], y: 11 },
  { pts: [[-38, -48], [-6, -54], [14, -40], [6, -20], [-40, -24]], y: 15 },
];
export function Lorikeets() {
  const birds = useMemo(() => LORI_LOOPS.flatMap((L, li) => {
    const curve = new THREE.CatmullRomCurve3(L.pts.map(([x, z]) => new THREE.Vector3(x, L.y, z)), true);
    return Array.from({ length: 5 }, (_, k) => ({ curve, ph: k * 0.035 + li * 0.3, sp: 0.018 + li * 0.002, dy: (k % 3) * 0.6, li }));
  }), []);
  const refs = useRef([]);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tmp2 = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    birds.forEach((b, i) => {
      const o = refs.current[i];
      if (!o) return;
      const u = (t * b.sp + b.ph) % 1;
      b.curve.getPointAt(u, tmp);
      b.curve.getPointAt((u + 0.004) % 1, tmp2);
      const far = Math.hypot(tmp.x - playerState.x, tmp.z - playerState.z) > 90;
      o.visible = !far;
      if (far) return;
      o.position.set(tmp.x, tmp.y + b.dy + Math.sin(t * 3 + i) * 0.5, tmp.z);
      o.rotation.y = Math.atan2(tmp2.x - tmp.x, tmp2.z - tmp.z);
      const flap = Math.sin(t * 22 + i * 1.3) * 0.7;
      o.children[1].rotation.z = flap;
      o.children[2].rotation.z = -flap;
    });
  });
  const mats = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({ color: "#2fae4f", roughness: 0.6 }),
    head: new THREE.MeshStandardMaterial({ color: "#3a52d6", roughness: 0.6 }),
    wing: new THREE.MeshStandardMaterial({ color: "#3cc35c", roughness: 0.6, side: THREE.DoubleSide }),
    chest: new THREE.MeshStandardMaterial({ color: "#ff7a1f", roughness: 0.6 }),
  }), []);
  return (
    <group>
      {birds.map((b, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} scale={0.55}>
          <mesh material={mats.body} scale={[0.16, 0.16, 0.42]}><sphereGeometry args={[1, 8, 6]} /></mesh>
          <group position={[0.1, 0.05, 0]}><mesh geometry={GULL_WING} material={mats.wing} scale={[0.6, 1, 0.8]} /></group>
          <group position={[-0.1, 0.05, 0]} scale={[-1, 1, 1]}><mesh geometry={GULL_WING} material={mats.wing} scale={[0.6, 1, 0.8]} /></group>
          <mesh position={[0, 0.08, 0.36]} material={mats.head}><sphereGeometry args={[0.13, 8, 6]} /></mesh>
          <mesh position={[0, -0.02, 0.22]} material={mats.chest} scale={[0.12, 0.1, 0.12]}><sphereGeometry args={[1, 8, 6]} /></mesh>
        </group>
      ))}
    </group>
  );
}
