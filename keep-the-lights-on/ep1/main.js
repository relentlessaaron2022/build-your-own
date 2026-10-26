// Keep the Lights On — Ep. 1 "$1,625" — 1930s rubber hose cartoon, vertical
import * as T from './toon.js';
import { P } from './chars.js';
import { makeFilm, post, GATE, FW, FH } from './film.js';
import { paintBedroom, paintBathroom, drawBG, camM, MATTRESS, FLOOR, ROD, TUB_Y, DOOR } from './bg.js';
import { phone, glow, pillow, her, puff, reach, silhouette } from './cast.js';
import { DUR, BEAT, T as TL, SHOTS, shotAt, CARDS } from './story.js';
import { clamp, lerp, seg, ss, eo, ei, eio, back, hash } from '/core/lib.js';

const Q = new URLSearchParams(location.search);
const cv = document.getElementById('c'); cv.width = FW; cv.height = FH;
await document.fonts.ready; await document.fonts.load('40px "IM Fell English SC"');
const F = makeFilm(cv), sg = F.sg; T.init(F.scene);
const BED = paintBedroom(), BATH = paintBathroom();
T.init(F.scene);

const st = t => Math.floor(t * 12 + 1e-6) / 12;                       // characters on twos
const breath = t => Math.cos(2 * Math.PI * st(t) / BEAT);             // one extreme per beat
const E = (t, a, b) => ss(seg(t, a, b));
const scr = (cam, x, y) => { const m = camM(cam); return [m[0] * x + m[4], m[3] * y + m[5]]; };
function begin(t, cam) { sg.setTransform(1, 0, 0, 1, 0, 0); sg.fillStyle = '#000'; sg.fillRect(0, 0, 1080, 1440); T.frame(t); T.transform(...camM(cam)); }
function worldClip(cam, x0, y0, x1, y1) { const [a, b] = scr(cam, x0, y0), [c, d] = scr(cam, x1, y1); sg.save(); sg.beginPath(); sg.rect(a, b, c - a, d - b); sg.clip(); }

const PHX = 800, PHY = MATTRESS + 6;
const pillows = (t, o = {}) => {
  const br = breath(t) * .025;
  pillow(470, MATTRESS + 2, 260, 112, { br });
  if (o.front !== false) pillow(560, MATTRESS + 10, 272, 102, { br: br + (o.pomf || 0), lift: o.lift || 0 });
};
// a pillow drawn alone (the front one), for layering over the phone
const frontPillow = (t, o = {}) => pillow(560, MATTRESS + 10, 272, 102, { br: breath(t) * .025 + (o.pomf || 0), lift: o.lift || 0 });
function hop(u, H) {   // u = seconds since the ping: squash, air, land, spring back
  if (u < 0) return { y: 0, sy: 1 };
  if (u < .08) return { y: 0, sy: 1 - .15 * (u / .08) };
  if (u < .5) { const s = (u - .08) / .42; return { y: -H * 4 * s * (1 - s), sy: 1.1 - .1 * Math.abs(.5 - s) * 2 }; }
  const v = u - .5; return { y: 0, sy: 1 - .14 * Math.exp(-v * 9) * Math.cos(v * 26) };
}
function steamFromDoor(t, k0 = 0) {   // puffs drifting out of the bathroom door, up and left
  for (let i = 0; i < 6; i++) {
    const per = 3.2, ph = ((t * .5 + i / 6 * per) % per) / per, age = ph;
    const x = DOOR.x0 + 20 + hash(i * 5.1) * 120 - age * (260 + hash(i) * 200) + Math.sin(i * 3 + t) * 20;
    const y = DOOR.y0 + 120 + hash(i * 9.3) * 360 - age * (180 + hash(i * 2) * 260);
    puff(x, y, 30 + hash(i * 4.4) * 30 + age * (60 + hash(i * 6) * 60), i + k0, P.pale);
  }
}

// ———————————— shot 1: the bed, three pings ————————————
function shotBed(t) {
  const u = E(t, TL.push[0], TL.push[1]);
  const cam = { x: lerp(780, 800, u), y: lerp(830, 790, u), z: lerp(1.25, 1.62, u) };
  begin(t, cam); drawBG(sg, BED, cam); T.frame(t); T.transform(...camM(cam));
  // steam curling in from the bathroom on the right
  for (let i = 0; i < 3; i++) { const ph = ((t * .07 + i * .33) % 1); puff(1300 - ph * (200 + i * 90) + hash(i) * 60, 380 + hash(i * 7) * 320 - ph * 140, 36 + hash(i * 3) * 30 + ph * 40, 30 + i); }
  pillows(t);
  const ts = st(t), [p1, p2, p3] = TL.pings;
  let ph = { x: PHX, y: PHY, screen: 'dim', eyes: { type: 'shut' }, mouth: { type: 'flat', w: 30 }, sy: 1 + breath(t) * .03, light: 0 };
  const lastPing = [p1, p2, p3].filter(p => ts >= p).length;
  if (lastPing > 0) {
    const pt = [p1, p2, p3][lastPing - 1], v = ts - pt, H = [44, 76, 118][lastPing - 1], h = hop(v, H);
    ph.screen = 'awake'; ph.y = PHY + h.y; ph.sy = h.sy;
    ph.eyes = { type: v < .3 ? 'wide' : 'open', lx: 0, ly: v < .5 ? -.4 : 0 };
    ph.light = v < .45 ? (Math.floor(v * 12) % 2 ? 0 : 1) : 0;
    ph.mouth = lastPing === 1 ? { type: v < .35 ? 'o' : 'smile', w: 56 } : lastPing === 2 ? { type: 'grin', w: 64, open: .5 } : { type: 'beam', w: 74, open: .7 };
    const up = lastPing === 3 && v > .05;
    ph.armL = up ? { x: -150, y: -420, hand: 'wave' } : { x: -128, y: -170, hand: 'open' };
    ph.armR = up ? { x: 150, y: -440, hand: 'wave' } : lastPing === 2 ? { x: 128, y: -120, hand: 'thumb' } : { x: 128, y: -170, hand: 'open' };
    if (ts > TL.pings[2] + 1.6) { ph.eyes = { type: 'open', lx: .85, ly: -.1, lid: .32 }; ph.mouth = { type: 'smile', w: 56 }; ph.armL = { x: -118, y: -140, hand: 'open' }; ph.armR = { x: 70, y: -40, hand: 'fist' }; }
    const fl = Math.exp(-v * 3);
    const [gx, gy] = scr(cam, PHX, PHY - 180 + h.y);
    glow(sg, gx, gy, 420 * cam.z, .18 + .35 * fl);
  }
  T.frame(t); T.transform(...camM(cam));
  phone(ph);
}

// ———————————— shot 2: her hands lock it and tuck it away ————————————
function shotHands(t) {
  const cam = { x: 660, y: 800, z: 2.0 };
  begin(t, cam); drawBG(sg, BED, cam); T.frame(t); T.transform(...camM(cam));
  const ts = st(t), u = ts - TL.lock;
  const [s0, s1] = TL.slide, mv = E(ts, s0, s1), drop = E(ts, s0 + .25, s1);
  const pomf = ts >= TL.pomf ? .1 * Math.exp(-(ts - TL.pomf) * 7) * Math.cos((ts - TL.pomf) * 22) : 0;
  const lift = 46 * Math.sin(Math.PI * clamp((ts - s0 + .15) / (s1 - s0 + .15), 0, 1));
  pillow(470, MATTRESS + 2, 260, 112, { br: breath(t) * .025 });
  const x = lerp(PHX, 560, mv), y = lerp(PHY, 1165, drop), rot = Math.sin(mv * Math.PI) * -.25;
  const locked = u >= .08;
  worldClip(cam, -500, -800, 2500, MATTRESS + 8);
  phone({ x, y, rot, screen: locked ? 'dark' : 'awake', eyes: locked ? { type: 'shut' } : { type: 'wide', ly: -.3 }, mouth: locked ? { type: 'flat', w: 26 } : { type: 'o', w: 56 }, legs: true });
  sg.restore();
  T.frame(t); T.transform(...camM(cam));
  frontPillow(t, { pomf, lift });
  // her arms rise from below the frame; gloves hug the phone's sides until the tuck, then withdraw
  const out = E(ts, TL.handsOut[0], TL.handsOut[1]);
  const hy = y - 170 + out * 520, hxL = x - 108 - out * 120, hxR = x + 108 + out * 120;
  const showHands = ts < TL.handsOut[1] + .1;
  if (showHands) {
    reach(520, 1260, hxL, hy, 40, 'grab', false);
    if (u < .3) reach(1060, 1100, x + 128, y - 236, -30, 'point', true);   // a finger on the side button: lock
    else reach(1000, 1260, hxR, hy, -40, 'grab', true);
  }
  if (locked && ts > TL.pomf) { const [gx, gy] = scr(cam, 600, MATTRESS + 4); glow(sg, gx, gy, 120 * cam.z, .08 + .05 * breath(t)); }
}

// ———————————— shot 3: tiptoe to the bathroom ————————————
function herWalk(t, x0, stepsT, dx, o = {}) {
  const ts = st(t); let n = 0; for (const s of stepsT) if (ts >= s) n++;
  const cur = n > 0 ? clamp((ts - stepsT[n - 1]) / BEAT, 0, 1) : 0, moving = n > 0 && n <= stepsT.length && cur < 1 && !(n === stepsT.length && cur >= .99);
  const prog = Math.max(0, n - 1) + (n > 0 ? eio(Math.min(1, cur * 1.4)) : 0);
  const x = x0 + dx * Math.min(prog, stepsT.length), lifting = n > 0 && n <= stepsT.length && cur < .7;
  const lf = lifting ? Math.sin(Math.PI * cur / .7) : 0, leftUp = n % 2 === 1;
  const bob = lf * 14;
  return {
    x, bob,
    legL: leftUp ? { x: -36 + lf * 20, y: -lf * 96, bend: -20 * lf } : { x: -30, y: 0 },
    legR: !leftUp ? { x: 36 + lf * 20, y: -lf * 96, bend: 20 * lf } : { x: 30, y: 0 },
  };
}
function shotTiptoe(t) {
  const ts = st(t), u = E(t, TL.rise[0] + .3, TL.steps[7] + .4);
  const cam = { x: lerp(1010, 1480, u), y: 640, z: .78 };
  begin(t, cam); drawBG(sg, BED, cam); T.frame(t); T.transform(...camM(cam));
  pillows(t);
  const [gx, gy] = scr(cam, 600, MATTRESS + 4); glow(sg, gx, gy, 110 * cam.z, .1 + .06 * breath(t));
  T.frame(t); T.transform(...camM(cam));
  steamFromDoor(t);
  const crouch = ts < TL.rise[1] ? (ts < TL.rise[0] + .25 ? 1 - .18 * (ts - TL.rise[0]) / .25 : .82) : 1 + .06 * Math.exp(-(ts - TL.rise[1]) * 8);
  const w = herWalk(t, 1200, TL.steps, 72);
  const sneak = ts >= TL.rise[0] + .2;
  her({ x: w.x, y: FLOOR + 30 - w.bob, k: .98, sy: crouch, legL: w.legL, legR: w.legR,
    armL: sneak ? { x: -168, y: -430 - w.bob * .6, hand: 'open', rot: 1.75, bend: 30, front: true } : { x: -120, y: -210, hand: 'open', front: true },
    armR: sneak ? { x: 168, y: -450 - w.bob * .6, hand: 'open', rot: 1.4, bend: -30, front: true } : { x: 120, y: -210, hand: 'open', front: true } });
}

// ———————————— shot 4: the shower curtain, the pull, the steam ————————————
const CUR = { x0: ROD.x0 + 12, x1: ROD.x1 - 12, y0: ROD.y, y1: TUB_Y - 6 };
function curtain(t, flap, gap) {
  const n = 9, pts = [], { x0, x1, y0, y1 } = CUR;
  for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([lerp(x0, x1, u) + Math.sin(u * 30 + t * 3) * 4 * flap, y1 + Math.sin(u * 18) * 10]); }
  const shapeP = [[x0, y0], [x1, y0], ...pts.reverse()];
  return { shapeP, n, gap };
}
function shotShower(t) {
  const ts = st(t), z = lerp(1.04, 1.16, E(t, TL.bath, TL.pillow));
  const cam = { x: 600, y: 700, z };
  begin(t, cam); drawBG(sg, BATH, cam); T.frame(t); T.transform(...camM(cam));
  const flap = ts > TL.pull[1] ? 3 * Math.exp(-(ts - TL.pull[1]) * 3) : 0;
  const C = curtain(t, flap);
  // curtain: lit from behind (paper white), folds, rings; silhouettes clipped inside
  const cpath = T.shape(C.shapeP, { fill: P.paper, stroke: false, boil: .4 });
  sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.clip(cpath);
  T.frame(t); T.transform(...camM(cam));
  const together = ts >= TL.pull[1];
  const sway = Math.sin(st(t) * 2.2) * .04;
  silhouette(together ? 640 : 660, TUB_Y + 60, 1.12, together ? .14 + sway : 0);
  if (together) silhouette(520, TUB_Y + 60, .98, -.06 - sway, true);
  // spray from the shower head (right wall)
  for (let i = 0; i < 9; i++) { const a = .5 + i * .07, ph = (t * 3 + i * .37) % 1; T.stroke([[880 + Math.cos(Math.PI - a) * 40 * ph, 420 + Math.sin(a) * 60 * ph], [880 + Math.cos(Math.PI - a) * (40 + 300 * ph), 420 + Math.sin(a) * (60 + 380 * ph)]], 2.5, { line: P.light }); }
  sg.restore();
  T.frame(t); T.transform(...camM(cam));
  T.outline(cpath, T.S.lw);
  for (let i = 1; i < 9; i++) { const x = lerp(CUR.x0, CUR.x1, i / 9) + Math.sin(i * 2.1 + t * 2) * 3 * (1 + flap); T.stroke([[x, CUR.y0 + 20], [x + Math.sin(i) * 8, (CUR.y0 + CUR.y1) / 2], [x - Math.sin(i * 1.3) * 6, CUR.y1 - 10]], T.S.lw * .55, { line: P.light }); }
  for (let i = 0; i <= 12; i++) T.shape(T.ell(lerp(CUR.x0, CUR.x1, i / 12), ROD.y, 9, 9, 12), { fill: P.light, lw: T.S.lw * .6 });
  // her: walks in from the left, stops at the curtain, gets pulled in
  if (ts < TL.pull[1]) {
    const w = herWalk(t, -60, [TL.bath, TL.bath + BEAT], 190);
    let x = w.x, y = FLOOR + 40, k = .95, sx = 1, sy = 1;
    if (ts >= TL.pull[0]) { const p = E(ts, TL.pull[0], TL.pull[1]); x = lerp(x, 560, p); y = lerp(y, FLOOR - 40, p); k = lerp(.95, .7, p); sx = lerp(1, .78, p); sy = lerp(1, 1.24, p); }
    else if (ts >= TL.grab + .3) { sy = .94; }
    her({ x, y: y - w.bob, k, sx, sy, legL: w.legL, legR: w.legR, armL: { x: -104, y: -220, hand: 'open' }, armR: { x: 104, y: -220, hand: 'open' } });
    // his arms: stretch out of the curtain and grab her waist
    if (ts >= TL.grab) {
      const s = E(ts, TL.grab, TL.grab + .4), ov = ts < TL.grab + .4 ? 0 : 0;
      const wx = x, wy = y - 300 * k;
      const hL = [lerp(500, wx - 70 * k, back(s, 1.4)), lerp(620, wy, back(s, 1.4))], hR = [lerp(500, wx + 70 * k, back(s, 1.4)), lerp(700, wy + 20, back(s, 1.4))];
      reach(500, 620, hL[0], hL[1], 60, 'grab', true);
      reach(500, 700, hR[0], hR[1], -50, 'grab', true);
    }
  }
  // steam: scattered puffs that grow until the frame is full
  if (ts >= TL.steam[0]) steamFill(t, ts, cam);
}
const PUFFS = Array.from({ length: 30 }, (_, k) => ({ s: TL.steam[0] + k * .145, x: 80 + hash(k * 3.1) * 1000, y: 120 + hash(k * 7.7) * 1250, seed: k * 11 }));
function steamFill(t, ts, cam, clearT = null) {
  T.frame(t);                                   // screen space for the steam
  for (const p of PUFFS) {
    if (ts < p.s) continue;
    let r = Math.min(470, 70 + (ts - p.s) * 150);
    if (clearT != null) r *= 1 - E(ts, clearT, clearT + .6);
    if (r < 4) continue;
    puff(p.x, p.y - (ts - p.s) * 30, r, p.seed, P.pale);
  }
  const full = clearT == null ? E(ts, TL.steam[1] - .5, TL.steam[1]) : 1 - E(ts, clearT, clearT + .35);
  if (full > 0) { sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalAlpha = full; sg.fillStyle = P.pale; sg.fillRect(0, 0, 1080, 1440); sg.restore(); }
}

// ———————————— shot 5: the pillow, the peek, the blink, iris out ————————————
function shotPillow(t) {
  const ts = st(t), cam = { x: 600, y: 820, z: 2.15 };
  begin(t, cam); drawBG(sg, BED, cam); T.frame(t); T.transform(...camM(cam));
  pillow(470, MATTRESS + 2, 260, 112, { br: breath(t) * .025 });
  const pk = E(ts, TL.peek, TL.peek + .5), by = lerp(1165, 1020, back(pk, 1.2));
  const blinkOn = ts >= TL.blink && ts < TL.blink + .125;
  worldClip(cam, -500, -800, 2500, MATTRESS + 8);
  phone({ x: 600, y: by, screen: 'awake', oneEye: true, wink: null, eyes: { type: 'open', lx: ts > TL.peek + .9 ? -.6 : .5, ly: .2, lid: .38 }, mouth: { type: 'none' }, light: blinkOn ? 1 : 0, legs: true });
  sg.restore();
  T.frame(t); T.transform(...camM(cam));
  frontPillow(t);
  const [gx, gy] = scr(cam, 600, by - 321);
  glow(sg, gx, gy + 60, 200 * cam.z, ts < TL.peek ? .1 + .06 * breath(t) : .22);
  if (blinkOn) glow(sg, gx, gy, 260, .9);
  // steam clearing from the previous shot (steam wipe)
  if (ts < TL.pillow + 1) steamFill(t, ts, cam, TL.pillow);
  // iris out, closing on the light, snapping shut on the blink
  if (ts >= TL.blink) {
    const r = ts >= TL.irisEnd ? 0 : 900 * (1 - ei(seg(ts, TL.blink, TL.irisEnd)));
    sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.fillStyle = '#000'; sg.beginPath(); sg.rect(0, 0, 1080, 1440); if (r > 0) { sg.moveTo(gx + r, gy); sg.arc(gx, gy, r, 0, Math.PI * 2, true); } sg.fill('evenodd'); sg.restore();
  }
}

// ———————————— period title cards ————————————
const CARD_Y = 1250;
function card(text, cx, cy, a = 1) {
  const g = sg, size = 46;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a;
  g.font = `${size}px "IM Fell English SC"`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const tw = g.measureText(text).width, w = tw + size * 2, h = size * 2.1, x0 = cx - w / 2, y0 = cy - h / 2;
  g.fillStyle = 'rgba(12,11,10,.94)'; g.beginPath(); g.roundRect(x0, y0, w, h, 10); g.fill();
  g.strokeStyle = P.paper; g.lineWidth = 2.4; g.beginPath(); g.roundRect(x0 + 8, y0 + 8, w - 16, h - 16, 8); g.stroke();
  g.lineWidth = 1; g.beginPath(); g.roundRect(x0 + 14, y0 + 14, w - 28, h - 28, 6); g.stroke();
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const ax = sx > 0 ? x0 + 14 : x0 + w - 14, ay = sy > 0 ? y0 + 14 : y0 + h - 14;
    g.fillStyle = P.paper; g.beginPath(); g.arc(ax + sx * 8, ay + sy * 8, 3.4, 0, 7); g.fill();
    g.lineWidth = 1.4; g.beginPath(); g.arc(ax + sx * 8, ay + sy * 8, 8, 0, 7); g.stroke();
  }
  g.fillStyle = P.paper; g.fillText(text, cx, cy + 3);
  g.restore();
  return [x0, y0, x0 + w, y0 + h];
}
const BOX = {};
function cards(t) {
  for (const [a, b, text] of CARDS) if (t >= a && t < b) BOX[text] = card(text, 540, CARD_Y);
}

const FN = { bed: shotBed, hands: shotHands, tiptoe: shotTiptoe, shower: shotShower, pillow: shotPillow };
const cutAt = SHOTS.map(s => s[0]);
function render(t) {
  t = Math.min(t, DUR - 1e-4);
  const sh = shotAt(t);
  FN[sh[2]](t);
  if (Q.get('nocards') !== '1') cards(t);
  const f = Math.round(t * 24), jump = cutAt.some(c => c > 0 && Math.round(c * 24) === f) ? 3 : 0;
  if (t >= TL.irisEnd) { sg.setTransform(1, 0, 0, 1, 0, 0); sg.fillStyle = '#000'; sg.fillRect(0, 0, 1080, 1440); }
  post(F, t, { jump });
}
// on-screen texts for readcheck (page pixels)
window.TEXTS = t => {
  const out = [];
  for (const [a, b, text] of CARDS) if (t >= a && t < b) { card(text, 540, CARD_Y, 0); const B = BOX[text] || [200, CARD_Y - 48, 880, CARD_Y + 48]; out.push({ id: text, text, x0: B[0], y0: B[1] + GATE.y, x1: B[2], y1: B[3] + GATE.y }); }
  return out;
};
// sound events for the mixer
const EV = [];
EV.push({ t: 0, type: 'showerFar', d: TL.bath });
TL.pings.forEach((p, i) => { EV.push({ t: p, type: 'ping', i }); EV.push({ t: p + .5, type: 'hop', i }); });
EV.push({ t: TL.lock, type: 'click' });
EV.push({ t: TL.slide[0], type: 'swish' });
EV.push({ t: TL.pomf, type: 'pomf' });
EV.push({ t: TL.rise[0], type: 'crouch' });
TL.steps.forEach(s => EV.push({ t: s + BEAT * .45, type: 'tiptoe' }));
EV.push({ t: TL.bath, type: 'showerNear', d: TL.pillow - TL.bath });
[TL.bath, TL.bath + BEAT].forEach(s => EV.push({ t: s + BEAT * .45, type: 'tiptoe' }));
EV.push({ t: TL.grab, type: 'stretch', d: .4 });
EV.push({ t: TL.grab + .4, type: 'smack' });
EV.push({ t: TL.pull[0], type: 'whoosh' });
EV.push({ t: TL.pull[1], type: 'curtain' });
EV.push({ t: TL.steam[0], type: 'steam', d: TL.steam[1] - TL.steam[0] + .4 });
EV.push({ t: TL.pillow, type: 'showerFar', d: TL.blink - TL.pillow });
EV.push({ t: TL.peek, type: 'peek' });
EV.push({ t: TL.irisEnd, type: 'iris' });
window.EV = EV;
window.DUR = DUR;
window.render = render;
window.READY = true;
