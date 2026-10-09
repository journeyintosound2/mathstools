/**
 * ACHIEVEMENTS WALL — painting the boards. Each world's board is a canvas
 * (PW × PH) painted from its `achievementsSummary` panel: a coloured header
 * with the world's name, a big headline, then the world's own content —
 * trophy rows with real medals (drawn, not emoji, so they read anywhere),
 * the island's level / friends / badges, the Playground's keys + the Head
 * Teacher's cup, or the jungle's explorer's log — and a progress footer.
 * Plus the wall's header sign ("Sam's Achievements").
 */
import * as THREE from "three";

export const PW = 720;
export const PH = 960;
const DISPLAY = "'MMA Display', 'Trebuchet MS', sans-serif";
const ROUNDED = "'MMA Rounded', 'Trebuchet MS', sans-serif";
const TAU = Math.PI * 2;

const MEDAL_COL = {
  gold: ["#fff3a6", "#f5c518", "#a57a00"],
  silver: ["#ffffff", "#c9d1d9", "#7d8790"],
  bronze: ["#ffd7b0", "#cd7f32", "#7a4515"],
};

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}
function fitText(g, text, maxW, font, size) {
  let s = size;
  g.font = `${font.replace("{s}", s)}`;
  while (g.measureText(text).width > maxW && s > 12) { s -= 1; g.font = font.replace("{s}", s); }
  return s;
}
function paper(g, w, h, light) {
  g.fillStyle = light; g.fillRect(0, 0, w, h);
  // Soft speckle so it reads as card, not flat colour.
  let s = 7;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.025)" : "rgba(255,255,255,0.05)";
    g.fillRect(r() * w, r() * h, 2 + r() * 3, 1 + r() * 2);
  }
}

/** A medal: ribbon + rim + face + star. `id` null → an empty slot ring. */
export function drawMedal(g, cx, cy, R, id) {
  if (!id) {
    g.save();
    g.setLineDash([5, 5]);
    g.lineWidth = 3;
    g.strokeStyle = "rgba(60,60,60,0.28)";
    g.beginPath(); g.arc(cx, cy, R * 0.82, 0, TAU); g.stroke();
    g.restore();
    return;
  }
  const [hi, mid, lo] = MEDAL_COL[id];
  // Ribbon tails.
  g.fillStyle = id === "gold" ? "#d6453a" : id === "silver" ? "#2f6fb5" : "#3a8f5a";
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(cx + s * R * 0.2, cy - R * 0.2);
    g.lineTo(cx + s * R * 0.75, cy + R * 1.25);
    g.lineTo(cx + s * R * 0.45, cy + R * 1.05);
    g.lineTo(cx + s * R * 0.25, cy + R * 1.35);
    g.lineTo(cx - s * R * 0.05, cy + R * 0.2);
    g.closePath(); g.fill();
  }
  const gr = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
  gr.addColorStop(0, hi); gr.addColorStop(0.55, mid); gr.addColorStop(1, lo);
  g.fillStyle = gr;
  g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  g.lineWidth = Math.max(2, R * 0.1); g.strokeStyle = lo;
  g.beginPath(); g.arc(cx, cy, R * 0.74, 0, TAU); g.stroke();
  // Star.
  g.fillStyle = hi;
  g.beginPath();
  for (let k = 0; k <= 10; k++) {
    const a = -Math.PI / 2 + (k / 10) * TAU;
    const rad = k % 2 ? R * 0.22 : R * 0.5;
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
    if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.fill();
}

function header(g, P) {
  const H = 150;
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, P.color); gr.addColorStop(1, P.deep);
  g.fillStyle = gr; g.fillRect(0, 0, PW, H);
  // A scalloped bunting edge under the header.
  g.fillStyle = P.deep;
  for (let x = 0; x < PW; x += 40) { g.beginPath(); g.arc(x + 20, H, 20, 0, Math.PI); g.fill(); }
  // Icon disc.
  g.fillStyle = "rgba(255,255,255,0.92)";
  g.beginPath(); g.arc(86, 76, 52, 0, TAU); g.fill();
  g.font = `60px ${ROUNDED}`; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(P.icon, 86, 80);
  // Title.
  const title = P.short || P.title;
  g.textAlign = "left";
  const s = fitText(g, title, PW - 180, `400 {s}px ${DISPLAY}`, 62);
  g.lineWidth = 8; g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineJoin = "round";
  g.strokeText(title, 158, 80 + s * 0.02);
  g.fillStyle = "#ffffff"; g.fillText(title, 158, 80);
}

function headline(g, P, y, right = null) {
  g.textAlign = "left"; g.textBaseline = "alphabetic";
  g.font = `400 58px ${DISPLAY}`; g.fillStyle = P.deep;
  g.fillText(P.headline, 40, y);
  if (right) right(y);
}

function medalChips(g, counts, y) {
  let x = PW - 40;
  for (const id of ["bronze", "silver", "gold"]) {
    g.font = `800 34px ${ROUNDED}`; g.textAlign = "right"; g.textBaseline = "middle";
    g.fillStyle = "#3b2a1d";
    g.fillText(String(counts[id]), x, y - 16);
    const w = g.measureText(String(counts[id])).width;
    drawMedal(g, x - w - 24, y - 20, 17, id);
    x -= w + 70;
  }
}

function footerBar(g, P, pct, label) {
  const y = PH - 92;
  g.font = `700 26px ${ROUNDED}`; g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillStyle = P.deep;
  g.fillText(label, 40, y - 14);
  rr(g, 40, y, PW - 80, 30, 15); g.fillStyle = "rgba(0,0,0,0.12)"; g.fill();
  if (pct > 0) {
    rr(g, 40, y, Math.max(30, (PW - 80) * Math.min(1, pct / 100)), 30, 15);
    const gr = g.createLinearGradient(40, 0, PW - 40, 0);
    gr.addColorStop(0, P.color); gr.addColorStop(1, P.deep);
    g.fillStyle = gr; g.fill();
  }
  g.font = `800 22px ${ROUNDED}`; g.textAlign = "right"; g.fillStyle = "#ffffff";
  if (pct >= 12) g.fillText(`${pct}%`, 40 + (PW - 80) * Math.min(1, pct / 100) - 12, y + 23);
}

function stamp(g, text, x, y, color, rot = -0.12) {
  g.save();
  g.translate(x, y); g.rotate(rot);
  g.font = `400 30px ${DISPLAY}`;
  const w = g.measureText(text).width + 34;
  g.lineWidth = 4; g.strokeStyle = color;
  rr(g, -w / 2, -26, w, 52, 10); g.stroke();
  g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(text, 0, 2);
  g.restore();
}

// ---------------------------------------------------------------------------
function paintTrophies(g, P) {
  headline(g, P, 238, (y) => medalChips(g, P.counts, y));
  const top = 280, rowH = 98, colW = (PW - 80) / 2;
  P.rows.forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 40 + col * colW, y = top + row * rowH;
    rr(g, x + 4, y, colW - 8, rowH - 10, 16);
    g.fillStyle = r.medal ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)"; g.fill();
    if (r.medal === "gold") { g.lineWidth = 3; g.strokeStyle = "#f5c518"; g.stroke(); }
    drawMedal(g, x + 46, y + 38, 26, r.medal);
    if (!r.medal) {
      g.font = `30px ${ROUNDED}`; g.textAlign = "center"; g.textBaseline = "middle";
      g.globalAlpha = 0.55; g.fillText(r.icon, x + 46, y + 42); g.globalAlpha = 1;
    }
    g.textAlign = "left"; g.textBaseline = "alphabetic";
    const name = r.name.replace(/^The /, "");
    fitText(g, name, colW - 100, `700 {s}px ${ROUNDED}`, 25);
    g.fillStyle = "#2b2118"; g.fillText(name, x + 84, y + 38);
    g.font = `600 21px ${ROUNDED}`; g.fillStyle = r.medal ? P.deep : "rgba(43,33,24,0.5)";
    g.fillText(r.best > 0 ? `Best ${r.pct}%` : "Not played yet", x + 84, y + 68);
  });
  footerBar(g, P, P.pct, "Overall");
  if (P.visited === false) stamp(g, "Not visited yet", PW - 175, PH - 128, "rgba(90,90,90,0.55)", -0.06);
}

function paintIsland(g, P) {
  // Level medallion + XP + coins.
  const cx = 112, cy = 262;
  g.fillStyle = P.color; g.beginPath(); g.arc(cx, cy, 70, 0, TAU); g.fill();
  g.lineWidth = 8; g.strokeStyle = "#ffcf4a"; g.stroke();
  g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `700 22px ${ROUNDED}`; g.fillText("LEVEL", cx, cy - 30);
  g.font = `400 66px ${DISPLAY}`; g.fillText(String(P.level), cx, cy + 14);
  g.textAlign = "left"; g.textBaseline = "alphabetic";
  g.font = `800 28px ${ROUNDED}`; g.fillStyle = P.deep; g.fillText("Experience", 210, 228);
  rr(g, 210, 242, PW - 250, 28, 14); g.fillStyle = "rgba(0,0,0,0.12)"; g.fill();
  rr(g, 210, 242, Math.max(28, (PW - 250) * (P.xpInto / P.xpFor)), 28, 14); g.fillStyle = "#3fb950"; g.fill();
  g.font = `700 22px ${ROUNDED}`; g.fillStyle = "#2b2118";
  g.fillText(`${P.xpInto} / ${P.xpFor} XP to level ${P.level + 1}`, 212, 300);
  // Coin.
  g.fillStyle = "#f5c518"; g.beginPath(); g.arc(226, 330, 16, 0, TAU); g.fill();
  g.lineWidth = 3; g.strokeStyle = "#a57a00"; g.stroke();
  g.font = `800 26px ${ROUNDED}`; g.fillStyle = "#2b2118"; g.fillText(`${P.coins} coins`, 252, 340);

  // The three friends.
  g.font = `400 36px ${DISPLAY}`; g.fillStyle = P.deep; g.fillText("Island friends", 40, 418);
  P.friends.forEach((f, i) => {
    const y = 444 + i * 100;
    rr(g, 40, y, PW - 80, 86, 16); g.fillStyle = "rgba(255,255,255,0.8)"; g.fill();
    g.font = `40px ${ROUNDED}`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(f.icon, 86, y + 44);
    g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.font = `800 27px ${ROUNDED}`; g.fillStyle = "#2b2118"; g.fillText(f.name, 130, y + 34);
    const nameW = g.measureText(f.name).width;
    g.font = `600 20px ${ROUNDED}`; g.fillStyle = "rgba(43,33,24,0.65)"; g.fillText(f.topic, 130 + nameW + 14, y + 33);
    // Bar with the pass mark.
    const bx = 130, bw = PW - 260, by = y + 50;
    rr(g, bx, by, bw, 18, 9); g.fillStyle = "rgba(0,0,0,0.12)"; g.fill();
    if (f.best > 0) { rr(g, bx, by, Math.max(18, (bw * f.best) / 100), 18, 9); g.fillStyle = f.passed ? "#3fb950" : "#f0a030"; g.fill(); }
    const mx = bx + (bw * P.passMark) / 100;
    g.fillStyle = "#2b2118"; g.fillRect(mx - 1.5, by - 6, 3, 30);
    g.font = `800 24px ${ROUNDED}`; g.textAlign = "right"; g.fillStyle = f.passed ? "#2a8a3e" : "#2b2118";
    g.fillText(f.attempts ? `${f.best}%` : "—", PW - 56, by + 17);
    if (f.passed) { g.font = `800 26px ${ROUNDED}`; g.fillStyle = "#2a8a3e"; g.fillText("✓", PW - 56, y + 34); }
    g.textAlign = "left";
  });

  // Badges.
  g.font = `400 36px ${DISPLAY}`; g.fillStyle = P.deep; g.fillText(`Badges  ${P.badgesEarned} / ${P.badges.length}`, 40, 786);
  const n = P.badges.length, bw = (PW - 80) / n;
  P.badges.forEach((b, i) => {
    const x = 40 + bw * i + bw / 2, y = 834;
    g.beginPath(); g.arc(x, y, 34, 0, TAU);
    g.fillStyle = b.earned ? "#ffffff" : "rgba(0,0,0,0.08)"; g.fill();
    g.lineWidth = 4; g.strokeStyle = b.earned ? "#f5c518" : "rgba(0,0,0,0.15)"; g.stroke();
    g.globalAlpha = b.earned ? 1 : 0.25;
    g.font = `34px ${ROUNDED}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(b.icon, x, y + 3);
    g.globalAlpha = 1;
  });
  // The three friends at a glance.
  g.textAlign = "center"; g.textBaseline = "alphabetic";
  g.font = `800 26px ${ROUNDED}`;
  g.fillStyle = P.allPassed ? "#2a8a3e" : "#8a5a08";
  g.fillText(P.allPassed ? "✓ Pip, Fern and Alby all passed!" : `Pass Pip, Fern and Alby at ${P.passMark}% — ${P.passedFriends} of 3 so far`, PW / 2, PH - 40);
}

function drawKey(g, x, y, s, done, color) {
  g.save();
  g.translate(x, y); g.scale(s, s);
  g.lineWidth = 7;
  g.strokeStyle = done ? "#a57a00" : "rgba(0,0,0,0.25)";
  g.fillStyle = done ? "#f5c518" : "rgba(255,255,255,0.4)";
  g.beginPath(); g.arc(-18, 0, 15, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); g.arc(-18, 0, 5, 0, TAU); g.fillStyle = done ? color : "rgba(0,0,0,0.12)"; g.fill();
  g.fillStyle = done ? "#f5c518" : "rgba(255,255,255,0.4)";
  rr(g, -4, -5, 40, 10, 3); g.fill(); g.stroke();
  rr(g, 22, 3, 7, 12, 2); g.fill(); g.stroke();
  rr(g, 32, 3, 6, 9, 2); g.fill(); g.stroke();
  g.restore();
}
function drawCup(g, x, y, s, done) {
  g.save();
  g.translate(x, y); g.scale(s, s);
  const gold = done ? "#f5c518" : "rgba(0,0,0,0.12)";
  const edge = done ? "#a57a00" : "rgba(0,0,0,0.2)";
  g.fillStyle = gold; g.strokeStyle = edge; g.lineWidth = 5;
  g.beginPath();
  g.moveTo(-46, -50); g.lineTo(46, -50); g.quadraticCurveTo(44, 18, 0, 26); g.quadraticCurveTo(-44, 18, -46, -50);
  g.closePath(); g.fill(); g.stroke();
  for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * 50, -22, 18, sx > 0 ? -Math.PI / 2 : Math.PI / 2, sx > 0 ? Math.PI / 2 : (3 * Math.PI) / 2, sx < 0); g.stroke(); }
  g.fillRect(-8, 24, 16, 22);
  rr(g, -36, 44, 72, 18, 4); g.fill(); g.stroke();
  if (done) {
    g.fillStyle = "#fff3a6";
    g.beginPath();
    for (let k = 0; k <= 10; k++) {
      const a = -Math.PI / 2 + (k / 10) * TAU, rad = k % 2 ? 8 : 18;
      const px = Math.cos(a) * rad, py = -20 + Math.sin(a) * rad;
      if (k === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.fill();
  }
  g.restore();
}
function paintPlayground(g, P) {
  headline(g, P, 238);
  g.font = `700 24px ${ROUNDED}`; g.fillStyle = "rgba(43,33,24,0.7)"; g.textAlign = "left";
  g.fillText("A key from each teacher's warm-up", 40, 278);
  const top = 300, colW = (PW - 80) / 2, rowH = 84;
  P.staff.forEach((s, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 40 + col * colW, y = top + row * rowH;
    rr(g, x + 4, y, colW - 8, rowH - 10, 14); g.fillStyle = s.done ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.45)"; g.fill();
    drawKey(g, x + 52, y + 37, 0.95, s.done, s.color);
    g.textAlign = "left"; g.textBaseline = "middle";
    fitText(g, s.name, colW - 120, `700 {s}px ${ROUNDED}`, 25);
    g.fillStyle = s.done ? "#2b2118" : "rgba(43,33,24,0.5)"; g.fillText(s.name, x + 104, y + 37);
  });
  // The Head Teacher's cup.
  const y = top + 4 * rowH + 20;
  rr(g, 40, y, PW - 80, 210, 20); g.fillStyle = P.boss && P.boss.done ? "rgba(255,243,166,0.65)" : "rgba(255,255,255,0.45)"; g.fill();
  drawCup(g, 150, y + 112, 1.25, P.boss && P.boss.done);
  g.textAlign = "left"; g.textBaseline = "alphabetic";
  g.font = `400 38px ${DISPLAY}`; g.fillStyle = P.deep; g.fillText("Head Teacher's Cup", 250, y + 82);
  g.font = `700 24px ${ROUNDED}`; g.fillStyle = "#2b2118";
  const line = P.boss && P.boss.done ? `Beaten! Well done, Champion.` : `${P.boss ? P.boss.name : "The Head Teacher"} — collect all ${P.totalKeys} keys first`;
  fitText(g, line, PW - 310, `700 {s}px ${ROUNDED}`, 24);
  g.fillText(line, 250, y + 124);
  if (P.visited === false) stamp(g, "Not visited yet", PW - 175, PH - 128, "rgba(90,90,90,0.55)", -0.06);
  footerBar(g, P, Math.round(((P.keys + (P.boss && P.boss.done ? 1 : 0)) / (P.totalKeys + 1)) * 100), "Keys + the cup");
}

function drawLeaf(g, x, y, s, col) {
  g.save(); g.translate(x, y); g.rotate(-0.6); g.scale(s, s);
  g.fillStyle = col;
  g.beginPath(); g.moveTo(0, -14); g.quadraticCurveTo(12, 0, 0, 14); g.quadraticCurveTo(-12, 0, 0, -14); g.fill();
  g.strokeStyle = "rgba(255,255,255,0.6)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -12); g.lineTo(0, 12); g.stroke();
  g.restore();
}
function paintJungle(g, P) {
  headline(g, P, 238);
  g.font = `700 24px ${ROUNDED}`; g.fillStyle = "rgba(43,33,24,0.72)"; g.textAlign = "left";
  g.fillText("Explorer's log — ten clearings, ten challenges coming soon:", 40, 280);
  P.spots.forEach((name, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 40 + col * ((PW - 80) / 2), y = 318 + row * 72;
    drawLeaf(g, x + 22, y + 22, 1.1, P.visited ? "#2fae5b" : "rgba(31,154,76,0.35)");
    g.font = `700 26px ${ROUNDED}`; g.fillStyle = "#2b2118"; g.textBaseline = "middle";
    g.fillText(name, x + 50, y + 22);
  });
  // A "coming soon" ribbon.
  g.save();
  g.translate(PW / 2, 760); g.rotate(-0.04);
  rr(g, -250, -44, 500, 88, 14); g.fillStyle = P.color; g.fill();
  g.font = `400 46px ${DISPLAY}`; g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("Challenges coming soon!", 0, 4);
  g.restore();
  g.textBaseline = "alphabetic";
  if (P.visited) stamp(g, "Explored ✓", PW - 150, 196, "rgba(31,120,60,0.85)", 0.1);
  g.font = `700 24px ${ROUNDED}`; g.fillStyle = P.deep; g.textAlign = "center";
  g.fillText(P.visited ? "You've found the mossy arch — keep exploring!" : "Find the mossy arch by the Emerald Lagoon", PW / 2, PH - 50);
}

/** Paint one board into `cv` (a canvas PW × PH). */
export function paintBoard(cv, P) {
  const g = cv.getContext("2d");
  g.clearRect(0, 0, PW, PH);
  paper(g, PW, PH, P.light);
  header(g, P);
  if (P.kind === "island") paintIsland(g, P);
  else if (P.kind === "playground") paintPlayground(g, P);
  else if (P.kind === "jungle") paintJungle(g, P);
  else paintTrophies(g, P);
  // A thin inner frame line.
  g.lineWidth = 6; g.strokeStyle = "rgba(0,0,0,0.12)";
  g.strokeRect(3, 3, PW - 6, PH - 6);
}

/** The header sign: "Sam's Achievements" + the trophy tally. */
export function paintHeader(cv, summary) {
  const g = cv.getContext("2d");
  const w = cv.width, h = cv.height;
  g.clearRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, "#2a5f9e"); gr.addColorStop(1, "#173d6a");
  g.fillStyle = gr; rr(g, 0, 0, w, h, 26); g.fill();
  g.lineWidth = 10; g.strokeStyle = "#ffcf4a"; rr(g, 8, 8, w - 16, h - 16, 20); g.stroke();
  const name = (summary.name || "").trim();
  const title = name ? `${name}'s Achievements` : "Achievements";
  g.textAlign = "center"; g.textBaseline = "middle";
  fitText(g, title, w * 0.62, `400 {s}px ${DISPLAY}`, 96);
  g.lineWidth = 10; g.strokeStyle = "rgba(0,0,0,0.3)"; g.lineJoin = "round"; g.strokeText(title, w / 2, h / 2 + 4);
  g.fillStyle = "#fffaf0"; g.fillText(title, w / 2, h / 2 + 2);
  // Tallies either side.
  const t = summary.totals;
  const side = (x, big, small, medal) => {
    if (medal) drawMedal(g, x - 74, h / 2 - 8, 26, medal);
    g.font = `400 58px ${DISPLAY}`; g.fillStyle = "#ffcf4a"; g.textAlign = "center";
    g.fillText(String(big), x, h / 2 - 12);
    g.font = `800 22px ${ROUNDED}`; g.fillStyle = "#e3eefb";
    g.fillText(small, x, h / 2 + 34);
  };
  side(w * 0.1, t.trophies, t.trophies === 1 ? "trophy" : "trophies", "gold");
  side(w * 0.9, t.level, "level", null);
}

/** A CanvasTexture over a fresh canvas (sRGB, mipmapped, anisotropic). */
export function makeCanvasTexture(w, h) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { cv, tex: t };
}
