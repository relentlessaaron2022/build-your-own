// THE RELENTLESS REPORT · "Her Wings Were Clipped" — 16:9 (1920×1080) version of the vertical Broadcast News Package, cut to the host's own voiceover.
// Package parts adapted from styles/news-package/demo/main.js (MIT), as in ../just-desserts. Every on-screen fact is in FACTS.md.
// Layout for a vertical feed: bug and tags at the top, the graphic in y 240–1330, the strap at y 1350–1500, nothing important below (platform captions/buttons).
const W = 1920, H = 1080, DUR = 96.5;
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

// ———————— package parts (16:9: strap along the bottom, bug top right, content in y 56–840) ————————
function studioBg(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(1300, 380, 60, 1300, 380, 1100); rg.addColorStop(0, 'rgba(242,207,29,.16)'); rg.addColorStop(1, 'rgba(242,207,29,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) { const x = ((i * 380 + t * (30 + i * 6)) % 2600) - 400, w = 40 + hash(i) * 120; ctx.fillStyle = `rgba(242,207,29,${.025 + hash(i + 9) * .035})`;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w - 500, H); ctx.lineTo(x - 500, H); ctx.fill(); }
  ctx.fillStyle = 'rgba(244,241,232,.05)'; for (let x = 40 - (t * 12) % 48; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
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
  const x0 = 96, ty = 856, by = 904, bh = 104, bw = 1250;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x0 + 8, by + 8, bw + 120, bh);
  ctx.fillStyle = C.paper; ctx.fillRect(x0, by, bw, bh); ctx.fillStyle = C.lemon; ctx.fillRect(x0, by, 14, bh);
  ctx.fillStyle = C.ink; ctx.fillRect(x0 + bw, by, 120, bh); ctx.fillStyle = C.lemon; ctx.fillRect(x0 + bw, by, 120, 6); text('RR', x0 + bw + 60, by + 70, F.b8(48), C.lemon, 'center', 2);
  ctx.save(); ctx.beginPath(); ctx.rect(x0 + 14, by, bw - 14, bh); ctx.clip();
  const fs = fit(S.hl, 52, bw - 80, 1), fs2 = fit(S.sub, 26, bw - 80, 1.5, F.b6);
  text(S.hl, x0 + 44, by + 60, F.b8(fs), C.ink, 'left', 1, 'strap'); text(S.sub, x0 + 46, by + 92, F.b6(fs2), C.olive, 'left', 1.5, 'strape');
  ctx.restore();
  const flash = clamp(1 - (t - S.a) / .25), tabW = 40 + tw(S.tab, F.b8(30), 2), lightTab = S.tab === 'PROFILE';
  ctx.fillStyle = lightTab ? C.paper : C.lemon; ctx.fillRect(x0, ty, tabW, by - ty);
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(x0, ty, tabW, by - ty); }
  if (lightTab) { ctx.fillStyle = C.lemon; ctx.fillRect(x0, ty, 8, by - ty); }
  text(S.tab, x0 + 20, ty + 37, F.b8(30), C.ink, 'left', 2);
  ctx.restore();
}
const TAGS = [[T.call, T.gift, 'ILLUSTRATION', 'Stock photo, not the people in this case'], [T.who, T.note, 'SCHEMATIC', 'Route per investigators']];
function cornerTag(t) {
  const A = TAGS.find(r => t >= r[0] && t < r[1]); if (!A) return;
  const x = 96, y = 56, h = 64, w = 470;
  ctx.fillStyle = 'rgba(18,20,23,.85)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = C.gold; ctx.fillRect(x, y, 8, h);
  text(A[2], x + 26, y + 28, F.mono(18), C.gold, 'left', 2, 'tag'); text(A[3], x + 26, y + 54, F.b6(24), C.white, 'left', 1, 'tag2');
}
const SRC = [[T.hook, T.call, 'FLAGLER COUNTY SHERIFF / NEWS4JAX'], [T.call, T.who, 'FLAGLERLIVE · NEWS4JAX · WFTV'], [T.who, T.note, 'FLAGLERLIVE · NEWS4JAX'], [T.note, T.total, 'FLAGLERLIVE, OCT 27 2026'],
  [T.total, T.arrest, 'INVESTIGATION VIA FLAGLERLIVE · WFTV'], [T.arrest, T.sheriff, 'NEWS4JAX · PHOTO: Q. SOLOVIEV, CC BY 4.0'], [T.sheriff, T.charges, 'NEWS4JAX · FLAGLERLIVE'], [T.charges, T.close, 'NEWS4JAX · FLAGLERLIVE · WFTV']];
function sourceLine(t) { const S = SRC.find(s => t >= s[0] && t < s[1]); if (!S) return; ctx.globalAlpha = .82; text('SOURCE: ' + S[2], 1836, 842, F.mono(15), C.gold, 'right', 1.5, 'src'); ctx.globalAlpha = 1; }
function bug(t) { if (t < .75 || t > T.end + .1) return; ctx.globalAlpha = .95; plate(1739, 86, .327, -1, 1); text('REPORT', 1640, 96, F.b8(26), C.white, 'right', 3); ctx.globalAlpha = 1; }
function stamp(t, a, x, y, word, rot = -.1, col = C.lemon) {
  const sk = seg(t, a, a + .16); if (sk <= 0) return;
  const s = 1 + .9 * (1 - eo(sk)), w = tw(word, F.b8(56), 4) + 90;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = clamp(sk * 3);
  ctx.fillStyle = 'rgba(18,20,23,.94)'; ctx.fillRect(-w / 2, -56, w, 112);
  ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.strokeRect(-w / 2 + 10, -46, w - 20, 92); ctx.lineWidth = 1.5; ctx.strokeRect(-w / 2 + 18, -38, w - 36, 76);
  text(word, 0, 20, F.b8(56), col, 'center', 4, 'stamp' + word); ctx.restore();
  const rr = seg(t, a + .05, a + .5); if (rr < 1) { ctx.strokeStyle = `rgba(242,207,29,${.8 * (1 - rr)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, w / 2 + rr * 140, 72 + rr * 60, rot, 0, Math.PI * 2); ctx.stroke(); }
}
function eyebrow(t, a, s, x = 120, y = 160) { const k = eo(seg(t, a, a + .3)); ctx.globalAlpha = k; ctx.fillStyle = C.lemon; ctx.fillRect(x, y - 22, 10, 28); text(s, x + 26, y, F.mono(fit(s, 24, 1400, 3, F.mono)), C.gold, 'left', 3, 'eye' + a); ctx.globalAlpha = 1; }
function push(t, at, s, x, y, font, col, id, h = 140) { const k = eo(seg(t, at, at + .32)); if (k <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(0, y - h + 14, W, h + 16); ctx.clip(); text(s, x, y + (1 - k) * h, font, col, 'left', 2, id); ctx.restore(); }

// ———————— sting ————————
function shotSting(t) { studioBg(t); [[.03, .25, 22, -60], [.08, .3, 8, 40]].forEach(([a, b, h, dy]) => { const k = seg(t, a, b); if (k <= 0 || k >= 1) return; ctx.save(); ctx.translate(960, 470 + dy); ctx.rotate(-.14); const x = lerp(-1900, 1900, eio(k)); ctx.fillStyle = C.lemon; ctx.fillRect(x - 700, -h / 2, 1400, h); ctx.restore(); }); }
function stingLogo(t) {
  if (t > .8) return;
  const k = seg(t, .1, .3), fly = eio(seg(t, .55, .8)), cx = lerp(960, 1739, fly), cy = lerp(450, 86, fly), s = lerp(back(k, 2.2), .327, fly);
  if (k > 0) plate(cx, cy, s, seg(t, .35, .55) || -1, seg(t, .2, .45));
  const r = seg(t, .3, .7); if (r > 0 && r < 1) { ctx.strokeStyle = `rgba(242,207,29,${1 - r})`; ctx.lineWidth = 6 * (1 - r) + 1; ctx.beginPath(); ctx.ellipse(960, 450, 300 + r * 700, 120 + r * 300, 0, 0, Math.PI * 2); ctx.stroke(); }
}

// ———————— 1 · title ————————
function shotTitle(t) {
  studioBg(t);
  eyebrow(t, T.hook + .1, 'FLAGLER COUNTY, FLORIDA · OCTOBER 2026', 120, 170);
  push(t, T.hook + .25, 'HER WINGS WERE', 112, 430, F.b8(220), C.white, 'ti0', 210);
  push(t, T.hook + .5, 'CLIPPED', 112, 650, F.b8(220), C.lemon, 'ti1', 210);
  const k = eo(seg(t, T.police, T.police + .35)); if (k > 0) { ctx.globalAlpha = k; ctx.fillStyle = C.lemon; ctx.fillRect(120, 712, 120 * k, 5);
    text('Police: she used travel perks to scam a 75-year-old.', 120, 780, F.b6(44), C.paper, 'left', 1, 'tsub1'); ctx.globalAlpha = 1; }
}
// ———————— 2 · the call ————————
function shotCall(t) {
  studioBg(t);
  const z = lerp(1.0, 1.08, seg(t, T.call, T.gift)); photo(IM.phone, 480, 1300, .78 * z, 760, 0, 1160, 840); grain(t, 760, 0, 1160, 840);
  const g = ctx.createLinearGradient(760, 0, 1200, 0); g.addColorStop(0, 'rgba(18,20,23,1)'); g.addColorStop(1, 'rgba(18,20,23,0)'); ctx.fillStyle = g; ctx.fillRect(760, 0, 440, 840);
  eyebrow(t, T.call + .2, 'NOVEMBER 2025 · PALM COAST, FL', 120, 300);
  push(t, T.call + .5, 'A 75-YEAR-OLD', 112, 460, F.b8(120), C.white, 'c1', 125);
  push(t, T.call + .75, 'ANSWERS', 112, 590, F.b8(120), C.white, 'c2', 125);
  push(t, T.call + .95, 'THE PHONE.', 112, 720, F.b8(120), C.white, 'c3', 125);
  const q = eo(seg(t, T.prize - 2.2, T.prize - 1.9)); if (q > 0) { ctx.save(); ctx.translate(1380, 470); ctx.scale(back(q, 2), back(q, 2)); ctx.fillStyle = 'rgba(18,20,23,.92)'; ctx.fillRect(-420, -80, 840, 160); ctx.fillStyle = C.lemon; ctx.fillRect(-420, -80, 840, 8);
    text('“YOU’VE WON A PRIZE.”', 0, 30, F.b8(80), C.lemon, 'center', 2, 'prize'); ctx.restore(); }
}
// ———————— 3 · the gift card ————————
function shotGift(t) {
  studioBg(t);
  eyebrow(t, T.gift + .05, 'STEP ONE · PER INVESTIGATORS', 120, 300);
  const k = eo(seg(t, T.gift + .2, T.gift + .7)), cx = 1330, cy = 440;
  ctx.save(); ctx.translate(cx + (1 - k) * 900, cy); ctx.rotate(lerp(.4, -.06, k));
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(-370, -200, 760, 420); ctx.fillStyle = C.paper; ctx.fillRect(-380, -210, 760, 420);
  ctx.strokeStyle = '#B7B19E'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-380, -210); ctx.lineTo(0, 30); ctx.lineTo(380, -210); ctx.stroke();
  ctx.fillStyle = C.lemon; ctx.fillRect(-330, -170, 300, 190); ctx.fillStyle = C.ink; ctx.fillRect(-330, -170, 300, 40);
  text('GIFT CARD', -180, -140, F.b8(30), C.lemon, 'center', 3); text('$500', -180, -12, F.b8(120), C.ink, 'center', 0, 'gc');
  text('TO:', 30, 60, F.mono(22), C.olive, 'left', 3); text('DESTINY BLAKE', 30, 110, F.b8(54), C.ink, 'left', 1, 'to1'); text('BROOKLYN, NEW YORK', 30, 160, F.b8(40), C.ink, 'left', 2, 'to2');
  ctx.restore();
  push(t, T.gift + 1.0, 'STEP ONE:', 112, 470, F.b8(140), C.white, 'g1', 140);
  push(t, T.gift + 1.25, 'SEND $500.', 112, 620, F.b8(140), C.lemon, 'g2', 140);
}
// ———————— 4 · the route map (one long take) ————————
let STATES = null;
const PTS = { bk: [-73.94, 40.68, 'BROOKLYN, NY'], dab: [-81.06, 29.18, 'DAYTONA BEACH'], pc: [-81.21, 29.58, 'PALM COAST'], mia: [-80.29, 25.79, 'MIAMI'] };
function mapView(t) { const k1 = eio(seg(t, T.standby + .2, T.daytona + .2)); return { lon: lerp(-77.6, -81.0, k1), lat: lerp(35.0, 29.4, k1), ppd: lerp(58, 210, k1) }; }
function proj(v, lon, lat) { const c = Math.cos(31 * Math.PI / 180); return [1000 + (lon - v.lon) * v.ppd * c, 480 - (lat - v.lat) * v.ppd]; }
function shotMap(t) {
  studioBg(t); const v = mapView(t);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 840); ctx.clip();
  ctx.fillStyle = '#0D1A24'; ctx.fillRect(0, 0, W, 840);
  for (const s of STATES) { ctx.beginPath(); for (const r of s.rings) r.forEach(([lo, la], i) => { const [x, y] = proj(v, lo, la); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.fillStyle = s.name === 'Florida' ? '#2A2F37' : C.ink3; ctx.fill('evenodd'); ctx.strokeStyle = '#3B414B'; ctx.lineWidth = 1.5; ctx.stroke(); }
  const dot = (p, a, label, right = true) => { const k = eo(seg(t, a, a + .25)); if (k <= 0) return; const [x, y] = proj(v, p[0], p[1]);
    const rr = seg(t, a, a + .9); if (rr < 1) { ctx.strokeStyle = `rgba(242,207,29,${1 - rr})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 14 + rr * 60, 0, 7); ctx.stroke(); }
    ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.arc(x, y, 12 * k, 0, 7); ctx.fill(); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x, y, 5 * k, 0, 7); ctx.fill();
    ctx.globalAlpha = k; const tw0 = tw(label, F.b8(34), 2) + 30, lx = right ? x + 26 : x - 26 - tw0; ctx.fillStyle = 'rgba(18,20,23,.9)'; ctx.fillRect(lx, y - 26, tw0, 48);
    text(label, lx + 15, y + 11, F.b8(34), C.paper, 'left', 2, 'lab' + label); ctx.globalAlpha = 1; };
  const fk = eio(seg(t, T.standby - 1.6, T.standby + .3));
  if (fk > 0) { const A = proj(v, ...PTS.bk.slice(0, 2)), B = proj(v, ...PTS.dab.slice(0, 2)), M = [(A[0] + B[0]) / 2 + 4.2 * v.ppd, (A[1] + B[1]) / 2];
    ctx.strokeStyle = C.lemon; ctx.lineWidth = 6; ctx.setLineDash([16, 12]); ctx.beginPath(); const n = 60;
    for (let i = 0; i <= n * fk; i++) { const u = i / n, x = (1 - u) ** 2 * A[0] + 2 * u * (1 - u) * M[0] + u * u * B[0], y = (1 - u) ** 2 * A[1] + 2 * u * (1 - u) * M[1] + u * u * B[1]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.setLineDash([]); }
  const uk = eio(seg(t, T.daytona - 1.8, T.daytona - 1.3));
  if (uk > 0) { const A = proj(v, ...PTS.dab.slice(0, 2)), B = proj(v, ...PTS.pc.slice(0, 2)); ctx.strokeStyle = C.paper; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(lerp(A[0], B[0], uk), lerp(A[1], B[1], uk)); ctx.stroke(); }
  dot(PTS.bk, T.who + .2, PTS.bk[2], false);
  dot(PTS.dab, T.standby + .2, PTS.dab[2], false);
  dot(PTS.pc, T.daytona - 1.3, PTS.pc[2], true);
  ctx.restore();
  ctx.fillStyle = 'rgba(18,20,23,.9)'; ctx.fillRect(96, 140, 760, 130);
  eyebrow(t, T.who, 'NOVEMBER 18, 2025 · PER INVESTIGATORS', 120, 190);
  const ck = eo(seg(t, T.flight + .2, T.flight + .5)); ctx.globalAlpha = ck; text('Flew as a non-paying employee passenger', 146, 244, F.b6(36), C.paper, 'left', 1, 'mapnote'); ctx.globalAlpha = 1;
}
// ———————— 5 · the note ————————
function shotNote(t) {
  studioBg(t);
  eyebrow(t, T.note + .05, 'LEFT AT THE VICTIM’S HOME · PER INVESTIGATORS', 120, 170);
  push(t, T.note + .2, 'THE', 112, 400, F.b8(180), C.white, 'nt0', 180); push(t, T.note + .4, 'NOTE.', 112, 580, F.b8(180), C.lemon, 'nt1', 180);
  const k = eo(seg(t, T.note + .3, T.note + .8)); if (k > 0) {
    ctx.save(); ctx.translate(1300, 480); ctx.rotate(lerp(.3, -.04, k)); ctx.scale(lerp(.2, .9, k), lerp(.2, .9, k));
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(-400, -330, 820, 680); ctx.fillStyle = '#F7F1D0'; ctx.fillRect(-410, -340, 820, 680);
    ctx.strokeStyle = 'rgba(80,110,160,.35)'; ctx.lineWidth = 2; for (let y = -230; y < 330; y += 64) { ctx.beginPath(); ctx.moveTo(-410, y); ctx.lineTo(410, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(200,60,60,.45)'; ctx.beginPath(); ctx.moveTo(-330, -340); ctx.lineTo(-330, 340); ctx.stroke();
    text('NOTE (paraphrased from the investigation)', -300, -270, F.mono(20), C.olive, 'left', 1, 'n0');
    const L = ['Call the Apple Card company.', 'Tell them Blake is your', 'granddaughter,', 'and that she’s authorized', 'to use the card.'];
    L.forEach((s, i) => { const a = T.note + .9 + i * .25; if (t < a) return; text(s, -300, -170 + i * 64, F.b6(52), '#1D2A44', 'left', 0, 'nl' + i); });
    const hk = eio(seg(t, T.gd - .1, T.gd + .3)); if (hk > 0) { ctx.fillStyle = 'rgba(242,207,29,.6)'; ctx.fillRect(-306, -170 + 2 * 64 - 44, tw('granddaughter,', F.b6(52)) * hk + 12, 56); text('granddaughter,', -300, -170 + 2 * 64, F.b6(52), '#1D2A44'); }
    ctx.restore();
  }
  stamp(t, T.gd - .3, 470, 730, 'HER “GRANDDAUGHTER”', -.06);
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
  eyebrow(t, T.total + .05, 'ESTIMATED LOSS · PER INVESTIGATORS', 120, 160);
  const digits = ['$', '2', '5', ',', '3', '1', '0'], tw0 = 140, th = 210, y = 200; let x = 120;
  digits.forEach((d, i) => { const w = d === ',' ? 50 : tw0; if (d === ',') text(',', x + 6, y + th - 20, F.b8(150), C.lemon, 'left'); else flipTile(x, y, w, th, '', d, T.total + .4 + i * .1, t, F.b8(160), C.lemon); x += w + 12; });
  const sk = eo(seg(t, T.total + 3.2, T.total + 3.5)); ctx.globalAlpha = sk; text('Victim: a 75-year-old', 1180, 290, F.b6(44), C.grey, 'left', 1, 'vic'); text('Palm Coast woman.', 1180, 346, F.b6(44), C.grey, 'left', 1, 'vic2'); ctx.globalAlpha = 1;
  const total = 25310.3, bx = 120, bw = 1680;
  PARTS.forEach(([lab, v, s], i) => { const a = T.total + 1.4 + i * .5, k = eio(seg(t, a, a + .5)); if (k <= 0) return; const yy = 520 + i * 110;
    text(lab, bx, yy, F.b8(40), C.white, 'left', 2, 'pl' + i); text(s, bx + bw, yy, F.b8(40), C.lemon, 'right', 1, 'pv' + i);
    ctx.fillStyle = C.ink3; ctx.fillRect(bx, yy + 16, bw, 40); ctx.fillStyle = i === 0 ? C.lemon : i === 1 ? C.gold : C.paper; ctx.fillRect(bx, yy + 16, bw * v / total * k, 40); });
}
// ———————— 7 · the arrest ————————
function shotArrest(t) {
  studioBg(t);
  const z = lerp(1.0, 1.08, seg(t, T.arrest, T.sheriff)); photo(IM.mia, 960, 640, 1.0 * z, 0, 0, W, 840); grain(t, 0, 0, W, 840);
  const g = ctx.createLinearGradient(0, 300, 0, 840); g.addColorStop(0, 'rgba(18,20,23,0)'); g.addColorStop(1, 'rgba(18,20,23,.96)'); ctx.fillStyle = g; ctx.fillRect(0, 300, W, 540);
  ctx.fillStyle = 'rgba(18,20,23,.85)'; ctx.fillRect(96, 120, 900, 70);
  eyebrow(t, T.arrest + .1, 'FRIDAY, OCTOBER 23, 2026 · MIAMI', 120, 166);
  push(t, T.miami - .2, 'LANDS AT', 112, 600, F.b8(120), C.white, 'a1', 120);
  push(t, T.miami + .2, 'MIAMI INTERNATIONAL', 112, 730, F.b8(120), C.white, 'a2', 120);
  const nk = eo(seg(t, T.miami + 2.0, T.miami + 2.3)); ctx.globalAlpha = nk; text('on an international flight, on a Flagler County warrant', 120, 800, F.b6(36), C.grey, 'left', 1, 'a3'); ctx.globalAlpha = 1;
  stamp(t, T.customs - 1.8, 1520, 560, 'ARRESTED', -.1);
}
// ———————— 8 · the sheriff's quote ————————
const QUOTE = ['“Her wings were clipped by our', 'detectives and with the help', 'of CBP she was arrested.”'];
function shotSheriff(t) {
  studioBg(t); const a = T.sheriff;
  eyebrow(t, a + .05, 'SHERIFF RICK STALY · AS QUOTED BY NEWS4JAX', 370, 170);
  const qk = seg(t, a, a + .25); if (qk > 0) { const s = back(qk, 2.4); ctx.save(); ctx.translate(180, 250); ctx.scale(s, s); text('“', -30, 150, F.b8(340), C.lemon, 'left'); ctx.restore(); }
  QUOTE.forEach((L, i) => push(t, a + .3 + i * .18, L, 370, 340 + i * 124, F.b8(fit(L, 110, 1440, 1)), C.white, 'q' + i, 124));
  const ul = eio(seg(t, T.clipped + .7, T.clipped + 1.0)); if (ul > 0) { const fs = fit(QUOTE[0], 110, 1440, 1); ctx.fillStyle = C.lemon; ctx.fillRect(370 + tw('“Her wings were ', F.b8(fs), 1), 340 + 16, tw('clipped', F.b8(fs), 1) * ul, 10); }
  const zk = eo(seg(t, a + 1.4, a + 1.7)); ctx.globalAlpha = zk; ctx.fillStyle = C.gold; ctx.fillRect(370, 670, 60, 4);
  text('RICK STALY · SHERIFF, FLAGLER COUNTY', 370, 726, F.b8(40), C.paper, 'left', 2, 'qwho'); ctx.globalAlpha = 1;
}
// ———————— 9 · the charges ————————
const CHARGES = ['Organized scheme to defraud a person 65+ of more than $20,000', 'Fraudulent use of personal ID info of a person 60+', 'Grand theft over $20,000'];
function shotCharges(t) {
  studioBg(t); const a = T.charges;
  eyebrow(t, a + .05, 'THE CHARGES · PER NEWS4JAX', 120, 160);
  CHARGES.forEach((s, i) => { const k = eo(seg(t, a + .2 + i * .25, a + .5 + i * .25)); if (k <= 0) return; const y = 200 + i * 150;
    ctx.globalAlpha = k; ctx.fillStyle = C.ink2; ctx.fillRect(120, y, 1180, 120); ctx.fillStyle = C.lemon; ctx.fillRect(120, y, 100, 120); text(String(i + 1), 170, y + 90, F.b8(84), C.ink, 'center');
    text(s, 250, y + 76, F.b6(fit(s, 44, 1020, 1, F.b6)), C.white, 'left', 1, 'ch' + i); ctx.globalAlpha = 1; });
  const bk = eo(seg(t, a + 1.2, a + 1.5)); ctx.globalAlpha = bk; text('RELEASED ON $30,000 BOND', 120, 760, F.b8(72), C.lemon, 'left', 2, 'bond'); ctx.globalAlpha = 1;
  stamp(t, T.innocent - .45, 1450, 700, 'PRESUMED INNOCENT', -.06, C.paper);
}
// ———————— 10 · commentary close ————————
function shotClose(t) {
  studioBg(t);
  eyebrow(t, T.close + .05, 'COMMENTARY · RELENTLESS AARON', 120, 160);
  if (t < T.danger) { push(t, T.close + .15, 'THESE ARE', 112, 380, F.b8(180), C.white, 'cl0', 180); push(t, T.close + 1.2, 'RELENTLESS', 112, 570, F.b8(180), C.lemon, 'cl1', 180); push(t, T.close + 1.4, 'TIMES.', 112, 760, F.b8(180), C.white, 'cl2', 180); return; }
  if (t < T.smile) { [['THE MOST DANGEROUS', 0], ['PEOPLE DON’T', 1.0], ['COME KNOCKING', 1.9], ['WITH A WEAPON.', 2.1]].forEach(([s, d], i) => push(t, T.danger + .1 + d, s, 112, 330 + i * 145, F.b8(140), i === 3 ? C.lemon : C.white, 'cd' + i, 145)); return; }
  [['A SMILE.', 0], ['A STORY.', 1.0], ['A BOARDING PASS.', 2.4]].forEach(([s, d], i) => push(t, T.smile + .8 + d, s, 112, 380 + i * 190, F.b8(180), i === 2 ? C.lemon : C.white, 'cs' + i, 185));
}
// ———————— end card ————————
function shotEnd(t) {
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1A1D22'); g.addColorStop(1, '#0E1013'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(244,241,232,.04)'; for (let x = 40 - (t * 10) % 48; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
  ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.moveTo(1260, 0); ctx.lineTo(1290, 0); ctx.lineTo(1150, 790); ctx.lineTo(1120, 790); ctx.fill();
  const a = T.end, m = (p, q) => eo(seg(t, a + p, a + q));
  ctx.globalAlpha = m(0, .2); text('THE RELENTLESS REPORT · CRIME', 150, 210, F.mono(24), C.gold, 'left', 3, 'e0'); ctx.globalAlpha = 1;
  push(t, a + .1, 'HER WINGS', 146, 380, F.b8(150), C.white, 'e1', 150); push(t, a + .25, 'WERE CLIPPED', 146, 540, F.b8(150), C.lemon, 'e2', 150);
  ctx.globalAlpha = m(.2, .4); text('Allegations, not convictions', 150, 610, F.b6(40), C.grey, 'left', 1, 'e3'); ctx.globalAlpha = 1;
  const sk = back(seg(t, a + .5, a + .75), 2.2); if (sk > 0) { ctx.save(); ctx.translate(330, 730); ctx.scale(sk, sk); ctx.fillStyle = '#E11D2A'; ctx.beginPath(); ctx.roundRect(-180, -50, 360, 100, 50); ctx.fill(); text('SUBSCRIBE', 0, 18, F.b8(52), C.white, 'center', 3, 'sub'); ctx.restore(); }
  ctx.globalAlpha = m(.25, .55); plate(1600, 360, .62, seg(t, a + .7, a + 1.1) || -1, seg(t, a + .25, a + .7)); wordmark(1600, 520, 40, 'center'); ctx.globalAlpha = 1;
}

// ———————— compositing ————————
function wipeBand(bx) { ctx.fillStyle = C.lemon; ctx.fillRect(bx - 84, 0, 84, H); ctx.fillStyle = C.ink; ctx.fillRect(bx, 0, 5, H); ctx.fillStyle = C.gold; ctx.fillRect(bx + 5, 0, 14, H); }
function layer(fn, t, tov) { fn(t); cornerTag(tov); sourceLine(tov); strap(tov); }
function wipe(t, a, b, oldFn, newFn) {
  const bx = lerp(-140, W + 140, eio(seg(t, a, b)));
  const n0 = TX.length; layer(newFn, t, b + .001); const NEW = TX.splice(n0);
  ctx.save(); ctx.beginPath(); ctx.rect(bx, 0, W, H); ctx.clip(); layer(oldFn, t, a - .001); ctx.restore();
  const OLD = TX.splice(n0); TX.push(...(seg(t, a, b) < .5 ? OLD : NEW)); wipeBand(bx);
}
const SCENES = [[.8, shotTitle], [T.call, shotCall], [T.gift, shotGift], [T.who, shotMap], [T.note, shotNote], [T.total, shotTotal], [T.arrest, shotArrest], [T.sheriff, shotSheriff], [T.charges, shotCharges], [T.close, shotClose], [T.end, shotEnd]];
const WIPES = [[.55, .8], [T.call - .3, T.call], [T.note - .3, T.note], [T.arrest - .3, T.arrest], [T.close - .3, T.close]];
const CUTS = SCENES.map(s => s[0]).filter(c => !WIPES.some(w => Math.abs(w[1] - c) < .01) && c !== T.end);
function scene(t) {
  if (t < .8) { if (t >= .55) wipe(t, .55, .8, shotSting, shotTitle); else layer(shotSting, t, t); stingLogo(t); return; }
  const w = WIPES.find(([a, b]) => t >= a && t < b);
  if (w) { const i = SCENES.findIndex(s => Math.abs(s[0] - w[1]) < .01); wipe(t, w[0], w[1], SCENES[i - 1][1], SCENES[i][1]); return; }
  if (t >= T.end - .25 && t < T.end) {
    layer(shotClose, t, t); const k = eio(seg(t, T.end - .25, T.end)), x = W - k * (W + 340);
    ctx.save(); ctx.beginPath(); ctx.moveTo(x + 340, 0); ctx.lineTo(W + 340, 0); ctx.lineTo(W + 340, H); ctx.lineTo(x, H); ctx.closePath(); ctx.clip(); shotEnd(t); ctx.restore();
    ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.moveTo(x + 340, 0); ctx.lineTo(x + 380, 0); ctx.lineTo(x + 40, H); ctx.lineTo(x, H); ctx.fill(); return;
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
