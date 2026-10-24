import React, { useMemo, useRef } from "react";
import DemoPoint from "./demo/DemoPoint.jsx";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { GROVE_AREA, GROVE_TREE_POS, GROVE_BOX_POS } from "../data/snow/snowLayout.js";
import { useGroveLights } from "./groveLightsStore.js";
import { ConfettiBurst } from "./OrderPartsChallenge.jsx";

/**
 * CHRISTMAS TREE GROVE — 3D layer (GV). A BIG light-up tree in the eastern
 * grove with its fairy lights spiralling up the branches, and the bundle
 * box (coils of ten + a slow pile of loose singles) beside it. Part A picks
 * a pile from the box; the FRIENDLY bundles then hang in one gold burst.
 * Over-hung lights glow RED ("too many!") until Part B unclips them — the
 * spare light PINGS back into the box — and under-hung trees show green
 * pulsing empty sockets until the extras clip on. Correct typed total →
 * every light goes warm gold + confetti; wrong → shake + reason (panel).
 */

const TRUNK = "#6b4a2e";
const FOLIAGE = ["#1f6b46", "#27815a", "#2f9668"];
const LIGHT_ON = "#ffd98a";
const LIGHT_NEW = "#ffe14d";
const LIGHT_OVER = "#e04747";
const LIGHT_GAP = "#67e08a";
const BOX_WOOD = "#57462f";

const TREE_LOCAL = [GROVE_TREE_POS[0] - GROVE_AREA.x, GROVE_TREE_POS[1] - GROVE_AREA.z];
const BOX_LOCAL = [GROVE_BOX_POS[0] - GROVE_AREA.x, GROVE_BOX_POS[1] - GROVE_AREA.z];

/** Spiral position of light i (0–99) up the tree, in tree-local space. */
function lightPos(i) {
  const t = i / 99;
  const y = 0.6 + t * 3.3;
  const r = 1.72 * (1 - t) + 0.22;
  const a = i * 0.85;
  return [Math.sin(a) * r, y, Math.cos(a) * r];
}

/** The spare light that PINGS between the tree and the box after the fix. */
function PingLight({ dir, index }) {
  const ref = useRef();
  const t0 = useRef(null);
  const from = dir < 0 ? lightPos(index) : [BOX_LOCAL[0] - TREE_LOCAL[0], 0.8, BOX_LOCAL[1] - TREE_LOCAL[1]];
  const to = dir < 0 ? [BOX_LOCAL[0] - TREE_LOCAL[0], 0.8, BOX_LOCAL[1] - TREE_LOCAL[1]] : lightPos(index);
  useFrame(() => {
    if (!ref.current) return;
    if (t0.current === null) t0.current = performance.now();
    const t = Math.max(0, Math.min(1, (performance.now() - t0.current) / 650));
    const e = t * t * (3 - 2 * t);
    ref.current.position.set(
      from[0] + (to[0] - from[0]) * e,
      from[1] + (to[1] - from[1]) * e + Math.sin(Math.PI * e) * 1.4,
      from[2] + (to[2] - from[2]) * e
    );
    ref.current.visible = t < 1 || dir > 0;
  });
  return (
    <mesh ref={ref} position={from}>
      <sphereGeometry args={[0.11, 10, 8]} />
      <meshStandardMaterial color={LIGHT_NEW} emissive={LIGHT_NEW} emissiveIntensity={1.1} />
    </mesh>
  );
}

/** A pulsing light/socket (over-hung red, or an empty gap waiting green). */
function PulseLight({ position, color }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.25;
    ref.current.scale.set(s, s, s);
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.12, 10, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
    </mesh>
  );
}

function BigTree({ litCount, overCount, gapCount, golden }) {
  return (
    <group position={[TREE_LOCAL[0], 0, TREE_LOCAL[1]]}>
      <DemoPoint name="grove-tree" position={[0, 2.6, 0.8]} />
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.28, 0.36, 0.9, 10]} />
        <meshStandardMaterial color={TRUNK} />
      </mesh>
      {FOLIAGE.map((c, i) => (
        <mesh key={i} castShadow position={[0, 1.35 + i * 1.05, 0]}>
          <coneGeometry args={[2.0 - i * 0.52, 1.7, 14]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
      {/* The glowing star on top. */}
      <mesh position={[0, 4.35, 0]}>
        <octahedronGeometry args={[0.26]} />
        <meshStandardMaterial color="#ffe14d" emissive="#ffe14d" emissiveIntensity={1.4} />
      </mesh>
      {/* Lit lights (the last overCount glow red until unclipped). */}
      {Array.from({ length: Math.min(litCount, 99) }, (_, i) => {
        const over = overCount > 0 && i >= litCount - overCount;
        if (over) return <PulseLight key={i} position={lightPos(i)} color={LIGHT_OVER} />;
        return (
          <mesh key={i} position={lightPos(i)}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial
              color={golden ? LIGHT_NEW : LIGHT_ON}
              emissive={golden ? LIGHT_NEW : LIGHT_ON}
              emissiveIntensity={golden ? 1.2 : 0.8}
            />
          </mesh>
        );
      })}
      {/* Empty sockets pulsing where lights are still MISSING. */}
      {Array.from({ length: Math.min(gapCount, 3) }, (_, i) => (
        <PulseLight key={`g${i}`} position={lightPos(Math.min(litCount + i, 99))} color={LIGHT_GAP} />
      ))}
    </group>
  );
}

function BundleBox() {
  return (
    <group position={[BOX_LOCAL[0], 0, BOX_LOCAL[1]]}>
      <DemoPoint name="grove-box" position={[0, 0.8, 0]} />
      <mesh castShadow position={[0, 0.32, 0]}>
        <boxGeometry args={[1.5, 0.64, 1.1]} />
        <meshStandardMaterial color={BOX_WOOD} />
      </mesh>
      {/* Coiled bundles of ten. */}
      {[[-0.42, 0.15], [0.05, -0.2], [0.45, 0.18], [0.02, 0.3]].map(([dx, dz], i) => (
        <mesh key={i} castShadow position={[dx, 0.7, dz]} rotation={[Math.PI / 2, 0, i]}>
          <torusGeometry args={[0.19, 0.07, 8, 14]} />
          <meshStandardMaterial color={LIGHT_ON} emissive={LIGHT_ON} emissiveIntensity={0.35} />
        </mesh>
      ))}
      {/* The slow pile of loose singles beside the crate. */}
      {[[-1.05, 0.1], [-1.2, -0.15], [-0.95, -0.25]].map(([dx, dz], i) => (
        <mesh key={`s${i}`} position={[dx, 0.09, dz]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color={LIGHT_ON} emissive={LIGHT_ON} emissiveIntensity={0.4} />
        </mesh>
      ))}
      <Html position={[0, 1.45, 0]} center distanceFactor={11} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div className="fc-count-chip">bundles of 10</div>
      </Html>
    </group>
  );
}

export default function GroveLightsChallenge() {
  const status = useGroveLights((s) => s.status);
  const shown = useGroveLights((s) => s.currentRound());
  const adjustResult = useGroveLights((s) => s.adjustResult);
  const active = status !== "idle" && status !== "intro";

  // How many lights are on the tree right now, and what state they're in.
  const view = useMemo(() => {
    if (!shown) return { lit: 0, over: 0, gap: 0, golden: false, ping: 0 };
    if (status === "grabbing") return { lit: shown.start, over: 0, gap: 0, golden: false, ping: 0 };
    if (status === "adjusting") {
      return {
        lit: shown.hung,
        over: shown.adjust < 0 ? -shown.adjust : 0,
        gap: shown.adjust > 0 ? shown.adjust : 0,
        golden: false,
        ping: 0,
      };
    }
    // typing / celebrate / feedback — the fix has been performed.
    return { lit: shown.total, over: 0, gap: 0, golden: status === "celebrate", ping: shown.adjust };
  }, [status, shown]);

  if (!active || !shown) return null;

  const chip =
    status === "grabbing"
      ? `${shown.start} + ${shown.add} ?`
      : status === "adjusting"
        ? `${shown.start} + ${shown.grabValue} = ${shown.hung}`
        : status === "typing"
          ? shown.adjust < 0
            ? `${shown.hung} − ${-shown.adjust} = ?`
            : shown.adjust > 0
              ? `${shown.hung} + ${shown.adjust} = ?`
              : `${shown.hung} lights — done?`
          : `${shown.start} + ${shown.add} = ${shown.total}`;

  return (
    <group position={[GROVE_AREA.x, 0, GROVE_AREA.z]}>
      <BigTree litCount={view.lit} overCount={view.over} gapCount={view.gap} golden={view.golden} />
      <BundleBox />

      {/* The spare light pinging tree ↔ box once the fix is performed. */}
      {status === "typing" && adjustResult && shown.adjust !== 0 && (
        <PingLight
          key={`${shown.roundIndex}-${status}`}
          dir={shown.adjust}
          index={shown.adjust < 0 ? shown.total : shown.total - 1}
        />
      )}

      {/* The running sentence above the tree. */}
      <Html position={[TREE_LOCAL[0], 5.2, TREE_LOCAL[1]]} center distanceFactor={9.5} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div className="milk-display snow-chip">{chip}</div>
      </Html>

      {status === "celebrate" && (
        <ConfettiBurst origin={[TREE_LOCAL[0], 3.6, TREE_LOCAL[1] + 0.6]} />
      )}
    </group>
  );
}
