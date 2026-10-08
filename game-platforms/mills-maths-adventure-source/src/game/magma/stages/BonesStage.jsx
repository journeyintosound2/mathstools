import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useBonesChallenge } from "../stores/bonesStore.js";
import { BONE_NAMES } from "../../../data/magma/bonesChallenge.js";
import { Chip } from "./StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";

/**
 * GROW THE DRAGON — two dragon skeletons mounted on stone plinths: the
 * given one (baby, or the big dragon on toy rounds) and the one being
 * built. Until "Raise!" the new dragon's bones lie on the ground with their
 * lengths; on Raise they fly up into the dragon's pose. Wrong proportions
 * give a visibly wonky dragon, with the TRUE dragon as a golden ghost.
 * Both skeletons share one scale, so the size difference is honest.
 */

const CZ = -0.8;
const BONE = "#ece0c6";
const ANG = {
  neck: [-Math.cos((40 * Math.PI) / 180), Math.sin((40 * Math.PI) / 180)],
  skull: [-Math.cos((14 * Math.PI) / 180), -Math.sin((14 * Math.PI) / 180)],
  tail: [Math.cos((22 * Math.PI) / 180), -Math.sin((22 * Math.PI) / 180)],
};

/** Joint points of a pose (metres, relative to the hip on the ground). */
function pose([Ls, Ln, Lb, Lt], u) {
  const leg = 0.42 * Lb * u + 0.25;
  const H = [0, leg];
  const S = [H[0] - Lb * u, H[1]];
  const N = [S[0] + ANG.neck[0] * Ln * u, S[1] + ANG.neck[1] * Ln * u];
  const K = [N[0] + ANG.skull[0] * Ls * u, N[1] + ANG.skull[1] * Ls * u];
  const T = [H[0] + ANG.tail[0] * Lt * u, H[1] + ANG.tail[1] * Lt * u];
  return { H, S, N, K, T, leg, left: Math.min(K[0], N[0], S[0]), right: T[0] };
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

/** A bone between two points (a cylinder), with knobs at the joints. */
function Bone({ a, b, thick, color = BONE, ghost }) {
  const { pos, quat, len } = useMemo(() => {
    _a.set(a[0], a[1], 0);
    _b.set(b[0], b[1], 0);
    const d = _b.clone().sub(_a);
    const l = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(_up, d.clone().normalize());
    return { pos: _a.clone().add(_b).multiplyScalar(0.5), quat: q, len: l };
  }, [a[0], a[1], b[0], b[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  const mat = ghost
    ? <meshStandardMaterial color="#ffd166" emissive="#ffb000" emissiveIntensity={0.5} transparent opacity={0.3} depthWrite={false} />
    : <meshStandardMaterial color={color} roughness={0.75} flatShading />;
  return (
    <group>
      <mesh position={pos} quaternion={quat} castShadow={!ghost}>
        <cylinderGeometry args={[thick * 0.7, thick, len, 7]} />
        {mat}
      </mesh>
      <mesh position={[b[0], b[1], 0]}>
        <sphereGeometry args={[thick * 1.25, 8, 6]} />
        {mat}
      </mesh>
    </group>
  );
}

function Skeleton({ lens, u, x, thick, ghost, color, wrong }) {
  const P = pose(lens, u);
  const ribs = [0.2, 0.4, 0.6, 0.8].map((t) => [P.H[0] + (P.S[0] - P.H[0]) * t, P.H[1]]);
  const ribR = Math.max(0.12, lens[2] * u * 0.17);
  const c = (k) => (wrong && wrong[k] ? "#ff7a5c" : color);
  return (
    <group position={[x, 0, CZ]}>
      <Bone a={P.H} b={P.S} thick={thick} ghost={ghost} color={c(2)} />
      <Bone a={P.S} b={P.N} thick={thick * 0.85} ghost={ghost} color={c(1)} />
      <Bone a={P.N} b={P.K} thick={thick * 1.5} ghost={ghost} color={BONE} />
      <Bone a={P.H} b={P.T} thick={thick * 0.8} ghost={ghost} color={c(3)} />
      {!ghost && (
        <>
          <Bone a={P.S} b={[P.S[0] - 0.05, 0.05]} thick={thick * 0.7} />
          <Bone a={P.H} b={[P.H[0] + 0.05, 0.05]} thick={thick * 0.7} />
          {ribs.map(([rx, ry], i) => (
            <mesh key={i} position={[rx, ry - ribR * 0.2, 0]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[ribR, thick * 0.35, 5, 10, Math.PI]} />
              <meshStandardMaterial color={c(2)} roughness={0.8} />
            </mesh>
          ))}
          {/* Eye socket glow on the skull. */}
          <mesh position={[(P.N[0] + P.K[0]) / 2, (P.N[1] + P.K[1]) / 2 + thick * 0.8, thick]}>
            <sphereGeometry args={[thick * 0.45, 6, 5]} />
            <meshBasicMaterial color="#ff5a1a" toneMapped={false} />
          </mesh>
        </>
      )}
    </group>
  );
}

/** The new dragon's bones laid out on a tray, waiting to be raised. */
function LooseBones({ vals, skull, u, x, width }) {
  const lens = [skull, ...vals];
  const ws = lens.map((L) => Math.max(0.45, L * u));
  const gap = 0.6;
  const total = ws.reduce((a, b) => a + b, 0) + gap * (lens.length - 1);
  const scale = Math.min(1, (width - 0.4) / total);
  let cx = x + (width - total * scale) / 2;
  return (
    <group position={[0, 0, CZ]}>
      <mesh position={[x + width / 2, 0.08, 0]} receiveShadow>
        <boxGeometry args={[width, 0.16, 1.5]} />
        <meshStandardMaterial color="#3d3431" roughness={0.95} />
      </mesh>
      {lens.map((L, k) => {
        const w = ws[k] * scale;
        const px = cx + w / 2;
        cx += w + gap * scale;
        return (
          <group key={k} position={[px, 0.32, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.11, 0.14, w, 7]} />
              <meshStandardMaterial color={BONE} roughness={0.8} />
            </mesh>
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[(sd * w) / 2, 0, 0]}>
                <sphereGeometry args={[0.18, 8, 6]} />
                <meshStandardMaterial color={BONE} roughness={0.8} />
              </mesh>
            ))}
            <Chip position={[0, 0.75, 0.2]} df={10} className={`fc-count-chip${k === 0 ? " good" : ""}`}>
              {BONE_NAMES[k]} {L}
            </Chip>
          </group>
        );
      })}
    </group>
  );
}

function Plinth({ x, w }) {
  return (
    <mesh position={[x, 0.06, CZ]} receiveShadow>
      <boxGeometry args={[w, 0.12, 1.4]} />
      <meshStandardMaterial color="#3d3431" roughness={0.95} />
    </mesh>
  );
}

export default function BonesStage() {
  const status = useBonesChallenge((s) => s.status);
  const round = useBonesChallenge((s) => s.currentRound());
  const vals = useBonesChallenge((s) => s.vals);
  const phase = useBonesChallenge((s) => s.phase);
  const grade = useBonesChallenge((s) => s.grade);
  const lastRaise = useBonesChallenge((s) => s.lastRaise);
  const raiseRef = useRef();
  const raiseAt = lastRaise?.at;
  useFrame(() => {
    const g = raiseRef.current;
    if (!g) return;
    const t = raiseAt ? Math.min(1, (Date.now() - raiseAt) / 700) : 1;
    const e = 1 - Math.pow(1 - t, 3);
    g.scale.set(1, 0.05 + 0.95 * e, 1);
  });
  if (!round || status === "intro" || status === "done") return null;
  const ended = status === "celebrate" || status === "feedback";
  const raised = Boolean(grade) && (phase === "retry" || ended);
  const built = [round.adult[0], ...vals];
  const span = (lens) => {
    const P = pose(lens, 1);
    return P.right - P.left;
  };
  const maxSpan = Math.max(span(round.baby), span(round.adult), span(built));
  const u = Math.min(0.6, 6.4 / maxSpan);
  const babyP = pose(round.baby, u);
  const builtP = pose(built, u);
  const adultP = pose(round.adult, u);
  // Given dragon on the left, the new one on the right, the pair centred.
  const bx = -0.6 - babyP.right;
  const ax = 0.6 - Math.min(builtP.left, adultP.left);
  const mid = ((bx + babyP.left) + (ax + Math.max(adultP.right, builtP.right))) / 2;
  const babyX = bx - mid;
  const adultX = ax - mid;
  const thickBaby = Math.max(0.05, round.baby[0] * u * 0.16);
  const thickAdult = Math.max(0.05, round.adult[0] * u * 0.16);
  const wrong = grade ? grade.correct.map((ok) => !ok) : null;
  const k = round.factorText;
  return (
    <group>
      <Plinth x={babyX + (babyP.left + babyP.right) / 2} w={babyP.right - babyP.left + 1} />
      <Plinth x={adultX + (adultP.left + adultP.right) / 2} w={Math.max(adultP.right, builtP.right) - Math.min(adultP.left, builtP.left) + 1} />
      <Skeleton lens={round.baby} u={u} x={babyX} thick={thickBaby} color={BONE} />
      <Chip position={[babyX + (babyP.left + babyP.right) / 2, babyP.N[1] + 1.1, CZ]} df={11} className="fc-count-chip">
        {round.toy ? "Big dragon" : "Baby"}: {round.baby.join(" · ")}
      </Chip>
      {raised ? (
        <group ref={raiseRef}>
          <Skeleton lens={built} u={u} x={adultX} thick={thickAdult} color={BONE} wrong={grade.all ? null : [false, ...wrong]} />
        </group>
      ) : (
        <LooseBones vals={vals} skull={round.adult[0]} u={u} x={adultX + adultP.left} width={Math.max(5.5, adultP.right - adultP.left + 1)} />
      )}
      {raised && !grade.all && <Skeleton lens={round.adult} u={u} x={adultX} thick={thickAdult} ghost />}
      <Chip position={[adultX + (adultP.left + adultP.right) / 2, Math.max(adultP.N[1], builtP.N[1]) + 1.2, CZ]} df={10} className={`fc-count-chip${ended && grade?.all ? " good" : ""}`}>
        {round.toy ? "Toy" : "Grown-up"}: {raised ? built.join(" · ") : `skull ${round.adult[0]}`}
        {ended ? `  (× ${k})` : ""}
      </Chip>
      {status === "celebrate" && <ConfettiBurst origin={[adultX, 1, CZ]} />}
    </group>
  );
}
