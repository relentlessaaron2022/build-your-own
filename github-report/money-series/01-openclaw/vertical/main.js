// The GitHub Report, Money Series 01 (OpenClaw): vertical 9:16 cut, the avatar host above Vox cards.
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
// ---------- the voiceover ----------
const OFF = .3;
const WD = (await (await fetch('audio/words.json')).json()).words.map(w => ({ ...w, s: w.s + OFF, e: w.e + OFF }));
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function at(phrase, after = 0) { const q = phrase.split(' ').map(norm);
  for (let i = 0; i < WD.length; i++) { if (WD[i].s < after) continue; if (q.every((x, j) => WD[i + j] && norm(WD[i + j].w) === x)) return WD[i].s; } throw new Error('phrase not found: ' + phrase); }
const IMG = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
const [HOST, LOGO] = await Promise.all([IMG('assets/avatar-studio.jpg'), IMG('assets/ru-logo.jpg')]);
const T = { hook: at('This free GitHub'), paid: at('a paid business.'), called: at('It is called'), fast: at('the fastest climb'), ai: at('It is an AI'), answers: at('that answers'), books: at('books the appointment,'), chases: at('and chases the'),
  free: at('The software is free.'), setup: at('Your setup is not.'), price: at('A starting price'), five: at('five hundred to'), month: at('one hundred fifty'), warn: at('One warning.'), reads: at('It can read'), never: at('Never give it'), human: at('and keep a human'), full: at('The full breakdown,') };
const END = WD[WD.length - 1].e, DUR = Math.ceil((END + 3) * 10) / 10;
const BEAT = [0, T.called - .2, T.free - .2, T.warn - .2, T.full - .2];
const beat = t => { let i = 0; while (i + 1 < BEAT.length && t >= BEAT[i + 1]) i++; return i; };
const speaking = t => WD.some(w => t >= w.s && t < w.e);
const chip = (s, x, y, t, a, bg, w = 260) => { const k = back(seg(t, a, a + .35)); if (k <= 0) return; ctx.save(); ctx.translate(x + w / 2, y); ctx.scale(k, k); ctx.rotate((hash(x + y) - .5) * .05);
  ctx.fillStyle = C.k; ctx.fillRect(-w / 2 + 7, -36, w, 66); ctx.fillStyle = bg || C.yel; ctx.fillRect(-w / 2, -43, w, 66); ctx.strokeStyle = C.k; ctx.lineWidth = 4; ctx.strokeRect(-w / 2, -43, w, 66); txt(s.toUpperCase(), 0, 3, F.a(36), C.k, 'center'); ctx.restore(); };
function box(x, y, w, h, s, fill, t, a, size = 46, col = C.k) { const k = back(seg(t, a, a + .4)); if (k <= 0) return; ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k);
  ctx.fillStyle = C.k; ctx.fillRect(-w / 2 + 10, -h / 2 + 10, w, h); ctx.fillStyle = fill; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = C.k; ctx.lineWidth = 5; ctx.strokeRect(-w / 2, -h / 2, w, h);
  const ls = s.split('\n'); ls.forEach((l, j) => txt(l, 0, size * .35 + (j - (ls.length - 1) / 2) * size * 1.1, F.a(size), col, 'center')); ctx.restore(); }
function card(x, y, w, owner, name, lines, tags, star, lt, a, accent = C.or) {
  const k = seg(lt, a, a + .4); if (k <= 0) return; const h = 128 + lines.length * 44 + (tags.length ? 66 : 0);
  ctx.save(); ctx.globalAlpha = clamp(k * 2); ctx.translate(0, (1 - eo(k)) * -50); ctx.fillStyle = C.k; ctx.fillRect(x + 14, y + 14, w, h); ctx.fillStyle = C.card; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.k; ctx.lineWidth = 5; ctx.strokeRect(x, y, w, h); ctx.fillStyle = accent; ctx.fillRect(x, y, 18, h);
  if (owner) txt(owner.toUpperCase() + ' /', x + 44, y + 42, F.m(22), C.grey); txt(name, x + 44, y + 92, F.a(52), C.k);
  if (star) { const sw = tw(star, F.b8(24)) + 30; ctx.fillStyle = C.red; ctx.fillRect(x + w - sw - 22, y + 24, sw, 40); txt(star, x + w - sw / 2 - 22, y + 52, F.b8(24), '#fff', 'center'); }
  lines.forEach((l, i) => txt(l, x + 44, y + 142 + i * 44, F.b6(33), C.k)); let tx = x + 44; for (const tg of tags) { const pw = tw(tg.toUpperCase(), F.b8(24)) + 26; ctx.fillStyle = C.hi; ctx.fillRect(tx, y + h - 56, pw, 38); txt(tg.toUpperCase(), tx + 13, y + h - 28, F.b8(24), C.k); tx += pw + 12; } ctx.restore(); }
function bigText(s, x, y, size, col, lt, a, align = 'left') { const sw = seg(lt, a - .25, a + .1); if (sw <= 0) return; const w = tw(s, F.a(size)), x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.save(); ctx.fillStyle = C.hi; ctx.translate(x0 - 14, y - size * .78); ctx.fillRect(0, 0, (w + 28) * eo(sw), size * .9); ctx.restore(); const k = back(seg(lt, a, a + .35)); if (k <= 0) return; ctx.save(); ctx.globalAlpha = clamp(k * 1.5); ctx.translate(x, y); ctx.scale(k, k); txt(s, 0, 0, F.a(size), col, align); ctx.restore(); }
function stamp(s, x, y, rot, col, lt, a, size = 64) { const k = seg(lt, a, a + .2); if (k <= 0) return; const sc = lerp(1.6, 1, eo(k));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = k; const w = tw(s, F.a(size)) + 50, hh = size * 1.25; ctx.fillStyle = C.k; ctx.fillRect(-w / 2 + 9, -size * .85 + 9, w, hh);
  ctx.fillStyle = col; ctx.fillRect(-w / 2, -size * .85, w, hh); txt(s, 0, size * .2, F.a(size), col === C.yel ? C.k : '#fff', 'center'); ctx.restore(); }
const check = (m, s, c, x, y, t, a) => { if (t < a) return; const k = back(seg(t, a, a + .35)); ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.fillRect(6, -54, 84, 84); ctx.fillStyle = c; ctx.fillRect(0, -60, 84, 84); txt(m, 42, 6, F.a(60), '#fff', 'center'); ctx.restore(); if (t > a + .1) txt(s, x + 110, y, F.b8(44), C.k); };

// ---------- the beats (lower half, y 1000–1920) ----------
const Y0 = 1060;
const BEATS = [
  t => { bigText('FREE REPO', 80, Y0 + 170, 150, C.k, t, T.hook + .3); bigText('PAID BUSINESS', 80, Y0 + 360, 150, C.green, t, T.paid); },
  t => { card(60, Y0, 960, 'openclaw', 'OpenClaw', ['A personal AI assistant that runs', 'on your own machine.'], ['open source'], '250K+ stars', t, T.called, C.or);
    stamp('FASTEST CLIMB IN GITHUB HISTORY', 540, Y0 + 400, -.03, C.red, t, T.fast + .3, 48);
    [['answers after-hours messages', T.answers], ['books the appointment', T.books], ['chases the late invoice', T.chases]].forEach(([s, a], i) => check('✓', s, C.green, 80, Y0 + 560 + i * 100, t, a)); },
  t => { stamp('FREE SOFTWARE', 300, Y0 + 80, -.05, C.green, t, T.free, 56); stamp('PAID SETUP', 760, Y0 + 80, .04, C.red, t, T.setup, 56);
    box(60, Y0 + 220, 450, 260, '$500\nSETUP', '#fff', t, T.five, 90); box(570, Y0 + 220, 450, 260, '$150\nA MONTH', C.yel, t, T.month, 90);
    if (t > T.price) txt('a starting price, not a promise', 540, Y0 + 600, F.h(56), C.k, 'center'); },
  t => { bigText('ONE WARNING', 80, Y0 + 150, 130, C.red, t, T.warn + .1); if (t > T.reads) txt('it reads email and runs commands', 80, Y0 + 260, F.h(56), C.k);
    check('✗', 'never banking passwords', C.red, 80, Y0 + 420, t, T.never); check('✓', 'a human approves any money', C.green, 80, Y0 + 560, t, T.human); },
  t => { const k = back(seg(t, T.full, T.full + .5)); if (k > 0) { ctx.save(); ctx.translate(540, Y0 + 260); ctx.scale(k, k); ctx.beginPath(); ctx.arc(0, 0, 200, 0, 7); ctx.clip(); ctx.drawImage(LOGO, 660 - 255, 310 - 255, 510, 510, -200, -200, 400, 400); ctx.restore(); }
    stamp('FULL BREAKDOWN + FIRST CLIENT SCRIPT', 540, Y0 + 590, -.02, C.k, t, T.full + .8, 40); stamp('THE GITHUB REPORT', 540, Y0 + 720, .02, C.yel, t, T.full + 2.4, 70); },
];

// ---------- frame ----------
const PAPER = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#efe6d4'; g.fillRect(0, 0, 512, 512); const id = g.getImageData(0, 0, 512, 512), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (hash(i * .31) - .5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n * .8; } g.putImageData(id, 0, 0); g.fillStyle = 'rgba(120,95,60,.10)'; for (let y = 0; y < 512; y += 8) for (let x = (y / 8 % 2) * 4; x < 512; x += 8) { g.beginPath(); g.arc(x, y, 1.3, 0, 7); g.fill(); } return ctx.createPattern(c, 'repeat'); })();
const CAP = (() => { const out = []; let g = []; for (const w of WD) { if (g.length && (g.length >= 3 || /[.,!?:]$/.test(g[g.length - 1].w) || w.s - g[g.length - 1].e > .4)) { out.push(g); g = []; } g.push(w); } if (g.length) out.push(g); return out.map(c => ({ t0: c[0].s - .05, t1: c[c.length - 1].e + .2, words: c })); })();
async function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  // the host, top half: a slow push-in on her
  const z = 1 + .06 * seg(t, 0, DUR), sw = 860 / z, sh = sw * 1000 / 1080; ctx.drawImage(HOST, 470 - sw / 2, 300 - sh * .42, sw, sh, 0, 0, 1080, 1000);
  const g = ctx.createLinearGradient(0, 700, 0, 1000); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.7)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1000);
  ctx.fillStyle = C.yel; ctx.fillRect(0, 996, 1080, 10);
  // header, like the channel's thumbnails
  ctx.fillStyle = '#efe6d4'; ctx.fillRect(40, 50, 1000, 110); ctx.fillStyle = C.red; ctx.fillRect(60, 160, 980, 12); txt('THE GITHUB REPORT', 540, 136, F.a(84), C.k, 'center');
  ctx.fillStyle = C.yel; ctx.fillRect(760, 172, 280, 70); txt('MONEY #01', 900, 225, F.a(50), C.k, 'center');
  // waveform while she speaks
  const on = speaking(t); ctx.fillStyle = C.yel; for (let i = 0; i < 24; i++) { const v = on ? .3 + .7 * Math.abs(Math.sin(t * 10 + i * .8) * Math.sin(t * 3.7 + i * .3)) : .12; ctx.fillRect(300 + i * 20, 940 - 60 * v / 2, 10, 60 * v); }
  // beats
  const b = beat(t); ctx.save(); const kin = eo(seg(t, BEAT[b], BEAT[b] + .3)); ctx.translate((1 - kin) * 80, 0); ctx.globalAlpha = kin; BEATS[b](t); ctx.restore();
  // footer, like the channel's thumbnails
  ctx.save(); ctx.translate(540, 1790); ctx.rotate(-.01); ctx.fillStyle = C.k; ctx.fillRect(-490 + 8, -56 + 8, 980, 112); ctx.fillStyle = '#b21f2d'; ctx.fillRect(-490, -56, 980, 112); txt('$0 SOFTWARE  •  PAID SETUP', 0, 22, F.a(64), '#fff', 'center'); ctx.restore();
  ctx.fillStyle = C.yel; ctx.fillRect(250, 1858, 580, 52); txt('ONE REPO. ONE WAY IT PAYS.', 540, 1898, F.a(36), C.k, 'center');
  // captions over the bottom of the photo
  const c = CAP.find(c => t >= c.t0 && t < c.t1); if (c && t <= END) { const f = F.b8(76), words = c.words.map(w => w.w.toUpperCase()), fw = tw(words.join(' '), f); ctx.fillStyle = C.hi; ctx.fillRect(540 - fw / 2 - 26, 790, fw + 52, 104);
    let x = 540 - fw / 2; c.words.forEach((w, j) => { txt(words[j], x, 868, f, t >= w.s && t < w.e + .1 ? C.red : C.k); x += tw(words[j] + ' ', f); }); }
  if (t > END + .5) { const k = ss(seg(t, END + .5, END + 1.3)); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#23262c'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.beginPath(); ctx.arc(540, 760, 220, 0, 7); ctx.clip(); ctx.drawImage(LOGO, 660 - 255, 310 - 255, 510, 510, 320, 540, 440, 440); ctx.restore();
    txt('THE GITHUB REPORT', 540, 1120, F.a(110), '#fff', 'center'); txt('MONEY SERIES · FOLLOW FOR #02', 540, 1200, F.m(38), C.yel, 'center'); ctx.restore(); }
}
window.EV = []; window.DUR = DUR; window.render = render; window.READY = true;
