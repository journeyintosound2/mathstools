/**
 * EMERALD JUNGLE — the vines' units (pure). Metric only (Jeff, 2026-10-10).
 * A "num" vine is a measure with `dp` decimal places: its values are held
 * as whole numbers of the smallest step (1.5 h = 15 tenths), so the ladder
 * never meets float dust and a move that would need a finer step is refused.
 */
export const num = (unit, dp, one, many, icon = "") => ({ kind: "num", unit, dp, one, many, icon });
export const count = (icon, one, many) => ({ kind: "count", icon, one, many });

// Time
export const SEC = num("s", 0, "second", "seconds", "⏱");
export const MIN = num("min", 0, "minute", "minutes", "⏱");
export const HOUR1 = num("h", 1, "hour", "hours", "⏱");
export const HOUR2 = num("h", 2, "hour", "hours", "⏱");
// Length
export const MET = num("m", 0, "metre", "metres", "📏");
export const MET1 = num("m", 1, "metre", "metres", "📏");
export const MET2 = num("m", 2, "metre", "metres", "📏");
export const KM1 = num("km", 1, "kilometre", "kilometres", "📏");
export const KM2 = num("km", 2, "kilometre", "kilometres", "📏");
export const CM = num("cm", 0, "centimetre", "centimetres", "📏");
export const CM1 = num("cm", 1, "centimetre", "centimetres", "📏");
export const MM = num("mm", 0, "millimetre", "millimetres", "📏");
export const SQM = num("m²", 0, "square metre", "square metres", "⬛");
// Volume
export const LIT = num("L", 0, "litre", "litres", "💧");
export const LIT1 = num("L", 1, "litre", "litres", "💧");
export const LIT2 = num("L", 2, "litre", "litres", "💧");
export const ML = num("mL", 0, "millilitre", "millilitres", "💧");
export const CUPS = num("cups", 1, "cup", "cups", "🥣");
export const TBSP = num("tbsp", 1, "tablespoon", "tablespoons", "🥄");
export const TSP = num("tsp", 1, "teaspoon", "teaspoons", "🥄");
// Mass + money
export const KG2 = num("kg", 2, "kilogram", "kilograms", "⚖️");
export const GRAM = num("g", 0, "gram", "grams", "⚖️");
export const DOLLARS = { kind: "money", icon: "💲", one: "dollar", many: "dollars" };
export const CENTS = num("c", 0, "cent", "cents", "🪙");
// Things
export const PACES = count("👣", "pace", "paces");
export const BEATS = count("💓", "beat", "beats");
export const DRUMS = count("🥁", "drumbeat", "drumbeats");
export const LEAVES = count("🍃", "leaf", "leaves");
export const RAIN = num("mm", 0, "millimetre", "millimetres", "🌧");
export const PLANKS = count("🪵", "plank", "planks");
export const STEPS = count("🪜", "step", "steps");
export const CRACKERS = count("🍪", "cracker", "crackers");
export const PARROTS = count("🦜", "parrot", "parrots");
export const BLUE = count("🔵", "blue scoop", "blue scoops");
export const YELLOW = count("🟡", "yellow scoop", "yellow scoops");
export const RED = count("🔴", "red scoop", "red scoops");
export const TOTAL = count("🧪", "scoop in all", "scoops in all");

/** A vine's name chip ("⏱ seconds", "🍌 bananas"). */
export const vineName = (v) => `${v.icon ? `${v.icon} ` : ""}${v.kind === "num" ? `${v.many} (${v.unit})` : v.many}`;
/** Short name chip ("⏱ s", "📏 m"). */
export const vineShort = (v) => `${v.icon ? `${v.icon} ` : ""}${v.kind === "num" ? v.unit : v.many}`;

/** Every move a free-route ladder offers. */
export const ALL_MOVES = ["again", "x2", "h2", "split", "times", "join", "gap"];
export const ALL_MOVES_10 = ["again", "x2", "h2", "x10", "d10", "split", "times", "join", "gap"];
