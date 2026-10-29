// THE RELENTLESS REPORT · "Her Wings Were Clipped" — vertical (1080×1920) Broadcast News Package, cut to the host's own voiceover.
// Package parts adapted from styles/news-package/demo/main.js (MIT), as in ../just-desserts. Every on-screen fact is in FACTS.md.
// Layout for a vertical feed: bug and tags at the top, the graphic in y 240–1330, the strap at y 1350–1500, nothing important below (platform captions/buttons).
const W = 1080, H = 1920, DUR = 96.5;
const cv = document.getElementById('out'); const ctx = cv.getContext('2d');
const C = { ink: '#121417', ink2: '#1B1E23', ink3: '#22262C', line: '#454B55', lemon: '#F2CF1D', lemonL: '#F8DE4A', lemonD: '#D8B30C', gold: '#D4B064',
  paper: '#F4F1E8', white: '#FFFFFF', grey: '#C9CCD2', grey2: '#7D838D', olive: '#6E5A1E', alarm: '#FE6B3D' };
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
  ctx.letterSpacing = ls + 'px'; ctx.fillText(s, x, y); const w = ctx.measureText(s).width; ctx.letterSpacing = '0px';
  if (id) { const m = ctx.getTransform(); const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2; const fs = parseInt(font.match(/ (\d+)px/)[1]);
    const p0 = m.transformPoint({ x: x0, y: y - fs }), p1 = m.transformPoint({ x: x0 + w, y: y + 8 });
    TX.push({ id, text: s, x0: Math.min(p0.x, p1.x), y0: Math.min(p0.y, p1.y), x1: Math.max(p0.x, p1.x), y1: Math.max(p0.y, p1.y) }); }
  return w;
}
function tw(s, font, ls = 0) { ctx.font = font; ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }
const fit = (s, size, maxW, ls = 0, f = F.b8) => Math.floor(Math.min(size, size * maxW / tw(s, f(size), ls)));

const IM = {};
function loadImg(src) { return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(src); i.src = src; }); }
function photo(img, fx, fy, s, rx, ry, rw, rh) {
  s = Math.max(s, rw / img.width, rh / img.height);
  let ox = rx + rw / 2 - fx * s, oy = ry + rh / 2 - fy * s;
  ox = Math.min(rx, Math.max(rx + rw - img.width * s, ox)); oy = Math.min(ry, Math.max(ry + rh - img.height * s, oy));
  ctx.save(); ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip(); ctx.drawImage(img, ox, oy, img.width * s, img.height * s); ctx.restore();
}
const GR = [];
function makeGrain() { for (let k = 0; k < 6; k++) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (hash(i * .37 + k * 9.1) + hash(i * .11 + k) - 1) * 150; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); GR.push(c); } }
function grain(t, rx, ry, rw, rh, a = .07) { const f = Math.floor(t * 30), c = GR[f % GR.length]; ctx.save(); ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = a;
  const ox = -Math.floor(hash(f) * 256), oy = -Math.floor(hash(f + 7) * 256); for (let x = rx + ox; x < rx + rw; x += 256) for (let y = ry + oy; y < ry + rh; y += 256) ctx.drawImage(c, x, y); ctx.restore(); }

// ———————— timeline (from the host's voiceover cut: vo_segments.json + word times) ————————
const T = { hook: .8, police: 5.38, call: 10.0, prize: 18.78, gift: 19.45, who: 25.9, flight: 30.3, standby: 33.58, daytona: 35.8, note: 36.8, gd: 44.48, total: 46.95, amt: 52.12,
  arrest: 54.45, miami: 60.34, customs: 66.34, sheriff: 67.4, clipped: 72.3, charges: 73.6, innocent: 76.64, close: 79.0, danger: 82.4, smile: 87.0, pass: 90.38, end: 92.8 };

// ———————— package parts ————————
function studioBg(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(760, 520, 60, 760, 520, 1300); rg.addColorStop(0, 'rgba(242,207,29,.15)'); rg.addColorStop(1, 'rgba(242,207,29,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) { const x = ((i * 300 + t * (30 + i * 6)) % 2000) - 300, w = 40 + hash(i) * 110; ctx.fillStyle = `rgba(242,207,29,${.025 + hash(i + 9) * .035})`;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w - 700, H); ctx.lineTo(x - 700, H); ctx.fill(); }
  ctx.fillStyle = 'rgba(244,241,232,.05)'; for (let x = 30 - (t * 12) % 48; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
}
function plate(cx, cy, s, glint = -1, drop = 1) {
  const w = 520 * s, h = 180 * s, k = h * .28;
  ctx.save(); ctx.translate(cx, cy);
  const path = new Path2D(); path.moveTo(-w / 2 + k, -h / 2); path.lineTo(w / 2 + k, -h / 2); path.lineTo(w / 2 - k, h / 2); path.lineTo(-w / 2 - k, h / 2); path.closePath();
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, C.lemonL); g.addColorStop(1, C.lemonD); ctx.fillStyle = g; ctx.fill(path); ctx.save(); ctx.clip(path);
  const gx = -w / 2 - k;
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(gx + 2 * k, -h / 2); ctx.lineTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.lineTo(gx, h / 2); ctx.fill();
  ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + 2 * k + w * .11, -h / 2); ctx.lineTo(gx + w * .11, h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.fill();
  const word = 'RELENTLESS'; ctx.font = F.b8(100); const fsz = Math.min(h * .62, 100 * w * .7 / ctx.measureText(word).width); ctx.font = F.b8(fsz); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  let x = -w * .3;
  [...word].forEach((L, i) => { const d = clamp(drop * 4.6 - i * .4), yy = fsz * .36 + (1 - eo(d)) * -h * 1.1; ctx.save(); ctx.globalAlpha = ctx.globalAlpha * clamp(d * 3); ctx.fillStyle = C.ink; ctx.fillText(L, x, yy); ctx.restore(); x += ctx.measureText(L).width; });
  if (glint >= 0 && glint <= 1) { const gx2 = lerp(-w, w, glint), gg = ctx.createLinearGradient(gx2 - 80 * s, 0, gx2 + 80 * s, 0); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, 'rgba(255,255,255,.6)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gg; ctx.fillRect(-w, -h, w * 2, h * 2); }
  ctx.restore(); ctx.restore();
}
function wordmark(x, y, size, align = 'center') {
  const parts = [['THE ', C.grey], ['RELENTLESS ', C.white], ['REPORT', C.lemon]], ls = size * .12, tot = parts.reduce((a, [s]) => a + tw(s, F.b8(size), ls), 0);
  let cx = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x; for (const [s, c] of parts) cx += text(s, cx, y, F.b8(size), c, 'left', ls);
}
// strap: the tab names the part of the story; PROFILE names the accused; COMMENTARY is the host's opinion
const STRAP = { out: T.end, items: [
  { a: T.hook, tab: 'CRIME', hl: 'FLIGHT ATTENDANT ACCUSED OF SCAMMING A PALM COAST SENIOR', sub: 'FLAGLER COUNTY SHERIFF’S OFFICE · ALLEGATIONS' },
  { a: T.call, tab: 'THE SCAM', hl: 'A “SWEEPSTAKES” CALL: SHE’S TOLD SHE WON A PRIZE', sub: 'CALLER POSED AS PUBLISHERS CLEARING HOUSE · INVESTIGATORS' },
  { a: T.gift, tab: 'THE SCAM', hl: 'STEP ONE: MAIL A $500 GIFT CARD TO BROOKLYN', sub: 'ADDRESSED TO DESTINY BLAKE · INVESTIGATORS' },
  { a: T.who, tab: 'PROFILE', hl: 'DESTINY BLAKE, 24 · ACCUSED', sub: 'AMERICAN AIRLINES FLIGHT ATTENDANT' },
  { a: T.flight, tab: 'THE TRIP', hl: 'NOV 18: EMPLOYEE TRAVEL PERK, NEW YORK TO DAYTONA BEACH', sub: 'THEN BY UBER TO PALM COAST · INVESTIGATORS' },
  { a: T.note, tab: 'THE NOTE', hl: 'NOTE TOLD THE VICTIM TO SAY BLAKE WAS HER GRANDDAUGHTER', sub: 'LEFT AT THE HOME, PER INVESTIGATORS · FLAGLERLIVE' },
  { a: T.total, tab: 'THE TOTAL', hl: 'ESTIMATED LOSS: ABOUT $25,310', sub: 'FLAGLER COUNTY SHERIFF’S OFFICE INVESTIGATION' },
  { a: T.arrest, tab: 'THE ARREST', hl: 'ARRESTED AT MIAMI INTERNATIONAL AIRPORT', sub: 'ON A FLAGLER COUNTY WARRANT · FRIDAY, OCT 23, 2026' },
  { a: T.sheriff, tab: 'PROFILE', hl: 'SHERIFF RICK STALY', sub: 'FLAGLER COUNTY SHERIFF’S OFFICE' },
  { a: T.charges, tab: 'THE CASE', hl: 'CHARGES ARE ALLEGATIONS · RELEASED ON $30,000 BOND', sub: 'PRESUMED INNOCENT UNLESS PROVEN GUILTY' },
  { a: T.close, tab: 'COMMENTARY', hl: 'RELENTLESS TIMES', sub: 'RELENTLESS AARON · OPINION' },
] };
function strap(t) {
  if (t < STRAP.items[0].a || t >= STRAP.out) return;
  let S = STRAP.items[0]; for (const it of STRAP.items) if (t >= it.a) S = it;
  const x0 = 48, ty = 1352, by = 1400, bh = 108, bw = 864;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x0 + 8, by + 8, bw + 120, bh);
  ctx.fillStyle = C.paper; ctx.fillRect(x0, by, bw, bh); ctx.fillStyle = C.lemon; ctx.fillRect(x0, by, 14, bh);
  ctx.fillStyle = C.ink; ctx.fillRect(x0 + bw, by, 120, bh); ctx.fillStyle = C.lemon; ctx.fillRect(x0 + bw, by, 120, 6); text('RR', x0 + bw + 60, by + 72, F.b8(48), C.lemon, 'center', 2);
  ctx.save(); ctx.beginPath(); ctx.rect(x0 + 14, by, bw - 14, bh); ctx.clip();
  const fs = fit(S.hl, 48, bw - 60, 1), fs2 = fit(S.sub, 24, bw - 60, 1.5, F.b6);
  text(S.hl, x0 + 36, by + 58, F.b8(fs), C.ink, 'left', 1, 'strap'); text(S.sub, x0 + 38, by + 92, F.b6(fs2), C.olive, 'left', 1.5, 'strape');
  ctx.restore();
  const flash = clamp(1 - (t - S.a) / .25), tabW = 40 + tw(S.tab, F.b8(30), 2), lightTab = S.tab === 'PROFILE';
  ctx.fillStyle = lightTab ? C.paper : C.lemon; ctx.fillRect(x0, ty, tabW, by - ty);
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(x0, ty, tabW, by - ty); }
  if (lightTab) { ctx.fillStyle = C.lemon; ctx.fillRect(x0, ty, 8, by - ty); }
  text(S.tab, x0 + 20, ty + 37, F.b8(30), C.ink, 'left', 2);
  ctx.restore();
}
// corner tags: ILLUSTRATION over the stock photo of a phone; SCHEMATIC over the route map
const TAGS = [[T.call, T.gift, 'ILLUSTRATION', 'Stock photo, not the people in this case'], [T.who, T.note, 'SCHEMATIC', 'Route per investigators']];
function cornerTag(t) {
  const A = TAGS.find(r => t >= r[0] && t < r[1]); if (!A) return;
  const x = 48, y = 210, h = 64, w = 470;
  ctx.fillStyle = 'rgba(18,20,23,.85)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = C.gold; ctx.fillRect(x, y, 8, h);
  text(A[2], x + 26, y + 28, F.mono(18), C.gold, 'left', 2, 'tag'); text(A[3], x + 26, y + 54, F.b6(24), C.white, 'left', 1, 'tag2');
}
const SRC = [[T.hook, T.call, 'FLAGLER COUNTY SHERIFF / NEWS4JAX'], [T.call, T.who, 'FLAGLERLIVE · NEWS4JAX · WFTV'], [T.who, T.note, 'FLAGLERLIVE · NEWS4JAX'], [T.note, T.total, 'FLAGLERLIVE, OCT 27 2026'],
  [T.total, T.arrest, 'INVESTIGATION VIA FLAGLERLIVE · WFTV'], [T.arrest, T.sheriff, 'NEWS4JAX · PHOTO: Q. SOLOVIEV, CC BY 4.0'], [T.sheriff, T.charges, 'NEWS4JAX · FLAGLERLIVE'], [T.charges, T.close, 'NEWS4JAX · FLAGLERLIVE · WFTV']];
function sourceLine(t) { const S = SRC.find(s => t >= s[0] && t < s[1]); if (!S) return; ctx.globalAlpha = .82; text('SOURCE: ' + S[2], 1032, 1334, F.mono(15), C.gold, 'right', 1.5, 'src'); ctx.globalAlpha = 1; }
function bug(t) { if (t < .75 || t > T.end + .1) return; ctx.globalAlpha = .95; plate(880, 140, .36, -1, 1); text('REPORT', 790, 152, F.b8(28), C.white, 'right', 3); ctx.globalAlpha = 1; }
function stamp(t, a, x, y, word, rot = -.1, col = C.lemon) {
  const sk = seg(t, a, a + .16); if (sk <= 0) return;
  const s = 1 + .9 * (1 - eo(sk)), w = tw(word, F.b8(56), 4) + 90;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = clamp(sk * 3);
  ctx.fillStyle = 'rgba(18,20,23,.94)'; ctx.fillRect(-w / 2, -56, w, 112);
  ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.strokeRect(-w / 2 + 10, -46, w - 20, 92); ctx.lineWidth = 1.5; ctx.strokeRect(-w / 2 + 18, -38, w - 36, 76);
  text(word, 0, 20, F.b8(56), col, 'center', 4, 'stamp' + word); ctx.restore();
  const rr = seg(t, a + .05, a + .5); if (rr < 1) { ctx.strokeStyle = `rgba(242,207,29,${.8 * (1 - rr)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, w / 2 + rr * 140, 72 + rr * 60, rot, 0, Math.PI * 2); ctx.stroke(); }
}
function eyebrow(t, a, s, x = 60, y = 340) { const k = eo(seg(t, a, a + .3)); ctx.globalAlpha = k; ctx.fillStyle = C.lemon; ctx.fillRect(x, y - 22, 10, 28); text(s, x + 26, y, F.mono(fit(s, 24, W - x - 90, 3, F.mono)), C.gold, 'left', 3, 'eye' + a); ctx.globalAlpha = 1; }
function push(t, at, s, x, y, font, col, id, h = 140) { const k = eo(seg(t, at, at + .32)); if (k <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(0, y - h + 14, W, h + 16); ctx.clip(); text(s, x, y + (1 - k) * h, font, col, 'left', 2, id); ctx.restore(); }

// ———————— sting ————————
function shotSting(t) { studioBg(t); [[.03, .25, 22, -60], [.08, .3, 8, 40]].forEach(([a, b, h, dy]) => { const k = seg(t, a, b); if (k <= 0 || k >= 1) return; ctx.save(); ctx.translate(540, 800 + dy); ctx.rotate(-.2); const x = lerp(-1400, 1400, eio(k)); ctx.fillStyle = C.lemon; ctx.fillRect(x - 600, -h / 2, 1200, h); ctx.restore(); }); }
function stingLogo(t) {
  if (t > .8) return;
  const k = seg(t, .1, .3), fly = eio(seg(t, .55, .8)), cx = lerp(540, 880, fly), cy = lerp(800, 140, fly), s = lerp(back(k, 2.2) * 1.4, .36, fly);
  if (k > 0) plate(cx, cy, s, seg(t, .35, .55) || -1, seg(t, .2, .45));
  const r = seg(t, .3, .7); if (r > 0 && r < 1) { ctx.strokeStyle = `rgba(242,207,29,${1 - r})`; ctx.lineWidth = 6 * (1 - r) + 1; ctx.beginPath(); ctx.ellipse(540, 800, 380 + r * 500, 140 + r * 260, 0, 0, Math.PI * 2); ctx.stroke(); }
}

// ———————— 1 · title ————————
function shotTitle(t) {
  studioBg(t);
  eyebrow(t, T.hook + .1, 'FLAGLER COUNTY, FLORIDA · OCTOBER 2026', 60, 400);
  [['HER', C.white], ['WINGS', C.white], ['WERE', C.white], ['CLIPPED', C.lemon]].forEach(([s, c], i) => push(t, T.hook + .25 + i * .22, s, 54, 600 + i * 190, F.b8(230), c, 'ti' + i, 210));
  const k = eo(seg(t, T.police, T.police + .35)); if (k > 0) { ctx.globalAlpha = k; ctx.fillStyle = C.lemon; ctx.fillRect(60, 1210, 120 * k, 5);
    text('Police: a flight attendant used her travel perks', 60, 1262, F.b6(40), C.paper, 'left', 1, 'tsub1'); text('to scam a 75-year-old woman.', 60, 1306, F.b6(40), C.paper, 'left', 1, 'tsub2'); ctx.globalAlpha = 1; }
}
// ———————— 2 · the call ————————
function shotCall(t) {
  studioBg(t);
  const z = lerp(1.0, 1.08, seg(t, T.call, T.gift)); photo(IM.phone, 560, 1250, .62 * z, 0, 290, W, 760); grain(t, 0, 290, W, 760);
  const g = ctx.createLinearGradient(0, 760, 0, 1050); g.addColorStop(0, 'rgba(18,20,23,0)'); g.addColorStop(1, 'rgba(18,20,23,1)'); ctx.fillStyle = g; ctx.fillRect(0, 760, W, 290);
  eyebrow(t, T.call + .2, 'NOVEMBER 2025 · PALM COAST, FL', 60, 1090);
  push(t, T.call + .5, 'A 75-YEAR-OLD', 54, 1190, F.b8(96), C.white, 'c1', 100);
  push(t, T.call + .75, 'ANSWERS THE PHONE.', 54, 1290, F.b8(96), C.white, 'c2', 100);
  const q = eo(seg(t, T.prize - 2.2, T.prize - 1.9)); if (q > 0) { ctx.save(); ctx.translate(540, 520); ctx.scale(back(q, 2), back(q, 2)); ctx.fillStyle = 'rgba(18,20,23,.92)'; ctx.fillRect(-380, -80, 760, 160); ctx.fillStyle = C.lemon; ctx.fillRect(-380, -80, 760, 8);
    text('“YOU’VE WON A PRIZE.”', 0, 30, F.b8(76), C.lemon, 'center', 2, 'prize'); ctx.restore(); }
}
// ———————— 3 · the gift card ————————
function shotGift(t) {
  studioBg(t);
  eyebrow(t, T.gift + .05, 'STEP ONE · PER INVESTIGATORS', 60, 340);
  const k = eo(seg(t, T.gift + .2, T.gift + .7)), cx = 540, cy = 690;
  ctx.save(); ctx.translate(cx + (1 - k) * 900, cy); ctx.rotate(lerp(.4, -.06, k));
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(-370, -200, 760, 420); ctx.fillStyle = C.paper; ctx.fillRect(-380, -210, 760, 420);
  ctx.strokeStyle = '#B7B19E'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-380, -210); ctx.lineTo(0, 30); ctx.lineTo(380, -210); ctx.stroke();
  ctx.fillStyle = C.lemon; ctx.fillRect(-330, -170, 300, 190); ctx.fillStyle = C.ink; ctx.fillRect(-330, -170, 300, 40);
  text('GIFT CARD', -180, -140, F.b8(30), C.lemon, 'center', 3); text('$500', -180, -12, F.b8(120), C.ink, 'center', 0, 'gc');
  text('TO:', 30, 60, F.mono(22), C.olive, 'left', 3); text('DESTINY BLAKE', 30, 110, F.b8(54), C.ink, 'left', 1, 'to1'); text('BROOKLYN, NEW YORK', 30, 160, F.b8(40), C.ink, 'left', 2, 'to2');
  ctx.restore();
  push(t, T.gift + 1.0, 'STEP ONE:', 54, 1120, F.b8(96), C.white, 'g1', 100);
  push(t, T.gift + 1.25, 'SEND $500.', 54, 1225, F.b8(96), C.lemon, 'g2', 100);
}
// ———————— 4 · the route map (one long take) ————————
let STATES = null;
const PTS = { bk: [-73.94, 40.68, 'BROOKLYN, NY'], dab: [-81.06, 29.18, 'DAYTONA BEACH'], pc: [-81.21, 29.58, 'PALM COAST'], mia: [-80.29, 25.79, 'MIAMI'] };
function mapView(t) {   // camera in lon/lat: centre + pixels per degree
  const k1 = eio(seg(t, T.standby + .2, T.daytona + .2));
  return { lon: lerp(-77.6, -81.0, k1), lat: lerp(35.0, 29.4, k1), ppd: lerp(56, 230, k1) };
}
function proj(v, lon, lat) { const c = Math.cos(31 * Math.PI / 180); return [540 + (lon - v.lon) * v.ppd * c, 780 - (lat - v.lat) * v.ppd]; }
function shotMap(t) {
  studioBg(t); const v = mapView(t);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 290, W, 1000); ctx.clip();
  ctx.fillStyle = '#0D1A24'; ctx.fillRect(0, 290, W, 1000);
  for (const s of STATES) { ctx.beginPath(); for (const r of s.rings) r.forEach(([lo, la], i) => { const [x, y] = proj(v, lo, la); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.fillStyle = s.name === 'Florida' ? '#2A2F37' : C.ink3; ctx.fill('evenodd'); ctx.strokeStyle = '#3B414B'; ctx.lineWidth = 1.5; ctx.stroke(); }
  const dot = (p, a, label, right = true) => { const k = eo(seg(t, a, a + .25)); if (k <= 0) return; const [x, y] = proj(v, p[0], p[1]);
    const rr = seg(t, a, a + .9); if (rr < 1) { ctx.strokeStyle = `rgba(242,207,29,${1 - rr})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 14 + rr * 60, 0, 7); ctx.stroke(); }
    ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.arc(x, y, 12 * k, 0, 7); ctx.fill(); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x, y, 5 * k, 0, 7); ctx.fill();
    ctx.globalAlpha = k; const tw0 = tw(label, F.b8(34), 2) + 30, lx = right ? x + 26 : x - 26 - tw0; ctx.fillStyle = 'rgba(18,20,23,.9)'; ctx.fillRect(lx, y - 26, tw0, 48);
    text(label, lx + 15, y + 11, F.b8(34), C.paper, 'left', 2, 'lab' + label); ctx.globalAlpha = 1; };
  // the flight: an arc from Brooklyn to Daytona Beach that draws itself
  const fk = eio(seg(t, T.standby - 1.6, T.standby + .3));
  if (fk > 0) { const A = proj(v, ...PTS.bk.slice(0, 2)), B = proj(v, ...PTS.dab.slice(0, 2)), M = [(A[0] + B[0]) / 2 + 4.2 * v.ppd, (A[1] + B[1]) / 2];
    ctx.strokeStyle = C.lemon; ctx.lineWidth = 6; ctx.setLineDash([16, 12]); ctx.beginPath(); const n = 60;
    for (let i = 0; i <= n * fk; i++) { const u = i / n, x = (1 - u) ** 2 * A[0] + 2 * u * (1 - u) * M[0] + u * u * B[0], y = (1 - u) ** 2 * A[1] + 2 * u * (1 - u) * M[1] + u * u * B[1]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.setLineDash([]); }
  // the Uber leg: Daytona Beach → Palm Coast
  const uk = eio(seg(t, T.daytona - 1.8, T.daytona - 1.3));
  if (uk > 0) { const A = proj(v, ...PTS.dab.slice(0, 2)), B = proj(v, ...PTS.pc.slice(0, 2)); ctx.strokeStyle = C.paper; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(lerp(A[0], B[0], uk), lerp(A[1], B[1], uk)); ctx.stroke(); }
  dot(PTS.bk, T.who + .2, PTS.bk[2], false);
  dot(PTS.dab, T.standby + .2, PTS.dab[2], false);
  dot(PTS.pc, T.daytona - 1.3, PTS.pc[2], true);
  ctx.restore();
  ctx.fillStyle = 'rgba(18,20,23,.9)'; ctx.fillRect(0, 290, W, 120);
  eyebrow(t, T.who, 'NOVEMBER 18, 2025 · PER INVESTIGATORS', 60, 340);
  const ck = eo(seg(t, T.flight + .2, T.flight + .5)); ctx.globalAlpha = ck; text('Flew as a non-paying employee passenger', 86, 390, F.b6(36), C.paper, 'left', 1, 'mapnote'); ctx.globalAlpha = 1;
}
// ———————— 5 · the note ————————
function shotNote(t) {
  studioBg(t);
  eyebrow(t, T.note + .05, 'LEFT AT THE VICTIM’S HOME · PER INVESTIGATORS', 60, 340);
  const k = eo(seg(t, T.note + .3, T.note + .8)); if (k <= 0) return;
  ctx.save(); ctx.translate(540, 760); ctx.rotate(lerp(.3, -.04, k)); ctx.scale(lerp(.2, 1, k), lerp(.2, 1, k));
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(-400, -330, 820, 680); ctx.fillStyle = '#F7F1D0'; ctx.fillRect(-410, -340, 820, 680);
  ctx.strokeStyle = 'rgba(80,110,160,.35)'; ctx.lineWidth = 2; for (let y = -230; y < 330; y += 64) { ctx.beginPath(); ctx.moveTo(-410, y); ctx.lineTo(410, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(200,60,60,.45)'; ctx.beginPath(); ctx.moveTo(-330, -340); ctx.lineTo(-330, 340); ctx.stroke();
  text('NOTE (paraphrased from the investigation)', -300, -270, F.mono(20), C.olive, 'left', 1, 'n0');
  const L = ['Call the Apple Card company.', 'Tell them Blake is your', 'granddaughter,', 'and that she’s authorized', 'to use the card.'];
  L.forEach((s, i) => { const a = T.note + .9 + i * .25; if (t < a) return; text(s, -300, -170 + i * 64, F.b6(52), '#1D2A44', 'left', 0, 'nl' + i); });
  const hk = eio(seg(t, T.gd - .1, T.gd + .3)); if (hk > 0) { ctx.fillStyle = 'rgba(242,207,29,.6)'; ctx.fillRect(-306, -170 + 2 * 64 - 44, tw('granddaughter,', F.b6(52)) * hk + 12, 56); text('granddaughter,', -300, -170 + 2 * 64, F.b6(52), '#1D2A44'); }
  ctx.restore();
  stamp(t, T.gd - .3, 720, 1210, 'HER “GRANDDAUGHTER”', -.06);
}
// ———————— 6 · the total ————————
function flipTile(x, y, w, h, from, to, t0, t, font, col) {
  const p = from === null ? 1 : seg(t, t0, t0 + .26);
  ctx.save();
  const half = (s, top, sc = 1) => { if (s === null) return; ctx.save(); ctx.beginPath(); ctx.rect(x, top ? y : y + h / 2, w, h / 2); ctx.clip(); ctx.translate(0, y + h / 2); ctx.scale(1, sc); ctx.translate(0, -(y + h / 2));
    ctx.fillStyle = top ? '#2B3038' : '#262A31'; ctx.fillRect(x, y, w, h); text(s, x + w / 2, y + h * .76, font, col, 'center'); ctx.restore(); };
  if (p >= 1) { half(to, true); half(to, false); } else if (p <= 0) { half(from, true); half(from, false); } else { half(to, true); half(from, false); if (p < .5) half(from, true, 1 - p * 2); else half(to, false, (p - .5) * 2); }
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y + h / 2 - 1.5, w, 3); ctx.restore();
}
const PARTS = [['CASH & ZELLE', 14220, '$14,220'], ['88 CARD CHARGES', 10590.3, '$10,590'], ['GIFT CARD', 500, '$500']];
function shotTotal(t) {
  studioBg(t);
  eyebrow(t, T.total + .05, 'ESTIMATED LOSS · PER INVESTIGATORS', 60, 340);
  const digits = ['$', '2', '5', ',', '3', '1', '0'], tw0 = 128, th = 190, y = 420; let x = 60;
  digits.forEach((d, i) => { const w = d === ',' ? 46 : tw0; if (d === ',') text(',', x + 6, y + th - 20, F.b8(140), C.lemon, 'left'); else flipTile(x, y, w, th, '', d, T.total + .4 + i * .1, t, F.b8(150), C.lemon); x += w + 10; });
  const total = 25310.3, bx = 60, bw = 960;
  PARTS.forEach(([lab, v, s], i) => { const a = T.total + 1.4 + i * .5, k = eio(seg(t, a, a + .5)); if (k <= 0) return; const yy = 760 + i * 160;
    text(lab, bx, yy, F.b8(44), C.white, 'left', 2, 'pl' + i); text(s, bx + bw, yy, F.b8(44), C.lemon, 'right', 1, 'pv' + i);
    ctx.fillStyle = C.ink3; ctx.fillRect(bx, yy + 22, bw, 46); ctx.fillStyle = i === 0 ? C.lemon : i === 1 ? C.gold : C.paper; ctx.fillRect(bx, yy + 22, bw * v / total * k, 46); });
  const sk = eo(seg(t, T.total + 3.2, T.total + 3.5)); ctx.globalAlpha = sk; text('Victim: a 75-year-old Palm Coast woman.', 60, 1270, F.b6(40), C.grey, 'left', 1, 'vic'); ctx.globalAlpha = 1;
}
// ———————— 7 · the arrest ————————
function shotArrest(t) {
  studioBg(t);
  const z = lerp(1.0, 1.1, seg(t, T.arrest, T.sheriff)); photo(IM.mia, 1000, 760, .74 * z, 0, 290, W, 1040); grain(t, 0, 290, W, 1040);
  const g = ctx.createLinearGradient(0, 700, 0, 1330); g.addColorStop(0, 'rgba(18,20,23,0)'); g.addColorStop(1, 'rgba(18,20,23,.96)'); ctx.fillStyle = g; ctx.fillRect(0, 700, W, 630);
  ctx.fillStyle = 'rgba(18,20,23,.85)'; ctx.fillRect(0, 290, W, 80);
  eyebrow(t, T.arrest + .1, 'FRIDAY, OCTOBER 23, 2026 · MIAMI', 60, 342);
  push(t, T.miami - .2, 'LANDS AT', 54, 1080, F.b8(110), C.white, 'a1', 110);
  push(t, T.miami + .2, 'MIAMI INTERNATIONAL', 54, 1195, F.b8(fit('MIAMI INTERNATIONAL', 110, 970, 2)), C.white, 'a2', 110);
  const nk = eo(seg(t, T.miami + 2.0, T.miami + 2.3)); ctx.globalAlpha = nk; text('on an international flight, on a Flagler County warrant', 60, 1270, F.b6(36), C.grey, 'left', 1, 'a3'); ctx.globalAlpha = 1;
  stamp(t, T.customs - 1.8, 600, 640, 'ARRESTED', -.1);
}
// ———————— 8 · the sheriff's quote ————————
const QUOTE = ['“Her wings were', 'clipped by our', 'detectives and', 'with the help of CBP', 'she was arrested.”'];
function shotSheriff(t) {
  studioBg(t); const a = T.sheriff;
  eyebrow(t, a + .05, 'SHERIFF RICK STALY · AS QUOTED BY NEWS4JAX', 60, 340);
  const qk = seg(t, a, a + .25); if (qk > 0) { const s = back(qk, 2.4); ctx.save(); ctx.translate(60, 430); ctx.scale(s, s); text('“', -10, 210, F.b8(300), C.lemon, 'left'); ctx.restore(); }
  QUOTE.forEach((L, i) => push(t, a + .3 + i * .18, L, 60, 560 + i * 128, F.b8(fit(L, 112, 960, 1)), C.white, 'q' + i, 128));
  const ul = eio(seg(t, T.clipped + .7, T.clipped + 1.0)); if (ul > 0) { ctx.fillStyle = C.lemon; ctx.fillRect(60, 560 + 128 + 16, tw('clipped', F.b8(112), 1) * ul, 10); }
  const zk = eo(seg(t, a + 1.4, a + 1.7)); ctx.globalAlpha = zk; ctx.fillStyle = C.gold; ctx.fillRect(60, 1210, 60, 4);
  text('RICK STALY · SHERIFF, FLAGLER COUNTY', 60, 1262, F.b8(fit('RICK STALY · SHERIFF, FLAGLER COUNTY', 36, 960, 2)), C.paper, 'left', 2, 'qwho'); ctx.globalAlpha = 1;
}
// ———————— 9 · the charges ————————
const CHARGES = ['Organized scheme to defraud a person 65+ of more than $20,000', 'Fraudulent use of personal ID info of a person 60+', 'Grand theft over $20,000'];
function shotCharges(t) {
  studioBg(t); const a = T.charges;
  eyebrow(t, a + .05, 'THE CHARGES · PER NEWS4JAX', 60, 340);
  CHARGES.forEach((s, i) => { const k = eo(seg(t, a + .2 + i * .25, a + .5 + i * .25)); if (k <= 0) return; const y = 420 + i * 170;
    ctx.globalAlpha = k; ctx.fillStyle = C.ink2; ctx.fillRect(60, y, 960, 140); ctx.fillStyle = C.lemon; ctx.fillRect(60, y, 90, 140); text(String(i + 1), 105, y + 100, F.b8(84), C.ink, 'center');
    const words = s.split(' '); let l1 = '', l2 = ''; for (const w of words) { if (tw(l1 + w + ' ', F.b6(40), 1) < 820 && !l2) l1 += w + ' '; else l2 += w + ' '; }
    text(l1.trim(), 176, y + (l2 ? 62 : 84), F.b6(40), C.white, 'left', 1, 'ch' + i + 'a'); if (l2) text(l2.trim(), 176, y + 110, F.b6(40), C.white, 'left', 1, 'ch' + i + 'b'); ctx.globalAlpha = 1; });
  const bk = eo(seg(t, a + 1.2, a + 1.5)); ctx.globalAlpha = bk; text('RELEASED ON $30,000 BOND', 60, 1010, F.b8(64), C.lemon, 'left', 2, 'bond'); ctx.globalAlpha = 1;
  stamp(t, T.innocent - .45, 560, 1190, 'PRESUMED INNOCENT', -.06, C.paper);
}
// ———————— 10 · commentary close ————————
function shotClose(t) {
  studioBg(t);
  eyebrow(t, T.close + .05, 'COMMENTARY · RELENTLESS AARON', 60, 340);
  if (t < T.danger) { push(t, T.close + .15, 'THESE ARE', 54, 620, F.b8(170), C.white, 'cl0', 170); push(t, T.close + 1.2, 'RELENTLESS', 54, 800, F.b8(170), C.lemon, 'cl1', 170); push(t, T.close + 1.4, 'TIMES.', 54, 980, F.b8(170), C.white, 'cl2', 170); return; }
  if (t < T.smile) { [['THE MOST DANGEROUS', 0], ['PEOPLE DON’T', 1.0], ['COME KNOCKING', 1.9], ['WITH A WEAPON.', 2.1]].forEach(([s, d], i) => push(t, T.danger + .1 + d, s, 54, 560 + i * 150, F.b8(fit(s, 140, 970, 2)), i === 3 ? C.lemon : C.white, 'cd' + i, 150)); return; }
  [['A SMILE.', 0], ['A STORY.', 1.0], ['A BOARDING', 2.4], ['PASS.', 2.6]].forEach(([s, d], i) => push(t, T.smile + .8 + d, s, 54, 600 + i * 190, F.b8(190), i >= 2 ? C.lemon : C.white, 'cs' + i, 190));
}
// ———————— end card ————————
function shotEnd(t) {
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1A1D22'); g.addColorStop(1, '#0E1013'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.moveTo(1050, 0); ctx.lineTo(1076, 0); ctx.lineTo(926, 1920); ctx.lineTo(900, 1920); ctx.fill();
  const a = T.end, m = (p, q) => eo(seg(t, a + p, a + q));
  ctx.globalAlpha = m(.25, .55); plate(540, 520, .9, seg(t, a + .7, a + 1.1) || -1, seg(t, a + .25, a + .7)); ctx.globalAlpha = 1;
  ctx.globalAlpha = m(.35, .6); wordmark(540, 720, 54); ctx.globalAlpha = 1;
  push(t, a + .2, 'HER WINGS', 60, 960, F.b8(130), C.white, 'e1', 130); push(t, a + .35, 'WERE CLIPPED', 60, 1090, F.b8(130), C.lemon, 'e2', 130);
  ctx.globalAlpha = m(.2, .4); text('Allegations, not convictions', 60, 1180, F.b6(36), C.grey, 'left', 1, 'e3'); ctx.globalAlpha = 1;
  const sk = back(seg(t, a + .6, a + .85), 2.2); if (sk > 0) { ctx.save(); ctx.translate(250, 1300); ctx.scale(sk, sk); ctx.fillStyle = '#E11D2A'; ctx.beginPath(); ctx.roundRect(-190, -54, 380, 108, 54); ctx.fill(); text('FOLLOW', 0, 20, F.b8(56), C.white, 'center', 4, 'fol'); ctx.restore(); }
}

// ———————— compositing ————————
function wipeBand(by) { ctx.fillStyle = C.lemon; ctx.fillRect(0, by - 84, W, 84); ctx.fillStyle = C.ink; ctx.fillRect(0, by, W, 5); ctx.fillStyle = C.gold; ctx.fillRect(0, by + 5, W, 14); }
function layer(fn, t, tov) { fn(t); cornerTag(tov); sourceLine(tov); strap(tov); }
// vertical frame: the band sweeps top → bottom (old picture below it, new picture above)
function wipe(t, a, b, oldFn, newFn) {
  const by = lerp(-140, H + 140, eio(seg(t, a, b)));
  const n0 = TX.length; layer(newFn, t, b + .001); const NEW = TX.splice(n0);
  ctx.save(); ctx.beginPath(); ctx.rect(0, by, W, H); ctx.clip(); layer(oldFn, t, a - .001); ctx.restore();
  const OLD = TX.splice(n0); TX.push(...(seg(t, a, b) < .5 ? OLD : NEW)); wipeBand(by);
}
const SCENES = [[.8, shotTitle], [T.call, shotCall], [T.gift, shotGift], [T.who, shotMap], [T.note, shotNote], [T.total, shotTotal], [T.arrest, shotArrest], [T.sheriff, shotSheriff], [T.charges, shotCharges], [T.close, shotClose], [T.end, shotEnd]];
const WIPES = [[.55, .8], [T.call - .3, T.call], [T.note - .3, T.note], [T.arrest - .3, T.arrest], [T.close - .3, T.close]];
const CUTS = SCENES.map(s => s[0]).filter(c => !WIPES.some(w => Math.abs(w[1] - c) < .01) && c !== T.end);
function scene(t) {
  if (t < .8) { if (t >= .55) wipe(t, .55, .8, shotSting, shotTitle); else layer(shotSting, t, t); stingLogo(t); return; }
  const w = WIPES.find(([a, b]) => t >= a && t < b);
  if (w) { const i = SCENES.findIndex(s => Math.abs(s[0] - w[1]) < .01); wipe(t, w[0], w[1], SCENES[i - 1][1], SCENES[i][1]); return; }
  if (t >= T.end - .25 && t < T.end) {   // slanted wipe into the end card
    layer(shotClose, t, t); const k = eio(seg(t, T.end - .25, T.end)), y = H - k * (H + 400);
    ctx.save(); ctx.beginPath(); ctx.moveTo(0, y + 400); ctx.lineTo(W, y); ctx.lineTo(W, H + 400); ctx.lineTo(0, H + 400); ctx.closePath(); ctx.clip(); shotEnd(t); ctx.restore();
    ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.moveTo(0, y + 400); ctx.lineTo(W, y); ctx.lineTo(W, y + 40); ctx.lineTo(0, y + 440); ctx.fill(); return;
  }
  let fn = SCENES[0][1]; for (const [a, f] of SCENES) if (t >= a) fn = f;
  layer(fn, t, t);
}
function render(t) {
  TX = []; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  scene(t); bug(t);
  if (t > 96.0) { ctx.fillStyle = `rgba(0,0,0,${seg(t, 96.0, 96.5)})`; ctx.fillRect(0, 0, W, H); }
}

// ———————— events for the mix ————————
const EV = [{ t: 0, type: 'sting' }];
WIPES.forEach(([a]) => EV.push({ t: a, type: 'whoosh' }));
CUTS.forEach(c => EV.push({ t: c, type: 'timp' }));
[[T.gd - .3, 'stamp'], [T.customs - 1.8, 'bigstamp'], [T.innocent - .45, 'stamp']].forEach(([x, ty]) => EV.push({ t: x, type: ty }));
for (let i = 0; i < 6; i++) EV.push({ t: T.total + .4 + i * .1, type: 'flap' });
EV.push({ t: T.gift + .2, type: 'paper' }); EV.push({ t: T.note + .3, type: 'paper' }); EV.push({ t: T.prize - 2.2, type: 'ding' });
[T.who + .2, T.standby + .2, T.daytona - 1.3].forEach(x => EV.push({ t: x, type: 'ping' }));
EV.push({ t: T.standby - 1.6, type: 'jet', d: 2.0 });
EV.push({ t: T.end - .25, type: 'whoosh' }); EV.push({ t: T.end, type: 'endhit' });
await Promise.all([loadImg('assets/plate_mia.jpg').then(i => IM.mia = i), loadImg('assets/plate_phone.jpg').then(i => IM.phone = i), fetch('data/states.json').then(r => r.json()).then(j => STATES = j)]);
makeGrain();
await document.fonts.ready; for (const f of [F.b8(40), F.b6(40), F.b6i(40), F.mono(20)]) await document.fonts.load(f);
window.EV = EV; window.DUR = DUR; window.render = render; window.TEXTS = t => { render(t); return TX.slice(); }; window.READY = true;
