// Relentless Daily — one renderer, three looks (be-nice · daily-message · relentless-times).
// Reads episodes/<slug>/build.json (made by tools/prepare.py) and draws every frame as a pure function of t.
const W = innerWidth || 1080, H = innerHeight || 1920;
const cv = document.getElementById('out'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
const Q = new URLSearchParams(location.search), EP = 'episodes/' + (Q.get('ep') || 'sample-be-nice') + '/';
const B = await (await fetch(EP + 'build.json')).json();
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - x, 3), eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, ss = x => x * x * (3 - 2 * x);
const back = (x, s = 1.7) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const S = Math.min(W / 1080, H / 1920);                      // layout unit (1080 × 1920 design)

// ---------- looks ----------
const LOOKS = {
  'be-nice': { bg: '#2b2140', a: '#ffb38a', b: '#7b4dff', c: '#fff6ea', d: '#7fd1b9', ink: '#2b2140',
    cap: s => `700 ${s}px Fredoka`, big: s => `700 ${s}px Fredoka`, quote: s => `600 ${s}px Fredoka`, small: s => `600 ${s}px Fredoka`, upper: false, trans: 'iris' },
  'daily-message': { bg: '#0b0b0d', a: '#d8b26a', b: '#8a8478', c: '#f3ede2', d: '#d8b26a', ink: '#0b0b0d',
    cap: s => `800 ${s}px Barlow`, big: s => `700 italic ${s}px Playfair`, quote: s => `700 italic ${s}px Playfair`, small: s => `500 ${s}px Plex`, upper: true, trans: 'flash' },
  'relentless-times': { bg: '#121417', a: '#F2CF1D', b: '#C8363A', c: '#F4F1E8', d: '#F2CF1D', ink: '#121417',
    cap: s => `800 ${s}px Barlow`, big: s => `400 ${s}px Anton`, quote: s => `400 ${s}px Anton`, small: s => `500 ${s}px Plex`, upper: true, trans: 'whip' },
};
const L = LOOKS[B.look] || LOOKS['be-nice'];
await Promise.all([L.cap(60), L.big(60), L.quote(60), L.small(30), '600 40px Caveat', '800 40px Barlow', '500 20px Plex'].map(f => document.fonts.load(f)));

// ---------- media ----------
const IMG = {}, load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('cannot load ' + src)); i.src = src; });
for (const s of B.scenes) if (s.kind === 'image') IMG[s.src] = await load(EP + s.src);
const FR = new Map();
async function frame(s, k) {                                 // a video scene's frame k, cached (small LRU)
  const key = s.frames + '/' + k; if (FR.has(key)) return FR.get(key);
  const im = await load(`${EP}${s.frames}/${String(k + 1).padStart(5, '0')}.jpg`); FR.set(key, im); if (FR.size > 90) FR.delete(FR.keys().next().value); return im;
}

// ---------- drawing helpers ----------
function txt(s, x, y, font, col, align = 'center', o = {}) {
  ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = (o.ls || 0) + 'px';
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.stroke; ctx.strokeStyle = o.sc || L.ink; ctx.strokeText(s, x, y); }
  if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = o.shadow; ctx.shadowOffsetY = o.shadow / 4; }
  ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.letterSpacing = '0px';
}
const tw = (s, font, ls = 0) => { ctx.font = font; ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; };
const fitSize = (s, font, size, maxW) => Math.floor(Math.min(size, size * maxW / Math.max(1, tw(s, font(size)))));
function wrap(s, font, maxW) { const out = []; let ln = ''; for (const w of s.split(/\s+/)) { const t2 = ln ? ln + ' ' + w : w; if (tw(t2, font) > maxW && ln) { out.push(ln); ln = w; } else ln = t2; } if (ln) out.push(ln); return out; }
const up = s => L.upper ? s.toUpperCase() : s;
function cover(im, z, ox, oy) {                              // cover-fit an image with zoom and offset (fractions of the spare room)
  const r = Math.max(W / im.width, H / im.height) * z, w = im.width * r, h = im.height * r;
  ctx.drawImage(im, (W - w) / 2 + ox * (w - W) / 2, (H - h) / 2 + oy * (h - H) / 2, w, h);
}
function motion(s, t) {                                      // gentle camera on a still: push, pull, drift
  const k = ss(seg(t, s.t0 - .5, s.t1 + .5)), m = s.motion;
  return m === 'in' ? [lerp(1.04, 1.16, k), 0, 0] : m === 'out' ? [lerp(1.18, 1.05, k), 0, 0] : m === 'left' ? [1.14, lerp(.7, -.7, k), 0] : m === 'right' ? [1.14, lerp(-.7, .7, k), 0] : [1.14, 0, lerp(.7, -.7, k)];
}

// ---------- scene backgrounds ----------
function bokeh(t, n, cols, a = .35) {                        // soft drifting light: physical presence over stills and cards
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) { const x = (hash(i) * W + Math.sin(t * .3 + i) * 60 * S) % W, y = (hash(i * 3.1) * H - t * (12 + hash(i) * 30) * S) % H + (hash(i * 3.1) * H - t * 20 * S < 0 ? H : 0), r = (30 + hash(i * 7) * 110) * S;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, cols[i % cols.length] + Math.round(a * 255).toString(16).padStart(2, '0')); g.addColorStop(1, cols[i % cols.length] + '00'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
  ctx.restore();
}
function cardBg(t, s) {
  if (B.look === 'be-nice') { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#ffcfae'); g.addColorStop(.55, '#c8a8ff'); g.addColorStop(1, L.b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); bokeh(t, 14, ['#ffffff', '#fff3c4'], .5); }
  else if (B.look === 'daily-message') { ctx.fillStyle = L.bg; ctx.fillRect(0, 0, W, H); const g = ctx.createRadialGradient(W / 2, H * .42, 0, W / 2, H * .42, H * .6); g.addColorStop(0, 'rgba(216,178,106,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); bokeh(t, 26, ['#d8b26a', '#f3ede2'], .28); }
  else { ctx.fillStyle = L.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.globalAlpha = .07; ctx.translate(W / 2, H / 2); ctx.rotate(-.35); for (let i = -12; i < 12; i++) { ctx.fillStyle = i % 2 ? '#fff' : L.a; ctx.fillRect(i * 150 * S - (t * 30 % 300) * S, -H, 70 * S, 2 * H); } ctx.restore(); }
}
async function sceneBg(s, t) {
  if (s.kind === 'image') { const [z, ox, oy] = motion(s, t); cover(IMG[s.src], z, ox, oy); return; }
  if (s.kind === 'video') { const k = Math.floor((t - s.t0) * 30), n = s.nframes, c = n > 1 ? k % (2 * n - 2) : 0, f = c < n ? c : 2 * n - 2 - c; cover(await frame(s, clamp(f, 0, n - 1)), lerp(1.0, 1.06, seg(t, s.t0, s.t1)), 0, 0); return; }
  cardBg(t, s);
  const lt = t - s.t0;
  if (s.kind === 'stat') {
    const num = s.value.match(/[\d.,]+/), v = num ? parseFloat(num[0].replace(/,/g, '')) : 0, dec = num && num[0].includes('.') ? num[0].split('.')[1].length : 0, k = eo(seg(lt, .2, 1.3));
    const shown = num ? s.value.replace(num[0], (v * k).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })) : s.value;
    const f = L.big, sz = fitSize(s.value, f, 230 * S, W - 140 * S), y = H * .44, sc = back(seg(lt, .05, .5));
    ctx.save(); ctx.translate(W / 2, y); ctx.scale(sc, sc); txt(shown, 0, 0, f(sz), B.look === 'be-nice' ? '#fff' : L.a, 'center', { stroke: B.look === 'be-nice' ? 14 * S : 0, shadow: 30 * S }); ctx.restore();
    const lf = L.small, ls = 44 * S; ctx.globalAlpha = eo(seg(lt, .9, 1.3));
    wrap(up(s.label), lf(ls), W - 200 * S).forEach((l, j) => txt(l, W / 2, y + 110 * S + j * ls * 1.3, lf(ls), B.look === 'be-nice' ? L.ink : L.c, 'center', { ls: L.upper ? 3 : 0 })); ctx.globalAlpha = 1;
    return;
  }
  // text card: words land one at a time, spread over the card's first two thirds
  const f = L.big, ws = s.text.split(/\s+/), lines = wrap(s.text, f(110 * S), W - 160 * S), sz = Math.min(130 * S, fitSize(lines.reduce((a, b) => a.length > b.length ? a : b, ''), f, 130 * S, W - 160 * S));
  const L2 = wrap(s.text, f(sz), W - 160 * S), lh = sz * 1.15, y0 = H * .42 - (L2.length - 1) * lh / 2; let wi = 0; const per = Math.min(.45, (s.t1 - s.t0) * .66 / ws.length);
  L2.forEach((l, j) => { const parts = l.split(' '); let x = W / 2 - tw(l, f(sz)) / 2;
    for (const p of parts) { const k = back(seg(lt, .15 + wi * per, .45 + wi * per)); if (k > 0) { ctx.save(); ctx.globalAlpha = clamp(k); ctx.translate(x + tw(p, f(sz)) / 2, y0 + j * lh); ctx.scale(k, k); txt(p, 0, 0, f(sz), B.look === 'be-nice' ? '#fff' : j === L2.length - 1 && B.look !== 'be-nice' ? L.a : L.c, 'center', { stroke: B.look === 'be-nice' ? 12 * S : 0, shadow: 24 * S }); ctx.restore(); }
      x += tw(p + ' ', f(sz)); wi++; } });
}

// ---------- overlays ----------
function grade(t) {
  const v = ctx.createRadialGradient(W / 2, H * .45, H * .25, W / 2, H * .5, H * .78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, B.look === 'be-nice' ? 'rgba(43,33,64,.42)' : 'rgba(0,0,0,.55)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const lx = W * (.2 + .6 * (.5 + .5 * Math.sin(t * .23))), g = ctx.createRadialGradient(lx, -80 * S, 0, lx, -80 * S, H * .55);
  g.addColorStop(0, B.look === 'daily-message' ? 'rgba(255,200,120,.22)' : B.look === 'be-nice' ? 'rgba(255,190,140,.28)' : 'rgba(255,240,180,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  const lo = ctx.createLinearGradient(0, H * .55, 0, H); lo.addColorStop(0, 'rgba(0,0,0,0)'); lo.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = lo; ctx.fillRect(0, H * .55, W, H * .45);
}
function logo(t) {
  const k = eo(seg(t, .1, .6)); ctx.globalAlpha = k;
  if (B.look === 'be-nice') { const w = 250 * S, h = 74 * S, x = 46 * S, y = 150 * S; ctx.fillStyle = L.b; ctx.shadowColor = 'rgba(123,77,255,.8)'; ctx.shadowBlur = 24 * S; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill(); ctx.shadowBlur = 0; txt('Relentless', x + w / 2, y + h * .7, `600 ${50 * S}px Caveat`, '#fff'); }
  else if (B.look === 'daily-message') { ctx.fillStyle = L.a; ctx.fillRect(56 * S, 176 * S, 46 * S, 3 * S); txt('RELENTLESS', 116 * S, 186 * S, `800 ${28 * S}px Barlow`, L.c, 'left', { ls: 9 * S }); }
  else { ctx.save(); ctx.translate(176 * S, 180 * S); ctx.transform(1, 0, -.18, 1, 0, 0); ctx.fillStyle = L.a; ctx.fillRect(-126 * S, -34 * S, 252 * S, 68 * S); ctx.restore(); txt('RELENTLESS', 176 * S, 194 * S, `800 ${36 * S}px Barlow`, L.ink, 'center', { ls: 2 * S }); txt('TIMES', 300 * S, 238 * S, `800 ${22 * S}px Barlow`, '#fff', 'right', { ls: 4 * S }); }
  ctx.globalAlpha = 1;
}
function progress(t) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(0, 0, W, 8 * S); ctx.fillStyle = L.a; ctx.fillRect(0, 0, W * clamp(t / B.end0), 8 * S); }
function hook(t) {                                          // the first 2.6 s: series, episode, title
  const k = eo(seg(t, .05, .45)), out = 1 - ss(seg(t, 2.3, 2.75)); if (out <= 0) return;
  ctx.save(); ctx.globalAlpha = out;
  const tag = up(`${B.series}${B.episode ? (B.look === 'daily-message' ? ' · DAY ' : ' · EP ') + B.episode : ''}`), title = B.title || '';
  if (B.look === 'be-nice') {
    const lines = wrap(title, L.big(92 * S), W - 220 * S), h = (lines.length * 104 + 150) * S, y = H * .36 - h / 2, sc = back(seg(t, .05, .5));
    ctx.translate(W / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -(y + h / 2));
    ctx.fillStyle = L.c; ctx.shadowColor = 'rgba(43,33,64,.4)'; ctx.shadowBlur = 40 * S; ctx.beginPath(); ctx.roundRect(80 * S, y, W - 160 * S, h, 48 * S); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = L.a; const bw = tw(tag, L.small(34 * S)) + 60 * S; ctx.beginPath(); ctx.roundRect(W / 2 - bw / 2, y - 30 * S, bw, 62 * S, 31 * S); ctx.fill(); txt(tag, W / 2, y + 12 * S, L.small(34 * S), L.ink);
    lines.forEach((l, j) => txt(l, W / 2, y + 120 * S + j * 104 * S, L.big(92 * S), L.ink));
  } else if (B.look === 'daily-message') {
    ctx.fillStyle = `rgba(11,11,13,${.55 * k})`; ctx.fillRect(0, 0, W, H);
    txt(tag, W / 2, H * .33, L.small(30 * S), L.a, 'center', { ls: 8 * S });
    const lines = wrap(title, L.big(104 * S), W - 160 * S); lines.forEach((l, j) => { ctx.globalAlpha = out * eo(seg(t, .3 + j * .2, .8 + j * .2)); txt(l, W / 2, H * .41 + j * 120 * S, L.big(104 * S), L.c, 'center', { shadow: 30 * S }); });
    ctx.globalAlpha = out; const uw = (W - 400 * S) * eio(seg(t, .8, 1.6)); ctx.fillStyle = L.a; ctx.fillRect(W / 2 - uw / 2, H * .41 + lines.length * 120 * S - 60 * S, uw, 4 * S);
  } else {
    const y = H * .38, lines = wrap(title.toUpperCase(), L.big(120 * S), W - 160 * S), h = lines.length * 132 * S + 60 * S;
    ctx.fillStyle = 'rgba(18,20,23,.92)'; ctx.fillRect(0, y - 60 * S, W * k, h + 60 * S); ctx.fillStyle = L.a; ctx.fillRect(0, y - 60 * S, 16 * S, (h + 60 * S) * k);
    ctx.fillStyle = L.a; const bw = tw(tag, L.small(28 * S), 4) + 40 * S; ctx.fillRect(60 * S, y - 110 * S, bw * k, 50 * S); if (k >= 1) txt(tag, 80 * S, y - 76 * S, L.small(28 * S), L.ink, 'left', { ls: 4 });
    lines.forEach((l, j) => { ctx.save(); ctx.beginPath(); ctx.rect(0, y - 60 * S + j * 132 * S, W, 132 * S); ctx.clip(); txt(l, 64 * S, y + 64 * S + j * 132 * S + (1 - eo(seg(t, .25 + j * .12, .6 + j * .12))) * 132 * S, L.big(120 * S), '#fff', 'left'); ctx.restore(); });
  }
  ctx.restore();
}
function captions(t) {
  if (t < 2.5 || t > B.end0) return;
  const c = B.caps.find(c => t >= c.t0 && t < c.t1); if (!c) return;
  const f = L.cap, sz = (B.look === 'be-nice' ? 78 : 70) * S, str = c.words.map(w => up(w.w)), full = str.join(' '), size = Math.min(sz, fitSize(full, f, sz, W - 180 * S));
  const y = H * .665, pop = back(seg(t, c.t0, c.t0 + .18), 2.2); let x = W / 2 - tw(full, f(size)) / 2;
  ctx.save(); ctx.translate(W / 2, y); ctx.scale(lerp(.82, 1, pop), lerp(.82, 1, pop)); ctx.translate(-W / 2, -y);
  if (B.look === 'relentless-times') { const pw = tw(full, f(size)) + 50 * S; ctx.fillStyle = 'rgba(18,20,23,.9)'; ctx.fillRect(W / 2 - pw / 2, y - size * .95, pw, size * 1.3); }
  c.words.forEach((w, j) => { const on = t >= w.s - .03, cur = on && t < w.e + .05, s = str[j], ww = tw(s, f(size));
    const col = cur ? L.a : on ? (B.look === 'relentless-times' ? '#fff' : L.c) : 'rgba(255,255,255,.55)', bump = cur ? 1 + .08 * Math.sin(Math.PI * seg(t, w.s, w.s + .2)) : 1;
    ctx.save(); ctx.translate(x + ww / 2, y); ctx.scale(bump, bump); txt(s, 0, 0, f(size), col, 'center', { stroke: B.look === 'relentless-times' ? 0 : 11 * S, sc: B.look === 'be-nice' ? L.ink : '#000', shadow: 18 * S }); ctx.restore();
    x += ww + tw(' ', f(size)); });
  ctx.restore();
}
function quoteCard(t) {
  const q = B.quote; if (!q) return; const k = ss(seg(t, q.t0, q.t0 + .35)), out = 1 - ss(seg(t, q.t1 - .3, q.t1)); if (k * out <= 0) return;
  ctx.save(); ctx.globalAlpha = k * out;
  const ws = B.quote_words, f = L.quote, s0 = (B.look === 'be-nice' ? 74 : B.look === 'daily-message' ? 82 : 92) * S, qu = s => B.look === 'relentless-times' ? s.toUpperCase() : s;
  const all = ws.map(w => qu(w.w)).join(' '), lines = wrap(all, f(s0), W - 220 * S), lh = s0 * 1.25, y0 = H * .42 - (lines.length - 1) * lh / 2;
  if (B.look === 'be-nice') { ctx.fillStyle = 'rgba(43,33,64,.45)'; ctx.fillRect(0, 0, W, H); const h = lines.length * lh + 200 * S; ctx.fillStyle = L.c; ctx.beginPath(); ctx.roundRect(70 * S, y0 - 150 * S, W - 140 * S, h, 50 * S); ctx.fill(); txt('“', W / 2, y0 - 40 * S, `700 ${150 * S}px Fredoka`, L.b); }
  else if (B.look === 'daily-message') { cardBg(t); txt('“', W / 2, y0 - 70 * S, `700 italic ${200 * S}px Playfair`, L.a); }
  else { ctx.fillStyle = 'rgba(18,20,23,.93)'; ctx.fillRect(0, 0, W, H); txt('“', 90 * S, y0 - 40 * S, `400 ${260 * S}px Anton`, L.a, 'left'); }
  let wi = 0;
  lines.forEach((l, j) => { const parts = l.split(' '); let x = W / 2 - tw(l, f(s0)) / 2;
    for (const p of parts) { const w = ws[wi++], on = t >= w.s - .05, cw = tw(p, f(s0));
      ctx.globalAlpha = k * out * (on ? 1 : .22); txt(p, x + cw / 2, y0 + j * lh + (on ? 0 : 6 * S), f(s0), B.look === 'be-nice' ? L.ink : L.c, 'center');
      x += cw + tw(' ', f(s0)); } });
  ctx.globalAlpha = k * out; const uw = (W - 360 * S) * eio(seg(t, q.t1 - 1.2, q.t1 - .5)); ctx.fillStyle = L.a; ctx.fillRect(W / 2 - uw / 2, y0 + lines.length * lh - lh * .45, uw, 6 * S);
  ctx.restore();
}
function strap(t) {
  if (B.look !== 'relentless-times') return;
  for (const st of B.straps) { const k = eo(seg(t, st.t0, st.t0 + .35)), out = 1 - eo(seg(t, st.t1 - .25, st.t1)); if (k * out <= 0) continue;
    const y = H * .755, h = 96 * S; ctx.save(); ctx.globalAlpha = out;
    const tb = st.tab || 'ON THE RECORD', twd = tw(tb, L.small(20 * S), 3) + 34 * S, tc = tb === 'ESTIMATE' ? [L.b, '#fff'] : tb === 'COMMENTARY' ? [L.a, L.ink] : [L.c, L.ink];
    ctx.fillStyle = tc[0]; ctx.fillRect(48 * S, y - 42 * S, twd * k, 40 * S); if (k >= 1) txt(tb, 65 * S, y - 15 * S, L.small(20 * S), tc[1], 'left', { ls: 3 });
    ctx.fillStyle = 'rgba(18,20,23,.94)'; ctx.fillRect(48 * S, y, (W - 96 * S) * k, h); ctx.fillStyle = L.a; ctx.fillRect(48 * S, y, 10 * S, h);
    if (k >= 1) { const sz = fitSize(st.text, s => `800 ${s}px Barlow`, 48 * S, W - 150 * S); txt(st.text, 80 * S, y + h / 2 + sz * .36, `800 ${sz}px Barlow`, '#fff', 'left', { ls: 1 }); }
    if (k >= 1 && st.src) { const s = 'SOURCE: ' + st.src, sz = fitSize(s, L.small, 17 * S, W - 120 * S), ww = tw(s, L.small(sz), 1.5) + 24 * S; ctx.fillStyle = 'rgba(244,241,232,.92)'; ctx.fillRect(W - 48 * S - ww, y + h, ww, 34 * S); txt(s, W - 60 * S, y + h + 24 * S, L.small(sz), '#6E5A1E', 'right', { ls: 1.5 }); }
    ctx.restore(); }
}
function endCard(t) {
  const k = eo(seg(t, B.end0, B.end0 + .5)); if (k <= 0) return; const lt = t - B.end0;
  ctx.save(); ctx.globalAlpha = k; cardBg(t); ctx.restore(); ctx.save(); ctx.globalAlpha = k;
  const line1 = B.tagline || (B.look === 'be-nice' ? 'Be nice.' : B.look === 'daily-message' ? 'Tomorrow, another one.' : 'This is Relentless Times.');
  const f = L.big, sz = fitSize(up(line1), f, 120 * S, W - 140 * S), sc = back(seg(lt, .15, .6));
  ctx.save(); ctx.translate(W / 2, H * .4); ctx.scale(sc, sc); txt(up(line1), 0, 0, f(sz), B.look === 'be-nice' ? '#fff' : L.a, 'center', { stroke: B.look === 'be-nice' ? 14 * S : 0, shadow: 30 * S }); ctx.restore();
  const cta = B.cta || 'Follow for tomorrow’s episode', bw = tw(cta, L.small(40 * S)) + 90 * S, pulse = 1 + .04 * Math.sin(lt * 6) * seg(lt, 1, 1.4), by = H * .52;
  ctx.globalAlpha = k * eo(seg(lt, .7, 1.1)); ctx.save(); ctx.translate(W / 2, by); ctx.scale(pulse, pulse); ctx.fillStyle = L.a; ctx.beginPath(); ctx.roundRect(-bw / 2, -50 * S, bw, 100 * S, B.look === 'relentless-times' ? 0 : 50 * S); ctx.fill(); txt(cta, 0, 14 * S, L.small(40 * S), L.ink); ctx.restore();
  txt(B.handle || '@relentless', W / 2, by + 140 * S, `600 ${52 * S}px Caveat`, B.look === 'be-nice' ? L.ink : L.c);
  if (B.placeholder) txt('AI placeholder voice · your recording replaces it', W / 2, H * .86, L.small(24 * S), 'rgba(255,255,255,.75)');
  ctx.restore();
}
function transition(t) {                                     // a look-specific move at every cut
  for (let i = 1; i < B.scenes.length; i++) { const c = B.scenes[i].t0, d = t - c; if (d < -.3 || d > .35) continue;
    if (L.trans === 'flash') { const a = d < 0 ? ss(seg(d, -.3, 0)) : 1 - ss(seg(d, 0, .35)); ctx.fillStyle = `rgba(255,236,200,${.55 * a})`; ctx.fillRect(0, 0, W, H); }
    else if (L.trans === 'whip') { const a = 1 - Math.abs(d) / .33; if (a > 0) { ctx.fillStyle = L.a; ctx.fillRect(W * lerp(-1.2, 1.2, seg(d, -.25, .3)), 0, W * .35, H); } }
  }
}
async function scenesAt(t) {
  const i = Math.max(0, B.scenes.findIndex(s => t >= s.t0 && t < s.t1)), s = B.scenes[i < 0 ? B.scenes.length - 1 : i];
  const cur = t >= B.scenes[B.scenes.length - 1].t1 ? B.scenes[B.scenes.length - 1] : s, nx = B.scenes[B.scenes.indexOf(cur) + 1];
  await sceneBg(cur, t);
  if (L.trans === 'iris' && nx && t > nx.t0 - .45) {            // be-nice: the next scene opens in a circle with a cream ring
    const r = eio(seg(t, nx.t0 - .45, nx.t0)) * Math.hypot(W, H) * .6; ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H * .45, r, 0, 7); ctx.clip(); await sceneBg(nx, t); ctx.restore();
    ctx.strokeStyle = L.c; ctx.lineWidth = 18 * S; ctx.beginPath(); ctx.arc(W / 2, H * .45, r, 0, 7); ctx.stroke();
  }
  if (L.trans === 'whip' && nx && t > nx.t0 - .25) { const k = eio(seg(t, nx.t0 - .25, nx.t0)); ctx.save(); ctx.translate(W * (1 - k), 0); await sceneBg(nx, t); ctx.restore(); }
}
async function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = L.bg; ctx.fillRect(0, 0, W, H);
  await scenesAt(t);
  if (L.trans === 'flash') { const nx = B.scenes.find(s => s.t0 > 0 && Math.abs(t - s.t0) < .3); if (nx && t < nx.t0) { ctx.save(); ctx.globalAlpha = ss(seg(t, nx.t0 - .3, nx.t0)); ctx.filter = `blur(${6 * S}px)`; await sceneBg(nx, t); ctx.restore(); } }
  grade(t); bokeh(t, 8, [L.a, '#ffffff'], .12);
  transition(t); progress(t); logo(t); strap(t); captions(t); quoteCard(t); hook(t); endCard(t);
}
const EV = [{ t: 0, type: 'rise' }, { t: B.v0, type: 'vo' }];
B.scenes.slice(1).forEach(s => EV.push({ t: s.t0, type: 'cut' }));
B.scenes.filter(s => s.kind === 'stat').forEach(s => EV.push({ t: s.t0 + .2, type: 'hit' }));
if (B.quote) EV.push({ t: B.quote.t0, type: 'pop' });
EV.push({ t: B.end0, type: 'chime' });
window.CUES = B.caps.map(c => ({ t0: c.t0, t1: c.t1, text: c.words.map(w => w.w).join(' ') }));
window.EV = EV; window.DUR = B.dur; window.render = render; window.READY = true;
