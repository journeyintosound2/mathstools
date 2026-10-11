import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { useRaceChallenge } from "../stores/raceStore.js";
import LadderSet, { useLadderRound, niceEnd } from "./LadderSet.jsx";
import { LX0, LX1, LADDER_Z } from "./VineLadder.jsx";
import { Chip } from "../../magma/stages/StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";
import { rungFor, vineChip, fmtVal } from "../../../data/jungle/vineLadder.js";
import { vineShort } from "../../../data/jungle/jungleUnits.js";

/**
 * LAGOON RACE — the vine ladder (seconds ↔ metres) above a little racing
 * pool cut into the lagoon shore: two lanes in front of the ladder, marked
 * every few metres, the racers waiting on the start line at ZERO (the same
 * end as the ladder's zero post). When a round is answered the racers swim
 * it — how far in the time, how long to the bank, who is faster. A wrong
 * distance for the 🎯 time plants a red flag where the student said, and the
 * racer swims past it (or stops short) — the consequence is the feedback.
 */

const YS = [2.85, 1.6];
const YS3 = [3.05, 2.25, 1.45];
const W = LX1 - LX0;
const LANE_Z = [1.2, 2.2];
const LANE_W = 0.85;
const SWIM_SECONDS = 3.2;

function Water({ x0, x1, z, w }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.emissiveIntensity = 0.12 + Math.sin(clock.elapsedTime * 1.6 + z) * 0.04;
  });
  return (
    <group>
      <mesh ref={ref} position={[(x0 + x1) / 2, 0.07, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[x1 - x0, w]} />
        <meshStandardMaterial color="#3f9fb8" emissive="#1d6f86" emissiveIntensity={0.12} roughness={0.25} metalness={0.1} />
      </mesh>
      {/* Mossy stone kerb round the lane. */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(x0 + x1) / 2, 0.09, z + (s * (w + 0.12)) / 2]}>
          <boxGeometry args={[x1 - x0 + 0.2, 0.1, 0.12]} />
          <meshStandardMaterial color="#6f7d5a" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Floats({ x0, x1, z }) {
  const n = Math.round((x1 - x0) / 0.35);
  return (
    <group>
      {Array.from({ length: n + 1 }, (_, i) => (
        <mesh key={i} position={[x0 + (i * (x1 - x0)) / n, 0.13, z]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshStandardMaterial color={i % 2 ? "#ffffff" : "#e5484d"} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** A little racer (frog, turtle, duck or kayak). */
function RacerBody({ id }) {
  if (id === "frog") {
    return (
      <group>
        <mesh position={[0, 0.16, 0]} scale={[1.2, 0.7, 1]}><sphereGeometry args={[0.2, 12, 10]} /><meshStandardMaterial color="#4caf50" roughness={0.6} /></mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[0.1, 0.3, s * 0.1]}><sphereGeometry args={[0.07, 8, 6]} /><meshStandardMaterial color="#e8f5e9" /></mesh>
            <mesh position={[0.15, 0.31, s * 0.1]}><sphereGeometry args={[0.035, 6, 5]} /><meshStandardMaterial color="#111" /></mesh>
          </group>
        ))}
      </group>
    );
  }
  if (id === "turtle") {
    return (
      <group>
        <mesh position={[0, 0.14, 0]} scale={[1.3, 0.55, 1.1]}><sphereGeometry args={[0.2, 12, 8]} /><meshStandardMaterial color="#6d8b3a" roughness={0.8} flatShading /></mesh>
        <mesh position={[0.27, 0.12, 0]}><sphereGeometry args={[0.08, 8, 6]} /><meshStandardMaterial color="#9ccc65" /></mesh>
      </group>
    );
  }
  if (id === "duck") {
    return (
      <group>
        <mesh position={[0, 0.16, 0]} scale={[1.3, 0.75, 0.9]}><sphereGeometry args={[0.18, 12, 10]} /><meshStandardMaterial color="#ffd43b" roughness={0.55} /></mesh>
        <mesh position={[0.14, 0.34, 0]}><sphereGeometry args={[0.11, 10, 8]} /><meshStandardMaterial color="#ffd43b" /></mesh>
        <mesh position={[0.26, 0.33, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.04, 0.1, 6]} /><meshStandardMaterial color="#ff8c2b" /></mesh>
      </group>
    );
  }
  return (
    <group>
      <mesh position={[0, 0.12, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.35, 1, 0.45]}><capsuleGeometry args={[0.18, 0.7, 4, 8]} /><meshStandardMaterial color="#e76f51" roughness={0.5} /></mesh>
      <mesh position={[0, 0.3, 0]}><sphereGeometry args={[0.1, 8, 6]} /><meshStandardMaterial color="#f4d35e" /></mesh>
    </group>
  );
}

/** Swims from 0 to `to` (lane units) over `dur` seconds, starting when `go` changes. */
function Racer({ id, z, toX, dur, go, label }) {
  const ref = useRef();
  const t0 = useRef(null);
  const goKey = useRef(go);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    if (goKey.current !== go) { goKey.current = go; t0.current = null; }
    if (go && t0.current === null) t0.current = clock.elapsedTime;
    const f = go && t0.current !== null ? Math.min(1, (clock.elapsedTime - t0.current) / Math.max(0.3, dur)) : 0;
    g.position.x = LX0 + 0.05 + (toX - LX0 - 0.05) * f;
    g.position.y = f > 0 && f < 1 ? Math.abs(Math.sin(clock.elapsedTime * 9)) * 0.05 : 0;
    g.rotation.z = f > 0 && f < 1 ? Math.sin(clock.elapsedTime * 9) * 0.06 : 0;
  });
  return (
    <group ref={ref} position={[LX0 + 0.05, 0, z]}>
      <RacerBody id={id} />
      {label && <Chip position={[0, 0.75, 0]} df={8} className="jungle-cell small">{label}</Chip>}
    </group>
  );
}

export default function RaceStage({ labels = true }) {
  const S = useLadderRound(useRaceChallenge);
  const { running, round, ended, status, common, trial, called, last } = S;

  // What the lanes show: who swims, how far, for how long (race seconds).
  const race = useMemo(() => {
    if (!running) return null;
    const r = round;
    const isKayak = r.racers[0].id === "kayak";
    if (r.layout === "single") {
      const L = r.ladders[0].L;
      const dist = r.goal[1];
      return { unit: L.bottom, lanes: [{ id: r.racers[0].id, icon: r.racers[0].icon, d: dist, time: r.goal[0] }], max: niceEnd(dist), kayak: isKayak };
    }
    if (r.race.kind === "common") {
      const t = common ?? r.phases[0].planAt;
      const ds = r.ladders.map((l) => rungFor(l.L, "top", t)[1]);
      return { unit: r.ladders[0].L.bottom, lanes: r.racers.map((x, i) => ({ id: x.id, icon: x.icon, d: ds[i], time: t })), max: niceEnd(Math.max(...ds)) };
    }
    const D = r.race.D;
    const ts = r.ladders.map((l) => rungFor(l.L, "top", D)[1]);
    return { unit: r.ladders[0].L.top, lanes: r.racers.map((x, i) => ({ id: x.id, icon: x.icon, d: D, time: ts[i] })), max: niceEnd(D), bank: D };
  }, [running, round, common]);

  const laneX = (d, max) => LX0 + (Math.min(d, max * 1.1) / max) * W;
  const go = status === "celebrate" || status === "feedback" ? (last ? last.at : 1) : 0;
  const trialGo = trial && !ended ? trial.at : 0;

  // Distance marks along the lanes.
  const marks = useMemo(() => {
    if (!race) return [];
    const step = race.max <= 20 ? 5 : race.max <= 50 ? 10 : race.max <= 120 ? 20 : race.max <= 300 ? 50 : 100;
    const out = [];
    for (let v = step; v <= race.max; v += step) out.push(v);
    return out;
  }, [race]);

  const slowest = race ? Math.max(...race.lanes.map((l) => l.time)) : 1;

  return (
    <group>
      <LadderSet
        S={S}
        ys={YS}
        ys3={YS3}
        labels={labels}
        idleL={{ top: { kind: "num", unit: "s", dp: 0, icon: "⏱", one: "second", many: "seconds" }, bottom: { kind: "num", unit: "m", dp: 0, icon: "📏", one: "metre", many: "metres" }, a: 4, b: 6 }}
        idleNames={["⏱ seconds", "📏 metres"]}
        names={(r) => [vineShort(r.ladders[0].L.top), vineShort(r.ladders[0].L.bottom)]}
        sharedNames={(r) => [`${r.racers[0].icon} ${vineShort(r.ladders[0].L.bottom)}`, vineShort(r.ladders[0].L.top), `${r.racers[1].icon} ${vineShort(r.ladders[1].L.bottom)}`]}
      />

      {/* The racing pool: two lanes from the start line (at zero) along. */}
      <Water x0={LX0 - 0.2} x1={LX1 + 0.3} z={LANE_Z[0]} w={LANE_W} />
      <Water x0={LX0 - 0.2} x1={LX1 + 0.3} z={LANE_Z[1]} w={LANE_W} />
      <Floats x0={LX0 - 0.2} x1={LX1 + 0.3} z={(LANE_Z[0] + LANE_Z[1]) / 2} />
      {/* Start line + lily pads. */}
      <mesh position={[LX0, 0.1, (LANE_Z[0] + LANE_Z[1]) / 2]}><boxGeometry args={[0.08, 0.06, LANE_W * 2 + 0.4]} /><meshStandardMaterial color="#ffffff" /></mesh>
      {[[LX1 + 0.9, 1.2], [LX1 + 1.4, 2.3], [LX0 - 0.9, 3.4], [LX1 + 0.6, 3.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]} rotation={[-Math.PI / 2, 0, i]}><circleGeometry args={[0.32, 14, 0.4, Math.PI * 1.8]} /><meshStandardMaterial color="#4f9d3a" side={2} /></mesh>
      ))}
      {labels && race && (
        <Chip position={[LX0 - 0.2, 0.52, LANE_Z[0] - LANE_W / 2 - 0.22]} df={8} className="jungle-cell small">0</Chip>
      )}
      {race && marks.map((v) => (
        // Distance posts on the FAR bank (between the lanes and the ladder), so
        // the card docked at the bottom never hides them.
        <group key={v} position={[laneX(v, race.max), 0, LANE_Z[0] - LANE_W / 2 - 0.22]}>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.04, 0.04, 0.4, 6]} /><meshStandardMaterial color="#8a5a32" /></mesh>
          {labels && <Chip position={[0, 0.52, 0]} df={8} className="jungle-cell small">{fmtVal(race.unit, v)}</Chip>}
        </group>
      ))}
      {race && race.bank && (
        <group position={[laneX(race.bank, race.max), 0, (LANE_Z[0] + LANE_Z[1]) / 2]}>
          <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.1, 1.0, LANE_W * 2 + 0.3]} /><meshStandardMaterial color="#f4f1de" /></mesh>
          {labels && <Chip position={[0, 1.25, 0]} df={8} className="jungle-target">🏁 {fmtVal(race.unit, race.bank)}</Chip>}
        </group>
      )}

      {/* The racers: waiting at zero, then swimming the answer. */}
      {race && race.lanes.map((ln, i) => {
        if (i === 0 && trial && !ended && round.layout === "single") return null; // the trial swimmer takes lane 1
        const dur = SWIM_SECONDS * (ln.time / slowest);
        return (
          <Racer
            key={`${round.sig}-${i}`}
            id={ln.id}
            z={LANE_Z[i]}
            toX={laneX(ln.d, race.max)}
            dur={race.bank ? dur : SWIM_SECONDS}
            go={go}
            label={ended && labels ? `${ln.icon} ${fmtVal(race.unit, ln.d)}` : null}
          />
        );
      })}
      {!race && (
        <>
          <group position={[LX0 + 0.1, 0, LANE_Z[0]]}><RacerBody id="frog" /></group>
          <group position={[LX0 + 0.1, 0, LANE_Z[1]]}><RacerBody id="duck" /></group>
        </>
      )}

      {/* A wrong distance (or time) for the 🎯: a red flag at the student's
          number, and the racer swims the TRUE answer past it. */}
      {race && trial && !ended && round.layout === "single" && (() => {
        const L = round.ladders[0].L;
        const typedIsDist = round.drive === "top";
        const flagD = typedIsDist ? trial.typed : null;
        const swimD = typedIsDist ? trial.right : rungFor(L, "top", trial.typed) ? rungFor(L, "top", trial.typed)[1] : (trial.typed * L.b) / L.a;
        const max = Math.max(race.max, niceEnd(Math.max(flagD || 0, swimD)));
        return (
          <group key={`trial${trial.at}`}>
            {flagD !== null && (
              <group position={[LX0 + (Math.min(flagD, max * 1.1) / max) * W, 0, LANE_Z[0] - 0.75]}>
                <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.03, 0.03, 1.1, 6]} /><meshStandardMaterial color="#5b4a22" /></mesh>
                <mesh position={[0.18, 0.95, 0]}><boxGeometry args={[0.36, 0.22, 0.02]} /><meshStandardMaterial color="#e5484d" /></mesh>
                <Chip position={[0, 1.35, 0]} df={8} className="jungle-cell bad">{vineChip(L.bottom, flagD)}?</Chip>
              </group>
            )}
            <Racer id={round.racers[0].id} z={LANE_Z[0]} toX={LX0 + (Math.min(swimD, max * 1.1) / max) * W} dur={SWIM_SECONDS} go={trialGo} label={`${round.racers[0].icon} ${fmtVal(L.bottom, Math.round(swimD))}`} />
          </group>
        );
      })()}

      {status === "celebrate" && <ConfettiBurst origin={[0.6, 1.2, LADDER_Z + 1.6]} />}
      {ended && round.phases.some((p) => p.type === "call") && called !== null && (
        <Chip position={[0.6, YS3[0] + 1.0, LADDER_Z]} df={9} className={`fc-count-chip${called === round.better ? " good" : ""}`}>
          {`${round.racers[round.better].icon} ${round.racers[round.better].name} wins!`}
        </Chip>
      )}
    </group>
  );
}
