import React, { Suspense, useMemo, useRef } from "react";
import DemoPoint from "./demo/DemoPoint.jsx";
import { useFrame } from "@react-three/fiber";
import { Html, useGLTF, useAnimations } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";

import {
  TRADE_AREA,
  TRADE_STALL_OFFSETS,
  TRADE_TABLE_OFFSET,
} from "../data/farm/farmLayout.js";
import { TRADE_STALL_NAMES } from "../data/farm/tradingPostChallenge.js";
import { modelConfig, modelUrl } from "./characters/characterModels.js";
import { useTradingPost } from "./tradingPostStore.js";
import { ConfettiBurst } from "./OrderPartsChallenge.jsx";

// The stall keepers are all the SAME farmer.glb, and three render at once, so
// each instance needs its OWN cloned scene (SkeletonUtils) to animate
// independently. Preload it once.
const FARMER_CFG = modelConfig("farmer");
try { useGLTF.preload(modelUrl(FARMER_CFG.file)); } catch { /* ignore */ }

/**
 * A rigged farmer, cloned per stall so three can animate at once. Plays the
 * WALK clip while `movingRef.current` is true (walking out / back), else idle.
 * Falls back to nothing (the primitive keeper is rendered behind it) until it
 * loads. Always faces the camera; the keeper group handles position.
 */
function RiggedFarmer({ movingRef }) {
  const cfg = FARMER_CFG;
  const { scene, animations } = useGLTF(modelUrl(cfg.file));
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const ref = useRef();
  const { actions, names } = useAnimations(animations, ref);
  const currentClip = useRef(null);

  const clips = useMemo(() => {
    const resolve = (want, regex) =>
      (want && names.includes(want) ? want : names.find((n) => regex.test(n))) || names[0] || null;
    return {
      idle: resolve(cfg.clips?.idle, /idle/i),
      walk: resolve(cfg.clips?.walk, /walk/i),
    };
  }, [names, cfg]);

  useFrame(() => {
    const want = (movingRef.current ? clips.walk : clips.idle) || clips.idle;
    if (!want || want === currentClip.current) return;
    const prev = currentClip.current;
    currentClip.current = want;
    if (prev && actions[prev]) actions[prev].fadeOut(0.2);
    if (actions[want]) actions[want].reset().fadeIn(0.2).play();
  });

  return (
    <group ref={ref} scale={cfg.modelScale || 1} rotation={[0, cfg.rotationY || 0, 0]} position={[0, cfg.yOffset || 0, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

class KeeperBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { /* fall back silently */ }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/** Primitive keeper — the fallback while the farmer loads / if it fails. */
function PrimitiveKeeper({ color }) {
  return (
    <group scale={0.72}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[0.9, 1.3, 0.9]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 1.9, 0]}>
        <sphereGeometry args={[0.5, 18, 18]} />
        <meshStandardMaterial color="#f0d9a8" />
      </mesh>
    </group>
  );
}

/**
 * THE TRADING POST — 3D layer (F10). Three market stalls in an arc between
 * the pig pen and sheep paddock, each pricing in its OWN notation:
 * Fraction Fred (blue), Decimal Dot (orange), Percent Penny (green). A crate
 * lands on the table with its price in ONE language; the OTHER two stalls
 * hang three price tags each — tap the tag worth the SAME amount at each.
 * Both right → confetti + the full chain ("3/5 = 0.6 = 60%"); any wrong →
 * shake + the chain reason card (panel-paced).
 */

const STALL_COLORS = {
  fraction: "#3a7bd5",
  decimal: "#e07b28",
  percent: "#2a9d2a",
};
const WOOD = "#8a6a48";

// The seller walks AROUND its counter (never through it): behind → out to the
// right past the counter edge (±1.2) → forward alongside → in to the front
// centre. Reversed on the way back. Points are stall-local [x, z].
const KEEPER_PATH = [
  [0, -0.75], // home, behind the counter
  [1.9, -0.75], // step out to the right, clear of the counter edge
  [1.9, 1.6], // walk forward alongside the counter
  [0, 1.7], // in to the front centre
];
function samplePath(p) {
  const segs = KEEPER_PATH.length - 1;
  const u = Math.max(0, Math.min(1, p)) * segs;
  const i = Math.min(segs - 1, Math.floor(u));
  const t = u - i;
  const a = KEEPER_PATH[i], b = KEEPER_PATH[i + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/**
 * A stall keeper. The round's SELLER walks out from behind their stall
 * (routing AROUND the counter, not through it) and SPEAKS the deal in a
 * bubble — so it's obvious whose price it is, and only the other two stalls
 * show choices.
 */
function StallKeeper({ stall, color }) {
  const ref = useRef();
  const movingRef = useRef(false);
  const pRef = useRef(0); // 0 = home (behind), 1 = out (front)
  const status = useTradingPost((s) => s.status);
  const round = useTradingPost((s) => s.currentRound());
  const isSource = Boolean(
    status !== "idle" && status !== "intro" && round && round.sourceStall === stall
  );

  useFrame((_, dt) => {
    if (!ref.current) return;
    // Ease progress along the path toward the goal end (out when selling).
    const goal = isSource ? 1 : 0;
    const speed = 1.4;
    if (pRef.current < goal) pRef.current = Math.min(goal, pRef.current + speed * dt);
    else if (pRef.current > goal) pRef.current = Math.max(goal, pRef.current - speed * dt);
    const [nx, nz] = samplePath(pRef.current);
    const ox = ref.current.position.x, oz = ref.current.position.z;
    ref.current.position.x = nx;
    ref.current.position.z = nz;
    // Movement drives the walk/idle clip + the facing (RiggedFarmer reads the ref).
    const moved = Math.hypot(nx - ox, nz - oz);
    movingRef.current = moved > 0.0006;
    if (movingRef.current) {
      ref.current.rotation.y = Math.atan2(nx - ox, nz - oz); // face the way they walk
    } else {
      ref.current.rotation.y += (0 - ref.current.rotation.y) * Math.min(1, 8 * dt); // rest facing camera
    }
  });

  const speech = round
    ? `${round.bulk ? "Bulk deal! " : ""}I sell ${round.item} for ${round.sourceDisplay}. Pay the other two stalls in THEIR language!`
    : "";

  return (
    <group ref={ref} position={[0, 0, -0.75]}>
      <KeeperBoundary fallback={<PrimitiveKeeper color={color} />}>
        <Suspense fallback={<PrimitiveKeeper color={color} />}>
          <RiggedFarmer movingRef={movingRef} />
        </Suspense>
      </KeeperBoundary>
      {/* Speech bubble is offset OFF TO THE SIDE (and up) so the farmer stands
          beside it, never hidden behind it (teacher feedback). */}
      {isSource && status === "trading" && (
        <Html position={[1.6, 2.7, 0.2]} center distanceFactor={9} className="ix-badge-anchor" zIndexRange={[24, 0]}>
          <div className="trade-bubble" style={{ borderColor: color }}>
            {round.emoji} {speech}
          </div>
        </Html>
      )}
    </group>
  );
}

/** One market stall: counter, posts, striped awning, keeper + name plate. */
function Stall({ stall }) {
  const color = STALL_COLORS[stall];
  const status = useTradingPost((s) => s.status);
  const round = useTradingPost((s) => s.currentRound());
  const resolved = useTradingPost((s) => s.resolved);
  const [ox, oz] = TRADE_STALL_OFFSETS[stall];
  const active = status !== "idle" && status !== "intro" && round;
  const target = active ? round.targets.find((t) => t.stall === stall) : null;
  const res = target ? resolved[stall] : null;
  const showTruth = status === "celebrate" || status === "feedback";

  return (
    <group position={[TRADE_AREA.x + ox, 0, TRADE_AREA.z + oz]}>
      {/* Counter + posts + awning. */}
      <mesh castShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[2.4, 1.1, 1.0]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      {[-1.05, 1.05].map((dx) => (
        <mesh key={dx} castShadow position={[dx, 1.5, -0.4]}>
          <boxGeometry args={[0.12, 3.0, 0.12]} />
          <meshStandardMaterial color="#6e5140" />
        </mesh>
      ))}
      <mesh castShadow position={[0, 3.05, -0.1]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[2.7, 0.1, 1.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <StallKeeper stall={stall} color={color} />

      {/* Name plate. */}
      <Html position={[0, 3.55, 0]} center distanceFactor={13} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div className="trade-stall-name" style={{ borderColor: color }}>
          {TRADE_STALL_NAMES[stall]}
        </div>
      </Html>

      {/* BUYERS show three tappable tags; the SELLER walks out + speaks. */}
      {target &&
        target.tags.map((tag, i) => {
          const x = (i - 1) * 0.95;
          const isCorrect = i === target.correctIndex;
          const isChosen = res && res.chosenIndex === i;
          let border = STALL_COLORS[stall];
          if (res || showTruth) {
            border = isCorrect && (res?.correct || showTruth)
              ? "#2a9d2a"
              : isChosen ? "#d43f3f" : "#b9b2a6";
          }
          return (
            <group key={i} position={[x, 1.75, 0.35]}>
              <DemoPoint name={`trade-tag-${stall}-${i}`} position={[0, 0, 0.3]} />
              <mesh
                onPointerDown={(e) => {
                  const st = useTradingPost.getState();
                  if (st.status !== "trading" || st.resolved[stall]) return;
                  e.stopPropagation();
                  st.tapTag(stall, i);
                }}
              >
                <sphereGeometry args={[0.55, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
              <Html center distanceFactor={11} className="ix-badge-anchor" zIndexRange={[24, 0]}>
                <div
                  className={`order-chip trade-tag${res && isChosen ? (res.correct ? " good" : " bad") : ""}`}
                  style={{ borderColor: border }}
                >
                  {tag}
                </div>
              </Html>
            </group>
          );
        })}
      {res && res.correct && status === "celebrate" && <ConfettiBurst origin={[0, 1.4, 0.6]} />}
    </group>
  );
}

export default function TradingPostChallenge() {
  const status = useTradingPost((s) => s.status);
  const round = useTradingPost((s) => s.currentRound());
  const [tx, tz] = TRADE_TABLE_OFFSET;

  return (
    <group>
      <Stall stall="fraction" />
      <Stall stall="decimal" />
      <Stall stall="percent" />

      {/* The trading table — the arriving crate + its price. */}
      <group position={[TRADE_AREA.x + tx, 0, TRADE_AREA.z + tz]}>
        <mesh castShadow position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.8, 0.9, 0.9, 12]} />
          <meshStandardMaterial color="#6e5140" />
        </mesh>
        <mesh castShadow position={[0, 1.1, 0]}>
          <boxGeometry args={[0.85, 0.5, 0.65]} />
          <meshStandardMaterial color="#b98a52" />
        </mesh>

        {/* The full chain revealed once the round resolves. */}
        {(status === "celebrate" || status === "feedback") && round && (
          <Html position={[0, 3.0, 0]} center distanceFactor={12} className="ix-badge-anchor" zIndexRange={[24, 0]}>
            <div
              className="fc-count-chip"
              style={{ borderColor: status === "celebrate" ? "#2a9d2a" : "#d43f3f" }}
            >
              {round.chain}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
