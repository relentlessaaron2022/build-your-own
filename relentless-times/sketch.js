// sketch.js — pen & wash in Canvas 2D (technique after Lemo-Opuscar's Urban Sketch · Pen & Wash): one sepia fineliner that wobbles, overshoots and breaks,
// transparent washes laid on top slightly off the line, with dried edges, granulation and a colour-arrival front. Deterministic (seeded).
export const INK = '#3B2A1E', PAPER = '#F1E8D6', VIOLET = '#8C87A6', HAZE = '#C9C3B6';
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function vnoise(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; }
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

// —— paper: cream, two octaves of mottling, fine tooth (one cached canvas) ——
let PAPER_C = null;
export function paper(g, W, H) {
  if (!PAPER_C || PAPER_C.width !== W || PAPER_C.height !== H) {
    const [c, p] = cv(W, H); p.fillStyle = PAPER; p.fillRect(0, 0, W, H);
    const id = p.getImageData(0, 0, W, H), d = id.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const m = (vnoise(x / 260 + vnoise(y / 260) * 3) - .5) * .05 + (vnoise(x / 60 + y / 47) - .5) * .025 + (hash(x * 7.1 + y * 13.3) - .5) * .05;
      const i = (y * W + x) * 4; d[i] *= 1 + m; d[i + 1] *= 1 + m; d[i + 2] *= 1 + m * 1.2;
    }
    p.putImageData(id, 0, 0); PAPER_C = c;
  }
  g.drawImage(PAPER_C, 0, 0);
}
// —— ink: resample, wobble along the normal, overshoot the ends, maybe one gap ——
function resample(pts, step = 6) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / step));
    for (let k = 1; k <= n; k++) out.push([ax + (bx - ax) * k / n, ay + (by - ay) * k / n]); }
  return out;
}
export function ink(g, pts, o = {}) {
  const seed = o.seed ?? 1, w = o.w ?? 2.2, wob = o.wob ?? 1.1, over = o.over ?? 6, prog = o.prog ?? 1;
  let P = resample(pts);
  if (P.length < 2 || prog <= 0) return;
  const a = P[0], b = P[1], c = P[P.length - 2], d = P[P.length - 1];
  const ov = (p, q, k) => { const L = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1; return [p[0] + (p[0] - q[0]) / L * k, p[1] + (p[1] - q[1]) / L * k]; };
  P = [ov(a, b, over * hash(seed)), ...P, ov(d, c, over * hash(seed + 2))];
  const n = Math.max(2, Math.round(P.length * prog)), gapAt = hash(seed + 5) < .45 ? Math.floor(P.length * (.3 + .4 * hash(seed + 6))) : -1;
  g.save(); g.strokeStyle = o.col || INK; g.lineCap = 'round'; g.lineJoin = 'round'; g.globalAlpha = o.alpha ?? .96;
  g.beginPath(); let pen = false;
  for (let i = 0; i < n; i++) {
    const p = P[i], q = P[Math.min(P.length - 1, i + 1)], r = P[Math.max(0, i - 1)], tx = q[0] - r[0], ty = q[1] - r[1], L = Math.hypot(tx, ty) || 1;
    const off = (vnoise(i * .35 + seed * 9) - .5) * 2 * wob;
    const x = p[0] - ty / L * off, y = p[1] + tx / L * off;
    if (gapAt > 0 && i >= gapAt && i < gapAt + 2) { pen = false; continue; }
    g.lineWidth = w * (.85 + .3 * vnoise(i * .2 + seed));
    if (!pen) { g.moveTo(x, y); pen = true; } else g.lineTo(x, y);
  }
  g.stroke(); g.restore();
}
// rough wash: polygon edge displaced by noise, multiply, darker dried rim, granulation; offset off the line by about one line width
function roughPath(g, poly, seed, amp) {
  const P = resample([...poly, poly[0]], 10);
  g.beginPath(); P.forEach(([x, y], i) => { const a = (vnoise(i * .4 + seed) - .5) * 2 * amp, b = (vnoise(i * .4 + seed + 40) - .5) * 2 * amp; i ? g.lineTo(x + a, y + b) : g.moveTo(x + a, y + b); }); g.closePath();
}
let GRAN = null;
function granPattern(g) { if (!GRAN) { const [c, p] = cv(256, 256), id = p.createImageData(256, 256); for (let i = 0; i < id.data.length; i += 4) { const v = 200 + 55 * (vnoise(i * .013) * .6 + hash(i) * .4); id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } p.putImageData(id, 0, 0); GRAN = c; } return g.createPattern(GRAN, 'repeat'); }
export function wash(g, poly, col, o = {}) {
  const seed = o.seed ?? 3, alpha = o.alpha ?? .5, dx = o.dx ?? 2.5, dy = o.dy ?? 1.5, amp = o.amp ?? 3.5;
  g.save(); g.translate(dx, dy);
  if (o.clip) o.clip(g);
  g.globalCompositeOperation = 'multiply';
  roughPath(g, poly, seed, amp); g.globalAlpha = alpha; g.fillStyle = col; g.fill();
  g.globalAlpha = alpha * .35; g.fillStyle = granPattern(g); g.fill();
  g.globalAlpha = alpha * .55; g.strokeStyle = col; g.lineWidth = 2.2; g.filter = 'blur(1px)'; g.stroke(); g.filter = 'none';
  g.restore();
}
// colour arrival: a ragged circular front grows from (x, y); everything drawn inside fn is revealed through it
export function bloom(g, x, y, r, seed, fn) {
  if (r <= 0) return;
  g.save(); g.beginPath();
  for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2, rr = r * (.86 + .28 * vnoise(i * .7 + seed)); i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.clip(); fn(); g.restore();
}
// palm: trunk in ink, drooping fronds (curved ink), leaf dabs in two greens at the frond tips (a few rough washes, holes left)
export function palm(g, x, y, h, seed, prog = 1, colour = 1) {
  const top = [x + h * .06, y - h];
  ink(g, [[x, y], [x + h * .03, y - h * .45], top], { seed, w: 2.8, prog });
  ink(g, [[x + 6, y], [x + h * .03 + 6, y - h * .45], [top[0] + 5, top[1] + 6]], { seed: seed + 1, w: 1.4, prog });
  for (let k = 0; k < 8; k++) {
    const side = k % 2 ? 1 : -1, a = side * (.35 + .22 * (k >> 1)) + (hash(seed + k) - .5) * .15, L = h * (.34 + .12 * hash(seed + k * 3));
    const mid = [top[0] + Math.sin(a) * L * .55, top[1] - Math.cos(a) * L * .45 - L * .12], tip = [top[0] + Math.sin(a) * L, top[1] - Math.cos(a) * L * .2 + L * .35];
    ink(g, [top, mid, tip], { seed: seed + k * 7, w: 1.8, prog, over: 2 });
    if (colour > 0) for (let d = 0; d < 4; d++) { const u = .45 + d * .16, px = top[0] + (tip[0] - top[0]) * u + (mid[0] - (top[0] + tip[0]) / 2) * Math.sin(u * Math.PI), py = top[1] + (tip[1] - top[1]) * u + (mid[1] - (top[1] + tip[1]) / 2) * Math.sin(u * Math.PI) + 10;
      const r = 18 + 10 * hash(seed + k * 11 + d), poly = []; for (let q = 0; q < 8; q++) { const an = q / 8 * Math.PI * 2; poly.push([px + Math.cos(an) * r * 1.4, py + Math.sin(an) * r * .7]); }
      wash(g, poly, d % 2 ? '#7FA04A' : '#A7B85C', { alpha: .45 * colour, seed: seed + k * 13 + d, amp: 4 }); }
  }
}
