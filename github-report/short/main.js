// The GitHub Report · Ep. 01 Short (9:16): the host video on top, the whiteboard below it, timed to the words.
import { ink, wash } from './sketch.js';
const W = 1080, H = 1920, cv = document.getElementById('out'), ctx = cv.getContext('2d');
const C = { k: '#23262c', blue: '#0969da', or: '#d97757', red: '#c8363a', green: '#2e8b57', yel: '#f2cf1d', grey: '#7f8796', line: '#d0d7de' };
const F = { a: s => `400 ${s}px Anton`, b8: s => `800 ${s}px Barlow`, b6: s => `600 ${s}px Barlow`, m: s => `500 ${s}px Plex`, h: s => `600 ${s}px Caveat` };
await Promise.all([F.a(40), F.b8(40), F.b6(40), F.m(30), F.h(40)].map(f => document.fonts.load(f)));
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - x, 3), eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, ss = x => x * x * (3 - 2 * x), back = x => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const DUR = 60, VID = { y: 130, h: 525 }, BY = 700;                // host panel; the board starts at BY

// ---------- host video frames ----------
const FR = new Map(), load = s => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(s)); i.src = s; });
async function frame(t) { const k = clamp(Math.floor(t * 30), 0, 1799) + 1, key = k; if (FR.has(key)) return FR.get(key); const im = await load(`frames/${String(k).padStart(5, '0')}.jpg`); FR.set(key, im); if (FR.size > 60) FR.delete(FR.keys().next().value); return im; }

// ---------- drawing vocabulary (as in the full episode) ----------
const sd = p => Math.round(p[0] * 7.13 + p[1] * 13.7) % 9973;
const mk = (pts, t, a, b, col = C.k, w = 7) => ink(ctx, pts, { seed: sd(pts[0]), w, col, wob: 1.3, over: 5, prog: eo(seg(t, a, b)) });
const wsh = (poly, col, t, a, b, al = .45) => { const k = seg(t, a, b); if (k > 0) wash(ctx, poly, col, { alpha: al * ss(k), seed: sd(poly[0]), amp: 5 }); };
const rectP = (x0, y0, x1, y1) => [[x0 - 5, y0], [x1 + 4, y0 + 2], [x1, y1 + 4], [x0 + 2, y1], [x0, y0 - 5]];
const circ = (x, y, rx, ry, turns = 1.08, a0 = -2.2) => { const o = []; for (let i = 0; i <= 48; i++) { const a = a0 + i / 48 * Math.PI * 2 * turns; o.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]); } return o; };
function txt(s, x, y, font, col, align = 'left') { ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y); }
const tw = (s, font) => { ctx.font = font; return ctx.measureText(s).width; };
function wrap(s, font, maxW) { const out = []; let ln = ''; for (const w of s.split(' ')) { const t2 = ln ? ln + ' ' + w : w; if (tw(t2, font) > maxW && ln) { out.push(ln); ln = w; } else ln = t2; } if (ln) out.push(ln); return out; }
function hw(s, x, y, size, col, t, a, b, align = 'left') { const k = seg(t, a, b); if (k <= 0) return; ctx.save(); ctx.font = F.h(size); const w = ctx.measureText(s).width, x0 = align === 'center' ? x - w / 2 : x;
  ctx.beginPath(); ctx.rect(x0 - 8, y - size, (w + 16) * k, size * 1.5); ctx.clip(); txt(s, x, y, F.h(size), col, align); ctx.restore(); }
function big(s, x, y, size, col, t, a, align = 'center') { const k = back(seg(t, a, a + .35)); if (k <= 0) return; ctx.save(); ctx.globalAlpha = clamp(k * 1.5); ctx.translate(x, y); ctx.scale(k, k); txt(s, 0, 0, F.a(size), col, align); ctx.restore(); }
function stamp(s, x, y, rot, col, t, a, size = 70) { const k = seg(t, a, a + .2); if (k <= 0) return; const sc = lerp(1.6, 1, eo(k));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = .92 * k; const w = tw(s, F.a(size)) + 50; ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.strokeRect(-w / 2, -size * .85, w, size * 1.25); txt(s, 0, size * .2, F.a(size), col, 'center'); ctx.restore(); }
function magnet(x, y, col) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(x + 4, y + 6, 22, 0, 7); ctx.fill(); const g = ctx.createRadialGradient(x - 7, y - 7, 2, x, y, 24); g.addColorStop(0, '#fff'); g.addColorStop(.3, col); g.addColorStop(1, col); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 21, 0, 7); ctx.fill(); }
function card(x, y, w, owner, name, lines, tags, t, a, accent) {
  const k = seg(t, a, a + .45); if (k <= 0) return; const h = 140 + lines.length * 52 + (tags.length ? 76 : 0);
  ctx.save(); ctx.globalAlpha = clamp(k * 2); ctx.translate(0, (1 - eo(k)) * -70);
  wsh(rectP(x - 22, y - 18, x + w + 26, y + h + 20), accent, t, a + .1, a + .6, .3);
  ctx.shadowColor = 'rgba(30,35,40,.22)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = C.grey; ctx.lineWidth = 3; ctx.strokeRect(x + 30, y + 36, 30, 38);
  const o = owner ? owner + ' / ' : ''; txt(o, x + 78, y + 68, F.m(34), C.blue); txt(name, x + 78 + tw(o, F.m(34)), y + 68, `800 40px Barlow`, C.blue);
  lines.forEach((l, i) => txt(l, x + 32, y + 136 + i * 52, F.b6(40), '#1f2328'));
  let tx = x + 32; for (const tg of tags) { const pw = tw(tg, F.b6(30)) + 32; ctx.fillStyle = '#ddf4ff'; ctx.beginPath(); ctx.roundRect(tx, y + h - 66, pw, 46, 23); ctx.fill(); txt(tg, tx + 16, y + h - 33, F.b6(30), C.blue); tx += pw + 12; }
  magnet(x + w / 2, y - 4, accent); ctx.restore();
}
function bubble(x, y, w, s, t, a, col) { const k = back(seg(t, a, a + .4)); if (k <= 0) return; const lines = wrap(s, F.b8(56), w - 80), h = lines.length * 66 + 64;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-(x + w / 2), -(y + h / 2)); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, y, w, h, 34); ctx.moveTo(x + 90, y); ctx.lineTo(x + 70, y - 50); ctx.lineTo(x + 160, y); ctx.fill();
  lines.forEach((l, i) => txt(l, x + 40, y + 78 + i * 66, F.b8(56), '#fff')); ctx.restore(); }

// ---------- beats (seconds in this clip) ----------
const BEATS = [
  [0, 4.7, t => { big('THE GITHUB REPORT', W / 2, BY + 170, 120, C.k, t, .2); hw('free & open tools, hunted every morning', W / 2, BY + 250, 52, C.or, t, .8, 2.2, 'center');
    const cx = 160, cy = BY + 340; wsh(rectP(cx, cy, cx + 280, cy + 300), '#f6d6c9', t, 2.3, 2.9, .55); mk(rectP(cx, cy, cx + 280, cy + 300), t, 2.3, 3); if (t > 2.6) { ctx.fillStyle = C.red; ctx.fillRect(cx + 4, cy + 4, 272 * eo(seg(t, 2.6, 2.9)), 70); txt('OCT', cx + 140, cy + 60, F.a(54), '#fff', 'center'); big('31', cx + 140, cy + 250, 160, C.k, t, 2.9); }
    mk(circ(cx + 560, cy + 130, 100, 100), t, 3.6, 4.2, C.k, 11); mk([[cx + 630, cy + 200], [cx + 730, cy + 310]], t, 4.1, 4.4, C.k, 20); hw('the hunt begins', cx + 420, cy + 410, 56, C.k, t, 3.7, 4.6); }],
  [4.7, 12.5, t => { bubble(80, BY + 120, 920, 'What is out there, free and open, that makes this business…', t, 6.5, C.k);
    ['FASTER', 'SHARPER', 'RICHER'].forEach((s, i) => stamp(s, W / 2, BY + 520 + i * 150, -.05 + i * .05, [C.blue, C.green, C.or][i], t, [9.38, 10.24, 11.08][i], 92)); }],
  [12.5, 19.8, t => { const nk = seg(t, 12.7, 15.4); for (let i = 0; i < 78; i++) { if (i / 78 > nk) break; const x = 90 + (i % 10) * 92 + (hash(i) - .5) * 10, y = BY + 90 + Math.floor(i / 10) * 52; ctx.fillStyle = ['#ffe680', '#ffd1dc', '#c8f0d0', '#cfe4ff'][i % 4]; ctx.save(); ctx.translate(x, y); ctx.rotate((hash(i * 3) - .5) * .16); ctx.fillRect(0, 0, 78, 40); ctx.restore(); }
    hw('13 mornings', 110, BY + 610, 76, C.k, t, 12.7, 13.4); hw('78 tools', 620, BY + 610, 76, C.blue, t, 14.0, 14.7); stamp('$0 SPENT', W / 2, BY + 760, -.07, C.green, t, 15.6, 110); }],
  [19.8, 33.4, t => { bubble(80, BY + 90, 920, 'Hold on. What is a repository?', t, 20, C.blue);
    const x = 120, y = BY + 360, a = 25.4; wsh([[x, y + 110], [x + 190, y], [x + 380, y + 110], [x + 380, y + 340], [x, y + 340]], '#f6d6c9', t, a + .3, a + 1, .5); mk([[x, y + 110], [x + 190, y], [x + 380, y + 110]], t, a, a + .6); mk(rectP(x + 20, y + 110, x + 360, y + 340), t, a + .3, a + .9); mk(rectP(x + 145, y + 220, x + 235, y + 340), t, a + .7, a + 1);
    hw('a public workshop', x - 10, y + 410, 54, C.or, t, a + .8, a + 1.8);
    [['look inside', 0], ['use it', 1.2], ['build on it', 2.2]].forEach(([s, d], i) => { const yy = BY + 400 + i * 120; mk(circ(600, yy, 36, 36), t, a + 1 + d, a + 1.4 + d, [C.blue, C.green, C.or][i], 6); hw(s, 660, yy + 18, 58, C.k, t, a + 1.2 + d, a + 1.9 + d); });
    stamp('$0', 840, BY + 800, -.1, C.green, t, 31.6, 130); }],
  [33.4, 41.2, t => { const fk = eo(seg(t, 33.6, 34.6)); ctx.fillStyle = '#23262c'; ctx.fillRect(40, BY + 70, 1000 * fk, 130); ctx.fillStyle = '#fff'; for (let i = 0; i < 24; i++) { const x = 52 + i * 42; if (x > 40 + 1000 * fk - 20) break; ctx.fillRect(x, BY + 80, 22, 16); ctx.fillRect(x, BY + 174, 22, 16); }
    ['SCRIPT', 'FRAMES', 'SOUND', 'MP4'].forEach((s, i) => { const k = seg(t, [38.2, 38.58, 39.22, 40.0][i], [38.2, 38.58, 39.22, 40.0][i] + .3); if (k > 0) { ctx.globalAlpha = k; txt(s, 150 + i * 255, BY + 155, F.a(50), C.yel, 'center'); ctx.globalAlpha = 1; } });
    card(70, BY + 330, 940, null, 'CineCode', ['Builds films entirely in code.'], ['film', 'code'], t, 35.4, C.or); }],
  [41.2, 48.3, t => { card(70, BY + 90, 940, 'dramaclaw', 'DramaClaw', ['A script in, a finished drama out.'], ['script → film'], t, 41.3, C.red);
    card(70, BY + 470, 940, 'edenfunf', 'ReelMimic', ['A video you love → a new one', 'in the same style.'], ['style transfer'], t, 44.4, C.blue); }],
  [48.3, 56, t => { for (let i = 0; i < 3; i++) { const x = 140 + i * 280, y = BY + 140; wsh([[x, y], [x + 200, y - 30], [x + 220, y + 190], [x - 20, y + 200]], ['#f6d360', '#f6d6c9', '#8fb3e0'][i], t, 48.5 + i * .25, 49 + i * .25, .8); mk([[x, y], [x + 200, y - 30], [x + 220, y + 190], [x - 20, y + 200], [x, y]], t, 48.5 + i * .25, 49.1 + i * .25, C.k, 5); }
    hw('paper cut-out engine', W / 2, BY + 430, 66, C.blue, t, 49.2, 50.4, 'center');
    hw('film pipeline cost', 100, BY + 590, 58, C.k, t, 53.2, 54); const bw = lerp(860, 60, eio(seg(t, 54.2, 55.6))); wsh(rectP(100, BY + 630, 100 + bw, BY + 730), C.red, t, 53.6, 54, .55); mk(rectP(100, BY + 630, 960, BY + 730), t, 53.4, 54);
    if (t > 55.2) hw('→ near $0', 100 + bw + 30, BY + 700, 64, C.green, t, 55.2, 55.8); }],
  [56, 60, t => { card(70, BY + 200, 940, null, 'Hood Warfare', ['An open-world crime game,', 'built in the open.'], ['game', 'open world'], t, 57, C.red); }],
];
const SECTIONS = [[33.4, '2', 'THE FILM MACHINE'], [56, '3', 'THE GAME']];
// ---------- frame ----------
const WD = (await (await fetch('words.json')).json()).words.filter(w => !(w.s > 25.5 && w.s < 33));
const FIX = { memme: 'claude-mem', asterix: 'Astryx', scandal: 'scandal' }, PAIRS = [['drama', 'claw', 'DramaClaw'], ['real', 'mimic', 'ReelMimic']];
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const CAPS = (() => { let ws = []; for (const w of WD) { if (ws.length && /^[-.]/.test(w.w)) { ws[ws.length - 1].w += w.w; ws[ws.length - 1].e = w.e; } else ws.push({ ...w }); }
  for (let i = 0; i < ws.length - 1; i++) for (const [p, q, r] of PAIRS) if (norm(ws[i].w) === p && norm(ws[i + 1].w) === q) { ws[i].w = r + (/[.,!?]$/.test(ws[i + 1].w) ? ws[i + 1].w.slice(-1) : ''); ws[i + 1].w = ''; }
  ws = ws.filter(w => w.w && w.s < 57 && !(norm(w.w) === 'it' && w.s > 41.2 && w.s < 41.5));   // drop the transcriber's stray "It"
  const out = []; let g = []; for (const w of ws) { if (g.length && (g.length >= 4 || /[.,!?]$/.test(g[g.length - 1].w) || w.s - g[g.length - 1].e > .5)) { out.push(g); g = []; } g.push(w); } if (g.length) out.push(g);
  const c = out.map(g => ({ t0: g[0].s - .05, t1: g[g.length - 1].e + .3, text: g.map(w => w.w).join(' '), words: g }));
  c.push({ t0: 25.8, t1: 29.2, text: 'Anyone can look inside, use it, and build on it.' }, { t0: 29.3, t1: 32.9, text: 'That is why everything on this board costs $0.' });
  return c.sort((a, b) => a.t0 - b.t0); })();
function captions(t) {
  const c = CAPS.find(c => t >= c.t0 && t < c.t1); if (!c || t > 57) return; const f = F.b8(54), lines = wrap(c.text.toUpperCase(), f, 960), y0 = 1640;
  lines.forEach((l, j) => { const lw = tw(l, f); ctx.fillStyle = 'rgba(35,38,44,.9)'; ctx.beginPath(); ctx.roundRect(W / 2 - lw / 2 - 26, y0 + j * 76 - 56, lw + 52, 72, 12); ctx.fill(); txt(l, W / 2, y0 + j * 76, f, '#fff', 'center'); });
}
async function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#fbfaf6'); g.addColorStop(1, '#efede7'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = .035; for (let i = 0; i < 18; i++) ink(ctx, circ(hash(i) * W, BY + hash(i * 3) * 900, 60, 40), { seed: i, w: 6, col: '#7f8796', alpha: .07 }); ctx.globalAlpha = 1;
  // top bar
  ctx.fillStyle = '#23262c'; ctx.fillRect(0, 0, W, 112); ctx.fillStyle = C.yel; ctx.fillRect(0, 104, W, 8); txt('THE GITHUB REPORT', 40, 78, F.a(56), '#fff'); txt('EP 01 · 78 TOOLS · $0', W - 40, 74, F.m(30), C.yel, 'right');
  // host panel
  const im = await frame(t); ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 30; ctx.fillStyle = '#fff'; ctx.fillRect(0, VID.y, W, VID.h + 16); ctx.restore(); ctx.drawImage(im, 0, VID.y + 8, W, VID.h);
  // section strap over the board
  const s = SECTIONS.filter(x => t >= x[0]).pop(); if (s) { const k = eo(seg(t, s[0], s[0] + .4)); ctx.save(); ctx.translate(-700 * (1 - k), 0); ctx.fillStyle = C.or; ctx.fillRect(0, VID.y + VID.h + 16, 90, 70); txt(s[1], 45, VID.y + VID.h + 70, F.a(54), '#fff', 'center'); ctx.fillStyle = '#23262c'; const w = tw(s[2], F.a(46)) + 50; ctx.fillRect(90, VID.y + VID.h + 16, w, 70); txt(s[2], 115, VID.y + VID.h + 68, F.a(46), '#fff'); ctx.restore(); }
  // board beat (with a short cross-fade)
  for (const [a, b, fn] of BEATS) { if (t < a - .01 || t > b + .35) continue; const out = 1 - ss(seg(t, b, b + .35)); ctx.save(); ctx.globalAlpha = out; fn(t); ctx.restore(); }
  captions(t);
  // end card: the rest is in the full episode
  const e = ss(seg(t, 57.2, 58)); if (e > 0) { ctx.save(); ctx.globalAlpha = e * .94; ctx.fillStyle = '#23262c'; ctx.fillRect(0, BY - 40, W, 1300); ctx.globalAlpha = e;
    txt('THE GAME. WEB DESIGN.', W / 2, BY + 260, F.a(92), '#fff', 'center'); txt('78 TOOLS. $0.', W / 2, BY + 380, F.a(92), C.yel, 'center');
    const p = 1 + .04 * Math.sin(t * 6); ctx.translate(W / 2, BY + 600); ctx.scale(p, p); ctx.fillStyle = C.red; ctx.beginPath(); ctx.roundRect(-400, -70, 800, 140, 70); ctx.fill(); txt('FULL EPISODE ON YOUTUBE ▶', 0, 18, F.b8(48), '#fff', 'center'); ctx.restore(); ctx.globalAlpha = e; txt('Relentless Aaron', W / 2, BY + 860, F.h(80), C.or, 'center'); ctx.globalAlpha = 1; }
}
window.EV = []; window.DUR = DUR; window.render = render; window.READY = true;
