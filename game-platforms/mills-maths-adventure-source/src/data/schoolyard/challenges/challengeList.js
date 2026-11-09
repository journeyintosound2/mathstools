/**
 * The 16 Retrieval Practice Playground challenges — one per Stage 4 outcome.
 *
 * STRAND GROUPING on the map (Jeff, 2026-11-10):
 *   Number & Algebra (7)      East: Quad, Canteen, Office, Courts, Plaza
 *   Measurement & Space (6)   West: Maths Block, Food Tech, Glass Stairs, Science
 *   Statistics & Probability (3)  North-west: Top Balcony, A-Block Courtyard, Mural Lane
 *
 * Each entry carries the stable `id` (also the key id and the save slot), the
 * NESA outcome, the question-bank id (banks that aren't ported yet carry
 * `bankId:null` so the UI can still greet the NPC and show "coming soon"), and
 * the NPC that owns it. `host` is the 3D model id (reuse a staff glb).
 */
export const PLAYGROUND_CHALLENGES = [
  // ===== Number & Algebra =====
  { id: "integers",      outcome: "MA4-INT-C-01", title: "Integer Operations",      strand: "number-algebra",       npcId: "pearce",  host: "pearce",  bankId: null,              color: "#e07a5f" },
  { id: "fdp",           outcome: "MA4-FRC-C-01", title: "Fractions, Decimals, %",  strand: "number-algebra",       npcId: "brookes", host: "brookes", bankId: null,              color: "#8ac926" },
  { id: "algebra",       outcome: "MA4-ALG-C-01", title: "Algebraic Techniques",    strand: "number-algebra",       npcId: "noor",    host: "dawson",  bankId: null,              color: "#9b5de5" },
  { id: "equations",     outcome: "MA4-EQU-C-01", title: "Solving Equations",       strand: "number-algebra",       npcId: "lin",     host: "mahoney", bankId: null,              color: "#3d9970" },
  { id: "ratios-rates",  outcome: "MA4-RAT-C-01", title: "Ratios and Rates",        strand: "number-algebra",       npcId: "morgan",  host: "morgan",  bankId: "ratios-rates",    color: "#e76f51" },
  { id: "indices",       outcome: "MA4-IND-C-01", title: "Powers and Roots",        strand: "number-algebra",       npcId: "sahni",   host: "pearce",  bankId: null,              color: "#5b8def" },
  { id: "linear",        outcome: "MA4-LIN-C-01", title: "Patterns and Lines",      strand: "number-algebra",       npcId: "okafor",  host: "brookes", bankId: null,              color: "#2a9d8f" },

  // ===== Measurement & Space =====
  { id: "length",        outcome: "MA4-LEN-C-01", title: "Length and Perimeter",    strand: "measurement-space",    npcId: "green",   host: "heywood", bankId: null,              color: "#2a9d8f" },
  { id: "angles",        outcome: "MA4-ANG-C-01", title: "Angle Reasoning",         strand: "measurement-space",    npcId: "heywood", host: "heywood", bankId: null,              color: "#f4772e" },
  { id: "pythagoras",    outcome: "MA4-PYT-C-01", title: "Pythagoras' Theorem",     strand: "measurement-space",    npcId: "dawson",  host: "dawson",  bankId: "pythagoras",      color: "#9b5de5" },
  { id: "area",          outcome: "MA4-ARE-C-01", title: "Area",                    strand: "measurement-space",    npcId: "patel",   host: "mahoney", bankId: null,              color: "#457b9d" },
  { id: "volume",        outcome: "MA4-VOL-C-01", title: "Volume and Capacity",     strand: "measurement-space",    npcId: "vo",      host: "pearce",  bankId: null,              color: "#8ac926" },
  { id: "geometry",      outcome: "MA4-GEO-C-01", title: "Properties of Geometrical Figures", strand: "measurement-space", npcId: "ewings", host: "ewings", bankId: null,         color: "#5b8def" },

  // ===== Statistics & Probability =====
  { id: "data-vis",      outcome: "MA4-DAT-C-01", title: "Reading & Making Charts", strand: "statistics-probability", npcId: "mahoney", host: "mahoney", bankId: null,           color: "#3d9970" },
  { id: "data-analysis", outcome: "MA4-DAT-C-02", title: "Summarising Data",        strand: "statistics-probability", npcId: "ndlovu",  host: "brookes", bankId: null,           color: "#8ac926" },
  { id: "probability",   outcome: "MA4-PRO-C-01", title: "Chance",                  strand: "statistics-probability", npcId: "bacon",   host: "bacon",   bankId: null,           color: "#457b9d" },
];

/** Round sizes: 20 for a normal challenge, 60 for the boss exam. */
export const ROUND_SIZE = 20;

/** The boss's 60-question exam: 4 from each outcome except 2 each from the two
 *  Data outcomes (14*4 + 2*2 = 60). */
export const BOSS_EXAM = {
  id: "kellahan-exam", outcome: "ALL", title: "Head Teacher's Exam", npcId: "kellahan", host: "kellahan", color: "#f4772e",
  mix: PLAYGROUND_CHALLENGES.map((c) => ({ bankId: c.bankId, count: (c.id === "data-vis" || c.id === "data-analysis") ? 2 : 4, challengeId: c.id })),
  roundSize: 60,
};

export const PLAYGROUND_IDS = PLAYGROUND_CHALLENGES.map((c) => c.id);
export const PLAYGROUND_BY_ID = Object.fromEntries(PLAYGROUND_CHALLENGES.map((c) => [c.id, c]));
export const PLAYGROUND_BY_NPC = Object.fromEntries(PLAYGROUND_CHALLENGES.map((c) => [c.npcId, c]));

/** The 8 strand colours used on the trophy grid and the map. */
export const STRAND_TINTS = {
  "number-algebra": "#2a5bb6",
  "measurement-space": "#9f6b2a",
  "statistics-probability": "#3d7a5b",
};
