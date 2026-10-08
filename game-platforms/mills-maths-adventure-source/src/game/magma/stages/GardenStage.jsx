import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { useGardenChallenge } from "../stores/gardenStore.js";
import { GARDEN_FLOWERS, GARDEN_POTS, GARDEN_GLOWS } from "../../../data/magma/gardenChallenge.js";
import { Chip } from "./StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";

/**
 * FLOWER COMBOS — each planted combo (a flower in a pot, maybe glowing) pops
 * up at ITS place: flower = row, pot = column, glow = which garden. The empty
 * grid is never drawn — the array appears as the student plants, so "for
 * each flower, a whole row of pots" is something they BUILD and then see.
 */

const CZ = -0.6;

function layout(r) {
  const G = r.g;
  const sp = Math.min(1.9, 11 / (G * r.p + (G - 1) * 1.1), 6.2 / r.f);
  const gardenW = r.p * sp;
  const gap = 1.3;
  const total = G * gardenW + (G - 1) * gap;
  const gx = (g) => -total / 2 + g * (gardenW + gap) + gardenW / 2;
  const cell = (fi, pi, g) => [gx(g) + (pi - (r.p - 1) / 2) * sp, CZ + (fi - (r.f - 1) / 2) * sp];
  return { sp, gx, cell, total, gardenW };
}

function Plant({ fi, pi, gi, pos, sp, ghost, celebrate, glow }) {
  const ref = useRef();
  const born = useRef(performance.now());
  useFrame((state) => {
    const o = ref.current;
    if (!o) return;
    const k = Math.min(1, (performance.now() - born.current) / 380);
    const s = (ghost ? 1 : 0.2 + 0.8 * (1 - Math.pow(1 - k, 3)) + Math.sin(k * Math.PI) * 0.2) * (sp / 1.2);
    o.scale.setScalar(s);
    o.position.y = celebrate ? Math.max(0, Math.sin(state.clock.elapsedTime * 5 + fi + pi * 0.7 + gi)) * 0.15 : 0;
  });
  const fl = GARDEN_FLOWERS[fi], pt = GARDEN_POTS[pi];
  return (
    <group position={[pos[0], 0, pos[1]]}>
      <group ref={ref}>
        {glow && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <circleGeometry args={[0.55, 20]} />
            <meshBasicMaterial color={GARDEN_GLOWS[gi].color} transparent opacity={ghost ? 0.15 : 0.55} toneMapped={false} />
          </mesh>
        )}
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.22, 0.5, 10]} />
          <meshStandardMaterial color={ghost ? "#ff9a3c" : pt.color} transparent={ghost} opacity={ghost ? 0.35 : 1} roughness={0.7} metalness={pt.name === "Gold" || pt.name === "Copper" ? 0.6 : 0.05} />
        </mesh>
        {!ghost && (
          <>
            <mesh position={[0, 0.72, 0]}>
              <cylinderGeometry args={[0.035, 0.045, 0.5, 5]} />
              <meshStandardMaterial color="#3d5a2a" />
            </mesh>
            <mesh position={[0, 1.04, 0]} castShadow>
              <icosahedronGeometry args={[0.26, 0]} />
              <meshStandardMaterial color={fl.color} emissive={fl.color} emissiveIntensity={0.45} flatShading />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
}

export default function GardenStage() {
  const status = useGardenChallenge((s) => s.status);
  const round = useGardenChallenge((s) => s.currentRound());
  const phase = useGardenChallenge((s) => s.phase);
  const planted = useGardenChallenge((s) => s.planted);
  const claim = useGardenChallenge((s) => s.claimResult);
  if (!round || status === "intro" || status === "done") return null;
  const L = layout(round);
  const celebrate = status === "celebrate";
  const showP = !round.inverse || phase !== "predict";
  const leftX = -L.total / 2 - 1.3;
  const topZ = CZ - ((round.f - 1) / 2) * L.sp - 1.25;
  return (
    <group>
      {/* Bed of dark ash soil under the whole garden. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, CZ]} receiveShadow>
        <planeGeometry args={[L.total + 4.2, round.f * L.sp + 3.2]} />
        <meshStandardMaterial color="#2a1f1c" roughness={1} />
      </mesh>
      {/* The flowers (one per row) and the pots (one per column) on offer. */}
      {GARDEN_FLOWERS.slice(0, round.f).map((fl, i) => (
        <group key={fl.name} position={[leftX, 0, CZ + (i - (round.f - 1) / 2) * L.sp]}>
          <mesh position={[0, 0.5, 0]}>
            <icosahedronGeometry args={[0.24, 0]} />
            <meshStandardMaterial color={fl.color} emissive={fl.color} emissiveIntensity={0.5} flatShading />
          </mesh>
        </group>
      ))}
      {showP && Array.from({ length: round.g }, (_, g) => GARDEN_POTS.slice(0, round.p).map((pt, j) => {
        const [x] = L.cell(0, j, g);
        return (
          <mesh key={`${g}-${pt.name}`} position={[x, 0.2, topZ]}>
            <cylinderGeometry args={[0.2, 0.14, 0.32, 8]} />
            <meshStandardMaterial color={pt.color} roughness={0.7} />
          </mesh>
        );
      }))}
      {round.g > 1 && Array.from({ length: round.g }, (_, g) => (
        <Chip key={g} position={[L.gx(g), 0.4, topZ - 0.9]} df={12} className="fc-count-chip">
          {GARDEN_GLOWS[g].name}
        </Chip>
      ))}
      {planted.map((k) => {
        const [fi, pi, gi] = k.split("-").map(Number);
        return <Plant key={k} fi={fi} pi={pi} gi={gi} pos={L.cell(fi, pi, gi)} sp={L.sp} celebrate={celebrate} glow={round.g > 1} />;
      })}
      {status === "feedback" && claim && claim.missing.map((k) => {
        const [fi, pi, gi] = k.split("-").map(Number);
        return <Plant key={`m${k}`} fi={fi} pi={pi} gi={gi} pos={L.cell(fi, pi, gi)} sp={L.sp} ghost glow={round.g > 1} />;
      })}
      <Chip position={[0, 2.2, topZ - 0.6]} df={10} className={`fc-count-chip${celebrate ? " good" : ""}`}>
        {phase === "predict"
          ? round.inverse ? `${round.total} combos · ${round.f} flowers` : `${round.f} flowers · ${round.p} pots${round.g > 1 ? ` · ${round.g} glows` : ""}`
          : `${planted.length} planted${status === "celebrate" || status === "feedback" ? ` · ${round.f} × ${round.p}${round.g > 1 ? ` × ${round.g}` : ""} = ${round.total}` : ""}`}
      </Chip>
      {celebrate && <ConfettiBurst origin={[0, 0.5, CZ]} />}
    </group>
  );
}
