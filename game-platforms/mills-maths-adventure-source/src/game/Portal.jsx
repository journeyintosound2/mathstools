import React, { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

import { playerState } from "./sessionStore.js";

import { getJungleTextures } from "./jungle/jungleMaterials.js";
import StaticBatch from "./jungle/StaticBatch.jsx";

/**
 * PORTAL (W2-C) — a Teleport Gate: a stone ring around a SOLID (non-transparent)
 * swirling blue interior that reads as a portal. Two counter-rotating rings of
 * arcs over a deep-blue disc create the swirl. Walking into it travels to another
 * region (the travel trigger lives in Player.jsx; the portal itself is passable —
 * no collider). Optional floating label shows the destination.
 *
 * When `locked` is true it is shown SHUT: the swirl is off, a wooden gate with a
 * padlock is drawn across the ring, and the label reads as locked. Used for the
 * Retrieval Practice Playground until Pip, Fern and Alby are each passed at ≥80%
 * (the travel is blocked in Player.jsx; this is the matching visual).
 */
export default function Portal({ position, rotationY = 0, label, locked = false, y = 0, labelRange = 0 }) {
  const spinA = useRef();
  const spinB = useRef();
  useFrame((_, dt) => {
    if (locked) return; // a locked gate doesn't swirl
    if (spinA.current) spinA.current.rotation.z += dt * 1.6;
    if (spinB.current) spinB.current.rotation.z -= dt * 1.05;
  });

  const [x, z] = position;
  const R = 1.7;
  const cy = R + 0.5; // portal centre height

  const arc = Math.PI * 1.35;
  const rings = [
    { r: R * 0.55, color: "#2a5fc0" },
    { r: R * 0.78, color: "#3f79dd" },
    { r: R * 0.96, color: "#6fa0f2" },
  ];

  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
      {/* Stone ring frame. */}
      <mesh position={[0, cy, 0]} castShadow>
        <torusGeometry args={[R + 0.06, 0.24, 14, 36]} />
        <meshStandardMaterial color="#37436b" metalness={0.35} roughness={0.55} />
      </mesh>

      {/* Interior disc — glowing blue when open, dim slate when locked. */}
      <mesh position={[0, cy, 0]}>
        <circleGeometry args={[R, 44]} />
        <meshStandardMaterial
          color={locked ? "#20242e" : "#0b2a6b"}
          emissive={locked ? "#000000" : "#123f8f"}
          emissiveIntensity={locked ? 0 : 0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {!locked && (
        <>
          {/* Swirl: two counter-rotating sets of arcs. */}
          <group ref={spinA} position={[0, cy, 0.02]}>
            {rings.map((rg, i) => (
              <mesh key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
                <torusGeometry args={[rg.r, 0.09, 8, 24, arc]} />
                <meshBasicMaterial color={rg.color} side={THREE.DoubleSide} />
              </mesh>
            ))}
          </group>
          <group ref={spinB} position={[0, cy, 0.04]}>
            {rings.map((rg, i) => (
              <mesh key={i} rotation={[0, 0, -((i * Math.PI) / 3) - 0.6]}>
                <torusGeometry args={[rg.r * 0.88, 0.06, 8, 24, arc]} />
                <meshBasicMaterial color="#9cc0ff" side={THREE.DoubleSide} />
              </mesh>
            ))}
          </group>

          {/* Bright core. */}
          <mesh position={[0, cy, 0.06]}>
            <circleGeometry args={[R * 0.28, 24]} />
            <meshBasicMaterial color="#cfe0ff" side={THREE.DoubleSide} />
          </mesh>
        </>
      )}

      {/* Wooden gate + padlock drawn across the ring when locked. */}
      {locked && <LockedGate R={R} cy={cy} />}

      {/* Base step. */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[R * 0.9, R + 0.1, 0.2, 28]} />
        <meshStandardMaterial color="#2a3350" />
      </mesh>

      {label && (
        <GateLabel at={[0, 2 * R + 1.0, 0]} x={x} z={z} range={labelRange}>
          <div className={`unlock-sign ${locked ? "locked" : "open"}`}>{locked ? "🔒" : "✦"} {label}</div>
        </GateLabel>
      )}
    </group>
  );
}

/**
 * A gate's floating destination label. `range` (metres, optional) shows it
 * only when the player is that close — on the big rebuilt island the five
 * gates are far apart, and labels floating over the hills from across the
 * map would clutter the view. 0 = always shown (the smaller regions).
 */
function GateLabel({ at, x, z, range = 0, children }) {
  const [show, setShow] = useState(!range);
  const last = useRef(!range);
  useFrame(() => {
    if (!range) return;
    const on = Math.hypot(playerState.x - x, playerState.z - z) < range;
    if (on !== last.current) { last.current = on; setShow(on); }
  });
  if (!show) return null;
  return (
    <Html position={at} center distanceFactor={16} className="ix-badge-anchor" zIndexRange={[24, 0]}>
      {children}
    </Html>
  );
}

/**
 * LOCKED GATE — a rustic wooden gate (two posts, three rails, a diagonal brace)
 * with a brass padlock, drawn across a Portal's ring while it is locked.
 */
function LockedGate({ R, cy }) {
  const WOOD = "#7a5230";
  const WOOD_DARK = "#5d3d22";
  const posts = [-(R + 0.28), R + 0.28];
  const rails = [cy - R * 0.72, cy, cy + R * 0.72];
  return (
    <group>
      {posts.map((px) => (
        <mesh key={px} position={[px, cy, 0.12]} castShadow>
          <boxGeometry args={[0.22, 2 * R + 0.7, 0.22]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
      ))}
      {rails.map((ry, i) => (
        <mesh key={i} position={[0, ry, 0.13]} castShadow>
          <boxGeometry args={[2 * R + 0.5, 0.2, 0.18]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      {/* Diagonal brace across the gate. */}
      <mesh position={[0, cy, 0.14]} rotation={[0, 0, 0.52]}>
        <boxGeometry args={[2 * R + 0.4, 0.16, 0.14]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      {/* Brass padlock in the middle. */}
      <group position={[0, cy, 0.34]}>
        <mesh castShadow>
          <boxGeometry args={[0.44, 0.36, 0.16]} />
          <meshStandardMaterial color="#d4af37" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <torusGeometry args={[0.16, 0.05, 10, 20, Math.PI]} />
          <meshStandardMaterial color="#b8bcc6" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Keyhole. */}
        <mesh position={[0, -0.02, 0.09]}>
          <circleGeometry args={[0.06, 16]} />
          <meshBasicMaterial color="#3a2c10" />
        </mesh>
      </group>
    </group>
  );
}

/**
 * HAYBALE PORTAL — an alternative Teleport-Gate look: two stacked-haybale pillars
 * with a hay lintel across the top (a gate formation), framed by tall grass that
 * WAVES in the breeze — an inviting "walk on through" doorway. Like Portal it is
 * passable (no collider); the walkable opening is the clear centre gap. Used for
 * the Fraction Farm gate (regions.js portal `variant: "haybale"`).
 */
const HAY = "#dcc06a";
const HAY_DARK = "#c9a94f";

// Bright, farm-warm portal palette for the Fraction Farm swirl (yellow/gold
// instead of the default blue) so it reads as sunny and "farm-like".
const HAY_SWIRL = {
  disc: "#7a5200",
  emissive: "#c8961e",
  inner: "#ffe6a3",
  core: "#fff6d5",
  arcs: ["#ffd23f", "#ffb300", "#ff9e00"],
};

function RoundBale({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.78, 0.78, 1.7, 16]} />
        <meshStandardMaterial color={HAY} />
      </mesh>
      {/* Darker end-cap rings so it reads as a coiled bale. */}
      {[0.86, -0.86].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 0.04, 16]} />
          <meshStandardMaterial color={HAY_DARK} />
        </mesh>
      ))}
    </group>
  );
}

// The swirling portal face (stone ring + solid disc + counter-rotating arcs +
// bright core), self-contained so it can drop into the haybale gate's opening.
// Two-sided, so it reads from either approach. `palette` recolours the swirl
// (default = blue); the farm gate passes a warm yellow/gold palette.
function PortalSwirl({ R = 1.05, palette }) {
  const pal = palette || {
    disc: "#0b2a6b", emissive: "#123f8f", inner: "#9cc0ff", core: "#cfe0ff",
    arcs: ["#2a5fc0", "#3f79dd", "#6fa0f2"],
  };
  const spinA = useRef();
  const spinB = useRef();
  useFrame((_, dt) => {
    if (spinA.current) spinA.current.rotation.z += dt * 1.6;
    if (spinB.current) spinB.current.rotation.z -= dt * 1.05;
  });
  const arc = Math.PI * 1.35;
  const rings = [
    { r: R * 0.55, color: pal.arcs[0] },
    { r: R * 0.78, color: pal.arcs[1] },
    { r: R * 0.96, color: pal.arcs[2] },
  ];
  return (
    <group>
      <mesh><torusGeometry args={[R + 0.06, 0.18, 14, 36]} /><meshStandardMaterial color="#37436b" metalness={0.35} roughness={0.55} /></mesh>
      <mesh><circleGeometry args={[R, 44]} /><meshStandardMaterial color={pal.disc} emissive={pal.emissive} emissiveIntensity={0.6} side={THREE.DoubleSide} /></mesh>
      <group ref={spinA} position={[0, 0, 0.02]}>
        {rings.map((rg, i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 3]}><torusGeometry args={[rg.r, 0.08, 8, 24, arc]} /><meshBasicMaterial color={rg.color} side={THREE.DoubleSide} /></mesh>
        ))}
      </group>
      <group ref={spinB} position={[0, 0, 0.04]}>
        {rings.map((rg, i) => (
          <mesh key={i} rotation={[0, 0, -((i * Math.PI) / 3) - 0.6]}><torusGeometry args={[rg.r * 0.88, 0.05, 8, 24, arc]} /><meshBasicMaterial color={pal.inner} side={THREE.DoubleSide} /></mesh>
        ))}
      </group>
      <mesh position={[0, 0, 0.06]}><circleGeometry args={[R * 0.28, 24]} /><meshBasicMaterial color={pal.core} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}

/**
 * IGLOO PORTAL — the Snowball Sums Teleport-Gate look: a snow-block igloo dome
 * with an entrance arch, the portal swirl glowing ICY BLUE in the doorway, and
 * ice crystals flanking the approach. Like the other portals it is passable
 * (no collider); walking into the doorway travels. Used for the snow-world
 * gate (regions.js portal `variant: "igloo"`).
 */
const ICE_BLOCK = "#eaf2fc";
const ICE_BLOCK_DARK = "#d3e2f4";

// Cold blue/cyan swirl palette so the doorway reads as a frozen portal.
const ICE_SWIRL = {
  disc: "#0b3550",
  emissive: "#15719c",
  inner: "#bdefff",
  core: "#eafcff",
  arcs: ["#4dd0e1", "#26c6da", "#00acc1"],
};

export function IglooPortal({ position, rotationY = 0, label, y = 0, labelRange = 0 }) {
  const [x, z] = position;
  const R = 2.9; // dome radius
  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
      {/* The dome — snow blocks suggested by flat shading + seam rings. */}
      <mesh castShadow>
        <sphereGeometry args={[R, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={ICE_BLOCK} flatShading />
      </mesh>
      {[[0.8, R * 0.94], [1.6, R * 0.76], [2.3, R * 0.5]].map(([y, r], i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.06, 6, 28]} />
          <meshStandardMaterial color={ICE_BLOCK_DARK} />
        </mesh>
      ))}

      {/* Entrance arch (front, +z): two block jambs + a lintel ring. */}
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[s * 1.35, 1.0, R - 0.55]}>
          <boxGeometry args={[0.7, 2.0, 0.9]} />
          <meshStandardMaterial color={ICE_BLOCK} flatShading />
        </mesh>
      ))}
      <mesh castShadow position={[0, 2.25, R - 0.55]} rotation={[0, 0, 0]}>
        <torusGeometry args={[1.35, 0.34, 8, 18, Math.PI]} />
        <meshStandardMaterial color={ICE_BLOCK_DARK} flatShading />
      </mesh>

      {/* The swirling portal face fills the doorway — icy blue. */}
      <group position={[0, 1.55, R - 0.35]}>
        <PortalSwirl R={1.02} palette={ICE_SWIRL} />
      </group>

      {/* Ice crystals flanking the approach. */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 2.6, 0, R - 0.4]} rotation={[0, s * 0.5, s * 0.1]}>
          <mesh castShadow position={[0, 0.75, 0]}>
            <coneGeometry args={[0.34, 1.5, 5]} />
            <meshStandardMaterial color="#9fdcf2" emissive="#59b8dd" emissiveIntensity={0.55} transparent opacity={0.92} flatShading />
          </mesh>
          <mesh castShadow position={[s * 0.4, 0.4, 0.15]} rotation={[0, 0.8, s * -0.35]}>
            <coneGeometry args={[0.2, 0.8, 5]} />
            <meshStandardMaterial color="#bfeafc" emissive="#6fc8e8" emissiveIntensity={0.45} transparent opacity={0.92} flatShading />
          </mesh>
        </group>
      ))}

      {/* A dusting of snow around the base. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0.6]}>
        <circleGeometry args={[R + 1.3, 26]} />
        <meshStandardMaterial color="#eef4fb" />
      </mesh>

      {label && (
        <GateLabel at={[0, R + 2.1, 0]} x={x} z={z} range={labelRange}>
          <div className="unlock-sign open">✦ {label}</div>
        </GateLabel>
      )}
    </group>
  );
}

export function HaybalePortal({ position, rotationY = 0, label, y = 0, labelRange = 0 }) {
  const [x, z] = position;
  const grassRefs = useRef([]);
  const blades = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2;
        // A ring of grass just inside/around the doorway opening.
        const r = 1.15 + (i % 3) * 0.18;
        return {
          x: Math.cos(a) * (r + 0.5),
          z: Math.sin(a) * r * 0.5 + 0.6,
          h: 0.8 + ((i * 7) % 5) * 0.16,
          phase: (i * 1.7) % (Math.PI * 2),
          col: ["#5fa855", "#6fb862", "#4e9b45", "#7cc26a"][i % 4],
        };
      }),
    []
  );
  // The blades are ONE instanced mesh (was 22 separate meshes + 22 shadow
  // draws): each instance pivots at its base and sways every frame.
  const bladeGeo = useMemo(() => new THREE.ConeGeometry(0.09, 1, 4).translate(0, 0.5, 0), []);
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), c: new THREE.Color() }), []);
  const setBladeColours = (el) => {
    grassRefs.current = el;
    if (!el) return;
    blades.forEach((b, i) => el.setColorAt(i, tmp.c.set(b.col)));
    if (el.instanceColor) el.instanceColor.needsUpdate = true;
  };
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const el = grassRefs.current;
    if (!el || !el.isInstancedMesh) return;
    blades.forEach((b, i) => {
      tmp.o.position.set(b.x, 0, b.z);
      tmp.o.rotation.set(Math.cos(t * 1.3 + b.phase) * 0.12, 0, Math.sin(t * 1.7 + b.phase) * 0.35);
      tmp.o.scale.set(1, b.h, 1);
      tmp.o.updateMatrix();
      el.setMatrixAt(i, tmp.o.matrix);
    });
    el.instanceMatrix.needsUpdate = true;
  });

  const pillars = [-1.95, 1.95];
  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
      {/* The bales never move: merged into a few draws (StaticBatch). */}
      <StaticBatch>
        {/* Two pillars of three stacked round bales (round face toward the yard). */}
        {pillars.map((sx) => (
          <group key={sx} position={[sx, 0, 0]}>
            <RoundBale position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]} />
            <RoundBale position={[0, 2.35, 0]} rotation={[Math.PI / 2, 0, 0]} />
            <RoundBale position={[0, 3.9, 0]} rotation={[Math.PI / 2, 0, 0]} />
          </group>
        ))}
        {/* Hay lintel: two bales lying across the top, spanning the opening. */}
        <RoundBale position={[-0.95, 4.95, 0]} rotation={[0, 0, Math.PI / 2]} />
        <RoundBale position={[0.95, 4.95, 0]} rotation={[0, 0, Math.PI / 2]} />
      </StaticBatch>
      {/* The swirling portal graphic in the opening — bright yellow/gold, so it
          reads as a warm, farm-like doorway. Sits in the centre gap. */}
      <group position={[0, 2.5, 0]}>
        <PortalSwirl R={1.05} palette={HAY_SWIRL} />
      </group>

      {/* Waving grass framing the doorway (base pivots so blades sway from the ground). */}
      <instancedMesh ref={setBladeColours} args={[bladeGeo, undefined, blades.length]} castShadow frustumCulled={false}>
        <meshStandardMaterial />
      </instancedMesh>

      {label && (
        <GateLabel at={[0, 6.4, 0]} x={x} z={z} range={labelRange}>
          <div className="unlock-sign open">✦ {label}</div>
        </GateLabel>
      )}
    </group>
  );
}

/**
 * VOLCANO PORTAL — the Magma Multiples Teleport-Gate look: a jagged BASALT
 * ARCH (stacked faceted rocks + a lintel slab) with the swirl glowing LAVA
 * RED in the doorway, glowing cracks, a little lava apron at its feet and two
 * flickering braziers. Used for BOTH ends (island → Magma Multiples and the
 * return gate), `variant: "volcano"` in regions.js. Passable like the others.
 */
const LAVA_SWIRL = {
  disc: "#4a0804",
  emissive: "#c41e0c",
  inner: "#ffc08a",
  core: "#fff1cf",
  arcs: ["#ff2f14", "#ff6420", "#ffa33a"],
};
const BASALT = "#3a2d2a";
const BASALT_DARK = "#2a201e";

function Brazier({ position }) {
  const flame = useRef();
  useFrame((state) => {
    if (!flame.current) return;
    const t = state.clock.elapsedTime + position[0];
    const s = 1 + Math.sin(t * 11) * 0.12 + Math.sin(t * 7.3) * 0.08;
    flame.current.scale.set(1, s, 1);
  });
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.16, 0.24, 0.9, 7]} />
        <meshStandardMaterial color={BASALT_DARK} flatShading />
      </mesh>
      <mesh castShadow position={[0, 0.98, 0]}>
        <cylinderGeometry args={[0.42, 0.26, 0.28, 8]} />
        <meshStandardMaterial color="#4b3a33" flatShading metalness={0.3} roughness={0.6} />
      </mesh>
      <group ref={flame} position={[0, 1.1, 0]}>
        <mesh position={[0, 0.32, 0]}>
          <coneGeometry args={[0.3, 0.75, 7]} />
          <meshBasicMaterial color="#ff7a1c" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <coneGeometry args={[0.17, 0.48, 7]} />
          <meshBasicMaterial color="#ffe08a" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

export function VolcanoPortal({ position, rotationY = 0, label, y = 0, labelRange = 0 }) {
  const [x, z] = position;
  // Each pillar = a stack of tilted faceted rocks (dodecahedra).
  const stack = (sx) => [
    { p: [sx * 1.75, 0.55, 0], s: 0.85, r: [0.3, 0.6, 0.1] },
    { p: [sx * 1.68, 1.55, 0.05], s: 0.72, r: [0.8, 0.2, 0.4] },
    { p: [sx * 1.6, 2.45, -0.05], s: 0.66, r: [0.1, 1.1, 0.7] },
    { p: [sx * 1.45, 3.25, 0], s: 0.6, r: [0.5, 0.4, 1.2] },
  ];
  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
      {[-1, 1].flatMap((sx) => stack(sx)).map((rk, i) => (
        <mesh key={i} castShadow position={rk.p} rotation={rk.r} scale={rk.s}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 2 ? BASALT : BASALT_DARK} flatShading roughness={0.9} />
        </mesh>
      ))}
      {/* Lintel slab across the top. */}
      <mesh castShadow position={[0, 3.95, 0]} rotation={[0, 0, 0.04]}>
        <boxGeometry args={[4.6, 0.8, 1.1]} />
        <meshStandardMaterial color={BASALT} flatShading roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.4, 4.45, 0.05]} rotation={[0.2, 0.3, 0.1]} scale={0.5}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={BASALT_DARK} flatShading />
      </mesh>
      {/* Glowing cracks down the pillars + lintel. */}
      {[[-1.72, 1.6, 0.62, 0.12, 2.6], [1.66, 1.4, 0.6, -0.1, 2.2], [0, 3.95, 0.56, 1.57, 3.4]].map(([cx, cy, cz, rot, len], i) => (
        <mesh key={`c${i}`} position={[cx, cy, cz]} rotation={[0, 0, rot]}>
          <boxGeometry args={[0.07, len, 0.04]} />
          <meshBasicMaterial color="#ff6a1a" toneMapped={false} />
        </mesh>
      ))}
      {/* The swirl — lava red. */}
      <group position={[0, 2.0, 0]}>
        <PortalSwirl R={1.15} palette={LAVA_SWIRL} />
      </group>
      {/* A small glowing lava apron under the arch. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0.2]}>
        <circleGeometry args={[1.55, 24]} />
        <meshBasicMaterial color="#ff5a14" toneMapped={false} transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0.2]}>
        <ringGeometry args={[1.5, 2.4, 24]} />
        <meshStandardMaterial color="#2b1d1a" />
      </mesh>
      <Brazier position={[-2.7, 0, 1.0]} />
      <Brazier position={[2.7, 0, 1.0]} />
      {label && (
        <GateLabel at={[0, 5.4, 0]} x={x} z={z} range={labelRange}>
          <div className="unlock-sign open">✦ {label}</div>
        </GateLabel>
      )}
    </group>
  );
}

/**
 * JUNGLE PORTAL — the Emerald Jungle Teleport-Gate look: a MOSSY STONE ARCH
 * (stacked carved blocks, moss caps, a glowing leaf keystone) with the swirl
 * glowing EMERALD GREEN in the doorway, vines trailing from the arch, big
 * jungle leaves and little glowing mushrooms at its feet. Used for BOTH ends
 * (island → Emerald Jungle and the return gate), `variant: "jungle"` in
 * regions.js. Passable like the others. `y` lifts it onto sloping ground.
 */
const JUNGLE_SWIRL = {
  disc: "#06331f",
  emissive: "#0f8a4a",
  inner: "#c4ffd6",
  core: "#efffef",
  arcs: ["#16a34a", "#4ade80", "#a3e635"],
};
const MOSS_STONE = "#8d8a76";
const MOSS_STONE_DARK = "#6c6a5a";
const MOSS = "#4f8a2e";

export function JunglePortal({ position, rotationY = 0, label, y = 0, labelRange = 0 }) {
  const [x, z] = position;
  const tex = getJungleTextures();
  const vineRefs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    vineRefs.current.forEach((v, i) => {
      if (v) v.rotation.z = Math.sin(t * 1.3 + i * 1.7) * 0.06;
    });
  });
  const blocks = useMemo(() => {
    const out = [];
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        out.push({ p: [sx * 1.95 + (i % 2 ? 0.04 : -0.04) * sx, 0.45 + i * 0.86, 0], s: [0.95 - i * 0.03, 0.82, 0.95], r: (i % 2 ? 0.05 : -0.04) });
      }
    }
    return out;
  }, []);
  const vines = useMemo(() => [-1.5, -0.9, -0.25, 0.4, 1.0, 1.6].map((vx, i) => ({ x: vx, len: 0.9 + ((i * 7) % 4) * 0.45 })), []);
  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
      {/* Pillars of carved, mossy stone blocks. */}
      {blocks.map((b, i) => (
        <group key={i} position={b.p} rotation={[0, b.r, 0]}>
          <mesh castShadow receiveShadow scale={b.s}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial map={tex.stoneMossy} color={i % 2 ? MOSS_STONE : MOSS_STONE_DARK} roughness={0.95} />
          </mesh>
          {/* Moss cap on each block. */}
          <mesh position={[0, b.s[1] / 2 + 0.03, 0]} scale={[b.s[0] * 1.02, 0.08, b.s[2] * 1.02]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={MOSS} roughness={1} />
          </mesh>
        </group>
      ))}
      {/* The arch: a ring of wedge stones over the doorway. */}
      {Array.from({ length: 9 }).map((_, i) => {
        const a = Math.PI * (i / 8);
        const r = 1.95;
        return (
          <mesh key={`a${i}`} castShadow position={[Math.cos(a) * r, 3.75 + Math.sin(a) * r * 0.82, 0]} rotation={[0, 0, a - Math.PI / 2]}>
            <boxGeometry args={[0.92, 0.78, 1.0]} />
            <meshStandardMaterial map={tex.stoneMossy} color={i % 2 ? MOSS_STONE : MOSS_STONE_DARK} roughness={0.95} />
          </mesh>
        );
      })}
      {/* Keystone with a glowing leaf glyph. */}
      <group position={[0, 5.5, 0.52]}>
        <mesh>
          <circleGeometry args={[0.36, 18]} />
          <meshBasicMaterial color="#9dff9a" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.01]} scale={[0.5, 0.9, 1]} rotation={[0, 0, 0.5]}>
          <circleGeometry args={[0.28, 12]} />
          <meshBasicMaterial color="#1f7a35" toneMapped={false} />
        </mesh>
      </group>
      {/* The swirl — emerald green. */}
      <group position={[0, 2.55, 0]}>
        <PortalSwirl R={1.42} palette={JUNGLE_SWIRL} />
      </group>
      {/* Vines trailing from the arch. */}
      {tex.vine && vines.map((v, i) => (
        <group key={`v${i}`} ref={(el) => (vineRefs.current[i] = el)} position={[v.x, 5.3 - Math.abs(v.x) * 0.55, 0.42]}>
          <mesh position={[0, -v.len / 2, 0]}>
            <planeGeometry args={[0.32, v.len]} />
            <meshStandardMaterial alphaMap={tex.vine} alphaTest={0.4} color="#5a9a3a" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      {/* Big jungle leaves + glowing mushrooms at the feet. */}
      {tex.bigleaf && [[-2.9, 0.6, 0.4, 0.5], [-2.6, 0.5, -0.6, 2.4], [2.8, 0.55, 0.5, -0.4], [2.7, 0.5, -0.5, -2.6]].map(([lx, ly, lz, ry], i) => (
        <mesh key={`l${i}`} position={[lx, ly, lz]} rotation={[-0.9, ry, 0]}>
          <planeGeometry args={[1.3, 1.3]} />
          <meshStandardMaterial alphaMap={tex.bigleaf} alphaTest={0.45} color="#3f8f34" side={THREE.DoubleSide} />
        </mesh>
      ))}
      {[[-2.3, 0.9], [2.4, 0.85], [-2.55, -0.7], [2.2, -0.8]].map(([mx, mz], i) => (
        <group key={`m${i}`} position={[mx, 0, mz]}>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 0.32, 6]} />
            <meshStandardMaterial color="#efe6d2" />
          </mesh>
          <mesh position={[0, 0.33, 0]} scale={[1, 0.6, 1]}>
            <sphereGeometry args={[0.17, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshBasicMaterial color="#7cf0ff" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* A soft mossy apron. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <circleGeometry args={[3.3, 28]} />
        <meshStandardMaterial color="#4f8a35" roughness={1} />
      </mesh>
      {label && (
        <GateLabel at={[0, 6.6, 0]} x={x} z={z} range={labelRange}>
          <div className="unlock-sign open">✦ {label}</div>
        </GateLabel>
      )}
    </group>
  );
}
