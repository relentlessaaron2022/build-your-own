// paint.js — shape helpers on top of the stroke engine: every fill is laid as overlapping horizontal brush strokes,
// every line is a stroke; nothing is a vector outline. All builders consume the global RNG (wrap in withSeed).
const R = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const E = (cx, cy, rx, ry, n = 28) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
const mirror = (poly, cx) => poly.map(([x, y]) => [2 * cx - x, y]);

function spans(poly, y) {
  const xs = [];
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length];
    if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) xs.push(x0 + (y - y0) / (y1 - y0) * (x1 - x0));
  }
  xs.sort((a, b) => a - b); const out = [];
  for (let i = 0; i + 1 < xs.length; i += 2) out.push([xs[i], xs[i + 1]]);
  return out;
}
// holes: [cx, cy, rx, ry] ellipses the wash goes around (light is unpainted paper)
function cutHoles(sp, holes, y) {
  let out = sp;
  for (const h of holes) {
    const dy = (y - h[1]) / h[3]; if (Math.abs(dy) >= 1) continue;
    const hw = h[2] * Math.sqrt(1 - dy * dy), a = h[0] - hw, b = h[0] + hw, n = [];
    for (const [x0, x1] of out) { if (b <= x0 || a >= x1) { n.push([x0, x1]); continue; } if (a > x0) n.push([x0, a]); if (b < x1) n.push([b, x1]); }
    out = n;
  }
  return out;
}
// fill a polygon with horizontal brush strokes; col: hex, array of hexes, or fn(y)
function fill(S, poly, col, w = 40, o = {}) {
  let ys = Infinity, ye = -Infinity; for (const p of poly) { ys = Math.min(ys, p[1]); ye = Math.max(ye, p[1]); }
  const step = w * (o.step ?? .46), T = [];
  for (let y = ys + step * .5; y < ye; y += step) {
    const yy = y + rnd(-step * .12, step * .12);
    for (const [x0, x1] of cutHoles(spans(poly, yy), o.holes || [], yy)) {
      if (x1 - x0 < w * .25) continue;
      const e = Math.min(w * .3, (x1 - x0) * .08); let a = x0 + e * rnd(.1, 1), b = x1 - e * rnd(.1, 1);
      if (rnd() < .5) [a, b] = [b, a];
      const n = Math.max(4, Math.round(Math.abs(b - a) / 22));
      const c = typeof col === 'function' ? col(yy) : Array.isArray(col) ? pick(col) : col;
      T.push(mk(qcurve(a, yy, b, yy + rnd(-w * .14, w * .14), rnd(-w * .22, w * .22), n), w * rnd(.95, 1.2), c, { prof: 'even', a: o.a ?? rnd(.44, .6), nb: o.nb ?? 3, rough: .34 }));
    }
  }
  if (o.vertical) for (const k of T) { k.pts = k.pts.map(([x, y]) => [y, x]); [k.nx, k.ny] = [k.ny, k.nx]; }
  S.push(...T);
}
// the same fill with strokes running top to bottom (poly given in normal x, y)
const fillV = (S, poly, col, w, o = {}) => fill(S, poly.map(([x, y]) => [y, x]), col, w, { ...o, vertical: true });
function line(S, pts, w, col = INK, o = {}) { S.push(mk(pts, w, col, { prof: o.prof || 'even', nb: o.nb ?? 0, a: o.a ?? .85, rough: o.rough ?? .3 })); }
function poly2line(S, poly, w, col = INK, o = {}) { const p = [...poly, poly[0]]; for (let i = 0; i < p.length - 1; i++) line(S, qcurve(p[i][0], p[i][1], p[i + 1][0], p[i + 1][1], rnd(-2, 2), 6), w, col, o); }
function path(pts, n = 4) { const o = [pts[0]]; for (let i = 1; i < pts.length; i++) { const q = qcurve(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 0, n); o.push(...q.slice(1)); } return o; }
function bird(S, x, y, s, col = INK2) {
  line(S, qcurve(x, y, x - 46 * s, y - 20 * s, -10 * s, 7), 9 * s, col, { prof: 'tip', a: .9 });
  line(S, qcurve(x, y, x + 46 * s, y - 20 * s, 10 * s, 7), 9 * s, col, { prof: 'tip', a: .9 });
}
function person(S, x, y, h, col) {               // a standing figure seen from behind, feet at (x, y)
  line(S, qcurve(x - h * .05, y, x - h * .03, y - h * .45, 0, 6), h * .09, col, { a: .9 });
  line(S, qcurve(x + h * .05, y, x + h * .03, y - h * .45, 0, 6), h * .09, col, { a: .9 });
  line(S, qcurve(x, y - h * .42, x, y - h * .78, 0, 6), h * .2, col, { a: .9, prof: 'even' });
  fill(S, E(x, y - h * .87, h * .07, h * .08), col, h * .07, { a: .9 });
}
