import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { projector } from "./demoAnchors.js";

/**
 * Lives inside the <Canvas>: hands the live camera + canvas element to the
 * demo anchors so a demo script can point the hand at a 3D object. No frame
 * work — projection only happens when the demo asks.
 */
export default function DemoProjector() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    projector.camera = camera;
    projector.canvas = gl.domElement;
  }, [camera, gl]);
  return null;
}
