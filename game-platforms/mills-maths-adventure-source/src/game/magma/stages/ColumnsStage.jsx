import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useColumnsChallenge } from "../stores/columnsStore.js";
import { columnsLayout } from "../../../data/magma/columnsChallenge.js";
import { Chip, StonePad, Sparks } from "./StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";

/**
 * COLUMN RECTANGLES — N hexagonal basalt columns stand themselves up in the
 * chosen number of rows (they glide to their new places when the dial
 * moves). Columns that don't fit a full row stand aside, glowing red. On
 * the feedback card every rectangle N can make is laid out as a mini array.
 */

const AREA_W = 11.5; // the array fits inside this width…
const AREA_D = 6.2; // …and this depth
const CENTER_Z = -0.8;

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _c = new THREE.Color();
const BASALT = new THREE.Color("#9a918b");
const RED = new THREE.Color("#ff4a2a");
const GOLD = new THREE.Color("#ffc857");

function layoutTargets(n, rows) {
  const L = columnsLayout(n, rows);
  const across = L.perRow;
  const s = Math.min(1.05, AREA_W / Math.max(across + (L.leftover ? 2 : 0), 1), AREA_D / Math.max(L.rows, 1));
  const w = across * s;
  const out = [];
  for (let r = 0; r < L.rows; r++) {
    for (let c = 0; c < across; c++) {
      out.push({ x: -w / 2 + s * (c + 0.5), z: CENTER_Z - (L.rows * s) / 2 + s * (r + 0.5), left: false });
    }
  }
  // Leftovers stand aside to the right, in a short stack.
  for (let k = 0; k < L.leftover; k++) {
    out.push({ x: w / 2 + 1.0 + (k % 2) * s, z: CENTER_Z - (L.rows * s) / 2 + s * (Math.floor(k / 2) + 0.5), left: true });
  }
  return { L, s, w, depth: L.rows * s, targets: out };
}

function ColumnArray({ n, rows, kept, celebrate }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 6);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.75, flatShading: true, emissive: "#000000" }), []);
  const lay = useMemo(() => layoutTargets(n, rows), [n, rows]);
  const cur = useRef(null);
  if (!cur.current || cur.current.length !== n) {
    cur.current = Array.from({ length: n }, () => ({ x: 0, z: CENTER_Z, y: 0, s: 0.6 }));
  }

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < n; i++) m.setColorAt(i, BASALT);
    m.instanceColor.needsUpdate = true;
  }, [n]);

  useFrame((state, dt) => {
    const m = ref.current;
    if (!m) return;
    const a = 1 - Math.exp(-9 * dt);
    const t = state.clock.elapsedTime;
    const radius = lay.s * 0.43;
    const height = 0.35 + lay.s * 1.15;
    lay.targets.forEach((tg, i) => {
      const c = cur.current[i];
      c.x += (tg.x - c.x) * a;
      c.z += (tg.z - c.z) * a;
      c.s += (radius - c.s) * a;
      const hop = celebrate ? Math.max(0, Math.sin(t * 6 - i * 0.25)) * 0.25 : 0;
      _p.set(c.x, hop, c.z);
      _q.identity();
      _s.set(c.s, height * (tg.left ? 0.8 : 1), c.s);
      _m.compose(_p, _q, _s);
      m.setMatrixAt(i, _m);
      _c.copy(tg.left ? RED : celebrate ? GOLD : BASALT);
      m.setColorAt(i, _c);
    });
    m.instanceMatrix.needsUpdate = true;
    m.instanceColor.needsUpdate = true;
    mat.emissive.set(celebrate ? "#4a2a00" : "#000000");
  });

  const { L } = lay;
  const leftX = -lay.w / 2 - 0.9;
  return (
    <group>
      <instancedMesh ref={ref} args={[geo, mat, n]} castShadow receiveShadow frustumCulled={false} />
      {/* Red glow under the leftovers. */}
      {L.leftover > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[lay.w / 2 + 1.0 + lay.s * 0.5, 0.06, CENTER_Z - lay.depth / 2 + (lay.s * Math.ceil(L.leftover / 2)) / 2]}>
          <circleGeometry args={[Math.max(0.8, lay.s * 1.4), 24]} />
          <meshBasicMaterial color="#ff3b1f" transparent opacity={0.45} toneMapped={false} />
        </mesh>
      )}
      <Chip position={[leftX - 0.6, 0.6, CENTER_Z]} df={11}>
        {L.rows} row{L.rows > 1 ? "s" : ""}
      </Chip>
      <Chip position={[0, 1.4, CENTER_Z - lay.depth / 2 - 0.6]} df={11} className={`fc-count-chip ${L.exact ? "good" : "bad"}`}>
        {L.exact ? `${L.rows} × ${L.perRow} = ${n}` : `${L.rows} × ${L.perRow} + ${L.leftover} over`}
      </Chip>
      {kept.length > 0 && (
        <Chip position={[0, 0.3, CENTER_Z + lay.depth / 2 + 1.1]} df={12} className="fc-count-chip magma-world-list">
          Kept: {kept.map(([a, b]) => `${a} × ${b}`).join(" · ")}
        </Chip>
      )}
    </group>
  );
}

/**
 * Feedback: every rectangle N makes, stacked one under another as little
 * arrays (long side across), the ones still hiding glowing orange.
 */
function AllRectangles({ round, missing }) {
  const ref = useRef();
  const miss = useMemo(() => new Set(missing.map(([a, b]) => `${a}x${b}`)), [missing]);
  const { cells, labels } = useMemo(() => {
    const pairs = round.pairs;
    const sumA = pairs.reduce((s, [a]) => s + a, 0);
    const c = Math.min(0.45, 10 / round.n, 4.6 / sumA);
    const gap = 0.55;
    let z = -(sumA * c + gap * (pairs.length - 1)) / 2;
    const cellsOut = [];
    const labelsOut = [];
    for (const [a, b] of pairs) {
      const w = b * c;
      const isMiss = miss.has(`${a}x${b}`);
      for (let r = 0; r < a; r++) for (let k = 0; k < b; k++) cellsOut.push({ x: -w / 2 + c * (k + 0.5), z: z + c * (r + 0.5), s: c * 0.86, miss: isMiss });
      labelsOut.push({ key: `${a}x${b}`, x: -w / 2 - 1.3, z: z + (a * c) / 2, text: `${a} × ${b}${isMiss ? " (hiding!)" : ""}`, miss: isMiss });
      z += a * c + gap;
    }
    return { cells: cellsOut, labels: labelsOut };
  }, [round, miss]);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.8 }), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    cells.forEach((cl, i) => {
      _p.set(cl.x, 0.12, cl.z);
      _q.identity();
      _s.set(cl.s, 0.22, cl.s);
      _m.compose(_p, _q, _s);
      m.setMatrixAt(i, _m);
      m.setColorAt(i, _c.set(cl.miss ? "#ff9a3c" : "#8f8580"));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [cells]);
  return (
    <group position={[0.6, 0, CENTER_Z]}>
      <instancedMesh ref={ref} args={[geo, mat, cells.length]} frustumCulled={false} />
      {labels.map((l) => (
        <Chip key={l.key} position={[l.x, 0.5, l.z]} df={11} className={`fc-count-chip ${l.miss ? "bad" : "good"}`}>
          {l.text}
        </Chip>
      ))}
    </group>
  );
}

export default function ColumnsStage() {
  const status = useColumnsChallenge((s) => s.status);
  const round = useColumnsChallenge((s) => s.currentRound());
  const rows = useColumnsChallenge((s) => s.rows);
  const kept = useColumnsChallenge((s) => s.kept);
  const lastKeep = useColumnsChallenge((s) => s.lastKeep);
  const missing = useColumnsChallenge((s) => s.missing);
  if (!round || status === "intro" || status === "done") return <StonePad w={13} d={8} position={[0, 0, CENTER_Z]} color="#4a3f3a" />;
  const celebrate = status === "celebrate";
  return (
    <group>
      <StonePad w={13.5} d={8.4} position={[0, 0, CENTER_Z]} color="#4a3f3a" />
      {status === "feedback" ? (
        <AllRectangles round={round} missing={missing} />
      ) : (
        <ColumnArray key={round.roundIndex} n={round.n} rows={rows} kept={kept} celebrate={celebrate} />
      )}
      {lastKeep && status === "play" && <Sparks origin={[0, 1.2, CENTER_Z]} at={lastKeep.at} color="#ffd166" />}
      {celebrate && <ConfettiBurst origin={[0, 0.5, CENTER_Z]} />}
    </group>
  );
}
