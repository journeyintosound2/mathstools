import React, { useRef, useMemo } from "react";
import DemoPoint from "./demo/DemoPoint.jsx";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import {
  CRATE_AREA,
  CRATE_PILES,
  CRATE_ROW,
  CRATE_SIZES,
  crateSlotX,
} from "../data/farm/farmLayout.js";
import { useCratePacking } from "./cratePackingStore.js";
import { ConfettiBurst } from "./OrderPartsChallenge.jsx";

/**
 * CRATE PACKING — 3D layer (F6, v2 after teacher feedback). The point of the
 * redesign: choosing a number means choosing a GROUP SIZE, and the split is
 * WATCHED, not imagined.
 *
 *   - Each pile is a neat, countable ARRAY of fruit (rows of 6) — quantity
 *     is visible, not just labelled.
 *   - Each choice crate shows its capacity as SOCKETS (dark slots) — crate
 *     "3" visibly has room for exactly 3.
 *   - Tapping a crate ANIMATES the division: fruit fly one after another
 *     into groups of that size laid out in front of the pile; anything that
 *     doesn't fit a full group tumbles out in front and glows red — the
 *     remainder, made physical.
 *
 * Store: game/cratePackingStore.js; maths: data/farm/cratePackingChallenge.js.
 */

const FRUIT_COLORS = ["#d94f3a", "#8fbf4d"]; // apples, pears
const CRATE_WOOD = "#b98a52";
const FRUIT_R = 0.24;
const ARRAY_COLS = 6;
const ARRAY_GAP = 0.56;
const FLY_SPEED = 7; // fruit travel speed during the grouping animation
const STAGGER = 0.05; // seconds between successive fruit launching

// Where fruit i of a pile sits in the countable ARRAY (rows of 6, filling
// away from the camera so the front row is always complete).
function arrayPos(i) {
  const col = i % ARRAY_COLS;
  const row = Math.floor(i / ARRAY_COLS);
  return [
    (col - (ARRAY_COLS - 1) / 2) * ARRAY_GAP,
    FRUIT_R,
    -row * ARRAY_GAP,
  ];
}

// Layout of one GROUP of `size` fruit: a compact grid (up to 4 wide).
function groupLocal(slot, size) {
  const cols = Math.min(size, 4);
  const col = slot % cols;
  const row = Math.floor(slot / cols);
  return [
    (col - (cols - 1) / 2) * 0.46,
    FRUIT_R + 0.06,
    (row - (Math.ceil(size / cols) - 1) / 2) * 0.46,
  ];
}

// Where group g of the split sits, in pile-local space. The FIRST rank sits
// just in front of the pile; further ranks stack NORTHWARD into the space
// the fruit array vacated (it is always empty during feedback) — so big
// splits can never spill down onto the choice-crate row.
function groupOrigin(g, size) {
  const cols = Math.min(size, 4);
  const groupW = cols * 0.46 + 0.5;
  const perRank = Math.max(2, Math.floor(5.8 / groupW));
  const col = g % perRank;
  const rank = Math.floor(g / perRank);
  return [
    (col - (perRank - 1) / 2) * groupW,
    0,
    1.4 - rank * (Math.ceil(size / cols) * 0.46 + 0.5),
  ];
}

// Where leftover fruit j EXPLODES to: scattered outward on the ground beside
// the pile (west of the apples, east of the pears — never behind anything).
// Deterministic golden-angle scatter so it looks chaotic but never overlaps.
const LEFTOVER_SIDE = [-1, 1]; // per pile index
function leftoverPos(j, pileIndex) {
  const a = j * 2.4 + pileIndex * 1.3;
  const r = 0.6 + (j % 4) * 0.38;
  return [
    LEFTOVER_SIDE[pileIndex] * 3.0 + Math.cos(a) * r,
    FRUIT_R,
    2.2 + Math.sin(a) * r * 0.8,
  ];
}

/** One animated pile: array while choosing → groups/leftovers on feedback. */
function AnimatedPile({ pileIndex, count, color, emoji }) {
  const [px, pz] = CRATE_PILES[pileIndex];
  const status = useCratePacking((s) => s.status);
  const last = useCratePacking((s) => s.lastResult());
  const grade = status === "feedback" && last ? last.grade : null;
  const plan = grade ? grade.plans[pileIndex] : null;
  const size = grade ? grade.chosen : 1;

  const fruitRefs = useRef([]);
  const anim = useRef({ started: 0 });

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (grade && !anim.current.started) anim.current.started = t;
    if (!grade) anim.current.started = 0;

    for (let i = 0; i < count; i++) {
      const m = fruitRefs.current[i];
      if (!m) continue;
      let target = arrayPos(i);
      if (grade && plan) {
        const launched = t - anim.current.started > i * STAGGER;
        if (launched) {
          const g = Math.floor(i / size);
          if (g < plan.crates) {
            const o = groupOrigin(g, size);
            const l = groupLocal(i % size, size);
            target = [o[0] + l[0], o[1] + l[1], o[2] + l[2]];
          } else {
            target = leftoverPos(i - plan.crates * size, pileIndex);
          }
        }
      }
      // Ease toward the target with a small arc while airborne.
      const dx = target[0] - m.position.x;
      const dy = target[1] - m.position.y;
      const dz = target[2] - m.position.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > 0.02) {
        const step = Math.min(1, (FLY_SPEED * dt) / dist);
        m.position.x += dx * step;
        m.position.y += dy * step + Math.min(dist, 1) * 0.35 * step; // hop
        m.position.z += dz * step;
      } else {
        m.position.set(target[0], target[1], target[2]);
      }
    }
  });

  const isLeftover = (i) => grade && plan && Math.floor(i / size) >= plan.crates;

  return (
    <group position={[px, 0, pz]}>
      <DemoPoint name={`crate-pile-${pileIndex}`} position={[0, 0.8, 0]} />
      {/* The fruit — one mesh each, animated between array/groups/spill. */}
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => { fruitRefs.current[i] = el; }}
          position={arrayPos(i)}
          castShadow
        >
          <sphereGeometry args={[FRUIT_R, 8, 8]} />
          <meshStandardMaterial
            color={color}
            emissive={isLeftover(i) ? "#d43f3f" : "#000000"}
            emissiveIntensity={isLeftover(i) ? 0.5 : 0}
          />
        </mesh>
      ))}

      {/* Group trays appear under each formed group on feedback. */}
      {grade && plan &&
        Array.from({ length: plan.crates }, (_, g) => {
          const o = groupOrigin(g, size);
          const cols = Math.min(size, 4);
          const w = cols * 0.46 + 0.28;
          const d = Math.ceil(size / cols) * 0.46 + 0.28;
          return (
            <mesh key={g} position={[o[0], 0.05, o[2]]} receiveShadow>
              <boxGeometry args={[w, 0.1, d]} />
              <meshStandardMaterial color={CRATE_WOOD} />
            </mesh>
          );
        })}

      {/* RED glow zone under the exploded leftovers — the remainder area. */}
      {grade && plan && plan.leftover > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LEFTOVER_SIDE[pileIndex] * 3.0, 0.03, 2.2]}>
          <circleGeometry args={[1.7, 24]} />
          <meshStandardMaterial color="#c0392b" emissive="#c0392b" emissiveIntensity={0.3} transparent opacity={0.55} />
        </mesh>
      )}

      {/* Per-pile confetti over the packed groups on a perfect split. */}
      {grade && grade.result === "hcf" && <ConfettiBurst origin={[0, 0.4, 2.2]} />}

      {/* BIG count chip: while choosing it sits IMMEDIATELY under its fruit
          pile; on feedback it floats HIGH above the pile so the story never
          covers the packed groups. */}
      <Html position={grade ? [0, 2.6, -1.2] : [0, 0.45, 1.15]} center distanceFactor={13} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div
          className={`fc-count-chip${grade ? (plan.leftover ? " bad" : " good") : ""}`}
        >
          {grade && plan
            ? `${count} = ${plan.crates} group${plan.crates === 1 ? "" : "s"} of ${size}${plan.leftover ? ` + ${plan.leftover} left over!` : ""}`
            : `${emoji} ${count} ${emoji === "🍎" ? "apples" : "pears"}`}
        </div>
      </Html>
    </group>
  );
}

/** One tappable choice crate — capacity shown as SOCKETS. */
function ChoiceCrate({ size, index }) {
  const group = useRef();
  const status = useCratePacking((s) => s.status);
  const last = useCratePacking((s) => s.lastResult());
  const isChosen = status === "feedback" && last && last.grade.chosen === size;
  const shake = isChosen && last.grade.result === "spill";
  const shakeStart = useRef(0);

  const cols = Math.min(size, 4);
  const rows = Math.ceil(size / cols);
  const w = Math.max(0.8, cols * 0.24 + 0.2);
  const d = Math.max(0.6, rows * 0.24 + 0.2);

  useFrame((state) => {
    if (!group.current) return;
    let dx = 0;
    if (shake) {
      if (!shakeStart.current) shakeStart.current = state.clock.elapsedTime;
      const t = state.clock.elapsedTime - shakeStart.current;
      if (t < 0.6) dx = Math.sin(t * 40) * 0.1 * (1 - t / 0.6);
    } else {
      shakeStart.current = 0;
    }
    group.current.position.x = crateSlotX(index) + dx;
    group.current.position.y = isChosen && !shake ? 0.22 : 0;
  });

  const highlight = isChosen
    ? last.grade.result === "hcf" ? "#2a9d2a" : last.grade.result === "common" ? "#d07a1f" : "#d43f3f"
    : null;

  return (
    <group ref={group} position={[crateSlotX(index), 0, CRATE_ROW.z]}>
      <DemoPoint name={`crate-size-${size}`} position={[0, 0.5, 0]} />
      {/* Tray floor + low walls, sized to its capacity. */}
      <mesh castShadow position={[0, 0.06, 0]}>
        <boxGeometry args={[w, 0.12, d]} />
        <meshStandardMaterial color={highlight || CRATE_WOOD} />
      </mesh>
      {[[-w / 2 + 0.03, 0, 0.06, d], [w / 2 - 0.03, 0, 0.06, d]].map(([sx, sz, sw, sd], i) => (
        <mesh key={`w${i}`} castShadow position={[sx, 0.2, sz]}>
          <boxGeometry args={[sw, 0.18, sd]} />
          <meshStandardMaterial color={highlight || CRATE_WOOD} />
        </mesh>
      ))}
      {[[-d / 2 + 0.03], [d / 2 - 0.03]].map(([sz], i) => (
        <mesh key={`e${i}`} castShadow position={[0, 0.2, sz]}>
          <boxGeometry args={[w, 0.18, 0.06]} />
          <meshStandardMaterial color={highlight || CRATE_WOOD} />
        </mesh>
      ))}
      {/* SOCKETS — one dark slot per space, so "3" visibly holds 3. */}
      {Array.from({ length: size }, (_, s) => {
        const c = s % cols;
        const r = Math.floor(s / cols);
        return (
          <mesh
            key={`s${s}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[(c - (cols - 1) / 2) * 0.24, 0.125, (r - (rows - 1) / 2) * 0.24]}
          >
            <circleGeometry args={[0.09, 10]} />
            <meshStandardMaterial color="#5a3d22" />
          </mesh>
        );
      })}
      {/* Enlarged invisible tap target. */}
      <mesh
        position={[0, 0.35, 0]}
        onPointerDown={(e) => {
          const st = useCratePacking.getState();
          if (st.status !== "choosing") return;
          e.stopPropagation();
          st.choose(size);
        }}
      >
        <sphereGeometry args={[0.85, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html position={[0, 1.05, 0]} center distanceFactor={11} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div className={`order-chip${isChosen ? " selected" : ""}`}>groups of {size}</div>
      </Html>
    </group>
  );
}

/** Idle HARVEST SCENE: big crates + fruit scattered across the ground, so
 *  the challenge area reads from a distance (teacher feedback). */
function HarvestScene() {
  const bits = useMemo(() => {
    const fruit = [];
    for (let i = 0; i < 22; i++) {
      const a = i * 2.399; // golden angle scatter
      const r = 1.2 + (i % 7) * 0.55;
      fruit.push({
        x: Math.cos(a) * r * 1.4,
        z: Math.sin(a) * r * 0.8,
        color: FRUIT_COLORS[i % 2],
      });
    }
    return fruit;
  }, []);
  const crates = [
    { p: [-2.6, 0.35, -1.8], s: 1.5, r: 0.2 },
    { p: [-1.4, 0.35, -2.6], s: 1.5, r: -0.4 },
    { p: [-2.0, 1.05, -2.2], s: 1.4, r: 0.9 }, // stacked
    { p: [2.8, 0.35, -2.0], s: 1.5, r: 0.5 },
    { p: [3.4, 0.3, -0.6], s: 1.3, r: 1.3 },
    { p: [0.6, 0.3, -3.0], s: 1.4, r: -0.9 },
  ];
  return (
    <group position={[CRATE_AREA.x, 0, CRATE_AREA.z]}>
      {crates.map((c, i) => (
        <mesh key={`c${i}`} position={c.p} rotation={[0, c.r, 0]} castShadow>
          <boxGeometry args={[c.s, 0.7, c.s * 0.75]} />
          <meshStandardMaterial color={CRATE_WOOD} />
        </mesh>
      ))}
      {bits.map((f, i) => (
        <mesh key={`f${i}`} position={[f.x, FRUIT_R, f.z]} castShadow>
          <sphereGeometry args={[FRUIT_R, 8, 8]} />
          <meshStandardMaterial color={f.color} />
        </mesh>
      ))}
    </group>
  );
}

export default function CratePackingChallenge() {
  const status = useCratePacking((s) => s.status);
  const round = useCratePacking((s) => s.currentRound());
  const last = useCratePacking((s) => s.lastResult());
  const shown = status === "feedback" && last ? last.round : round;

  // Stable key per round so fruit remount (and re-form the array) each round.
  const roundKey = useMemo(
    () => (shown ? `${shown.roundIndex}-${shown.n1}-${shown.n2}` : "idle"),
    [shown]
  );

  return (
    <group>
      {/* Idle (and the intro card moment): the harvest scene sets the stage. */}
      {(status === "idle" || status === "intro") && <HarvestScene />}

      {status !== "idle" && status !== "intro" && shown && (
        <group key={roundKey}>
          <AnimatedPile pileIndex={0} count={shown.n1} color={FRUIT_COLORS[0]} emoji="🍎" />
          <AnimatedPile pileIndex={1} count={shown.n2} color={FRUIT_COLORS[1]} emoji="🍐" />
          {CRATE_SIZES.map((size, i) => (
            <ChoiceCrate key={size} size={size} index={i} />
          ))}

          {/* In-world result chip — perfect splits only; wrong answers get
              the delayed shake + reason card from the panel instead. */}
          {status === "feedback" && last && last.grade.result === "hcf" && (
            <Html
              position={[CRATE_AREA.x, 3.4, CRATE_AREA.z + 1.5]}
              center
              distanceFactor={12}
              className="ix-badge-anchor"
              zIndexRange={[24, 0]}
            >
              <div
                className="unlock-sign open"
                style={{
                  borderColor:
                    last.grade.result === "hcf" ? "#2a9d2a" : last.grade.result === "common" ? "#d07a1f" : "#d43f3f",
                  fontSize: "1.05rem",
                }}
              >
                {`🎉 Biggest group! +${last.grade.points}`}
              </div>
            </Html>
          )}
        </group>
      )}
    </group>
  );
}
