import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { useUI } from "../ui/effects/uiStore.js";

/**
 * Tells the title screen the 3D world is up: the heavy building (terrain,
 * scatter, merged set-pieces, shader compiles) all happens before the first
 * frames, so a few rendered frames later the curtain can lift onto a world
 * that's already moving.
 */
export default function WorldReady({ frames = 4 }) {
  const n = useRef(0);
  useFrame(() => {
    if (n.current > frames) return;
    n.current += 1;
    if (n.current === frames) useUI.getState().setWorldReady(true);
  });
  return null;
}
