import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { Chip, since } from "../../magma/stages/StageKit.jsx";
import { fmtVal, vineChip } from "../../../data/jungle/vineLadder.js";
import { LADDER_GEOM } from "../../../data/jungle/jungleChallenges.js";

/**
 * THE VINE LADDER (3D) — the jungle's double number line, shared by every
 * Emerald Jungle challenge. Drawn in its STAGE FRAME (x right, +z toward the
 * camera): two vines strung from a carved ZERO POST (where they are knotted
 * together) to an end post, bamboo RUNGS linking matching pairs.
 *
 * Positions run in the TOP vine's units (a rung [t, b] stands at x(t)), so
 * every rung is upright by construction; the scale (`scaleRef.current`, the
 * top value at the right-hand end) is eased by the parent stage, and every
 * rung, tick and fruit glides with it.
 *
 * The consequences ARE the feedback:
 *   crooked rung  a wrong partner leans to where that number really sits
 *   untied zero   adding the same amount to both: a red copy of the partner
 *                 vine slides off the zero post (its 0 now sits elsewhere)
 *   gold rung     the target (or the common rung) reached
 */

export const LX0 = LADDER_GEOM.x0;
export const LX1 = LADDER_GEOM.x1;
const W = LX1 - LX0;
export const LADDER_Z = LADDER_GEOM.z;
// Vine names are right-aligned to a point just left of the zero post (so a
// long name grows leftward and never covers the "0" chips).
const NAME_STYLE = { transform: "translateX(-50%)" };
const xOf = (t, scale) => LX0 + (t / Math.max(1e-6, scale)) * W;

const VINE = "#3f7d2b";
const LEAF = "#57b947";
const BAMBOO = "#d2bf62";
const NODE = "#9c8738";
const SEL = "#ffb347";
const GOLD = "#ffd166";
const ASK = "#7fd4ff";
const RED = "#e5484d";

function useMats() {
  return useMemo(() => ({
    vine: new THREE.MeshStandardMaterial({ color: VINE, roughness: 0.85 }),
    strand: new THREE.MeshStandardMaterial({ color: "#2f6420", roughness: 0.9 }),
    leaf: new THREE.MeshStandardMaterial({ color: LEAF, roughness: 0.7, side: THREE.DoubleSide }),
    wood: new THREE.MeshStandardMaterial({ color: "#7a5230", roughness: 0.9, flatShading: true }),
    woodDark: new THREE.MeshStandardMaterial({ color: "#54361c", roughness: 0.95, flatShading: true }),
    rope: new THREE.MeshStandardMaterial({ color: "#c8a46a", roughness: 0.9 }),
    tick: new THREE.MeshStandardMaterial({ color: "#2b4f1d", roughness: 0.8 }),
    red: new THREE.MeshStandardMaterial({ color: RED, emissive: RED, emissiveIntensity: 0.35, transparent: true, opacity: 0.85 }),
    redRope: new THREE.MeshStandardMaterial({ color: RED, emissive: RED, emissiveIntensity: 0.4 }),
    ghost: new THREE.MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0.5, transparent: true, opacity: 0.4, depthWrite: false }),
    bamboo: new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 0.6 }),
  }), []);
}

/** One vine: a thick stem, a strand twisted round it, leaves along it. */
function Vine({ y, x0 = LX0, x1 = LX1, mats, leaves = true, mat }) {
  const len = x1 - x0;
  const helix = useMemo(() => {
    const pts = [];
    const turns = Math.max(3, Math.round(len * 1.6));
    for (let i = 0; i <= turns * 12; i++) {
      const f = i / (turns * 12);
      const a = f * turns * Math.PI * 2;
      pts.push(new THREE.Vector3(x0 + f * len, Math.cos(a) * 0.055, Math.sin(a) * 0.055));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 12, 0.018, 5, false);
  }, [x0, len]);
  const leafSpots = useMemo(() => {
    if (!leaves) return [];
    const out = [];
    const n = Math.max(2, Math.round(len / 0.55));
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n;
      out.push({ x: x0 + f * len, up: i % 2 === 0, rot: ((i * 37) % 11) / 11 - 0.5 });
    }
    return out;
  }, [x0, len, leaves]);
  return (
    <group position={[0, y, LADDER_Z]}>
      <mesh position={[x0 + len / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mat || mats.vine} castShadow>
        <cylinderGeometry args={[0.05, 0.05, len, 8]} />
      </mesh>
      <mesh geometry={helix} material={mat || mats.strand} />
      {leafSpots.map((l, i) => (
        <mesh key={i} position={[l.x, l.up ? 0.09 : -0.09, -0.04]} rotation={[0.4, l.rot, l.up ? 0.6 : -0.6]} material={mats.leaf}>
          <circleGeometry args={[0.11, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/** The carved zero post where both vines are knotted together. */
function ZeroPost({ ys, mats, label = true }) {
  const top = Math.max(...ys) + 0.55;
  const bot = Math.min(...ys) - 0.9;
  const h = top - bot;
  return (
    <group position={[LX0 - 0.12, 0, LADDER_Z]}>
      <mesh position={[0, bot + h / 2, -0.05]} material={mats.wood} castShadow>
        <boxGeometry args={[0.34, h, 0.34]} />
      </mesh>
      <mesh position={[0, top + 0.12, -0.05]} material={mats.woodDark} castShadow>
        <coneGeometry args={[0.3, 0.36, 4]} />
      </mesh>
      {ys.map((y, i) => (
        <mesh key={i} position={[0.12, y, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.rope}>
          <torusGeometry args={[0.13, 0.05, 6, 12]} />
        </mesh>
      ))}
      {/* The tie: a rope lashing down the post joins the vines' zeros. */}
      <mesh position={[0.2, (Math.max(...ys) + Math.min(...ys)) / 2, 0.02]} material={mats.rope}>
        <boxGeometry args={[0.05, Math.max(...ys) - Math.min(...ys), 0.05]} />
      </mesh>
      {label && ys.map((y, i) => (
        <Chip key={`z${i}`} position={[-0.42, y, 0.25]} df={8} className="jungle-zero">0</Chip>
      ))}
    </group>
  );
}

function EndPost({ ys, mats }) {
  const top = Math.max(...ys) + 0.35;
  const bot = Math.min(...ys) - 0.9;
  const h = top - bot;
  return (
    <group position={[LX1 + 0.14, 0, LADDER_Z]}>
      <mesh position={[0, bot + h / 2, -0.05]} material={mats.wood} castShadow>
        <cylinderGeometry args={[0.13, 0.16, h, 7]} />
      </mesh>
      {ys.map((y, i) => (
        <mesh key={i} position={[-0.1, y, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.rope}>
          <torusGeometry args={[0.11, 0.045, 6, 12]} />
        </mesh>
      ))}
    </group>
  );
}

/** A bamboo rung between the two vines at top-value `t`. */
function Rung({ t, yTop, yBot, scaleRef, glow, ask, onTap, topChip, botChip, chipClass = "", hideBot, lift = 0 }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) ref.current.position.x = xOf(t, scaleRef.current);
  });
  const h = yTop - yBot;
  const color = glow || (ask ? ASK : null);
  return (
    <group ref={ref} position={[xOf(t, scaleRef.current), 0, LADDER_Z + 0.02]}>
      <mesh
        position={[0, yBot + h / 2, 0]}
        castShadow
        onPointerDown={onTap ? (e) => { e.stopPropagation(); onTap(); } : undefined}
      >
        <cylinderGeometry args={[0.075, 0.075, h, 8]} />
        <meshStandardMaterial
          color={BAMBOO}
          roughness={0.6}
          emissive={color || "#000"}
          emissiveIntensity={color ? 0.55 : 0}
          transparent={Boolean(ask)}
          opacity={ask ? 0.55 : 1}
        />
      </mesh>
      {[0.3, 0.7].map((f) => (
        <mesh key={f} position={[0, yBot + h * f, 0]}>
          <cylinderGeometry args={[0.088, 0.088, 0.05, 8]} />
          <meshStandardMaterial color={NODE} roughness={0.7} transparent={Boolean(ask)} opacity={ask ? 0.55 : 1} />
        </mesh>
      ))}
      {/* A fat invisible tap target (iPad fingers). */}
      {onTap && (
        <mesh position={[0, yBot + h / 2, 0.05]} onPointerDown={(e) => { e.stopPropagation(); onTap(); }}>
          <boxGeometry args={[0.5, h + 0.9, 0.3]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
      <Chip position={[0, yTop + 0.4 + lift, 0.1]} df={8} className={`jungle-cell ${chipClass}`}>{topChip}</Chip>
      {!hideBot && <Chip position={[0, yBot - 0.4 - lift, 0.1]} df={8} className={`jungle-cell ${chipClass}`}>{botChip}</Chip>}
    </group>
  );
}

/** A small bead on each vine at every multiple of the starting rung. */
function Tick({ t, ys, scaleRef, mats }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) ref.current.position.x = xOf(t, scaleRef.current);
  });
  return (
    <group ref={ref} position={[xOf(t, scaleRef.current), 0, LADDER_Z]}>
      {ys.map((y, i) => (
        <mesh key={i} position={[0, y, 0.04]} material={mats.tick}>
          <sphereGeometry args={[0.075, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/** Real fruit hanging from a vine (one piece per unit, positioned in TOP units). */
function HangingFruit({ positions, y, kind, scaleRef }) {
  const group = useRef();
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.children.forEach((m, i) => { m.position.x = xOf(positions[i], scaleRef.current); });
  });
  const banana = kind === "banana";
  return (
    <group ref={group} position={[0, y, LADDER_Z + 0.06]}>
      {positions.map((p, i) => (
        <group key={i} position={[xOf(p, scaleRef.current), 0, 0]}>
          <mesh position={[0, -0.08, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.12, 4]} />
            <meshStandardMaterial color="#5b4a22" />
          </mesh>
          {banana ? (
            <mesh position={[0, -0.24, 0]} rotation={[0, 0, 0.35]} scale={[0.55, 1, 0.55]}>
              <capsuleGeometry args={[0.07, 0.2, 4, 8]} />
              <meshStandardMaterial color="#ffd43b" roughness={0.55} />
            </mesh>
          ) : (
            <mesh position={[0, -0.24, 0]} scale={[0.85, 1.05, 0.8]}>
              <sphereGeometry args={[0.13, 10, 8]} />
              <meshStandardMaterial color="#ff8c2b" roughness={0.5} emissive="#c2410c" emissiveIntensity={0.08} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/** A stick from (x(t1), y1) to (x(t2), y2), updated each frame (crooked rung, dashes). */
function Stick({ t1, y1, t2, y2, scaleRef, radius = 0.075, material, z = LADDER_Z + 0.08 }) {
  const ref = useRef();
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const xa = xOf(t1, scaleRef.current), xb = xOf(t2, scaleRef.current);
    const dx = xb - xa, dy = y2 - y1;
    const len = Math.max(0.01, Math.hypot(dx, dy));
    m.position.set((xa + xb) / 2, (y1 + y2) / 2, z);
    m.scale.set(1, len, 1);
    m.rotation.set(0, 0, -Math.atan2(dx, dy));
  });
  return (
    <mesh ref={ref} material={material}>
      <cylinderGeometry args={[radius, radius, 1, 8]} />
    </mesh>
  );
}

/** A chip that glides with the scale. */
function MovingChip({ t, y, scaleRef, className, children, dz = 0.12, df = 8 }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) ref.current.position.x = xOf(t, scaleRef.current);
  });
  return (
    <group ref={ref} position={[xOf(t, scaleRef.current), y, LADDER_Z + dz]}>
      <Chip position={[0, 0, 0]} df={df} className={className}>{children}</Chip>
    </group>
  );
}

/**
 * One vine ladder. `ys` = [topY, bottomY]. Values in base units; `L` gives
 * the rate (a top ↔ b bottom) so a bottom value maps to top units for x.
 */
export default function VineLadder({
  L, ys, rungs, scaleRef, drive = "top", sel = [], active = true, pending = null, wrong = null,
  goal = null, hitTop = null, commonTop = null, startTop, fruit = false, onTap, names, idle = false, dim = false, labels = true,
  endTop = null,
}) {
  const mats = useMats();
  const [yTop, yBot] = ys;
  const toTop = (b) => (b * L.a) / L.b; // a bottom value's position, in top units
  const showWrong = wrong && pending && since(wrong.at) < 60;
  const untie = wrong && wrong.additive && wrong.untie !== null && since(wrong.at) < 3.2 ? wrong.untie : null;
  const maxTopShown = Math.max(...rungs.map((r) => r[0]), pending ? pending.rung[0] : 0);

  // Ticks at every multiple of the starting rung (only while they're few).
  const ticks = useMemo(() => {
    if (!startTop || idle) return [];
    const top = endTop || Math.max(maxTopShown, goal ? goal[0] : 0) * 1.25;
    const n = Math.floor(top / startTop);
    if (n > 24) return [];
    return Array.from({ length: n }, (_, i) => (i + 1) * startTop);
  }, [startTop, maxTopShown, goal, idle, endTop]);

  // Hanging fruit: one piece per unit up to the furthest rung.
  const fruitPos = useMemo(() => {
    if (!fruit) return null;
    const maxB = Math.max(...rungs.map((r) => r[1]));
    if (maxTopShown > 30 || maxB > 30) return null;
    return {
      top: Array.from({ length: maxTopShown }, (_, i) => i + 0.5),
      bot: Array.from({ length: maxB }, (_, j) => toTop(j + 0.5)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fruit, rungs, maxTopShown]);

  const chipT = (t) => (L.top.kind === "count" ? vineChip(L.top, t) : fmtVal(L.top.kind, t));
  const chipB = (b) => (L.bottom.kind === "count" ? vineChip(L.bottom, b) : fmtVal(L.bottom.kind, b));
  // Rungs close together on a long vine: stagger their number chips (two
  // heights) so they never sit on top of each other. Decided on the TARGET
  // scale (endTop), so the stagger doesn't flicker while the vine eases.
  const lifts = useMemo(() => {
    const end = endTop || 1;
    const all = rungs.map((r, i) => ({ key: `r${i}`, t: r[0] }));
    if (pending) all.push({ key: "p", t: pending.rung[0] });
    if (goal && !(endTop && goal[0] > endTop * 1.001) && !rungs.some((r) => r[0] === goal[0])) all.push({ key: "g", t: goal[0] });
    all.sort((a, b) => a.t - b.t);
    const out = {};
    let prevX = -99, level = 0;
    for (const it of all) {
      const x = (it.t / end) * W;
      level = x - prevX < 1.05 ? 1 - level : 0;
      out[it.key] = level * 0.36;
      prevX = x;
    }
    return out;
  }, [rungs, pending, endTop, goal]);
  const goalOff = goal && endTop && goal[0] > endTop * 1.001;
  const pSideY = drive === "top" ? yBot : yTop;
  const dSideY = drive === "top" ? yTop : yBot;

  return (
    <group>
      <Vine y={yTop} mats={mats} />
      <Vine y={yBot} mats={mats} />
      <ZeroPost ys={ys} mats={mats} label={labels} />
      <EndPost ys={ys} mats={mats} />

      {/* Which vine is which (and which stall, when there are two). */}
      {names && labels && (
        <>
          <Chip position={[LX0 - 0.72, yTop, LADDER_Z + 0.2]} df={9} style={NAME_STYLE} className={`jungle-vine-name${active ? "" : " dim"}`}>{names[0]}</Chip>
          <Chip position={[LX0 - 0.72, yBot, LADDER_Z + 0.2]} df={9} style={NAME_STYLE} className={`jungle-vine-name${active ? "" : " dim"}`}>{names[1]}</Chip>
        </>
      )}

      {!idle && ticks.map((t) => <Tick key={`t${t}`} t={t} ys={ys} scaleRef={scaleRef} mats={mats} />)}

      {!idle && fruitPos && (
        <>
          <HangingFruit positions={fruitPos.top} y={yTop} kind="banana" scaleRef={scaleRef} />
          <HangingFruit positions={fruitPos.bot} y={yBot} kind="mango" scaleRef={scaleRef} />
        </>
      )}

      {/* The target: a flag on the vine the scene leads with. */}
      {/* In reach: a faint golden GHOST rung marks the target on the vine
          the scene leads with. Beyond the end: a flag waits at the post. */}
      {!idle && goal && !goalOff && !rungs.some((r) => r[0] === goal[0]) && (
        <>
          <Stick t1={goal[0]} y1={yBot} t2={goal[0]} y2={yTop} scaleRef={scaleRef} radius={0.05} material={mats.ghost} z={LADDER_Z - 0.04} />
          <MovingChip
            t={goal[0]}
            y={drive === "top" ? yTop + 0.4 + (lifts.g || 0) : yBot - 0.4 - (lifts.g || 0)}
            scaleRef={scaleRef}
            className="jungle-target"
          >
            🎯 {drive === "top" ? chipT(goal[0]) : chipB(goal[1])}
          </MovingChip>
        </>
      )}
      {!idle && goal && goalOff && (
        <MovingChip t={endTop} y={drive === "top" ? yTop + 0.42 : yBot - 0.42} dz={0.5} scaleRef={scaleRef} className="jungle-target off">
          🎯 {drive === "top" ? chipT(goal[0]) : chipB(goal[1])} →
        </MovingChip>
      )}

      {!idle && rungs.map(([t, b], i) => {
        const hit = (hitTop !== null && t === hitTop) || (commonTop !== null && t === commonTop);
        const selected = active && sel.includes(i);
        const hideWhileUntied = untie !== null && !(wrong.src && wrong.src[0] === t && wrong.src[1] === b);
        if (hideWhileUntied) return null;
        return (
          <Rung
            key={`${i}-${t}`}
            t={t}
            yTop={yTop}
            yBot={yBot}
            scaleRef={scaleRef}
            glow={hit ? GOLD : selected ? SEL : null}
            onTap={onTap ? () => onTap(i) : undefined}
            topChip={chipT(t)}
            botChip={chipB(b)}
            chipClass={`${hit ? "hit" : selected ? "sel" : ""}${dim ? " dim" : ""}`}
            lift={lifts[`r${i}`] || 0}
          />
        );
      })}

      {/* The pending rung: placed by the scene, its partner still a "?". */}
      {!idle && pending && !showWrong && (
        <Rung
          t={pending.rung[0]}
          yTop={yTop}
          yBot={yBot}
          scaleRef={scaleRef}
          ask
          topChip={drive === "top" ? chipT(pending.rung[0]) : "?"}
          botChip={drive === "top" ? "?" : chipB(pending.rung[1])}
          chipClass="ask"
          lift={lifts.p || 0}
        />
      )}

      {/* A wrong partner: the rung leans to where that number really sits. */}
      {!idle && showWrong && untie === null && (() => {
        const dTop = pending.rung[0];
        const wTop = drive === "top" ? toTop(wrong.typed) : wrong.typed;
        const lim = (scaleRef.current || 1) * 1.08;
        const wClamp = Math.max(-0.3, Math.min(lim, wTop));
        return (
          <group key={`w${wrong.at}`}>
            <Stick t1={dTop} y1={dSideY} t2={wClamp} y2={pSideY} scaleRef={scaleRef} material={mats.red} />
            <MovingChip t={dTop} y={drive === "top" ? yTop + 0.4 : yBot - 0.4} scaleRef={scaleRef} className="jungle-cell ask">
              {drive === "top" ? chipT(dTop) : chipB(pending.rung[1])}
            </MovingChip>
            <MovingChip t={wClamp} y={drive === "top" ? yBot - 0.4 : yTop + 0.4} scaleRef={scaleRef} className="jungle-cell bad">
              {drive === "top" ? chipB(wrong.typed) : chipT(wrong.typed)}
            </MovingChip>
          </group>
        );
      })()}

      {/* Adding the same to both: the partner vine slides OFF its zero. */}
      {!idle && untie !== null && (() => {
        const pY = pSideY;
        const z0 = Math.max(-1.2 * (scaleRef.current || 1) * 0.12, untie);
        return (
          <group key={`u${wrong.at}`}>
            <Stick t1={z0} y1={pY} t2={(scaleRef.current || 1) * 1.0} y2={pY} scaleRef={scaleRef} radius={0.06} material={mats.redRope} z={LADDER_Z + 0.12} />
            <Stick t1={0} y1={pY + 0.02} t2={z0} y2={pY + 0.02} scaleRef={scaleRef} radius={0.025} material={mats.red} z={LADDER_Z + 0.2} />
            <MovingChip t={z0} y={pY + (drive === "top" ? -0.45 : 0.45)} scaleRef={scaleRef} className="jungle-cell bad">0 ← slid!</MovingChip>
            <Stick t1={pending.rung[0]} y1={yTop} t2={pending.rung[0]} y2={yBot} scaleRef={scaleRef} material={mats.red} />
            <MovingChip t={pending.rung[0]} y={drive === "top" ? yBot - 0.4 : yTop + 0.4} scaleRef={scaleRef} className="jungle-cell bad">
              {drive === "top" ? chipB(wrong.typed) : chipT(wrong.typed)}
            </MovingChip>
          </group>
        );
      })()}
    </group>
  );
}

/**
 * Ease a ladder scale toward `target` (top units at the right-hand end).
 * Returns the ref the ladder reads every frame.
 */
export function useLadderScale(target) {
  const ref = useRef(target);
  useFrame((_, dt) => {
    const a = 1 - Math.exp(-5 * dt);
    ref.current += (target - ref.current) * a;
  });
  return ref;
}

/**
 * THE TWO-STALL LADDER (best buys): ONE fruit vine in the middle shared by
 * both stalls, Stall A's dollars above it and Stall B's below — so a rung
 * for A climbs UP from the fruit vine and a rung for B hangs DOWN, and a
 * fruit amount both stalls have makes one tall gold rung straight through.
 * ladders = [{ L, rungs }, { L, rungs }] (L.top = the fruit, L.bottom = $).
 */
export function CompareLadder({
  ladders, ys, scaleRef, active, sel = [], pending = null, wrong = null, common = null, onTap, names, endTop, labels = true, called = null, better = null,
}) {
  const mats = useMats();
  const [yA, yF, yB] = ys;
  const fruit = ladders[0].L.top;
  const chipF = (t) => (fruit.kind === "count" ? vineChip(fruit, t) : fmtVal(fruit.kind, t));
  const money = (v) => fmtVal("money", v);
  const end = endTop || 1;
  // Fruit amounts on the middle vine (shared), staggered when crowded.
  const fruitVals = useMemo(() => {
    const vals = new Set();
    ladders.forEach((l) => l.rungs.forEach((r) => vals.add(r[0])));
    if (pending) vals.add(pending.rung[0]);
    const sorted = [...vals].sort((a, b) => a - b);
    const out = new Map();
    let prevX = -99, level = 0;
    for (const t of sorted) {
      const x = (t / end) * W;
      level = x - prevX < 1.05 ? 1 - level : 0;
      out.set(t, level);
      prevX = x;
    }
    return out;
  }, [ladders, pending, end]);
  const showWrong = wrong && pending && since(wrong.at) < 60;
  const toTop = (L, b) => (b * L.a) / L.b;
  return (
    <group>
      <Vine y={yA} mats={mats} />
      <Vine y={yF} mats={mats} />
      <Vine y={yB} mats={mats} />
      <ZeroPost ys={ys} mats={mats} label={labels} />
      <EndPost ys={ys} mats={mats} />
      {names && labels && names.map((n, i) => (
        <Chip key={i} position={[LX0 - 0.72, ys[i], LADDER_Z + 0.2]} df={9} style={NAME_STYLE} className={`jungle-vine-name${i === 1 || active === (i === 0 ? 0 : 1) ? "" : " dim"}`}>{n}</Chip>
      ))}
      {ladders.map((lad, li) => {
        const yM = li === 0 ? yA : yB;
        const dir = li === 0 ? 1 : -1;
        return lad.rungs.map(([t, b], i) => {
          const isCommon = common !== null && t === common;
          const selected = active === li && sel.includes(i);
          const glow = isCommon ? GOLD : selected ? SEL : null;
          const won = called !== null && better === li && isCommon;
          return (
            <group key={`${li}-${i}-${t}`}>
              <Bar t={t} y1={yF} y2={yM} scaleRef={scaleRef} glow={glow} onTap={onTap ? () => onTap(li, i) : undefined} />
              <MovingChip t={t} y={yM + dir * 0.4} scaleRef={scaleRef} className={`jungle-cell${isCommon ? " hit" : selected ? " sel" : ""}${won ? " best" : ""}`}>
                {money(b)}
              </MovingChip>
            </group>
          );
        });
      })}
      {[...fruitVals.entries()].map(([t, level]) => (
        <MovingChip key={`f${t}`} t={t} y={yF + (level ? -0.3 : 0.28)} dz={0.22} scaleRef={scaleRef} className={`jungle-cell small${common === t ? " hit" : ""}`}>
          {chipF(t)}
        </MovingChip>
      ))}
      {pending && !showWrong && (() => {
        const yM = pending.li === 0 ? yA : yB;
        const dir = pending.li === 0 ? 1 : -1;
        return (
          <group>
            <Bar t={pending.rung[0]} y1={yF} y2={yM} scaleRef={scaleRef} ask />
            <MovingChip t={pending.rung[0]} y={yM + dir * 0.4} scaleRef={scaleRef} className="jungle-cell ask">?</MovingChip>
          </group>
        );
      })()}
      {pending && showWrong && (() => {
        const L = ladders[pending.li].L;
        const yM = pending.li === 0 ? yA : yB;
        const dir = pending.li === 0 ? 1 : -1;
        const lim = (scaleRef.current || 1) * 1.08;
        const w = Math.max(-0.3, Math.min(lim, toTop(L, wrong.typed)));
        return (
          <group key={`w${wrong.at}`}>
            <Stick t1={pending.rung[0]} y1={yF} t2={w} y2={yM} scaleRef={scaleRef} material={mats.red} />
            <MovingChip t={w} y={yM + dir * 0.4} scaleRef={scaleRef} className="jungle-cell bad">{money(wrong.typed)}</MovingChip>
          </group>
        );
      })()}
    </group>
  );
}

/** A bamboo bar between two heights at top-value t (either order). */
function Bar({ t, y1, y2, scaleRef, glow, ask, onTap }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) ref.current.position.x = xOf(t, scaleRef.current);
  });
  const lo = Math.min(y1, y2), h = Math.abs(y2 - y1);
  const color = glow || (ask ? ASK : null);
  const tap = onTap ? (e) => { e.stopPropagation(); onTap(); } : undefined;
  return (
    <group ref={ref} position={[xOf(t, scaleRef.current), 0, LADDER_Z + 0.02]}>
      <mesh position={[0, lo + h / 2, 0]} castShadow onPointerDown={tap}>
        <cylinderGeometry args={[0.075, 0.075, h, 8]} />
        <meshStandardMaterial color={BAMBOO} roughness={0.6} emissive={color || "#000"} emissiveIntensity={color ? 0.55 : 0} transparent={Boolean(ask)} opacity={ask ? 0.55 : 1} />
      </mesh>
      <mesh position={[0, lo + h * 0.5, 0]}>
        <cylinderGeometry args={[0.088, 0.088, 0.05, 8]} />
        <meshStandardMaterial color={NODE} roughness={0.7} />
      </mesh>
      {tap && (
        <mesh position={[0, lo + h / 2, 0.05]} onPointerDown={tap}>
          <boxGeometry args={[0.5, h + 0.6, 0.3]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/**
 * The vine's right-hand end (top units): room for the rungs you have, and the
 * target too once it's within reach — otherwise the target flag waits at the
 * end post ("further along →") and the vine GROWS as your rungs get bigger
 * (a × 10 jump visibly zooms the vine out).
 */
export function ladderEnd(maxShown, goalTop, startTop) {
  const working = Math.max(maxShown * 1.5, (startTop || 1) * 5);
  if (goalTop && goalTop <= working) return niceEnd(Math.max(goalTop, maxShown));
  return niceEnd(Math.max(working, maxShown));
}

/** A tidy right-hand end for a set of top values (a "nice" round number). */
export function niceEnd(maxTop) {
  const want = Math.max(1, maxTop) * 1.12;
  const steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const p = Math.pow(10, Math.floor(Math.log10(want)));
  for (const s of steps) if (s * p >= want) return s * p;
  return 10 * p;
}
