import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { usePotionChallenge } from "../stores/potionStore.js";
import LadderSet, { useLadderRound } from "./LadderSet.jsx";
import { LADDER_Z } from "./VineLadder.jsx";
import { Chip } from "../../magma/stages/StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";
import { potionHex, blueShare } from "../../../data/jungle/potionChallenge.js";
import { partnerOf } from "../../../data/jungle/vineLadder.js";

/**
 * MUSHROOM POTIONS — the vine ladder (🔵 moonberry ↔ 🟡 sunfruit scoops) in
 * front of Ms. Brookes' bubbling cauldron, with the recipe's colour in a
 * glass vial beside it and a "too blue · just right · too yellow" meter (so
 * colour is never the only cue). A finished round pours: the cauldron takes
 * the colour of what was poured and the glade's mushrooms glow. Fern's batch
 * (S2) and the two potions (S3) pour into a second, smaller cauldron so the
 * colours sit side by side. A wrong amount on a target rung pours the wrong
 * colour — the meter says which way it's off.
 */

const YS = [2.75, 1.35];
const YS3 = [2.85, 2.0, 1.15];
const POT = { x: 4.3, z: -3.0 };

function Cauldron({ position, color, scale = 1, go, label, bad = false }) {
  const liquid = useRef();
  const vapour = useRef();
  const bubbles = useRef();
  const target = useMemo(() => new THREE.Color(color || "#3b3b3b"), [color]);
  useFrame(({ clock }, dt) => {
    if (liquid.current) {
      liquid.current.material.color.lerp(target, 1 - Math.exp(-3 * dt));
      liquid.current.material.emissive.copy(liquid.current.material.color).multiplyScalar(0.45);
    }
    if (vapour.current) vapour.current.position.y = 1.55 + Math.sin(clock.elapsedTime * 1.5) * 0.05;
    if (bubbles.current) {
      bubbles.current.children.forEach((b, i) => {
        const t = (clock.elapsedTime * 0.8 + i * 0.37) % 1;
        b.position.y = 0.92 + t * 0.35;
        b.scale.setScalar(go ? 1 - t : 0.0001);
      });
    }
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.75, 20, 14, 0, Math.PI * 2, Math.PI * 0.18, Math.PI * 0.82]} />
        <meshStandardMaterial color="#2b2b2e" roughness={0.6} metalness={0.3} side={2} />
      </mesh>
      <mesh position={[0, 0.98, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.62, 0.06, 8, 24]} />
        <meshStandardMaterial color="#3a3a3e" metalness={0.4} />
      </mesh>
      {/* The brew: a bulging, glowing surface (seen from the side) + vapour. */}
      <mesh ref={liquid} position={[0, 0.98, 0]} scale={[1, 0.42, 1]}>
        <sphereGeometry args={[0.6, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3b3b3b" emissive="#111" roughness={0.3} />
      </mesh>
      <mesh ref={vapour} position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.18, 0.5, 0.9, 14, 1, true]} />
        <meshStandardMaterial color={color || "#888"} emissive={color || "#000"} emissiveIntensity={0.6} transparent opacity={color ? 0.32 : 0} depthWrite={false} side={2} />
      </mesh>
      <group ref={bubbles}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[Math.cos(i * 2.1) * 0.3, 0.95, Math.sin(i * 2.1) * 0.3]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshStandardMaterial color={color || "#888"} transparent opacity={0.7} emissive={color || "#000"} emissiveIntensity={0.4} />
          </mesh>
        ))}
      </group>
      {/* Fire under the pot. */}
      {[-1, 0, 1].map((k) => (
        <mesh key={k} position={[k * 0.25, 0.08, 0]} rotation={[0, k, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.6, 6]} />
          <meshStandardMaterial color="#5a3a1e" />
        </mesh>
      ))}
      <mesh position={[0, 0.18, 0]}>
        <coneGeometry args={[0.25, 0.4, 7]} />
        <meshStandardMaterial color="#ff8c2b" emissive="#ff6a00" emissiveIntensity={0.9} />
      </mesh>
      {label && <Chip position={[0, 1.75, 0.2]} df={8} className={`jungle-cell${bad ? " bad" : ""}`}>{label}</Chip>}
    </group>
  );
}

function Vial({ position, color }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.12, 0.14, 0.5, 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.85} /></mesh>
      <mesh position={[0, 0.82, 0]}><cylinderGeometry args={[0.05, 0.06, 0.18, 8]} /><meshStandardMaterial color="#d8f3ff" transparent opacity={0.6} /></mesh>
      <mesh position={[0, 0.93, 0]}><cylinderGeometry args={[0.065, 0.065, 0.06, 8]} /><meshStandardMaterial color="#8a5a32" /></mesh>
    </group>
  );
}

/** Blue-to-yellow meter (vertical): ▶ the recipe, ● the pour. */
function Meter({ position, target, now, labels }) {
  const H = 1.5;
  const y = (p) => (p - 0.5) * H; // blue (p = 1) at the top
  return (
    <group position={position}>
      <mesh position={[0, 0, -0.06]}><boxGeometry args={[0.42, H + 0.2, 0.06]} /><meshStandardMaterial color="#54361c" /></mesh>
      <mesh position={[0, -H / 2 - 0.8, -0.06]}><cylinderGeometry args={[0.05, 0.06, 1.4, 6]} /><meshStandardMaterial color="#54361c" /></mesh>
      {Array.from({ length: 20 }, (_, i) => {
        const p = (i + 0.5) / 20;
        return (
          <mesh key={i} position={[0, y(p), 0]}>
            <boxGeometry args={[0.26, H / 20 + 0.004, 0.05]} />
            <meshStandardMaterial color={potionHex({ b: p, y: 1 - p })} emissive={potionHex({ b: p, y: 1 - p })} emissiveIntensity={0.35} />
          </mesh>
        );
      })}
      {target !== null && (
        <mesh position={[-0.24, y(target), 0.03]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.07, 0.15, 3]} /><meshStandardMaterial color="#ffffff" /></mesh>
      )}
      {now !== null && (
        <mesh position={[0.22, y(now), 0.05]}><sphereGeometry args={[0.07, 10, 8]} /><meshStandardMaterial color="#222" /></mesh>
      )}
      {labels && <Chip position={[0, H / 2 + 0.3, 0.1]} df={9} className="jungle-cell small">too blue</Chip>}
      {labels && <Chip position={[0, -H / 2 - 0.3, 0.1]} df={9} className="jungle-cell small">too yellow</Chip>}
    </group>
  );
}

/** Glowing mushrooms round the glade — they light up for a perfect pour. */
function Mushrooms({ glow }) {
  const g = useRef();
  useFrame(({ clock }) => {
    if (!g.current) return;
    g.current.children.forEach((m, i) => {
      const cap = m.children[1];
      if (cap) cap.material.emissiveIntensity = glow ? 0.9 + Math.sin(clock.elapsedTime * 4 + i) * 0.3 : 0.12;
    });
  });
  const spots = [[-5.8, -2.4, 0.9], [-4.9, -3.6, 0.7], [7.0, -1.6, 0.8], [6.6, -4.6, 1.1], [-6.6, -0.9, 0.6], [2.0, -4.9, 0.7]];
  return (
    <group ref={g}>
      {spots.map(([x, z, s], i) => (
        <group key={i} position={[x, 0, z]} scale={s}>
          <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.1, 0.13, 0.6, 8]} /><meshStandardMaterial color="#f2e8cf" /></mesh>
          <mesh position={[0, 0.65, 0]}><sphereGeometry args={[0.38, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={i % 2 ? "#9b5de5" : "#00bbf9"} emissive={i % 2 ? "#9b5de5" : "#00bbf9"} emissiveIntensity={0.12} /></mesh>
        </group>
      ))}
    </group>
  );
}

const NAMES = { "🔵": "🔵 blue", "🟡": "🟡 yellow", "🔴": "🔴 red", "🧪": "🧪 in all" };
const nm = (v) => NAMES[v.icon] || v.many;

export default function PotionStage({ labels = true }) {
  const S = useLadderRound(usePotionChallenge);
  const { running, round, ended, status, phase, trial, last, called } = S;
  const go = ended ? (last ? last.at : 1) : 0;

  const view = useMemo(() => {
    if (!running) return { main: null, second: null, target: 0.4, now: null };
    const r = round;
    const recipe = r.recipe ? { b: r.recipe[0], y: r.recipe[1] } : r.recipes ? null : r.recipe3 ? { b: r.recipe3[0], y: r.recipe3[1], e: r.recipe3[2] } : null;
    const target = recipe ? blueShare(recipe) : null;
    let main = null, second = null, now = null, bad = false, mainLabel = null, secondLabel = null;
    if (r.kind === "same" && phase >= 1) {
      second = r.pour[0]; secondLabel = `Fern: ${r.fern[0]} 🔵 : ${r.fern[1]} 🟡`;
    }
    if (r.kind === "compare" && (phase >= 1 || ended)) {
      main = r.pour[0]; second = r.pour[1]; mainLabel = "Potion A"; secondLabel = "Potion B";
      now = null;
    }
    if (ended && r.kind !== "compare") {
      main = r.pour[r.pour.length - 1];
      now = blueShare(main);
      mainLabel = `${main.b} 🔵 : ${main.y} 🟡${main.e ? ` : ${main.e} 🔴` : ""}`;
    }
    if (trial && !ended && r.layout === "single") {
      // A wrong amount on the target rung pours the wrong colour.
      const L = r.ladders[0].L;
      const top = r.drive === "top" ? trial.value : trial.typed;
      const bot = r.drive === "top" ? trial.typed : trial.value;
      main = { b: top, y: bot };
      now = blueShare(main);
      bad = true;
      mainLabel = now > (target ?? 0.5) + 0.01 ? "Too blue!" : "Too yellow!";
      void L;
    }
    return { main, second, target, now, bad, mainLabel, secondLabel, recipe };
  }, [running, round, ended, phase, trial]);

  const recipeHex = view.recipe ? potionHex(view.recipe) : "#5aa05a";
  return (
    <group>
      <LadderSet
        S={S}
        ys={YS}
        ys3={YS3}
        labels={labels}
        idleL={{ top: { kind: "count", icon: "🔵", one: "blue scoop", many: "blue scoops" }, bottom: { kind: "count", icon: "🟡", one: "yellow scoop", many: "yellow scoops" }, a: 2, b: 3 }}
        idleNames={["🔵 blue", "🟡 yellow"]}
        names={(r, li) => [nm(r.ladders[li].L.top), nm(r.ladders[li].L.bottom)]}
        sharedNames={(r) => (r.kind === "compare"
          ? ["A 🟡", "🔵 blue", "B 🟡"]
          : [nm(r.ladders[0].L.bottom), nm(r.ladders[0].L.top), nm(r.ladders[1].L.bottom)])}
      />

      {/* The potion table: the cauldron, the recipe vial, the meter, the jars. */}
      <mesh position={[POT.x + 0.2, 0.05, POT.z]} receiveShadow><cylinderGeometry args={[1.9, 2.0, 0.1, 24]} /><meshStandardMaterial color="#6b5a3c" roughness={0.95} /></mesh>
      <Cauldron position={[POT.x, 0.1, POT.z]} color={view.main ? potionHex(view.main) : null} go={go || (trial ? trial.at : 0)} label={labels ? view.mainLabel : null} bad={view.bad} />
      {view.second && (
        <Cauldron position={[POT.x - 2.0, 0.1, POT.z + 0.3]} scale={0.75} color={potionHex(view.second)} go={1} label={labels ? view.secondLabel : null} />
      )}
      {view.recipe && <Vial position={[POT.x + 1.3, 0.1, POT.z + 0.5]} color={recipeHex} />}
      {running && view.recipe && labels && <Chip position={[POT.x + 1.3, 1.35, POT.z + 0.6]} df={9} className="jungle-cell small">recipe</Chip>}
      {running && view.target !== null && (
        <Meter position={[POT.x + 2.25, 1.75, POT.z + 0.9]} target={view.target} now={view.now} labels={labels} />
      )}
      {[[POT.x + 1.7, "#2f6bff"], [POT.x + 2.0, "#ffd23f"], [POT.x + 1.85, "#ff4b3e"]].map(([x, c], i) => (
        <group key={i} position={[x, 0.1, POT.z - 0.7 + i * 0.35]}>
          <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.13, 0.13, 0.5, 10]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.35} transparent opacity={0.85} /></mesh>
        </group>
      ))}
      <Mushrooms glow={status === "celebrate"} />

      {running && ended && round.kind === "compare" && called !== null && (
        <Chip position={[0.6, YS3[0] + 1.0, LADDER_Z]} df={9} className={`fc-count-chip${called === round.better ? " good" : ""}`}>
          {`🧪 ${round.ladders[round.better].name} is bluer`}
        </Chip>
      )}
      {status === "celebrate" && <ConfettiBurst origin={[POT.x - 1, 1.5, POT.z + 1]} />}
    </group>
  );
}

export { partnerOf };
