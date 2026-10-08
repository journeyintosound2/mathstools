import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { useCinderChallenge } from "../stores/cinderStore.js";
import { Chip, Sparks } from "./StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";

/**
 * CART TABLES — the ratio table carved as a row of basalt tablets in front
 * of the cinder cones: carts on top, rocks below, one tablet per column.
 * Selected columns glow; the new column rises with its rocks unknown ("?")
 * until the student works them out. A loaded ore cart sits at the start.
 */

export const CINDER_SPACING = 1.75;
const SPACING = CINDER_SPACING;
const CZ = -1.0;
const TAB_H = 2.4;

function Tablet({ x, carts, rocks, selected, pending, hit, first, onTap }) {
  const ref = useRef();
  const born = useRef(performance.now());
  useFrame(() => {
    const o = ref.current;
    if (!o) return;
    const k = Math.min(1, (performance.now() - born.current) / 450);
    o.position.y = -TAB_H * (1 - (1 - Math.pow(1 - k, 3)));
    o.position.x += (x - o.position.x) * 0.25;
  });
  const glow = hit ? "#ffd166" : selected ? "#ffb347" : pending ? "#7fd4ff" : null;
  return (
    <group ref={ref} position={[x, 0, CZ]}>
      <mesh
        position={[0, TAB_H / 2, 0]}
        castShadow
        receiveShadow
        onPointerDown={onTap ? (e) => { e.stopPropagation(); onTap(); } : undefined}
      >
        <boxGeometry args={[1.5, TAB_H, 0.38]} />
        <meshStandardMaterial color={first ? "#5a4a44" : "#4a403c"} roughness={0.9} flatShading emissive={glow || "#000"} emissiveIntensity={glow ? 0.35 : 0} />
      </mesh>
      <mesh position={[0, TAB_H / 2, 0.18]}>
        <boxGeometry args={[1.3, 0.06, 0.02]} />
        <meshBasicMaterial color="#ff7a2a" toneMapped={false} />
      </mesh>
      <Chip position={[0, TAB_H * 0.74, 0.24]} df={7} className={`magma-cell${selected ? " sel" : ""}`}>{carts}</Chip>
      <Chip position={[0, TAB_H * 0.27, 0.24]} df={7} className={`magma-cell${pending ? " ask" : ""}${hit ? " hit" : ""}`}>{pending ? "?" : rocks}</Chip>
    </group>
  );
}

function OreCart({ x }) {
  return (
    <group position={[x, 0, CZ + 0.3]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.1, 0.6, 0.8]} />
        <meshStandardMaterial color="#5b4636" roughness={0.8} metalness={0.3} />
      </mesh>
      {[[-0.35, 0.42], [0.35, 0.42], [-0.35, -0.42], [0.35, -0.42]].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.2, wz]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.08, 10]} />
          <meshStandardMaterial color="#222" metalness={0.6} />
        </mesh>
      ))}
      {[[-0.2, 0.0], [0.15, 0.1], [0.0, -0.15], [0.25, -0.1], [-0.25, 0.15]].map(([rx, rz], i) => (
        <mesh key={i} position={[rx, 0.92, rz]}>
          <dodecahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial color="#3a302d" flatShading />
        </mesh>
      ))}
    </group>
  );
}

export default function CinderStage() {
  const status = useCinderChallenge((s) => s.status);
  const round = useCinderChallenge((s) => s.currentRound());
  const cols = useCinderChallenge((s) => s.cols);
  const sel = useCinderChallenge((s) => s.sel);
  const pending = useCinderChallenge((s) => s.pending);
  const lastCol = useCinderChallenge((s) => s.lastCol);
  if (!round || status === "intro" || status === "done") return null;
  const n = cols.length + (pending ? 1 : 0);
  const x0 = -((n - 1) * SPACING) / 2;
  const celebrate = status === "celebrate";
  const ended = celebrate || status === "feedback";
  const target = round.targetRow === "top" ? `${round.targetCarts} carts → ? rocks` : `? carts ← ${round.targetRocks} rocks`;
  return (
    <group>
      <mesh position={[0, 0.03, CZ]} receiveShadow>
        <boxGeometry args={[Math.max(6, n * SPACING + 2.6), 0.06, 1.6]} />
        <meshStandardMaterial color="#2e2624" roughness={1} />
      </mesh>
      <Chip position={[x0 - 1.6, TAB_H * 0.74, CZ + 0.2]} df={10} className="fc-count-chip">🛒 carts</Chip>
      <Chip position={[x0 - 1.6, TAB_H * 0.27, CZ + 0.2]} df={10} className="fc-count-chip">🪨 rocks</Chip>
      {cols.map(([c, r], i) => (
        <Tablet
          key={`${round.roundIndex}-${i}`}
          x={x0 + i * SPACING}
          carts={c}
          rocks={r}
          first={i === 0}
          selected={sel.includes(i) && !ended}
          hit={ended && c === round.targetCarts}
          onTap={ended ? undefined : () => useCinderChallenge.getState().select(i)}
        />
      ))}
      {pending && <Tablet key={`p-${pending.carts}`} x={x0 + cols.length * SPACING} carts={pending.carts} rocks={null} pending />}
      <OreCart x={x0 - 3.3} />
      <Chip position={[0, TAB_H + 1.0, CZ - 0.3]} df={10} className={`fc-count-chip${ended ? " good" : ""}`}>
        {ended ? `${round.targetCarts} carts ↔ ${round.targetRocks} rocks` : `Target: ${target}`}
      </Chip>
      {lastCol && status === "play" && <Sparks origin={[x0 + lastCol.i * SPACING, TAB_H, CZ]} at={lastCol.at} color="#ffb347" count={18} />}
      {celebrate && <ConfettiBurst origin={[0, 1.0, CZ]} />}
    </group>
  );
}
