// The GitHub Report, Ep. 01 — explainer board (16:9).
// One whiteboard, nine regions, the camera travels between them. Marker drawings with watercolor washes, GitHub-style repo cards
// pinned with magnets, hand-written labels, a news strap per section and burned captions. Every beat is anchored to a word in the voiceover.
import { ink, wash } from './sketch.js';
const W = 1920, H = 1080, cv = document.getElementById('out'), ctx = cv.getContext('2d');
const C = { k: '#23262c', blue: '#0969da', or: '#d97757', red: '#c8363a', green: '#2e8b57', yel: '#f2cf1d', grey: '#7f8796', card: '#ffffff', line: '#d0d7de' };
const F = { a: s => `400 ${s}px Anton`, b8: s => `800 ${s}px Barlow`, b6: s => `600 ${s}px Barlow`, m: s => `500 ${s}px Plex`, h: s => `600 ${s}px Caveat` };
await Promise.all([F.a(40), F.b8(40), F.b6(40), F.m(30), F.h(40)].map(f => document.fonts.load(f)));
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - x, 3), eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, ss = x => x * x * (3 - 2 * x), back = x => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- the voiceover (aligned to the manuscript, so every word is spelled right) ----------
const OFF = 2.2;                                                  // a title sting before the first word
const WD = (await (await fetch('audio/ep03-words.json')).json()).words.map(w => ({ ...w, s: w.s + OFF, e: w.e + OFF }));
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function at(phrase, after = 0) { const q = phrase.split(' ').map(norm);
  for (let i = 0; i < WD.length; i++) { if (WD[i].s < after) continue; if (q.every((x, j) => WD[i + j] && norm(WD[i + j].w) === x)) return WD[i].s; } throw new Error('phrase not found: ' + phrase); }
const FIX = [], PAIRS = [];
const T = {
  gm: at('Good morning'), seven: at('Seven new tools'), total: at('The running total'), zero: at('and the bill'), nothing: at('Nothing has been'), run: at('Today, the hunt found'),
  co: at('The strongest find'), eng: at('It is an inference'), c: at('written in pure C'), hot: at('It keeps the hot'), warm: at('the warm ones'), cold: at('and streams the cold'), plain: at('The point is plain'), stars: at('It carries'),
  why: at("Here's why"), mac: at('Your MacBook is a 2019'), dell: at('and your Dell carries'), heavy: at('Every heavy model'), built: at('Colibrì is built'), desk: at('It turns your own desk'), meter: at('No monthly meter'), install: at('Installing it takes'), dl: at('then a model download'), apache: at('It is licensed Apache'), dc: at('Your desk is the data center'),
  web: at('Web and commerce'), aw: at('Appwrite is the'), auth: at('Auth, databases'), mcp: at('with an MCP server so'), stand: at('That is the back end'),
  res: at('Research. Horizon'), src: at('You list the sources'), brief: at('a scored daily briefing'), crime: at('Your crime and legal'),
  sec: at('Agents and security'), aisoc: at('AiSOC is an'), fuse: at('It fuses alerts'), triage: at('triages them'), attck: at('investigates against the'), ledger: at('records every prompt'), nokeys: at('Zero API keys'), watches: at('It watches your agent'),
  lip: at('Lip sync, the lane'), it: at('InfiniteTalk turns'), lowv: at('It ships a low-VRAM'),
  game: at('Game dev.'), gs: at('Guizan GameSkill is'), days: at('It is three days'), ow: at('Open world.'), tides: at('Tides of Fortune is'), gen: at('Ships, islands'), study: at('It is a study piece'),
  caution: at('The caution this morning'), b14: at('It is built on a 14-billion-parameter'), gb12: at('Even the low-VRAM mode'), macI: at('Your MacBook is Intel'), dell2: at('and the Dell carries 2GB.'), real: at('The model is real'), watch: at('Watch it.'),
  recap: at('That is the morning'), tomorrow: at('Tomorrow the hunt'), rule: at('Same rule.'), credit: at('This is The GitHub Report, brought'),
};
T.thirteen = T.seven; T.tools78 = T.total + .8;
const END = WD[WD.length - 1].e, DUR = END + 3.6;
const REG = [0, T.co - .4, T.why - .4, T.web - .4, T.sec - .4, T.lip - .4, T.game - .4, T.caution - .4, T.recap - .4];
const SECT = [null, ['★', 'HEADLINE: COLIBRÌ'], ['$', 'WHY IT FITS YOUR BUSINESS'], ['1', 'WEB, COMMERCE & RESEARCH'], ['2', 'AGENTS AND SECURITY'], ['3', 'LIP SYNC'], ['4', 'GAME DEV & OPEN WORLD'], ['!', 'ONE CAUTION'], null];
const RX = i => i * 2200;

// ---------- drawing vocabulary ----------
let SEED = 1;
const sd = p => Math.round(p[0] * 7.13 + p[1] * 13.7) % 9973;     // seeds come from position, so strokes never re-randomise
const mk = (pts, lt, a, b, col = C.k, w = 6) => ink(ctx, pts, { seed: sd(pts[0]), w, col, wob: 1.3, over: 5, prog: eo(seg(lt, a, b)) });
const wsh = (poly, col, lt, a, b, al = .45) => { const k = seg(lt, a, b); if (k > 0) wash(ctx, poly, col, { alpha: al * ss(k), seed: sd(poly[0]), amp: 5 }); };
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
  const k = back(seg(lt, a, a + .35)); if (k <= 0) return; ctx.save(); ctx.globalAlpha = clamp(k * 1.5); ctx.translate(x, y); ctx.scale(k, k); txt(s, 0, 0, F.a(size), col, align); ctx.restore();
}
function magnet(x, y, col) { const g = ctx.createRadialGradient(x - 6, y - 6, 2, x, y, 20); g.addColorStop(0, '#fff'); g.addColorStop(.3, col); g.addColorStop(1, col); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(x + 4, y + 6, 19, 0, 7); ctx.fill(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 18, 0, 7); ctx.fill(); }
// a GitHub-style repository card, dropped onto the board with a magnet
function card(x, y, w, owner, name, lines, tags, star, lt, a, accent = C.or) {
  const k = seg(lt, a, a + .45); if (k <= 0) return; const drop = (1 - eo(k)) * -60, h = 120 + lines.length * 40 + (tags.length ? 64 : 0);
  ctx.save(); ctx.globalAlpha = clamp(k * 2); ctx.translate(0, drop);
  wsh(rectP(x - 22, y - 18, x + w + 26, y + h + 20), accent, lt, a + .1, a + .6, .3);
  ctx.shadowColor = 'rgba(30,35,40,.22)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; ctx.fillStyle = C.card; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = C.grey; ctx.lineWidth = 3; ctx.strokeRect(x + 28, y + 30, 26, 32); ctx.beginPath(); ctx.moveTo(x + 34, y + 30); ctx.lineTo(x + 34, y + 62); ctx.stroke();
  const o = owner ? owner + ' / ' : ''; txt(o, x + 70, y + 58, F.m(28), C.blue); txt(name, x + 70 + tw(o, F.m(28)), y + 58, `800 30px Barlow`, C.blue);
  if (star) { const sw = tw('★ ' + star, F.m(24)) + 28; ctx.fillStyle = '#f6f8fa'; ctx.beginPath(); ctx.roundRect(x + w - sw - 20, y + 30, sw, 38, 8); ctx.fill(); ctx.stroke(); txt('★ ' + star, x + w - sw - 6, y + 57, F.m(24), C.k); }
  lines.forEach((l, i) => txt(l, x + 30, y + 112 + i * 40, F.b6(30), '#1f2328'));
  let tx = x + 30; for (const tg of tags) { const pw = tw(tg, F.b6(24)) + 28; ctx.fillStyle = '#ddf4ff'; ctx.beginPath(); ctx.roundRect(tx, y + h - 58, pw, 38, 19); ctx.fill(); txt(tg, tx + 14, y + h - 31, F.b6(24), C.blue); tx += pw + 10; }
  magnet(x + w / 2, y - 4, accent); ctx.restore();
}
function bubble(x, y, w, s, lt, a, col = C.blue) {             // a speech bubble for the second voice
  const k = back(seg(lt, a, a + .4)); if (k <= 0) return; const lines = wrap(s, F.b8(46), w - 80), h = lines.length * 56 + 60;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-(x + w / 2), -(y + h / 2));
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, y, w, h, 30); ctx.moveTo(x + 80, y + h); ctx.lineTo(x + 60, y + h + 50); ctx.lineTo(x + 140, y + h); ctx.fill();
  lines.forEach((l, i) => txt(l, x + 40, y + 70 + i * 56, F.b8(46), '#fff')); ctx.restore();
}
function stamp(s, x, y, rot, col, lt, a, size = 64) { const k = seg(lt, a, a + .2); if (k <= 0) return; const sc = lerp(1.6, 1, eo(k));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = .9 * k; const w = tw(s, F.a(size)) + 50; ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.strokeRect(-w / 2, -size * .85, w, size * 1.25); txt(s, 0, size * .2, F.a(size), col, 'center'); ctx.restore(); }
const arrow = (x0, y0, x1, y1, lt, a, b, col = C.k) => { mk([[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 - 30], [x1, y1]].flatMap((p, i, A) => i ? [[lerp(A[i - 1][0], p[0], .5), lerp(A[i - 1][1], p[1], .5)], p] : [p]), lt, a, b, col, 6);
  const an = Math.atan2(y1 - y0, x1 - x0); mk([[x1 - Math.cos(an - .5) * 34, y1 - Math.sin(an - .5) * 34], [x1, y1], [x1 - Math.cos(an + .5) * 34, y1 - Math.sin(an + .5) * 34]], lt, b, b + .2, col, 6); };

// ---------- the nine boards ----------
const chip = (s, x, y, t, a, bg = '#ddf4ff', w = 260) => { const k = back(seg(t, a, a + .35)); if (k <= 0) return; ctx.save(); ctx.translate(x + w / 2, y); ctx.scale(k, k); ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(-w / 2, -40, w, 70, 35); ctx.fill(); txt(s, 0, 8, F.b8(32), C.k, 'center'); ctx.restore(); };
const B = [
  // 0 · cold open: 87 → 94, and today something you can run
  t => {
    bigText('YOUR DESK IS THE DATA CENTER', 120, 230, 100, C.k, t, 0.9); hw('The GitHub Report · Episode 03 · Saturday, November 14', 128, 305, 50, C.or, t, 1.6, 3.2); mk([[120, 345], [1500, 351]], t, 2.4, 3.4, C.or, 8);
    for (let i = 0; i < 94; i++) { const isNew = i >= 87, k = isNew ? seg(t, T.seven + .3 + (i - 87) * .25, T.seven + .6 + (i - 87) * .25) : seg(t, T.gm + .5, T.gm + 2.5); if (k <= 0) continue;
      const x = 120 + (i % 19) * 56 + (hash(i) - .5) * 8, y = 420 + Math.floor(i / 19) * 38 - (isNew ? (1 - eo(k)) * 60 : 0); ctx.save(); ctx.globalAlpha = clamp(k * 2); ctx.translate(x, y); ctx.rotate((hash(i * 3) - .5) * .15);
      ctx.fillStyle = isNew ? C.or : ['#ffe680', '#ffd1dc', '#c8f0d0', '#cfe4ff'][i % 4]; ctx.fillRect(0, 0, 48, 26); ctx.restore(); }
    hw('+7 vetted this morning', 120, 680, 56, C.or, t, T.seven + .2, T.seven + 1.4); bigText('94', 640, 700, 120, C.blue, t, T.total + .8); hw('vetted tools', 780, 690, 52, C.blue, t, T.total + 1.1, T.total + 1.9);
    stamp('$0', 1500, 520, -.08, C.green, t, T.zero + .6, 120); stamp('0 INSTALLS WITHOUT YOUR WORD', 1500, 700, .04, C.red, t, T.nothing + .4, 40);
    hw('today: something your machines can actually run', 120, 900, 60, C.green, t, T.run + .3, T.run + 2.3);
  },
  // 1 · Colibrì
  t => {
    card(120, 170, 900, 'JustVugg', 'colibri', ['An inference engine for frontier mixture-of-experts', 'models. Pure C, zero dependencies.'], ['pure C', 'MoE'], 'active · pushed today', t, T.co, C.or);
    hw('"Colibrì"', 140, 145, 50, C.or, t, T.co + .4, T.co + 1.2);
    // the memory ladder: GPU · RAM · disk
    [['HOT', 'GPU', C.red, T.hot], ['WARM', 'RAM', C.or, T.warm], ['COLD', 'DISK, STREAMED', C.blue, T.cold]].forEach(([lab, where, col, a], i) => { const x = 1160, y = 230 + i * 190; wsh(rectP(x, y, x + 600, y + 140), col, t, a, a + .5, .4); mk(rectP(x, y, x + 600, y + 140), t, a, a + .5, C.k, 6);
      if (t > a + .2) { txt(lab, x + 40, y + 92, F.a(64), col); txt(where, x + 300, y + 92, F.b8(46), C.k); } });
    hw('experts', 1180, 205, 46, C.k, t, T.hot, T.hot + .6);
    hw('frontier-class models, no big GPU in the loop', 140, 720, 54, C.k, t, T.plain + .8, T.plain + 3);
    hw('maintainers active right now', 140, 820, 50, C.green, t, T.stars + 2, T.stars + 3.5);
  },
  // 2 · why it fits: the hardware you already own
  t => {
    hw('your machines', 140, 220, 64, C.k, t, T.mac - .2, T.mac + .6);
    const m0 = T.mac; wsh(rectP(160, 270, 560, 520), '#dfe3ea', t, m0, m0 + .6, .6); mk(rectP(160, 270, 560, 520), t, m0, m0 + .6, C.k, 6); mk([[110, 555], [610, 559]], t, m0 + .4, m0 + .7, C.k, 8); if (t > m0 + .6) txt('MacBook · 2019 · Intel', 360, 410, F.b8(34), C.k, 'center');
    const d0 = T.dell; wsh(rectP(700, 290, 1050, 520), '#dfe3ea', t, d0, d0 + .6, .6); mk(rectP(700, 290, 1050, 520), t, d0, d0 + .6, C.k, 6); mk([[860, 520], [860, 580], [780, 585], [940, 585]], t, d0 + .4, d0 + .8, C.k, 7); if (t > d0 + .6) txt('Dell · 2 GB video', 875, 415, F.b8(34), C.k, 'center');
    stamp('NOT ON YOUR HARDWARE', 620, 700, -.04, C.grey, t, T.heavy + .8, 52);
    if (t > T.built) { mk([[300, 650], [960, 760]], t, T.built, T.built + .4, C.green, 10); }
    hw('Colibrì is built for the hardware you own', 140, 860, 58, C.green, t, T.built + .3, T.built + 2);
    ['NO MONTHLY METER', 'NO CLOUD BILL', 'NO KEYS TO RENT'].forEach((s, i) => stamp(s, 1480, 260 + i * 120, -.03 + i * .03, C.red, t, T.meter + i * .7, 40));
    hw('to install:', 1200, 680, 52, C.k, t, T.install, T.install + .8); hw('1. build from source, in C', 1220, 740, 46, C.k, t, T.install + .8, T.install + 2); hw('2. download a model', 1220, 795, 46, C.k, t, T.dl, T.dl + 1.2);
    const a0 = T.apache; if (t > a0) { const k = back(seg(t, a0, a0 + .4)); ctx.save(); ctx.translate(1660, 900); ctx.rotate(-.05); ctx.scale(k, k); ctx.fillStyle = '#c8f0d0'; ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 16; ctx.fillRect(-150, -110, 300, 220); ctx.shadowColor = 'transparent';
      txt('APACHE 2.0', 0, -50, F.a(52), C.k, 'center'); ['free to use,', 'even inside your', 'own products'].forEach((l, j) => txt(l, 0, 5 + j * 40, F.h(38), C.green, 'center')); ctx.restore(); }
    stamp('YOUR DESK IS THE DATA CENTER', 640, 990, -.04, C.or, t, T.dc, 50);
  },
  // 3 · web, commerce and research
  t => {
    card(100, 170, 860, 'appwrite', 'appwrite', ['The open-source back end for agents and', 'developers, all self-hosted.'], ['self-hosted', 'MCP server'], null, t, T.aw, C.red);
    ['Auth', 'Databases', 'Storage', 'Functions', 'Messaging', 'Hosting', 'Firewall'].forEach((s, i) => chip(s, 110 + (i % 4) * 215, 560 + Math.floor(i / 4) * 95, t, T.auth + i * .35, ['#fde8e1', '#ddf4ff', '#e3f5e5'][i % 3], 200));
    hw('the back end your store and sites stand on', 110, 800, 50, C.red, t, T.stand + .3, T.stand + 2.2);
    card(1040, 170, 800, 'Thysrael', 'Horizon', ['Your own AI news radar: a scored daily', 'briefing from the sources you read.'], ['MCP server', 'agent skill'], null, t, T.res, C.blue);
    ['RSS', 'Hacker News', 'Reddit', 'X', 'GitHub'].forEach((s, i) => chip(s, 1060 + (i % 3) * 260, 580 + Math.floor(i / 3) * 95, t, T.src + 1 + i * .4, '#ddf4ff', 240));
    stamp('SCORED DAILY BRIEFING', 1440, 820, -.04, C.blue, t, T.brief, 44);
    hw('your crime & legal commentary starts with the news', 1050, 950, 46, C.k, t, T.crime, T.crime + 2.2);
  },
  // 4 · agents and security
  t => {
    card(120, 170, 900, 'beenuar', 'AiSOC', ['An open-source AI security operations center.', 'Runs on a local language model.'], ['security', 'local LLM'], null, t, T.aisoc, C.k);
    [['ALERTS', T.fuse], ['LOCAL LLM TRIAGE', T.triage], ['MITRE ATT&CK', T.attck], ['REPLAYABLE LEDGER', T.ledger]].forEach(([s, a], i) => { const x = 140 + i * 440, y = 650; wsh(rectP(x, y, x + 360, y + 130), ['#fde8e1', '#ddf4ff', '#fff3c4', '#e3f5e5'][i], t, a, a + .5, .7); mk(rectP(x, y, x + 360, y + 130), t, a, a + .5, C.k, 6);
      if (t > a + .3) txt(s, x + 180, y + 82, F.a(38), C.k, 'center'); if (i) arrow(x - 70, y + 65, x - 10, y + 65, t, a, a + .3, C.or); });
    stamp('ZERO API KEYS', 1480, 360, -.06, C.green, t, T.nokeys, 70);
    hw('it watches your agent chain the way a SOC watches a network', 140, 900, 50, C.k, t, T.watches, T.watches + 2.5);
  },
  // 5 · lip sync: InfiniteTalk
  t => {
    hw('the lane you ordered', 120, 190, 60, C.or, t, T.lip + .3, T.lip + 1.4);
    card(120, 260, 900, 'MeiGen-AI', 'InfiniteTalk', ['One photo + an audio track → a talking', 'video of unlimited length.'], ['Apache 2.0', 'low-VRAM mode'], null, t, T.it, C.blue);
    const p0 = T.it + 1; wsh(rectP(1180, 260, 1400, 520), '#dfe3ea', t, p0, p0 + .5, .7); mk(rectP(1180, 260, 1400, 520), t, p0, p0 + .5, C.k, 5); mk(circ(1290, 360, 50, 56), t, p0 + .3, p0 + .7, C.k, 5); mk(circ(1290, 520, 100, 70, .5, Math.PI), t, p0 + .5, p0 + .9, C.k, 5);
    hw('+', 1440, 410, 80, C.k, t, p0 + .6, p0 + .9); if (t > p0 + .9) { ctx.strokeStyle = C.or; ctx.lineWidth = 5; ctx.beginPath(); for (let x = 0; x <= 260; x += 5) { const y = 390 + Math.sin(x * .2 + t * 8) * 34 * Math.sin(x / 260 * Math.PI); x ? ctx.lineTo(1500 + x, y) : ctx.moveTo(1500, y); } ctx.stroke(); }
    ['lips', 'head', 'body', 'expressions'].forEach((s, i) => chip(s, 1180 + (i % 2) * 300, 640 + Math.floor(i / 2) * 95, t, p0 + 2.5 + i * .3, '#ddf4ff', 260));
    hw('∞ unlimited length', 140, 760, 60, C.blue, t, p0 + 1.6, p0 + 2.6);
  },
  // 6 · game dev and open world
  t => {
    card(100, 170, 860, null, 'Guizan GameSkill', ['An agent skill for Claude Code and Codex:', 'a playable 3D browser action game.'], ['three.js', 'one HTML file'], '300+ in 3 days', t, T.gs, C.or);
    card(1040, 170, 800, 'silvestroz', 'Tides of Fortune', ['A browser pirate game in three.js', 'with zero asset files.'], ['one 2 MB HTML file'], null, t, T.tides, C.blue);
    ['ships', 'islands', 'towns', 'music'].forEach((s, i) => chip(s, 1060 + i * 195, 590, t, T.gen + i * .4, '#e3f5e5', 180));
    // a little ship on the waves
    const s0 = T.gen + 1; for (let k = 0; k < 3; k++) mk(Array.from({ length: 30 }, (_, j) => [1060 + j * 25, 840 + k * 26 + Math.sin(j * .6 + t * 3 + k) * 8]), t, s0 + k * .2, s0 + .6 + k * .2, C.blue, 5);
    wsh([[1300, 820], [1560, 820], [1520, 870], [1340, 870]], '#8a5a3a', t, s0 + .3, s0 + .8, .7); mk([[1300, 820], [1560, 820], [1520, 870], [1340, 870], [1300, 820]], t, s0 + .3, s0 + .8, C.k, 5); mk([[1430, 820], [1430, 640]], t, s0 + .6, s0 + .9, C.k, 6); wsh([[1440, 650], [1540, 720], [1440, 790]], '#ffffff', t, s0 + .8, s0 + 1.2, .9); mk([[1440, 650], [1540, 720], [1440, 790]], t, s0 + .8, s0 + 1.2, C.k, 5);
    hw('a study piece for the open world your game needs', 1050, 990, 46, C.blue, t, T.study, T.study + 2.2);
    for (let i = 0; i < 16; i++) { const k = seg(t, T.gs + 1.5 + i * .1, T.gs + 1.8 + i * .1); if (k > 0) { ctx.fillStyle = `rgba(217,119,87,${k})`; ctx.fillRect(140 + (i % 8) * 90, 640 + Math.floor(i / 8) * 90, 70, 70); } }
    hw('built from AI-generated assets', 140, 880, 50, C.or, t, T.gs + 2.5, T.gs + 3.8);
  },
  // 7 · one caution: InfiniteTalk's GPU bill
  t => {
    hw('InfiniteTalk: the sharpest lip sync in the batch', 120, 200, 56, C.k, t, T.caution + .3, T.caution + 2.2);
    hw('built on a 14-billion-parameter video model', 120, 280, 46, C.grey, t, T.b14, T.b14 + 2);
    const base = 860, sc = 30, bars = [['LOW-VRAM MODE NEEDS', 12, C.red, T.gb12], ['YOUR DELL', 2, C.k, T.dell2]];
    mk([[140, base], [1100, base + 3]], t, T.gb12 - .4, T.gb12, C.k, 6);
    bars.forEach(([lab, gb, col, a], i) => { const x = 260 + i * 440, h = gb * sc * eo(seg(t, a, a + .9)); if (t < a) return; wsh(rectP(x, base - h, x + 260, base), col, t, a, a + .3, .55); mk(rectP(x, base - gb * sc, x + 260, base), t, a, a + .9, C.k, 5);
      txt(`~${gb} GB`, x + 130, base - gb * sc - 20, F.a(52), col, 'center'); txt(lab, x + 130, base + 60, F.a(36), C.k, 'center'); });
    hw('MacBook: Intel', 1260, 620, 60, C.k, t, T.macI, T.macI + 1.2);
    hw("the model is real. the hardware isn't yours yet.", 140, 1000, 50, C.k, t, T.real, T.real + 2.2);
    stamp("WATCH IT. DON'T CHASE IT.", 1500, 860, -.06, C.red, t, T.watch, 54);
  },
  // 8 · recap and sign-off
  t => { const r0 = T.recap;
    [['94', 'tools on the board', C.blue, .6], ['$0', 'spent', C.green, 1.8], ['0', 'installs without your word', C.or, 2.9]].forEach(([n, l, col, d], i) => { const x = 180 + i * 560; bigText(n, x, 380, 200, col, t, r0 + d, 'left'); hw(l, x, 460, 50, C.k, t, r0 + d + .3, r0 + d + 1.2); });
    hw('Tomorrow the hunt runs again.', 180, 620, 76, C.or, t, T.tomorrow, T.tomorrow + 1.6); hw('Same rule: nothing moves without you.', 180, 710, 60, C.k, t, T.rule, T.rule + 1.8);
    const c0 = T.credit; bigText('THE GITHUB REPORT', 180, 880, 110, C.k, t, c0, 'left');
    hw('brought to you by the automator, novelist & multimedia producer', 186, 950, 46, C.k, t, c0 + 1.5, c0 + 3.4); bigText('RELENTLESS AARON', 186, 1040, 76, C.or, t, c0 + 3.9, 'left');
  },
];

// ---------- camera, board, overlays ----------
function region(t) { let i = 0; while (i + 1 < REG.length && t >= REG[i + 1]) i++; return i; }
function cam(t) {
  const i = region(t), k = i ? eio(seg(t, REG[i], REG[i] + .7)) : 1, x0 = RX(Math.max(0, i - 1)), x1 = RX(i);
  let x = lerp(x0, x1, k), z = 1 - .08 * Math.sin(Math.PI * k) + .03 * seg(t, REG[i], (REG[i + 1] || DUR));
  return [x, z];
}
function boardBg(x, z) {
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#fbfaf6'); g.addColorStop(1, '#f0eee8'); ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 30, H * 3);
  ctx.globalAlpha = .03; for (let i = 0; i < 50; i++) { const gx = hash(i) * 21000 - 500, gy = hash(i * 3.3) * 1000; ink(ctx, hash(i * 5) < .5 ? circ(gx, gy, 60, 40) : [[gx, gy], [gx + 160, gy + 10]], { seed: i, w: 6, col: '#7f8796', alpha: .07 }); } ctx.globalAlpha = 1;
}
function overlays(t) {
  // sheen
  ctx.save(); ctx.globalAlpha = .12; const sx = (-cam(t)[0] * .3) % 2600; const sg = ctx.createLinearGradient(sx, 0, sx + 700, 700); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, '#fff'); sg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); ctx.restore();
  // bug: show + counters
  ctx.fillStyle = '#23262c'; ctx.fillRect(1480, 36, 400, 64); ctx.fillStyle = C.yel; ctx.fillRect(1480, 36, 10, 64); txt('THE GITHUB REPORT · EP 03', 1506, 80, F.b8(28), '#fff');
  const tools = Math.round(87 + 7 * seg(t, T.seven + .3, T.seven + 2.2)); if (t > T.gm - .3) { ctx.fillStyle = '#fff'; ctx.fillRect(1480, 100, 400, 46); ctx.strokeStyle = '#23262c'; ctx.lineWidth = 2; ctx.strokeRect(1480, 100, 400, 46); txt(`${tools} TOOLS  ·  $0 SPENT`, 1506, 133, F.m(26), '#23262c'); }
  // section strap
  const i = region(t), s = SECT[i]; if (s) { const k = eo(seg(t, REG[i] + .4, REG[i] + .9)); ctx.save(); ctx.translate(-600 * (1 - k), 0); ctx.fillStyle = C.or; ctx.fillRect(40, 36, 80, 80); txt(s[0], 80, 96, F.a(60), '#fff', 'center'); ctx.fillStyle = '#23262c'; const w = tw(s[1], F.a(50)) + 50; ctx.fillRect(120, 36, w, 80); txt(s[1], 145, 96, F.a(50), '#fff'); ctx.restore(); }
  // captions
  captions(t);
  // intro and outro cards
  if (t < T.gm + .3) { const k = 1 - ss(seg(t, T.gm - .5, T.gm + .3)); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#23262c'; ctx.fillRect(0, 0, W, H);
    const a = eo(seg(t, .6, 1.6)); txt('THE GITHUB REPORT', W / 2, H / 2 + 20 - (1 - a) * 40, F.a(170), '#fff', 'center'); ctx.globalAlpha = k * eo(seg(t, 1.8, 2.6)); txt('EPISODE 03  ·  YOUR DESK IS THE DATA CENTER', W / 2, H / 2 + 110, F.m(30), C.yel, 'center');
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
  const f = F.b8(46), full = c.words.map(w => w.w).join(' '), fw = tw(full, f); ctx.fillStyle = 'rgba(35,38,44,.88)'; ctx.beginPath(); ctx.roundRect(W / 2 - fw / 2 - 30, 980, fw + 60, 70, 14); ctx.fill();
  let x = W / 2 - fw / 2; for (const w of c.words) { const ww = tw(w.w, f); txt(w.w, x, 1032, f, t >= w.s && t < w.e + .1 ? C.yel : '#fff'); x += ww + tw(' ', f); }
}
async function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const [x, z] = cam(t); ctx.setTransform(z, 0, 0, z, W / 2 - (x + W / 2) * z, H / 2 - H / 2 * z); boardBg();
  const i = region(t); for (let r = Math.max(0, i - 1); r <= i; r++) { if (t < REG[r]) continue; ctx.save(); ctx.translate(RX(r), 0); B[r](t); ctx.restore(); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); overlays(t);
}
window.EV = []; window.DUR = DUR; window.render = render; window.READY = true;
