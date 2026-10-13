import React, { useEffect, useRef, useState } from "react";

import { useUI } from "../effects/uiStore.js";
import { touchWords } from "../keyHints.js";
import { useLang, Bi } from "../../i18n/i18n.jsx";
import { speakerInfo, emphasisParts } from "./speakers.js";

/**
 * THE DIALOGUE BOX (2026-10-13 — Jeff: "upgrade the look/feel and contents of
 * the dialogue boxes, they are the original dialogue box formats"). One look
 * for every conversation in the game, in the family of the title screen:
 *
 *   • docked along the bottom like a game's speech box, so the character
 *     you're talking to stays in view above it
 *   • the speaker's PORTRAIT (rendered from their own model — speakers.js),
 *     a name plate in their colour and what they do ("Times tables")
 *   • each line eases in; the important words (worlds, friends, numbers,
 *     medals) are picked out in bold (English — a translated line is kept
 *     whole so it still matches its translation)
 *   • ‹ Back to re-read, dots for how far through you are, a bouncing ▸ on
 *     Next; click / tap anywhere on the box, Enter, Space or → to go on, ←
 *     back, Esc to close; Skip jumps to the last line (where any choice is)
 *
 * Presentational: the encounter components own the lines + what the last
 * button does.
 */
/** Split a line into plain text + <strong> for the words that matter. */
export function emphasise(text) {
  return emphasisParts(text).map((p, i) => (p.strong ? <strong key={i}>{p.text}</strong> : p.text));
}

function Portrait({ info, speaker }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="dlg-portrait" style={{ "--dlg-c": info.color }} aria-hidden="true">
      {info.img && !broken
        ? <img src={info.img} alt="" draggable="false" onError={() => setBroken(true)} />
        : <span className="dlg-portrait-icon">{info.icon || (speaker || "?").slice(0, 1)}</span>}
    </div>
  );
}

export default function DialogueBox({
  speaker, lines, index, onNext, onBack, onSkipToEnd, onClose,
  primaryLabel, secondaryLabel, onSecondary,
}) {
  const touch = useUI((s) => s.touchMode);
  const lang = useLang();
  const info = speakerInfo(speaker);
  const total = lines.length;
  const isLast = index + 1 >= total;
  const raw = touchWords(String(lines[index] || ""));
  const boxRef = useRef(null);

  // Keys: Enter / Space / → next · ← back · Esc close.
  useEffect(() => {
    function onKey(e) {
      const t = (e.target && e.target.tagName ? e.target.tagName : "").toLowerCase();
      if (t === "input" || t === "textarea" || t === "select") return;
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); onNext(); }
      else if (e.key === "ArrowLeft" && index > 0) { e.preventDefault(); onBack(); }
      else if (e.key === "Escape") { e.preventDefault(); onClose(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext, onBack, onClose, index]);

  // A tap / click anywhere on the box (not on a button) goes on.
  function onBoxClick(e) {
    if (e.target.closest("button")) return;
    onNext();
  }

  return (
    <div className="dlg" role="dialog" aria-modal="true" aria-label={speaker} style={{ "--dlg-c": info.color }}>
      <Portrait info={info} speaker={speaker} />
      <div className="dlg-box" ref={boxRef} onClick={onBoxClick}>
        <div className="dlg-plate">
          <span className="dlg-name">{speaker}</span>
          {info.role && <span className="dlg-role"><Bi block={false}>{info.role}</Bi></span>}
        </div>
        <div className="dlg-top-actions">
          {!isLast && total > 2 && onSkipToEnd && (
            <button className="dlg-skip" onClick={onSkipToEnd}><Bi>Skip</Bi> ››</button>
          )}
          <button className="dlg-close" onClick={onClose} title="Close" aria-label="Close">✕</button>
        </div>

        <p className="dlg-line" key={index}>
          {lang === "en" ? emphasise(raw) : raw}
        </p>

        <div className="dlg-foot">
          {index > 0 ? (
            <button className="dlg-back" onClick={onBack} aria-label="Back"><span aria-hidden="true">‹</span> <Bi>Back</Bi></button>
          ) : <span className="dlg-back-space" />}
          {total > 1 && (
            <span className="dlg-dots" aria-label={`${index + 1} of ${total}`}>
              {lines.map((_, i) => <span key={i} className={i < index ? "seen" : i === index ? "now" : ""} />)}
            </span>
          )}
          <span className="dlg-buttons">
            {isLast && secondaryLabel && (
              <button className="dlg-btn dlg-btn-quiet" onClick={onSecondary}><Bi>{secondaryLabel}</Bi></button>
            )}
            <button className={`dlg-btn dlg-btn-go${isLast ? " is-last" : ""}`} onClick={onNext}>
              <Bi block={false}>{primaryLabel || (isLast ? "Goodbye" : "Next")}</Bi>
              {!isLast && <span className="dlg-go-arrow" aria-hidden="true">▸</span>}
              {!touch && <kbd className="dlg-kbd" aria-hidden="true">Enter</kbd>}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
