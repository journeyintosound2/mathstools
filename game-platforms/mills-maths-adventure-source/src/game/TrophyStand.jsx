import React, { Suspense, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

import { medalFor } from "../data/farm/farmRecords.js";

/**
 * TROPHY STAND (shared) — the teacher's trophy.glb cabinet with TEN pigeonhole
 * shelves (2 rows × 5) plus a grand-trophy top spot, with the dynamic cups
 * placed by MEASURING the cabinet's bounding box, exactly as built for the
 * Fraction Farm stand (FarmScenery TrophyShelf). Extracted here so OTHER
 * regions (Snowball Sums, and any future world) can render an IDENTICAL stand
 * without duplicating the self-calibrating placement maths.
 *
 * <TrophyStandAssembly position rotationY entries />
 *   entries = [{ key, percent }] in reading order (top row first, 5 per row).
 *   A slot renders gold/silver/bronze at ≥100/75/50%, else a small empty
 *   plinth. When EVERY slot is gold the grand trophy appears on top.
 *
 * NOTE: FarmScenery keeps its own copy wired to the live farm stores (it
 * re-renders the moment a set finishes). This shared version is driven purely
 * by the `entries` prop.
 */
const TROPHY_STAND_URL = `${import.meta.env.BASE_URL}models/trophy.glb`;
const TROPHY_STAND_SCALE = 1.5;
// The whole assembly is scaled up so the stand reads as a landmark. The cups
// are placed from the measured box, so they stay seated at any scale.
export const TROPHY_STAND_GROUP_SCALE = 5.2;
// Pigeonhole layout as FRACTIONS of the measured cabinet box (read directly
// off the decoded trophy.glb mesh — see the farm notes).
const PH_COLS = 5;
const PH_X_INSET = 0.12;   // horizontal inset of the outer columns
const PH_ROW_UPPER = 0.32; // upper shelf row (top of the middle divider)
const PH_ROW_LOWER = 0.12; // lower shelf row (top of the plinth)
const PH_Z_FRAC = 0.70;    // depth toward the front opening (0 back → 1 front)
const PH_CUP = 0.22;       // trophy size as a fraction of cabinet height
const GRAND_Y = 0.50;      // grand-trophy height (fraction from base) — top ledge
const GRAND_SCALE = 0.5;   // grand-trophy size as a fraction of cabinet height
try { useGLTF.preload(TROPHY_STAND_URL); } catch { /* ignore */ }

/** A compact trophy whose BASE sits at its own origin (y = 0). */
export function ShelfTrophy({ percent }) {
  const medal = medalFor(percent);
  if (!medal) {
    return (
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.1, 12]} />
        <meshStandardMaterial color="#9a8a76" />
      </mesh>
    );
  }
  return (
    <group>
      <mesh castShadow position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.13, 0.16, 0.11, 12]} />
        <meshStandardMaterial color="#7a6a56" />
      </mesh>
      <mesh castShadow position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.2, 0.1, 0.34, 14]} />
        <meshStandardMaterial color={medal.color} emissive={medal.color} emissiveIntensity={0.25} metalness={0.5} roughness={0.35} />
      </mesh>
      {[-0.22, 0.22].map((dx) => (
        <mesh key={dx} position={[dx, 0.31, 0]}>
          <torusGeometry args={[0.075, 0.025, 8, 14]} />
          <meshStandardMaterial color={medal.color} metalness={0.5} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/** The GRAND trophy — a large gold cup with a star. Base at y = 0. */
export function GrandTrophy() {
  const gold = "#ffd166";
  return (
    <group>
      <mesh castShadow position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.26, 0.32, 0.12, 16]} />
        <meshStandardMaterial color="#8a6a2a" />
      </mesh>
      <mesh castShadow position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.14, 16]} />
        <meshStandardMaterial color="#7a6a56" />
      </mesh>
      <mesh castShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.34, 0.14, 0.6, 18]} />
        <meshStandardMaterial color={gold} emissive={gold} emissiveIntensity={0.4} metalness={0.6} roughness={0.25} />
      </mesh>
      {[-0.36, 0.36].map((dx) => (
        <mesh key={dx} position={[dx, 0.56, 0]}>
          <torusGeometry args={[0.12, 0.035, 8, 16]} />
          <meshStandardMaterial color={gold} metalness={0.6} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, 0.92, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.04, 5]} />
        <meshStandardMaterial color={gold} emissive={gold} emissiveIntensity={0.6} metalness={0.6} roughness={0.2} />
      </mesh>
    </group>
  );
}

function TrophyStandModel({ onMeasured }) {
  const { scene } = useGLTF(TROPHY_STAND_URL);
  const ref = useRef();
  useLayoutEffect(() => {
    if (!ref.current || !onMeasured) return;
    ref.current.updateWorldMatrix(true, true);
    onMeasured(new THREE.Box3().setFromObject(ref.current));
  }, [scene, onMeasured]);
  return <primitive ref={ref} object={scene} scale={TROPHY_STAND_SCALE} />;
}

class StandErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { /* fall back silently */ }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function FallbackBench() {
  return (
    <group>
      {[-1.1, 1.1].map((dx) => (
        <mesh key={dx} castShadow position={[dx, 0.3, 0]}>
          <boxGeometry args={[0.22, 0.6, 0.7]} />
          <meshStandardMaterial color="#6b4f2a" />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.66, 0]}>
        <boxGeometry args={[3.0, 0.14, 0.9]} />
        <meshStandardMaterial color="#c98f4a" />
      </mesh>
    </group>
  );
}

export default function TrophyStandAssembly({ position, rotationY = 0, entries, groupScale = TROPHY_STAND_GROUP_SCALE, y = 0 }) {
  const [x, z] = position;
  const groupRef = useRef();
  const [box, setBox] = useState(null); // cabinet AABB in WORLD space

  // Convert the measured world-space box into this group's LOCAL frame, then
  // lay the 2×5 grid across the cabinet — fully self-fitting to the model.
  const placed = useMemo(() => {
    if (!box || !groupRef.current) return null;
    groupRef.current.updateWorldMatrix(true, false);
    const inv = new THREE.Matrix4().copy(groupRef.current.matrixWorld).invert();
    const local = new THREE.Box3();
    const v = new THREE.Vector3();
    for (const xx of [box.min.x, box.max.x]) {
      for (const yy of [box.min.y, box.max.y]) {
        for (const zz of [box.min.z, box.max.z]) {
          v.set(xx, yy, zz).applyMatrix4(inv);
          local.expandByPoint(v);
        }
      }
    }
    const w = local.max.x - local.min.x;
    const h = local.max.y - local.min.y;
    const dz = local.max.z - local.min.z;
    if (!(w > 0 && h > 0)) return null;
    const x0 = local.min.x + w * PH_X_INSET;
    const x1 = local.max.x - w * PH_X_INSET;
    const zFront = local.min.z + dz * PH_Z_FRAC;
    const cupScale = h * PH_CUP;
    const cups = entries.map((e, i) => {
      const col = i % PH_COLS;
      const row = Math.floor(i / PH_COLS); // 0 = upper, 1 = lower
      const px = x0 + (x1 - x0) * (col / (PH_COLS - 1));
      const py = local.min.y + h * (row === 0 ? PH_ROW_UPPER : PH_ROW_LOWER);
      return { key: e.key, percent: e.percent, px, py, pz: zFront, cupScale };
    });
    // Every slot gold → the grand trophy stands on top.
    const allGold = entries.length > 0 && entries.every((e) => {
      const m = medalFor(e.percent);
      return m && m.id === "gold";
    });
    const grand = {
      x: (local.min.x + local.max.x) / 2,
      y: local.min.y + h * GRAND_Y,
      z: local.min.z + dz * 0.5,
      scale: h * GRAND_SCALE,
    };
    return { cups, allGold, grand };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box, JSON.stringify(entries)]);

  return (
    <group ref={groupRef} position={[x, y, z]} rotation={[0, rotationY, 0]} scale={groupScale}>
      <StandErrorBoundary fallback={<FallbackBench />}>
        <Suspense fallback={<FallbackBench />}>
          <TrophyStandModel onMeasured={setBox} />
        </Suspense>
      </StandErrorBoundary>
      {placed && placed.cups.map(({ key, percent, px, py, pz, cupScale }) => (
        <group key={key} position={[px, py, pz]} scale={cupScale}>
          <ShelfTrophy percent={percent} />
        </group>
      ))}
      {placed && placed.allGold && (
        <group position={[placed.grand.x, placed.grand.y, placed.grand.z]} scale={placed.grand.scale}>
          <GrandTrophy />
        </group>
      )}
    </group>
  );
}
