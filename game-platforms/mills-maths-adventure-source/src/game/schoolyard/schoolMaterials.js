/**
 * RETRIEVAL PRACTICE PLAYGROUND — materials + procedural canvas textures (no
 * image files). Everything the school is made of, drawn once:
 *
 *   brick / brick2      red-orange face brick in stretcher bond (the blocks,
 *                       the planters, the retaining walls) + a paler brown
 *   tiles               weathered terracotta roof tiles (lichen + streaks)
 *   steel(colour)       Colorbond corrugated sheet (manor red, grey, cream…)
 *   concrete / board    smooth + board-formed concrete (decks, parapets)
 *   asphalt / pavers    the quad's asphalt + the courtyard's pavers
 *   court / soil / mulch / gravel / timber floor
 *   window / door       aluminium windows with blinds, painted doors
 *   mural               the ocean mural (the harbour, Muttonbird Island,
 *                       a turtle, dolphins, fish over the reef)
 *   signs               painted school signs
 *
 * UVs on the school's geometry are in METRES (schoolKit), so each texture's
 * `repeat` sets how many metres one tile covers.
 */
import * as THREE from "three";
import { JNOISE, jungleClock } from "../jungle/jungleMaterials.js";

export { jungleClock };

function canvasTex(w, h, draw, { metres = 1, srgb = true, aniso = 8, repeat = true } = {}) {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / metres, 1 / metres);
  }
  t.anisotropy = aniso;
  t.needsUpdate = true;
  return t;
}
function prand(seed) {
  let s = (seed * 2654435761) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const rgb = (r, g, b, a = 1) => `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
function speckle(g, w, h, n, r, cols, seed) {
  const R = prand(seed);
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[Math.floor(R() * cols.length)];
    const s = r * (0.4 + R());
    g.fillRect(R() * w, R() * h, s, s);
  }
}

// ---------------------------------------------------------------------------
// BRICK — stretcher bond, 2 m × 2 m per tile (9 bricks across, 23 courses).
// ---------------------------------------------------------------------------
function drawBrick(g, w, h, { base = [176, 82, 52], spread = 26, mortar = "#cdbfae", seed = 3, dark = 0.18 } = {}) {
  const R = prand(seed);
  g.fillStyle = mortar;
  g.fillRect(0, 0, w, h);
  const rows = 23, cols = 9;
  const bh = h / rows, bw = w / cols;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * bw * 0.5;
    for (let c = -1; c <= cols; c++) {
      const x = c * bw + off, y = r * bh;
      const v = (R() - 0.5) * spread;
      const burnt = R() < dark ? -30 - R() * 22 : 0;
      const k = R();
      g.fillStyle = rgb(base[0] + v + burnt + k * 8, base[1] + v * 0.55 + burnt * 0.6, base[2] + v * 0.45 + burnt * 0.5);
      g.fillRect(x + 1.6, y + 1.6, bw - 3.2, bh - 3.2);
      // A little face texture + a lighter top edge.
      g.fillStyle = "rgba(255,230,200,0.08)";
      g.fillRect(x + 1.6, y + 1.6, bw - 3.2, 1.6);
      g.fillStyle = "rgba(40,10,0,0.10)";
      g.fillRect(x + 1.6, y + bh - 3.4, bw - 3.2, 1.8);
    }
  }
  speckle(g, w, h, 2600, 1.4, ["rgba(60,25,10,0.18)", "rgba(255,220,190,0.12)", "rgba(0,0,0,0.10)"], seed + 7);
  // Gentle weathering streaks.
  for (let i = 0; i < 18; i++) {
    const x = R() * w;
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "rgba(40,30,25,0.10)");
    grd.addColorStop(1, "rgba(40,30,25,0)");
    g.fillStyle = grd;
    g.fillRect(x, 0, 2 + R() * 5, h * (0.2 + R() * 0.6));
  }
}

// Terracotta roof tiles (Marseille-ish rows), 2 m × 2 m: rows run along x.
function drawTiles(g, w, h, { base = [182, 86, 50], seed = 11 } = {}) {
  const R = prand(seed);
  g.fillStyle = rgb(base[0] - 50, base[1] - 34, base[2] - 24);
  g.fillRect(0, 0, w, h);
  const rows = 6, cols = 8;
  const th = h / rows, tw = w / cols;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tw + (r % 2) * tw * 0.5, y = r * th;
      const v = (R() - 0.5) * 30;
      const grd = g.createLinearGradient(x, 0, x + tw, 0);
      const cc = [base[0] + v, base[1] + v * 0.6, base[2] + v * 0.4];
      grd.addColorStop(0, rgb(cc[0] - 30, cc[1] - 22, cc[2] - 15));
      grd.addColorStop(0.35, rgb(cc[0] + 12, cc[1] + 8, cc[2] + 4));
      grd.addColorStop(0.7, rgb(cc[0], cc[1], cc[2]));
      grd.addColorStop(1, rgb(cc[0] - 40, cc[1] - 30, cc[2] - 20));
      g.fillStyle = grd;
      g.fillRect(x - tw, y, tw * 0.98, th * 0.92);
      g.fillRect(x, y, tw * 0.98, th * 0.92);
      // Overlap shadow at the bottom of each tile row.
      g.fillStyle = "rgba(30,10,0,0.35)";
      g.fillRect(x - tw, y + th * 0.88, tw * 2, th * 0.12);
    }
  }
  // Lichen + dark weathering (photo: old terracotta with grey-green lichen).
  speckle(g, w, h, 900, 2.6, ["rgba(140,150,120,0.35)", "rgba(200,200,170,0.25)", "rgba(40,30,20,0.25)"], seed + 3);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(${90 + R() * 40},${95 + R() * 30},${70 + R() * 20},${0.12 + R() * 0.18})`;
    g.beginPath();
    g.arc(R() * w, R() * h, 3 + R() * 9, 0, Math.PI * 2);
    g.fill();
  }
}

// Corrugated steel (Colorbond), ribs along v: 1 m tile.
function drawSteel(g, w, h, { base = [150, 40, 34], ribs = 13, seed = 5, weather = 0.15 } = {}) {
  const R = prand(seed);
  for (let x = 0; x < w; x++) {
    const t = (x / w) * ribs * Math.PI * 2;
    const s = 0.82 + 0.18 * Math.cos(t);
    g.fillStyle = rgb(base[0] * s, base[1] * s, base[2] * s);
    g.fillRect(x, 0, 1, h);
  }
  for (let i = 0; i < 30; i++) {
    g.fillStyle = `rgba(255,255,255,${0.03 + R() * 0.04})`;
    g.fillRect(R() * w, 0, 1 + R() * 3, h);
  }
  speckle(g, w, h, 400, 1.2, [`rgba(0,0,0,${weather})`, `rgba(255,255,255,${weather * 0.5})`], seed + 1);
}

function drawConcrete(g, w, h, { base = [182, 180, 172], seed = 9, boards = 0, joints = 0 } = {}) {
  const R = prand(seed);
  g.fillStyle = rgb(...base);
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {
    g.fillStyle = `rgba(${R() < 0.5 ? 255 : 0},${R() < 0.5 ? 255 : 0},${R() < 0.5 ? 255 : 0},0.03)`;
    g.beginPath();
    g.arc(R() * w, R() * h, 20 + R() * 70, 0, Math.PI * 2);
    g.fill();
  }
  speckle(g, w, h, 3200, 1.2, ["rgba(0,0,0,0.08)", "rgba(255,255,255,0.08)", "rgba(80,70,60,0.08)"], seed + 2);
  if (boards) {
    for (let k = 0; k <= boards; k++) {
      g.fillStyle = "rgba(0,0,0,0.10)";
      g.fillRect(0, (k / boards) * h, w, 2);
      for (let i = 0; i < 12; i++) {
        g.fillStyle = "rgba(0,0,0,0.04)";
        g.fillRect(0, (k / boards) * h + R() * (h / boards), w, 1);
      }
    }
  }
  if (joints) {
    g.strokeStyle = "rgba(60,55,50,0.45)";
    g.lineWidth = 2;
    for (let k = 0; k <= joints; k++) {
      g.beginPath(); g.moveTo((k / joints) * w, 0); g.lineTo((k / joints) * w, h); g.stroke();
      g.beginPath(); g.moveTo(0, (k / joints) * h); g.lineTo(w, (k / joints) * h); g.stroke();
    }
  }
  // Water stains near the bottom.
  const grd = g.createLinearGradient(0, h * 0.7, 0, h);
  grd.addColorStop(0, "rgba(60,55,45,0)");
  grd.addColorStop(1, "rgba(60,55,45,0.10)");
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
}

function drawAsphalt(g, w, h, { base = [86, 88, 92], seed = 13 } = {}) {
  const R = prand(seed);
  g.fillStyle = rgb(...base);
  g.fillRect(0, 0, w, h);
  speckle(g, w, h, 9000, 1.5, ["rgba(20,20,22,0.35)", "rgba(160,160,165,0.25)", "rgba(120,110,100,0.25)", "rgba(0,0,0,0.2)"], seed);
  for (let i = 0; i < 20; i++) {
    g.fillStyle = `rgba(${R() < 0.5 ? 255 : 0},${R() < 0.5 ? 255 : 0},${R() < 0.5 ? 255 : 0},0.025)`;
    g.beginPath();
    g.arc(R() * w, R() * h, 30 + R() * 80, 0, Math.PI * 2);
    g.fill();
  }
  // A few hairline cracks.
  g.strokeStyle = "rgba(25,25,28,0.5)";
  g.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    let x = R() * w, y = R() * h;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (R() - 0.5) * 40; y += (R() - 0.5) * 40; g.lineTo(x, y); }
    g.stroke();
  }
}

function drawPavers(g, w, h, { base = [170, 160, 150], seed = 17, rows = 8, cols = 4 } = {}) {
  const R = prand(seed);
  g.fillStyle = "#7c7268";
  g.fillRect(0, 0, w, h);
  const ph = h / rows, pw = w / cols;
  for (let r = 0; r < rows; r++) {
    for (let c = -1; c <= cols; c++) {
      const x = c * pw + (r % 2) * pw * 0.5, y = r * ph;
      const v = (R() - 0.5) * 22;
      const warm = R() < 0.25 ? 18 : 0;
      g.fillStyle = rgb(base[0] + v + warm, base[1] + v + warm * 0.4, base[2] + v);
      g.fillRect(x + 1.5, y + 1.5, pw - 3, ph - 3);
    }
  }
  speckle(g, w, h, 1500, 1.2, ["rgba(0,0,0,0.1)", "rgba(255,255,255,0.1)"], seed + 1);
}

function drawGravel(g, w, h, { base = [176, 160, 132], seed = 23 } = {}) {
  g.fillStyle = rgb(...base);
  g.fillRect(0, 0, w, h);
  speckle(g, w, h, 7000, 2.2, ["rgba(90,80,65,0.5)", "rgba(230,220,200,0.45)", "rgba(140,120,95,0.5)", "rgba(60,55,45,0.35)"], seed);
}
function drawSoil(g, w, h, { base = [96, 68, 46], seed = 29, mulch = false } = {}) {
  const R = prand(seed);
  g.fillStyle = rgb(...base);
  g.fillRect(0, 0, w, h);
  speckle(g, w, h, 5000, 2, ["rgba(40,25,15,0.4)", "rgba(150,110,75,0.35)", "rgba(70,50,35,0.4)"], seed);
  if (mulch) {
    for (let i = 0; i < 900; i++) {
      g.save();
      g.translate(R() * w, R() * h);
      g.rotate(R() * Math.PI);
      g.fillStyle = `rgba(${120 + R() * 60},${80 + R() * 40},${45 + R() * 25},0.85)`;
      g.fillRect(-4 - R() * 4, -1, 8 + R() * 8, 2 + R() * 1.5);
      g.restore();
    }
  }
}
function drawTimber(g, w, h, { base = [190, 142, 92], boards = 10, seed = 31 } = {}) {
  const R = prand(seed);
  const bh = h / boards;
  for (let b = 0; b < boards; b++) {
    const v = (R() - 0.5) * 26;
    g.fillStyle = rgb(base[0] + v, base[1] + v * 0.8, base[2] + v * 0.6);
    g.fillRect(0, b * bh, w, bh);
    for (let k = 0; k < 14; k++) {
      g.fillStyle = `rgba(90,55,25,${0.05 + R() * 0.08})`;
      g.fillRect(0, b * bh + R() * bh, w, 1);
    }
    g.fillStyle = "rgba(60,35,15,0.5)";
    g.fillRect(0, b * bh, w, 1.5);
    const joint = R() * w;
    g.fillRect(joint, b * bh, 1.5, bh);
  }
}

// A school window (1 tile = one window): aluminium frame, two panes, blinds.
function drawWindow(g, w, h, { seed = 41, blinds = true } = {}) {
  const R = prand(seed);
  // Frame.
  g.fillStyle = "#c9ccce";
  g.fillRect(0, 0, w, h);
  const f = w * 0.06;
  // Glass: a sky reflection gradient over a dark room.
  const grd = g.createLinearGradient(0, 0, w * 0.4, h);
  grd.addColorStop(0, "#9fb8c8");
  grd.addColorStop(0.45, "#4c5f6c");
  grd.addColorStop(1, "#2a333a");
  g.fillStyle = grd;
  g.fillRect(f, f, w - 2 * f, h - 2 * f);
  // Blinds (vertical slats) drawn partway down in some panes.
  if (blinds) {
    const drop = 0.25 + R() * 0.6;
    g.fillStyle = R() < 0.5 ? "rgba(222,220,206,0.85)" : "rgba(160,186,206,0.8)";
    g.fillRect(f, f, w - 2 * f, (h - 2 * f) * drop);
    g.fillStyle = "rgba(0,0,0,0.08)";
    for (let x = f; x < w - f; x += w * 0.045) g.fillRect(x, f, 1.5, (h - 2 * f) * drop);
  }
  // A highlight streak.
  g.fillStyle = "rgba(255,255,255,0.10)";
  g.beginPath();
  g.moveTo(w * 0.2, f); g.lineTo(w * 0.36, f); g.lineTo(w * 0.12, h - f); g.lineTo(w * -0.04, h - f);
  g.fill();
  // Mullions + transom (awning sash at the top).
  g.fillStyle = "#b8bcbf";
  g.fillRect(w / 2 - f * 0.4, 0, f * 0.8, h);
  g.fillRect(0, h * 0.32, w, f * 0.7);
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fillRect(f, h - f - 2, w - 2 * f, 2);
}
function drawDoor(g, w, h, { colour = "#2d6a5a", seed = 43 } = {}) {
  g.fillStyle = "#c9ccce";
  g.fillRect(0, 0, w, h);
  const f = w * 0.08;
  g.fillStyle = colour;
  g.fillRect(f, f, w - 2 * f, h - f);
  // Vision panel + kick plate + handle.
  g.fillStyle = "#3a4650";
  g.fillRect(w * 0.28, h * 0.12, w * 0.44, h * 0.26);
  g.fillStyle = "rgba(255,255,255,0.15)";
  g.fillRect(w * 0.3, h * 0.13, w * 0.12, h * 0.24);
  g.fillStyle = "#b9bdc0";
  g.fillRect(f, h * 0.86, w - 2 * f, h * 0.1);
  g.fillRect(w * 0.74, h * 0.5, w * 0.12, h * 0.03);
  speckle(g, w, h, 300, 1.2, ["rgba(0,0,0,0.12)", "rgba(255,255,255,0.08)"], seed);
}

// ---------------------------------------------------------------------------
// THE OCEAN MURAL — painted over the art block's front (photo): the coast and
// the harbour under a big sky, Muttonbird Island, a turtle, dolphins + fish.
// ---------------------------------------------------------------------------
function drawMural(g, w, h) {
  const R = prand(77);
  // Sky.
  const sky = g.createLinearGradient(0, 0, 0, h * 0.42);
  sky.addColorStop(0, "#3d8fd8");
  sky.addColorStop(1, "#a9d8f2");
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h * 0.42);
  // Clouds.
  for (let i = 0; i < 14; i++) {
    const x = R() * w, y = R() * h * 0.22 + 12, r = 18 + R() * 30;
    g.fillStyle = "rgba(255,255,255,0.85)";
    for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + k * r * 0.7, y + Math.sin(k) * 6, r * (0.7 + R() * 0.4), 0, Math.PI * 2); g.fill(); }
  }
  // Sun + rays.
  g.fillStyle = "rgba(255,248,200,0.9)";
  g.beginPath(); g.arc(w * 0.62, h * 0.14, 30, 0, Math.PI * 2); g.fill();
  // The hinterland + coast (green headlands) at the horizon.
  g.fillStyle = "#3f7f4b";
  g.beginPath(); g.moveTo(0, h * 0.42);
  for (let x = 0; x <= w * 0.42; x += 10) g.lineTo(x, h * 0.42 - 26 - Math.sin(x / 60) * 14 - (x < w * 0.2 ? 30 * (1 - x / (w * 0.2)) : 0));
  g.lineTo(w * 0.42, h * 0.42); g.fill();
  // Muttonbird Island + the breakwall.
  g.fillStyle = "#4f8a52";
  g.beginPath(); g.ellipse(w * 0.74, h * 0.42, w * 0.07, 22, 0, Math.PI, 0); g.fill();
  g.fillStyle = "#8b8578";
  g.fillRect(w * 0.42, h * 0.42 - 4, w * 0.28, 6);
  // The sea — bands of blue to the bottom, with sun-glitter.
  const sea = g.createLinearGradient(0, h * 0.42, 0, h);
  sea.addColorStop(0, "#2f95c8");
  sea.addColorStop(0.35, "#1f6fa8");
  sea.addColorStop(1, "#0c3d6b");
  g.fillStyle = sea;
  g.fillRect(0, h * 0.42, w, h * 0.58);
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(255,255,255,${0.15 + R() * 0.35})`;
    const y = h * 0.43 + R() * h * 0.2;
    g.fillRect(w * 0.45 + (R() - 0.5) * w * 0.45 * (1 + (y - h * 0.43) / (h * 0.2)), y, 4 + R() * 10, 1.5);
  }
  // Light shafts down into the water.
  for (let i = 0; i < 6; i++) {
    const x = w * (0.1 + i * 0.16);
    const grd = g.createLinearGradient(0, h * 0.5, 0, h);
    grd.addColorStop(0, "rgba(255,255,255,0.18)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.beginPath(); g.moveTo(x, h * 0.5); g.lineTo(x + 30, h * 0.5); g.lineTo(x + 90, h); g.lineTo(x + 20, h); g.fill();
  }
  // The reef: corals + kelp along the bottom.
  for (let i = 0; i < 60; i++) {
    const x = R() * w, base = h - R() * 18;
    g.fillStyle = ["#e36b4c", "#f2b14d", "#c64c8a", "#7fbf6a", "#e8875a"][Math.floor(R() * 5)];
    g.beginPath(); g.ellipse(x, base, 10 + R() * 22, 8 + R() * 16, 0, Math.PI, 0); g.fill();
  }
  g.strokeStyle = "#2f7a4a"; g.lineWidth = 4;
  for (let i = 0; i < 26; i++) {
    const x = R() * w;
    g.beginPath(); g.moveTo(x, h);
    for (let k = 1; k < 8; k++) g.lineTo(x + Math.sin(k + i) * 10, h - k * (10 + R() * 8));
    g.stroke();
  }
  // A green sea turtle.
  const turtle = (x, y, s) => {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.2);
    g.fillStyle = "#7b8f3c";
    for (const [fx, fy, a] of [[-26, -18, -0.6], [26, -18, 0.6], [-20, 18, 0.5], [20, 18, -0.5]]) { g.beginPath(); g.ellipse(fx, fy, 16, 6, a, 0, Math.PI * 2); g.fill(); }
    g.beginPath(); g.ellipse(0, -30, 9, 11, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#5a4a2a"; g.beginPath(); g.ellipse(0, 0, 24, 30, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#c8a85a"; g.lineWidth = 2;
    for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(k * 10, -24); g.lineTo(k * 12, 24); g.stroke(); }
    g.restore();
  };
  turtle(w * 0.3, h * 0.78, 1.3);
  // Dolphins arcing.
  const dolphin = (x, y, s, flip) => {
    g.save(); g.translate(x, y); g.scale(flip ? -s : s, s);
    g.fillStyle = "#6d8aa0";
    g.beginPath(); g.moveTo(-40, 6); g.quadraticCurveTo(0, -22, 40, -2); g.quadraticCurveTo(46, 2, 52, 0); g.quadraticCurveTo(44, 8, 36, 6); g.quadraticCurveTo(0, 14, -40, 6); g.fill();
    g.beginPath(); g.moveTo(-4, -12); g.lineTo(6, -26); g.lineTo(10, -10); g.fill();
    g.beginPath(); g.moveTo(-40, 6); g.lineTo(-54, -6); g.lineTo(-50, 8); g.lineTo(-56, 18); g.fill();
    g.fillStyle = "#dfe8ee"; g.beginPath(); g.ellipse(4, 6, 26, 4, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  };
  dolphin(w * 0.62, h * 0.6, 1.2, false);
  dolphin(w * 0.78, h * 0.68, 0.9, true);
  // Schools of little fish.
  for (let s = 0; s < 5; s++) {
    const cx = R() * w, cy = h * (0.58 + R() * 0.3);
    const col = ["#ffd23f", "#ff8c42", "#c0e8ff", "#ffffff"][s % 4];
    for (let i = 0; i < 14; i++) {
      const x = cx + (R() - 0.5) * 90, y = cy + (R() - 0.5) * 40;
      g.fillStyle = col;
      g.beginPath(); g.ellipse(x, y, 6, 3, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x - 11, y - 3); g.lineTo(x - 11, y + 3); g.fill();
    }
  }
  // A shark silhouette far off (the photo has one).
  g.fillStyle = "rgba(60,80,100,0.65)";
  g.beginPath(); g.moveTo(w * 0.15, h * 0.62); g.quadraticCurveTo(w * 0.2, h * 0.58, w * 0.25, h * 0.62); g.lineTo(w * 0.2, h * 0.64); g.fill();
  // Brick texture showing faintly through the paint.
  for (let y = 0; y < h; y += h / 14) {
    g.fillStyle = "rgba(0,0,0,0.05)";
    g.fillRect(0, y, w, 1.5);
  }
}

// ---------------------------------------------------------------------------
// Court lines (one basketball court) — mapped onto a court's rect.
// ---------------------------------------------------------------------------
function drawCourt(g, w, h, { base = "#2f6d5c", key = "#3a5f9e" } = {}) {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  speckle(g, w, h, 4000, 1.2, ["rgba(0,0,0,0.06)", "rgba(255,255,255,0.05)"], 61);
  const m = w * 0.06;
  g.strokeStyle = "rgba(255,255,255,0.92)";
  g.lineWidth = w * 0.012;
  g.strokeRect(m, m, w - 2 * m, h - 2 * m);
  g.beginPath(); g.moveTo(m, h / 2); g.lineTo(w - m, h / 2); g.stroke();
  g.beginPath(); g.arc(w / 2, h / 2, w * 0.12, 0, Math.PI * 2); g.stroke();
  for (const end of [0, 1]) {
    const y0 = end ? h - m : m, s = end ? -1 : 1;
    g.fillStyle = key;
    g.fillRect(w / 2 - w * 0.16, end ? y0 - h * 0.2 : y0, w * 0.32, h * 0.2);
    g.strokeRect(w / 2 - w * 0.16, end ? y0 - h * 0.2 : y0, w * 0.32, h * 0.2);
    g.beginPath(); g.arc(w / 2, y0 + s * h * 0.2, w * 0.12, end ? Math.PI : 0, end ? 2 * Math.PI : Math.PI); g.stroke();
    g.beginPath(); g.arc(w / 2, y0 + s * h * 0.03, w * 0.4, end ? Math.PI * 1.08 : Math.PI * 0.08, end ? Math.PI * 1.92 : Math.PI * 0.92); g.stroke();
  }
}

// ---------------------------------------------------------------------------
export function schoolSignTexture(lines, { w = 512, h = 160, bg = "#1d3f78", fg = "#ffffff", border = "#e8c547", font = "900 64px 'MMA Display', 'Trebuchet MS', sans-serif", sub = "700 32px 'MMA Rounded', 'Trebuchet MS', sans-serif", align = "center" } = {}) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = border;
    g.lineWidth = 8;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = fg;
    g.textAlign = align;
    g.textBaseline = "middle";
    const x = align === "center" ? w / 2 : 28;
    if (lines.length === 1) {
      g.font = font;
      g.fillText(lines[0], x, h / 2 + 3, w - 40);
    } else {
      g.font = font;
      g.fillText(lines[0], x, h * 0.38, w - 40);
      g.font = sub;
      g.fillText(lines[1], x, h * 0.74, w - 40);
    }
  }, { repeat: false });
}

let _tex = null;
/** All the school's textures (created once). */
export function getSchoolTextures() {
  if (_tex) return _tex;
  _tex = {
    brick: canvasTex(512, 512, (g, w, h) => drawBrick(g, w, h), { metres: 2 }),
    brick2: canvasTex(512, 512, (g, w, h) => drawBrick(g, w, h, { base: [150, 92, 64], spread: 22, seed: 19, dark: 0.1 }), { metres: 2 }),
    brickDark: canvasTex(512, 512, (g, w, h) => drawBrick(g, w, h, { base: [128, 58, 40], spread: 18, seed: 27, dark: 0.25 }), { metres: 2 }),
    tiles: canvasTex(512, 512, (g, w, h) => drawTiles(g, w, h), { metres: 2 }),
    redSteel: canvasTex(256, 256, (g, w, h) => drawSteel(g, w, h, { base: [150, 44, 36] }), { metres: 1.6 }),
    greySteel: canvasTex(256, 256, (g, w, h) => drawSteel(g, w, h, { base: [150, 156, 160], seed: 6 }), { metres: 1.6 }),
    creamSteel: canvasTex(256, 256, (g, w, h) => drawSteel(g, w, h, { base: [222, 214, 190], seed: 7, weather: 0.08 }), { metres: 1.6 }),
    greenSteel: canvasTex(256, 256, (g, w, h) => drawSteel(g, w, h, { base: [70, 110, 80], seed: 8 }), { metres: 1.6 }),
    translucent: canvasTex(256, 256, (g, w, h) => drawSteel(g, w, h, { base: [230, 236, 232], seed: 9, weather: 0.05 }), { metres: 1.6 }),
    concrete: canvasTex(512, 512, (g, w, h) => drawConcrete(g, w, h), { metres: 3 }),
    boardConcrete: canvasTex(512, 512, (g, w, h) => drawConcrete(g, w, h, { base: [176, 172, 162], boards: 6, seed: 33 }), { metres: 2 }),
    slab: canvasTex(512, 512, (g, w, h) => drawConcrete(g, w, h, { base: [190, 188, 182], joints: 2, seed: 35 }), { metres: 4 }),
    asphalt: canvasTex(512, 512, (g, w, h) => drawAsphalt(g, w, h), { metres: 4 }),
    pavers: canvasTex(512, 512, (g, w, h) => drawPavers(g, w, h), { metres: 2 }),
    redPavers: canvasTex(512, 512, (g, w, h) => drawPavers(g, w, h, { base: [168, 92, 70], seed: 18, rows: 10, cols: 5 }), { metres: 2 }),
    gravel: canvasTex(256, 256, (g, w, h) => drawGravel(g, w, h), { metres: 2 }),
    dirt: canvasTex(256, 256, (g, w, h) => drawGravel(g, w, h, { base: [150, 118, 82], seed: 24 }), { metres: 2 }),
    soil: canvasTex(256, 256, (g, w, h) => drawSoil(g, w, h), { metres: 2 }),
    mulch: canvasTex(512, 512, (g, w, h) => drawSoil(g, w, h, { base: [92, 62, 40], seed: 30, mulch: true }), { metres: 2 }),
    timber: canvasTex(512, 512, (g, w, h) => drawTimber(g, w, h), { metres: 3 }),
    window: canvasTex(256, 256, (g, w, h) => drawWindow(g, w, h), { repeat: false }),
    window2: canvasTex(256, 256, (g, w, h) => drawWindow(g, w, h, { seed: 47 }), { repeat: false }),
    clerestory: canvasTex(256, 128, (g, w, h) => drawWindow(g, w, h, { seed: 51, blinds: false }), { repeat: false }),
    doorGreen: canvasTex(128, 256, (g, w, h) => drawDoor(g, w, h), { repeat: false }),
    doorBlue: canvasTex(128, 256, (g, w, h) => drawDoor(g, w, h, { colour: "#2f5f8f", seed: 44 }), { repeat: false }),
    mural: canvasTex(2048, 410, (g, w, h) => drawMural(g, w, h), { repeat: false }),
    court: canvasTex(256, 512, (g, w, h) => drawCourt(g, w, h), { repeat: false }),
  };
  return _tex;
}

const _mats = new Map();
/** A cached standard material. `map` is a texture key or a texture. */
export function schoolMat(key, { color = "#ffffff", map = null, roughness = 0.9, metalness = 0, emissive = null, emissiveIntensity = 1, side = THREE.FrontSide, transparent = false, opacity = 1, polygonOffset = 0, alphaTest = 0, envMapIntensity = 1, vertexColors = true, depthWrite = true } = {}) {
  if (_mats.has(key)) return _mats.get(key);
  const tex = typeof map === "string" ? getSchoolTextures()[map] : map;
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color), map: tex || null, roughness, metalness, side, transparent, opacity, alphaTest, vertexColors, depthWrite,
    emissive: emissive ? new THREE.Color(emissive) : new THREE.Color(0, 0, 0), emissiveIntensity: emissive ? emissiveIntensity : 0,
  });
  m.envMapIntensity = envMapIntensity;
  if (polygonOffset) {
    m.polygonOffset = true;
    m.polygonOffsetFactor = -polygonOffset;
    m.polygonOffsetUnits = -polygonOffset;
  }
  _mats.set(key, m);
  return m;
}

/** The school's named materials. */
export function M() {
  return {
    brick: schoolMat("brick", { map: "brick", roughness: 0.92 }),
    brick2: schoolMat("brick2", { map: "brick2", roughness: 0.92 }),
    brickDark: schoolMat("brickDark", { map: "brickDark", roughness: 0.92 }),
    tiles: schoolMat("tiles", { map: "tiles", roughness: 0.8 }),
    redSteel: schoolMat("redSteel", { map: "redSteel", roughness: 0.45, metalness: 0.25 }),
    greySteel: schoolMat("greySteel", { map: "greySteel", roughness: 0.45, metalness: 0.3 }),
    creamSteel: schoolMat("creamSteel", { map: "creamSteel", roughness: 0.5, metalness: 0.2 }),
    greenSteel: schoolMat("greenSteel", { map: "greenSteel", roughness: 0.5, metalness: 0.2 }),
    steel: schoolMat("steelFlat", { map: "greySteel", roughness: 0.5, metalness: 0.2, color: "#dcdcd6" }),
    translucent: schoolMat("translucent", { map: "translucent", roughness: 0.3, emissive: "#fff8e8", emissiveIntensity: 0.12 }),
    concrete: schoolMat("concrete", { map: "concrete", roughness: 0.95 }),
    boardConcrete: schoolMat("boardConcrete", { map: "boardConcrete", roughness: 0.95 }),
    slab: schoolMat("slab", { map: "slab", roughness: 0.95 }),
    asphalt: schoolMat("asphalt", { map: "asphalt", roughness: 0.97 }),
    pavers: schoolMat("pavers", { map: "pavers", roughness: 0.92 }),
    redPavers: schoolMat("redPavers", { map: "redPavers", roughness: 0.92 }),
    gravel: schoolMat("gravel", { map: "gravel", roughness: 1 }),
    dirt: schoolMat("dirt", { map: "dirt", roughness: 1 }),
    soil: schoolMat("soil", { map: "soil", roughness: 1 }),
    mulch: schoolMat("mulch", { map: "mulch", roughness: 1 }),
    timber: schoolMat("timber", { map: "timber", roughness: 0.6 }),
    cream: schoolMat("cream", { color: "#efe6d0", roughness: 0.7 }),
    fascia: schoolMat("fascia", { color: "#e9e2cf", roughness: 0.6 }),
    gutter: schoolMat("gutter", { color: "#d8d6cf", roughness: 0.4, metalness: 0.4 }),
    galv: schoolMat("galv", { color: "#b9bec2", roughness: 0.35, metalness: 0.75 }),
    galvDark: schoolMat("galvDark", { color: "#8d949a", roughness: 0.4, metalness: 0.7 }),
    darkMetal: schoolMat("darkMetal", { color: "#2b2f33", roughness: 0.5, metalness: 0.5 }),
    alu: schoolMat("alu", { color: "#c9ccce", roughness: 0.35, metalness: 0.6 }),
    glass: schoolMat("glass", { color: "#47606e", roughness: 0.08, metalness: 0.3, envMapIntensity: 1.6 }),
    tactile: schoolMat("tactile", { color: "#f2c21b", roughness: 0.6 }),
    yellowPaint: schoolMat("yellowPaint", { color: "#f2c21b", roughness: 0.6, polygonOffset: 2 }),
    whitePaint: schoolMat("whitePaint", { color: "#f4f4ef", roughness: 0.6, polygonOffset: 2 }),
    blackRubber: schoolMat("blackRubber", { color: "#1f2123", roughness: 0.8 }),
    curtain: schoolMat("curtain", { color: "#8e1f2b", roughness: 0.85 }),
    water: schoolMat("pondWater", { color: "#3d7f8f", roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85 }),
    // Plain vertex-coloured looks (one draw for every painted / metal thing).
    paint: schoolMat("paint", { roughness: 0.72 }),
    gloss: schoolMat("gloss", { roughness: 0.32, metalness: 0.1 }),
    metal: schoolMat("metal", { roughness: 0.38, metalness: 0.7 }),
    matte: schoolMat("matte", { roughness: 0.95 }),
    glow: schoolMat("glow", { roughness: 0.6, emissive: "#ffffff", emissiveIntensity: 0.6 }),
  };
}

// ---------------------------------------------------------------------------
// THE GROUND — vertex colours carry what the ground IS (mown lawn, the oval's
// stripes, the bush hill's leaf litter, the town's gardens, the beach); the
// shader adds the detail: turf mottling + clover, leaf-litter flecks, sand
// ripples, and layered sandstone on the steep banks. aMix = (sand, litter,
// mown, wet).
// ---------------------------------------------------------------------------

export function makeSchoolTerrainMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec4 aMix;\nvarying vec4 vMix;\nvarying vec3 vSW;\nvarying vec3 vSN;")
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvSW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvSN = normalize(mat3(modelMatrix) * objectNormal);\nvMix = aMix;"
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec4 vMix;\nvarying vec3 vSW;\nvarying vec3 vSN;\n${JNOISE}`)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        {
          vec3 wp = vSW;
          float steep = 1.0 - clamp(vSN.y, 0.0, 1.0);
          float sand = vMix.x, litter = vMix.y, mown = vMix.z, wet = vMix.w;
          float grass = clamp(1.0 - sand - litter, 0.0, 1.0);
          float m1 = jf2(wp.xz * 0.09);
          float m2 = jn2(wp.xz * 0.8);
          float m3 = jn2(wp.xz * 3.1);
          vec3 c = diffuseColor.rgb;
          // Turf: mottling (less on the mown lawns) + clover / flower flecks.
          c *= mix(1.0, 0.86 + 0.22 * m1 + 0.08 * (m2 - 0.5) + 0.05 * (m3 - 0.5), grass * (1.0 - 0.45 * mown));
          float fleck = smoothstep(0.86, 0.93, jn2(wp.xz * 1.7 + 4.0)) * grass * (1.0 - mown);
          c = mix(c, c * vec3(1.2, 1.15, 0.7), fleck * 0.45);
          // Leaf litter: brown leaves, twigs, gum bark.
          float lf = jn2(wp.xz * 2.4 + 2.0);
          c = mix(c, c * vec3(1.12, 0.92, 0.72), litter * smoothstep(0.45, 0.8, lf) * 0.7);
          c *= mix(1.0, 0.86 + 0.24 * m2, litter);
          // Sand: ripples + grains, darker where wet.
          float rip = sin(wp.x * 2.1 + wp.z * 0.7 + jn2(wp.xz * 0.3) * 5.0) * 0.5 + 0.5;
          c *= mix(1.0, 0.93 + 0.08 * rip + 0.06 * (m3 - 0.5), sand);
          c = mix(c, c * vec3(0.78, 0.76, 0.72), wet * 0.6);
          // Steep banks: layered sandstone + clay with grassy ledges.
          float rockMix = smoothstep(0.36, 0.58, steep);
          float n3 = jn3(wp * 0.33);
          float strata = 0.5 + 0.5 * sin(wp.y * 2.4 + n3 * 4.0 + jn2(wp.xz * 0.06) * 8.0);
          vec3 rock = mix(vec3(0.66, 0.55, 0.40), vec3(0.50, 0.40, 0.30), n3);
          rock *= 0.84 + 0.22 * strata;
          float ledge = smoothstep(0.66, 0.95, strata) * smoothstep(0.35, 0.75, jn3(wp * 0.5 + 3.0));
          rock = mix(rock, vec3(0.36, 0.52, 0.24), ledge * 0.6);
          c = mix(c, rock, rockMix);
          diffuseColor.rgb = c;
        }`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.4, vMix.w * 0.8);`
      );
  };
  m.customProgramCacheKey = () => "school-terrain-v1";
  return m;
}

// ---------------------------------------------------------------------------
// THE SEA — Coffs Harbour's water: a big plane at SEA_Y with swell, the
// harbour's calmer green-blue, white shore-break along Jetty Beach (the
// coastline is analytic — `coastZ` mirrored here), sun-glitter.
// ---------------------------------------------------------------------------
export function makeSchoolSeaMaterial(seaY, beachZ) {
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color("#2a8fc0"), roughness: 0.14, metalness: 0.06 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = jungleClock.uTime;
    sh.uniforms.uBeach = { value: beachZ };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vOW;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvOW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform float uTime;\nuniform float uBeach;\nvarying vec3 vOW;\n${JNOISE}
float ss(float a, float b, float x){ float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
float coastZ(float x){ return uBeach + 18.0 * sin(x / 140.0 + 0.6) - 26.0 * ss(150.0, 320.0, x) * ss(520.0, 330.0, x); }`)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        {
          vec2 p = vOW.xz;
          float off = p.y - coastZ(p.x);           // metres out from the beach
          float deep = ss(4.0, 160.0, off);
          vec3 shallow = vec3(0.30, 0.74, 0.74), mid = vec3(0.13, 0.55, 0.72), far = vec3(0.07, 0.33, 0.58);
          vec3 c = mix(shallow, mid, ss(2.0, 40.0, off));
          c = mix(c, far, deep);
          // The harbour (between the breakwalls) is calmer + greener.
          float harb = ss(180.0, 240.0, p.x) * (1.0 - ss(420.0, 470.0, p.y));
          c = mix(c, vec3(0.16, 0.56, 0.6), harb * 0.35);
          // Swell bands + chop.
          float sw = sin(off * 0.55 - uTime * 1.4 + jn2(p * 0.02) * 6.0) * 0.5 + 0.5;
          float chop = jf2(p * 0.18 + vec2(uTime * 0.12, -uTime * 0.08));
          c *= 0.9 + 0.1 * sw + 0.08 * (chop - 0.5);
          // Shore-break: white foam lines rolling in on Jetty Beach.
          float br = sin(off * 0.9 + uTime * 2.2) * 0.5 + 0.5;
          float foam = (1.0 - ss(0.0, 9.0, off)) * smoothstep(0.55, 0.9, br + 0.35 * jn2(p * 0.4 + uTime * 0.3));
          foam += (1.0 - ss(-1.0, 1.6, off)) * 0.8;
          c = mix(c, vec3(0.96, 0.98, 1.0), clamp(foam, 0.0, 1.0) * 0.85);
          diffuseColor.rgb = c;
        }`
      )
      .replace(
        "#include <normal_fragment_maps>",
        /* glsl */ `#include <normal_fragment_maps>
        {
          vec2 p = vOW.xz;
          float e = 0.6;
          float h0 = jf2(p * 0.12 + uTime * 0.05), hx = jf2((p + vec2(e, 0.0)) * 0.12 + uTime * 0.05), hz = jf2((p + vec2(0.0, e)) * 0.12 + uTime * 0.05);
          vec3 bump = vec3(-(hx - h0) * 1.4, 1.0, -(hz - h0) * 1.4);
          normal = normalize((viewMatrix * vec4(normalize(bump), 0.0)).xyz);
        }`
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `#include <emissivemap_fragment>
        {
          vec3 vd = normalize(cameraPosition - vOW);
          float tw = jn2(vOW.xz * 0.9 + vd.xz * 4.0 + uTime * 0.6);
          totalEmissiveRadiance += vec3(1.0, 0.97, 0.88) * smoothstep(0.9, 0.99, tw) * 0.55;
        }`
      );
  };
  m.customProgramCacheKey = () => "school-sea-v1";
  return m;
}

// ---------------------------------------------------------------------------
// KIT MATERIALS — every Kit buffer key resolves here.
// ---------------------------------------------------------------------------
const UNIT_TEX = new Set(["window", "window2", "clerestory", "doorGreen", "doorBlue", "mural", "court"]);
export function kitMat(key) {
  const m = M();
  if (m[key]) return m[key];
  if (UNIT_TEX.has(key)) return schoolMat(`unit-${key}`, { map: key, roughness: key === "mural" ? 0.85 : 0.5, metalness: key.startsWith("window") || key === "clerestory" ? 0.15 : 0 });
  switch (key) {
    case "yellowLine": return schoolMat("yellowLine", { color: "#f2c21b", roughness: 0.6, polygonOffset: 3 });
    case "whiteLine": return schoolMat("whiteLine", { color: "#f4f4ef", roughness: 0.6, polygonOffset: 3 });
    case "decal": return schoolMat("decal", { roughness: 0.7, polygonOffset: 2 });
    case "dark": return schoolMat("dark", { color: "#20262b", roughness: 0.9 });
    case "grating": return schoolMat("grating", { map: "greySteel", color: "#9aa0a4", roughness: 0.5, metalness: 0.6 });
    default: return m.paint;
  }
}

/** Kit output → meshes (cast + receive shadows unless told otherwise). */
export const NO_SHADOW_KEYS = new Set(["yellowLine", "whiteLine", "decal", "window", "window2", "clerestory", "glow", "translucent", "glass", "tactile", "mural"]);
