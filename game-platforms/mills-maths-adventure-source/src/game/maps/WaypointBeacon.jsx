import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useUI } from "../../ui/effects/uiStore.js";
import { useSession } from "../sessionStore.js";
import { getRegion } from "../../data/regions.js";
import { useFarmChallengeActive } from "../farmChallengeActive.js";

/**
 * THE WAYPOINT BEACON (2026-10-10) — where a waypoint set on the world map
 * lands: a tall golden column of light you can see over the trees (drawn
 * without fog, so it shows from across the world), a pulsing ring on the
 * ground and a bobbing marker. Hidden while a challenge has the screen.
 */
const BEAM_H = 46;

function beamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false, // seen through trees + hills: it's a guide, not scenery
    fog: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color("#ffb800") } },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
      void main() {
        float fade = pow(1.0 - vUv.y, 1.6);
        float edge = 1.0 - abs(vUv.x - 0.5) * 2.0;
        float ripple = 0.8 + 0.2 * sin(vUv.y * 40.0 - uTime * 4.0);
        vec3 col = mix(uColor, vec3(1.0, 0.98, 0.85), edge * 0.45);
        gl_FragColor = vec4(col, fade * ripple * (0.25 + 0.6 * edge));
      }`,
  });
}

export default function WaypointBeacon() {
  const wp = useUI((s) => s.waypoint);
  const regionId = useSession((s) => s.currentRegionId);
  const busy = useFarmChallengeActive();
  const mat = useMemo(beamMaterial, []);
  const ring = useRef();
  const marker = useRef();
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    mat.uniforms.uTime.value = t;
    if (ring.current) {
      const k = 1 + (t * 0.8) % 1;
      ring.current.scale.set(k, k, k);
      ring.current.material.opacity = 0.75 * (2 - k);
    }
    if (marker.current) {
      marker.current.position.y = 3.2 + Math.sin(t * 2.4) * 0.25;
      marker.current.rotation.y = t * 1.6;
    }
  });
  if (!wp || wp.regionId !== regionId || busy) return null;
  const region = getRegion(regionId);
  const y = region && region.groundHeight ? region.groundHeight(wp.x, wp.z, 999) : 0;
  return (
    <group position={[wp.x, y, wp.z]}>
      <mesh position={[0, BEAM_H / 2, 0]} material={mat} renderOrder={10}>
        <cylinderGeometry args={[0.9, 1.4, BEAM_H, 20, 1, true]} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[1.1, 1.5, 40]} />
        <meshBasicMaterial color="#ffd23f" transparent opacity={0.7} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={marker} position={[0, 3.2, 0]} renderOrder={11}>
        <octahedronGeometry args={[0.7, 0]} />
        <meshBasicMaterial color="#ffcf2e" toneMapped={false} depthTest={false} transparent opacity={0.95} />
      </mesh>
    </group>
  );
}
