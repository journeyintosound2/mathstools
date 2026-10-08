import React from "react";

import MagmaPanelShell, { MagmaNumberInput, MagmaButton } from "./MagmaPanelShell.jsx";
import { useColumnsChallenge } from "../../game/magma/stores/columnsStore.js";
import { useObsidianChallenge } from "../../game/magma/stores/obsidianStore.js";
import { useTerracesChallenge } from "../../game/magma/stores/terracesStore.js";
import { useGeysersChallenge } from "../../game/magma/stores/geysersStore.js";
import { useForgeChallenge } from "../../game/magma/stores/forgeStore.js";
import { useGardenChallenge } from "../../game/magma/stores/gardenStore.js";
import { useCinderChallenge } from "../../game/magma/stores/cinderStore.js";
import { useLakeChallenge } from "../../game/magma/stores/lakeStore.js";
import { useBonesChallenge } from "../../game/magma/stores/bonesStore.js";
import { useSummitChallenge } from "../../game/magma/stores/summitStore.js";
import { columnsLayout } from "../../data/magma/columnsChallenge.js";
import { obsidianColRange } from "../../data/magma/obsidianChallenge.js";
import { fmtThousandths } from "../../data/magma/magmaMath.js";
import { geyserMove } from "../../data/magma/geysersChallenge.js";
import { forgeSplits } from "../../data/magma/forgeChallenge.js";
import { GARDEN_FLOWERS, GARDEN_POTS, GARDEN_GLOWS } from "../../data/magma/gardenChallenge.js";
import { CINDER_OPS, cinderQuestion, CINDER_MAX_NEW } from "../../data/magma/cinderChallenge.js";
import { lakeButtons, lakeAnswerPrompt } from "../../data/magma/lakeChallenge.js";
import { BONE_NAMES } from "../../data/magma/bonesChallenge.js";

/**
 * MAGMA MULTIPLES — the ten challenge cards (one shell, ten sets of
 * controls). Every card is bottom-docked; the scene above it shows the
 * maths. Controls are big tap targets; Enter does the obvious thing.
 */

const V = ({ children }) => <span className="fc-value">{children}</span>;

// ---------------------------------------------------------------------------
// 1 · COLUMN RECTANGLES
// ---------------------------------------------------------------------------
function ColumnsPlay({ round }) {
  const rows = useColumnsChallenge((s) => s.rows);
  const kept = useColumnsChallenge((s) => s.kept);
  const st = useColumnsChallenge.getState;
  const L = columnsLayout(round.n, rows);
  return (
    <>
      <div className="snow-q">
        Stand <V>{round.n}</V> columns in rows — find EVERY rectangle!
      </div>
      <div className="magma-row">
        <MagmaButton onClick={() => st().stepRows(-1)} disabled={rows <= 1}>−</MagmaButton>
        <div className={`magma-readout ${L.exact ? "good" : "bad"}`}>
          {L.rows} row{L.rows > 1 ? "s" : ""} of {L.perRow}
          {L.leftover ? <small> + {L.leftover} over</small> : <small> ✓ fits</small>}
        </div>
        <MagmaButton onClick={() => st().stepRows(1)} disabled={rows >= round.n}>+</MagmaButton>
      </div>
      <div className="magma-row">
        <MagmaButton className="primary-button" onClick={() => st().keep()}>✅ Keep it (Enter)</MagmaButton>
        <MagmaButton className="link-button magma-claim" onClick={() => st().claim()}>🏁 That's all of them!</MagmaButton>
      </div>
      <div className="magma-chips">
        {kept.length ? kept.map(([a, b]) => <span key={`${a}x${b}`} className="magma-chip good">{a} × {b}</span>) : <span className="magma-chip dim">No rectangles kept yet</span>}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · CRACK THE CRYSTAL
// ---------------------------------------------------------------------------
function ObsidianPlay({ round }) {
  const phase = useObsidianChallenge((s) => s.phase);
  const cols = useObsidianChallenge((s) => s.cols);
  const rows = useObsidianChallenge((s) => s.rows);
  const crackStep = useObsidianChallenge((s) => s.crackStep);
  const pieces = useObsidianChallenge((s) => s.pieces);
  const pieceIndex = useObsidianChallenge((s) => s.pieceIndex);
  const st = useObsidianChallenge.getState;
  if (phase === "crack") {
    const rowsStep = crackStep === "rows";
    const grow = cols > round.b;
    const C = obsidianColRange(round);
    const readout = rowsStep
      ? `${rows} + ${round.a - rows} rows`
      : grow
        ? `grow to ${cols}: ${round.a} × ${cols} − ${round.a} × ${cols - round.b}`
        : `${round.a} × ${cols} + ${round.a} × ${round.b - cols}`;
    return (
      <>
        <div className="snow-q">
          {round.kind === "area"
            ? <>Crack <V>{round.a} × {round.b}</V> both ways — {rowsStep ? "now the ROWS" : "first the COLUMNS"}</>
            : <>Crack <V>{round.a} × {round.b}</V> into pieces you know</>}
        </div>
        <div className="magma-row">
          <MagmaButton onClick={() => st().moveCrack(-1)}>◀</MagmaButton>
          <div className="magma-readout">{readout}</div>
          <MagmaButton onClick={() => st().moveCrack(1)}>▶</MagmaButton>
        </div>
        {!rowsStep && C.canGrow && <div className="snow-sub">Push past the edge to GROW it to {C.max}.</div>}
        <div className="magma-row">
          <MagmaButton className="primary-button" onClick={() => st().lockCrack()}>⚡ Crack! (Enter)</MagmaButton>
        </div>
      </>
    );
  }
  if (phase === "pieces") {
    const p = pieces[pieceIndex];
    return (
      <>
        <div className="snow-q">
          {p.take ? "The ghost piece: " : `Piece ${pieceIndex + 1} of ${pieces.length}: `}
          <V>{p.rows} × {p.cols}</V> = ?
        </div>
        <MagmaNumberInput label={null} onSubmit={(t) => st().submitPiece(t)} />
      </>
    );
  }
  const expr = pieces.map((p, i) => `${i ? (p.take ? " − " : " + ") : ""}${p.value}`).join("");
  return (
    <>
      <div className="snow-q">
        Put the pieces together: <V>{round.a} × {round.b}</V> = ?
      </div>
      <div className="snow-sub">{expr}</div>
      <MagmaNumberInput onSubmit={(t) => st().submitTotal(t)} />
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · TENFOLD TERRACES
// ---------------------------------------------------------------------------
function TerracesPlay({ round }) {
  const phase = useTerracesChallenge((s) => s.phase);
  const shift = useTerracesChallenge((s) => s.shift);
  const st = useTerracesChallenge.getState;
  if (phase === "fact") {
    return (
      <>
        <div className="snow-q"><V>{round.text}</V> — start with the fact</div>
        <MagmaNumberInput label={`${round.fact[0]} × ${round.fact[1]} =`} onSubmit={(t) => st().submitFact(t)} />
      </>
    );
  }
  if (phase === "slide") {
    const moved = shift === 0 ? "not moved yet" : `moved ${Math.abs(shift)} terrace${Math.abs(shift) > 1 ? "s" : ""} ${shift > 0 ? "UP" : "DOWN"}`;
    return (
      <>
        <div className="snow-q">
          <V>{round.text}</V> — slide the digits!
        </div>
        <div className="magma-row">
          <MagmaButton onClick={() => st().slide(1)}>◀ × 10 <small>up a terrace</small></MagmaButton>
          <MagmaButton onClick={() => st().slide(-1)}>÷ 10 ▶ <small>down a terrace</small></MagmaButton>
        </div>
        <div className="snow-sub">Digits {moved}</div>
        <div className="magma-row">
          <MagmaButton className="primary-button" onClick={() => st().lock()}>🔒 Lock it (Enter)</MagmaButton>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="snow-q"><V>{round.text}</V> = ?</div>
      <MagmaNumberInput inputMode="decimal" onSubmit={(t) => st().submitResult(t)} />
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · HALVE & DOUBLE
// ---------------------------------------------------------------------------
function GeysersPlay() {
  const phase = useGeysersChallenge((s) => s.phase);
  const chain = useGeysersChallenge((s) => s.chain);
  const st = useGeysersChallenge.getState;
  const [a, b] = chain[chain.length - 1];
  const text = chain.map(([x, y]) => `${x} × ${y}`);
  if (phase === "type") {
    return (
      <>
        <div className="snow-q"><V>{a} × {b}</V> = ?</div>
        <MagmaNumberInput onSubmit={(t) => st().submit(t)} />
        <div className="magma-row">
          <MagmaButton className="link-button" onClick={() => st().back()}>◀ Back to the geysers</MagmaButton>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="snow-q magma-chain">
        {text.slice(0, -1).map((t) => <span key={t} className="magma-chain-old">{t} = </span>)}
        <V>{text[text.length - 1]}</V>
      </div>
      <div className="magma-row">
        <MagmaButton onClick={() => st().move("rows")} disabled={!geyserMove(a, b, "rows")}>♨️ Halve the {a} <small>double the {b}</small></MagmaButton>
        <MagmaButton onClick={() => st().move("cols")} disabled={!geyserMove(a, b, "cols")}>♨️ Halve the {b} <small>double the {a}</small></MagmaButton>
      </div>
      <div className="magma-row">
        <MagmaButton className="primary-button" onClick={() => st().solve()}>✅ Easy now — solve it! (Enter)</MagmaButton>
        {chain.length > 1 && <MagmaButton className="link-button" onClick={() => st().restart()}>↺ Start again</MagmaButton>}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · FACTOR FORGE
// ---------------------------------------------------------------------------
function ForgePlay({ round }) {
  const ingots = useForgeChallenge((s) => s.ingots);
  const selected = useForgeChallenge((s) => s.selected);
  const st = useForgeChallenge.getState;
  const one = selected.length === 1 ? ingots[selected[0]] : null;
  const splits = one !== null ? forgeSplits(one) : [];
  return (
    <>
      <div className="snow-q">
        Forge <V>{round.ingots.join(" × ")}</V> into one ingot
      </div>
      <div className="magma-row">
        {ingots.map((n, k) => (
          <MagmaButton key={`${k}-${n}`} className="magma-ingot" active={selected.includes(k)} onClick={() => st().select(k)}>
            {n}
          </MagmaButton>
        ))}
      </div>
      {selected.length === 0 && <div className="snow-sub">Tap ONE ingot to hammer it apart — or TWO to fuse them.</div>}
      {selected.length === 1 && (
        <div className="magma-row">
          {splits.length ? (
            <>
              <span className="magma-input-label">🔨 {one} =</span>
              {splits.map((p) => (
                <MagmaButton key={p.join("x")} onClick={() => st().split(p)}>{p[0]} × {p[1]}</MagmaButton>
              ))}
            </>
          ) : (
            <span className="snow-sub">{one} is prime — it won't break. Pick another ingot to fuse with it.</span>
          )}
        </div>
      )}
      {selected.length === 2 && (
        <MagmaNumberInput label={`🔥 ${ingots[selected[0]]} × ${ingots[selected[1]]} =`} onSubmit={(t) => st().fuse(t)} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · FLOWER COMBOS
// ---------------------------------------------------------------------------
function GardenPlay({ round }) {
  const phase = useGardenChallenge((s) => s.phase);
  const sel = useGardenChallenge((s) => s.sel);
  const planted = useGardenChallenge((s) => s.planted);
  const st = useGardenChallenge.getState;
  if (phase === "predict") {
    return (
      <>
        <div className="snow-q">
          {round.inverse
            ? <><V>{round.total}</V> different combos from <V>{round.f}</V> flowers. How many pots?</>
            : <><V>{round.f}</V> flowers, <V>{round.p}</V> pots{round.g > 1 && <>, <V>{round.g}</V> glows</>} — how many different combos?</>}
        </div>
        <MagmaNumberInput onSubmit={(t) => st().submitPredict(t)} />
      </>
    );
  }
  return (
    <>
      <div className="magma-pickers">
        <div className="magma-picker">
          {GARDEN_FLOWERS.slice(0, round.f).map((fl, i) => (
            <MagmaButton key={fl.name} className="magma-pick" active={sel.f === i} onClick={() => st().choose("f", i)}>
              <span className="magma-dot" style={{ background: fl.color }} /> {fl.name}
            </MagmaButton>
          ))}
        </div>
        <div className="magma-picker">
          {GARDEN_POTS.slice(0, round.p).map((pt, i) => (
            <MagmaButton key={pt.name} className="magma-pick" active={sel.p === i} onClick={() => st().choose("p", i)}>
              <span className="magma-dot square" style={{ background: pt.color }} /> {pt.name}
            </MagmaButton>
          ))}
        </div>
        {round.g > 1 && (
          <div className="magma-picker">
            {GARDEN_GLOWS.slice(0, round.g).map((gl, i) => (
              <MagmaButton key={gl.name} className="magma-pick" active={sel.g === i} onClick={() => st().choose("g", i)}>
                <span className="magma-dot glow" style={{ background: gl.color }} /> {gl.name}
              </MagmaButton>
            ))}
          </div>
        )}
      </div>
      <div className="magma-row">
        <MagmaButton onClick={() => st().plant()}>🌱 Plant (Enter)</MagmaButton>
        <MagmaButton onClick={() => st().plantRow()}>🌺 This flower in EVERY pot</MagmaButton>
        {round.g > 1 && <MagmaButton onClick={() => st().copyGlow()}>🌟 Copy to every glow</MagmaButton>}
      </div>
      <div className="magma-row">
        <span className="magma-chip">Planted: {planted.length}</span>
        <MagmaButton className="primary-button" onClick={() => st().claim()}>✅ That's every combo!</MagmaButton>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · CART TABLES
// ---------------------------------------------------------------------------
function CinderPlay({ round }) {
  const cols = useCinderChallenge((s) => s.cols);
  const sel = useCinderChallenge((s) => s.sel);
  const pending = useCinderChallenge((s) => s.pending);
  const st = useCinderChallenge.getState;
  const q = cinderQuestion(round);
  return (
    <>
      <div className="snow-q">
        {q.rate} <V>{q.ask}</V>
      </div>
      <div className="magma-table">
        <div className="magma-table-head">
          <span>🛒 Carts</span>
          <span>🪨 Rocks</span>
        </div>
        {cols.map(([c, r], i) => (
          <button
            key={i}
            className={`magma-col${sel.includes(i) ? " active" : ""}`}
            onClick={(e) => {
              e.currentTarget.blur();
              st().select(i);
            }}
          >
            <span>{c}</span>
            <span>{r}</span>
          </button>
        ))}
        {pending && (
          <div className="magma-col pending">
            <span>{pending.carts}</span>
            <span>?</span>
          </div>
        )}
      </div>
      {pending ? (
        <>
          <MagmaNumberInput label={`${pending.carts} carts →`} unit="rocks" onSubmit={(t) => st().submitRocks(t)} />
          <div className="magma-row">
            <MagmaButton className="link-button" onClick={() => st().cancel()}>✕ Cancel this column</MagmaButton>
          </div>
        </>
      ) : (
        <>
          <div className="magma-row">
            {CINDER_OPS.map((o) => (
              <MagmaButton key={o.id} className="plank-piece-btn magma-op" onClick={() => st().op(o.id)}>
                {o.label}
              </MagmaButton>
            ))}
          </div>
          <div className="magma-row">
            <span className="snow-sub">Tap a column (or two for + and −), then a move · {cols.length - 1}/{CINDER_MAX_NEW} new columns</span>
            {cols.length > 1 && <MagmaButton className="link-button" onClick={() => st().undo()}>↩ Undo</MagmaButton>}
          </div>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · LAVA CHANNELS
// ---------------------------------------------------------------------------
function LakePlay({ round }) {
  const phase = useLakeChallenge((s) => s.phase);
  const left = useLakeChallenge((s) => s.left);
  const pours = useLakeChallenge((s) => s.pours);
  const st = useLakeChallenge.getState;
  const share = round.kind === "share";
  if (phase === "answer") {
    return (
      <>
        <div className="snow-q">{lakeAnswerPrompt(round)}</div>
        <div className="snow-sub">You poured {pours.join(" + ")} {share ? "into each mould" : "rows"}{left ? ` · ${left} left in the cauldron` : ""}</div>
        <MagmaNumberInput onSubmit={(t) => st().submitAnswer(t)} />
      </>
    );
  }
  return (
    <>
      <div className="snow-q">
        {share
          ? <>Share <V>{round.D}</V> among <V>{round.d}</V> moulds</>
          : round.ctx
            ? <><V>{round.D} ÷ {round.d}</V> <small className="magma-ctx">{round.ctx.ask}</small></>
            : <>Pour <V>{round.D}</V> into a channel <V>{round.d}</V> wide</>}
      </div>
      <div className="snow-sub">
        Cauldron: <b>{left}</b> left · each {share ? "round fills every mould once" : "row"} uses <b>{round.d}</b>
      </div>
      <div className="magma-row">
        {lakeButtons(round).map((k) => (
          <MagmaButton key={k} onClick={() => st().pour(k)}>
            {share ? `${k} each` : `${k} row${k > 1 ? "s" : ""}`}
          </MagmaButton>
        ))}
      </div>
      <MagmaNumberInput label={share ? "Pour this many into each:" : "Pour this many rows:"} autoFocus={false} onSubmit={(t) => {
        const k = Number(String(t).trim());
        if (!Number.isInteger(k) || k <= 0) return "invalid";
        return st().pour(k);
      }} />
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · GROW THE DRAGON
// ---------------------------------------------------------------------------
function BonesPlay({ round }) {
  const phase = useBonesChallenge((s) => s.phase);
  const vals = useBonesChallenge((s) => s.vals);
  const grade = useBonesChallenge((s) => s.grade);
  const st = useBonesChallenge.getState;
  const who = round.toy ? "toy" : "grown-up";
  if (phase === "factor") {
    return (
      <>
        <div className="snow-q">
          Baby skull <V>{round.baby[0]}</V> → grown-up skull <V>{round.adult[0]}</V>. How many TIMES as long?
        </div>
        <MagmaNumberInput inputMode="decimal" onSubmit={(t) => st().submitFactor(t)} />
      </>
    );
  }
  return (
    <>
      <div className="snow-q">
        {round.toy ? "Big" : "Baby"} skull <V>{round.baby[0]}</V> → {who} skull <V>{round.adult[0]}</V>. Build the {who} dragon!
      </div>
      <div className="magma-bones">
        {vals.map((v, j) => {
          const bad = grade && phase === "retry" && !grade.correct[j];
          return (
            <div key={j} className={`magma-bone${bad ? " bad" : ""}`}>
              <div className="magma-bone-name">{BONE_NAMES[j + 1]} <small>{round.toy ? "big" : "baby"} {round.baby[j + 1]}</small></div>
              <div className="magma-row tight">
                <MagmaButton onClick={() => st().nudge(j, -1)}>−</MagmaButton>
                <span className="magma-bone-val">{v}</span>
                <MagmaButton onClick={() => st().nudge(j, 1)}>+</MagmaButton>
              </div>
            </div>
          );
        })}
      </div>
      <div className="magma-row">
        <MagmaButton className="primary-button" onClick={() => st().raise()}>
          🐉 {phase === "retry" ? "Raise it again!" : "Raise!"} (Enter)
        </MagmaButton>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · STRATEGY SUMMIT
// ---------------------------------------------------------------------------
function SummitPlay({ round }) {
  const phase = useSummitChallenge((s) => s.phase);
  const picked = useSummitChallenge((s) => s.picked);
  const st = useSummitChallenge.getState;
  if (phase === "pick") {
    return (
      <>
        <div className="snow-big-sum">{round.q}</div>
        <div className="snow-sub">Every tablet is right. Which way is EASIEST?</div>
        <div className="snow-choices">
          {round.choices.map((c) => (
            <button
              key={c.key}
              className="snow-choice"
              onClick={(e) => {
                e.currentTarget.blur();
                st().pick(c.key);
              }}
            >
              <span className="snow-choice-sum">{c.show}</span>
              <small>{c.name}</small>
            </button>
          ))}
        </div>
      </>
    );
  }
  const c = round.choices.find((w) => w.key === picked);
  return (
    <>
      <div className="snow-exec">
        {c.steps.map((s, i) => <div key={i} className="snow-exec-line">{s}</div>)}
      </div>
      <MagmaNumberInput label="=" onSubmit={(t) => st().submit(t)} />
    </>
  );
}

// ---------------------------------------------------------------------------
// The ten panels.
// ---------------------------------------------------------------------------
export default function MagmaPanels() {
  return (
    <>
      <MagmaPanelShell
        useStore={useColumnsChallenge}
        intro={{
          steps: [<>Use <b>− / +</b> to stand the columns in rows. Leftovers glow red.</>, <>A perfect fit? <b>Keep it!</b> Find EVERY rectangle, then say <b>That's all!</b></>],
          example: "12 → 1 × 12, 2 × 6, 3 × 4 (4 × 3 is 3 × 4 turned!)",
        }}
        Play={ColumnsPlay}
        celebrate={(r) => `all ${r.pairs.length} rectangle${r.pairs.length > 1 ? "s" : ""} of ${r.n}${r.prime ? " — it's PRIME!" : ""}`}
      />
      <MagmaPanelShell
        useStore={useObsidianChallenge}
        intro={{
          steps: [<>Move the <b>crack</b> to split the crystal into pieces you know (or push it past the edge to <b>grow</b> it).</>, <>Work out each piece, then the whole crystal.</>],
          example: "7 × 8 = 7 × 5 + 7 × 3 = 35 + 21 = 56",
        }}
        Play={ObsidianPlay}
        celebrate={(r) => `${r.a} × ${r.b} = ${r.product}`}
      />
      <MagmaPanelShell
        useStore={useTerracesChallenge}
        intro={{
          steps: [<>Each terrace is <b>ten times</b> the one below. × 10 slides every digit <b>up</b> one terrace; ÷ 10 slides it <b>down</b>.</>, <>The point never moves. Lock your slide, then say the number.</>],
          example: "3.5 × 10 → 35 (not 3.50!)",
        }}
        Play={TerracesPlay}
        celebrate={(r) => `${r.text} = ${fmtThousandths(r.result)}`}
      />
      <MagmaPanelShell
        useStore={useGeysersChallenge}
        intro={{
          steps: [<>Steam cuts the terrace in half and slides it alongside — <b>half as many rows, twice as long</b>.</>, <>Same tiles, same answer. Stop when it's EASY, then solve it.</>],
          example: "16 × 25 = 8 × 50 = 4 × 100 = 400",
        }}
        Play={GeysersPlay}
        celebrate={(r) => `${r.a} × ${r.b} = ${r.product}`}
      />
      <MagmaPanelShell
        useStore={useForgeChallenge}
        intro={{
          steps: [<>Tap ONE ingot to <b>hammer</b> it into factors. Tap TWO to <b>fuse</b> them (type their product).</>, <>Fuse into a friendly 10 or 100 first — then finish the job!</>],
          example: "25 × 24 → 25 × 4 × 6 → 100 × 6 = 600",
        }}
        Play={ForgePlay}
        celebrate={(r) => `${r.ingots.join(" × ")} = ${r.product}`}
      />
      <MagmaPanelShell
        useStore={useGardenChallenge}
        intro={{
          steps: [<>Guess how many different <b>flower + pot</b> combos there are.</>, <>Plant them all — for EACH flower, a whole row of pots. Then say <b>That's every combo!</b></>],
          example: "3 flowers × 4 pots = 12 combos",
        }}
        Play={GardenPlay}
        celebrate={(r) => (r.inverse ? `${r.f} × ${r.p} = ${r.total} — ${r.p} pots!` : `${r.total} combos!`)}
      />
      <MagmaPanelShell
        useStore={useCinderChallenge}
        intro={{
          steps: [<>Tap a column, then a move: <b>× 2, ÷ 2, × 10, ÷ 10</b> — or tap two columns and <b>+</b> or <b>−</b>.</>, <>The carts fill in; YOU work out the rocks. Reach the target in as few columns as you can.</>],
          example: "1 → 24 · 10 → 240 · 5 → 120 · 15 → 360",
        }}
        Play={CinderPlay}
        celebrate={(r) => (r.targetRow === "top" ? `${r.targetCarts} carts → ${r.targetRocks} rocks` : `${r.targetRocks} rocks → ${r.targetCarts} carts`)}
      />
      <MagmaPanelShell
        useStore={useLakeChallenge}
        intro={{
          steps: [<>Pour the cauldron into the channel in <b>big chunks</b> — 10 rows at a time if it fits. Too many? It spills!</>, <>When it's poured, answer the question.</>],
          example: "156 ÷ 12 → 10 rows (120) + 3 rows (36) = 13",
        }}
        Play={LakePlay}
        celebrate={(r) => (r.kind === "share" ? `${r.D} ÷ ${r.d} = ${r.q} each` : r.ctx ? `${r.answer} ${r.ctx.unit}!` : `${r.D} ÷ ${r.d} = ${r.q}`)}
      />
      <MagmaPanelShell
        useStore={useBonesChallenge}
        intro={{
          steps: [<>Look at the skulls: how many TIMES as long is the new one?</>, <>Make EVERY bone that many times as long, then <b>Raise!</b> Adding the same amount makes a wonky dragon.</>],
          example: "skull 2 → 6 is × 3, so tail 4 → 12",
        }}
        Play={BonesPlay}
        celebrate={(r) => `a perfect ${r.toy ? "toy" : "grown-up"} dragon — × ${r.factorText}!`}
      />
      <MagmaPanelShell
        useStore={useSummitChallenge}
        intro={{
          steps: [<>Three rune tablets — each one the same problem written a different way. All are right!</>, <>Pick the <b>easiest</b> way, then do it.</>],
          example: "25 × 24 → 25 × 4 × 6 → 100 × 6 = 600",
        }}
        Play={SummitPlay}
        celebrate={(r) => `${r.q.includes("?") ? r.answer + " coins" : `${r.q} = ${r.answer}`}`}
      />
    </>
  );
}
