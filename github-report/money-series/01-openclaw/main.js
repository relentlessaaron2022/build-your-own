// The GitHub Report, Money Series 01 (OpenClaw): bold Vox boards with the avatar host, 16:9.
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

// ---------- the voiceover (the avatar's narration, word-timed) ----------
const OFF = 1.0;                                                // one second on the host before she speaks
const WD = (await (await fetch('audio/words.json')).json()).words.map(w => ({ ...w, s: w.s + OFF, e: w.e + OFF }));
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function at(phrase, after = 0) { const q = phrase.split(' ').map(norm);
  for (let i = 0; i < WD.length; i++) { if (WD[i].s < after) continue; if (q.every((x, j) => WD[i + j] && norm(WD[i + j].w) === x)) return WD[i].s; } throw new Error('phrase not found: ' + phrase); }
const FIX = [], PAIRS = [];
const IMG = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
const [HOST, LOGO] = await Promise.all([IMG('assets/avatar-studio.jpg'), IMG('assets/ru-logo.jpg')]);
const T = {
  hi: at('Welcome to The'), num: at('Number one.'), one: at('One repo,'), line: at('and the one line'),
  repo: at("Today's repo is"), fast: at('It is the fastest'), march: at('By March,'), linux: at('and it climbed past'),
  what: at('So what is it?'), own: at('a personal AI assistant'), msg: at('It answers on'), email: at('It can read email,'), cal: at('keep a calendar,'), files: at('open files,'), browser: at('work a browser,'), cmds: at('and run commands.'), clock: at('And it does not clock'),
  money: at('Here is the money.'), leak: at('the same leak.'), after: at('Messages come in after'), barber: at('The barber is'), roof: at('The contractor is'), salon: at('The salon owner'), lost: at('Those messages turn'),
  answer: at('OpenClaw can answer them.'), book: at('It can book'), remind: at('send the reminder'), chase: at('and chase the invoice'), summary: at('Then it sends the owner'),
  free: at('The software is free.'), setup: at('Your setup is not.'), biz: at('That is the business.'), selling: at('You are selling'),
  price: at('Here is a starting price'), five: at('Five hundred dollars'), month: at('One hundred fifty a month'), clients: at('Five clients on'), promise: at('These are my numbers,'),
  cost: at('Now, what it costs you.'), computer: at('It needs a computer'), model: at('It needs an AI model'), pass: at('Pass that bill'), time: at('And it costs you time.'), weekend: at('Plan on a weekend'),
  lic: at('Now, the license line.'), mit: at('The project\'s page shows'), other: at('One tracking site'), read: at('so open the LICENSE'), skills: at('And every add-on skill'),
  sec: at('And one more line,'), warn: at('Security experts have warned'), reads: at('It can read email and run'), only: at('So give it only'), bank: at('Never hand it banking'), human: at('And keep a human'), rep: at('Your reputation is the product.'),
  client: at('Here is your first client.'), pick: at('Pick one business'), send: at('Send this:'), yes: at('One yes is a business.'),
  recap: at('That is Money Series'), news: at('And if you are really'), cost99: at('The cost?'), link: at('The link is in'), credit: at('This is The GitHub Report,'), ra: at('Relentless Aaron.'),
};
const END = WD[WD.length - 1].e, DUR = Math.ceil((END + 4.2) * 10) / 10;
const REG = [0, T.repo - .3, T.what - .3, T.money - .3, T.price - .3, T.cost - .3, T.lic - .3, T.sec - .3, T.client - .3, T.recap - .3];
const SECT = [null, ['★', 'THE REPO: OPENCLAW'], ['1', 'WHAT IT IS'], ['$', 'THE MONEY'], ['$', 'A STARTING PRICE'], ['2', 'WHAT IT COSTS YOU'], ['!', 'THE LICENSE LINE'], ['!', 'THE SAFETY LINE'], ['3', 'YOUR FIRST CLIENT'], null];
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
function box(x, y, w, h, s, fill, t, a, size = 46, col = C.k) { const k = back(seg(t, a, a + .4)); if (k <= 0) return; ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k);
  ctx.fillStyle = C.k; ctx.fillRect(-w / 2 + 10, -h / 2 + 10, w, h); ctx.fillStyle = fill; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = C.k; ctx.lineWidth = 5; ctx.strokeRect(-w / 2, -h / 2, w, h);
  const ls = s.split('\n'); ls.forEach((l, j) => txt(l, 0, size * .35 + (j - (ls.length - 1) / 2) * size * 1.1, F.a(size), col, 'center')); ctx.restore(); }
function note(x, y, rot, title, lines, t, a, cols = [], w = 400, tcol = C.red) { if (t < a) return; const k = back(seg(t, a, a + .4)), h = 90 + lines.length * 46;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.fillRect(-w / 2 + 10, -h / 2 + 10, w, h); ctx.fillStyle = '#ffe680'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = C.k; ctx.lineWidth = 4; ctx.strokeRect(-w / 2, -h / 2, w, h);
  txt(title, 0, -h / 2 + 56, F.a(40), tcol, 'center'); lines.forEach((l, j) => txt(l, 0, -h / 2 + 108 + j * 46, F.h(40), cols[j] || C.k, 'center')); ctx.restore(); }
function wave(x, y, w, h, col, t, a, ph = 0) { const k = seg(t, a, a + .5); if (k <= 0) return; const n = Math.floor(w / 16), on = speaking(t);
  ctx.fillStyle = col; for (let i = 0; i < n * eo(k); i++) { const v = on ? .25 + .75 * Math.abs(Math.sin(t * 9 + i * .7 + ph) * Math.sin(t * 4.3 + i * .31 + ph * 2)) : .12; ctx.fillRect(x + i * 16, y - h * v / 2, 10, h * v); } }
// a text-message bubble that types itself out
function sms(x, y, w, s, t, a, b, col = '#fff', tcol = C.k, size = 38) { if (t < a) return; const k = back(seg(t, a, a + .35)), lines = wrap(s, F.b6(size), w - 60), n = Math.floor(s.length * seg(t, a + .2, b)), h = lines.length * size * 1.3 + 50;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.beginPath(); ctx.roundRect(8, 8, w, h, 26); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 26); ctx.fill(); ctx.strokeStyle = C.k; ctx.lineWidth = 4; ctx.stroke();
  let left = n; lines.forEach((l, j) => { const shown = l.slice(0, Math.max(0, left)); left -= l.length + 1; txt(shown, 30, 50 + j * size * 1.3, F.b6(size), tcol); }); ctx.restore(); }
const B = [
  // 0 · the host opens (the studio, full frame)
  t => {},
  // 1 · the repo
  t => {
    card(120, 170, 980, 'openclaw', 'OpenClaw', ['A personal AI assistant you run on', 'your own machine.'], ['open source', 'self-hosted'], '250K+ stars', t, T.repo, C.or);
    stamp('FASTEST CLIMB ON GITHUB', 560, 650, -.03, C.red, t, T.fast + .4, 52);
    hw('by March: past 250,000 stars', 140, 800, 60, C.k, t, T.march, T.march + 1.6);
    stamp('PASSED LINUX · ALL-TIME BOARD', 1420, 260, .04, C.blue, t, T.linux + .4, 44);
    // a climbing line
    const g0 = T.march; mk([[1180, 620], [1300, 600], [1400, 560], [1490, 480], [1560, 380]], t, g0, g0 + 1.4, C.green, 10); arrow(1560, 380, 1600, 340, t, g0 + 1.3, g0 + 1.5, C.green);
  },
  // 2 · what it is
  t => {
    box(140, 200, 620, 160, 'YOUR OWN MACHINE', C.yel, t, T.own, 54);
    [['messaging apps', T.msg], ['email', T.email], ['calendar', T.cal], ['files', T.files], ['browser', T.browser], ['commands', T.cmds]].forEach(([s, a], i) => chip(s, 140 + (i % 3) * 330, 480 + Math.floor(i / 3) * 110, t, a, null, 300));
    bigText('24/7', 1250, 420, 220, C.red, t, T.clock + .3); hw('it does not clock out', 1260, 520, 60, C.k, t, T.clock + .8, T.clock + 2);
  },
  // 3 · the money
  t => {
    bigText('THE AFTER-HOURS LEAK', 120, 230, 96, C.k, t, T.leak);
    // unanswered messages piling up at night
    for (let i = 0; i < 4; i++) sms(1100 + (i % 2) * 40, 160 + i * 110, 520, ['Are you open Saturday?', 'Can I book for 3pm?', 'Need a quote for my roof', 'Do you have color today?'][i], t, T.after + i * .5, T.after + i * .5 + .9, '#fff', C.k, 34);
    if (t > T.after + 2.2) txt('9:47 PM · no reply', 1110, 640, F.m(30), C.red);
    [['the barber', T.barber], ['the contractor', T.roof], ['the salon', T.salon]].forEach(([s, a], i) => chip(s, 140 + i * 330, 380, t, a, null, 300));
    hw('...those turn into customers for somebody else', 140, 500, 52, C.red, t, T.lost, T.lost + 2.2);
    [['book the appointment', T.book], ['send the reminder', T.remind], ['chase the late invoice', T.chase], ['morning summary to the owner', T.summary]].forEach(([s, a], i) => { if (t < a) return; txt('✓', 150, 640 + i * 66, F.a(54), C.green); hw(s, 210, 640 + i * 66, 52, C.k, t, a, a + .9); });
    stamp('FREE SOFTWARE', 1250, 760, -.05, C.green, t, T.free, 50); stamp('PAID SETUP', 1250, 880, .04, C.red, t, T.setup, 60);
    if (t > T.selling) { const k = back(seg(t, T.selling, T.selling + .4)); ctx.save(); ctx.translate(960, 540); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.fillRect(-640, -110, 1280, 230); ctx.fillStyle = C.yel; ctx.fillRect(-650, -120, 1280, 230);
      txt('YOU ARE NOT SELLING CODE.', 0, -20, F.a(70), C.k, 'center'); txt('YOU ARE SELLING A WORKING ASSISTANT.', 0, 70, F.a(62), C.red, 'center'); ctx.restore(); }
  },
  // 4 · a starting price
  t => {
    box(140, 190, 560, 220, '$500\nSETUP', '#fff', t, T.five, 80, C.k); box(780, 190, 560, 220, '$150\nA MONTH', C.yel, t, T.month, 80, C.k);
    // five clients stack into $750 a month
    const c0 = T.clients; for (let i = 0; i < 5; i++) { const k = back(seg(t, c0 + .3 + i * .25, c0 + .6 + i * .25)); if (k <= 0) continue; ctx.save(); ctx.translate(200 + i * 150, 620); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.fillRect(-60 + 6, -90 + 6, 120, 180); ctx.fillStyle = ['#cfe4ff', '#ffd1dc', '#c8f0d0', '#ffe680', '#fde0c8'][i]; ctx.fillRect(-60, -90, 120, 180); ctx.strokeStyle = C.k; ctx.lineWidth = 4; ctx.strokeRect(-60, -90, 120, 180); txt('$150', 0, 10, F.a(40), C.k, 'center'); ctx.restore(); }
    if (t > c0 + 1.8) { txt('=', 960, 650, F.a(110), C.k, 'center'); } bigText('$750/mo', 1030, 670, 140, C.green, t, c0 + 2);
    hw('before you set up anybody new', 1040, 760, 46, C.k, t, c0 + 2.6, c0 + 3.6);
    note(560, 900, -.02, 'MY NUMBERS, NOT A PROMISE', ['your market sets the price'], t, T.promise, [C.k], 620, C.red);
  },
  // 5 · what it costs you
  t => {
    [['A COMPUTER\nTHAT STAYS ON', T.computer, '#fff'], ['THE AI\nMODEL BILL', T.model, C.yel], ['YOUR\nTIME', T.time, '#fff']].forEach(([s, a, f], i) => box(140 + i * 500, 200, 440, 230, s, f, t, a, 54));
    hw('a spare desktop or a small cloud server', 140, 520, 44, C.k, t, T.computer + 1.4, T.computer + 3);
    stamp('PASS IT TO THE CLIENT, LINE BY LINE', 800, 620, -.03, C.green, t, T.pass, 42);
    hw('first install: a weekend', 1100, 780, 52, C.k, t, T.weekend, T.weekend + 1); hw('every one after: a few hours', 1100, 850, 52, C.k, t, T.weekend + 1.4, T.weekend + 2.6);
  },
  // 6 · the license line
  t => {
    stamp('MIT ON THE PROJECT PAGE', 560, 280, -.04, C.green, t, T.mit + .6, 56);
    hw('one tracking site lists: "other"', 140, 440, 54, C.or, t, T.other, T.other + 1.4);
    box(140, 520, 900, 140, 'READ THE LICENSE FILE', C.red, t, T.read, 64, '#fff'); hw('before you take money', 1080, 610, 54, C.k, t, T.read + 1.2, T.read + 2.2);
    for (let i = 0; i < 4; i++) { const a = T.skills + .5 + i * .3; if (t < a) continue; box(1200 + (i % 2) * 300, 200 + Math.floor(i / 2) * 140, 260, 100, 'SKILL', '#fff', t, a, 40); if (t > a + .5) txt('LICENSE?', 1330 + (i % 2) * 300, 330 + Math.floor(i / 2) * 140, F.m(24), C.red, 'center'); }
    hw('every add-on skill has its own license', 140, 800, 52, C.k, t, T.skills, T.skills + 1.8);
  },
  // 7 · the safety line
  t => {
    bigText('THIS ONE CAN HURT SOMEBODY', 120, 230, 90, C.red, t, T.sec + 1);
    hw('it can read email and run commands', 140, 330, 54, C.k, t, T.reads, T.reads + 1.6);
    [['✓', 'only the accounts it needs', C.green, T.only], ['✗', 'never banking passwords', C.red, T.bank], ['✓', 'a human approves anything that moves money', C.green, T.human]].forEach(([m, s, c, a], i) => { if (t < a) return; const k = back(seg(t, a, a + .35)); ctx.save(); ctx.translate(140, 450 + i * 120); ctx.scale(k, k); ctx.fillStyle = c; ctx.fillRect(0, -60, 90, 90); txt(m, 45, 10, F.a(64), '#fff', 'center'); ctx.restore(); hw(s, 260, 450 + i * 120, 58, C.k, t, a, a + 1.2); });
    stamp('YOUR REPUTATION IS THE PRODUCT', 760, 890, -.03, C.k, t, T.rep, 50);
  },
  // 8 · your first client
  t => {
    [['your barber', 0], ['your mechanic', .5], ['the salon', 1]].forEach(([s, d], i) => chip(s, 140 + i * 320, 220, t, T.pick + 1 + d, null, 290));
    // the phone with the pitch
    const p0 = T.send; if (t > p0 - .3) { const k = back(seg(t, p0 - .3, p0 + .2)); ctx.save(); ctx.translate(1000, 120); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.beginPath(); ctx.roundRect(14, 14, 560, 560, 50); ctx.fill(); ctx.fillStyle = '#23262c'; ctx.beginPath(); ctx.roundRect(0, 0, 560, 560, 50); ctx.fill(); ctx.fillStyle = '#efe6d4'; ctx.fillRect(24, 60, 512, 470); ctx.restore(); }
    sms(1035, 200, 490, 'I set up AI assistants that answer your customers after hours and book them on your calendar. Let me run one for your shop free for two weeks. If it books you one extra customer, we talk price.', t, p0 + .2, T.yes - .6, C.blue, '#fff', 30);
    bigText('ONE YES IS A BUSINESS', 120, 520, 92, C.k, t, T.yes);
    hw('two weeks of proof = a pitch you never write again', 140, 640, 50, C.green, t, T.yes + 1.3, T.yes + 3.4);
  },
  // 9 · recap, newsletter and sign-off
  t => { const r0 = T.recap;
    [['$0', 'software', C.green, 1.2], ['PAID', 'setup', C.red, 2.6], ['1', 'line you do not cross', C.blue, 3.8]].forEach(([n, l, col, d], i) => { const x = 180 + i * 520; bigText(n, x, 330, 170, col, t, r0 + d, 'left'); hw(l, x, 410, 50, C.k, t, r0 + d + .3, r0 + d + 1.2); });
    const n0 = T.news; if (t > n0) { const k = back(seg(t, n0, n0 + .45)); ctx.save(); ctx.translate(560, 680); ctx.rotate(-.02); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.fillRect(-380 + 14, -150 + 14, 760, 300); ctx.fillStyle = '#fff'; ctx.fillRect(-380, -150, 760, 300); ctx.strokeStyle = C.k; ctx.lineWidth = 5; ctx.strokeRect(-380, -150, 760, 300);
      txt('THE NEWSLETTER', 0, -70, F.a(66), C.k, 'center'); txt('every resource · every link', 0, -10, F.h(48), C.or, 'center'); ctx.restore(); }
    stamp('FREE', 820, 790, -.08, C.green, t, T.cost99 + .6, 70); stamp('LINK IN BIO / COMMENTS', 560, 900, .03, C.red, t, T.link, 44);
    if (t > T.credit) { const k = back(seg(t, T.credit, T.credit + .5)); ctx.save(); ctx.translate(1290, 560); ctx.scale(k, k); ctx.beginPath(); ctx.arc(0, 0, 160, 0, 7); ctx.clip(); ctx.drawImage(LOGO, 660 - 255, 310 - 255, 510, 510, -160, -160, 320, 320); ctx.restore(); }
    bigText('RELENTLESS AARON', 1100, 860, 64, C.or, t, T.ra, 'left');
  },
];

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
function hostFull(t, k = 1) { const s = Math.max(W / HOST.width, H / HOST.height) * (1.04 + .05 * seg(t, 0, T.repo)), w = HOST.width * s, h = HOST.height * s;
  ctx.save(); ctx.globalAlpha = k; ctx.drawImage(HOST, (W - w) / 2 + 60 * seg(t, 0, T.repo), (H - h) / 2, w, h); const g = ctx.createLinearGradient(0, H * .45, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.75)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
// the host cam: her face in a ring, bottom right, a waveform while she speaks
function hostCam(t, k) { if (k <= 0) return; const cx = 1745, cy = 800, r = 120; ctx.save(); ctx.globalAlpha = k; ctx.translate(cx, cy); ctx.scale(lerp(.6, 1, eo(k)), lerp(.6, 1, eo(k)));
  ctx.fillStyle = C.k; ctx.beginPath(); ctx.arc(8, 10, r + 8, 0, 7); ctx.fill(); ctx.fillStyle = C.yel; ctx.beginPath(); ctx.arc(0, 0, r + 8, 0, 7); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip(); const z = 1 + (speaking(t) ? .012 * Math.sin(t * 13) : 0); ctx.drawImage(HOST, 455 - 130 * z, 300 - 130 * z, 260 * z, 260 * z, -r, -r, r * 2, r * 2); ctx.restore();
  ctx.fillStyle = C.k; ctx.fillRect(-r - 10, r - 4, 2 * r + 20, 44); txt('YOUR HOST · RELENTLESS U', 0, r + 28, F.a(24), C.yel, 'center'); ctx.restore();
  ctx.save(); ctx.globalAlpha = k; const on = speaking(t); ctx.fillStyle = C.red; for (let i = 0; i < 9; i++) { const v = on ? .3 + .7 * Math.abs(Math.sin(t * 11 + i * .9)) : .15; ctx.fillRect(cx - 180 - 14 * i, cy + 60 - 50 * v / 2, 8, 50 * v); } ctx.restore(); }
function overlays(t) {
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,40,20,.22)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  // bug (not over the studio opener)
  if (region(t) > 0) {
  ctx.fillStyle = C.k; ctx.fillRect(1420, 36, 470, 64); ctx.fillStyle = C.yel; ctx.fillRect(1420, 36, 14, 64); txt('THE GITHUB REPORT · MONEY #01', 1450, 80, F.a(34), '#fff');
  ctx.fillStyle = '#fff'; ctx.fillRect(1420, 100, 460, 46); ctx.strokeStyle = '#23262c'; ctx.lineWidth = 2; ctx.strokeRect(1420, 100, 460, 46); txt('$0 SOFTWARE  ·  PAID SETUP', 1446, 133, F.m(26), '#23262c'); }
  const i = region(t), s = SECT[i]; if (s) { const k = eo(seg(t, REG[i] + .4, REG[i] + .9)); ctx.save(); ctx.translate(-900 * (1 - k), 0); const w = tw(s[1], F.a(64)) + 70;
    ctx.fillStyle = C.k; ctx.fillRect(0, 30, 110 + w + 12, 100); ctx.fillStyle = C.yel; ctx.fillRect(30, 40, 90, 80); txt(s[0], 75, 103, F.a(66), C.k, 'center'); txt(s[1], 145, 106, F.a(64), '#fff'); ctx.restore(); }
  hostCam(t, i === 0 ? 0 : (i === 9 && t > T.credit ? 1 - seg(t, T.credit, T.credit + .5) : seg(t, REG[1], REG[1] + .6)));
  captions(t);
  if (t > END + .6) { const k = ss(seg(t, END + .6, END + 1.6)); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#23262c'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.beginPath(); ctx.arc(W / 2, 330, 170, 0, 7); ctx.clip(); ctx.drawImage(LOGO, 660 - 255, 310 - 255, 510, 510, W / 2 - 170, 160, 340, 340); ctx.restore();
    txt('THE GITHUB REPORT · MONEY SERIES', W / 2, 640, F.a(100), '#fff', 'center'); txt('NEXT: MONEY #02  ·  SUBSCRIBE', W / 2, 720, F.m(34), C.yel, 'center'); txt('Relentless Aaron', W / 2, 820, F.h(70), C.or, 'center'); ctx.restore(); }
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
  stamp('MONEY SERIES #1', 330, 810, -.04, C.yel, t, T.num, 60); stamp('ONE REPO · ONE WAY IT PAYS', 450, 930, .02, C.red, t, T.one + .3, 44);
  if (t > T.line) stamp('ONE LINE YOU CANNOT CROSS', 1400, 930, -.03, C.k, t, T.line + .4, 44);
  ctx.restore(); }
async function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const [x, z] = cam(t); ctx.setTransform(z, 0, 0, z, W / 2 - (x + W / 2) * z, H / 2 - H / 2 * z); ctx.fillStyle = PAPER; ctx.fillRect(-W, -H, W * 30, H * 3);
  const i = region(t); for (let r = Math.max(1, i - 1); r <= i; r++) { if (t < REG[r]) continue; ctx.save(); ctx.translate(RX(r), 0); B[r](t); ctx.restore(); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); if (i === 0 || t < T.repo + .2) opener(t); overlays(t);
}
window.EV = []; window.DUR = DUR; window.render = render; window.READY = true;
