// The GitHub Report, Money Series: the episode engine (16:9). Boards come from episode.json; the host photo from assets/host.json.
// One whiteboard, nine regions, the camera travels between them. Marker drawings with watercolor washes, GitHub-style repo cards
// pinned with magnets, hand-written labels, a news strap per section and burned captions. Every beat is anchored to a word in the voiceover.
import { ink, wash } from './sketch.js';
const W = 1920, H = 1080, cv = document.getElementById('out'), ctx = cv.getContext('2d');
const C = { k: '#141414', blue: '#1f5fd1', or: '#ef6c2f', red: '#e2402f', green: '#16855a', yel: '#ffd60a', grey: '#6b6b6b', card: '#fffdf7', line: '#141414', hi: 'rgba(255,214,10,.85)' };
const F = { a: s => `400 ${s}px Anton`, b8: s => `800 ${s}px Barlow`, b6: s => `600 ${s}px Barlow`, m: s => `500 ${s}px Plex`, h: s => `600 ${s}px Caveat` };
await Promise.all([F.a(40), F.b8(40), F.b6(40), F.m(30), F.h(40)].map(f => document.fonts.load(f)));
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - x, 3), eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, ss = x => x * x * (3 - 2 * x), back = x => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- the episode (episode.json) and the voiceover ----------
const EP = await (await fetch('episode.json')).json();
const HC = await (await fetch('assets/host.json')).json();          // the outfit photo: file and where her face is
const OFF = 1.0;
const WD = (await (await fetch('audio/words.json')).json()).words.map(w => ({ ...w, s: w.s + OFF, e: w.e + OFF }));
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function at(phrase, after = 0) { const q = phrase.split(' ').map(norm).filter(Boolean);
  for (let i = 0; i < WD.length; i++) { if (WD[i].s < after) continue; if (q.every((x, j) => WD[i + j] && norm(WD[i + j].w) === x)) return WD[i].s; } throw new Error('phrase not found: ' + phrase); }
const A = (p, d = 0) => typeof p === 'number' ? p : at(p) + d;
const IMG = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
const [HOST, LOGO] = await Promise.all([IMG('assets/' + HC.file), IMG('assets/ru-logo.jpg')]);
const T = { repo: A(EP.sections[0].at), recap: A(EP.recap.at), news: A('And if you are really'), cost99: A('The cost?'), link: A('The link is in'), credit: A('This is The GitHub Report,'), ra: A('Relentless Aaron.') };
EP.open.forEach(o => o._a = A(o.at, o.d || 0));
const END = WD[WD.length - 1].e, DUR = Math.ceil((END + 4.2) * 10) / 10;
const REG = [0, ...EP.sections.map(s => A(s.at) - .3), T.recap - .3];
const SECT = [null, ...EP.sections.map(s => s.tag), null];
const RX = i => i * 2200;
// resolve every element's timing once
const res = e => { if (e.at !== undefined) e._a = A(e.at, e.d || 0); if (e.items) e.items.forEach(it => it._a = A(it.at, it.d || 0)); if (e.end) e._b = A(e.end, e.endD || 0); };
EP.sections.forEach(s => s.els.forEach(res));
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
const B = [() => {}, ...EP.sections.map(s => t => s.els.forEach(e => el(e, t)))];
// the recap board
B.push(t => { const r0 = T.recap;
  EP.recap.items.forEach(([n, l, col, d], i) => { const x = 180 + i * 520; bigText(n, x, 330, 170, COL(col), t, r0 + d, 'left'); hw(l, x, 410, 50, C.k, t, r0 + d + .3, r0 + d + 1.2); });
  const n0 = T.news; if (t > n0) { const k = back(seg(t, n0, n0 + .45)); ctx.save(); ctx.translate(560, 680); ctx.rotate(-.02); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.fillRect(-380 + 14, -150 + 14, 760, 300); ctx.fillStyle = '#fff'; ctx.fillRect(-380, -150, 760, 300); ctx.strokeStyle = C.k; ctx.lineWidth = 5; ctx.strokeRect(-380, -150, 760, 300);
    txt('THE NEWSLETTER', 0, -70, F.a(66), C.k, 'center'); txt('every resource · every link', 0, -10, F.h(48), C.or, 'center'); ctx.restore(); }
  stamp('FREE', 820, 790, -.08, C.green, t, T.cost99 + .6, 70); stamp('LINK IN BIO / COMMENTS', 560, 900, .03, C.red, t, T.link, 44);
  if (t > T.credit) { const k = back(seg(t, T.credit, T.credit + .5)); ctx.save(); ctx.translate(1300, 640); ctx.scale(k, k); ctx.beginPath(); ctx.arc(0, 0, 150, 0, 7); ctx.clip(); ctx.drawImage(LOGO, 660 - 255, 310 - 255, 510, 510, -150, -150, 300, 300); ctx.restore(); }
  bigText('RELENTLESS AARON', 1100, 880, 64, C.or, t, T.ra, 'left'); });
// ---------- camera, board, overlays ----------
function region(t) { let i = 0; while (i + 1 < REG.length && t >= REG[i + 1]) i++; return i; }
function cam(t) {
  const i = region(t), k = i > 1 ? eio(seg(t, REG[i], REG[i] + .7)) : 1, x0 = RX(Math.max(1, i - 1)), x1 = RX(Math.max(1, i));
  const z = 1 - .08 * Math.sin(Math.PI * k) + .03 * seg(t, REG[i], (REG[i + 1] || DUR));
  return [lerp(x0, x1, k), z];
}
const PAPER = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#efe6d4'; g.fillRect(0, 0, 512, 512); const id = g.getImageData(0, 0, 512, 512), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (hash(i * .31) - .5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n * .8; } g.putImageData(id, 0, 0); g.fillStyle = 'rgba(120,95,60,.10)'; for (let y = 0; y < 512; y += 8) for (let x = (y / 8 % 2) * 4; x < 512; x += 8) { g.beginPath(); g.arc(x, y, 1.3, 0, 7); g.fill(); } return ctx.createPattern(c, 'repeat'); })();
// the host in the studio, full frame (cover-fit, slow push-in)
function cover(img, fx, fy, dx, dy, dw, dh, zoom = 1) { const s = Math.max(dw / img.width, dh / img.height) * zoom, w = img.width * s, h = img.height * s;
  const x = clamp(dx + dw / 2 - fx * w, dx + dw - w, dx), y = clamp(dy + dh / 2 - fy * h, dy + dh - h, dy); ctx.drawImage(img, x, y, w, h); }
function hostFull(t, k = 1) { ctx.save(); ctx.globalAlpha = k; cover(HOST, HC.focus[0], HC.focus[1], 0, 0, W, H, 1.04 + .05 * seg(t, 0, T.repo)); const g = ctx.createLinearGradient(0, H * .45, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.75)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
// the host cam: her face in a ring, bottom right, a waveform while she speaks
function hostCam(t, k) { if (k <= 0) return; const cx = 1745, cy = 800, r = 120; ctx.save(); ctx.globalAlpha = k; ctx.translate(cx, cy); ctx.scale(lerp(.6, 1, eo(k)), lerp(.6, 1, eo(k)));
  ctx.fillStyle = C.k; ctx.beginPath(); ctx.arc(8, 10, r + 8, 0, 7); ctx.fill(); ctx.fillStyle = C.yel; ctx.beginPath(); ctx.arc(0, 0, r + 8, 0, 7); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip(); const z = 1 + (speaking(t) ? .012 * Math.sin(t * 13) : 0); const [fx, fy, fr] = HC.face; ctx.drawImage(HOST, fx - fr * z, fy - fr * z, 2 * fr * z, 2 * fr * z, -r, -r, r * 2, r * 2); ctx.restore();
  ctx.fillStyle = C.k; ctx.fillRect(-r - 10, r - 4, 2 * r + 20, 44); txt('YOUR HOST · RELENTLESS U', 0, r + 28, F.a(24), C.yel, 'center'); ctx.restore();
  ctx.save(); ctx.globalAlpha = k; const on = speaking(t); ctx.fillStyle = C.red; for (let i = 0; i < 9; i++) { const v = on ? .3 + .7 * Math.abs(Math.sin(t * 11 + i * .9)) : .15; ctx.fillRect(cx - 180 - 14 * i, cy + 60 - 50 * v / 2, 8, 50 * v); } ctx.restore(); }
function overlays(t) {
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,40,20,.22)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  // bug (not over the studio opener)
  if (region(t) > 0) {
  ctx.fillStyle = C.k; ctx.fillRect(1420, 36, 470, 64); ctx.fillStyle = C.yel; ctx.fillRect(1420, 36, 14, 64); txt('THE GITHUB REPORT · MONEY #' + EP.num, 1450, 80, F.a(34), '#fff');
  ctx.fillStyle = '#fff'; ctx.fillRect(1420, 100, 460, 46); ctx.strokeStyle = '#23262c'; ctx.lineWidth = 2; ctx.strokeRect(1420, 100, 460, 46); txt(EP.bug, 1446, 133, F.m(26), '#23262c'); }
  const i = region(t), s = SECT[i]; if (s) { const k = eo(seg(t, REG[i] + .4, REG[i] + .9)); ctx.save(); ctx.translate(-900 * (1 - k), 0); const w = tw(s[1], F.a(64)) + 70;
    ctx.fillStyle = C.k; ctx.fillRect(0, 30, 110 + w + 12, 100); ctx.fillStyle = C.yel; ctx.fillRect(30, 40, 90, 80); txt(s[0], 75, 103, F.a(66), C.k, 'center'); txt(s[1], 145, 106, F.a(64), '#fff'); ctx.restore(); }
  hostCam(t, i === 0 ? 0 : (i === REG.length - 1 && t > T.credit ? 1 - seg(t, T.credit, T.credit + .5) : seg(t, REG[1], REG[1] + .6)));
  captions(t);
  if (t > END + .6) { const k = ss(seg(t, END + .6, END + 1.6)); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#23262c'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.beginPath(); ctx.arc(W / 2, 330, 170, 0, 7); ctx.clip(); ctx.drawImage(LOGO, 660 - 255, 310 - 255, 510, 510, W / 2 - 170, 160, 340, 340); ctx.restore();
    txt('THE GITHUB REPORT · MONEY SERIES', W / 2, 640, F.a(100), '#fff', 'center'); txt(EP.next + '  ·  SUBSCRIBE', W / 2, 720, F.m(34), C.yel, 'center'); txt('Relentless Aaron', W / 2, 820, F.h(70), C.or, 'center'); ctx.restore(); }
}
const CAP = (() => { const out = []; let g = []; const ws = WD.map(w => ({ ...w }));
  for (let i = 0; i < ws.length; i++) { const w = ws[i]; if (g.length && (g.length >= 7 || /[.,!?:]$/.test(g[g.length - 1].w) || w.s - g[g.length - 1].e > .5)) { out.push(g); g = []; } g.push(w); }
  if (g.length) out.push(g); return out.map(c => ({ t0: c[0].s - .05, t1: c[c.length - 1].e + .25, words: c })); })();
function captions(t) {
  const c = CAP.find(c => t >= c.t0 && t < c.t1); if (!c || t > END) return;
  const f = F.b8(50), words = c.words.map(w => w.w.toUpperCase()), full = words.join(' '), fw = tw(full, f); ctx.save(); ctx.translate(W / 2 - 100, 1012); ctx.rotate(-.008); ctx.fillStyle = C.hi; ctx.fillRect(-fw / 2 - 26, -42, fw + 52, 74); ctx.restore();
  let x = W / 2 - 100 - fw / 2; c.words.forEach((w, j) => { const ww = tw(words[j], f); txt(words[j], x, 1030, f, t >= w.s && t < w.e + .1 ? C.red : C.k); x += ww + tw(' ', f); });
}
// the opener: host full frame, title over her, then a wipe to the board
function opener(t) { const out = seg(t, T.repo - .5, T.repo + .2); if (out >= 1) return; hostFull(t, 1 - out);
  ctx.save(); ctx.globalAlpha = 1 - out; const a = eo(seg(t, .3, 1.1)); ctx.fillStyle = C.k; ctx.fillRect(80 - 600 * (1 - a), 640, 900, 90); ctx.fillStyle = C.yel; ctx.fillRect(80 - 600 * (1 - a), 640, 18, 90); txt('THE GITHUB REPORT', 120 - 600 * (1 - a), 705, F.a(64), '#fff');
  EP.open.forEach(o => stamp(o.text, o.x, o.y, o.rot ?? -.03, COL(o.col || 'yel'), t, o._a, o.size || 48));
  ctx.restore(); }
async function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const [x, z] = cam(t); ctx.setTransform(z, 0, 0, z, W / 2 - (x + W / 2) * z, H / 2 - H / 2 * z); ctx.fillStyle = PAPER; ctx.fillRect(-W, -H, W * 30, H * 3);
  const i = region(t); for (let r = Math.max(1, i - 1); r <= i; r++) { if (t < REG[r]) continue; ctx.save(); ctx.translate(RX(r), 0); B[r](t); ctx.restore(); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); if (i === 0 || t < T.repo + .2) opener(t); overlays(t);
}
window.EV = []; window.DUR = DUR; window.render = render; window.READY = true;
