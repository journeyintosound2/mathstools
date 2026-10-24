/**
 * DEMO ANCHORS — named points on a challenge's 3D stage that the demo hand
 * can point at, drag from or tap (the red pole, a rung, an ingot …).
 *
 * A stage tags an object once:   <group ref={demoAnchor("range-pole")}>
 * and a demo script aims at it:  d.anchor("range-pole", [0, 1.4, 0])
 * (the offset is in the object's LOCAL space, so it follows the object).
 *
 * The projector (DemoProjector, inside the Canvas) keeps the live camera +
 * canvas here; nothing is computed unless a demo asks for a point.
 */
import * as THREE from "three";

const anchors = new Map(); // name → Object3D
const refs = new Map(); // name → stable ref callback
export const projector = { camera: null, canvas: null };

/** A stable React ref callback that registers / unregisters `name`. */
export function demoAnchor(name) {
  let cb = refs.get(name);
  if (!cb) {
    cb = (obj) => {
      if (obj) anchors.set(name, obj);
      else if (anchors.get(name)) anchors.delete(name);
    };
    refs.set(name, cb);
  }
  return cb;
}

/** Keyed variant for lists (rungs, ingots, columns …): demoAnchor(`rung-${i}`). */
export const demoAnchorAt = (base, i) => demoAnchor(`${base}-${i}`);

export function hasAnchor(name) {
  return anchors.has(name);
}

const v = new THREE.Vector3();
/**
 * Screen position (CSS px) of an anchor (+ a local offset), or null when it
 * isn't mounted / is behind the camera / there's no camera yet.
 */
export function anchorScreen(name, offset) {
  const obj = anchors.get(name);
  const cam = projector.camera;
  const canvas = projector.canvas;
  if (!obj || !cam || !canvas) return null;
  obj.updateWorldMatrix(true, false);
  v.set(offset ? offset[0] : 0, offset ? offset[1] : 0, offset ? offset[2] : 0);
  obj.localToWorld(v);
  return worldToScreen(v);
}

/** Screen position (CSS px) of a WORLD point, or null. */
export function worldToScreen(p) {
  const cam = projector.camera;
  const canvas = projector.canvas;
  if (!cam || !canvas) return null;
  const w = p instanceof THREE.Vector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2]);
  w.project(cam);
  if (w.z > 1 || w.z < -1) return null;
  const r = canvas.getBoundingClientRect();
  return { x: r.left + ((w.x + 1) / 2) * r.width, y: r.top + ((1 - w.y) / 2) * r.height };
}
