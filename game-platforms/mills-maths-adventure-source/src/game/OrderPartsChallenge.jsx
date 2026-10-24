import React, { useRef, useMemo } from "react";
import DemoPoint from "./demo/DemoPoint.jsx";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

import { ORDER_GARDEN, orderSlotX } from "../data/farm/farmLayout.js";
import { useOrderParts } from "./orderPartsStore.js";

/**
 * ORDER THE PARTS — 3D layer (F4). The carrot garden: a tilled bed with a
 * row of 5 carrots, each carrying a value chip (fraction/decimal/percent).
 * Tap a carrot to lift it, tap another to swap the pair (they slide). On a
 * correct check the whole row PULLS OUT of the ground under a confetti
 * burst; on a miss the row shakes, then slides itself into the correct
 * ascending order (the reveal).
 *
 * When idle the bed shows a few decorative carrots so the garden never
 * looks bare. Store: game/orderPartsStore.js; maths: data/farm/
 * orderPartsChallenge.js; camera/player handling: Player.jsx orderMode.
 */

const ROW_Z = ORDER_GARDEN.z;
const SWAP_SPEED = 6; // slots per second-ish (lerp rate)

// ---- Confetti ---------------------------------------------------------------

const CONFETTI_COLORS = ["#e63946", "#f4a30a", "#2a9d2a", "#3a7bd5", "#9b5de5", "#ff70a6"];

export function ConfettiBurst({ origin }) {
  const group = useRef();
  const parts = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        pos: new THREE.Vector3((Math.random() - 0.5) * 10, 1 + Math.random() * 1.5, (Math.random() - 0.5) * 1.5),
        vel: new THREE.Vector3((Math.random() - 0.5) * 4, 5 + Math.random() * 4, (Math.random() - 0.5) * 3),
        spin: Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    []
  );
  const t = useRef(0);

  useFrame((_, dt) => {
    if (!group.current) return;
    t.current += dt;
    group.current.children.forEach((m, i) => {
      const p = parts[i];
      p.vel.y -= 12 * dt;
      p.pos.addScaledVector(p.vel, dt);
      m.position.copy(p.pos);
      m.rotation.x += p.spin * dt;
      m.rotation.z += p.spin * 0.7 * dt;
      m.visible = p.pos.y > -0.5 && t.current < 3;
    });
  });

  return (
    <group ref={group} position={origin}>
      {parts.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <planeGeometry args={[0.16, 0.16]} />
          <meshBasicMaterial color={p.color} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ---- Carrot -----------------------------------------------------------------

function Carrot({ item, slotIndex, decorative = false }) {
  const group = useRef();
  const anim = useRef({ x: orderSlotX(slotIndex), lift: 0, pull: 0 });

  const selectedId = useOrderParts((s) => s.selectedId);
  const status = useOrderParts((s) => s.status);
  const last = useOrderParts((s) => s.lastResult());
  const selected = !decorative && selectedId === item.id;
  const pulled = !decorative && status === "feedback" && last && last.grade.correct;
  const shaking = !decorative && status === "feedback" && last && !last.grade.correct;
  const shakeStart = useRef(0);

  useFrame((state, dt) => {
    if (!group.current) return;
    const a = anim.current;
    // Slide toward the current slot (swaps + the sorted reveal).
    const targetX = orderSlotX(slotIndex);
    a.x += (targetX - a.x) * Math.min(1, SWAP_SPEED * dt);
    // Lift while selected; PULL right out when the row is correct.
    const targetLift = selected ? 0.55 : 0;
    a.lift += (targetLift - a.lift) * Math.min(1, 8 * dt);
    if (pulled) a.pull = Math.min(1.6, a.pull + 2.2 * dt);
    else a.pull = Math.max(0, a.pull - 4 * dt);

    // Shake (decaying wiggle) on a wrong check.
    let shake = 0;
    if (shaking) {
      if (!shakeStart.current) shakeStart.current = state.clock.elapsedTime;
      const t = state.clock.elapsedTime - shakeStart.current;
      if (t < 0.6) shake = Math.sin(t * 40) * 0.12 * (1 - t / 0.6);
    } else {
      shakeStart.current = 0;
    }

    group.current.position.set(a.x + shake, a.lift + a.pull, ROW_Z);
    group.current.rotation.z = a.pull * 0.25; // a jaunty tilt as it comes free
  });

  return (
    <group ref={group} position={[orderSlotX(slotIndex), 0, ROW_Z]}>
      {!decorative && <DemoPoint name={`carrot-${item.id}`} position={[0, 0.45, 0]} />}
      {/* Leafy top (always visible). */}
      {[-0.14, 0, 0.14].map((dx, i) => (
        <mesh key={i} position={[dx, 0.42, i === 1 ? 0.1 : -0.05]} rotation={[0, 0, dx * 2.2]} castShadow>
          <coneGeometry args={[0.09, 0.55, 6]} />
          <meshStandardMaterial color="#3f9d3f" />
        </mesh>
      ))}
      {/* Carrot body — mostly buried; revealed as it lifts/pulls. */}
      <mesh position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.24, 0.9, 10]} />
        <meshStandardMaterial color="#ed7d1f" />
      </mesh>
      {/* Soil mound hides the buried part while in the ground. */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34, 12]} />
        <meshStandardMaterial color="#8a5a30" />
      </mesh>

      {!decorative && (
        <>
          {/* Enlarged invisible tap target. */}
          <mesh
            position={[0, 0.35, 0]}
            onPointerDown={(e) => {
              const st = useOrderParts.getState();
              if (st.status !== "ordering") return;
              e.stopPropagation();
              st.tapItem(item.id);
            }}
          >
            <sphereGeometry args={[0.95, 10, 10]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          {/* The value chip. */}
          <Html position={[0, 1.35, 0]} center distanceFactor={10} className="ix-badge-anchor" zIndexRange={[24, 0]}>
            <div className={`order-chip${selected ? " selected" : ""}`}>{item.display}</div>
          </Html>
        </>
      )}
    </group>
  );
}

// ---- The garden -------------------------------------------------------------

export default function OrderPartsChallenge() {
  const status = useOrderParts((s) => s.status);
  const arrangement = useOrderParts((s) => s.arrangement);
  const round = useOrderParts((s) => s.currentRound());
  const last = useOrderParts((s) => s.lastResult());
  const showConfetti = status === "feedback" && last && last.grade.correct;

  const { x, z, bedW, bedD, count } = ORDER_GARDEN;

  return (
    <group>
      {/* Tilled bed. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.014, z]} receiveShadow>
        <planeGeometry args={[bedW, bedD]} />
        <meshStandardMaterial color="#a97e50" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.017, z]} receiveShadow>
        <planeGeometry args={[bedW - 1, bedD - 1]} />
        <meshStandardMaterial color="#96683c" />
      </mesh>

      {/* Idle: decorative carrots. Playing: the challenge row (slot order
          comes from the store's arrangement). */}
      {status === "idle" || !round
        ? Array.from({ length: count }, (_, i) => (
            <Carrot key={`deco-${i}`} item={{ id: `deco-${i}` }} slotIndex={i} decorative />
          ))
        : arrangement.map((itemId, slotIndex) => {
            const item = round.items.find((it) => it.id === itemId);
            return item ? <Carrot key={item.id} item={item} slotIndex={slotIndex} /> : null;
          })}

      {showConfetti && <ConfettiBurst origin={[x, 0.5, z]} />}
    </group>
  );
}
