import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { SLOPE_LANE } from "../data/snow/snowLayout.js";
import { terrainHeight as snowGroundHeight } from "../data/snow/snowTerrain.js";
import { useSledSlope } from "./sledSlopeStore.js";
import { SLED_RACE_MS } from "../data/snow/sledSlopeChallenge.js";
import { ConfettiBurst } from "./OrderPartsChallenge.jsx";

/**
 * SLEDDING SLOPE — 3D layer (SL). The groomed run down the REAL hill wears
 * a zoomed number window (unit ticks, bold labelled decades). Two sleds sit
 * on their numbers, roped together — the ROPE IS THE GAP and visibly never
 * changes length as the pair slides. Nudges move BOTH sleds together, the
 * pair chip rewriting live (83 − 29 → 84 − 30). On the correct difference
 * the pair TEARS off down the hill, rope taut, confetti at the runout.
 */

const TICK = "#dff1fb";
const DECADE = "#2b5f8a";
const ROPE = "#c9a227";
const FRONT_SLED = "#e63946";
const BACK_SLED = "#4cc9f0";
const WOOD = "#6e5a44";

const LANE_Z = SLOPE_LANE.z;
const LANE_LEN = SLOPE_LANE.xTop - SLOPE_LANE.xBottom;

/** Ground height on the run at x (the fall line). */
function hAt(x) {
  return snowGroundHeight(x, LANE_Z);
}

/** Surface tilt (about z) at x — sleds sit flush with the hill. */
function tiltAt(x) {
  const g = (hAt(x + 0.3) - hAt(x - 0.3)) / 0.6;
  return Math.atan(g);
}

/**
 * The round's value→x mapping. Values increase to the RIGHT — up the hill
 * toward the crest — so the run reads like every other number line in the
 * game. (2026-09-28 audit: it used to increase DOWNHILL, i.e. right-to-left
 * on screen, a backwards number line.)
 */
function makeXFor(round) {
  const winMin = round.b - 4;
  const winMax = round.a + 4;
  const scale = LANE_LEN / (winMax - winMin);
  return {
    winMin,
    winMax,
    xFor: (v) =>
      SLOPE_LANE.xBottom +
      (Math.max(winMin, Math.min(winMax, v)) - winMin) * scale,
  };
}

function Sled({ color }) {
  return (
    <group>
      {[-0.32, 0.32].map((dz) => (
        <mesh key={dz} castShadow position={[0, 0.12, dz]}>
          <boxGeometry args={[1.5, 0.08, 0.09]} />
          <meshStandardMaterial color="#8a8f9c" />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[1.35, 0.1, 0.72]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      {/* Backrest (uphill end = +x) + a little flag. */}
      <mesh castShadow position={[0.58, 0.52, 0]}>
        <boxGeometry args={[0.1, 0.38, 0.72]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[0.9, 0.14, 0.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

/** Both sleds + the rope — positions driven per-frame from the store. */
function RopedPair({ round }) {
  const frontRef = useRef();
  const backRef = useRef();
  const ropeRef = useRef();
  const { xFor } = useMemo(() => makeXFor(round), [round]);

  useFrame(() => {
    const st = useSledSlope.getState();
    const r = st.currentRound();
    if (!r || !frontRef.current || !backRef.current || !ropeRef.current) return;
    // The downhill RACE offset (celebrate only): both sleds together, of course.
    let race = 0;
    if (st.status === "celebrate" && st.raceStartedAt) {
      const t = Math.max(0, Math.min(1, (Date.now() - st.raceStartedAt) / SLED_RACE_MS));
      race = t * t * 9; // accelerating runout past the window bottom
    }
    const fx = xFor(r.a + st.slid) - race;
    const bx = xFor(r.b + st.slid) - race;
    const fy = snowGroundHeight(fx, LANE_Z);
    const by = snowGroundHeight(bx, LANE_Z);
    frontRef.current.position.set(fx, fy, LANE_Z);
    frontRef.current.rotation.z = tiltAt(fx);
    backRef.current.position.set(bx, by, LANE_Z);
    backRef.current.rotation.z = tiltAt(bx);
    // The rope: a taut bar between the two backrests — its length IS the gap.
    const mx = (fx + bx) / 2;
    const my = (fy + by) / 2 + 0.45;
    const len = Math.hypot(bx - fx, by - fy);
    ropeRef.current.position.set(mx, my, LANE_Z);
    ropeRef.current.rotation.z = Math.atan2(by - fy, bx - fx);
    ropeRef.current.scale.x = Math.max(0.1, len);
  });

  return (
    <group>
      <group ref={frontRef}>
        <Sled color={FRONT_SLED} />
        <FrontChip />
      </group>
      <group ref={backRef}>
        <Sled color={BACK_SLED} />
        <BackChip />
      </group>
      <mesh ref={ropeRef}>
        <boxGeometry args={[1, 0.05, 0.05]} />
        <meshStandardMaterial color={ROPE} emissive={ROPE} emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

// Live number chips ride with the sleds (re-render ~8×/s while sliding).
function useSlowTick(active) {
  const tick = useRef(0);
  const [, force] = React.useReducer((n) => n + 1, 0);
  useFrame((state) => {
    if (!active) return;
    if (state.clock.elapsedTime - tick.current > 0.12) {
      tick.current = state.clock.elapsedTime;
      force();
    }
  });
}

function FrontChip() {
  const round = useSledSlope((s) => s.currentRound());
  const slid = useSledSlope((s) => s.slid);
  if (!round) return null;
  return (
    <Html position={[0, 1.35, 0]} center distanceFactor={11} className="ix-badge-anchor" zIndexRange={[24, 0]}>
      <div className="fc-count-chip" style={{ borderColor: FRONT_SLED }}>{round.a + slid}</div>
    </Html>
  );
}

function BackChip() {
  const round = useSledSlope((s) => s.currentRound());
  const slid = useSledSlope((s) => s.slid);
  if (!round) return null;
  return (
    <Html position={[0, 1.35, 0]} center distanceFactor={11} className="ix-badge-anchor" zIndexRange={[24, 0]}>
      <div className="fc-count-chip" style={{ borderColor: BACK_SLED }}>{round.b + slid}</div>
    </Html>
  );
}

export default function SledSlopeChallenge() {
  const status = useSledSlope((s) => s.status);
  const shown = useSledSlope((s) => s.currentRound());
  const slid = useSledSlope((s) => s.slid);
  const active = status !== "idle" && status !== "intro";
  useSlowTick(active);

  const mapping = useMemo(() => (shown ? makeXFor(shown) : null), [shown]);
  if (!active || !shown || !mapping) return null;
  const { winMin, winMax, xFor } = mapping;

  const pairChip =
    status === "typing"
        ? `${shown.a + slid} − ${shown.b + slid} = ?`
        : status === "celebrate"
          ? `${shown.a} − ${shown.b} = ${shown.a + slid} − ${shown.b + slid} = ${shown.gap}`
          : `${shown.a + slid} − ${shown.b + slid}`;
  const chipX = xFor((shown.a + shown.b) / 2 + slid);

  return (
    <group>
      {/* The number window etched down the run: unit ticks, bold decades. */}
      {Array.from({ length: winMax - winMin + 1 }, (_, i) => {
        const v = winMin + i;
        const x = xFor(v);
        const y = snowGroundHeight(x, LANE_Z);
        const dec = v % 10 === 0;
        return (
          <group key={v} position={[x, y, LANE_Z]}>
            <mesh position={[0, dec ? 0.4 : v % 5 === 0 ? 0.26 : 0.18, -0.85]}>
              <boxGeometry args={[dec ? 0.1 : 0.06, dec ? 0.8 : v % 5 === 0 ? 0.52 : 0.36, 0.06]} />
              <meshStandardMaterial
                color={dec ? DECADE : TICK}
                emissive={dec ? DECADE : TICK}
                emissiveIntensity={dec ? 0.5 : 0.15}
              />
            </mesh>
            {dec && (
              <Html position={[0, 1.15, -0.85]} center distanceFactor={10} className="ix-badge-anchor" zIndexRange={[24, 0]}>
                <div className="fc-count-chip">{v}</div>
              </Html>
            )}
          </group>
        );
      })}

      {/* The groomed run edge lines. */}
      {[-1.15, 1.15].map((dz) => (
        <group key={dz}>
          {Array.from({ length: 13 }, (_, i) => {
            const x = SLOPE_LANE.xBottom + (i / 12) * LANE_LEN;
            return (
              <mesh key={i} position={[x, snowGroundHeight(x, LANE_Z + dz) + 0.05, LANE_Z + dz]}>
                <sphereGeometry args={[0.07, 6, 6]} />
                <meshStandardMaterial color={TICK} emissive={TICK} emissiveIntensity={0.2} />
              </mesh>
            );
          })}
        </group>
      ))}

      <RopedPair round={shown} />

      {/* The rewritten pair, riding above the rope. */}
      <Html position={[chipX, snowGroundHeight(chipX, LANE_Z) + 2.5, LANE_Z]} center distanceFactor={10} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div className="milk-display snow-chip">{pairChip}</div>
      </Html>

      {status === "celebrate" && (
        <ConfettiBurst origin={[SLOPE_LANE.xBottom - 4, 0.8, LANE_Z]} />
      )}
    </group>
  );
}
