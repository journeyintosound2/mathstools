import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { useSummitChallenge } from "../stores/summitStore.js";
import { Chip } from "./StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";

/**
 * STRATEGY SUMMIT — three rune tablets on the crater rim, each the round's
 * problem rewritten a different way (all correct). The camera looks INWARD
 * across the glowing crater. Tapping a tablet picks that way; then the
 * easiest tablet blazes gold so the student sees which it was.
 */

const XS = [-2.5, 0, 2.5];
const TZ = -1.2;

function Tablet({ x, choice, picked, revealBest, celebrate }) {
  const ref = useRef();
  useFrame((state) => {
    const o = ref.current;
    if (!o) return;
    const lift = picked ? 0.25 + Math.sin(state.clock.elapsedTime * 3) * 0.05 : 0;
    o.position.y += (lift - o.position.y) * 0.15;
  });
  const gold = revealBest && choice.best;
  const glow = gold ? "#ffb000" : picked ? "#3aa0ff" : "#ff5a1a";
  return (
    <group position={[x, 0, TZ]}>
      <group ref={ref}>
        <mesh
          position={[0, 1.45, 0]}
          rotation={[-0.08, 0, 0]}
          castShadow
          onPointerDown={(e) => {
            e.stopPropagation();
            useSummitChallenge.getState().pick(choice.key);
          }}
        >
          <boxGeometry args={[2.15, 2.7, 0.36]} />
          <meshStandardMaterial color={gold ? "#5a4a2a" : "#3a3034"} roughness={0.85} flatShading emissive={glow} emissiveIntensity={gold || picked ? 0.25 : 0.06} />
        </mesh>
        {/* Rune border glow. */}
        <mesh position={[0, 1.45, 0.2]} rotation={[-0.08, 0, 0]}>
          <planeGeometry args={[1.95, 2.5]} />
          <meshBasicMaterial color={glow} transparent opacity={gold || picked ? 0.28 : 0.12} toneMapped={false} />
        </mesh>
        <Chip position={[0, 1.75, 0.3]} df={9} className={`magma-rune${gold ? " best" : ""}${picked ? " sel" : ""}`}>
          {choice.show}
        </Chip>
        <Chip position={[0, 0.65, 0.3]} df={11} className="magma-rune-name">
          {choice.name}
        </Chip>
        {celebrate && gold && <pointLight position={[0, 1.6, 1]} color="#ffcc66" intensity={4} distance={6} />}
      </group>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[2.4, 0.16, 0.8]} />
        <meshStandardMaterial color="#2a2324" roughness={1} />
      </mesh>
    </group>
  );
}

export default function SummitStage() {
  const status = useSummitChallenge((s) => s.status);
  const round = useSummitChallenge((s) => s.currentRound());
  const picked = useSummitChallenge((s) => s.picked);
  const phase = useSummitChallenge((s) => s.phase);
  if (!round || status === "intro" || status === "done") return null;
  const ended = status === "celebrate" || status === "feedback";
  return (
    <group>
      {round.choices.map((c, i) => (
        <Tablet key={`${round.roundIndex}-${c.key}`} x={XS[i]} choice={c} picked={picked === c.key} revealBest={phase !== "pick"} celebrate={status === "celebrate"} />
      ))}
      <Chip position={[0, 3.6, TZ - 0.4]} df={9} className={`fc-count-chip magma-summit-q${ended ? " good" : ""}`}>
        {round.q}{ended ? `  →  ${round.answer}` : ""}
      </Chip>
      {status === "celebrate" && <ConfettiBurst origin={[0, 1.5, TZ]} />}
    </group>
  );
}
