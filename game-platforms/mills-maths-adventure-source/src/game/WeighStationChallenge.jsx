import React, { useRef } from "react";
import DemoPoint from "./demo/DemoPoint.jsx";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { WEIGH_AREA } from "../data/farm/farmLayout.js";
import { useWeighStation } from "./weighStationStore.js";
import { ConfettiBurst } from "./OrderPartsChallenge.jsx";

/**
 * THE WEIGH STATION — 3D layer (F9). A big analogue scale in the NE corner:
 * produce lands on the pan, the dial needle swings to the exact reading, and
 * the ZOOMED NUMBER-LINE BEAM above runs from the lower candidate to the
 * upper candidate with a pointer at the exact spot — so rounding is READ off
 * the line ("which end is closer?"), not recited as a digit rule. Three ≈
 * signs in front are tappable; judgement rounds swap them for scenario
 * cards. Correct → the sign stamps + confetti; wrong → shake + reason card
 * (paced by the panel).
 */

const STAND = "#7a6a56";
const BRASS = "#c9a227";

const BEAM_W = 7.4; // full width of the zoomed line (big, centred, close)
// The candidate interval (lower → upper round value) maps across the INNER
// 82% of the beam, so the physical line extends a little BEYOND both round
// values — it reads as "…and the scale continues" rather than stopping dead
// on the answers.
const BEAM_INNER = 0.82;
const BEAM_SPAN = BEAM_W * BEAM_INNER;
// CENTRED on the weigh area (x 0), LOWER and CLOSER to the camera. The dial is
// moved further LEFT (see Scale) so it never hides the line.
const BEAM_POS = [0, 2.5, 1.9];
// A bold indigo so the line POPS off the green grass + brown fence/trees
// (teacher feedback: the old wood-brown blended in).
const BEAM_COLOR = "#3d3f8f";
const BEAM_TICK = "#ffffff";

function Beam({ round }) {
  const markerRef = useRef();
  const dragging = useRef(false);
  const status = useWeighStation((s) => s.status);
  const locateResult = useWeighStation((s) => s.locateResult);
  const locked = status !== "locating"; // estimate committed → show the truth

  useFrame(() => {
    if (!markerRef.current) return;
    const frac = useWeighStation.getState().markerFrac;
    markerRef.current.position.x = (frac - 0.5) * BEAM_SPAN;
  });

  if (round.kind !== "round") return null;

  const setFromPoint = (worldX) => {
    // worldX is a world-space hit point; the candidate interval maps across
    // BEAM_SPAN centred on the beam origin (WEIGH_AREA.x + BEAM_POS[0]).
    const frac = (worldX - (WEIGH_AREA.x + BEAM_POS[0])) / BEAM_SPAN + 0.5;
    useWeighStation.getState().setMarkerFrac(frac);
  };
  const markerColor =
    locked && locateResult
      ? locateResult.band === "bullseye" ? "#e0a800" : locateResult.points > 0 ? "#d07a1f" : "#d43f3f"
      : "#f97316";

  const half = BEAM_SPAN / 2;
  return (
    <group position={BEAM_POS}>
      {/* The zoomed line: extends a little BEYOND the round values at each end. */}
      <mesh castShadow>
        <boxGeometry args={[BEAM_W, 0.2, 0.24]} />
        <meshStandardMaterial color={BEAM_COLOR} emissive={BEAM_COLOR} emissiveIntensity={0.25} />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} position={[(i / 10 - 0.5) * BEAM_SPAN, i % 5 === 0 ? 0.26 : 0.19, 0]}>
          <boxGeometry args={[0.07, i % 5 === 0 ? 0.58 : 0.34, 0.1]} />
          <meshStandardMaterial color={BEAM_TICK} />
        </mesh>
      ))}

      {/* DRAG SURFACE — click or drag anywhere on the beam to place the
          estimate marker (Decimal-Zoom-tool style). */}
      {!locked && (
        <mesh
          position={[0, 0.2, 0.1]}
          onPointerDown={(e) => {
            e.stopPropagation();
            dragging.current = true;
            e.target.setPointerCapture?.(e.pointerId);
            setFromPoint(e.point.x);
          }}
          onPointerMove={(e) => {
            if (dragging.current) setFromPoint(e.point.x);
          }}
          onPointerUp={(e) => {
            dragging.current = false;
            e.target.releasePointerCapture?.(e.pointerId);
          }}
        >
          <planeGeometry args={[BEAM_W + 1.2, 2.8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* The student's ESTIMATE marker — a big orange drag pin. */}
      {/* Demo hand targets along the beam (frac 0, 0.05 … 1) + the marker. */}
      {Array.from({ length: 21 }, (_, k) => <DemoPoint key={`wf${k}`} name={`weigh-frac-${k}`} position={[(k / 20 - 0.5) * BEAM_SPAN, 0.78, 0.12]} />)}
      <DemoPoint name="weigh-goal" position={[(round.needleFrac - 0.5) * BEAM_SPAN, 0.78, 0.12]} />
      <group ref={markerRef} position={[0, 0, 0]}>
        <DemoPoint name="weigh-marker" position={[0, 0.78, 0.12]} />
        <mesh position={[0, 0.78, 0.07]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.16]} />
          <meshStandardMaterial color={markerColor} emissive={markerColor} emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0.3, 0.07]}>
          <boxGeometry args={[0.1, 0.7, 0.08]} />
          <meshStandardMaterial color={markerColor} />
        </mesh>
      </group>

      {/* The TRUE position — revealed once the estimate is locked in. */}
      {locked && (
        <group position={[(round.needleFrac - 0.5) * BEAM_SPAN, 0, 0]}>
          <mesh position={[0, 0.72, 0.02]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.2, 0.55, 8]} />
            <meshStandardMaterial color="#1c7c1c" emissive="#2a9d2a" emissiveIntensity={0.45} />
          </mesh>
          <mesh position={[0, 0.26, 0.02]}>
            <boxGeometry args={[0.07, 0.55, 0.06]} />
            <meshStandardMaterial color="#1c7c1c" />
          </mesh>
        </group>
      )}

      {/* End labels — the two round values, sitting just past the candidate
          ticks (the beam itself continues a little further). */}
      <Html position={[-(half + 0.55), 0.1, 0]} center distanceFactor={8.5} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div className="fc-count-chip">{round.lowerStr}</div>
      </Html>
      <Html position={[half + 0.55, 0.1, 0]} center distanceFactor={8.5} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div className="fc-count-chip">{round.upperStr}</div>
      </Html>
      {/* The WEIGHT is always shown — the student locates it by hand. */}
      <Html position={[0, 1.35, 0]} center distanceFactor={8.5} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div className="milk-display">{round.exactStr}</div>
      </Html>
    </group>
  );
}

function Scale({ round }) {
  const needleRef = useRef();
  useFrame((state) => {
    if (!needleRef.current || !round || round.kind !== "round") return;
    // Dial needle sweeps ~120° across the zoomed window + a live tremble.
    const target = (round.needleFrac - 0.5) * (Math.PI * 0.66);
    const tremble = Math.sin(state.clock.elapsedTime * 3.1) * 0.015;
    needleRef.current.rotation.z = -(target + tremble);
  });

  return (
    // Moved further LEFT and angled toward the camera so the dial clears the
    // now-centred, wider beam.
    <group position={[-5.6, 0, 0.4]} rotation={[0, 0.5, 0]}>
      {/* Pedestal + pan. */}
      <mesh castShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.5, 0.7, 1.1, 14]} />
        <meshStandardMaterial color={STAND} />
      </mesh>
      <mesh castShadow position={[0, 1.16, 0]}>
        <cylinderGeometry args={[0.95, 0.8, 0.14, 18]} />
        <meshStandardMaterial color="#9aa3ad" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Produce on the pan. */}
      {round && round.kind === "round" && !round.money && (
        <mesh castShadow position={[0, 1.55, 0]} scale={[1, 0.82, 1]}>
          <sphereGeometry args={[0.42, 14, 12]} />
          <meshStandardMaterial color="#e07b28" />
        </mesh>
      )}
      {round && round.kind === "round" && round.money && (
        <mesh castShadow position={[0, 1.42, 0]}>
          <boxGeometry args={[0.7, 0.4, 0.5]} />
          <meshStandardMaterial color="#b98a52" />
        </mesh>
      )}
      {/* The big dial behind the pan. */}
      <group position={[0, 2.5, -0.35]}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.85, 0.85, 0.14, 24]} />
          <meshStandardMaterial color="#f1e9d8" />
        </mesh>
        <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.72, 0.72, 0.02, 24]} />
          <meshStandardMaterial color="#fffdf6" />
        </mesh>
        <group ref={needleRef} position={[0, 0, 0.11]}>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.05, 0.6, 0.02]} />
            <meshStandardMaterial color="#d43f3f" />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.12]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color={BRASS} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/** Scenario cards for JUDGEMENT rounds (numeric rounds use drag + type). */
function OptionSigns() {
  const status = useWeighStation((s) => s.status);
  const round = useWeighStation((s) => s.currentRound());
  const chosenIndex = useWeighStation((s) => s.chosenIndex);
  if ((status !== "choosing" && status !== "celebrate" && status !== "feedback") || !round) return null;
  if (round.kind !== "judge") return null;
  const showChoice = status !== "choosing";
  const spacing = 3.6;

  return (
    <group position={[WEIGH_AREA.x, 0, WEIGH_AREA.z + 2.7]}>
      {round.options.map((opt, i) => {
        const isCorrect = i === round.correctIndex;
        const isChosen = i === chosenIndex;
        const border = showChoice
          ? isCorrect ? "#2a9d2a" : isChosen ? "#d43f3f" : "#b9b2a6"
          : "#7a5200";
        return (
          <group key={i} position={[(i - 1) * spacing, 0, 0]}>
            <mesh castShadow position={[0, 0.5, 0]}>
              <boxGeometry args={[0.12, 1.0, 0.12]} />
              <meshStandardMaterial color={STAND} />
            </mesh>
            <mesh
              position={[0, 0.8, 0]}
              onPointerDown={(e) => {
                const st = useWeighStation.getState();
                if (st.status !== "choosing") return;
                e.stopPropagation();
                st.choose(i);
              }}
            >
              <sphereGeometry args={[1.5, 10, 10]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <Html position={[0, 1.25, 0]} center distanceFactor={11} className="ix-badge-anchor" zIndexRange={[24, 0]}>
              <div className="weigh-scenario" style={{ borderColor: border }}>{opt}</div>
            </Html>
          </group>
        );
      })}
      {status === "celebrate" && <ConfettiBurst origin={[(round.correctIndex - 1) * spacing, 0.8, 0]} />}
    </group>
  );
}

export default function WeighStationChallenge() {
  const status = useWeighStation((s) => s.status);
  // The current round stays current through feedback/celebrate (next()
  // advances it), so it is always the one to show.
  const shown = useWeighStation((s) => s.currentRound());
  const active = status !== "idle" && status !== "intro";

  return (
    <group>
      <group position={[WEIGH_AREA.x, 0, WEIGH_AREA.z]}>
        <Scale round={active ? shown : null} />
        {active && shown && shown.kind === "round" && <Beam round={shown} />}
        {/* Confetti when the ROUNDED value is typed correctly (celebrate). The
            wrong-answer shake is fired by the panel (camShake). */}
        {active && status === "celebrate" && shown && shown.kind === "round" && (
          <ConfettiBurst origin={[BEAM_POS[0], BEAM_POS[1] + 0.6, BEAM_POS[2]]} />
        )}
        {active && shown && shown.kind === "judge" && (
          <Html position={[0, 3.4, 0]} center distanceFactor={12} className="ix-badge-anchor" zIndexRange={[24, 0]}>
            <div className="milk-display">EXACT… or ≈ ?</div>
          </Html>
        )}
        {/* Idle dressing: a pumpkin waiting beside the scale. */}
        {!active && (
          <mesh castShadow position={[1.4, 0.35, 0.9]} scale={[1, 0.8, 1]}>
            <sphereGeometry args={[0.42, 14, 12]} />
            <meshStandardMaterial color="#e07b28" />
          </mesh>
        )}
      </group>
      <OptionSigns />
    </group>
  );
}
