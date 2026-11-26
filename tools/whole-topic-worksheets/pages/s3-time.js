/* Non-Spatial Measure: Time — MA3-NSM-02. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Non-Spatial Measure: Time", outcome: 'MA3-NSM-02', langKey: 'mmt-s3-time-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  paperTypes: [
  T(G_MT, 'basic', 'read-clock', "Read an analogue clock", '12-24-hour'),
  T(G_MT, 'basic', 'draw-hands', "Draw the hands on a clock", '12-24-hour'),
  T(G_MT, 'basic', 'to-24-hour', "Convert 12-hour time to 24-hour time", '12-24-hour'),
  T(G_MT, 'basic', 'to-12-hour', "Convert 24-hour time to 12-hour time", '12-24-hour'),
  T(G_MT, 'basic', 'clock-to-24', "From a clock face to 24-hour time", '12-24-hour'),
  T(G_MT, 'basic', 'time-units', "Convert units of time", '12-24-hour'),
  T(G_MT, 'expected', 'read-clock', "Read an analogue clock", '12-24-hour'),
  T(G_MT, 'expected', 'draw-hands', "Draw the hands on a clock", '12-24-hour'),
  T(G_MT, 'expected', 'to-24-hour', "Convert 12-hour time to 24-hour time", '12-24-hour'),
  T(G_MT, 'expected', 'to-12-hour', "Convert 24-hour time to 12-hour time", '12-24-hour'),
  T(G_MT, 'expected', 'clock-to-24', "From a clock face to 24-hour time", '12-24-hour'),
  T(G_MT, 'expected', 'time-units', "Convert units of time", '12-24-hour'),
  T(G_MT, 'expected', 'duration', "Find a duration (time line)", 'duration'),
  T(G_MT, 'expected', 'finish-time', "Find a finishing time", 'duration'),
  T(G_MT, 'expected', 'start-time', "Find a starting time", 'duration'),
  T(G_MT, 'expected', 'timetable', "Read a timetable", 'duration'),
  T(G_MT, 'expected', 'multi-part-time', "Multi-part time problem", 'duration')
  ]
});
