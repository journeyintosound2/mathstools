import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { useMapChallenge } from "../stores/mapStore.js";
import LadderSet, { useLadderRound, useSetScale, shownLadders } from "./LadderSet.jsx";
import { LX0, LX1, LADDER_Z, xOf } from "./VineLadder.jsx";
import { Chip } from "../../magma/stages/StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";
import { vineChip } from "../../../data/jungle/vineLadder.js";

/**
 * TREASURE MAP — the vine ladder as the map AND the trail: the top vine runs
 * along a strip of the old parchment map (map centimetres, a dotted route,
 * the explorer's camp at 0), the bottom vine IS the real trail in real
 * metres. When the student reaches the route's length, the explorer walks
 * the trail vine like a tightrope and digs up the chest right under the X.
 * A wrong distance sends the explorer to dig where the student said —
 * nothing there. The Canopy Lookout deck stands behind with the valley
 * beyond.
 */

const YS = [2.75, 1.35];
const W = LX1 - LX0;

function Parchment({ y }) {
  return (
    <group>
      <mesh position={[(LX0 + LX1) / 2, y, LADDER_Z - 0.12]}>
        <planeGeometry args={[W + 0.4, 0.62]} />
        <meshStandardMaterial color="#f1dfb0" roughness={0.95} side={2} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s < 0 ? LX0 - 0.25 : LX1 + 0.25, y, LADDER_Z - 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.7, 10]} />
          <meshStandardMaterial color="#c9a46a" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Dashes of the dotted route, from camp (0) to the X, scaled with the vine. */
function Route({ toTop, scaleRef, y }) {
  const ref = useRef();
  const N = 26;
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    g.children.forEach((m, i) => {
      const t = (toTop * (i + 0.5)) / N;
      m.position.x = xOf(t, scaleRef.current);
      m.visible = toTop > 0;
    });
  });
  return (
    <group ref={ref}>
      {Array.from({ length: N }, (_, i) => (
        <mesh key={i} position={[0, y - 0.18, LADDER_Z - 0.09]}>
          <boxGeometry args={[0.14, 0.04, 0.01]} />
          <meshStandardMaterial color="#8a2c1d" />
        </mesh>
      ))}
    </group>
  );
}

function Explorer({ toX, go, digging }) {
  const ref = useRef();
  const t0 = useRef(null);
  const key = useRef(go);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    if (key.current !== go) { key.current = go; t0.current = null; }
    if (go && t0.current === null) t0.current = clock.elapsedTime;
    const el = go && t0.current !== null ? clock.elapsedTime - t0.current : 0;
    const f = Math.min(1, el / 2.4);
    g.position.x = LX0 + 0.1 + (toX - LX0 - 0.1) * f;
    g.position.y = YS[1] + 0.06 + (f > 0 && f < 1 ? Math.abs(Math.sin(el * 8)) * 0.06 : 0);
    g.rotation.z = f > 0 && f < 1 ? Math.sin(el * 8) * 0.12 : digging && f >= 1 ? Math.sin(el * 14) * 0.25 : 0;
  });
  return (
    <group ref={ref} position={[LX0 + 0.1, YS[1] + 0.06, LADDER_Z + 0.05]}>
      <mesh position={[0, 0.42, 0]}><capsuleGeometry args={[0.15, 0.4, 4, 8]} /><meshStandardMaterial color="#3d6b4f" /></mesh>
      <mesh position={[0, 0.86, 0]}><sphereGeometry args={[0.14, 12, 10]} /><meshStandardMaterial color="#e8c39e" /></mesh>
      <mesh position={[0, 0.98, 0]}><cylinderGeometry args={[0.24, 0.24, 0.04, 14]} /><meshStandardMaterial color="#c2a36b" /></mesh>
      <mesh position={[0, 1.04, 0]}><cylinderGeometry args={[0.12, 0.14, 0.12, 12]} /><meshStandardMaterial color="#c2a36b" /></mesh>
      <mesh position={[0.22, 0.45, 0.05]} rotation={[0, 0, -0.5]}><cylinderGeometry args={[0.02, 0.02, 0.7, 5]} /><meshStandardMaterial color="#6b4423" /></mesh>
    </group>
  );
}

function Chest({ x, open }) {
  const lid = useRef();
  useFrame((_, dt) => {
    if (lid.current) lid.current.rotation.x += ((open ? -1.1 : 0) - lid.current.rotation.x) * (1 - Math.exp(-6 * dt));
  });
  return (
    <group position={[x, YS[1] + 0.07, LADDER_Z + 0.35]}>
      <mesh position={[0, 0.17, 0]}><boxGeometry args={[0.5, 0.32, 0.34]} /><meshStandardMaterial color="#8a5a32" /></mesh>
      <group ref={lid} position={[0, 0.33, -0.17]}>
        <mesh position={[0, 0.06, 0.17]}><boxGeometry args={[0.52, 0.12, 0.36]} /><meshStandardMaterial color="#9c6b3c" /></mesh>
      </group>
      <mesh position={[0, 0.34, 0]}><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color="#ffd166" emissive="#ffb000" emissiveIntensity={open ? 1.2 : 0} /></mesh>
    </group>
  );
}

export default function MapStage({ labels = true }) {
  const S = useLadderRound(useMapChallenge);
  const { running, round, ended, status, trial, last, phase } = S;
  const sc = useSetScale(S, shownLadders(S), 60);
  const go = ended ? (last ? last.at : 1) : 0;
  const hidden = running && round.phases[phase] && round.phases[phase].hideLadder;

  // The X: the route's end on the map vine (the goal's TOP value).
  const L = running ? round.ladders[0].L : null;
  const goalTops = running ? (round.goals2 ? round.goals2.map((g) => g[0]) : round.goal ? [round.goal[0]] : []) : [];
  const finalTop = goalTops.length ? Math.max(...goalTops) : 0;
  const X = (t) => xOf(t, sc.endTop);

  // Where the explorer digs.
  let digTop = null, digGo = 0, found = false, note = null;
  if (running && trial && !ended) {
    digTop = round.drive === "top" ? (trial.typed * L.a) / L.b : trial.typed;
    digGo = trial.at;
    note = "🕳️ Nothing here!";
  } else if (running && ended) {
    digTop = finalTop;
    digGo = go;
    found = status === "celebrate" || status === "feedback";
  }

  return (
    <group>
      <Parchment y={YS[0]} />
      {running && !hidden && <Route toTop={finalTop} scaleRef={sc.scaleRef} y={YS[0]} />}
      <LadderSet
        S={S}
        ys={YS}
        labels={labels}
        scale={sc}
        hideRungs={hidden}
        idleL={{ top: { kind: "num", unit: "cm", dp: 1, icon: "🗺️", one: "map cm", many: "map cm" }, bottom: { kind: "num", unit: "m", dp: 0, icon: "🥾", one: "real metre", many: "real metres" }, a: 10, b: 20 }}
        idleNames={["🗺️ map cm", "🥾 real m"]}
        names={() => ["🗺️ map cm", "🥾 real m"]}
      />
      {/* The X on the map. */}
      {running && !hidden && finalTop > 0 && (
        <group position={[X(finalTop), YS[0] - 0.02, LADDER_Z - 0.05]}>
          {[1, -1].map((s) => (
            <mesh key={s} rotation={[0, 0, s * 0.785]}><boxGeometry args={[0.36, 0.06, 0.02]} /><meshStandardMaterial color="#c0392b" /></mesh>
          ))}
        </group>
      )}
      {labels && running && <Chip position={[LX1 - 0.9, YS[1] - 1.05, LADDER_Z + 0.3]} df={9} className="jungle-sign-dark">📜 {round.scale}</Chip>}
      {/* The camp at zero + the explorer on the trail vine. */}
      <mesh position={[LX0 - 0.15, YS[1] + 0.25, LADDER_Z - 0.35]}><coneGeometry args={[0.35, 0.55, 4]} /><meshStandardMaterial color="#d9a441" flatShading /></mesh>
      <Explorer key={`e${digGo}`} toX={digTop !== null ? X(digTop) : LX0 + 0.1} go={digGo} digging={digTop !== null} />
      {running && digTop !== null && found && <Chest x={X(digTop)} open />}
      {labels && note && digTop !== null && <Chip position={[X(digTop), YS[1] + 1.55, LADDER_Z + 0.2]} df={8} className="jungle-cell bad">{note} {vineChip(L.bottom, round.drive === "top" ? trial.typed : Math.round((trial.typed * L.b) / L.a))}</Chip>}
      {status === "celebrate" && <ConfettiBurst origin={[X(finalTop), YS[1] + 0.6, LADDER_Z + 0.6]} />}
    </group>
  );
}
