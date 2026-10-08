import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { useLakeChallenge } from "../stores/lakeStore.js";
import { Chip, Sparks } from "./StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";

/**
 * LAVA CHANNELS — an iron cauldron on the islet pours into a stone channel
 * built out over the lava lake. The channel is d cells wide; every poured
 * chunk fills that many rows and is labelled ("10 rows = 120"), so the
 * filled channel IS the open array and its length is the quotient. A chunk
 * too big for what's left splashes. On sharing rounds the channel's columns
 * are moulds — each row puts one more into every mould.
 */

const CH_X = 0.8; // channel centre (stage x)
const CH_W = 3.7;
const CH_Z0 = -3.5; // head of the channel (by the islet edge)
const CH_LEN = 8.8;
const CAULDRON = [-2.4, -1.7];

// Poured chunks alternate bright GOLD and deep ORANGE so each chunk reads
// apart from its neighbours and from the lava lake around the channel.
const CHUNK_COLORS = ["#ffe066", "#ff7b22", "#fff3a8", "#ff9a3c", "#ffd23f", "#ff6a2a"];

function Cauldron({ left, D }) {
  const lava = useRef();
  const lvl = useRef(1);
  useFrame((state, dt) => {
    lvl.current += (left / Math.max(1, D) - lvl.current) * (1 - Math.exp(-4 * dt));
    if (lava.current) {
      lava.current.position.y = 0.45 + lvl.current * 0.9;
      lava.current.material.emissiveIntensity = 1.0 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });
  return (
    <group position={[CAULDRON[0], 0, CAULDRON[1]]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[1.05, 0.85, 1.6, 18, 1, true]} />
        <meshStandardMaterial color="#2a2524" metalness={0.7} roughness={0.45} side={2} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.12, 18]} />
        <meshStandardMaterial color="#1c1918" metalness={0.6} />
      </mesh>
      <mesh ref={lava} position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.98, 0.98, 0.06, 18]} />
        <meshStandardMaterial color="#ff8a2a" emissive="#ff4a00" emissiveIntensity={1.1} toneMapped={false} />
      </mesh>
      {/* Spout toward the channel head. */}
      <mesh position={[1.45, 1.35, -0.75]} rotation={[0, -0.5, -0.25]}>
        <boxGeometry args={[1.4, 0.16, 0.42]} />
        <meshStandardMaterial color="#2f2a28" metalness={0.5} />
      </mesh>
      <Chip position={[0, 2.25, 0]} df={10} className="fc-count-chip">
        {left} left
      </Chip>
    </group>
  );
}

export default function LakeStage() {
  const status = useLakeChallenge((s) => s.status);
  const round = useLakeChallenge((s) => s.currentRound());
  const pours = useLakeChallenge((s) => s.pours);
  const left = useLakeChallenge((s) => s.left);
  const lastPour = useLakeChallenge((s) => s.lastPour);
  const share = round?.kind === "share";
  const rowH = round ? Math.min(0.55, CH_LEN / Math.max(round.q, 8)) : 0.5;
  const dividers = useMemo(() => {
    if (!round) return [];
    const out = [];
    const step = round.d > 15 ? 5 : 1;
    for (let k = step; k < round.d; k += step) out.push(-CH_W / 2 + (CH_W * k) / round.d);
    return out;
  }, [round]);
  if (!round || status === "intro" || status === "done") return null;
  const celebrate = status === "celebrate";
  const ended = celebrate || status === "feedback";
  const filled = pours.reduce((s, k) => s + k, 0);
  let z = CH_Z0;
  const chunks = pours.map((k, i) => {
    const z0 = z;
    z -= k * rowH;
    return { k, i, z0, z1: z };
  });
  return (
    <group>
      {/* The stone channel: floor + two side walls, out over the lava. */}
      <group position={[CH_X, 0, CH_Z0 - CH_LEN / 2]}>
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[CH_W + 0.2, 0.22, CH_LEN + 0.2]} />
          <meshStandardMaterial color="#3a3230" roughness={0.9} />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * (CH_W / 2 + 0.28), 0.32, 0]} castShadow>
            <boxGeometry args={[0.4, 0.7, CH_LEN + 0.6]} />
            <meshStandardMaterial color="#4a403c" roughness={0.9} flatShading />
          </mesh>
        ))}
        {/* Support piers into the lava. */}
        {[-3, 0, 3].map((pz) => [-1, 1].map((sd) => (
          <mesh key={`${pz}${sd}`} position={[sd * (CH_W / 2 + 0.28), -0.8, pz]}>
            <boxGeometry args={[0.5, 1.6, 0.5]} />
            <meshStandardMaterial color="#2e2725" roughness={1} />
          </mesh>
        )))}
        {dividers.map((x) => (
          <mesh key={x} position={[x, 0.17, 0]}>
            <boxGeometry args={[0.03, 0.02, CH_LEN]} />
            <meshBasicMaterial color="#6a5a54" />
          </mesh>
        ))}
      </group>
      {/* Poured chunks — each a band of rows with its own chip. */}
      {chunks.map((c) => (
        <group key={c.i}>
          <mesh position={[CH_X, 0.24, (c.z0 + c.z1) / 2]}>
            <boxGeometry args={[CH_W, 0.14, Math.abs(c.z0 - c.z1) - 0.07]} />
            <meshStandardMaterial
              color={celebrate ? "#ffd166" : CHUNK_COLORS[c.i % CHUNK_COLORS.length]}
              emissive={celebrate ? "#ffd166" : CHUNK_COLORS[c.i % CHUNK_COLORS.length]}
              emissiveIntensity={0.55}
              toneMapped={false}
            />
          </mesh>
          {/* The array's cells: a crust line between every row… */}
          {c.k <= 40 && Array.from({ length: c.k - 1 }, (_, r) => (
            <mesh key={`r${r}`} position={[CH_X, 0.32, c.z0 - (r + 1) * rowH]}>
              <boxGeometry args={[CH_W, 0.02, 0.025]} />
              <meshBasicMaterial color="#7a2a00" transparent opacity={0.55} />
            </mesh>
          ))}
          {/* …and down every column. */}
          {dividers.map((x) => (
            <mesh key={`c${x}`} position={[CH_X + x, 0.32, (c.z0 + c.z1) / 2]}>
              <boxGeometry args={[0.025, 0.02, Math.abs(c.z0 - c.z1) - 0.07]} />
              <meshBasicMaterial color="#7a2a00" transparent opacity={0.55} />
            </mesh>
          ))}
          <Chip position={[CH_X + CH_W / 2 + 1.3, 0.5, (c.z0 + c.z1) / 2]} df={11} className="fc-count-chip">
            {share ? `${c.k} each = ${c.k * round.d}` : `${c.k} row${c.k > 1 ? "s" : ""} = ${c.k * round.d}`}
          </Chip>
        </group>
      ))}
      {/* Width label + (sharing) the moulds along the head. */}
      <Chip position={[CH_X, 0.6, CH_Z0 + 0.7]} df={11} className="fc-count-chip">
        {share ? `${round.d} moulds` : `${round.d} wide`}
      </Chip>
      {share && Array.from({ length: Math.min(round.d, 12) }, (_, k) => (
        <mesh key={k} position={[CH_X - CH_W / 2 + (CH_W * (k + 0.5)) / round.d, 0.28, CH_Z0 + 0.25]}>
          <sphereGeometry args={[Math.min(0.13, (CH_W / round.d) * 0.4), 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color="#8a7a70" metalness={0.4} side={2} />
        </mesh>
      ))}
      <Cauldron left={left} D={round.D} />
      {lastPour && (
        <Sparks
          origin={[CH_X - 0.6, 0.6, CH_Z0 + 0.2]}
          at={lastPour.at}
          color={lastPour.spill ? "#ff2a00" : "#ffb347"}
          count={lastPour.spill ? 40 : 16}
          spread={lastPour.spill ? 2.2 : 0.8}
        />
      )}
      <Chip position={[CH_X, 1.4, CH_Z0 - CH_LEN - 1.0]} df={10} className={`fc-count-chip${ended ? " good" : ""}`}>
        {round.D} ÷ {round.d}{filled ? ` → ${pours.join(" + ")} = ${filled}` : ""}{ended && round.rem ? ` r ${round.rem}` : ""}
      </Chip>
      {celebrate && <ConfettiBurst origin={[CH_X, 0.6, CH_Z0 - 3]} />}
    </group>
  );
}
