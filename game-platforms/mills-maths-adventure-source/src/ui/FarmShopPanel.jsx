import React, { useEffect, useRef } from "react";
import RoundCelebrate from "./RoundCelebrate.jsx";

import { useFarmShop } from "../game/farmShopStore.js";
import { useSession, playerState } from "../game/sessionStore.js";
import { SHOP_ROUNDS_PER_SET } from "../data/farm/farmShopChallenge.js";
import { kh } from "./keyHints.js";

/**
 * THE FARM SHOP — 2D panel (F13). Each round the student TYPES one number (a $
 * price, a % or a count) into the field and rings it up. A "market day" chain
 * shows the running step (markup → discount → GST → profit%). Exact answer →
 * celebrate auto-advances; wrong → camera shake + the working.
 */

const CELEBRATE_MS = 1600;

const KIND_LABEL = {
  markup: "Set the price", discount: "Rainy-day sale", gst: "At the till",
  profit: "Profit report", restock: "Restock", percentof: "Stocktake",
};

export default function FarmShopPanel() {
  const status = useFarmShop((s) => s.status);
  const roundIndex = useFarmShop((s) => s.roundIndex);
  const score = useFarmShop((s) => s.score);
  const bestScore = useFarmShop((s) => s.bestScore);
  const round = useFarmShop((s) => s.currentRound());
  const input = useFarmShop((s) => s.input);
  const result = useFarmShop((s) => s.result);
  const regionId = useSession((s) => s.currentRegionId);
  const fieldRef = useRef(null);

  useEffect(() => {
    if (status !== "idle" && regionId !== "farm-parts-whole") {
      useFarmShop.getState().exit();
    }
  }, [status, regionId]);

  // Auto-focus the field at the start of each playing round.
  useEffect(() => {
    if (status === "playing" && fieldRef.current) fieldRef.current.focus();
  }, [status, roundIndex]);

  useEffect(() => {
    if (status === "feedback") playerState.camShake = { start: Date.now(), dur: 420 };
  }, [status, roundIndex]);


  // Enter/Escape while NOT typing in the field (feedback/celebrate/intro).
  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = useFarmShop.getState();
      if (e.key === "Escape") { st.exit(); return; }
      const inField = e.target && /input|textarea/i.test(e.target.tagName || "");
      if (inField) return;
      if (e.key !== "Enter") return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "feedback" || st.status === "celebrate") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  if (status === "idle") return null;

  const unit = round ? round.answerUnit : "$";
  const isChain = round && round.chainId;

  function onFieldKey(e) {
    if (e.key === "Enter") { e.preventDefault(); useFarmShop.getState().check(); }
    else if (e.key === "Escape") { e.preventDefault(); useFarmShop.getState().exit(); }
  }

  return (
    <div className="farm-challenge-panel">
      {status === "intro" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head"><span>🏪 The Farm Shop</span></div>
          <div className="farm-challenge-line big">
            Run the market stall! Price stock, add GST, and read the <span className="fc-value">profit</span>.
          </div>
          <div className="farm-challenge-line">
            Buy at cost, set a % markup, take a rainy-day % off, add {`${10}%`} GST at the till, then work out the
            profit (or loss) as a % of cost. Type each answer and ring it up.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={(e) => { e.currentTarget.blur(); useFarmShop.getState().beginRounds(); }}>
              {kh("Open the shop! (Enter)")}
            </button>
            <button className="link-button" onClick={() => useFarmShop.getState().exit()}>Quit</button>
          </div>
        </div>
      )}

      {status === "playing" && round && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>🏪 Round {roundIndex + 1}/{SHOP_ROUNDS_PER_SET} · {score} pts</span>
            <button className="link-button" onClick={() => useFarmShop.getState().exit()}>Quit</button>
          </div>
          <div className="shop-tag">
            {round.product.emoji} {KIND_LABEL[round.kind] || "Shop"}
            {isChain && <span className="shop-step"> · market day, step {round.chainStep}/{round.chainSteps}</span>}
          </div>
          <div className="farm-challenge-line big">{round.prompt}</div>
          <div className="shop-answer-row">
            {unit === "$" && <span className="shop-adorn">$</span>}
            <input
              ref={fieldRef}
              className="shop-input"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={unit === "$" ? "0.00" : unit === "%" ? "0" : "0"}
              value={input}
              onChange={(e) => useFarmShop.getState().setInput(e.target.value)}
              onKeyDown={onFieldKey}
            />
            {unit === "%" && <span className="shop-adorn">%</span>}
            {unit === "items" && <span className="shop-adorn">items</span>}
            {/* A loss is typed as a negative %, but a phone / iPad decimal
                keypad has no minus key — so a ± button flips the sign. */}
            {unit === "%" && (
              <button
                className="plank-piece-btn shop-sign-btn"
                title="Make it negative (a loss) / positive"
                aria-label="Change sign"
                onClick={(e) => {
                  e.currentTarget.blur();
                  const v = (input || "").trim();
                  useFarmShop.getState().setInput(v.startsWith("-") ? v.slice(1) : `-${v}`);
                }}
              >
                ±
              </button>
            )}
            <button className="primary-button" onClick={(e) => { e.currentTarget.blur(); useFarmShop.getState().check(); }}>
              {kh("Ring it up! (Enter)")}
            </button>
          </div>
        </div>
      )}

      {status === "celebrate" && round && (
        <RoundCelebrate useStore={useFarmShop} ms={CELEBRATE_MS} working={round.working || round.reason}>
          {round.answerStr}!
        </RoundCelebrate>
      )}

      {status === "feedback" && round && result && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-verdict bad">
            Not quite — the answer is {round.answerStr}. +0 pts
          </div>
          <div className="farm-challenge-prompt">{round.reason}</div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={(e) => { e.currentTarget.blur(); useFarmShop.getState().next(); }}>
              {roundIndex + 1 < SHOP_ROUNDS_PER_SET ? kh("Next customer (Enter)") : kh("Finish (Enter)")}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head"><span>🏪 The Farm Shop — closed up!</span></div>
          <div className="farm-challenge-prompt">
            You took {score} points at the market. Best so far: {Math.max(bestScore, score)} points.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => useFarmShop.getState().start()}>Open again</button>
            <button className="link-button" onClick={() => useFarmShop.getState().exit()}>Back to the farm</button>
          </div>
        </div>
      )}
    </div>
  );
}
