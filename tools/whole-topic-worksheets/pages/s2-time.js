/* Time — MA2-NSM-02. BUILT by stage12.py: types from the Revision Generator Stage 2 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.22;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 60); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Time", outcome: 'MA2-NSM-02', langKey: 'mmt-s2-time-ws-lang', bank: false, noLanguage: true,
  defaultCount: 10, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:15px;line-height:1.4}.opts{font-size:14.2px;gap:2mm 4.5mm}.opt .L{width:5.6mm;height:5.6mm;font-size:11px}.tfRow{font-size:14.2px}.subs{font-size:14.2px}.dtab{font-size:12.6px}.ansLine{font-size:13px;min-height:8.5mm}.ansLine .unit{font-size:15.5px}.keyAns{font-size:15.5px}.item .ix,.item .ieq{font-size:17.5px}.qNum{width:28px;height:23px;font-size:12px}.ablank{height:7.4mm;min-width:26mm}.ablank.sm{min-width:18mm}",
  paperTypes: [
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'basic', 'read-clock-5', "Read a clock to five minutes", 'analog-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'basic', 'past-to', "Past and to the hour", 'analog-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'basic', 'draw-hands', "Draw the hands", 'analog-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'basic', 'time-facts', "Minutes, hours, days", 'analog-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'basic', 'time-later', "What time will it be?", 'analog-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_B, 'basic', 'read-clock-minute', "Read a clock to the minute", 'analog-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_B, 'basic', 'seconds', "Seconds, minutes and hours", 'analog-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'expected', 'read-clock-5', "Read a clock to five minutes", 'analog-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'expected', 'past-to', "Past and to the hour", 'analog-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'expected', 'draw-hands', "Draw the hands", 'analog-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'expected', 'time-facts', "Minutes, hours, days", 'analog-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'expected', 'time-later', "What time will it be?", 'analog-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_B, 'expected', 'read-clock-minute', "Read a clock to the minute", 'analog-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_B, 'expected', 'seconds', "Seconds, minutes and hours", 'analog-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'expected', 'analog-digital', "Analog to digital", 'digital-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_B, 'expected', 'duration-timeline', "How long? (time line)", 'digital-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_B, 'expected', 'finish-time', "What time does it finish?", 'digital-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_B, 'expected', 'timetable', "Read a timetable", 'digital-time')),
  Y(RG.type(G_STAGE_2_MASS_TIME_B, 'expected', 'am-pm', "am and pm", 'am-pm'))
  ]
});
