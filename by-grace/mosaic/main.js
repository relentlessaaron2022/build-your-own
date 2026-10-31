// main.js — Mosaic: 21 paintings fill a 7 × 3 sheet, night (left) to dawn (right); in each hook a standing figure is glazed across the whole sheet.
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const BAR = 60 / 72 * 4;                                    // 72 BPM, 4/4
const SEC = { intro: 0, v1: 4 * BAR, h1: 16 * BAR, v2: 22 * BAR, h2: 34 * BAR, br: 40 * BAR, h3: 44 * BAR, out: 50 * BAR };
window.DUR = 54 * BAR;
const GX0 = 110, GY0 = 118, GW = 1700, GH = 844, GUT = 18, NC = 7, NR = 3;
const tw = (GW - GUT * (NC - 1)) / NC, th = (GH - GUT * (NR - 1)) / NR, K = Math.min(tw / TW, th / TH);
// grid position of each tile in story order (column = time)
const POS = [[0, 1], [0, 0], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2], [3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2], [5, 0], [5, 1], [5, 2], [6, 2], [6, 1], [6, 0]];
const tileXY = i => [GX0 + POS[i][0] * (tw + GUT) + (tw - TW * K) / 2, GY0 + POS[i][1] * (th + GUT) + (th - TH * K) / 2];
const tileC = i => { const [x, y] = tileXY(i); return [x + TW * K / 2, y + TH * K / 2]; };
// when each tile paints: [start, length]
const SLOT = [];
SLOT[0] = [0, 4 * BAR];
for (let i = 1; i <= 8; i++) SLOT[i] = [SEC.v1 + (i - 1) * 1.5 * BAR, 1.5 * BAR];
for (let i = 9; i <= 16; i++) SLOT[i] = [SEC.v2 + (i - 9) * 1.5 * BAR, 1.5 * BAR];
for (let i = 17; i <= 20; i++) SLOT[i] = [SEC.br + (i - 17) * BAR, BAR];
const paintP = (t, i) => i === 0 ? seg(t, 1.2, 10.4) : seg(t, SLOT[i][0] + .35, SLOT[i][0] + SLOT[i][1] * .84);

// ---------- camera: world (the sheet, 1920 × 1080) → screen ----------
const CAM = [];
{
  const ZT = 3.05, ZB = 2.25, key = (t, x, y, z) => CAM.push([t, x, y, z]);
  const [c0x, c0y] = tileC(0);
  key(0, c0x, c0y + 6, 2.75); key(SLOT[1][0] - .7, c0x, c0y, 3.2);
  const tileKeys = (i, z) => {
    const [s, d] = SLOT[i], [x, y] = tileC(i), prev = CAM[CAM.length - 1], tm = (prev[0] + s + .3) / 2;
    if (Math.abs(prev[1] - x) > 50) key(tm, (prev[1] + x) / 2, (prev[2] + y) / 2, Math.min(prev[3], z) * .8);
    key(s + .3, x, y, z); key(s + d - .5, x + 4, y - 3, z * 1.035);
  };
  for (let i = 1; i <= 8; i++) tileKeys(i, ZT);
  key(SEC.h1 + 3.2, 960, 540, 1.0); key(SEC.h1 + 19.0, 960, 556, 1.1);
  for (let i = 9; i <= 16; i++) tileKeys(i, ZT);
  key(SEC.h2 + 3.2, 960, 540, 1.0); key(SEC.h2 + 19.0, 1010, 540, 1.08);
  for (let i = 17; i <= 20; i++) tileKeys(i, ZB);
  key(SEC.h3 + 3.4, 960, 540, 1.0); key(SEC.h3 + 19.6, 960, 545, 1.04);
  key(SEC.out + 5.5, 960, 545, 1.06); key(DUR, 975, 500, 1.3);
}
const camX = monotone(CAM.map(k => [k[0], k[1]])), camY = monotone(CAM.map(k => [k[0], k[2]])), camZ = monotone(CAM.map(k => [k[0], Math.log(k[3])]));
function camSet(t) { const z = Math.exp(camZ(t)); ctx.setTransform(z, 0, 0, z, W / 2 - camX(t) * z, H / 2 - camY(t) * z); return z; }

// ---------- the standing figure, glazed across the sheet in three stages ----------
const FIG = [], GLAZE = '#5a3e33';
let HEART = [], SUN = [];
function buildFigure() {
  const s1 = [], s2 = [], s3 = [], o = { a: .3, nb: 4 };
  fill(s1, [[700, 938], [1220, 938], [1220, 962], [700, 962]], GLAZE, 26, { a: .22 });                                  // ground
  fillV(s1, [[892, 640], [1028, 640], [1066, 944], [854, 944]], GLAZE, 40, o);                                           // robe, from the hem up
  fillV(s2, [[930, 338], [990, 338], [1046, 372], [1060, 470], [1084, 660], [1052, 668], [1030, 500], [1028, 660], [892, 660], [890, 500], [868, 668], [836, 660], [860, 470], [874, 372]], GLAZE, 34, o);
  fillV(s3, [[942, 290], [978, 290], [982, 346], [938, 346]], GLAZE, 24, o);
  fill(s3, E(960, 250, 50, 58, 32), GLAZE, 26, o);                                                                       // the head, lifted
  for (const s of [s1, s2, s3]) s.reverse();                                                                              // paint from the bottom up
  FIG.push(s1, s2, s3);
  HEART = [mk(qcurve(988, 432, 972, 404, -8, 6), 26, VERM, { prof: 'leaf', nb: 3, a: .9 }), mk(qcurve(988, 432, 1004, 404, 8, 6), 26, VERM, { prof: 'leaf', nb: 3, a: .9 })];
  for (let i = 0; i < 12; i++) { const y = 150 + i * 70; SUN.push(mk(qcurve(1790, y + rnd(-10, 10), 130, y + rnd(-20, 20), rnd(-30, 30), 30), 110, pick(['#e9b660', '#eec274', '#e4aa55']), { prof: 'brush', nb: 4, a: .16 })); }
}
const FIGT = [[SEC.h1 + 1.5, SEC.h1 + 15], [SEC.h2 + 1.5, SEC.h2 + 15], [SEC.h3 + 1.5, SEC.h3 + 10]];
const HOOKW = [[SEC.h1, SEC.v2], [SEC.h2, SEC.br], [SEC.h3, DUR + 2]];
const glazeAmt = t => .45 + .55 * Math.max(...HOOKW.map(([a, b]) => ss(seg(t, a - .5, a + 1.5)) * (1 - ss(seg(t, b - .5, b + .8)))));
function drawFigure(t, am) {
  for (let k = 0; k < 3; k++) { const p = seg(t, FIGT[k][0], FIGT[k][1]); if (p <= 0) continue; drawList(ctx, FIG[k], eio(p), null, am); }
  const hp = seg(t, SEC.h3 + 9, SEC.h3 + 11.5); if (hp > 0) drawList(ctx, HEART, hp);
}

// ---------- notes, mist ----------
function hand(txt, x, y, p, size = 15) {
  if (p <= 0) return;
  ctx.save(); ctx.font = `600 ${size}px Caveat`; ctx.textBaseline = 'middle';
  const w = ctx.measureText(txt).width; ctx.beginPath(); ctx.rect(x - 4, y - size, (w + 8) * eo(p), size * 2); ctx.clip();
  ctx.fillStyle = rgba(INK, .82); ctx.fillText(txt, x, y); ctx.restore();
}
function mist(t, t0, t1) {
  const c = eio(seg(t, t0, t1)); if (c <= 0) return;
  for (const [lift, a] of [[90, .55], [0, 1]]) {
    const top = 1180 - c * 1500 - lift;
    ctx.save(); ctx.beginPath(); ctx.moveTo(-500, 1500);
    for (let x = -500; x <= 2440; x += 40) ctx.lineTo(x, top + (vnoise(x * .006 + lift) - .5) * 160 + Math.sin(x * .01 + t) * 10);
    ctx.lineTo(2440, 1500); ctx.closePath(); ctx.clip(); ctx.globalAlpha = a; drawPaper(); ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ---------- frame ----------
let PAPER_IMG, TL = [], SPR = [];
const drawPaper = () => ctx.drawImage(PAPER_IMG, -480, -270, 2880, 1620);
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  camSet(t); drawPaper();
  for (let i = 0; i < TL.length; i++) {
    const p = paintP(t, i); if (p <= 0) continue;
    const [x, y] = tileXY(i);
    ctx.save(); ctx.translate(x, y); ctx.scale(K, K);
    if (p >= 1) ctx.drawImage(SPR[i].cv, SPR[i].x0, SPR[i].y0); else drawList(ctx, TL[i], p);
    ctx.restore();
    const nt = i === 0 ? 10.2 : SLOT[i][0] + SLOT[i][1] * .78;
    hand(NOTES[i], x + 6, y + TH * K + 9, seg(t, nt, nt + .9));
  }
  const sp = seg(t, SEC.h3 + 5, SEC.h3 + 17);
  if (sp > 0) { ctx.globalCompositeOperation = 'multiply'; drawList(ctx, SUN, sp); ctx.globalCompositeOperation = 'source-over'; }
  drawFigure(t, glazeAmt(t));
  if (t > SEC.out) { mist(t, SEC.out + 1, SEC.out + 7); ctx.globalAlpha = ss(seg(t, SEC.out + 1, SEC.out + 7)); drawFigure(t, 1); ctx.globalAlpha = 1; }
}
window.render = render;
(async () => {
  PAPER_IMG = new Image(); PAPER_IMG.src = 'paper.jpg'; await PAPER_IMG.decode();
  await document.fonts.load('600 15px Caveat');
  for (let i = 0; i < TILE.length; i++) { TL[i] = withSeed(1000 + i * 37, () => TILE[i](POS[i][0])); SPR[i] = sprite(TL[i]); }
  withSeed(77, buildFigure);
  window.READY = true;
})();
