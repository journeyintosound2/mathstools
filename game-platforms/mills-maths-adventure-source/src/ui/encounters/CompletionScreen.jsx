import React, { useEffect, useMemo, useRef, useState } from "react";

import { useUI } from "../effects/uiStore.js";
import { cloudSaveShort } from "../../cloud/cloudMessages.js";
import { Bi } from "../../i18n/i18n.jsx";

/**
 * THE FINISH SCREEN (2026-10-13 — Jeff: "the challenge complete has too much
 * on it for a small challenge … update this to match the quality and polish
 * of the rest of the game. There are a number of clickable options that
 * aren't necessary"). Just what matters, big and bright:
 *
 *   • a medal (🏆 90%+, ⭐ a pass, 💪 not yet) with a burst of confetti on a pass
 *   • the score — a ring that fills to your %, "7 of 8 correct" + a word of praise
 *   • what you earned (XP + coins, counting up), a level-up, a finished
 *     teacher mission's badge
 *   • ONE quiet line about where it saved
 *   • ONE button: Continue — or, if you didn't pass, Try again + Not now
 *
 * (Gone: the quest-progress box, "Show teacher / Copy result", "View
 * Results", "Back to Mission Board" and the long saved-where sentences —
 * the Results Centre still has every attempt.) Enter = the main button
 * (after a moment, so a double-press can't skip it), Esc closes.
 */
function useCountUp(target, ms = 900, delay = 350) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (now) => {
      const k = Math.max(0, Math.min(1, (now - t0) / ms));
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, delay]);
  return v;
}

export default function CompletionScreen({
  title,
  band = "",
  correct = 0,
  total = 0,
  pct = 0,
  reward = {},
  missionReward = null,
  cloudStatus = null,
  passed = true,
  host = null,
  onRetry = null,
  onClose,
}) {
  const touch = useUI((s) => s.touchMode);
  // One set of chips: the challenge's rewards + a finished mission's bonus.
  const xp = useCountUp((reward.xp || 0) + ((missionReward && missionReward.rewardXP) || 0));
  const coins = useCountUp((reward.coins || 0) + ((missionReward && missionReward.rewardCoins) || 0), 900, 500);
  const mountedAt = useRef(Date.now());
  const save = cloudSaveShort(cloudStatus);
  const primary = passed || !onRetry ? onClose : onRetry;
  const medal = !passed ? "💪" : pct >= 90 ? "🏆" : "⭐";

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Enter" || e.repeat) return;
      const tag = (e.target && e.target.tagName ? e.target.tagName : "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (Date.now() - mountedAt.current < 700) return; // the press that finished the last question
      e.preventDefault();
      e.stopPropagation();
      primary();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [primary, onClose]);

  const confetti = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    left: (i * 41) % 100, delay: (i % 6) * 0.09, hue: [44, 199, 340, 140, 18, 270][i % 6], rot: (i * 47) % 360,
  })), []);

  return (
    <div className={`modal-card fincard ${passed ? "is-pass" : "is-retry"}`} style={host && host.color ? { "--qc": host.color } : undefined}
      role="dialog" aria-modal="true" aria-label={title}>
      {passed && (
        <div className="fin-confetti" aria-hidden="true">
          {confetti.map((c, i) => (
            <i key={i} style={{ left: `${c.left}%`, animationDelay: `${c.delay}s`, background: `hsl(${c.hue} 90% 58%)`, transform: `rotate(${c.rot}deg)` }} />
          ))}
        </div>
      )}
      <button className="fin-close" onClick={onClose} title="Close" aria-label="Close">✕</button>

      <div className="fin-medal" aria-hidden="true">
        <span className="fin-medal-rays" />
        <span className="fin-medal-face">{medal}</span>
      </div>

      <h2 className="fin-title"><Bi>{title}</Bi></h2>

      <div className="fin-score">
        <span className="fin-ring" style={{ "--p": Math.max(0, Math.min(1, pct / 100)) }} aria-hidden="true">
          <span className="fin-ring-in"><b>{pct}%</b></span>
        </span>
        <span className="fin-score-text">
          <span className="fin-score-main"><b>{correct} / {total}</b> <Bi block={false}>correct</Bi></span>
          {band && <small><Bi block={false}>{band}</Bi></small>}
        </span>
      </div>

      <div className="fin-rewards">
        <span className="fin-chip fin-xp" style={{ animationDelay: "0.25s" }}>+{xp} <small>XP</small></span>
        <span className="fin-chip fin-coins" style={{ animationDelay: "0.4s" }}>+{coins} <span aria-hidden="true">🪙</span></span>
      </div>

      {reward.leveledUp && (
        <div className="fin-level"><span aria-hidden="true">⭐</span> <Bi block={false}>Level up!</Bi> <b className="fin-level-n">LV {reward.newLevel}</b></div>
      )}

      {missionReward && (missionReward.badge || missionReward.teacher) && (
        <div className="fin-mission">
          <span className="fin-mission-icon" aria-hidden="true">{missionReward.badge ? missionReward.badge.icon : "🎯"}</span>
          <span>
            <b><Bi block={false}>Mission complete!</Bi></b>
            {missionReward.badge && <small>{missionReward.badge.badgeName}</small>}
          </span>
        </div>
      )}

      {!passed && <p className="fin-retry-note"><Bi>You need 60% to pass — have another go!</Bi></p>}

      <div className="fin-actions">
        {!passed && onRetry && (
          <button className="fin-btn fin-btn-quiet" onClick={onClose}><Bi block={false}>Not now</Bi></button>
        )}
        <button className="fin-btn fin-btn-go" onClick={primary}>
          <Bi block={false}>{!passed && onRetry ? "Try again" : "Continue"}</Bi>
          {!touch && <kbd aria-hidden="true">Enter</kbd>}
        </button>
      </div>

      {save && <div className={`fin-save fin-save-${cloudStatus}`}><span aria-hidden="true">{save.icon}</span> <Bi block={false}>{save.text}</Bi></div>}
    </div>
  );
}
