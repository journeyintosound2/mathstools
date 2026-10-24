import React, { useRef } from "react";
import DemoPoint from "./demo/DemoPoint.jsx";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { VEGGIE_AREA, VEGGIE_BED } from "../data/farm/farmLayout.js";
import { useVeggiePlot } from "./veggiePlotStore.js";
import { ConfettiBurst } from "./OrderPartsChallenge.jsx";

/**
 * THE VEGGIE PLOT — 3D layer (F11). A square garden bed in the middle of the
 * (renamed) Veggie Plot paddock. AREA rounds: drag the WIDTH edge and the
 * LENGTH edge across the grid; the overlap shades and the harvest count reveals
 * the product (2/3 × 3/4 = 6/12 — an area, grown in soil). POTION rounds: a
 * fertiliser bottle multiplies the plant's height — predict grow/shrink, then
 * the plant scales (below 1 SHRINKS it).
 */

const SOIL = "#6f4a2a";
const SOIL_LIGHT = "#8a5f38";
const GRID = "#efe4c8";
const PLANT_FILL = "#5aa83e";
const EDGE_W = "#e0a800"; // width handle (gold)
const EDGE_L = "#2a9d8f"; // length handle (teal)

const HALF = VEGGIE_BED / 2;

function Bed() {
  return (
    <group>
      {/* Raised tilled soil bed. */}
      <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
        <boxGeometry args={[VEGGIE_BED + 0.6, 0.16, VEGGIE_BED + 0.6]} />
        <meshStandardMaterial color={SOIL} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.17, 0]} receiveShadow>
        <planeGeometry args={[VEGGIE_BED, VEGGIE_BED]} />
        <meshStandardMaterial color={SOIL_LIGHT} />
      </mesh>
    </group>
  );
}

/** The AREA-model grid + draggable edges + shaded overlap. */
function AreaBed({ round }) {
  const cols = useVeggiePlot((s) => s.cols);
  const rows = useVeggiePlot((s) => s.rows);
  const status = useVeggiePlot((s) => s.status);
  const placeResult = useVeggiePlot((s) => s.placeResult);
  const dragging = useRef(false);
  const dragAxis = useRef(null); // "w" | "l" — which line this pointer grabbed
  const placed = status !== "placing";
  const answered = status === "celebrate" || status === "feedback";

  const { gridCols, gridRows } = round;
  const cellW = VEGGIE_BED / gridCols;
  const cellL = VEGGIE_BED / gridRows;
  const w = cols * cellW; // selected width (from the left edge)
  const l = rows * cellL; // selected length (from the near edge)

  // Move whichever partition LINE the pointer grabbed. On press we pick the
  // line the tap is CLOSER to (so tapping a line — or near it — grabs it, even
  // on a touchscreen); dragging then keeps moving that line. Both world→local.
  const grabAndMove = (worldX, worldZ, isDown) => {
    const st = useVeggiePlot.getState();
    const localX = worldX - VEGGIE_AREA.x + HALF; // 0..BED
    const localZ = worldZ - VEGGIE_AREA.z + HALF; // 0..BED
    if (isDown) {
      const dW = Math.abs(localX - st.cols * cellW); // distance to the width line
      const dL = Math.abs(localZ - st.rows * cellL); // distance to the length line
      dragAxis.current = dW <= dL ? "w" : "l";
    }
    if (dragAxis.current === "w") st.setCols((localX / VEGGIE_BED) * gridCols);
    else st.setRows((localZ / VEGGIE_BED) * gridRows);
  };

  const overlapColor = placed
    ? placeResult && placeResult.correct ? PLANT_FILL : "#b7c25a"
    : PLANT_FILL;

  return (
    <group position={[0, 0.19, 0]}>
      {/* Demo hand targets: where each partition line can stand. */}
      {Array.from({ length: gridCols + 1 }, (_, i) => <DemoPoint key={`dw${i}`} name={`veggie-w-${i}`} position={[-HALF + i * cellW, 0.1, -HALF + Math.max(l, cellL) / 2]} />)}
      {Array.from({ length: gridRows + 1 }, (_, i) => <DemoPoint key={`dl${i}`} name={`veggie-l-${i}`} position={[-HALF + Math.max(w, cellW) / 2, 0.1, -HALF + i * cellL]} />)}
      {/* Grid lines. */}
      {Array.from({ length: gridCols + 1 }, (_, i) => (
        <mesh key={`c${i}`} position={[-HALF + i * cellW, 0.02, 0]}>
          <boxGeometry args={[0.04, 0.02, VEGGIE_BED]} />
          <meshStandardMaterial color={GRID} />
        </mesh>
      ))}
      {Array.from({ length: gridRows + 1 }, (_, i) => (
        <mesh key={`r${i}`} position={[0, 0.02, -HALF + i * cellL]}>
          <boxGeometry args={[VEGGIE_BED, 0.02, 0.04]} />
          <meshStandardMaterial color={GRID} />
        </mesh>
      ))}

      {/* The shaded planted overlap (grows from the near-left corner). */}
      {cols > 0 && rows > 0 && (
        <mesh position={[-HALF + w / 2, 0.03, -HALF + l / 2]}>
          <boxGeometry args={[w, 0.06, l]} />
          <meshStandardMaterial color={overlapColor} transparent opacity={0.85} />
        </mesh>
      )}

      {/* Little planted veggies in each selected cell (the harvest). */}
      {placed && Array.from({ length: cols }, (_, ci) =>
        Array.from({ length: rows }, (_, ri) => (
          <mesh key={`p${ci}-${ri}`} position={[-HALF + (ci + 0.5) * cellW, 0.16, -HALF + (ri + 0.5) * cellL]} castShadow>
            <sphereGeometry args={[Math.min(cellW, cellL) * 0.18, 8, 8]} />
            <meshStandardMaterial color={round.vegColor} />
          </mesh>
        ))
      )}

      {/* The two partition LINES (visual). Yellow = width edge, teal = length
          edge. Drag/tap them via the full-bed surface below. */}
      {!placed && (
        <mesh position={[-HALF + w, 0.28, 0]} castShadow>
          <boxGeometry args={[0.16, 0.5, VEGGIE_BED + 0.3]} />
          <meshStandardMaterial color={EDGE_W} emissive={EDGE_W} emissiveIntensity={0.35} />
        </mesh>
      )}
      {!placed && (
        <mesh position={[0, 0.28, -HALF + l]} castShadow>
          <boxGeometry args={[VEGGIE_BED + 0.3, 0.5, 0.16]} />
          <meshStandardMaterial color={EDGE_L} emissive={EDGE_L} emissiveIntensity={0.35} />
        </mesh>
      )}

      {/* One full-bed pointer surface: DRAG or TAP anywhere to move the nearer
          partition line to that point (works for mouse + touch). */}
      {!placed && (
        <mesh
          position={[0, 0.4, 0]}
          onPointerDown={(e) => { e.stopPropagation(); dragging.current = true; e.target.setPointerCapture?.(e.pointerId); grabAndMove(e.point.x, e.point.z, true); }}
          onPointerMove={(e) => { if (dragging.current) grabAndMove(e.point.x, e.point.z, false); }}
          onPointerUp={(e) => { dragging.current = false; dragAxis.current = null; e.target.releasePointerCapture?.(e.pointerId); }}
        >
          <boxGeometry args={[VEGGIE_BED + 0.6, 0.9, VEGGIE_BED + 0.6]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* Edge fraction chips: what you've selected vs the target. */}
      <Html position={[-HALF + w, 0.9, HALF + 0.6]} center distanceFactor={11} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div className="fc-count-chip" style={{ borderColor: EDGE_W }}>{cols}/{gridCols}</div>
      </Html>
      <Html position={[HALF + 0.7, 0.9, -HALF + l]} center distanceFactor={11} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div className="fc-count-chip" style={{ borderColor: EDGE_L }}>{rows}/{gridRows}</div>
      </Html>

      {/* The multiplication sentence. Hidden while TYPING (the bottom answer
          bar shows it then, keeping the array visible). The PRODUCT is only
          revealed AFTER the student answers — never given away while typing. */}
      {status !== "typing" && (
        <Html position={[0, 1.7, HALF + 0.2]} center distanceFactor={11} className="ix-badge-anchor" zIndexRange={[24, 0]}>
          <div className="milk-display">
            {round.widthStr} × {round.lengthStr}{answered ? ` = ${round.productStr}` : ""}
          </div>
        </Html>
      )}
    </group>
  );
}

/** The POTION round — a fertiliser bottle + a plant that scales by the factor. */
function PotionBed({ round }) {
  const status = useVeggiePlot((s) => s.status);
  const choice = useVeggiePlot((s) => s.potionChoice);
  const plantRef = useRef();
  const applied = status === "celebrate" || status === "feedback";

  useFrame((_, dt) => {
    if (!plantRef.current) return;
    const target = applied ? round.factorValue : 1;
    const cur = plantRef.current.scale.y;
    plantRef.current.scale.y = cur + (target - cur) * Math.min(1, 6 * dt);
  });

  return (
    // Centred on the bed (keeps the plant + potion clear of the paddock edge /
    // trees behind it).
    <group position={[0, 0.19, 0.2]}>
      {/* Ghost outline of the ORIGINAL height (a comparison bar, to the left). */}
      <mesh position={[-0.9, 0.9, 0]}>
        <boxGeometry args={[0.12, 1.8, 0.12]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>

      {/* The plant (scales vertically by the factor once applied). */}
      <group ref={plantRef} position={[0, 0, 0]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.14, 1.8, 8]} />
          <meshStandardMaterial color={PLANT_FILL} />
        </mesh>
        <mesh position={[0, 1.9, 0]} scale={[1, 0.9, 1]} castShadow>
          <sphereGeometry args={[0.42, 12, 10]} />
          <meshStandardMaterial color={round.vegColor} />
        </mesh>
      </group>

      {/* The fertiliser potion bottle (to the right, on the bed). */}
      <group position={[1.7, 0, 0.7]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.34, 0.7, 12]} />
          <meshStandardMaterial color={round.potionColor} transparent opacity={0.85} emissive={round.potionColor} emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.28, 10]} />
          <meshStandardMaterial color="#cfc6b5" />
        </mesh>
        <Html position={[0, 1.5, 0]} center distanceFactor={11} className="ix-badge-anchor" zIndexRange={[24, 0]}>
          <div className="fc-count-chip" style={{ borderColor: round.potionColor }}>× {round.factorStr}</div>
        </Html>
      </group>

      {/* The verdict once applied. */}
      {applied && (
        <Html position={[0, 2.7, 0]} center distanceFactor={12} className="ix-badge-anchor" zIndexRange={[24, 0]}>
          <div className="milk-display">{round.grows ? "GREW ↑" : "SHRANK ↓"}</div>
        </Html>
      )}
      {status === "celebrate" && <ConfettiBurst origin={[0, 2.0, 0]} />}
    </group>
  );
}

export default function VeggiePlotChallenge() {
  const status = useVeggiePlot((s) => s.status);
  const shown = useVeggiePlot((s) => s.currentRound());
  const active = status !== "idle" && status !== "intro";

  return (
    <group position={[VEGGIE_AREA.x, 0, VEGGIE_AREA.z]}>
      <Bed />
      {active && shown && shown.kind === "area" && <AreaBed round={shown} />}
      {active && shown && shown.kind === "potion" && <PotionBed round={shown} />}
      {active && status === "celebrate" && shown && shown.kind === "area" && (
        <ConfettiBurst origin={[0, 1.6, 0]} />
      )}
      {/* Idle dressing: a few sprouts waiting in the bed. */}
      {!active &&
        [[-1.5, -1.2], [1.2, 0.6], [0.2, 1.6], [-0.8, 1.0]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.4, z]} castShadow>
            <coneGeometry args={[0.22, 0.5, 6]} />
            <meshStandardMaterial color={PLANT_FILL} />
          </mesh>
        ))}
    </group>
  );
}
