import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { playerState, requestMoveTo, useSession } from "./sessionStore.js";
import { getRegion, clampToBounds } from "../data/regions.js";

/**
 * Tap-to-move (W4-B).
 *
 * A large, invisible ground plane that catches taps/clicks on empty ground and
 * sets the player's move target (the Player's frame loop walks there, reusing
 * the normal collision/bounds/ground code). Characters and portals sit ABOVE
 * this plane and get the tap first (they call stopPropagation), so tapping a
 * character never doubles as a ground move.
 *
 * Only rendered in touchMode (see World.jsx), so desktop stays pure-keyboard
 * unless the player turns touch controls on. A pulsing ring marks the
 * destination so the student can see where they tapped.
 */
export function GroundTapCatcher() {
  const regionId = useSession((s) => s.currentRegionId);
  const region = getRegion(regionId);

  // Size the catcher to comfortably cover the whole region (+ padding so the
  // very edges are reachable). Circle → diameter; rect → its width/height.
  const b = region.bounds || {};
  const pad = 8;
  const size = b.shape === "rect"
    ? Math.max(b.width || 0, b.height || 0) + pad * 2
    : (b.radius || 30) * 2 + pad * 2;
  const cx = (b.center && b.center[0]) || 0;
  const cz = (b.center && b.center[1]) || 0;

  function handleTap(e) {
    // Ignore taps while an encounter/dialogue modal is open.
    if (useSession.getState().activeEncounterId) return;
    e.stopPropagation();
    const p = e.point; // world-space intersection
    const { x, z } = clampToBounds(p.x, p.z, region.bounds);
    requestMoveTo(x, z, null); // plain ground move (no interactable to approach)
  }

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[cx, 0.01, cz]}
      onPointerDown={handleTap}
    >
      <planeGeometry args={[size, size]} />
      {/* Invisible but still raycastable (visible=false would skip raycasts). */}
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/**
 * A small pulsing ring shown at the current tap-to-move destination. Reads the
 * non-reactive playerState each frame (no re-renders) and hides itself when
 * there's no active target.
 */
export function DestinationMarker() {
  const group = useRef();
  const ring = useRef();
  const t = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = playerState.moveTarget;
    if (target) {
      group.current.visible = true;
      // Sit the ring on the ground (terrain regions: farm / magma / jungle).
      const region = getRegion(useSession.getState().currentRegionId);
      const gy = region && region.slideAt && region.groundHeight ? region.groundHeight(target.x, target.z) : 0;
      group.current.position.set(target.x, gy + 0.06, target.z);
      t.current += delta * 4;
      const s = 1 + Math.sin(t.current) * 0.15; // gentle pulse
      group.current.scale.set(s, s, s);
    } else {
      group.current.visible = false;
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.7, 28]} />
        <meshBasicMaterial color="#ffd166" transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  );
}
