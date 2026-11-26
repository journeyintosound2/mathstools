/* Geometric Measure: Length — MA3-GM-02. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Geometric Measure: Length", outcome: 'MA3-GM-02', langKey: 'mmt-s3-length-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  paperTypes: [
  T(G_GM, 'basic', 'metre-kilometre', "Metres and kilometres", 'metres-km'),
  T(G_GM, 'basic', 'choose-length-unit', "Choose the appropriate unit", 'metres-km'),
  T(G_GM, 'basic', 'perimeter-rectangle', "Perimeter of a rectangle", 'perimeters'),
  T(G_GM, 'basic', 'perimeter-polygon', "Perimeter of a polygon", 'perimeters'),
  T(G_GM, 'basic', 'perimeter-missing-side', "Find a side from the perimeter", 'perimeters'),
  T(G_GM, 'expected', 'metre-kilometre', "Metres and kilometres", 'metres-km'),
  T(G_GM, 'expected', 'choose-length-unit', "Choose the appropriate unit", 'metres-km'),
  T(G_GM, 'expected', 'perimeter-rectangle', "Perimeter of a rectangle", 'perimeters'),
  T(G_GM, 'expected', 'perimeter-polygon', "Perimeter of a polygon", 'perimeters'),
  T(G_GM, 'expected', 'perimeter-missing-side', "Find a side from the perimeter", 'perimeters'),
  T(G_GM, 'expected', 'decimal-length', "Lengths as decimals", 'decimal-metric'),
  T(G_GM, 'expected', 'convert-length', "Convert between length units", 'convert-length'),
  T(G_GM, 'expected', 'multi-part-perimeter', "Multi-part measurement problem", 'compare-lengths'),
  { id: 'e-p-order-lengths', level: 'expected', stmt: 'compare-lengths', label: "Compare and order lengths in different units", gen: () => {
    const C = WSF.C;
    for (let t = 0; t < 200; t++) {
      const base = C.ri(12, 480) * 10;            // millimetres
      const vals = [base, base + C.pick([-1, 1]) * C.ri(1, 30) * 10, base + C.pick([-1, 1]) * C.ri(40, 300), base + C.pick([-1, 1]) * C.ri(5, 90) * 10];
      if (new Set(vals).size < 4 || vals.some(v => v <= 0)) continue;
      const show = v => C.pick([0, 1, 2]) === 0 ? `${C.fmt(v / 1000, 3)} m` : C.pick([0, 1]) ? `${C.fmt(v / 10, 1)} cm` : `${v} mm`;
      const items = vals.map(v => ({ v, s: show(v) }));
      if (new Set(items.map(i => i.s.split(' ')[1])).size < 2) continue;
      const asc = items.slice().sort((a, b) => a.v - b.v);
      return { prompt: `Write these lengths in order from shortest to longest.<span class="big">${items.map(i => i.s).join(' , ')}</span>`, mode: 'none',
        answerHTML: asc.map(i => i.s).join(' , '), why: 'In millimetres: ' + asc.map(i => `${i.s} = ${i.v} mm`).join(', ') + '.' };
    }
  } }
  ]
});
