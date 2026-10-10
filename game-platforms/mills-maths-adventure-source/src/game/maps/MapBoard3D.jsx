import React, { useEffect, useState } from "react";

import { regionMapSpec } from "../../data/maps/regionMaps.js";
import { REGIONS } from "../../data/regions.js";
import { regionBoardTexture, paintRegionMapAsync } from "./paintRegionMap.js";
import { useFontsReady } from "../island/useFontsReady.js";

/**
 * THE MAP BOARD (2026-10-10) — one design for every world: a timber notice
 * board under a little roof, by the arrival, showing the world's painted map
 * (game/maps/paintRegionMap.js). Its interactable ("Open the map", in
 * data/interactables.js) opens the full-screen map, where a place can be
 * clicked to set a waypoint.
 */
const WOOD = "#7a5232", WOOD_DARK = "#4f331d";

export default function MapBoard3D({ regionId, roof = "#9a3b2a" }) {
  const ready = useFontsReady();
  const spec = regionMapSpec(regionId);
  // Paint a moment AFTER arriving (it's a big canvas), so stepping through a
  // gate never waits for the map.
  const [board, setBoard] = useState(null);
  useEffect(() => {
    let alive = true;
    // Paint in small slices (the game keeps running), then dress the board.
    const run = () => paintRegionMapAsync(regionId).then(() => { if (alive) setBoard(regionBoardTexture(regionId, ready)); });
    const t = setTimeout(run, 1200);
    return () => { alive = false; clearTimeout(t); };
  }, [regionId, ready]);
  if (!spec) return null;
  const [x, z] = spec.board.position;
  const r = REGIONS[regionId];
  const y = r && r.groundHeight ? r.groundHeight(x, z, 0) : 0;
  const ph = 3.1; // panel height (m)
  const pw = board ? Math.min(4.6, ph * board.aspect) : 3.4;
  const fw = pw + 0.3, fh = ph + 0.3;
  const top = 0.9 + fh;
  return (
    <group position={[x, y, z]} rotation={[0, spec.board.rotationY, 0]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (fw / 2 + 0.05), (top + 0.4) / 2, -0.05]} castShadow>
          <boxGeometry args={[0.2, top + 0.4, 0.2]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.9 + fh / 2, -0.09]} castShadow>
        <boxGeometry args={[fw, fh, 0.12]} />
        <meshStandardMaterial color={WOOD} roughness={0.9} />
      </mesh>
      {board && (
        <mesh position={[0, 0.9 + fh / 2, -0.02]}>
          <planeGeometry args={[pw, ph]} />
          <meshStandardMaterial map={board.texture} roughness={0.85} />
        </mesh>
      )}
      {/* The little roof. */}
      <mesh position={[0, top + 0.3, 0.12]} rotation={[0.42, 0, 0]} castShadow>
        <boxGeometry args={[fw + 0.7, 0.1, 0.9]} />
        <meshStandardMaterial color={roof} roughness={0.8} />
      </mesh>
      <mesh position={[0, top + 0.1, -0.06]}>
        <boxGeometry args={[fw + 0.2, 0.14, 0.16]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
      </mesh>
    </group>
  );
}
