import React, { useRef } from "react";
import DemoPoint from "./demo/DemoPoint.jsx";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { COLONY_AREA, COLONY_ROWS } from "../data/snow/snowLayout.js";
import { useColonyPairs } from "./colonyPairsStore.js";
import { COLONY_PAIR_MS, COLONY_WADDLE_MS } from "../data/snow/colonyPairsChallenge.js";
import { ConfettiBurst } from "./OrderPartsChallenge.jsx";

/**
 * PENGUIN COLONY — 3D layer (PC). Two rows of little challenge penguins
 * face each other across the huddle ground. After the prediction, pairs
 * light up one beat at a time (a glowing ring under each matched pair);
 * a near-double's ODD penguin sticks out of the line glowing gold. On
 * diff-2 rounds one penguin first WADDLES across to the short row — double
 * the middle, discovered by walking. Correct total → the whole huddle gets
 * rings + confetti.
 */

const BODY = "#22283c";
const BELLY = "#f2f6fb";
const RING = "#67e08a";
const ODD = "#ffd166";

const SPACING = 0.52;

/** A cheap penguin (2 meshes) — the rows can hold 39 + 39 of these. */
function MiniPenguin({ odd }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.3, 0]} scale={[1, 1.35, 1]}>
        <sphereGeometry args={[0.21, 10, 8]} />
        <meshStandardMaterial
          color={odd ? "#3a3f2c" : BODY}
          emissive={odd ? ODD : BODY}
          emissiveIntensity={odd ? 0.5 : 0.05}
        />
      </mesh>
      <mesh position={[0, 0.28, 0.12]} scale={[0.7, 1.1, 0.55]}>
        <sphereGeometry args={[0.19, 8, 8]} />
        <meshStandardMaterial color={BELLY} />
      </mesh>
    </group>
  );
}

/**
 * Where penguin k stands. BOTH rows share one left edge (sized to the longer
 * row, n), so penguin k of the front row lines up with penguin k of the back
 * row and the pairs are visible; the extra penguin sticks out at the right
 * end. (Audit 2026-09-28: each row used to be centred on its own, which
 * offset the rows by half a penguin and hid the pairing.)
 */
function rowX(k, n) {
  return (k - (n - 1) / 2) * SPACING;
}

/** The pairing timeline. */
function pairProgress(round, startedAt) {
  const elapsed = Date.now() - startedAt;
  const waddle = round.diff === 2;
  const waddleDone = !waddle || elapsed >= COLONY_WADDLE_MS;
  const pairElapsed = waddle ? elapsed - COLONY_WADDLE_MS : elapsed;
  const pairsTarget = round.diff === 2 ? round.a + 1 : round.a;
  const lit = waddleDone ? Math.max(0, Math.min(pairsTarget, Math.floor(pairElapsed / COLONY_PAIR_MS))) : 0;
  const waddleFrac = waddle ? Math.max(0, Math.min(1, elapsed / COLONY_WADDLE_MS)) : 1;
  return { lit, pairsTarget, waddleFrac, waddleDone };
}

/** The penguin that crosses rows on diff-2 rounds. */
function WaddlingCrosser({ round }) {
  const ref = useRef();
  useFrame((state) => {
    const st = useColonyPairs.getState();
    if (!ref.current) return;
    const showing = st.status !== "predicting" && st.pairStartedAt > 0 && round.diff === 2;
    ref.current.visible = round.diff === 2;
    if (!showing) {
      // Waiting at the end of the LONG row (row 2).
      ref.current.position.set(rowX(round.b - 1, round.b), 0, COLONY_ROWS.z2 - COLONY_AREA.z);
      return;
    }
    const { waddleFrac } = pairProgress(round, st.pairStartedAt);
    const e = waddleFrac * waddleFrac * (3 - 2 * waddleFrac);
    const from = [rowX(round.b - 1, round.b), COLONY_ROWS.z2 - COLONY_AREA.z];
    const to = [rowX(round.a, round.b), COLONY_ROWS.z1 - COLONY_AREA.z];
    ref.current.position.set(
      from[0] + (to[0] - from[0]) * e,
      Math.abs(Math.sin(state.clock.elapsedTime * 12)) * (waddleFrac < 1 ? 0.06 : 0),
      from[1] + (to[1] - from[1]) * e
    );
    ref.current.rotation.z = waddleFrac < 1 ? Math.sin(state.clock.elapsedTime * 12) * 0.15 : 0;
  });
  return (
    <group ref={ref}>
      <MiniPenguin odd={false} />
    </group>
  );
}

export default function ColonyPairsChallenge() {
  const status = useColonyPairs((s) => s.status);
  const shown = useColonyPairs((s) => s.currentRound());
  const startedAt = useColonyPairs((s) => s.pairStartedAt);
  const active = status !== "idle" && status !== "intro";
  const tick = useRef(0);
  const [, force] = React.useReducer((n) => n + 1, 0);
  useFrame((state) => {
    if (status !== "pairing") return;
    if (state.clock.elapsedTime - tick.current > 0.1) {
      tick.current = state.clock.elapsedTime;
      force();
    }
  });

  if (!active || !shown) return null;

  const started = status !== "predicting" && startedAt > 0;
  const prog = started
    ? status === "pairing"
      ? pairProgress(shown, startedAt)
      : { lit: shown.diff === 2 ? shown.a + 1 : shown.a, pairsTarget: shown.diff === 2 ? shown.a + 1 : shown.a, waddleFrac: 1, waddleDone: true }
    : { lit: 0, pairsTarget: shown.a, waddleFrac: 0, waddleDone: false };

  // Row sizes ON SCREEN: diff-2 rounds hand one across once the waddle ends.
  const crossed = shown.diff === 2 && prog.waddleDone && started;
  const row1n = shown.a + (crossed ? 1 : 0);
  const row2n = shown.b - (crossed ? 1 : 0) - (shown.diff === 2 ? 1 : 0); // the crosser renders separately
  const oddCount = shown.diff === 1 ? 1 : 0;

  const chip =
    status === "predicting"
      ? `${shown.a} + ${shown.b} ?`
      : status === "typing"
        ? shown.diff === 0
          ? `double ${shown.a} = ?`
          : shown.diff === 1
            ? `double ${shown.a}, then +1 = ?`
            : `double ${shown.middleBase} = ?`
        : status === "celebrate"
          ? `${shown.a} + ${shown.b} = ${shown.total}`
          : `${shown.a} + ${shown.b}`;

  return (
    <group position={[COLONY_AREA.x, 0, COLONY_AREA.z]}>
      {/* Row 1 (the shorter row, nearer the camera). */}
      {Array.from({ length: row1n }, (_, k) => (
        <group key={`r1-${k}`} position={[rowX(k, shown.b), 0, COLONY_ROWS.z1 - COLONY_AREA.z]}>
          <MiniPenguin odd={false} />
        </group>
      ))}
      {/* Row 2 — the ODD penguin (diff 1) is the last one, glowing gold. */}
      {Array.from({ length: row2n }, (_, k) => (
        <group key={`r2-${k}`} position={[rowX(k, shown.b), 0, COLONY_ROWS.z2 - COLONY_AREA.z]}>
          <MiniPenguin odd={oddCount > 0 && k === row2n - 1 && started} />
        </group>
      ))}
      <WaddlingCrosser round={shown} />
      {/* Demo hand targets (game/demo). */}
      <DemoPoint name="colony-rows" position={[0, 0.9, (COLONY_ROWS.z1 + COLONY_ROWS.z2) / 2 - COLONY_AREA.z]} />
      {row2n > 0 && <DemoPoint name="colony-odd" position={[rowX(row2n - 1, shown.b), 0.9, COLONY_ROWS.z2 - COLONY_AREA.z]} />}

      {/* Pair rings light up between the rows, one beat at a time. */}
      {started &&
        Array.from({ length: prog.lit }, (_, k) => (
          <mesh
            key={`ring-${k}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[rowX(k, shown.b), 0.02, (COLONY_ROWS.z1 + COLONY_ROWS.z2) / 2 - COLONY_AREA.z]}
          >
            <ringGeometry args={[0.3, 0.42, 20]} />
            <meshBasicMaterial color={RING} transparent opacity={0.8} />
          </mesh>
        ))}

      {/* How many in each row, at the rows' shared left edge. */}
      {[[row1n, COLONY_ROWS.z1], [row2n + (shown.diff === 2 ? 1 : 0), COLONY_ROWS.z2]].map(([n, z], i) => (
        <Html
          key={`rc${i}`}
          position={[rowX(0, shown.b) - 1.1, 0.35, z - COLONY_AREA.z]}
          center
          distanceFactor={10}
          className="ix-badge-anchor"
          zIndexRange={[24, 0]}
        >
          <div className="fc-count-chip">{n}</div>
        </Html>
      ))}

      {/* The running sentence above the huddle. */}
      <Html position={[0, 2.9, COLONY_ROWS.z1 - COLONY_AREA.z]} center distanceFactor={10} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div className="milk-display snow-chip">{chip}</div>
      </Html>

      {status === "celebrate" && (
        <ConfettiBurst origin={[0, 1.6, (COLONY_ROWS.z1 + COLONY_ROWS.z2) / 2 - COLONY_AREA.z]} />
      )}
    </group>
  );
}
