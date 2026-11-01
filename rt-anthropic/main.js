// Relentless Times · "Who gets the cheese?" — Anthropic's IPO filing, vertical.
// Blend: Whiteboard Explainer (one glossy board, marker drawn live, the camera travels between regions) +
// Watercolor Brush (every drawn shape is filled with a transparent wash) + Broadcast News Package (bug, tabbed straps, sources, sign-off).
import { ink, wash } from './sketch.js';
const W = 1080, H = 1920;
const cv = document.getElementById('out'), ctx = cv.getContext('2d');
const C = { k: '#23262c', blue: '#2a5cb3', or: '#d97757', red: '#c8363a', lemon: '#F2CF1D', ink: '#121417', paper: '#F4F1E8', grey2: '#7D838D', olive: '#6E5A1E', gold: '#D4B064' };
const F = { b8: s => `800 ${s}px Barlow`, b6: s => `600 ${s}px Barlow`, mono: s => `500 ${s}px Plex`, hand: s => `600 ${s}px Caveat` };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - x, 3), eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, ss = x => x * x * (3 - 2 * x);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
let TX = [];
function text(s, x, y, font, color, align = 'left', ls = 0, id = null) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = ls + 'px'; ctx.fillText(s, x, y);
  if (id) { const w = ctx.measureText(s).width, m = ctx.getTransform(), x0 = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x, sz = parseFloat(font.split(' ')[1]);
    const p = (px, py) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f], a = p(x0, y - sz * .8), b = p(x0 + w, y + sz * .2);
    TX.push({ id, text: s, x0: Math.min(a[0], b[0]), y0: Math.min(a[1], b[1]), x1: Math.max(a[0], b[0]), y1: Math.max(a[1], b[1]) }); }
  ctx.letterSpacing = '0px';
}
const tw = (s, font, ls = 0) => { ctx.font = font; ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; };
const fit = (s, size, maxW, ls = 0, f = F.b8) => Math.floor(Math.min(size, size * maxW / tw(s, f(size), ls)));

await Promise.all([F.b8(40), F.b6(40), F.mono(20), F.hand(60)].map(f => document.fonts.load(f)));
// ---------- timeline ----------
const DURS = await (await fetch('vo/dur.json')).json();
const GAP = .35, T0 = .4;
const LINES = [
  { tab: 'ON THE RECORD', hl: 'ANTHROPIC FILES TO GO PUBLIC', src: 'Anthropic S-1, SEC' },
  { tab: 'ON THE RECORD', hl: 'S-1 MADE PUBLIC OCT. 26 · TICKER: ANT', src: 'Anthropic S-1, SEC' },
  { tab: 'ON THE RECORD', hl: 'REVENUE: $16.3B IN SIX MONTHS', src: 'Anthropic S-1 · six months to June 30, 2026' },
  { tab: 'ON THE RECORD', hl: 'MOST OF THE $80.7B LOSS IS NON-CASH', src: 'Anthropic S-1 · fair-value change, convertible notes' },
  { tab: 'CONTEXT', hl: 'PRICE NOT SET · ~$2 TRILLION REPORTED', src: 'S-1 price range blank · press reports' },
  { tab: 'ON THE RECORD', hl: 'CO-FOUNDERS HOLD 50.1% OF THE VOTE', src: 'Anthropic S-1 · Class F share' },
  { tab: 'ON THE RECORD', hl: '80% PLEDGED TO CHARITY · 5% BENEFIT FUND', src: 'Anthropic S-1' },
  { tab: 'ON THE RECORD', hl: '≈5,300 EMPLOYEES', src: 'Anthropic S-1 · as of Sept. 30, 2026' },
  { tab: 'ESTIMATE', hl: 'ONE ESTIMATE: ~$62M PER EMPLOYEE', src: 'Estimate shared on X, at a $2T valuation · not in the S-1' },
  { tab: 'ON THE RECORD', hl: '$224B+ PROMISED FOR COMPUTE', src: 'Anthropic S-1 · minimum commitments' },
  { tab: 'COMMENTARY', hl: 'THE REAL TEST: WHEN LOCKUPS END', src: 'Relentless Times' },
  { tab: null, hl: null },
];
{ let cur = T0; LINES.forEach((l, i) => { l.id = 'l' + String(i).padStart(2, '0'); l.d = DURS[l.id]; l.t0 = cur; cur += l.d + GAP; l.t1 = cur; }); }
const VO = await (await fetch('vo/lines.json')).json();
const SUB = ['Anthropic just filed to go public. And the paperwork shows exactly where the money is about to move.',
  'The filing went public on Oct. 26. The ticker will be ANT, on the Nasdaq.',
  'Revenue in 2025: about $4.6 billion. The first six months of this year: $16.3 billion.',
  'The same six months show an $80.7 billion loss. But $72 billion of it is an accounting charge on convertible notes. Not cash out the door.',
  'No share price is set yet. Reports put the target near $2 trillion. The last private round: $965 billion.',
  'So who holds the cheese? Seven co-founders control 50.1% of the vote, through a single share.',
  'They have pledged 80% of their equity to charity. And a public benefit fund holds 5% of the company.',
  'Then there are the people who built it. About 5,300 employees.',
  'One estimate shared on X puts their stake near $331 billion. About $62 million each, on average. That math is not in the filing.',
  'And the landlords. At least $110 billion promised to Amazon, and $114 billion to Google, for computing power. Used or not.',
  'The real test comes later, when insiders are allowed to sell. That is when we learn who cashes out, and who believes.',
  'This is Relentless Times.'];
LINES.forEach((l, i) => { l.say = SUB[i]; });
const END = LINES[11].t0, DUR = END + 3.4;

// ---------- the board: one region per idea, laid out on a big board; the camera travels ----------
const RW = 1240, RH = 1360;
const REG = [[0, 0], [1, 0], [2, 0], [2, 1], [1, 1], [0, 1], [0, 2], [1, 2], [2, 2], [2, 3], [1, 3]];
const regC = i => [REG[i][0] * RW, REG[i][1] * RH];
const BX0 = -RW / 2 - 200, BY0 = -RH / 2 - 200, BX1 = 2 * RW + RW / 2 + 200, BY1 = 3 * RH + RH / 2 + 420;
const CY = 800;                                            // where a region's centre sits on screen
function cam(t) {                                          // → [cx, cy, z]
  let i = 0; while (i < 10 && t >= LINES[i + 1].t0 - .45) i++;
  const [ax, ay] = regC(Math.max(0, i - 1)), [bx, by] = regC(i), k = i ? eio(seg(t, LINES[i].t0 - .45, LINES[i].t0 + .2)) : 1;
  let x = lerp(ax, bx, k), y = lerp(ay, by, k), z = 1.12 - .12 * Math.sin(Math.PI * k);
  const lt = t - LINES[i].t0; z *= 1 + .025 * clamp(lt / 8);
  const e = eio(seg(t, END - .2, END + 1.6));             // the pull-back: the whole board as one picture
  if (e > 0) { x = lerp(x, RW, e); y = lerp(y, (BY0 + BY1) / 2, e); z = lerp(z, .2, e); }
  return [x, y, z];
}
function board(t, c) {
  const [cx, cy, z] = c;
  ctx.save(); ctx.setTransform(z, 0, 0, z, W / 2 - cx * z, CY - cy * z);
  const g = ctx.createLinearGradient(BX0, BY0, BX1, BY1); g.addColorStop(0, '#fbfaf6'); g.addColorStop(1, '#f1efe9');
  ctx.fillStyle = '#6b6f76'; ctx.fillRect(BX0 - 4000, BY0 - 4000, BX1 - BX0 + 8000, BY1 - BY0 + 8000);
  ctx.fillStyle = '#d9dbe0'; ctx.fillRect(BX0 - 40, BY0 - 40, BX1 - BX0 + 80, BY1 - BY0 + 80);
  ctx.fillStyle = g; ctx.fillRect(BX0, BY0, BX1 - BX0, BY1 - BY0);
  ctx.globalAlpha = .045;                                  // ghosts of old lessons
  for (let i = 0; i < 40; i++) { const x = BX0 + hash(i) * (BX1 - BX0), y = BY0 + hash(i * 3.3) * (BY1 - BY0), r = 30 + hash(i * 7) * 90;
    ink(ctx, hash(i * 5) < .5 ? circ(x, y, r, r * .8, 1.15) : [[x - r, y], [x + r, y + hash(i) * 30 - 15]], { seed: i, w: 6, col: hash(i * 9) < .5 ? '#7f8796' : '#8aa0c8' }); }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 11; i++) { const L = LINES[i]; if (t < L.t0 - .1) continue; const [x, y] = regC(i); ctx.save(); ctx.translate(x, y); DRAW[i](t - L.t0, L); ctx.restore(); }
  ctx.restore();
  // glossy window sheen, drifting slower than the board
  ctx.save(); ctx.globalAlpha = .13; const sx = (-cx * .35 * z) % 2400;
  const sg = ctx.createLinearGradient(sx, 0, sx + 900, 900); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,1)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg; ctx.translate(0, 0); ctx.rotate(-.5); ctx.fillRect(-1200, -400, 4000, 3600); ctx.restore();
}

// ---------- drawing vocabulary (region-local) ----------
const circ = (x, y, rx, ry, turns = 1.1, a0 = -2.2) => { const o = []; for (let i = 0; i <= 48; i++) { const a = a0 + i / 48 * Math.PI * 2 * turns; o.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]); } return o; };
const rect = (x0, y0, x1, y1) => [[x0 - 6, y0], [x1 + 4, y0 + 2], [x1, y1 + 5], [x0 + 2, y1], [x0, y0 - 6]];
let SEED = 1;
const mk = (pts, lt, a, b, col = C.k, w = 7) => ink(ctx, pts, { seed: SEED++, w, col, wob: 1.4, over: 5, prog: eo(seg(lt, a, b)) });
const wsh = (poly, col, lt, a, b, al = .5) => { const k = seg(lt, a, b); if (k > 0) wash(ctx, poly, col, { alpha: al * ss(k), seed: SEED++, amp: 5 }); else SEED++; };
function hw(s, x, y, size, col, lt, a, b, align = 'center', id = null) {   // handwriting, revealed in writing order
  const k = seg(lt, a, b); if (k <= 0) return;
  ctx.save(); ctx.font = F.hand(size); const w = ctx.measureText(s).width, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.beginPath(); ctx.rect(x0 - 10, y - size * 1.1, (w + 20) * k, size * 1.6); ctx.clip();
  ctx.globalCompositeOperation = 'multiply'; text(s, x, y, F.hand(size), col, align, 0, k >= 1 ? id : null); ctx.restore();
}
function stampB(s, x, y, rot, col, lt, at) {               // a rubber stamp slapped onto the board
  const k = seg(lt, at, at + .22); if (k <= 0) return; const sc = lerp(1.5, 1, eo(k));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = .9 * k;
  const f = F.b8(46), w = tw(s, f, 3) + 44; ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.strokeRect(-w / 2, -40, w, 76);
  text(s, 0, 16, f, col, 'center', 3); ctx.restore();
}
const pieWedge = (x, y, r, a0, a1) => { const o = [[x, y]]; for (let i = 0; i <= 40; i++) { const a = a0 + (a1 - a0) * i / 40; o.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return o; };
const arrow = (x0, y0, x1, y1, bend, lt, a, b, col) => { const mx = (x0 + x1) / 2 - (y1 - y0) * bend, my = (y0 + y1) / 2 + (x1 - x0) * bend, P = []; for (let i = 0; i <= 24; i++) { const u = i / 24; P.push([(1 - u) ** 2 * x0 + 2 * u * (1 - u) * mx + u * u * x1, (1 - u) ** 2 * y0 + 2 * u * (1 - u) * my + u * u * y1]); }
  mk(P, lt, a, b, col, 7); const an = Math.atan2(y1 - my, x1 - mx); mk([[x1 - Math.cos(an - .5) * 40, y1 - Math.sin(an - .5) * 40], [x1, y1], [x1 - Math.cos(an + .5) * 40, y1 - Math.sin(an + .5) * 40]], lt, b, b + .25, col, 7); };

const DRAW = [
  // 0 · who gets the cheese?
  lt => { SEED = 100;
    const A = [-330, 40], B = [300, -110], Cc = [310, 10], dy = 190, top = [A, B, Cc], front = [A, Cc, [Cc[0], Cc[1] + dy], [A[0], A[1] + dy]];
    wsh(top, '#f6d360', lt, 1.0, 1.8, .55); wsh(front, '#e9b93a', lt, 1.2, 2.0, .55);
    mk([A, B, Cc, A], lt, .2, 1.1); mk([Cc, [Cc[0], Cc[1] + dy], [A[0], A[1] + dy], A], lt, .6, 1.4);
    for (const [x, y, r] of [[-180, 140, 34], [20, 120, 26], [170, 150, 30], [-60, 200, 18]]) { wsh(circ(x, y, r, r * .7, 1), '#c99a2e', lt, 1.8, 2.3, .6); mk(circ(x, y, r, r * .7), lt, 1.8, 2.3, C.k, 5); }
    hw('WHO GETS', 0, -360, 120, C.k, lt, 1.4, 2.6, 'center', 'title1'); hw('THE CHEESE?', 0, -230, 120, C.or, lt, 2.6, 3.8, 'center', 'title2');
    for (const [x, y, s] of [[-360, -100, 70], [360, -260, 60], [330, 340, 80], [-300, 380, 56]]) hw('$', x, y, s, '#2e8b57', lt, 3.6, 4.2);
  },
  // 1 · the filing
  lt => { SEED = 200;
    wsh(rect(-220, -380, 220, 220), '#dfe6f2', lt, .9, 1.6, .5); mk(rect(-220, -380, 220, 220), lt, .1, 1.0);
    hw('S-1', 0, -250, 120, C.blue, lt, .6, 1.4);
    for (let i = 0; i < 6; i++) mk([[-160, -150 + i * 55], [160 - (i % 3) * 50, -148 + i * 55]], lt, 1.0 + i * .12, 1.3 + i * .12, '#7f8796', 5);
    stampB('MADE PUBLIC OCT. 26', 30, 120, -.12, C.red, lt, 2.4);
    hw('NASDAQ: ANT', 0, 390, 104, C.k, lt, 3.2, 4.4, 'center', 'ant');
  },
  // 2 · revenue bars
  lt => { SEED = 300; const base = 300, h1 = 560 * 4.585 / 16.286, h2 = 560;
    mk([[-400, base], [400, base + 3]], lt, .1, .6);
    const g1 = seg(lt, .8, 1.6), g2 = seg(lt, 3.4, 4.6);
    wsh(rect(-280, base - h1 * eo(g1), -80, base), '#8fb3e0', lt, .8, 1.0, .6); mk(rect(-280, base - h1, -80, base), lt, .8, 1.6);
    wsh(rect(80, base - h2 * eo(g2), 280, base), C.or, lt, 3.4, 3.6, .55); mk(rect(80, base - h2, 280, base), lt, 3.4, 4.6);
    hw('2025', -180, base + 90, 64, C.k, lt, .9, 1.4); hw('$4.6B', -180, base - h1 - 40, 72, C.blue, lt, 1.6, 2.4, 'center', 'v1');
    hw('H1 2026', 180, base + 90, 64, C.k, lt, 3.4, 4.0); hw('$16.3B', 180, base - h2 - 40, 82, C.or, lt, 4.6, 5.4, 'center', 'v2');
    hw('six months', 180, base + 160, 48, '#7f8796', lt, 5.2, 5.8);
  },
  // 3 · the loss, mostly on paper
  lt => { SEED = 400; const x0 = -380, x1 = -110, top = -330, bot = 340, split = top + (bot - top) * 72.388 / 80.748;
    hw('H1 2026 NET LOSS', 0, -420, 70, C.k, lt, .1, 1.0);
    const g = seg(lt, .6, 2.2);
    mk(rect(x0, top, x1, bot), lt, .6, 1.6, C.k); wsh(rect(x0, top, x1, top + (bot - top) * eo(g)), '#c9ced8', lt, .6, .9, .55);
    for (let i = 0; i < 12; i++) { const y = top + 30 + i * 52; if (y > split - 10) break; mk([[x0 + 10, y + 40], [x1 - 10, y - 10]], lt, 3.2 + i * .06, 3.5 + i * .06, C.blue, 5); }
    wsh(rect(x0, split, x1, bot), C.red, lt, 6.6, 7.2, .6); mk([[x0 - 10, split], [x1 + 14, split]], lt, 6.4, 6.8, C.k, 6);
    hw('$80.7B', (x0 + x1) / 2, top - 30, 76, C.red, lt, 1.4, 2.2, 'center', 'loss');
    hw('$72.4B', 60, -80, 92, C.blue, lt, 3.4, 4.2, 'left', 'nc1'); hw('non-cash:', 60, 0, 54, C.blue, lt, 4.0, 4.6, 'left'); hw('convertible notes', 60, 60, 54, C.blue, lt, 4.4, 5.2, 'left', 'nc2');
    hw('$8.3B', 60, split + 10, 70, C.red, lt, 7.0, 7.6, 'left', 'rest'); hw('everything else', 60, split + 70, 48, C.red, lt, 7.4, 8.2, 'left');
  },
  // 4 · what is it worth?
  lt => { SEED = 500;
    wsh(circ(-250, 170, 150, 150, 1), '#8fb3e0', lt, .6, 1.2, .45); mk(circ(-250, 170, 150, 150), lt, .3, 1.2);
    hw('PRICE: TBD', 0, -330, 96, C.red, lt, .2, 1.2, 'center', 'tbd');
    hw('$965B', -250, 195, 84, C.blue, lt, 4.2, 5.0, 'center', 'v965'); hw('last private round', -250, 380, 50, '#7f8796', lt, 4.8, 5.6);
    wsh(circ(240, -60, 210, 210, 1), C.or, lt, 2.2, 3.0, .45); mk(circ(240, -60, 210, 210), lt, 1.8, 2.8);
    hw('~$2T?', 240, -30, 110, C.or, lt, 2.6, 3.4, 'center', 'v2t'); hw('reported target', 240, 220, 50, '#7f8796', lt, 3.2, 3.9);
    arrow(-130, 60, 60, -10, -.25, lt, 5.4, 6.2, C.k);
  },
  // 5 · the vote
  lt => { SEED = 600; const x = 0, y = 60, r = 270, a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * .501;
    wsh(pieWedge(x, y, r, a1, a0 + Math.PI * 2), '#c9ced8', lt, 1.0, 1.6, .45);
    const g = seg(lt, 2.6, 3.6); wsh(pieWedge(x, y, r, a0, lerp(a0, a1, eo(g))), C.or, lt, 2.6, 2.8, .6);
    mk(circ(x, y, r, r, 1.04, a0), lt, .4, 1.6); mk([[x, y - r], [x, y + r]], lt, 2.4, 2.9);
    hw('50.1%', 140, 80, 104, C.k, lt, 3.4, 4.2, 'center', 'p501'); hw('of the vote', 140, 160, 50, C.k, lt, 4.0, 4.6);
    hw('7 co-founders', 0, -300, 84, C.k, lt, 2.0, 3.0, 'center', 'cof'); hw('via 1 Class F share', 0, 430, 56, C.blue, lt, 4.8, 5.8, 'center', 'clf');
  },
  // 6 · pledges and the fund
  lt => { SEED = 700; const hp = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, s = Math.sin(a); hp.push([-200 + 16 * s ** 3 * 9, -200 - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * 9]); }
    wsh(hp, C.or, lt, .9, 1.6, .55); mk(hp, lt, .2, 1.2);
    hw('80%', 140, -220, 120, C.or, lt, .9, 1.7, 'center', 'p80'); hw('pledged to charity', 140, -140, 54, C.k, lt, 1.5, 2.4, 'center', 'chr');
    const x = -200, y = 230, r = 150; wsh(circ(x, y, r, r, 1), '#c9ced8', lt, 3.6, 4.2, .4); wsh(pieWedge(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * .05), C.blue, lt, 4.4, 4.8, .8);
    mk(circ(x, y, r, r), lt, 3.4, 4.2); mk([[x, y], [x, y - r]], lt, 4.2, 4.4, C.k, 5); mk([[x, y], [x + Math.cos(-Math.PI / 2 + .314) * r, y + Math.sin(-Math.PI / 2 + .314) * r]], lt, 4.3, 4.5, C.k, 5);
    hw('5%', 140, 230, 120, C.blue, lt, 4.4, 5.1, 'center', 'p5'); hw('public benefit fund', 140, 310, 54, C.k, lt, 5.0, 5.9, 'center', 'pbf');
  },
  // 7 · the people who built it
  lt => { SEED = 800;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 10; c++) { const x = -405 + c * 90, y = -260 + r * 70, a = .3 + (r * 10 + c) * .018;
      const col = (r * 10 + c) % 17 === 0 ? C.or : C.k; mk(circ(x, y, 11, 11, 1.05), lt, a, a + .15, col, 4); mk([[x, y + 14], [x, y + 40]], lt, a + .08, a + .2, col, 4); }
    hw('≈ 5,300', 0, 380, 130, C.k, lt, 1.8, 2.8, 'center', 'emp'); hw('employees · each mark ≈ 66 people', 0, 450, 44, '#7f8796', lt, 2.6, 3.6, 'center');
  },
  // 8 · one estimate
  lt => { SEED = 900;
    hw('$331B', 0, -250, 130, C.or, lt, .5, 1.4, 'center', 'e331'); hw('÷ 5,300', 0, -110, 100, C.k, lt, 1.6, 2.4, 'center', 'ediv');
    mk([[-250, -50], [250, -46]], lt, 2.4, 2.8, C.k, 8);
    wsh(rect(-250, 0, 250, 150), '#f6d360', lt, 3.0, 3.6, .5); hw('≈ $62M each*', 0, 110, 110, C.k, lt, 2.8, 3.8, 'center', 'e62');
    stampB('ESTIMATE', 0, 280, -.08, C.red, lt, 7.2);
    hw('*average · at a $2T valuation · not in the filing', 0, 420, 40, '#7f8796', lt, 8.0, 9.0, 'center', 'enote');
  },
  // 9 · the landlords
  lt => { SEED = 1000;
    wsh(rect(-150, -40, 150, 60), '#c9ced8', lt, .4, .9, .5); mk(rect(-150, -40, 150, 60), lt, .2, .8); hw('ANTHROPIC', 0, 30, 64, C.k, lt, .4, 1.2, 'center', 'anth');
    wsh(rect(-420, -400, -110, -280), '#f6d360', lt, 1.6, 2.2, .5); mk(rect(-420, -400, -110, -280), lt, 1.4, 2.0); hw('AMAZON', -265, -320, 60, C.k, lt, 1.8, 2.5, 'center', 'amz');
    arrow(-60, -50, -230, -270, .15, lt, 2.0, 2.8, C.or); hw('≥ $110B', -20, -220, 76, C.or, lt, 2.6, 3.4, 'left', 'a110');
    wsh(rect(110, 280, 420, 400), '#8fb3e0', lt, 4.2, 4.8, .5); mk(rect(110, 280, 420, 400), lt, 4.0, 4.6); hw('GOOGLE', 265, 360, 60, C.k, lt, 4.4, 5.1, 'center', 'goo');
    arrow(60, 70, 230, 270, .15, lt, 4.6, 5.4, C.or); hw('≥ $114.5B', 20, 230, 76, C.or, lt, 5.2, 6.0, 'right', 'g114');
    hw('compute · used or not', 0, -470 + 900, 52, C.red, lt, 8.2, 9.2, 'center', 'used');
  },
  // 10 · the lockup test
  lt => { SEED = 1100; const open = eio(seg(lt, 3.2, 3.8));
    wsh(rect(-170, -30, 170, 230), C.or, lt, .8, 1.4, .55); mk(rect(-170, -30, 170, 230), lt, .2, 1.0);
    ctx.save(); ctx.translate(0, -60 * open); mk(circ(0, -30, 110, 130, .5, Math.PI), lt, .6, 1.3, C.k, 12); ctx.restore();
    mk(circ(0, 90, 18, 18, 1.05), lt, 1.2, 1.4, C.k, 6);
    hw('LOCKUP ENDS', 0, -320, 96, C.k, lt, 1.4, 2.4, 'center', 'lock');
    arrow(-60, 280, -280, 420, -.15, lt, 4.2, 4.8, C.red); hw('SELL', -330, 470, 80, C.red, lt, 4.6, 5.2, 'center', 'sell');
    arrow(60, 280, 280, 420, .15, lt, 5.0, 5.6, C.blue); hw('HOLD', 330, 470, 80, C.blue, lt, 5.4, 6.0, 'center', 'hold');
  },
];

// ---------- news package overlays ----------
function plate(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.transform(1, 0, -.18, 1, 0, 0);
  ctx.fillStyle = C.lemon; ctx.fillRect(-170, -48, 340, 96); ctx.restore();
  text('RELENTLESS', x, y + 14 * s, F.b8(46 * s), C.ink, 'center', 2 * s);
}
function bug() { plate(864, 132, .62); text('TIMES', 980, 196, F.b8(26), C.ink, 'right', 4); text('AI VOICE', 980, 224, F.mono(15), C.grey2, 'right', 3); }
const TABC = { 'ON THE RECORD': [C.paper, C.ink], CONTEXT: [C.paper, C.ink], ESTIMATE: [C.red, '#fff'], COMMENTARY: [C.lemon, C.ink] };
function strap(L, t) {
  if (!L.hl) return; const k = eo(seg(t, L.t0 + .1, L.t0 + .5)), out = 1 - eo(seg(t, L.t1 - .25, L.t1)), y = 1356, h = 104;
  if (k * out <= 0) return; ctx.save(); ctx.globalAlpha = out;
  const [tb, tf] = TABC[L.tab]; const tws = tw(L.tab, F.mono(20), 3) + 34;
  ctx.fillStyle = tb; ctx.fillRect(48, y - 44, tws * k, 40); if (k >= 1) text(L.tab, 65, y - 16, F.mono(20), tf, 'left', 3, 'tab');
  ctx.fillStyle = 'rgba(18,20,23,.92)'; ctx.fillRect(48, y, (W - 96) * k, h); ctx.fillStyle = C.lemon; ctx.fillRect(48, y, 10, h);
  if (k >= 1) { const s = fit(L.hl, 52, W - 150); text(L.hl, 80, y + 52 + s * .36, F.b8(s), '#fff', 'left', 1, 'hl'); }
  if (k >= 1 && L.src) { const s = fit('SOURCE: ' + L.src, 17, W - 120, 1.5, F.mono); ctx.fillStyle = 'rgba(244,241,232,.9)'; const ww = tw('SOURCE: ' + L.src, F.mono(s), 1.5) + 24; ctx.fillRect(W - 48 - ww, y + h, ww, 34); text('SOURCE: ' + L.src, W - 60, y + h + 24, F.mono(s), C.olive, 'right', 1.5, 'src'); }
  ctx.restore();
}
// burned subtitles: sentence by sentence, timed by word share
function captions(L, t) {
  if (!L.say || t < L.t0 || t > L.t0 + L.d + .25) return;
  const parts = L.say.match(/(?:[^.?!]|\.(?=\d)|(?<=Oct)\.)+[.?!]*/g).map(s => s.trim()).filter(Boolean), n = parts.map(p => p.split(' ').length), tot = n.reduce((a, b) => a + b, 0);
  let acc = 0, i = 0; for (; i < parts.length; i++) { acc += n[i] / tot * L.d; if (t - L.t0 < acc) break; } i = Math.min(i, parts.length - 1);
  const f = F.b6(42), lines = []; let ln = ''; for (const w of parts[i].split(' ')) { const s = ln ? ln + ' ' + w : w; if (tw(s, f) > 860 && ln) { lines.push(ln); ln = w; } else ln = s; } lines.push(ln);
  const y0 = 1600, lh = 54, bh = lines.length * lh + 30, bw = Math.max(...lines.map(l => tw(l, f))) + 70;
  ctx.fillStyle = 'rgba(250,249,244,.93)'; ctx.beginPath(); ctx.roundRect((W - bw) / 2, y0, bw, bh, 16); ctx.fill();
  ctx.fillStyle = C.or; ctx.fillRect((W - bw) / 2 + 20, y0 + 18, 6, bh - 36);
  lines.forEach((l, j) => text(l, W / 2 + 8, y0 + 54 + j * lh, f, C.k, 'center'));
}
function signoff(t) {
  const k = eo(seg(t, END + 1.2, END + 1.7)); if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = .9 * k; ctx.fillStyle = C.ink; ctx.fillRect(0, 1180, W, 420); ctx.restore();
  ctx.globalAlpha = k; text('THIS IS', 92, 1290, F.b8(64), '#fff', 'left', 2, 'so1');
  plate(420, 1400, 1.25); text('TIMES.', 760, 1420, F.b8(84), C.lemon, 'left', 2, 'so2');
  text('AI voice · Sources in the caption', 92, 1540, F.mono(24), C.gold, 'left', 1.5, 'so3'); ctx.globalAlpha = 1;
}
function render(t) {
  TX = []; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  board(t, cam(t));
  const vg = ctx.createLinearGradient(0, 1250, 0, H); vg.addColorStop(0, 'rgba(18,20,23,0)'); vg.addColorStop(1, 'rgba(18,20,23,.18)'); ctx.fillStyle = vg; ctx.fillRect(0, 1250, W, H - 1250);
  bug();
  for (const L of LINES) { strap(L, t); captions(L, t); }
  signoff(t);
}
// sound events: voice, a marker scratch while each region is drawn, a whoosh on each whip, stamps
const EV = [];
LINES.forEach((L, i) => { EV.push({ t: L.t0, type: 'vo', id: L.id }); if (i < 11) { EV.push({ t: L.t0 + .15, type: 'pen', d: Math.min(4.5, L.d) }); if (i) EV.push({ t: L.t0 - .3, type: 'whoosh' }); } });
EV.push({ t: LINES[1].t0 + 2.4, type: 'stamp' }, { t: LINES[8].t0 + 7.2, type: 'stamp' }, { t: END, type: 'whoosh' }, { t: END + 1.2, type: 'slap' });
window.CUES = LINES.filter(l => l.say).map(l => ({ t0: l.t0, t1: l.t0 + l.d + .25, text: l.say }));
window.EV = EV; window.DUR = DUR; window.render = render; window.TEXTS = t => { render(t); return TX.slice(); }; window.READY = true;
