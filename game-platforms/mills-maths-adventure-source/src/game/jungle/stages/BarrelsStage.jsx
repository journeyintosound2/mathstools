import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { useBarrelsChallenge } from "../stores/barrelsStore.js";
import LadderSet, { useLadderRound } from "./LadderSet.jsx";
import { LADDER_Z } from "./VineLadder.jsx";
import { Chip } from "../../magma/stages/StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";
import { rungFor, fmtVal, partnerOf } from "../../../data/jungle/vineLadder.js";
import { vineShort } from "../../../data/jungle/jungleUnits.js";

/**
 * WATERFALL BARRELS — the vine ladder (seconds ↔ litres) in front of a
 * bamboo pipe that brings water from the falls to a wooden barrel with a
 * litre gauge. A finished round runs the tap: the barrel fills to what the
 * ladder says. A wrong time for a full barrel runs the tap for the student's
 * time — it overflows (too long) or stops short (too short). Two pipes pour
 * into one barrel; rates-everywhere rounds show their own sign (heartbeats,
 * drums, ants, rain).
 */

const YS = [2.75, 1.35];
const YS3 = [2.85, 2.0, 1.15];
const BARREL = { x: 4.6, z: -2.9, r: 0.62, h: 1.35 };
const FILL_SECONDS = 2.6;

function Barrel({ position, litres, cap, go, overflow = false, short = false, label }) {
  const water = useRef();
  const spill = useRef();
  const t0 = useRef(null);
  const key = useRef(go);
  const frac = Math.min(1, litres / Math.max(1, cap));
  useFrame(({ clock }) => {
    if (key.current !== go) { key.current = go; t0.current = null; }
    if (go && t0.current === null) t0.current = clock.elapsedTime;
    const f = go && t0.current !== null ? Math.min(1, (clock.elapsedTime - t0.current) / FILL_SECONDS) : 0;
    const lvl = Math.max(0.001, frac * f);
    if (water.current) {
      water.current.scale.y = lvl;
      water.current.position.y = 0.08 + (BARREL.h - 0.1) * lvl / 2;
    }
    if (spill.current) {
      const on = overflow && f > 0.85;
      spill.current.visible = on;
      if (on) spill.current.scale.y = 0.6 + Math.sin(clock.elapsedTime * 12) * 0.08;
    }
  });
  return (
    <group position={position}>
      <mesh position={[0, BARREL.h / 2, 0]} castShadow>
        <cylinderGeometry args={[BARREL.r, BARREL.r * 0.9, BARREL.h, 18, 1, true]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.85} side={2} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[BARREL.r * 0.9, BARREL.r * 0.9, 0.08, 18]} />
        <meshStandardMaterial color="#6b4423" />
      </mesh>
      {[0.15, 0.68, 1.2].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[BARREL.r * (1 - y * 0.07) + 0.01, 0.025, 6, 24]} />
          <meshStandardMaterial color="#3d3d3d" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <mesh ref={water} position={[0, 0.1, 0]}>
        <cylinderGeometry args={[BARREL.r * 0.93, BARREL.r * 0.88, BARREL.h - 0.1, 18]} />
        <meshStandardMaterial color="#4fb3d9" emissive="#1f7fa8" emissiveIntensity={0.25} transparent opacity={0.88} />
      </mesh>
      {/* Overflow: water sheets down the side. */}
      <mesh ref={spill} position={[0, BARREL.h * 0.5, BARREL.r + 0.02]} visible={false}>
        <boxGeometry args={[0.6, BARREL.h, 0.04]} />
        <meshStandardMaterial color="#8fd3f4" transparent opacity={0.7} emissive="#5ab6e0" emissiveIntensity={0.3} />
      </mesh>
      {/* The litre gauge: a glass tube with a brim mark. */}
      <mesh position={[0, BARREL.h / 2, BARREL.r + 0.08]}>
        <boxGeometry args={[0.08, BARREL.h, 0.04]} />
        <meshStandardMaterial color="#d8f3ff" transparent opacity={0.6} />
      </mesh>
      {label && <Chip position={[0, BARREL.h + 0.5, 0.2]} df={8} className={`jungle-cell${overflow || short ? " bad" : ""}`}>{label}</Chip>}
    </group>
  );
}

function Pipe({ to, go }) {
  const stream = useRef();
  useFrame(({ clock }) => {
    if (!stream.current) return;
    stream.current.visible = Boolean(go);
    stream.current.material.opacity = 0.55 + Math.sin(clock.elapsedTime * 20) * 0.1;
  });
  return (
    <group>
      {/* Bamboo pipe from the rocks behind, on two forked props, to the barrel. */}
      <mesh position={[to[0] + 1.6, 2.35, to[1] - 0.2]} rotation={[0, 0, Math.PI / 2 - 0.12]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 3.6, 10]} />
        <meshStandardMaterial color="#b5a642" roughness={0.6} />
      </mesh>
      {[0.6, 2.4].map((dx) => (
        <mesh key={dx} position={[to[0] + dx, 1.1, to[1] - 0.2]}>
          <cylinderGeometry args={[0.05, 0.06, 2.2, 6]} />
          <meshStandardMaterial color="#6b4423" />
        </mesh>
      ))}
      <mesh position={[to[0] + 3.6, 1.2, to[1] - 0.4]} castShadow>
        <dodecahedronGeometry args={[1.0, 0]} />
        <meshStandardMaterial color="#6f6a5e" roughness={0.95} flatShading />
      </mesh>
      <mesh ref={stream} position={[to[0] - 0.15, 1.95, to[1] - 0.2]} visible={false}>
        <cylinderGeometry args={[0.07, 0.05, 0.9, 8]} />
        <meshStandardMaterial color="#9fdcf5" transparent opacity={0.6} emissive="#4fb3d9" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

const CONTEXT_SIGN = { heart: "💓 beats", drum: "🥁 drumbeats", ants: "🐜 leaves", rain: "🌧 rain gauge" };

export default function BarrelsStage({ labels = true }) {
  const S = useLadderRound(useBarrelsChallenge);
  const { running, round, ended, status, trial, last } = S;
  const go = ended ? (last ? last.at : 1) : 0;

  // What the barrel shows at the end of the round, or during a wrong try.
  const fill = useMemo(() => {
    if (!running || !round.fill) return null;
    const f = round.fill;
    if (f.perHour) return { litres: f.litres, cap: f.litres, label: `${f.litres} L in an hour` };
    const cap = f.barrel || Math.max(10, Math.ceil(f.litres / 10) * 10 + 10);
    return { litres: f.litres, cap, label: `${f.litres} L` };
  }, [running, round]);

  const trialFill = useMemo(() => {
    if (!trial || ended || !running || !round.fill || round.layout !== "single") return null;
    const L = round.ladders[0].L;
    const f = round.fill;
    // Fill rounds: the student's TIME runs the tap.
    if (round.drive === "bottom") {
      const litres = partnerOf(L, "top", trial.typed) ?? (trial.typed * L.b) / L.a;
      const cap = f.barrel;
      const over = litres > cap;
      return { litres: Math.min(litres, cap), cap, overflow: over, short: !over, label: over ? `${trial.typed} s — it overflows!` : `${trial.typed} s — only ${Math.round(litres * 10) / 10} L` };
    }
    // How-much rounds: the student's litres vs the barrel's real level.
    return { litres: trial.right, cap: Math.max(10, Math.ceil(Math.max(trial.right, trial.typed) / 10) * 10 + 10), short: true, label: `The tap gave ${trial.right} L — not ${trial.typed} L` };
  }, [trial, ended, running, round]);

  const showBarrel = !running || !round.context;
  return (
    <group>
      <LadderSet
        S={S}
        ys={YS}
        ys3={YS3}
        labels={labels}
        idleL={{ top: { kind: "num", unit: "s", dp: 0, icon: "⏱", one: "second", many: "seconds" }, bottom: { kind: "num", unit: "L", dp: 0, icon: "💧", one: "litre", many: "litres" }, a: 10, b: 4 }}
        idleNames={["⏱ s", "💧 L"]}
        names={(r, li) => [vineShort(r.ladders[li].L.top), vineShort(r.ladders[li].L.bottom)]}
        sharedNames={(r) => [`A ${vineShort(r.ladders[0].L.bottom)}`, vineShort(r.ladders[0].L.top), `B ${vineShort(r.ladders[1].L.bottom)}`]}
      />

      {/* The platform, the pipe and the barrel(s). */}
      <mesh position={[BARREL.x + 0.6, 0.06, BARREL.z]} receiveShadow>
        <boxGeometry args={[3.4, 0.12, 2.0]} />
        <meshStandardMaterial color="#8a6a44" roughness={0.9} />
      </mesh>
      {showBarrel && (
        <>
          <Pipe to={[BARREL.x, BARREL.z]} go={go || (trialFill ? trial.at : 0)} />
          {running && round.layout === "shared" && <Pipe to={[BARREL.x - 0.4, BARREL.z + 0.3]} go={go} />}
          <Barrel
            key={trialFill ? `t${trial.at}` : `b${round ? round.sig : "idle"}`}
            position={[BARREL.x, 0.12, BARREL.z]}
            litres={trialFill ? trialFill.litres : fill ? fill.litres : 0}
            cap={trialFill ? trialFill.cap : fill ? fill.cap : 40}
            go={trialFill ? trial.at : go}
            overflow={trialFill ? trialFill.overflow : false}
            short={trialFill ? trialFill.short : false}
            label={labels ? (trialFill ? trialFill.label : ended && fill ? fill.label : running && round.fill && round.fill.barrel ? `holds ${round.fill.barrel} L` : null) : null}
          />
        </>
      )}
      {running && round.context && (
        <group position={[BARREL.x, 0, BARREL.z]}>
          <mesh position={[0, 1.5, 0]} castShadow><boxGeometry args={[2.4, 1.3, 0.12]} /><meshStandardMaterial color="#6b4423" /></mesh>
          {[-1, 1].map((s) => <mesh key={s} position={[s * 1.0, 0.75, -0.05]}><cylinderGeometry args={[0.06, 0.07, 1.5, 6]} /><meshStandardMaterial color="#54361c" /></mesh>)}
          {labels && <Chip position={[0, 1.55, 0.12]} df={8} className="jungle-sign">{CONTEXT_SIGN[round.context]}</Chip>}
          {labels && ended && <Chip position={[0, 2.55, 0.12]} df={8} className="jungle-cell hit">{round.celebrate}</Chip>}
        </group>
      )}

      {status === "celebrate" && <ConfettiBurst origin={[0.6, 1.2, LADDER_Z + 0.6]} />}
    </group>
  );
}

export { rungFor, fmtVal };
