import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { RANGE_AREA, RANGE_FRAME_POS, RANGE_CRATE_POS } from "../data/snow/snowLayout.js";
import { useSnowballRange } from "./snowballRangeStore.js";
import { ConfettiBurst } from "./OrderPartsChallenge.jsx";
import DemoPoint from "./demo/DemoPoint.jsx";
import { demoAnchor } from "./demo/demoAnchors.js";

/**
 * THE SNOWBALL RANGE — 3D layer (SR). A ten-frame snowball CRATE on a stand
 * in the south-east clearing, already partly packed; the student's handful
 * sits on a low sled in front with a DIVIDER they drag/tap through the row
 * (split BEFORE the throw is allowed). On the throw the first group flies
 * into the crate's empty sockets and the rest lands on the spare pile —
 * bridging to ten performed as a physical act. Under-fill leaves glowing
 * gaps; over-fill bounces snowballs off the full crate onto a red glow.
 * Correct typed total → confetti; wrong → shake + reason card (panel-paced).
 */

const WOOD = "#6e5a44";
const WOOD_DARK = "#57462f";
const SNOW_BALL = "#f4f8fd";
const AIMED = "#7fc8f0"; // snowballs aimed at the crate (left of the divider)
const SOCKET = "#2c3252"; // empty ten-frame sockets (dark in the twilight)
const GAP_GLOW = "#67e08a"; // under-fill: the gaps that still need filling
const BOUNCE_GLOW = "#e04747"; // over-fill: the bounced snowballs' glow
// The lit backing board behind the grid. The snow world is TWILIGHT and the
// snowballs are white — against bare wood on white snow neither the packed
// balls nor the empty sockets read from the camera distance. A warm, softly
// self-lit panel puts both in silhouette, the way a fairground booth does.
const BACKING = "#fdf3dc";
const LANTERN = "#ffcf7a";

const BALL_R = 0.34;

// The ten-frame crate: an upright 5×2 board facing the camera (south).
const FRAME_LOCAL = [RANGE_FRAME_POS[0] - RANGE_AREA.x, RANGE_FRAME_POS[1] - RANGE_AREA.z]; // [0, -3.5]
const CELL = 0.82;
const FRAME_W = CELL * 5 + 0.4;
const FRAME_H = CELL * 2 + 0.4;
const FRAME_Y = 1.95; // board centre height

// The handful row (a low sled between the player and the crate).
const ROW_Z = 1.2;
const ROW_Y = 0.55;

// The spare pile tray, off to the east of the crate — pushed clear of the
// widened frame so the two never overlap on screen.
const PILE_LOCAL = [4.3, -2.2];

// Scale of a PACKED ten-frame relative to the open one. Small enough that a
// 90s start (9 crates) still fits beside the frame, big enough that each
// crate's ten cells stay countable.
const MINI = 0.3;

// ---- The wall of packed tens, stacked WEST of the open frame ---------------
// Full crates are drawn as complete ten-frames (see PackedTenFrame) and
// stacked two-wide against the open frame's stand, growing upward. Up to 9
// crates (the biggest start is in the 90s) = 2 columns × 5 rows.
const MINI_W = (CELL * 5 + 0.74) * MINI; // a packed frame's outer width
const MINI_H = (CELL * 2 + 0.74) * MINI; // …and height
const STACK_GAP = 0.1;
const STACK_COLS = 2;
// Right edge of the wall, just clear of the open frame's surround.
const STACK_RIGHT = -(CELL * 5 + 0.74) / 2 - 0.3;

/** Local [x, y] centre of packed frame i — bottom row first, right to left. */
function packedPos(i) {
  const col = i % STACK_COLS;
  const row = Math.floor(i / STACK_COLS);
  return [
    STACK_RIGHT - MINI_W / 2 - col * (MINI_W + STACK_GAP),
    MINI_H / 2 + 0.25 + row * (MINI_H + STACK_GAP),
  ];
}

/** Local position of ten-frame cell i (0–9): top row first, west → east. */
function cellPos(i) {
  const col = i % 5;
  const row = Math.floor(i / 5);
  return [
    (col - 2) * CELL,
    FRAME_Y + (row === 0 ? CELL / 2 : -CELL / 2),
    0.24, // proud of the lit backing panel (z 0.02) and the grid bars (0.08)
  ];
}

/** Local position of spare-pile slot i (rows of 5 on the tray). */
function pilePos(i) {
  const col = i % 5;
  const row = Math.floor(i / 5);
  return [PILE_LOCAL[0] + (col - 2) * 0.58, BALL_R + 0.12, PILE_LOCAL[1] + row * 0.6];
}

/** How many snowballs ended up on the spare pile after a throw. */
function round0Rest(round, splitResult) {
  return Math.max(0, round.add - splitResult.firstCount);
}

/** Local position of bounced-ball i, scattered at the crate's base. */
function bouncePos(i) {
  const a = i * 2.4; // golden-angle-ish scatter
  const r = 0.5 + 0.22 * i;
  return [FRAME_LOCAL[0] + Math.cos(a) * r, BALL_R, FRAME_LOCAL[1] + 1.0 + Math.sin(a) * r * 0.5];
}

/** One snowball that eases from its row spot to a target after the throw. */
function ThrownBall({ from, to, delay, thrown, color, glow }) {
  const ref = useRef();
  const t0 = useRef(null);
  useFrame(() => {
    if (!ref.current) return;
    if (!thrown) {
      t0.current = null;
      ref.current.position.set(from[0], from[1], from[2]);
      return;
    }
    if (t0.current === null) t0.current = performance.now() + delay;
    const t = Math.max(0, Math.min(1, (performance.now() - t0.current) / 420));
    const e = t * t * (3 - 2 * t); // smoothstep
    const x = from[0] + (to[0] - from[0]) * e;
    const z = from[2] + (to[2] - from[2]) * e;
    const y = from[1] + (to[1] - from[1]) * e + Math.sin(Math.PI * e) * 1.6; // arc
    ref.current.position.set(x, y, z);
  });
  return (
    <group ref={ref} position={from}>
      <mesh castShadow>
        <sphereGeometry args={[BALL_R, 12, 10]} />
        <meshStandardMaterial
          color={color}
          emissive={glow || color}
          emissiveIntensity={glow ? 0.55 : 0.12}
        />
      </mesh>
    </group>
  );
}

/**
 * A PACKED crate of ten, drawn as a FULL ten-frame — the same 5×2 grid on the
 * same lit backing as the open crate, just smaller. That shape-match is the
 * whole point: 47 reads as four identical full frames plus one holding 7, so
 * the tens and the ones are the same unit seen twice. (It used to be a brown
 * box with a few loose snowballs on top, which read as "a crate" and told the
 * student nothing about ten.)
 */
function PackedTenFrame({ position }) {
  const w = CELL * 5 + 0.4;
  const h = CELL * 2 + 0.4;
  return (
    <group position={position} scale={[MINI, MINI, MINI]}>
      {/* Surround + lit panel, matching the open frame. */}
      <mesh castShadow position={[0, 0, -0.06]}>
        <boxGeometry args={[w + 0.34, h + 0.34, 0.14]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[w, h, 0.06]} />
        <meshStandardMaterial color={BACKING} emissive={BACKING} emissiveIntensity={0.42} />
      </mesh>
      {/* Grid bars. */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={`v${i}`} position={[(i - 2.5) * CELL, 0, 0.08]}>
          <boxGeometry args={[0.07, h, 0.07]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      {[-1, 0, 1].map((r) => (
        <mesh key={`h${r}`} position={[0, r * CELL, 0.08]}>
          <boxGeometry args={[w, 0.07, 0.07]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      {/* All ten cells packed — never any empty socket on a full crate. */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={i}
          castShadow
          position={[((i % 5) - 2) * CELL, (i < 5 ? CELL : -CELL) / 2, 0.24]}
        >
          <sphereGeometry args={[BALL_R, 12, 10]} />
          <meshStandardMaterial color={SNOW_BALL} emissive={SNOW_BALL} emissiveIntensity={0.12} />
        </mesh>
      ))}
    </group>
  );
}

/** A packed crate of ten for the IDLE dressing (no challenge running). */
function TenCrate({ position, small }) {
  const s = small ? 0.62 : 1;
  return (
    <group position={position} scale={[s, s, s]}>
      <mesh castShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[1.15, 0.7, 0.8]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} castShadow position={[(i % 3 - 1) * 0.3, 0.78, (Math.floor(i / 3) - 0.5) * 0.28]}>
          <sphereGeometry args={[0.16, 10, 8]} />
          <meshStandardMaterial color={SNOW_BALL} emissive={SNOW_BALL} emissiveIntensity={0.1} />
        </mesh>
      ))}
    </group>
  );
}

/** The upright ten-frame crate on its stand. */
function TenFrame({ round, status, splitResult, splitIndex, preview }) {
  const thrown = status !== "splitting";
  // Sockets 0..9: the first `ones` hold packed snowballs; the rest are the
  // empties the throw must fill. After a SHORT throw the still-empty gaps
  // glow green (the bridge made visible).
  const shortBy = thrown && splitResult && splitResult.short ? round.comp - splitResult.firstCount : 0;
  // AIM PREVIEW (unlocked after a first miss): while the divider is live, the
  // sockets the current split WOULD fill light up, so "three empty, I need
  // three" is something the student can see rather than have to hold. Capped
  // at the number of empties — an over-split lights them all and no more, and
  // the surplus is still a surprise on the throw.
  const aiming = preview && !thrown ? Math.min(splitIndex, round.comp) : 0;
  return (
    <group position={[FRAME_LOCAL[0], 0, FRAME_LOCAL[1]]}>
      {/* Stand legs + the board. */}
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[s * (FRAME_W / 2 - 0.15), FRAME_Y / 2, -0.05]}>
          <boxGeometry args={[0.14, FRAME_Y, 0.14]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      {/* The board: a wooden surround with a LIT cream panel inside it. The
          panel is what makes the frame readable in the twilight — white
          snowballs and dark empty sockets both sit against it in contrast. */}
      <mesh castShadow position={[0, FRAME_Y, -0.06]}>
        <boxGeometry args={[FRAME_W + 0.34, FRAME_H + 0.34, 0.14]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <mesh position={[0, FRAME_Y, 0.02]}>
        <boxGeometry args={[FRAME_W, FRAME_H, 0.06]} />
        <meshStandardMaterial color={BACKING} emissive={BACKING} emissiveIntensity={0.42} />
      </mesh>
      {/* A lantern on the crossbar washing the board — reads as "this is the
          thing to look at" without needing a floating label to say so. */}
      <group position={[0, FRAME_Y + FRAME_H / 2 + 0.5, 0.3]}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.4, 0.34]} />
          <meshStandardMaterial color={LANTERN} emissive={LANTERN} emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <coneGeometry args={[0.3, 0.24, 4]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
        <pointLight color={LANTERN} intensity={7} distance={9} decay={2} position={[0, -0.2, 0.2]} />
      </group>
      {/* Grid bars. */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={`v${i}`} position={[(i - 2.5) * CELL, FRAME_Y, 0.08]}>
          <boxGeometry args={[0.07, FRAME_H, 0.07]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      {[-1, 0, 1].map((r) => (
        <mesh key={`h${r}`} position={[0, FRAME_Y + r * CELL, 0.08]}>
          <boxGeometry args={[FRAME_W, 0.07, 0.07]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      {/* Demo hand targets (game/demo): the board + every cell. */}
      <DemoPoint name="range-frame" position={[0, FRAME_Y, 0.25]} />
      {Array.from({ length: 10 }, (_, i) => <DemoPoint key={`d${i}`} name={`range-cell-${i}`} position={cellPos(i)} />)}
      {/* Cells: packed snowballs + empty sockets (glowing when left short). */}
      {Array.from({ length: 10 }, (_, i) => {
        const p = cellPos(i);
        if (i < round.ones) {
          return (
            <mesh key={i} castShadow position={p}>
              <sphereGeometry args={[BALL_R, 12, 10]} />
              <meshStandardMaterial color={SNOW_BALL} emissive={SNOW_BALL} emissiveIntensity={0.12} />
            </mesh>
          );
        }
        // Empty socket. The LAST `shortBy` sockets stay unfilled after a
        // short throw — glow green to show the gaps.
        const glows = shortBy > 0 && i >= 10 - shortBy;
        // Sockets the live split would fill, counting from the first empty.
        const aimed = aiming > 0 && i < round.ones + aiming;
        const tint = glows ? GAP_GLOW : aimed ? AIMED : SOCKET;
        return (
          <mesh key={i} position={[p[0], p[1], 0.12]}>
            <sphereGeometry args={[BALL_R * 0.84, 12, 10]} />
            <meshStandardMaterial
              color={tint}
              emissive={tint}
              emissiveIntensity={glows ? 0.8 : aimed ? 0.65 : 0.2}
              transparent
              opacity={glows || aimed ? 0.95 : 0.85}
            />
          </mesh>
        );
      })}
      {/* Over-fill: a red glow disc where bounced snowballs land. */}
      {thrown && splitResult && !splitResult.correct && !splitResult.short && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 1.1]}>
          <circleGeometry args={[1.3, 24]} />
          <meshBasicMaterial color={BOUNCE_GLOW} transparent opacity={0.28} />
        </mesh>
      )}
    </group>
  );
}

/**
 * The wall of packed tens, its value chip, the open frame's value chip, and
 * the BRACE that ties them together.
 *
 * This is the fix for "the 47 sits above the 7 snowballs": the start number
 * is not one lump, it's `fullCrates` full frames PLUS the ones in the open
 * frame. Labelling each part and bracketing them as one quantity makes
 * 40 + 7 = 47 something the student can see rather than take on trust.
 */
function PackedTens({ round }) {
  const crates = Math.min(round.fullCrates, 9);
  // The brace spans from the far edge of the wall to the far edge of the open
  // frame, and sits below both.
  const leftEdge = crates > 0 ? packedPos(Math.min(crates, STACK_COLS) - 1)[0] - MINI_W / 2 : -(CELL * 5 + 0.74) / 2;
  const rightEdge = (CELL * 5 + 0.74) / 2;
  const braceY = 0.16;
  const braceMidX = (leftEdge + rightEdge) / 2;

  return (
    <group position={[FRAME_LOCAL[0], 0, FRAME_LOCAL[1]]}>
      {Array.from({ length: crates }, (_, i) => {
        const [x, y] = packedPos(i);
        return <PackedTenFrame key={i} position={[x, y, 0]} />;
      })}

      {/* "40" — the value of the wall, not a count of boxes. */}
      {crates > 0 && (
        <Html
          position={[packedPos(0)[0] - (crates > 1 ? (MINI_W + STACK_GAP) / 2 : 0), packedPos(Math.max(0, Math.min(crates, 9) - 1))[1] + MINI_H / 2 + 0.5, 0]}
          center
          distanceFactor={10}
          className="ix-badge-anchor"
          zIndexRange={[24, 0]}
        >
          <div className="fc-count-chip">{crates * 10}</div>
        </Html>
      )}

      {/* "7" — the ones sitting in the open frame, directly beneath it. */}
      <Html
        position={[0, FRAME_Y - FRAME_H / 2 - 0.55, 0.2]}
        center
        distanceFactor={10}
        className="ix-badge-anchor"
        zIndexRange={[24, 0]}
      >
        <div className="fc-count-chip">{round.ones}</div>
      </Html>

      {/* The brace: one bar under the wall AND the open frame, tagged with the
          start number, so the two parts read as a single quantity. */}
      {crates > 0 && (
        <>
          <mesh position={[braceMidX, braceY, 0.5]}>
            <boxGeometry args={[rightEdge - leftEdge, 0.09, 0.09]} />
            <meshStandardMaterial color={LANTERN} emissive={LANTERN} emissiveIntensity={0.6} />
          </mesh>
          {[leftEdge, rightEdge].map((x) => (
            <mesh key={x} position={[x, braceY + 0.14, 0.5]}>
              <boxGeometry args={[0.09, 0.28, 0.09]} />
              <meshStandardMaterial color={LANTERN} emissive={LANTERN} emissiveIntensity={0.6} />
            </mesh>
          ))}
          <Html
            position={[braceMidX, braceY - 0.45, 0.5]}
            center
            distanceFactor={9}
            className="ix-badge-anchor"
            zIndexRange={[24, 0]}
          >
            <div className="fc-count-chip">
              {crates * 10} + {round.ones} = {round.start}
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

/** The handful row + divider + tap/drag surface (Part A's whole interface). */
function HandfulRow({ round, status, splitIndex, splitResult }) {
  const dragging = useRef(false);
  const thrown = status !== "splitting";
  const spacing = Math.min(0.64, 6.6 / round.add);
  const rowW = spacing * round.add;

  const setFromPoint = (worldX) => {
    const g = Math.round((worldX - (RANGE_AREA.x - rowW / 2)) / spacing);
    useSnowballRange.getState().setSplit(g);
  };

  // Targets after the throw: aimed balls fill sockets (overflow bounces),
  // the rest arc onto the spare pile.
  const targets = useMemo(() => {
    if (!thrown || !splitResult) return null;
    const aimed = splitResult.firstCount;
    const out = [];
    let filled = 0;
    let bounced = 0;
    let piled = 0;
    for (let i = 0; i < round.add; i++) {
      if (i < aimed) {
        if (filled < round.comp) {
          const p = cellPos(round.ones + filled);
          out.push([FRAME_LOCAL[0] + p[0], p[1], FRAME_LOCAL[1] + p[2]]);
          filled++;
        } else {
          out.push(bouncePos(bounced++));
        }
      } else {
        out.push(pilePos(piled++));
      }
    }
    return out;
  }, [thrown, splitResult, round]);

  return (
    <group>
      {/* The low sled the handful sits on. */}
      <mesh castShadow position={[0, 0.32, ROW_Z]}>
        <boxGeometry args={[Math.max(rowW + 0.7, 2.4), 0.16, 1.0]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[s * (Math.max(rowW + 0.7, 2.4) / 2 - 0.2), 0.14, ROW_Z]}>
          <boxGeometry args={[0.12, 0.14, 1.05]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}

      {/* The snowballs (thrown balls animate to their targets). */}
      {Array.from({ length: round.add }, (_, i) => {
        const from = [-rowW / 2 + (i + 0.5) * spacing, ROW_Y, ROW_Z];
        const aimed = i < (thrown && splitResult ? splitResult.firstCount : splitIndex);
        const isBounced = thrown && splitResult && i < splitResult.firstCount && i >= round.comp;
        return (
          <ThrownBall
            key={`${round.roundIndex}-${i}`}
            from={from}
            to={targets ? targets[i] : from}
            delay={i * 110}
            thrown={thrown}
            color={aimed ? AIMED : SNOW_BALL}
            glow={isBounced ? BOUNCE_GLOW : null}
          />
        );
      })}

      {/* Demo hand targets: each gap the pole can stand in. */}
      {!thrown && Array.from({ length: round.add + 1 }, (_, g) => (
        <DemoPoint key={`g${g}`} name={`range-gap-${g}`} position={[-rowW / 2 + g * spacing, 1.3, ROW_Z]} />
      ))}

      {/* The divider — a candy-striped pole through the row. */}
      {!thrown && (
        <group ref={demoAnchor("range-pole")} position={[-rowW / 2 + splitIndex * spacing, 0, ROW_Z]}>
          <mesh castShadow position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.1, 8]} />
            <meshStandardMaterial color="#e04747" emissive="#e04747" emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[0, 1.48, 0]}>
            <sphereGeometry args={[0.12, 10, 8]} />
            <meshStandardMaterial color="#ffd166" emissive="#ffd166" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}

      {/* Tap/drag surface across the whole row (iPad-friendly). */}
      {!thrown && (
        <mesh
          position={[0, ROW_Y + 0.2, ROW_Z]}
          rotation={[-0.35, 0, 0]}
          onPointerDown={(e) => {
            e.stopPropagation();
            dragging.current = true;
            e.target.setPointerCapture?.(e.pointerId);
            setFromPoint(e.point.x);
          }}
          onPointerMove={(e) => {
            if (dragging.current) setFromPoint(e.point.x);
          }}
          onPointerUp={(e) => {
            dragging.current = false;
            e.target.releasePointerCapture?.(e.pointerId);
          }}
        >
          <planeGeometry args={[rowW + 2.4, 2.6]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* Split readout under the row: "2 + 4". Only while the divider is
          live — after the throw the snowballs themselves show the split and
          the equation chip above the crate carries the maths, so a second
          copy here is just another thing to read. */}
      {!thrown && (
        <Html position={[0, -0.15, ROW_Z + 0.9]} center distanceFactor={9.5} className="ix-badge-anchor" zIndexRange={[24, 0]}>
          <div className="fc-count-chip">
            {splitIndex} to the crate · {round.add - splitIndex} spare
          </div>
        </Html>
      )}
    </group>
  );
}

export default function SnowballRangeChallenge() {
  const status = useSnowballRange((s) => s.status);
  const shown = useSnowballRange((s) => s.currentRound());
  const splitIndex = useSnowballRange((s) => s.splitIndex);
  const splitResult = useSnowballRange((s) => s.splitResult);
  // Throws taken this round. Past the first, the sockets preview the fill —
  // the first attempt stays a clean assessment, the retry is scaffolded.
  const attempts = useSnowballRange((s) => s.attempts);
  const active = status !== "idle" && status !== "intro";

  // The running sentence above the crate — the ONE place the maths lives.
  // While typing after a good split it shows the TRANSFORMATION rather than
  // just the new pair, so the student can see 18 + 7 become 20 + 5 in a
  // single chip instead of holding the old sum in their head.
  let chip = null;
  if (active && shown) {
    if (status === "splitting" || status === "missed") chip = `${shown.start} + ${shown.add}`;
    else if (status === "celebrate") chip = `${shown.start} + ${shown.comp} + ${shown.rest} = ${shown.sum}`;
    else if (splitResult && splitResult.correct)
      chip = `${shown.start} + ${shown.add}  →  ${shown.nextTen} + ${shown.rest}`;
    else chip = `${shown.start} + ${shown.add}`;
  }

  return (
    <group position={[RANGE_AREA.x, 0, RANGE_AREA.z]}>
      {/* Idle dressing: the packed-crate stack + a waiting snowball pile.
          Hidden while a round runs — two brown boxes beside the wall of
          packed ten-frames read as MORE packed snowballs (audit 2026-09-28). */}
      {!active && (
        <group position={[RANGE_CRATE_POS[0] - RANGE_AREA.x, 0, RANGE_CRATE_POS[1] - RANGE_AREA.z]}>
          <TenCrate position={[0, 0, 0]} />
          <TenCrate position={[0.25, 0.78, 0.1]} small />
        </group>
      )}
      {!active && (
        <group position={[1.6, 0, 0.6]}>
          {[[0, 0], [0.5, 0.1], [0.25, 0.42]].map(([x, y], i) => (
            <mesh key={i} castShadow position={[x, BALL_R + y, 0]}>
              <sphereGeometry args={[BALL_R, 12, 10]} />
              <meshStandardMaterial color={SNOW_BALL} emissive={SNOW_BALL} emissiveIntensity={0.1} />
            </mesh>
          ))}
        </group>
      )}

      {active && shown && (
        <>
          <TenFrame
            round={shown}
            status={status}
            splitResult={splitResult}
            splitIndex={splitIndex}
            preview={attempts > 0}
          />

          {/* The wall of PACKED tens — each a complete ten-frame, so the tens
              and the ones are visibly the same unit. */}
          <PackedTens round={shown} />

          {/* Spare-pile tray. Its label only appears once snowballs actually
              land on it — an empty tray needs no caption. */}
          <mesh castShadow position={[PILE_LOCAL[0], 0.08, PILE_LOCAL[1] + 0.3]}>
            <boxGeometry args={[3.3, 0.16, 1.9]} />
            <meshStandardMaterial color={WOOD_DARK} />
          </mesh>
          {status !== "splitting" && splitResult && round0Rest(shown, splitResult) > 0 && (
            <Html position={[PILE_LOCAL[0], 1.15, PILE_LOCAL[1] + 1.1]} center distanceFactor={11} className="ix-badge-anchor" zIndexRange={[24, 0]}>
              <div className="fc-count-chip">spare pile</div>
            </Html>
          )}

          <HandfulRow round={shown} status={status} splitIndex={splitIndex} splitResult={splitResult} />

          {/* The running sentence above the crate. */}
          {chip && (
            <Html position={[FRAME_LOCAL[0], FRAME_Y + 1.6, FRAME_LOCAL[1]]} center distanceFactor={9.5} className="ix-badge-anchor" zIndexRange={[24, 0]}>
              <div className="milk-display snow-chip">{chip}</div>
            </Html>
          )}

          {status === "celebrate" && (
            <ConfettiBurst origin={[FRAME_LOCAL[0], FRAME_Y + 0.6, FRAME_LOCAL[1] + 0.4]} />
          )}
        </>
      )}
    </group>
  );
}
