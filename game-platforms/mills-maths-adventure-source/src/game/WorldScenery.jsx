import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { useProgress } from "../progress/store.js";
import { useSession } from "./sessionStore.js";
import { useUI } from "../ui/effects/uiStore.js";
import { WORLD_ZONES } from "../data/worldZones.js";
import { WORLD_LABELS } from "../data/worldLabels.js";
import { WORLD_LANDMARKS } from "../data/worldLandmarks.js";
import { getUnlockStates, isUnlockedById } from "../systems/unlockEngine.js";
import { resolveStudentGuidance, mainQuestSnapshot } from "../data/mainQuest.js";
import { useJourney, currentCoach } from "./journeyStore.js";
import { getInteractable } from "../data/interactables.js";
import { PLATEAU, STAIRS, getColliders } from "../data/worldColliders.js";
import { getBoundaryColliders } from "../data/worldBoundaries.js";
import { groundHeightAt } from "../systems/collisionEngine.js";
import { WORLD_BRIDGES } from "../data/worldBridges.js";

/**
 * WorldScenery (Phase 2H) — the data-driven world dressing for the larger map:
 *   - WorldPaths:     tan paths from the hub to each zone
 *   - WorldZones:     coloured topic patches + signs (locked zones show 🔒)
 *   - WorldLandmarks: themed low-poly props per zone
 *   - WorldUnlocks:   gates/bridges that open based on progress
 *   - GuidanceMarker: a subtle "go here" marker above the next objective
 * None of these own progression logic — they read pure data + derived state.
 */

const HUB = [0, 0];

// ---- Paths from the hub to each zone -------------------------------------

export function WorldPaths() {
  return (
    <>
      {WORLD_ZONES.filter((z) => z.id !== "zone-hub").map((z) => {
        // Start each path at the plaza plateau EDGE (not the raised centre) so
        // paths don't disappear under the plateau, then run out to the zone.
        const dx = z.center[0] - HUB[0];
        const dz = z.center[1] - HUB[1];
        const dist = Math.hypot(dx, dz) || 1;
        const ux = dx / dist;
        const uz = dz / dist;
        const sx = HUB[0] + ux * (PLATEAU.radius - 0.5);
        const sz = HUB[1] + uz * (PLATEAU.radius - 0.5);
        const len = Math.hypot(z.center[0] - sx, z.center[1] - sz);
        const yaw = Math.atan2(-(z.center[1] - sz), z.center[0] - sx);
        return (
          <mesh key={z.id} position={[(sx + z.center[0]) / 2, 0.02, (sz + z.center[1]) / 2]}
            rotation={[0, yaw, 0]}>
            <boxGeometry args={[len, 0.06, 3.0]} />
            <meshStandardMaterial color="#efe2bd" />
          </mesh>
        );
      })}
    </>
  );
}

// ---- Irregular coastline (W6-D) ------------------------------------------

// A natural, non-circular island: wavy grass + beach shapes drawn AROUND the
// (larger) walkable circle. The walkable bounds stay a clean circle for
// collision — the coast just wobbles out past where the player can actually go,
// so it reads as a natural shoreline without complicating movement.
export function IslandCoast({ grassColor, beachColor }) {
  const { grass, beach } = useMemo(() => {
    const mk = (base, amp) => {
      const s = new THREE.Shape();
      const N = 72;
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const r = base + amp * Math.sin(3 * a + 0.4) + amp * 0.5 * Math.sin(5 * a + 1.7) + amp * 0.3 * Math.sin(7 * a);
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
      }
      return s;
    };
    // grass min radius ≈ 42-3.4 ≈ 38.6 > WALKABLE_RADIUS (38), so the player
    // never reaches the wavy edge.
    return { grass: mk(42, 2.6), beach: mk(46, 3.2) };
  }, []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <shapeGeometry args={[beach]} />
        <meshStandardMaterial color={beachColor} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <shapeGeometry args={[grass]} />
        <meshStandardMaterial color={grassColor} />
      </mesh>
    </>
  );
}

// A soft vertex-coloured ring that blends a terrain patch (snow/ash) out into the
// grass, so the edge isn't a hard circle (W6). Inner = patch colour, outer = grass.
export function SnowEdge({ center, radius, grassColor, innerColor = "#eef4f8" }) {
  const geo = useMemo(() => {
    const inner = radius - 2, outer = radius + 6;
    const g = new THREE.RingGeometry(inner, outer, 72, 10);
    const snow = new THREE.Color(innerColor);
    const grass = new THREE.Color(grassColor);
    const pos = g.attributes.position;
    const colors = [];
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getY(i));
      const tt = Math.min(1, Math.max(0, (r - inner) / (outer - inner)));
      const col = snow.clone().lerp(grass, tt);
      colors.push(col.r, col.g, col.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return g;
  }, [radius, grassColor, innerColor]);
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[center[0], 0.015, center[1]]} receiveShadow>
      <meshStandardMaterial vertexColors />
    </mesh>
  );
}

// Scattered pebbles for the Fraction Volcano ash floor (deterministic; avoids
// Fern's centre + the volcano).
export function AshPebbles({ center, radius, count = 46 }) {
  const rocks = useMemo(() => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const a = (i * 2.399) % (Math.PI * 2); // golden-angle spread
      const r = Math.sqrt(((i + 0.5) / count)) * radius;
      const x = center[0] + Math.cos(a) * r;
      const z = center[1] + Math.sin(a) * r;
      if (Math.hypot(x - center[0], z - center[1]) < 3) continue; // keep Fern's spot clear
      out.push({ x, z, s: 0.12 + ((i * 13) % 10) / 40, rot: (i * 1.7) % Math.PI });
    }
    return out;
  }, [center, radius, count]);
  return (
    <group>
      {rocks.map((p, i) => (
        <mesh key={i} position={[p.x, p.s * 0.4, p.z]} rotation={[0, p.rot, 0]} scale={[p.s, p.s * 0.7, p.s]} castShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 3 === 0 ? "#8a8f96" : "#6f747b"} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// The Fraction Volcano with ANIMATED lava — a pulsing crater/flow glow plus lava
// drips that flow down the side into the pool.
function Volcano({ x, z, s }) {
  const R = 3.6, H = 5.4, TOP = 1.35; // TOP = flat crater-top radius
  const glowRefs = useRef([]);
  const dripRefs = useRef([]);
  const lip = [0.95, H - 0.12, 0.95]; // crater lip on the spill (pool) side
  const pool = [3.3, 0.15, 2.1];

  // The lava streak must lie ON the cone's slope (from the crater lip at the top
  // radius down to the base radius), not stick out. Compute its midpoint,
  // length and orientation once.
  const streak = useMemo(() => {
    const topP = new THREE.Vector3(TOP * 0.707, H - 0.1, TOP * 0.707);
    const baseP = new THREE.Vector3(R * 0.72, 0.1, R * 0.72);
    const mid = topP.clone().add(baseP).multiplyScalar(0.5);
    const dir = baseP.clone().sub(topP);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { mid: [mid.x, mid.y, mid.z], len: dir.length(), quat: [q.x, q.y, q.z, q.w] };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 1.2 + Math.sin(t * 3) * 0.5;
    glowRefs.current.forEach((m, i) => { if (m) m.emissiveIntensity = pulse + i * 0.1; });
    dripRefs.current.forEach((d, i) => {
      if (!d) return;
      const ph = (t * 0.35 + i / dripRefs.current.length) % 1;
      d.position.set(
        lip[0] + (pool[0] - lip[0]) * ph,
        lip[1] + (pool[1] - lip[1]) * ph,
        lip[2] + (pool[2] - lip[2]) * ph
      );
      d.scale.setScalar(0.18 * (1 - Math.abs(ph - 0.5)) + 0.06);
    });
  });

  return (
    <group position={[x, 0, z]} scale={[s, s, s]}>
      {/* TRUNCATED cone → a flat top that opens into the crater (no dark cap). */}
      <mesh castShadow position={[0, H / 2, 0]}><cylinderGeometry args={[TOP, R, H, 7]} /><meshStandardMaterial color="#5a3a2e" flatShading /></mesh>
      {/* recessed molten crater (glowing bowl + lava surface). */}
      <mesh position={[0, H - 0.3, 0]}><cylinderGeometry args={[1.15, 0.7, 0.6, 14]} /><meshStandardMaterial ref={(m) => (glowRefs.current[0] = m)} color="#ff6a1a" emissive="#ff3d00" emissiveIntensity={1.5} toneMapped={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, H - 0.06, 0]}><circleGeometry args={[1.12, 16]} /><meshStandardMaterial ref={(m) => (glowRefs.current[1] = m)} color="#ff8a2a" emissive="#ff5a00" emissiveIntensity={1.7} toneMapped={false} /></mesh>
      {/* lava streak lying flat on the cone's slope, from the lip to the base. */}
      <mesh position={streak.mid} quaternion={streak.quat}>
        <boxGeometry args={[0.85, streak.len, 0.14]} />
        <meshStandardMaterial ref={(m) => (glowRefs.current[2] = m)} color="#ff5a1a" emissive="#ff3d00" emissiveIntensity={1.3} toneMapped={false} />
      </mesh>
      {/* lava pool at the base to the right. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pool[0], 0.06, pool[2]]}>
        <circleGeometry args={[1.9, 24]} />
        <meshStandardMaterial ref={(m) => (glowRefs.current[3] = m)} color="#ff5a1a" emissive="#ff3d00" emissiveIntensity={1.1} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pool[0], 0.04, pool[2]]}><ringGeometry args={[1.9, 2.3, 24]} /><meshStandardMaterial color="#6e2a12" flatShading /></mesh>
      {/* animated lava drips spilling from the crater lip into the pool. */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(d) => (dripRefs.current[i] = d)} position={lip}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#ff6a2a" emissive="#ff3d00" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// ---- Plaza plateau + stairs (verticality) --------------------------------

export function WorldTerrain() {
  return (
    <>
      {/* raised plateau — a straight-edged box (W6-C) so the stairs sit flush. */}
      <mesh position={[PLATEAU.x, PLATEAU.height / 2, PLATEAU.z]} castShadow receiveShadow>
        <boxGeometry args={[PLATEAU.halfW * 2, PLATEAU.height, PLATEAU.halfD * 2]} />
        <meshStandardMaterial color="#8fd19e" />
      </mesh>
      {/* stair steps */}
      {STAIRS.map((s) => {
        const w = s.xMax - s.xMin;
        const d = s.zMax - s.zMin;
        return (
          <mesh key={s.id} position={[(s.xMin + s.xMax) / 2, s.height / 2, (s.zMin + s.zMax) / 2]}
            castShadow receiveShadow>
            <boxGeometry args={[w, s.height, d]} />
            <meshStandardMaterial color="#a7d8b0" />
          </mesh>
        );
      })}
    </>
  );
}

// ---- Algebra moat + arched bridge (W5-E) ---------------------------------

// A sea-water moat ringing Alby's Algebra island, with sandy banks on both
// shores. The bridge crosses it; the boundary colliders (invisible now) still
// seal the non-bridge arc. Water colour matches the ocean.
export function AlgebraMoat() {
  const zone = WORLD_ZONES.find((z) => z.id === "zone-algebra");
  if (!zone) return null;
  const [cx, cz] = zone.center;
  return (
    <group position={[cx, 0, cz]}>
      {/* inner sandy shore (Alby's island edge) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[6.6, 7.4, 48]} />
        <meshStandardMaterial color="#e7d29a" />
      </mesh>
      {/* the water channel */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[7.2, 10.6, 48]} />
        <meshStandardMaterial color="#3aa7dd" />
      </mesh>
      {/* outer sandy shore (main-island edge) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[10.4, 11.2, 48]} />
        <meshStandardMaterial color="#e7d29a" />
      </mesh>
    </group>
  );
}

// The arched bridge decks + rails (walk up-and-over). Deck planks sit at the
// same arch heights the ground-height uses, so the player's feet track the deck.
function Bridge({ b }) {
  const ax = b.from[0], az = b.from[1];
  const dx = b.to[0] - ax, dz = b.to[1] - az;
  const len = Math.hypot(dx, dz) || 1;
  const yaw = Math.atan2(dx, dz); // align plank depth (+Z) along the span
  const N = 18;
  const deckW = b.halfWidth * 2;
  const seg = len / N;
  const planks = [];
  for (let i = 0; i < N; i++) {
    const tm = (i + 0.5) / N;
    const h = b.apex * Math.sin(Math.PI * tm);
    planks.push({ x: ax + dx * tm, z: az + dz * tm, h });
  }
  return (
    <group>
      {planks.map((p, i) => (
        <group key={i} position={[p.x, p.h, p.z]} rotation={[0, yaw, 0]}>
          <mesh castShadow receiveShadow position={[0, 0.02, 0]}>
            <boxGeometry args={[deckW, 0.22, seg * 1.15]} />
            <meshStandardMaterial color={i % 2 ? "#b98a56" : "#c4965f"} />
          </mesh>
          {/* rail posts each side, every other plank */}
          {i % 2 === 0 && [-1, 1].map((s) => (
            <mesh key={s} castShadow position={[s * (b.halfWidth - 0.1), 0.55, 0]}>
              <boxGeometry args={[0.14, 1.0, 0.14]} />
              <meshStandardMaterial color="#8a5a34" />
            </mesh>
          ))}
        </group>
      ))}
      {/* two stone supports rising from the water to the deck */}
      {[0.34, 0.66].map((t, i) => {
        const x = ax + dx * t, z = az + dz * t;
        const h = b.apex * Math.sin(Math.PI * t);
        return (
          <mesh key={i} position={[x, h / 2, z]} castShadow>
            <boxGeometry args={[deckW * 0.7, h, 0.8]} />
            <meshStandardMaterial color="#9aa0a6" />
          </mesh>
        );
      })}
    </group>
  );
}

export function WorldBridges() {
  return <>{WORLD_BRIDGES.map((b) => <Bridge key={b.id} b={b} />)}</>;
}

// ---- Zone boundaries (rocks / cacti / river / hedge) ---------------------

function BoundaryProp({ c }) {
  const t = c.boundaryType;
  const r = c.radius;
  if (t === "rock") {
    return (
      <mesh position={[c.x, r * 0.55, c.z]} castShadow>
        <icosahedronGeometry args={[r, 0]} />
        <meshStandardMaterial color="#6b4f3a" flatShading />
      </mesh>
    );
  }
  if (t === "cactus") {
    return (
      <group position={[c.x, 0, c.z]}>
        <mesh position={[0, r, 0]} castShadow>
          <cylinderGeometry args={[r * 0.45, r * 0.5, r * 2, 8]} />
          <meshStandardMaterial color="#3a7d44" />
        </mesh>
        <mesh position={[r * 0.5, r * 1.1, 0]} castShadow>
          <boxGeometry args={[r * 0.7, r * 0.35, r * 0.35]} />
          <meshStandardMaterial color="#3a7d44" />
        </mesh>
      </group>
    );
  }
  if (t === "river" || t === "rail") {
    // The Algebra moat is now drawn as a continuous water channel + bank by
    // <AlgebraMoat/>, and bridge rails are invisible guides — so these blockers
    // render nothing (they stay as colliders).
    return null;
  }
  // hedge (default)
  return (
    <mesh position={[c.x, r * 0.6, c.z]} castShadow>
      <boxGeometry args={[r * 1.6, r * 1.2, r * 1.6]} />
      <meshStandardMaterial color="#40916c" />
    </mesh>
  );
}

export function WorldBoundaries() {
  const completedMissions = useProgress((s) => s.completedMissions);
  const earnedBadges = useProgress((s) => s.earnedBadges);
  const completedEncounters = useProgress((s) => s.completedEncounters);
  const cols = getBoundaryColliders({ completedMissions, earnedBadges, completedEncounters })
    .filter((c) => c.kind === "boundary"); // gate-fill is invisible (behind the arch)
  return <>{cols.map((c) => <BoundaryProp key={c.id} c={c} />)}</>;
}

// ---- Collision debug overlay (DevPanel toggle) ---------------------------

export function ColliderDebug() {
  const debug = useUI((s) => s.collisionDebug);
  const completedMissions = useProgress((s) => s.completedMissions);
  const earnedBadges = useProgress((s) => s.earnedBadges);
  const completedEncounters = useProgress((s) => s.completedEncounters);
  if (!debug) return null;
  const cols = getColliders({ completedMissions, earnedBadges, completedEncounters });
  return (
    <>
      {cols.map((c) => (
        <mesh key={c.id} rotation={[-Math.PI / 2, 0, 0]} position={[c.x, 0.12, c.z]}>
          <ringGeometry args={[Math.max(0.05, c.radius - 0.12), c.radius, 28]} />
          <meshBasicMaterial color={c.kind === "gate" ? "#dc2626" : "#ffffff"} transparent opacity={0.75} />
        </mesh>
      ))}
    </>
  );
}

// ---- Topic zones (patches + signs) ---------------------------------------

export function WorldZones() {
  const completedMissions = useProgress((s) => s.completedMissions);
  const earnedBadges = useProgress((s) => s.earnedBadges);
  const completedEncounters = useProgress((s) => s.completedEncounters);
  const snap = { completedMissions, earnedBadges, completedEncounters };

  return (
    <>
      {/* coloured ground patches */}
      {WORLD_ZONES.map((z) => (
        <mesh key={z.id} rotation={[-Math.PI / 2, 0, 0]} position={[z.center[0], 0.03, z.center[1]]}>
          <circleGeometry args={[z.radius, 44]} />
          <meshStandardMaterial color={z.color} transparent opacity={z.id === "zone-hub" ? 0.3 : 0.24} />
        </mesh>
      ))}

      {/* signs (data-driven from WORLD_LABELS; locked zones show a 🔒) */}
      {WORLD_LABELS.map((label) => {
        const [sx, sz] = label.position;
        const locked = label.unlockId && !isUnlockedById(label.unlockId, snap);
        return (
          <group key={label.id} position={[sx, 0, sz]}>
            <mesh castShadow position={[0, 0.7, 0]}>
              <boxGeometry args={[0.16, 1.4, 0.16]} />
              <meshStandardMaterial color="#8d6e63" />
            </mesh>
            <mesh castShadow position={[0, 1.4, 0]}>
              <boxGeometry args={[1.8, 0.6, 0.1]} />
              <meshStandardMaterial color={label.color} />
            </mesh>
            <Html position={[0, 2.1, 0]} center distanceFactor={16} className="ix-badge-anchor">
              <div className="zone-sign">{locked ? "🔒 " : ""}{label.text}</div>
            </Html>
          </group>
        );
      })}
    </>
  );
}

// ---- Themed landmarks -----------------------------------------------------

function Landmark({ data }) {
  const [x, z] = data.position;
  const s = data.scale || 1;
  const c = data.color || "#cccccc";
  const t = data.type;

  if (t === "fountain") {
    return (
      <group position={[x, 0, z]}>
        <mesh receiveShadow><cylinderGeometry args={[2.2, 2.4, 0.5, 24]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.9, 1.0, 1.0, 20]} /><meshStandardMaterial color={c} /></mesh>
        <mesh position={[0, 1.2, 0]}><sphereGeometry args={[0.5, 18, 18]} /><meshStandardMaterial color="#4cc9f0" /></mesh>
      </group>
    );
  }
  if (t === "dune") {
    return (
      <mesh position={[x, 0.1 * s, z]} scale={[s, s, s]} castShadow>
        <sphereGeometry args={[1.6, 16, 12]} />
        <meshStandardMaterial color={c} />
      </mesh>
    );
  }
  if (t === "snowdune") {
    // A rounded snow mound (half-sphere so it sits flush on the ground).
    return (
      <mesh position={[x, 0, z]} scale={[s * 1.7, s * 1.1, s * 1.7]} castShadow receiveShadow>
        <sphereGeometry args={[1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#eef4f8" />
      </mesh>
    );
  }
  if (t === "snowman") {
    return (
      <group position={[x, 0, z]} scale={[s, s, s]}>
        <mesh castShadow position={[0, 0.55, 0]}><sphereGeometry args={[0.6, 18, 16]} /><meshStandardMaterial color="#f7fbff" /></mesh>
        <mesh castShadow position={[0, 1.35, 0]}><sphereGeometry args={[0.42, 18, 16]} /><meshStandardMaterial color="#f7fbff" /></mesh>
        <mesh castShadow position={[0, 1.75, 0]}><sphereGeometry args={[0.3, 16, 14]} /><meshStandardMaterial color="#f7fbff" /></mesh>
        {/* carrot nose + coal eyes */}
        <mesh position={[0, 1.76, 0.3]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.06, 0.28, 8]} /><meshStandardMaterial color="#f4772e" /></mesh>
        <mesh position={[-0.11, 1.84, 0.25]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#20242c" /></mesh>
        <mesh position={[0.11, 1.84, 0.25]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#20242c" /></mesh>
        {/* little top hat */}
        <mesh position={[0, 1.98, 0]}><cylinderGeometry args={[0.02, 0.28, 0.04, 12]} /><meshStandardMaterial color="#20242c" /></mesh>
        <mesh position={[0, 2.12, 0]}><cylinderGeometry args={[0.2, 0.2, 0.28, 12]} /><meshStandardMaterial color="#20242c" /></mesh>
      </group>
    );
  }
  if (t === "xmastree") {
    return (
      <group position={[x, 0, z]} scale={[s, s, s]}>
        <mesh castShadow position={[0, 0.4, 0]}><cylinderGeometry args={[0.18, 0.22, 0.8, 8]} /><meshStandardMaterial color="#6b4f2a" /></mesh>
        <mesh castShadow position={[0, 1.2, 0]}><coneGeometry args={[1.1, 1.4, 10]} /><meshStandardMaterial color="#2f7d4f" /></mesh>
        <mesh castShadow position={[0, 1.95, 0]}><coneGeometry args={[0.85, 1.2, 10]} /><meshStandardMaterial color="#3a8f5a" /></mesh>
        <mesh castShadow position={[0, 2.6, 0]}><coneGeometry args={[0.6, 1.0, 10]} /><meshStandardMaterial color="#48a066" /></mesh>
        {/* snow caps + a star */}
        <mesh position={[0, 3.15, 0]}><sphereGeometry args={[0.12, 10, 10]} /><meshStandardMaterial color="#ffd166" emissive="#f4a017" emissiveIntensity={0.4} /></mesh>
      </group>
    );
  }
  if (t === "signpostPM") {
    return (
      <group position={[x, 0, z]}>
        <mesh castShadow position={[0, 0.9, 0]}><boxGeometry args={[0.16, 1.8, 0.16]} /><meshStandardMaterial color={c} /></mesh>
        <mesh position={[-0.55, 1.5, 0]}><boxGeometry args={[0.7, 0.5, 0.1]} /><meshStandardMaterial color="#2563eb" /></mesh>
        <mesh position={[0.55, 1.2, 0]}><boxGeometry args={[0.7, 0.5, 0.1]} /><meshStandardMaterial color="#dc2626" /></mesh>
        <Html position={[0, 2.2, 0]} center distanceFactor={16} className="ix-badge-anchor">
          <div className="zone-sign">+ / −</div>
        </Html>
      </group>
    );
  }
  if (t === "volcano") {
    return <Volcano x={x} z={z} s={s} />;
  }
  if (t === "crate") {
    return (
      <mesh position={[x, 0.6, z]} castShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color={c} />
      </mesh>
    );
  }
  if (t === "plot") {
    return (
      <group position={[x, 0, z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <planeGeometry args={[3.4, 2.4]} />
          <meshStandardMaterial color={c} />
        </mesh>
        {/* corner fence posts */}
        {[[-1.7, -1.2], [1.7, -1.2], [-1.7, 1.2], [1.7, 1.2]].map(([px, pz], i) => (
          <mesh key={i} position={[px, 0.35, pz]}><boxGeometry args={[0.14, 0.7, 0.14]} /><meshStandardMaterial color="#a98467" /></mesh>
        ))}
      </group>
    );
  }
  if (t === "palm") {
    return (
      <group position={[x, 0, z]}>
        <mesh castShadow position={[0, 1.1, 0]}><cylinderGeometry args={[0.16, 0.22, 2.2, 8]} /><meshStandardMaterial color="#8d6e63" /></mesh>
        <mesh position={[0, 2.3, 0]}><sphereGeometry args={[0.7, 12, 10]} /><meshStandardMaterial color={c} /></mesh>
      </group>
    );
  }
  if (t === "trophy") {
    return (
      <group position={[x, 0, z]} scale={[s, s, s]}>
        <mesh position={[0, 0.3, 0]}><boxGeometry args={[1.4, 0.6, 1.4]} /><meshStandardMaterial color="#6b4f2a" /></mesh>
        <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.7, 0.4, 1.2, 18]} /><meshStandardMaterial color={c} emissive="#d4a017" emissiveIntensity={0.4} /></mesh>
        <mesh position={[0, 2.0, 0]}><sphereGeometry args={[0.5, 16, 16]} /><meshStandardMaterial color={c} emissive="#d4a017" emissiveIntensity={0.4} /></mesh>
      </group>
    );
  }
  return null;
}

export function WorldLandmarks() {
  return (
    <>
      {WORLD_LANDMARKS.map((l) => <Landmark key={l.id} data={l} />)}
    </>
  );
}

// ---- Unlockable gates / bridges ------------------------------------------

export function WorldUnlocks() {
  // The gate / bridge ARCH structures + their ✓/🔒 labels were REMOVED (teacher
  // request). The world is open in free-play, so the arches were purely
  // decorative. The WORLD_UNLOCKS *data* is kept untouched — it still drives the
  // main-quest progression and the system checks; only the visuals are gone.
  return null;
}

// ---- "What next?" guidance marker ----------------------------------------

export function GuidanceMarker() {
  const completedMissions = useProgress((s) => s.completedMissions);
  const activeMissionId = useProgress((s) => s.activeMissionId);
  const missionProgress = useProgress((s) => s.missionProgress);
  const earnedBadges = useProgress((s) => s.earnedBadges);
  const completedEncounters = useProgress((s) => s.completedEncounters);
  const sageMet = useProgress((s) => s.sageMet);
  const championClaimed = useProgress((s) => s.championClaimed);
  const activeMission = useProgress((s) => s.activeMission);
  const modalOpen = useSession((s) => Boolean(s.activeEncounterId));
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) ref.current.position.y = 0.35 * Math.sin(state.clock.elapsedTime * 2.4);
  });

  const guide = resolveStudentGuidance(
    mainQuestSnapshot({
      completedMissions, earnedBadges, completedEncounters, sageMet, championClaimed,
      activeMissionId, missionProgress,
    }),
    activeMission
  );
  // The journey (2026-10-13): unless a teacher's task is steering, the
  // marker floats over the journey's next stop — Mills during the
  // training's "meet Mills" step, then the next island friend to pass.
  const journey = useProgress((s) => s.journey);
  const js = useJourney((s) => s.js);
  let targetId = guide.source === "mission" ? guide.targetId : null;
  if (!targetId && js) {
    const cc = currentCoach({ journey }, "island-1");
    if (cc && cc.key === "training:mills") targetId = "sage";
    else if (!js.trainingActive && js.goal.kind === "friends") targetId = js.goal.friendId;
  }
  const target = targetId ? getInteractable(targetId) : null;
  if (!target || modalOpen) return null;
  const [x, z] = target.position;

  return (
    <group position={[x, groundHeightAt(x, z) + 4.0, z]}>
      <group ref={ref}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.4, 0.8, 4]} />
          <meshStandardMaterial color="#ffd166" emissive="#f4a017" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  );
}
