// The GitHub Report, Money Series: GAME skin (9:16). Same episode.json as the paper skin; drawn like a video game:
// a neon arcade stage, a player HUD for the host, item cards with rarity glow, quest logs, achievement badges,
// loot coins, level title cards, an RPG dialogue box for captions and a mission-complete screen.
const W = 1080, H = 1920, cv = document.getElementById('out'), ctx = cv.getContext('2d');
const F = { a: s => `400 ${s}px Anton`, g: s => `700 ${s}px Fredoka`, b8: s => `800 ${s}px Barlow`, b6: s => `600 ${s}px Barlow`, m: s => `500 ${s}px Plex` };
await Promise.all([F.a(40), F.g(40), F.b8(40), F.b6(40), F.m(30)].map(f => document.fonts.load(f)));
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - x, 3), eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, ss = x => x * x * (3 - 2 * x), back = x => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const G = { bg0: '#070818', bg1: '#1b0d3d', panel: '#121638', panel2: '#1c2150', cyan: '#3ad7ff', mag: '#ff3fd2', gold: '#ffd23f', green: '#3dff8a', red: '#ff3b5c', or: '#ff9a3c', white: '#f4f6ff', grey: '#8b90b8', ink: '#05060f' };
const COL = c => ({ k: G.white, red: G.red, green: G.green, blue: G.cyan, or: G.or, yel: G.gold, grey: G.grey, '#fff': G.white })[c] || c || G.white;

// ---------- the episode's vertical beats, the voice, the host ----------
const EP = await (await fetch('episode.json')).json(), V = EP.vertical;
const HC = await (await fetch('assets/host.json')).json();
const HOSTNAME = HC.name || 'STORMI DIAMONDZ';
const OFF = .3;
const WD = (await (await fetch('audio/words.json')).json()).words.map(w => ({ ...w, s: w.s + OFF, e: w.e + OFF }));
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function at(phrase, after = 0) { const q = phrase.split(' ').map(norm).filter(Boolean);
  for (let i = 0; i < WD.length; i++) { if (WD[i].s < after) continue; if (q.every((x, j) => WD[i + j] && norm(WD[i + j].w) === x)) return WD[i].s; } throw new Error('phrase not found: ' + phrase); }
const A = (p, d = 0) => typeof p === 'number' ? p : at(p) + d;
const IMG = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
const [HOST, LOGO] = await Promise.all([IMG('assets/' + HC.file), IMG('assets/ru-logo.jpg')]);
const res = e => { if (e.at !== undefined) e._a = A(e.at, e.d || 0); if (e.items) e.items.forEach(it => it._a = A(it.at, it.d || 0)); if (e.end) e._b = A(e.end, e.endD || 0); };
V.beats.forEach(b => { b._a = A(b.at) - .2; b.els.forEach(res); });
const FULL = A(V.outro);
const END = WD[WD.length - 1].e, DUR = Math.ceil((END + 3) * 10) / 10;
const BEAT = [...V.beats.map(b => b._a), FULL - .2];
const beat = t => { let i = 0; while (i + 1 < BEAT.length && t >= BEAT[i + 1]) i++; return t < BEAT[0] ? 0 : i; };
const speaking = t => WD.some(w => t >= w.s && t < w.e);
const HITS = []; V.beats.forEach(b => b.els.forEach(e => { if (e._a !== undefined && ['card', 'stamp', 'big', 'box'].includes(e.type)) HITS.push(e._a); }));
const T = {};
// ---------- drawing vocabulary ----------
function txt(s, x, y, font, col, align = 'left', glow = 0) { ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; if (glow) { ctx.shadowColor = col; ctx.shadowBlur = glow; } ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.shadowBlur = 0; }
const tw = (s, font) => { ctx.font = font; return ctx.measureText(s).width; };
function wrap(s, font, maxW) { const out = []; let ln = ''; for (const w of s.split(' ')) { const t2 = ln ? ln + ' ' + w : w; if (tw(t2, font) > maxW && ln) { out.push(ln); ln = w; } else ln = t2; } if (ln) out.push(ln); return out; }
// a bevelled game panel with a neon edge
function panel(x, y, w, h, edge = G.cyan, fill = G.panel, r = 18, glow = 18) { ctx.save(); ctx.shadowColor = edge; ctx.shadowBlur = glow;
  ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); ctx.shadowBlur = 0; ctx.lineWidth = 4; ctx.strokeStyle = edge; ctx.stroke();
  const g = ctx.createLinearGradient(0, y, 0, y + h * .5); g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x + 4, y + 4, w - 8, h * .5, r - 4); ctx.fill(); ctx.restore(); }
// sparks that burst out when something lands
function burst(x, y, t, a, col = G.gold, n = 18, r0 = 160) { const k = seg(t, a, a + .7); if (k <= 0 || k >= 1) return; ctx.save(); ctx.globalAlpha = 1 - k;
  for (let i = 0; i < n; i++) { const an = hash(i + x * .01) * 7, d = r0 * eo(k) * (.5 + hash(i * 3 + y * .01)), px = x + Math.cos(an) * d, py = y + Math.sin(an) * d; ctx.fillStyle = i % 3 ? col : G.white; ctx.fillRect(px - 4, py - 4, 8, 8); } ctx.restore(); }
// chunky glowing title text, with a split-colour echo as it lands
function big(s, x, y, size, col, t, a, align = 'left') { const k = back(seg(t, a, a + .35)); if (k <= 0) return; const sh = (1 - seg(t, a, a + .3)) * 14;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.globalAlpha = clamp(k * 1.4);
  if (sh > .5) { txt(s, -sh, 0, F.a(size), 'rgba(58,215,255,.7)', align); txt(s, sh, 0, F.a(size), 'rgba(255,63,210,.7)', align); }
  ctx.lineWidth = size * .08; ctx.strokeStyle = G.ink; ctx.font = F.a(size); ctx.textAlign = align; ctx.strokeText(s, 0, 0); txt(s, 0, 0, F.a(size), col, align, 24); ctx.restore(); }
// quest text: types on, with a prompt mark
function qtext(s, x, y, size, col, t, a, b, align = 'left') { const k = seg(t, a, b); if (k <= 0) return; const n = Math.ceil(s.length * k), shown = s.slice(0, n);
  ctx.save(); txt((align === 'left' ? '› ' : '') + shown, x, y, F.g(size * .78), col, align, 8); if (k < 1 && Math.floor(t * 8) % 2) { const w = tw((align === 'left' ? '› ' : '') + shown, F.g(size * .78)); ctx.fillStyle = col; ctx.fillRect(align === 'center' ? x + w / 2 + 4 : x + w + 4, y - size * .6, 12, size * .7); } ctx.restore(); }
// an achievement badge (the paper skin's stamp)
function badge(s, x, y, rot, col, t, a, size = 52) { const k = back(seg(t, a, a + .3)); if (k <= 0) return; const w = tw(s, F.a(size)) + 90, h = size * 1.5;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot * .5); ctx.scale(k, k); panel(-w / 2, -h / 2, w, h, col, G.panel, 14, 30);
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(-w / 2 + 38, 0, size * .38, 0, 7); ctx.fill(); txt('★', -w / 2 + 38, size * .2, F.a(size * .55), G.ink, 'center'); txt(s, 24, size * .36, F.a(size), G.white, 'center', 10); ctx.restore(); burst(x, y, t, a, col, 16, w * .45); }
// an item card: the repo as legendary loot
function itemCard(x, y, w, owner, name, lines, tags, star, t, a, col) { const k = seg(t, a, a + .5); if (k <= 0) return; const h = 150 + lines.length * 44 + (tags.length ? 70 : 0), bob = Math.sin(t * 2) * 4;
  ctx.save(); ctx.globalAlpha = clamp(k * 2); ctx.translate(x + w / 2, y + h / 2 + (1 - eo(k)) * -80 + bob); ctx.rotate((1 - eo(k)) * .25); ctx.scale(lerp(.6, 1, back(k)), lerp(.6, 1, back(k))); ctx.translate(-(x + w / 2), -(y + h / 2));
  const pulse = 24 + 12 * Math.sin(t * 4); ctx.shadowColor = G.gold; ctx.shadowBlur = pulse; panel(x, y, w, h, G.gold, G.panel, 22, pulse);
  ctx.fillStyle = G.gold; ctx.fillRect(x, y + 58, w, 4); txt('LEGENDARY ITEM', x + 34, y + 44, F.m(22), G.gold); if (owner) txt(owner.toUpperCase(), x + w - 34, y + 44, F.m(22), G.grey, 'right');
  txt(name, x + 34, y + 122, F.a(60), G.white, 'left', 12); if (star) { const sw = tw('★ ' + star, F.g(26)) + 36; panel(x + w - sw - 30, y + 80, sw, 48, G.gold, '#3a2a00', 12, 10); txt('★ ' + star, x + w - sw / 2 - 30, y + 113, F.g(26), G.gold, 'center'); }
  lines.forEach((l, i) => txt(l, x + 34, y + 172 + i * 44, F.b6(32), '#cfd3f5'));
  let tx = x + 34; for (const tg of tags) { const pw = tw(tg.toUpperCase(), F.g(22)) + 30; panel(tx, y + h - 64, pw, 42, G.cyan, '#08243a', 10, 6); txt(tg.toUpperCase(), tx + 15, y + h - 35, F.g(22), G.cyan); tx += pw + 12; }
  ctx.restore(); burst(x + w / 2, y + h / 2, t, a + .15, G.gold, 26, w * .55); }
function gbox(x, y, w, h, s, fill, t, a, size = 54, col) { const k = back(seg(t, a, a + .4)); if (k <= 0) return; const solid = fill !== G.white, edge = solid ? fill : G.cyan;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k);
  if (solid) { ctx.shadowColor = edge; ctx.shadowBlur = 30; const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, edge); g.addColorStop(1, shade(edge)); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 20); ctx.fill(); ctx.shadowBlur = 0; ctx.lineWidth = 4; ctx.strokeStyle = G.white; ctx.stroke(); }
  else panel(-w / 2, -h / 2, w, h, G.cyan);
  const tc = col ? COL(col) : (solid ? G.ink : G.white), ls = s.split('\n'); ls.forEach((l, j) => txt(l, 0, size * .35 + (j - (ls.length - 1) / 2) * size * 1.12, F.a(size), tc === G.ink && fill === G.red ? G.white : tc, 'center')); ctx.restore(); }
const shade = c => ({ [G.gold]: '#c98a00', [G.red]: '#a3122f', [G.green]: '#0f9a4a', [G.cyan]: '#0f7aa8', [G.or]: '#b85a10' })[c] || c;
function tag(s, x, y, t, a, w = 260) { const k = back(seg(t, a, a + .35)); if (k <= 0) return; ctx.save(); ctx.translate(x + w / 2, y); ctx.scale(k, k); panel(-w / 2, -40, w, 62, G.mag, '#2a0b35', 31, 14); txt(s.toUpperCase(), 0, 5, F.g(30), G.white, 'center'); ctx.restore(); }
function tip(x, y, rot, title, lines, t, a, cols = [], w = 420, tcol = G.gold) { if (t < a) return; const k = back(seg(t, a, a + .4)), h = 96 + lines.length * 46;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); panel(-w / 2, -h / 2, w, h, tcol, G.panel2, 16, 20); txt('i', -w / 2 + 36, -h / 2 + 56, F.a(40), tcol, 'center'); txt(title, 16, -h / 2 + 56, F.a(36), tcol, 'center');
  lines.forEach((l, j) => txt(l, 0, -h / 2 + 108 + j * 46, F.g(30), cols[j] || G.white, 'center')); ctx.restore(); }
function chat(x, y, w, s, t, a, b, fill = G.panel2, tcol = G.white, size = 34) { if (t < a) return; const k = back(seg(t, a, a + .35)), lines = wrap(s, F.b6(size), w - 60), n = Math.floor(s.length * seg(t, a + .2, b)), h = lines.length * size * 1.3 + 50;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); panel(0, 0, w, h, G.cyan, fill === G.cyan ? '#0b2a52' : G.panel2, 24, 12);
  let left = n; lines.forEach((l, j) => { const shown = l.slice(0, Math.max(0, left)); left -= l.length + 1; txt(shown, 30, 50 + j * size * 1.3, F.b6(size), G.white); }); ctx.restore(); }
function coin(x, y, r, t, i = 0) { const sp = Math.cos(t * 3 + i); ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(.15, Math.abs(sp)), 1); ctx.shadowColor = G.gold; ctx.shadowBlur = 16; ctx.fillStyle = G.gold; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0; ctx.lineWidth = 4; ctx.strokeStyle = '#c98a00'; ctx.stroke(); if (sp > 0) txt('$', 0, r * .38, F.a(r * 1.1), '#8a5a00', 'center'); ctx.restore(); }
function neonLine(pts, t, a, b, col = G.cyan, w = 8) { const k = eo(seg(t, a, b)); if (k <= 0) return; let L = 0; const seglen = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seglen.push(d); L += d; }
  let rem = L * k; ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.shadowColor = col; ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length && rem > 0; i++) { const f = Math.min(1, rem / seglen[i - 1]); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); rem -= seglen[i - 1]; } ctx.stroke(); ctx.restore(); }
function garrow(x0, y0, x1, y1, t, a, col = G.cyan) { neonLine([[x0, y0], [x1, y1]], t, a, a + .35, col, 8); if (t < a + .35) return; const an = Math.atan2(y1 - y0, x1 - x0); ctx.save(); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 16; ctx.beginPath(); ctx.moveTo(x1 + Math.cos(an) * 14, y1 + Math.sin(an) * 14); ctx.lineTo(x1 + Math.cos(an + 2.4) * 30, y1 + Math.sin(an + 2.4) * 30); ctx.lineTo(x1 + Math.cos(an - 2.4) * 30, y1 + Math.sin(an - 2.4) * 30); ctx.fill(); ctx.restore(); }

// ---------- one element (the same types as the paper skin) ----------
function el(e, t) { const a = e._a;
  switch (e.type) {
    case 'card': return itemCard(e.x ?? 120, e.y ?? 170, e.w ?? 980, e.owner || null, e.name, e.lines || [], e.tags || [], e.star || null, t, a, COL(e.col));
    case 'stamp': return badge(e.text, e.x, e.y, e.rot ?? -.03, COL(e.col === 'k' ? 'blue' : (e.col || 'red')), t, a, (e.size || 52) * .9);
    case 'big': return big(e.text, e.x ?? 120, e.y ?? 230, e.size || 96, COL(e.col), t, a, e.align || 'left');
    case 'hw': return qtext(e.text, e.x ?? 140, e.y, e.size || 54, e.col ? COL(e.col) : '#cfd3f5', t, a, a + (e.dur || Math.max(.8, e.text.length * .04)), e.align || 'left');
    case 'box': return gbox(e.x, e.y, e.w, e.h, e.text, COL(e.fill || '#fff'), t, a, e.size || 54, e.col);
    case 'note': return tip(e.x, e.y, e.rot ?? 0, e.title, e.lines, t, a, (e.cols || []).map(COL), e.w || 420, COL(e.tcol || 'yel'));
    case 'chips': return e.items.forEach((it, i) => tag(it.text, (e.x ?? 140) + (i % (e.per || 4)) * (e.dx || 330), (e.y ?? 380) + Math.floor(i / (e.per || 4)) * (e.dy || 110), t, it._a, e.w || 300));
    case 'checks': { // the quest log
      if (t < e.items[0]._a) return; const x = e.x ?? 140, y0 = (e.y ?? 450) - 70, rows = e.items.length, dy = e.dy || 110;
      ctx.save(); ctx.globalAlpha = clamp(seg(t, e.items[0]._a - .3, e.items[0]._a)); txt('QUEST LOG', x, y0 - 6, F.m(24), G.cyan); ctx.fillStyle = G.cyan; ctx.fillRect(x, y0 + 4, 300, 3); ctx.restore();
      e.items.forEach((it, i) => { if (t < it._a) return; const y = (e.y ?? 450) + i * dy, k = back(seg(t, it._a, it._a + .35)), bad = it.mark === '✗', c = bad ? G.red : G.green;
        ctx.save(); ctx.translate(x + 40, y - 15); ctx.scale(k, k); panel(-34, -34, 68, 68, c, bad ? '#3a0a16' : '#0a3a1e', 10, 16); txt(bad ? '✗' : '✓', 0, 16, F.a(48), c, 'center'); ctx.restore();
        qtext(it.text, x + 100, y, (e.size || 54) * 1.12, G.white, t, it._a + .05, it._a + .05 + it.text.length * .03);
        const fk = seg(t, it._a + .2, it._a + 1.2); if (fk > 0 && fk < 1) { ctx.save(); ctx.globalAlpha = 1 - fk; txt(bad ? 'BLOCKED' : '+50 XP', x + 100 + tw('› ' + it.text, F.g((e.size || 54) * .78)) + 30, y - 30 * fk, F.g(30), c, 'left', 10); ctx.restore(); } }); return; }
    case 'sms': return chat(e.x, e.y, e.w || 520, e.text, t, a, e._b ?? a + e.text.length * .03, COL(e.fill || '#fff'), G.white, e.size || 34);
    case 'phone': { if (t < a) return; const k = back(seg(t, a, a + .5)); ctx.save(); ctx.translate(e.x, e.y); ctx.scale(k, k); panel(0, 0, 560, e.h || 560, G.mag, '#0b0d22', 46, 30); ctx.fillStyle = '#05060f'; ctx.fillRect(24, 60, 512, (e.h || 560) - 90); txt('INCOMING QUEST', 280, 44, F.m(22), G.mag, 'center'); ctx.restore(); return; }
    case 'banner': { if (t < a) return; const k = back(seg(t, a, a + .4)); ctx.save(); ctx.translate(e.x ?? 960, e.y ?? 540);
      ctx.save(); ctx.rotate(t * .4); ctx.globalAlpha = .25 * clamp(k); for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI / 8); ctx.fillStyle = i % 2 ? G.gold : G.mag; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1400, -120); ctx.lineTo(1400, 120); ctx.fill(); } ctx.restore();
      ctx.scale(k, k); panel(-680, -140, 1360, 270, G.gold, '#1a1240', 26, 50); txt('LEVEL UP', 0, -78, F.m(28), G.gold, 'center'); txt(e.l1, 0, 0, F.a(e.size1 || 70), G.white, 'center', 10); txt(e.l2, 0, 88, F.a(e.size2 || 62), G.gold, 'center', 20); ctx.restore(); burst(e.x ?? 960, e.y ?? 540, t, a, G.gold, 40, 700); return; }
    case 'stack': { for (let i = 0; i < e.n; i++) { const a2 = a + i * .25, k = back(seg(t, a2, a2 + .3)); if (k <= 0) continue; const x = (e.x ?? 200) + i * 150, y = (e.y ?? 620) - (1 - k) * 200;
        coin(x, y, 54 * k, t, i); txt(e.label, x, y + 100, F.g(30), G.gold, 'center'); burst(x, y, t, a2, G.gold, 8, 80); }
      if (t > a + e.n * .25 + .3) txt('=', (e.x ?? 200) + e.n * 150 + 10, (e.y ?? 620) + 30, F.a(110), G.white, 'center', 16); return; }
    case 'bars': { const base = e.y ?? 830, mx = Math.max(...e.items.map(i => i.v));
      e.items.forEach((it, i) => { if (t < it._a) return; const x = (e.x ?? 120) + 50 + i * 330, full = (e.h || 380), h = Math.max(it.v / mx, .03) * full * eo(seg(t, it._a, it._a + .8)), c = COL(it.col || 'blue');
        panel(x - 6, base - full - 6, 232, full + 12, G.grey, '#0b0d22', 12, 0); for (let s = 0; s < h; s += 24) { ctx.save(); ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 12; ctx.fillRect(x + 8, base - s - 20, 204, 18); ctx.restore(); }
        txt(it.label, x + 110, base - full - 24, F.a(40), c, 'center', 10); txt(it.name, x + 110, base + 50, F.g(28), G.white, 'center'); }); return; }
    case 'arrow': return garrow(e.x0, e.y0, e.x1, e.y1, t, a, COL(e.col || 'blue'));
    case 'line': return neonLine(e.pts, t, a, a + (e.dur || 1.2), COL(e.col || 'green'), e.w || 10);
  }
}

// ---------- frame (9:16): the host in a game frame on top, the level below, the dialogue box on the seam ----------
const Y0 = 1080;
function bg(t) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, G.bg0); g.addColorStop(.6, G.bg1); g.addColorStop(1, '#2b0b44'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 1500, W, 420); ctx.clip(); ctx.strokeStyle = 'rgba(255,63,210,.35)'; ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) { const z = ((i + (t * .9) % 1) / 10), y = 1500 + Math.pow(z, 2.2) * 420; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 40, 1500); ctx.lineTo(W / 2 + i * 200, H); ctx.stroke(); } ctx.restore(); }
function outro(t) { const k = back(seg(t, FULL, FULL + .5)); if (k > 0) { ctx.save(); ctx.translate(540, Y0 + 250); ctx.scale(k, k); ctx.shadowColor = G.gold; ctx.shadowBlur = 40; ctx.beginPath(); ctx.arc(0, 0, 190, 0, 7); ctx.fillStyle = '#000'; ctx.fill(); ctx.clip(); ctx.shadowBlur = 0; ctx.drawImage(LOGO, 660 - 255, 310 - 255, 510, 510, -190, -190, 380, 380); ctx.restore(); }
  badge('FULL BREAKDOWN + FIRST CLIENT SCRIPT', 540, Y0 + 560, 0, G.cyan, t, FULL + .8, 34); badge('THE GITHUB REPORT', 540, Y0 + 690, 0, G.gold, t, FULL + 2.4, 60); }
const CAP = (() => { const out = []; let g = []; for (const w of WD) { if (g.length && (g.length >= 3 || /[.,!?:]$/.test(g[g.length - 1].w) || w.s - g[g.length - 1].e > .4)) { out.push(g); g = []; } g.push(w); } if (g.length) out.push(g); return out.map(c => ({ t0: c[0].s - .05, t1: c[c.length - 1].e + .2, words: c })); })();
async function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; bg(t);
  let shake = 0; for (const h of HITS) { const d = t - h; if (d >= 0 && d < .25) shake = Math.max(shake, (1 - d / .25) * 8); }
  // the host in a neon game frame
  const [cx, cy, cw] = HC.vcrop, z = 1 + .06 * seg(t, 0, DUR), sw = cw / z, sh = sw * 880 / 1000;
  ctx.save(); panel(36, 150, 1008, 900, G.cyan, '#000', 26, 30); ctx.beginPath(); ctx.roundRect(44, 158, 992, 884, 22); ctx.clip(); ctx.drawImage(HOST, cx - sw / 2, cy - sh * .42, sw, sh, 44, 158, 992, 884);
  for (let y = 158; y < 1042; y += 4) { ctx.fillStyle = 'rgba(0,0,0,.10)'; ctx.fillRect(44, y, 992, 2); } ctx.restore();
  // top HUD: title + episode
  panel(36, 30, 1008, 100, G.gold, 'rgba(10,12,34,.92)', 18, 16); txt('THE GITHUB REPORT', 64, 100, F.a(64), G.white, 'left', 10); txt('MONEY #' + EP.num, 1016, 100, F.a(56), G.gold, 'right', 16);
  // player tag + HP / XP on the photo
  panel(64, 900, 500, 120, G.gold, 'rgba(10,12,34,.88)', 16, 12); txt('PLAYER 1', 88, 936, F.m(20), G.gold); txt(HOSTNAME, 88, 980, F.a(40), G.white, 'left', 8);
  const bar = (y, lab, f, c) => { txt(lab, 88, y + 14, F.m(16), c); ctx.fillStyle = '#0b0d22'; ctx.fillRect(130, y, 410, 16); ctx.save(); ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 10; ctx.fillRect(130, y, 410 * f, 16); ctx.restore(); };
  bar(994, 'XP', clamp(t / END), G.cyan);
  const on = speaking(t); ctx.fillStyle = G.cyan; for (let j = 0; j < 12; j++) { const v = on ? .3 + .7 * Math.abs(Math.sin(t * 11 + j * .9)) : .15; ctx.fillRect(620 + j * 16, 960 - 50 * v / 2, 9, 50 * v); }
  // the level
  const b = beat(t), last = b === V.beats.length; ctx.save(); const kin = eo(seg(t, BEAT[b], BEAT[b] + .3)); ctx.translate((1 - kin) * 120 + Math.sin(t * 90) * shake, Math.cos(t * 77) * shake); ctx.globalAlpha = kin;
  if (last) outro(t); else { ctx.translate(0, Y0); V.beats[b].els.forEach(e => el(e, t)); } ctx.restore();
  // bottom band
  panel(60, 1752, 960, 100, G.red, 'rgba(60,8,20,.92)', 20, 24); txt(V.band || EP.bug.replace(/ {2}· {2}/, '  •  '), 540, 1822, F.a(54), G.white, 'center', 10);
  txt('ONE REPO. ONE WAY IT PAYS.', 540, 1896, F.g(30), G.gold, 'center');
  // dialogue box (captions)
  const c = CAP.find(c => t >= c.t0 && t < c.t1); if (c && t <= END) { const f = F.g(64), words = c.words.map(w => w.w), fw = tw(words.join(' '), f), bw = Math.max(fw + 100, 620);
    panel(540 - bw / 2, 760, bw, 112, G.cyan, 'rgba(8,10,30,.92)', 18, 18); let x = 540 - fw / 2; c.words.forEach((w, j) => { const on2 = t >= w.s && t < w.e + .1; txt(words[j], x, 838, f, on2 ? G.gold : G.white, 'left', on2 ? 14 : 0); x += tw(words[j] + ' ', f); }); }
  if (t > END + .5) { const k = ss(seg(t, END + .5, END + 1.3)); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = G.bg0; ctx.fillRect(0, 0, W, H);
    txt('CONTINUE?', 540, 720, F.a(140), G.white, 'center', 30); txt(String(Math.max(0, 9 - Math.floor((t - END - .5) * 2))), 540, 920, F.a(180), G.gold, 'center', 40);
    txt('FOLLOW FOR MONEY #' + String(+EP.num + 1).padStart(2, '0'), 540, 1060, F.a(60), G.cyan, 'center', 20); ctx.restore(); }
}
window.EV = []; window.DUR = DUR; window.render = render; window.READY = true;
