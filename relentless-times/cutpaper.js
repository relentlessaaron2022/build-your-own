// cutpaper.js — 60s-spy cut-paper pieces (technique after Lemo-Opuscar's 60s Spy Title Sequence): flat opaque inks, a scissor-cut edge
// computed once in the piece's local space (so a moving cutout keeps its edge), a cut gap in the ground colour and a small paper shadow.
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function vnoise(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; }
export const SPY = { black: '#1B1714', cream: '#EFE4C9', red: '#D23A22', lemon: '#F2CF1D' };
const CACHE = new Map();
// poly → cut edge (resampled every ~9 px, displaced along the normal by low-frequency noise, rare notches); cached per key
export function cutEdge(key, poly, amp = 1.6) {
  if (CACHE.has(key)) return CACHE.get(key);
  const out = [], n = poly.length; let s = 0;
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(L / 9)), nx = -(b[1] - a[1]) / (L || 1), ny = (b[0] - a[0]) / (L || 1);
    for (let j = 0; j < k; j++) { const u = j / k, d = (vnoise(s * .11 + key.length) - .5) * 2 * amp + (hash(s * 3.7 + key.length) > .985 ? -2 : 0); s++;
      out.push([a[0] + (b[0] - a[0]) * u + nx * d, a[1] + (b[1] - a[1]) * u + ny * d]); }
  }
  CACHE.set(key, out); return out;
}
// draw a piece: M = [a,b,c,d,e,f] local → screen; col = ink; gap = ground colour for the cut gap; shadow on by default
export function piece(g, key, poly, col, M = [1, 0, 0, 1, 0, 0], o = {}) {
  const P = cutEdge(key, poly, o.amp);
  g.save(); g.setTransform(...M);
  const path = new Path2D(); P.forEach(([x, y], i) => i ? path.lineTo(x, y) : path.moveTo(x, y)); path.closePath();
  if (o.shadow !== false) { g.shadowColor = 'rgba(20,14,10,.3)'; g.shadowBlur = 5; g.shadowOffsetX = 3; g.shadowOffsetY = 4; }
  if (o.gap) { g.strokeStyle = o.gap; g.lineWidth = 4.8; g.lineJoin = 'round'; g.stroke(path); }
  g.shadowColor = 'transparent'; g.fillStyle = col; g.fill(path);
  g.restore();
}
// a silhouette in profile (~7 heads tall, faces left→right), identity by coat, scarf accent and a rolling case; phase = walk cycle 0..1 (on twos)
export function walker(g, x, y, h, phase, o = {}) {
  const s = h / 700, M = [s * (o.flip ? -1 : 1), 0, 0, s, x, y], k = Math.sin(phase * Math.PI * 2), ink = o.ink || SPY.black, gap = o.gap || SPY.cream;
  const legF = [[0, -330], [26, -330], [40 + k * 70, -10], [10 + k * 70, 0]], legB = [[-10, -330], [16, -330], [-20 - k * 70, -8], [-50 - k * 70, 0]];
  piece(g, 'legB', legB, ink, M, { gap }); piece(g, 'legF', legF, ink, M, { gap });
  piece(g, 'coat', [[-60, -560], [40, -575], [70, -470], [64, -300], [-74, -296], [-80, -470]], ink, M, { gap });
  piece(g, 'head', [[-28, -690], [22, -700], [44, -660], [40, -612], [8, -592], [-30, -608], [-40, -650]], ink, M, { gap });
  piece(g, 'hat', [[-70, -684], [64, -694], [40, -712], [26, -748], [-30, -742], [-44, -700]], ink, M, { gap });
  piece(g, 'scarf', [[-18, -598], [34, -606], [36, -582], [-40 - 30 * Math.abs(k), -560], [-110 - 40 * Math.abs(k), -520 + k * 12], [-96, -548]], o.accent || SPY.red, M, { gap });
  if (o.case !== false) { piece(g, 'caseH', [[60, -470], [70, -472], [120, -250], [110, -248]], ink, M, { gap });
    piece(g, 'case', [[96, -260], [210, -264], [214, -40], [100, -36]], o.caseCol || SPY.lemon, M, { gap });
    piece(g, 'wheel', [[120, -36], [140, -36], [140, -14], [120, -14]], ink, M, { gap }); }
  piece(g, 'arm', [[30, -540], [52, -548], [90 + 4 * k, -440], [74, -436]], ink, M, { gap });
}
