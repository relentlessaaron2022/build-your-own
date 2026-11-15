// The GitHub Report, Ep. 06: bold Vox infographic board (16:9).
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
const OFF = 0;                                                  // a title sting before the first word
const WD = (await (await fetch('audio/ep06-words.json')).json()).words.map(w => ({ ...w, s: w.s + OFF, e: w.e + OFF }));
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function at(phrase, after = 0) { const q = phrase.split(' ').map(norm);
  for (let i = 0; i < WD.length; i++) { if (WD[i].s < after) continue; if (q.every((x, j) => WD[i + j] && norm(WD[i + j].w) === x)) return WD[i].s; } throw new Error('phrase not found: ' + phrase); }
const FIX = [], PAIRS = [];
const T = {
  gm: at('Good morning'), seven: at('seven tools passed'), total: at('The running total'), zero: at('and the bill'), nothing: at('Nothing has been'), talks: at('Today, the hunt found'),
  lp: at('The strongest find'), light: at('It is a lightweight'), puts: at('It puts an animated'), lips: at('Lip sync runs'), mic: at('from your microphone'), file: at('an audio file'), video: at('or a video track'), face: at('and webcam face'), stars: at('It carries'), pushed: at('It was pushed today'), apache: at('It is licensed Apache'),
  why: at("Here's why"), show: at('Your show needs'), browser: at('And this one runs'), nogpu: at('No heavy GPU'), nodl: at('no model download'), nometer: at('no per-minute meter'), runs: at('It runs on your Intel'), webgl: at('WebGL2,'), big: at('The two big talking'), needsb: at('This one needs a browser'), honest: at('One honest note.'), personal: at('The characters it ships'), own: at('Your own characters'), install: at('Installing it takes'), already: at('A character that talks back on'),
  agents: at('Agents. Superpowers'), sp: at('Superpowers is an'), spstars: at('317,000 stars.'), method: at('Its agents get'),
  web: at('Web design. Impeccable'), imp: at('Impeccable is a'), cmds: at('Commands like'), second: at('Web design, second pick'), taste: at('Taste Skill gives'), art: at('Art direction,'), designed: at('Your client sites'),
  seo: at('SEO. Claude SEO'), sub: at('26 subskills'), desk: at('Your SEO desk'),
  sec: at('Security. SkillSpector'), skp: at('It finds vulnerabilities'), first: at('If you install a lot'),
  game: at('Game dev. Worm'), wr: at('Worm Rider is a one-scene'), mesh: at('Every mesh and texture'), weak: at("I'm flagging it"), study: at('Study the build'),
  caution: at('The caution this morning'), thin: at('Worm Rider has 32'), sketch: at('It is a sketch'), sad: at('The same rule cut'), lastpush: at('but its last push'), nolic: at('GitHub shows no license'), notfree: at('A repo with no license'), dead: at('and a dead repo'), museum: at('It is a museum piece'),
  recap: at('That is the morning'), news: at("And if you're really"), cost: at('The cost?'), link: at('The link is in'), credit: at('This is The GitHub Report, brought'),
};
T.thirteen = T.seven; T.tools78 = T.total + .8;
const END = WD[WD.length - 1].e, DUR = 286.5;
const REG = [0, T.lp - .4, T.why - .4, T.agents - .4, T.web - .4, T.seo - .4, T.sec - .4, T.game - .4, T.caution - .4, T.recap - .4];
const SECT = [null, ['★', 'HEADLINE: LIVE LIVE PLAYER'], ['$', 'WHY IT FITS YOUR BUSINESS'], ['1', 'AGENTS'], ['2', 'WEB DESIGN'], ['3', 'SEO'], ['4', 'SECURITY'], ['5', 'GAME DEV'], ['!', 'ONE CAUTION: THIN HISTORY'], null];
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
const B = [
  // 0 · cold open
  t => {
    bigText('A CHARACTER THAT TALKS BACK', 120, 230, 100, C.k, t, T.gm + .3); hw('The GitHub Report · Sunday, November 15', 128, 305, 50, C.or, t, T.gm + .9, T.gm + 2.4); mk([[120, 345], [1500, 351]], t, T.gm + 1.5, T.gm + 2.5, C.or, 8);
    for (let i = 0; i < 115; i++) { const isNew = i >= 108, k = isNew ? seg(t, T.seven + .3 + (i - 108) * .25, T.seven + .6 + (i - 108) * .25) : seg(t, T.gm + .5, T.gm + 2.5); if (k <= 0) continue;
      const x = 120 + (i % 23) * 47 + (hash(i) - .5) * 8, y = 420 + Math.floor(i / 23) * 36 - (isNew ? (1 - eo(k)) * 60 : 0); ctx.save(); ctx.globalAlpha = clamp(k * 2); ctx.translate(x, y); ctx.rotate((hash(i * 3) - .5) * .15);
      ctx.fillStyle = isNew ? C.or : ['#ffe680', '#ffd1dc', '#c8f0d0', '#cfe4ff'][i % 4]; ctx.fillRect(0, 0, 40, 24); ctx.restore(); }
    hw('+7 vetted this morning', 120, 680, 56, C.or, t, T.seven + .2, T.seven + 1.4); bigText('115', 640, 700, 120, C.blue, t, T.total + .8); hw('vetted tools', 840, 690, 52, C.blue, t, T.total + 1.1, T.total + 1.9);
    stamp('$0', 1500, 520, -.08, C.green, t, T.zero + .6, 120); stamp('0 INSTALLS WITHOUT YOUR WORD', 1500, 700, .04, C.red, t, T.nothing + .4, 40);
    face(1650, 900, 90, t, T.talks + .5, C.yel); hw('...right in your browser', 120, 900, 60, C.green, t, T.talks + 1, T.talks + 2.8);
  },
  // 1 · Live Live Player
  t => {
    card(120, 170, 900, null, 'Live Live Player', ['A lightweight 2.5D character player for the web:', 'a page, a stream overlay, or an app.'], ['Apache 2.0', 'WebGL2'], '3 open issues', t, T.lp, C.or);
    // browser window with the talking character
    const b0 = T.puts; wsh(rectP(1140, 200, 1800, 640), '#ffffff', t, b0, b0 + .4, .9); mk(rectP(1140, 200, 1800, 640), t, b0, b0 + .5, C.k, 6); if (t > b0 + .3) { ctx.fillStyle = C.k; ctx.fillRect(1140, 200, 660 * eo(seg(t, b0 + .3, b0 + .6)), 46); for (let i = 0; i < 3; i++) { ctx.fillStyle = [C.red, C.yel, C.green][i]; ctx.beginPath(); ctx.arc(1170 + i * 30, 223, 9, 0, 7); ctx.fill(); } }
    face(1470, 440, 130, t, b0 + .5, '#f4c9a0');
    hw('lip sync from:', 140, 650, 56, C.k, t, T.lips, T.lips + .8);
    [['microphone', T.mic], ['audio file', T.file], ['video track', T.video]].forEach(([s, a], i) => chip(s, 140 + i * 300, 740, t, a, null, 270));
    stamp('WEBCAM FACE TRACKING · MEDIAPIPE', 640, 900, -.03, C.blue, t, T.face + .5, 44);
    hw('pushed today · only 3 open issues', 1150, 760, 50, C.green, t, T.pushed, T.pushed + 1.8);
  },
  // 2 · why it fits your business
  t => {
    hw('your show needs lip sync in-house', 140, 200, 60, C.k, t, T.show, T.show + 1.6); hw('...and this one runs in the browser', 140, 270, 50, C.green, t, T.browser, T.browser + 1.5);
    [['NO HEAVY GPU', T.nogpu], ['NO MODEL DOWNLOAD', T.nodl], ['NO PER-MINUTE METER', T.nometer]].forEach(([s, a], i) => stamp(s, 360 + i * 560, 400, -.04 + i * .04, C.red, t, a, 46));
    // what each needs
    const base = 830, sc = 6.2; mk([[120, base], [1150, base + 3]], t, T.big - .3, T.big + .1, C.k, 6);
    [['BIG MODEL A', 48, C.red, T.big + .8], ['BIG MODEL B', 12, C.or, T.big + 2.2], ['LIVE LIVE PLAYER', 0, C.green, T.needsb]].forEach(([lab, gb, col, a], i) => { if (t < a) return; const x = 170 + i * 330, h = Math.max(gb, 1.5) * sc * eo(seg(t, a, a + .8));
      wsh(rectP(x, base - h, x + 220, base), col, t, a, a + .3, .6); mk(rectP(x, base - Math.max(gb, 1.5) * sc, x + 220, base), t, a, a + .8, C.k, 5); txt(gb ? `${gb} GB` : 'A BROWSER', x + 110, base - Math.max(gb, 1.5) * sc - 18, F.a(46), col, 'center'); txt(lab, x + 110, base + 50, F.a(30), C.k, 'center'); });
    hw('runs on your Intel MacBook and the Dells (WebGL2)', 140, 960, 46, C.k, t, T.runs, T.runs + 2.4);
    const n0 = T.personal; if (t > n0) { const k = back(seg(t, n0, n0 + .4)); ctx.save(); ctx.translate(1560, 700); ctx.rotate(.05); ctx.scale(k, k); ctx.fillStyle = '#ffe680'; ctx.fillRect(-190, -150, 380, 330); ctx.strokeStyle = C.k; ctx.lineWidth = 4; ctx.strokeRect(-190, -150, 380, 330);
      txt('ONE HONEST NOTE', 0, -95, F.a(40), C.red, 'center'); ['the characters it ships:', 'personal use + credit,', 'not commercial.', 'client work = your', 'own characters'].forEach((l, j) => txt(l, 0, -40 + j * 44, F.h(38), j > 2 ? C.green : C.k, 'center')); ctx.restore(); }
    hw('install: build from the repo + one import (not on npm yet)', 1220, 1000, 34, C.k, t, T.install, T.install + 2.4);
  },
  // 3 · agents: Superpowers
  t => {
    card(120, 200, 1000, 'obra', 'Superpowers', ['An agentic skills framework and a software development', 'method that works across Claude Code and your chain.'], ['MIT', 'skills framework'], null, t, T.sp, C.blue);
    // shared method, not just shared tools: three agents, one playbook
    const m0 = T.method; for (let i = 0; i < 3; i++) face(1300 + i * 200, 360, 60, t, m0 + i * .2, ['#cfe4ff', '#ffd1dc', '#c8f0d0'][i]);
    wsh(rectP(1260, 520, 1840, 700), C.yel, t, m0 + .8, m0 + 1.2, .9); mk(rectP(1260, 520, 1840, 700), t, m0 + .8, m0 + 1.2, C.k, 6); if (t > m0 + 1.1) txt('ONE SHARED METHOD', 1550, 630, F.a(52), C.k, 'center');
    for (let i = 0; i < 3; i++) mk([[1300 + i * 200, 430], [1550, 515]], t, m0 + 1.2, m0 + 1.5, C.k, 5);
  },
  // 4 · web design: Impeccable and Taste Skill
  t => {
    card(100, 170, 860, 'pbakaus', 'Impeccable', ['A design vocabulary for your coding agent', 'that catches AI slop before a client sees it.'], ['Apache 2.0'], null, t, T.imp, C.or);
    ['polish', 'bolder', 'critique', 'audit'].forEach((s, i) => chip('/' + s, 110 + i * 215, 600, t, T.cmds + .5 + i * .35, null, 200));
    card(1040, 170, 800, 'Leonxlnx', 'Taste Skill', ['Gives your coding agents taste: art direction,', 'reference images, and a browser check.'], ['MIT'], null, t, T.taste, C.green);
    stamp('DESIGNED, NOT GENERATED', 1430, 640, -.04, C.green, t, T.designed + .3, 50);
  },
  // 5 · SEO
  t => {
    card(120, 200, 900, null, 'Claude SEO', ['A free SEO audit plugin for Claude Code.'], ['MIT', 'plugin'], null, t, T.seo + .5, C.blue);
    bigText('26', 1180, 380, 170, C.blue, t, T.sub); hw('subskills', 1400, 360, 56, C.k, t, T.sub + .3, T.sub + 1); bigText('19', 1180, 600, 170, C.or, t, T.sub + .9); hw('agents', 1400, 580, 56, C.k, t, T.sub + 1.1, T.sub + 1.8);
    ['technical SEO', 'schema', 'AI search'].forEach((s, i) => chip(s, 140 + i * 330, 640, t, T.sub + 2 + i * .4, null, 300));
    hw('your SEO desk gets a second pair of eyes', 140, 880, 54, C.k, t, T.desk, T.desk + 2);
  },
  // 6 · security: SkillSpector
  t => {
    card(120, 200, 900, 'NVIDIA', 'SkillSpector', ['A security scanner for AI agent skills.'], ['Apache 2.0', 'security'], null, t, T.sec + .6, C.k);
    // skills pass through the scanner: most get a check, one gets caught
    const s0 = T.skp; mk(rectP(1300, 300, 1500, 760), t, s0, s0 + .5, C.k, 7); if (t > s0 + .4) { ctx.fillStyle = 'rgba(31,95,209,.25)'; const sy = 300 + ((t - s0) * 260 % 460); ctx.fillRect(1300, sy, 200, 14); }
    for (let i = 0; i < 4; i++) { const a = s0 + .5 + i * .6, k = seg(t, a, a + .6); if (k <= 0) continue; const bad = i === 2, x = lerp(1100, 1650, eo(k)), y = 360 + i * 110; ctx.fillStyle = C.k; ctx.fillRect(x - 70 + 6, y - 32 + 6, 140, 64); ctx.fillStyle = '#fff'; ctx.fillRect(x - 70, y - 32, 140, 64); ctx.strokeStyle = C.k; ctx.lineWidth = 4; ctx.strokeRect(x - 70, y - 32, 140, 64); txt('SKILL', x, y + 12, F.a(32), C.k, 'center');
      if (k > .7) txt(bad ? '✗' : '✓', x + 100, y + 18, F.a(60), bad ? C.red : C.green, 'center'); }
    hw('finds vulnerabilities and malicious patterns before you install', 140, 900, 46, C.red, t, s0, s0 + 2.6);
  },
  // 7 · game dev: Worm Rider
  t => {
    card(120, 200, 900, null, 'Worm Rider', ['A one-scene three.js prototype: ride a giant', 'sandworm and eat the convoy.'], ['MIT', 'three.js'], '32 stars', t, T.wr, C.or);
    // the worm: segments made in code
    const w0 = T.wr + 1; for (let i = 0; i < 14; i++) { const k = seg(t, w0 + i * .08, w0 + .3 + i * .08); if (k <= 0) continue; const x = 1200 + i * 46, y = 520 + Math.sin(i * .6 + t * 3) * 50, r = 52 - i * 2.6; ctx.fillStyle = C.k; ctx.beginPath(); ctx.arc(x + 6, y + 6, r, 0, 7); ctx.fill(); ctx.fillStyle = i ? '#d6a35c' : '#b06a32'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.strokeStyle = C.k; ctx.lineWidth = 4; ctx.stroke(); }
    hw('every mesh and texture generated in code', 140, 700, 54, C.k, t, T.mesh, T.mesh + 1.8);
    stamp('WEAK SIGNAL', 1500, 800, -.06, C.red, t, T.weak + .4, 70); hw('study the build. do not lean on it.', 140, 840, 54, C.red, t, T.study, T.study + 1.6);
  },
  // 8 · caution: thin history
  t => {
    hw('Worm Rider', 140, 220, 66, C.k, t, T.thin, T.thin + .8); hw('32 stars · a single push day', 140, 290, 50, C.grey, t, T.thin + .6, T.thin + 1.8); stamp('A SKETCH, NOT A FOUNDATION', 420, 420, -.04, C.or, t, T.sketch + .2, 46);
    card(1000, 170, 820, null, 'SadTalker', ['The best-known talking photo model', 'for modest hardware.'], ['671 open issues'], 'last push: June 2024', t, T.sad + .5, C.grey);
    stamp('LICENSE: CHECK FIRST', 1250, 600, .04, C.red, t, T.nolic + .3, 46);
    hw('no license = not free to use', 1020, 730, 54, C.red, t, T.notfree, T.notfree + 1.4); hw('a dead repo is not a tool', 1020, 800, 54, C.k, t, T.dead, T.dead + 1.4);
    stamp('MUSEUM PIECE', 700, 760, -.06, C.k, t, T.museum, 80);
  },
  // 9 · recap, newsletter and sign-off
  t => { const r0 = T.recap;
    [['115', 'tools on the board', C.blue, .6], ['$0', 'spent', C.green, 1.8], ['0', 'installs without your word', C.or, 2.9]].forEach(([n, l, col, d], i) => { const x = 180 + i * 560; bigText(n, x, 330, 180, col, t, r0 + d, 'left'); hw(l, x, 410, 50, C.k, t, r0 + d + .3, r0 + d + 1.2); });
    // the newsletter
    const n0 = T.news; if (t > n0) { const k = back(seg(t, n0, n0 + .45)); ctx.save(); ctx.translate(560, 680); ctx.rotate(-.02); ctx.scale(k, k); ctx.fillStyle = C.k; ctx.fillRect(-380 + 14, -150 + 14, 760, 300); ctx.fillStyle = '#fff'; ctx.fillRect(-380, -150, 760, 300); ctx.strokeStyle = C.k; ctx.lineWidth = 5; ctx.strokeRect(-380, -150, 760, 300);
      txt('THE NEWSLETTER', 0, -70, F.a(66), C.k, 'center'); txt('every resource · every link', 0, -10, F.h(48), C.or, 'center'); ctx.restore(); }
    stamp('FREE', 820, 790, -.08, C.green, t, T.cost + .4, 70); stamp('LINK IN BIO / COMMENTS', 560, 900, .03, C.red, t, T.link, 44);
    const c0 = T.credit; bigText('THE GITHUB REPORT', 1080, 640, 96, C.k, t, c0, 'left');
    hw('brought to you by the automator, novelist', 1086, 710, 42, C.k, t, c0 + 1.5, c0 + 3); hw('& multimedia producer', 1086, 760, 42, C.k, t, c0 + 2.6, c0 + 3.6); bigText('RELENTLESS AARON', 1086, 860, 76, C.or, t, c0 + 3.9, 'left');
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
  ctx.fillStyle = C.k; ctx.fillRect(1480, 36, 410, 64); ctx.fillStyle = C.yel; ctx.fillRect(1480, 36, 14, 64); txt('THE GITHUB REPORT · EP 06', 1510, 80, F.a(34), '#fff');
  const tools = Math.round(108 + 7 * seg(t, T.seven + .3, T.seven + 2.2)); if (t > T.gm - .3) { ctx.fillStyle = '#fff'; ctx.fillRect(1480, 100, 400, 46); ctx.strokeStyle = '#23262c'; ctx.lineWidth = 2; ctx.strokeRect(1480, 100, 400, 46); txt(`${tools} TOOLS  ·  $0 SPENT`, 1506, 133, F.m(26), '#23262c'); }
  // section strap
  const i = region(t), s = SECT[i]; if (s) { const k = eo(seg(t, REG[i] + .4, REG[i] + .9)); ctx.save(); ctx.translate(-900 * (1 - k), 0); const w = tw(s[1], F.a(64)) + 70;
    ctx.fillStyle = C.k; ctx.fillRect(0, 30, 110 + w + 12, 100); ctx.fillStyle = C.yel; ctx.fillRect(30, 40, 90, 80); txt(s[0], 75, 103, F.a(66), C.k, 'center'); txt(s[1], 145, 106, F.a(64), '#fff'); ctx.restore(); }
  // captions
  captions(t);
  // intro and outro cards
  if (t < T.gm + .3) { const k = 1 - ss(seg(t, T.gm - .5, T.gm + .3)); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#23262c'; ctx.fillRect(0, 0, W, H);
    const a = eo(seg(t, .6, 1.6)); txt('THE GITHUB REPORT', W / 2, H / 2 + 20 - (1 - a) * 40, F.a(170), '#fff', 'center'); ctx.globalAlpha = k * eo(seg(t, 1.8, 2.6)); txt('EPISODE 06  ·  A CHARACTER THAT TALKS BACK', W / 2, H / 2 + 110, F.m(30), C.yel, 'center');
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

