import React, { useEffect, useState } from "react";

import { MagmaNumberInput, MagmaButton } from "../magma/MagmaPanelShell.jsx";
import { workLadders, driveAt } from "../../game/jungle/ladderStore.js";
import { LADDER_MOVES, SPLIT_CHOICES, TIMES_CHOICES, MAX_NEW_RUNGS, vineChip, other, vineOn } from "../../data/jungle/vineLadder.js";

/**
 * THE VINE-LADDER CARD — one set of controls for every Emerald Jungle
 * challenge, whatever the phase of the round:
 *   build / common / smallest   the rungs as tappable chips (the 3D rungs are
 *                               tappable too), the moves, the partner box
 *   type                        one number box (the across number, a scale,
 *                               a total)
 *   call                        big option buttons (a phase may also let the
 *                               student build on its ladders while deciding)
 * The question sits on top; the scene owns the maths.
 */

const V = ({ children }) => <span className="fc-value">{children}</span>;

export const MOVE_LABEL = {
  again: "➕ Again",
  x2: "× 2",
  h2: "÷ 2",
  x10: "× 10",
  d10: "÷ 10",
  split: "✂ Split…",
  times: "✖ Times…",
  join: "➕ Join two",
  gap: "➖ Gap",
  across: "↔ Across",
};

export default function LadderPlay({ round, useStore, labels = {} }) {
  const ladders = useStore((s) => s.ladders);
  const active = useStore((s) => s.active);
  const sel = useStore((s) => s.sel);
  const pending = useStore((s) => s.pending);
  const picker = useStore((s) => s.picker);
  const common = useStore((s) => s.common);
  const phase = useStore((s) => s.phase);
  const across = useStore((s) => s.across);
  const hits = useStore((s) => s.hits);
  const st = useStore.getState;
  const ph = round.phases[phase] || {};
  const q = round.q || { lead: "", ask: "" };
  // A call phase may let the student build on its ladders while deciding
  // (Firefly Graphs: hang fireflies on any line) — behind a toggle, so the
  // card stays short until they want it.
  const [explore, setExplore] = useState(false);
  useEffect(() => { setExplore(false); }, [round.sig, phase]);
  const exploring = ph.type === "call" && workLadders(round, ph).length > 0;
  const work = exploring && !explore ? [] : workLadders(round, ph);
  const building = work.length > 0;
  const moveLabel = (op) => (round.moveLabels && round.moveLabels[op]) || labels[op] || MOVE_LABEL[op];

  // Which ladders get a strip: the ones you can build on now, plus (in a
  // shared layout) the partner ladder so a common amount is easy to spot.
  const shown = ph.hideLadder || (exploring && !explore)
    ? []
    : round.layout === "chain"
      ? (building ? work : [])
      : round.ladders.map((_, li) => li).filter((li) => work.includes(li) || round.layout === "shared" || round.layout === "graph" || !building);

  const strip = (li) => {
    const L = round.ladders[li].L;
    const rungs = ladders[li] ? ladders[li].rungs : [];
    const d = driveAt(round, phase, li);
    const canWork = work.includes(li);
    const many = round.ladders.length > 1;
    return (
      <div key={li} className={`jungle-rungs${many && canWork && active === li ? " on" : ""}`}>
        {many && round.ladders[li].name && (
          <MagmaButton className={`jungle-stall-tag${active === li ? " active" : ""}`} onClick={() => st().setActive(li)}>
            {round.ladders[li].name}
          </MagmaButton>
        )}
        {rungs.map(([t, b], i) => {
          const hit = hits.some((h) => h.li === li && h.t === t);
          return (
            <button
              key={i}
              className={`jungle-rung${canWork && active === li && sel.includes(i) ? " active" : ""}${(common !== null && t === common) || hit ? " common" : ""}${canWork ? "" : " still"}`}
              onClick={(e) => { e.currentTarget.blur(); st().select(li, i); }}
            >
              {vineChip(L.top, t)} <span className="jungle-rung-tie">↔</span> {vineChip(L.bottom, b)}
            </button>
          );
        })}
        {pending && pending.li === li && (
          <span className="jungle-rung pending">
            {d === "top" ? vineChip(L.top, pending.rung[0]) : "?"} <span className="jungle-rung-tie">↔</span>{" "}
            {d === "top" ? "?" : vineChip(L.bottom, pending.rung[1])}
          </span>
        )}
      </div>
    );
  };

  let controls = null;
  if (pending) {
    const L = round.ladders[pending.li].L;
    const d = driveAt(round, phase, pending.li);
    const pv = vineOn(L, other(d));
    const lead = vineChip(vineOn(L, d), pending.value);
    controls = (
      <>
        <MagmaNumberInput
          key={`${pending.li}-${pending.value}`}
          label={`${lead} ↔`}
          unit={pv.kind === "count" ? `${pv.icon} ${pv.many}` : pv.kind === "kg" ? "kg" : pv.kind === "num" ? pv.unit : ""}
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
  } else if (ph.type === "type") {
    controls = (
      <MagmaNumberInput
        key={`type-${phase}`}
        label={ph.label || "="}
        unit={ph.unit || (ph.vine && ph.vine.kind === "num" ? ph.vine.unit : "")}
        placeholder={ph.vine && ph.vine.kind === "money" ? "$" : "?"}
        inputMode="decimal"
        maxLength={10}
        onSubmit={(t) => st().submit(t)}
      />
    );
  } else if (building) {
    const added = work.reduce((a, li) => a + (ladders[li] ? ladders[li].added : 0), 0);
    const ops = round.moves.filter((op) => op !== "across" || across);
    const sel1 = sel.length === 1 && sel[0] >= (round.ladders[active] ? round.ladders[active].start.length : 1);
    controls = (
      <>
        <div className="magma-row">
          {ops.map((op) => (
            <MagmaButton
              key={op}
              className={`plank-piece-btn magma-op jungle-op${LADDER_MOVES[op].arity === 2 ? " two" : ""}${op === "across" ? " across" : ""}`}
              onClick={() => st().choose(op)}
            >
              {moveLabel(op)}
            </MagmaButton>
          ))}
        </div>
        {ph.type === "smallest" && (
          <div className="magma-row">
            <MagmaButton className="primary-button magma-claim" onClick={() => st().claim()}>✅ {ph.claimLabel || "That's the smallest swap!"}</MagmaButton>
          </div>
        )}
        <div className="magma-row tight jungle-foot">
          <span className="snow-sub">{ph.hint || "Tap a rung (or two), then a move — any route"}</span>
          {added > 0 && <MagmaButton className="link-button" onClick={() => st().undo()}>↩ Undo</MagmaButton>}
          {added > 0 && sel1 && <MagmaButton className="link-button" onClick={() => st().remove()}>✂ Remove</MagmaButton>}
        </div>
        {added >= MAX_NEW_RUNGS - 2 && <div className="snow-sub">The vine is filling up — remove rungs you don't need.</div>}
      </>
    );
  }

  const callRow = ph.type === "call" && !pending && !picker ? (
    <>
      <div className="magma-row jungle-calls">
        {ph.options.map((o, i) => (
          <MagmaButton key={i} className={`primary-button jungle-callbtn${o.tone ? ` ${o.tone}` : ""}`} onClick={() => st().call(i)}>
            {o.icon ? `${o.icon} ` : ""}{o.label}
          </MagmaButton>
        ))}
      </div>
      {exploring && (
        <div className="magma-row tight">
          <MagmaButton className="link-button" onClick={() => setExplore(!explore)}>
            {explore ? "▲ Hide the moves" : ph.exploreLabel || "🔍 Build on a line to check"}
          </MagmaButton>
        </div>
      )}
    </>
  ) : null;

  return (
    <>
      <div className="snow-q">
        {q.lead} <V>{ph.ask || q.ask}</V>
      </div>
      {round.layout === "chain" && round.legs && (
        <div className="jungle-legs">
          {round.legs.map((leg, i) => (
            <span key={i} className={`jungle-leg${i < legIndex(round, phase) ? " done" : i === legIndex(round, phase) ? " on" : ""}`}>
              {i < legIndex(round, phase) ? "✓ " : ""}{leg}{i < legIndex(round, phase) && round.legDone ? `: ${round.legDone[i]}` : ""}
            </span>
          ))}
        </div>
      )}
      {shown.length > 0 && <div className={`jungle-rung-strips${shown.length > 1 ? " row" : ""}`}>{shown.map((li) => strip(li))}</div>}
      {callRow}
      {controls}
    </>
  );
}

/** Which leg (chain rounds) a phase belongs to. */
function legIndex(round, phase) {
  const ph = round.phases[phase];
  if (!ph) return round.legs ? round.legs.length : 0;
  return ph.leg ?? 0;
}
