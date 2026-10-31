// main.js — The Window: one locked view of a small house, its yard and a gate, from a storm night through the seasons to sunrise.
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const BAR = 60 / 72 * 4;
const SEC = { intro: 0, v1: 4 * BAR, h1: 16 * BAR, v2: 22 * BAR, h2: 34 * BAR, br: 40 * BAR, h3: 44 * BAR, out: 50 * BAR };
window.DUR = 54 * BAR;
const VERM = '#c8442a', TREE = [1450, 700];
const fade2 = (t, a, b, fi = 1, fo = 1) => ss(seg(t, a, a + fi)) * (1 - ss(seg(t, b - fo, b)));

// ---------- seasons on the timeline: [name, start] ----------
const SEASON = [['night', 0], ['storm', 30], ['night', 47], ['winter', SEC.v2], ['spring', SEC.v2 + 3 * BAR], ['summer', SEC.v2 + 6 * BAR], ['autumn', SEC.v2 + 9 * BAR],
  ['summer', SEC.h2], ['winter', SEC.br], ['spring', SEC.br + BAR], ['summer', SEC.br + 2 * BAR], ['bloom', SEC.br + 3 * BAR], ['dawn', SEC.h3 + 1]];
function seasonAt(t) {                                   // → [[name, weight], …] with a 1.4 s painted cross-fade (0.8 s in the bridge)
  let i = 0; while (i + 1 < SEASON.length && t >= SEASON[i + 1][1]) i++;
  const [n, s] = SEASON[i], fd = t > SEC.br && t < SEC.h3 ? .8 : 1.4, f = i > 0 ? ss(seg(t, s, s + fd)) : 1;
  return f < 1 ? [[SEASON[i - 1][0], 1 - f, SEASON[i - 1][1]], [n, f, s]] : [[n, 1, s]];
}
const SKY = { night: ['#26324f', '#4a587a'], storm: ['#22273a', '#3a3f52'], winter: ['#8d93b5', '#d9cfd6'], spring: ['#9aa6c4', '#e6d3c6'], summer: ['#8fa6c0', '#e8d4b4'],
  autumn: ['#9a8fac', '#e6c39a'], bloom: ['#a3a9c8', '#efd6cc'], dawn: ['#c99aa6', '#f3cf86'] };
const GROUND = { night: ['#3a4256', '#2f3648'], storm: ['#343a4c', '#2a3040'], winter: ['#dcd9e3', '#cfcad8'], spring: ['#8fae6a', '#7d9c5c'], summer: ['#5f8a4c', '#557c44'],
  autumn: ['#b8904f', '#a98244'], bloom: ['#8fae6a', '#83a262'], dawn: ['#7f9a58', '#a2a35c'] };
const HILL = { night: '#38425a', storm: '#30374a', winter: '#9fa3b8', spring: '#7c8aa0', summer: '#6e8496', autumn: '#8d8296', bloom: '#7c8aa0', dawn: '#a98f8a' };
// darkness over the whole picture (a multiply glaze), the lamp in the window, the rain
const dark = t => t < 14 ? 0 : t < 30 ? .8 * ss(seg(t, 14, 22)) : t < 47 ? lerp(.8, 1, ss(seg(t, 30, 34))) : t < SEC.v2 ? lerp(1, .7, ss(seg(t, 47, 60))) * (1 - .55 * ss(seg(t, SEC.v2 - 1.5, SEC.v2)))
  : t < SEC.h3 ? .3 : .3 * (1 - ss(seg(t, SEC.h3 + 1, SEC.h3 + 9)));
const lamp = t => ss(seg(t, 1, 4)) * (1 - ss(seg(t, 44, 46.5))) + ss(seg(t, SEC.out + .5, SEC.out + 3.5));
const rain = t => ss(seg(t, 23, 27)) * (1 + .7 * fade2(t, 30, 46, 3, 2)) * (1 - ss(seg(t, 47, 53)));

// ---------- camera ----------
const CAM = [[0, 650, 520, 2.7], [12, 690, 505, 2.3], [22, 960, 540, 1.0], [SEC.h1, 960, 545, 1.03], [SEC.h1 + 6.5, 1430, 740, 1.8], [SEC.h1 + 16.2, 1420, 730, 1.9],
  [SEC.v2 - .2, 960, 540, 1.0], [SEC.h2, 960, 540, 1.02], [SEC.h2 + 12, 1190, 640, 1.3], [SEC.h2 + 19.4, 1170, 630, 1.33], [SEC.br + .9, 960, 540, 1.0], [SEC.h3, 960, 540, 1.04],
  [SEC.h3 + 2.4, 1300, 820, 1.5], [SEC.h3 + 13.5, 1000, 480, 1.08], [SEC.out, 980, 520, 1.02], [SEC.out + 11.3, 650, 520, 2.5], [DUR, 650, 520, 2.55]];
const camX = monotone(CAM.map(k => [k[0], k[1]])), camY = monotone(CAM.map(k => [k[0], k[2]])), camZ = monotone(CAM.map(k => [k[0], Math.log(k[3])]));
function camSet(t) {
  const z = Math.exp(camZ(t)), hx = W / 2 / z, hy = H / 2 / z;
  const x = clamp(camX(t), hx, W - hx), y = clamp(camY(t), hy, H - hy);
  ctx.setTransform(z, 0, 0, z, W / 2 - x * z, H / 2 - y * z);
}

// ---------- building the world ----------
function sprite2(L, k = 2) {
  const [x0, y0, x1, y1] = bbox(L), c = document.createElement('canvas');
  c.width = Math.max(1, (x1 - x0) * k); c.height = Math.max(1, (y1 - y0) * k);
  const g = c.getContext('2d'); g.scale(k, k); g.translate(-x0, -y0); for (const s of L) drawS(g, s);
  return { cv: c, x0, y0, w: x1 - x0, h: y1 - y0, L };
}
const drawSpr = (s, a = 1) => { if (a <= 0) return; ctx.globalAlpha = a; ctx.drawImage(s.cv, s.x0, s.y0, s.w, s.h); ctx.globalAlpha = 1; };
const hillPoly = [[-40, 660]]; for (let x = -40; x <= 1960; x += 40) hillPoly.push([x, 600 - 60 * fbm(x * .003 + 4) - 30 * Math.sin(x * .002)]); hillPoly.push([1960, 660]);
const W_ = {};
function buildWorld() {
  W_.sky = {}; W_.ground = {}; W_.hill = {};
  for (const k in SKY) {
    W_.sky[k] = sprite2(withSeed(11, () => { const S = []; fill(S, R(-40, -40, 2000, 720), y => mixc(SKY[k][0], SKY[k][1], clamp((y + 40) / 700)), 96, { a: .5 }); return S; }), 1);
    W_.hill[k] = sprite2(withSeed(12, () => { const S = []; fill(S, hillPoly, [HILL[k], mixc(HILL[k], '#000000', .08)], 60, { a: .6 }); return S; }), 1);
    W_.ground[k] = sprite2(withSeed(13, () => { const S = []; fill(S, R(-40, 640, 2000, 480), GROUND[k], 90, { a: .58 }); return S; }), 1);
  }
  // the house (painted at 2× for the close-ups)
  W_.house = sprite2(withSeed(21, () => { const S = [];
    fill(S, R(522, 420, 456, 282), ['#c8b8a2', '#bfae97'], 40, { a: .75 });
    fill(S, R(522, 420, 456, 30), '#8f7d6c', 26, { a: .5 });
    fill(S, R(860, 296, 44, 100), ['#7a5a4a', '#6f5142'], 20, { a: .9 });
    fill(S, [[488, 432], [750, 262], [1012, 432]], ['#6b4a3e', '#5f4237'], 32, { a: .88 });
    fill(S, R(600, 470, 100, 100), ['#3a3f55', '#343950'], 26, { a: .8 });
    fill(S, R(818, 560, 82, 142), ['#5a4034', '#50392e'], 24, { a: .9 });
    fill(S, R(800, 700, 120, 16), '#8a7a6a', 12, { a: .8 });
    poly2line(S, R(600, 470, 100, 100), 5, INK, { a: .8 }); line(S, qcurve(650, 470, 650, 570, 0, 6), 4, INK); line(S, qcurve(600, 520, 700, 520, 0, 6), 4, INK);
    poly2line(S, R(522, 420, 456, 282), 3, INK2, { a: .55 });
    line(S, qcurve(486, 434, 750, 260, -4, 12), 4, INK2, { a: .6 }); line(S, qcurve(750, 260, 1014, 434, -4, 12), 4, INK2, { a: .6 });
    fill(S, E(882, 640, 5, 5), '#d9b36a', 5, { a: .9 });
    return S; }));
  W_.glow = withSeed(22, () => { const S = []; fill(S, R(604, 474, 92, 92), ['#f2c35e', '#f4cd76'], 22, { a: .85 }); line(S, qcurve(650, 474, 650, 566, 0, 6), 4, INK, { a: .7 }); line(S, qcurve(604, 520, 696, 520, 0, 6), 4, INK, { a: .7 }); return S; });
  W_.halo = withSeed(23, () => { const S = []; fill(S, E(650, 520, 150, 130), ['#f0cf86', '#f2d79a'], 40, { a: .22, holes: [[650, 520, 52, 52]] }); return S; });
  // fence and gate
  W_.fence = sprite2(withSeed(31, () => { const S = [], c = '#7a6a5a';
    for (let x = -10; x < 1940; x += 92) { if (x > 1170 && x < 1300) continue; line(S, qcurve(x, 836, x + rnd(-3, 3), 748, 0, 6), 13, c, { nb: 3 }); }
    for (const y of [770, 812]) { line(S, qcurve(-20, y, 1182, y + 2, 4, 30), 8, c); line(S, qcurve(1300, y, 1940, y - 2, 4, 20), 8, c); }
    line(S, qcurve(1182, 840, 1182, 730, 0, 6), 16, '#5e5044'); line(S, qcurve(1300, 840, 1300, 730, 0, 6), 16, '#5e5044');
    return S; }), 1);
  W_.gate = withSeed(32, () => { const S = [], c = '#5e5044';
    for (let i = 0; i < 6; i++) line(S, qcurve(8 + i * 20, 834, 8 + i * 20, 752, 0, 5), 6, c);
    line(S, qcurve(0, 764, 112, 764, 0, 6), 8, c); line(S, qcurve(0, 818, 112, 818, 0, 6), 8, c); line(S, qcurve(0, 818, 112, 764, 0, 6), 6, c, { a: .7 });
    return S; });
  W_.path = withSeed(33, () => { const S = []; fill(S, [[1196, 836], [1290, 836], [1560, 1100], [1060, 1100]], ['#c9b58e', '#d2c09a'], 40, { a: .6 });
    fill(S, [[1196, 760], [1250, 760], [905, 712], [850, 712]], ['#c9b58e', '#d2c09a'], 16, { a: .55 }); return S; });
  // the tree: one structure, grown in stages; leaves per season
  W_.tree = {};
  const LEAF = { spring: ['#e6a9b4', '#a9c47a', '#c2d48e'], summer: ['#5f8a4c', '#7aa05c', '#4b7240'], autumn: ['#d08a3a', '#b8652e', '#e0b04f'], dawn: ['#6f9a50', '#8fb062', '#c9b75a'],
    bloom: ['#f0c4cc', '#e9a3b0', '#f6e0e2'], winter: null };
  const grow = { winter: .38, spring: .58, summer: .8, autumn: .8 };
  for (const [stage, sc] of [['s1', .38], ['s2', .58], ['s3', .8], ['s4', 1.05]]) for (const k in LEAF) {
    const T = withSeed(41, () => woody(sc)), L = [...T.S];
    if (LEAF[k]) withSeed(42 + Object.keys(LEAF).indexOf(k), () => { for (const [x, y] of T.tips) clump(L, x, y, 70 * sc, Math.round(26 * sc + 6), LEAF[k], { l0: 14 * sc + 6, l1: 30 * sc + 8, w0: 12 * sc + 4, w1: 24 * sc + 6 }); });
    else withSeed(49, () => { for (const [x, y] of T.tips) fill(L, E(x, y - 6, 18 * sc + 4, 6 * sc + 2), '#f1eef4', 8, { a: .9 }); });
    W_.tree[stage + k] = sprite2(L.map(s => shift(s, TREE[0], TREE[1])), 1);
  }
  W_.bloomLeaves = withSeed(60, () => { const T = woody(1.05), L = []; for (const [x, y] of T.tips) clump(L, x, y, 85, 40, LEAF.bloom, { l0: 18, l1: 36, w0: 16, w1: 30 }); return L.map(s => shift(s, TREE[0], TREE[1])); });
  W_.sprout = withSeed(61, () => { const S = []; fill(S, E(0, 6, 46, 12), '#4a3a30', 12, { a: .8 }); S.push(mk(qcurve(0, 0, 4, -40, 6, 6), 5, '#5f8a4c', { prof: 'even', nb: 0 }));
    S.push(mk(qcurve(4, -36, -20, -50, 4, 5), 14, '#7aa05c', { prof: 'leaf', nb: 0 }), mk(qcurve(4, -38, 26, -54, -4, 5), 14, '#8fb062', { prof: 'leaf', nb: 0 })); return S.map(s => shift(s, TREE[0], TREE[1])); });
  W_.mound = withSeed(62, () => { const S = []; fill(S, E(0, 4, 70, 18), ['#4a3a30', '#54412f'], 14, { a: .85 }); fill(S, E(0, -2, 10, 7), '#d2ae72', 6, { a: .9 }); return S.map(s => shift(s, TREE[0], TREE[1])); });
  W_.bird = withSeed(70, () => { const S = []; fill(S, E(0, 0, 20, 14), [VERM, '#d04f33'], 10, { a: .95 }); fill(S, E(16, -12, 10, 9), VERM, 8, { a: .95 });
    S.push(mk(qcurve(-16, 2, -42, 14, 0, 5), 10, '#8f2f1f', { prof: 'tip', nb: 0 }), mk(qcurve(-6, -4, -24, 4, 3, 5), 12, '#a8371f', { prof: 'leaf', nb: 0 }), mk(qcurve(25, -12, 33, -10, 0, 3), 4, '#e0a040', { nb: 0 })); return S; });
  W_.figure = withSeed(80, () => { const S = []; person(S, 0, 0, 330, '#3b3236'); return S.map(s => shift(s, 1290, 1010)); });
  W_.sun = withSeed(81, () => { const S = []; fill(S, E(0, 0, 92, 92), [VERM, '#cf5233'], 26, { a: .9 }); return S; });
  W_.rays = withSeed(82, () => { const S = []; for (let i = 0; i < 11; i++) S.push(mk(polar(330, 560, -Math.PI + .25 + i * .26, 900, 0, 10), 7, '#f2c46a', { prof: 'tip', nb: 0, a: .5 })); return S; });
}
function shift(s, dx, dy) { s.pts = s.pts.map(([x, y]) => [x + dx, y + dy]); return s; }
function woody(sc) {                                     // trunk and branches, root at (0, 0); returns strokes and leaf-clump tips
  const S = [], tips = [], tr = mk(qcurve(0, 0, 8 * sc, -230 * sc, 16 * sc, 14), 44 * sc, '#5a4232', { prof: 'trunk', nb: 5 });
  S.push(tr, edgeOf(tr, 1, 3, INK2, .6));
  const B = [[.45, -2.5, 170], [.55, -.65, 180], [.7, -2.1, 150], [.78, -1.0, 160], [.9, -1.75, 140], [.62, -2.85, 120], [.66, -.3, 120]];
  for (const [f, a, l] of B) {
    const p = tr.pts[Math.round(f * (tr.pts.length - 1))], b = mk(polar(p[0], p[1], a, l * sc, 12 * sc, 8), 15 * sc, '#5a4232', { prof: 'tip', nb: 3 }); S.push(b);
    const e = b.pts[b.pts.length - 1]; tips.push(e);
    for (const d of [-.45, .4]) { const tw = mk(polar(e[0], e[1], a + d, l * .45 * sc, 4 * sc, 6), 7 * sc, '#5a4232', { prof: 'tip', nb: 0 }); S.push(tw); tips.push(tw.pts[tw.pts.length - 1]); }
  }
  tips.push([tr.pts[tr.pts.length - 1][0], tr.pts[tr.pts.length - 1][1] - 20 * sc]);
  return { S, tips };
}

// ---------- weather drawn per frame (seeded per streak) ----------
function drawRain(t, r) {
  const n = Math.round(110 * r); if (!n) return;
  for (let i = 0; i < n; i++) {
    const x = hash(i * 3.1) * 2300 - 200, y = (hash(i * 7.7) * 1400 + t * 1100) % 1400 - 200;
    withSeed(500 + i, () => drawS(ctx, mk(qcurve(x, y, x - 34, y + 92, 0, 4), 2.6, '#a6b2c8', { prof: 'even', nb: 0, a: .55 })));
  }
}
function drawFlakes(t, a, cols, n, spd, size, leaf = false) {
  if (a <= 0) return;
  for (let i = 0; i < n; i++) {
    const x0 = leaf ? TREE[0] + (hash(i * 5.3) - .5) * 520 : hash(i * 5.3) * 2000 - 40, y = (hash(i * 2.9) * 1200 + t * spd * (.7 + .6 * hash(i))) % 1200 - 100;
    const x = x0 + Math.sin(t * 1.3 + i) * 26;
    if (leaf && (y < 300 || y > 820)) continue;
    withSeed(900 + i, () => drawS(ctx, mk(qcurve(x, y, x + size * .6, y + size * .4, 2, 3), size, cols[i % cols.length], { prof: 'leaf', nb: 0, a: .85 }), 1, null, a));
  }
}

// ---------- frame ----------
let PAPER_IMG;
const drawPaper = () => ctx.drawImage(PAPER_IMG, 0, 0, 1920, 1080);
function layer(name, t, p) {                             // draw a seasonal sprite set, painted in by p on first appearance
  for (const [k, w] of seasonAt(t)) {
    const s = W_[name][k];
    if (p < 1) { ctx.globalAlpha = w; drawList(ctx, s.L, p); ctx.globalAlpha = 1; } else drawSpr(s, w);
  }
}
function treeAt(t) {                                    // grown stage by when that season began, leaves by season; cross-faded
  if (t < SEC.v2 - 1) return [];
  const stage = s => s < SEC.v2 + 3 * BAR ? 's1' : s < SEC.v2 + 6 * BAR ? 's2' : s < SEC.h2 ? 's3' : 's4';
  return seasonAt(t).filter(([k]) => !['night', 'storm'].includes(k)).map(([k, w, s]) => [stage(s) + (k === 'bloom' ? 'spring' : k), w]);
}
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  camSet(t); drawPaper();
  layer('sky', t, seg(t, 14, 22));
  if (t > SEC.h3) { const sp = seg(t, SEC.h3 + 1.5, SEC.h3 + 13); drawList(ctx, W_.rays, seg(t, SEC.h3 + 6, SEC.h3 + 12)); ctx.save(); ctx.translate(330, lerp(700, 420, eio(sp))); drawList(ctx, W_.sun, seg(t, SEC.h3 + 1.5, SEC.h3 + 3.5)); ctx.restore(); }
  if (t > 36.67 && t < 37.3) { withSeed(3, () => drawS(ctx, mk(path([[1500, 40], [1460, 180], [1530, 260], [1480, 420]], 3), 5, '#f1eef4', { prof: 'tip', nb: 0 }))); }
  layer('hill', t, seg(t, 17, 23));
  layer('ground', t, seg(t, 19, 25));
  drawList(ctx, W_.path.slice(0), seg(t, SEC.h2 + 7, SEC.h2 + 15));
  if (t >= SEC.h1 + 2 && t < SEC.v2 + 1) { const f = 1 - ss(seg(t, SEC.v2 - .5, SEC.v2 + 1)); ctx.globalAlpha = f; drawList(ctx, W_.mound, seg(t, SEC.h1 + 2.5, SEC.h1 + 6.5)); drawList(ctx, W_.sprout, seg(t, SEC.h1 + 9, SEC.h1 + 15)); ctx.globalAlpha = 1; }
  for (const [k, w] of treeAt(t)) drawSpr(W_.tree[k], w * ss(seg(t, SEC.v2 - .8, SEC.v2 + 1.2)));
  if (t > SEC.br + 3 * BAR - .2 && t < SEC.h3 + 2) { ctx.globalAlpha = 1 - ss(seg(t, SEC.h3, SEC.h3 + 2)); drawList(ctx, W_.bloomLeaves, seg(t, SEC.br + 3 * BAR - .2, SEC.br + 3 * BAR + .7)); ctx.globalAlpha = 1; }
  if (W_.house) { const p = seg(t, 4.5, 12.8); if (p < 1) drawList(ctx, W_.house.L, p); else drawSpr(W_.house); }
  { const p = seg(t, 22, 28); if (p > 0) { if (p < 1) drawList(ctx, W_.fence.L, p); else drawSpr(W_.fence); } }
  if (t > 22) { const op = eio(seg(t, SEC.h2 + 2.5, SEC.h2 + 7.5)); ctx.save(); ctx.translate(1182, 0); ctx.scale(1 - 1.3 * op, 1); drawList(ctx, W_.gate, seg(t, 26, 28.5)); ctx.restore(); }
  // the red bird visits each season
  for (const [a, b, x, y, fl] of [[SEC.v2 + 2, SEC.v2 + 9, 1086, 744, 1], [SEC.v2 + 3 * BAR + 2, SEC.v2 + 3 * BAR + 9, 1390, 520, -1], [SEC.v2 + 6 * BAR + 2, SEC.v2 + 6 * BAR + 9, 1300, 724, -1], [SEC.v2 + 9 * BAR + 2, SEC.v2 + 9 * BAR + 9, 760, 252, 1], [SEC.h3 + 12, DUR + 1, 1180, 724, 1]]) {
    const f = fade2(t, a, b, .2, .8); if (f <= 0) continue;
    ctx.save(); ctx.translate(x, y); ctx.scale(fl * .9, .9); ctx.globalAlpha = f; drawList(ctx, W_.bird, seg(t, a, a + 1.2)); ctx.restore(); ctx.globalAlpha = 1;
  }
  drawList(ctx, W_.figure, seg(t, SEC.h3 + 5, SEC.h3 + 12));
  // weather
  drawRain(t, rain(t));
  drawFlakes(t, fade2(t, SEC.v2 + .5, SEC.v2 + 3 * BAR, 1, 1) + fade2(t, SEC.br, SEC.br + BAR, .4, .4), ['#f4f2f6', '#e9e6ef'], 90, 60, 7);
  drawFlakes(t, fade2(t, SEC.v2 + 9 * BAR + 1, SEC.h2, 1, 1), ['#d08a3a', '#b8652e', '#e0b04f'], 26, 70, 14, true);
  // the night glaze, then the lamp on top of it
  const d = dark(t); if (d > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = rgba('#5d6690', .62 * d); ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const L = lamp(t); if (L > 0) { ctx.globalAlpha = L; drawList(ctx, W_.halo, t < 6 ? seg(t, 2, 5.5) : 1); drawList(ctx, W_.glow, t < 6 ? seg(t, 1, 4) : 1); ctx.globalAlpha = 1; }
  for (const lt of [36.67, 43.33]) { const f = t >= lt ? Math.exp(-(t - lt) * 7) * (t < lt + .8 ? 1 : 0) : 0; if (f > .01) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = rgba('#efe9f2', .5 * f); ctx.fillRect(0, 0, W, H); ctx.restore(); } }
  // outro: mist rises, the lit window stays
  const m = eio(seg(t, SEC.out + 7, DUR - .6));
  if (m > 0) {
    for (const [lift, a] of [[90, .55], [0, 1]]) {
      const top = 1180 - m * 1500 - lift; ctx.save(); ctx.beginPath(); ctx.moveTo(-10, 1200);
      for (let x = -10; x <= 1940; x += 30) ctx.lineTo(x, top + (vnoise(x * .006 + lift) - .5) * 160 + Math.sin(x * .01 + t) * 10);
      ctx.lineTo(1940, 1200); ctx.closePath(); ctx.clip(); ctx.globalAlpha = a; drawPaper(); ctx.restore();
    }
    ctx.globalAlpha = ss(seg(t, SEC.out + 9, DUR - 1)); drawList(ctx, W_.halo, 1); drawList(ctx, W_.glow, 1); ctx.globalAlpha = 1;
  }
}
window.render = render;
(async () => {
  PAPER_IMG = new Image(); PAPER_IMG.src = 'paper.jpg'; await PAPER_IMG.decode();
  buildWorld();
  window.READY = true;
})();
