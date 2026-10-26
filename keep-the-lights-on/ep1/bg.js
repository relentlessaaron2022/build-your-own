// bg.js — greyscale watercolour backgrounds, painted once and cached (wash / grain / canvas helpers from styles/rubber-hose/demo/bg.js)
// Contrast rule: walls stay mid grey; character white and ink black stay brighter / darker than anything here.
import * as T from './toon.js';
import { mulberry } from '/core/lib.js';
const { shape, ell, arc, rr, rect, spline } = T;

export function wash(pts, col, o = {}) {
  const g = T.g, Pth = shape(pts, { fill: col, stroke: false, boil: 0 });
  const rnd = mulberry(o.seed ?? 7);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clip(Pth);
  const bb = pts.map(p => T.tx(p[0], p[1])), xs = bb.map(p => p[0]), ys = bb.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const n = Math.min(110, Math.max(8, ((x1 - x0) * (y1 - y0)) / 9000 | 0));
  g.filter = 'blur(10px)';
  for (let i = 0; i < n; i++) { const r = 20 + rnd() * 90; g.fillStyle = rnd() > .5 ? `rgba(30,28,25,${.03 + rnd() * .05})` : `rgba(255,253,245,${.03 + rnd() * .05})`; g.beginPath(); g.ellipse(x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0), r, r * (.5 + rnd() * .6), rnd() * 3, 0, 7); g.fill(); }
  if ((o.edge ?? .16) > 0) { g.filter = 'blur(7px)'; g.strokeStyle = `rgba(20,18,16,${o.edge ?? .16})`; g.lineWidth = 26; g.stroke(Pth); }
  g.filter = 'none'; g.restore();
  if (o.line !== false) T.outline(Pth, o.lw ?? 3.2, o.lineCol ?? '#2A2927');
  return Pth;
}
function paperGrain(g, w, h, seed = 3) {
  const rnd = mulberry(seed); g.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < w * h / 900; i++) { g.fillStyle = rnd() > .5 ? 'rgba(20,18,15,.06)' : 'rgba(255,255,250,.05)'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
}
function withCanvas(bg, fn) {
  const prev = T.g, oldB = T.BASE.slice(), oldL = T.S.lwScale, { PS, ox, oy } = bg;
  T.init(bg.cv); T.BASE.splice(0, 6, PS, 0, 0, PS, -ox * PS, -oy * PS); T.S.lwScale = PS; T.frame(0, { amp: 0 });
  const raw = () => T.g.setTransform(PS, 0, 0, PS, -ox * PS, -oy * PS);
  fn(T.g, raw); T.g.setTransform(1, 0, 0, 1, 0, 0);
  paperGrain(T.g, bg.cv.width, bg.cv.height, ox + 3);
  T.BASE.splice(0, 6, ...oldB); T.S.lwScale = oldL; T.init(prev.canvas);
}
function makeBG(x0, y0, x1, y1, PS) { const cv = document.createElement('canvas'); cv.width = Math.round((x1 - x0) * PS); cv.height = Math.round((y1 - y0) * PS); return { cv, ox: x0, oy: y0, PS, w: x1 - x0, h: y1 - y0 }; }
// cam = {x, y, z}: world point (x, y) lands at the gate centre (540, 720)
export const camM = cam => [cam.z, 0, 0, cam.z, 540 - cam.x * cam.z, 720 - cam.y * cam.z];
export function drawBG(sg, bg, cam, squash = 0, pivotY = 1180) {
  const [z, , , , ox, oy] = camM(cam);
  sg.save(); sg.setTransform(z, 0, 0, z, ox, oy);
  if (squash) { sg.translate(0, pivotY); sg.scale(1 - squash * .4, 1 + squash); sg.translate(0, -pivotY); }
  sg.drawImage(bg.cv, bg.ox, bg.oy, bg.w, bg.h); sg.restore();
}

// —— Bedroom (headboard left, window over the bed, bathroom door right) ——
export const FLOOR = 1180, MATTRESS = 905, DOOR = { x0: 1660, x1: 1930, y0: 360 }, WIN = { x0: 620, x1: 1120, y0: 240, y1: 720 };
export function paintBedroom() {
  const bg = makeBG(-260, -420, 2360, 1820, 1.25), X0 = -260, W = 2620;
  withCanvas(bg, (g, raw) => {
    wash(rect(X0, -430, W, 110), '#3E3D3A', { seed: 21, edge: 0 });
    wash(rect(X0, -322, W, 16), '#5A5853', { seed: 22 });
    // wallpaper: mid grey, faint stripes, small diamonds
    wash(rect(X0, -306, W, FLOOR + 306), '#8C8981', { line: false, seed: 1, edge: 0 });
    raw();
    for (let x = X0; x < X0 + W; x += 64) { g.fillStyle = 'rgba(255,253,245,.06)'; g.fillRect(x, -306, 22, FLOOR + 306); }
    for (let x = X0 + 32; x < X0 + W; x += 128) for (let y = -270; y < FLOOR - 40; y += 96) { g.fillStyle = 'rgba(30,28,24,.2)'; g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + 6, y); g.lineTo(x, y + 8); g.lineTo(x - 6, y); g.fill(); }
    // window: night city behind half-raised blinds
    const { x0, x1, y0, y1 } = WIN;
    wash(rr(x0 - 26, y0 - 26, x1 - x0 + 52, y1 - y0 + 52, 6), '#4A4844', { seed: 41 });
    wash(rect(x0, y0, x1 - x0, y1 - y0), '#2E2D2A', { seed: 42, edge: .2 });
    const rnd = mulberry(5);
    for (let bx = x0 - 10; bx < x1; bx += 70 + rnd() * 40) {
      const top = y0 + 260 + rnd() * 160, bw = 60 + rnd() * 50;
      wash(rect(bx, top, bw, y1 - top), '#1F1E1C', { seed: bx | 0, edge: 0, lineCol: '#141312', lw: 2 });
      raw(); for (let wy = top + 18; wy < y1 - 14; wy += 26) for (let wx = bx + 10; wx < bx + bw - 12; wx += 20) if (rnd() > .55) { g.fillStyle = '#C8C5BC'; g.fillRect(wx, wy, 9, 12); }
    }
    raw(); g.fillStyle = 'rgba(241,238,230,.9)'; g.beginPath(); g.arc(x1 - 70, y0 + 70, 26, 0, 7); g.fill();   // moon
    for (let sy = y0 + 4; sy < y0 + 300; sy += 22) wash(rect(x0 - 8, sy, x1 - x0 + 16, 15), '#B3B0A8', { seed: sy, edge: .06, lw: 2 });
    wash(rect(x0 - 12, y0 + 300, x1 - x0 + 24, 18), '#6E6B64', { seed: 43, lw: 2.4 });
    raw(); g.strokeStyle = '#2A2927'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x1 - 30, y0 + 318); g.lineTo(x1 - 30, y0 + 420); g.stroke();
    wash(ell(x1 - 30, y0 + 428, 8, 11), '#3B3A37', { seed: 44, edge: 0 });
    wash(rect(x0 - 40, y1 + 22, x1 - x0 + 80, 26), '#4A4844', { seed: 45 });
    // streetlight through the blinds: pale slanted stripes on the wall, right of the window
    raw(); g.save(); g.globalCompositeOperation = 'source-over';
    for (let k = 0; k < 9; k++) { const yy = y0 + 40 + k * 34; g.fillStyle = 'rgba(255,252,238,.11)'; g.beginPath(); g.moveTo(x1 + 40, yy); g.lineTo(x1 + 520, yy + 210); g.lineTo(x1 + 520, yy + 228); g.lineTo(x1 + 40, yy + 16); g.fill(); }
    g.restore();
    // skirting + floorboards + rug
    wash(rect(X0, FLOOR - 30, W, 30), '#2E2D2A', { seed: 15 });
    wash(rect(X0, FLOOR, W, 640), '#6B6963', { seed: 16, line: false, edge: 0 });
    raw(); g.strokeStyle = 'rgba(25,24,22,.35)'; g.lineWidth = 2;
    for (const [yy, step] of [[FLOOR + 40, 0], [FLOOR + 96, 1], [FLOOR + 176, 0], [FLOOR + 290, 1], [FLOOR + 440, 0]]) { g.beginPath(); g.moveTo(X0, yy); g.lineTo(X0 + W, yy); g.stroke(); }
    wash(ell(1250, FLOOR + 150, 520, 80, 60), '#9A978F', { seed: 17, edge: .1 });
    // bed (side view): headboard post left, footboard right, mattress, blanket
    wash(rr(286, 560, 40, FLOOR - 560, 12), '#5A5853', { seed: 51 }); wash(ell(306, 556, 28, 24), '#4A4844', { seed: 52 });
    wash(rr(1356, 760, 36, FLOOR - 760, 12), '#5A5853', { seed: 53 }); wash(ell(1374, 756, 26, 22), '#4A4844', { seed: 54 });
    for (const yy of [660, 760]) wash(rect(326, yy, 18, 14), '#5A5853', { seed: yy, lw: 2 });
    wash(rect(326, 1040, 1030, 26), '#3F3E3A', { seed: 55 });
    wash(rr(326, MATTRESS, 1030, 135, 16), '#C8C5BC', { seed: 56, edge: .1 });
    wash(spline([[640, MATTRESS + 4], [900, MATTRESS - 10], [1120, MATTRESS + 2], [1356, MATTRESS - 6], [1366, 1000], [1340, 1082], [1220, 1066], [1080, 1090], [940, 1064], [800, 1086], [660, 1060], [620, 980]], true, 6), '#A8A59D', { seed: 57, edge: .12 });
    raw(); g.strokeStyle = 'rgba(40,38,34,.35)'; g.lineWidth = 2.4;
    for (const [a, c] of [[[760, 940], [830, 1060]], [[980, 930], [1020, 1050]], [[1180, 935], [1240, 1060]]]) { g.beginPath(); g.moveTo(...a); g.quadraticCurveTo(a[0] + 40, (a[1] + c[1]) / 2, ...c); g.stroke(); }
    for (let x = 340; x < 1356; x += 18) { g.fillStyle = 'rgba(40,38,34,.18)'; g.fillRect(x, 1012, 2, 22); }
    // nightstand + a glass of water
    wash(rr(1440, 960, 160, FLOOR - 960, 6), '#5E5C57', { seed: 61 }); wash(rect(1430, 950, 180, 18), '#4A4844', { seed: 62 });
    wash(rr(1462, 990, 116, 70, 6), '#6E6B64', { seed: 63, edge: .1 }); wash(ell(1520, 1025, 9, 9), '#2A2927', { seed: 64, edge: 0 });
    wash([[1500, 880], [1540, 880], [1536, 950], [1504, 950]], '#C8C5BC', { seed: 65, edge: .05, lw: 2.4 });
    // bathroom door: frame, bright interior, door slab ajar
    const D = DOOR;
    wash(rect(D.x0 - 24, D.y0 - 24, D.x1 - D.x0 + 48, FLOOR - D.y0 + 24), '#3F3E3A', { seed: 71 });
    wash(rect(D.x0, D.y0, D.x1 - D.x0, FLOOR - D.y0), '#D9D6CD', { seed: 72, edge: .1 });
    raw(); g.strokeStyle = 'rgba(40,38,34,.22)'; g.lineWidth = 2;
    for (let yy = D.y0 + 40; yy < FLOOR; yy += 46) { g.beginPath(); g.moveTo(D.x0 + 90, yy); g.lineTo(D.x1, yy); g.stroke(); }
    for (let xx = D.x0 + 90; xx < D.x1; xx += 46) { g.beginPath(); g.moveTo(xx, D.y0); g.lineTo(xx, FLOOR); g.stroke(); }
    wash([[D.x0, D.y0], [D.x0 + 92, D.y0 + 30], [D.x0 + 92, FLOOR - 10], [D.x0, FLOOR]], '#6E6B64', { seed: 73 });
    wash(ell(D.x0 + 74, 780, 9, 9), '#2A2927', { seed: 74, edge: 0 });
    // spill of bathroom light onto the floor
    raw(); g.fillStyle = 'rgba(255,252,240,.14)'; g.beginPath(); g.moveTo(D.x0 + 92, FLOOR); g.lineTo(D.x1, FLOOR); g.lineTo(D.x1 + 160, FLOOR + 300); g.lineTo(D.x0 - 60, FLOOR + 300); g.fill();
  });
  return bg;
}

// —— Bathroom: tiled wall, shower rod, tub; the curtain and the silhouettes are drawn live ——
export const ROD = { x0: 200, x1: 960, y: 300 }, TUB_Y = 990;
export function paintBathroom() {
  const bg = makeBG(-300, -400, 1400, 1900, 1.25), X0 = -300, W = 1700;
  withCanvas(bg, (g, raw) => {
    wash(rect(X0, -410, W, FLOOR + 410), '#A29F97', { line: false, seed: 81, edge: 0 });
    raw(); g.strokeStyle = 'rgba(40,38,34,.32)'; g.lineWidth = 2;
    for (let y = -400; y < FLOOR; y += 60) { g.beginPath(); g.moveTo(X0, y); g.lineTo(X0 + W, y); g.stroke(); }
    for (let x = X0; x < X0 + W; x += 60) { g.beginPath(); g.moveTo(x, -400); g.lineTo(x, FLOOR); g.stroke(); }
    wash(rect(X0, 120, W, 16), '#6E6B64', { seed: 82 });
    // towel on a hook + a small mirror
    wash(ell(1110, 420, 10, 10), '#2A2927', { seed: 83, edge: 0 });
    wash(spline([[1060, 430], [1160, 430], [1170, 640], [1140, 700], [1080, 690], [1050, 640]], true, 6), '#B3B0A8', { seed: 84, edge: .1 });
    raw(); g.strokeStyle = 'rgba(40,38,34,.35)'; g.lineWidth = 3; for (const yy of [600, 625]) { g.beginPath(); g.moveTo(1058, yy); g.lineTo(1166, yy); g.stroke(); }
    wash(rr(1040, 150, 150, 190, 60), '#5E5C57', { seed: 85 }); wash(rr(1056, 166, 118, 158, 50), '#8E8B83', { seed: 86, edge: .08 });
    // tub
    wash(rr(ROD.x0 - 20, TUB_Y - 20, ROD.x1 - ROD.x0 + 40, 36, 14), '#C8C5BC', { seed: 87 });
    wash(rr(ROD.x0, TUB_Y, ROD.x1 - ROD.x0, FLOOR - TUB_Y - 20, 30), '#B3B0A8', { seed: 88, edge: .12 });
    for (const fx of [ROD.x0 + 40, ROD.x1 - 70]) wash(ell(fx + 15, FLOOR - 10, 24, 14), '#3B3A37', { seed: fx, edge: 0 });
    // floor: checker
    wash(rect(X0, FLOOR, W, 720), '#8A877F', { seed: 89, line: false, edge: 0 });
    raw();
    const rows = [[FLOOR, 50], [FLOOR + 50, 70], [FLOOR + 120, 96], [FLOOR + 216, 130], [FLOOR + 346, 170]];
    rows.forEach(([y, h], r) => { const tw = 90 + r * 18; for (let i = -3; i * tw < W + 400; i++) if ((i + r) % 2 === 0) { g.fillStyle = '#34332F'; const x = X0 + i * tw - r * 40; g.beginPath(); g.moveTo(x, y); g.lineTo(x + tw * .92, y); g.lineTo(x + tw * .92 + (x + tw * .92 - 580) * h / 900, y + h); g.lineTo(x + (x - 580) * h / 900, y + h); g.fill(); } });
    wash(rect(X0, FLOOR - 26, W, 26), '#2E2D2A', { seed: 90 });
    // rod
    wash(rr(ROD.x0 - 20, ROD.y - 9, ROD.x1 - ROD.x0 + 40, 18, 9), '#3B3A37', { seed: 91 });
  });
  return bg;
}
