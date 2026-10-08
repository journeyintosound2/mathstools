import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { useTerracesChallenge } from "../stores/terracesStore.js";
import { TERRACE_GEOM } from "../../../data/magma/magmaChallenges.js";
import {
  terraceStones, shiftStones, terracePlaceholders, TERRACE_SHORT,
} from "../../../data/magma/terracesChallenge.js";
import { fmtThousandths } from "../../../data/magma/magmaMath.js";
import { Chip } from "./StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";

/**
 * TENFOLD TERRACES — seven stone terraces (thousands, highest, on the left
 * → thousandths on the right). Digit stones sit on the terraces and HOP one
 * terrace per × 10 / ÷ 10; the decimal point is a fixed glowing orb on its
 * own pillar. Placeholder zeros fade while the digits move and DROP back in
 * once the number has been said.
 */

const G = TERRACE_GEOM;
const STONE = 0.82;
const FRONT_Z = G.z1 - 0.62;

/** The permanent staircase (always in the world, challenge or not). */
export function TerracesSetPiece() {
  const blocks = useMemo(() => G.places.map((p) => ({ p, x: G.x(p), top: G.top(p) })), []);
  const depth = G.z1 - G.z0;
  return (
    <group>
      {blocks.map((b) => (
        <group key={b.p} position={[b.x, 0, G.zMid]}>
          <mesh position={[0, b.top / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[G.width, b.top, depth]} />
            <meshStandardMaterial color={b.p >= 0 ? "#5c4f49" : "#4e4350"} roughness={0.92} flatShading />
          </mesh>
          {/* Worn top slab, a touch lighter, + a lava seam under its lip. */}
          <mesh position={[0, b.top + 0.03, 0]} receiveShadow>
            <boxGeometry args={[G.width - 0.06, 0.06, depth - 0.06]} />
            <meshStandardMaterial color={b.p >= 0 ? "#7a6a62" : "#6c5f70"} roughness={0.85} />
          </mesh>
          <mesh position={[0, b.top - 0.12, depth / 2 + 0.005]}>
            <planeGeometry args={[G.width - 0.2, 0.05]} />
            <meshBasicMaterial color="#ff7a2a" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* The decimal point: a glowing orb on a slim pillar between the ones
          and the tenths — it never moves. */}
      <mesh position={[G.pointX, (G.top(0) + 0.2) / 2, FRONT_Z]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, G.top(0) + 0.2, 8]} />
        <meshStandardMaterial color="#2d2523" roughness={0.8} />
      </mesh>
      <mesh position={[G.pointX, G.top(0) + 0.38, FRONT_Z]}>
        <sphereGeometry args={[0.2, 18, 14]} />
        <meshStandardMaterial color="#ffb347" emissive="#ff7a00" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      <pointLight position={[G.pointX, G.top(0) + 0.6, FRONT_Z + 0.4]} color="#ff9a40" intensity={2.2} distance={4} decay={2} />
    </group>
  );
}

/** One digit stone that hops to its terrace. */
function DigitStone({ digit, place, dim = false, drop = null, celebrate }) {
  const ref = useRef();
  const anim = useRef({ from: null, to: null, t: 1 });
  const target = [G.x(place), G.top(place) + STONE / 2 + 0.06, FRONT_Z];
  const a = anim.current;
  if (!a.to || a.to[0] !== target[0] || a.to[1] !== target[1]) {
    a.from = a.to ? (ref.current ? [ref.current.position.x, ref.current.position.y, ref.current.position.z] : a.to) : drop ? [target[0], target[1] + 3.5, target[2]] : target;
    a.to = target;
    a.t = 0;
  }
  useFrame((state, dt) => {
    const o = ref.current;
    if (!o) return;
    a.t = Math.min(1, a.t + dt / 0.45);
    const e = a.t < 0.5 ? 2 * a.t * a.t : 1 - Math.pow(-2 * a.t + 2, 2) / 2;
    const hop = Math.sin(Math.PI * a.t) * (drop ? 0 : 0.9);
    o.position.set(
      a.from[0] + (a.to[0] - a.from[0]) * e,
      a.from[1] + (a.to[1] - a.from[1]) * e + hop + (celebrate ? Math.max(0, Math.sin(state.clock.elapsedTime * 7 + place)) * 0.18 : 0),
      a.from[2] + (a.to[2] - a.from[2]) * e
    );
  });
  return (
    <group ref={ref} position={a.from}>
      <mesh castShadow>
        <boxGeometry args={[STONE, STONE, STONE]} />
        <meshStandardMaterial
          color={dim ? "#3a3331" : celebrate ? "#ffd166" : "#e8ddd0"}
          emissive={dim ? "#000" : celebrate ? "#b36b00" : "#3a1a00"}
          emissiveIntensity={dim ? 0 : 0.35}
          roughness={0.7}
          transparent={dim}
          opacity={dim ? 0.75 : 1}
        />
      </mesh>
      <Chip position={[0, 0, STONE / 2 + 0.02]} df={8} className={`magma-digit${dim ? " dim" : ""}`}>
        {digit}
      </Chip>
    </group>
  );
}

export default function TerracesStage() {
  const status = useTerracesChallenge((s) => s.status);
  const round = useTerracesChallenge((s) => s.currentRound());
  const phase = useTerracesChallenge((s) => s.phase);
  const shift = useTerracesChallenge((s) => s.shift);
  if (!round || status === "intro" || status === "done") return null;
  const ended = status === "celebrate" || status === "feedback";
  const showStones = phase !== "fact" || ended;
  const base = terraceStones(round.start);
  const stones = shiftStones(base, ended ? round.shift : shift);
  // Placeholder zeros: the start number's own zeros before any slide, and the
  // answer's zeros once it has been said.
  const zeros = ended ? terracePlaceholders(stones) : shift === 0 && phase === "slide" ? terracePlaceholders(base) : [];
  const celebrate = status === "celebrate";
  return (
    <group>
      {G.places.map((p) => (
        <Chip key={p} position={[G.x(p), 0.3, G.z1 + 0.42]} df={11} className="fc-count-chip magma-place">
          {TERRACE_SHORT[p]}
        </Chip>
      ))}
      {showStones && stones.map((st, i) => (
        <DigitStone key={`${round.roundIndex}-${i}`} digit={st.digit} place={st.place} celebrate={celebrate} />
      ))}
      {zeros.map((p) => (
        <DigitStone key={`${round.roundIndex}-z${p}-${ended ? "e" : "s"}`} digit={0} place={p} dim={!ended} drop={ended} celebrate={celebrate} />
      ))}
      <Chip position={[-1.2, G.top(3) + 1.25, G.zMid - 0.6]} df={10} className="fc-count-chip">
        {round.text}{ended ? ` = ${fmtThousandths(round.result)}` : ""}
      </Chip>

      {celebrate && <ConfettiBurst origin={[0, 1.5, G.zMid]} />}
    </group>
  );
}
