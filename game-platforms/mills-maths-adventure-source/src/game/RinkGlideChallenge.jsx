import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { RINK_GLIDE_LINE, rinkGlideX } from "../data/snow/snowLayout.js";
import { useRinkGlide } from "./rinkGlideStore.js";
import { glideStops, RINK_PUSH_MS } from "../data/snow/rinkGlideChallenge.js";
import { ConfettiBurst } from "./OrderPartsChallenge.jsx";
import DemoPoint from "./demo/DemoPoint.jsx";

/**
 * THE ICE RINK — GLIDE BY TENS — 3D layer (RG). The rink ice carries a giant
 * 0–100 NUMBER LINE etched into it (decade ticks + numerals), a green START
 * flag, a fish-bucket TARGET flag, and Fern's racing penguin. While the
 * student plans, the penguin waits on the start number; on GO it skates the
 * queued pushes one beat at a time — a +10 carries it a whole decade in one
 * long lean, a +1 is a little scoot — with the running value chip updating
 * as each push lands. Landing on the bucket → confetti; missing → the
 * penguin sits on the wrong number, rings mark where it stopped vs. the
 * target (panel paces the shake + reason card).
 */

const LINE_COLOR = "#2b5f8a"; // deep etched blue — pops off the pale ice
const TICK_COLOR = "#dff1fb";
const START_COLOR = "#2a9d2a";
const TARGET_COLOR = "#e0a800";
const MISS_COLOR = "#d43f3f";

const LINE_Y = 0.06; // just above the ice sheet
const LINE_Z = RINK_GLIDE_LINE.z;

/** Eased fraction for one push (smoothstep — glide out, settle in). */
function ease(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/** The penguin's current line value + motion info during a glide. */
function glidePose(round, queue, startedAt) {
  const stops = glideStops(round, queue);
  const elapsed = Date.now() - startedAt;
  const idx = Math.min(Math.floor(elapsed / RINK_PUSH_MS), queue.length - 1);
  const frac = idx >= queue.length - 1 && elapsed >= queue.length * RINK_PUSH_MS
    ? 1
    : (elapsed - idx * RINK_PUSH_MS) / RINK_PUSH_MS;
  const from = stops[idx];
  const to = stops[idx + 1];
  const value = from + (to - from) * ease(frac);
  const completed = Math.min(Math.floor(elapsed / RINK_PUSH_MS + 0.0001), queue.length);
  return { value, moving: frac < 1, dir: Math.sign(to - from) || 1, shown: stops[completed], big: Math.abs(to - from) >= 10, frac };
}

function Penguin({ round }) {
  const group = useRef();
  const bodyRef = useRef();
  useFrame((state) => {
    if (!group.current) return;
    const st = useRinkGlide.getState();
    const r = st.currentRound();
    if (!r) return;
    let value = r.start;
    let moving = false;
    let dir = 1;
    let big = false;
    if (st.status === "gliding" && st.glideStartedAt) {
      const pose = glidePose(r, st.queue, st.glideStartedAt);
      value = pose.value;
      moving = pose.moving;
      dir = pose.dir;
      big = pose.big;
    } else if ((st.status === "celebrate" || st.status === "feedback") && st.landResult) {
      value = st.landResult.finalValue;
    }
    group.current.position.x = rinkGlideX(value);
    // Face the travel direction (east = +x when pushing forward).
    group.current.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    if (bodyRef.current) {
      const t = state.clock.elapsedTime;
      // Lean into a big glide; waddle-rock on little scoots; upright at rest.
      bodyRef.current.rotation.x = moving && big ? 0.35 : 0;
      bodyRef.current.rotation.z = moving && !big ? Math.sin(t * 14) * 0.16 : 0;
      bodyRef.current.position.y = moving && !big ? Math.abs(Math.sin(t * 14)) * 0.06 : 0;
    }
  });

  return (
    <group ref={group} position={[rinkGlideX(round.start), 0, LINE_Z]}>
      <group ref={bodyRef}>
        {/* Body + white belly + head, beak, flippers, feet. */}
        <mesh castShadow position={[0, 0.42, 0]} scale={[1, 1.25, 1]}>
          <sphereGeometry args={[0.3, 14, 12]} />
          <meshStandardMaterial color="#22283c" />
        </mesh>
        <mesh position={[0, 0.4, 0.16]} scale={[0.78, 1.05, 0.62]}>
          <sphereGeometry args={[0.28, 12, 10]} />
          <meshStandardMaterial color="#f2f6fb" />
        </mesh>
        <mesh castShadow position={[0, 0.86, 0]}>
          <sphereGeometry args={[0.18, 12, 10]} />
          <meshStandardMaterial color="#22283c" />
        </mesh>
        <mesh position={[0, 0.84, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.05, 0.16, 8]} />
          <meshStandardMaterial color="#e8952e" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} castShadow position={[s * 0.28, 0.45, 0]} rotation={[0, 0, s * -0.5]} scale={[0.35, 1, 0.6]}>
            <sphereGeometry args={[0.16, 8, 8]} />
            <meshStandardMaterial color="#2c3450" />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`f${s}`} position={[s * 0.12, 0.04, 0.06]} scale={[1, 0.4, 1.6]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshStandardMaterial color="#e8952e" />
          </mesh>
        ))}
      </group>
      <ValueChip />
    </group>
  );
}

/** The running value above the penguin (updates as each push lands). */
function ValueChip() {
  const status = useRinkGlide((s) => s.status);
  const round = useRinkGlide((s) => s.currentRound());
  const queue = useRinkGlide((s) => s.queue);
  const startedAt = useRinkGlide((s) => s.glideStartedAt);
  const landResult = useRinkGlide((s) => s.landResult);
  const tick = useRef(0);
  const [, force] = React.useReducer((n) => n + 1, 0);
  // Re-render ~8×/s during the glide so the chip advances push by push.
  useFrame((state) => {
    if (status !== "gliding") return;
    if (state.clock.elapsedTime - tick.current > 0.12) {
      tick.current = state.clock.elapsedTime;
      force();
    }
  });
  if (!round) return null;
  let shown = round.start;
  if (status === "gliding" && startedAt) shown = glidePose(round, queue, startedAt).shown;
  else if ((status === "celebrate" || status === "feedback") && landResult) shown = landResult.finalValue;
  return (
    <Html position={[0, 1.55, 0]} center distanceFactor={10} className="ix-badge-anchor" zIndexRange={[24, 0]}>
      <div className="milk-display snow-chip">{shown}</div>
    </Html>
  );
}

function Flag({ value, color, bucket, demoName }) {
  const x = rinkGlideX(value);
  return (
    <group position={[x, 0, LINE_Z]}>
      {demoName && <DemoPoint name={demoName} position={[0.1, 1.1, -0.55]} />}
      <mesh castShadow position={[0, 0.7, -0.55]}>
        <cylinderGeometry args={[0.04, 0.04, 1.4, 8]} />
        <meshStandardMaterial color="#8a6a48" />
      </mesh>
      <mesh castShadow position={[0.22, 1.18, -0.55]}>
        <boxGeometry args={[0.46, 0.3, 0.03]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      </mesh>
      {bucket && (
        <group position={[0, 0, 0.65]}>
          <mesh castShadow position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.26, 0.2, 0.36, 12]} />
            <meshStandardMaterial color="#7a5638" />
          </mesh>
          {/* Fish tails poking out — penguin fuel. */}
          {[-0.08, 0.1].map((dx, i) => (
            <mesh key={i} position={[dx, 0.4, 0]} rotation={[0, 0, i === 0 ? 0.5 : -0.4]}>
              <coneGeometry args={[0.07, 0.2, 6]} />
              <meshStandardMaterial color="#9fc4d8" />
            </mesh>
          ))}
        </group>
      )}
      {/* The value on the ice under the flag. */}
      <Html position={[0, 0.02, 0.95]} center distanceFactor={11} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div className="fc-count-chip" style={{ borderColor: color }}>{value}</div>
      </Html>
    </group>
  );
}

// The PLAN, drawn as it's built (audit 2026-09-28): every queued push is an
// arc over the ice from where it starts to where it lands — an empty number
// line drawn in snow. A +10 is a tall blue arc, a +1 a little amber hop,
// and backwards pushes are purple. The student sees where the plan goes
// BEFORE pressing GO, instead of holding a string of pushes in their head.
const ARC_TEN = "#3a86ff";
const ARC_ONE = "#f4a261";
const ARC_BACK = "#9b5de5";

function PlanArc({ from, to }) {
  const geom = useMemo(() => {
    const x0 = rinkGlideX(from);
    const x1 = rinkGlideX(to);
    const span = Math.abs(x1 - x0);
    const h = 0.35 + span * 0.32;
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(x0, LINE_Y + 0.05, LINE_Z),
      new THREE.Vector3((x0 + x1) / 2, LINE_Y + h * 2, LINE_Z),
      new THREE.Vector3(x1, LINE_Y + 0.05, LINE_Z)
    );
    return new THREE.TubeGeometry(curve, 20, span > 1 ? 0.045 : 0.03, 6, false);
  }, [from, to]);
  const big = Math.abs(to - from) >= 10;
  const color = to < from ? ARC_BACK : big ? ARC_TEN : ARC_ONE;
  return (
    <mesh geometry={geom}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} />
    </mesh>
  );
}

// Round 2 (Jeff, 2026-09-29): the plan is NOT previewed on the ice — a live
// "lands on 38 ✓" gave the answer away. While planning the student sees only
// the TOTAL of their tiles; the hops are drawn as the penguin actually makes
// them (a trail that stays for the feedback).
function HopTrail({ round, queue, count }) {
  const stops = glideStops(round, queue);
  return (
    <group>
      {queue.slice(0, count).map((_, i) => (
        <PlanArc key={`${i}-${stops[i]}-${stops[i + 1]}`} from={stops[i]} to={stops[i + 1]} />
      ))}
    </group>
  );
}

export default function RinkGlideChallenge() {
  const status = useRinkGlide((s) => s.status);
  const shown = useRinkGlide((s) => s.currentRound());
  const landResult = useRinkGlide((s) => s.landResult);
  const queue = useRinkGlide((s) => s.queue);
  const startedAt = useRinkGlide((s) => s.glideStartedAt);
  const active = status !== "idle" && status !== "intro";
  const tick = useRef(0);
  const [, force] = React.useReducer((n) => n + 1, 0);
  useFrame((state) => {
    if (status !== "gliding") return;
    if (state.clock.elapsedTime - tick.current > 0.1) {
      tick.current = state.clock.elapsedTime;
      force();
    }
  });
  if (!active || !shown) return null;
  const trailCount =
    status === "gliding" && startedAt
      ? Math.min(queue.length, Math.floor((Date.now() - startedAt) / RINK_PUSH_MS) + 1)
      : status === "celebrate" || status === "feedback"
        ? queue.length
        : 0;

  const lineLen = RINK_GLIDE_LINE.xMax - RINK_GLIDE_LINE.xMin;
  const missed = status === "feedback" && landResult && !landResult.landed;

  return (
    <group>
      {/* The etched line + decade ticks + numerals (0, 10, … 100). */}
      <mesh position={[(RINK_GLIDE_LINE.xMin + RINK_GLIDE_LINE.xMax) / 2, LINE_Y, LINE_Z]}>
        <boxGeometry args={[lineLen + 0.6, 0.04, 0.16]} />
        <meshStandardMaterial color={LINE_COLOR} emissive={LINE_COLOR} emissiveIntensity={0.25} />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => (
        <group key={i} position={[rinkGlideX(i * 10), LINE_Y, LINE_Z]}>
          <mesh>
            <boxGeometry args={[0.07, 0.05, 0.7]} />
            <meshStandardMaterial color={TICK_COLOR} />
          </mesh>
          <Html position={[0, 0.02, -0.85]} center distanceFactor={16} className="ix-badge-anchor" zIndexRange={[24, 0]}>
            <div className="fc-count-chip">{i * 10}</div>
          </Html>
        </group>
      ))}

      {/* Faint unit ticks (every 1) with a slightly longer 5 — room to count
          the little hops on an otherwise empty line. */}
      {Array.from({ length: 101 }, (_, v) =>
        v % 10 === 0 ? null : (
          <mesh key={`u${v}`} position={[rinkGlideX(v), LINE_Y, LINE_Z]}>
            <boxGeometry args={[0.03, 0.045, v % 5 === 0 ? 0.42 : 0.26]} />
            <meshStandardMaterial color={TICK_COLOR} />
          </mesh>
        )
      )}

      {/* The hops, drawn as the penguin makes them. */}
      <HopTrail round={shown} queue={queue} count={trailCount} />

      {/* Start flag + the fish-bucket target. */}
      <Flag value={shown.start} color={START_COLOR} demoName="rink-start" />
      <Flag value={shown.target} color={TARGET_COLOR} bucket demoName="rink-target" />

      {/* Where the penguin actually stopped, when it missed. */}
      {missed && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[rinkGlideX(landResult.finalValue), LINE_Y + 0.01, LINE_Z]}>
          <ringGeometry args={[0.5, 0.72, 24]} />
          <meshBasicMaterial color={MISS_COLOR} transparent opacity={0.75} />
        </mesh>
      )}
      {missed && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[rinkGlideX(shown.target), LINE_Y + 0.01, LINE_Z]}>
          <ringGeometry args={[0.5, 0.72, 24]} />
          <meshBasicMaterial color={START_COLOR} transparent opacity={0.75} />
        </mesh>
      )}

      <Penguin round={shown} />

      {status === "celebrate" && (
        <ConfettiBurst origin={[rinkGlideX(shown.target), 1.2, LINE_Z]} />
      )}
    </group>
  );
}
