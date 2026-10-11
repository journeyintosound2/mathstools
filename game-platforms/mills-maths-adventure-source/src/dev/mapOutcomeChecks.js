/**
 * WORLD MAPS + ROUND OUTCOMES (2026-10-10) — headless checks.
 *
 *   MP1  every world map: bounds hold the spawn, the board, every place + its
 *        waypoint target and every label; the board stands by the arrival
 *        and its "Open the map" interactable is in front of it
 *   MP2  every challenge of every world is on its map (trophy order, its
 *        host as the target); the Playground's staff, the island's friends
 *        and every gate are too
 *   MP3  waypoint maths: map ↔ world round trip, and free waypoints refuse
 *        the sea, the lava and the glacier lake
 *   MP4  the jungle's signposts point down the right trails (Sunny Knoll is
 *        signed from the glade), none stands on a trail
 *   RO1  every in-world challenge store is on the round-outcome rule
 *   RO2  XP is banked as points land (a perfect jungle set = 375 XP before
 *        the set ends; the end pays only its coins)
 *   RO3  a right final answer after a slip CELEBRATES (with the slip noted)
 *        in the jungle and the snow; a wrong final answer is still feedback
 */
import {
  MAP_REGION_IDS, regionMapSpec, regionMapPois, worldToMap, mapToWorld, mapSpotIsWalkable,
} from "../data/maps/regionMaps.js";
import { INTERACTABLES } from "../data/interactables.js";
import { ENCOUNTERS } from "../data/encounters.js";
import { REGIONS } from "../data/regions.js";
import { farmTrophyRows } from "../data/farm/farmRecords.js";
import { snowTrophyRows } from "../data/snow/snowRecords.js";
import { magmaTrophyRows } from "../data/magma/magmaRecords.js";
import { jungleTrophyRows } from "../data/jungle/jungleRecords.js";
import { SCHOOLYARD_CHARACTERS } from "../data/schoolyard/schoolyardLayout.js";
import { getJungleSetPieces } from "../data/jungle/jungleProps.js";
import { JUNGLE_SPOTS, nearestPath, ARRIVAL_GLADE } from "../data/jungle/jungleLayout.js";
import { ALL_CHALLENGE_STORES } from "../game/farmChallengeActive.js";
import { isTrackedStore, roundPointsOf, roundSlipped } from "../game/roundOutcome.js";
import { jungleStore } from "../game/jungle/jungleActive.js";
import { useSnowballRange } from "../game/snowballRangeStore.js";
import { useProgress } from "../progress/store.js";
import { additivePartner } from "../data/jungle/vineLadder.js";
import { playRound, playPhase } from "./ladderPlayer.js";

const inB = (b, [x, z], pad = 0) => x >= b.x0 - pad && x <= b.x1 + pad && z >= b.z0 - pad && z <= b.z1 + pad;

export function runMapOutcomeChecks() {
  const checks = [];

  // MP1) Bounds, boards and the board interactables.
  {
    const bad = [];
    for (const id of MAP_REGION_IDS) {
      const spec = regionMapSpec(id);
      if (!spec) { bad.push(`${id}:no-spec`); continue; }
      const b = spec.bounds;
      if (!inB(b, spec.spawn)) bad.push(`${id}:spawn`);
      if (!inB(b, spec.board.position)) bad.push(`${id}:board`);
      if (Math.hypot(spec.board.position[0] - spec.spawn[0], spec.board.position[1] - spec.spawn[1]) > 25) bad.push(`${id}:board-far`);
      for (const a of spec.areas) if (!inB(b, a.at)) bad.push(`${id}:label ${a.name}`);
      for (const p of regionMapPois(id, {})) {
        if (!inB(b, p.at) || !inB(b, p.target)) bad.push(`${id}:poi ${p.id}`);
      }
      const ix = INTERACTABLES.find((i) => i.id === `${id}-map`);
      if (!ix || (ix.regionId || "island-1") !== id || !ix.mapBoard || !ENCOUNTERS[ix.encounterId]) bad.push(`${id}:board-ix`);
      else if (Math.hypot(ix.position[0] - spec.board.position[0], ix.position[1] - spec.board.position[1]) > 2.5) bad.push(`${id}:ix-far`);
    }
    checks.push({
      name: "World maps: every place on the map, a board by every arrival that opens it",
      pass: bad.length === 0,
      detail: bad.length ? bad.slice(0, 8).join(", ") : `${MAP_REGION_IDS.length} worlds · bounds hold every place + label · board ≤ 25 m from the spawn · "Open the map" in front of each`,
    });
  }

  // MP2) Every challenge, person and gate is a pin; challenges lead to their host.
  {
    const bad = [];
    const want = {
      "farm-parts-whole": [farmTrophyRows(), (k) => `farm-${k}-sign`],
      "snow-sums": [snowTrophyRows(), (k) => `snow-${k === "lodgeyard" ? "yard" : k}-sign`],
      "magma-multiples": [magmaTrophyRows(), (k) => `magma-${k}-host`],
      "emerald-jungle": [jungleTrophyRows(), (k) => `jungle-${k}-host`],
    };
    let n = 0;
    for (const [id, [rows, hostOf]] of Object.entries(want)) {
      const pois = regionMapPois(id, {}).filter((p) => p.kind === "challenge");
      if (pois.length !== rows.length) bad.push(`${id}:${pois.length}/${rows.length}`);
      rows.forEach((row, i) => {
        const p = pois.find((q) => q.id === `ch-${row.key}`);
        if (!p || p.n !== i + 1) { bad.push(`${id}:${row.key}`); return; }
        n++;
        if (row.soon) return;
        const host = INTERACTABLES.find((x) => x.id === hostOf(row.key));
        if (!host || Math.hypot(host.position[0] - p.target[0], host.position[1] - p.target[1]) > 0.01) bad.push(`${id}:${row.key}-target`);
      });
    }
    const school = regionMapPois("schoolyard", {});
    if (SCHOOLYARD_CHARACTERS.some((c) => !school.find((p) => p.id === `p-${c.id}`))) bad.push("school-staff");
    const island = regionMapPois("island-1", {});
    if (["pip", "fern", "alby"].some((f) => !island.find((p) => p.id === `p-${f}`))) bad.push("island-friends");
    for (const id of MAP_REGION_IDS) {
      const gates = regionMapPois(id, {}).filter((p) => p.kind === "gate").length;
      if (gates !== (REGIONS[id].portals || []).length) bad.push(`${id}:gates`);
    }
    checks.push({
      name: "World maps: every challenge (trophy order → its host), the staff, the friends and every gate",
      pass: bad.length === 0,
      detail: bad.length ? bad.slice(0, 8).join(", ") : `${n} challenges · 9 staff · 3 island friends · every gate`,
    });
  }

  // MP3) Map ↔ world, and free waypoints only on walkable ground.
  {
    const bad = [];
    for (const id of MAP_REGION_IDS) {
      const spec = regionMapSpec(id);
      const [u, v] = worldToMap(spec, spec.spawn[0], spec.spawn[1]);
      const [x, z] = mapToWorld(spec, u, v);
      if (Math.hypot(x - spec.spawn[0], z - spec.spawn[1]) > 1e-6) bad.push(`${id}:roundtrip`);
      if (!mapSpotIsWalkable(id, spec.spawn[0], spec.spawn[1])) bad.push(`${id}:spawn-walkable`);
    }
    if (mapSpotIsWalkable("island-1", 0, 120)) bad.push("island-sea");
    if (mapSpotIsWalkable("magma-multiples", 0, 0)) bad.push("magma-crater");
    if (mapSpotIsWalkable("snow-sums", 35, -62)) bad.push("snow-lake");
    checks.push({
      name: "World maps: waypoints map back to the world exactly; no free waypoints in the sea, lava or lake",
      pass: bad.length === 0,
      detail: bad.length ? bad.join(", ") : "round trip exact · sea, crater + glacier lake refused · every spawn walkable",
    });
  }

  // MP4) The jungle signposts.
  {
    const bad = [];
    const places = Object.fromEntries(JUNGLE_SPOTS.map((s) => [s.label.replace(/^The /, ""), s.center]));
    places["Arrival Glade"] = ARRIVAL_GLADE.center;
    places["Great Tree"] = places["Great Tree"] || [22, 4];
    const signs = getJungleSetPieces().signs;
    let knoll = false;
    for (const s of signs) {
      const n = nearestPath(s.x, s.z);
      if (n && n.e < 0.4) bad.push(`on-trail ${s.x},${s.z}`);
      for (const [label, ang] of s.arrows) {
        const to = places[label];
        if (!to) continue;
        const dir = [Math.cos(s.rot + ang), -Math.sin(s.rot + ang)];
        const dx = to[0] - s.x, dz = to[1] - s.z, L = Math.hypot(dx, dz) || 1;
        const cos = (dir[0] * dx + dir[1] * dz) / L;
        // Trails wind, but an arrow must never point AWAY from its place.
        if (cos < -0.2) bad.push(`${label}@${s.x},${s.z}`);
        if (label === "Sunny Knoll" && Math.hypot(s.x - ARRIVAL_GLADE.center[0], s.z - ARRIVAL_GLADE.center[1]) < 20) knoll = true;
      }
    }
    if (!knoll) bad.push("no Sunny Knoll sign at the glade");
    checks.push({
      name: "Jungle signposts point down the right trails (Sunny Knoll signed from the glade)",
      pass: bad.length === 0,
      detail: bad.length ? bad.join(", ") : `${signs.length} signposts · every arrow heads toward its place · none on a trail`,
    });
  }

  // RO1) Every challenge store is on the round-outcome rule.
  {
    const untracked = ALL_CHALLENGE_STORES.filter((s) => !isTrackedStore(s)).length;
    checks.push({
      name: "Round outcomes: every in-world challenge store is on the one rule",
      pass: untracked === 0 && ALL_CHALLENGE_STORES.length >= 32,
      detail: `${ALL_CHALLENGE_STORES.length - untracked}/${ALL_CHALLENGE_STORES.length} stores tracked`,
    });
  }

  // RO2) XP lands round by round; the end of a set pays only its coins.
  {
    const S = jungleStore("swap");
    const xp0 = useProgress.getState().xp || 0;
    const coins0 = useProgress.getState().coins || 0;
    S.getState().exit();
    S.getState().start();
    S.getState().beginRounds();
    let xpBeforeEnd = 0;
    for (let i = 0; i < 15; i++) {
      const r = S.getState().currentRound();
      playRound(S, r);
      if (i === 14) xpBeforeEnd = (useProgress.getState().xp || 0) - xp0;
      S.getState().next();
    }
    const xp = (useProgress.getState().xp || 0) - xp0;
    const coins = (useProgress.getState().coins || 0) - coins0;
    S.getState().exit();
    checks.push({
      name: "Round outcomes: XP is banked as the points land (a perfect set = 375 XP before it ends)",
      pass: xpBeforeEnd === 375 && xp === 375 && coins === 75,
      detail: `XP before the last Next ${xpBeforeEnd} · after ${xp} · coins ${coins}`,
    });
  }

  // RO3) A slip, then the right final answer → celebrate (and the slip shows).
  {
    // Jungle: round 1 — type the add-the-same partner first, then play it right.
    const S = jungleStore("swap");
    S.getState().exit();
    S.getState().start();
    S.getState().beginRounds();
    const r = S.getState().currentRound();
    S.getState().choose("again");
    const p = S.getState().pending;
    const deal = r.ladders[0].start[0];
    S.getState().submit(String(additivePartner(r.ladders[0].L, "top", deal, p.value)));
    S.getState().submit(String(p.partner));
    playRound(S, r, true);
    const jStatus = S.getState().status, jPts = roundPointsOf(S), jSlip = roundSlipped(S);
    // A wrong final answer is still feedback (the wrong stall on a best buy).
    const M = jungleStore("market");
    M.getState().exit();
    M.getState().start();
    M.getState().beginRounds();
    const mi = M.getState().rounds.findIndex((q) => q.kind === "compare");
    for (let k = 0; k < mi; k++) { playRound(M, M.getState().currentRound()); M.getState().next(); }
    const rc = M.getState().currentRound();
    playPhase(M, rc);
    M.getState().call(1 - rc.better);
    const wrongStatus = M.getState().status;
    S.getState().exit();
    M.getState().exit();
    // Snow: miss the split, refill, type the right total.
    const R = useSnowballRange;
    R.getState().start();
    R.getState().beginRounds();
    const rr = R.getState().currentRound();
    R.getState().setSplit(0);
    R.getState().throwSplit();
    R.getState().retrySplit();
    R.getState().setSplit(rr.comp);
    R.getState().throwSplit();
    R.getState().submitSum(String(rr.sum));
    const sStatus = R.getState().status, sPts = roundPointsOf(R), sSlip = roundSlipped(R);
    R.getState().exit?.();
    const pass = jStatus === "celebrate" && jPts < 25 && jPts > 0 && jSlip && wrongStatus === "feedback" && sStatus === "celebrate" && sPts === 15 && sSlip;
    checks.push({
      name: "Round outcomes: right final answer after a slip celebrates (slip noted); a wrong final answer is feedback",
      pass,
      detail: `jungle ${jStatus} ${jPts} pts slip:${jSlip} · wrong stall → ${wrongStatus} · snow ${sStatus} ${sPts} pts slip:${sSlip}`,
    });
  }

  return checks;
}
