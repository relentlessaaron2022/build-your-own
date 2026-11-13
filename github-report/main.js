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

// ---------- the voiceover: word timings, anchors, display corrections ----------
const WD = (await (await fetch('audio/ep01-words.json')).json()).words;
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function at(phrase, after = 0) {                              // time the phrase starts being spoken
  const q = phrase.split(' ').map(norm);
  for (let i = 0; i < WD.length; i++) { if (WD[i].s < after) continue; if (q.every((x, j) => WD[i + j] && norm(WD[i + j].w) === x)) return WD[i].s; }
  throw new Error('phrase not found: ' + phrase);
}
const FIX = [[/^3AVBD$/i, 'three-avbd'], [/^Asterix$/i, 'Astryx'], [/^A-Step$/i, 'ACE-Step'], [/^warnings$/i, 'mornings']];
const PAIRS = [['claude', 'memme', 'claude-mem'], ['drama', 'claw', 'DramaClaw'], ['real', 'mimic', 'ReelMimic']];
// ---------- region schedule (anchored) ----------
const T = {
  gm: at('Good morning'), oct: at('On October'), q1: at('One question'), q1b: at('What is out there'), thirteen: 24.8, tools78: 26.4, zero: 28.0, today: at('Today you get'),
  hold: at('Hold on'), repoQ: at('What is a repository'), workshop: at('A repository is a public'), shelf: at('GitHub is the shelf'), open: at('When a repository is open'), costs: at('That is why everything'),
  builders: at('First the builders'), ecc: at('ECC leads'), mem: at('Claude Memme'), skills: at("Anthropic's own skills"), pdf: at('and its document skills'),
  film: at('Next the film machine'), cine: at('CineCode builds'), drama: at('It drama claw'), reel: at('real mimic takes'), paper: at('and its paper cutout'),
  biz: at('all right so what'), two: at('two things straight'), cut: at('cut your film pipeline'), crew: at('without a crew'), site: at('agent skills mean'), money: at('That is the money'),
  game: at('Now the game'), hood: at('Hood Warfare'), world: at('World Explorer'), studios: at('Claude Code Game Studios'), avbd: at('3AVBD'),
  web: at('The web design lane'), astryx: at('Asterix'), extract: at('Design Extract'), ace: at('and A -Step', 160),
  more: at('Two more quick'), blah: at('The reverse engineering'), ebooks: at('Everything e -books'),
  recap: at('That is 13'), tomorrow: at('Tomorrow the hunt'), credit: at('This is the GitHub report brought'),
};
const END = WD[WD.length - 1].e, DUR = 213.6;
const REG = [0, T.hold - .5, T.builders - .4, T.film - .4, T.biz - .3, T.game - .4, T.web - .4, T.more - .4, T.recap - .4];
const SECT = [null, null, ['1', 'THE BUILDERS'], ['2', 'THE FILM MACHINE'], ['$', 'WHAT IT MEANS FOR THE BUSINESS'], ['3', 'THE GAME'], ['4', 'WEB DESIGN'], ['5', 'TWO MORE, QUICK'], null];
const RX = i => i * 2200;                                      // each region is a 1920 × 1080 panel on the board

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
const B = [
  // 0 · the hunt
  t => { SEED = 100;
    bigText('THE GITHUB REPORT', 120, 230, 150, C.k, t, 1.0); hw('Episode 01 · free & open tools, hunted every morning', 128, 310, 52, C.or, t, 2.2, 4.5);
    mk([[120, 350], [1100, 356]], t, 3.0, 4.2, C.or, 8);
    // calendar: Oct 31
    const cx = 160, cy = 430, ck = T.oct; wsh(rectP(cx, cy, cx + 230, cy + 250), '#f6d6c9', t, ck, ck + .6, .55); mk(rectP(cx, cy, cx + 230, cy + 250), t, ck, ck + .7); ctx.fillStyle = C.red; if (t > ck + .3) ctx.fillRect(cx + 4, cy + 4, 222 * eo(seg(t, ck + .3, ck + .6)), 60);
    if (t > ck + .5) { txt('OCT', cx + 115, cy + 50, F.a(46), '#fff', 'center'); bigText('31', cx + 115, cy + 200, 130, C.k, t, ck + .6, 'center'); }
    // magnifier
    mk(circ(cx + 380, cy + 110, 70, 70), t, ck + 1, ck + 1.6, C.k, 9); mk([[cx + 430, cy + 160], [cx + 500, cy + 240]], t, ck + 1.5, ck + 1.8, C.k, 16); hw('the hunt begins', cx + 290, cy + 300, 44, C.k, t, ck + 1.6, ck + 2.6);
    // the question
    bubble(760, 420, 1000, 'What is out there, free and open, that makes this business', t, T.q1b - .3, C.k);
    for (const [i, w] of ['FASTER', 'SHARPER', 'RICHER'].entries()) stamp(w, 900 + i * 300, 690, -.05 + i * .04, [C.blue, C.green, C.or][i], t, [21.7, 22.2, 23.4][i], 54);
    // 78 sticky notes, $0
    const nk = seg(t, T.thirteen, T.zero); for (let i = 0; i < 78; i++) { if (i / 78 > nk) break; const x = 140 + (i % 13) * 66 + (hash(i) - .5) * 8, y = 800 + Math.floor(i / 13) * 34; ctx.fillStyle = ['#ffe680', '#ffd1dc', '#c8f0d0', '#cfe4ff'][i % 4]; ctx.save(); ctx.translate(x, y); ctx.rotate((hash(i * 3) - .5) * .15); ctx.fillRect(0, 0, 56, 28); ctx.restore(); }
    hw('13 mornings', 1050, 840, 60, C.k, t, T.thirteen, T.thirteen + .8); hw('78 tools', 1050, 910, 60, C.blue, t, T.tools78, T.tools78 + .6);
    stamp('$0 SPENT', 1550, 880, -.08, C.green, t, T.zero, 80);
    if (t > T.today) mk(circ(780, 870, 130, 70), t, T.today, T.today + .8, C.or, 7);
    hw('the ones that matter most →', 1040, 1000, 48, C.or, t, T.today + .2, T.today + 1.4);
  },
  // 1 · what is a repository?
  t => { SEED = 200;
    bubble(120, 80, 820, 'Hold on. What is a repository?', t, T.hold, C.blue);
    // workshop: a little building with an open door and a wrench
    const x = 180, y = 420, w0 = T.workshop; wsh([[x, y + 120], [x + 210, y], [x + 420, y + 120], [x + 420, y + 380], [x, y + 380]], '#f6d6c9', t, w0 + .3, w0 + 1, .5);
    mk([[x, y + 120], [x + 210, y], [x + 420, y + 120]], t, w0, w0 + .6, C.k, 7); mk(rectP(x + 20, y + 120, x + 400, y + 380), t, w0 + .3, w0 + .9, C.k, 7); mk(rectP(x + 160, y + 240, x + 260, y + 380), t, w0 + .7, w0 + 1, C.k, 6);
    hw('REPOSITORY', x + 210, y + 200, 50, C.or, t, w0 + .8, w0 + 1.6, 'center'); hw('a public workshop where the code lives', x - 20, y + 450, 46, C.k, t, w0 + 1.4, w0 + 2.6);
    // shelf
    const sx = 760, sy = 470, s0 = T.shelf; for (let r = 0; r < 2; r++) mk([[sx, sy + 140 + r * 170], [sx + 520, sy + 142 + r * 170]], t, s0 + r * .2, s0 + .5 + r * .2, C.k, 9);
    for (let i = 0; i < 8; i++) { const r = i >> 2, bx = sx + 20 + (i % 4) * 125, by = sy + 40 + r * 170; wsh(rectP(bx, by, bx + 100, by + 95), ['#8fb3e0', '#f6d360', '#c8f0d0', '#f6d6c9'][i % 4], t, s0 + .4 + i * .08, s0 + .8 + i * .08, .6); mk(rectP(bx, by, bx + 100, by + 95), t, s0 + .4 + i * .08, s0 + .7 + i * .08, C.k, 4); }
    hw('GITHUB = the shelf', sx + 30, sy - 20, 54, C.blue, t, s0 + .3, s0 + 1.2);
    // open: look inside · use it · build on it
    const ox = 1400, o0 = T.open; [['look inside', 0], ['use it', 1.8], ['build on it', 2.8]].forEach(([s, d], i) => { const yy = 470 + i * 150;
      mk(circ(ox + 40, yy, 38, 38), t, o0 + d, o0 + d + .4, [C.blue, C.green, C.or][i], 6); txt(['👁', '🔧', '🧱'][i], ox + 40, yy + 14, '40px sans-serif', C.k, 'center'); hw(s, ox + 100, yy + 16, 50, C.k, t, o0 + d + .2, o0 + d + .9); });
    stamp('$0', 1650, 950, -.1, C.green, t, T.costs + 2.2, 110);
  },
  // 2 · the builders
  t => { SEED = 300;
    card(120, 230, 760, 'affaan-m', 'everything-claude-code', ['Tunes your coding agents:', 'speed, memory and security.'], ['agents', 'harness'], '#1', t, T.ecc, C.or);
    hw('"ECC"', 140, 200, 52, C.or, t, T.ecc + .3, T.ecc + 1);
    card(1000, 230, 780, 'thedotmack', 'claude-mem', ['Gives your agents a memory: your rules', 'carry from session to session.'], ['memory', 'plugin'], null, t, T.mem, C.blue);
    // memory: two sessions linked
    if (t > T.mem + 1.5) { for (const [i, d] of ['MON', 'TUE', 'WED'].entries()) { const x = 1060 + i * 240, y = 530; mk(rectP(x, y, x + 150, y + 90), t, T.mem + 1.5 + i * .3, T.mem + 1.9 + i * .3, C.k, 5); hw(d, x + 75, y + 60, 44, C.k, t, T.mem + 1.7 + i * .3, T.mem + 2.1 + i * .3, 'center'); if (i) arrow(x - 90, y + 45, x - 10, y + 45, t, T.mem + 2 + i * .3, T.mem + 2.3 + i * .3, C.blue); } hw('nothing starts over', 1150, 690, 48, C.blue, t, T.mem + 3, T.mem + 4); }
    card(120, 640, 860, 'anthropics', 'skills', ["Anthropic's own skills collection, open source.", 'Document skills: PDF, Word, slides, sheets.'], ['skills', 'documents'], null, t, T.skills, C.green);
    // feeds the PDF guide product
    const p0 = T.pdf; arrow(1000, 820, 1220, 820, t, p0 + .6, p0 + 1.1, C.green); wsh(rectP(1250, 720, 1440, 940), '#c8f0d0', t, p0 + 1, p0 + 1.6, .6); mk(rectP(1250, 720, 1440, 940), t, p0 + 1, p0 + 1.5, C.k, 6);
    for (let i = 0; i < 4; i++) mk([[1275, 780 + i * 34], [1410 - (i % 2) * 40, 782 + i * 34]], t, p0 + 1.4 + i * .1, p0 + 1.6 + i * .1, C.grey, 4); hw('your PDF guide', 1460, 850, 54, C.green, t, p0 + 1.6, p0 + 2.6);
  },
  // 3 · the film machine
  t => { SEED = 400;
    // film strip across the top
    const fk = seg(t, T.film, T.film + 1.2); ctx.fillStyle = '#23262c'; ctx.fillRect(100, 150, 1720 * eo(fk), 110); ctx.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { const x = 115 + i * 43; if (x > 100 + 1720 * eo(fk) - 20) break; ctx.fillRect(x, 160, 22, 14); ctx.fillRect(x, 236, 22, 14); }
    ['SCRIPT', 'FRAMES', 'SOUND', 'MP4'].forEach((s, i) => { const k = seg(t, T.cine + .8 + i * .55, T.cine + 1.2 + i * .55); if (k > 0) { ctx.globalAlpha = k; txt(s, 260 + i * 430, 220, F.a(48), C.yel, 'center'); if (i) txt('→', 50 + i * 430, 220, F.a(44), '#fff', 'center'); ctx.globalAlpha = 1; } });
    card(120, 340, 520, null, 'CineCode', ['Builds films entirely in code.'], ['film', 'code'], null, t, T.cine, C.or);
    card(700, 340, 520, 'dramaclaw', 'DramaClaw', ['A script in, a finished drama out.'], ['script → film'], null, t, T.drama, C.red);
    card(1280, 340, 540, 'edenfunf', 'ReelMimic', ['A video you love → a new one', 'in the same style.'], ['style transfer'], null, t, T.reel, C.blue);
    // paper cut-out engine → your style
    const p0 = T.paper; for (let i = 0; i < 3; i++) { const x = 1340 + i * 140, y = 760; wsh([[x, y], [x + 110, y - 20], [x + 120, y + 110], [x - 10, y + 120]], ['#f6d360', '#f6d6c9', '#8fb3e0'][i], t, p0 + i * .2, p0 + .5 + i * .2, .8); mk([[x, y], [x + 110, y - 20], [x + 120, y + 110], [x - 10, y + 120], [x, y]], t, p0 + i * .2, p0 + .6 + i * .2, C.k, 4); }
    hw('paper cut-out engine', 1330, 940, 50, C.blue, t, p0 + .6, p0 + 1.6); hw('= your style, directly', 1330, 1000, 46, C.k, t, p0 + 1.4, p0 + 2.4);
  },
  // 4 · what it means for the business
  t => { SEED = 500;
    bubble(120, 160, 980, 'So what would this do for my business?', t, T.biz, C.blue);
    hw('two things, straight', 1180, 230, 64, C.or, t, T.two, T.two + 1);
    // film pipeline cost: crew → near zero
    const c0 = T.cut; hw('film pipeline cost', 140, 450, 52, C.k, t, c0, c0 + .8);
    const bw = lerp(760, 50, eio(seg(t, c0 + .8, c0 + 2.6))); wsh(rectP(140, 490, 140 + bw, 570), C.red, t, c0 + .4, c0 + .8, .55); mk(rectP(140, 490, 900, 570), t, c0 + .3, c0 + .8, C.k, 5);
    hw(t < c0 + 2.6 ? '$$$$' : 'near $0', 160 + bw + 20, 550, 52, t < c0 + 2.6 ? C.red : C.green, t, c0 + .5, c0 + 1);
    for (let i = 0; i < 5; i++) { const x = 160 + i * 110, y = 660; mk(circ(x, y, 18, 18), t, T.crew - .4 + i * .08, T.crew - .2 + i * .08, C.k, 5); mk([[x, y + 20], [x, y + 70]], t, T.crew - .3 + i * .08, T.crew - .1 + i * .08, C.k, 5); }
    mk([[130, 620], [700, 760]], t, T.crew + .3, T.crew + .7, C.red, 9); hw('no crew needed', 740, 720, 52, C.red, t, T.crew + .5, T.crew + 1.3);
    // client site: a week → a day
    const s0 = T.site, sx = 1100, sy = 430; hw('client website', sx, sy + 20, 52, C.k, t, s0, s0 + .8);
    ['M', 'T', 'W', 'T', 'F'].forEach((d, i) => { const x = sx + i * 120, y = sy + 60; wsh(rectP(x, y, x + 100, y + 100), i ? '#dfe3ea' : '#8fb3e0', t, s0 + .3 + i * .1, s0 + .6 + i * .1, .6); mk(rectP(x, y, x + 100, y + 100), t, s0 + .3 + i * .1, s0 + .6 + i * .1, C.k, 4); hw(d, x + 50, y + 70, 48, C.k, t, s0 + .4 + i * .1, s0 + .7 + i * .1, 'center'); if (i && t > s0 + 2) mk([[x + 10, y + 10], [x + 90, y + 90]], t, s0 + 2 + i * .1, s0 + 2.2 + i * .1, C.red, 7); });
    hw('a week → a day', sx + 120, sy + 260, 60, C.blue, t, s0 + 2.4, s0 + 3.4);
    // the money
    const m0 = T.money; for (let i = 0; i < 6; i++) { const x = 1480 + (i % 3) * 20, y = 900 - i * 26; wsh(rectP(x, y, x + 220, y + 30), '#9ccf8d', t, m0 + i * .08, m0 + .3 + i * .08, .8); mk(rectP(x, y, x + 220, y + 30), t, m0 + i * .08, m0 + .3 + i * .08, C.green, 4); }
    stamp('THE MONEY IN IT', 1110, 900, -.06, C.green, t, m0 + .3, 64);
  },
  // 5 · the game
  t => { SEED = 600;
    card(100, 200, 560, null, 'Hood Warfare', ['An open-world crime game,', 'built in the open.'], ['game', 'open world'], null, t, T.hood, C.red);
    hw('meets Grand Theft Auto', 110, 175, 46, C.red, t, T.hood + .6, T.hood + 1.6);
    card(720, 200, 560, null, 'World Explorer', ['The whole planet as an open', 'world in your browser.'], ['real streets', 'real buildings'], null, t, T.world, C.blue);
    // globe
    const g0 = T.world + .8; wsh(circ(1480, 330, 120, 120, 1), '#8fb3e0', t, g0, g0 + .6, .6); mk(circ(1480, 330, 120, 120), t, g0, g0 + .6, C.k, 6); mk([[1360, 330], [1600, 330]], t, g0 + .5, g0 + .8, C.k, 4); mk(circ(1480, 330, 60, 120, .55, -Math.PI / 2), t, g0 + .6, g0 + 1, C.k, 4); mk(circ(1480, 330, 60, 120, .55, Math.PI / 2), t, g0 + .7, g0 + 1.1, C.k, 4);
    card(100, 610, 780, null, 'Claude Code Game Studios', ['49 agents organized into one game studio.'], ['Godot', 'Unity', 'Unreal'], null, t, T.studios, C.or);
    for (let i = 0; i < 49; i++) { const k = seg(t, T.studios + .6 + i * .02, T.studios + .8 + i * .02); if (k > 0) { ctx.fillStyle = `rgba(217,119,87,${k})`; ctx.beginPath(); ctx.arc(140 + (i % 25) * 30, 880 + Math.floor(i / 25) * 30, 9, 0, 7); ctx.fill(); } }
    card(960, 610, 860, 'sbobyn', 'three-avbd', ['GPU destruction physics in the browser.'], ['WebGPU', 'Voxel City demo'], null, t, T.avbd, C.k);
    for (let i = 0; i < 60; i++) { const k = seg(t, T.avbd + 1.5, T.avbd + 4), x = 1000 + (i % 15) * 30, y = 870 + Math.floor(i / 15) * 30, dx = k * (hash(i) - .5) * 300, dy = k * k * 200 * hash(i * 2) - k * 80 * hash(i * 3); if (t > T.avbd + .8) { ctx.fillStyle = ['#8fb3e0', '#f6d360', '#d97757'][i % 3]; ctx.save(); ctx.translate(x + dx, y + dy); ctx.rotate(k * 4 * (hash(i) - .5)); ctx.fillRect(-12, -12, 24, 24); ctx.restore(); } }
    bigText('94,000', 1520, 930, 96, C.k, t, T.avbd + 2); hw('voxel bodies', 1530, 990, 50, C.or, t, T.avbd + 2.4, T.avbd + 3.2);
  },
  // 6 · web design
  t => { SEED = 700;
    card(100, 200, 820, 'facebook', 'astryx', ["Meta's open design system: 150+ React", 'components your agents build client sites from.'], ['React', 'design system'], null, t, T.astryx, C.blue);
    for (let i = 0; i < 12; i++) { const x = 140 + (i % 6) * 125, y = 520 + Math.floor(i / 6) * 90; wsh(rectP(x, y, x + 100, y + 60), ['#8fb3e0', '#c8f0d0', '#f6d360'][i % 3], t, T.astryx + 1 + i * .08, T.astryx + 1.3 + i * .08, .6); mk(rectP(x, y, x + 100, y + 60), t, T.astryx + 1 + i * .08, T.astryx + 1.3 + i * .08, C.k, 3); }
    hw('150+ components', 900, 590, 54, C.blue, t, T.astryx + 1.8, T.astryx + 2.8);
    card(1000, 200, 820, null, 'Design Extract', ["Pulls any site's full design system", 'and hands it back.'], ['WordPress', 'Tailwind', 'Figma'], null, t, T.extract, C.or);
    card(560, 720, 820, null, 'ACE-Step', ['Generates full songs, with vocals.'], ['music', 'needs a GPU machine'], null, t, T.ace, C.green);
    for (let i = 0; i < 3; i++) { const k = seg(t, T.ace + 1 + i * .3, T.ace + 1.4 + i * .3); if (k > 0) { ctx.globalAlpha = k; txt('♪', 1440 + i * 90, 820 - i * 30 - k * 20, F.a(80), C.green, 'center'); ctx.globalAlpha = 1; } }
  },
  // 7 · two more
  t => { SEED = 800;
    card(120, 250, 820, null, 'Build hardening', ['Flips reverse engineering around: hardens', 'your build so no one clones what you ship.'], ['security'], null, t, T.blah, C.red);
    const l0 = T.blah + 1.5; wsh(rectP(360, 640, 640, 880), '#f6d6c9', t, l0, l0 + .6, .6); mk(rectP(360, 640, 640, 880), t, l0, l0 + .6, C.k, 7); mk(circ(500, 640, 90, 110, .5, Math.PI), t, l0 + .5, l0 + 1.1, C.k, 12); mk(circ(500, 750, 20, 20), t, l0 + 1, l0 + 1.2, C.k, 6);
    card(1020, 250, 800, null, 'Everything E-books', ['Writes in the browser, exports', 'print-ready PDFs for your catalog.'], ['books', 'PDF'], null, t, T.ebooks, C.green);
    const b0 = T.ebooks + 1; wsh([[1250, 640], [1420, 610], [1590, 640], [1590, 880], [1420, 850], [1250, 880]], '#c8f0d0', t, b0, b0 + .6, .6); mk([[1250, 640], [1420, 610], [1590, 640], [1590, 880], [1420, 850], [1250, 880], [1250, 640]], t, b0, b0 + .8, C.k, 6); mk([[1420, 610], [1420, 850]], t, b0 + .6, b0 + .9, C.k, 5);
  },
  // 8 · recap and sign-off
  t => { SEED = 900; const r0 = T.recap;
    [['13', 'mornings', C.k, 0], ['78', 'tools', C.blue, 1.4], ['$0', 'spent', C.green, 2.6], ['0', 'installs without your word', C.or, 3.9]].forEach(([n, l, col, d], i) => { const x = 160 + i * 430; bigText(n, x, 380, 190, col, t, r0 + d); hw(l, x, 460, 48, C.k, t, r0 + d + .3, r0 + d + 1.1); });
    hw('Tomorrow the hunt runs again.', 160, 640, 76, C.or, t, T.tomorrow, T.tomorrow + 1.6);
    const c0 = T.credit; bigText('THE GITHUB REPORT', 160, 860, 110, C.k, t, c0);
    hw('brought to you by the automator, novelist & multimedia producer', 166, 940, 46, C.k, t, c0 + 1.5, c0 + 3.4); bigText('RELENTLESS AARON', 166, 1030, 76, C.or, t, c0 + 4.5);
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
  ctx.fillStyle = '#23262c'; ctx.fillRect(1480, 36, 400, 64); ctx.fillStyle = C.yel; ctx.fillRect(1480, 36, 10, 64); txt('THE GITHUB REPORT · EP 01', 1506, 80, F.b8(28), '#fff');
  const tools = Math.round(78 * seg(t, T.thirteen, T.tools78 + .6)); if (t > T.thirteen) { ctx.fillStyle = '#fff'; ctx.fillRect(1480, 100, 400, 46); ctx.strokeStyle = '#23262c'; ctx.lineWidth = 2; ctx.strokeRect(1480, 100, 400, 46); txt(`${tools} TOOLS  ·  $0 SPENT`, 1506, 133, F.m(26), '#23262c'); }
  // section strap
  const i = region(t), s = SECT[i]; if (s) { const k = eo(seg(t, REG[i] + .4, REG[i] + .9)); ctx.save(); ctx.translate(-600 * (1 - k), 0); ctx.fillStyle = C.or; ctx.fillRect(40, 36, 80, 80); txt(s[0], 80, 96, F.a(60), '#fff', 'center'); ctx.fillStyle = '#23262c'; const w = tw(s[1], F.a(50)) + 50; ctx.fillRect(120, 36, w, 80); txt(s[1], 145, 96, F.a(50), '#fff'); ctx.restore(); }
  // captions
  captions(t);
  // intro and outro cards
  if (t < T.gm + .2) { const k = 1 - ss(seg(t, T.gm - .6, T.gm + .2)); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#23262c'; ctx.fillRect(0, 0, W, H);
    const a = eo(seg(t, .6, 1.6)); txt('THE GITHUB REPORT', W / 2, H / 2 + 20 - (1 - a) * 40, F.a(170), '#fff', 'center'); ctx.globalAlpha = k * eo(seg(t, 1.8, 2.6)); txt('EPISODE 01  ·  FREE & OPEN TOOLS, HUNTED EVERY MORNING', W / 2, H / 2 + 110, F.m(30), C.yel, 'center');
    ctx.fillStyle = C.yel; ctx.fillRect(W / 2 - 400 * eio(seg(t, 1.2, 2.2)), H / 2 + 50, 800 * eio(seg(t, 1.2, 2.2)), 8); ctx.restore(); }
  if (t > END + .6) { const k = ss(seg(t, END + .6, END + 1.6)); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#23262c'; ctx.fillRect(0, 0, W, H); txt('THE GITHUB REPORT', W / 2, H / 2 - 30, F.a(140), '#fff', 'center'); txt('NEW EPISODE EVERY MORNING  ·  SUBSCRIBE', W / 2, H / 2 + 60, F.m(34), C.yel, 'center'); txt('Relentless Aaron', W / 2, H / 2 + 150, F.h(70), C.or, 'center'); ctx.restore(); }
}
// captions: corrected names, short groups
const CAP = (() => { const out = []; let g = [];
  const fixW = w => { let s = w.w; for (const [re, r] of FIX) if (re.test(s.replace(/[.,!?]$/, ''))) { s = r + (/[.,!?]$/.test(s) && r ? s.slice(-1) : ''); break; } return s; };
  let ws = []; for (const w of WD) { if (w.s > 138.8 && w.s < 139.1) continue; if (ws.length && /^[-.]/.test(w.w)) { ws[ws.length - 1].w += w.w; ws[ws.length - 1].e = w.e; } else ws.push({ ...w }); }
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
