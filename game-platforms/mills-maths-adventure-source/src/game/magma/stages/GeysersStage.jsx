import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useGeysersChallenge } from "../stores/geysersStore.js";
import { geyserEasy } from "../../../data/magma/geysersChallenge.js";
import { Chip, StonePad } from "./StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";

/**
 * HALVE & DOUBLE — a terrace of glowing tiles (rows × length). Each steam
 * blast cuts it in half and slides one half alongside the other: half as
 * many rows, twice as long — the very same tiles, so the answer can't have
 * changed. The tile size keeps the AREA constant where it can (the shape
 * visibly changes, the amount visibly doesn't).
 */

const CZ = -0.6;
const AREA = 34; // m² the terrace covers
const MAX_W = 13.5;
const MAX_D = 6.8;
const TILE_LIMIT = 900;
const MOVE_S = 1.15;

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _c = new THREE.Color();

export function shapeScale(A, B) {
  return Math.min(Math.sqrt(AREA / (A * B)), MAX_W / B, MAX_D / A);
}

/**
 * Big terraces (slab mode): long thin shapes like 2 × 500 can't be drawn to
 * scale, so the aspect is SQUARE-ROOT compressed — still visibly "half as
 * deep, twice as long" each blast, still the same area, never a hairline.
 */
export function slabDims(A, B) {
  const r = Math.sqrt(B / A);
  let W = Math.sqrt(AREA * r), D = Math.sqrt(AREA / r);
  if (W > MAX_W) { W = MAX_W; D = AREA / MAX_W; }
  if (D > MAX_D) { D = MAX_D; W = AREA / MAX_D; }
  return { W, D, sx: W / B, sz: D / A };
}

function cellPos(i, j, A, B, s) {
  return [-(B * s) / 2 + s * (j + 0.5), CZ - (A * s) / 2 + s * (i + 0.5)];
}

/** Tile identity → (row, col) through a list of moves. */
function applyMove(cells, A, B, which) {
  if (which === "rows") {
    const h = A / 2;
    return cells.map(([i, j]) => (i < h ? [i, j] : [i - h, j + B]));
  }
  const h = B / 2;
  return cells.map(([i, j]) => (j < h ? [i, j] : [i + A, j - h]));
}

/** Remember the shape (and tile map) we were showing, to animate FROM it. */
function useFrom(value, shape) {
  const last = useRef({ value: null, shape: null });
  const from = useRef({ value: null, shape: null, start: 0 });
  if (last.current.value !== value) {
    if (last.current.value) from.current = { value: last.current.value, shape: last.current.shape, start: performance.now() };
    last.current = { value, shape };
  }
  return from;
}

function Tiles({ chain, easy, celebrate }) {
  const ref = useRef();
  const [A0, B0] = chain[0];
  const n = A0 * B0;
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6, emissive: "#3a1400", emissiveIntensity: 0.4 }), []);
  // Replay the chain to get every tile's (row, col) now.
  const now = useMemo(() => {
    let cells = [];
    for (let i = 0; i < A0; i++) for (let j = 0; j < B0; j++) cells.push([i, j]);
    for (let k = 1; k < chain.length; k++) {
      const [A, B] = chain[k - 1];
      const [A2] = chain[k];
      cells = applyMove(cells, A, B, A2 < A ? "rows" : "cols");
    }
    return cells;
  }, [chain, A0, B0]);
  const shape = chain[chain.length - 1];
  const from = useFrom(now, shape);

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const [A, B] = shape;
    const s = shapeScale(A, B);
    const f = from.current;
    const t = f.start ? Math.min(1, (performance.now() - f.start) / (MOVE_S * 1000)) : 1;
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const glow = celebrate ? "#ffd166" : easy ? "#ffb347" : "#ff8a3d";
    const [Ap, Bp] = f.shape || shape;
    const sp = shapeScale(Ap, Bp);
    for (let k = 0; k < n; k++) {
      const [i, j] = now[k];
      const [x1, z1] = cellPos(i, j, A, B, s);
      let x = x1, z = z1, y = 0.14, sc = s;
      if (t < 1 && f.value) {
        const [pi, pj] = f.value[k];
        const [x0, z0] = cellPos(pi, pj, Ap, Bp, sp);
        x = x0 + (x1 - x0) * e;
        z = z0 + (z1 - z0) * e;
        sc = sp + (s - sp) * e;
        if (pi !== i || pj !== j) y += Math.sin(Math.PI * t) * 1.4;
      }
      if (celebrate) y += Math.max(0, Math.sin(state.clock.elapsedTime * 6 - (i + j) * 0.3)) * 0.12;
      _p.set(x, y, z);
      _q.identity();
      _s.set(sc * 0.88, 0.16, sc * 0.88);
      _m.compose(_p, _q, _s);
      m.setMatrixAt(k, _m);
      m.setColorAt(k, _c.set((i + j) % 2 ? glow : "#c96a2b"));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, n]} castShadow frustumCulled={false} />;
}

/** Big terraces: a solid slab with a line every ten, halves sliding. */
function Slab({ chain, easy, celebrate }) {
  const fixed = useRef();
  const mover = useRef();
  const [A, B] = chain[chain.length - 1];
  const from = useFrom(`${A}x${B}`, [A, B]);
  const color = celebrate ? "#ffd166" : easy ? "#ffb347" : "#ff8a3d";
  useFrame(() => {
    const f = fixed.current, mv = mover.current;
    if (!f || !mv) return;
    const fr = from.current;
    const t = fr.start ? Math.min(1, (performance.now() - fr.start) / (MOVE_S * 1000)) : 1;
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const [Ap, Bp] = fr.shape || [A, B];
    const N = slabDims(A, B), O = slabDims(Ap, Bp);
    const rowsMove = A < Ap;
    // The two halves in the NEW arrangement…
    const halfNew = rowsMove
      ? { w: N.W / 2, d: N.D, x: [-N.W / 4, N.W / 4], z: [CZ, CZ] }
      : { w: N.W, d: N.D / 2, x: [0, 0], z: [CZ - N.D / 4, CZ + N.D / 4] };
    // …and where they were before the blast.
    const halfOld = rowsMove
      ? { w: O.W, d: O.D / 2, x: [0, 0], z: [CZ - O.D / 4, CZ + O.D / 4] }
      : { w: O.W / 2, d: O.D, x: [-O.W / 4, O.W / 4], z: [CZ, CZ] };
    const k = t < 1 && fr.shape ? e : 1;
    const L = (a, b) => a + (b - a) * k;
    f.position.set(L(halfOld.x[0], halfNew.x[0]), 0.14, L(halfOld.z[0], halfNew.z[0]));
    f.scale.set(L(halfOld.w, halfNew.w) - 0.03, 0.16, L(halfOld.d, halfNew.d) - 0.03);
    mv.position.set(L(halfOld.x[1], halfNew.x[1]), 0.14 + (t < 1 ? Math.sin(Math.PI * t) * 1.4 : 0), L(halfOld.z[1], halfNew.z[1]));
    mv.scale.set(L(halfOld.w, halfNew.w) - 0.03, 0.16, L(halfOld.d, halfNew.d) - 0.03);
  });
  const N = slabDims(A, B);
  return (
    <group>
      <mesh ref={fixed} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} emissive="#5a2000" emissiveIntensity={0.5} roughness={0.6} />
      </mesh>
      <mesh ref={mover} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} emissive="#5a2000" emissiveIntensity={0.5} roughness={0.6} />
      </mesh>
      <GridLines A={A} B={B} sx={N.sx} sz={N.sz} />
    </group>
  );
}

function GridLines({ A, B, sx, sz }) {
  const lines = [];
  const stepB = B > 200 ? 50 : 10;
  const stepA = A > 200 ? 50 : 10;
  for (let j = stepB; j < B; j += stepB) lines.push({ x: -(B * sx) / 2 + j * sx, z: CZ, w: 0.04, d: A * sz });
  for (let i = stepA; i < A; i += stepA) lines.push({ x: 0, z: CZ - (A * sz) / 2 + i * sz, w: B * sx, d: 0.04 });
  return (
    <group>
      {lines.slice(0, 80).map((l, k) => (
        <mesh key={k} position={[l.x, 0.235, l.z]}>
          <boxGeometry args={[l.w, 0.01, l.d]} />
          <meshBasicMaterial color="#5a2408" />
        </mesh>
      ))}
    </group>
  );
}

/** Steam puffs along the cut, for a moment after each blast. */
function Steam({ lastMove }) {
  const group = useRef();
  const puffs = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ x: (i / 13 - 0.5) * 9, d: Math.random() * 0.3 })), []);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = lastMove ? (Date.now() - lastMove.at) / 1400 : 9;
    g.visible = t < 1;
    g.children.forEach((m, i) => {
      const k = Math.max(0, Math.min(1, t - puffs[i].d));
      m.position.set(puffs[i].x, 0.4 + k * 3.2, CZ + Math.sin(i * 1.7) * 0.6);
      m.scale.setScalar(0.3 + k * 1.3);
      m.material.opacity = 0.55 * (1 - k);
    });
  });
  return (
    <group ref={group}>
      {puffs.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.6, 10, 8]} />
          <meshBasicMaterial color="#f2f2f2" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function GeysersStage() {
  const status = useGeysersChallenge((s) => s.status);
  const round = useGeysersChallenge((s) => s.currentRound());
  const chain = useGeysersChallenge((s) => s.chain);
  const lastMove = useGeysersChallenge((s) => s.lastMove);
  if (!round || !chain.length || status === "intro" || status === "done") return <StonePad w={14.5} d={8} position={[0, 0, CZ]} />;
  const [A, B] = chain[chain.length - 1];
  const slab = A * B > TILE_LIMIT;
  const dims = slab ? slabDims(A, B) : { W: B * shapeScale(A, B), D: A * shapeScale(A, B) };
  const easy = geyserEasy(A, B);
  const celebrate = status === "celebrate";
  const Body = slab ? Slab : Tiles;
  return (
    <group>
      <StonePad w={14.8} d={8.2} position={[0, 0, CZ]} />
      <Body key={`${round.roundIndex}-${chain[0].join("x")}`} chain={chain} easy={easy} celebrate={celebrate} />
      <Steam lastMove={lastMove} />
      <Chip position={[-dims.W / 2 - 1.1, 0.5, CZ]} df={11}>{A} row{A > 1 ? "s" : ""}</Chip>
      <Chip position={[0, 0.5, CZ - dims.D / 2 - 0.65]} df={11}>{B} long</Chip>
      <Chip position={[0, 2.6, CZ - 2.6]} df={10} className={`fc-count-chip${easy ? " good" : ""}`}>
        {chain.map(([x, y]) => `${x} × ${y}`).join(" = ")}
        {status === "celebrate" || status === "feedback" ? ` = ${round.product}` : ""}
      </Chip>
      {celebrate && <ConfettiBurst origin={[0, 0.5, CZ]} />}
    </group>
  );
}
