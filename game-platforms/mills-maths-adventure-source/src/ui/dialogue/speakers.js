/**
 * WHO'S TALKING (2026-10-13) — the dialogue box's portrait, colour and
 * one-line role for each speaker. Portraits are small WebP head-and-shoulder
 * shots rendered from each character's own model (public/portraits/, made by
 * the headless harness — re-render if a model changes). Speakers without a
 * model get a big emoji instead.
 */
import { JOURNEY_FRIENDS } from "../../data/journey.js";

const BASE = (import.meta.env && import.meta.env.BASE_URL) || "./";
const portrait = (file) => `${BASE}portraits/${file}.webp`;
const friend = (id) => (JOURNEY_FRIENDS.find((f) => f.id === id) || {}).topic || "";

const S = {
  "Mills": { img: "mills", color: "#7b2d8e", role: "Your guide" },
  "Pip": { img: "pip", color: "#1f6fd1", role: friend("pip") },
  "Pip the Penguin": { img: "pip", color: "#1f6fd1", role: friend("pip") },
  "Fern": { img: "fern", color: "#e2621d", role: friend("fern") },
  "Fern the Fox": { img: "fern", color: "#e2621d", role: friend("fern") },
  "Alby": { img: "alby", color: "#8a5a2b", role: friend("alby") },
  "Alby the Owl": { img: "alby", color: "#8a5a2b", role: friend("alby") },
  "Mr. Pearce": { img: "pearce", color: "#1d3d7a", role: "Teacher" },
  "Ms. Mahoney": { img: "mahoney", color: "#3a2f2a", role: "Teacher" },
  "Ms. Ewings": { img: "ewings", color: "#b0473a", role: "Teacher" },
  "Mr. Dawson": { img: "dawson", color: "#1c4fa3", role: "Teacher" },
  "Mr. Heywood": { img: "heywood", color: "#22324a", role: "Teacher" },
  "Mr. Morgan": { img: "morgan", color: "#1f4e5f", role: "Teacher" },
  "Ms. Bacon": { img: "bacon", color: "#9a3b2c", role: "Teacher" },
  "Ms. Brookes": { img: "brookes", color: "#227a46", role: "Teacher" },
  "Mrs. Kellahan": { icon: "🏫", color: "#7a1f2b", role: "Head Teacher" },
  "Robot": { img: "robot", color: "#1b6fb5", role: "" }, // hosts in two worlds
  "Steve": { img: "steve", color: "#1f5fbf", role: "" },
  "Trevor": { img: "trevor", color: "#3f7d2a", role: "" },
  "The Milkman": { img: "farmer1", color: "#2f73b8", role: "The Milk Splitter" },
  "The Weigh Master": { img: "farmer", color: "#c2412d", role: "The Weigh Station" },
  "Woody": { img: "farmer1", color: "#8a5a2b", role: "Plank the Gap" },
  "Sunny": { img: "farmer", color: "#d68a00", role: "The Farm Shop" },
  "Frosty": { icon: "☃️", color: "#2f95d0", role: "Snowman Meadow" },
  "Flake": { icon: "🛷", color: "#2f95d0", role: "Sledding Slope" },
  "Bloc": { icon: "🧊", color: "#2f95d0", role: "Igloo Village" },
  "Pippin": { icon: "🐧", color: "#2f95d0", role: "Penguin Colony" },
  "Glim": { icon: "💎", color: "#2f95d0", role: "The Ice Cave" },
  "Cocoa": { icon: "☕", color: "#8a5a2b", role: "Lodge Yard" },
  "Nova": { icon: "🌌", color: "#4b3fa0", role: "Aurora Lookout" },
  "Treasure Chest": { icon: "🪙", color: "#c8962a", role: "" },
  "World Map": { icon: "🗺️", color: "#2a5f9e", role: "" },
};

/** { img (url or null), icon, color, role } for a speaker's name. */
export function speakerInfo(name = "") {
  const s = S[name];
  if (s) return { img: s.img ? portrait(s.img) : null, icon: s.icon || "💬", color: s.color, role: s.role || "" };
  if (/trophies/i.test(name)) return { img: null, icon: "🏆", color: "#c8962a", role: "" };
  if (/^(Mr|Ms|Mrs|Miss)\.? /.test(name)) return { img: null, icon: "🧑‍🏫", color: "#2a5f9e", role: "Teacher" };
  return { img: null, icon: "💬", color: "#2a5f9e", role: "" };
}

/** Every portrait file (for the checks). */
export const PORTRAIT_FILES = [...new Set(Object.values(S).filter((s) => s.img).map((s) => s.img))];

/**
 * The words a dialogue line picks out in bold: the worlds, the friends,
 * medals, trophies and numbers ("6 of 7", "50%"). Pure — the dialogue box
 * turns the parts into <strong>s (English only; a translated line stays whole).
 */
const KEY_WORDS = [
  "Retrieval Practice Playground", "Number Island", "Harbour Green", "Snowball Sums", "Magma Multiples",
  "Fraction Farm", "Emerald Jungle", "the Playground", "Achievements Wall", "Mission Plaza", "the Lodge",
  "Pip", "Fern", "Alby", "Mills", "bronze", "silver", "gold", "trophies", "trophy", "waypoint", "warm-ups", "warm-up",
];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const EMPH = new RegExp(`(\\b(?:${KEY_WORDS.map(esc).join("|")})\\b|\\b\\d+(?:\\s*(?:of|\\/)\\s*\\d+)?%?|[🥉🥈🥇])`, "gu");

export function emphasisParts(text) {
  const s = String(text);
  const out = [];
  let last = 0;
  for (const m of s.matchAll(EMPH)) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), strong: false });
    out.push({ text: m[0], strong: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last), strong: false });
  return out;
}
