// The GitHub Report, Ep. 05: bold Vox infographic board (16:9).
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

// ---------- the voiceover (aligned to the manuscript, so every word is spelled right) ----------
const OFF = 2.5;                                                 // a title sting before the first word
const WD = (await (await fetch('audio/ep05-words.json')).json()).words.map(w => ({ ...w, s: w.s + OFF, e: w.e + OFF }));
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function at(phrase, after = 0) { const q = phrase.split(' ').map(norm);
  for (let i = 0; i < WD.length; i++) { if (WD[i].s < after) continue; if (q.every((x, j) => WD[i + j] && norm(WD[i + j].w) === x)) return WD[i].s; } throw new Error('phrase not found: ' + phrase); }
const FIX = [], PAIRS = [];
const T = {
  gm: at('Good morning'), seven: at('seven more tools'), total: at('The running total'), zero: at('and the bill'), nothing: at('Nothing has been'), voices: at('Today, the hunt found'),
  vv: at('The strongest find'), ms: at("It is Microsoft's"), gen: at('It generates long-form'), distinct: at('distinct voices'), one: at('from one model'), stars: at('and it carries'), pushed: at('It was pushed'),
  why: at("Here's why"), brand: at('Your voice is your'), show: at('The show,'), films: at('the films,'), books: at('the audiobooks,'), chars: at('the characters.'), studio: at('Voice Studio gave'), cast: at('VibeVoice gives you'),
  onem: at('One model, many'), many: at('many voices, long'), long: at('long scenes,'), nometer: at('no per-character meter'), mit: at('It is licensed MIT'), products: at('including inside your'), honest: at('One honest note: local inference'), readme: at('so check the README'), machine: at('One machine, many voices.'),
  film: at('Film. ArtCraft'), ac: at('ArtCraft is an'), who: at('for artists, designers,'), ide: at('an AI media'), acstars: at('41,000 stars,'), slate: at('Your film slate'), craft: at('This one is built'),
  agents: at('Agents. Anthropic'), kwp: at('Anthropic published its'), rwa: at('for research, writing,'), kstars: at('35,000 stars,'), shop: at('The same shop'), ships: at('now ships the'),
  web: at('Web design. Chrome'), mwg: at('Chrome published Modern'), keep: at('official skills that'), wstars: at('Nearly 6,000 stars.'), today: at('pushed November 14.'), sites: at('Your client sites'),
  pdf: at('Books and guides.'), st: at('Stirling-PDF is the'), dozens: at('Dozens of tools'), selfh: at('self-hosted.'), pstars: at('96,000 stars.'), free: at('business, free.'),
  music: at('Music and sound.'), asm: at('Audio Studio MCP generates'), stable: at('with Stable Audio'), plain: at('driven by Claude'), astars: at('Nearly 700 stars,'), apple: at('One honest note: local generation'), win: at('so the Windows'), intel: at('and the Intel'),
  game: at('Game dev. Saltline'), sl: at('Saltline is a'), drones: at('Drones and robot'), file: at('The whole game'), sstars: at('339 stars'), nolic: at('No license is declared'), study: at('Study the build'),
  caution: at('The caution this afternoon'), notfree: at('A repo with no license'), public: at('The code is public'), until: at('Until the author'), can: at('you can read it'), cannot: at('but you cannot'), rule: at('That rule protects'),
  recap: at('That is Monday'), news: at("And if you're really"), cost: at('The cost?'), link: at('The link is in'), credit: at('This is The GitHub Report, brought'),
};
const END = WD[WD.length - 1].e, DUR = 228.8;
const REG = [0, T.vv - .4, T.why - .4, T.film - .4, T.agents - .4, T.web - .4, T.pdf - .4, T.music - .4, T.game - .4, T.caution - .4, T.recap - .4];
const SECT = [null, ['★', 'HEADLINE: VIBEVOICE'], ['$', 'WHY IT FITS YOUR BUSINESS'], ['1', 'FILM'], ['2', 'AGENTS'], ['3', 'WEB DESIGN'], ['4', 'BOOKS & GUIDES'], ['5', 'MUSIC & SOUND'], ['6', 'GAME DEV'], ['!', 'ONE CAUTION: NO LICENSE'], null];
const RX = i => i * 2200;
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
// a yellow sticky note
function note(x, y, rot, title, lines, t, a, cols = [], w = 400, tcol = C.red) { if (t < a) return; const k = back(seg(t, a, a + .4)), h = 90 + lines.length * 46;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.fillRect(-w / 2 + 10, -h / 2 + 10, w, h); ctx.fillStyle = '#ffe680'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = C.k; ctx.lineWidth = 4; ctx.strokeRect(-w / 2, -h / 2, w, h);
  txt(title, 0, -h / 2 + 56, F.a(40), tcol, 'center'); lines.forEach((l, j) => txt(l, 0, -h / 2 + 108 + j * 46, F.h(40), cols[j] || C.k, 'center')); ctx.restore(); }
// a voice waveform: bars move while the narrator speaks
function wave(x, y, w, h, col, t, a, ph = 0) { const k = seg(t, a, a + .5); if (k <= 0) return; const n = Math.floor(w / 16), on = speaking(t);
  ctx.fillStyle = col; for (let i = 0; i < n * eo(k); i++) { const v = on ? .25 + .75 * Math.abs(Math.sin(t * 9 + i * .7 + ph) * Math.sin(t * 4.3 + i * .31 + ph * 2)) : .12; ctx.fillRect(x + i * 16, y - h * v / 2, 10, h * v); } }
function box(x, y, w, h, s, fill, t, a, size = 46, col = C.k) { const k = back(seg(t, a, a + .4)); if (k <= 0) return; ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k);
  ctx.fillStyle = C.k; ctx.fillRect(-w / 2 + 10, -h / 2 + 10, w, h); ctx.fillStyle = fill; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = C.k; ctx.lineWidth = 5; ctx.strokeRect(-w / 2, -h / 2, w, h);
  const ls = s.split('\n'); ls.forEach((l, j) => txt(l, 0, size * .35 + (j - (ls.length - 1) / 2) * size * 1.1, F.a(size), col, 'center')); ctx.restore(); }
const B = [
  // 0 · cold open
  t => {
    bigText('VOICES, PLURAL', 120, 230, 110, C.k, t, T.gm + .3); hw('The GitHub Report · Monday, November 16', 128, 305, 50, C.or, t, T.gm + .9, T.gm + 2.4); mk([[120, 345], [1500, 351]], t, T.gm + 1.5, T.gm + 2.5, C.or, 8);
    for (let i = 0; i < 108; i++) { const isNew = i >= 101, k = isNew ? seg(t, T.seven + .3 + (i - 101) * .25, T.seven + .6 + (i - 101) * .25) : seg(t, T.gm + .5, T.gm + 2.5); if (k <= 0) continue;
      const x = 120 + (i % 23) * 47 + (hash(i) - .5) * 8, y = 420 + Math.floor(i / 23) * 36 - (isNew ? (1 - eo(k)) * 60 : 0); ctx.save(); ctx.globalAlpha = clamp(k * 2); ctx.translate(x, y); ctx.rotate((hash(i * 3) - .5) * .15);
      ctx.fillStyle = isNew ? C.or : ['#ffe680', '#ffd1dc', '#c8f0d0', '#cfe4ff'][i % 4]; ctx.fillRect(0, 0, 40, 24); ctx.restore(); }
    hw('the hunt ran twice · +7 this afternoon', 120, 680, 52, C.or, t, T.seven - .2, T.seven + 1.4); bigText('108', 1000, 700, 120, C.blue, t, T.total + 1.5); hw('vetted tools', 1240, 690, 52, C.blue, t, T.total + 1.8, T.total + 2.6);
    stamp('$0', 1640, 470, -.08, C.green, t, T.zero + .8, 120); stamp('0 INSTALLS WITHOUT YOUR WORD', 1460, 820, .04, C.red, t, T.nothing + .4, 40);
    [['#f4c9a0', 0], ['#8d5a3b', .25], ['#d9a066', .5]].forEach(([c, d], i) => face(260 + i * 230, 900, 80, t, T.voices + .6 + d, c)); hw('...on one machine', 960, 920, 60, C.green, t, T.voices + 1.6, T.voices + 2.8);
  },
  // 1 · VibeVoice
  t => {
    card(120, 170, 940, 'microsoft', 'VibeVoice', ['Open-source frontier voice AI: long-form speech', 'with multiple speakers from one model.'], ['MIT', 'long-form speech'], '57K stars', t, T.vv + .3, C.blue);
    // one model, many speakers
    box(1240, 170, 520, 120, 'ONE MODEL', C.yel, t, T.one - .2, 60);
    const cols = ['#f4c9a0', '#8d5a3b', '#d9a066', '#c68642'], wc = [C.blue, C.or, C.green, C.red];
    for (let i = 0; i < 4; i++) { const a = T.gen + .6 + i * .35, x = 1250 + (i % 2) * 290, y = 470 + Math.floor(i / 2) * 250; face(x, y, 70, t, a, cols[i]); wave(x + 90, y, 170, 90, wc[i], t, a + .2, i * 1.7); mk([[1500, 300], [x, y - 80]], t, T.one + .2, T.one + .6, C.k, 4); }
    hw('distinct voices, one conversation', 140, 650, 54, C.k, t, T.distinct, T.distinct + 1.6);
    hw('pushed in October · holds the count', 140, 740, 50, C.green, t, T.pushed, T.pushed + 1.6);
    note(560, 900, -.02, 'CHECK THE REPO', ['Microsoft has pulled the long-form TTS code before.', 'Confirm what is live first.'], t, T.pushed + 1, [], 900, C.red);
  },
  // 2 · why it fits your business
  t => {
    bigText('YOUR VOICE IS YOUR BRAND', 120, 230, 96, C.k, t, T.brand);
    [['the show', T.show], ['the films', T.films], ['audiobooks', T.books], ['characters', T.chars]].forEach(([s, a], i) => chip(s, 130 + i * 300, 330, t, a, null, 270));
    box(130, 450, 520, 170, 'VOICE STUDIO\ncloning + dubbing', '#fff', t, T.studio, 44); arrow(690, 535, 820, 535, t, T.cast - .3, T.cast); box(860, 430, 520, 210, 'VIBEVOICE\nA FULL CAST', C.yel, t, T.cast + .2, 58);
    [['ONE MODEL', T.onem, C.blue], ['MANY VOICES', T.many, C.or], ['LONG SCENES', T.long, C.green], ['NO PER-CHARACTER METER', T.nometer, C.red]].forEach(([s, a, c], i) => stamp(s, i < 3 ? 230 + i * 360 : 1500, 760, -.04 + i * .03, c, t, a, i < 3 ? 46 : 40));
    stamp('MIT · USE IT IN YOUR OWN PRODUCTS', 620, 900, -.02, C.green, t, T.products, 42);
    note(1590, 300, .05, 'ONE HONEST NOTE', ['built for GPU hardware', 'check the README', 'for the video memory'], t, T.honest, [C.k, C.red, C.red], 420);
    bigText('ONE MACHINE, MANY VOICES', 1220, 900, 60, C.k, t, T.machine, 'left');
  },
  // 3 · film: ArtCraft
  t => {
    card(120, 170, 960, 'storytold', 'ArtCraft', ['An intentional crafting engine:', 'an AI media creation IDE.'], ['Apache 2.0', 'pushed Nov 12'], '41K stars', t, T.ac, C.or);
    ['artists', 'designers', 'filmmakers'].forEach((s, i) => chip(s, 140 + i * 320, 620, t, T.who + i * .45, null, 290));
    // a film slate
    const s0 = T.slate - .3, k = back(seg(t, s0, s0 + .5)); if (k > 0) { ctx.save(); ctx.translate(1480, 500); ctx.scale(k, k); ctx.rotate(-.04);
      ctx.fillStyle = C.k; ctx.fillRect(-250 + 14, -100 + 14, 500, 330); ctx.fillStyle = '#23262c'; ctx.fillRect(-250, -100, 500, 330); ctx.strokeStyle = C.k; ctx.lineWidth = 6; ctx.strokeRect(-250, -100, 500, 330);
      const open = -.35 * (1 - eo(seg(t, s0 + .6, s0 + .9))); ctx.save(); ctx.translate(-250, -100); ctx.rotate(open); ctx.fillStyle = '#fff'; ctx.fillRect(0, -70, 500, 70); ctx.fillStyle = C.k; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(i * 90 + 10, -70); ctx.lineTo(i * 90 + 55, -70); ctx.lineTo(i * 90 + 25, 0); ctx.lineTo(i * 90 - 20, 0); ctx.fill(); } ctx.restore();
      txt('THE FILM SLATE', 0, 20, F.a(54), '#fff', 'center'); txt('runs on craft', 0, 110, F.h(64), C.yel, 'center'); ctx.restore(); }
    stamp('CRAFT, NOT SLOP', 1480, 860, -.05, C.red, t, T.slate + 1.6, 64);
    hw('built for the craft', 140, 860, 60, C.green, t, T.craft, T.craft + 1);
  },
  // 4 · agents: Knowledge Work Plugins
  t => {
    card(120, 170, 1000, 'anthropics', 'Knowledge Work Plugins', ['The official plugin repo for Claude Cowork.'], ['Apache 2.0', 'pushed Nov 13'], '35K stars', t, T.kwp, C.blue);
    ['research', 'writing', 'analysis'].forEach((s, i) => chip(s, 140 + i * 320, 560, t, T.rwa + i * .5, null, 290));
    box(1260, 220, 480, 150, 'THE MODEL', '#fff', t, T.shop + .6, 60); arrow(1500, 400, 1500, 560, t, T.ships - .2, T.ships + .2); box(1260, 590, 480, 150, 'THE WORKFLOW', C.yel, t, T.ships + .3, 60);
    hw('same shop. now it ships both.', 140, 760, 58, C.k, t, T.shop, T.shop + 2);
  },
  // 5 · web design: Modern Web Guidance
  t => {
    card(120, 170, 1000, 'GoogleChrome', 'Modern Web Guidance', ['Official skills that keep your coding agent', 'current on web best practices.'], ['Apache 2.0', 'pushed Nov 14'], '~6K stars', t, T.mwg, C.green);
    // a pile of changelogs you no longer read
    const c0 = T.sites; for (let i = 0; i < 5; i++) { const k = back(seg(t, c0 + i * .15, c0 + .4 + i * .15)); if (k <= 0) continue; ctx.save(); ctx.translate(1450 + (i - 2) * 22, 520 - i * 26); ctx.rotate((hash(i) - .5) * .2); ctx.scale(k, k);
      ctx.fillStyle = C.k; ctx.fillRect(-170 + 8, -110 + 8, 340, 220); ctx.fillStyle = '#fff'; ctx.fillRect(-170, -110, 340, 220); ctx.strokeStyle = C.k; ctx.lineWidth = 4; ctx.strokeRect(-170, -110, 340, 220); txt('CHANGELOG', 0, -50, F.a(40), C.k, 'center'); ctx.fillStyle = '#ccc'; for (let j = 0; j < 4; j++) ctx.fillRect(-130, -20 + j * 30, 260 - j * 30, 12); ctx.restore(); }
    mk([[1240, 300], [1660, 700]], t, c0 + 1.4, c0 + 1.8, C.red, 12); mk([[1660, 300], [1240, 700]], t, c0 + 1.7, c0 + 2.1, C.red, 12);
    stamp('YOUR CLIENT SITES STAY CURRENT', 620, 640, -.03, C.green, t, T.sites + .5, 46);
  },
  // 6 · books and guides: Stirling-PDF
  t => {
    card(120, 170, 960, 'Stirling-Tools', 'Stirling-PDF', ['The most-starred PDF app on GitHub.'], ['self-hosted'], '96K stars', t, T.st, C.red);
    ['edit', 'merge', 'split', 'convert'].forEach((s, i) => chip(s, 140 + i * 240, 520, t, at(s + ',', T.dozens) - .05, null, 220));
    // the workshop: a stack of PDFs
    for (let i = 0; i < 4; i++) { const k = back(seg(t, T.dozens + i * .3, T.dozens + .4 + i * .3)); if (k <= 0) continue; ctx.save(); ctx.translate(1300 + i * 120, 420 + (i % 2) * 40); ctx.rotate((hash(i + 9) - .5) * .25); ctx.scale(k, k);
      ctx.fillStyle = C.k; ctx.fillRect(-90 + 8, -120 + 8, 180, 240); ctx.fillStyle = '#fff'; ctx.fillRect(-90, -120, 180, 240); ctx.strokeStyle = C.k; ctx.lineWidth = 4; ctx.strokeRect(-90, -120, 180, 240); ctx.fillStyle = C.red; ctx.fillRect(-90, 50, 180, 70); txt('PDF', 0, 102, F.a(48), '#fff', 'center'); ctx.restore(); }
    hw('the whole PDF workshop for your guide business', 140, 720, 54, C.k, t, T.pstars + 1, T.pstars + 3);
    stamp('FREE', 1500, 820, -.08, C.green, t, T.free, 120);
  },
  // 7 · music and sound: Audio Studio MCP
  t => {
    card(120, 170, 1000, 'kanaworksai-hue', 'Audio Studio MCP', ['Background music and sound effects, generated', 'locally with Stable Audio 3.'], ['MIT'], '~700 stars', t, T.asm, C.or);
    wave(140, 640, 960, 150, C.or, t, T.stable, 0);
    bubble(140, 760, 740, 'Claude Code, in plain language', t, T.plain, C.blue);
    note(1550, 470, .04, 'ONE HONEST NOTE', ['Apple Silicon: the target', 'Windows: check the README', 'Intel MacBook: not the target'], t, T.apple, [C.green, C.or, C.red], 520);
  },
  // 8 · game dev: Saltline
  t => {
    card(120, 170, 960, null, 'Saltline', ['A single-level browser FPS in one', 'rainy container port.'], ['one HTML file', '1.4 MB'], '339 stars · 4 days', t, T.sl, C.k);
    // the port at night, in the rain
    const p0 = T.sl + 1; wsh(rectP(1180, 170, 1840, 760), '#23262c', t, p0, p0 + .5, .95); if (t > p0 + .3) { ctx.save(); ctx.beginPath(); ctx.rect(1180, 170, 660, 590); ctx.clip();
      [['#1f5fd1', 1220, 560], ['#e2402f', 1440, 600], ['#16855a', 1660, 540], ['#ef6c2f', 1300, 450]].forEach(([c, x, y]) => { ctx.fillStyle = c; ctx.fillRect(x, y, 200, 110); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 3; for (let j = 1; j < 8; j++) { ctx.beginPath(); ctx.moveTo(x + j * 25, y); ctx.lineTo(x + j * 25, y + 110); ctx.stroke(); } });
      ctx.strokeStyle = 'rgba(200,220,255,.5)'; ctx.lineWidth = 2; for (let i = 0; i < 70; i++) { const x = 1180 + hash(i) * 660, y = 170 + ((hash(i * 7) * 590 + t * 900) % 590); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 28); ctx.stroke(); }
      // a drone
      if (t > T.drones) { const dx = 1510 + Math.sin(t * 1.3) * 120, dy = 280 + Math.sin(t * 2.1) * 20; ctx.fillStyle = '#ccc'; ctx.fillRect(dx - 40, dy - 10, 80, 20); for (const o of [-50, 50]) { ctx.fillRect(dx + o - 30, dy - 18, 60, 6); } ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(dx, dy + 14, 7, 0, 7); ctx.fill(); }
      // a robot dog
      if (t > T.drones + .5) { const rx = 1320 + ((t - T.drones) * 60 % 380); ctx.fillStyle = '#bbb'; ctx.fillRect(rx, 690, 110, 34); ctx.fillRect(rx + 100, 666, 44, 30); for (const lx of [8, 34, 70, 96]) ctx.fillRect(rx + lx, 724, 10, 34 + Math.sin(t * 12 + lx) * 4); ctx.fillStyle = C.red; ctx.fillRect(rx + 126, 674, 10, 8); }
      ctx.restore(); mk(rectP(1180, 170, 1840, 760), t, p0, p0 + .5, C.k, 6); }
    hw('drones and robot dogs hunting you', 140, 600, 56, C.k, t, T.drones, T.drones + 1.6);
    stamp('NO LICENSE DECLARED', 560, 760, -.04, C.red, t, T.nolic + .2, 58); hw('study the build. do not lift the code.', 140, 900, 56, C.red, t, T.study, T.study + 1.6);
  },
  // 9 · caution: no license
  t => {
    bigText('NO LICENSE ≠ FREE TO USE', 120, 240, 104, C.k, t, T.notfree + .3); stamp('PUBLIC IS NOT PERMISSION', 1480, 380, .04, C.red, t, T.public + 1.2, 50);
    hw('until the author declares a license...', 140, 360, 54, C.grey, t, T.until, T.until + 1.4);
    box(140, 440, 640, 90, 'YOU CAN', C.green, t, T.can - .2, 52, '#fff'); [['read it', at('read it,', T.can)], ['learn from it', at('learn from', T.can)], ['build your own version of the idea', at('build your own', T.can)]].forEach(([s, a], i) => { if (t < a) return; txt('✓', 160, 610 + i * 70, F.a(52), C.green); hw(s, 220, 610 + i * 70, 52, C.k, t, a, a + .8); });
    box(1000, 440, 640, 90, 'YOU CANNOT', C.red, t, T.cannot, 52, '#fff'); if (t > T.cannot + .3) { txt('✗', 1020, 610, F.a(52), C.red); hw('lift the code into your game', 1080, 610, 52, C.k, t, T.cannot + .3, T.cannot + 1.4); }
    hw('that rule protects your game the same way it protects theirs', 140, 900, 52, C.blue, t, T.rule, T.rule + 2.4);
  },
  // 10 · recap, newsletter and sign-off
  t => { const r0 = T.recap;
    [['108', 'tools on the board', C.blue, 1.4], ['$0', 'spent', C.green, 3.4], ['0', 'installs without your word', C.or, 5.1]].forEach(([n, l, col, d], i) => { const x = 180 + i * 560; bigText(n, x, 330, 180, col, t, r0 + d, 'left'); hw(l, x, 410, 50, C.k, t, r0 + d + .3, r0 + d + 1.2); });
    const n0 = T.news; if (t > n0) { const k = back(seg(t, n0, n0 + .45)); ctx.save(); ctx.translate(560, 680); ctx.rotate(-.02); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.fillRect(-380 + 14, -150 + 14, 760, 300); ctx.fillStyle = '#fff'; ctx.fillRect(-380, -150, 760, 300); ctx.strokeStyle = C.k; ctx.lineWidth = 5; ctx.strokeRect(-380, -150, 760, 300);
      txt('THE NEWSLETTER', 0, -70, F.a(66), C.k, 'center'); txt('every resource · every link', 0, -10, F.h(48), C.or, 'center'); ctx.restore(); }
    stamp('FREE', 820, 790, -.08, C.green, t, T.cost + .8, 70); stamp('LINK IN BIO / COMMENTS', 560, 900, .03, C.red, t, T.link, 44);
    const c0 = T.credit; bigText('THE GITHUB REPORT', 1080, 640, 96, C.k, t, c0, 'left');
    hw('brought to you by the automator, novelist', 1086, 710, 42, C.k, t, c0 + 1.8, c0 + 3.4); hw('& multimedia producer', 1086, 760, 42, C.k, t, c0 + 3.6, c0 + 4.6); bigText('RELENTLESS AARON', 1086, 860, 76, C.or, t, c0 + 5.2, 'left');
  },
];

// ---------- camera, board, overlays ----------
function region(t) { let i = 0; while (i + 1 < REG.length && t >= REG[i + 1]) i++; return i; }
function cam(t) {
  const i = region(t), k = i ? eio(seg(t, REG[i], REG[i] + .7)) : 1, x0 = RX(Math.max(0, i - 1)), x1 = RX(i);
  let x = lerp(x0, x1, k), z = 1 - .08 * Math.sin(Math.PI * k) + .03 * seg(t, REG[i], (REG[i + 1] || DUR));
  return [x, z];
}
const PAPER = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#efe6d4'; g.fillRect(0, 0, 512, 512); const id = g.getImageData(0, 0, 512, 512), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (hash(i * .31) - .5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n * .8; } g.putImageData(id, 0, 0); g.fillStyle = 'rgba(120,95,60,.10)'; for (let y = 0; y < 512; y += 8) for (let x = (y / 8 % 2) * 4; x < 512; x += 8) { g.beginPath(); g.arc(x, y, 1.3, 0, 7); g.fill(); } return ctx.createPattern(c, 'repeat'); })();
function boardBg(x, z) {
  ctx.fillStyle = PAPER; ctx.fillRect(-W, -H, W * 30, H * 3); return;
  ctx.globalAlpha = .03; for (let i = 0; i < 50; i++) { const gx = hash(i) * 21000 - 500, gy = hash(i * 3.3) * 1000; ink(ctx, hash(i * 5) < .5 ? circ(gx, gy, 60, 40) : [[gx, gy], [gx + 160, gy + 10]], { seed: i, w: 6, col: '#7f8796', alpha: .07 }); } ctx.globalAlpha = 1;
}
function overlays(t) {
  // sheen
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,40,20,.22)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  // bug: show + counters
  ctx.fillStyle = C.k; ctx.fillRect(1480, 36, 410, 64); ctx.fillStyle = C.yel; ctx.fillRect(1480, 36, 14, 64); txt('THE GITHUB REPORT · EP 05', 1510, 80, F.a(34), '#fff');
  const tools = Math.round(101 + 7 * seg(t, T.seven + .3, T.seven + 2.2)); if (t > T.gm - .3) { ctx.fillStyle = '#fff'; ctx.fillRect(1480, 100, 400, 46); ctx.strokeStyle = '#23262c'; ctx.lineWidth = 2; ctx.strokeRect(1480, 100, 400, 46); txt(`${tools} TOOLS  ·  $0 SPENT`, 1506, 133, F.m(26), '#23262c'); }
  // section strap
  const i = region(t), s = SECT[i]; if (s) { const k = eo(seg(t, REG[i] + .4, REG[i] + .9)); ctx.save(); ctx.translate(-900 * (1 - k), 0); const w = tw(s[1], F.a(64)) + 70;
    ctx.fillStyle = C.k; ctx.fillRect(0, 30, 110 + w + 12, 100); ctx.fillStyle = C.yel; ctx.fillRect(30, 40, 90, 80); txt(s[0], 75, 103, F.a(66), C.k, 'center'); txt(s[1], 145, 106, F.a(64), '#fff'); ctx.restore(); }
  // captions
  captions(t);
  // intro and outro cards
  if (t < T.gm + .3) { const k = 1 - ss(seg(t, T.gm - .5, T.gm + .3)); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#23262c'; ctx.fillRect(0, 0, W, H);
    const a = eo(seg(t, .6, 1.6)); txt('THE GITHUB REPORT', W / 2, H / 2 + 20 - (1 - a) * 40, F.a(170), '#fff', 'center'); ctx.globalAlpha = k * eo(seg(t, 1.8, 2.6)); txt('EPISODE 05  ·  ONE MACHINE, MANY VOICES', W / 2, H / 2 + 110, F.m(30), C.yel, 'center');
    ctx.fillStyle = C.yel; ctx.fillRect(W / 2 - 400 * eio(seg(t, 1.2, 2.2)), H / 2 + 50, 800 * eio(seg(t, 1.2, 2.2)), 8); ctx.restore(); }
  if (t > END + .6) { const k = ss(seg(t, END + .6, END + 1.6)); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#23262c'; ctx.fillRect(0, 0, W, H); txt('THE GITHUB REPORT', W / 2, H / 2 - 30, F.a(140), '#fff', 'center'); txt('NEW EPISODE EVERY MORNING  ·  SUBSCRIBE', W / 2, H / 2 + 60, F.m(34), C.yel, 'center'); txt('Relentless Aaron', W / 2, H / 2 + 150, F.h(70), C.or, 'center'); ctx.restore(); }
}
// captions: corrected names, short groups
const CAP = (() => { const out = []; let g = [];
  const fixW = w => { let s = w.w; for (const [re, r] of FIX) if (re.test(s.replace(/[.,!?]$/, ''))) { s = r + (/[.,!?]$/.test(s) && r ? s.slice(-1) : ''); break; } return s; };
  let ws = []; for (const w of WD) { if (ws.length && /^[-.]/.test(w.w)) { ws[ws.length - 1].w += w.w; ws[ws.length - 1].e = w.e; } else ws.push({ ...w }); }
  for (let i = 0; i < ws.length - 1; i++) for (const [p, q, r] of PAIRS) if (norm(ws[i].w) === p && norm(ws[i + 1].w) === q) { ws[i].w = r + (/[.,!?]$/.test(ws[i + 1].w) ? ws[i + 1].w.slice(-1) : ''); ws[i].e = ws[i + 1].e; ws[i + 1].w = ''; }
  ws = ws.filter(w => w.w).map(w => ({ ...w, w: fixW(w) }));
  ws = ws.filter((w, i) => !i || norm(w.w) !== norm(ws[i - 1].w) || w.s - ws[i - 1].e > .4);   // drop a transcriber's doubled word
  for (let i = 0; i < ws.length; i++) { const w = ws[i]; if (g.length && (g.length >= 7 || /[.,!?]$/.test(g[g.length - 1].w) || w.s - g[g.length - 1].e > .5)) { out.push(g); g = []; } g.push(w); }
  if (g.length) out.push(g); return out.map(c => ({ t0: c[0].s - .05, t1: c[c.length - 1].e + .25, words: c })); })();
function captions(t) {
  const c = CAP.find(c => t >= c.t0 && t < c.t1); if (!c || t > END || t < T.gm) return;
  const f = F.b8(50), words = c.words.map(w => w.w.toUpperCase()), full = words.join(' '), fw = tw(full, f); ctx.save(); ctx.translate(W / 2, 1012); ctx.rotate(-.008); ctx.fillStyle = C.hi; ctx.fillRect(-fw / 2 - 26, -42, fw + 52, 74); ctx.restore();
  let x = W / 2 - fw / 2; c.words.forEach((w, j) => { const ww = tw(words[j], f); txt(words[j], x, 1030, f, t >= w.s && t < w.e + .1 ? C.red : C.k); x += ww + tw(' ', f); });
}
async function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const [x, z] = cam(t); ctx.setTransform(z, 0, 0, z, W / 2 - (x + W / 2) * z, H / 2 - H / 2 * z); boardBg();
  const i = region(t); for (let r = Math.max(0, i - 1); r <= i; r++) { if (t < REG[r]) continue; ctx.save(); ctx.translate(RX(r), 0); B[r](t); ctx.restore(); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); overlays(t);
}
window.EV = []; window.DUR = DUR; window.render = render; window.READY = true;
