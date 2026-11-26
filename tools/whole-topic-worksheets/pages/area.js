/* Area — MA4-ARE-C-01. Quiz types from the whole-topic quiz bank
   (banks/area.js) under the four content statements, plus two written for
   paper: draw shapes with a given area on a grid (the formula as something
   built, not just used), and explain the trapezium formula from two copies. */
(() => {
  const C = WSF.C;
  const { ri, pick, fmt } = C;
  const UNITS = ['cm', 'm', 'mm'];
  const A = (config, scale = 1.05, maxH = 320) => ({ engine: 'area-engine', config, scale, maxH });

  function drawToArea() {
    const N = pick([12, 18, 20, 24]);
    const rect = (() => { const f = []; for (let a = 2; a * a <= N; a++) if (N % a === 0) f.push(`${a} × ${N / a}`); return f; })();
    const tri = (() => { const f = []; for (let a = 2; a <= 12; a++) if ((2 * N) % a === 0 && 2 * N / a <= 12) f.push(`base ${a}, height ${2 * N / a}`); return f; })();
    const par = (() => { const f = []; for (let a = 2; a <= 12; a++) if (N % a === 0 && N / a <= 8) f.push(`base ${a}, height ${N / a}`); return f; })();
    return {
      prompt: `On the grid, draw a <b>rectangle</b>, a <b>triangle</b> and a <b>parallelogram</b> that each have an area of ${N} square units. Label each one's base and height.`,
      mode: 'none', drawSpace: 58, grid5: true, noAnswerBox: true, wide: true,
      answerHTML: `Answers vary. For example: rectangle ${rect[0]}; triangle ${tri[0]}; parallelogram ${par[par.length > 1 ? 1 : 0]}.`,
      why: `Rectangle and parallelogram: base × height = ${N}. Triangle: ½ × base × height = ${N}, so base × height = ${2 * N}.`
    };
  }
  function trapeziumWhy() {
    const u = pick(UNITS), b = ri(8, 18), a = ri(3, b - 2), h = ri(4, 10);
    return {
      prompt: `Two copies of this trapezium, one turned upside down, fit together to make a parallelogram. Write the parallelogram's base and height, then use them to explain why the area of the trapezium is ½ × (a + b) × h. Find its area.`,
      diagram: A({ diagramType: 'trapezium', topLabel: `${a} ${u}`, bottomLabel: `${b} ${u}`, heightLabel: `${h} ${u}` }),
      mode: 'num', value: (a + b) * h / 2, unit: `${u}²`, drawSpace: 14,
      why: `The parallelogram has base ${a} + ${b} = ${a + b} ${u} and height ${h} ${u}, so its area is ${a + b} × ${h} = ${(a + b) * h} ${u}². One trapezium is half of it: ${fmt((a + b) * h / 2)} ${u}².`
    };
  }

  WSF.page({
    topic: 'Area', outcome: 'MA4-ARE-C-01', langKey: 'mmt-are-ws-lang', bank: true,
    translateTopic: 'Area', defaultCount: 12, statements: STATEMENTS,
    stmtOf: {
      'b-rectangle': 'rectangles-triangles-parallelograms', 'b-triangle': 'rectangles-triangles-parallelograms',
      'b-parallelogram': 'rectangles-triangles-parallelograms', 'b-circle-pi': 'circles-sectors', 'b-units': 'units',
      'b-missing': 'rectangles-triangles-parallelograms',
      'e-trapezium': 'trapeziums-rhombuses-kites', 'e-rhombus-kite': 'trapeziums-rhombuses-kites', 'e-circle-dp': 'circles-sectors',
      'e-sector': 'circles-sectors', 'e-semi-quad': 'circles-sectors', 'e-composite': 'rectangles-triangles-parallelograms',
      'e-convert': 'units', 'e-missing': 'rectangles-triangles-parallelograms'
    },
    order: ['b-rectangle', 'b-triangle', 'b-parallelogram', 'p-draw-area', 'b-missing', 'b-circle-pi', 'b-units',
      'e-trapezium', 'p-trap-why', 'e-rhombus-kite', 'e-circle-dp', 'e-sector', 'e-semi-quad', 'e-composite', 'e-missing', 'e-convert'],
    paperTypes: [
      { id: 'p-draw-area', level: 'basic', stmt: 'rectangles-triangles-parallelograms', label: 'Draw shapes with a given area', gen: drawToArea },
      { id: 'p-trap-why', level: 'expected', stmt: 'trapeziums-rhombuses-kites', label: 'Explain the trapezium formula', gen: trapeziumWhy }
    ]
  });
})();
