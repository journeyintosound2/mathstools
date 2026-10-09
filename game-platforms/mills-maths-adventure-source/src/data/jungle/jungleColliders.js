/**
 * EMERALD JUNGLE — solid CIRCLE colliders (same shape as every other region:
 * { id, kind, x, z, radius, hint?, jumpable?, yMin?, yMax? }). Built from the
 * SAME data the renderer draws (jungleLayout + jungleProps), so visuals can't
 * drift.
 *
 * yMin / yMax (new for the jungle) bound the height of the player's FEET at
 * which a collider blocks: the treehouse railings only stop you 20 m up, a
 * stair's balustrade only at that step's height, a leaf pole only below its
 * pad — so you can still walk under, wade under and stand on top of things.
 *
 * Note what is NOT here: cliffs, the rim, the temple block, solid stairs and
 * the mushroom caps are TERRAIN / solid structures (the ground function walls
 * them), and water is just slow, not solid.
 */
import {
  ensureJungleStructures, GREAT_TREE, GREAT_STAIR, ROPE_BRIDGE, JUNGLE_BRIDGES, LEAF_PADS, STAIR_FLIGHTS,
  FALLS_DECK, JUNGLE_WELCOME_SIGN, terrainHeight, LOOKOUT, TOADSTOOL,
} from "./jungleLayout.js";
import { getJungleProps, getJungleSetPieces, TRUNK_R } from "./jungleProps.js";
import {
  BUILT_JUNGLE_CHALLENGES, jungleHostWorld, JUNGLE_WELCOME_HOST, JUNGLE_RECORDS_STAND, LADDER_GEOM,
} from "./jungleChallenges.js";

const TAU = Math.PI * 2;
function c(id, kind, x, z, radius, extra) {
  return { id, kind, x, z, radius, ...(extra || {}) };
}

/** A row of posts from a to b (every `gap` m), with an optional height band. */
function postRow(out, id, a, b, r, gap, band) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.round(L / gap));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
    out.push(c(`${id}-${i}`, "rail", x, z, r, band ? band(t, x, z) : undefined));
  }
}

let _static = null;
export function getJungleColliders() {
  if (_static) return _static;
  ensureJungleStructures();
  const out = [];
  const P = getJungleProps();
  const SP = getJungleSetPieces();

  // --- Trees (trunks; the rim's decorative forest is out of reach). --------
  for (const [type, arr] of Object.entries(P.trees)) {
    arr.forEach((t, i) => {
      if (t.deco) return;
      out.push(c(`jg-${type}-${i}`, "tree", t.x, t.z, TRUNK_R[type] * t.s));
    });
  }
  // --- Rocks, logs (hop over them), stumps. ---------------------------------
  P.rocks.forEach((r, i) => { if (r.collide) out.push(c(`jg-rock-${i}`, "prop", r.x, r.z, 0.72 * r.s)); });
  P.logs.forEach((l, i) => {
    const n = Math.max(2, Math.round(l.len / 0.8));
    for (let k = 0; k <= n; k++) {
      const f = k / n - 0.5;
      out.push(c(`jg-log-${i}-${k}`, "prop", l.x + Math.cos(l.rot) * l.len * f, l.z + Math.sin(l.rot) * l.len * f, l.r + 0.05, { jumpable: true }));
    }
  });
  P.stumps.forEach((s, i) => out.push(c(`jg-stump-${i}`, "prop", s.x, s.z, 0.5 * s.s, { jumpable: true })));

  // --- The temple courtyard: colonnade + rubble. -----------------------------
  SP.pillars.forEach((p, i) => out.push(c(`jg-pillar-${i}`, "landmark", p.x, p.z, p.r + 0.05)));
  SP.rubble.forEach((r, i) => out.push(c(`jg-rubble-${i}`, "prop", r.x, r.z, 0.45 * r.s + 0.1, { jumpable: true })));

  // --- Signposts + the welcome sign. -----------------------------------------
  SP.signs.forEach((s, i) => out.push(c(`jg-sign-${i}`, "landmark", s.x, s.z, 0.22)));
  {
    const [x, z] = JUNGLE_WELCOME_SIGN.position;
    const ry = JUNGLE_WELCOME_SIGN.rotationY;
    [-1.15, 1.15].forEach((o, i) => out.push(c(`jg-welcome-${i}`, "landmark", x + Math.cos(ry) * o, z - Math.sin(ry) * o, 0.22)));
  }

  // --- THE GREAT TREE: trunk, stair balustrade, deck railing, hut walls. ----
  {
    const T = GREAT_TREE;
    out.push(c("jg-greattree-trunk", "tree", T.center[0], T.center[1], T.trunkR));
    const S = GREAT_STAIR;
    const rr = S.rOut + 0.25;
    for (let k = 3; k < S.n; k++) {
      // Two posts per step along the outer edge.
      for (const f of [0.25, 0.75]) {
        const a = S.phi0 + (k + f) * S.dphi;
        const h = S.stepTop(k);
        out.push(c(`jg-stairrail-${k}-${f}`, "rail", T.center[0] + Math.cos(a) * rr, T.center[1] + Math.sin(a) * rr, 0.24, { yMin: h - 0.6, yMax: h + 1.1 }));
      }
    }
    const deckR = T.deckR - 0.25;
    const gapA = SP.greatTree.bridgeAng;
    const n = Math.round((TAU * deckR) / 0.75);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      let d = Math.abs(((a - gapA + Math.PI) % TAU + TAU) % TAU - Math.PI);
      if (d < 0.11) continue; // the rope bridge's gate
      out.push(c(`jg-deckrail-${i}`, "rail", T.center[0] + Math.cos(a) * deckR, T.center[1] + Math.sin(a) * deckR, 0.24, { yMin: T.deckY - 0.5, yMax: T.deckY + 1.2 }));
    }
    // The hut on the deck (its doorway faces the trunk).
    const hut = SP.greatTree.hut;
    const ax = Math.cos(hut.ang), az = Math.sin(hut.ang); // radial (out)
    const tx = -az, tz = ax; // tangential
    const band = { yMin: T.deckY - 0.5, yMax: T.deckY + 3 };
    const corner = (u, v) => [hut.c[0] + tx * u + ax * v, hut.c[1] + tz * u + az * v];
    postRow(out, "jg-hut-back", corner(-hut.w / 2, hut.d / 2), corner(hut.w / 2, hut.d / 2), 0.3, 0.55, () => band);
    postRow(out, "jg-hut-l", corner(-hut.w / 2, -hut.d / 2), corner(-hut.w / 2, hut.d / 2), 0.3, 0.55, () => band);
    postRow(out, "jg-hut-r", corner(hut.w / 2, -hut.d / 2), corner(hut.w / 2, hut.d / 2), 0.3, 0.55, () => band);
    postRow(out, "jg-hut-fl", corner(-hut.w / 2, -hut.d / 2), corner(-0.75, -hut.d / 2), 0.3, 0.55, () => band);
    postRow(out, "jg-hut-fr", corner(0.75, -hut.d / 2), corner(hut.w / 2, -hut.d / 2), 0.3, 0.55, () => band);
  }

  // --- Bridge rails (only at deck height — wade under freely). ------------
  for (const b of JUNGLE_BRIDGES) {
    const dx = b.to[0] - b.from[0], dz = b.to[1] - b.from[1];
    const L = Math.hypot(dx, dz) || 1;
    const nx = -dz / L, nz = dx / L;
    const off = b.halfWidth + 0.3;
    const n = Math.max(3, Math.round(L / 0.9));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const h = b.deckAt(t);
      for (const s of [1, -1]) {
        out.push(c(`jg-rail-${b.id}-${i}-${s}`, "rail", b.from[0] + dx * t + nx * off * s, b.from[1] + dz * t + nz * off * s, 0.3, { yMin: h - 0.55, yMax: h + 1.3 }));
      }
    }
  }

  // --- Stair flights: walls/balustrades down both long sides. -------------
  for (const f of STAIR_FLIGHTS) {
    const nx = -f.dir[1], nz = f.dir[0];
    const off = f.width / 2 + 0.28;
    const n = Math.max(3, Math.round(f.len / 0.7));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      if (t < 0.08) continue; // open at the bottom so you can step on from the side
      const h = f.stepAt(Math.min(0.999, t));
      for (const s of [1, -1]) {
        out.push(c(`jg-flight-${f.id}-${i}-${s}`, "rail", f.a[0] + (f.b[0] - f.a[0]) * t + nx * off * s, f.a[1] + (f.b[1] - f.a[1]) * t + nz * off * s, 0.3, { yMin: h - 0.7, yMax: h + 1.3 }));
      }
    }
  }

  // --- The falls lookout deck: railings on its three open sides. ------------
  {
    const D = FALLS_DECK;
    const [cx, cz] = D.c;
    const band = () => ({ yMin: D.top - 0.4, yMax: D.top + 1.3 });
    postRow(out, "jg-fallsdeck-s", [cx - D.hx, cz + D.hz], [cx + D.hx, cz + D.hz], 0.22, 0.6, band);
    postRow(out, "jg-fallsdeck-w", [cx - D.hx, cz - D.hz + 1.4], [cx - D.hx, cz + D.hz], 0.22, 0.6, band);
    postRow(out, "jg-fallsdeck-e", [cx + D.hx, cz - D.hz + 1.4], [cx + D.hx, cz + D.hz], 0.22, 0.6, band);
  }
  // --- The Canopy Lookout platform: railings except the steps. ------------
  {
    const L = LOOKOUT;
    const [cx, cz] = L.c;
    const band = () => ({ yMin: L.top - 0.4, yMax: L.top + 1.3 });
    postRow(out, "jg-lookout-n", [cx - L.hx, cz - L.hz], [cx + L.hx, cz - L.hz], 0.22, 0.6, band);
    postRow(out, "jg-lookout-s", [cx - L.hx, cz + L.hz], [cx + L.hx, cz + L.hz], 0.22, 0.6, band);
    postRow(out, "jg-lookout-w", [cx - L.hx, cz - L.hz], [cx - L.hx, cz + L.hz], 0.22, 0.6, band);
    postRow(out, "jg-lookout-en", [cx + L.hx, cz - L.hz], [cx + L.hx, cz - 1.05], 0.22, 0.6, band);
    postRow(out, "jg-lookout-es", [cx + L.hx, cz + 1.05], [cx + L.hx, cz + L.hz], 0.22, 0.6, band);
  }

  // --- Leaf poles: the pole blocks you below its pad, never on top. --------
  LEAF_PADS.forEach((p, i) => out.push(c(`jg-leafpole-${i}`, "prop", p.c[0], p.c[1], 0.2, { yMax: p.top - 0.6 })));

  // --- The Sky Shrine stones + altar, the lagoon statue. --------------------
  SP.shrine.stones.forEach((s, i) => out.push(c(`jg-shrine-stone-${i}`, "landmark", s.x, s.z, s.fallen ? 0.7 : 0.55)));
  out.push(c("jg-shrine-altar", "landmark", SP.shrine.altar.c[0], SP.shrine.altar.c[1], SP.shrine.altar.r));
  out.push(c("jg-lagoon-statue", "landmark", SP.isle.c[0], SP.isle.c[1], 0.65));

  // --- The vine-ladder challenges (2026-10-10): each built clearing's two
  // ladder posts + the vine line between them (so you walk round the ladder,
  // not through it), the stall behind, the host; Mills + the trophy stand
  // on the arrival glade. ---------------------------------------------------
  for (const ch of BUILT_JUNGLE_CHALLENGES) {
    const f = ch.frame;
    const G = LADDER_GEOM;
    const w = (x, z) => f.toWorld(x, z);
    postRow(out, `jg-${ch.key}-vines`, w(G.x0 - 0.12, G.z), w(G.x1 + 0.14, G.z), 0.3, 0.5);
    const S = G.stall;
    postRow(out, `jg-${ch.key}-stall`, w(S.x - S.w / 2, S.z), w(S.x + S.w / 2, S.z), 0.55, 0.7);
    const [hx, hz] = jungleHostWorld(ch.key);
    out.push(c(`jg-host-${ch.key}`, "interactable", hx, hz, 0.7));
  }
  out.push(c("jg-mills", "interactable", JUNGLE_WELCOME_HOST.position[0], JUNGLE_WELCOME_HOST.position[1], 0.7));
  out.push(c("jg-records", "interactable", JUNGLE_RECORDS_STAND.position[0], JUNGLE_RECORDS_STAND.position[1], 2.0));

  _static = out;
  return out;
}

export { terrainHeight, TOADSTOOL, ROPE_BRIDGE };
