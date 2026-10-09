import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { Chip } from "../../magma/stages/StageKit.jsx";

/**
 * Small set-dressing pieces for the jungle challenge stages: a thatched
 * fruit stall, a market stall with a striped awning, crates of fruit and a
 * monkey that reacts to a good swap. Primitive geometry in the soft-cartoon
 * style of the rest of the jungle.
 */

const FRUIT_COLOR = {
  banana: "#ffd43b", mango: "#ff8c2b", pineapple: "#f2b632", coconut: "#7a4b2a", avocado: "#5d8a2f",
  lemon: "#ffe14d", "kiwi fruit": "#8a6a3c", grapes: "#7b3fa0", cherries: "#c81e3a", strawberries: "#e5383b", nuts: "#b88a52",
};
export const fruitColor = (one) => FRUIT_COLOR[one] || "#f4a261";

/** A pile of round fruit (n pieces) in a little crate. */
export function FruitCrate({ position, color, n = 9, scale = 1 }) {
  const pieces = [];
  const per = Math.max(1, Math.ceil(Math.sqrt(n)));
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / per), c = i % per;
    pieces.push([(c - (per - 1) / 2) * 0.2, 0.32 + Math.floor(i / (per * per)) * 0.16 + (r % 2) * 0.02, (r - (per - 1) / 2) * 0.18]);
  }
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.78, 0.28, 0.62]} />
        <meshStandardMaterial color="#9c6b3c" roughness={0.9} />
      </mesh>
      {pieces.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <sphereGeometry args={[0.1, 9, 7]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

/** A bamboo-framed fruit stall with a leaf-thatch roof (local origin = counter front centre). */
export function ThatchStall({ position, rotation = 0, width = 3.2, children }) {
  const poles = [[-width / 2, -0.7], [width / 2, -0.7], [-width / 2, 0.5], [width / 2, 0.5]];
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {poles.map(([x, z], i) => (
        <mesh key={i} position={[x, 1.45, z]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 2.9, 7]} />
          <meshStandardMaterial color="#c9b458" roughness={0.7} />
        </mesh>
      ))}
      {/* Counter */}
      <mesh position={[0, 0.5, 0.25]} castShadow receiveShadow>
        <boxGeometry args={[width, 1.0, 0.7]} />
        <meshStandardMaterial color="#8a5a32" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.03, 0.25]}>
        <boxGeometry args={[width + 0.12, 0.08, 0.82]} />
        <meshStandardMaterial color="#b07a44" roughness={0.85} />
      </mesh>
      {/* Thatch roof: two leaf slopes */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 3.05, -0.1 + s * 0.42]} rotation={[s * 0.62, 0, 0]} castShadow>
          <boxGeometry args={[width + 0.6, 0.12, 1.15]} />
          <meshStandardMaterial color={s > 0 ? "#6b8e23" : "#55761b"} roughness={0.95} flatShading />
        </mesh>
      ))}
      {children}
    </group>
  );
}

/** A market stall with a striped awning. */
export function AwningStall({ position, rotation = 0, width = 3.0, stripes = ["#f4a261", "#fff3d6"], children }) {
  const n = 7;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[[-width / 2, -0.55], [width / 2, -0.55], [-width / 2, 0.55], [width / 2, 0.55]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.35, z]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 2.7, 6]} />
          <meshStandardMaterial color="#e9e2cf" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[width, 1.0, 0.75]} />
        <meshStandardMaterial color="#d8c39a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.03, 0.2]}>
        <boxGeometry args={[width + 0.1, 0.07, 0.86]} />
        <meshStandardMaterial color="#a0794b" roughness={0.8} />
      </mesh>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[-width / 2 + (width / n) * (i + 0.5), 2.78, 0.1]} rotation={[0.35, 0, 0]} castShadow>
          <boxGeometry args={[width / n, 0.06, 1.5]} />
          <meshStandardMaterial color={stripes[i % 2]} roughness={0.8} />
        </mesh>
      ))}
      {children}
    </group>
  );
}

/** A little monkey (sitting); `cheer` = a timestamp for a happy hop. */
export function Monkey({ position, rotation = 0, cheer = 0, holding = null }) {
  const ref = useRef();
  const t0 = useRef(Math.random() * 10);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    t0.current += dt;
    const since = cheer ? (Date.now() - cheer) / 1000 : 99;
    const hop = since < 1.6 ? Math.abs(Math.sin(since * Math.PI * 2.5)) * 0.35 * (1 - since / 1.6) : 0;
    g.position.y = position[1] + hop + Math.sin(t0.current * 2.2) * 0.015;
    g.rotation.z = since < 1.6 ? Math.sin(since * 10) * 0.12 : Math.sin(t0.current * 0.8) * 0.04;
  });
  const fur = "#7a4a2a", face = "#e8c39e";
  return (
    <group ref={ref} position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.28, 0]} scale={[1, 1.15, 0.9]} castShadow>
        <sphereGeometry args={[0.24, 12, 10]} />
        <meshStandardMaterial color={fur} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.27, 0.16]} scale={[0.8, 0.95, 0.5]}>
        <sphereGeometry args={[0.17, 10, 8]} />
        <meshStandardMaterial color={face} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.66, 0.02]} castShadow>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshStandardMaterial color={fur} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.63, 0.15]} scale={[1.1, 0.8, 0.6]}>
        <sphereGeometry args={[0.13, 10, 8]} />
        <meshStandardMaterial color={face} roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.2, 0.7, 0]} scale={[0.6, 1, 0.4]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial color={face} roughness={0.9} />
          </mesh>
          <mesh position={[s * 0.06, 0.68, 0.24]}>
            <sphereGeometry args={[0.025, 6, 5]} />
            <meshStandardMaterial color="#1b1b1b" />
          </mesh>
          <mesh position={[s * 0.22, 0.32, 0.08]} rotation={[0.6, 0, s * 0.5]}>
            <capsuleGeometry args={[0.055, 0.22, 4, 6]} />
            <meshStandardMaterial color={fur} roughness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.05, 0.12, -0.24]} rotation={[0, Math.PI / 2, 0.4]}>
        <torusGeometry args={[0.2, 0.035, 6, 14, Math.PI * 1.3]} />
        <meshStandardMaterial color={fur} roughness={0.9} />
      </mesh>
      {holding && (
        <mesh position={[0, 0.42, 0.3]}>
          <sphereGeometry args={[0.11, 9, 7]} />
          <meshStandardMaterial color={holding} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}

/** A hanging wooden sign with a chip on it. */
export function SignBoard({ position, children, className = "jungle-sign", df = 9, width = 1.9, show = true }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[width, 0.55, 0.06]} />
        <meshStandardMaterial color="#6b4423" roughness={0.9} />
      </mesh>
      {show && <Chip position={[0, 0, 0.08]} df={df} className={className}>{children}</Chip>}
    </group>
  );
}
