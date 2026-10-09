import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { playerState } from "./sessionStore.js";
import { getRegion } from "../data/regions.js";
import { terrainHeight } from "../data/island/islandTerrain.js";
import { TITLE_SHOTS, TITLE_PERIOD, TITLE_MIN_CLEARANCE } from "../data/island/titleShots.js";

/**
 * TITLE CAMERA — flies the camera behind the title screen. On Number Island
 * it's a slow cinematic loop round the whole island (out at sea off the
 * jetty → the lagoon falls → over the meadows → Frosty Peak → Schoolhouse
 * Hill → Ember Peak → the lighthouse → Sunny Cove → back), a Catmull-Rom
 * spline flown at constant speed with its look-target riding a matching
 * spline. While it flies it lends the PLAYER's published position to the
 * shot's focus, so the sun's shadow box, the crabs, gulls and butterflies all
 * come alive where the camera is looking. Elsewhere (Edit character opened
 * mid-adventure) it just orbits the player slowly.
 */
const ISLAND_SHOTS = TITLE_SHOTS;
const PERIOD = TITLE_PERIOD;

export default function TitleCamera({ regionId }) {
  const { camera } = useThree();
  const curves = useMemo(() => {
    const pos = new THREE.CatmullRomCurve3(ISLAND_SHOTS.map(([p]) => new THREE.Vector3(...p)), true, "centripetal", 0.5);
    const look = new THREE.CatmullRomCurve3(ISLAND_SHOTS.map(([, l]) => new THREE.Vector3(...l)), true, "centripetal", 0.5);
    pos.arcLengthDivisions = 600;
    return { pos, look };
  }, []);
  const tmpP = useMemo(() => new THREE.Vector3(), []);
  const tmpL = useMemo(() => new THREE.Vector3(), []);
  const lookNow = useRef(null);
  const t0 = useRef(null);
  const orbitAt = useRef(null);

  useFrame((state, delta) => {
    const now = state.clock.elapsedTime;
    if (t0.current === null) t0.current = now;
    const t = now - t0.current;
    if (regionId === "island-1") {
      const u = (t / PERIOD) % 1;
      const k = curves.pos.getUtoTmapping(u);
      curves.pos.getPoint(k, tmpP);
      curves.look.getPoint(k, tmpL);
      // Never dip into a hill (the spline is between the shots, not checked).
      const g = terrainHeight(tmpP.x, tmpP.z);
      if (tmpP.y < g + TITLE_MIN_CLEARANCE) tmpP.y = g + TITLE_MIN_CLEARANCE;
      if (!lookNow.current) { lookNow.current = tmpL.clone(); camera.position.copy(tmpP); }
      camera.position.lerp(tmpP, 1 - Math.pow(0.2, delta));
      lookNow.current.lerp(tmpL, 1 - Math.pow(0.2, delta));
      camera.lookAt(lookNow.current);
      // The shot's focus stands in for the player while the title is up.
      playerState.x = lookNow.current.x;
      playerState.z = lookNow.current.z;
      playerState.y = Math.max(0, terrainHeight(lookNow.current.x, lookNow.current.z));
      return;
    }
    // Other worlds: a slow orbit round where the player stands.
    if (!orbitAt.current) orbitAt.current = { x: playerState.x, y: playerState.y || 0, z: playerState.z };
    const o = orbitAt.current;
    const a = t * 0.07;
    tmpP.set(o.x + Math.sin(a) * 15, o.y + 7, o.z + Math.cos(a) * 15);
    // Worlds with buildings (the Playground): keep the orbit out of the
    // blocks + under the corridor roofs, as the follow camera does.
    const region = getRegion(regionId);
    if (region && region.cameraFit) region.cameraFit(o.x, o.y, o.z, tmpP);
    camera.position.lerp(tmpP, 1 - Math.pow(0.1, delta));
    camera.lookAt(o.x, o.y + 1.4, o.z);
  });
  return null;
}
