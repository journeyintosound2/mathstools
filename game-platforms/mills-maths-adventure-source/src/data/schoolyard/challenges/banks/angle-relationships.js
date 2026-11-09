/**
 * Playground question bank — Angle Relationships (MA4-ANG-C-01).
 * "Applies angle relationships to solve problems, including those related to
 * transversals on sets of parallel lines."
 *
 * Written for the game in the shared-bank format, covering the content of the
 * site's Angle Relationships quiz: classifying and measuring angles (the
 * protractor), complementary and supplementary angles, angles on a straight
 * line, at a point and vertically opposite, corresponding / alternate /
 * co-interior angles on parallel lines, testing for parallel lines, and
 * forming equations from angle relationships.
 *
 * Diagrams are the Revision Generator's angle-engine. Note its "right"
 * diagram labels the arc from 0° to `knownAngle` with the pronumeral and the
 * remaining arc with (90 − knownAngle)°, so the answer there IS knownAngle.
 */
import C from "../questionCore.js";
import { defineBank } from "./_adapt.js";
import "../exprCheck.js";

const { ri, pick, shuffle } = C;
const T = [];
const add = (level, id, label, gen, check) => T.push({ level, id, label, gen, check });
const ANG = (config, scale = 1.0) => ({ engine: "angle-engine", config, scale, maxH: 300 });
const friendly = (min, max, step = 5) => ri(Math.ceil(min / step), Math.floor(max / step)) * step;
const PRO = ["x", "x", "a", "b", "y", "m", "p"];
const deg = (v) => `${v}°`;
const angNum = (p, v, extra = {}) => ({ mode: "num", value: v, unit: "°", placeholder: `${p} = …`, answerHTML: `<i>${p}</i> = ${v}°`, ...extra });
const FIND = (p) => pick([`Find the value of <i>${p}</i>.`, `Find <i>${p}</i>.`, `What is the value of <i>${p}</i>?`]);

function parts(known, missing, label) {
  return shuffle([...known.map((v) => ({ value: v, label: deg(v) })), { value: missing, label, isMissing: true }]);
}

/* corresponding / alternate / co-interior on the angle-engine's parallel diagram */
function sectorSize(theta, sector) {
  const lower = theta + 180;
  const S = { upperRight: [0, theta], upperLeft: [theta, 180], lowerLeft: [180, lower], lowerRight: [lower, 360] };
  const [a, b] = S[sector];
  return Math.round(b - a);
}
function parallel(rel) {
  const acute = friendly(30, 75);
  const direction = pick(["rising", "falling"]);
  const theta = direction === "falling" ? 180 - acute : acute;
  const PAIRS = {
    corresponding: [["upperRight", "upperRight"], ["upperLeft", "upperLeft"], ["lowerLeft", "lowerLeft"], ["lowerRight", "lowerRight"]],
    alternate: [["lowerLeft", "upperRight"], ["lowerRight", "upperLeft"]],
    "co-interior": [["lowerLeft", "upperLeft"], ["lowerRight", "upperRight"]],
  };
  const [topS, botS] = pick(PAIRS[rel]);
  const knownTop = Math.random() < 0.5;
  const knownSector = knownTop ? topS : botS, missingSector = knownTop ? botS : topS;
  return {
    known: sectorSize(theta, knownSector), answer: sectorSize(theta, missingSector),
    cfg: { diagramType: "parallel", relationship: rel, transversalAngle: acute, transversalDirection: direction, knownIntersection: knownTop ? "top" : "bottom", missingIntersection: knownTop ? "bottom" : "top", knownSector, missingSector },
  };
}
const REASON = {
  corresponding: "Corresponding angles on parallel lines are equal",
  alternate: "Alternate angles on parallel lines are equal",
  "co-interior": "Co-interior angles on parallel lines add to 180°",
};

/* ================================ BASIC ================================ */
add("basic", "b-classify", "Classify angles", () => {
  const kinds = [["Acute", () => ri(5, 89)], ["Right", () => 90], ["Obtuse", () => ri(91, 179)], ["Straight", () => 180], ["Reflex", () => ri(181, 359)], ["Revolution", () => 360]];
  const [name, f] = pick(kinds.filter((k, i) => i !== 1 || Math.random() < 0.4));
  const v = f();
  const opts = ["Acute", "Right", "Obtuse", "Straight", "Reflex", "Revolution"];
  return {
    prompt: `What type of angle measures <b>${v}°</b>?`, mode: "mc", options: opts, correct: opts.indexOf(name), keepOrder: true,
    why: `Acute < 90° · right = 90° · obtuse between 90° and 180° · straight = 180° · reflex between 180° and 360° · revolution = 360°. So ${v}° is ${name.toLowerCase()}.`,
  };
});

add("basic", "b-protractor", "Read a protractor", () => {
  const angle = friendly(15, 165);
  const startSide = pick(["right", "left"]);
  return {
    prompt: `Read the size of the marked angle.`,
    diagram: ANG({ diagramType: "protractor", angle, startSide }, 1.05),
    mode: "num", value: angle, unit: "°",
    why: `The angle starts on the ${startSide}-hand 0° line, so read the scale that starts at 0 on the ${startSide}: ${angle}°.${angle !== 90 ? ` (Not ${180 - angle}° — that is the other scale.)` : ""}`,
    key: `${angle}${startSide}`,
  };
});

add("basic", "b-comp-supp", "Complementary, supplementary and reflex", () => {
  const k = ri(0, 2);
  if (k === 0) { const v = ri(8, 82); return { prompt: `What is the <b>complement</b> of ${v}°?`, mode: "num", value: 90 - v, unit: "°", why: `Complementary angles add to 90°: 90 − ${v} = ${90 - v}°.` }; }
  if (k === 1) { const v = ri(15, 165); return { prompt: `What is the <b>supplement</b> of ${v}°?`, mode: "num", value: 180 - v, unit: "°", why: `Supplementary angles add to 180°: 180 − ${v} = ${180 - v}°.` }; }
  const v = ri(20, 170); return { prompt: `An angle measures ${v}°. What is the size of the <b>reflex</b> angle that completes a revolution with it?`, mode: "num", value: 360 - v, unit: "°", why: `Angles in a revolution add to 360°: 360 − ${v} = ${360 - v}°.` };
});

add("basic", "b-straight", "Angles on a straight line", () => {
  const p = pick(PRO);
  let known, missing;
  if (Math.random() < 0.55) { const a = friendly(35, 145); known = [a]; missing = 180 - a; }
  else { do { known = [friendly(25, 75), friendly(25, 75)]; missing = 180 - known[0] - known[1]; } while (missing < 25 || missing > 105); }
  return {
    prompt: FIND(p), diagram: ANG({ diagramType: "straight", angleParts: parts(known, missing, p) }),
    ...angNum(p, missing), why: `Angles on a straight line add to 180°: ${p} = 180 − ${known.join(" − ")} = ${missing}.`,
  };
});

add("basic", "b-right", "Angles in a right angle", () => {
  const p = pick(PRO), x = ri(20, 70);
  return {
    prompt: FIND(p), diagram: ANG({ diagramType: "right", knownAngle: x, missingLabel: p }),
    ...angNum(p, x), why: `The two angles make a right angle, so they add to 90°: ${p} = 90 − ${90 - x} = ${x}.`,
  };
});

add("basic", "b-point", "Angles at a point", () => {
  const p = pick(PRO);
  const cnt = pick([1, 2, 2, 3]);
  let known, missing;
  for (;;) {
    known = cnt === 1 ? [friendly(40, 160)] : cnt === 2 ? [friendly(50, 140), friendly(50, 140)] : [friendly(55, 120), friendly(45, 110), friendly(40, 95)];
    missing = 360 - known.reduce((a, b) => a + b, 0);
    if (missing >= 35 && missing <= (cnt === 1 ? 320 : cnt === 2 ? 250 : 150)) break;
  }
  return {
    prompt: FIND(p), diagram: ANG({ diagramType: "point", angleParts: parts(known, missing, p), startAngle: friendly(0, 60) }),
    ...angNum(p, missing), why: `Angles at a point add to 360°: ${p} = 360 − ${known.join(" − ")} = ${missing}.`,
  };
});

add("basic", "b-vertical", "Vertically opposite angles", () => {
  const p = pick(PRO), v = friendly(35, 145);
  return {
    prompt: FIND(p), diagram: ANG({ diagramType: "vertical", knownAngle: v, missingLabel: p, base: friendly(0, 20) }),
    ...angNum(p, v), why: `Vertically opposite angles are equal: ${p} = ${v}.`,
  };
});

/* =============================== EXPECTED ============================== */
for (const rel of ["corresponding", "alternate", "co-interior"]) {
  add("expected", `e-${rel}`, `Parallel lines — ${rel} angles`, () => {
    const p = pick(PRO), P = parallel(rel);
    return {
      prompt: `${FIND(p)} The two horizontal lines are parallel.`, diagram: ANG({ ...P.cfg, missingLabel: p }, 1.05),
      ...angNum(p, P.answer),
      why: rel === "co-interior" ? `${REASON[rel]}: ${p} = 180 − ${P.known} = ${P.answer}.` : `${REASON[rel]}: ${p} = ${P.answer}.`,
    };
  });
}

add("expected", "e-name-relationship", "Name the angle relationship", () => {
  const rel = pick(["corresponding", "alternate", "co-interior"]);
  const P = parallel(rel);
  const opts = ["Corresponding angles", "Alternate angles", "Co-interior angles", "Vertically opposite angles"];
  const name = { corresponding: 0, alternate: 1, "co-interior": 2 }[rel];
  return {
    prompt: `The two horizontal lines are parallel. Which angle relationship links <i>x</i> and the ${P.known}° angle?`,
    diagram: ANG({ ...P.cfg, missingLabel: "x" }, 1.05),
    mode: "mc", options: opts, correct: name, keepOrder: true,
    why: rel === "corresponding" ? "They are in the same position at each intersection (an F shape): corresponding angles." : rel === "alternate" ? "They are on opposite sides of the transversal, between the parallel lines (a Z shape): alternate angles." : "They are on the same side of the transversal, between the parallel lines (a C shape): co-interior angles.",
  };
});

add("expected", "e-algebraic", "Angle equations", () => {
  const k = ri(0, 3);
  if (k === 0) {
    // straight line: a·x + other = 180
    for (;;) {
      const a = pick([2, 3, 4, 5]), x = friendly(10, 40), other = 180 - a * x;
      if (other < 30 || other > 140) continue;
      return { prompt: `Form an equation and solve it to find <i>x</i>.`, diagram: ANG({ diagramType: "straight", angleParts: shuffle([{ value: a * x, label: `${a}x`, isMissing: true }, { value: other, label: deg(other) }]) }), mode: "num", value: x, placeholder: "x = …", answerHTML: `<i>x</i> = ${x}`, why: `Angles on a straight line: ${a}x + ${other} = 180, so ${a}x = ${180 - other} and x = ${x}.` };
    }
  }
  if (k === 1) {
    // vertically opposite: x + c = known  or  a·x = known
    const v = friendly(40, 140);
    if (Math.random() < 0.5) { const c = friendly(10, 30); const x = v - c; return { prompt: `Form an equation and solve it to find <i>x</i>.`, diagram: ANG({ diagramType: "vertical", knownAngle: v, missingLabel: `x + ${c}`, base: friendly(0, 20) }), mode: "num", value: x, placeholder: "x = …", answerHTML: `<i>x</i> = ${x}`, why: `Vertically opposite angles are equal: x + ${c} = ${v}, so x = ${x}.` }; }
    const a = pick([2, 4, 5].filter((m) => v % m === 0)) || 5; const vv = v % a ? v - (v % a) : v; const x = vv / a;
    return { prompt: `Form an equation and solve it to find <i>x</i>.`, diagram: ANG({ diagramType: "vertical", knownAngle: vv, missingLabel: `${a}x`, base: friendly(0, 20) }), mode: "num", value: x, placeholder: "x = …", answerHTML: `<i>x</i> = ${x}`, why: `Vertically opposite angles are equal: ${a}x = ${vv}, so x = ${x}.` };
  }
  if (k === 2) {
    // at a point: x, 2x, and a known angle
    for (;;) {
      const x = friendly(30, 80), kn = 360 - 3 * x;
      if (kn < 60 || kn > 200) continue;
      return { prompt: `Form an equation and solve it to find <i>x</i>.`, diagram: ANG({ diagramType: "point", angleParts: shuffle([{ value: x, label: "x", isMissing: true }, { value: 2 * x, label: "2x", isMissing: true }, { value: kn, label: deg(kn) }]), startAngle: friendly(0, 60) }), mode: "num", value: x, placeholder: "x = …", answerHTML: `<i>x</i> = ${x}`, why: `Angles at a point: x + 2x + ${kn} = 360, so 3x = ${360 - kn} and x = ${x}.` };
    }
  }
  // parallel: co-interior with an expression
  const P = parallel(pick(["co-interior", "corresponding", "alternate"]));
  const c = friendly(10, 25), x = P.answer - c;
  if (x < 5) return T.find((q) => q.id === "e-algebraic").gen();
  return { prompt: `The two horizontal lines are parallel. Find <i>x</i>.`, diagram: ANG({ ...P.cfg, missingLabel: `x + ${c}` }, 1.05), mode: "num", value: x, placeholder: "x = …", answerHTML: `<i>x</i> = ${x}`, why: `${REASON[P.cfg.relationship]}, so x + ${c} = ${P.answer}${P.cfg.relationship === "co-interior" ? ` (180 − ${P.known})` : ""}. Therefore x = ${x}.` };
});

add("expected", "e-parallel-test", "Are the lines parallel?", () => {
  const rel = pick(["corresponding", "alternate", "co-interior"]);
  const a = friendly(40, 140);
  const yes = Math.random() < 0.5;
  const b = rel === "co-interior" ? (yes ? 180 - a : 180 - a + pick([-6, -4, 4, 6])) : (yes ? a : a + pick([-5, -3, 3, 5]));
  const shape = { corresponding: "corresponding", alternate: "alternate", "co-interior": "co-interior" }[rel];
  return {
    prompt: `Two lines are cut by a transversal. A pair of <b>${shape}</b> angles measure ${a}° and ${b}°. True or false: the two lines are parallel.`,
    mode: "tf", truth: yes,
    why: rel === "co-interior" ? `Lines are parallel only if co-interior angles add to 180°. ${a} + ${b} = ${a + b}${yes ? " — so they are parallel." : " — not 180°, so they are not parallel."}` : `Lines are parallel only if ${shape} angles are equal. ${a}° ${yes ? "=" : "≠"} ${b}°, so they ${yes ? "are" : "are not"} parallel.`,
  };
});

add("expected", "e-protractor-reflex", "Protractor: reflex and differences", () => {
  const angle = friendly(25, 155), startSide = pick(["right", "left"]);
  if (Math.random() < 0.5) {
    return { prompt: `Use the protractor to find the size of the <b>reflex</b> angle between the two arms.`, diagram: ANG({ diagramType: "protractor", angle, startSide }, 1.05), mode: "num", value: 360 - angle, unit: "°", why: `The marked angle is ${angle}°. The reflex angle is the rest of the revolution: 360 − ${angle} = ${360 - angle}°.`, key: `r${angle}${startSide}` };
  }
  return { prompt: `What is the supplement of the angle shown on the protractor?`, diagram: ANG({ diagramType: "protractor", angle, startSide }, 1.05), mode: "num", value: 180 - angle, unit: "°", why: `The angle is ${angle}° (read the scale starting at 0 on the ${startSide}). Its supplement is 180 − ${angle} = ${180 - angle}°.`, key: `s${angle}${startSide}` };
});

add("expected", "e-mixed-reason", "Which reason?", () => {
  const items = [
    ["Two angles that together make a straight angle add to…", ["90°", "180°", "270°", "360°"], 1],
    ["Angles that are vertically opposite are…", ["equal", "supplementary", "complementary", "co-interior"], 0],
    ["On parallel lines, alternate angles are…", ["equal", "supplementary", "complementary", "reflex"], 0],
    ["On parallel lines, co-interior angles are…", ["supplementary", "equal", "complementary", "vertically opposite"], 0],
    ["Angles at a point add to…", ["90°", "180°", "270°", "360°"], 3],
    ["Two angles that add to 90° are called…", ["complementary", "supplementary", "reflex", "co-interior"], 0],
    ["An angle between 180° and 360° is called…", ["obtuse", "straight", "reflex", "a revolution"], 2],
  ];
  const [q, opts, c] = pick(items);
  const order = shuffle([0, 1, 2, 3]);
  return { prompt: `Complete the sentence.<span class="say">${q}</span>`, mode: "mc", options: order.map((i) => opts[i]), correct: order.indexOf(c), why: `${q.replace("…", "")} ${opts[c]}.`, key: q };
});

defineBank({
  id: "angle-relationships", title: "Angle Relationships", outcome: "MA4-ANG-C-01",
  levels: {
    basic: { sub: "Classify and measure angles; complementary, supplementary and reflex; straight lines, points, right angles and vertically opposite angles." },
    expected: { sub: "Corresponding, alternate and co-interior angles on parallel lines; testing for parallel lines; angle equations." },
  },
  types: T,
}, T);
export default T;
