// Relentless Times — style frames: ?frame=title (60s-spy cut-paper title as architecture) and ?frame=scene (pen & wash reportage sketch +
// cut-paper silhouette, under the Broadcast News Package layer). Package parts adapted from ../wings-clipped (from Lemo-Opuscar's news-package demo, MIT).
import { paper, ink, wash, bloom, palm, INK, VIOLET } from './sketch.js';
import { SPY, piece, walker } from './cutpaper.js';
const W = 1080, H = 1920, DUR = 6;
const cv = document.getElementById('out'), ctx = cv.getContext('2d');
const Q = new URLSearchParams(location.search), FRAME = Q.get('frame') || 'scene';
const C = { ink: '#121417', lemon: '#F2CF1D', lemonL: '#F8DE4A', lemonD: '#D8B30C', gold: '#D4B064', paper: '#F4F1E8', olive: '#6E5A1E', grey: '#C9CCD2' };
const F = { b8: s => `800 ${s}px Barlow`, b6: s => `600 ${s}px Barlow`, mono: s => `500 ${s}px Plex`, hand: s => `600 ${s}px Caveat` };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - x, 3), back = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
let TX = [];
function text(s, x, y, font, color, align = 'left', ls = 0, id = null) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = ls + 'px'; ctx.fillText(s, x, y);
  const w = ctx.measureText(s).width; ctx.letterSpacing = '0px';
  if (id) { const fs = parseInt(font.match(/ (\d+)px/)[1]), x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2; TX.push({ id, text: s, x0, y0: y - fs, x1: x0 + w, y1: y + 8 }); }
  return w;
}
const tw = (s, font, ls = 0) => { ctx.font = font; ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; };
const fit = (s, size, maxW, ls = 0, f = F.b8) => Math.floor(Math.min(size, size * maxW / tw(s, f(size), ls)));

// ———————— news-package parts (base style) ————————
function plate(cx, cy, s) {
  const w = 520 * s, h = 180 * s, k = h * .28; ctx.save(); ctx.translate(cx, cy);
  const path = new Path2D(); path.moveTo(-w / 2 + k, -h / 2); path.lineTo(w / 2 + k, -h / 2); path.lineTo(w / 2 - k, h / 2); path.lineTo(-w / 2 - k, h / 2); path.closePath();
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, C.lemonL); g.addColorStop(1, C.lemonD); ctx.fillStyle = g; ctx.fill(path); ctx.save(); ctx.clip(path);
  const gx = -w / 2 - k; ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(gx + 2 * k, -h / 2); ctx.lineTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.lineTo(gx, h / 2); ctx.fill();
  ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + 2 * k + w * .11, -h / 2); ctx.lineTo(gx + w * .11, h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.fill();
  ctx.font = F.b8(100); const fsz = Math.min(h * .62, 100 * w * .7 / ctx.measureText('RELENTLESS').width); text('RELENTLESS', -w * .3, fsz * .36, F.b8(fsz), C.ink);
  ctx.restore(); ctx.restore();
}
function bug(dark) { plate(880, 140, .36); text('REPORT', 790, 152, F.b8(28), dark ? '#FFFFFF' : C.ink, 'right', 3); }
function strap(tab, hl, sub) {
  const x0 = 48, ty = 1352, by = 1400, bh = 108, bw = 864;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x0 + 8, by + 8, bw + 120, bh);
  ctx.fillStyle = C.paper; ctx.fillRect(x0, by, bw, bh); ctx.strokeStyle = 'rgba(18,20,23,.5)'; ctx.lineWidth = 2; ctx.strokeRect(x0, by, bw, bh);
  ctx.fillStyle = C.lemon; ctx.fillRect(x0, by, 14, bh);
  ctx.fillStyle = C.ink; ctx.fillRect(x0 + bw, by, 120, bh); ctx.fillStyle = C.lemon; ctx.fillRect(x0 + bw, by, 120, 6); text('RR', x0 + bw + 60, by + 72, F.b8(48), C.lemon, 'center', 2);
  text(hl, x0 + 36, by + 58, F.b8(fit(hl, 48, bw - 60, 1)), C.ink, 'left', 1, 'strap'); text(sub, x0 + 38, by + 92, F.b6(fit(sub, 24, bw - 60, 1.5, F.b6)), C.olive, 'left', 1.5, 'strape');
  const tw0 = 40 + tw(tab, F.b8(30), 2); ctx.fillStyle = C.paper; ctx.fillRect(x0, ty, tw0, by - ty); ctx.fillStyle = C.lemon; ctx.fillRect(x0, ty, 8, by - ty); text(tab, x0 + 20, ty + 37, F.b8(30), C.ink, 'left', 2);
}
function tag(a, b) { const x = 48, y = 210, h = 64, w = 470; ctx.fillStyle = 'rgba(18,20,23,.85)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = C.gold; ctx.fillRect(x, y, 8, h); text(a, x + 26, y + 28, F.mono(18), C.gold, 'left', 2, 'tag'); text(b, x + 26, y + 54, F.b6(24), '#fff', 'left', 1, 'tag2'); }
function stamp(x, y, word, sk, rot = -.1) {
  if (sk <= 0) return; const s = 1 + .9 * (1 - eo(sk)), w = tw(word, F.b8(56), 4) + 90;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = clamp(sk * 3);
  ctx.fillStyle = 'rgba(18,20,23,.94)'; ctx.fillRect(-w / 2, -56, w, 112); ctx.strokeStyle = C.lemon; ctx.lineWidth = 4; ctx.strokeRect(-w / 2 + 10, -46, w - 20, 92); ctx.lineWidth = 1.5; ctx.strokeRect(-w / 2 + 18, -38, w - 36, 76);
  text(word, 0, 20, F.b8(56), C.lemon, 'center', 4, 'stamp'); ctx.restore();
}

// ———————— scene: the arrest, sketched on location ————————
function sceneArrest(t) {
  paper(ctx, W, H);
  const draw = k => clamp(t * .7 - k);             // stroke-order draw-on: later strokes start later
  const bl = 1400 * eo(seg(t, 1.2, 3.4));            // colour arrives after the line
  // sky + building washes, revealed through the colour-arrival front from the terminal's doors
  bloom(ctx, 560, 960, bl, 7, () => {
    wash(ctx, [[0, 300], [1080, 300], [1080, 760], [0, 820]], '#9FBCD6', { alpha: .38, seed: 1, amp: 8 });
    wash(ctx, [[740, 470], [820, 470], [826, 900], [736, 900]], '#C9C3B6', { alpha: .55, seed: 2 });
    wash(ctx, [[60, 860], [1030, 830], [1040, 1040], [52, 1050]], '#D8C6A0', { alpha: .55, seed: 3 });
    wash(ctx, [[60, 930], [1036, 905], [1038, 960], [58, 985]], '#7FA6B8', { alpha: .6, seed: 4 });
    wash(ctx, [[660, 860], [1030, 830], [1040, 1040], [650, 1046]], VIOLET, { alpha: .28, seed: 5 });
    wash(ctx, [[120, 660], [290, 790], [300, 860], [140, 860]], '#D7D2C7', { alpha: .5, seed: 6 });
    wash(ctx, [[0, 1050], [1080, 1040], [1080, 1330], [0, 1330]], '#B8B0A0', { alpha: .3, seed: 8, amp: 10 });
  });
  // ink
  ink(ctx, [[0, 1048], [1080, 1036]], { seed: 11, w: 2.8, prog: draw(0) });
  ink(ctx, [[60, 860], [300, 845], [560, 836], [820, 831], [1032, 828]], { seed: 12, w: 3, prog: draw(.1) });       // terminal roofline
  ink(ctx, [[40, 860], [200, 812], [420, 796], [640, 794], [860, 806], [1050, 836]], { seed: 13, w: 2.4, prog: draw(.2) });   // curved canopy
  ink(ctx, [[60, 860], [56, 1050]], { seed: 14, prog: draw(.25) }); ink(ctx, [[1032, 828], [1040, 1040]], { seed: 15, prog: draw(.25) });
  ink(ctx, [[60, 930], [560, 916], [1036, 905]], { seed: 16, w: 1.8, prog: draw(.3) }); ink(ctx, [[58, 985], [560, 972], [1038, 960]], { seed: 17, w: 1.8, prog: draw(.35) });
  for (let i = 0; i < 16; i++) { const x = 90 + i * 60 + hash(i) * 10; ink(ctx, [[x, 932 - i * .7], [x + 2, 980 - i * .7]], { seed: 20 + i, w: 1.4, over: 2, prog: draw(.45 + i * .02) }); }
  ink(ctx, [[740, 900], [744, 520], [736, 470], [826, 470], [818, 520], [826, 900]], { seed: 40, w: 2.4, prog: draw(.4) });   // control tower
  ink(ctx, [[726, 470], [780, 430], [836, 470]], { seed: 41, w: 2.4, prog: draw(.5) }); ink(ctx, [[780, 430], [782, 380]], { seed: 42, w: 1.8, prog: draw(.55) });
  ink(ctx, [[150, 860], [124, 660], [290, 790], [300, 860]], { seed: 43, w: 2.4, prog: draw(.5) });   // a tail fin behind the terminal, no livery
  ink(ctx, [[600, 1048], [690, 1100], [700, 1180]], { seed: 44, w: 1.6, prog: draw(.6) });        // a kerb line
  const pc = seg(t, 1.6, 3.2); palm(ctx, 160, 1048, 470, 50, draw(.6), pc); palm(ctx, 950, 1040, 440, 60, draw(.7), pc);
  // the handwritten note on the page
  ctx.save(); ctx.globalAlpha = clamp((t - 1.6) * 2); ctx.translate(640, 1286); ctx.rotate(-.03);
  text('MIA arrivals · 23 Oct 2026', 0, 0, F.hand(40), INK, 'left', 0, 'hand'); ctx.restore();
  // the cut-paper silhouette walks in (a flat opaque piece on top of the sketch)
  const ph = Math.floor(t * 12) / 12 * .9;
  walker(ctx, lerp(150, 430, clamp(t / 5)), 1300, 470, ph, { gap: '#F1E8D6' });
  // package layer
  ctx.fillStyle = 'rgba(18,20,23,.9)'; ctx.fillRect(0, 290, W, 80);
  ctx.fillStyle = C.lemon; ctx.fillRect(60, 320, 10, 28); text('FRIDAY, OCTOBER 23, 2026 · MIAMI', 86, 342, F.mono(24), C.gold, 'left', 3, 'eye');
  tag('SKETCH', 'Illustration, not a photo');
  bug(false);
  stamp(800, 640, 'ARRESTED', eo(seg(t, 3.6, 3.76)));
  strap('ON THE RECORD', 'ARRESTED AT MIAMI INTERNATIONAL AIRPORT', 'ON A FLAGLER COUNTY WARRANT · FRIDAY, OCT 23, 2026');
  ctx.globalAlpha = .82; text('SOURCE: NEWS4JAX · FLAGLERLIVE', 1032, 1334, F.mono(15), C.olive, 'right', 1.5, 'src'); ctx.globalAlpha = 1;
}

// ———————— title: the headline is the set (60s-spy cut paper) ————————
function cutLetters(str, x, y, size, col, ground, seed, k = 1) {
  ctx.font = F.b8(size); let cx = x;
  [...str].forEach((ch, i) => {
    const w = ctx.measureText(ch).width, land = clamp(k * str.length - i), dy = (1 - eo(land)) * -size * .8;
    if (land > 0) {
      ctx.save(); ctx.translate(cx + w / 2, y + dy + (hash(seed + i) - .5) * 3); ctx.rotate((hash(seed + i * 3) - .5) * .028);
      ctx.font = F.b8(size); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = clamp(land * 3);
      ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 5; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 4;
      ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = ground; ctx.strokeText(ch, 0, 0); ctx.shadowColor = 'transparent';
      ctx.fillStyle = col; ctx.fillText(ch, 0, 0); ctx.restore();
    }
    cx += w * .98;
  });
  TX.push({ id: 'cut' + str, text: str, x0: x, y0: y - size, x1: cx, y1: y + 8 });
  return cx;
}
function titleCard(t) {
  ctx.fillStyle = SPY.black; ctx.fillRect(0, 0, W, H);
  const ptex = () => { ctx.save(); ctx.globalAlpha = .06; for (let i = 0; i < 1600; i++) { ctx.fillStyle = hash(i) > .5 ? '#fff' : '#000'; ctx.fillRect(hash(i * 3) * W, hash(i * 7) * H, 2, 2); } ctx.restore(); };
  // the set: a red runway band cut across the frame
  piece(ctx, 'band', [[-40, 1210], [1120, 1090], [1120, 1260], [-40, 1380]], SPY.red, [1, 0, 0, 1, 0, 0], { gap: SPY.black, amp: 2.2 });
  // the headline stacked like a skyline, each line a building
  const k = l => seg(t, .2 + l * .35, .7 + l * .35);
  cutLetters('HER', 70, 620, 250, SPY.cream, SPY.black, 1, k(0));
  cutLetters('WINGS', 70, 860, 250, SPY.cream, SPY.black, 2, k(1));
  cutLetters('WERE', 70, 1100, 250, SPY.lemon, SPY.black, 3, k(2));
  cutLetters('CLIPPED', 70, 1340, 250, SPY.cream, SPY.red, 4, k(3));
  // a cut-paper jet crosses above the headline; its wing is snipped off at the stab (stop-time)
  const jx = lerp(-300, 1300, clamp((t - .4) / 4)), jy = 380 - (jx - 500) * .12;
  const M = [1, 0, 0, 1, jx, jy];
  piece(ctx, 'jet', [[-150, 0], [120, -10], [170, 6], [120, 22], [-150, 18]], SPY.cream, M, { gap: SPY.black });
  piece(ctx, 'tail', [[-150, 0], [-180, -60], [-130, -60], [-100, 2]], SPY.cream, M, { gap: SPY.black });
  const snip = t > 2.4;
  piece(ctx, 'wingL', [[-10, 14], [40, 14], [-40, 90], [-80, 90]], SPY.cream, snip ? [1, 0, 0, 1, jx - 20, jy + 60 + (t - 2.4) * 260] : M, { gap: SPY.black });
  piece(ctx, 'wingR', [[0, 2], [50, 2], [-20, -60], [-60, -60]], SPY.red, M, { gap: SPY.black });
  // a silhouette walks the top of WERE with a lemon case
  walker(ctx, lerp(680, 880, clamp(t / 5)), 1096, 300, Math.floor(t * 12) / 12 * .9, { ink: SPY.cream, gap: SPY.black, accent: SPY.red, caseCol: SPY.lemon });
  ptex();
  text('THE RELENTLESS REPORT · CRIME', 70, 1500, F.mono(26), SPY.lemon, 'left', 4, 'credit');
  text('FLAGLER COUNTY, FLORIDA', 70, 1550, F.mono(26), SPY.cream, 'left', 4, 'credit2');
  bug(true);
}

function render(t) { TX = []; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; if (FRAME === 'title') titleCard(t); else sceneArrest(t); }
await document.fonts.ready; for (const f of [F.b8(40), F.b6(40), F.mono(20), F.hand(40)]) await document.fonts.load(f);
window.DUR = DUR; window.render = render; window.TEXTS = t => { render(t); return TX.slice(); }; window.READY = true;
