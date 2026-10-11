import React, { useMemo } from "react";

import { useTempleChallenge } from "../stores/templeStore.js";
import LadderSet, { useLadderRound, useSetScale } from "./LadderSet.jsx";
import { LX0, LADDER_Z, Stick, MovingChip, useMats } from "./VineLadder.jsx";
import { Chip } from "../../magma/stages/StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";
import { vineChip } from "../../../data/jungle/vineLadder.js";
import { REASONS } from "../../../data/jungle/templeChallenge.js";
import { vineShort } from "../../../data/jungle/jungleUnits.js";

/**
 * TEMPLE OF TRUTH — the vine ladder in front of a ruined temple wall with a
 * carved door and fifteen glyphs. Each round a tablet's pairs are HUNG on
 * the vines once the student has called it: a true ladder hangs every pair
 * straight, tied at zero; a broken one hangs its first pair straight and the
 * others CROOKED (a fee won't even tie at zero — its "0 ↔ $10" shows at the
 * post). Every right call lights a glyph; the door glows brighter as they
 * light.
 */

const YS = [2.75, 1.35];
const WALL = { z: -3.7, w: 7.2, h: 4.4 };

function Wall({ lit, total = 15, glow }) {
  const cols = 5;
  return (
    <group position={[0.4, 0, WALL.z]}>
      {/* Stone courses */}
      {Array.from({ length: 7 }, (_, row) => (
        <group key={row}>
          {Array.from({ length: 6 }, (_, k) => {
            const w = WALL.w / 6;
            const off = row % 2 ? w / 2 : 0;
            const x = -WALL.w / 2 + w / 2 + k * w + off - (row % 2 ? w / 2 : 0);
            const doorGap = Math.abs(x) < 1.0 && row < 4;
            if (doorGap) return null;
            return (
              <mesh key={k} position={[x, 0.32 + row * 0.62, 0]} castShadow>
                <boxGeometry args={[w - 0.05, 0.58, 0.7]} />
                <meshStandardMaterial color={row % 2 ? "#8d8a72" : "#9a9780"} roughness={0.95} flatShading />
              </mesh>
            );
          })}
        </group>
      ))}
      {/* The doorway: dark, glowing more as glyphs light. */}
      <mesh position={[0, 1.25, -0.2]}>
        <boxGeometry args={[1.9, 2.5, 0.3]} />
        <meshStandardMaterial color="#1b1a14" emissive="#ffb000" emissiveIntensity={0.05 + 0.6 * (lit / total) + (glow ? 0.4 : 0)} />
      </mesh>
      {/* Glyphs: three rows of five across the lintel. */}
      {Array.from({ length: total }, (_, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const on = i < lit;
        return (
          <mesh key={i} position={[-1.5 + c * 0.75, 2.85 + r * 0.5, 0.37]}>
            <boxGeometry args={[0.36, 0.36, 0.06]} />
            <meshStandardMaterial color={on ? "#ffd166" : "#5d5a4a"} emissive={on ? "#ffb000" : "#000"} emissiveIntensity={on ? 0.9 : 0} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function TempleStage({ labels = true }) {
  const S = useLadderRound(useTempleChallenge);
  const { running, round, ended, status, phase } = S;
  const results = useTempleChallenge((s) => s.results);
  const mats = useMats();
  const hung = running && (phase >= 1 || ended);
  const broken = running && round.truth !== "prop";
  const sc = useSetScale(S, [0], 8);
  const lit = results.filter((x) => x.points > 0).length + (status === "celebrate" ? 1 : 0);

  // The extra (crooked) pairs of a broken tablet, and where its zero would sit.
  const crooked = useMemo(() => {
    if (!running || !broken) return [];
    const L = round.ladders[0].L;
    return round.pairs.slice(1).map(([x, y]) => ({ x, y, yTop: (y * L.a) / L.b }));
  }, [running, broken, round]);

  const chipT = (v) => vineChip(round.ladders[0].L.top, v);
  const chipB = (v) => vineChip(round.ladders[0].L.bottom, v);

  return (
    <group>
      <Wall lit={Math.min(15, lit)} glow={status === "celebrate"} />
      <LadderSet
        S={S}
        ys={YS}
        labels={labels}
        scale={sc}
        hideRungs={!hung}
        startTicks={false}
        idleL={{ top: { kind: "count", icon: "🪵", one: "plank", many: "planks" }, bottom: { kind: "num", unit: "m", dp: 1, icon: "📏", one: "metre", many: "metres" }, a: 4, b: 30 }}
        idleNames={["?", "?"]}
        names={(r) => (r.labels ? [`${r.labels[0]} ${vineShort(r.ladders[0].L.top)}`, `${r.labels[1]} ${vineShort(r.ladders[0].L.bottom)}`] : [vineShort(r.ladders[0].L.top), vineShort(r.ladders[0].L.bottom)])}
      />
      {/* The tablet's pairs, carved on a slab, before they're hung. */}
      {running && labels && !hung && (
        <Chip position={[0.4, YS[0] + 0.25, LADDER_Z + 0.2]} df={9} className="jungle-tablet">
          {round.pairs.map((p, i) => (
            <span key={i}>{round.labels ? `${round.labels[0]} ` : ""}{chipT(p[0])} ↔ {round.labels ? `${round.labels[1]} ` : ""}{chipB(p[1])}</span>
          ))}
        </Chip>
      )}
      {/* A broken ladder: the other pairs hang crooked. */}
      {hung && crooked.map((c, i) => (
        <group key={`c${i}`}>
          <Stick t1={c.x} y1={YS[0]} t2={c.yTop} y2={YS[1]} scaleRef={sc.scaleRef} material={mats.red} />
          <MovingChip t={c.x} y={YS[0] + 0.4 + (i % 2) * 0.36} scaleRef={sc.scaleRef} className="jungle-cell bad">{chipT(c.x)}</MovingChip>
          <MovingChip t={c.yTop} y={YS[1] - 0.4 - (i % 2) * 0.36} scaleRef={sc.scaleRef} className="jungle-cell bad">{chipB(c.y)}</MovingChip>
        </group>
      ))}
      {hung && broken && round.truth === "fee" && labels && (
        <Chip position={[LX0 - 0.2, YS[1] - 1.0, LADDER_Z + 0.3]} df={8} className="jungle-cell bad">
          0 {round.ladders[0].L.top.kind === "num" ? round.ladders[0].L.top.unit : round.ladders[0].L.top.icon} ↔ {chipB(round.pairs[0][1] - ((round.pairs[1][1] - round.pairs[0][1]) / (round.pairs[1][0] - round.pairs[0][0])) * round.pairs[0][0])}? Not 0!
        </Chip>
      )}
      {running && ended && broken && labels && (
        <Chip position={[0.4, YS[0] + 1.15, LADDER_Z]} df={9} className={`fc-count-chip${status === "celebrate" ? " good" : ""}`}>
          {`${REASONS[round.truth].icon} ${REASONS[round.truth].label}`}
        </Chip>
      )}
      {status === "celebrate" && <ConfettiBurst origin={[0.4, 2.2, WALL.z + 1.2]} />}
    </group>
  );
}
