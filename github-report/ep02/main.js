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
const WD = (await (await fetch('audio/ep02-words.json')).json()).words.map(w => ({ ...w, s: w.s + OFF, e: w.e + OFF }));
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function at(phrase, after = 0) { const q = phrase.split(' ').map(norm);
  for (let i = 0; i < WD.length; i++) { if (WD[i].s < after) continue; if (q.every((x, j) => WD[i + j] && norm(WD[i + j].w) === x)) return WD[i].s; } throw new Error('phrase not found: ' + phrase); }
const FIX = [], PAIRS = [];
const T = {
  gm: at('Good morning'), seven: at('Seven new tools'), total: at('The running total'), zero: at('the bill is still'), nothing: at('Nothing has been'), voice: at('Today the hunt came'),
  vs: at('The strongest find'), local: at('It is a fully local'), cloning: at('Voice cloning'), design: at('voice design'), dub: at('video dubbing'), dict: at('dictation'), trans: at('transcription'), book: at('and audiobook'), machine: at('all on your own machine'), langs: at('in 646'), stars: at('It carries'),
  why: at('Here is why'), clone: at('You already run'), house: at('VoiceStudio is the in-house'), stays: at('Your voice stays'), work: at('Your dubbing'), meter: at('without a monthly meter'), install: at('Installing it takes'), sample: at('a voice sample'), agpl: at('It is licensed'), terms: at('read the terms'), asset: at('Your voice is your asset'),
  film: at('Film and drama'), toon: at('Toonflow is'), story: at('script to storyboard'), spook: at('It speaks directly'),
  lip: at('Lip sync, the lane'), kand: at('Kandinsky S2V turns'), heygen: at("and the lab's"), koubo: at('Digital-human-koubo is'), lanshu: at('Lanshu is'),
  agents: at('Agents and control'), t3: at('T3 Code lets'), phone: at('or your phone'), web: at('Web design.'), hall: at('Hallmark is'), lane: at('Your forty thousand'),
  caution: at('The caution this morning'), needs: at('It needs a 48'), hd: at('80 for high'), mac: at('Your MacBook is'), dell: at('and the Dell'), real: at('The model is real'), watch: at('Watch it'),
  recap: at('That is the morning'), tomorrow: at('Tomorrow, the hunt'), rule: at('Same rule'), credit: at('This is The GitHub Report, brought'),
};
T.thirteen = T.seven; T.tools78 = T.total + .8;                    // the counter in the corner: 78 → 85
const END = WD[WD.length - 1].e, DUR = END + 3.6;
const REG = [0, T.vs - .4, T.why - .4, T.film - .4, T.lip - .4, T.agents - .4, T.caution - .4, T.recap - .4];
const SECT = [null, ['★', 'HEADLINE: VOICESTUDIO'], ['$', 'WHY IT FITS YOUR BUSINESS'], ['1', 'FILM AND DRAMA'], ['2', 'LIP SYNC'], ['3', 'AGENTS AND WEB DESIGN'], ['!', 'ONE CAUTION'], null];
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

// ---------- the eight boards ----------
const B = [
  // 0 · cold open: the board grows to 85, today's theme is your voice
  t => {
    bigText('YOUR VOICE, IN HOUSE', 120, 230, 140, C.k, t, 0.9); hw('The GitHub Report · Episode 02 · Friday, November 13', 128, 310, 50, C.or, t, 1.6, 3.2); mk([[120, 350], [1250, 356]], t, 2.4, 3.4, C.or, 8);
    for (let i = 0; i < 85; i++) { const isNew = i >= 78, k = isNew ? seg(t, T.seven + .3 + (i - 78) * .25, T.seven + .6 + (i - 78) * .25) : seg(t, T.gm + .5, T.gm + 2.5); if (k <= 0) continue;
      const x = 120 + (i % 17) * 62 + (hash(i) - .5) * 8, y = 430 + Math.floor(i / 17) * 40 - (isNew ? (1 - eo(k)) * 60 : 0); ctx.save(); ctx.globalAlpha = clamp(k * 2); ctx.translate(x, y); ctx.rotate((hash(i * 3) - .5) * .15);
      ctx.fillStyle = isNew ? C.or : ['#ffe680', '#ffd1dc', '#c8f0d0', '#cfe4ff'][i % 4]; ctx.fillRect(0, 0, 54, 28); ctx.restore(); }
    hw('+7 vetted this morning', 120, 680, 56, C.or, t, T.seven + .2, T.seven + 1.4); bigText('85', 640, 700, 120, C.blue, t, T.total + .8); hw('vetted tools', 780, 690, 52, C.blue, t, T.total + 1.1, T.total + 1.9);
    stamp('$0', 1500, 520, -.08, C.green, t, T.zero + .6, 120); stamp('0 INSTALLS WITHOUT YOUR WORD', 1500, 700, .04, C.red, t, T.nothing + .4, 40);
    // the microphone: today it's about your voice
    const m0 = T.voice; wsh(circ(1000, 870, 70, 95, 1), '#8fb3e0', t, m0, m0 + .6, .55); mk(circ(1000, 870, 70, 95), t, m0, m0 + .6, C.k, 7); mk([[1000, 965], [1000, 1040]], t, m0 + .5, m0 + .7, C.k, 8); mk(circ(1000, 900, 110, 100, .5, 0), t, m0 + .4, m0 + .8, C.k, 6);
    hw('today: your voice', 1150, 900, 64, C.or, t, m0 + .6, m0 + 1.6);
  },
  // 1 · VoiceStudio
  t => {
    card(120, 170, 900, 'debpalash', 'VoiceStudio', ['A fully local alternative to ElevenLabs.', 'Everything runs on your own machine.'], ['open source', 'desktop app'], 'active · pushed today', t, T.vs, C.or);
    [['voice cloning', T.cloning], ['voice design', T.design], ['video dubbing', T.dub], ['dictation', T.dict], ['transcription', T.trans], ['audiobooks', T.book]].forEach(([s, a], i) => { const x = 140 + (i % 3) * 300, y = 620 + Math.floor(i / 3) * 110, k = back(seg(t, a, a + .35)); if (k <= 0) return;
      ctx.save(); ctx.translate(x + 130, y); ctx.scale(k, k); ctx.fillStyle = ['#ddf4ff', '#fde8e1', '#e3f5e5'][i % 3]; ctx.beginPath(); ctx.roundRect(-130, -40, 260, 70, 35); ctx.fill(); txt(s, 0, 8, F.b8(32), C.k, 'center'); ctx.restore(); });
    // your own machine: a laptop with the waveform inside
    const l0 = T.machine; wsh(rectP(1180, 260, 1700, 560), '#dfe3ea', t, l0, l0 + .6, .6); mk(rectP(1180, 260, 1700, 560), t, l0, l0 + .6, C.k, 7); mk([[1110, 600], [1770, 604]], t, l0 + .4, l0 + .8, C.k, 9);
    if (t > l0 + .6) { ctx.strokeStyle = C.or; ctx.lineWidth = 6; ctx.beginPath(); for (let x = 0; x <= 440; x += 6) { const y = 410 + Math.sin(x * .07 + t * 6) * 60 * Math.sin(x / 440 * Math.PI) * eo(seg(t, l0 + .6, l0 + 1.2)); x ? ctx.lineTo(1220 + x, y) : ctx.moveTo(1220, y); } ctx.stroke(); }
    hw('on your own machine', 1220, 670, 56, C.k, t, l0 + .5, l0 + 1.5);
    bigText('646', 1240, 900, 150, C.blue, t, T.langs); hw('languages', 1530, 880, 64, C.blue, t, T.langs + .4, T.langs + 1.2);
    hw('maintainers active right now', 1240, 980, 50, C.green, t, T.stars + 1.5, T.stars + 3);
  },
  // 2 · why it fits: the paid meter vs in-house
  t => {
    const c0 = T.clone, h0 = T.house; hw('Clone Voice', 260, 220, 64, C.k, t, c0, c0 + .8); hw('paid account', 260, 290, 48, C.red, t, c0 + .6, c0 + 1.4);
    // the monthly meter: digits roll while it is on the paid side
    wsh(rectP(220, 330, 640, 520), '#fde8e1', t, c0 + .5, c0 + 1, .6); mk(rectP(220, 330, 640, 520), t, c0 + .5, c0 + 1, C.k, 6);
    if (t > c0 + 1) { const v = Math.floor((t - c0) * 7) % 100; txt(`$${(29 + v * .37).toFixed(2)}/mo`, 430, 450, F.m(54), C.red, 'center'); }
    arrow(700, 430, 980, 430, t, h0, h0 + .6, C.green);
    hw('VoiceStudio', 1060, 220, 64, C.k, t, h0, h0 + .8); hw('in-house', 1060, 290, 48, C.green, t, h0 + .6, h0 + 1.4);
    wsh(rectP(1020, 330, 1440, 520), '#e3f5e5', t, h0 + .5, h0 + 1, .6); mk(rectP(1020, 330, 1440, 520), t, h0 + .5, h0 + 1, C.k, 6); if (t > h0 + 1) txt('$0', 1230, 460, F.a(90), C.green, 'center');
    hw('your voice stays on your machine', 1020, 590, 46, C.k, t, T.stays, T.stays + 1.2);
    [['dubbing', 0], ['audiobooks', .9], ['film-slate narration', 1.8]].forEach(([s, d], i) => stamp(s.toUpperCase(), 300 + i * 360, 690, -.04 + i * .04, [C.blue, C.or, C.green][i], t, T.work + d, 42));
    hw('no monthly meter', 1100, 790, 56, C.red, t, T.meter + .3, T.meter + 1.2);
    // install: two steps
    const i0 = T.install; hw('to install:', 140, 880, 54, C.k, t, i0, i0 + .8); stamp('1  DOWNLOAD THE APP', 560, 885, -.03, C.k, t, i0 + 1, 40); stamp('2  A VOICE SAMPLE', 1000, 885, .03, C.k, t, T.sample, 40);
    // the AGPL sticky note
    const a0 = T.agpl; if (t > a0) { const k = back(seg(t, a0, a0 + .4)); ctx.save(); ctx.translate(1600, 300); ctx.rotate(.05); ctx.scale(k, k); ctx.fillStyle = '#ffe680'; ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 16; ctx.fillRect(-150, -120, 300, 300); ctx.shadowColor = 'transparent';
      txt('AGPL', 0, -50, F.a(64), C.k, 'center'); ['free to use', 'as an app.', 'Read the terms', 'before you ship', 'it in a product.'].forEach((l, j) => txt(l, 0, 0 + j * 38, F.h(36), j > 1 ? C.red : C.k, 'center')); ctx.restore(); }
    stamp('YOUR VOICE IS YOUR ASSET', 1450, 960, -.05, C.or, t, T.asset, 52);
  },
  // 3 · film and drama
  t => {
    card(120, 200, 900, 'HBAI-Ltd', 'Toonflow', ['Open short drama and motion comic tool.', 'Local deployment, room for your own models.'], ['short drama', 'motion comic'], null, t, T.toon, C.red);
    const s0 = T.story; ['SCRIPT', 'STORYBOARD', 'FINISHED SCENES'].forEach((s, i) => { const x = 140 + i * 560, y = 700; wsh(rectP(x, y, x + 440, y + 150), ['#fde8e1', '#ddf4ff', '#e3f5e5'][i], t, s0 + i * .5, s0 + .5 + i * .5, .7); mk(rectP(x, y, x + 440, y + 150), t, s0 + i * .5, s0 + .5 + i * .5, C.k, 6);
      if (t > s0 + i * .5 + .3) txt(s, x + 220, y + 95, F.a(48), C.k, 'center'); if (i) arrow(x - 110, y + 75, x - 20, y + 75, t, s0 + i * .5, s0 + .3 + i * .5, C.or); });
    hw('speaks directly to', 1120, 320, 56, C.k, t, T.spook, T.spook + 1); stamp('SPOOK', 1300, 460, -.06, C.k, t, T.spook + .9, 80); stamp('CROSSED', 1600, 470, .05, C.red, t, T.spook + 1.3, 80);
  },
  // 4 · lip sync
  t => {
    hw('the lane you ordered: three finds', 120, 190, 60, C.or, t, T.lip + .3, T.lip + 1.8);
    card(120, 260, 840, 'kandinskylab', 'Kandinsky S2V', ['One photo + a speech track →', 'a full-body talking video.'], ['speech to video'], null, t, T.kand, C.blue);
    hw("the lab's tests: lip sync ahead of HeyGen", 140, 680, 46, C.blue, t, T.heygen, T.heygen + 2);
    card(1020, 200, 800, null, 'digital-human-koubo', ['An agent skill: one photo + one sentence', '→ a finished talking-head video.'], ['script', 'captions', 'packaging'], null, t, T.koubo, C.or);
    card(1020, 640, 800, null, 'Lanshu', ['A provider-neutral Codex skill: verified', 'presenter videos from your script + photo.'], ['voiceover', 'lip sync', 'subtitles'], null, t, T.lanshu, C.green);
    // photo + waveform = talking video
    const p0 = T.kand + 1.5; wsh(rectP(160, 770, 340, 990), '#dfe3ea', t, p0, p0 + .5, .7); mk(rectP(160, 770, 340, 990), t, p0, p0 + .5, C.k, 5); mk(circ(250, 850, 40, 45), t, p0 + .3, p0 + .7, C.k, 5); mk(circ(250, 990, 80, 60, .5, Math.PI), t, p0 + .5, p0 + .9, C.k, 5);
    hw('+', 380, 900, 80, C.k, t, p0 + .6, p0 + .9); if (t > p0 + .9) { ctx.strokeStyle = C.or; ctx.lineWidth = 5; ctx.beginPath(); for (let x = 0; x <= 200; x += 5) { const y = 880 + Math.sin(x * .2 + t * 8) * 30 * Math.sin(x / 200 * Math.PI); x ? ctx.lineTo(440 + x, y) : ctx.moveTo(440, y); } ctx.stroke(); }
    arrow(670, 880, 780, 880, t, p0 + 1.2, p0 + 1.5, C.blue); hw('talks', 800, 900, 60, C.blue, t, p0 + 1.4, p0 + 2);
  },
  // 5 · agents and web design
  t => {
    card(120, 200, 820, 'pingdotgg', 'T3 Code', ['Drive Claude Code and Codex from any', 'computer, or from your phone.'], ['agents', 'remote control'], null, t, T.t3, C.blue);
    const p0 = T.phone; wsh(rectP(240, 650, 380, 900), '#ddf4ff', t, p0, p0 + .5, .7); mk(rectP(240, 650, 380, 900), t, p0, p0 + .5, C.k, 6); arrow(400, 760, 560, 760, t, p0 + .5, p0 + .9, C.blue);
    wsh(rectP(580, 660, 880, 860), '#dfe3ea', t, p0 + .7, p0 + 1.1, .7); mk(rectP(580, 660, 880, 860), t, p0 + .7, p0 + 1.1, C.k, 6); hw('agents answer to you, anywhere', 220, 980, 50, C.blue, t, p0 + 1, p0 + 2.4);
    card(1020, 200, 800, 'nutlope', 'Hallmark', ['An anti-slop design skill: art direction and', 'reference images, not generic AI pages.'], ['design skill'], null, t, T.hall, C.or);
    const h0 = T.hall + 2; wsh(rectP(1060, 650, 1380, 880), '#eceef1', t, h0, h0 + .4, .7); mk(rectP(1060, 650, 1380, 880), t, h0, h0 + .4, C.grey, 5); for (let i = 0; i < 3; i++) mk([[1090, 700 + i * 50], [1350, 700 + i * 50]], t, h0 + .3, h0 + .6, C.grey, 4);
    mk([[1050, 640], [1390, 890]], t, h0 + .8, h0 + 1.1, C.red, 9); hw('generic', 1130, 940, 46, C.grey, t, h0 + .5, h0 + 1);
    wsh(rectP(1460, 650, 1780, 880), C.or, t, h0 + 1.2, h0 + 1.6, .55); mk(rectP(1460, 650, 1780, 880), t, h0 + 1.2, h0 + 1.6, C.k, 6); mk(circ(1620, 740, 50, 50), t, h0 + 1.5, h0 + 1.9, C.k, 5); hw('art-directed', 1500, 940, 46, C.or, t, h0 + 1.5, h0 + 2);
    stamp('$40K LANE: SHARPER OUTPUT', 1420, 1020, -.03, C.green, t, T.lane + .4, 38);
  },
  // 6 · one caution: what Kandinsky needs vs what you have
  t => {
    hw('Kandinsky S2V: the sharpest lip sync in the batch', 120, 200, 56, C.k, t, T.caution + .3, T.caution + 2.2);
    const base = 860, sc = 6.5, bars = [['NEEDS', 48, C.red, T.needs], ['HD', 80, C.red, T.hd], ['YOUR DELL', 2, C.k, T.dell]];
    mk([[140, base], [1300, base + 3]], t, T.needs - .4, T.needs, C.k, 6);
    bars.forEach(([lab, gb, col, a], i) => { const x = 220 + i * 360, h = gb * sc * eo(seg(t, a, a + .9)); if (t < a) return; wsh(rectP(x, base - h, x + 220, base), col, t, a, a + .3, .55); mk(rectP(x, base - gb * sc, x + 220, base), t, a, a + .9, C.k, 5);
      txt(`${gb} GB`, x + 110, base - gb * sc - 20, F.a(52), col, 'center'); txt(lab, x + 110, base + 60, F.a(40), C.k, 'center'); });
    hw('MacBook: Intel', 1340, 620, 60, C.k, t, T.mac, T.mac + 1.2); hw('no GPU that can run it', 1340, 690, 46, C.grey, t, T.mac + .8, T.mac + 2);
    hw('the model is real. the hardware isn\'t yours yet.', 140, 980, 50, C.k, t, T.real, T.real + 2.2);
    stamp("WATCH IT. DON'T CHASE IT.", 1520, 900, -.06, C.red, t, T.watch, 54);
  },
  // 7 · recap and sign-off
  t => { const r0 = T.recap;
    [['85', 'tools on the board', C.blue, .6], ['$0', 'spent', C.green, 1.8], ['0', 'installs without your word', C.or, 2.9]].forEach(([n, l, col, d], i) => { const x = 180 + i * 560; bigText(n, x, 380, 200, col, t, r0 + d, 'left'); hw(l, x, 460, 50, C.k, t, r0 + d + .3, r0 + d + 1.2); });
    hw('Tomorrow, the hunt runs again.', 180, 620, 76, C.or, t, T.tomorrow, T.tomorrow + 1.6); hw('Same rule: nothing moves without you.', 180, 710, 60, C.k, t, T.rule, T.rule + 1.8);
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
  ctx.fillStyle = '#23262c'; ctx.fillRect(1480, 36, 400, 64); ctx.fillStyle = C.yel; ctx.fillRect(1480, 36, 10, 64); txt('THE GITHUB REPORT · EP 02', 1506, 80, F.b8(28), '#fff');
  const tools = Math.round(78 + 7 * seg(t, T.seven + .3, T.seven + 2.2)); if (t > T.gm - .3) { ctx.fillStyle = '#fff'; ctx.fillRect(1480, 100, 400, 46); ctx.strokeStyle = '#23262c'; ctx.lineWidth = 2; ctx.strokeRect(1480, 100, 400, 46); txt(`${tools} TOOLS  ·  $0 SPENT`, 1506, 133, F.m(26), '#23262c'); }
  // section strap
  const i = region(t), s = SECT[i]; if (s) { const k = eo(seg(t, REG[i] + .4, REG[i] + .9)); ctx.save(); ctx.translate(-600 * (1 - k), 0); ctx.fillStyle = C.or; ctx.fillRect(40, 36, 80, 80); txt(s[0], 80, 96, F.a(60), '#fff', 'center'); ctx.fillStyle = '#23262c'; const w = tw(s[1], F.a(50)) + 50; ctx.fillRect(120, 36, w, 80); txt(s[1], 145, 96, F.a(50), '#fff'); ctx.restore(); }
  // captions
  captions(t);
  // intro and outro cards
  if (t < T.gm + .3) { const k = 1 - ss(seg(t, T.gm - .5, T.gm + .3)); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#23262c'; ctx.fillRect(0, 0, W, H);
    const a = eo(seg(t, .6, 1.6)); txt('THE GITHUB REPORT', W / 2, H / 2 + 20 - (1 - a) * 40, F.a(170), '#fff', 'center'); ctx.globalAlpha = k * eo(seg(t, 1.8, 2.6)); txt('EPISODE 02  ·  YOUR VOICE, IN HOUSE', W / 2, H / 2 + 110, F.m(30), C.yel, 'center');
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
