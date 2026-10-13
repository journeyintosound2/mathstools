import React, { useEffect, useState } from "react";

import { useProgress } from "../../progress/store.js";
import { useSession } from "../../game/sessionStore.js";
import { useUI } from "../effects/uiStore.js";
import { useFarmChallengeActive } from "../../game/farmChallengeActive.js";
import { useJourney, currentCoach, STEP_SKIP_AFTER_MS } from "../../game/journeyStore.js";
import { TRAINING_STEPS } from "../../data/training.js";
import { JOURNEY_FRIENDS, JOURNEY_WORLDS } from "../../data/journey.js";
import { Bi } from "../../i18n/i18n.jsx";

/**
 * THE JOURNEY COACH (2026-10-13) — Mills' training on Harbour Green and
 * each world's first-visit tour (data/training.js; the engine that ticks the
 * steps off is game/journeyStore.js).
 *
 *   CoachCard   the welcome / "training complete" / world-welcome cards
 *               (centred, the student chooses)
 *   CoachStep   the slim live step card at the top of the screen: what to
 *               do (keyboard or touch wording), a progress meter, the step
 *               dots, "Skip this step" after a while and "Skip training".
 *               It ticks itself off when the student actually DOES it.
 */
function useCoach() {
  const journey = useProgress((s) => s.journey);
  const regionId = useSession((s) => s.currentRegionId);
  return currentCoach({ journey }, regionId);
}

/** Hide the coach while something else has the screen. */
function useCoachHidden() {
  const phase = useSession((s) => s.phase);
  const enc = useSession((s) => s.activeEncounterId);
  const busy = useFarmChallengeActive();
  const ui = useUI((s) => s.mapOpen || Boolean(s.wallView) || s.questLogOpen || s.resultsOpen || s.howToOpen ||
    s.pilotOpen || s.cloudLoginOpen || s.trophyOpen || s.farmTrophyOpen || s.snowTrophyOpen || s.magmaTrophyOpen || s.jungleTrophyOpen);
  const celebrating = useJourney((s) => Boolean(s.celebrate));
  return { hidden: phase !== "playing" || Boolean(enc) || busy || ui, celebrating };
}

/** The live step card (lives in the HUD's top-centre stack). */
export function CoachStep({ compact = false }) {
  const cur = useCoach();
  const { hidden } = useCoachHidden();
  const touch = useUI((s) => s.touchMode);
  const frac = useJourney((s) => s.frac);
  const base = useJourney((s) => s.base);
  const flash = useJourney((s) => s.flash);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const showFlash = flash && now - flash.at < 1600;
  if (hidden || !cur || cur.card || !cur.step) {
    return showFlash && !hidden ? <FlashCard flash={flash} compact={compact} /> : null;
  }
  const s = cur.step;
  const training = cur.scope === "training";
  const kicker = training ? "Training" : `${(JOURNEY_WORLDS.find((w) => w.regionId === cur.regionId) || {}).name || "World"} tour`;
  const stepNo = training ? cur.index + 1 : cur.index; // (the intro's card is step 0)
  const stepOf = training ? cur.total : cur.total - 1;
  const canSkipStep = base && base.key === cur.key && now - base.t > STEP_SKIP_AFTER_MS;
  const J = useJourney.getState();

  return (
    <div className={`coach${training ? " is-training" : " is-tour"}${compact ? " is-compact" : " is-side"}`} role="status" aria-live="polite">
      {showFlash && <div className="coach-flash" key={flash.at}>✓ <Bi>{flash.title}</Bi></div>}
      <div className="coach-top">
        <span className="coach-kicker">
          <Bi>{kicker}</Bi> <b>{stepNo} / {stepOf}</b>
        </span>
        <button className="coach-skip-all" onClick={(e) => { e.currentTarget.blur(); training ? J.skipTraining() : J.closeIntro(cur.regionId); }}>
          {training ? <Bi>Skip training</Bi> : <Bi>End tour</Bi>}
        </button>
      </div>
      <div className="coach-main">
        <span className="coach-icon" aria-hidden="true">{s.icon}</span>
        <div className="coach-text">
          <div className="coach-title"><Bi>{s.title}</Bi></div>
          <div className="coach-do"><Bi>{touch ? s.touch : s.key}</Bi></div>
        </div>
      </div>
      {(s.meter === "m" || s.meter === "x" || s.meter === "turn") && (
        <div className="coach-meter" aria-hidden="true"><span style={{ width: `${Math.round(frac * 100)}%` }} /></div>
      )}
      <div className="coach-foot">
        {training && (
          <span className="coach-dots" aria-hidden="true">
            {TRAINING_STEPS.map((t, i) => (
              <span key={t.id} className={i < cur.index ? "done" : i === cur.index ? "now" : ""} />
            ))}
          </span>
        )}
        {canSkipStep && (
          <button className="coach-skip-step" onClick={(e) => { e.currentTarget.blur(); J.advance(cur); }}>
            <Bi>Skip this step</Bi> ›
          </button>
        )}
      </div>
    </div>
  );
}

function FlashCard({ flash, compact }) {
  return (
    <div className={`coach coach-flash-only${compact ? " is-compact" : " is-side"}`} role="status" aria-live="polite">
      <div className="coach-flash" key={flash.at}>✓ <Bi>{flash.title}</Bi></div>
    </div>
  );
}

/** The centred cards: training welcome / training complete / a world's welcome. */
export function CoachCard() {
  const cur = useCoach();
  const { hidden, celebrating } = useCoachHidden();
  const profile = useProgress((s) => s.profile);
  const xp = useProgress((s) => s.xp);
  const completedMissions = useProgress((s) => s.completedMissions);
  const js = useJourney((s) => s.js);
  if (hidden || celebrating || !cur || !cur.card) return null;
  const J = useJourney.getState();

  if (cur.card === "welcome") {
    const returning = xp > 0 || (completedMissions || []).length > 0;
    return (
      <CardShell icon="🏝️" kicker={returning ? "New!" : "Welcome"} title={returning ? "The island journey" : `Welcome to Number Island${profile.name ? `, ${profile.name}` : ""}!`}>
        {returning ? (
          <>
            <p><Bi>The worlds now open one at a time, from the easiest to the hardest. Any world you've already played in stays open.</Bi></p>
            <p><Bi>Want a quick training lap? It covers the controls, the Achievements Wall and the map.</Bi></p>
          </>
        ) : (
          <>
            <p><Bi>Before your adventure starts, let's learn how to explore. It only takes a few minutes.</Bi></p>
            <p><Bi>Then Pip, Fern and Alby each have a warm-up for you. Pass all three to open the first world!</Bi></p>
          </>
        )}
        <CourseLine />
        <div className="jcard-actions">
          <button className="jbtn jbtn-go" autoFocus onClick={() => J.startTraining()}><Bi>Start training</Bi></button>
          <button className={returning ? "jbtn jbtn-quiet" : "jcard-link"} onClick={() => J.skipTraining()}>
            {returning ? <Bi>Skip training</Bi> : <Bi>Skip — I know how to play</Bi>}
          </button>
        </div>
      </CardShell>
    );
  }

  if (cur.card === "finale") {
    const friends = js ? js.friends : JOURNEY_FRIENDS.map((f) => ({ ...f, done: false }));
    return (
      <CardShell icon="🎓" kicker="Training complete" title="You're ready to explore!" reward="+20 XP · +10 coins">
        <p><Bi>Now find Pip, Fern and Alby. Each has a quick warm-up — pass all three to open the igloo gate to Snowball Sums.</Bi></p>
        <ul className="jcard-friends">
          {friends.map((f) => (
            <li key={f.id} className={f.done ? "done" : ""}>
              <span className="jcard-friend-icon" aria-hidden="true">{f.done ? "✓" : f.icon}</span>
              <span><b>{f.name}</b> <small>{f.topic}</small><small className="jcard-where">{f.where}</small></span>
            </li>
          ))}
        </ul>
        <div className="jcard-actions">
          <button className="jbtn jbtn-go" autoFocus onClick={() => J.finishTraining()}><Bi>Let's go!</Bi></button>
        </div>
      </CardShell>
    );
  }

  // A world's first-visit welcome card.
  const s = cur.step;
  return (
    <CardShell icon={s.icon} kicker="New world" title={s.title}>
      {s.lines.map((l) => <p key={l}><Bi>{l}</Bi></p>)}
      <MedalKey />
      <div className="jcard-actions">
        <button className="jbtn jbtn-go" autoFocus onClick={() => J.advance(cur)}><Bi>{s.go}</Bi></button>
        {s.skip && <button className="jbtn jbtn-quiet" onClick={() => J.closeIntro(cur.regionId)}><Bi>{s.skip}</Bi></button>}
      </div>
    </CardShell>
  );
}

function CardShell({ icon, kicker, title, reward, children }) {
  return (
    <div className="jcard-overlay">
      <div className="jcard-wrap">
        <div className="jcard-badge" aria-hidden="true">{icon}</div>
        <div className="jcard" role="dialog" aria-modal="true" aria-label={title}>
          <div className="jcard-kicker"><Bi>{kicker}</Bi></div>
          <h2 className="jcard-title"><Bi>{title}</Bi></h2>
          {reward && <div className="jcard-reward">{reward}</div>}
          <div className="jcard-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** The path of worlds, as a little row of stops (welcome card). */
function CourseLine() {
  return (
    <ol className="jcourse" aria-label="The worlds, in order">
      <li className="jcourse-stop is-start"><span aria-hidden="true">🏝️</span><small><Bi>Warm-ups</Bi></small></li>
      {JOURNEY_WORLDS.map((w) => (
        <li key={w.key} className="jcourse-stop"><span aria-hidden="true">{w.icon}</span><small><Bi>{w.tag}</Bi></small></li>
      ))}
    </ol>
  );
}

/** Bronze / silver / gold — what each medal needs. */
export function MedalKey() {
  return (
    <div className="jmedals" aria-label="Medals: bronze 50%, silver 75%, gold 100%">
      <span><i className="m-bronze">🥉</i> 50%</span>
      <span><i className="m-silver">🥈</i> 75%</span>
      <span><i className="m-gold">🥇</i> 100%</span>
    </div>
  );
}
