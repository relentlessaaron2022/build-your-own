// 20 effects on one talking-head clip. Each effect fires on the word that names it (word times from the transcript).
// Source: 720×1280 @ 30 fps as frames/fNNNN.jpg + person masks masks/fNNNN.png (alpha) + head track track.json. Output 1080×1920.
import { clamp, lerp, seg, ss, eo, ei, eio, back, hash } from '/core/lib.js';

const W = 1080, H = 1920, SW = 720, SH = 1280, SC = W / SW, FPS = 30, NF = 1020;
const cv = document.getElementById('c'), g = cv.getContext('2d');
await document.fonts.ready;
for (const f of ['64px Anton', '600 40px Inter', '800 40px Inter', '30px "JetBrains Mono"']) await document.fonts.load(f);
const TRACK = await (await fetch('track.json')).json();
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

// ——— frames, masks, cutouts (small cache) ———
const CACHE = new Map();
async function bmp(url) { const r = await fetch(url); if (!r.ok) throw new Error('missing ' + url); return createImageBitmap(await r.blob()); }
async function load(i) {
  i = clamp(i, 0, NF - 1);
  if (CACHE.has(i)) return CACHE.get(i);
  const n = String(i + 1).padStart(4, '0');
  const [img, mk] = await Promise.all([bmp(`frames/f${n}.jpg`), bmp(`masks/f${n}.png`)]);
  const [pc, pg] = canvas(SW, SH); pg.drawImage(img, 0, 0); pg.globalCompositeOperation = 'destination-in'; pg.drawImage(mk, 0, 0);
  const [wc, wg] = canvas(SW, SH); wg.drawImage(mk, 0, 0);
  const F = { img, mk, person: pc, white: wc, head: TRACK[i] };
  CACHE.set(i, F); if (CACHE.size > 14) CACHE.delete(CACHE.keys().next().value);
  return F;
}

// ——— drawing helpers ———
function vid(im, s = SC, ox = 0, oy = 0, c = g) { c.drawImage(im, ox, oy, SW * s, SH * s); }
// zoom z on source point (fx, fy), placed at (px, py), clamped so the frame still covers the canvas
function place(z, fx, fy, px = W / 2, py = H / 2, clampIt = true) {
  const s = SC * z; let ox = px - fx * s, oy = py - fy * s;
  if (clampIt) { ox = clamp(ox, W - SW * s, 0); oy = clamp(oy, H - SH * s, 0); }
  return [s, ox, oy];
}
function base(F, z = 1, dy = -60) { const [s, ox, oy] = place(z, F.head[0], F.head[1] + dy); vid(F.img, s, ox, oy); return [s, ox, oy]; }
function dim(a, col = '0,0,0') { g.fillStyle = `rgba(${col},${a})`; g.fillRect(0, 0, W, H); }
function blurred(F, px = 28, a = .55) { g.save(); g.filter = `blur(${px}px)`; vid(F.img, SC * 1.15, -81, -144); g.restore(); dim(a); }
function rrect(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function shadow(b = 40, y = 18, a = .45) { g.shadowColor = `rgba(0,0,0,${a})`; g.shadowBlur = b; g.shadowOffsetY = y; g.shadowOffsetX = 0; }
function noShadow() { g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0; }
function text(s, x, y, font, fill, o = {}) {
  g.save(); g.font = font; g.textAlign = o.align || 'center'; g.textBaseline = o.base || 'middle';
  if (o.rot) { g.translate(x, y); g.rotate(o.rot); x = 0; y = 0; }
  if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.sw || 12; g.strokeStyle = o.stroke; g.strokeText(s, x, y); }
  g.fillStyle = fill; g.fillText(s, x, y); g.restore();
}
function check(x, y, r, k = 1, col = '#22C55E') {   // a round green tick that pops
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.scale(k, k); g.fillStyle = col; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = r * .28; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(-r * .45, 0); g.lineTo(-r * .1, r * .36); g.lineTo(r * .5, -r * .38); g.stroke(); g.restore();
}
const pop = (lt, d = .28) => lt <= 0 ? 0 : back(clamp(lt / d, 0, 1), 1.8);
const st12 = t => Math.floor(t * 12) / 12;

// ——— timeline: effect name → start (word onset), each runs to the next start ———
const NAMES = ['Orbit', 'Chat takeover', 'Frame escape', 'Snap zoom', 'Checklist pop', 'Headline storm', 'Zoom portal', 'Growth curve', 'Studio reveal', 'B-roll overlay',
  'Paper cutout', 'Dolly zoom', 'Magazine cover', 'Liquid glass', 'Zoom through cup', 'Green screen', 'Frame break', 'Digital zoom', 'Phone mockup', 'Checklist'];
const STARTS = [2.96, 3.9, 5.42, 6.64, 7.66, 9.02, 10.68, 12.04, 13.34, 14.80, 16.30, 17.86, 19.16, 20.44, 21.90, 23.58, 24.86, 26.20, 27.64, 28.96];
const OUTRO = 30.44, ENDCARD = 32.30, DUR = 34.0;
const SEGS = STARTS.map((t0, k) => ({ k, name: NAMES[k], t0, t1: STARTS[k + 1] ?? OUTRO }));

// ——— the label: "07  ZOOM PORTAL" ———
function badge(k, lt, y = k === 12 ? 1770 : 200) {
  const sc = pop(lt, .25); if (sc <= 0) return;
  const num = String(k + 1).padStart(2, '0'), name = NAMES[k].toUpperCase();
  g.save(); g.font = '60px Anton'; const w = g.measureText(num).width + g.measureText(name).width + 110;
  g.translate(W / 2, y); g.scale(sc, sc); shadow(30, 10, .5);
  g.fillStyle = 'rgba(10,10,12,.88)'; rrect(-w / 2, -54, w, 108, 54); g.fill(); noShadow();
  g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = '#FACC15'; g.fillText(num, -w / 2 + 40, 4);
  g.fillStyle = '#fff'; g.fillText(name, -w / 2 + 70 + g.measureText(num).width, 4);
  g.restore();
}

// ════════════════════ the 20 effects ════════════════════
const FX = [];

// 01 Orbit: the shot becomes a card that circles the frame and lands back full-screen
FX[0] = (F, lt, u) => {
  blurred(F, 30, .5);
  const a = Math.PI * 2 * eio(clamp(u / .85, 0, 1)), land = ss(seg(u, .78, 1));
  const cx = 540 + Math.sin(a) * 250, cy = 980 - Math.sin(a * 2) * 40, depth = .86 + .14 * Math.cos(a);
  const k = lerp(.62 * depth, 1, land), sx = lerp(.72 + .28 * Math.abs(Math.cos(a)), 1, land), tilt = lerp(Math.sin(a) * .1, 0, land);
  // orbit ring (behind)
  g.save(); g.strokeStyle = 'rgba(167,139,250,.55)'; g.lineWidth = 6; g.setLineDash([2, 22]); g.lineCap = 'round';
  g.beginPath(); g.ellipse(540, 1000, 330, 120, 0, Math.PI, Math.PI * 2); g.stroke(); g.restore();
  g.save(); g.translate(cx, cy); g.rotate(tilt); g.scale(k * sx, k); shadow(60, 30, .55);
  rrect(-W / 2, -H / 2, W, H, 60 * (1 - land)); g.fillStyle = '#000'; g.fill(); noShadow(); g.clip();
  const [s, ox, oy] = place(1, F.head[0], F.head[1] - 60); vid(F.img, s, ox - W / 2, oy - H / 2); g.restore();
  g.save(); g.strokeStyle = 'rgba(167,139,250,.55)'; g.lineWidth = 6; g.setLineDash([2, 22]); g.lineCap = 'round';
  g.beginPath(); g.ellipse(540, 1000, 330, 120, 0, 0, Math.PI); g.stroke(); g.restore();
};

// 02 Chat takeover: the screen dims and a chat thread takes over
const CHAT = [['me', 'add all 20 effects to this video'], ['ai', 'On it. Building every one as code.'], ['me', 'chat takeover?'], ['ai', "You're looking at it."]];
FX[1] = (F, lt) => {
  base(F); dim(.45 * ss(seg(lt, 0, .2)));
  let y = 1780; const items = [];
  CHAT.forEach(([who, msg], i) => { const t0 = .08 + i * .3; if (lt >= t0) items.push([who, msg, lt - t0]); });
  for (let i = items.length - 1; i >= 0; i--) {
    const [who, msg, a] = items[i]; g.font = '600 44px Inter';
    const tw = g.measureText(msg).width, w = Math.min(820, tw + 72), h = 104, x = who === 'me' ? W - 60 - w : 60;
    y -= h + 22; const sc = pop(a, .22);
    g.save(); g.translate(x + (who === 'me' ? w : 0), y + h); g.scale(sc, sc); g.translate(-(x + (who === 'me' ? w : 0)), -(y + h));
    shadow(24, 8, .35); rrect(x, y, w, h, 46); g.fillStyle = who === 'me' ? '#2F7CF6' : '#E9E9EB'; g.fill(); noShadow();
    g.fillStyle = who === 'me' ? '#fff' : '#111'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(msg, x + 36, y + h / 2 + 2); g.restore();
  }
};

// 03 Frame escape: the shot shrinks into a framed photo and he leans out over its edge
FX[2] = (F, lt) => {
  const v = eo(clamp(lt / .3, 0, 1));
  g.fillStyle = '#121216'; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(540, 900, 50, 540, 900, 1100); gr.addColorStop(0, 'rgba(124,58,237,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const R = [lerp(0, 150, v), lerp(0, 700, v), lerp(W, 780, v), lerp(H, 980, v)];
  const z = lerp(1, .9, v), [s, ox, oy] = place(z, F.head[0], F.head[1], 540, lerp(900, 640, v), false);
  g.save(); shadow(50, 26, .6); g.fillStyle = '#fff'; g.fillRect(R[0] - 18, R[1] - 18, R[2] + 36, R[3] + 36); noShadow();
  g.beginPath(); g.rect(R[0], R[1], R[2], R[3]); g.clip(); g.fillStyle = '#000'; g.fillRect(R[0], R[1], R[2], R[3]); vid(F.img, s, ox, oy); g.restore();
  if (v > .5) { g.save(); g.globalAlpha = ss(seg(v, .5, 1)); g.beginPath(); g.rect(0, 0, W, R[1] + R[3] * .45); g.clip(); shadow(30, 14, .5); vid(F.person, s, ox, oy); g.restore(); }
};

// 04 Snap zoom: a hard punch-in on the face with a motion-smear, then snap back
FX[3] = (F, lt) => {
  const zin = eo(clamp(lt / .09, 0, 1)), zout = ei(clamp((lt - .72) / .09, 0, 1)), z = 1 + .95 * zin * (1 - zout);
  const moving = (lt < .1) || (lt > .7 && lt < .83);
  if (moving) { for (let k = 3; k >= 1; k--) { g.save(); g.globalAlpha = .28; const [s, ox, oy] = place(z * (1 - k * .05), F.head[0], F.head[1] - 40); vid(F.img, s, ox, oy); g.restore(); } }
  const [s, ox, oy] = place(z, F.head[0], F.head[1] - 40); g.save(); g.globalAlpha = moving ? .7 : 1; vid(F.img, s, ox, oy); g.restore();
  if (lt < .05) dim(.55 * (1 - lt / .05), '255,255,255');
};

// 05 Checklist pop: a checklist card pops in and ticks off what we've done so far
const CL5 = ['Orbit', 'Chat takeover', 'Frame escape', 'Snap zoom', 'Checklist pop'];
FX[4] = (F, lt) => {
  base(F); const sc = pop(lt, .25); if (sc <= 0) return;
  const x = 360, y = 1110, w = 660, h = 620;
  g.save(); g.translate(x + w, y + h); g.scale(sc, sc); g.translate(-(x + w), -(y + h));
  shadow(50, 20, .45); rrect(x, y, w, h, 40); g.fillStyle = 'rgba(255,255,255,.96)'; g.fill(); noShadow();
  text('TO-DO', x + 50, y + 70, '800 40px Inter', '#111', { align: 'left' });
  CL5.forEach((s, i) => { const yy = y + 160 + i * 96; const on = lt - (.25 + i * .17);
    g.strokeStyle = '#D4D4D8'; g.lineWidth = 5; g.beginPath(); g.arc(x + 80, yy, 30, 0, 7); g.stroke();
    check(x + 80, yy, 32, pop(on, .2)); text(s, x + 140, yy + 2, '600 42px Inter', on > 0 ? '#111' : '#9CA3AF', { align: 'left' });
    if (on > .15) { g.strokeStyle = '#111'; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 140, yy + 2); g.lineTo(x + 140 + g.measureText(s).width * Math.min(1, (on - .15) / .2) * 1.05, yy + 2); g.stroke(); } });
  g.restore();
};

// 06 Headline storm: news headlines slam in from both sides
const HEAD = [['BREAKING', '#DC2626', '#fff'], ['CLAUDE EDITS VIDEO', '#FACC15', '#111'], ['NO AFTER EFFECTS', '#fff', '#111'], ['20 EFFECTS. ONE PROMPT.', '#111', '#fff'],
  ['ZERO EDITING APPS', '#DC2626', '#fff'], ['BUILT AS CODE', '#FACC15', '#111'], ['RELENTLESS', '#fff', '#DC2626']];
FX[5] = (F, lt) => {
  let shake = 0; HEAD.forEach((_, i) => { const d = lt - i * .2; if (d > .12 && d < .3) shake += 10 * Math.exp(-(d - .12) * 25); });
  g.save(); g.translate((hash(Math.floor(lt * 30)) - .5) * shake, (hash(Math.floor(lt * 30) + 7) - .5) * shake); base(F, 1.05); g.restore(); dim(.4);
  HEAD.forEach(([s, bg, fg], i) => { const d = lt - i * .2; if (d < 0) return;
    const side = i % 2 ? 1 : -1, p = eo(clamp(d / .14, 0, 1)), rot = (hash(i * 3.3) - .5) * .16, y = 420 + i * 190 + (hash(i) - .5) * 40;
    g.save(); g.font = '76px Anton'; const w = g.measureText(s).width + 70; g.translate(540 + side * (1 - p) * 1400, y); g.rotate(rot); shadow(24, 10, .5);
    g.fillStyle = bg; g.fillRect(-w / 2, -58, w, 116); noShadow(); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, 4); g.restore(); });
};

// 07 Zoom portal: a glowing ring opens on the face and the camera flies through it
FX[6] = (F, lt, u) => {
  const [hx, hy] = F.head, r = lerp(150, 1500, ei(seg(u, .25, 1))), z = lerp(1, 1.7, eio(seg(u, .1, 1)));
  const [s0, ox0, oy0] = place(1, hx, hy - 40); const px = ox0 + hx * s0, py = oy0 + hy * s0;
  blurred(F, 18, .6);
  g.save(); g.beginPath(); g.arc(px, py, r, 0, 7); g.clip(); const [s, ox, oy] = place(z, hx, hy, px, py, false); vid(F.img, s, ox, oy); g.restore();
  for (let k = 0; k < 3; k++) { g.save(); g.strokeStyle = ['#A78BFA', '#22D3EE', '#F472B6'][k]; g.globalAlpha = .8; g.lineWidth = 14 - k * 4; g.shadowColor = g.strokeStyle; g.shadowBlur = 40;
    g.beginPath(); g.arc(px, py, r + k * 16, lt * 6 + k, lt * 6 + k + Math.PI * 1.6); g.stroke(); g.restore(); }
  for (let i = 0; i < 26; i++) { const a = hash(i) * 7 + lt * (2 + hash(i * 3)), d = r + 30 + hash(i * 5) * 120; g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(px + Math.cos(a) * d, py + Math.sin(a) * d, 3 + hash(i * 9) * 4, 0, 7); g.fill(); }
};

// 08 Growth curve: a chart draws itself up and to the right over the shot
FX[7] = (F, lt, u) => {
  base(F); dim(.5);
  const x0 = 110, x1 = 970, y0 = 1720, y1 = 980, p = eio(clamp(u / .8, 0, 1));
  g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 2; for (let i = 0; i <= 5; i++) { const y = lerp(y0, y1, i / 5); g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
  const pt = v => [lerp(x0, x1, v), y0 - (y0 - y1) * (Math.pow(v, 2.6) * .92 + v * .08)], N = 60, n = Math.max(1, Math.round(N * p));
  g.save(); g.beginPath(); g.moveTo(x0, y0); for (let i = 0; i <= n; i++) g.lineTo(...pt(i / N)); g.lineTo(pt(n / N)[0], y0); g.closePath();
  const gr = g.createLinearGradient(0, y1, 0, y0); gr.addColorStop(0, 'rgba(34,197,94,.45)'); gr.addColorStop(1, 'rgba(34,197,94,0)'); g.fillStyle = gr; g.fill();
  g.beginPath(); for (let i = 0; i <= n; i++) { const q = pt(i / N); i ? g.lineTo(...q) : g.moveTo(...q); }
  g.strokeStyle = '#4ADE80'; g.lineWidth = 14; g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = '#22C55E'; g.shadowBlur = 30; g.stroke(); g.restore();
  const e = pt(n / N); g.fillStyle = '#fff'; g.beginPath(); g.arc(e[0], e[1], 16, 0, 7); g.fill();
  text('+' + Math.round(1000 * Math.pow(p, 2)).toLocaleString('en-US') + '%', 540, 860, '120px Anton', '#4ADE80', { stroke: '#052e16', sw: 14 });
};

// 09 Studio reveal: a wipe swaps the room for a lit studio set behind him
function studio(t) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0B0B10'); gr.addColorStop(.6, '#1B1B24'); gr.addColorStop(1, '#09090C'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const spot = g.createRadialGradient(540, 820, 60, 540, 820, 820); spot.addColorStop(0, 'rgba(255,240,220,.35)'); spot.addColorStop(1, 'rgba(255,240,220,0)'); g.fillStyle = spot; g.fillRect(0, 0, W, H);
  for (const [x, a] of [[120, .35], [960, -.35]]) { g.save(); g.translate(x, -40); g.rotate(a); const cg = g.createLinearGradient(0, 0, 0, 1500); cg.addColorStop(0, 'rgba(255,255,255,.28)'); cg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = cg; g.beginPath(); g.moveTo(-50, 0); g.lineTo(50, 0); g.lineTo(320, 1500); g.lineTo(-320, 1500); g.fill(); g.fillStyle = '#2a2a33'; g.fillRect(-80, -40, 160, 70); g.restore(); }
  g.fillStyle = '#0d0d12'; g.fillRect(0, 1560, W, 360); g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 1560); g.lineTo(W, 1560); g.stroke();
}
FX[8] = (F, lt, u) => {
  const wx = W * eo(clamp(lt / .45, 0, 1)), [s, ox, oy] = place(1, F.head[0], F.head[1] - 60);
  vid(F.img, s, ox, oy);
  g.save(); g.beginPath(); g.rect(0, 0, wx, H); g.clip(); studio(lt); shadow(60, 0, .7); g.shadowColor = 'rgba(255,240,220,.35)'; vid(F.person, s, ox, oy); g.restore();
  if (wx < W) { g.fillStyle = '#fff'; g.fillRect(wx - 6, 0, 12, H); }
  if (lt > .45 && lt < .6) dim(.3 * (1 - (lt - .45) / .15), '255,255,255');
};

// 10 B-roll overlay: a code-editor B-roll panel drops in over the top of the shot
const CODE = ['export function orbit(t) {', '  const a = t * Math.PI * 2;', '  card.x = 540 + Math.sin(a) * 250;', '  card.tilt = Math.sin(a) * 0.1;', '  return draw(card);', '}', '', '// 20 effects. 0 editing apps.'];
FX[9] = (F, lt) => {
  base(F, 1, 120);
  const p = eo(clamp(lt / .3, 0, 1)), x = 60, w = 960, h = 640, y = lerp(-700, 300, p);
  g.save(); shadow(50, 24, .6); rrect(x, y, w, h, 34); g.fillStyle = '#1E1E24'; g.fill(); noShadow(); g.clip();
  g.fillStyle = '#2A2A33'; g.fillRect(x, y, w, 70); [['#FF5F57', 0], ['#FEBC2E', 1], ['#28C840', 2]].forEach(([c, i]) => { g.fillStyle = c; g.beginPath(); g.arc(x + 50 + i * 44, y + 35, 13, 0, 7); g.fill(); });
  text('effects.js', x + w / 2, y + 37, '600 30px Inter', '#9CA3AF');
  const chars = Math.floor(Math.max(0, lt - .25) * 70); let left = chars;
  CODE.forEach((line, i) => { const yy = y + 130 + i * 62; text(String(i + 1), x + 50, yy, '30px "JetBrains Mono"', '#4B5563', { align: 'right' });
    const shown = line.slice(0, Math.max(0, left)); left -= line.length + 1;
    const col = line.startsWith('//') ? '#6B7280' : line.includes('function') || line.includes('return') ? '#C084FC' : '#E5E7EB';
    text(shown, x + 80, yy, '30px "JetBrains Mono"', col, { align: 'left' });
    if (left < 0 && left > -line.length - 2 && Math.floor(lt * 4) % 2 === 0) { g.font = '30px "JetBrains Mono"'; g.fillStyle = '#FACC15'; g.fillRect(x + 82 + g.measureText(shown).width, yy - 18, 16, 36); } });
  g.restore();
  g.save(); g.fillStyle = '#DC2626'; rrect(x + w - 190, y + h - 66, 160, 46, 10); g.fill(); text('B-ROLL', x + w - 110, y + h - 42, '30px Anton', '#fff'); g.restore();
};

// 11 Paper cutout: he becomes a stop-motion paper cut-out on craft paper
const [paperC, paperG] = canvas(W, H);
{ paperG.fillStyle = '#C9A46C'; paperG.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) { paperG.fillStyle = `rgba(${hash(i) > .5 ? '255,240,210' : '80,50,20'},${.05 + hash(i * 3) * .07})`; paperG.fillRect(hash(i * 7) * W, hash(i * 11) * H, 1 + hash(i * 5) * 3, 1 + hash(i * 13) * 3); }
  paperG.fillStyle = 'rgba(120,70,30,.25)'; for (let y = 40; y < H; y += 48) for (let x = (y / 48 % 2) * 24; x < W; x += 48) { paperG.beginPath(); paperG.arc(x, y, 7, 0, 7); paperG.fill(); } }
FX[10] = (F, lt) => {
  g.drawImage(paperC, 0, 0);
  const tq = st12(lt), rot = (hash(Math.floor(tq * 12)) - .5) * .05, jx = (hash(Math.floor(tq * 12) + 3) - .5) * 10, inn = eo(clamp(lt / .3, 0, 1));
  const [s, ox, oy] = place(.92, F.head[0], F.head[1], 540, 820 + (1 - inn) * 900, false);
  g.save(); g.translate(540 + jx, 1100); g.rotate(rot); g.translate(-540, -1100);
  g.save(); shadow(26, 18, .45); vid(F.white, s, ox + 8, oy + 8); g.restore();
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; vid(F.white, s, ox + Math.cos(a) * 16, oy + Math.sin(a) * 16); }
  vid(F.person, s, ox, oy); g.restore();
  g.save(); g.globalAlpha = .15; g.drawImage(paperC, 0, 0); g.restore();
};

// 12 Dolly zoom: he holds his size while the room behind him pulls away (vertigo)
FX[11] = (F, lt, u) => {
  const p = eio(u), zf = 1.7, zb = lerp(1.7, 1.0, p);
  const [sb, oxb, oyb] = place(zb, F.head[0], F.head[1], 540, 760); g.save(); g.filter = 'blur(2px)'; vid(F.img, sb, oxb, oyb); g.restore();
  const [s, ox, oy] = place(zf, F.head[0], F.head[1], 540, 760, false); shadow(40, 0, .5); vid(F.person, s, ox, oy); noShadow();
  g.save(); g.globalAlpha = .25 * Math.sin(Math.PI * p); g.strokeStyle = '#fff'; g.lineWidth = 3; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; g.beginPath(); g.moveTo(540 + Math.cos(a) * 520, 760 + Math.sin(a) * 900); g.lineTo(540 + Math.cos(a) * 1300, 760 + Math.sin(a) * 1700); g.stroke(); } g.restore();
};

// 13 Magazine cover: masthead behind his head, cover lines, barcode
FX[12] = (F, lt) => {
  const [s, ox, oy] = place(1.08, F.head[0], F.head[1] + 40, 540, 1060);
  g.save(); g.filter = 'saturate(1.2) contrast(1.08)'; vid(F.img, s, ox, oy); g.restore();
  const m = eo(clamp(lt / .25, 0, 1));
  text('RELENTLESS', 540, 330 - (1 - m) * 300, '230px Anton', '#DC2626', { stroke: '#fff', sw: 8 });
  vid(F.person, s, ox, oy);   // his head in front of the masthead
  const L = [['20 EFFECTS', 'ONE PROMPT'], ['NO', 'AFTER EFFECTS'], ['THE CODE', 'ISSUE']];
  L.forEach(([a, b], i) => { const d = lt - .25 - i * .15; if (d < 0) return; const x = 60 - (1 - eo(clamp(d / .2, 0, 1))) * 500;
    text(a, x, 820 + i * 260, '86px Anton', '#FACC15', { align: 'left', stroke: '#000', sw: 10 }); text(b, x, 905 + i * 260, '600 44px Inter', '#fff', { align: 'left', stroke: '#000', sw: 8 }); });
  text('OCTOBER 2026  ·  $9.99', 540, 470 - (1 - m) * 300, '600 34px Inter', '#fff', { stroke: '#000', sw: 6 });
  if (lt > .5) { g.fillStyle = '#fff'; g.fillRect(820, 1660, 200, 140); g.fillStyle = '#000'; for (let i = 0; i < 34; i++) { const w = 1 + Math.floor(hash(i * 3.7) * 4); g.fillRect(836 + i * 5, 1676, w, 92); } text('0 12345 67890', 920, 1784, '600 18px Inter', '#000'); }
};

// 14 Liquid glass: a refracting glass card slides across the lower third
FX[13] = (F, lt) => {
  const [s, ox, oy] = base(F);
  const p = eo(clamp(lt / .35, 0, 1)), cx = lerp(-500, 540, p) + Math.sin(lt * 3) * 18, cy = 1400 + Math.sin(lt * 2.2) * 14, w = 820, h = 400;
  const glass = (x, y, gw, gh, r, mag) => {
    g.save(); rrect(x - gw / 2, y - gh / 2, gw, gh, r); shadow(50, 20, .35); g.fillStyle = 'rgba(255,255,255,.05)'; g.fill(); noShadow(); g.clip();
    g.filter = 'blur(10px) brightness(1.15) saturate(1.3)'; const ms = s * mag; vid(F.img, ms, x - (x - ox) * mag, y - (y - oy) * mag); g.filter = 'none';
    const hl = g.createLinearGradient(0, y - gh / 2, 0, y + gh / 2); hl.addColorStop(0, 'rgba(255,255,255,.45)'); hl.addColorStop(.35, 'rgba(255,255,255,.08)'); hl.addColorStop(1, 'rgba(255,255,255,.18)'); g.fillStyle = hl; g.fillRect(x - gw / 2, y - gh / 2, gw, gh);
    g.restore(); g.save(); rrect(x - gw / 2, y - gh / 2, gw, gh, r); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.stroke(); g.restore();
  };
  glass(cx, cy, w, h, 90, 1.18);
  text('liquid glass', cx, cy - 20, '800 78px Inter', '#fff', { stroke: 'rgba(0,0,0,.25)', sw: 4 });
  text('refracts whatever is behind it', cx, cy + 60, '600 34px Inter', 'rgba(255,255,255,.85)');
  const b = eo(clamp((lt - .3) / .3, 0, 1)); if (b > 0) glass(820, lerp(1900, 980, b) + Math.sin(lt * 3.4) * 20, 200, 200, 100, 1.35);
};

// 15 Zoom through cup: a mug rises into frame and the camera dives through it into the next shot
function mug(cx, cy, k, inside) {
  g.save(); g.translate(cx, cy); g.scale(k, k);
  g.fillStyle = '#F4F1EA'; g.strokeStyle = '#1a1a1a'; g.lineWidth = 8;
  g.beginPath(); g.ellipse(250, 40, 110, 150, 0, -Math.PI / 2, Math.PI / 2); g.lineWidth = 46; g.strokeStyle = '#F4F1EA'; g.stroke(); g.lineWidth = 8; g.strokeStyle = '#1a1a1a';
  g.beginPath(); g.moveTo(-250, 0); g.lineTo(-215, 380); g.quadraticCurveTo(0, 440, 215, 380); g.lineTo(250, 0); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#DC2626'; g.font = '64px Anton'; g.textAlign = 'center'; g.fillText('RELENTLESS', 0, 220);
  g.beginPath(); g.ellipse(0, 0, 250, 60, 0, 0, 7); g.fillStyle = '#F4F1EA'; g.fill(); g.stroke();
  g.save(); g.beginPath(); g.ellipse(0, 6, 226, 48, 0, 0, 7); g.clip(); inside(); g.restore();
  g.restore();
}
FX[14] = (F, lt, u) => {
  blurred(F, 22, .55);
  const rise = eo(clamp(lt / .35, 0, 1)), dive = ei(seg(u, .3, 1)), k = lerp(1, 9, dive * dive) , cx = 540, cy = lerp(2300, 1050, rise) + dive * 0;
  const [s, ox, oy] = place(1, F.head[0], F.head[1] - 60);
  mug(cx, cy, k, () => { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); vid(F.img, s, ox, oy); g.restore(); g.fillStyle = `rgba(40,22,10,${.6 * (1 - dive)})`; g.fillRect(-300, -80, 600, 160); });
  if (dive > .92) { vid(F.img, s, ox, oy); }
};

// 16 Green screen: the room keys out to green, then a night skyline drops in behind him
const [cityC, cityG] = canvas(W, H);
{ const gr = cityG.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#120a2e'); gr.addColorStop(.6, '#5b21b6'); gr.addColorStop(1, '#f472b6'); cityG.fillStyle = gr; cityG.fillRect(0, 0, W, H);
  cityG.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 120; i++) { cityG.beginPath(); cityG.arc(hash(i) * W, hash(i * 3) * 900, hash(i * 7) * 2.2, 0, 7); cityG.fill(); }
  cityG.fillStyle = '#fde68a'; cityG.beginPath(); cityG.arc(820, 380, 90, 0, 7); cityG.fill();
  for (let layer = 0; layer < 2; layer++) for (let x = -20, i = 0; x < W; i++) { const bw = 90 + hash(i * 5 + layer) * 120, bh = 400 + hash(i * 9 + layer * 4) * (layer ? 500 : 800); const top = H - bh - (layer ? 0 : 120);
    cityG.fillStyle = layer ? '#0b0718' : '#22113f'; cityG.fillRect(x, top, bw, bh + 200);
    cityG.fillStyle = layer ? 'rgba(253,230,138,.85)' : 'rgba(253,230,138,.4)'; for (let wy = top + 30; wy < H; wy += 46) for (let wx = x + 16; wx < x + bw - 20; wx += 34) if (hash(wx * 1.3 + wy) > .55) cityG.fillRect(wx, wy, 14, 20);
    x += bw + 8; } }
FX[15] = (F, lt) => {
  const [s, ox, oy] = place(1, F.head[0], F.head[1] - 60);
  if (lt < .5) { g.fillStyle = '#00D84A'; g.fillRect(0, 0, W, H); text('KEYING…', 540, 1640, '64px Anton', 'rgba(0,0,0,.35)'); }
  else { const p = eo(clamp((lt - .5) / .25, 0, 1)); g.save(); g.globalAlpha = p; g.drawImage(cityC, 0, (1 - p) * 120); g.restore(); if (p < 1) { g.save(); g.globalAlpha = 1 - p; g.fillStyle = '#00D84A'; g.fillRect(0, 0, W, H); g.restore(); } }
  shadow(40, 0, .6); vid(F.person, s, ox, oy); noShadow();
  if (Math.abs(lt - .5) < .05) dim(.5, '255,255,255');
};

// 17 Frame break: the picture cracks and shatters away to reveal the live shot underneath
const SHARDS = (() => { const cols = 6, rows = 10, P = []; for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) { const edge = i === 0 || j === 0 || i === cols || j === rows; P.push([i * W / cols + (edge ? 0 : (hash(i * 7 + j * 13) - .5) * 120), j * H / rows + (edge ? 0 : (hash(i * 3 + j * 17) - .5) * 120)]); }
  const at = (i, j) => P[j * (cols + 1) + i], S = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1); if (hash(i + j * 9) > .5) { S.push([a, b, c]); S.push([a, c, d]); } else { S.push([a, b, d]); S.push([b, c, d]); } }
  return S; })();
let FROZEN = null;
FX[16] = async (F, lt, u, t0) => {
  base(F, 1.06);
  if (!FROZEN || FROZEN.t0 !== t0) { const f0 = await load(Math.round(t0 * FPS)); const [c, cg] = canvas(W, H); const [s, ox, oy] = place(1, f0.head[0], f0.head[1] - 60); cg.drawImage(f0.img, ox, oy, SW * s, SH * s); FROZEN = { t0, c }; }
  const ix = 540, iy = 760, crack = clamp(lt / .2, 0, 1), fly = Math.max(0, lt - .22);
  SHARDS.forEach((sh, n) => {
    const cx = (sh[0][0] + sh[1][0] + sh[2][0]) / 3, cy = (sh[0][1] + sh[1][1] + sh[2][1]) / 3, dx = cx - ix, dy = cy - iy, d = Math.hypot(dx, dy) || 1;
    const sp = 900 + hash(n) * 900, tx = dx / d * sp * fly + 0, ty = dy / d * sp * fly + 2200 * fly * fly, rot = (hash(n * 3) - .5) * 8 * fly, sc = 1 - .3 * Math.min(1, fly * 2);
    if (ty > H + 400) return;
    g.save(); g.translate(cx + tx, cy + ty); g.rotate(rot); g.scale(sc, sc); g.translate(-cx, -cy);
    g.beginPath(); g.moveTo(...sh[0]); g.lineTo(...sh[1]); g.lineTo(...sh[2]); g.closePath(); g.save(); g.clip(); g.drawImage(FROZEN.c, 0, 0); g.restore();
    g.strokeStyle = `rgba(255,255,255,${.85 * crack})`; g.lineWidth = 3; g.stroke(); g.restore();
  });
  if (lt > .2 && lt < .3) dim(.4 * (1 - (lt - .2) / .1), '255,255,255');
};

// 18 Digital zoom: stepped camera zoom with pixelation and a viewfinder HUD
const [pixC, pixG] = canvas(W, H);
FX[17] = (F, lt) => {
  const steps = [[0, 1], [.45, 1.5], [.9, 2.3]]; let z = 1, since = lt; for (const [a, zz] of steps) if (lt >= a) { z = zz; since = lt - a; }
  const prevZ = steps.filter(s => s[0] <= lt).slice(-2)[0][1], zz = lerp(prevZ, z, eo(clamp(since / .08, 0, 1)));
  const pix = since < .18 ? 18 * (1 - since / .18) + 2 : 2 + (z - 1) * 2;
  const [s, ox, oy] = place(zz, F.head[0], F.head[1] - 30);
  const sw = Math.round(W / pix), sh = Math.round(H / pix); pixG.imageSmoothingEnabled = true; pixG.clearRect(0, 0, W, H); pixG.drawImage(F.img, ox / pix, oy / pix, SW * s / pix, SH * s / pix);
  g.save(); g.imageSmoothingEnabled = false; g.drawImage(pixC, 0, 0, sw, sh, 0, 0, W, H); g.restore();
  g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);
  g.strokeStyle = '#fff'; g.lineWidth = 8; const m = 70, L = 110;
  for (const [x, y, sx, sy] of [[m, 330, 1, 1], [W - m, 330, -1, 1], [m, H - 140, 1, -1], [W - m, H - 140, -1, -1]]) { g.beginPath(); g.moveTo(x, y + sy * L); g.lineTo(x, y); g.lineTo(x + sx * L, y); g.stroke(); }
  if (Math.floor(lt * 3) % 2 === 0) { g.fillStyle = '#EF4444'; g.beginPath(); g.arc(m + 40, 400, 16, 0, 7); g.fill(); }
  text('REC', m + 70, 402, '600 40px Inter', '#fff', { align: 'left' });
  text(z.toFixed(1) + 'x', W - m - 20, 402, '800 54px Inter', '#FACC15', { align: 'right' });
  g.strokeStyle = 'rgba(250,204,21,.9)'; g.lineWidth = 4; g.strokeRect(540 - 130, 900 - 160, 260, 320);
};

// 19 Phone mockup: the clip plays on a phone that floats up into frame
FX[18] = (F, lt) => {
  const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#4C1D95'); gr.addColorStop(1, '#0EA5E9'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const p = eo(clamp(lt / .4, 0, 1)), y = lerp(2400, 960, p) + Math.sin(lt * 2.4) * 14, rot = lerp(.25, -.05, p) + Math.sin(lt * 1.6) * .015, pw = 660, ph = 1350;
  g.save(); g.translate(540, y); g.rotate(rot); shadow(80, 40, .55); rrect(-pw / 2, -ph / 2, pw, ph, 90); g.fillStyle = '#0a0a0a'; g.fill(); noShadow();
  g.strokeStyle = '#3f3f46'; g.lineWidth = 6; g.stroke();
  rrect(-pw / 2 + 22, -ph / 2 + 22, pw - 44, ph - 44, 70); g.save(); g.clip(); const s = (ph - 44) / SH, sw = SW * s; g.drawImage(F.img, -sw / 2, -ph / 2 + 22, sw, ph - 44); g.restore();
  rrect(-70, -ph / 2 + 44, 140, 40, 20); g.fillStyle = '#000'; g.fill();
  const hl = g.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2); hl.addColorStop(0, 'rgba(255,255,255,.16)'); hl.addColorStop(.4, 'rgba(255,255,255,0)'); g.fillStyle = hl; rrect(-pw / 2 + 22, -ph / 2 + 22, pw - 44, ph - 44, 70); g.fill();
  g.restore();
};

// 20 Checklist: all twenty, ticked
FX[19] = (F, lt) => {
  blurred(F, 24, .62);
  const sc = pop(lt, .22), x = 60, y = 360, w = 960, h = 1360;
  g.save(); g.translate(540, y + h / 2); g.scale(sc, sc); g.translate(-540, -(y + h / 2));
  shadow(60, 24, .5); rrect(x, y, w, h, 46); g.fillStyle = 'rgba(255,255,255,.97)'; g.fill(); noShadow();
  const done = NAMES.filter((_, i) => lt >= .2 + i * .055).length;
  text(`${done}/20`, x + 60, y + 100, '96px Anton', done === 20 ? '#16A34A' : '#111', { align: 'left' });
  text('EFFECTS', x + 300, y + 106, '600 44px Inter', '#6B7280', { align: 'left' });
  NAMES.forEach((n, i) => { const col = i < 10 ? 0 : 1, row = i % 10, xx = x + 70 + col * 450, yy = y + 230 + row * 108, on = lt - (.2 + i * .055);
    g.strokeStyle = '#D4D4D8'; g.lineWidth = 4; g.beginPath(); g.arc(xx, yy, 26, 0, 7); g.stroke(); check(xx, yy, 28, pop(on, .16));
    text(n, xx + 50, yy + 2, '600 36px Inter', on > 0 ? '#111' : '#9CA3AF', { align: 'left' }); });
  g.restore();
};

// ——— intro captions and outro ———
const INTRO = [['CLAUDE,', 0], ['ADD', .56], ['ALL', .84], ['20', 1.12], ['OF', 1.34], ['THESE', 1.52], ['EFFECTS', 1.64], ['TO', 1.9], ['THIS', 2.14], ['VIDEO.', 2.34]];
function intro(F, t) {
  base(F, 1 + .04 * t);
  const line = t < 1.34 ? INTRO.slice(0, 4) : t < 1.9 ? INTRO.slice(4, 7) : INTRO.slice(7);
  const shown = line.filter(([, w]) => t >= w), y = 1500;
  g.font = '110px Anton'; const full = line.reduce((a, [w]) => a + g.measureText(w + ' ').width, 0), fs = Math.min(110, 110 * 960 / full), font = `${fs}px Anton`;
  g.font = font; const total = shown.reduce((a, [w]) => a + g.measureText(w + ' ').width, 0); let x = 540 - total / 2;
  shown.forEach(([w, at], i) => { const cur = i === shown.length - 1, k = pop(t - at, .16); g.font = font; const ww = g.measureText(w + ' ').width;
    g.save(); g.translate(x + ww / 2, y); g.scale(k, k); text(w, 0, 0, font, w === '20' || cur ? '#FACC15' : '#fff', { stroke: '#000', sw: 16 }); g.restore(); x += ww; });
}
function outro(F, t) {
  base(F); const lt = t - OUTRO;
  const a = pop(lt, .25); if (a <= 0) return;
  g.save(); g.translate(540, 1480); g.scale(a, a);
  text('BUILT AS CODE.', 0, 0, '120px Anton', '#fff', { stroke: '#000', sw: 16 });
  text('NO AFTER EFFECTS.', 0, 140, '84px Anton', '#FACC15', { stroke: '#000', sw: 14 });
  g.restore();
  check(540, 1180, 60, pop(lt - .3, .25));
}

// ——— render ———
async function render(t) {
  t = Math.min(t, DUR - 1 / FPS);
  const F = await load(Math.floor(t * FPS + 1e-6));
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; noShadow();
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (t >= ENDCARD) { vid(F.img); return; }                        // the original end card, untouched
  if (t < STARTS[0]) { intro(F, t); return; }
  if (t >= OUTRO) { outro(F, t); return; }
  const S = SEGS.filter(s => t >= s.t0).pop(), lt = t - S.t0, u = clamp(lt / (S.t1 - S.t0), 0, 1);
  await FX[S.k](F, lt, u, S.t0);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; noShadow();
  badge(S.k, lt);
}
// texts for readcheck: the label is the only text that has to be read in its window
window.TEXTS = t => { if (t < STARTS[0] || t >= OUTRO) return []; const S = SEGS.filter(s => t >= s.t0).pop(); const y = S.k === 12 ? 1770 : 200; return [{ id: 'badge' + S.k, text: S.name, x0: 200, y0: y - 54, x1: 880, y1: y + 54 }]; };
// sound events
const SFX = ['orbit', 'pop', 'whoosh', 'snap', 'pop', 'slam', 'portal', 'rise', 'wipe', 'slide', 'paper', 'dolly', 'shutter', 'glass', 'dive', 'key', 'shatter', 'zoom', 'rise', 'ticks'];
const EV = SEGS.map((s, k) => ({ t: s.t0, type: SFX[k], d: s.t1 - s.t0 }));
CHAT.forEach((_, i) => EV.push({ t: STARTS[1] + .08 + i * .3, type: 'bubble' }));
CL5.forEach((_, i) => EV.push({ t: STARTS[4] + .25 + i * .17, type: 'tick' }));
HEAD.forEach((_, i) => EV.push({ t: STARTS[5] + i * .2 + .12, type: 'slam' }));
[.45, .9].forEach(a => EV.push({ t: STARTS[17] + a, type: 'zoom' }));
EV.push({ t: STARTS[15] + .5, type: 'whoosh' });
EV.push({ t: OUTRO, type: 'pop' });
window.EV = EV;
window.DUR = DUR;
window.render = render;
window.READY = true;
