  function grid(o) {
    const NS = "http://www.w3.org/2000/svg";
    const xMin = o.xMin ?? -6, xMax = o.xMax ?? 6, yMin = o.yMin ?? -6, yMax = o.yMax ?? 6;
    const cell = o.cell || 34, pad = 26;
    const W = (xMax - xMin) * cell + pad * 2, H = (yMax - yMin) * cell + pad * 2;
    const X = x => pad + (x - xMin) * cell, Y = y => pad + (yMax - y) * cell;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("class", "qgrid");
    svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "Cartesian plane");
    const el = (n, a, txt) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; };
    for (let x = xMin; x <= xMax; x++) el("line", { x1: X(x), y1: Y(yMin), x2: X(x), y2: Y(yMax), class: "gl" });
    for (let y = yMin; y <= yMax; y++) el("line", { x1: X(xMin), y1: Y(y), x2: X(xMax), y2: Y(y), class: "gl" });
    if (yMin <= 0 && yMax >= 0) el("line", { x1: X(xMin) - 6, y1: Y(0), x2: X(xMax) + 10, y2: Y(0), class: "ax", "marker-end": "" });
    if (xMin <= 0 && xMax >= 0) el("line", { x1: X(0), y1: Y(yMin) + 6, x2: X(0), y2: Y(yMax) - 10, class: "ax" });
    if (yMin <= 0 && yMax >= 0) { el("path", { d: `M${X(xMax) + 14},${Y(0)} l-10,-5 v10 z`, class: "axh" }); el("text", { x: X(xMax) + 12, y: Y(0) - 10, class: "axl" }, "x"); }
    if (xMin <= 0 && xMax >= 0) { el("path", { d: `M${X(0)},${Y(yMax) - 14} l-5,10 h10 z`, class: "axh" }); el("text", { x: X(0) + 12, y: Y(yMax) - 8, class: "axl" }, "y"); }
    const ox = xMin <= 0 && xMax >= 0 ? X(0) : X(xMin), oy = yMin <= 0 && yMax >= 0 ? Y(0) : Y(yMin);
    const step = o.labelStep || 1;
    for (let x = xMin; x <= xMax; x += step) if (x !== 0) el("text", { x: X(x), y: oy + 15, class: "tk", "text-anchor": "middle" }, C.fmt(x));
    for (let y = yMin; y <= yMax; y += step) if (y !== 0) el("text", { x: ox - 7, y: Y(y) + 4, class: "tk", "text-anchor": "end" }, C.fmt(y));
    if (xMin <= 0 && xMax >= 0 && yMin <= 0 && yMax >= 0) el("text", { x: X(0) - 7, y: Y(0) + 15, class: "tk", "text-anchor": "end" }, "0");
    // lines, clipped to the box
    // Line labels go where they are farthest from other labels and from any crossing point.
    const placed = [], cross = [];
    (o.lines || []).forEach((L, i) => (o.lines || []).slice(i + 1).forEach(M2 => { if (L.m !== M2.m) { const x = (M2.b - L.b) / (L.m - M2.m); cross.push([X(x), Y(L.m * x + L.b)]); } }));
    (o.lines || []).forEach(L => {
      const pts = [];
      const add = (x, y) => { if (x >= xMin - 1e-9 && x <= xMax + 1e-9 && y >= yMin - 1e-9 && y <= yMax + 1e-9) pts.push([x, y]); };
      add(xMin, L.m * xMin + L.b); add(xMax, L.m * xMax + L.b);
      if (L.m !== 0) { add((yMin - L.b) / L.m, yMin); add((yMax - L.b) / L.m, yMax); }
      pts.sort((a, b) => a[0] - b[0]);
      if (pts.length >= 2) {
        const a = pts[0], b = pts[pts.length - 1];
        el("line", { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), class: "ln", stroke: L.color || "#be123c" });
        if (L.label) {
          let best = null, bestD = -1;
          [0.85, 0.72, 0.15, 0.28, 0.5].forEach(t => {
            const px = X(a[0] + (b[0] - a[0]) * t), py = Y(a[1] + (b[1] - a[1]) * t);
            const d = Math.min(1e9, ...placed.concat(cross).map(q => Math.hypot(q[0] - px, q[1] - py)));
            if (d > bestD + 0.5) { bestD = d; best = [px, py]; }
          });
          placed.push(best);
          // Step off the line at right angles (on the upper side), anchored so the text runs away from it.
          let dx = X(b[0]) - X(a[0]), dy = Y(b[1]) - Y(a[1]); const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
          let nx = -dy, ny = dx; if (ny > 0) { nx = -nx; ny = -ny; }
          const anchor = Math.abs(nx) < 0.35 ? "middle" : nx > 0 ? "start" : "end";
          const tx = el("text", { x: best[0] + nx * 12, y: best[1] + ny * 12 + (ny > -0.5 ? 5 : 0), class: "lnl", fill: L.color || "#be123c", "text-anchor": anchor }, L.label);
          tx.setAttribute("paint-order", "stroke");
        }
      }
    });
    (o.points || []).forEach(p => {
      el("circle", { cx: X(p.x), cy: Y(p.y), r: 6.5, class: "pt", fill: p.color || "#1d4ed8" });
      if (p.label) { const t = el("text", { x: X(p.x) + 9, y: Y(p.y) - 9, class: "ptl" }, p.label); t.setAttribute("paint-order", "stroke"); }
    });
    return svg;
  }
