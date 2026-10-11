import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useUI } from "../effects/uiStore.js";
import { useSession, playerState } from "../../game/sessionStore.js";
import { useProgress } from "../../progress/store.js";
import { useResults } from "../../results/resultStore.js";
import {
  hasRegionMap, regionMapSpec, regionMapPois, worldToMap, mapToWorld, mapSpotIsWalkable,
} from "../../data/maps/regionMaps.js";
import { paintRegionMapAsync, pinColour, MEDAL_COLOURS } from "../../game/maps/paintRegionMap.js";

/**
 * THE WORLD MAP (2026-10-10) — full screen, opened from a world's map board
 * (or the waypoint chip / M key). Move the mouse or trackpad over it: places
 * light up with their name; scroll / pinch to zoom, drag to move. Click a
 * place — or anywhere you can walk — to set a WAYPOINT: a beacon appears in
 * the world and an arrow at the top of the screen points the way.
 *
 * The painted map is a canvas (game/maps/paintRegionMap.js); the pins, labels,
 * "you" marker and waypoint are HTML on top, counter-scaled so they stay the
 * same size at every zoom.
 */
const MEDAL_TEXT = { gold: "🥇 Gold", silver: "🥈 Silver", bronze: "🥉 Bronze", pass: "✓ Done", soon: "Coming soon" };
const KIND_ORDER = ["challenge", "friend", "boss", "trophies", "guide", "place", "gate"];
const KIND_TITLE = {
  challenge: "Challenges", friend: "People", boss: "People", trophies: "Trophies", guide: "People", place: "Places", gate: "Gates",
};

function useMapData(regionId, open) {
  const progress = useProgress((s) => s);
  const results = useResults((s) => s.results);
  return useMemo(() => {
    if (!open || !hasRegionMap(regionId)) return null;
    const spec = regionMapSpec(regionId);
    const pois = regionMapPois(regionId, { progress, results });
    return { spec, pois };
  }, [regionId, open, progress, results]);
}

export default function MapViewer() {
  const open = useUI((s) => s.mapOpen);
  const regionId = useSession((s) => s.currentRegionId);
  const waypoint = useUI((s) => s.waypoint);
  const data = useMapData(regionId, open);

  // Leaving the world closes the map.
  useEffect(() => {
    if (open && !hasRegionMap(regionId)) useUI.getState().closeMap();
  }, [open, regionId]);

  if (!open || !data) return null;
  return <MapView key={regionId} regionId={regionId} spec={data.spec} pois={data.pois} waypoint={waypoint} />;
}

function MapView({ regionId, spec, pois, waypoint }) {
  const touch = useUI((s) => s.touchMode);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const meRef = useRef(null);
  const lineRef = useRef(null);
  const [base, setBase] = useState(null); // { W, H } once painted
  const [view, setView] = useState({ s: 1, tx: 0, ty: 0, fit: 1 });
  const [hoverId, setHoverId] = useState(null);
  const [notice, setNotice] = useState(null);
  const drag = useRef(null);
  const pointers = useRef(new Map());
  const closing = useRef(null);

  // Paint (or fetch the cached painting) after the first frame, so the card
  // appears at once with an "unrolling" state on slow devices.
  useEffect(() => {
    let alive = true;
    paintRegionMapAsync(regionId, 14).then((m) => {
      if (!alive || !m) return;
      const cv = canvasRef.current;
      if (cv) {
        cv.width = m.W; cv.height = m.H;
        cv.getContext("2d").drawImage(m.canvas, 0, 0);
      }
      setBase({ W: m.W, H: m.H });
    });
    return () => { alive = false; };
  }, [regionId]);

  // Fit the whole map into the stage.
  const fitView = useCallback(() => {
    const st = stageRef.current;
    if (!st || !base) return;
    const r = st.getBoundingClientRect();
    const fit = Math.min(r.width / base.W, r.height / base.H);
    setView({ s: fit, fit, tx: (r.width - base.W * fit) / 2, ty: (r.height - base.H * fit) / 2 });
  }, [base]);
  useLayoutEffect(() => { fitView(); }, [fitView]);
  useEffect(() => {
    const f = () => fitView();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, [fitView]);

  const clampView = useCallback((v) => {
    const st = stageRef.current;
    if (!st || !base) return v;
    const r = st.getBoundingClientRect();
    const s = Math.max(v.fit, Math.min(v.fit * 3.5, v.s));
    const w = base.W * s, h = base.H * s;
    const tx = w <= r.width ? (r.width - w) / 2 : Math.min(0, Math.max(r.width - w, v.tx));
    const ty = h <= r.height ? (r.height - h) / 2 : Math.min(0, Math.max(r.height - h, v.ty));
    return { ...v, s, tx, ty };
  }, [base]);

  const zoomAt = useCallback((factor, cx, cy) => {
    setView((v) => {
      const s = Math.max(v.fit, Math.min(v.fit * 3.5, v.s * factor));
      const k = s / v.s;
      return clampView({ ...v, s, tx: cx - (cx - v.tx) * k, ty: cy - (cy - v.ty) * k });
    });
  }, [clampView]);

  // Map px ↔ world.
  const toPx = useCallback((x, z) => {
    const [u, v] = worldToMap(spec, x, z);
    return [u * (base?.W || 1), v * (base?.H || 1)];
  }, [spec, base]);

  // Live "you" marker + the dashed line to the waypoint.
  useEffect(() => {
    if (!base) return undefined;
    let raf;
    const tick = () => {
      const [px, py] = toPx(playerState.x, playerState.z);
      if (meRef.current) {
        const f = playerState.facing || 0;
        meRef.current.style.left = `${px}px`;
        meRef.current.style.top = `${py}px`;
        meRef.current.style.setProperty("--rot", `${Math.atan2(Math.sin(f), -Math.cos(f))}rad`);
      }
      const wp = useUI.getState().waypoint;
      if (lineRef.current) {
        if (wp && wp.regionId === regionId) {
          const [wx, wy] = toPx(wp.x, wp.z);
          lineRef.current.setAttribute("x1", px); lineRef.current.setAttribute("y1", py);
          lineRef.current.setAttribute("x2", wx); lineRef.current.setAttribute("y2", wy);
          lineRef.current.style.display = "";
        } else lineRef.current.style.display = "none";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [base, toPx, regionId]);

  const close = useCallback(() => {
    clearTimeout(closing.current);
    useUI.getState().closeMap();
  }, []);

  const setWaypointTo = useCallback((wp, text) => {
    useUI.getState().setWaypoint({ regionId, ...wp });
    setNotice({ text, tone: "good" });
    clearTimeout(closing.current);
    closing.current = setTimeout(() => useUI.getState().closeMap(), 900);
  }, [regionId]);

  const pickPoi = useCallback((p) => {
    setWaypointTo({ x: p.target[0], z: p.target[1], label: p.name, icon: p.n ? `${p.icon}` : p.icon, arrive: p.arrive || 4, poi: p.id },
      `📍 Waypoint set: ${p.name} — follow the arrow!`);
  }, [setWaypointTo]);

  // Keys: Esc closes, + / − zoom, 0 fits.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      const st = stageRef.current;
      if (!st) return;
      const r = st.getBoundingClientRect();
      if (e.key === "+" || e.key === "=") zoomAt(1.3, r.width / 2, r.height / 2);
      else if (e.key === "-" || e.key === "_") zoomAt(1 / 1.3, r.width / 2, r.height / 2);
      else if (e.key === "0") fitView();
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(closing.current); };
  }, [close, zoomAt, fitView]);

  // Wheel / trackpad: zoom round the pointer.
  useEffect(() => {
    const st = stageRef.current;
    if (!st) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const r = st.getBoundingClientRect();
      const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022));
      zoomAt(k, e.clientX - r.left, e.clientY - r.top);
    };
    st.addEventListener("wheel", onWheel, { passive: false });
    return () => st.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  // Drag to move · pinch to zoom · click to set a waypoint.
  const onPointerDown = (e) => {
    if (e.target.closest(".map-pin, .map-zoom")) return;
    stageRef.current.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    drag.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty, moved: false, pinch: pointers.current.size > 1 };
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = stageRef.current.getBoundingClientRect();
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const others = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)[1];
      const d0 = Math.hypot(prev.x - others.x, prev.y - others.y), d1 = Math.hypot(a.x - b.x, a.y - b.y);
      if (d0 > 4) zoomAt(d1 / d0, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      if (drag.current) drag.current.moved = true;
      return;
    }
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.hypot(dx, dy) > 5) d.moved = true;
    if (d.moved) setView((v) => clampView({ ...v, tx: d.tx + dx, ty: d.ty + dy }));
  };
  const onPointerUp = (e) => {
    const d = drag.current;
    const wasPinch = pointers.current.size > 1 || d?.pinch;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) return;
    drag.current = null;
    if (!d || d.moved || wasPinch || !base) return;
    // A click on open map: a free waypoint, if you can walk there.
    const r = stageRef.current.getBoundingClientRect();
    const mx = (e.clientX - r.left - view.tx) / view.s, my = (e.clientY - r.top - view.ty) / view.s;
    if (mx < 0 || my < 0 || mx > base.W || my > base.H) return;
    const [x, z] = mapToWorld(spec, mx / base.W, my / base.H);
    if (!mapSpotIsWalkable(regionId, x, z)) {
      setNotice({ text: "You can't walk there — pick a place on land.", tone: "bad", at: Date.now() });
      return;
    }
    setWaypointTo({ x, z, label: "Marked spot", icon: "📍", arrive: 4 }, "📍 Waypoint set — follow the arrow!");
  };

  const hover = pois.find((p) => p.id === hoverId) || null;
  const groups = useMemo(() => {
    const g = new Map();
    for (const p of pois) {
      const k = KIND_TITLE[p.kind] || "Places";
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(p);
    }
    return [...g.entries()].sort((a, b) => KIND_ORDER.indexOf(a[1][0].kind) - KIND_ORDER.indexOf(b[1][0].kind));
  }, [pois]);
  const wpHere = waypoint && waypoint.regionId === regionId ? waypoint : null;
  const inv = 1 / (view.s || 1);

  return (
    <div className="map-overlay" style={{ "--accent": spec.accent, "--deep": spec.deep, "--paper": spec.paper }} role="dialog" aria-label={`${spec.title} map`}>
      <div className="map-frame">
        <header className="map-head">
          <div className="map-title">
            <span className="map-title-icon">{spec.icon}</span>
            <div>
              <h2>{spec.title}</h2>
              <p>{spec.subtitle}</p>
            </div>
          </div>
          <div className="map-head-right">
            {wpHere && (
              <span className="map-wp-chip">
                📍 {wpHere.label}
                <button className="link-button" onClick={() => { useUI.getState().clearWaypoint(); setNotice({ text: "Waypoint cleared.", tone: "warm" }); }}>✕ clear</button>
              </span>
            )}
            <button className="map-close" onClick={close} aria-label="Close the map">✕</button>
          </div>
        </header>

        <div className="map-body">
          <div
            className={`map-stage${drag.current?.moved ? " dragging" : ""}`}
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {!base && <div className="map-loading">🗺️ Unrolling the map…</div>}
            <div
              className="map-world"
              style={{
                width: base ? base.W : 0, height: base ? base.H : 0,
                transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`,
                "--inv": inv,
              }}
            >
              <canvas ref={canvasRef} className="map-canvas" />
              {base && (
                <>
                  <svg className="map-svg" width={base.W} height={base.H}>
                    <line ref={lineRef} className="map-route" strokeWidth={6 * inv} strokeDasharray={`${18 * inv} ${12 * inv}`} />
                  </svg>
                  {spec.areas.map((a, i) => {
                    const [x, y] = toPx(a.at[0], a.at[1]);
                    return <div key={i} className="map-area" style={{ left: x, top: y }}>{a.name}</div>;
                  })}
                  {pois.map((p) => {
                    const [x, y] = toPx(p.at[0], p.at[1]);
                    const big = p.kind === "challenge";
                    return (
                      <button
                        key={p.id}
                        className={`map-pin k-${p.kind}${big ? " big" : ""}${p.soon ? " soon" : ""}${hoverId === p.id ? " hot" : ""}${wpHere?.poi === p.id ? " wp" : ""}`}
                        style={{ left: x, top: y, "--pin": pinColour(p, spec.accent), "--ring": p.medal && MEDAL_COLOURS[p.medal] ? MEDAL_COLOURS[p.medal] : "#ffffff" }}
                        onPointerEnter={() => setHoverId(p.id)}
                        onPointerLeave={() => setHoverId((h) => (h === p.id ? null : h))}
                        onClick={(e) => { e.stopPropagation(); pickPoi(p); }}
                        aria-label={`${p.name}${p.sub ? ` — ${p.sub}` : ""}`}
                      >
                        <span className="map-pin-dot">{p.n ? p.n : p.icon}</span>
                        {(big || hoverId === p.id) && <span className="map-pin-name">{p.icon} {p.name}</span>}
                      </button>
                    );
                  })}
                  {wpHere && (() => {
                    const [x, y] = toPx(wpHere.x, wpHere.z);
                    return <div className="map-wp" style={{ left: x, top: y }}>📍</div>;
                  })()}
                  <div ref={meRef} className="map-me" title="You are here"><span className="map-me-arrow" /><span className="map-me-label">YOU</span></div>
                </>
              )}
            </div>

            {hover && (
              <div className="map-tip">
                <div className="map-tip-title">{hover.icon} {hover.name}</div>
                {hover.place && <div className="map-tip-place">{hover.place}</div>}
                {hover.sub && <div className="map-tip-sub">{hover.sub}</div>}
                {hover.medal && <div className={`map-tip-medal m-${hover.medal}`}>{MEDAL_TEXT[hover.medal]}{hover.kind === "challenge" && hover.best ? ` · best ${hover.best}` : ""}</div>}
                <div className="map-tip-hint">{hover.soon ? (touch ? "Tap to visit the clearing" : "Click to visit the clearing") : (touch ? "Tap to set a waypoint" : "Click to set a waypoint")}</div>
              </div>
            )}

            <div className="map-zoom">
              <button onClick={() => { const r = stageRef.current.getBoundingClientRect(); zoomAt(1.35, r.width / 2, r.height / 2); }} aria-label="Zoom in">＋</button>
              <button onClick={() => { const r = stageRef.current.getBoundingClientRect(); zoomAt(1 / 1.35, r.width / 2, r.height / 2); }} aria-label="Zoom out">－</button>
              <button onClick={fitView} aria-label="Whole map">⤢</button>
            </div>
            <div className="map-compass" aria-hidden="true">N<span>▲</span></div>
            {notice && <div key={notice.at || notice.text} className={`map-notice ${notice.tone}`}>{notice.text}</div>}
          </div>

          <aside className="map-side">
            {groups.map(([title, list]) => (
              <section key={title}>
                <h3>{title}</h3>
                <ul>
                  {list.map((p) => (
                    <li key={p.id}>
                      <button
                        className={`map-row${hoverId === p.id ? " hot" : ""}${wpHere?.poi === p.id ? " wp" : ""}${p.soon ? " soon" : ""}`}
                        onPointerEnter={() => setHoverId(p.id)}
                        onPointerLeave={() => setHoverId((h) => (h === p.id ? null : h))}
                        onClick={() => pickPoi(p)}
                      >
                        <span className="map-row-dot" style={{ "--pin": pinColour(p, spec.accent), "--ring": p.medal && MEDAL_COLOURS[p.medal] ? MEDAL_COLOURS[p.medal] : "#ffffff" }}>{p.n ? p.n : p.icon}</span>
                        <span className="map-row-text">
                          <b>{p.n ? `${p.icon} ` : ""}{p.name}</b>
                          <small>{p.soon ? "Coming soon" : p.place || p.sub}</small>
                        </span>
                        {p.medal && p.medal !== "soon" && <span className={`map-row-medal m-${p.medal}`}>{MEDAL_TEXT[p.medal].split(" ")[0]}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </aside>
        </div>

        <footer className="map-foot">
          {touch
            ? <>Pinch to zoom · drag to move · <b>tap a place (or any spot) to set a waypoint</b></>
            : <>Move over the map to see places · scroll or pinch to zoom · drag to move · <b>click a place (or any spot) to set a waypoint</b> · Esc to close</>}
        </footer>
      </div>
    </div>
  );
}
