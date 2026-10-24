import React, { useRef } from "react";
import DemoPoint from "./demo/DemoPoint.jsx";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { MEADOW_AREA, MEADOW_TOWER_LEFT, MEADOW_TOWER_RIGHT } from "../data/snow/snowLayout.js";
import { useMeadowLevel } from "./meadowLevelStore.js";
import {
  meadowCountsAfterHops,
  meadowChainHops,
} from "../data/snow/meadowLevelChallenge.js";
import { ConfettiBurst } from "./OrderPartsChallenge.jsx";

/**
 * SNOWMAN MEADOW — 3D layer (ML). Two snowman TOWERS of stacked snowballs
 * (columns of ten — place value for free) stand in the south-west clearing,
 * each wearing a hat + scarf and a live count chip. After the prediction,
 * snowballs HOP one beat at a time from the taller tower to the shorter,
 * and the equation chain above grows — 17 + 21 = 18 + 20 = 19 + 19 — every
 * sum the same, the total never shown until it's typed. Twins → both wear
 * matching gold scarves + confetti on the correct double.
 */

const BALL = "#f4f8fd";
// Bigger balls (audit 2026-09-28): at 0.17 a tower of 12 read as a thin grey
// stick from the camera. Now each ball is countable.
const BALL_R = 0.22;
const COL_W = 0.56;
const ROW_H = 0.44;
// One hop's flight (the student taps once per ball).
const FLIGHT_MS = 520;
const HAT = "#2c3252";
const SCARF = "#d6493f";
const SCARF_TWIN = "#e0a800";

const LEFT_LOCAL = [MEADOW_TOWER_LEFT[0] - MEADOW_AREA.x, MEADOW_TOWER_LEFT[1] - MEADOW_AREA.z];
const RIGHT_LOCAL = [MEADOW_TOWER_RIGHT[0] - MEADOW_AREA.x, MEADOW_TOWER_RIGHT[1] - MEADOW_AREA.z];

/** Tower-local position of ball i in a tower of `count` (columns of ten). */
function ballPos(i) {
  const col = Math.floor(i / 10);
  const row = i % 10;
  return [(col - 1.5) * COL_W, 0.24 + row * ROW_H, (col % 2) * 0.06];
}

function Tower({ local, count, twin, demoName }) {
  const cols = Math.max(1, Math.ceil(count / 10));
  return (
    <group position={[local[0], 0, local[1]]}>
      {demoName && <DemoPoint name={demoName} position={[0, 1.4, 0.4]} />}
      {/* Snow mound base. */}
      <mesh receiveShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.35, 1.5, 0.16, 18]} />
        <meshStandardMaterial color="#e8eff7" />
      </mesh>
      {Array.from({ length: Math.min(count, 50) }, (_, i) => (
        <mesh key={i} position={ballPos(i)}>
          <sphereGeometry args={[BALL_R, 10, 8]} />
          <meshStandardMaterial color={BALL} emissive={BALL} emissiveIntensity={0.08} />
        </mesh>
      ))}
      {/* Scarf around the first column's second ball + hat on its top. */}
      <mesh position={[(0 - 1.5) * COL_W, 0.24 + ROW_H * 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BALL_R + 0.03, 0.05, 8, 14]} />
        <meshStandardMaterial color={twin ? SCARF_TWIN : SCARF} emissive={twin ? SCARF_TWIN : SCARF} emissiveIntensity={0.3} />
      </mesh>
      <group position={[(cols - 1 - 1.5) * COL_W, 0, 0]}>
        <mesh position={[0, topOfColumn(count) + 0.16, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.2, 10]} />
          <meshStandardMaterial color={HAT} />
        </mesh>
        <mesh position={[0, topOfColumn(count) + 0.07, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.04, 10]} />
          <meshStandardMaterial color={HAT} />
        </mesh>
      </group>
      {/* Live count chip under the tower. */}
      <Html position={[0, -0.15, 1.35]} center distanceFactor={10} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div className="fc-count-chip">{count}</div>
      </Html>
    </group>
  );
}

/** Top y of the LAST (tallest occupied) column of a tower of `count`. */
function topOfColumn(count) {
  const lastColBalls = count % 10 === 0 ? 10 : count % 10;
  const isLastColFull = count % 10 === 0;
  const balls = isLastColFull ? 10 : lastColBalls;
  return 0.24 + (balls - 1) * ROW_H + BALL_R;
}

/** Is the latest hop still in the air? */
function inFlight(hopAt) {
  return hopAt > 0 && Date.now() - hopAt < FLIGHT_MS;
}

/**
 * The ball mid-hop. A forward hop (dir +1) flies from the snowman that was
 * TALLER at the start to the other one; a hop back (dir −1) flies home.
 */
function FlyingBall({ round, hops, hopAt, dir }) {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    const flying = inFlight(hopAt);
    ref.current.visible = flying;
    if (!flying) return;
    const frac = (Date.now() - hopAt) / FLIGHT_MS;
    const tallLeft = round.tallerSide === "left";
    // Forward: from the taller side to the shorter. Back: the reverse.
    const fromLeft = dir > 0 ? tallLeft : !tallLeft;
    const fromLocal = fromLeft ? LEFT_LOCAL : RIGHT_LOCAL;
    const toLocal = fromLeft ? RIGHT_LOCAL : LEFT_LOCAL;
    const now = meadowCountsAfterHops(round, hops);
    const fromCount = fromLeft ? now.left : now.right; // already shed the ball
    const toCount = (fromLeft ? now.right : now.left) - 1; // lands in this slot
    const a = ballPos(Math.max(0, fromCount));
    const b = ballPos(Math.max(0, toCount));
    const e = frac * frac * (3 - 2 * frac);
    ref.current.position.set(
      fromLocal[0] + a[0] + (toLocal[0] + b[0] - fromLocal[0] - a[0]) * e,
      a[1] + (b[1] - a[1]) * e + Math.sin(Math.PI * e) * 1.6,
      fromLocal[1] + a[2] + (toLocal[1] + b[2] - fromLocal[1] - a[2]) * e
    );
  });
  return (
    <mesh ref={ref} visible={false}>
      <sphereGeometry args={[BALL_R, 10, 8]} />
      <meshStandardMaterial color="#cfe6ff" emissive="#cfe6ff" emissiveIntensity={0.6} />
    </mesh>
  );
}

export default function MeadowLevelChallenge() {
  const status = useMeadowLevel((s) => s.status);
  const shown = useMeadowLevel((s) => s.currentRound());
  const hops = useMeadowLevel((s) => s.hops);
  const hopAt = useMeadowLevel((s) => s.hopAt);
  const hopDir = useMeadowLevel((s) => s.hopDir);
  const active = status !== "idle" && status !== "intro";
  const tick = useRef(0);
  const [, force] = React.useReducer((n) => n + 1, 0);
  // Re-render while a ball is in the air so it lands in the tower on time.
  useFrame((state) => {
    if (!inFlight(hopAt) && !(hopAt > 0 && Date.now() - hopAt < FLIGHT_MS + 200)) return;
    if (state.clock.elapsedTime - tick.current > 0.08) {
      tick.current = state.clock.elapsedTime;
      force();
    }
  });

  if (!active || !shown) return null;

  const counts = meadowCountsAfterHops(shown, hops);
  const flying = inFlight(hopAt);
  // The in-flight ball has left one tower but not yet landed on the other.
  const tallLeft = shown.tallerSide === "left";
  const landingLeft = hopDir > 0 ? !tallLeft : tallLeft;
  const drawLeft = counts.left - (flying && landingLeft ? 1 : 0);
  const drawRight = counts.right - (flying && !landingLeft ? 1 : 0);
  const twins = counts.left === counts.right && !flying;

  const chain = meadowChainHops(shown, hops);
  const chip =
    status === "typing" || status === "feedback"
      ? `${chain} = ?`
      : status === "celebrate"
        ? `${chain} = ${shown.total}`
        : chain;

  return (
    <group position={[MEADOW_AREA.x, 0, MEADOW_AREA.z]}>
      <Tower local={LEFT_LOCAL} count={Math.max(0, drawLeft)} twin={twins} demoName="meadow-left" />
      <Tower local={RIGHT_LOCAL} count={Math.max(0, drawRight)} twin={twins} demoName="meadow-right" />
      <FlyingBall round={shown} hops={hops} hopAt={hopAt} dir={hopDir} />

      {/* The growing equation chain — every sum the same, total unshown. */}
      <Html position={[(LEFT_LOCAL[0] + RIGHT_LOCAL[0]) / 2, 0.24 + (Math.min(10, Math.max(drawLeft, drawRight, 1)) - 1) * ROW_H + 1.1, (LEFT_LOCAL[1] + RIGHT_LOCAL[1]) / 2]} center distanceFactor={10} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div className="milk-display snow-chip">{chip}</div>
      </Html>

      {status === "celebrate" && (
        <ConfettiBurst origin={[(LEFT_LOCAL[0] + RIGHT_LOCAL[0]) / 2, 3.0, LEFT_LOCAL[1] + 0.5]} />
      )}
    </group>
  );
}
