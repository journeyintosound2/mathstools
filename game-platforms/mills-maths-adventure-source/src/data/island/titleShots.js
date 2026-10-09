/**
 * The title screen's cinematic flyover round Number Island (game/TitleCamera
 * flies a closed Catmull-Rom spline through these): out at sea off the jetty
 * → the lagoon falls → over Haybale Meadows → Frosty Peak → Schoolhouse Hill
 * → Ember Peak → the lighthouse → Sunny Cove → back. Each shot = [camera
 * x, y, z], [look-at x, y, z]. The island checks fly it (IL9).
 */
export const TITLE_SHOTS = [
  [[14, 9, 142], [0, 5, 72]],
  [[-38, 13, 128], [-28, 5, 74]],
  [[-84, 18, 98], [-50, 6, 58]],
  [[-124, 28, 34], [-74, 5, 4]],
  [[-112, 40, -70], [-62, 16, -62]],
  [[-48, 42, -128], [-30, 12, -60]],
  [[24, 36, -124], [0, 8, -48]],
  [[96, 44, -104], [66, 22, -60]],
  [[146, 26, -40], [100, 8, -6]],
  [[150, 16, 40], [112, 9, 4]],
  [[104, 13, 108], [50, 4, 66]],
  [[56, 10, 142], [12, 5, 80]],
];
/** Seconds for one loop round the island. */
export const TITLE_PERIOD = 150;
/** The flyover never dips closer than this to the ground. */
export const TITLE_MIN_CLEARANCE = 7;
