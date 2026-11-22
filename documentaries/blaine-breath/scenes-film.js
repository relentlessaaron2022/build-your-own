// ============================================================
// BUILT DIFFERENT · CASE 009 · THE 17-MINUTE BREATH: palette, fonts, voice clock
// ============================================================
const C = { paper: '#F2E7D0', ink: '#2B1D14', teal: '#2F8F8A', honey: '#F2B233', red: '#D8432F', cream: '#FFF6E4', night: '#13232A', night2: '#1F3A44', orange: '#E07B2C', mint: '#7FB8A4', rust: '#B5492E', water: '#8FCBC4', deep: '#1E4F57', sky: '#BFE0DA', steel: '#9AA7AB', blood: '#B8322A' };
const F = { serif: "'Alfa Slab One'", bagel: "'Bagel Fat One'", mono: "'JetBrains Mono'", sans: "'Archivo Black'", cute: "'Chewy'" };
const FPS = 30;
let WD = [], DUR = 200, END = 190;
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function at(phrase, after = 0) { const q = phrase.split(' ').map(norm).filter(Boolean);
  for (let i = 0; i < WD.length; i++) { if (WD[i].s < after) continue; if (q.every((x, j) => WD[i + j] && norm(WD[i + j].w) === x)) return WD[i].s; } throw new Error('phrase not found: ' + phrase); }
const OFF = 1.2;
const EV = [];
const cue = (t, kind) => { EV.push({ t: +t.toFixed(3), kind }); return t; };
const fmtClock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ============================================================
// characters & props (thick ink outline, flat fills). The subject is a stylized silhouette, never a likeness.
// ============================================================
const LW = 7;
// human silhouette: (0,0) = hips centre, upright, ~ 420 tall at s = 1
function humanEl(parent, fill = C.ink, rim = C.cream) {
  const root = el('g', {}, parent), g = el('g', { filter: 'url(#boil)' }, root);
  const limb = (x, y, len, w) => { const L = el('g', {}, g); el('rect', { x: x - w / 2, y, width: w, height: len, rx: w / 2, fill, stroke: rim, 'stroke-width': 5 }, L); return L; };
  const legL = limb(-26, -10, 200, 44), legR = limb(26, -10, 200, 44);
  const torso = el('path', { d: 'M -64 -230 Q -70 -250 -40 -258 L 40 -258 Q 70 -250 64 -230 L 50 0 Q 0 16 -50 0 Z', fill, stroke: rim, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
  const armL = limb(-70, -248, 190, 36), armR = limb(70, -248, 190, 36);
  const head = el('g', {}, g); el('circle', { cx: 0, cy: -312, r: 50, fill, stroke: rim, 'stroke-width': 6 }, head);
  const lids = el('path', { d: 'M -24 -316 q 8 6 16 0 M 8 -316 q 8 6 16 0', stroke: rim, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, head);
  return { root, g, legL, legR, armL, armR, head, torso };
}
// arms/legs angles in degrees (0 = hanging down), whole figure at x,y scale s rotation rot
function humanPose(h, x, y, s, rot = 0, aL = 10, aR = -10, lL = 4, lR = -4) {
  tf(h.root, x, y, s, rot);
  h.armL.setAttribute('transform', `rotate(${aL} -70 -240)`); h.armR.setAttribute('transform', `rotate(${aR} 70 -240)`);
  h.legL.setAttribute('transform', `rotate(${lL} -26 0)`); h.legR.setAttribute('transform', `rotate(${lR} 26 0)`);
}
// the water sphere: returns { root, inner } (draw the subject into inner), centre (0,0), radius r
let sphN = 0;
function sphereEl(parent, r) {
  const root = el('g', {}, parent), id = 'sp' + sphN++;
  const cp = el('clipPath', { id }, document.querySelector('defs')); el('circle', { cx: 0, cy: 0, r }, cp);
  el('ellipse', { cx: 0, cy: r + 20, rx: r * .9, ry: 34, fill: C.ink, opacity: .35 }, root);
  const body = el('g', { 'clip-path': `url(#${id})` }, root);
  el('circle', { cx: 0, cy: 0, r, fill: C.water }, body);
  halftone(body, { x0: -r, y0: -r, w: 2 * r, h: 2 * r, color: C.deep, step: 18, angle: 30, f: (x, y) => .15 + .45 * clamp((y + r) / (2 * r)), maxK: .55 });
  const inner = el('g', {}, body);
  const bubbles = el('g', {}, body); const B = Array.from({ length: 14 }, (_, i) => ({ e: el('circle', { r: 6 + (i % 4) * 4, fill: 'none', stroke: C.cream, 'stroke-width': 4 }, bubbles), x: -r * .6 + (i * 53) % (r * 1.2), v: 60 + (i % 5) * 25, p: i * .37 }));
  el('circle', { cx: 0, cy: 0, r, fill: 'none', stroke: C.ink, 'stroke-width': 10 }, root);
  el('path', { d: `M ${-r * .7} ${-r * .45} A ${r * .85} ${r * .85} 0 0 1 ${-r * .2} ${-r * .82}`, stroke: C.cream, 'stroke-width': 16, fill: 'none', 'stroke-linecap': 'round', opacity: .8 }, root);
  const bubbleAnim = (t, k) => { op(bubbles, k); B.forEach(b => { const y = r - ((t * b.v + b.p * 300) % (2 * r)); b.e.setAttribute('cx', (b.x + Math.sin(t * 2 + b.p) * 8).toFixed(1)); b.e.setAttribute('cy', y.toFixed(1)); }); };
  return { root, inner, bubbleAnim };
}
// chain across the figure: a row of ink links
function chainEl(parent, x0, y0, x1, y1, n = 9) { const g = el('g', {}, parent); for (let i = 0; i < n; i++) { const u = i / (n - 1), x = lerp(x0, x1, u), y = lerp(y0, y1, u), a = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
    el('ellipse', { cx: 0, cy: 0, rx: 26, ry: 13, fill: 'none', stroke: C.steel, 'stroke-width': 9, transform: `translate(${x} ${y}) rotate(${a + (i % 2 ? 90 : 0) * 0})`, opacity: 1 }, g); el('ellipse', { cx: 0, cy: 0, rx: 26, ry: 13, fill: 'none', stroke: C.ink, 'stroke-width': 3, transform: `translate(${x} ${y}) rotate(${a})` }, g); } return g; }
// ECG monitor: dark screen with a running trace. bpm and extra-beat flag are read at update time.
function monitorEl(parent, w = 760, h = 300) {
  const root = el('g', {}, parent);
  el('rect', { x: 0, y: 0, width: w, height: h, rx: 18, fill: C.night, stroke: C.ink, 'stroke-width': 9 }, root);
  for (let x = 40; x < w; x += 40) el('line', { x1: x, y1: 12, x2: x, y2: h - 12, stroke: '#24414A', 'stroke-width': 2 }, root);
  for (let y = 40; y < h; y += 40) el('line', { x1: 12, y1: y, x2: w - 12, y2: y, stroke: '#24414A', 'stroke-width': 2 }, root);
  const trace = el('path', { d: '', stroke: C.mint, 'stroke-width': 6, fill: 'none', 'stroke-linejoin': 'round' }, root);
  const bpmT = txt(root, '72', { x: w - 30, y: 80, 'font-size': 64, 'font-family': F.bagel, fill: C.honey, 'text-anchor': 'end' });
  txt(root, 'BPM', { x: w - 30, y: 116, 'font-size': 24, 'font-family': F.mono, 'font-weight': 800, fill: C.honey, 'text-anchor': 'end' });
  const update = (t, bpm, extra = 0) => { const win = 4, base = h * .6, pts = [];
    for (let x = 20; x < w - 180; x += 4) { const tau = t - win + (x / (w - 180)) * win, ph = (tau * bpm / 60) % 1; let y = 0;
      if (ph < .04) y = -Math.sin(ph / .04 * Math.PI) * h * .42; else if (ph < .07) y = Math.sin((ph - .04) / .03 * Math.PI) * h * .12; else if (ph > .25 && ph < .35) y = -Math.sin((ph - .25) / .1 * Math.PI) * h * .08;
      if (extra && Math.floor(tau * bpm / 60) % 2 && ph > .55 && ph < .6) y = -Math.sin((ph - .55) / .05 * Math.PI) * h * .3;
      pts.push(`${x} ${(base + y).toFixed(1)}`); }
    trace.setAttribute('d', 'M' + pts.join(' L')); bpmT.textContent = Math.round(bpm); };
  return { root, update };
}
// oxygen tank: (0,0) = base centre
function tankEl(parent) { const root = el('g', {}, parent), g = el('g', { filter: 'url(#boil)' }, root);
  el('rect', { x: -110, y: -560, width: 220, height: 560, rx: 100, fill: C.teal, stroke: C.ink, 'stroke-width': LW }, g);
  el('rect', { x: -40, y: -620, width: 80, height: 70, rx: 10, fill: C.steel, stroke: C.ink, 'stroke-width': 6 }, g);
  el('rect', { x: -70, y: -650, width: 140, height: 40, rx: 10, fill: C.steel, stroke: C.ink, 'stroke-width': 6 }, g);
  el('rect', { x: -110, y: -380, width: 220, height: 150, fill: C.cream, stroke: C.ink, 'stroke-width': 6 }, g);
  txt(g, 'O₂', { x: 0, y: -275, 'font-size': 100, 'font-family': F.mono, 'font-weight': 800, fill: C.ink, 'text-anchor': 'middle' });
  el('path', { d: 'M -60 -520 Q -70 -300 -60 -80', stroke: C.cream, 'stroke-width': 14, fill: 'none', 'stroke-linecap': 'round', opacity: .5 }, g);
  return root; }
// simple sea mammals for the reflex roll call (face right, (0,0) = belly centre)
function sealEl(parent) { const root = el('g', {}, parent), g = el('g', { filter: 'url(#boil)' }, root);
  el('path', { d: 'M -150 0 Q -170 -70 -60 -90 Q 60 -120 120 -80 Q 160 -40 120 0 Z', fill: '#7D8A8E', stroke: C.ink, 'stroke-width': LW, 'stroke-linejoin': 'round' }, g);
  el('path', { d: 'M -150 0 L -210 -30 L -200 20 Z', fill: '#7D8A8E', stroke: C.ink, 'stroke-width': 6 }, g);
  el('path', { d: 'M 10 -10 L 40 30 L -20 20 Z', fill: '#6A777B', stroke: C.ink, 'stroke-width': 6 }, g);
  oneEye(g, 110, -78, 10); el('circle', { cx: 150, cy: -58, r: 6, fill: C.ink }, g); return root; }
function whaleEl(parent) { const root = el('g', {}, parent), g = el('g', { filter: 'url(#boil)' }, root);
  el('path', { d: 'M -260 -20 Q -200 -150 40 -140 Q 220 -130 240 -40 Q 250 20 120 30 L -200 20 Z', fill: '#3E5F73', stroke: C.ink, 'stroke-width': LW, 'stroke-linejoin': 'round' }, g);
  el('path', { d: 'M -250 -10 L -330 -90 L -320 0 L -340 60 Z', fill: '#3E5F73', stroke: C.ink, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
  el('path', { d: 'M -120 10 Q 0 40 200 10', stroke: C.cream, 'stroke-width': 8, fill: 'none', opacity: .6 }, g); oneEye(g, 150, -60, 10); return root; }
function oneEye(g, x, y, r) { const e = el('g', {}, g); el('ellipse', { cx: x, cy: y, rx: r, ry: r * 1.15, fill: C.ink }, e); el('circle', { cx: x - r * .3, cy: y - r * .4, r: r * .34, fill: C.cream }, e); return e; }
// alarm bell (0,0) = centre
function bellEl(parent) { const root = el('g', {}, parent), g = el('g', {}, root);
  el('path', { d: 'M -90 60 Q -90 -90 0 -100 Q 90 -90 90 60 L 110 80 L -110 80 Z', fill: C.red, stroke: C.ink, 'stroke-width': LW, 'stroke-linejoin': 'round' }, g);
  el('circle', { cx: 0, cy: 100, r: 22, fill: C.honey, stroke: C.ink, 'stroke-width': 6 }, g); el('circle', { cx: 0, cy: -112, r: 16, fill: C.honey, stroke: C.ink, 'stroke-width': 6 }, g);
  const waves = [-1, 1].map(sd => el('path', { d: `M ${sd * 140} -40 Q ${sd * 170} 0 ${sd * 140} 40 M ${sd * 175} -70 Q ${sd * 215} 0 ${sd * 175} 70`, stroke: C.honey, 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round' }, root));
  return { root, g, waves }; }
