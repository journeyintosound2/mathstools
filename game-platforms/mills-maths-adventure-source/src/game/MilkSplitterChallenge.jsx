import React, { useRef, useMemo } from "react";
import DemoPoint from "./demo/DemoPoint.jsx";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import {
  MILK_AREA,
  MILK_CHUTE_STOPS,
  MILK_CHUTE_REPEATS,
} from "../data/farm/farmLayout.js";
import {
  MILK_DIGIT_MS,
  MILK_POUR_LEAD_MS,
  pourDigits,
} from "../data/farm/milkSplitterChallenge.js";
import { useMilkSplitter } from "./milkSplitterStore.js";
import { ConfettiBurst } from "./OrderPartsChallenge.jsx";
import DottedText from "../ui/MilkNotation.jsx";

/**
 * THE MILK SPLITTER — 3D layer (F8). A dairy machine that shares milk among
 * d cups by ACTUALLY dividing: the display grows the decimal digit by digit
 * as the cups fill. A terminating share finishes — tap stops, green. A
 * recurring share never does — the drip loops and the repeating digits pulse
 * forever: the loop IS the concept.
 *
 * Two chutes flank the machine: STOPS (green, terminating) and REPEATS
 * (purple, recurring). Tap one to predict; correctly-labelled jugs stack up
 * on their chute's shelf across the set.
 */

const MILK = "#f6f3ea";
const MACHINE = "#8a94a3";
const STOPS_COLOR = "#2a9d2a";
const REPEATS_COLOR = "#8a5fd3";

// ---- Machine + pour --------------------------------------------------------

function Cup({ x, z, level }) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.26, 0.21, 0.64, 12, 1, true]} />
        <meshStandardMaterial color="#dfe6ee" transparent opacity={0.5} />
      </mesh>
      {level > 0 && (
        <mesh position={[0, 0.06 + 0.26 * level, 0]}>
          <cylinderGeometry args={[0.22, 0.18, Math.max(0.08, 0.52 * level), 12]} />
          <meshStandardMaterial color={MILK} />
        </mesh>
      )}
    </group>
  );
}

// Jug layout: churn-sized jugs in ONE row (≤5) or TWO rows — extras in the
// BACK row (7 jugs = 4 back + 3 front), so every jug stays big + readable.
const JUG_SPACING = 0.75;
function jugPos(i, d) {
  if (d <= 5) {
    return [(i - (d - 1) / 2) * JUG_SPACING, 1.05];
  }
  const back = Math.ceil(d / 2);
  const front = d - back;
  if (i < back) return [(i - (back - 1) / 2) * JUG_SPACING, 0.75];
  const j = i - back;
  return [(j - (front - 1) / 2) * JUG_SPACING, 1.65];
}

function Machine() {
  const status = useMilkSplitter((s) => s.status);
  const round = useMilkSplitter((s) => s.currentRound());
  const pourStart = useRef(0);
  const tankRef = useRef();
  const dropRefs = useRef([]);
  const digitState = useRef({ shown: 0 });

  const active = status !== "idle" && status !== "intro" && round;
  const pouringLike = status === "pouring" || status === "labelling" || status === "celebrate" || status === "feedback";
  const totalWaves = round ? pourDigits(round) : 0;
  const d = round ? round.d : 0;

  // Drop size per wave: tenths are BIG, each further place smaller.
  const dropSize = (wave) => Math.max(0.045, 0.13 * Math.pow(0.8, wave));

  useFrame((state) => {
    const t = state.clock.elapsedTime * 1000;
    if (status === "pouring") {
      if (!pourStart.current) pourStart.current = t;
    } else if (status === "predicting" || !active) {
      pourStart.current = 0;
      digitState.current.shown = 0;
    }
    const elapsed = pourStart.current ? t - pourStart.current : 0;
    const sincePour = elapsed - MILK_POUR_LEAD_MS;

    // Which wave is falling, and how far through it is.
    const waveIndex = sincePour >= 0 ? Math.floor(sincePour / MILK_DIGIT_MS) : -1;
    const waveT = sincePour >= 0 ? (sincePour % MILK_DIGIT_MS) / MILK_DIGIT_MS : 0;
    // A digit is revealed when its wave LANDS (~60% through the wave).
    digitState.current.shown = pourStart.current
      ? Math.max(0, Math.min(totalWaves, waveIndex + (waveT > 0.6 ? 1 : 0)))
      : 0;

    // Tank drains as the pour progresses.
    if (tankRef.current) {
      const frac = totalWaves ? digitState.current.shown / totalWaves : 0;
      tankRef.current.scale.y = Math.max(0.12, 1 - (pouringLike ? frac * 0.7 : 0));
    }

    // THE DROPS: one per jug, all falling together during a wave. After a
    // recurring pour finishes, a tiny wave keeps looping forever — the
    // division that never ends. Terminating: everything stops.
    const recurringLoop = round && !round.isTerminating && pouringLike && digitState.current.shown >= totalWaves;
    const midPour = status === "pouring" && waveIndex >= 0 && waveIndex < totalWaves;
    let fallT = -1; // 0..1 while drops are airborne
    let size = 0;
    if (midPour && waveT <= 0.6) {
      fallT = waveT / 0.6;
      size = dropSize(waveIndex);
    } else if (recurringLoop) {
      const loopT = (t % 900) / 900;
      if (loopT <= 0.6) {
        fallT = loopT / 0.6;
        size = dropSize(totalWaves); // the smallest — and it never stops
      }
    }
    for (let i = 0; i < dropRefs.current.length; i++) {
      const m = dropRefs.current[i];
      if (!m) continue;
      const visible = fallT >= 0 && i < d;
      m.visible = visible;
      if (visible) {
        // A slight per-jug stagger makes the wave ripple across the rows.
        const [jx, jz] = jugPos(i, d);
        const jt = Math.max(0, Math.min(1, fallT * 1.15 - i * 0.012));
        m.position.set(jx, 1.9 - jt * 1.2, jz);
        m.scale.setScalar(size / 0.07);
      }
    }
  });

  if (!active) return null;

  const doneFrac = totalWaves ? Math.min(1, (digitState.current.shown || 0) / totalWaves) : 0;

  return (
    <group position={[MILK_AREA.x, 0, MILK_AREA.z]}>
      {/* Machine body + milk tank on top. */}
      <mesh castShadow position={[0, 1.0, -0.4]}>
        <boxGeometry args={[1.8, 2.0, 1.1]} />
        <meshStandardMaterial color={MACHINE} metalness={0.35} roughness={0.5} />
      </mesh>
      <group position={[0, 2.55, -0.4]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.62, 0.62, 1.0, 18, 1, true]} />
          <meshStandardMaterial color="#d8dee6" transparent opacity={0.4} />
        </mesh>
        <mesh ref={tankRef} position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.56, 0.56, 0.85, 18]} />
          <meshStandardMaterial color={MILK} />
        </mesh>
      </group>
      {/* Manifold rail feeding every jug at once. */}
      <mesh position={[0, 1.95, 1.2]} castShadow>
        <boxGeometry args={[Math.max(1.6, Math.ceil(d / (d <= 5 ? 1 : 2)) * JUG_SPACING + 0.5), 0.1, 0.12]} />
        <meshStandardMaterial color="#5a6472" />
      </mesh>
      <mesh position={[0, 1.9, 0.2]} rotation={[1.1, 0, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 1.3, 8]} />
        <meshStandardMaterial color="#5a6472" />
      </mesh>

      {/* One drop per jug (driven imperatively above). */}
      {Array.from({ length: 15 }, (_, i) => (
        <mesh key={i} ref={(el) => { dropRefs.current[i] = el; }} visible={false}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={MILK} />
        </mesh>
      ))}

      {/* The d jugs, filling wave by wave. */}
      {Array.from({ length: d }, (_, i) => {
        const [jx, jz] = jugPos(i, d);
        return <Cup key={i} x={jx} z={jz} level={pouringLike ? doneFrac : 0} />;
      })}

      {/* The division readout: JUST the statement before the pour; digits
          then revealed one per wave as the drops land. */}
      <Html position={[0, 3.6, 0]} center distanceFactor={12} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <MilkDigits round={round} digitStateRef={digitState} status={status} />
      </Html>
    </group>
  );
}

/** The live division readout. Before the pour: JUST "n ÷ d". During/after:
 *  the decimal grows one digit per landed wave. */
function MilkDigits({ round, digitStateRef, status }) {
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    if (status !== "pouring") return undefined;
    const t = setInterval(force, 120);
    return () => clearInterval(t);
  }, [status]);

  const { pre, cycle } = round.expansion;
  const total = pourDigits(round);
  // The digit string the waves reveal (cycle repeated to fill the waves).
  let full = pre;
  while (cycle && full.length < total) full += cycle;
  full = full.slice(0, total);

  if (status === "predicting") {
    return (
      <div className="milk-display">
        <span className="milk-sum">{round.n} ÷ {round.d}</span>
      </div>
    );
  }

  const shown = status === "pouring" ? Math.min(digitStateRef.current.shown, total) : total;
  const finished = shown >= total;

  return (
    <div className={`milk-display${round.isTerminating ? " stops" : " repeats"}`}>
      <span className="milk-sum">{round.n} ÷ {round.d} = </span>
      <span className="milk-digits">
        0.{full.slice(0, shown)}
        {!round.isTerminating && finished && <span className="milk-loop">…🔁</span>}
        {round.isTerminating && finished && <span className="milk-stop"> ✋</span>}
      </span>
    </div>
  );
}

// ---- Chutes + labelling ----------------------------------------------------

function Chute({ position, color, label, side }) {
  const status = useMilkSplitter((s) => s.status);
  const prediction = useMilkSplitter((s) => s.prediction);
  const shelved = useMilkSplitter((s) => s.shelved);
  const round = useMilkSplitter((s) => s.currentRound());
  const [x, z] = position;
  const active = status !== "idle" && status !== "intro";
  if (!active) return null;

  const isPick = prediction !== null && (side === "stops") === prediction;
  const count = shelved[side];
  const celebrateHere =
    status === "celebrate" && round && (round.isTerminating ? side === "stops" : side === "repeats");

  return (
    <group position={[x, 0, z]}>
      <DemoPoint name={`milk-chute-${side}`} position={[0, 0.9, 0.2]} />
      {/* The chute: an angled tray on legs. */}
      <mesh castShadow position={[0, 0.55, 0]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[1.5, 0.16, 1.4]} />
        <meshStandardMaterial color={color} emissive={isPick ? color : "#000"} emissiveIntensity={isPick ? 0.35 : 0} />
      </mesh>
      {[[-0.6, -0.45], [0.6, -0.45]].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, 0.25, dz]} castShadow>
          <boxGeometry args={[0.12, 0.5, 0.12]} />
          <meshStandardMaterial color="#6b7686" />
        </mesh>
      ))}
      {/* Shelved jugs from correct rounds. */}
      {Array.from({ length: Math.min(count, 8) }, (_, i) => (
        <mesh key={i} position={[((i % 4) - 1.5) * 0.36, 0.16, 0.95 + Math.floor(i / 4) * 0.4]} castShadow>
          <cylinderGeometry args={[0.13, 0.16, 0.3, 10]} />
          <meshStandardMaterial color={MILK} />
        </mesh>
      ))}
      {celebrateHere && <ConfettiBurst origin={[0, 0.6, 0.4]} />}
      {/* Tap target (prediction). */}
      <mesh
        position={[0, 0.7, 0]}
        onPointerDown={(e) => {
          const st = useMilkSplitter.getState();
          if (st.status !== "predicting") return;
          e.stopPropagation();
          st.predict(side === "stops");
        }}
      >
        <sphereGeometry args={[1.1, 10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html position={[0, 1.7, 0]} center distanceFactor={12} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div className={`milk-chute-chip${isPick ? " picked" : ""}`} style={{ borderColor: color }}>
          {label}
          {count > 0 && <span className="milk-count"> ·{count}</span>}
        </div>
      </Html>
    </group>
  );
}

/** Part B: three tappable jugs with notation labels. */
function NotationJugs() {
  const status = useMilkSplitter((s) => s.status);
  const round = useMilkSplitter((s) => s.currentRound());
  const chosenIndex = useMilkSplitter((s) => s.chosenIndex);
  if ((status !== "labelling" && status !== "celebrate" && status !== "feedback") || !round) return null;
  const showChoice = status !== "labelling";

  return (
    <group position={[MILK_AREA.x, 0, MILK_AREA.z + 2.6]}>
      {round.options.map((opt, i) => {
        const x = (i - 1) * 2.4;
        const isCorrect = i === round.correctIndex;
        const isChosen = i === chosenIndex;
        const border = showChoice
          ? isCorrect ? STOPS_COLOR : isChosen ? "#d43f3f" : "#b9b2a6"
          : "#7a5200";
        return (
          <group key={i} position={[x, 0, 0]}>
            <DemoPoint name={`milk-jug-${i}`} position={[0, 0.6, 0.2]} />
            <mesh castShadow position={[0, 0.28, 0]}>
              <cylinderGeometry args={[0.22, 0.28, 0.55, 12]} />
              <meshStandardMaterial color={MILK} />
            </mesh>
            <mesh castShadow position={[0, 0.62, 0.05]}>
              <cylinderGeometry args={[0.09, 0.12, 0.18, 10]} />
              <meshStandardMaterial color="#e8e2d4" />
            </mesh>
            <mesh
              position={[0, 0.4, 0]}
              onPointerDown={(e) => {
                const st = useMilkSplitter.getState();
                if (st.status !== "labelling") return;
                e.stopPropagation();
                st.chooseNotation(i);
              }}
            >
              <sphereGeometry args={[0.85, 10, 10]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <Html position={[0, 1.25, 0]} center distanceFactor={11} className="ix-badge-anchor" zIndexRange={[24, 0]}>
              <div className="order-chip milk-notation" style={{ borderColor: border }}>
                <DottedText text={opt} />
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// ---- Idle dressing ---------------------------------------------------------

function IdleDairy() {
  return (
    <group position={[MILK_AREA.x, 0, MILK_AREA.z]}>
      {/* Milk churns waiting BESIDE the machine (clear of the jug rows). */}
      {[[-2.9, -0.6], [-2.5, 0.1], [2.8, -0.4]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh castShadow position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.24, 0.28, 0.7, 12]} />
            <meshStandardMaterial color="#c8cfd8" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh castShadow position={[0, 0.76, 0]}>
            <cylinderGeometry args={[0.12, 0.2, 0.14, 10]} />
            <meshStandardMaterial color="#aab2bc" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function MilkSplitterChallenge() {
  const status = useMilkSplitter((s) => s.status);
  return (
    <group>
      {(status === "idle" || status === "intro") && <IdleDairy />}
      {/* The machine shell is always visible so the corner reads on approach;
          cups/display/chutes come alive when the challenge runs. */}
      <Machine />
      <Chute position={MILK_CHUTE_STOPS} color={STOPS_COLOR} label="STOPS ✋ terminating" side="stops" />
      <Chute position={MILK_CHUTE_REPEATS} color={REPEATS_COLOR} label="REPEATS 🔁 recurring" side="repeats" />
      <NotationJugs />
      {(status === "idle" || status === "intro") && (
        /* Idle machine silhouette (Machine returns null before play). */
        <group position={[MILK_AREA.x, 0, MILK_AREA.z]}>
          <mesh castShadow position={[0, 1.0, -0.4]}>
            <boxGeometry args={[1.8, 2.0, 1.1]} />
            <meshStandardMaterial color={MACHINE} metalness={0.35} roughness={0.5} />
          </mesh>
          <mesh castShadow position={[0, 2.55, -0.4]}>
            <cylinderGeometry args={[0.62, 0.62, 1.0, 18]} />
            <meshStandardMaterial color="#d8dee6" />
          </mesh>
        </group>
      )}
    </group>
  );
}
