import * as THREE from "three";

/**
 * THE QUOTIENT TEMPLE's look (2026-11-09) — canvas-drawn textures (no
 * downloads) + a small material cache. Inspired by Jeff's references:
 *   marble     the Great Hall's floor (Temple of Time): pale + grey squares
 *              set on the diagonal, thin gold lines
 *   diamond    the Hall of Heads (Mario RPG): ochre tiles with a raised
 *              diamond in each
 *   bricks     sandstone blocks (SM64 / Gobi's Valley)
 *   slab       the throne room's big dark slabs (the cobra chamber)
 *   ramp       SM64's red-brown slatted ramps
 *   glyphs     hieroglyph panels (gold on dark — they glow faintly)
 *   coffer     the dark coffered ceilings
 *   seal       the floor medallion: a gold ring of glyphs round a ÷
 */

function canvasTex(w, h, draw, { repeat = false, srgb = true } = {}) {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function prand(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const rgb = (c, k = 1) => `rgb(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)})`;

function speckle(g, w, h, seed, n, alpha) {
  const R = prand(seed);
  for (let i = 0; i < n; i++) {
    const v = R();
    g.fillStyle = `rgba(${v < 0.5 ? "60,40,20" : "255,250,235"},${alpha * R()})`;
    g.fillRect(R() * w, R() * h, 1 + R() * 2, 1 + R() * 2);
  }
}

// One tile = 4 m (the repeat is set by the box's size / tile).
function drawMarble(g, w, h) {
  const n = 4;
  const s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const light = (i + j) % 2 === 0;
    g.fillStyle = light ? "#ece6d8" : "#b9b3a6";
    g.fillRect(i * s, j * s, s, s);
    // a faint vein
    g.strokeStyle = light ? "rgba(150,140,120,0.25)" : "rgba(90,85,75,0.25)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(i * s + s * 0.1, j * s + s * (0.3 + 0.4 * ((i * 7 + j * 3) % 5) / 5));
    g.bezierCurveTo(i * s + s * 0.4, j * s + s * 0.2, i * s + s * 0.6, j * s + s * 0.9, i * s + s * 0.95, j * s + s * 0.6);
    g.stroke();
  }
  g.strokeStyle = "rgba(201,154,26,0.75)";
  g.lineWidth = 2;
  for (let i = 0; i <= n; i++) {
    g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke();
    g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke();
  }
  speckle(g, w, h, 11, 1400, 0.18);
}
function drawDiamond(g, w, h) {
  const n = 2;
  const s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = i * s, y = j * s;
    g.fillStyle = "#b8862e";
    g.fillRect(x, y, s, s);
    g.fillStyle = "#9a6c20";
    g.fillRect(x + 3, y + 3, s - 6, s - 6);
    g.fillStyle = "#c99a3e";
    g.beginPath();
    g.moveTo(x + s / 2, y + s * 0.12); g.lineTo(x + s * 0.88, y + s / 2); g.lineTo(x + s / 2, y + s * 0.88); g.lineTo(x + s * 0.12, y + s / 2); g.closePath();
    g.fill();
    g.strokeStyle = "#6e4a14";
    g.lineWidth = 3;
    g.stroke();
    g.fillStyle = "rgba(255,230,160,0.35)";
    g.beginPath();
    g.moveTo(x + s / 2, y + s * 0.2); g.lineTo(x + s * 0.8, y + s / 2); g.lineTo(x + s / 2, y + s * 0.5); g.closePath();
    g.fill();
  }
  speckle(g, w, h, 21, 1600, 0.22);
}
function drawBricks(g, w, h, { base = [214, 178, 112], rows = 4, cols = 2, seed = 5, mortar = "#7a5a30" } = {}) {
  const R = prand(seed);
  g.fillStyle = mortar;
  g.fillRect(0, 0, w, h);
  const bh = h / rows;
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? w / cols / 2 : 0;
    for (let c = -1; c <= cols; c++) {
      const x = c * (w / cols) + off;
      const k = 0.86 + R() * 0.22;
      g.fillStyle = rgb(base, k);
      g.fillRect(x + 3, r * bh + 3, w / cols - 6, bh - 6);
      g.fillStyle = "rgba(255,245,220,0.18)";
      g.fillRect(x + 3, r * bh + 3, w / cols - 6, 4);
      g.fillStyle = "rgba(60,35,10,0.18)";
      g.fillRect(x + 3, r * bh + bh - 7, w / cols - 6, 4);
    }
  }
  speckle(g, w, h, seed + 1, 900, 0.2);
}
function drawSlab(g, w, h) {
  const R = prand(31);
  g.fillStyle = "#2a1d14";
  g.fillRect(0, 0, w, h);
  const s = w / 2;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const k = 0.85 + R() * 0.3;
    g.fillStyle = rgb([128, 92, 60], k);
    g.fillRect(i * s + 4, j * s + 4, s - 8, s - 8);
    const grd = g.createLinearGradient(i * s, j * s, i * s + s, j * s + s);
    grd.addColorStop(0, "rgba(255,220,170,0.18)");
    grd.addColorStop(1, "rgba(0,0,0,0.2)");
    g.fillStyle = grd;
    g.fillRect(i * s + 4, j * s + 4, s - 8, s - 8);
  }
  speckle(g, w, h, 32, 1200, 0.25);
}
function drawRamp(g, w, h) {
  g.fillStyle = "#4a2414";
  g.fillRect(0, 0, w, h);
  const n = 8;
  for (let i = 0; i < n; i++) {
    g.fillStyle = i % 2 ? "#9c4c2a" : "#a8562f";
    g.fillRect(0, (i * h) / n + 2, w, h / n - 4);
    g.fillStyle = "rgba(255,200,150,0.18)";
    g.fillRect(0, (i * h) / n + 2, w, 3);
  }
  speckle(g, w, h, 41, 600, 0.25);
}
function drawSandstone(g, w, h) {
  drawBricks(g, w, h, { base: [226, 196, 140], rows: 3, cols: 2, seed: 17, mortar: "#8a6a3c" });
}
function drawSandFloor(g, w, h) {
  const R = prand(7);
  g.fillStyle = "#d9b77a";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(${R() < 0.5 ? "150,110,60" : "255,240,200"},${0.15 * R()})`;
    g.fillRect(R() * w, R() * h, 2, 2);
  }
  g.strokeStyle = "rgba(160,120,70,0.25)";
  for (let i = 0; i < 9; i++) {
    g.beginPath();
    const y = (i + 0.5) * (h / 9);
    g.moveTo(0, y);
    for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 4);
    g.stroke();
  }
}
function drawWood(g, w, h) {
  const R = prand(51);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = rgb([120, 74, 40], 0.8 + R() * 0.35);
    g.fillRect(0, (i * h) / 8, w, h / 8);
    g.fillStyle = "rgba(40,20,8,0.5)";
    g.fillRect(0, (i * h) / 8, w, 2);
  }
  speckle(g, w, h, 52, 500, 0.2);
}
function drawCoffer(g, w, h) {
  // Sandstone coffers: a raised grid with sunken panels + a gold rosette each.
  g.fillStyle = "#8a6c48";
  g.fillRect(0, 0, w, h);
  const s = w / 2;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const x = i * s, y = j * s;
    g.fillStyle = "#6e5236"; g.fillRect(x + 10, y + 10, s - 20, s - 20);
    g.fillStyle = "#5a4128"; g.fillRect(x + 22, y + 22, s - 44, s - 44);
    g.fillStyle = "rgba(255,230,180,0.25)"; g.fillRect(x + 10, y + 10, s - 20, 4);
    g.fillStyle = "#d9a521";
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      g.beginPath(); g.ellipse(x + s / 2 + Math.cos(a) * 9, y + s / 2 + Math.sin(a) * 9, 7, 3.5, a, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = "#ffd75e"; g.beginPath(); g.arc(x + s / 2, y + s / 2, 5, 0, Math.PI * 2); g.fill();
  }
  speckle(g, w, h, 101, 500, 0.15);
}
/** An Egyptian night sky: lapis blue with gold five-point stars (the vault). */
function drawStars(g, w, h) {
  g.fillStyle = "#1d3566";
  g.fillRect(0, 0, w, h);
  const R = prand(111);
  const star = (x, y, r) => {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r;
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath(); g.fill();
  };
  g.fillStyle = "#f2c64e";
  const n = 4;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) star(((i + 0.5 + (j % 2) * 0.5) * w) / n, ((j + 0.5) * h) / n, 11);
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(160,190,255,${0.15 * R()})`; g.fillRect(R() * w, R() * h, 2, 2); }
}
/** Hand-drawn hieroglyph-ish marks (paths — no emoji fonts). */
const GLYPH_DRAW = [
  (g, x, y, r) => { g.beginPath(); g.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(x, y, r * 0.3, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(x - r * 0.2, y + r * 0.5); g.lineTo(x - r * 0.4, y + r); g.stroke(); }, // eye
  (g, x, y, r) => { g.beginPath(); g.ellipse(x, y - r * 0.5, r * 0.35, r * 0.45, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(x, y - r * 0.05); g.lineTo(x, y + r); g.moveTo(x - r * 0.6, y + r * 0.15); g.lineTo(x + r * 0.6, y + r * 0.15); g.stroke(); }, // ankh
  (g, x, y, r) => { g.beginPath(); for (let i = 0; i < 3; i++) { g.moveTo(x - r, y - r * 0.5 + i * r * 0.5); for (let k = 0; k <= 4; k++) g.lineTo(x - r + (k * r) / 2, y - r * 0.5 + i * r * 0.5 + (k % 2 ? -r * 0.18 : r * 0.18)); } g.stroke(); }, // water
  (g, x, y, r) => { g.beginPath(); g.moveTo(x - r, y + r * 0.8); g.lineTo(x, y - r * 0.9); g.lineTo(x + r, y + r * 0.8); g.closePath(); g.stroke(); }, // pyramid
  (g, x, y, r) => { g.beginPath(); g.arc(x, y, r * 0.75, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(x, y, r * 0.18, 0, Math.PI * 2); g.fill(); }, // sun
  (g, x, y, r) => { g.beginPath(); g.ellipse(x, y, r * 0.7, r * 0.45, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(x + r * 0.55, y - r * 0.45, r * 0.25, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(x - r * 0.2, y + r * 0.4); g.lineTo(x - r * 0.3, y + r); g.moveTo(x + r * 0.2, y + r * 0.4); g.lineTo(x + r * 0.3, y + r); g.stroke(); }, // bird
  (g, x, y, r) => { g.beginPath(); g.moveTo(x, y + r); g.lineTo(x, y - r); g.moveTo(x, y - r * 0.4); g.quadraticCurveTo(x + r * 0.8, y - r * 0.9, x + r * 0.5, y - r * 0.1); g.stroke(); }, // reed
  (g, x, y, r) => { g.fillRect(x - r * 0.7, y - r * 0.08, r * 1.4, r * 0.16); g.beginPath(); g.arc(x, y - r * 0.45, r * 0.15, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(x, y + r * 0.45, r * 0.15, 0, Math.PI * 2); g.fill(); }, // ÷
  (g, x, y, r) => { g.beginPath(); g.moveTo(x - r * 0.8, y + r * 0.6); g.bezierCurveTo(x - r * 0.4, y - r, x + r * 0.4, y + r, x + r * 0.8, y - r * 0.6); g.stroke(); g.beginPath(); g.arc(x + r * 0.8, y - r * 0.6, r * 0.12, 0, Math.PI * 2); g.fill(); }, // snake
  (g, x, y, r) => { for (let i = 0; i < 3; i++) g.fillRect(x - r * 0.6 + i * r * 0.5, y - r * 0.7, r * 0.18, r * 1.4); }, // tally
  (g, x, y, r) => { g.beginPath(); g.moveTo(x - r * 0.7, y + r * 0.7); g.lineTo(x - r * 0.7, y - r * 0.2); g.arc(x, y - r * 0.2, r * 0.7, Math.PI, 0); g.lineTo(x + r * 0.7, y + r * 0.7); g.stroke(); }, // house
  (g, x, y, r) => { g.beginPath(); g.moveTo(x - r * 0.7, y - r * 0.7); g.lineTo(x + r * 0.7, y + r * 0.7); g.moveTo(x + r * 0.7, y - r * 0.7); g.lineTo(x - r * 0.7, y + r * 0.7); g.stroke(); }, // ×
];
function drawGlyphPanel(g, w, h, { bg = "#2b2016", fg = "#e2b74a", glow = "rgba(226,183,74,0.35)" } = {}) {
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  const R = prand(61);
  const cols = 6, rows = 8;
  g.strokeStyle = "rgba(226,183,74,0.45)";
  g.lineWidth = 3;
  g.strokeRect(6, 6, w - 12, h - 12);
  for (let c = 1; c < cols; c++) { g.beginPath(); g.moveTo((c * w) / cols, 10); g.lineTo((c * w) / cols, h - 10); g.stroke(); }
  g.lineCap = "round";
  const r = Math.min(w / cols, h / rows) * 0.3;
  for (let c = 0; c < cols; c++) for (let rr = 0; rr < rows; rr++) {
    const d = GLYPH_DRAW[Math.floor(R() * GLYPH_DRAW.length)];
    const x = ((c + 0.5) * w) / cols, y = ((rr + 0.5) * h) / rows;
    g.lineWidth = 4; g.strokeStyle = glow; g.fillStyle = glow;
    d(g, x + 1.5, y + 1.5, r);
    g.lineWidth = 3; g.strokeStyle = fg; g.fillStyle = fg;
    d(g, x, y, r);
  }
}
function drawSeal(g, w, h) {
  const cx = w / 2, cy = h / 2, R = w / 2;
  g.clearRect(0, 0, w, h);
  const ring = (r, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); };
  g.fillStyle = "#5a4520";
  g.beginPath(); g.arc(cx, cy, R - 2, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#e9e1cc";
  g.beginPath(); g.arc(cx, cy, R * 0.78, 0, Math.PI * 2); g.fill();
  ring(R - 6, "#d9a521", 8);
  ring(R * 0.78, "#d9a521", 5);
  ring(R * 0.46, "#d9a521", 5);
  // the ring of glyphs (numbers + symbols)
  g.textAlign = "center"; g.textBaseline = "middle";
  const marks = ["1", "÷", "2", "×", "3", "÷", "4", "×", "5", "÷", "6", "×", "7", "÷", "8", "×", "9", "÷", "10", "×", "11", "÷", "12", "×"];
  g.font = `bold ${Math.round(R * 0.13)}px serif`;
  marks.forEach((m, i) => {
    const a = (i / marks.length) * Math.PI * 2 - Math.PI / 2;
    g.save();
    g.translate(cx + Math.cos(a) * R * 0.88, cy + Math.sin(a) * R * 0.88);
    g.rotate(a + Math.PI / 2);
    g.fillStyle = "#f4d27a";
    g.fillText(m, 0, 0);
    g.restore();
  });
  // a gold star-burst behind the ÷
  g.fillStyle = "#d9a521";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * R * 0.18, cy + Math.sin(a) * R * 0.18);
    g.lineTo(cx + Math.cos(a + 0.13) * R * 0.66, cy + Math.sin(a + 0.13) * R * 0.66);
    g.lineTo(cx + Math.cos(a + 0.26) * R * 0.18, cy + Math.sin(a + 0.26) * R * 0.18);
    g.fill();
  }
  g.fillStyle = "#2a1d0c";
  g.beginPath(); g.arc(cx, cy, R * 0.34, 0, Math.PI * 2); g.fill();
  // ÷
  g.fillStyle = "#ffd75e";
  g.fillRect(cx - R * 0.22, cy - R * 0.035, R * 0.44, R * 0.07);
  g.beginPath(); g.arc(cx, cy - R * 0.14, R * 0.055, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(cx, cy + R * 0.14, R * 0.055, 0, Math.PI * 2); g.fill();
}
function drawShaft(g, w, h) {
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, "rgba(255,240,200,0.0)");
  grd.addColorStop(0.15, "rgba(255,236,190,0.55)");
  grd.addColorStop(1, "rgba(255,230,180,0.0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
  const side = g.createLinearGradient(0, 0, w, 0);
  side.addColorStop(0, "rgba(0,0,0,1)");
  side.addColorStop(0.25, "rgba(0,0,0,0)");
  side.addColorStop(0.75, "rgba(0,0,0,0)");
  side.addColorStop(1, "rgba(0,0,0,1)");
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = side;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = "source-over";
}
function drawGlow(g, w, h) {
  const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  grd.addColorStop(0, "rgba(255,220,150,1)");
  grd.addColorStop(0.35, "rgba(255,170,70,0.5)");
  grd.addColorStop(1, "rgba(255,140,40,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
}
function drawBook(g, w, h) {
  const R = prand(71);
  g.fillStyle = "#2a1a0e";
  g.fillRect(0, 0, w, h);
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    let x = 4;
    while (x < w - 6) {
      const bw = 6 + R() * 10;
      const hue = [["#7a2a1a"], ["#2a4a6a"], ["#5a6a2a"], ["#8a6a2a"], ["#e8dcc0"]][Math.floor(R() * 5)][0];
      g.fillStyle = hue;
      const top = r * (h / rows) + 6 + R() * 8;
      g.fillRect(x, top, bw - 1, (h / rows) - (top - r * (h / rows)) - 4);
      x += bw;
    }
    g.fillStyle = "#5a3a1e";
    g.fillRect(0, (r + 1) * (h / rows) - 4, w, 4);
  }
}

function drawPaving(g, w, h) {
  const R = prand(81);
  g.fillStyle = "#7a6040";
  g.fillRect(0, 0, w, h);
  // Irregular big flagstones in rows.
  const rows = 3;
  for (let r = 0; r < rows; r++) {
    let x = -R() * 40;
    const y0 = (r * h) / rows;
    while (x < w) {
      const bw = 60 + R() * 70;
      g.fillStyle = rgb([214, 190, 146], 0.84 + R() * 0.2);
      g.fillRect(x + 3, y0 + 3, bw - 6, h / rows - 6);
      g.fillStyle = "rgba(255,248,225,0.12)";
      g.fillRect(x + 3, y0 + 3, bw - 6, 3);
      x += bw;
    }
  }
  speckle(g, w, h, 82, 1600, 0.2);
}
function drawGrate(g, w, h) {
  g.clearRect(0, 0, w, h);
  const n = 8, bar = 7;
  g.fillStyle = "#4a4440";
  for (let i = 0; i < n; i++) {
    g.fillRect((i * w) / n, 0, bar, h);
    g.fillRect(0, (i * h) / n, w, bar);
  }
  g.fillStyle = "rgba(255,255,255,0.18)";
  for (let i = 0; i < n; i++) { g.fillRect((i * w) / n, 0, 2, h); g.fillRect(0, (i * h) / n, w, 2); }
  g.fillStyle = "#2e2a27";
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    g.beginPath(); g.arc((i * w) / n + bar / 2, (j * h) / n + bar / 2, 4, 0, Math.PI * 2); g.fill();
  }
}
function drawSand2(g, w, h) {
  // Thin falling streaks of sand, thick in the middle, wispy at the sides.
  const R = prand(91);
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    const x = w / 2 + (R() - 0.5) * w * (0.3 + 0.7 * R());
    const edge = 1 - Math.abs(x - w / 2) / (w / 2);
    const y0 = R() * h, len = 30 + R() * 140;
    g.fillStyle = `rgba(${200 + R() * 40},${165 + R() * 35},${105 + R() * 30},${(0.25 + 0.6 * R()) * edge})`;
    g.fillRect(x, y0, 1 + R() * 2.5, len);
    if (y0 + len > h) g.fillRect(x, y0 - h, 1 + R() * 2, len);
  }
}

let _tex = null;
export function getQtTextures() {
  if (_tex) return _tex;
  _tex = {
    marble: canvasTex(256, 256, drawMarble, { repeat: true }),
    diamond: canvasTex(256, 256, drawDiamond, { repeat: true }),
    bricks: canvasTex(256, 256, (g, w, h) => drawBricks(g, w, h), { repeat: true }),
    darkBricks: canvasTex(256, 256, (g, w, h) => drawBricks(g, w, h, { base: [150, 110, 70], seed: 9, mortar: "#3a2614" }), { repeat: true }),
    sandstone: canvasTex(256, 256, drawSandstone, { repeat: true }),
    slab: canvasTex(256, 256, drawSlab, { repeat: true }),
    ramp: canvasTex(128, 256, drawRamp, { repeat: true }),
    sand: canvasTex(256, 256, drawSandFloor, { repeat: true }),
    wood: canvasTex(128, 128, drawWood, { repeat: true }),
    coffer: canvasTex(256, 256, drawCoffer, { repeat: true }),
    stars: canvasTex(256, 256, drawStars, { repeat: true }),
    glyphs: canvasTex(384, 512, (g, w, h) => drawGlyphPanel(g, w, h)),
    glyphsGreen: canvasTex(384, 512, (g, w, h) => drawGlyphPanel(g, w, h, { bg: "#1d2414", fg: "#bfe36a", glow: "rgba(170,230,90,0.45)" })),
    seal: canvasTex(512, 512, drawSeal),
    shaft: canvasTex(64, 256, drawShaft),
    glow: canvasTex(64, 64, drawGlow),
    books: canvasTex(256, 256, drawBook, { repeat: true }),
    paving: canvasTex(256, 256, drawPaving, { repeat: true }),
    grate: canvasTex(256, 256, drawGrate, { repeat: true }),
    sandfall: canvasTex(64, 256, drawSand2, { repeat: true }),
  };
  return _tex;
}

const _mats = new Map();
export function qtMat(color, { map = null, rough = 0.85, metal = 0, emissive = null, ei = 0, side = THREE.FrontSide, transparent = false, opacity = 1, emissiveMap = null, alphaTest = 0, depthWrite = true, toneMapped = true } = {}) {
  const key = `${alphaTest}|${depthWrite}|${toneMapped}|${color}|${map ? map.uuid : "-"}|${rough}|${metal}|${emissive}|${ei}|${side}|${transparent}|${opacity}|${emissiveMap ? emissiveMap.uuid : "-"}`;
  if (_mats.has(key)) return _mats.get(key);
  const m = new THREE.MeshStandardMaterial({
    color, map, roughness: rough, metalness: metal, side, transparent, opacity,
    emissive: emissive ? new THREE.Color(emissive) : new THREE.Color(0, 0, 0), emissiveIntensity: ei, emissiveMap, alphaTest, depthWrite, toneMapped,
  });
  _mats.set(key, m);
  return m;
}

/** Every named material the temple uses. */
let _M = null;
export function getQtMats() {
  if (_M) return _M;
  const t = getQtTextures();
  _M = {
    marble: qtMat("#ffffff", { map: t.marble, rough: 0.35, metal: 0.05 }),
    marbleWall: qtMat("#d8d0bc", { map: t.sandstone, rough: 0.8 }),
    marblePale: qtMat("#e9e2d0", { rough: 0.55 }),
    diamond: qtMat("#ffffff", { map: t.diamond, rough: 0.6 }),
    bricks: qtMat("#ffffff", { map: t.bricks, rough: 0.9 }),
    darkBricks: qtMat("#ffffff", { map: t.darkBricks, rough: 0.95 }),
    sandstone: qtMat("#ffffff", { map: t.sandstone, rough: 0.9 }),
    slab: qtMat("#ffffff", { map: t.slab, rough: 0.7 }),
    darkStone: qtMat("#6a5038", { map: t.slab, rough: 0.7 }),
    ramp: qtMat("#ffffff", { map: t.ramp, rough: 0.85 }),
    sand: qtMat("#ffffff", { map: t.sand, rough: 1 }),
    wood: qtMat("#ffffff", { map: t.wood, rough: 0.8 }),
    coffer: qtMat("#ffffff", { map: t.coffer, rough: 1 }),
    gold: qtMat("#e0aa2e", { rough: 0.3, metal: 0.8, emissive: "#6a4a08", ei: 0.25 }),
    goldDark: qtMat("#9a6e18", { rough: 0.4, metal: 0.7 }),
    bronze: qtMat("#8a5a2a", { rough: 0.45, metal: 0.6 }),
    stone: qtMat("#cfc3a6", { rough: 0.9 }),
    stoneDark: qtMat("#5e5244", { rough: 0.9 }),
    statue: qtMat("#8c8476", { rough: 0.8 }),
    jade: qtMat("#3c6a3a", { rough: 0.5, metal: 0.1 }),
    glyphs: qtMat("#ffffff", { map: t.glyphs, rough: 0.8, emissive: "#ffffff", ei: 0.18, emissiveMap: t.glyphs }),
    glyphsGreen: qtMat("#ffffff", { map: t.glyphsGreen, rough: 0.8, emissive: "#ffffff", ei: 0.45, emissiveMap: t.glyphsGreen }),
    seal: qtMat("#ffffff", { map: t.seal, rough: 0.35, metal: 0.2, transparent: true }),
    books: qtMat("#ffffff", { map: t.books, rough: 0.9 }),
    iron: qtMat("#3a3633", { rough: 0.55, metal: 0.6 }),
    flame: qtMat("#ffb347", { emissive: "#ff8a1a", ei: 2.2, rough: 1 }),
    ember: qtMat("#ff6a1a", { emissive: "#ff4a00", ei: 1.6, rough: 1 }),
    eye: qtMat("#ffe27a", { emissive: "#ffc23a", ei: 1.8 }),
    paving: qtMat("#ffffff", { map: t.paving, rough: 0.85 }),
    goldTiles: qtMat("#ffe0a0", { map: t.diamond, rough: 0.4, metal: 0.35 }),
    woodCeil: qtMat("#8a6a50", { map: t.wood, rough: 0.9 }),
    woodSide: qtMat("#c09070", { map: t.wood, rough: 0.8 }),
    slabCeil: qtMat("#9a8070", { map: t.slab, rough: 0.9 }),
    sandCeil: qtMat("#b8a080", { map: t.sandstone, rough: 0.95 }),
    grate: qtMat("#ffffff", { map: t.grate, rough: 0.5, metal: 0.6, side: THREE.DoubleSide, alphaTest: 0.5 }),
    carpet: qtMat("#8e1f22", { rough: 0.95 }),
    window: qtMat("#fff1c8", { emissive: "#ffe2a0", ei: 1.4, rough: 1 }),
    cloth: qtMat("#7a1f1f", { rough: 0.95, side: THREE.DoubleSide }),
    clothBlue: qtMat("#1f3f7a", { rough: 0.95, side: THREE.DoubleSide }),
  };
  return _M;
}
