/* Probability — MA4-PRO-C-01. Quiz types from the whole-topic quiz bank
   (banks/probability.js) under the two content statements, plus
   complementary events at Basic (where the quiz has none) and a written
   explanation of relative frequency at Expected. */
(() => {
  const C = WSF.C;
  const { ri, pick, frac } = C;

  function notEvent() {
    const colours = ['red', 'blue', 'green', 'yellow'];
    const a = pick(colours), b = pick(colours.filter(c => c !== a));
    const na = ri(2, 9), nb = ri(2, 9), t = na + nb;
    return {
      prompt: `A bag holds ${na} ${a} and ${nb} ${b} counters. One counter is taken without looking. Find <b>P(${a})</b> and <b>P(not ${a})</b>.`,
      mode: 'none', answerHTML: `P(${a}) = ${frac(na, t)}, &nbsp;P(not ${a}) = ${frac(nb, t)}`,
      why: `P(${a}) = ${na}/${t}. Not ${a} means ${b}: ${nb}/${t}. The two add to 1.`
    };
  }
  function experiment() {
    const n = pick([20, 40, 50]), heads = ri(Math.round(n * 0.3), Math.round(n * 0.7));
    return {
      prompt: `A coin is tossed ${n} times and lands heads ${heads} times. Find the relative frequency of heads. Explain why it is not exactly ${frac(1, 2)}, and what you would expect after many more tosses.`,
      mode: 'none', drawSpace: 14, answerHTML: frac(heads, n),
      why: `Relative frequency = ${heads}/${n}. Results vary from trial to trial; over many more tosses the relative frequency should get closer to the theoretical probability ½.`
    };
  }

  WSF.page({
    topic: 'Probability', outcome: 'MA4-PRO-C-01', langKey: 'mmt-pro-ws-lang', bank: true,
    translateTopic: 'Probability', defaultCount: 12, statements: STATEMENTS,
    stmtOf: {
      'b-sample-space': 'chance-experiments', 'b-chance-words': 'chance-experiments', 'b-scale': 'chance-experiments', 'b-die': 'chance-experiments',
      'b-spinner': 'chance-experiments', 'b-bag': 'chance-experiments', 'b-cards': 'chance-experiments',
      'e-fdp': 'chance-experiments', 'e-complement': 'complementary', 'e-complement-event': 'complementary', 'e-sum-to-one': 'complementary',
      'e-relative-frequency': 'chance-experiments', 'e-expected': 'chance-experiments', 'e-not-equal': 'chance-experiments', 'e-letters': 'chance-experiments'
    },
    order: ['b-chance-words', 'b-scale', 'b-sample-space', 'b-die', 'b-spinner', 'b-bag', 'b-cards', 'p-not-b',
      'e-fdp', 'e-letters', 'e-not-equal', 'e-relative-frequency', 'p-experiment', 'e-expected', 'e-complement', 'e-complement-event', 'e-sum-to-one'],
    paperTypes: [
      { id: 'p-not-b', level: 'basic', stmt: 'complementary', label: 'P(A) and P(not A)', gen: notEvent },
      { id: 'p-experiment', level: 'expected', stmt: 'chance-experiments', label: 'Explain a relative frequency', gen: experiment }
    ]
  });
})();
