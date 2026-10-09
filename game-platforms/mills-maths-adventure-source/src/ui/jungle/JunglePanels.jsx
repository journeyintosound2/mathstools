import React from "react";

import MagmaPanelShell, { MagmaNumberInput, MagmaButton } from "../magma/MagmaPanelShell.jsx";
import { useSwapChallenge } from "../../game/jungle/stores/swapStore.js";
import { useMarketChallenge } from "../../game/jungle/stores/marketStore.js";
import { getJungleChallenge } from "../../data/jungle/jungleChallenges.js";
import { JUNGLE_ROUNDS_PER_SET } from "../../data/jungle/jungleRecords.js";
import { JUNGLE_REGION_ID } from "../../data/jungle/jungleLayout.js";
import { swapQuestion } from "../../data/jungle/swapChallenge.js";
import { marketQuestion } from "../../data/jungle/marketChallenge.js";
import {
  LADDER_MOVES, SPLIT_CHOICES, TIMES_CHOICES, MAX_NEW_RUNGS, vineChip, fmtVal, fmtMoney, other,
} from "../../data/jungle/vineLadder.js";

/**
 * EMERALD JUNGLE — the challenge cards. One shell (the Magma card, reused
 * with the jungle's registry + region) and ONE set of vine-ladder controls
 * shared by every ladder challenge: the rungs as tappable chips (the 3D
 * rungs are tappable too), the moves, the partner box, and the round's own
 * finishing button (claim the smallest swap / choose the better stall).
 */

const V = ({ children }) => <span className="fc-value">{children}</span>;

const valChip = (vine, v) => (vine.kind === "count" ? vineChip(vine, v) : fmtVal(vine.kind, v));

const MOVE_LABEL = {
  again: "➕ One more swap",
  x2: "× 2",
  h2: "÷ 2",
  x10: "× 10",
  d10: "÷ 10",
  split: "✂ Split…",
  times: "✖ Times…",
  join: "➕ Join two",
  gap: "➖ Gap",
};

function LadderPlay({ round, useStore, question, againLabel }) {
  const ladders = useStore((s) => s.ladders);
  const active = useStore((s) => s.active);
  const sel = useStore((s) => s.sel);
  const pending = useStore((s) => s.pending);
  const picker = useStore((s) => s.picker);
  const common = useStore((s) => s.common);
  const st = useStore.getState;
  const q = question(round);
  const compare = round.kind === "compare";
  const pSide = other(round.drive);

  const strip = (li) => {
    const L = round.ladders[li].L;
    const rungs = ladders[li] ? ladders[li].rungs : [];
    return (
      <div key={li} className={`jungle-rungs${compare && active === li ? " on" : ""}`}>
        {compare && (
          <MagmaButton className={`jungle-stall-tag${active === li ? " active" : ""}`} onClick={() => st().setActive(li)}>
            {round.ladders[li].name}
          </MagmaButton>
        )}
        {rungs.map(([t, b], i) => (
          <button
            key={i}
            className={`jungle-rung${active === li && sel.includes(i) ? " active" : ""}${common !== null && t === common ? " common" : ""}`}
            onClick={(e) => { e.currentTarget.blur(); st().select(li, i); }}
          >
            {valChip(L.top, t)} <span className="jungle-rung-tie">↔</span> {valChip(L.bottom, b)}
          </button>
        ))}
        {compare && !pending && (
          <MagmaButton className={`primary-button jungle-call${common === null ? " jungle-wait" : ""}`} onClick={() => st().call(li)}>
            ✅ Better buy
          </MagmaButton>
        )}
        {pending && pending.li === li && (
          <span className="jungle-rung pending">
            {round.drive === "top" ? valChip(L.top, pending.rung[0]) : "?"} <span className="jungle-rung-tie">↔</span>{" "}
            {round.drive === "top" ? "?" : valChip(L.bottom, pending.rung[1])}
          </span>
        )}
      </div>
    );
  };

  let controls;
  if (pending) {
    const L = round.ladders[pending.li].L;
    const pv = pSide === "top" ? L.top : L.bottom;
    const lead = round.drive === "top" ? valChip(L.top, pending.rung[0]) : valChip(L.bottom, pending.rung[1]);
    controls = (
      <>
        <MagmaNumberInput
          key={`${pending.li}-${pending.value}`}
          label={`${lead} ↔`}
          unit={pv.kind === "count" ? `${pv.icon} ${pv.many}` : pv.kind === "kg" ? "kg" : ""}
          placeholder={pv.kind === "money" ? "$" : "?"}
          inputMode={pv.kind === "count" ? "numeric" : "decimal"}
          maxLength={9}
          onSubmit={(t) => st().submit(t)}
        />
        <div className="magma-row">
          <MagmaButton className="link-button" onClick={() => st().cancel()}>✕ Not this rung</MagmaButton>
        </div>
      </>
    );
  } else if (picker) {
    const ns = picker === "split" ? SPLIT_CHOICES : TIMES_CHOICES;
    controls = (
      <>
        <div className="magma-row tight">
          <span className="snow-sub">{picker === "split" ? "Split the rung into how many equal pieces?" : "Stretch the rung how many times?"}</span>
        </div>
        <div className="magma-row tight">
          {ns.map((n) => (
            <MagmaButton key={n} className="plank-piece-btn jungle-n" onClick={() => st().pickN(n)}>
              {picker === "split" ? `÷ ${n}` : `× ${n}`}
            </MagmaButton>
          ))}
          <MagmaButton className="link-button" onClick={() => st().closePicker()}>✕</MagmaButton>
        </div>
      </>
    );
  } else {
    const added = ladders.reduce((a, l) => a + l.added, 0);
    controls = (
      <>
        <div className="magma-row">
          {round.moves.map((op) => (
            <MagmaButton key={op} className={`plank-piece-btn magma-op jungle-op${LADDER_MOVES[op].arity === 2 ? " two" : ""}`} onClick={() => st().choose(op)}>
              {op === "again" ? againLabel : MOVE_LABEL[op]}
            </MagmaButton>
          ))}
        </div>
        {round.kind === "smallest" && (
          <div className="magma-row">
            <MagmaButton className="primary-button magma-claim" onClick={() => st().claim()}>✅ That's the smallest swap!</MagmaButton>
          </div>
        )}
        <div className="magma-row tight">
          <span className="snow-sub">
            {compare ? "Same amount on both? Then pick the better buy" : "Tap a rung (or two), then a move"} · {added}/{compare ? 12 : MAX_NEW_RUNGS}
          </span>
          {added > 0 && common === null && <MagmaButton className="link-button" onClick={() => st().undo()}>↩ Undo</MagmaButton>}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="snow-q">
        {q.lead} <V>{q.ask}</V>
      </div>
      <div className="jungle-rung-strips">{round.ladders.map((_, li) => strip(li))}</div>
      {controls}
    </>
  );
}

const SwapPlay = ({ round }) => (
  <LadderPlay round={round} useStore={useSwapChallenge} question={swapQuestion} againLabel={`➕ One more swap`} />
);
const MarketPlay = ({ round }) => (
  <LadderPlay round={round} useStore={useMarketChallenge} question={marketQuestion} againLabel="➕ Again" />
);

const JUNGLE = {
  regionId: JUNGLE_REGION_ID,
  getMeta: getJungleChallenge,
  total: JUNGLE_ROUNDS_PER_SET,
  backLabel: "Back to the jungle",
  dockClass: "magma-dock jungle-dock",
};

export default function JunglePanels() {
  return (
    <>
      <MagmaPanelShell
        {...JUNGLE}
        useStore={useSwapChallenge}
        intro={{
          steps: [
            <>The deal is the first <b>rung</b> on the vine ladder: bananas on top, mangoes below, <b>tied together at 0</b>.</>,
            <>Make new rungs with a move — <b>one more swap</b>, <b>× 2</b>, <b>× 10</b>, <b>join two</b> — and work out the other vine each time. Reach the target!</>,
          ],
          example: "3 🍌 ↔ 2 🥭 → × 10 → 30 🍌 ↔ 20 🥭",
        }}
        Play={SwapPlay}
        celebrate={(r) => (r.kind === "smallest" ? `the smallest swap is ${r.smallest[0]} 🍌 ↔ ${r.smallest[1]} 🥭` : `${r.goal[0]} 🍌 ↔ ${r.goal[1]} 🥭 — deal!`)}
      />
      <MagmaPanelShell
        {...JUNGLE}
        useStore={useMarketChallenge}
        intro={{
          steps: [
            <><b>Split</b> a rung into equal pieces to find the price of ONE (or a friendlier piece) — split the fruit AND the dollars.</>,
            <>Then <b>stretch</b> it (× n) or <b>join</b> rungs to reach what you need. Two stalls? Build both to the same amount of fruit and compare.</>,
          ],
          example: "4 🍍 ↔ $10 → ÷ 4 → 1 🍍 ↔ $2.50 → × 7 → 7 🍍 ↔ $17.50",
        }}
        Play={MarketPlay}
        celebrate={(r) => (r.kind === "compare" ? `${r.ladders[r.better].name} is the better buy` : `${r.fruit.kind === "kg" ? fmtVal("kg", r.goal[0]) : vineChip(r.fruit, r.goal[0])} = ${fmtMoney(r.goal[1])}`)}
      />
    </>
  );
}
