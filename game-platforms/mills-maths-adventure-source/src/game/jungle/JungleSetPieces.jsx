import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  ensureJungleStructures, JUNGLE_BRIDGES, VINE_WALLS, LEAF_PADS, MID_LEDGE, STAIR_FLIGHTS, FALLS_DECK,
  BOUNCE_PADS, TOADSTOOL, MUSHROOM_LEDGE, GREAT_TREE, GREAT_STAIR, ROPE_BRIDGE, TEMPLE, LOOKOUT, LAGOON,
  JUNGLE_WELCOME_SIGN, terrainHeight, escarpZ, ARRIVAL_GLADE, JUNGLE_SPOTS, getJungleStructures, jungleWaterAt,
} from "../../data/jungle/jungleLayout.js";
import { getJungleSetPieces } from "../../data/jungle/jungleProps.js";
import { getJungleTextures, makeFoliageMaterial } from "./jungleMaterials.js";
import { buildBroadleaf, buildRockMass, buildVineStrip } from "./jungleGeometry.js";
import InstancedChunks from "./InstancedChunks.jsx";
import StaticBatch from "./StaticBatch.jsx";
import { playerState } from "../sessionStore.js";

/**
 * JUNGLE SET-PIECES — everything hand-placed: the four river bridges + the
 * rope bridge, the VINE WALLS and LEAF POLES of the Vine Cliffs (with their
 * rock ledge), the Waterfall Stairs and the falls lookout deck, the Mushroom
 * Glade (bouncy toadstools that squash when you land, the ledge, the Giant
 * Toadstool), THE GREAT TREE (spiral stair, treehouse deck, hut, lanterns),
 * the TEMPLE RUINS, the Sky Shrine, the Canopy Lookout, the lagoon islet and
 * the trail signs. All positions/heights come from jungleLayout + jungleProps.
 */
const TAU = Math.PI * 2;
const WOOD = "#8a5d3a";
const WOOD_DARK = "#5e3d26";
const ROPE = "#c9a86a";
const STONE = "#9c9886";
const STONE_DARK = "#77735f";
const MOSS = "#4f8a2e";

function useTex() { return getJungleTextures(); }

/** A canvas texture with carved-looking text (signs). */
function textTexture(text, { w = 512, h = 128, bg = "#8a5d3a", fg = "#fff3d6", font = "bold 64px Georgia, serif", border = "#5e3d26" } = {}) {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const g = cv.getContext("2d");
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  // Wood grain.
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(60,35,20,${0.08 + Math.random() * 0.12})`;
    g.lineWidth = 1 + Math.random() * 2;
    g.beginPath();
    const y = Math.random() * h;
    g.moveTo(0, y);
    g.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + 3);
    g.stroke();
  }
  g.strokeStyle = border; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  g.font = font;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "rgba(40,22,10,0.55)";
  g.fillText(text, w / 2 + 3, h / 2 + 4);
  g.fillStyle = fg;
  g.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A thin cylinder between two points. */
function Rod({ a, b, r = 0.06, color = ROPE, segs = 6, castShadow = false }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const d = vb.clone().sub(va);
    const len = d.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    const pos = va.clone().add(vb).multiplyScalar(0.5);
    return { pos: pos.toArray(), quat, len };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} castShadow={castShadow}>
      <cylinderGeometry args={[r, r, len, segs]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// BRIDGES
// ---------------------------------------------------------------------------
function deckGeometry(b, { thick = 0.28, segs = 24, widthScale = 1, uvScale = 1 } = {}) {
  const dx = b.to[0] - b.from[0], dz = b.to[1] - b.from[1];
  const L = Math.hypot(dx, dz);
  const nx = -dz / L, nz = dx / L;
  const w = b.halfWidth * widthScale;
  const pos = [], uv = [], idx = [];
  // top surface + bottom surface strips
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const cx = b.from[0] + dx * t, cz = b.from[1] + dz * t;
    const y = b.deckAt(t);
    pos.push(cx + nx * w, y, cz + nz * w, cx - nx * w, y, cz - nz * w, cx + nx * w, y - thick, cz + nz * w, cx - nx * w, y - thick, cz - nz * w);
    const v = (t * L) / (2 * w) * uvScale;
    uv.push(0, v, 1, v, 0, v, 1, v);
    if (i > 0) {
      const a = (i - 1) * 4, c = i * 4;
      idx.push(a, c, a + 1, a + 1, c, c + 1); // top
      idx.push(a + 2, a + 3, c + 2, a + 3, c + 3, c + 2); // bottom
      idx.push(a, a + 2, c, a + 2, c + 2, c); // side +
      idx.push(a + 1, c + 1, a + 3, a + 3, c + 1, c + 3); // side −
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function Bridge({ b }) {
  const tex = useTex();
  const geo = useMemo(() => deckGeometry(b, { thick: b.style === "stone" ? 0.6 : b.style === "log" ? 0.7 : 0.25, widthScale: b.style === "log" ? 0.95 : 1 }), [b]);
  const dx = b.to[0] - b.from[0], dz = b.to[1] - b.from[1];
  const L = Math.hypot(dx, dz);
  const nx = -dz / L, nz = dx / L;
  const at = (t, side, up = 0) => [b.from[0] + dx * t + nx * (b.halfWidth + 0.25) * side, b.deckAt(t) + up, b.from[1] + dz * t + nz * (b.halfWidth + 0.25) * side];
  const posts = [];
  const n = Math.max(3, Math.round(L / (b.style === "rope" ? 2.2 : 1.8)));
  for (let i = 0; i <= n; i++) posts.push(i / n);
  const deckMat = b.style === "stone"
    ? <meshStandardMaterial map={tex.stone} color="#c4bea6" roughness={0.95} />
    : b.style === "log"
      ? <meshStandardMaterial map={tex.bark} color="#9a7354" roughness={0.95} />
      : <meshStandardMaterial map={tex.planks} color="#d0a77c" roughness={0.9} />;
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>{deckMat}</mesh>
      {b.style === "stone" && (
        <>
          {/* Parapet walls. */}
          {[1, -1].map((side) => {
            const pts = [];
            for (let i = 0; i <= 16; i++) pts.push(i / 16);
            return pts.slice(0, -1).map((t, i) => {
              const p0 = at(t, side), p1 = at(pts[i + 1], side);
              const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 0.38, (p0[2] + p1[2]) / 2];
              const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
              const yaw = Math.atan2(-(p1[2] - p0[2]), p1[0] - p0[0]);
              const pitch = Math.atan2(p1[1] - p0[1], Math.hypot(p1[0] - p0[0], p1[2] - p0[2]));
              return (
                <mesh key={`${side}-${i}`} position={mid} rotation={[0, yaw, pitch, "YXZ"]} castShadow>
                  <boxGeometry args={[len + 0.04, 0.7, 0.42]} />
                  <meshStandardMaterial map={tex.stoneMossy} color={i % 2 ? STONE : STONE_DARK} roughness={0.95} />
                </mesh>
              );
            });
          })}
          {/* The arch beneath. */}
          <mesh position={[(b.from[0] + b.to[0]) / 2, Math.min(b.h0, b.h1) - 0.95, (b.from[1] + b.to[1]) / 2]} rotation={[0, Math.atan2(-dz, dx), 0]}>
            <torusGeometry args={[L * 0.36, 0.42, 6, 16, Math.PI]} />
            <meshStandardMaterial map={tex.stoneMossy} color={STONE_DARK} roughness={0.95} />
          </mesh>
        </>
      )}
      {b.style !== "stone" && posts.map((t, i) => [1, -1].map((side) => {
        if (b.style === "log" && side === -1) return null; // one-sided rope rail on logs
        const p = at(t, side);
        const ph = b.style === "rope" ? 1.25 : 1.05;
        return (
          <mesh key={`${i}-${side}`} position={[p[0], p[1] + ph / 2 - 0.15, p[2]]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, ph + 0.3, 6]} />
            <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
          </mesh>
        );
      }))}
      {b.style !== "stone" && [1, -1].map((side) => {
        if (b.style === "log" && side === -1) return null;
        const ph = b.style === "rope" ? 1.15 : 0.95;
        return posts.slice(0, -1).map((t, i) => (
          <Rod key={`r${side}-${i}`} a={at(t, side, ph)} b={at(posts[i + 1], side, ph)} r={0.045} color={b.style === "plank" ? WOOD : ROPE} />
        ));
      })}
      {b.style === "rope" && [1, -1].map((side) => posts.slice(0, -1).map((t, i) => (
        <Rod key={`l${side}-${i}`} a={at(t, side, 0.55)} b={at(posts[i + 1], side, 0.55)} r={0.03} color={ROPE} />
      )))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE VINE CLIFFS — climbable vine walls, leaf poles, the rock ledge.
// ---------------------------------------------------------------------------
function VineWall({ w }) {
  const tex = useTex();
  const mat = useMemo(() => makeFoliageMaterial({ sway: 0.5, map: tex.vine, alphaTest: 0.4, side: THREE.DoubleSide, key: "vinewall" }), [tex]);
  const { slab, strands, leaves } = useMemo(() => {
    // A slanted rock face from the foot (base) to the lip (top).
    const H = w.top - w.base;
    const p = (t, f, out = 0.12) => {
      const s = 0.35 - f * w.cliffW + out;
      return [w.a[0] + w.tx * t + w.nx * s, w.base + f * H, w.a[1] + w.tz * t + w.nz * s];
    };
    const g = new THREE.BufferGeometry();
    const pts = [p(-0.4, 0, 0.02), p(w.len + 0.4, 0, 0.02), p(-0.4, 1, 0.02), p(w.len + 0.4, 1, 0.02)];
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, H / 2, 1, H / 2], 2));
    g.setIndex([0, 1, 2, 1, 3, 2]);
    g.computeVertexNormals();
    // Thick vine strands (a lattice) + leaf strips.
    const strands = [];
    const nS = Math.max(4, Math.round(w.len / 1.2));
    for (let i = 0; i <= nS; i++) {
      const t = (i / nS) * w.len;
      const wob = (k) => Math.sin(k * 2.3 + i) * 0.18;
      const segs = 8;
      for (let k = 0; k < segs; k++) {
        const f0 = k / segs, f1 = (k + 1) / segs;
        strands.push([p(t + wob(k), f0, 0.2), p(t + wob(k + 1), f1, 0.2)]);
      }
    }
    for (let k = 1; k < 4; k++) {
      // A few looping cross-vines.
      const f = k / 4;
      strands.push([p(0.1, f, 0.22), p(w.len / 2, f + 0.04, 0.3)]);
      strands.push([p(w.len / 2, f + 0.04, 0.3), p(w.len - 0.1, f, 0.22)]);
    }
    const leaves = [];
    const nL = Math.round(w.len * 4.2);
    for (let i = 0; i < nL; i++) {
      const t = (i + 0.5) / nL * w.len;
      leaves.push({ top: p(t, 1.0, 0.25), len: H * (0.75 + ((i * 37) % 10) * 0.025), t });
    }
    return { slab: g, strands, leaves };
  }, [w]);
  const stripGeo = useMemo(() => buildVineStrip(), []);
  const leafItems = useMemo(() => leaves.map((l, i) => ({
    x: l.top[0] + w.nx * 0.05 * (i % 3), y: l.top[1], z: l.top[2] + w.nz * 0.05 * (i % 3), s: 1, sx: 2.3, sy: l.len, rot: Math.atan2(w.nx, w.nz), rx: Math.atan2(w.cliffW, w.top - w.base) * 0.9, tint: (i * 0.37) % 1,
  })), [leaves, w]);
  return (
    <group>
      <mesh geometry={slab}>
        <meshStandardMaterial map={tex.stoneMossy} color="#857f6c" roughness={1} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {strands.map(([a, b], i) => <Rod key={i} a={a} b={b} r={0.055} color="#3d6b24" segs={5} />)}
      <InstancedChunks items={leafItems} geometry={stripGeo} material={mat} tile={200} tintFn={(it, c) => c.setRGB(0.9 + 0.2 * it.tint, 1, 0.9)} />
      {/* A cluster of little flowers + a glowing leaf at the foot: "climb here". */}
      <mesh position={[w.a[0] + w.tx * w.len / 2 + w.nx * 0.8, w.base + 0.05, w.a[1] + w.tz * w.len / 2 + w.nz * 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.85, 24]} />
        <meshBasicMaterial color="#b6ff7a" transparent opacity={0.55} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

function LeafPoles() {
  const tex = useTex();
  return (
    <group>
      {LEAF_PADS.map((p) => {
        const h = p.top - p.floor;
        return (
          <group key={p.id} position={[p.c[0], p.floor, p.c[1]]}>
            {/* Green bamboo-ish pole with joints. */}
            <mesh position={[0, h / 2 - 0.1, 0]} castShadow>
              <cylinderGeometry args={[0.13, 0.17, h, 8]} />
              <meshStandardMaterial color="#5f9e34" roughness={0.6} />
            </mesh>
            {Array.from({ length: Math.max(1, Math.floor(h / 1.1)) }).map((_, k) => (
              <mesh key={k} position={[0, 0.9 + k * 1.1, 0]}>
                <cylinderGeometry args={[0.19, 0.19, 0.08, 8]} />
                <meshStandardMaterial color="#3f7a22" />
              </mesh>
            ))}
            {/* The leaf pad. */}
            <mesh position={[0, h - 0.04, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[p.r, p.r * 0.86, 0.1, 18]} />
              <meshStandardMaterial color="#4f9a2e" roughness={0.55} />
            </mesh>
            <mesh position={[0, h + 0.02, 0]} rotation={[-Math.PI / 2, 0, p.c[0]]}>
              <circleGeometry args={[p.r * 1.12, 18]} />
              <meshStandardMaterial alphaMap={tex.bigleaf} alphaTest={0.4} color="#7cc34a" roughness={0.5} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function MidLedge() {
  const L = MID_LEDGE;
  const floor = terrainHeight(L.c[0], L.c[1] + 3);
  const h = L.top - floor;
  const geo = useMemo(() => buildRockMass({ shape: "box", hx: L.hx, hz: L.hz, h: h + 0.6, seed: 4 }), [L, h]);
  return (
    <mesh geometry={geo} position={[L.c[0], floor - 0.6, L.c[1]]} castShadow receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={0.95} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// STAIR FLIGHTS (waterfall stairs, temple stairs, lookout steps) + landings.
// ---------------------------------------------------------------------------
function Flight({ f }) {
  const tex = useTex();
  const steps = useMemo(() => {
    const out = [];
    const rise = (f.h1 - f.h0) / f.n;
    const run = f.len / f.n;
    for (let k = 0; k < f.n; k++) {
      const t = (k + 0.5) / f.n;
      const top = f.h0 + rise * (k + 1);
      const x = f.a[0] + (f.b[0] - f.a[0]) * t, z = f.a[1] + (f.b[1] - f.a[1]) * t;
      const ground = Math.min(terrainHeight(x, z), top - 0.4);
      out.push({ x, z, top, bottom: ground - 0.3, run });
    }
    return out;
  }, [f]);
  const yaw = Math.atan2(-f.dir[1], f.dir[0]);
  const wood = f.style === "wood";
  const stoneTex = f.style === "temple" ? tex.stoneMossy : tex.stone;
  const nx = -f.dir[1], nz = f.dir[0];
  return (
    <group>
      {steps.map((s, k) => (
        <mesh key={k} position={[s.x, (s.top + s.bottom) / 2, s.z]} rotation={[0, yaw, 0]} castShadow receiveShadow>
          <boxGeometry args={[s.run + 0.02, s.top - s.bottom, f.width]} />
          {wood
            ? <meshStandardMaterial map={tex.planks} color="#c99a6e" roughness={0.9} />
            : <meshStandardMaterial map={stoneTex} color={k % 2 ? STONE : "#a7a28e"} roughness={0.95} />}
        </mesh>
      ))}
      {/* Balustrades: low walls (stone) or posts + rope (wood). */}
      {!wood && [1, -1].map((side) => steps.map((s, k) => (k % 2 === 0 ? (
        <mesh key={`${side}-${k}`} position={[s.x + nx * (f.width / 2 + 0.2) * side, s.top + 0.35, s.z + nz * (f.width / 2 + 0.2) * side]} rotation={[0, yaw, 0]} castShadow>
          <boxGeometry args={[s.run * 2 + 0.05, 0.75, 0.3]} />
          <meshStandardMaterial map={tex.stoneMossy} color={STONE_DARK} roughness={0.95} />
        </mesh>
      ) : null)))}
      {wood && [1, -1].map((side) => (
        <Rod key={side} a={[f.a[0] + nx * (f.width / 2 + 0.1) * side, f.h0 + 0.95, f.a[1] + nz * (f.width / 2 + 0.1) * side]} b={[f.b[0] + nx * (f.width / 2 + 0.1) * side, f.h1 + 0.95, f.b[1] + nz * (f.width / 2 + 0.1) * side]} r={0.05} color={WOOD} />
      ))}
    </group>
  );
}

function FallsDeck() {
  const tex = useTex();
  const D = FALLS_DECK;
  const [cx, cz] = D.c;
  const posts = [];
  for (let i = 0; i <= 8; i++) posts.push([cx - D.hx + (2 * D.hx * i) / 8, cz + D.hz]);
  for (let i = 1; i <= 3; i++) {
    posts.push([cx - D.hx, cz + D.hz - (D.hz * 2 - 1.4) * (i / 3)]);
    posts.push([cx + D.hx, cz + D.hz - (D.hz * 2 - 1.4) * (i / 3)]);
  }
  return (
    <group>
      <mesh position={[cx, D.top - 0.12, cz]} castShadow receiveShadow>
        <boxGeometry args={[D.hx * 2, 0.24, D.hz * 2]} />
        <meshStandardMaterial map={tex.planks} color="#d2a77a" roughness={0.9} />
      </mesh>
      {/* Support struts down to the cliff face. */}
      {[[-D.hx + 0.3, D.hz - 0.3], [D.hx - 0.3, D.hz - 0.3]].map(([ox, oz], i) => (
        <Rod key={i} a={[cx + ox, D.top - 0.2, cz + oz]} b={[cx + ox * 0.8, D.top - 5, cz - D.hz + 0.6]} r={0.12} color={WOOD_DARK} />
      ))}
      {posts.map(([x, z], i) => (
        <mesh key={`p${i}`} position={[x, D.top + 0.55, z]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 1.1, 6]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      <Rod a={[cx - D.hx, D.top + 1.05, cz + D.hz]} b={[cx + D.hx, D.top + 1.05, cz + D.hz]} r={0.05} color={WOOD} />
      <Rod a={[cx - D.hx, D.top + 1.05, cz + D.hz]} b={[cx - D.hx, D.top + 1.05, cz - D.hz + 1.4]} r={0.05} color={WOOD} />
      <Rod a={[cx + D.hx, D.top + 1.05, cz + D.hz]} b={[cx + D.hx, D.top + 1.05, cz - D.hz + 1.4]} r={0.05} color={WOOD} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE MUSHROOM GLADE
// ---------------------------------------------------------------------------
function spottedCapMaterial(color = "#e0362b") {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
}
function BounceMushroom({ p }) {
  const g = useRef();
  const cap = useRef();
  const lastHit = useRef(0);
  const squash = useRef(0);
  useFrame((_, dt) => {
    const hit = playerState.bounceHit;
    if (hit && hit.id === p.id && hit.t !== lastHit.current) { lastHit.current = hit.t; squash.current = 1; }
    squash.current = Math.max(0, squash.current - dt * 2.6);
    const s = squash.current;
    const wob = Math.sin((1 - s) * 18) * s;
    if (cap.current) cap.current.scale.set(1 + wob * 0.18, 1 - wob * 0.3, 1 + wob * 0.18);
  });
  const h = p.top - p.floor;
  // The cap is drawn as the same DOME you walk on: its crown at p.top and its
  // rim p.dome lower (see domeCap in jungleLayout) — a squashed half-sphere.
  const R = p.r * 1.06;
  const CAP_H = (p.dome || 0.45) / (1 - Math.sqrt(1 - (p.r / R) ** 2));
  const spots = useMemo(() => Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * TAU + (i % 2) * 0.3;
    const r = (i % 3 === 0 ? 0.25 : 0.62) * p.r;
    return [Math.cos(a) * r, Math.sin(a) * r];
  }), [p.r]);
  return (
    <group ref={g} position={[p.c[0], p.floor, p.c[1]]}>
      <mesh position={[0, h / 2 - 0.2, 0]} castShadow>
        <cylinderGeometry args={[p.r * 0.32, p.r * 0.42, h, 10]} />
        <meshStandardMaterial color="#f1e9d4" roughness={0.8} />
      </mesh>
      <group ref={cap} position={[0, h - CAP_H, 0]}>
        <mesh castShadow receiveShadow scale={[1, CAP_H / R, 1]}>
          <sphereGeometry args={[R, 18, 10, 0, TAU, 0, Math.PI / 2]} />
          <meshStandardMaterial color={p.id === "bounce-ledge" ? "#ff8a1f" : "#e0362b"} roughness={0.5} />
        </mesh>
        {spots.map(([sx, sz], i) => (
          <mesh key={i} position={[sx, Math.sqrt(Math.max(0, 1 - (sx * sx + sz * sz) / (R * R))) * CAP_H + 0.02, sz]} scale={[1, 0.35, 1]}>
            <sphereGeometry args={[p.r * 0.13, 8, 5]} />
            <meshStandardMaterial color="#fff7ea" roughness={0.6} />
          </mesh>
        ))}
        {/* Springy glow ring so it reads as "bounce me". */}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[p.r * 1.05, p.r * 1.22, 28]} />
          <meshBasicMaterial color="#ffe36b" transparent opacity={0.5} toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

function MushroomGlade() {
  const L = MUSHROOM_LEDGE;
  const ledgeFloor = terrainHeight(L.center[0], L.center[1]);
  const ledgeGeo = useMemo(() => buildRockMass({ shape: "cyl", r: L.radius * 0.97, h: L.rise + 0.8, seed: 9 }), [L]);
  const T = TOADSTOOL;
  const th = T.top - T.floor;
  const spots = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * TAU;
    const r = (i % 2 ? 0.45 : 0.75) * T.r;
    return [Math.cos(a) * r, Math.sin(a) * r];
  }), [T.r]);
  return (
    <group>
      {/* The rock ledge (the big mushroom's mega bounce lands you on it). */}
      <mesh geometry={ledgeGeo} position={[L.center[0], ledgeFloor - 0.8, L.center[1]]} castShadow receiveShadow>
        <meshStandardMaterial vertexColors flatShading roughness={0.95} />
      </mesh>
      {/* The Giant Toadstool. */}
      <group position={[T.c[0], T.floor, T.c[1]]}>
        <mesh position={[0, th / 2, 0]} castShadow>
          <cylinderGeometry args={[1.05, 1.45, th, 14]} />
          <meshStandardMaterial color="#efe4cc" roughness={0.8} />
        </mesh>
        <mesh position={[0, th - 0.35, 0]} castShadow receiveShadow scale={[1, 0.42, 1]}>
          <sphereGeometry args={[T.r * 1.05, 24, 12, 0, TAU, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#c43a8f" roughness={0.5} />
        </mesh>
        <mesh position={[0, th - 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[T.r * 1.04, 24]} />
          <meshStandardMaterial color="#f3d8e8" roughness={0.8} />
        </mesh>
        {spots.map(([sx, sz], i) => (
          <mesh key={i} position={[sx, th - 0.35 + Math.sqrt(Math.max(0, 1 - (sx * sx + sz * sz) / (T.r * T.r * 1.1))) * T.r * 0.44 + 0.03, sz]} scale={[1, 0.3, 1]}>
            <sphereGeometry args={[0.38, 8, 5]} />
            <meshStandardMaterial color="#fff2fb" emissive="#ffd6f0" emissiveIntensity={0.25} />
          </mesh>
        ))}
        {/* Gills glow faintly underneath. */}
        <pointLight position={[0, th - 1.2, 0]} color="#ff9ad5" intensity={6} distance={9} decay={2} />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE GREAT TREE — trunk, roots, crown, spiral stair, treehouse deck + hut.
// ---------------------------------------------------------------------------
function GreatTree({ highGfx }) {
  const tex = useTex();
  const T = GREAT_TREE;
  const S = GREAT_STAIR;
  const SP = useMemo(() => getJungleSetPieces(), []);
  const g0 = terrainHeight(T.center[0], T.center[1]);
  const crown = useMemo(() => {
    const geo = buildBroadleaf(31, { height: 34, emergent: true, spread: 2.2 });
    return geo;
  }, []);
  const crownMat = useMemo(() => makeFoliageMaterial({ sway: 0.35, key: "greattree" }), []);
  const steps = useMemo(() => {
    const out = [];
    for (let k = 0; k < S.n; k++) {
      const a = S.phi0 + (k + 0.5) * S.dphi;
      const rm = (S.rIn + S.rOut) / 2;
      out.push({ k, a, x: T.center[0] + Math.cos(a) * rm, z: T.center[1] + Math.sin(a) * rm, top: S.stepTop(k) });
    }
    return out;
  }, [S, T]);
  const rails = useMemo(() => {
    const out = [];
    const rr = S.rOut + 0.25;
    for (let k = 3; k < S.n; k += 2) {
      const a = S.phi0 + (k + 0.5) * S.dphi;
      out.push([T.center[0] + Math.cos(a) * rr, S.stepTop(k), T.center[1] + Math.sin(a) * rr]);
    }
    return out;
  }, [S, T]);
  const deckGeo = useMemo(() => {
    // Annulus with the hatch cut out over the stair's top.
    const shape = new THREE.Shape();
    shape.absarc(0, 0, T.deckR, 0, TAU, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, T.trunkR - 0.2, 0, TAU, true);
    shape.holes.push(hole);
    const g = new THREE.ShapeGeometry(shape, 48);
    g.rotateX(-Math.PI / 2);
    // Drop the hatch triangles (centroid inside the hatch sector).
    const pos = g.attributes.position;
    const idx = g.index.array;
    const keep = [];
    const deckIn = (x, z) => {
      const r = Math.hypot(x, z);
      if (r > S.rOut + 0.25) return false;
      const a = Math.atan2(z, x);
      const span = (S.phi0 + S.n * S.dphi + 0.05) - (S.phi0 + (S.n - Math.ceil(2.3 / S.rise)) * S.dphi);
      const a0 = S.phi0 + (S.n - Math.ceil(2.3 / S.rise)) * S.dphi;
      const rel = (((a - a0) % TAU) + TAU) % TAU;
      return rel <= span;
    };
    for (let i = 0; i < idx.length; i += 3) {
      const cx = (pos.getX(idx[i]) + pos.getX(idx[i + 1]) + pos.getX(idx[i + 2])) / 3;
      const cz = (pos.getZ(idx[i]) + pos.getZ(idx[i + 1]) + pos.getZ(idx[i + 2])) / 3;
      if (!deckIn(cx, cz)) keep.push(idx[i], idx[i + 1], idx[i + 2]);
    }
    g.setIndex(keep);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 2.2, pos.getZ(i) / 2.2);
    return g;
  }, [S, T]);
  const deckRail = useMemo(() => {
    const out = [];
    const r = T.deckR - 0.25;
    const n = 44;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const d = Math.abs(((a - SP.greatTree.bridgeAng + Math.PI) % TAU + TAU) % TAU - Math.PI);
      out.push({ a, x: T.center[0] + Math.cos(a) * r, z: T.center[1] + Math.sin(a) * r, gap: d < 0.11 });
    }
    return out;
  }, [T, SP]);
  const hut = SP.greatTree.hut;
  const lanterns = useMemo(() => [0.6, 2.2, 3.6, 5.0].map((a) => [T.center[0] + Math.cos(a) * (T.deckR - 0.25), T.deckY + 1.9, T.center[1] + Math.sin(a) * (T.deckR - 0.25)]), [T]);
  return (
    <group>
      {/* The trunk: a huge tapered column of bark with buttress roots. */}
      <mesh position={[T.center[0], g0 + 17, T.center[1]]} castShadow receiveShadow>
        <cylinderGeometry args={[T.trunkR - 0.6, T.trunkR - 0.05, 36, 24, 6]} />
        <meshStandardMaterial map={tex.bark} color="#a07a5c" roughness={0.95} />
      </mesh>
      {Array.from({ length: 9 }).map((_, i) => {
        const a = (i / 9) * TAU + 0.2;
        // Roots only where the stair passes high overhead (never at its foot).
        const rel = ((a - S.phi0) % TAU + TAU) % TAU;
        if (rel < 1.4 || rel > TAU - 0.45) return null;
        return (
          <mesh key={i} position={[T.center[0] + Math.cos(a) * (T.trunkR + 0.5), g0 + 0.8, T.center[1] + Math.sin(a) * (T.trunkR + 0.5)]} rotation={[0, -a, 0.75]} castShadow>
            <coneGeometry args={[0.85, 3.2, 5]} />
            <meshStandardMaterial map={tex.bark} color="#8f6a4e" roughness={0.95} />
          </mesh>
        );
      })}
      {/* The crown, high above the deck. */}
      <mesh geometry={crown} material={crownMat} position={[T.center[0], g0 + 2, T.center[1]]} castShadow />
      {/* Spiral stair: one plank per step on a bracket. */}
      {steps.map((s) => (
        <group key={s.k} position={[s.x, s.top, s.z]} rotation={[0, -s.a, 0]}>
          <mesh position={[0, -0.09, 0]} castShadow receiveShadow>
            <boxGeometry args={[S.rOut - S.rIn + 0.1, 0.18, 1.02]} />
            <meshStandardMaterial map={tex.planks} color="#c8996a" roughness={0.9} />
          </mesh>
          {s.k % 3 === 0 && s.top - terrainHeight(s.x, s.z) > 1.2 && (
            <mesh position={[-(S.rOut - S.rIn) / 2 + 0.15, -0.7, 0]} rotation={[0, 0, 0.6]}>
              <boxGeometry args={[0.14, 1.3, 0.14]} />
              <meshStandardMaterial color={WOOD_DARK} />
            </mesh>
          )}
        </group>
      ))}
      {/* Stair balustrade: posts + a rope handrail. */}
      {rails.map((p, i) => (
        <mesh key={`sp${i}`} position={[p[0], p[1] + 0.5, p[2]]}>
          <cylinderGeometry args={[0.05, 0.06, 1.0, 5]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      {rails.slice(0, -1).map((p, i) => (
        <Rod key={`sr${i}`} a={[p[0], p[1] + 1.0, p[2]]} b={[rails[i + 1][0], rails[i + 1][1] + 1.0, rails[i + 1][2]]} r={0.035} color={ROPE} segs={4} />
      ))}
      {/* The treehouse deck (with the hatch the stair comes up through). */}
      <mesh geometry={deckGeo} position={[T.center[0], T.deckY + 0.001, T.center[1]]} receiveShadow castShadow>
        <meshStandardMaterial map={tex.planks} color="#d4a676" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[T.center[0], T.deckY - 0.18, T.center[1]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[T.deckR - 0.3, T.deckR, 48]} />
        <meshStandardMaterial color={WOOD_DARK} side={THREE.DoubleSide} />
      </mesh>
      {/* Deck railing. */}
      {deckRail.map((r, i) => !r.gap && (
        <mesh key={`dr${i}`} position={[r.x, T.deckY + 0.6, r.z]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 1.2, 6]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      {deckRail.map((r, i) => {
        const nx = deckRail[(i + 1) % deckRail.length];
        if (r.gap || nx.gap) return null;
        return <Rod key={`drr${i}`} a={[r.x, T.deckY + 1.15, r.z]} b={[nx.x, T.deckY + 1.15, nx.z]} r={0.045} color={WOOD} />;
      })}
      {/* Support struts under the deck. */}
      {Array.from({ length: 6 }).map((_, i) => {
        // Struts only where the stair's top turn isn't passing underneath.
        const a = S.phi0 + 2.95 + (i / 5) * 2.8;
        return <Rod key={`st${i}`} a={[T.center[0] + Math.cos(a) * (T.trunkR + 0.2), T.deckY - 5.5, T.center[1] + Math.sin(a) * (T.trunkR + 0.2)]} b={[T.center[0] + Math.cos(a) * (T.deckR - 0.6), T.deckY - 0.15, T.center[1] + Math.sin(a) * (T.deckR - 0.6)]} r={0.14} color={WOOD_DARK} />;
      })}
      {/* The hut. */}
      <TreeHut hut={hut} y={T.deckY} />
      {/* Paper lanterns. */}
      {lanterns.map((p, i) => (
        <group key={`ln${i}`} position={p}>
          <mesh>
            <sphereGeometry args={[0.3, 10, 8]} />
            <meshStandardMaterial color="#ffcf6b" emissive="#ffb43a" emissiveIntensity={0.9} roughness={0.6} />
          </mesh>
          <Rod a={[0, 0.3, 0]} b={[0, 1.0, 0]} r={0.015} color="#333" />
        </group>
      ))}
    </group>
  );
}
function TreeHut({ hut, y }) {
  const tex = useTex();
  const yaw = -hut.ang - Math.PI / 2;
  return (
    <group position={[hut.c[0], y, hut.c[1]]} rotation={[0, yaw, 0]}>
      {/* Walls (front has a doorway facing the trunk). */}
      <mesh position={[0, hut.h / 2, hut.d / 2]} castShadow receiveShadow>
        <boxGeometry args={[hut.w, hut.h, 0.18]} />
        <meshStandardMaterial map={tex.planks} color="#b98a5e" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * hut.w / 2, hut.h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.18, hut.h, hut.d]} />
          <meshStandardMaterial map={tex.planks} color="#b98a5e" />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`f${s}`} position={[s * (hut.w / 4 + 0.45), hut.h / 2, -hut.d / 2]} castShadow>
          <boxGeometry args={[hut.w / 2 - 0.9, hut.h, 0.18]} />
          <meshStandardMaterial map={tex.planks} color="#b98a5e" />
        </mesh>
      ))}
      <mesh position={[0, hut.h - 0.3, -hut.d / 2]}>
        <boxGeometry args={[1.6, 0.6, 0.18]} />
        <meshStandardMaterial map={tex.planks} color="#b98a5e" />
      </mesh>
      {/* Thatched roof. */}
      <mesh position={[0, hut.h + 0.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[Math.hypot(hut.w, hut.d) * 0.62, 1.7, 4]} />
        <meshStandardMaterial color="#b89a52" roughness={1} />
      </mesh>
      {/* A round window in the back wall. */}
      <mesh position={[0, hut.h * 0.58, hut.d / 2 + 0.1]}>
        <circleGeometry args={[0.38, 16]} />
        <meshStandardMaterial color="#ffd98a" emissive="#ffb84a" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// FLAGSTONES — irregular, slightly tilted paving slabs with mossy gaps (a few
// missing), laid over the ground in a disc. Used by the temple courtyard and
// the Sky Shrine.
// ---------------------------------------------------------------------------
function Flagstones({ c, r, skip, seed = 3, tint = "#c2bca4" }) {
  const ref = useRef();
  const tiles = useMemo(() => {
    let s = seed * 7919;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const out = [];
    const step = 1.5;
    for (let z = -r; z <= r; z += step) {
      for (let x = -r; x <= r; x += step) {
        const px = c[0] + x + (rnd() - 0.5) * 0.25, pz = c[1] + z + (rnd() - 0.5) * 0.25;
        const d = Math.hypot(px - c[0], pz - c[1]);
        if (d > r * (0.9 + rnd() * 0.12)) continue;
        if (rnd() < 0.06 + Math.max(0, (d - r * 0.7) / r) * 0.9) continue; // missing / scattered at the edge
        if (skip && skip(px, pz)) continue;
        out.push({ x: px, z: pz, y: terrainHeight(px, pz), w: 1.3 + rnd() * 0.18, d: 1.24 + rnd() * 0.2, rot: (rnd() - 0.5) * 0.18, tx: (rnd() - 0.5) * 0.05, tz: (rnd() - 0.5) * 0.05, v: 0.85 + rnd() * 0.25 });
      }
    }
    return out;
  }, [c, r, skip, seed]);
  React.useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    const base = new THREE.Color(tint);
    tiles.forEach((t, i) => {
      o.position.set(t.x, t.y + 0.05, t.z);
      o.rotation.set(t.tx, t.rot, t.tz);
      o.scale.set(t.w, 1, t.d);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, col.copy(base).multiplyScalar(t.v));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [tiles, tint]);
  return (
    <instancedMesh ref={ref} args={[null, null, tiles.length]} receiveShadow>
      <boxGeometry args={[1, 0.16, 1]} />
      <meshStandardMaterial roughness={0.95} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// THE TEMPLE RUINS
// ---------------------------------------------------------------------------
function Temple() {
  const tex = useTex();
  const SP = useMemo(() => getJungleSetPieces(), []);
  const T = TEMPLE;
  const [cx, cz] = T.c;
  const g = T.ground;
  const H = T.roofY - g;
  const ax = T.arch.x, az = T.arch.z;
  const paving = useMemo(() => {
    const c = JUNGLE_SPOTS.find((s) => s.id === "temple").center;
    return { c, r: 10.5, skip: (x, z) => Math.abs(z - TEMPLE.arch.z) < 2.6 || jungleWaterAt(x, z) !== null || x < TEMPLE.c[0] + 1.6 };
  }, []);
  const glyph = useMemo(() => {
    const s = new THREE.Shape();
    // An original sun-and-leaf glyph (rays + a leaf), not any franchise mark.
    s.absarc(0, 0, 0.55, 0, TAU, false);
    return new THREE.ShapeGeometry(s, 24);
  }, []);
  return (
    <group>
      {/* Courtyard paving (worn flagstones), clear of the stream channel. */}
      <Flagstones c={paving.c} r={paving.r} skip={paving.skip} seed={5} />
      {/* The temple mass: big mossy stone blocks. */}
      <mesh position={[cx - 5, g + H / 2 - 0.5, cz]} castShadow receiveShadow>
        <boxGeometry args={[12, H + 1, 20]} />
        <meshStandardMaterial map={tex.stoneMossy} color="#a19c86" roughness={0.95} />
      </mesh>
      {/* Stepped crown on the roof edge + a mossy roof top. */}
      <mesh position={[cx - 5, T.roofY + 0.06, cz]} receiveShadow>
        <boxGeometry args={[12.1, 0.14, 20.1]} />
        <meshStandardMaterial color="#5b8f36" roughness={1} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[cx + 0.4, T.roofY + 0.5, cz + s * 8.6]} castShadow>
          <boxGeometry args={[1.4, 1.0, 2.6]} />
          <meshStandardMaterial map={tex.stoneMossy} color={STONE} />
        </mesh>
      ))}
      {/* Facade: two great pillars + the archway (a dark recess the stream runs out of). */}
      {[-1, 1].map((s) => (
        <group key={`col${s}`} position={[ax + 0.3, g, az + s * 4.3]}>
          <mesh position={[0, H / 2, 0]} castShadow>
            <boxGeometry args={[1.5, H, 1.6]} />
            <meshStandardMaterial map={tex.stoneMossy} color="#aaa58e" roughness={0.95} />
          </mesh>
          <mesh position={[0, H + 0.2, 0]} castShadow>
            <boxGeometry args={[1.9, 0.5, 2.0]} />
            <meshStandardMaterial map={tex.stone} color={STONE_DARK} />
          </mesh>
        </group>
      ))}
      <mesh position={[ax + 0.05, g + T.arch.h / 2, az]}>
        <boxGeometry args={[0.4, T.arch.h, T.arch.halfW * 2]} />
        <meshStandardMaterial color="#141a12" roughness={1} />
      </mesh>
      <mesh position={[ax + 0.25, g + T.arch.h, az]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[T.arch.halfW, 0.42, 6, 18, Math.PI]} />
        <meshStandardMaterial map={tex.stoneMossy} color="#b0aa92" roughness={0.95} />
      </mesh>
      <mesh position={[ax + 0.06, g + T.arch.h, az]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[T.arch.halfW - 0.1, 18, 0, Math.PI]} />
        <meshStandardMaterial color="#141a12" side={THREE.DoubleSide} />
      </mesh>
      {/* Pediment with a glowing carved glyph above the arch. */}
      <mesh position={[ax + 0.3, g + T.arch.h + 1.9, az]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[1.25, 3]} />
        <meshStandardMaterial map={tex.stoneMossy} color="#b9b39b" side={THREE.DoubleSide} />
      </mesh>
      <group position={[ax + 0.42, g + T.arch.h + 1.75, az]} rotation={[0, Math.PI / 2, 0]}>
        <mesh geometry={glyph}>
          <meshBasicMaterial color="#9dffb0" toneMapped={false} />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[Math.cos((i / 8) * TAU) * 0.8, Math.sin((i / 8) * TAU) * 0.8, 0]} rotation={[0, 0, (i / 8) * TAU]}>
            <planeGeometry args={[0.32, 0.08]} />
            <meshBasicMaterial color="#9dffb0" toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* Stream channel: stone edging along the water out of the arch. */}
      {[-1, 1].map((s) => Array.from({ length: 6 }).map((_, i) => {
        const x = ax + 1.4 + i * 1.6;
        const z = az + s * 2.15;
        return (
          <mesh key={`ce${s}-${i}`} position={[x, terrainHeight(x, z) + 0.12, z]} rotation={[0, (i % 2) * 0.06, 0]} castShadow>
            <boxGeometry args={[1.5, 0.42, 0.5]} />
            <meshStandardMaterial map={tex.stoneMossy} color={STONE} />
          </mesh>
        );
      }))}
      {/* Colonnade (some pillars broken) + rubble. */}
      {SP.pillars.map((p, i) => (
        <group key={`p${i}`} position={[p.x, p.y, p.z]} rotation={[p.tilt, i * 0.7, p.tilt * 0.5]}>
          <mesh position={[0, p.h / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[p.r * 0.85, p.r, p.h, 10]} />
            <meshStandardMaterial map={tex.stoneMossy} color={i % 2 ? STONE : "#a8a38c"} roughness={0.95} />
          </mesh>
          {!p.broken && (
            <mesh position={[0, p.h + 0.18, 0]} castShadow>
              <boxGeometry args={[p.r * 2.4, 0.36, p.r * 2.4]} />
              <meshStandardMaterial map={tex.stone} color={STONE_DARK} />
            </mesh>
          )}
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[p.r * 2.5, 0.3, p.r * 2.5]} />
            <meshStandardMaterial map={tex.stone} color={STONE_DARK} />
          </mesh>
        </group>
      ))}
      {SP.rubble.map((r, i) => (
        <mesh key={`r${i}`} position={[r.x, r.y + 0.22 * r.s, r.z]} rotation={[r.tilt, r.rot, r.tilt * 0.6]} scale={r.s} castShadow receiveShadow>
          <boxGeometry args={[1.0, 0.6, 0.75]} />
          <meshStandardMaterial map={tex.stoneMossy} color={i % 2 ? STONE : STONE_DARK} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE SKY SHRINE, the CANOPY LOOKOUT, the lagoon islet.
// ---------------------------------------------------------------------------
function SkyShrine() {
  const tex = useTex();
  const SP = useMemo(() => getJungleSetPieces(), []);
  const S = SP.shrine;
  const ag = terrainHeight(S.altar.c[0], S.altar.c[1]);
  return (
    <group>
      <Flagstones c={S.c} r={6.6} seed={11} tint="#bdb7a0" />
      {S.stones.map((s, i) => (
        <mesh key={i} position={[s.x, s.y + (s.fallen ? 0.45 : s.h / 2 - 0.1), s.z]} rotation={s.fallen ? [Math.PI / 2 - 0.1, s.rot, 0] : [0.04 * (i % 3 - 1), s.rot, 0.03 * (i % 2)]} castShadow receiveShadow>
          <boxGeometry args={[1.0, s.h, 0.62]} />
          <meshStandardMaterial map={tex.stoneMossy} color={i % 2 ? STONE : "#a6a18a"} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[S.altar.c[0], ag + 0.5, S.altar.c[1]]} castShadow>
        <cylinderGeometry args={[S.altar.r * 0.85, S.altar.r, 1.0, 8]} />
        <meshStandardMaterial map={tex.stoneMossy} color={STONE} />
      </mesh>
    </group>
  );
}
/** The shrine's floating, turning crystal (animated — kept out of the batch). */
function ShrineCrystal() {
  const SP = useMemo(() => getJungleSetPieces(), []);
  const S = SP.shrine;
  const crystal = useRef();
  const ag = terrainHeight(S.altar.c[0], S.altar.c[1]);
  useFrame((state) => {
    if (!crystal.current) return;
    const t = state.clock.elapsedTime;
    crystal.current.rotation.y = t * 0.6;
    crystal.current.position.y = ag + 2.3 + Math.sin(t * 1.4) * 0.15;
  });
  return (
    <group>
      <mesh ref={crystal} position={[S.altar.c[0], ag + 2.3, S.altar.c[1]]}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color="#7dffb0" emissive="#2fe07a" emissiveIntensity={1.2} roughness={0.2} transparent opacity={0.9} />
      </mesh>
      <pointLight position={[S.altar.c[0], ag + 2.4, S.altar.c[1]]} color="#7dffb0" intensity={8} distance={10} decay={2} />
    </group>
  );
}

function LookoutFlag() {
  const L = LOOKOUT;
  const [cx, cz] = L.c;
  const flag = useRef();
  useFrame((state) => {
    if (flag.current) flag.current.rotation.y = Math.sin(state.clock.elapsedTime * 2.2) * 0.25;
  });
  return (
    <group ref={flag} position={[cx + L.hx - 0.3, L.top + 4.5, cz - L.hz + 0.3]}>
      <mesh position={[0.75, 0, 0]}>
        <planeGeometry args={[1.5, 0.9]} />
        <meshStandardMaterial color="#2fbf6a" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
function CanopyLookout() {
  const tex = useTex();
  const L = LOOKOUT;
  const [cx, cz] = L.c;
  const corners = [[-L.hx, -L.hz], [L.hx, -L.hz], [-L.hx, L.hz], [L.hx, L.hz]];
  return (
    <group>
      <mesh position={[cx, (L.top + L.g) / 2 - 0.15, cz]} castShadow receiveShadow>
        <boxGeometry args={[L.hx * 2, L.top - L.g + 0.3, L.hz * 2]} />
        <meshStandardMaterial map={tex.planks} color="#c99a6e" roughness={0.9} />
      </mesh>
      {corners.map(([ox, oz], i) => (
        <mesh key={i} position={[cx + ox, L.top + 0.6, cz + oz]} castShadow>
          <cylinderGeometry args={[0.09, 0.1, 1.2, 6]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      <Rod a={[cx - L.hx, L.top + 1.15, cz - L.hz]} b={[cx + L.hx, L.top + 1.15, cz - L.hz]} r={0.05} color={WOOD} />
      <Rod a={[cx - L.hx, L.top + 1.15, cz + L.hz]} b={[cx + L.hx, L.top + 1.15, cz + L.hz]} r={0.05} color={WOOD} />
      <Rod a={[cx - L.hx, L.top + 1.15, cz - L.hz]} b={[cx - L.hx, L.top + 1.15, cz + L.hz]} r={0.05} color={WOOD} />
      {/* Telescope on a tripod, aimed north up the valley. */}
      <group position={[cx - 1.2, L.top, cz - 1.4]}>
        {[0, 2.1, 4.2].map((a, i) => (
          <Rod key={i} a={[Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45]} b={[0, 1.15, 0]} r={0.035} color="#4a3a2a" />
        ))}
        <mesh position={[0, 1.3, -0.1]} rotation={[1.35, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.13, 1.1, 10]} />
          <meshStandardMaterial color="#c9a243" metalness={0.6} roughness={0.35} />
        </mesh>
      </group>
      {/* Flag. */}
      <Rod a={[cx + L.hx - 0.3, L.top, cz - L.hz + 0.3]} b={[cx + L.hx - 0.3, L.top + 5, cz - L.hz + 0.3]} r={0.06} color={WOOD_DARK} />
    </group>
  );
}

function LagoonIsle() {
  const SP = useMemo(() => getJungleSetPieces(), []);
  const c = SP.isle.c;
  const top = LAGOON.level + 0.42;
  return (
    <group position={[c[0], 0, c[1]]}>
      <mesh position={[0, top - 0.55, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[3.2, 3.6, 1.1, 18]} />
        <meshStandardMaterial color="#6f8f45" roughness={1} />
      </mesh>
      <mesh position={[0, top + 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.6, 1.0, 8]} />
        <meshStandardMaterial color={STONE} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[Math.cos((i / 8) * TAU) * 0.35, top + 1.2, Math.sin((i / 8) * TAU) * 0.35]} rotation={[0, -(i / 8) * TAU, 0.65]}>
          <coneGeometry args={[0.2, 0.75, 4]} />
          <meshStandardMaterial color="#ffb7d5" emissive="#ff8fc0" emissiveIntensity={0.25} />
        </mesh>
      ))}
      <mesh position={[0, top + 1.2, 0]}>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshStandardMaterial color="#ffe36b" emissive="#ffcf3a" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// SIGNS
// ---------------------------------------------------------------------------
function Signpost({ s }) {
  const textures = useMemo(() => s.arrows.map(([label]) => textTexture(label, { w: 512, h: 112, font: "bold 52px Georgia, serif" })), [s]);
  return (
    <group position={[s.x, s.y, s.z]}>
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.13, 2.6, 7]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      {s.arrows.map(([label, ang], i) => (
        <group key={i} position={[0, 2.05 - i * 0.48, 0]} rotation={[0, s.rot + ang, 0]}>
          <mesh position={[0.95, 0, 0]} castShadow>
            <boxGeometry args={[1.9, 0.38, 0.07]} />
            <meshStandardMaterial color={WOOD} />
          </mesh>
          {textures[i] && [0.04, -0.04].map((o, k) => (
            <mesh key={k} position={[0.9, 0, o]} rotation={[0, k ? Math.PI : 0, 0]}>
              <planeGeometry args={[1.75, 0.34]} />
              <meshStandardMaterial map={textures[i]} />
            </mesh>
          ))}
          <mesh position={[1.98, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.24, 0.3, 3]} />
            <meshStandardMaterial color={WOOD} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
function WelcomeSign() {
  const S = JUNGLE_WELCOME_SIGN;
  const tex = useMemo(() => textTexture("Emerald Jungle", { w: 768, h: 192, font: "bold 78px Georgia, serif", fg: "#e9ffd8" }), []);
  const [x, z] = S.position;
  const y = terrainHeight(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, S.rotationY, 0]}>
      {[-1.15, 1.15].map((o) => (
        <mesh key={o} position={[o, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.16, 2.5, 7]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      <mesh position={[0, 1.85, 0]} castShadow>
        <boxGeometry args={[3.0, 0.82, 0.12]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      {tex && [0.065, -0.065].map((o, k) => (
        <mesh key={k} position={[0, 1.85, o]} rotation={[0, k ? Math.PI : 0, 0]}>
          <planeGeometry args={[2.85, 0.72]} />
          <meshStandardMaterial map={tex} />
        </mesh>
      ))}
      {/* Leafy garland. */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={`g${i}`} position={[-1.4 + i * 0.35, 2.32 + Math.sin(i) * 0.05, 0.08]} rotation={[0, 0, i * 0.9]} scale={[1, 0.6, 0.6]}>
          <sphereGeometry args={[0.16, 7, 5]} />
          <meshStandardMaterial color={i % 3 === 1 ? "#ff7fb0" : "#4f9a2e"} />
        </mesh>
      ))}
    </group>
  );
}
function ArrivalStones() {
  const tex = useTex();
  const stones = useMemo(() => {
    const out = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + 0.15;
      const x = ARRIVAL_GLADE.center[0] + Math.cos(a) * (ARRIVAL_GLADE.radius + 0.6);
      const z = ARRIVAL_GLADE.center[1] + Math.sin(a) * (ARRIVAL_GLADE.radius + 0.6);
      // Leave the trail mouths + the portal open.
      if (a > 4.3 && a < 5.3) continue;
      if (a > 1.9 && a < 2.6) continue;
      out.push({ x, z, y: terrainHeight(x, z), a, s: 0.5 + (i % 3) * 0.18 });
    }
    return out;
  }, []);
  return (
    <group>
      {stones.map((s, i) => (
        <mesh key={i} position={[s.x, s.y + 0.2 * s.s, s.z]} rotation={[0.1, s.a, 0.05]} scale={[s.s, s.s * 0.7, s.s]} castShadow>
          <dodecahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial map={tex.stoneMossy} color={STONE} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
export default function JungleSetPieces({ highGfx }) {
  useMemo(() => ensureJungleStructures(), []);
  const SP = useMemo(() => getJungleSetPieces(), []);
  return (
    <group>
      {/* Everything that never moves → a few merged draws. */}
      <StaticBatch key={highGfx ? "hi" : "lo"}>
        {JUNGLE_BRIDGES.map((b) => <Bridge key={b.id} b={b} />)}
        {VINE_WALLS.map((w) => <VineWall key={w.id} w={w} />)}
        <LeafPoles />
        <MidLedge />
        {STAIR_FLIGHTS.map((f) => <Flight key={f.id} f={f} />)}
        <StairLandings />
        <FallsDeck />
        <MushroomGlade />
        <GreatTree highGfx={highGfx} />
        <Temple />
        <SkyShrine />
        <CanopyLookout />
        <LagoonIsle />
        {SP.signs.map((s, i) => <Signpost key={i} s={s} />)}
        <WelcomeSign />
        <ArrivalStones />
      </StaticBatch>
      {/* The animated bits. */}
      {BOUNCE_PADS.map((p) => <BounceMushroom key={p.id} p={p} />)}
      <ShrineCrystal />
      <LookoutFlag />
    </group>
  );
}

/** The stone landings at the tops of the waterfall + temple stairs. */
function StairLandings() {
  const tex = useTex();
  const rects = useMemo(() => getJungleStructures().filter((r) => r.kind === "landing"), []);
  return (
    <group>
      {rects.map((r) => {
        const floor = Math.min(terrainHeight(r.c[0], r.c[1]), r.top - 0.5);
        return (
          <mesh key={r.id} position={[r.c[0], (r.top + floor) / 2 - 0.15, r.c[1]]} rotation={[0, -r.rot, 0]} castShadow receiveShadow>
            <boxGeometry args={[r.hx * 2, r.top - floor + 0.3, r.hz * 2]} />
            <meshStandardMaterial map={tex.stoneMossy} color={STONE} roughness={0.95} />
          </mesh>
        );
      })}
    </group>
  );
}

export { escarpZ, ROPE_BRIDGE, spottedCapMaterial };
