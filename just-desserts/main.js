// THE RELENTLESS REPORT · "Just Desserts" — a one-minute commentary package in the Broadcast News Package style.
// Canvas 2D, deterministic render(t). 120 BPM grid (beat 0 = 1.5 s). Package parts adapted from styles/news-package/demo/main.js (MIT).
// Commentary (the host's opinion) and On the Record (sourced facts) are kept apart by the strap's tab.
const W = 1920, H = 1080, DUR = 63.5;
const cv = document.getElementById('out'); const ctx = cv.getContext('2d');
const C = {
  ink: '#121417', ink2: '#1B1E23', ink3: '#22262C', line: '#454B55',
  lemon: '#F2CF1D', lemonL: '#F8DE4A', lemonD: '#D8B30C', gold: '#D4B064',
  paper: '#F4F1E8', white: '#FFFFFF', grey: '#C9CCD2', grey2: '#7D838D', olive: '#6E5A1E',
};
const F = { b8: s => `800 ${s}px Barlow`, b6: s => `600 ${s}px Barlow`, b6i: s => `italic 600 ${s}px Barlow`, mono: s => `500 ${s}px Plex` };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - x, 3);
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const back = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

let TX = [];
function text(s, x, y, font, color, align = 'left', ls = 0, id = null) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = ls + 'px'; ctx.fillText(s, x, y);
  const w = ctx.measureText(s).width; ctx.letterSpacing = '0px';
  if (id) { const m = ctx.getTransform(); const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2; const fs = parseInt(font.match(/(\d+)px/)[1]);
    const p0 = m.transformPoint({ x: x0, y: y - fs }), p1 = m.transformPoint({ x: x0 + w, y: y + 8 });
    TX.push({ id, text: s, x0: Math.min(p0.x, p1.x), y0: Math.min(p0.y, p1.y), x1: Math.max(p0.x, p1.x), y1: Math.max(p0.y, p1.y) }); }
  return w;
}
function tw(s, font, ls = 0) { ctx.font = font; ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }

// ———————— timeline (voice starts from vo/dur.json; every cut on the 120 BPM grid) ————————
const VO_AT = { v1: 1.7, v2: 8.1, v3: 12.6, v4: 18.6, v5: 22.6, v6: 27.1, v7: 34.1, v8: 39.6, v9: 46.9, v10: 50.6, v11: 55.6 };
const SUB = {
  v1: 'America has gotten its just desserts. Trump, in a very real sense, is what we deserve.',
  v2: "Sometimes the greatest curse is that you get your heart's desire.",
  v3: 'Pew Research says 55% of white voters backed him in 2024.',
  v4: 'They thought this would literally be the golden age of America.',
  v5: 'Mass deportation, on a scale no Democrat would ever allow.',
  v6: 'Homeland Security says more than 605,000 were deported by December 2025.',
  v7: "We don't want to hear about slavery no more. Take the shackles out. Put the flags in.",
  v8: 'In August 2025, the president complained the Smithsonian dwells on how bad slavery was.',
  v9: 'They wanted it so badly. And the grift is the price.',
  v10: 'Three days before he took office, he launched his own meme coin.',
  v11: 'The full episode is on my YouTube channel.',
};

// ———————— package parts ————————
function studioBg(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(1300, 380, 60, 1300, 380, 1100); rg.addColorStop(0, 'rgba(242,207,29,.16)'); rg.addColorStop(1, 'rgba(242,207,29,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) {
    const x = ((i * 380 + t * (30 + i * 6)) % 2600) - 400, w = 40 + hash(i) * 120;
    ctx.fillStyle = `rgba(242,207,29,${.025 + hash(i + 9) * .035})`;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w - 500, H); ctx.lineTo(x - 500, H); ctx.fill();
  }
  ctx.fillStyle = 'rgba(244,241,232,.05)';
  for (let x = 40 - (t * 12) % 48; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
}
// brand plate: lemon parallelogram, ink + gold bars, "RELENTLESS" dropping in letter by letter
function plate(cx, cy, s, glint = -1, drop = 1) {
  const w = 520 * s, h = 180 * s, k = h * .28;
  ctx.save(); ctx.translate(cx, cy);
  const path = new Path2D(); path.moveTo(-w / 2 + k, -h / 2); path.lineTo(w / 2 + k, -h / 2); path.lineTo(w / 2 - k, h / 2); path.lineTo(-w / 2 - k, h / 2); path.closePath();
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, C.lemonL); g.addColorStop(1, C.lemonD);
  ctx.fillStyle = g; ctx.fill(path); ctx.save(); ctx.clip(path);
  const gx = -w / 2 - k;
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(gx + 2 * k, -h / 2); ctx.lineTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.lineTo(gx, h / 2); ctx.fill();
  ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + 2 * k + w * .11, -h / 2); ctx.lineTo(gx + w * .11, h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.fill();
  const word = 'RELENTLESS'; ctx.font = F.b8(100); const fsz = Math.min(h * .62, 100 * w * .7 / ctx.measureText(word).width); ctx.font = F.b8(fsz); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  let x = -w * .3;
  [...word].forEach((L, i) => {
    const d = clamp(drop * 4.6 - i * .4); const yy = fsz * .36 + (1 - eo(d)) * -h * 1.1;
    ctx.save(); ctx.globalAlpha = ctx.globalAlpha * clamp(d * 3); ctx.fillStyle = C.ink; ctx.fillText(L, x, yy); ctx.restore();
    x += ctx.measureText(L).width;
  });
  if (glint >= 0 && glint <= 1) {
    const gx2 = lerp(-w, w, glint); const gg = ctx.createLinearGradient(gx2 - 80 * s, 0, gx2 + 80 * s, 0);
    gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, 'rgba(255,255,255,.6)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gg; ctx.fillRect(-w, -h, w * 2, h * 2);
  }
  ctx.restore(); ctx.restore();
}
function wordmark(x, y, size, align = 'center', id = null) {
  const parts = [['THE ', C.grey], ['RELENTLESS ', C.white], ['REPORT', C.lemon]], ls = size * .12;
  const tot = parts.reduce((a, [s]) => a + tw(s, F.b8(size), ls), 0);
  let cx = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x;
  for (const [s, c] of parts) cx += text(s, cx, y, F.b8(size), c, 'left', ls);
  if (id) TX.push({ id, text: 'THE RELENTLESS REPORT', x0: cx - tot, y0: y - size, x1: cx, y1: y + 8 });
}

// strap: one strap from the first story to the recap; the tab says COMMENTARY or ON THE RECORD
const CM = 'COMMENTARY', OR = 'ON THE RECORD';
const STRAP = { out: 55.5, items: [
  { a: 8.0, tab: CM, hl: 'AMERICA GOT ITS JUST DESSERTS', sub: 'RELENTLESS AARON · OPINION' },
  { a: 12.5, tab: OR, hl: '55% OF WHITE VOTERS BACKED TRUMP IN 2024', sub: 'PEW RESEARCH CENTER · VALIDATED VOTER STUDY' },
  { a: 18.5, tab: OR, hl: '“THE GOLDEN AGE OF AMERICA BEGINS RIGHT NOW”', sub: 'INAUGURAL ADDRESS · JANUARY 20, 2025' },
  { a: 22.5, tab: CM, hl: 'WHAT THEY WANTED: MASS DEPORTATION', sub: 'RELENTLESS AARON · OPINION' },
  { a: 27.0, tab: OR, hl: 'DHS: MORE THAN 605,000 DEPORTATIONS', sub: 'SINCE JANUARY 20, 2025 · DHS, DECEMBER 10, 2025' },
  { a: 34.0, tab: CM, hl: '“TAKE THE SHACKLES OUT. PUT THE FLAGS IN.”', sub: 'RELENTLESS AARON · OPINION' },
  { a: 39.5, tab: OR, hl: 'TRUMP: SMITHSONIAN DWELLS ON “HOW BAD SLAVERY WAS”', sub: 'TRUTH SOCIAL, AUGUST 19, 2025 · AS REPORTED' },
  { a: 46.5, tab: CM, hl: 'THE GRIFT IS THE PRICE', sub: 'RELENTLESS AARON · OPINION' },
  { a: 50.5, tab: OR, hl: '$TRUMP MEME COIN LAUNCHED JANUARY 17, 2025', sub: 'THREE DAYS BEFORE THE INAUGURATION' },
] };
function strap(t) {
  if (t < STRAP.items[0].a || t >= STRAP.out) return;
  let S = STRAP.items[0]; for (const it of STRAP.items) if (t >= it.a) S = it;
  const x0 = 96, ty = 856, by = 904, bh = 104, bw = 1250;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x0 + 8, by + 8, bw, bh);
  ctx.fillStyle = C.paper; ctx.fillRect(x0, by, bw, bh);
  ctx.fillStyle = C.lemon; ctx.fillRect(x0, by, 14, bh);
  ctx.fillStyle = C.ink; ctx.fillRect(x0 + bw, by, 120, bh); ctx.fillStyle = C.lemon; ctx.fillRect(x0 + bw, by, 120, 6); text('RR', x0 + bw + 60, by + 70, F.b8(48), C.lemon, 'center', 2);
  ctx.save(); ctx.beginPath(); ctx.rect(x0 + 14, by, bw - 14, bh); ctx.clip();
  const fs = Math.floor(Math.min(52, 52 * 1150 / tw(S.hl, F.b8(52), 1)));
  text(S.hl, x0 + 44, by + 60, F.b8(fs), C.ink, 'left', 1, 'strap'); text(S.sub, x0 + 46, by + 92, F.b6(26), C.olive, 'left', 1.5, 'strape');
  ctx.restore();
  const flash = clamp(1 - (t - S.a) / .25), tabW = 40 + tw(S.tab, F.b8(30), 2);
  ctx.fillStyle = S.tab === OR ? C.paper : C.lemon; ctx.fillRect(x0, ty, tabW, by - ty);
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(x0, ty, tabW, by - ty); }
  if (S.tab === OR) { ctx.fillStyle = C.lemon; ctx.fillRect(x0, ty, 8, by - ty); }
  text(S.tab, x0 + 20, ty + 37, F.b8(30), C.ink, 'left', 2);
  ctx.restore();
}
// corner tag: the voice is synthetic, the words are the host's
function cornerTag(t) {
  if (t < 1.5 || t >= 58.5) return;
  const x = 96, y = 56, h = 64, w = 430;
  ctx.fillStyle = 'rgba(18,20,23,.82)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = C.gold; ctx.fillRect(x, y, 8, h);
  text('AI-VOICED COMMENTARY', x + 26, y + 28, F.mono(18), C.gold, 'left', 2, 'tag');
  text('Words: Relentless Aaron', x + 26, y + 54, F.b6(24), C.white, 'left', 1, 'tag2');
}
// source line (right-aligned, above the strap's end)
function sourceLine(t) {
  const S = SRC.find(s => t >= s[0] && t < s[1]); if (!S) return;
  ctx.globalAlpha = .8; text('SOURCE: ' + S[2], 1836, 840, F.mono(15), C.gold, 'right', 1.5, 'src'); ctx.globalAlpha = 1;
}
const SRC = [[12.5, 18.5, 'PEW RESEARCH CENTER, JUN 26 2025'], [18.5, 22.5, 'WHITE HOUSE TRANSCRIPT, JAN 20 2025'], [27.0, 34.0, 'DHS PRESS RELEASE, DEC 10 2025'],
  [39.5, 46.5, 'EO 14253; AP/AL JAZEERA, AUG 2025'], [50.5, 55.5, 'TRUMP ON X / TRUTH SOCIAL, JAN 17 2025']];
function bug(t) { if (t < 1.45 || t > 58.6) return; ctx.globalAlpha = .95; plate(1739, 86, .327, -1, 1); text('REPORT', 1640, 96, F.b8(26), C.white, 'right', 3); ctx.globalAlpha = 1; }
function stamp(t, a, x, y, word, rot = -.1) {
  const sk = seg(t, a, a + .16); if (sk <= 0) return;
  const s = 1 + .9 * (1 - eo(sk)), w = tw(word, F.b8(52), 4) + 90;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = clamp(sk * 3);
  ctx.fillStyle = 'rgba(18,20,23,.94)'; ctx.fillRect(-w / 2, -54, w, 108);
  ctx.strokeStyle = C.lemon; ctx.lineWidth = 4; ctx.strokeRect(-w / 2 + 10, -44, w - 20, 88); ctx.lineWidth = 1.5; ctx.strokeRect(-w / 2 + 18, -36, w - 36, 72);
  text(word, 0, 18, F.b8(52), C.lemon, 'center', 4, 'stamp'); ctx.restore();
  const rr = seg(t, a + .05, a + .5); if (rr < 1) { ctx.strokeStyle = `rgba(242,207,29,${.8 * (1 - rr)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, w / 2 + rr * 160, 70 + rr * 60, rot, 0, Math.PI * 2); ctx.stroke(); }
}
function eyebrow(t, a, s, x = 220, y = 150) { const k = eo(seg(t, a, a + .3)); ctx.globalAlpha = k; ctx.fillStyle = C.lemon; ctx.fillRect(x, y - 22, 10, 28); text(s, x + 26, y, F.mono(22), C.gold, 'left', 3, 'eye'); ctx.globalAlpha = 1; }

// ———————— sting ————————
function shotSting(t) {
  studioBg(t);
  [[.04, .3, 22, -60], [.1, .36, 8, 40]].forEach(([a, b, h, dy]) => {
    const k = seg(t, a, b); if (k <= 0 || k >= 1) return;
    ctx.save(); ctx.translate(960, 470 + dy); ctx.rotate(-.14);
    const x = lerp(-1900, 1900, eio(k)); ctx.fillStyle = C.lemon; ctx.fillRect(x - 700, -h / 2, 1400, h); ctx.restore();
  });
}
function stingLogo(t) {
  if (t > 1.5) return;
  const k = seg(t, .16, .42), fly = eio(seg(t, 1.12, 1.45));
  const shake = t > .42 && t < .7 ? Math.sin(t * 90) * 14 * (1 - seg(t, .42, .7)) : 0;
  const cx = lerp(960, 1739, fly) + shake, cy = lerp(450, 86, fly), s = lerp(back(k, 2.2), .327, fly);
  if (k > 0) { ctx.save(); ctx.translate(cx, cy); ctx.rotate((1 - eo(k)) * -.12 * (1 - fly)); ctx.translate(-cx, -cy); plate(cx, cy, s, seg(t, .85, 1.12) || -1, seg(t, .3, .7)); ctx.restore(); }
  const r = seg(t, .42, .8); if (r > 0 && r < 1) { ctx.strokeStyle = `rgba(242,207,29,${1 - r})`; ctx.lineWidth = 6 * (1 - r) + 1; ctx.beginPath(); ctx.ellipse(960, 450, 300 + r * 700, 120 + r * 300, 0, 0, Math.PI * 2); ctx.stroke(); }
  const wa = seg(t, .5, .8), wo = 1 - seg(t, 1.05, 1.18);
  if (wa > 0 && wo > 0) { ctx.save(); ctx.globalAlpha = wo; ctx.beginPath(); ctx.rect(960 - 620 * eo(wa), 560, 1240 * eo(wa), 160); ctx.clip();
    wordmark(960, 640, 66, 'center'); text('COMMENTARY · OCTOBER 28, 2026', 960, 690, F.mono(22), C.gold, 'center', 3); ctx.restore(); }
}

// ———————— rundown (opens and closes) ————————
const ROWS = [['01', "THE HEART'S DESIRE", 'WHAT AMERICA VOTED FOR'], ['02', 'THE GOLDEN AGE PROMISE', 'BORDERS, DEPORTATION, HISTORY'], ['03', 'THE PRICE', 'THE GRIFT']];
function rundown(t, close) {
  studioBg(t);
  ctx.save(); ctx.translate(0, 110);
  const A0 = close ? 55.5 : 1.6, m = (a, b) => close ? 1 : eo(seg(t, a, b)), x = 120;
  const tabTxt = close ? 'RECAP' : 'TONIGHT', ta = m(A0, A0 + .25), tabW = 40 + tw(tabTxt, F.b8(30), 2);
  ctx.fillStyle = C.lemon; ctx.fillRect(x, 170, tabW * ta, 50); if (ta > .9) text(tabTxt, x + 20, 208, F.b8(30), C.ink, 'left', 2, 'rtab');
  const r = (y, h, k, fn) => { if (k <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(0, y - h, 780, h + 24); ctx.clip(); ctx.translate(0, (1 - k) * (h + 24)); fn(); ctx.restore(); };
  r(400, 170, m(2.0, 2.3), () => text('JUST', x - 6, 400, F.b8(160), C.white, 'left', 2, 'rt1'));
  r(560, 170, m(2.15, 2.45), () => text('DESSERTS', x - 6, 560, F.b8(160), C.lemon, 'left', 2, 'rt2'));
  ctx.globalAlpha = m(2.5, 2.8); text('COMMENTARY · OCT 28 2026', x, 612, F.mono(22), C.gold, 'left', 3, 'rwk'); ctx.globalAlpha = 1;
  const X0 = 800, RW = 1024, RH = 120;
  ROWS.forEach(([n, a1, a2], i) => {
    const a = close ? 0 : 2.5 + i * .5, y = 170 + i * 150, k = close ? 1 : seg(t, a, a + .3); if (k <= 0) return;
    const sy = close ? 1 : back(k, 2.0);
    ctx.save(); ctx.translate(0, y); ctx.scale(1, Math.max(.02, sy)); ctx.translate(0, -y);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(X0 + 10, y + 10, RW, RH); ctx.fillStyle = C.ink2; ctx.fillRect(X0, y, RW, RH);
    ctx.fillStyle = C.lemon; ctx.fillRect(X0, y, 140, RH); text(n, X0 + 70, y + 90, F.b8(84), C.ink, 'center');
    text(a1, X0 + 176, y + 64, F.b8(52), C.white, 'left', 1, 'row' + i); text(a2, X0 + 178, y + 100, F.b6(26), C.gold, 'left', 2, 'rowe' + i);
    const sw = close ? 0 : seg(t, a + .05, a + .45);
    if (sw > 0 && sw < 1) { const gx = X0 + 140 + (RW - 140) * eio(sw); const g = ctx.createLinearGradient(gx - 160, 0, gx, 0); g.addColorStop(0, 'rgba(242,207,29,0)'); g.addColorStop(1, 'rgba(242,207,29,.28)'); ctx.fillStyle = g; ctx.fillRect(Math.max(X0 + 140, gx - 160), y, Math.min(160, gx - X0 - 140), RH); }
    if (close) { const ck = seg(t, 56.0 + i * .4, 56.22 + i * .4); if (ck > 0) { const s = back(ck, 2.6), cx = X0 + RW - 64, cy = y + 60;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-13, 1); ctx.lineTo(-3, 11); ctx.lineTo(15, -10); ctx.stroke(); ctx.restore(); } }
    ctx.restore();
  });
  if (!close) { const hl = seg(t, 5.6, 5.85); if (hl > 0) { ctx.strokeStyle = C.lemon; ctx.lineWidth = 5; ctx.globalAlpha = .6 + .4 * Math.cos((t - 5.6) * Math.PI * 4); ctx.strokeRect(X0 - 4, 166, RW * eo(hl) + 8, RH + 8); ctx.globalAlpha = 1; } }
  ctx.restore();
}

// ———————— quote card ————————
function quoteCard(t, Q) {
  studioBg(t);
  const zq = lerp(1, 1.035, eio(seg(t, Q.a, Q.a + 5)));
  ctx.save(); ctx.translate(900, 420); ctx.scale(zq, zq); ctx.translate(-900, -420);
  const a = Q.a, x = 220, fs = Q.fs || 104, lh = fs * 1.12;
  if (Q.eyebrow) eyebrow(t, a, Q.eyebrow, x + 150, 170);
  const qk = seg(t, a, a + .25); if (qk > 0) { const s = back(qk, 2.4); ctx.save(); ctx.translate(x - 40, 250); ctx.scale(s, s); text('“', -30, 150, F.b8(340), C.lemon, 'left'); ctx.restore(); }
  Q.lines.forEach((L, i) => { const k = eo(seg(t, a + .2 + i * .18, a + .5 + i * .18)); if (k <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 300 + i * lh - fs - 6, W, lh + 10); ctx.clip();
    text(L, x + 150, 300 + i * lh + (1 - k) * lh, F.b8(fs), C.white, 'left', 1, 'q' + i); ctx.restore(); });
  if (Q.ul) { const [li, word, at] = Q.ul, k = eio(seg(t, at, at + .35)); if (k > 0) { const pre = Q.lines[li].slice(0, Q.lines[li].indexOf(word));
    ctx.fillStyle = C.lemon; ctx.fillRect(x + 150 + tw(pre, F.b8(fs), 1), 300 + li * lh + 16, tw(word, F.b8(fs), 1) * k, 10); } }
  const ya = 300 + (Q.lines.length - 1) * lh + 60, zk = eo(seg(t, a + .6, a + .9));
  ctx.globalAlpha = zk; ctx.fillStyle = C.gold; ctx.fillRect(x + 150, ya, 60 * zk, 4);
  text(Q.who, x + 150, ya + 52, F.b8(36), C.paper, 'left', 2, 'qwho'); text(Q.src, x + 150, ya + 92, F.mono(20), C.grey2, 'left', 2, 'qsrc'); ctx.globalAlpha = 1;
  ctx.restore();
  if (Q.stamp) stamp(t, Q.stamp[0], 1560, 650, Q.stamp[1]);
}
const Q_HOST = { a: 8.0, lines: ['Sometimes the greatest', 'curse is that you get', "your heart's desire."], who: 'RELENTLESS AARON', src: 'COMMENTARY · OCTOBER 2026', ul: [2, "heart's desire", 10.4] };
const Q_GOLD = { a: 18.5, eyebrow: 'WHITE HOUSE · JANUARY 20, 2025', lines: ['… the golden age', 'of America begins', 'right now.'], who: 'DONALD J. TRUMP', src: 'INAUGURAL ADDRESS · AS PREPARED FOR DELIVERY', ul: [0, 'golden age', 20.2], stamp: [20.3, 'THE PROMISE'] };

// ———————— Pew bars ————————
function shotPew(t) {
  studioBg(t); const a = 12.5;
  eyebrow(t, a, 'PEW RESEARCH CENTER · VALIDATED VOTERS · JUNE 26, 2025', 160, 170);
  const tk = eo(seg(t, a + .15, a + .45)); ctx.save(); ctx.beginPath(); ctx.rect(0, 190, W, 110); ctx.clip();
  text('WHO VOTED TRUMP IN 2024', 160, 280 + (1 - tk) * 110, F.b8(84), C.white, 'left', 2, 'pewt'); ctx.restore();
  const bx = 160, bw = 1100, rows = [['WHITE VOTERS', 55, a + .8], ['BLACK VOTERS', 15, a + 1.6]];
  ctx.strokeStyle = C.gold; ctx.setLineDash([10, 10]); ctx.lineWidth = 3; const mx = bx + 260 + bw * .5;
  if (t > a + .5) { ctx.beginPath(); ctx.moveTo(mx, 340); ctx.lineTo(mx, 720); ctx.stroke(); text('50% · MAJORITY', mx + 12, 360, F.mono(18), C.gold, 'left', 2, 'maj'); }
  ctx.setLineDash([]);
  rows.forEach(([lab, v, at], i) => { const y = 420 + i * 170, k = eio(seg(t, at, at + .7)); if (t < at - .1) return;
    text(lab, bx, y + 62, F.b8(42), C.white, 'left', 2, 'pl' + i);
    ctx.fillStyle = C.ink3; ctx.fillRect(bx + 260, y, bw, 90);
    ctx.fillStyle = i === 0 ? C.lemon : C.grey; ctx.fillRect(bx + 260, y, bw * v / 100 * k, 90);
    const vk = eo(seg(t, at + .7, at + .95)); if (vk > 0) { ctx.save(); ctx.beginPath(); ctx.rect(bx + 260 + bw * v / 100 + 10, y - 10, 400, 100); ctx.clip();
      text(v + '%', bx + 260 + bw * v / 100 + 20, y + 72 + (1 - vk) * 90, F.b8(80), i === 0 ? C.lemon : C.grey, 'left', 1, vk >= 1 ? 'pv' + i : null); ctx.restore(); } });
  stamp(t, a + 2.6, 1560, 300, 'A MAJORITY', -.08);
}

// ———————— commentary big type ————————
function bigType(t, a, lines, accent, id) {
  studioBg(t);
  eyebrow(t, a, 'COMMENTARY · RELENTLESS AARON', 160, 140);
  lines.forEach((L, i) => { const k = eo(seg(t, a + .15 + i * .22, a + .5 + i * .22)); if (k <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 300 + i * 170 - 150, W, 180); ctx.clip();
    text(L, 160, 300 + i * 170 + (1 - k) * 170, F.b8(150), i === accent ? C.lemon : C.white, 'left', 2, id + i); ctx.restore(); });
}

// ———————— DHS split-flap board ————————
function flipTile(x, y, w, h, from, to, t0, t, font, col) {
  const p = from === null ? 1 : seg(t, t0, t0 + .26);
  ctx.save();
  const half = (s, top, sc = 1) => { if (s === null) return; ctx.save(); ctx.beginPath(); ctx.rect(x, top ? y : y + h / 2, w, h / 2); ctx.clip();
    ctx.translate(0, y + h / 2); ctx.scale(1, sc); ctx.translate(0, -(y + h / 2)); ctx.fillStyle = top ? '#2B3038' : '#262A31'; ctx.fillRect(x, y, w, h);
    text(s, x + w / 2, y + h * .76, font, col, 'center'); ctx.restore(); };
  if (p >= 1) { half(to, true); half(to, false); } else if (p <= 0) { half(from, true); half(from, false); }
  else { half(to, true); half(from, false); if (p < .5) half(from, true, 1 - p * 2); else half(to, false, (p - .5) * 2); }
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y + h / 2 - 1.5, w, 3); ctx.restore();
}
const FLAP_T = 28.0;
function shotDHS(t) {
  studioBg(t); const a = 27.0;
  eyebrow(t, a, 'DEPARTMENT OF HOMELAND SECURITY · DECEMBER 10, 2025', 160, 170);
  const tk = eo(seg(t, a + .15, a + .45)); ctx.save(); ctx.beginPath(); ctx.rect(0, 190, W, 110); ctx.clip();
  text('DEPORTATIONS SINCE JAN 20, 2025', 160, 280 + (1 - tk) * 110, F.b8(84), C.white, 'left', 2, 'dhst'); ctx.restore();
  const digits = ['6', '0', '5', ',', '0', '0', '0'], x0 = 160, y = 360, tw0 = 170, th = 220;
  let x = x0; digits.forEach((d, i) => { const w = d === ',' ? 70 : tw0;
    if (d === ',') text(',', x + 20, y + th - 20, F.b8(160), C.lemon, 'left'); else flipTile(x, y, w, th, '', d, FLAP_T + i * .12, t, F.b8(180), C.lemon);
    x += w + 14; });
  if (t > FLAP_T + 1.0) text('+', x + 10, y + th - 40, F.b8(160), C.lemon, 'left', 0, 'plus');
  const nk = eo(seg(t, a + 2.4, a + 2.8)); ctx.globalAlpha = nk;
  text('DHS counts formal deportations; it says a further 1.9 million “self-deported.”', 160, 680, F.b6(36), C.grey, 'left', 1, 'dhsn'); ctx.globalAlpha = 1;
  stamp(t, a + 3.4, 1560, 300, 'DHS FIGURE', -.08);
}

// ———————— Smithsonian: the post + the executive order ————————
function shotSmith(t) {
  studioBg(t); const a = 39.5;
  eyebrow(t, a, 'TRUTH SOCIAL · AUGUST 19, 2025 · AS REPORTED', 160, 170);
  const L = ['“…everything discussed is', 'how horrible our Country is,', 'how bad Slavery was…”'];
  L.forEach((s, i) => { const k = eo(seg(t, a + .2 + i * .2, a + .5 + i * .2)); if (k <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 300 + i * 100 - 86, 1180, 110); ctx.clip(); text(s, 160, 300 + i * 100 + (1 - k) * 100, F.b8(86), i === 2 ? C.lemon : C.white, 'left', 1, 'sm' + i); ctx.restore(); });
  const uk = eio(seg(t, a + 2.6, a + 3.0)); if (uk > 0) { ctx.fillStyle = C.lemon; ctx.fillRect(160 + tw('how ', F.b8(86), 1), 516, tw('bad Slavery', F.b8(86), 1) * uk, 9); }
  text('DONALD J. TRUMP', 160, 640, F.b8(36), C.paper, 'left', 2, 'smw');
  // the order flies in on the right
  const dk = seg(t, a + 1.4, a + 1.9); if (dk <= 0) return;
  const s = lerp(.1, 1, eo(dk)), rot = lerp(.5, -.05, eo(dk)), cx = 1530, cy = 440;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(-180, -235, 380, 490);
  ctx.fillStyle = C.paper; ctx.fillRect(-190, -245, 380, 490); ctx.fillStyle = C.ink; ctx.fillRect(-190, -245, 380, 64);
  text('EXECUTIVE ORDER 14253', 0, -202, F.b8(30), C.lemon, 'center', 2);
  text('Restoring Truth and Sanity', 0, -140, F.b8(32), C.ink, 'center');
  text('to American History', 0, -104, F.b8(32), C.ink, 'center');
  text('MARCH 27, 2025', 0, -66, F.mono(16), C.olive, 'center', 2);
  ctx.fillStyle = '#C9C4B4'; for (let i = 0; i < 9; i++) ctx.fillRect(-150, -30 + i * 30, 300 - (i % 3) * 40, 8);
  const hk = eio(seg(t, a + 3.4, a + 3.8)); if (hk > 0) { ctx.fillStyle = 'rgba(242,207,29,.85)'; ctx.fillRect(-160, 76, 320 * hk, 40); }
  text('“remove improper ideology”', 0, 106, F.b6(28), C.ink, 'center', 0, 'eo');
  text('SEC. 2 · SAVING OUR SMITHSONIAN', 0, 220, F.mono(14), C.olive, 'center', 2);
  ctx.restore();
}

// ———————— the price ————————
function shotCoin(t) {
  studioBg(t); const a = 50.5;
  eyebrow(t, a, "TRUMP'S POSTS ON X AND TRUTH SOCIAL · JANUARY 17, 2025", 160, 170);
  const tk = eo(seg(t, a + .15, a + .45)); ctx.save(); ctx.beginPath(); ctx.rect(0, 190, W, 130); ctx.clip();
  text('$TRUMP MEME COIN LAUNCHED', 160, 290 + (1 - tk) * 130, F.b8(104), C.white, 'left', 2, 'coin'); ctx.restore();
  [['JAN', 'JAN'], ['1', '1'], ['7', '7']].forEach(([f, to], i) => flipTile(160 + [0, 296, 458][i], 380, i ? 150 : 280, 200, '', to, a + .6 + i * .15, t, F.b8(150), C.lemon));
  const ak = eo(seg(t, a + 1.4, a + 1.8)); ctx.globalAlpha = ak;
  ctx.fillStyle = C.gold; ctx.fillRect(820, 470, 120 * ak, 6); text('INAUGURATION · JAN 20', 960, 492, F.b8(56), C.paper, 'left', 2, 'inaug'); ctx.globalAlpha = 1;
  stamp(t, a + 2.2, 1340, 700, '3 DAYS BEFORE', -.08);
}

// ———————— end card ————————
function shotEnd(t) {
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1A1D22'); g.addColorStop(1, '#0E1013'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(244,241,232,.04)'; for (let x = 40 - (t * 10) % 48; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
  ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.moveTo(1260, 0); ctx.lineTo(1290, 0); ctx.lineTo(1150, 790); ctx.lineTo(1120, 790); ctx.fill();
  const a = 58.75, m = (p, q) => eo(seg(t, a + p, a + q)), x = 150;
  const r = (y, h, k, fn) => { if (k <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(0, y - h, 1120, h + 30); ctx.clip(); ctx.translate(0, (1 - k) * (h + 30)); fn(); ctx.restore(); };
  ctx.globalAlpha = m(0, .2); text('THE RELENTLESS REPORT · COMMENTARY', x, 210, F.mono(24), C.gold, 'left', 3, 'e0'); ctx.globalAlpha = 1;
  r(360, 150, m(.05, .35), () => text('JUST DESSERTS', x - 4, 360, F.b8(150), C.white, 'left', 3, 'e1'));
  r(450, 80, m(.2, .5), () => text('Full episode on YouTube', x, 450, F.b6i(72), C.lemon, 'left', 1, 'e2'));
  ctx.fillStyle = C.lemon; ctx.fillRect(x, 492, 880 * eio(seg(t, a + .35, a + .65)), 2);
  const sk = back(seg(t, a + .6, a + .85), 2.2); if (sk > 0) { ctx.save(); ctx.translate(x + 170, 600); ctx.scale(sk, sk); ctx.fillStyle = '#E11D2A'; ctx.beginPath(); ctx.roundRect(-170, -50, 340, 100, 50); ctx.fill(); text('SUBSCRIBE', 0, 18, F.b8(52), C.white, 'center', 3, 'sub'); ctx.restore(); }
  ctx.globalAlpha = m(.8, 1.1); ctx.fillStyle = C.line; ctx.fillRect(x, 816, 1620, 1);
  text('Sources and credits in the description', x, 866, F.b6(30), C.grey, 'left', 1, 'cr0');
  text('AI voice reading the commentary of Relentless Aaron', x, 906, F.b6(30), C.grey, 'left', 1, 'cr1');
  ctx.globalAlpha = 1;
  ctx.globalAlpha = m(.25, .55); plate(1600, 360, .62, seg(t, a + .9, a + 1.35) || -1, seg(t, a + .25, a + .8)); wordmark(1600, 520, 40, 'center'); ctx.globalAlpha = 1;
}

// ———————— compositing ————————
function wipeBand(bx) { ctx.fillStyle = C.lemon; ctx.fillRect(bx - 84, 0, 84, H); ctx.fillStyle = C.ink; ctx.fillRect(bx, 0, 5, H); ctx.fillStyle = C.gold; ctx.fillRect(bx + 5, 0, 14, H); }
function layer(fn, t, tov) { fn(t); cornerTag(tov); sourceLine(tov); strap(tov); }
function wipe(t, a, b, oldFn, newFn) {
  const bx = lerp(-140, W + 140, eio(seg(t, a, b)));
  const n0 = TX.length; layer(newFn, t, b + .001); const NEW = TX.splice(n0);
  ctx.save(); ctx.beginPath(); ctx.rect(bx, 0, W, H); ctx.clip(); layer(oldFn, t, a - .001); ctx.restore();
  const OLD = TX.splice(n0); TX.push(...(seg(t, a, b) < .5 ? OLD : NEW));
  wipeBand(bx);
}
const OPEN = t => rundown(t, false), RECAP = t => rundown(t, true);
const HOST = t => quoteCard(t, Q_HOST), GOLD = t => quoteCard(t, Q_GOLD);
const DEPORT = t => bigType(t, 22.5, ['MASS', 'DEPORTATION.', 'ON A SCALE NO', 'DEMOCRAT WOULD ALLOW.'], 1, 'dp');
const FLAGS = t => bigType(t, 34.0, ['TAKE THE', 'SHACKLES OUT.', 'PUT THE', 'FLAGS IN.'], 3, 'fl');
const GRIFT = t => bigType(t, 46.5, ['THEY WANTED', 'IT SO BADLY.', 'THE GRIFT', 'IS THE PRICE.'], 3, 'gr');
const SCENES = [[1.5, OPEN], [8.0, HOST], [12.5, shotPew], [18.5, GOLD], [22.5, DEPORT], [27.0, shotDHS], [34.0, FLAGS], [39.5, shotSmith], [46.5, GRIFT], [50.5, shotCoin], [55.5, RECAP], [58.75, shotEnd]];
const WIPES = [[1.2, 1.5], [7.7, 8.0], [18.2, 18.5], [46.2, 46.5], [55.2, 55.5]];   // band wipes between parts; hard cuts inside a part
const CUTS = SCENES.map(s => s[0]).filter(c => !WIPES.some(w => Math.abs(w[1] - c) < .01));
function scene(t) {
  if (t < 1.5) { if (t >= 1.2) wipe(t, 1.2, 1.5, shotSting, OPEN); else layer(shotSting, t, t); stingLogo(t); return; }
  const w = WIPES.find(([a, b]) => t >= a && t < b);
  if (w) { const i = SCENES.findIndex(s => Math.abs(s[0] - w[1]) < .01); wipe(t, w[0], w[1], SCENES[i - 1][1], SCENES[i][1]); return; }
  if (t >= 58.5 && t < 58.75) {
    layer(RECAP, t, t); const k = eio(seg(t, 58.5, 58.75)), x = W - k * (W + 340);
    ctx.save(); ctx.beginPath(); ctx.moveTo(x + 340, 0); ctx.lineTo(W + 340, 0); ctx.lineTo(W + 340, H); ctx.lineTo(x, H); ctx.closePath(); ctx.clip(); shotEnd(t); ctx.restore();
    ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.moveTo(x + 340, 0); ctx.lineTo(x + 380, 0); ctx.lineTo(x + 40, H); ctx.lineTo(x, H); ctx.fill(); return;
  }
  let fn = SCENES[0][1]; for (const [a, f] of SCENES) if (t >= a) fn = f;
  layer(fn, t, t);
}
function render(t) {
  TX = []; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  scene(t); bug(t);
  if (t > 62.8) { ctx.fillStyle = `rgba(0,0,0,${seg(t, 62.8, 63.5)})`; ctx.fillRect(0, 0, W, H); }
}

// ———————— events for the mix, cues for the .srt ————————
const EV = [{ t: 0, type: 'sting' }];
WIPES.forEach(([a]) => EV.push({ t: a, type: 'whoosh' }));
CUTS.forEach(c => EV.push({ t: c, type: 'timp' }));
[2.5, 3.0, 3.5].forEach(x => EV.push({ t: x, type: 'glock' }));
[[56.0, 0], [56.4, 1], [56.8, 2]].forEach(([x, i]) => EV.push({ t: x, type: 'tick', i }));
[[15.1, 'A MAJORITY'], [20.3, ''], [30.4, ''], [52.7, '']].forEach(([x]) => EV.push({ t: x, type: 'stamp' }));
for (let i = 0; i < 6; i++) EV.push({ t: FLAP_T + i * .12, type: 'flap' });
[0, 1, 2].forEach(i => EV.push({ t: 51.1 + i * .15, type: 'flap' }));
EV.push({ t: 40.9, type: 'paper' }); EV.push({ t: 58.5, type: 'whoosh' }); EV.push({ t: 58.75, type: 'endhit' });
for (const [id, at] of Object.entries(VO_AT)) EV.push({ t: at, type: 'vo', id });
window.CUES = Object.entries(VO_AT).map(([id, at]) => ({ id, t0: at, text: SUB[id] }));
await document.fonts.ready;
for (const f of [F.b8(40), F.b6(40), F.b6i(40), F.mono(20)]) await document.fonts.load(f);
window.EV = EV; window.DUR = DUR; window.render = render; window.TEXTS = t => { render(t); return TX.slice(); }; window.READY = true;
