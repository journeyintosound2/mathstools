import React, { useRef } from "react";
import DemoPoint from "./demo/DemoPoint.jsx";
import { useFrame } from "@react-three/fiber";

import {
  ROUNDUP_PEN,
  ROUNDUP_FIELD,
  ROUNDUP_GATE_OUT,
  ROUNDUP_GATE_IN,
} from "../data/farm/farmLayout.js";
import { HERD_RADIUS } from "../data/farm/roundUpChallenge.js";
import { useRoundUp } from "./roundUpStore.js";
import { playerState } from "./sessionStore.js";

/**
 * THE ROUND-UP — 3D layer (F3). A grazing herd of low-poly WHITE MARKER cows
 * (Meshy models can replace them later) in the herd field beside the Sorting
 * Pen. Click/tap a nearby cow to send it trotting through the pen gate
 * (click a penned cow to send it back). On feedback the WHOLE herd walks
 * into the equal-groups formation — d columns of groupSize — with the
 * counted groups ringed green: the concrete model of "n/d of the herd".
 *
 * Movement: each cow lerps through WAYPOINTS so it always crosses the fence
 * line via the gate. Logical state lives in roundUpStore; positions live in
 * refs here (no React re-render per frame).
 */

const COW_SPEED = 3.2; // trot speed (to/from the pen, into formation)
const WANDER_SPEED = 1.0; // grazing amble
const WANDER_RANGE = 1.8; // how far a cow strays from its grazing spot

function insidePen(x, z) {
  return (
    Math.abs(x - ROUNDUP_PEN.x) < ROUNDUP_PEN.w / 2 - 0.4 &&
    Math.abs(z - ROUNDUP_PEN.z) < ROUNDUP_PEN.d / 2 - 0.4
  );
}

/** Waypoints from (x,z) to target [tx,tz], routing through the gate when the
 *  path crosses the pen fence. */
function routeTo(x, z, tx, tz) {
  const fromIn = insidePen(x, z);
  const toIn = insidePen(tx, tz);
  // Cross the pen boundary → detour via the gate (outside point, then inside).
  if (fromIn !== toIn) {
    return toIn
      ? [ROUNDUP_GATE_OUT, ROUNDUP_GATE_IN, [tx, tz]]
      : [ROUNDUP_GATE_IN, ROUNDUP_GATE_OUT, [tx, tz]];
  }
  return [[tx, tz]];
}

/** One white marker cow. Pure visuals — logic comes from props/refs. */
function CowMarker({ cow, index }) {
  const group = useRef();
  const anim = useRef({
    x: cow.fieldSpot[0],
    z: cow.fieldSpot[1],
    waypoints: [],
    targetKey: "",
    wandering: false, // current waypoint is a graze-amble (slow), not a task
    nextWanderAt: Math.random() * 4, // clock time of the next amble
  });

  const formation = useRoundUp((s) => s.formation);
  const highlight = formation && formation[index] ? formation[index].highlight : false;

  useFrame((state, dt) => {
    if (!group.current) return;
    const a = anim.current;
    const st = useRoundUp.getState();

    // Where should this cow be, logically?
    let tx = cow.fieldSpot[0];
    let tz = cow.fieldSpot[1];
    let key = "field";
    if (st.formation && st.formation[index]) {
      tx = st.formation[index].x;
      tz = st.formation[index].z;
      key = "formation";
    } else if (cow.state === "penned") {
      const slot = st.penSlotsFor(cow.id);
      if (slot) {
        tx = slot[0];
        tz = slot[1];
        key = `pen-${st.pennedOrder.indexOf(cow.id)}`;
      }
    }

    // New destination → re-route (through the gate if needed). A task target
    // always overrides any grazing amble in progress.
    if (a.targetKey !== key + tx.toFixed(1) + tz.toFixed(1)) {
      a.targetKey = key + tx.toFixed(1) + tz.toFixed(1);
      a.waypoints = routeTo(a.x, a.z, tx, tz);
      a.wandering = false;
    }

    // Grazing amble: cows in the FIELD (no formation, nothing to do) pick a
    // gentle nearby point every few seconds and mosey over — the field feels
    // alive, and it's never so fast that tapping a cow gets hard.
    if (!a.waypoints.length && key === "field" && !st.formation) {
      if (state.clock.elapsedTime >= a.nextWanderAt) {
        const wx = Math.max(ROUNDUP_FIELD.x1 + 0.6, Math.min(ROUNDUP_FIELD.x2 - 0.6,
          cow.fieldSpot[0] + (Math.random() * 2 - 1) * WANDER_RANGE));
        const wz = Math.max(ROUNDUP_FIELD.z1 + 0.6, Math.min(ROUNDUP_FIELD.z2 - 0.6,
          cow.fieldSpot[1] + (Math.random() * 2 - 1) * WANDER_RANGE));
        a.waypoints = [[wx, wz]];
        a.wandering = true;
        a.nextWanderAt = state.clock.elapsedTime + 2.5 + Math.random() * 5;
      }
    }

    // Walk the waypoint queue (slow amble vs purposeful trot).
    if (a.waypoints.length) {
      const [wx, wz] = a.waypoints[0];
      const dx = wx - a.x;
      const dz = wz - a.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.12) {
        a.waypoints.shift();
        a.wandering = false;
      } else {
        const step = Math.min(dist, (a.wandering ? WANDER_SPEED : COW_SPEED) * dt);
        a.x += (dx / dist) * step;
        a.z += (dz / dist) * step;
        group.current.rotation.y = Math.atan2(dx, dz);
      }
    }

    group.current.position.x = a.x;
    group.current.position.z = a.z;
    // Trot-bob while working, soft amble-bob while grazing, breathe at rest.
    const walking = a.waypoints.length > 0;
    group.current.position.y = walking
      ? Math.abs(Math.sin(state.clock.elapsedTime * (a.wandering ? 4 : 8) + index)) * (a.wandering ? 0.035 : 0.08)
      : Math.sin(state.clock.elapsedTime * 1.4 + index * 1.7) * 0.015;
  });

  function onTap(e) {
    const st = useRoundUp.getState();
    if (st.status !== "herding") return; // let taps fall through when idle
    e.stopPropagation();
    const dist = Math.hypot(playerState.x - anim.current.x, playerState.z - anim.current.z);
    if (dist > HERD_RADIUS) {
      st.setHint("Walk closer to that cow to herd it!");
      return;
    }
    st.toggleCow(cow.id);
  }

  return (
    <group ref={group} position={[cow.fieldSpot[0], 0, cow.fieldSpot[1]]}>
      <DemoPoint name={`cow-${cow.id}`} position={[0, 0.9, 0]} />
      {/* Highlight ring (equal-groups reveal): green = a counted group. */}
      {formation && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.5, 0.72, 24]} />
          <meshBasicMaterial color={highlight ? "#2a9d2a" : "#c9cdd2"} />
        </mesh>
      )}
      {/* Enlarged INVISIBLE tap target — much easier to click/tap than the
          cow itself, especially on touch screens and while cows amble. */}
      <mesh position={[0, 0.7, 0]} onPointerDown={onTap}>
        <sphereGeometry args={[1.15, 10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* White marker cow — body, head, ears, legs. */}
      <mesh position={[0, 0.62, 0]} castShadow onPointerDown={onTap}>
        <boxGeometry args={[0.62, 0.58, 1.15]} />
        <meshStandardMaterial color="#f5f5f0" />
      </mesh>
      <mesh position={[0, 0.85, 0.72]} castShadow onPointerDown={onTap}>
        <boxGeometry args={[0.36, 0.36, 0.4]} />
        <meshStandardMaterial color="#f5f5f0" />
      </mesh>
      <mesh position={[0, 0.78, 0.94]}>
        <boxGeometry args={[0.2, 0.14, 0.06]} />
        <meshStandardMaterial color="#dcd7cd" />
      </mesh>
      {[-0.24, 0.24].map((dx) => (
        <mesh key={dx} position={[dx, 1.05, 0.68]}>
          <boxGeometry args={[0.14, 0.08, 0.1]} />
          <meshStandardMaterial color="#e8e4da" />
        </mesh>
      ))}
      {[[-0.2, 0.42], [0.2, 0.42], [-0.2, -0.42], [0.2, -0.42]].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, 0.17, dz]}>
          <boxGeometry args={[0.13, 0.34, 0.13]} />
          <meshStandardMaterial color="#e8e4da" />
        </mesh>
      ))}
    </group>
  );
}

export default function RoundUpChallenge() {
  const cows = useRoundUp((s) => s.cows);

  // No extra floating labels — the pen already carries its static "Sorting
  // Pen" sign, and the locked overhead camera makes the destination obvious
  // (cog-load feedback: one label is plenty).
  return (
    <group>
      {cows.map((cow, i) => (
        <CowMarker key={cow.id} cow={cow} index={i} />
      ))}
    </group>
  );
}
