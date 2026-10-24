import React from "react";
import { demoAnchor } from "./demoAnchors.js";

/**
 * An invisible, named point on a challenge stage for the demo hand to aim at
 * (game/demo/demoAnchors.js). Costs nothing to render — an empty group.
 *   <DemoPoint name="range-gap-3" position={[x, y, z]} />
 */
export default function DemoPoint({ name, position }) {
  return <group ref={demoAnchor(name)} position={position} />;
}
