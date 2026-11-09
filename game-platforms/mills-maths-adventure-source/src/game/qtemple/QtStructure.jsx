import React, { useCallback, useMemo } from "react";
import * as THREE from "three";

import StaticBatch from "../jungle/StaticBatch.jsx";
import { useSession, requestMoveTo } from "../sessionStore.js";
import { useUI } from "../../ui/effects/uiStore.js";
import { queueTap } from "../touchGesture.js";
import { clampToBounds } from "../../data/regions.js";
import {
  CELL, DECKS, QT_BOUNDS, qtGroundHeight, PIT,
} from "../../data/qtemple/qtempleWorld.js";
import { floorBoxes, wallBoxes, ceilingBoxes, blockParts, LOOKS } from "./qtGeometry.js";
import { QBox, mat } from "./qtKit.jsx";

/**
 * THE QUOTIENT TEMPLE's SHELL — every floor, wall, lintel, riser, ceiling
 * and block, built from the same plan the player walks on
 * (qtemple/qtGeometry.js), merged into a few dozen draws (StaticBatch).
 * Plus the skirting along the foot of each room's walls and the hanging
 * grate bridge over the Sunken Pit.
 *
 * Tap-to-move: a tap that lands on a floor (within a step of the walkable
 * height there) walks you to it; taps on walls + ceilings are ignored.
 */
const SKIRT = { sandstone: "stoneDark", stairs: "stoneDark", marble: "goldDark", diamond: "goldDark", wood: "woodSide", brick: "darkBricks", slab: "goldDark", gold: "goldDark", sand: "stoneDark" };

function Skirting() {
  const parts = useMemo(() => {
    const out = [];
    for (const w of wallBoxes()) {
      if (w.kind !== "wall") continue;
      const c = CELL[w.cell];
      if (typeof c.floor === "function") continue; // stepped rooms have none
      const e = w.edge;
      const [t0, t1] = w.span;
      const L = t1 - t0;
      if (L < 0.4) continue;
      const h = 0.5, d = 0.16;
      const y = c.floor + h / 2;
      const off = e.fixed - e.n * (d / 2);
      out.push(e.axis === "z"
        ? { p: [off, y, (t0 + t1) / 2], s: [d, h, L], m: SKIRT[c.mat] }
        : { p: [(t0 + t1) / 2, y, off], s: [L, h, d], m: SKIRT[c.mat] });
      // A gold/stone moulding band higher up in the grand rooms.
      if (["hall", "throne", "heads", "treasury", "vestibule"].includes(c.id)) {
        const by = c.id === "hall" ? c.floor + 5.6 : c.floor + 3.9;
        const offB = e.fixed - e.n * 0.1;
        out.push(e.axis === "z"
          ? { p: [offB, by, (t0 + t1) / 2], s: [0.2, 0.32, L], m: "gold" }
          : { p: [(t0 + t1) / 2, by, offB], s: [L, 0.32, 0.2], m: "gold" });
      }
      // A cornice under the ceiling.
      const cy = c.ceil - 0.25;
      const offC = e.fixed - e.n * 0.22;
      if (c.id !== "hall") {
        out.push(e.axis === "z"
          ? { p: [offC, cy, (t0 + t1) / 2], s: [0.44, 0.5, L], m: LOOKS[c.mat].wall === "darkStone" ? "goldDark" : "stone" }
          : { p: [(t0 + t1) / 2, cy, offC], s: [L, 0.5, 0.44], m: LOOKS[c.mat].wall === "darkStone" ? "goldDark" : "stone" });
      }
    }
    return out;
  }, []);
  return <>{parts.map((b, i) => <QBox key={i} p={b.p} s={b.s} m={b.m} />)}</>;
}

/** The SM64-style grate bridge, hung from the pit's ceiling on chains. */
function GrateBridge() {
  const d = DECKS[0];
  const w = d.x1 - d.x0, depth = d.z1 - d.z0;
  const cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2;
  const chains = [];
  for (let x = d.x0 + 3; x < d.x1 - 1; x += 7) for (const z of [d.z0 + 0.15, d.z1 - 0.15]) chains.push([x, z]);
  const ceil = -2;
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, depth);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / 2), uv.getY(i) * (depth / 2));
    return g;
  }, [w, depth]);
  return (
    <group>
      {/* The grate itself (see-through) + its iron frame. */}
      <mesh position={[cx, d.top - 0.04, cz]} rotation={[-Math.PI / 2, 0, 0]} material={mat("grate")} geometry={geo} />
      <QBox p={[cx, d.top - 0.2, d.z0 + 0.1]} s={[w, 0.3, 0.2]} m="iron" />
      <QBox p={[cx, d.top - 0.2, d.z1 - 0.1]} s={[w, 0.3, 0.2]} m="iron" />
      {Array.from({ length: Math.floor(w / 3) + 1 }, (_, i) => d.x0 + i * 3).map((x) => (
        <QBox key={x} p={[Math.min(d.x1 - 0.1, x), d.top - 0.2, cz]} s={[0.16, 0.24, depth]} m="iron" />
      ))}
      {/* Chains up to the ceiling. */}
      {chains.map(([x, z], i) => (
        <group key={i}>
          {Array.from({ length: Math.ceil((ceil - d.top) / 0.5) }, (_, k) => (
            <mesh key={k} position={[x, d.top + 0.25 + k * 0.5, z]} rotation={[0, k % 2 ? Math.PI / 2 : 0, 0]} material={mat("iron")}>
              <torusGeometry args={[0.16, 0.045, 5, 10]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Where the bridge meets each ledge: a stone sill. */}
      <QBox p={[PIT.x0 + PIT.ledge - 0.3, d.top - 0.3, cz]} s={[0.6, 0.6, depth + 0.4]} m="darkBricks" />
      <QBox p={[PIT.x1 - PIT.ledge + 0.3, d.top - 0.3, cz]} s={[0.6, 0.6, depth + 0.4]} m="darkBricks" />
    </group>
  );
}

export default function QtStructure() {
  const touchMode = useUI((s) => s.touchMode);
  const { floors, walls, ceils, blocks } = useMemo(() => ({
    floors: floorBoxes(), walls: wallBoxes(), ceils: ceilingBoxes(), blocks: blockParts(),
  }), []);
  const onTap = useCallback((e) => {
    if (useSession.getState().activeEncounterId) return;
    // The nearest surface the tap hits wins (walls + ceilings stop it too).
    e.stopPropagation();
    const p = e.point;
    const g = qtGroundHeight(p.x, p.z, p.y);
    if (Math.abs(p.y - g) > 0.7) return; // a wall / ceiling — not a floor
    const { x, z } = clampToBounds(p.x, p.z, QT_BOUNDS);
    queueTap(() => requestMoveTo(x, z, null));
  }, []);
  return (
    <group>
      <group onPointerDown={touchMode ? onTap : undefined}>
        <StaticBatch>
          {floors.map((b, i) => <QBox key={`f${i}`} p={b.p} s={b.s} m={b.m} tile={b.tile} />)}
          {blocks.boxes.map((b, i) => <QBox key={`b${i}`} p={b.p} s={b.s} m={b.m} tile={b.tile} />)}
          {blocks.wedges.map((w) => <mesh key={w.id} geometry={w.geo} material={mat(w.m)} receiveShadow />)}
        </StaticBatch>
      </group>
      <group onPointerDown={touchMode ? onTap : undefined}>
        <StaticBatch>
          {walls.map((b, i) => <QBox key={`w${i}`} p={b.p} s={b.s} m={b.m} tile={b.tile} />)}
          {ceils.map((b, i) => <QBox key={`c${i}`} p={b.p} s={b.s} m={b.m} tile={b.tile} />)}
        </StaticBatch>
      </group>
      <StaticBatch>
        <Skirting />
      </StaticBatch>
      <group onPointerDown={touchMode ? onTap : undefined}>
        <GrateBridge />
      </group>
    </group>
  );
}
