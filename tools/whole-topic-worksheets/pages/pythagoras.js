/* Right-Angled Triangles (Pythagoras' Theorem) — MA4-PYT-C-01. Quiz types
   from the whole-topic quiz bank (banks/pythagoras.js) under the two content
   statements, plus problems with no diagram, where drawing the right-angled
   triangle is part of the question. */
(() => {
  const C = WSF.C;
  const { ri, pick, fmt } = C;
  const TRIPLES = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [20, 21, 29]];

  function drawThenSolve(level) {
    const k = pick(['ladder', 'diag', 'kite', 'walk']);
    if (level === 'basic') {
      const [a, b, c] = pick(TRIPLES.slice(0, 5));
      if (k === 'ladder' || k === 'kite') return { prompt: `A ladder leans against a wall. Its foot is ${a} m from the wall and it reaches ${b} m up the wall. Draw a diagram, then find the length of the ladder.`, mode: 'num', value: c, unit: 'm', drawSpace: 26, why: `The ladder is the hypotenuse: c² = ${a}² + ${b}² = ${a * a + b * b}, so c = √${a * a + b * b} = ${c} m.` };
      if (k === 'diag') return { prompt: `A rectangular screen is ${a * 10} cm wide and ${b * 10} cm tall. Draw a diagram, then find the length of its diagonal.`, mode: 'num', value: c * 10, unit: 'cm', drawSpace: 26, why: `c² = ${a * 10}² + ${b * 10}² = ${(a * a + b * b) * 100}, so c = ${c * 10} cm.` };
      return { prompt: `Jo walks ${a} km east, then ${b} km north. Draw a diagram, then find how far Jo is from the start, in a straight line.`, mode: 'num', value: c, unit: 'km', drawSpace: 26, why: `East and north meet at a right angle: c² = ${a}² + ${b}² = ${a * a + b * b}, c = ${c} km.` };
    }
    if (k === 'ladder') { const L = ri(5, 9), f = ri(1, L - 2); const h = Math.sqrt(L * L - f * f); return { prompt: `A ${L} m ladder leans against a wall with its foot ${f} m from the wall. Draw a diagram, then find how high up the wall it reaches, to 1 decimal place.`, mode: 'num', value: Math.round(h * 10) / 10, dp: 1, unit: 'm', drawSpace: 26, why: `The ladder is the hypotenuse: h² = ${L}² − ${f}² = ${L * L - f * f}, h = √${L * L - f * f} ≈ ${fmt(Math.round(h * 10) / 10, 1, true)} m.` }; }
    if (k === 'kite') { const s = ri(20, 60), h = ri(15, 50); const c = Math.sqrt(s * s + h * h); return { prompt: `A kite string is pegged to the ground. The kite is ${h} m above the ground, directly above a point ${s} m from the peg. Draw a diagram, then find the length of the string, to 1 decimal place.`, mode: 'num', value: Math.round(c * 10) / 10, dp: 1, unit: 'm', drawSpace: 26, why: `c² = ${s}² + ${h}² = ${s * s + h * h}, c ≈ ${fmt(Math.round(c * 10) / 10, 1, true)} m.` }; }
    if (k === 'diag') { const w = ri(30, 90), d = w + ri(10, 40); const t = Math.sqrt(d * d - w * w); return { prompt: `A TV screen is ${w} cm wide and its diagonal is ${d} cm. Draw a diagram, then find the height of the screen, to 1 decimal place.`, mode: 'num', value: Math.round(t * 10) / 10, dp: 1, unit: 'cm', drawSpace: 26, why: `The diagonal is the hypotenuse: h² = ${d}² − ${w}² = ${d * d - w * w}, h ≈ ${fmt(Math.round(t * 10) / 10, 1, true)} cm.` }; }
    const e = ri(2, 9), n = ri(2, 9); const c = Math.sqrt(e * e + n * n); return { prompt: `A boat sails ${e} km east and then ${n} km south. Draw a diagram, then find its distance from the start, to 1 decimal place.`, mode: 'num', value: Math.round(c * 10) / 10, dp: 1, unit: 'km', drawSpace: 26, why: `c² = ${e}² + ${n}² = ${e * e + n * n}, c ≈ ${fmt(Math.round(c * 10) / 10, 1, true)} km.` };
  }

  WSF.page({
    topic: "Pythagoras' Theorem", outcome: 'MA4-PYT-C-01', langKey: 'mmt-pyt-ws-lang', bank: true,
    translateTopic: 'Pythagoras', defaultCount: 12, statements: STATEMENTS,
    stmtOf: {
      'b-hypotenuse': 'define', 'b-statement': 'define', 'b-squares': 'define', 'b-hyp-whole': 'problems', 'b-is-right': 'define',
      'e-hyp-dp': 'problems', 'e-shorter': 'problems', 'e-triad': 'define', 'e-units': 'problems', 'e-isosceles': 'problems', 'e-problems': 'problems'
    },
    order: ['b-hypotenuse', 'b-statement', 'b-squares', 'b-is-right', 'b-hyp-whole', 'p-draw-b',
      'e-triad', 'e-hyp-dp', 'e-shorter', 'e-units', 'e-isosceles', 'e-problems', 'p-draw-e'],
    paperTypes: [
      { id: 'p-draw-b', level: 'basic', stmt: 'problems', label: 'Draw a diagram, then find the hypotenuse', gen: () => drawThenSolve('basic') },
      { id: 'p-draw-e', level: 'expected', stmt: 'problems', label: 'Draw a diagram, then solve (1 decimal place)', gen: () => drawThenSolve('expected') }
    ]
  });
})();
