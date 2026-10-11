import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { useTapeChallenge } from "../stores/tapeStore.js";
import LadderSet, { useLadderRound, useSetScale, shownLadders } from "./LadderSet.jsx";
import { LX0, LX1 } from "./VineLadder.jsx";
import { Monkey } from "./JungleProps.jsx";
import { Chip } from "../../magma/stages/StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";
import { vineShort } from "../../../data/jungle/jungleUnits.js";

/**
 * TALL TREE TAPE — the vine ladder stood on end as a MEASURING TAPE hanging
 * from a bamboo gantry under the Great Tree: zero at the bottom (the tape's
 * case), one unit up the left edge, the other up the right. Rungs are
 * horizontal; their numbers sit beside the edges. When the target is
 * reached a monkey climbs the tape to that height; a wrong number sends it
 * to where that number really is on the tape (it's at a different height on
 * the other edge — the consequence is the feedback).
 *
 * Drawn with the SAME VineLadder, turned a quarter (local x → up) and
 * scaled: the tape runs from BASE to BASE + LEN metres.
 */

const BASE = 1.9;
const LEN = 5.4;
const S = LEN / (LX1 - LX0);
const GX = 0;
const GY = BASE - LX0 * S;
const YS = [1.09, -1.09]; // local → world x = ∓0.56
const YS3 = [1.75, 0, -1.75];
const W = LX1 - LX0;
const heightOf = (t, scale) => BASE + (t / Math.max(1e-6, scale)) * W * S;

function Gantry() {
  return (
    <group>
      {[-2.4, 2.4].map((x) => (
        <mesh key={x} position={[x, 4.0, -0.35]} castShadow>
          <cylinderGeometry args={[0.13, 0.16, 8.0, 9]} />
          <meshStandardMaterial color="#c9b458" roughness={0.6} />
        </mesh>
      ))}
      {[1.6, 3.4, 5.2, 7.0].map((y) => (
        <mesh key={y} position={[-2.4, y, -0.35]}>
          <cylinderGeometry args={[0.17, 0.17, 0.06, 9]} />
          <meshStandardMaterial color="#9c8738" />
        </mesh>
      ))}
      <mesh position={[0, 7.85, -0.35]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 5.4, 9]} />
        <meshStandardMaterial color="#c9b458" roughness={0.6} />
      </mesh>
      {[-0.56, 0.56].map((x) => (
        <mesh key={x} position={[x, 7.55, -0.3]}>
          <cylinderGeometry args={[0.02, 0.02, 0.6, 5]} />
          <meshStandardMaterial color="#c8a46a" />
        </mesh>
      ))}
    </group>
  );
}

/** The yellow tape between the two edge vines, its case at zero. */
function TapeBand({ wide }) {
  const w = wide ? 1.9 : 1.12;
  return (
    <group>
      <mesh position={[GX, BASE + LEN / 2, -0.32]}>
        <planeGeometry args={[w, LEN]} />
        <meshStandardMaterial color="#f6d860" emissive="#d9b520" emissiveIntensity={0.35} roughness={0.7} side={2} />
      </mesh>
      {Array.from({ length: 28 }, (_, i) => (
        <mesh key={i} position={[GX - w / 2 + 0.06, BASE + (i + 1) * (LEN / 28), -0.31]}>
          <boxGeometry args={[i % 4 === 3 ? 0.18 : 0.09, 0.012, 0.005]} />
          <meshStandardMaterial color="#5b4a22" />
        </mesh>
      ))}
      <mesh position={[GX, BASE - 0.32, -0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.3, 20]} />
        <meshStandardMaterial color="#e5484d" roughness={0.5} />
      </mesh>
      <mesh position={[GX, BASE - 0.32, -0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.04, 14]} />
        <meshStandardMaterial color="#f4f1de" />
      </mesh>
    </group>
  );
}

/** A monkey that climbs to height y when `go` changes. */
function Climber({ y, go, x = GX + 0.05 }) {
  const ref = useRef();
  const t0 = useRef(null);
  const key = useRef(go);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    if (key.current !== go) { key.current = go; t0.current = null; }
    if (go && t0.current === null) t0.current = clock.elapsedTime;
    const f = go && t0.current !== null ? Math.min(1, (clock.elapsedTime - t0.current) / 2.2) : 0;
    const e = f < 1 ? f * f * (3 - 2 * f) : 1;
    g.position.y = 0.0 + (y - 0.45) * e;
    g.position.x = x + (f > 0 && f < 1 ? Math.sin(clock.elapsedTime * 10) * 0.05 : 0);
  });
  return (
    <group ref={ref} position={[x, 0, 0.05]}>
      <Monkey position={[0, 0, 0]} rotation={0} />
    </group>
  );
}

const NAME_STYLE = {};

export default function TapeStage({ labels = true }) {
  const St = useLadderRound(useTapeChallenge);
  const { running, round, ended, status, trial, last } = St;
  const across = useTapeChallenge((s) => s.across);
  const scale = useSetScale(St, shownLadders(St), 4);
  const shared = running && round.layout === "shared";
  const go = ended ? (last ? last.at : 1) : 0;

  const goal = running && round.goal ? round.goal : null;
  // Where the monkey climbs: the target's height, or (after a wrong number on
  // the target rung) where that number really sits on its edge.
  let climbTop = null, climbGo = 0, climbNote = null;
  if (running && trial && !ended && !shared) {
    const L = round.ladders[0].L;
    const typedTop = round.drive === "top" ? (trial.typed * L.a) / L.b : trial.typed;
    climbTop = typedTop;
    climbGo = trial.at;
    climbNote = "↑ that number is up here";
  } else if (running && ended && goal) {
    climbTop = goal[0];
    climbGo = go;
  } else if (running && ended && shared) {
    climbTop = round.phases[0].goals[0].target; // the shared (middle) vine leads
    climbGo = go;
  }

  return (
    <group>
      <Gantry />
      <TapeBand wide={shared} />
      <group position={[GX, GY, 0]} rotation={[0, 0, Math.PI / 2]} scale={S}>
        <LadderSet
          S={St}
          ys={YS}
          ys3={YS3}
          labels={labels}
          posts={false}
          chipGap={1.35}
          midGap={0.0}
          scale={scale}
          idleL={{ top: { kind: "num", unit: "m", dp: 2, icon: "📏", one: "metre", many: "metres" }, bottom: { kind: "num", unit: "cm", dp: 0, icon: "📏", one: "centimetre", many: "centimetres" }, a: 100, b: 100 }}
          idleNames={["m", "cm"]}
          names={(r, li) => [vineShort(r.ladders[li].L.top), vineShort(r.ladders[li].L.bottom)]}
          sharedNames={(r) => [vineShort(r.ladders[0].L.bottom), vineShort(r.ladders[0].L.top), vineShort(r.ladders[1].L.bottom)]}
          nameStyle={NAME_STYLE}
          // Edge names beside the foot of the tape (out to the sides, level
          // with the zero) so the bottom-docked card never covers them.
          nameAt={(i) => (shared ? (i === 1 ? [LX0 - 1.2, 0, 0.2] : [LX0 - 0.45, YS3[i] * 2.0, 0.2]) : [LX0 - 0.45, YS[i] * 2.9, 0.2])}
          startTicks={false}
        />
      </group>
      {labels && running && across && round.acrossK && (
        <Chip position={[GX, BASE + LEN + 0.45, 0]} df={8} className="jungle-target">↔ × {round.acrossK} on every rung</Chip>
      )}
      {climbTop !== null && (
        <group key={`c${climbGo}`}>
          <Climber y={heightOf(climbTop, scale.scaleRef.current || scale.endTop)} go={climbGo} />
          {labels && climbNote && <Chip position={[GX + 1.3, heightOf(climbTop, scale.endTop), 0.3]} df={8} className="jungle-cell bad">{climbNote}</Chip>}
        </group>
      )}
      {climbTop === null && <Climber y={0.45} go={0} />}
      {status === "celebrate" && <ConfettiBurst origin={[0, BASE + 1.5, 0.6]} />}
    </group>
  );
}
