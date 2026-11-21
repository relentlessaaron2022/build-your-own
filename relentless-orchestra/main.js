// Relentless Aaron: "Conducting the Eagles", a seamless 12-second loop.
// The photo stays as it is; on top of it: a breathing camera, a pulsing baton tip that throws gold sparkles along the swirl,
// a flock of flapping eagles circling him in time with the baton (passing behind him), a sun flare and a gliding lead eagle.
// ?fmt=v (1080x1920) or ?fmt=s (1080x1080)
const Q = new URLSearchParams(location.search), FMT = Q.get('fmt') || 'v';
const W = 1080, H = FMT === 's' ? 1080 : 1920, cv = document.getElementById('out'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
const DUR = 12, TAU = Math.PI * 2;
const IMG = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'conductor.png'; });
const IW = IMG.width, IH = IMG.height;
const SPR = await Promise.all(['eagle1.png', 'eagle2.png'].map(src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; })));   // eagles lifted from the photo itself
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k;
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// the camera: cover the frame, centred on him, breathing in and out once per loop (so the loop is seamless)
const FOCUS = FMT === 's' ? [600, 560] : [620, 640];
function camera(t) { const base = Math.max(W / IW, H / IH), z = base * (1.035 + .035 * (1 - Math.cos(TAU * t / DUR)) / 2);
  const ox = clamp(W / 2 - FOCUS[0] * z, W - IW * z, 0), oy = clamp(H / 2 - FOCUS[1] * z, H - IH * z, 0); return [z, ox, oy]; }
// in photo pixels
const TIP = [455, 152], HAND = [895, 285], SUN = [1092, 50], HEAD = [530, 265], C0 = [610, 250];
const BODY = (x, y) => (x > 250 && x < 900 && y > 200) || (Math.abs(x - 530) < 110 && y > 180);   // where he stands: birds pass behind
// the baton swing: the tip traces a small arc, conducting a 4-beat bar every 3 s
const beat = t => (t % 3) / 3;
function tipPos(t) { const b = beat(t), a = Math.sin(TAU * b) * 18, c = Math.cos(TAU * b * 2) * 8; return [TIP[0] + a, TIP[1] + c]; }
// the flock: 70 eagles on tilted orbits around him; one orbit per loop; each gets its own lane, size and wing phase
const FLOCK = Array.from({ length: 34 }, (_, i) => ({ ph: hash(i) * TAU, rx: 430 + hash(i * 3) * 160, ry: 120 + hash(i * 5) * 90, cy: 220 + hash(i * 7) * 90, s: .22 + hash(i * 11) * .4, fl: 2.4 + hash(i * 13) * 1.2, spr: i % 2 }));
// a photo eagle flying: flipped to face its direction, tilted with its climb, wings beating by a soft vertical squash
function flyer(b, x, y, s, flap, dx, dy, alpha) { const im = SPR[b.spr], face = dx < 0 ? -1 : 1, tilt = clamp(Math.atan2(dy, Math.abs(dx)) * .6, -.45, .45);
  ctx.save(); ctx.translate(x, y); ctx.scale(face, 1); ctx.rotate(tilt); ctx.globalAlpha = alpha; const sq = .78 + .22 * Math.sin(flap);
  ctx.scale(s, s * sq); ctx.drawImage(im, -im.width / 2, -im.height / 2); ctx.restore(); }
function eagle(x, y, s, flap, heading, alpha) { // a soaring eagle: body, two-segment wings that flap, a white head
  ctx.save(); ctx.translate(x, y); ctx.rotate(heading); ctx.scale(s, s); ctx.globalAlpha = alpha;
  const up = Math.sin(flap), w1 = 16 * up, w2 = 22 * Math.sin(flap - .6);
  ctx.fillStyle = '#3a2614'; ctx.beginPath(); ctx.moveTo(-14, 0);
  ctx.quadraticCurveTo(-4, -4 - w1 * .3, 0, -2); ctx.lineTo(-6, -24 - w1); ctx.lineTo(-30, -30 - w1 - w2 * .6); ctx.lineTo(-8, -8); ctx.closePath(); ctx.fill();   // far wing
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(0, 2); ctx.lineTo(-6, 24 + w1); ctx.lineTo(-30, 30 + w1 + w2 * .6); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();         // near wing
  ctx.fillStyle = '#4b321b'; ctx.beginPath(); ctx.ellipse(-2, 0, 15, 5, 0, 0, TAU); ctx.fill();   // body
  ctx.fillStyle = '#f2ead8'; ctx.beginPath(); ctx.ellipse(13, 0, 5, 4, 0, 0, TAU); ctx.fill();     // white head
  ctx.fillStyle = '#e8b33a'; ctx.beginPath(); ctx.moveTo(17, -1); ctx.lineTo(22, 1); ctx.lineTo(17, 2); ctx.fill();   // beak
  ctx.fillStyle = '#efe6d2'; ctx.beginPath(); ctx.moveTo(-16, -3); ctx.lineTo(-25, 0); ctx.lineTo(-16, 3); ctx.fill();   // tail
  ctx.strokeStyle = 'rgba(255,210,120,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-6, -24 - w1); ctx.lineTo(-30, -30 - w1 - w2 * .6); ctx.stroke();   // sunlit edge
  ctx.restore(); }
// gold sparkles: thrown from the baton tip, they ride the swirl and fade
const SPARK = Array.from({ length: 240 }, (_, i) => ({ t0: hash(i) * DUR, life: 1.6 + hash(i * 3) * 2.2, rx: 260 + hash(i * 5) * 380, ry: 80 + hash(i * 7) * 140, sz: 1.5 + hash(i * 9) * 3.5, a0: hash(i * 2) * .6 }));
function sparkle(x, y, r, a) { ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 4); g.addColorStop(0, 'rgba(255,246,210,1)'); g.addColorStop(.25, 'rgba(255,205,90,.75)'); g.addColorStop(1, 'rgba(255,170,40,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 4, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,250,230,.9)'; ctx.fillRect(-r * 3, -.6, r * 6, 1.2); ctx.fillRect(-.6, -r * 3, 1.2, r * 6); ctx.restore(); }

async function render(t) {
  t = ((t % DUR) + DUR) % DUR;
  const [z, ox, oy] = camera(t), P = (x, y) => [ox + x * z, oy + y * z];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(IMG, ox, oy, IW * z, IH * z);
  // the flock (drawn in photo space; a bird behind his body is hidden)
  ctx.save(); ctx.translate(ox, oy); ctx.scale(z, z);
  const order = FLOCK.map((b, i) => { const th = b.ph + TAU * t / DUR + Math.sin(TAU * t / 3 + b.ph) * .05, x = C0[0] + Math.cos(th) * b.rx, y = b.cy + Math.sin(th) * b.ry * .9 - Math.cos(th) * 40, front = Math.sin(th) > 0;
    const dx = -Math.sin(th) * b.rx, dy = Math.cos(th) * b.ry * .9 + Math.sin(th) * 40; return { b, x, y, front, dx, dy, depth: Math.sin(th) }; }).sort((a, c) => a.depth - c.depth);
  for (const o of order) { if (BODY(o.x, o.y) && !o.front) continue; if (BODY(o.x, o.y) && o.front && o.y > 300) continue;
    const s = o.b.s * (1 + .25 * o.depth), al = clamp(.55 + .45 * (o.depth + 1) / 2) * clamp(o.y / 40); flyer(o.b, o.x, o.y, s, TAU * t * o.b.fl / 3 + o.b.ph, o.dx, o.dy, al); }
  // the lead eagle (upper right): a slow glide around its spot in the photo
  ctx.restore();
  // gold sparkles riding the swirl out of the baton tip
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const s of SPARK) { const age = ((t - s.t0) % DUR + DUR) % DUR; if (age > s.life) continue; const k = age / s.life, [tx, ty] = tipPos(t - age), th = Math.PI * 1.1 + k * 3.4 + s.a0;
    const x = lerp(tx, C0[0] + Math.cos(th) * s.rx, Math.min(1, k * 1.6)), y = lerp(ty, C0[1] - 20 + Math.sin(th) * s.ry, Math.min(1, k * 1.6)); if (BODY(x, y) && y > 330) continue; const [px, py] = P(x, y); sparkle(px, py, s.sz * z * .9, (1 - k) * (k < .1 ? k * 10 : 1)); }
  // the baton tip: a pulsing star, brightest on each beat
  const [bx, by] = P(...tipPos(t)), pulse = .6 + .4 * Math.pow(Math.cos(TAU * beat(t) * 4) * .5 + .5, 3);
  const g = ctx.createRadialGradient(bx, by, 0, bx, by, 48 * z * pulse); g.addColorStop(0, 'rgba(255,250,225,1)'); g.addColorStop(.15, 'rgba(255,215,110,.85)'); g.addColorStop(1, 'rgba(255,170,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, 48 * z * pulse, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(bx, by); ctx.rotate(t * .8); ctx.fillStyle = 'rgba(255,248,220,.9)'; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-34 * z * pulse, -1.2, 68 * z * pulse, 2.4); } ctx.restore();
  // the sun: slow-turning rays and a soft breathing flare across the frame
  const [sx, sy] = P(...SUN), sk = .75 + .25 * Math.sin(TAU * t / DUR);
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * .05); for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); const rg = ctx.createLinearGradient(0, 0, 420 * z, 0); rg.addColorStop(0, `rgba(255,240,200,${.22 * sk})`); rg.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(420 * z, -14 * z); ctx.lineTo(420 * z, 14 * z); ctx.fill(); } ctx.restore();
  [[.25, 18, 'rgba(255,200,120,.10)'], [.5, 30, 'rgba(160,220,255,.08)'], [.75, 12, 'rgba(255,170,80,.12)']].forEach(([f, r, c]) => { const fx = lerp(sx, W - sx, f), fy = lerp(sy, H - sy, f); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(fx, fy, r * z * 3 * sk, 0, TAU); ctx.fill(); });
  ctx.restore();
  // a warm grade and a soft vignette
  ctx.fillStyle = 'rgba(255,190,90,.04)'; ctx.fillRect(0, 0, W, H); const vg = ctx.createRadialGradient(W / 2, H * .45, H * .35, W / 2, H * .5, H * .85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}
window.EV = []; window.DUR = DUR; window.render = render; window.READY = true;
