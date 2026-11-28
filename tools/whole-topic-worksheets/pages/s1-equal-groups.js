/* Equal Groups — MA1-FG-01. BUILT by stage12.py: types from the Revision Generator Stage 1 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.4;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 64); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Equal Groups", outcome: 'MA1-FG-01', langKey: 'mmt-s1-equal-groups-ws-lang', bank: false, noLanguage: true,
  defaultCount: 8, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:17px;line-height:1.42;font-weight:700}.opts{font-size:16px;gap:2.6mm 5mm}.opt .L{width:6.4mm;height:6.4mm;font-size:12px}.tfRow{font-size:16px}.subs{font-size:16px}.dtab{font-size:14px}.ansLine{font-size:14.5px;min-height:10mm}.ansLine .unit{font-size:17px}.keyAns{font-size:17px}.item .ix,.item .ieq{font-size:19px}.qNum{width:30px;height:25px;font-size:13px}.secTitle{font-size:13.5px}.hdrTitle{font-size:17px}.lineLabel{font-size:11.5px}.ablank{height:9mm;min-width:30mm}.ablank.sm{min-width:22mm}.ablank.md{min-width:32mm}.lineBox{height:26px}",
  paperTypes: [
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'basic', 'skip-count-pictures', "Skip count the pictures", 'skip-counting')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'basic', 'pairs', "How many pairs?", 'skip-patterns')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'basic', 'skip-count', "Skip count by 2s, 5s and 10s", 'skip-patterns')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'basic', 'equal-or-not', "Are the groups equal?", 'equal-groups')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'basic', 'groups-of', "How many groups? How many in each?", 'equal-groups')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'basic', 'groups-total', "Equal groups: how many altogether?", 'equal-groups')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'basic', 'rows', "Rows: how many altogether?", 'equal-groups')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'basic', 'make-groups', "Make groups of", 'equal-groups')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'basic', 'share', "Share equally", 'division')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'basic', 'half-collection', "Half of a group of objects", 'division')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'expected', 'skip-count-pictures', "Skip count the pictures", 'skip-counting')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'expected', 'pairs', "How many pairs?", 'skip-patterns')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'expected', 'skip-count', "Skip count by 2s, 5s and 10s", 'skip-patterns')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'expected', 'equal-or-not', "Are the groups equal?", 'equal-groups')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'expected', 'groups-of', "How many groups? How many in each?", 'equal-groups')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'expected', 'groups-total', "Equal groups: how many altogether?", 'equal-groups')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'expected', 'rows', "Rows: how many altogether?", 'equal-groups')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'expected', 'make-groups', "Make groups of", 'equal-groups')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'expected', 'share', "Share equally", 'division')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_A, 'expected', 'half-collection', "Half of a group of objects", 'division')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_B, 'expected', 'array-count', "Count an array by rows", 'combining-groups')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_B, 'expected', 'array-both-ways', "Rows and columns (turn the array)", 'combining-groups')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_B, 'expected', 'repeated-addition', "Repeated addition", 'combining-groups')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_B, 'expected', 'jumps-on-line', "Equal jumps on a number line", 'combining-groups')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_B, 'expected', 'groups-of-3', "Groups of 3", 'combining-groups')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_B, 'expected', 'doubles-halves', "Doubles and halves to 20", 'doubling-halving')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_B, 'expected', 'group-story', "Equal groups stories", 'mult-div-problems')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_B, 'expected', 'share-story', "Sharing stories", 'mult-div-problems')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_B, 'expected', 'grouping-story', "How many groups can you make?", 'mult-div-problems')),
  Y(RG.type(G_STAGE_1_FORMING_GROUPS_B, 'expected', 'left-over', "Sharing with some left over", 'mult-div-problems'))
  ]
});
