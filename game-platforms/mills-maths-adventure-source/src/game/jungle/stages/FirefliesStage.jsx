import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useFirefliesChallenge } from "../stores/firefliesStore.js";
import { useLadderRound, niceEnd, goalsOn } from "./LadderSet.jsx";
import { driveAt } from "../ladderStore.js";
import { Chip, since } from "../../magma/stages/StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";
import { vineChip, fmtVal, onSide } from "../../../data/jungle/vineLadder.js";
import { WALKERS } from "../../../data/jungle/firefliesChallenge.js";

/**
 * FIREFLY GRAPHS — the vine ladder STOOD UP: the time vine lies along the
 * ground of Redwood Hollow, the distance vine climbs a giant redwood, and
 * every rung of the ladder becomes a FIREFLY at (time, distance). A true
 * ladder's fireflies sit on ONE straight line from the roots (the origin);
 * steeper = faster. The same store and moves as every other challenge — only
 * the picture changes. A wrong number is a firefly OFF the line (red);
 * adding the same to both makes a line that misses the roots.
 */

const GX0 = -4.3, GW = 9.6;
const GY0 = 0.55, GH = 3.4;
const Z = -0.4;

function useEased(target) {
  const ref = useRef(target);
  useFrame((_, dt) => { ref.current += (target - ref.current) * (1 - Math.exp(-5 * dt)); });
  return ref;
}

/** A thin glowing line between two graph points, eased with the axes. */
function GLine({ a, b, tRef, dRef, color, radius = 0.035, dashed = false, opacity = 0.9 }) {
  const ref = useRef();
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const x1 = GX0 + (a[0] / tRef.current) * GW, y1 = GY0 + (a[1] / dRef.current) * GH;
    const x2 = GX0 + (b[0] / tRef.current) * GW, y2 = GY0 + (b[1] / dRef.current) * GH;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.max(0.01, Math.hypot(dx, dy));
    m.position.set((x1 + x2) / 2, (y1 + y2) / 2, Z + 0.05);
    m.scale.set(1, len, 1);
    m.rotation.set(0, 0, -Math.atan2(dx, dy));
  });
  return (
    <mesh ref={ref}>
      <cylinderGeometry args={[radius, radius, 1, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={dashed ? 0.3 : 0.7} transparent opacity={opacity} />
    </mesh>
  );
}

function Firefly({ p, tRef, dRef, color = "#e9ff70", sel, bad, hit, onTap, label, labelClass = "jungle-cell small" }) {
  const ref = useRef();
  const glow = useRef();
  const seed = useMemo(() => Math.random() * 10, []);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    g.position.x = GX0 + (p[0] / tRef.current) * GW;
    g.position.y = GY0 + (p[1] / dRef.current) * GH + Math.sin(clock.elapsedTime * 2 + seed) * 0.03;
    if (glow.current) glow.current.material.emissiveIntensity = 0.9 + Math.sin(clock.elapsedTime * 5 + seed) * 0.35;
  });
  const c = bad ? "#ff4d4d" : hit ? "#ffd166" : color;
  return (
    <group ref={ref} position={[GX0, GY0, Z + 0.1]}>
      <mesh ref={glow} onPointerDown={onTap ? (e) => { e.stopPropagation(); onTap(); } : undefined}>
        <sphereGeometry args={[sel ? 0.17 : 0.13, 12, 10]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.12, 0.07, -0.02]} rotation={[0, 0, s * 0.6]}>
          <circleGeometry args={[0.09, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.5} side={2} />
        </mesh>
      ))}
      {sel && (
        <mesh rotation={[0, 0, 0]}>
          <torusGeometry args={[0.24, 0.025, 6, 20]} />
          <meshStandardMaterial color="#ffb347" emissive="#ff9f1c" emissiveIntensity={0.8} />
        </mesh>
      )}
      {onTap && (
        <mesh onPointerDown={(e) => { e.stopPropagation(); onTap(); }}>
          <sphereGeometry args={[0.4, 8, 6]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
      {label && <Chip position={[0, 0.42, 0.1]} df={8} className={labelClass}>{label}</Chip>}
    </group>
  );
}

function Redwood() {
  return (
    <group position={[GX0 - 0.55, 0, Z - 0.6]}>
      <mesh position={[0, 3.0, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.85, 6.0, 12]} />
        <meshStandardMaterial color="#7a3e22" roughness={0.95} />
      </mesh>
      {[0.6, 1.2, 1.9].map((r, i) => (
        <mesh key={i} position={[Math.cos(i * 2.2) * 0.75, 0.2, Math.sin(i * 2.2) * 0.75]} rotation={[0, i, 0.9]}>
          <cylinderGeometry args={[0.12, 0.2, 1.1, 6]} />
          <meshStandardMaterial color="#6a3520" />
        </mesh>
      ))}
    </group>
  );
}

export default function FirefliesStage({ labels = true }) {
  const S = useLadderRound(useFirefliesChallenge);
  const { running, round, ladders, active, sel, pending, wrong, hits, common, phase, ended, status, called, useStore } = S;

  // Axis maxima: everything shown, the goals, the starts (nice numbers).
  const { tMax, dMax } = useMemo(() => {
    if (!running) return { tMax: 120, dMax: 80 };
    let t = 0, d = 0;
    round.ladders.forEach((l, li) => {
      (ladders[li] ? ladders[li].rungs : l.start).forEach(([a, b]) => { t = Math.max(t, a); d = Math.max(d, b); });
    });
    round.ladders.forEach((l, li) => goalsOn(S, li).forEach(([a, b]) => { t = Math.max(t, a); d = Math.max(d, b); }));
    if (pending) { t = Math.max(t, pending.rung[0]); d = Math.max(d, pending.rung[1]); }
    return { tMax: niceEnd(Math.max(t, 30)), dMax: niceEnd(Math.max(d, 10)) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, round, ladders, pending, phase]);
  const tRef = useEased(tMax);
  const dRef = useEased(dMax);

  const tStep = tMax <= 60 ? 10 : tMax <= 150 ? 15 : tMax <= 300 ? 30 : 60;
  const dStep = dMax <= 20 ? 5 : dMax <= 60 ? 10 : dMax <= 120 ? 20 : 50;
  const ticksT = []; for (let v = tStep; v <= tMax + 1e-9; v += tStep) ticksT.push(v);
  const ticksD = []; for (let v = dStep; v <= dMax + 1e-9; v += dStep) ticksD.push(v);
  const T = { kind: "num", unit: "min", dp: 0 };
  const D = { kind: "num", unit: "km", dp: 1 };

  const lines = running ? round.ladders.map((l, li) => {
    const w = WALKERS[li] || WALKERS[0];
    const rungs = ladders[li] ? ladders[li].rungs : l.start;
    const lit = round.lineLit || rungs.length > 1 || round.kind === "match" || ended;
    const [a, b] = l.start[0];
    // Extend the line to the edge of the board.
    const k = Math.min(tMax / a, dMax / b) * 1.0;
    return { li, w, rungs, lit, end: [a * k, b * k] };
  }) : [];

  const showWrong = wrong && pending && !ended && since(wrong.at) < 60;
  const d0 = running ? driveAt(round, phase, pending ? pending.li : active) : "top";

  return (
    <group>
      <Redwood />
      {/* The board: a mossy backboard, the axes (a log along the ground, a vine up the trunk). */}
      <mesh position={[GX0 + GW / 2, GY0 + GH / 2, Z - 0.25]}>
        <planeGeometry args={[GW + 0.6, GH + 0.6]} />
        <meshStandardMaterial color="#1d3b26" roughness={1} transparent opacity={0.82} />
      </mesh>
      <mesh position={[GX0 + GW / 2, GY0 - 0.06, Z]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, GW + 0.4, 10]} />
        <meshStandardMaterial color="#7a5230" roughness={0.9} />
      </mesh>
      <mesh position={[GX0 - 0.06, GY0 + GH / 2, Z]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, GH + 0.3, 8]} />
        <meshStandardMaterial color="#3f7d2b" roughness={0.85} />
      </mesh>
      {ticksT.map((v) => (
        <group key={`t${v}`}>
          <mesh position={[GX0 + (v / tMax) * GW, GY0 + GH / 2, Z - 0.2]}>
            <boxGeometry args={[0.012, GH, 0.01]} />
            <meshStandardMaterial color="#6fae62" transparent opacity={0.45} />
          </mesh>
          {labels && <Chip position={[GX0 + (v / tMax) * GW, GY0 - 0.42, Z + 0.2]} df={9} className="jungle-cell small">{v}</Chip>}
        </group>
      ))}
      {ticksD.map((v) => (
        <group key={`d${v}`}>
          <mesh position={[GX0 + GW / 2, GY0 + (v / dMax) * GH, Z - 0.2]}>
            <boxGeometry args={[GW, 0.012, 0.01]} />
            <meshStandardMaterial color="#6fae62" transparent opacity={0.45} />
          </mesh>
          {labels && <Chip position={[GX0 - 0.55, GY0 + (v / dMax) * GH, Z + 0.2]} df={9} className="jungle-cell small">{fmtVal(D, v)}</Chip>}
        </group>
      ))}
      {labels && <Chip position={[GX0 - 0.45, GY0 - 0.42, Z + 0.2]} df={8} className="jungle-zero">0</Chip>}
      {labels && <Chip position={[GX0 + GW + 0.15, GY0 - 0.42, Z + 0.2]} df={9} className="jungle-vine-name">⏱ min</Chip>}
      {labels && <Chip position={[GX0 - 0.2, GY0 + GH + 0.45, Z + 0.2]} df={9} className="jungle-vine-name">📏 km</Chip>}

      {/* Each walker's line from the roots, once there are two fireflies. */}
      {lines.map((ln) => ln.lit && (
        <GLine key={`l${ln.li}`} a={[0, 0]} b={ln.end} tRef={tRef} dRef={dRef} color={ln.w.color} radius={0.04} opacity={0.75} />
      ))}
      {/* The fireflies (rungs). */}
      {lines.map((ln) => ln.rungs.map(([t, d], i) => {
        const isHit = hits.some((h) => h.li === ln.li && h.t === t) || (common !== null && t === common);
        return (
          <Firefly
            key={`f${ln.li}-${i}-${t}`}
            p={[t, d]}
            tRef={tRef}
            dRef={dRef}
            color={round.ladders.length > 1 ? ln.w.color : "#e9ff70"}
            sel={!ended && active === ln.li && sel.includes(i)}
            hit={isHit}
            onTap={ended ? undefined : () => useStore.getState().select(ln.li, i)}
            label={labels && (isHit || i === 0 || (!ended && active === ln.li && sel.includes(i))) ? `${t} min, ${fmtVal(D, d)}` : null}
            labelClass={`jungle-cell small${isHit ? " hit" : ""}`}
          />
        );
      }))}
      {/* Walker names by their first firefly (two or three lines). */}
      {labels && running && round.ladders.length > 1 && lines.map((ln) => (
        <Chip key={`n${ln.li}`} position={[GX0 + (ln.end[0] / tMax) * GW * 0.92, GY0 + (ln.end[1] / dMax) * GH * 0.92 + 0.3, Z + 0.3]} df={9} className="jungle-vine-name" style={{ background: ln.w.color }}>
          {ln.w.name}
        </Chip>
      ))}

      {/* Targets: a dashed gold line at the 🎯 time (or distance). */}
      {running && round.ladders.map((l, li) => goalsOn(S, li).map(([gt, gd], gi) => {
        const dd = driveAt(round, phase, li);
        return dd === "top" ? (
          <group key={`g${li}${gi}`}>
            <GLine a={[gt, 0]} b={[gt, dMax]} tRef={tRef} dRef={dRef} color="#ffd166" radius={0.02} dashed opacity={0.6} />
            {labels && <Chip position={[GX0 + (gt / tMax) * GW, GY0 - 0.85, Z + 0.3]} df={8} className="jungle-target">🎯 {gt} min</Chip>}
          </group>
        ) : (
          <group key={`g${li}${gi}`}>
            <GLine a={[0, gd]} b={[tMax, gd]} tRef={tRef} dRef={dRef} color="#ffd166" radius={0.02} dashed opacity={0.6} />
            {labels && <Chip position={[GX0 + GW + 0.75, GY0 + (gd / dMax) * GH, Z + 0.3]} df={8} className="jungle-target">🎯 {fmtVal(D, gd)}</Chip>}
          </group>
        );
      }))}

      {/* The pending firefly: placed at its time (or distance), the other number "?". */}
      {pending && !ended && !showWrong && (d0 === "top" ? (
        <group>
          <GLine a={[pending.rung[0], 0]} b={[pending.rung[0], dMax]} tRef={tRef} dRef={dRef} color="#7fd4ff" radius={0.025} dashed opacity={0.7} />
          {labels && <Chip position={[GX0 + (pending.rung[0] / tMax) * GW, GY0 + GH + 0.2, Z + 0.3]} df={8} className="jungle-cell ask">{pending.rung[0]} min ↔ ?</Chip>}
        </group>
      ) : (
        <group>
          <GLine a={[0, pending.rung[1]]} b={[tMax, pending.rung[1]]} tRef={tRef} dRef={dRef} color="#7fd4ff" radius={0.025} dashed opacity={0.7} />
          {labels && <Chip position={[GX0 + GW * 0.5, GY0 + (pending.rung[1] / dMax) * GH + 0.3, Z + 0.3]} df={8} className="jungle-cell ask">? ↔ {fmtVal(D, pending.rung[1])}</Chip>}
        </group>
      ))}
      {/* A wrong number: a red firefly OFF the line (and, for adding the same to both, a line that misses the roots). */}
      {showWrong && (() => {
        const bad = d0 === "top" ? [pending.rung[0], wrong.typed] : [wrong.typed, pending.rung[1]];
        const src = wrong.src;
        return (
          <group key={`w${wrong.at}`}>
            <Firefly p={bad} tRef={tRef} dRef={dRef} bad label={labels ? `${bad[0]} min, ${fmtVal(D, bad[1])}?` : null} labelClass="jungle-cell bad" />
            {wrong.additive && src && (() => {
              // The line through the source and the wrong point, back to the axis: it misses 0.
              const s = [src[0], src[1]];
              const k = (bad[1] - s[1]) / (bad[0] - s[0] || 1);
              const y0 = s[1] - k * s[0];
              return (
                <>
                  <GLine a={[0, y0]} b={bad} tRef={tRef} dRef={dRef} color="#ff4d4d" radius={0.025} dashed opacity={0.8} />
                  {labels && <Chip position={[GX0 + 0.6, GY0 + (y0 / dMax) * GH, Z + 0.3]} df={8} className="jungle-cell bad">misses the roots!</Chip>}
                </>
              );
            })()}
          </group>
        );
      })()}

      {running && ended && round.phases.some((p) => p.type === "call") && called !== null && (
        <Chip position={[0.4, GY0 + GH + 0.9, Z]} df={9} className={`fc-count-chip${status === "celebrate" ? " good" : ""}`}>
          {round.celebrate}
        </Chip>
      )}
      {status === "celebrate" && <ConfettiBurst origin={[0.4, GY0 + GH * 0.6, Z + 0.6]} />}
    </group>
  );
}

export { THREE, vineChip, onSide };
