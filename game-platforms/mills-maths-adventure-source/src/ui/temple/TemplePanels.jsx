import React, { useEffect, useMemo, useRef, useState } from "react";

import { useTempleTables, useTempleUI, practiceProgress } from "../../game/temple/templeStore.js";
import {
  STATIONS, stationOf, stationIndex, FAMILY, targetsFor, medalFor, nextMedalGap, readTablesBest, allBests,
  stationOpen, nextStation, readFactStats, factState, squareSummary, dayNumber, tableFacts, factKey, stationPool,
  strategyFor, dueFacts, ROUND_SECONDS, WARMUP_SECONDS, TABLE_ORDER, isFluent,
} from "../../data/temple/templeTables.js";
import { TEMPLE_STONE, DESERT_REGION_ID } from "../../data/desert/desertLayout.js";
import { useSession } from "../../game/sessionStore.js";
import { useUI } from "../effects/uiStore.js";
import { isDemoActive, useDemo } from "../../game/demo/demoStore.js";
import { isAdminMode } from "../../data/adminMode.js";
import DemoButton, { DemoRound } from "../demo/DemoButton.jsx";
import { HostFace } from "../demo/DemoOverlay.jsx";
import { Bi } from "../../i18n/i18n.jsx";

/**
 * TIMESTABLE TEMPLE — every card the temple shows (2026-11-08):
 *   the STATION card   targets, best, the station's facts, Practise / Go for gold
 *   the ROUND          3·2·1, the question, a big keypad, the clock + medal track
 *   the RESULTS        right, the medal, the facts fast / slow / missed
 *   the HUB (Dash)     next station + the way, the daily warm-up, all 15 stations
 *   the SQUARE         the 12 × 12 times-table square, lit fact by fact
 * Docked at the bottom like every world's challenge card (the stone stays in
 * view above); on a sideways phone the question and keypad sit side by side.
 */

const HOST = "Dash";
const MEDAL_ICON = { bronze: "🥉", silver: "🥈", gold: "🥇" };

export function stationWaypoint(key) {
  const st = stationOf(key);
  const stone = TEMPLE_STONE[key];
  if (!st || !stone) return null;
  return {
    regionId: DESERT_REGION_ID, x: stone.position[0] + Math.sin(stone.rotationY) * 1.8, z: stone.position[1] + Math.cos(stone.rotationY) * 1.8,
    label: `${st.name} — ${FAMILY[st.family].where}`, icon: "🏺", arrive: 2.8,
  };
}
function showTheWay(key) {
  const wp = stationWaypoint(key);
  if (wp) useUI.getState().setWaypoint(wp);
  useTempleTables.getState().exit();
  useTempleUI.getState().close();
}

/** "×7" / "⚓" etc. in a little round badge. */
function StationBadge({ st, medal, locked, small }) {
  const fam = FAMILY[st.family];
  return (
    <span className={`tt-badge${small ? " small" : ""}${locked ? " locked" : ""}${medal ? ` m-${medal}` : ""}`} style={{ "--fam": fam.color }}>
      <span className="tt-badge-face">{st.kind === "table" ? st.icon : st.icon}</span>
      {medal && <span className="tt-badge-medal">{MEDAL_ICON[medal]}</span>}
      {locked && <span className="tt-badge-lock">🔒</span>}
    </span>
  );
}

/** Bronze / silver / gold targets, the earned one lit. */
function Targets({ st, best }) {
  const t = targetsFor(st);
  const m = medalFor(st, best);
  return (
    <div className="tt-targets">
      {["bronze", "silver", "gold"].map((id) => (
        <span key={id} className={`tt-target ${id}${m && ["bronze", "silver", "gold"].indexOf(m.id) >= ["bronze", "silver", "gold"].indexOf(id) ? " got" : ""}`}>
          <i>{MEDAL_ICON[id]}</i>
          <b>{t[id]}</b>
        </span>
      ))}
      <span className="tt-targets-note"><Bi>right in 90 seconds</Bi></span>
    </div>
  );
}

/** The live medal track: a bar filling towards gold, the three marks on it. */
function MedalTrack({ st, score }) {
  const t = targetsFor(st);
  const max = Math.ceil(t.gold * 1.12);
  const pct = (n) => `${Math.min(100, (n / max) * 100)}%`;
  const m = medalFor(st, score);
  return (
    <div className="tt-track" aria-label={`${score} right`}>
      <div className="tt-track-fill" style={{ width: pct(score), background: m ? m.color : "#7fb3e6" }} />
      {["bronze", "silver", "gold"].map((id) => (
        <span key={id} className={`tt-track-mark${score >= t[id] ? " hit" : ""}`} style={{ left: pct(t[id]) }}>
          <i>{MEDAL_ICON[id]}</i>
        </span>
      ))}
    </div>
  );
}

/** A table station's twelve facts (or a mix's tables) as little chips. */
function FactsStrip({ st, green = null, compact = false }) {
  const stats = useMemo(() => readFactStats(), [useTempleUI((s) => s.version)]); // eslint-disable-line react-hooks/exhaustive-deps
  const today = dayNumber();
  if (st.kind === "table") {
    return (
      <div className={`tt-strip${compact ? " compact" : ""}`}>
        {tableFacts(st.table).map((f) => {
          const fs = factState(stats[f.key], today);
          const g = green ? Boolean(green[f.key]) : false;
          return (
            <span key={f.key} className={`tt-chip s-${green ? (g ? "green" : "todo") : fs.state}`} title={`${f.a} × ${f.b} = ${f.ans}`}>
              ×{f.b}
            </span>
          );
        })}
      </div>
    );
  }
  // A mix: how many of each table's facts are fluent / green.
  const tables = st.kind === "grand" ? TABLE_ORDER : [...st.newTables, ...st.reviewTables];
  return (
    <div className={`tt-mixbars${compact ? " compact" : ""}`}>
      {tables.map((t) => {
        const facts = tableFacts(t);
        const have = facts.filter((f) => (green ? green[f.key] : isFluent(stats[f.key]))).length;
        return (
          <span key={t} className="tt-mixbar" title={`${t}s: ${have} / 12`}>
            <b>{t}s</b>
            <i><em style={{ width: `${(have / 12) * 100}%` }} /></i>
          </span>
        );
      })}
    </div>
  );
}

function Close({ onClick, label = "Close" }) {
  return (
    <button className="tt-close" aria-label={label} title={label} onClick={(e) => { e.currentTarget.blur(); onClick(); }}>✕</button>
  );
}

// ---------------------------------------------------------------------------
// The station card
// ---------------------------------------------------------------------------
function StationCard() {
  const station = useTempleTables((s) => s.station);
  useTempleUI((s) => s.version);
  const st = stationOf(station);
  if (!st) return null;
  const i = stationIndex(st.key);
  const fam = FAMILY[st.family];
  const best = readTablesBest(st.key);
  const medal = medalFor(st, best);
  const admin = isAdminMode();
  const open = stationOpen(st.key, allBests(), admin);
  const prev = STATIONS[i - 1];
  const T = useTempleTables.getState();
  return (
    <div className="farm-challenge-card tt-card tt-station" style={{ "--fam": fam.color }}>
      <Close onClick={() => T.exit()} />
      <div className="tt-head">
        <StationBadge st={st} medal={medal ? medal.id : null} locked={!open} />
        <div className="tt-head-text">
          <span className="tt-kicker">{fam.icon} <Bi en={fam.name}>{fam.name}</Bi> · <Bi>Station</Bi> {i + 1}/15</span>
          <span className="tt-title"><Bi en={st.name}>{st.name}</Bi></span>
        </div>
        {open && <DemoButton demoKey="tables" />}
      </div>
      {!open ? (
        <div className="tt-locked">
          <p>🔒 <Bi>Win a bronze on the station before this one to open it:</Bi> <b>{prev.name}</b></p>
          <button className="primary-button" onClick={() => showTheWay(prev.key)}>📍 <Bi>Show me the way</Bi></button>
        </div>
      ) : (
        <>
          <Targets st={st} best={best} />
          <div className="tt-best">
            {best > 0
              ? <><Bi>Your best</Bi>: <b>{best}</b>{medal ? <> {MEDAL_ICON[medal.id]}</> : null}{(() => { const g = nextMedalGap(st, best); return g ? <span className="tt-gap"> · {g.need} <Bi>more for</Bi> {MEDAL_ICON[g.id]}</span> : <span className="tt-gap"> · <Bi>Gold — brilliant!</Bi></span>; })()}</>
              : <Bi>No score yet — practise first, or go for it!</Bi>}
          </div>
          <FactsStrip st={st} />
          <div className="tt-buttons">
            <button className="tt-btn tt-practise" onClick={(e) => { e.currentTarget.blur(); T.beginPractice(); }}>
              <span>🧘</span><span><Bi>Practise</Bi><small><Bi>No clock</Bi></small></span>
            </button>
            <button className="tt-btn tt-go" autoFocus onClick={(e) => { e.currentTarget.blur(); T.beginTimed(); }}>
              <span>⏱️</span><span><Bi>Go for gold</Bi><small>{ROUND_SECONDS} <Bi>seconds</Bi></small></span>
            </button>
          </div>
          <button className="tt-link" onClick={() => { T.exit(); useTempleUI.getState().openSquare(); }}>🔢 <Bi>My times-table square</Bi></button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3 · 2 · 1
// ---------------------------------------------------------------------------
function Countdown() {
  const count = useTempleTables((s) => s.count);
  const mode = useTempleTables((s) => s.mode);
  const station = useTempleTables((s) => s.station);
  const st = stationOf(station);
  useEffect(() => {
    const t = setInterval(() => useTempleTables.getState().countDown(), 720);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="farm-challenge-card tt-card tt-count">
      <span className="tt-kicker">{mode === "warmup" ? <>⚡ <Bi>Temple Warm-up</Bi></> : st ? st.name : ""}</span>
      <span key={count} className="tt-count-n">{count}</span>
      <span className="tt-count-tip"><Bi>Answers go in by themselves — no need to press Enter.</Bi></span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The round
// ---------------------------------------------------------------------------
const PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"];
function Keypad() {
  const T = useTempleTables.getState();
  return (
    <div className="tt-pad" role="group" aria-label="Number keys">
      {PAD.map((k) => (
        <button
          key={k}
          className={`tt-key${k === "⌫" ? " back" : k === "✓" ? " enter" : ""}`}
          aria-label={k === "⌫" ? "Delete" : k === "✓" ? "Enter" : k}
          onPointerDown={(e) => {
            // Pointer-down, not click: quicker on a tablet and no double-tap zoom.
            e.preventDefault();
            if (k === "⌫") T.back();
            else if (k === "✓") T.submit();
            else T.press(k);
          }}
          onClick={(e) => {
            // Keyboard / demo clicks (pointer-down already handled a real tap).
            if (e.detail !== 0) return;
            if (k === "⌫") T.back();
            else if (k === "✓") T.submit();
            else T.press(k);
          }}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

function Clock() {
  const timeLeft = useTempleTables((s) => s.timeLeft);
  const mode = useTempleTables((s) => s.mode);
  const total = (mode === "warmup" ? WARMUP_SECONDS : ROUND_SECONDS) * 1000;
  const secs = Math.ceil(timeLeft / 1000);
  return (
    <div className={`tt-clock${secs <= 10 ? " low" : ""}`}>
      <span className="tt-clock-n">⏱ {secs}s</span>
      <i><em style={{ width: `${(timeLeft / total) * 100}%` }} /></i>
    </div>
  );
}

function Round() {
  const S = useTempleTables();
  const T = useTempleTables.getState();
  const st = stationOf(S.station);
  const q = S.rounds[S.roundIndex];
  const demo = useDemo((d) => d.active);
  const [readyHidden, setReadyHidden] = useState(false);

  // The clock (frozen in practice + during a demo).
  useEffect(() => {
    if (S.mode === "practice") return undefined;
    let raf = 0;
    let last = performance.now();
    const loop = (t) => {
      const dt = Math.min(250, t - last);
      last = t;
      useTempleTables.getState().tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [S.mode]);

  // Right! — a blink, then the next question.
  useEffect(() => {
    if (S.status !== "celebrate") return undefined;
    const t = setTimeout(() => useTempleTables.getState().next(), S.mode === "practice" ? 420 : 190);
    return () => clearTimeout(t);
  }, [S.status, S.roundIndex, S.mode]);

  if (!q) return null;
  const prog = S.mode === "practice" && st ? practiceProgress(st.key, S.green) : null;
  const fix = S.status === "fix";
  const good = S.status === "celebrate";
  const fam = st ? FAMILY[st.family] : FAMILY.summit;
  return (
    <div className={`farm-challenge-card tt-card tt-round${fix ? " is-fix" : ""}`} style={{ "--fam": fam.color }}>
      <div className="tt-round-head">
        <span className="tt-round-tag">
          <DemoRound>
            {S.mode === "practice" ? <>🧘 <Bi>Practice</Bi></> : S.mode === "warmup" ? <>⚡ <Bi>Warm-up</Bi></> : <>{st ? st.name : ""}</>}
          </DemoRound>
        </span>
        <span className="tt-score">✓ {S.score}</span>
        <DemoButton demoKey="tables" />
        <Close label="Stop" onClick={() => (S.mode === "practice" ? T.finish() : T.toMenu())} />
      </div>
      {S.mode !== "practice" && <Clock />}
      {S.mode === "timed" && st && <MedalTrack st={st} score={S.score} />}
      <div className="tt-play">
        <div className="tt-q-wrap">
          <div className={`tt-q${good ? " good" : ""}${fix ? " bad" : ""}`} key={S.roundIndex}>
            <span className="tt-q-text">{q.a} × {q.b} =</span>
            <span className={`tt-answer${S.slip && S.slip.wobble ? " wobble" : ""}`} key={`${S.roundIndex}-${S.slip ? S.slip.wobble : 0}`}>
              {S.typed || (fix ? "" : " ")}
              <i className="tt-caret" />
            </span>
          </div>
          {fix && (
            <div className="tt-fix">
              <div className="tt-fix-ans">{q.a} × {q.b} = <b>{q.ans}</b></div>
              <div className="tt-fix-how">💡 {strategyFor(q.a, q.b)}</div>
              <div className="tt-fix-do"><Bi>Type the answer to keep going</Bi> →</div>
            </div>
          )}
          {prog && !fix && (
            <div className="tt-practice">
              <FactsStrip st={st} green={S.green} compact />
              {prog.ready && !readyHidden && !demo ? (
                <div className="tt-ready">
                  <span>🌟 <Bi>Looks like you're ready — go for gold?</Bi></span>
                  <button className="tt-btn tt-go small" onClick={(e) => { e.currentTarget.blur(); T.beginTimed(); }}>⏱️ <Bi>Go for gold</Bi></button>
                  <button className="tt-link" onClick={() => setReadyHidden(true)}><Bi>Keep practising</Bi></button>
                </div>
              ) : (
                <div className="tt-practice-row">
                  <span className="tt-practice-n">{prog.have}/{prog.total} <Bi>facts right first time</Bi></span>
                  <button className="tt-link" onClick={() => T.beginTimed()}>⏱️ <Bi>I'm ready</Bi></button>
                </div>
              )}
            </div>
          )}
        </div>
        <Keypad />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------
function Results() {
  const r = useTempleTables((s) => s.result);
  const station = useTempleTables((s) => s.station);
  const mode = useTempleTables((s) => s.mode);
  const T = useTempleTables.getState();
  const st = stationOf(station);
  if (!r) return null;
  const missed = r.facts.filter((f) => f.verdict === "missed");
  const slow = r.facts.filter((f) => f.verdict === "slow");
  const fast = r.facts.filter((f) => f.verdict === "fast");
  const gap = st && mode === "timed" ? nextMedalGap(st, r.score) : null;
  const opened = r.opened ? stationOf(r.opened) : null;
  const fam = st ? FAMILY[st.family] : FAMILY.summit;
  return (
    <div className="farm-challenge-card tt-card tt-results" style={{ "--fam": fam.color }}>
      <Close onClick={() => T.exit()} />
      <div className="tt-res-top">
        {r.medal ? <span className="tt-res-medal">{MEDAL_ICON[r.medal]}</span> : <span className="tt-res-medal dim">{mode === "practice" ? "🧘" : mode === "warmup" ? "⚡" : "⏱️"}</span>}
        <div>
          <span className="tt-kicker">{mode === "warmup" ? <Bi>Temple Warm-up</Bi> : st ? st.name : ""}{mode === "practice" ? <> · <Bi>Practice</Bi></> : null}</span>
          <span className="tt-res-n"><b>{r.score}</b> <Bi>right</Bi>{r.wrongs ? <small> · {r.wrongs} <Bi>slips</Bi></small> : null}</span>
          {mode === "timed" && (
            <span className="tt-res-sub">
              {r.newBest && r.bestBefore > 0 ? <>⭐ <Bi>New best!</Bi> </> : null}
              {gap ? <>{gap.need} <Bi>more for</Bi> {MEDAL_ICON[gap.id]} ({gap.target})</> : <Bi>Gold — brilliant!</Bi>}
              {r.coins ? <> · 🪙 +{r.coins}</> : null}
            </span>
          )}
          {mode === "warmup" && r.coins ? <span className="tt-res-sub">🪙 +{r.coins}</span> : null}
        </div>
      </div>
      {opened && (
        <div className="tt-opened">
          🔓 <b>{opened.name}</b> <Bi>is open!</Bi>
          <button className="primary-button" onClick={() => showTheWay(opened.key)}>📍 <Bi>Show me the way</Bi></button>
        </div>
      )}
      <div className="tt-res-facts">
        {missed.length > 0 && (
          <div className="tt-res-row missed"><span className="tt-res-lbl">❌ <Bi>Missed</Bi></span>{missed.map((f) => <span key={f.key} className="tt-fchip">{f.a} × {f.b} = {f.ans}</span>)}</div>
        )}
        {slow.length > 0 && (
          <div className="tt-res-row slow"><span className="tt-res-lbl">🐢 <Bi>Slow</Bi></span>{slow.map((f) => <span key={f.key} className="tt-fchip">{f.a} × {f.b} = {f.ans}</span>)}</div>
        )}
        {fast.length > 0 && (
          <div className="tt-res-row fast"><span className="tt-res-lbl">⚡ <Bi>Fast</Bi></span><span className="tt-fchip">{fast.length} <Bi>facts</Bi></span></div>
        )}
      </div>
      <div className="tt-buttons">
        {mode === "warmup" ? (
          <button className="tt-btn tt-go" autoFocus onClick={() => { T.exit(); useTempleUI.getState().openSquare(); }}>🔢 <Bi>My square</Bi></button>
        ) : (
          <>
            <button className="tt-btn tt-practise" onClick={() => T.beginPractice()}>🧘 <Bi>Practise</Bi></button>
            <button className="tt-btn tt-go" autoFocus onClick={() => T.beginTimed()}>⏱️ <Bi>{mode === "practice" ? "Go for gold" : "Try again"}</Bi></button>
          </>
        )}
        <button className="tt-btn tt-done" onClick={() => T.exit()}><Bi>Done</Bi></button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The temple card (station → round → results), keys + leaving the world.
// ---------------------------------------------------------------------------
export function TempleTablesPanel() {
  const status = useTempleTables((s) => s.status);
  const region = useSession((s) => s.currentRegionId);

  // Leaving the desert closes the card.
  useEffect(() => {
    if (region !== DESERT_REGION_ID && useTempleTables.getState().status !== "idle") useTempleTables.getState().exit();
  }, [region]);

  // Keys: digits / Backspace / Enter in a round; Enter + Esc on the cards.
  useEffect(() => {
    if (status === "idle") return undefined;
    const onKey = (e) => {
      if (isDemoActive()) return;
      const T = useTempleTables.getState();
      const s = T.status;
      const tag = (e.target && e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (s === "play" || s === "fix" || s === "celebrate") {
        if (/^[0-9]$/.test(e.key)) { e.preventDefault(); e.stopPropagation(); T.press(e.key); return; }
        if (e.key === "Backspace") { e.preventDefault(); T.back(); return; }
        if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); T.submit(); return; }
        if (e.key === "Escape") { e.preventDefault(); if (T.mode === "practice") T.finish(); else T.toMenu(); }
        return;
      }
      if (s === "countdown" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); T.go(); return; }
      if (e.key === "Escape") { e.preventDefault(); T.exit(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [status]);

  if (status === "idle") return null;
  return (
    <div className="farm-challenge-panel snow-dock tt-panel">
      {status === "menu" && <StationCard />}
      {status === "countdown" && <Countdown />}
      {(status === "play" || status === "fix" || status === "celebrate") && <Round />}
      {status === "results" && <Results />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The hub (Dash): next station, the warm-up, every station.
// ---------------------------------------------------------------------------
function Hub() {
  useTempleUI((s) => s.version);
  const UI = useTempleUI.getState();
  const bests = allBests();
  const nxt = nextStation(bests);
  const stats = readFactStats();
  const today = dayNumber();
  const sum = squareSummary(stats, today);
  const due = dueFacts(stats, today).length;
  const allGold = STATIONS.every((s) => (medalFor(s, bests[s.key] || 0) || {}).id === "gold");
  const families = ["anchors", "doubling", "threes", "sevens", "summit"];
  return (
    <div className="farm-challenge-card tt-card tt-hub">
      <Close onClick={() => UI.close()} />
      <div className="tt-head">
        <HostFace host={HOST} size={54} />
        <div className="tt-head-text">
          <span className="tt-kicker">Dash · <Bi>Timestable Temple</Bi></span>
          <span className="tt-title">{allGold ? <Bi>Every station is gold! 🏆</Bi> : <Bi>Where to next?</Bi>}</span>
        </div>
      </div>
      {nxt && (
        <div className="tt-hub-next" style={{ "--fam": FAMILY[nxt.family].color }}>
          <StationBadge st={nxt} medal={(medalFor(nxt, bests[nxt.key] || 0) || {}).id} />
          <div>
            <b><Bi en={nxt.name}>{nxt.name}</Bi></b>
            <small><Bi en={FAMILY[nxt.family].where}>{FAMILY[nxt.family].where}</Bi></small>
          </div>
          <button className="primary-button" autoFocus onClick={() => showTheWay(nxt.key)}>📍 <Bi>Show me the way</Bi></button>
        </div>
      )}
      <div className="tt-hub-row">
        <div className="tt-hub-box">
          <b>⚡ <Bi>Temple Warm-up</Bi></b>
          <small>{sum.seen ? <>{WARMUP_SECONDS}s · {due} <Bi>facts due today</Bi></> : <Bi>Play a station first — your warm-up builds itself from your facts.</Bi>}</small>
          <button className="tt-btn tt-go small" disabled={!sum.seen} onClick={() => useTempleTables.getState().beginWarmup()}><Bi>Start</Bi></button>
        </div>
        <div className="tt-hub-box">
          <b>🔢 <Bi>My times-table square</Bi></b>
          <small>{sum.fluent} / {sum.total} <Bi>facts fluent</Bi></small>
          <button className="tt-btn tt-practise small" onClick={() => UI.openSquare()}><Bi>Open</Bi></button>
        </div>
      </div>
      <div className="tt-path">
        {families.map((fid) => (
          <div key={fid} className="tt-path-fam" style={{ "--fam": FAMILY[fid].color }}>
            <span className="tt-path-name">{FAMILY[fid].icon} <Bi en={FAMILY[fid].name}>{FAMILY[fid].name}</Bi></span>
            <span className="tt-path-stones">
              {STATIONS.filter((s) => s.family === fid).map((s) => {
                const m = medalFor(s, bests[s.key] || 0);
                const open = stationOpen(s.key, bests, isAdminMode());
                return (
                  <button key={s.key} className={`tt-path-btn${nxt && nxt.key === s.key ? " is-next" : ""}`} title={`${s.name}${open ? "" : " (locked)"}`} onClick={() => showTheWay(s.key)}>
                    <StationBadge st={s} medal={m ? m.id : null} locked={!open} small />
                  </button>
                );
              })}
            </span>
          </div>
        ))}
      </div>
      <p className="tt-hub-how"><Bi>Win a bronze on a station to open the next. Tap a stone to set a waypoint.</Bi></p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The times-table square
// ---------------------------------------------------------------------------
const LEGEND = [
  ["fluent", "Fluent — fast on two different days"],
  ["learning", "Getting there"],
  ["missed", "Missed last time"],
  ["unseen", "Not tried yet"],
];
function Square() {
  useTempleUI((s) => s.version);
  const UI = useTempleUI.getState();
  const stats = readFactStats();
  const today = dayNumber();
  const sum = squareSummary(stats, today);
  const [pick, setPick] = useState(null);
  const p = pick ? stats[factKey(pick[0], pick[1])] : null;
  const pState = pick ? factState(p, today) : null;
  return (
    <div className="farm-challenge-card tt-card tt-square">
      <Close onClick={() => UI.close()} />
      <div className="tt-head">
        <span className="tt-badge"><span className="tt-badge-face">🔢</span></span>
        <div className="tt-head-text">
          <span className="tt-kicker"><Bi>Timestable Temple</Bi></span>
          <span className="tt-title"><Bi>My times-table square</Bi></span>
        </div>
        <span className="tt-sq-count"><b>{sum.fluent}</b>/{sum.total}<small><Bi>fluent</Bi></small></span>
      </div>
      <div className="tt-grid" role="grid" aria-label="Times-table square">
        <span className="tt-cell hd corner">×</span>
        {Array.from({ length: 12 }, (_, i) => <span key={`h${i}`} className="tt-cell hd">{i + 1}</span>)}
        {Array.from({ length: 12 }, (_, r) => (
          <React.Fragment key={`r${r}`}>
            <span className="tt-cell hd">{r + 1}</span>
            {Array.from({ length: 12 }, (_, c) => {
              const a = r + 1, b = c + 1;
              const fs = factState(stats[factKey(a, b)], today);
              const on = pick && pick[0] === a && pick[1] === b;
              return (
                <button key={c} className={`tt-cell s-${fs.state}${fs.due && fs.state !== "unseen" ? " due" : ""}${on ? " on" : ""}`} onClick={() => setPick([a, b])} aria-label={`${a} times ${b}`}>
                  {fs.state === "unseen" ? "" : a * b}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="tt-sq-info">
        {pick ? (
          <span>
            <b>{pick[0]} × {pick[1]} = {pick[0] * pick[1]}</b> ·{" "}
            {pState.state === "unseen" ? <Bi>Not tried yet</Bi> : <>{p.r}/{p.n} <Bi>right</Bi>{p.ms ? ` · ${(p.ms / 1000).toFixed(1)}s` : ""} · <Bi en={LEGEND.find((l) => l[0] === pState.state)[1]}>{LEGEND.find((l) => l[0] === pState.state)[1]}</Bi>{pState.due && pState.state !== "unseen" ? <> · ✨ <Bi>due for review</Bi></> : null}</>}
          </span>
        ) : (
          <span className="tt-legend">
            {LEGEND.map(([id, label]) => <span key={id}><i className={`tt-dot s-${id}`} /> <Bi en={label}>{label}</Bi></span>)}
            <span><i className="tt-dot due" /> <Bi>Due for review</Bi></span>
          </span>
        )}
      </div>
      <div className="tt-buttons">
        <button className="tt-btn tt-go" disabled={!sum.seen} onClick={() => useTempleTables.getState().beginWarmup()}>⚡ <Bi>Warm-up</Bi> <small>{sum.due} <Bi>due</Bi></small></button>
        <button className="tt-btn tt-done" onClick={() => UI.openHub()}>🐫 <Bi>Next station</Bi></button>
      </div>
    </div>
  );
}

export function TempleHubPanels() {
  const open = useTempleUI((s) => s.open);
  const region = useSession((s) => s.currentRegionId);
  useEffect(() => {
    if (region !== DESERT_REGION_ID && useTempleUI.getState().open) useTempleUI.getState().close();
  }, [region]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); useTempleUI.getState().close(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div className="farm-challenge-panel snow-dock tt-panel">
      {open === "hub" ? <Hub /> : <Square />}
    </div>
  );
}

export default function TemplePanels() {
  return (
    <>
      <TempleTablesPanel />
      <TempleHubPanels />
    </>
  );
}

// Re-exported for the checks.
export { stationPool };
