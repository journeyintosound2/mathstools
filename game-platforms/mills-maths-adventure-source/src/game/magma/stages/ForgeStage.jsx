import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { useForgeChallenge } from "../stores/forgeStore.js";
import { Chip, Sparks } from "./StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";

/**
 * FACTOR FORGE — glowing ingots on a long forge table. Tapping one lifts it
 * (selected); a hammer-split pops it into two; fusing slams two together
 * into one bright ingot. A friendly 10/100/1000 flashes gold.
 */

const TABLE_W = 9.2;
const TABLE_Y = 1.0;
const SPACING = 1.42;
const CZ = -0.4;

function Ingot({ value, x, selected, friendly, celebrate, onTap }) {
  const ref = useRef();
  const born = useRef(performance.now());
  useFrame((state) => {
    const o = ref.current;
    if (!o) return;
    const age = (performance.now() - born.current) / 1000;
    const pop = Math.min(1, age / 0.35);
    const s = 0.25 + 0.75 * (1 - Math.pow(1 - pop, 3)) + (pop < 1 ? Math.sin(pop * Math.PI) * 0.25 : 0);
    o.scale.setScalar(s);
    const lift = selected ? 0.35 + Math.sin(state.clock.elapsedTime * 4) * 0.05 : 0;
    const hop = celebrate ? Math.max(0, Math.sin(state.clock.elapsedTime * 6 + x)) * 0.2 : 0;
    o.position.x += (x - o.position.x) * 0.2;
    o.position.y = TABLE_Y + 0.24 + lift + hop;
  });
  const gold = friendly || celebrate;
  return (
    <group ref={ref} position={[x, TABLE_Y + 0.24, CZ]} onPointerDown={(e) => { e.stopPropagation(); onTap(); }}>
      <mesh castShadow>
        <boxGeometry args={[1.12, 0.44, 0.62]} />
        <meshStandardMaterial
          color={gold ? "#ffd166" : selected ? "#ffb070" : "#e8873a"}
          emissive={gold ? "#ff9f00" : selected ? "#ff6a00" : "#a83a00"}
          emissiveIntensity={selected ? 1.0 : 0.55}
          metalness={0.6}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.92, 0.06, 0.48]} />
        <meshStandardMaterial color={gold ? "#fff0b3" : "#ffc28a"} emissive="#ff8a20" emissiveIntensity={0.4} metalness={0.5} roughness={0.3} />
      </mesh>
      <Chip position={[0, 0.02, 0.34]} df={8} className={`magma-digit ingot${selected ? " sel" : ""}`}>
        {value}
      </Chip>
    </group>
  );
}

export default function ForgeStage() {
  const status = useForgeChallenge((s) => s.status);
  const round = useForgeChallenge((s) => s.currentRound());
  const ingots = useForgeChallenge((s) => s.ingots);
  const selected = useForgeChallenge((s) => s.selected);
  const lastEvent = useForgeChallenge((s) => s.lastEvent);
  const active = round && status !== "intro" && status !== "done";
  const n = ingots.length;
  const x0 = -((n - 1) * SPACING) / 2;
  const celebrate = status === "celebrate";
  return (
    <group>
      {/* The forge table: a long basalt slab on two stone legs. */}
      <mesh position={[0, TABLE_Y - 0.15, CZ]} castShadow receiveShadow>
        <boxGeometry args={[TABLE_W, 0.3, 1.5]} />
        <meshStandardMaterial color="#3b3330" roughness={0.85} flatShading />
      </mesh>
      {[-TABLE_W / 2 + 0.9, TABLE_W / 2 - 0.9].map((x) => (
        <mesh key={x} position={[x, (TABLE_Y - 0.3) / 2, CZ]} castShadow>
          <boxGeometry args={[1.1, TABLE_Y - 0.3, 1.1]} />
          <meshStandardMaterial color="#2c2523" roughness={0.9} flatShading />
        </mesh>
      ))}
      <mesh position={[0, TABLE_Y + 0.005, CZ + 0.76]}>
        <boxGeometry args={[TABLE_W - 0.4, 0.04, 0.04]} />
        <meshBasicMaterial color="#ff7a2a" toneMapped={false} />
      </mesh>
      {active && ingots.map((v, k) => (
        <Ingot
          key={`${round.roundIndex}-${k}-${v}`}
          value={v}
          x={x0 + k * SPACING}
          selected={selected.includes(k)}
          friendly={lastEvent?.type === "fuse" && lastEvent.friendly && lastEvent.value === v}
          celebrate={celebrate}
          onTap={() => useForgeChallenge.getState().select(k)}
        />
      ))}
      {active && (
        <Chip position={[0, TABLE_Y + 2.1, CZ - 0.4]} df={10} className={`fc-count-chip${celebrate || status === "feedback" ? " good" : ""}`}>
          {round.ingots.join(" × ")}
          {celebrate || status === "feedback"
            ? ` = ${round.product}`
            : ingots.join(",") === round.ingots.join(",") ? "" : ` = ${ingots.join(" × ")}`}
        </Chip>
      )}
      {active && lastEvent && (
        <Sparks origin={[0, TABLE_Y + 0.4, CZ]} at={lastEvent.at} color={lastEvent.friendly ? "#ffe066" : "#ff9a3c"} count={lastEvent.type === "fuse" ? 34 : 22} />
      )}
      {celebrate && <ConfettiBurst origin={[0, TABLE_Y, CZ]} />}
    </group>
  );
}
