import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useObsidianChallenge } from "../stores/obsidianStore.js";
import { obsidianColRange, obsidianShowsTiles, obsidianPieces } from "../../../data/magma/obsidianChallenge.js";
import { Chip, StonePad } from "./StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";

/**
 * CRACK THE CRYSTAL — an obsidian crystal slab laid on the clearing as an
 * a × b array. A glowing lava crack splits it; the pieces take different
 * colours (and drift apart once cracked) with "7 × 5" chips that gain their
 * value when the student works it out. Growing past the edge adds red ghost
 * columns that are taken away. Big products show as an open REGION (no
 * tiles) — the area model.
 */

const MAX_W = 10.4;
const MAX_D = 5.8;
const CZ = -0.7;
const PIECE_COLORS = ["#8a4fff", "#20c5b5", "#ff8fd0", "#ffd166"];
const GHOST = "#ff3b2f";

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _c = new THREE.Color();

/** Where each piece sits (in cell units) + its colour/label. */
function pieceRects(round, cols, rows, cracked) {
  const area = round.kind === "area";
  const rowSplit = area ? rows : round.a;
  const ps = obsidianPieces(round, cols, area ? rows : null);
  if (area) {
    return ps.map((p, i) => ({
      ...p,
      c0: i % 2 === 0 ? 0 : cols,
      r0: i < 2 ? 0 : rowSplit,
      color: PIECE_COLORS[i],
    }));
  }
  if (cols > round.b) {
    return [
      { ...ps[0], c0: 0, r0: 0, color: PIECE_COLORS[0] },
      { ...ps[1], c0: round.b, r0: 0, color: GHOST },
    ];
  }
  return [
    { ...ps[0], c0: 0, r0: 0, color: PIECE_COLORS[0] },
    { ...ps[1], c0: cols, r0: 0, color: PIECE_COLORS[1] },
  ];
}

function Tiles({ round, cols, rows, phase, cracked, celebrate }) {
  const ref = useRef();
  const C = obsidianColRange(round);
  const span = Math.max(round.b, C.max);
  const t = Math.min(0.72, MAX_W / span, MAX_D / round.a);
  const x0 = -(span * t) / 2;
  const z0 = CZ - (round.a * t) / 2;
  const count = round.a * span;
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.25, metalness: 0.35, flatShading: true, transparent: true }), []);
  const gapRef = useRef(0);

  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    gapRef.current += ((cracked ? 0.28 : 0) - gapRef.current) * (1 - Math.exp(-6 * dt));
    const g = gapRef.current;
    const grow = cols > round.b;
    let k = 0;
    for (let i = 0; i < round.a; i++) {
      for (let j = 0; j < span; j++) {
        const ghost = j >= round.b;
        const show = !ghost || (grow && j < cols);
        const left = j < cols;
        const top = round.kind === "area" ? i < rows : true;
        let col;
        if (ghost) col = GHOST;
        else if (celebrate) col = "#ffd166";
        else if (round.kind === "area") col = PIECE_COLORS[(top ? 0 : 2) + (left ? 0 : 1)];
        else col = grow ? PIECE_COLORS[0] : left ? PIECE_COLORS[0] : PIECE_COLORS[1];
        const dx = round.kind === "area" || !grow ? (left ? 0 : g) : ghost ? g : 0;
        const dz = round.kind === "area" && !top ? g : 0;
        _p.set(x0 + t * (j + 0.5) + dx, show ? 0.18 : -5, z0 + t * (i + 0.5) + dz);
        _q.identity();
        _s.set(t * 0.9, ghost ? 0.12 : 0.26, t * 0.9);
        _m.compose(_p, _q, _s);
        m.setMatrixAt(k, _m);
        m.setColorAt(k, _c.set(col));
        k++;
      }
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  useLayoutEffect(() => {
    if (ref.current) ref.current.count = count;
  }, [count]);

  return (
    <group>
      <instancedMesh ref={ref} args={[geo, mat, count]} castShadow frustumCulled={false} />
      <CrackLines round={round} cols={cols} rows={rows} phase={phase} unit={t} x0={x0} z0={z0} />
      <PieceChips round={round} cols={cols} rows={rows} phase={phase} unit={t} x0={x0} z0={z0} gap={0.28} />
      <Chip position={[x0 - 0.9, 0.5, CZ]} df={11}>{round.a}</Chip>
      <Chip position={[x0 + (round.b * t) / 2, 0.5, z0 - 0.7]} df={11}>{round.b}</Chip>
    </group>
  );
}

function Region({ round, cols, rows, phase, cracked, celebrate, rowsActive }) {
  const area = round.kind === "area";
  const C = obsidianColRange(round);
  const span = Math.max(round.b, C.max);
  const u = Math.min(MAX_W / span, MAX_D / round.a);
  const x0 = -(span * u) / 2;
  const z0 = CZ - (round.a * u) / 2;
  const g = cracked ? 0.3 : 0;
  const rects = pieceRects(round, cols, area && rowsActive ? rows : round.a, cracked).filter((p) => p.rows > 0 && p.cols > 0);
  return (
    <group>
      {rects.map((p, i) => {
        const w = p.cols * u, d = p.rows * u;
        const cx = x0 + p.c0 * u + w / 2 + (p.c0 > 0 ? g : 0);
        const cz = z0 + p.r0 * u + d / 2 + (p.r0 > 0 ? g : 0);
        return (
          <mesh key={i} position={[cx, p.take ? 0.08 : 0.16, cz]} castShadow>
            <boxGeometry args={[w - 0.04, p.take ? 0.14 : 0.3, d - 0.04]} />
            <meshStandardMaterial
              color={celebrate && !p.take ? "#ffd166" : p.color}
              roughness={0.25}
              metalness={0.35}
              transparent={p.take}
              opacity={p.take ? 0.55 : 1}
              emissive={p.take ? "#ff1a00" : "#000"}
              emissiveIntensity={p.take ? 0.5 : 0}
            />
          </mesh>
        );
      })}
      <CrackLines round={round} cols={cols} rows={rows} phase={phase} unit={u} x0={x0} z0={z0} />
      <PieceChips round={round} cols={cols} rows={rows} phase={phase} unit={u} x0={x0} z0={z0} gap={g} />
      <Chip position={[x0 - 0.9, 0.5, CZ]} df={11}>{round.a}</Chip>
      <Chip position={[x0 + (round.b * u) / 2, 0.5, z0 - 0.7]} df={11}>{round.b}</Chip>
    </group>
  );
}

function CrackLines({ round, cols, rows, phase, unit, x0, z0 }) {
  if (phase !== "crack") return null;
  const step = useObsidianChallenge.getState().crackStep;
  const D = round.a * unit;
  const lx = x0 + cols * unit;
  const W = Math.max(round.b, cols) * unit;
  return (
    <group>
      <mesh position={[lx, 0.36, z0 + D / 2]}>
        <boxGeometry args={[0.12, 0.1, D + 0.6]} />
        <meshBasicMaterial color={step === "cols" ? "#ffb347" : "#ff6a1a"} toneMapped={false} />
      </mesh>
      {round.kind === "area" && step === "rows" && (
        <mesh position={[x0 + W / 2, 0.36, z0 + rows * unit]}>
          <boxGeometry args={[W + 0.6, 0.1, 0.12]} />
          <meshBasicMaterial color="#ffb347" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function PieceChips({ round, cols, rows, phase, unit, x0, z0, gap }) {
  const pieces = useObsidianChallenge((s) => s.pieces);
  const results = useObsidianChallenge((s) => s.pieceResults);
  const status = useObsidianChallenge((s) => s.status);
  const area = round.kind === "area";
  const showRows = area && (phase !== "crack" || useObsidianChallenge.getState().crackStep === "rows");
  const rects = pieceRects(round, cols, area ? (showRows ? rows : round.a) : round.a, phase !== "crack");
  const usable = (area && !showRows ? rects.filter((_, i) => i < 2).map((p) => ({ ...p, rows: round.a, value: round.a * p.cols })) : rects).filter((p) => p.rows > 0 && p.cols > 0);
  const revealAll = status === "feedback" || status === "celebrate";
  return (
    <group>
      {usable.map((p, i) => {
        const w = p.cols * unit, d = p.rows * unit;
        const cx = x0 + p.c0 * unit + w / 2 + (p.c0 > 0 ? gap : 0);
        const cz = z0 + p.r0 * unit + d / 2 + (p.r0 > 0 ? gap : 0);
        const known = phase !== "crack" && (i < results.length || revealAll || phase === "total");
        const ok = results[i];
        const label = `${p.take ? "− " : ""}${p.rows} × ${p.cols}${known ? ` = ${p.value}` : ""}`;
        return (
          <Chip key={i} position={[cx, 0.9, cz]} df={11} className={`fc-count-chip${known ? (ok === false ? " bad" : " good") : ""}`}>
            {label}
          </Chip>
        );
      })}
      {phase !== "crack" && pieces.length > 0 && (status === "celebrate" || status === "feedback") && (
        <Chip position={[0, 2.0, z0 - 1.4]} df={10} className="fc-count-chip good">
          {round.a} × {round.b} = {round.product}
        </Chip>
      )}
    </group>
  );
}

export default function ObsidianStage() {
  const status = useObsidianChallenge((s) => s.status);
  const round = useObsidianChallenge((s) => s.currentRound());
  const cols = useObsidianChallenge((s) => s.cols);
  const rows = useObsidianChallenge((s) => s.rows);
  const phase = useObsidianChallenge((s) => s.phase);
  const crackStep = useObsidianChallenge((s) => s.crackStep);
  if (!round || status === "intro" || status === "done") return <StonePad w={12} d={7.4} position={[0, 0, CZ]} color="#241c22" />;
  const cracked = phase !== "crack";
  const celebrate = status === "celebrate";
  const Body = obsidianShowsTiles(round) ? Tiles : Region;
  return (
    <group>
      <StonePad w={12.4} d={7.6} position={[0, 0, CZ]} color="#241c22" />
      <Body
        key={round.roundIndex}
        round={round}
        cols={cols}
        rows={rows}
        phase={phase}
        cracked={cracked}
        celebrate={celebrate}
        rowsActive={phase !== "crack" || crackStep === "rows"}
      />
      {celebrate && <ConfettiBurst origin={[0, 0.5, CZ]} />}
    </group>
  );
}
