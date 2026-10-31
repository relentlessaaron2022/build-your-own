// Relentless Times — one page, five reports (?story=bronx|cobee|miami|pg|callaway). Vertical 1080×1920, no music.
// Style: news-package structure + pen & wash sketches (sketch.js) + 60s-spy cut-paper titles (cutpaper.js). See ../relentless-times-test/style/STYLE.md.
import { paper, ink, wash, bloom, palm, INK, VIOLET } from './sketch.js';
import { SPY, piece } from './cutpaper.js';
import { STORIES } from './stories.js';
const W = 1080, H = 1920;
const cv = document.getElementById('out'), ctx = cv.getContext('2d');
const Q = new URLSearchParams(location.search), KEY = Q.get('story') || 'bronx', S = STORIES[KEY];
const C = { ink: '#121417', ink2: '#1B1E23', ink3: '#22262C', lemon: '#F2CF1D', lemonL: '#F8DE4A', lemonD: '#D8B30C', gold: '#D4B064', paper: '#F4F1E8', olive: '#6E5A1E', grey: '#C9CCD2', grey2: '#7D838D' };
const F = { b8: s => `800 ${s}px Barlow`, b6: s => `600 ${s}px Barlow`, mono: s => `500 ${s}px Plex`, hand: s => `600 ${s}px Caveat` };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - x, 3), eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, back = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
let TX = [];
function text(s, x, y, font, color, align = 'left', ls = 0, id = null) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = ls + 'px'; ctx.fillText(s, x, y);
  const w = ctx.measureText(s).width; ctx.letterSpacing = '0px';
  if (id) { const fs = parseInt(font.match(/ (\d+)px/)[1]), x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2, m = ctx.getTransform();
    const ps = [[x0, y - fs], [x0 + w, y - fs], [x0, y + 8], [x0 + w, y + 8]].map(([a, b]) => m.transformPoint({ x: a, y: b }));
    TX.push({ id, text: s, x0: Math.min(...ps.map(q => q.x)), y0: Math.min(...ps.map(q => q.y)), x1: Math.max(...ps.map(q => q.x)), y1: Math.max(...ps.map(q => q.y)) }); }
  return w;
}
const tw = (s, font, ls = 0) => { ctx.font = font; ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; };
const fit = (s, size, maxW, ls = 0, f = F.b8) => Math.floor(Math.min(size, size * maxW / tw(s, f(size), ls)));
function push(t, at, s, x, y, font, col, id, h = 140) { const k = eo(seg(t, at, at + .32)); if (k <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(0, y - h + 14, W, h + 16); ctx.clip(); text(s, x, y + (1 - k) * h, font, col, 'left', 2, k >= 1 ? id : null); ctx.restore(); }
function wrap(s, font, maxW) { const out = []; let line = ''; for (const w of s.split(' ')) { const t2 = line ? line + ' ' + w : w; if (tw(t2, font) > maxW && line) { out.push(line); line = w; } else line = t2; } if (line) out.push(line); return out; }

// ———————— timeline from the voice ————————
const DURS = await (await fetch(`vo/${KEY}/dur.json`)).json();
const TITLE = 3.2, GAP = .45;
let cur = TITLE; const LINES = S.lines.map((l, i) => { const id = 'l' + String(i).padStart(2, '0'), d = DURS[id]; const o = { ...l, id, t0: cur, d }; cur += d + GAP; return o; });
LINES.forEach((l, i) => { l.t1 = i < LINES.length - 1 ? LINES[i + 1].t0 : l.t0 + l.d + 2.2; });
const DUR = LINES[LINES.length - 1].t1;

// ———————— package parts ————————
function studioBg(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(760, 520, 60, 760, 520, 1300); rg.addColorStop(0, 'rgba(242,207,29,.12)'); rg.addColorStop(1, 'rgba(242,207,29,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 6; i++) { const x = ((i * 300 + t * (24 + i * 5)) % 2000) - 300, w = 40 + hash(i) * 110; ctx.fillStyle = `rgba(242,207,29,${.02 + hash(i + 9) * .03})`; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w - 700, H); ctx.lineTo(x - 700, H); ctx.fill(); }
  ctx.fillStyle = 'rgba(244,241,232,.05)'; for (let x = 30 - (t * 12) % 48; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
}
function plate(cx, cy, s) {
  const w = 520 * s, h = 180 * s, k = h * .28; ctx.save(); ctx.translate(cx, cy);
  const path = new Path2D(); path.moveTo(-w / 2 + k, -h / 2); path.lineTo(w / 2 + k, -h / 2); path.lineTo(w / 2 - k, h / 2); path.lineTo(-w / 2 - k, h / 2); path.closePath();
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, C.lemonL); g.addColorStop(1, C.lemonD); ctx.fillStyle = g; ctx.fill(path); ctx.save(); ctx.clip(path);
  const gx = -w / 2 - k; ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(gx + 2 * k, -h / 2); ctx.lineTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.lineTo(gx, h / 2); ctx.fill();
  ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + 2 * k + w * .11, -h / 2); ctx.lineTo(gx + w * .11, h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.fill();
  ctx.font = F.b8(100); const fsz = Math.min(h * .62, 100 * w * .7 / ctx.measureText('RELENTLESS').width); text('RELENTLESS', -w * .3, fsz * .36, F.b8(fsz), C.ink);
  ctx.restore(); ctx.restore();
}
function bug(light) { plate(880, 140, .36); text('TIMES', 790, 152, F.b8(28), light ? C.ink : '#fff', 'right', 3); text('AI VOICE', 1032, 206, F.mono(16), light ? C.olive : C.grey2, 'right', 3); }
const TABCOL = { 'ON THE RECORD': [C.paper, C.ink, true], 'FAMILY ACCOUNT': [C.lemon, C.ink, false], 'CHARGED': [SPY.red, SPY.cream, false], 'OPEN QUESTIONS': [C.lemon, C.ink, false], 'CONTEXT': [C.paper, C.ink, true], 'COMMENTARY': [C.lemon, C.ink, false], 'HELP': [C.paper, C.ink, true] };
function strap(L, t) {
  if (!L.tab) return;
  const x0 = 48, ty = 1352, by = 1400, bh = 108, bw = 864;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x0 + 8, by + 8, bw + 120, bh);
  ctx.fillStyle = C.paper; ctx.fillRect(x0, by, bw, bh); ctx.strokeStyle = 'rgba(18,20,23,.45)'; ctx.lineWidth = 2; ctx.strokeRect(x0, by, bw, bh);
  ctx.fillStyle = C.lemon; ctx.fillRect(x0, by, 14, bh);
  ctx.fillStyle = C.ink; ctx.fillRect(x0 + bw, by, 120, bh); ctx.fillStyle = C.lemon; ctx.fillRect(x0 + bw, by, 120, 6); text('RT', x0 + bw + 60, by + 72, F.b8(48), C.lemon, 'center', 2);
  text(L.hl, x0 + 36, by + 58, F.b8(fit(L.hl, 48, bw - 60, 1)), C.ink, 'left', 1, 'strap'); text(L.sub, x0 + 38, by + 92, F.b6(fit(L.sub, 24, bw - 60, 1.5, F.b6)), C.olive, 'left', 1.5, 'strape');
  const [bg, fg, bar] = TABCOL[L.tab], tabW = 40 + tw(L.tab, F.b8(30), 2), flash = clamp(1 - (t - L.t0) / .25);
  ctx.fillStyle = bg; ctx.fillRect(x0, ty, tabW, by - ty); if (bar) { ctx.fillStyle = C.lemon; ctx.fillRect(x0, ty, 8, by - ty); }
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(x0, ty, tabW, by - ty); }
  text(L.tab, x0 + 20, ty + 37, F.b8(30), fg, 'left', 2, 'tab');
}
function source(L, light) { if (!L.src) return; ctx.globalAlpha = .85; text('SOURCE: ' + L.src, 1032, 1334, F.mono(15), light ? C.olive : C.gold, 'right', 1.5, 'src'); ctx.globalAlpha = 1; }
function eyebrow(t, at, s, light = false, y = 340) { const k = eo(seg(t, at, at + .3)); ctx.globalAlpha = k; ctx.fillStyle = C.lemon; ctx.fillRect(60, y - 22, 10, 28); text(s, 86, y, F.mono(fit(s, 24, 930, 3, F.mono)), light ? C.olive : C.gold, 'left', 3, 'eye'); ctx.globalAlpha = 1; }
function stamp(t, at, x, y, word, col = C.lemon) {
  const sk = seg(t, at, at + .16); if (sk <= 0) return; const s = 1 + .9 * (1 - eo(sk)), w = tw(word, F.b8(54), 4) + 90;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.07); ctx.scale(s, s); ctx.globalAlpha = clamp(sk * 3);
  ctx.fillStyle = 'rgba(18,20,23,.94)'; ctx.fillRect(-w / 2, -54, w, 108); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.strokeRect(-w / 2 + 10, -44, w - 20, 88); ctx.lineWidth = 1.5; ctx.strokeRect(-w / 2 + 18, -36, w - 36, 72);
  text(word, 0, 19, F.b8(54), col, 'center', 4, 'stamp'); ctx.restore();
}
function tag(a, b) { const x = 48, y = 210, h = 64, w = 470; ctx.fillStyle = 'rgba(18,20,23,.85)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = C.gold; ctx.fillRect(x, y, 8, h); text(a, x + 26, y + 28, F.mono(18), C.gold, 'left', 2, 'tag'); text(b, x + 26, y + 54, F.b6(24), '#fff', 'left', 1, 'tag2'); }

// ———————— pen & wash place sketches ————————
function building(t0, t, x, y, w, h, o) {   // a facade: outline, window marks, local-colour wash, shadow side to violet
  const sd = o.seed, d = k => clamp((t - t0) * 1.1 - k), pr = d(o.k || 0);
  ink(ctx, [[x, y], [x, y - h], [x + w, y - h - (o.slope || 0)], [x + w, y]], { seed: sd, w: 2.6, prog: pr });
  if (o.gable) ink(ctx, [[x - 8, y - h], [x + w / 2, y - h - o.gable], [x + w + 8, y - h]], { seed: sd + 1, w: 2.4, prog: d((o.k || 0) + .1) });
  const rows = o.rows || 3, cols = o.cols || 3;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (hash(sd + r * 7 + c) < .12) continue;
    const wx = x + (c + .5) * w / cols - 12, wy = y - h + (r + .5) * (h - 30) / rows - 16; ink(ctx, [[wx, wy], [wx + 24, wy], [wx + 24, wy + 32], [wx, wy + 32], [wx, wy]], { seed: sd + 10 + r * 9 + c, w: 1.4, over: 2, prog: d((o.k || 0) + .25 + (r + c) * .04) }); }
  if (o.door) ink(ctx, [[x + w * .45, y], [x + w * .45, y - 60], [x + w * .55, y - 60], [x + w * .55, y]], { seed: sd + 3, w: 1.8, prog: d((o.k || 0) + .3) });
  return () => { wash(ctx, [[x, y], [x, y - h - (o.gable || 0) * .6], [x + w, y - h - (o.slope || 0)], [x + w, y]], o.col || '#D8C6A0', { alpha: .5, seed: sd + 50 });
    wash(ctx, [[x + w * .7, y], [x + w * .7, y - h], [x + w, y - h - (o.slope || 0)], [x + w, y]], VIOLET, { alpha: .22, seed: sd + 51 }); };
}
function tree(t0, t, x, y, r, sd, k = .5) { const pr = clamp((t - t0) * 1.1 - k); ink(ctx, [[x, y], [x + 3, y - r * 1.1]], { seed: sd, w: 2.4, prog: pr });
  const pts = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; pts.push([x + Math.cos(a) * r * (.9 + .2 * hash(sd + i)), y - r * 1.6 + Math.sin(a) * r * .8 * (.9 + .2 * hash(sd + i + 3))]); }
  ink(ctx, [...pts, pts[0]], { seed: sd + 1, w: 1.6, wob: 2.2, prog: pr });
  return () => { for (let k2 = 0; k2 < 6; k2++) { const a = k2 / 6 * Math.PI * 2, cx = x + Math.cos(a) * r * .45, cy = y - r * 1.6 + Math.sin(a) * r * .35, poly = []; for (let q = 0; q < 8; q++) { const b = q / 8 * Math.PI * 2; poly.push([cx + Math.cos(b) * r * .5, cy + Math.sin(b) * r * .4]); } wash(ctx, poly, k2 % 2 ? '#7FA04A' : '#A7B85C', { alpha: .42, seed: sd + 20 + k2, amp: 5 }); } }; }
function lamp(t0, t, x, y, h, sd, k = .6) { const pr = clamp((t - t0) * 1.1 - k); ink(ctx, [[x, y], [x, y - h], [x + 50, y - h + 8]], { seed: sd, w: 2.2, prog: pr }); ink(ctx, [[x + 36, y - h + 6], [x + 62, y - h + 6], [x + 56, y - h + 22], [x + 40, y - h + 22]], { seed: sd + 1, w: 1.6, prog: pr }); }
const GROUND = 1180;
function placeSketch(place, t0, t) {
  const W2 = []; const add = f => { if (f) W2.push(f); };
  const sky = place === 'houses' ? '#4A5A86' : place === 'road' ? '#C9A9B8' : '#9FBCD6';
  ink(ctx, [[0, GROUND], [1080, GROUND - 6]], { seed: 1, w: 2.8, prog: clamp((t - t0) * 1.4) });
  if (place === 'street') {
    add(building(t0, t, 40, GROUND, 260, 560, { seed: 11, rows: 6, cols: 3, col: '#C9573F' })); add(building(t0, t, 300, GROUND, 230, 470, { seed: 12, rows: 5, cols: 3, col: '#D8C6A0', k: .15 }));
    add(building(t0, t, 530, GROUND, 250, 620, { seed: 13, rows: 6, cols: 3, col: '#B8483E', k: .3 }));
    for (let f = 0; f < 4; f++) ink(ctx, [[60, GROUND - 120 - f * 100], [280, GROUND - 120 - f * 100], [60, GROUND - 200 - f * 100]], { seed: 30 + f, w: 1.4, prog: clamp((t - t0) * 1.1 - .7) });
    add(tree(t0, t, 870, GROUND, 120, 40)); add(tree(t0, t, 1000, GROUND, 100, 41, .6)); lamp(t0, t, 800, GROUND, 330, 45);
  } else if (place === 'townhomes') {
    for (let i = 0; i < 4; i++) add(building(t0, t, 40 + i * 240, GROUND, 230, 380, { seed: 60 + i, rows: 2, cols: 2, gable: 90, door: true, col: ['#D8C6A0', '#C9C3B6', '#E0B987', '#BFC6B0'][i], k: i * .12 }));
    add(tree(t0, t, 1010, GROUND + 10, 80, 70, .8));
  } else if (place === 'apartments') {
    add(building(t0, t, 120, GROUND, 760, 520, { seed: 80, rows: 3, cols: 6, col: '#E6D3B3' }));
    for (let r = 0; r < 3; r++) ink(ctx, [[120, GROUND - 40 - r * 170], [880, GROUND - 40 - r * 170]], { seed: 85 + r, w: 2, prog: clamp((t - t0) * 1.1 - .5) });
    palm(ctx, 70, GROUND, 520, 88, clamp((t - t0) * 1.1 - .6), seg(t, t0 + 1.4, t0 + 2.6)); palm(ctx, 960, GROUND, 470, 89, clamp((t - t0) * 1.1 - .7), seg(t, t0 + 1.4, t0 + 2.6));
  } else if (place === 'houses') {
    add(building(t0, t, 60, GROUND, 400, 300, { seed: 100, rows: 2, cols: 3, gable: 140, door: true, col: '#C9C3B6' })); add(building(t0, t, 560, GROUND, 360, 280, { seed: 101, rows: 2, cols: 3, gable: 120, door: true, col: '#D8C6A0', k: .2 }));
    lamp(t0, t, 500, GROUND, 360, 105); add(tree(t0, t, 990, GROUND, 90, 106, .7));
  } else if (place === 'road') {
    ink(ctx, [[60, GROUND + 140], [470, GROUND - 260]], { seed: 120, w: 2.6, prog: clamp((t - t0) * 1.1 - .1) }); ink(ctx, [[1020, GROUND + 140], [610, GROUND - 260]], { seed: 121, w: 2.6, prog: clamp((t - t0) * 1.1 - .1) });
    for (let i = 0; i < 6; i++) { const u = i / 6, y0 = GROUND + 120 - u * 360, s = 1 - u * .8; ink(ctx, [[540, y0], [540, y0 - 50 * s]], { seed: 125 + i, w: 3 * s + .8, over: 1, prog: clamp((t - t0) * 1.1 - .3 - i * .05) }); }
    lamp(t0, t, 250, GROUND - 40, 400, 130); lamp(t0, t, 860, GROUND - 40, 380, 131);
    add(tree(t0, t, 120, GROUND - 200, 110, 132)); add(tree(t0, t, 960, GROUND - 200, 100, 133, .6));
    W2.push(() => wash(ctx, [[60, GROUND + 140], [470, GROUND - 260], [610, GROUND - 260], [1020, GROUND + 140]], '#8E8B83', { alpha: .35, seed: 134, amp: 6 }));
  } else if (place === 'park') {
    add(building(t0, t, 560, GROUND - 230, 470, 230, { seed: 140, rows: 2, cols: 5, col: '#D8A88A' }));
    ink(ctx, [[520, GROUND - 120], [1080, GROUND - 120]], { seed: 141, w: 1.6, prog: clamp((t - t0) * 1.1 - .4) });
    for (let i = 0; i < 4; i++) add(tree(t0, t, 80 + i * 150, GROUND - 10 - (i % 2) * 30, 110 + 20 * hash(i), 150 + i, .2 + i * .1));
    ink(ctx, [[40, GROUND + 120], [400, GROUND + 20], [700, GROUND - 40]], { seed: 160, w: 2, prog: clamp((t - t0) * 1.1 - .6) });
  } else if (place === 'corner') {
    add(building(t0, t, 60, GROUND, 520, 330, { seed: 170, rows: 1, cols: 4, door: true, col: '#D8C6A0' }));
    ink(ctx, [[60, GROUND - 200], [580, GROUND - 200], [600, GROUND - 160], [40, GROUND - 160]], { seed: 171, w: 2, prog: clamp((t - t0) * 1.1 - .4) });
    W2.push(() => wash(ctx, [[60, GROUND - 200], [580, GROUND - 200], [600, GROUND - 160], [40, GROUND - 160]], '#C9573F', { alpha: .55, seed: 172 }));
    ink(ctx, [[760, GROUND], [760, GROUND - 460], [940, GROUND - 460]], { seed: 173, w: 2.4, prog: clamp((t - t0) * 1.1 - .5) });
    ink(ctx, [[900, GROUND - 470], [960, GROUND - 470], [960, GROUND - 330], [900, GROUND - 330], [900, GROUND - 470]], { seed: 174, w: 1.8, prog: clamp((t - t0) * 1.1 - .6) });
    W2.push(() => { for (let i = 0; i < 3; i++) wash(ctx, [[910, GROUND - 460 + i * 44], [950, GROUND - 460 + i * 44], [950, GROUND - 424 + i * 44], [910, GROUND - 424 + i * 44]], ['#C9573F', '#E2B04A', '#7FA04A'][i], { alpha: .7, seed: 175 + i }); });
    ink(ctx, [[0, GROUND + 90], [1080, GROUND + 70]], { seed: 178, w: 2, prog: clamp((t - t0) * 1.1 - .3) });
  } else if (place === 'school') {
    add(building(t0, t, 80, GROUND, 760, 360, { seed: 190, rows: 2, cols: 7, door: true, col: '#C98E6B' }));
    ink(ctx, [[930, GROUND], [930, GROUND - 600]], { seed: 191, w: 2, prog: clamp((t - t0) * 1.1 - .5) }); ink(ctx, [[932, GROUND - 600], [1030, GROUND - 570], [932, GROUND - 540]], { seed: 192, w: 1.6, prog: clamp((t - t0) * 1.1 - .6) });
    for (let i = 0; i < 14; i++) ink(ctx, [[40 + i * 75, GROUND + 70], [40 + i * 75, GROUND + 10]], { seed: 193 + i, w: 1.4, over: 2, prog: clamp((t - t0) * 1.1 - .7) });
    ink(ctx, [[40, GROUND + 25], [1060, GROUND + 25]], { seed: 210, w: 1.4, prog: clamp((t - t0) * 1.1 - .7) });
  }
  // colour arrives after the line, from the middle of the page
  const r = 1500 * eo(seg(t, t0 + 1.0, t0 + 2.8));
  bloom(ctx, 540, 900, r, 7, () => { wash(ctx, [[0, 380], [1080, 380], [1080, GROUND - 300], [0, GROUND - 260]], sky, { alpha: .4, seed: 2, amp: 10 }); W2.forEach(f => f()); wash(ctx, [[0, GROUND], [1080, GROUND - 6], [1080, 1330], [0, 1330]], '#B8B0A0', { alpha: .28, seed: 9, amp: 10 }); });
}

// ———————— scenes ————————
function sceneSketch(L, t) {
  paper(ctx, W, H);
  placeSketch(L.scene.place, L.t0, t);
  ctx.save(); ctx.globalAlpha = clamp((t - L.t0 - 1.6) * 2); ctx.translate(560, 1300); ctx.rotate(-.025); text(L.scene.note, 0, 0, F.hand(fit(L.scene.note, 42, 480, 0, F.hand)), INK, 'left', 0, 'note'); ctx.restore();
  ctx.fillStyle = 'rgba(18,20,23,.9)'; ctx.fillRect(0, 290, W, 80); eyebrow(t, L.t0, `${S.date} · ${S.place}`);
  tag('SKETCH', 'Illustration, not a photo'); bug(true); strap(L, t); source(L, true);
}
function cardBase(L, t) { studioBg(t); bug(false); strap(L, t); source(L, false); }
function sceneName(L, t) {
  cardBase(L, t); const n = L.scene.name, fs = fit(n.split(' ').length > 2 ? n.split(' ').slice(0, 2).join(' ') : n, 150, 960, 2);
  eyebrow(t, L.t0, `${S.date} · ${S.place}`);
  const words = n.split(' '), lines = words.length > 2 ? [words.slice(0, 2).join(' '), words.slice(2).join(' ')] : [n];
  ctx.fillStyle = C.gold; ctx.fillRect(60, 560, 80 * eo(seg(t, L.t0 + .2, L.t0 + .6)), 5);
  lines.forEach((s, i) => push(t, L.t0 + .3 + i * .25, s, 54, 760 + i * 170, F.b8(fit(s, 150, 960, 2)), i === lines.length - 1 ? C.lemon : C.paper, 'nm' + i, 160));
  const k = eo(seg(t, L.t0 + .9, L.t0 + 1.2)); ctx.globalAlpha = k; wrap(L.scene.caption, F.b6(42), 940).forEach((s, i) => text(s, 60, 760 + lines.length * 170 + 10 + i * 54, F.b6(42), C.grey, 'left', 1, 'cap' + i)); ctx.globalAlpha = 1;
}
function sceneBig(L, t) {
  cardBase(L, t); const sc = L.scene; eyebrow(t, L.t0, sc.eyebrow);
  sc.big.forEach((s, i) => push(t, L.t0 + .2 + i * .22, s, 54, 640 + i * 200, F.b8(fit(s, 230, 970, 2)), i === sc.big.length - 1 ? C.lemon : C.paper, 'bg' + i, 210));
  const k = eo(seg(t, L.t0 + .8, L.t0 + 1.1)); ctx.globalAlpha = k; wrap(sc.small, F.b6(42), 940).forEach((s, i) => text(s, 60, 640 + sc.big.length * 200 - 60 + i * 54, F.b6(42), C.grey, 'left', 1, 'sm' + i)); ctx.globalAlpha = 1;
  if (sc.stamp) stamp(t, L.t0 + 1.4, 700, 1200, sc.stamp, C.lemon);
}
function sceneClaim(L, t) {
  cardBase(L, t); const sc = L.scene; eyebrow(t, L.t0, 'FAMILY ACCOUNT · ' + sc.who);
  ctx.save(); ctx.globalAlpha = eo(seg(t, L.t0, L.t0 + .3)); ctx.strokeStyle = C.lemon; ctx.lineWidth = 4; ctx.setLineDash([18, 12]); ctx.strokeRect(48, 420, 984, 820); ctx.restore();
  sc.lines.forEach((s, i) => push(t, L.t0 + .3 + i * .2, s, 90, 560 + i * 120, F.b8(fit(s, 92, 900, 1)), C.paper, 'cl' + i, 120));
  const k = eo(seg(t, L.t0 + 1.2, L.t0 + 1.5)); ctx.globalAlpha = k; text('Their account, as told to reporters — not a finding.', 90, 1200, F.b6(36), C.lemon, 'left', 1, 'claimnote'); ctx.globalAlpha = 1;
}
function sceneQuestions(L, t) {
  cardBase(L, t); eyebrow(t, L.t0, 'OPEN QUESTIONS');
  L.scene.items.forEach((s, i) => { const a = L.t0 + .3 + i * Math.max(.6, (L.d - 1.5) / L.scene.items.length), k = eo(seg(t, a, a + .3)); if (k <= 0) return; const y = 480 + i * 260;
    ctx.globalAlpha = k; text('?', 60, y + 110, F.b8(170), C.lemon, 'left', 0); const ls = wrap(s, F.b8(64), 820); ls.forEach((q, j) => text(q, 200, y + 40 + j * 72, F.b8(64), C.paper, 'left', 1, 'q' + i + j)); ctx.globalAlpha = 1; });
}
function sceneList(L, t) {
  cardBase(L, t); const sc = L.scene; eyebrow(t, L.t0, sc.eyebrow);
  let y = 440;
  sc.items.forEach((s, i) => { const a = L.t0 + .3 + i * .5, k = eo(seg(t, a, a + .3)); const ls = wrap(s, F.b6(46), 820), h = 60 + ls.length * 58;
    if (k > 0) { ctx.globalAlpha = k; ctx.fillStyle = C.ink2; ctx.fillRect(48, y, 984, h); ctx.fillStyle = C.lemon; ctx.fillRect(48, y, 90, h); text(String(i + 1), 93, y + h / 2 + 30, F.b8(80), C.ink, 'center');
      ls.forEach((q, j) => text(q, 166, y + 74 + j * 58, F.b6(46), C.paper, 'left', 1, 'li' + i + j)); ctx.globalAlpha = 1; }
    y += h + 30; });
  if (sc.stamp) stamp(t, L.t0 + 1.6, 620, Math.min(1230, y + 80), sc.stamp, SPY.red);
}
function sceneCommentary(L, t) {
  cardBase(L, t); eyebrow(t, L.t0, 'COMMENTARY · RELENTLESS TIMES');
  const n = L.scene.lines.length, step = Math.max(.3, (L.d - 1.6) / n);
  L.scene.lines.forEach((s, i) => push(t, L.t0 + .2 + i * step, s, 54, 620 + i * 180, F.b8(fit(s, 170, 970, 2)), i % 2 ? C.lemon : C.paper, 'cm' + i, 180));
}
function sceneHotline(L, t) {
  cardBase(L, t); const sc = L.scene; eyebrow(t, L.t0, sc.label);
  push(t, L.t0 + .2, 'IF YOU ARE IN DANGER', 54, 620, F.b8(80), C.paper, 'h0', 90);
  push(t, L.t0 + .5, sc.number, 54, 820, F.b8(fit(sc.number, 170, 970, 2)), C.lemon, 'h1', 180);
  const k = eo(seg(t, L.t0 + .9, L.t0 + 1.2)); ctx.globalAlpha = k; text(sc.small, 60, 920, F.b6(42), C.grey, 'left', 1, 'h2'); ctx.globalAlpha = 1;
}
// ———————— spy cut-paper title and sign-off ————————
function cutLetters(str, x, y, size, col, ground, seed, k = 1, id = null) {
  ctx.font = F.b8(size); let cx = x; const start = x;
  [...str].forEach((ch, i) => { const w = ctx.measureText(ch).width, land = clamp(k * str.length - i), dy = (1 - eo(land)) * -size * .8;
    if (land > 0) { ctx.save(); ctx.translate(cx + w / 2, y + dy + (hash(seed + i) - .5) * 3); ctx.rotate((hash(seed + i * 3) - .5) * .028); ctx.font = F.b8(size); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = clamp(land * 3);
      ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 5; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 4; ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = ground; ctx.strokeText(ch, 0, 0); ctx.shadowColor = 'transparent'; ctx.fillStyle = col; ctx.fillText(ch, 0, 0); ctx.restore(); }
    cx += w * .98; });
  if (id && k >= 1) TX.push({ id, text: str, x0: start, y0: y - size, x1: cx, y1: y + 8 });
}
function grainSpy() { ctx.save(); ctx.globalAlpha = .06; for (let i = 0; i < 1500; i++) { ctx.fillStyle = hash(i) > .5 ? '#fff' : '#000'; ctx.fillRect(hash(i * 3) * W, hash(i * 7) * H, 2, 2); } ctx.restore(); }
function titleCard(t) {
  ctx.fillStyle = SPY.black; ctx.fillRect(0, 0, W, H);
  piece(ctx, 'band', [[-40, 1000], [1120, 900], [1120, 1060], [-40, 1160]], SPY.red, [1, 0, 0, 1, 0, 0], { gap: SPY.black, amp: 2.2 });
  const [a, b] = S.title, sa = fit(a, 230, 960, 0), sb = fit(b, 230, 960, 0);
  cutLetters(a, 60, 800, sa, SPY.cream, SPY.black, 1, seg(t, .15, .9), 't0');
  cutLetters(b, 60, 1100, sb, SPY.lemon, SPY.red, 2, seg(t, .45, .95), 't1');
  grainSpy();
  ctx.globalAlpha = 1; text('RELENTLESS TIMES · ' + S.date, 60, 1300, F.mono(26), SPY.lemon, 'left', 4, 'credit'); text(S.place, 60, 1350, F.mono(26), SPY.cream, 'left', 4, 'credit2'); ctx.globalAlpha = 1;
  const pk = eio(seg(t, 2.5, 3.1)); plate(lerp(540, 880, pk), lerp(330, 140, pk), lerp(.9, .36, pk));
}
function signoff(L, t) {
  ctx.fillStyle = SPY.black; ctx.fillRect(0, 0, W, H);
  piece(ctx, 'band2', [[-40, 1040], [1120, 960], [1120, 1100], [-40, 1180]], SPY.red, [1, 0, 0, 1, 0, 0], { gap: SPY.black, amp: 2.2 });
  cutLetters('THIS IS', 60, 700, 120, SPY.cream, SPY.black, 5, seg(t, L.t0, L.t0 + .4), 's0');
  cutLetters('RELENTLESS', 60, 900, fit('RELENTLESS', 220, 960), SPY.lemon, SPY.black, 6, seg(t, L.t0 + .3, L.t0 + .9), 's1');
  cutLetters('TIMES.', 60, 1110, 220, SPY.cream, SPY.red, 7, seg(t, L.t0 + .7, L.t0 + 1.1), 's2');
  grainSpy(); plate(880, 140, .36);
  ctx.globalAlpha = eo(seg(t, L.t0 + .2, L.t0 + .4)); text('Voice: AI narration · Sources in the caption', 60, 1300, F.mono(22), SPY.cream, 'left', 2, 'so3'); ctx.globalAlpha = 1;
}
const SCN = { sketch: sceneSketch, name: sceneName, big: sceneBig, claim: sceneClaim, questions: sceneQuestions, list: sceneList, commentary: sceneCommentary, hotline: sceneHotline, signoff };
function render(t) {
  TX = []; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  if (t < TITLE) { titleCard(t); return; }
  const L = LINES.filter(l => t >= l.t0).pop() || LINES[0];
  SCN[L.scene.type](L, t);
  if (t > DUR - .5) { ctx.fillStyle = `rgba(0,0,0,${seg(t, DUR - .5, DUR)})`; ctx.fillRect(0, 0, W, H); }
}
// events: voice lines, paper slaps on cuts and title letters, pen scratch under sketches, stamps
const EV = [];
LINES.forEach(l => { EV.push({ t: l.t0, type: 'vo', id: l.id, story: KEY }); EV.push({ t: l.t0, type: 'cut' }); if (l.scene.type === 'sketch') EV.push({ t: l.t0, type: 'pen', d: 1.6 });
  if (l.scene.stamp) EV.push({ t: l.t0 + (l.scene.type === 'list' ? 1.6 : 1.4), type: 'stamp' }); });
for (let i = 0; i < S.title[0].length + S.title[1].length; i++) EV.push({ t: i < S.title[0].length ? .15 + i * .75 / S.title[0].length : .45 + (i - S.title[0].length) * .5 / S.title[1].length, type: 'slap', soft: 1 });
EV.push({ t: 2.5, type: 'whoosh' });
window.CUES = LINES.map(l => ({ t0: l.t0, t1: Math.min(l.t1 - .05, l.t0 + Math.max(1.8, l.d + .6)), text: l.text }));
await document.fonts.ready; for (const f of [F.b8(40), F.b6(40), F.mono(20), F.hand(40)]) await document.fonts.load(f);
window.EV = EV; window.DUR = DUR; window.render = render; window.TEXTS = t => { render(t); return TX.slice(); }; window.READY = true;
