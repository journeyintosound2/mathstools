import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useChests } from "./chestStore.js";

/**
 * THE TREASURE CHEST (2026-10-13 — Jeff: "upgrade the treasure chest (it is
 * the original treasure chest) and make it look open when it has been
 * opened"). A proper pirate chest, still all primitives (no assets):
 *
 *   • a planked wooden body with dark seams, iron-and-gold straps, brass
 *     corner caps, a little plinth of feet
 *   • a ROUNDED lid (half a barrel) with its own straps, hinged at the back
 *   • a brass lock plate with a keyhole; a glint winks on it while it's shut
 *   • OPENED: the lid swings back on its hinge (a springy little overshoot),
 *     a heap of gold coins + two gems shine inside under a warm glow, and
 *     sparkles drift up out of it — it stays open for the rest of the visit
 *
 * Which chests are open lives in `useChests` (game/interaction.js opens them),
 * so the 3D chest reacts the moment you take the coins.
 */
export { useChests };

const WOOD = "#9a5b2e";
const WOOD_DARK = "#6b3b1c";
const IRON = "#3e3a39";
const BRASS = "#e2b23c";
const OPEN_ANGLE = -1.95;

function Coin({ p, r = 0 }) {
  return (
    <mesh position={p} rotation={[Math.PI / 2 + r, 0, r * 2]}>
      <cylinderGeometry args={[0.085, 0.085, 0.025, 14]} />
      <meshStandardMaterial color="#ffd23f" emissive="#c98f12" emissiveIntensity={0.55} metalness={0.7} roughness={0.25} />
    </mesh>
  );
}

export default function TreasureChest({ color = WOOD, open = false }) {
  const lid = useRef();
  const glint = useRef();
  const sparks = useRef();
  const glow = useRef();
  const ang = useRef(open ? OPEN_ANGLE : 0);
  const vel = useRef(0);
  const shown = useRef(open ? 1 : 0);
  const wood = color && color !== "#f4a261" ? color : WOOD; // (the old data colour was a pale orange)

  // The coin heap: a fixed scatter.
  const coins = useMemo(() => {
    const out = [];
    for (let i = 0; i < 26; i++) {
      const a = i * 2.39996;
      const rr = 0.06 + 0.33 * Math.sqrt((i + 0.5) / 26);
      const x = Math.cos(a) * rr * 1.25;
      const z = Math.sin(a) * rr * 0.75;
      const y = 0.845 + 0.1 * (1 - rr / 0.39) + (i % 3) * 0.012; // heaped up over the rim
      out.push({ p: [x, y, z], r: ((i * 37) % 10) / 22 - 0.22 });
    }
    return out;
  }, []);
  const sparkSeeds = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ x: ((i * 0.37) % 1) - 0.5, z: ((i * 0.61) % 1) - 0.5, o: i / 8 })), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    // Springy lid: towards open / shut with a little overshoot.
    const target = open ? OPEN_ANGLE : 0;
    vel.current += ((target - ang.current) * 38 - vel.current * 7.5) * dt;
    ang.current += vel.current * dt;
    if (lid.current) lid.current.rotation.x = ang.current;
    shown.current += ((open ? 1 : 0) - shown.current) * Math.min(1, dt * 3);
    const t = state.clock.elapsedTime;
    if (glow.current) glow.current.intensity = shown.current * (1.6 + Math.sin(t * 3) * 0.25);
    if (glint.current) {
      const k = (t * 0.45) % 1;
      const s = !open && k < 0.12 ? Math.sin((k / 0.12) * Math.PI) : 0;
      glint.current.scale.setScalar(0.001 + s * 1.2);
      glint.current.rotation.z = t * 2;
    }
    if (sparks.current) {
      sparks.current.visible = shown.current > 0.05;
      sparks.current.children.forEach((m, i) => {
        const sd = sparkSeeds[i];
        const k = (t * 0.55 + sd.o) % 1;
        m.position.set(sd.x * 0.8 + Math.sin(t * 2 + i) * 0.06, 0.75 + k * 1.3, sd.z * 0.4);
        m.scale.setScalar((1 - k) * 0.9 * shown.current + 0.001);
        m.rotation.y = t * 3 + i;
      });
    }
  });

  const W = 1.25, H = 0.72, D = 0.86;
  return (
    <group>
      {/* Feet */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={`f${i}`} castShadow position={[sx * (W / 2 - 0.08), 0.05, sz * (D / 2 - 0.08)]}>
          <boxGeometry args={[0.16, 0.1, 0.16]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      {/* Body */}
      <mesh castShadow receiveShadow position={[0, 0.1 + H / 2, 0]}>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial color={wood} roughness={0.85} />
      </mesh>
      {/* Plank seams (front + back) */}
      {[0.26, 0.5].map((y) => [1, -1].map((s) => (
        <mesh key={`s${y}${s}`} position={[0, 0.1 + y, s * (D / 2 + 0.003)]}>
          <boxGeometry args={[W - 0.02, 0.018, 0.006]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      )))}
      {/* Top + bottom trim bands */}
      {[0.12, 0.1 + H - 0.03].map((y, i) => (
        <mesh key={`b${i}`} castShadow position={[0, y, 0]}>
          <boxGeometry args={[W + 0.04, 0.06, D + 0.04]} />
          <meshStandardMaterial color={IRON} metalness={0.6} roughness={0.45} />
        </mesh>
      ))}
      {/* Vertical straps */}
      {[-0.36, 0.36].map((x) => (
        <mesh key={`v${x}`} castShadow position={[x, 0.1 + H / 2, 0]}>
          <boxGeometry args={[0.1, H + 0.02, D + 0.05]} />
          <meshStandardMaterial color={IRON} metalness={0.6} roughness={0.45} />
        </mesh>
      ))}
      {/* Brass corner caps */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={`c${i}`} position={[sx * (W / 2), 0.1 + H / 2, sz * (D / 2)]}>
          <boxGeometry args={[0.08, H + 0.04, 0.08]} />
          <meshStandardMaterial color={BRASS} metalness={0.75} roughness={0.3} />
        </mesh>
      ))}
      {/* The dark mouth of the chest (the body is solid — this sits on its top)
          + the treasure heaped up over the rim */}
      <mesh position={[0, 0.1 + H + 0.004, 0]}>
        <boxGeometry args={[W - 0.12, 0.01, D - 0.12]} />
        <meshStandardMaterial color="#2a1a0e" />
      </mesh>
      <group visible={open}>
        <mesh position={[0, 0.1 + H, 0]} scale={[1.25, 0.34, 0.75]}>
          <sphereGeometry args={[0.42, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#f2c230" emissive="#b07a0c" emissiveIntensity={0.6} metalness={0.6} roughness={0.35} />
        </mesh>
        {coins.map((c, i) => <Coin key={i} p={c.p} r={c.r} />)}
        <mesh position={[-0.22, 0.98, 0.04]} rotation={[0.3, 0.4, 0]}>
          <octahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color="#e63946" emissive="#9d0208" emissiveIntensity={0.6} metalness={0.3} roughness={0.15} />
        </mesh>
        <mesh position={[0.25, 0.96, -0.05]} rotation={[0.2, 0.9, 0.3]}>
          <octahedronGeometry args={[0.08, 0]} />
          <meshStandardMaterial color="#4cc9f0" emissive="#0077b6" emissiveIntensity={0.6} metalness={0.3} roughness={0.15} />
        </mesh>
      </group>
      <pointLight ref={glow} position={[0, 1.1, 0.1]} color="#ffcf5a" intensity={0} distance={4.5} decay={2} />
      <group ref={sparks} visible={false}>
        {sparkSeeds.map((_, i) => (
          <mesh key={i}>
            <octahedronGeometry args={[0.05, 0]} />
            <meshBasicMaterial color="#fff2b0" toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* The rounded lid, hinged at the back top edge. */}
      <group ref={lid} position={[0, 0.1 + H, -D / 2]}>
        <group position={[0, 0, D / 2]}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[D / 2, D / 2, W, 24, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color={wood} roughness={0.85} />
          </mesh>
          {/* Lid ends */}
          {[-1, 1].map((s) => (
            <mesh key={`e${s}`} position={[s * (W / 2 + 0.001), 0, 0]} rotation={[0, s * Math.PI / 2, 0]}>
              <circleGeometry args={[D / 2, 24, 0, Math.PI]} />
              <meshStandardMaterial color={WOOD_DARK} side={2} />
            </mesh>
          ))}
          {/* Lid straps */}
          {[-0.36, 0.36].map((x) => (
            <mesh key={`ls${x}`} castShadow position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[D / 2 + 0.025, D / 2 + 0.025, 0.1, 24, 1, false, 0, Math.PI]} />
              <meshStandardMaterial color={IRON} metalness={0.6} roughness={0.45} side={2} />
            </mesh>
          ))}
          {/* Brass lock plate + keyhole (front, at the lid's lip) */}
          <group position={[0, -0.02, D / 2 + 0.02]}>
            <mesh>
              <boxGeometry args={[0.24, 0.3, 0.05]} />
              <meshStandardMaterial color={BRASS} metalness={0.8} roughness={0.25} />
            </mesh>
            <mesh position={[0, -0.03, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.02, 10]} />
              <meshStandardMaterial color="#1a1208" />
            </mesh>
            <mesh position={[0, -0.08, 0.03]}>
              <boxGeometry args={[0.025, 0.07, 0.02]} />
              <meshStandardMaterial color="#1a1208" />
            </mesh>
            {/* The glint that winks on a shut chest */}
            <mesh ref={glint} position={[0.07, 0.08, 0.05]}>
              <octahedronGeometry args={[0.07, 0]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
