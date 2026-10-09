import React, { useEffect, useMemo, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { Box, Cyl, GableRoof } from "../farm/farmKit.jsx";
import { flatMat, getFarmTextures } from "../farm/farmMaterials.js";
import { getIslandTextures } from "./islandMaterials.js";
import { useFontsReady } from "./useFontsReady.js";
import StaticBatch from "../jungle/StaticBatch.jsx";
import { playerState } from "../sessionStore.js";
import { useProgress } from "../../progress/store.js";
import { useResults } from "../../results/resultStore.js";
import { useUI } from "../../ui/effects/uiStore.js";
import { ACHIEVEMENT_WALL } from "../../data/island/islandLayout.js";
import { achievementsSummary } from "../../data/island/achievements.js";
import {
  WALL_GEOM, WALL_BOARDS, boardLocalX, wallBaseY, inWallPromptZone,
} from "../../data/island/wallView.js";
import { PW, PH, paintBoard, paintHeader, makeCanvasTexture } from "./achievementsCanvas.js";

/**
 * THE ACHIEVEMENTS WALL — a stone-and-timber gallery wall on Harbour Green,
 * just west of the arch. Six framed boards (one per world, each in its
 * world's colours) under a shingled canopy, each lit by its own little
 * picture lamp, with the player's name on the header sign. The boards are
 * live canvases painted from data/island/achievements.js: they repaint when
 * you walk up, when your progress changes, and when you open the
 * first-person look (Enter — see ui/AchievementsWallUI.jsx + Player.jsx).
 */
const G = WALL_GEOM;
const W = ACHIEVEMENT_WALL;
const WALL_T = 0.6; // wall thickness

function Structure() {
  const tex = getIslandTextures();
  const ftex = getFarmTextures();
  const stone = flatMat("#ffffff", { map: tex.ashlar, roughness: 0.9 });
  const darkStone = flatMat("#ffffff", { map: tex.ashlarDark, roughness: 0.92 });
  const timber = flatMat("#7a5232", { roughness: 0.85 });
  const shingle = flatMat("#ffffff", { map: ftex.shingles, roughness: 0.85 });
  const L = W.length;
  const wallTop = G.headerY + G.headerH / 2 + 0.3;
  return (
    <group>
      {/* Plinth + the wall itself. */}
      <Box p={[0, G.plinthH / 2, 0.05]} s={[L + 0.5, G.plinthH, WALL_T + 0.6]} m={darkStone} tile={1.3} />
      <Box p={[0, G.plinthH + (wallTop - G.plinthH) / 2, -0.05]} s={[L, wallTop - G.plinthH, WALL_T]} m={stone} tile={1.5} />
      {/* A coping course along the top. */}
      <Box p={[0, wallTop + 0.08, -0.05]} s={[L + 0.2, 0.16, WALL_T + 0.2]} m="#e2d5bb" />
      {/* End pillars with lanterns. */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (L / 2 + 0.45), 0, 0]}>
          <Box p={[0, 0.35, 0]} s={[1.25, 0.7, 1.25]} m={darkStone} tile={1.1} />
          <Box p={[0, (wallTop + 0.6) / 2 + 0.35, 0]} s={[0.95, wallTop + 0.6 - 0.7, 0.95]} m={stone} tile={1.2} />
          <Box p={[0, wallTop + 0.62, 0]} s={[1.15, 0.18, 1.15]} m="#e2d5bb" />
          <Cyl p={[0, wallTop + 0.9, 0]} rt={0.16} rb={0.24} h={0.36} m="#2f3a46" />
          <mesh position={[0, wallTop + 1.32, 0]}>
            <boxGeometry args={[0.46, 0.55, 0.46]} />
            <meshStandardMaterial color="#fff3c8" emissive="#ffcf6a" emissiveIntensity={1.0} />
          </mesh>
          <mesh position={[0, wallTop + 1.74, 0]} rotation={[0, Math.PI / 4, 0]} material={flatMat("#2f3a46")}><coneGeometry args={[0.42, 0.36, 4]} /></mesh>
        </group>
      ))}
      {/* The canopy: timber brackets + a shingled gable roof running along the wall. */}
      {Array.from({ length: 5 }).map((_, k) => {
        const x = -L / 2 + 0.6 + (k * (L - 1.2)) / 4;
        return (
          <group key={k} position={[x, wallTop + 0.1, 0]}>
            <Box p={[0, 0.12, 0.55]} s={[0.16, 0.16, 1.5]} m={timber} />
            <mesh position={[0, -0.25, 0.72]} rotation={[0.75, 0, 0]} material={timber}><boxGeometry args={[0.12, 0.9, 0.12]} /></mesh>
          </group>
        );
      })}
      <group position={[0, wallTop + 0.24, 0.32]}>
        <GableRoof w={L + 1.4} d={2.3} rise={0.62} oh={0.05} roof={shingle} wall={timber} tile={1.4} />
      </group>
      {/* Board frames: a deep frame in the world's colour + a gold inner trim. */}
      {Array.from({ length: WALL_BOARDS }).map((_, i) => (
        <group key={i} position={[boardLocalX(i), G.boardY, G.boardFace]}>
          {/* (Frame face 6 cm behind the board; the gold trim 1 cm behind it.) */}
          <Box p={[0, 0, -0.14]} s={[G.boardW + 0.3, G.boardH + 0.3, 0.16]} m={FRAME_COLS[i]} />
          <Box p={[0, 0, -0.04]} s={[G.boardW + 0.1, G.boardH + 0.1, 0.06]} m="#e8c25a" />
          {/* The picture lamp's arm. */}
          <Box p={[0, G.boardH / 2 + 0.28, 0.02]} s={[0.08, 0.3, 0.08]} m="#2f3a46" />
          <Box p={[0, G.boardH / 2 + 0.42, 0.22]} s={[0.06, 0.06, 0.48]} m="#2f3a46" />
        </group>
      ))}
      {/* The header sign's frame. */}
      <Box p={[0, G.headerY, G.boardFace - 0.12]} s={[G.headerW + 0.3, G.headerH + 0.3, 0.16]} m="#173d6a" />
      {/* Flower planters either side of the boards. */}
      {[-1, 1].map((s) => (
        <group key={`pl${s}`} position={[s * (L / 2 - 0.2), 0, 1.1]}>
          <Box p={[0, 0.3, 0]} s={[1.2, 0.6, 0.7]} m={darkStone} tile={1} />
          <Box p={[0, 0.62, 0]} s={[1.05, 0.06, 0.55]} m="#5b3f27" />
          {Array.from({ length: 6 }).map((_, k) => (
            <mesh key={k} position={[-0.4 + k * 0.16, 0.78 + (k % 2) * 0.08, (k % 3 - 1) * 0.12]} material={flatMat(k % 2 ? "#4f9a3a" : ["#ff6b8a", "#ffd23f", "#b48cff"][k % 3], { roughness: 0.8 })}>
              <icosahedronGeometry args={[0.17, 0]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
const FRAME_COLS = ["#1f7fc4", "#d9822b", "#e2a018", "#2f95d0", "#d9442a", "#1f9a4c"];

/** The flagstone apron in front of the wall (so it reads as a place to stand). */
function Apron() {
  const tex = useMemo(() => {
    const t = getIslandTextures().paving;
    if (!t) return null;
    const c = t.clone();
    c.needsUpdate = true;
    c.wrapS = c.wrapT = THREE.RepeatWrapping;
    c.repeat.set(W.length / 4, 4.5 / 4);
    return c;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 2.3]} receiveShadow>
      <planeGeometry args={[W.length + 1.6, 4.5]} />
      <meshStandardMaterial map={tex} color="#efe6d4" roughness={0.9} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
    </mesh>
  );
}

export default function AchievementsWall() {
  const ready = useFontsReady();
  const boards = useMemo(() => (typeof document === "undefined" ? [] : Array.from({ length: WALL_BOARDS }, () => makeCanvasTexture(PW, PH))), []);
  const header = useMemo(() => (typeof document === "undefined" ? null : makeCanvasTexture(1500, 150)), []);
  const lamps = useRef([]);
  const glow = useRef([]);
  const near = useRef(false);

  const repaint = useCallback(() => {
    if (!boards.length) return;
    const s = achievementsSummary(useProgress.getState(), useResults.getState().results);
    s.panels.forEach((P, i) => { paintBoard(boards[i].cv, P); boards[i].tex.needsUpdate = true; });
    if (header) { paintHeader(header.cv, s); header.tex.needsUpdate = true; }
  }, [boards, header]);

  // Paint once the fonts are in, and again whenever progress or results change.
  useEffect(() => { repaint(); }, [repaint, ready]);
  useEffect(() => {
    const a = useProgress.subscribe(() => { if (near.current) repaint(); });
    const b = useResults.subscribe(() => { if (near.current) repaint(); });
    const c = useUI.subscribe((s, p) => { if (s.wallView && !p.wallView) repaint(); });
    return () => { a(); b(); c(); };
  }, [repaint]);
  useEffect(() => () => { boards.forEach((b) => b.tex.dispose()); if (header) header.tex.dispose(); }, [boards, header]);

  // Repaint as you walk up (the farm/snow/magma bests live in localStorage).
  const y0 = useMemo(() => wallBaseY(), []);
  useFrame((state) => {
    const d = Math.hypot(playerState.x - W.position[0], playerState.z - W.position[1]);
    const isNear = d < 45;
    if (isNear && !near.current) repaint();
    near.current = isNear;
    // The picture lamps: a soft breathing glow, brightest on the board you're looking at.
    const view = useUI.getState().wallView;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < WALL_BOARDS; i++) {
      const m = lamps.current[i];
      const on = view && view.panel === i;
      if (m) m.emissiveIntensity = on ? 1.6 : 0.9 + Math.sin(t * 1.3 + i) * 0.08;
      const gl = glow.current[i];
      if (gl) gl.opacity = on ? 0.32 : view ? 0.08 : 0.16;
    }
  });

  // Tap a board: look at it (when you're standing in front of the wall).
  const onBoard = (i) => (e) => {
    const ui = useUI.getState();
    if (ui.wallView) { e.stopPropagation(); ui.openWall(i); return; }
    if (inWallPromptZone(playerState.x, playerState.z)) { e.stopPropagation(); ui.openWall(i); }
  };

  return (
    <group position={[W.position[0], y0, W.position[1]]} rotation={[0, W.rotationY, 0]}>
      <StaticBatch>
        <Structure />
      </StaticBatch>
      <Apron />
      {boards.map((b, i) => (
        <group key={i} position={[boardLocalX(i), G.boardY, G.boardFace]}>
          <mesh onPointerDown={onBoard(i)}>
            <planeGeometry args={[G.boardW, G.boardH]} />
            <meshStandardMaterial map={b.tex} roughness={0.75} emissive="#ffffff" emissiveMap={b.tex} emissiveIntensity={0.12} />
          </mesh>
          {/* The lamp head + its pool of light on the board. */}
          <mesh position={[0, G.boardH / 2 + 0.36, 0.5]} rotation={[0.5, 0, 0]}>
            <boxGeometry args={[0.9, 0.1, 0.16]} />
            <meshStandardMaterial ref={(m) => (lamps.current[i] = m)} color="#fff6d8" emissive="#ffd890" emissiveIntensity={0.9} />
          </mesh>
          <mesh position={[0, G.boardH * 0.18, 0.01]}>
            <planeGeometry args={[G.boardW, G.boardH * 0.64]} />
            <meshBasicMaterial ref={(m) => (glow.current[i] = m)} map={LAMP_POOL()} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {header && (
        <mesh position={[0, G.headerY, G.boardFace - 0.02]}>
          <planeGeometry args={[G.headerW, G.headerH]} />
          <meshStandardMaterial map={header.tex} roughness={0.6} emissive="#ffffff" emissiveMap={header.tex} emissiveIntensity={0.1} />
        </mesh>
      )}
    </group>
  );
}

// A soft cone of light from above (top bright → fades down + to the sides).
let _pool = null;
function LAMP_POOL() {
  if (_pool || typeof document === "undefined") return _pool;
  const cv = document.createElement("canvas");
  cv.width = 128; cv.height = 128;
  const g = cv.getContext("2d");
  const gr = g.createRadialGradient(64, 0, 4, 64, 0, 128);
  gr.addColorStop(0, "rgba(255,236,190,1)");
  gr.addColorStop(0.5, "rgba(255,228,170,0.35)");
  gr.addColorStop(1, "rgba(255,220,160,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  _pool = new THREE.CanvasTexture(cv);
  _pool.colorSpace = THREE.SRGBColorSpace;
  return _pool;
}
