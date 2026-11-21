// The GitHub Report, Money Series: the episode engine (9:16). Beats come from episode.json "vertical"; the host photo from assets/host.json.
// One whiteboard, nine regions, the camera travels between them. Marker drawings with watercolor washes, GitHub-style repo cards
// pinned with magnets, hand-written labels, a news strap per section and burned captions. Every beat is anchored to a word in the voiceover.
import { ink, wash } from './sketch.js';
const W = 1080, H = 1920, cv = document.getElementById('out'), ctx = cv.getContext('2d');
const C = { k: '#141414', blue: '#1f5fd1', or: '#ef6c2f', red: '#e2402f', green: '#16855a', yel: '#ffd60a', grey: '#6b6b6b', card: '#fffdf7', line: '#141414', hi: 'rgba(255,214,10,.85)' };
const F = { a: s => `400 ${s}px Anton`, b8: s => `800 ${s}px Barlow`, b6: s => `600 ${s}px Barlow`, m: s => `500 ${s}px Plex`, h: s => `600 ${s}px Caveat` };
await Promise.all([F.a(40), F.b8(40), F.b6(40), F.m(30), F.h(40)].map(f => document.fonts.load(f)));
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - x, 3), eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, ss = x => x * x * (3 - 2 * x), back = x => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- the episode's vertical beats, the voiceover, the outfit photo ----------
const EP = await (await fetch('episode.json')).json(), V = EP.vertical;
const HC = await (await fetch('assets/host.json')).json();
const OFF = .3;
const WD = (await (await fetch('audio/words.json')).json()).words.map(w => ({ ...w, s: w.s + OFF, e: w.e + OFF }));
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function at(phrase, after = 0) { const q = phrase.split(' ').map(norm).filter(Boolean);
  for (let i = 0; i < WD.length; i++) { if (WD[i].s < after) continue; if (q.every((x, j) => WD[i + j] && norm(WD[i + j].w) === x)) return WD[i].s; } throw new Error('phrase not found: ' + phrase); }
const A = (p, d = 0) => typeof p === 'number' ? p : at(p) + d;
const IMG = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
const [HOST, LOGO] = await Promise.all([IMG('assets/' + HC.file), IMG('assets/ru-logo.jpg')]);
const res = e => { if (e.at !== undefined) e._a = A(e.at, e.d || 0); if (e.items) e.items.forEach(it => it._a = A(it.at, it.d || 0)); if (e.end) e._b = A(e.end, e.endD || 0); };
V.beats.forEach(b => { b._a = A(b.at) - .2; b.els.forEach(res); });
const FULL = A(V.outro);
const END = WD[WD.length - 1].e, DUR = Math.ceil((END + 3) * 10) / 10;
const BEAT = [...V.beats.map(b => b._a), FULL - .2];
const beat = t => { let i = 0; while (i + 1 < BEAT.length && t >= BEAT[i + 1]) i++; return t < BEAT[0] ? 0 : i; };
// ---------- drawing vocabulary ----------
let SEED = 1;
const sd = p => Math.round(p[0] * 7.13 + p[1] * 13.7) % 9973;     // seeds come from position, so strokes never re-randomise
const mk = (pts, lt, a, b, col = C.k, w = 6) => ink(ctx, pts, { seed: sd(pts[0]), w: w * 1.35, col, wob: 1.1, over: 4, prog: eo(seg(lt, a, b)) });
const wsh = (poly, col, lt, a, b, al = .45) => { const k = seg(lt, a, b); if (k <= 0) return; ctx.save(); ctx.globalAlpha = Math.min(1, al * 1.9) * ss(k); ctx.fillStyle = col; ctx.beginPath(); poly.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.restore(); };   // Vox: flat colour blocks
const rectP = (x0, y0, x1, y1) => [[x0 - 5, y0], [x1 + 4, y0 + 2], [x1, y1 + 4], [x0 + 2, y1], [x0, y0 - 5]];
const circ = (x, y, rx, ry, turns = 1.08, a0 = -2.2) => { const o = []; for (let i = 0; i <= 48; i++) { const a = a0 + i / 48 * Math.PI * 2 * turns; o.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]); } return o; };
function txt(s, x, y, font, col, align = 'left') { ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y); }
const tw = (s, font) => { ctx.font = font; return ctx.measureText(s).width; };
function wrap(s, font, maxW) { const out = []; let ln = ''; for (const w of s.split(' ')) { const t2 = ln ? ln + ' ' + w : w; if (tw(t2, font) > maxW && ln) { out.push(ln); ln = w; } else ln = t2; } if (ln) out.push(ln); return out; }
function hw(s, x, y, size, col, lt, a, b, align = 'left') {   // handwriting, revealed left to right
  const k = seg(lt, a, b); if (k <= 0) return; ctx.save(); ctx.font = F.h(size); const w = ctx.measureText(s).width, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.beginPath(); ctx.rect(x0 - 8, y - size, (w + 16) * k, size * 1.5); ctx.clip(); ctx.globalCompositeOperation = 'multiply'; txt(s, x, y, F.h(size), col, align); ctx.restore();
}
function bigText(s, x, y, size, col, lt, a, align = 'left') {  // block letters that land
  const sw = seg(lt, a - .25, a + .1); if (sw <= 0) return; const w = tw(s, F.a(size)), x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.save(); ctx.fillStyle = C.hi; ctx.translate(x0 - 14, y - size * .78); ctx.rotate(-.01); ctx.fillRect(0, 0, (w + 28) * eo(sw), size * .9); ctx.restore();
  const k = back(seg(lt, a, a + .35)); if (k <= 0) return; ctx.save(); ctx.globalAlpha = clamp(k * 1.5); ctx.translate(x, y); ctx.scale(k, k); txt(s, 0, 0, F.a(size), col, align); ctx.restore();
}
function magnet(x, y, col) { const g = ctx.createRadialGradient(x - 6, y - 6, 2, x, y, 20); g.addColorStop(0, '#fff'); g.addColorStop(.3, col); g.addColorStop(1, col); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(x + 4, y + 6, 19, 0, 7); ctx.fill(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 18, 0, 7); ctx.fill(); }
// a GitHub-style repository card, dropped onto the board with a magnet
function card(x, y, w, owner, name, lines, tags, star, lt, a, accent = C.or) {
  const k = seg(lt, a, a + .4); if (k <= 0) return; const h = 128 + lines.length * 44 + (tags.length ? 66 : 0), rot = (hash(x * .37 + y) - .5) * .03;
  ctx.save(); ctx.globalAlpha = clamp(k * 2); ctx.translate(x + w / 2, y + h / 2 + (1 - eo(k)) * -50); ctx.rotate(rot * eo(k) + (1 - eo(k)) * .06); ctx.translate(-(x + w / 2), -(y + h / 2));
  ctx.fillStyle = C.k; ctx.fillRect(x + 14, y + 14, w, h);                                  // hard flat shadow
  ctx.fillStyle = C.card; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.k; ctx.lineWidth = 5; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = accent; ctx.fillRect(x, y, 18, h);                                         // the section's colour edge
  if (owner) txt(owner.toUpperCase() + ' /', x + 44, y + 42, F.m(22), C.grey);
  txt(name, x + 44, y + 92, F.a(52), C.k);
  if (star) { const sw = tw(star, F.b8(24)) + 30; ctx.fillStyle = C.red; ctx.fillRect(x + w - sw - 22, y + 24, sw, 40); txt(star, x + w - sw / 2 - 22, y + 52, F.b8(24), '#fff', 'center'); }
  lines.forEach((l, i) => txt(l, x + 44, y + 142 + i * 44, F.b6(33), C.k));
  let tx = x + 44; for (const tg of tags) { const pw = tw(tg.toUpperCase(), F.b8(24)) + 26; ctx.fillStyle = C.hi; ctx.fillRect(tx, y + h - 56, pw, 38); txt(tg.toUpperCase(), tx + 13, y + h - 28, F.b8(24), C.k); tx += pw + 12; }
  ctx.fillStyle = 'rgba(232,220,190,.9)'; for (const [tx2, a2] of [[x + 70, -.4], [x + w - 70, .4]]) { ctx.save(); ctx.translate(tx2, y - 4); ctx.rotate(a2); ctx.fillRect(-56, -16, 112, 32); ctx.restore(); }
  ctx.restore();
}
function bubble(x, y, w, s, lt, a, col = C.blue) {             // a speech bubble for the second voice
  const k = back(seg(lt, a, a + .4)); if (k <= 0) return; const lines = wrap(s, F.b8(46), w - 80), h = lines.length * 56 + 60;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-(x + w / 2), -(y + h / 2));
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, y, w, h, 30); ctx.moveTo(x + 80, y + h); ctx.lineTo(x + 60, y + h + 50); ctx.lineTo(x + 140, y + h); ctx.fill();
  lines.forEach((l, i) => txt(l, x + 40, y + 70 + i * 56, F.b8(46), '#fff')); ctx.restore();
}
function stamp(s, x, y, rot, col, lt, a, size = 64) { const k = seg(lt, a, a + .2); if (k <= 0) return; const sc = lerp(1.6, 1, eo(k));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = k; const w = tw(s, F.a(size)) + 50, hh = size * 1.25; ctx.fillStyle = C.k; ctx.fillRect(-w / 2 + 9, -size * .85 + 9, w, hh);
  ctx.fillStyle = col; ctx.fillRect(-w / 2, -size * .85, w, hh); txt(s, 0, size * .2, F.a(size), col === C.yel ? C.k : '#fff', 'center'); ctx.restore(); }
const arrow = (x0, y0, x1, y1, lt, a, b, col = C.k) => { mk([[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 - 30], [x1, y1]].flatMap((p, i, A) => i ? [[lerp(A[i - 1][0], p[0], .5), lerp(A[i - 1][1], p[1], .5)], p] : [p]), lt, a, b, col, 6);
  const an = Math.atan2(y1 - y0, x1 - x0); mk([[x1 - Math.cos(an - .5) * 34, y1 - Math.sin(an - .5) * 34], [x1, y1], [x1 - Math.cos(an + .5) * 34, y1 - Math.sin(an + .5) * 34]], lt, b, b + .2, col, 6); };

// ---------- the ten boards ----------
const chip = (s, x, y, t, a, bg, w = 260) => { const k = back(seg(t, a, a + .35)); if (k <= 0) return; ctx.save(); ctx.translate(x + w / 2, y); ctx.scale(k, k); ctx.rotate((hash(x + y) - .5) * .05);
  ctx.fillStyle = C.k; ctx.fillRect(-w / 2 + 7, -36, w, 66); ctx.fillStyle = bg || (hash(x * 3 + y) > .5 ? C.yel : '#fff'); ctx.fillRect(-w / 2, -43, w, 66); ctx.strokeStyle = C.k; ctx.lineWidth = 4; ctx.strokeRect(-w / 2, -43, w, 66); txt(s.toUpperCase(), 0, 3, F.a(36), C.k, 'center'); ctx.restore(); };
// a talking cartoon head: the mouth opens while the narrator is speaking
const speaking = t => WD.some(w => t >= w.s && t < w.e);
function face(cx, cy, r, t, a, col) { const k = back(seg(t, a, a + .4)); if (k <= 0) return; ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
  ctx.fillStyle = C.k; ctx.beginPath(); ctx.arc(10, 12, r, 0, 7); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.strokeStyle = C.k; ctx.lineWidth = 6; ctx.stroke();
  const blink = (t % 3.3) < .12 ? .15 : 1; ctx.fillStyle = C.k; for (const ex of [-r * .35, r * .35]) { ctx.beginPath(); ctx.ellipse(ex, -r * .15, r * .09, r * .13 * blink, 0, 0, 7); ctx.fill(); }
  const open = speaking(t) ? .25 + .75 * Math.abs(Math.sin(t * 17)) : .08; ctx.fillStyle = '#7a1f12'; ctx.beginPath(); ctx.ellipse(0, r * .38, r * .3, r * .22 * open, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
function box(x, y, w, h, s, fill, t, a, size = 46, col = C.k) { const k = back(seg(t, a, a + .4)); if (k <= 0) return; ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k);
  ctx.fillStyle = C.k; ctx.fillRect(-w / 2 + 10, -h / 2 + 10, w, h); ctx.fillStyle = fill; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = C.k; ctx.lineWidth = 5; ctx.strokeRect(-w / 2, -h / 2, w, h);
  const ls = s.split('\n'); ls.forEach((l, j) => txt(l, 0, size * .35 + (j - (ls.length - 1) / 2) * size * 1.1, F.a(size), col, 'center')); ctx.restore(); }
function note(x, y, rot, title, lines, t, a, cols = [], w = 400, tcol = C.red) { if (t < a) return; const k = back(seg(t, a, a + .4)), h = 90 + lines.length * 46;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.fillRect(-w / 2 + 10, -h / 2 + 10, w, h); ctx.fillStyle = '#ffe680'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = C.k; ctx.lineWidth = 4; ctx.strokeRect(-w / 2, -h / 2, w, h);
  txt(title, 0, -h / 2 + 56, F.a(40), tcol, 'center'); lines.forEach((l, j) => txt(l, 0, -h / 2 + 108 + j * 46, F.h(40), cols[j] || C.k, 'center')); ctx.restore(); }
function sms(x, y, w, s, t, a, b, col = '#fff', tcol = C.k, size = 38) { if (t < a) return; const k = back(seg(t, a, a + .35)), lines = wrap(s, F.b6(size), w - 60), n = Math.floor(s.length * seg(t, a + .2, b)), h = lines.length * size * 1.3 + 50;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.beginPath(); ctx.roundRect(8, 8, w, h, 26); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 26); ctx.fill(); ctx.strokeStyle = C.k; ctx.lineWidth = 4; ctx.stroke();
  let left = n; lines.forEach((l, j) => { const shown = l.slice(0, Math.max(0, left)); left -= l.length + 1; txt(shown, 30, 50 + j * size * 1.3, F.b6(size), tcol); }); ctx.restore(); }
const COL = c => C[c] || c || C.k;
// one board element, by type (see engine/README.md)
function el(e, t) { const a = e._a;
  switch (e.type) {
    case 'card': return card(e.x ?? 120, e.y ?? 170, e.w ?? 980, e.owner || null, e.name, e.lines || [], e.tags || [], e.star || null, t, a, COL(e.col || 'or'));
    case 'stamp': return stamp(e.text, e.x, e.y, e.rot ?? -.03, COL(e.col || 'red'), t, a, e.size || 52);
    case 'big': return bigText(e.text, e.x ?? 120, e.y ?? 230, e.size || 96, COL(e.col), t, a, e.align || 'left');
    case 'hw': return hw(e.text, e.x ?? 140, e.y, e.size || 54, COL(e.col), t, a, a + (e.dur || Math.max(.8, e.text.length * .045)), e.align || 'left');
    case 'box': return box(e.x, e.y, e.w, e.h, e.text, COL(e.fill || '#fff'), t, a, e.size || 54, COL(e.col));
    case 'note': return note(e.x, e.y, e.rot ?? -.02, e.title, e.lines, t, a, (e.cols || []).map(COL), e.w || 420, COL(e.tcol || 'red'));
    case 'chips': return e.items.forEach((it, i) => chip(it.text, (e.x ?? 140) + (i % (e.per || 4)) * (e.dx || 330), (e.y ?? 380) + Math.floor(i / (e.per || 4)) * (e.dy || 110), t, it._a, null, e.w || 300));
    case 'checks': return e.items.forEach((it, i) => { if (t < it._a) return; const y = (e.y ?? 450) + i * (e.dy || 110), k = back(seg(t, it._a, it._a + .35)), c = it.mark === '✗' ? C.red : C.green;
      ctx.save(); ctx.translate(e.x ?? 140, y); ctx.scale(k, k); ctx.fillStyle = c; ctx.fillRect(0, -60, 90, 90); txt(it.mark || '✓', 45, 10, F.a(64), '#fff', 'center'); ctx.restore(); hw(it.text, (e.x ?? 140) + 120, y, e.size || 56, C.k, t, it._a, it._a + 1.1); });
    case 'sms': return sms(e.x, e.y, e.w || 520, e.text, t, a, e._b ?? a + e.text.length * .03, COL(e.fill || '#fff'), COL(e.tcol || 'k'), e.size || 34);
    case 'phone': { if (t < a) return; const k = back(seg(t, a, a + .5)); ctx.save(); ctx.translate(e.x, e.y); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.beginPath(); ctx.roundRect(14, 14, 560, e.h || 560, 50); ctx.fill(); ctx.fillStyle = '#23262c'; ctx.beginPath(); ctx.roundRect(0, 0, 560, e.h || 560, 50); ctx.fill(); ctx.fillStyle = '#efe6d4'; ctx.fillRect(24, 60, 512, (e.h || 560) - 90); ctx.restore(); return; }
    case 'banner': { if (t < a) return; const k = back(seg(t, a, a + .4)); ctx.save(); ctx.translate(e.x ?? 960, e.y ?? 540); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.fillRect(-640, -110, 1280, 230); ctx.fillStyle = COL(e.fill || 'yel'); ctx.fillRect(-650, -120, 1280, 230);
      txt(e.l1, 0, -20, F.a(e.size1 || 70), C.k, 'center'); txt(e.l2, 0, 70, F.a(e.size2 || 62), C.red, 'center'); ctx.restore(); return; }
    case 'stack': { for (let i = 0; i < e.n; i++) { const k = back(seg(t, a + i * .25, a + .3 + i * .25)); if (k <= 0) continue; ctx.save(); ctx.translate((e.x ?? 200) + i * 150, e.y ?? 620); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.fillRect(-60 + 6, -90 + 6, 120, 180); ctx.fillStyle = ['#cfe4ff', '#ffd1dc', '#c8f0d0', '#ffe680', '#fde0c8', '#e0d4ff'][i % 6]; ctx.fillRect(-60, -90, 120, 180); ctx.strokeStyle = C.k; ctx.lineWidth = 4; ctx.strokeRect(-60, -90, 120, 180); txt(e.label, 0, 10, F.a(40), C.k, 'center'); ctx.restore(); }
      if (t > a + e.n * .25 + .3) txt('=', (e.x ?? 200) + e.n * 150 + 10, (e.y ?? 620) + 30, F.a(110), C.k, 'center'); return; }
    case 'bars': { const base = e.y ?? 830; mk([[e.x ?? 120, base], [(e.x ?? 120) + e.items.length * 330 + 40, base + 3]], t, a - .3, a + .1, C.k, 6); const mx = Math.max(...e.items.map(i => i.v));
      e.items.forEach((it, i) => { if (t < it._a) return; const x = (e.x ?? 120) + 50 + i * 330, h = Math.max(it.v / mx, .03) * (e.h || 380) * eo(seg(t, it._a, it._a + .8)); ctx.fillStyle = COL(it.col || 'blue'); ctx.fillRect(x, base - h, 220, h); ctx.strokeStyle = C.k; ctx.lineWidth = 5; ctx.strokeRect(x, base - h, 220, h);
        txt(it.label, x + 110, base - h - 18, F.a(44), COL(it.col || 'blue'), 'center'); txt(it.name, x + 110, base + 50, F.a(30), C.k, 'center'); }); return; }
    case 'arrow': return arrow(e.x0, e.y0, e.x1, e.y1, t, a, a + .4, COL(e.col));
    case 'line': return mk(e.pts, t, a, a + (e.dur || 1.2), COL(e.col || 'green'), e.w || 10);
  }
}
// ---------- frame (9:16): the host on top, the beat below, captions on the seam ----------
const Y0 = 1060;
const PAPER = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#efe6d4'; g.fillRect(0, 0, 512, 512); const id = g.getImageData(0, 0, 512, 512), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (hash(i * .31) - .5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n * .8; } g.putImageData(id, 0, 0); g.fillStyle = 'rgba(120,95,60,.10)'; for (let y = 0; y < 512; y += 8) for (let x = (y / 8 % 2) * 4; x < 512; x += 8) { g.beginPath(); g.arc(x, y, 1.3, 0, 7); g.fill(); } return ctx.createPattern(c, 'repeat'); })();
const CAP = (() => { const out = []; let g = []; for (const w of WD) { if (g.length && (g.length >= 3 || /[.,!?:]$/.test(g[g.length - 1].w) || w.s - g[g.length - 1].e > .4)) { out.push(g); g = []; } g.push(w); } if (g.length) out.push(g); return out.map(c => ({ t0: c[0].s - .05, t1: c[c.length - 1].e + .2, words: c })); })();
function outro(t) { const k = back(seg(t, FULL, FULL + .5)); if (k > 0) { ctx.save(); ctx.translate(540, Y0 + 260); ctx.scale(k, k); ctx.beginPath(); ctx.arc(0, 0, 200, 0, 7); ctx.clip(); ctx.drawImage(LOGO, 660 - 255, 310 - 255, 510, 510, -200, -200, 400, 400); ctx.restore(); }
  stamp('FULL BREAKDOWN + FIRST CLIENT SCRIPT', 540, Y0 + 590, -.02, C.k, t, FULL + .8, 40); stamp('THE GITHUB REPORT', 540, Y0 + 720, .02, C.yel, t, FULL + 2.4, 70); }
async function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  // the host, top half: a slow push-in centred on her (host.json vcrop = [centre x, centre y, crop width] in photo pixels)
  const [cx, cy, cw] = HC.vcrop, z = 1 + .06 * seg(t, 0, DUR), sw = cw / z, sh = sw * 1000 / 1080; ctx.drawImage(HOST, cx - sw / 2, cy - sh * .42, sw, sh, 0, 0, 1080, 1000);
  const g = ctx.createLinearGradient(0, 700, 0, 1000); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.7)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1000);
  ctx.fillStyle = C.yel; ctx.fillRect(0, 996, 1080, 10);
  ctx.fillStyle = '#efe6d4'; ctx.fillRect(40, 50, 1000, 110); ctx.fillStyle = C.red; ctx.fillRect(60, 160, 980, 12); txt('THE GITHUB REPORT', 540, 136, F.a(84), C.k, 'center');
  ctx.fillStyle = C.yel; ctx.fillRect(760, 172, 280, 70); txt('MONEY #' + EP.num, 900, 225, F.a(50), C.k, 'center');
  const on = speaking(t); ctx.fillStyle = C.yel; for (let i = 0; i < 24; i++) { const v = on ? .3 + .7 * Math.abs(Math.sin(t * 10 + i * .8) * Math.sin(t * 3.7 + i * .3)) : .12; ctx.fillRect(300 + i * 20, 940 - 60 * v / 2, 10, 60 * v); }
  const b = beat(t), last = b === V.beats.length; ctx.save(); const kin = eo(seg(t, BEAT[b], BEAT[b] + .3)); ctx.translate((1 - kin) * 80, 0); ctx.globalAlpha = kin;
  if (last) outro(t); else { ctx.translate(0, Y0); V.beats[b].els.forEach(e => el(e, t)); } ctx.restore();
  ctx.save(); ctx.translate(540, 1790); ctx.rotate(-.01); ctx.fillStyle = C.k; ctx.fillRect(-490 + 8, -56 + 8, 980, 112); ctx.fillStyle = '#b21f2d'; ctx.fillRect(-490, -56, 980, 112); txt(V.band || EP.bug.replace(/ {2}· {2}/, '  •  '), 0, 22, F.a(64), '#fff', 'center'); ctx.restore();
  ctx.fillStyle = C.yel; ctx.fillRect(250, 1858, 580, 52); txt('ONE REPO. ONE WAY IT PAYS.', 540, 1898, F.a(36), C.k, 'center');
  const c = CAP.find(c => t >= c.t0 && t < c.t1); if (c && t <= END) { const f = F.b8(76), words = c.words.map(w => w.w.toUpperCase()), fw = tw(words.join(' '), f); ctx.fillStyle = C.hi; ctx.fillRect(540 - fw / 2 - 26, 790, fw + 52, 104);
    let x = 540 - fw / 2; c.words.forEach((w, j) => { txt(words[j], x, 868, f, t >= w.s && t < w.e + .1 ? C.red : C.k); x += tw(words[j] + ' ', f); }); }
  if (t > END + .5) { const k = ss(seg(t, END + .5, END + 1.3)); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#23262c'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.beginPath(); ctx.arc(540, 760, 220, 0, 7); ctx.clip(); ctx.drawImage(LOGO, 660 - 255, 310 - 255, 510, 510, 320, 540, 440, 440); ctx.restore();
    txt('THE GITHUB REPORT', 540, 1120, F.a(110), '#fff', 'center'); txt('MONEY SERIES · FOLLOW FOR #' + String(+EP.num + 1).padStart(2, '0'), 540, 1200, F.m(38), C.yel, 'center'); ctx.restore(); }
}
window.EV = []; window.DUR = DUR; window.render = render; window.READY = true;
