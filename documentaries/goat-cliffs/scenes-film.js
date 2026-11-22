// ============================================================
// THE CLIFF FILE: palette, fonts, voice clock
// ============================================================
const C = { paper: '#F2E7D0', ink: '#2B1D14', teal: '#2F8F8A', honey: '#F2B233', red: '#D8432F', cream: '#FFF6E4', night: '#1F1813', night2: '#3B2D22', orange: '#E07B2C', mint: '#7FB8A4', rust: '#B5492E', snow: '#FBF8F1', rock: '#6E625A', rock2: '#8C8076', ibex: '#A0784F', tan: '#C99A5B', sky: '#BFE0DA', concrete: '#B9B2A6' };
const F = { serif: "'Alfa Slab One'", bagel: "'Bagel Fat One'", mono: "'JetBrains Mono'", sans: "'Archivo Black'", cute: "'Chewy'" };
const FPS = 30;
let WD = [], DUR = 200, END = 190;
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function at(phrase, after = 0) { const q = phrase.split(' ').map(norm).filter(Boolean);
  for (let i = 0; i < WD.length; i++) { if (WD[i].s < after) continue; if (q.every((x, j) => WD[i + j] && norm(WD[i + j].w) === x)) return WD[i].s; } throw new Error('phrase not found: ' + phrase); }
const OFF = 1.2;
const EV = [];
const cue = (t, kind) => { EV.push({ t: +t.toFixed(3), kind }); return t; };

// ============================================================
// characters: mountain goat, kid, ibex, golden eagle, mountain lion (thick ink outline, flat fills, glossy eyes)
// ============================================================
const LW = 7;
function eyes(g, dx, y, r) { return [-dx, dx].map(x => { const e = el('g', {}, g); el('ellipse', { cx: x, cy: y, rx: r, ry: r * 1.15, fill: C.ink }, e); el('circle', { cx: x - r * .3, cy: y - r * .4, r: r * .32, fill: C.cream }, e); el('circle', { cx: x + r * .3, cy: y + r * .3, r: r * .14, fill: C.cream }, e); return e; }); }
function oneEye(g, x, y, r) { const e = el('g', {}, g); el('ellipse', { cx: x, cy: y, rx: r, ry: r * 1.15, fill: C.ink }, e); el('circle', { cx: x - r * .3, cy: y - r * .4, r: r * .34, fill: C.cream }, e); return e; }
// goat: faces right, (0,0) = hooves line centre. kind: 'goat' | 'kid' | 'ibex'
function goatEl(parent, s = 1, kind = 'goat') {
  const coat = kind === 'ibex' ? C.ibex : C.snow, root = el('g', {}, parent), g = el('g', { filter: 'url(#boil)' }, root);
  const legs = [-70, -40, 50, 80].map(x => { const L = el('g', {}, g); el('rect', { x: x - 10, y: -90, width: 22, height: 84, rx: 8, fill: coat, stroke: C.ink, 'stroke-width': 6 }, L); el('rect', { x: x - 12, y: -14, width: 26, height: 16, rx: 3, fill: C.ink }, L); return L; });
  el('path', { d: 'M -120 -150 Q -130 -210 -40 -215 Q 40 -260 100 -205 Q 135 -170 120 -120 L 112 -82 L 96 -98 L 84 -78 L 70 -96 L 56 -76 L 42 -96 L 26 -76 L 12 -96 L -4 -76 L -20 -96 L -36 -76 L -52 -96 L -68 -76 L -84 -96 L -100 -78 L -112 -100 Z', fill: coat, stroke: C.ink, 'stroke-width': LW, 'stroke-linejoin': 'round' }, g);
  el('path', { d: 'M -60 -200 Q 0 -225 60 -205', stroke: C.cream, 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round', opacity: kind === 'ibex' ? .35 : 0 }, g);
  const head = el('g', {}, g);
  if (kind === 'ibex') el('path', { d: 'M 136 -232 Q 120 -330 30 -320', stroke: '#6B4E33', 'stroke-width': 22, fill: 'none', 'stroke-linecap': 'round' }, head), [0, 1, 2, 3, 4].forEach(k => el('path', { d: `M ${128 - k * 20} ${-262 - k * 12} l -12 -14`, stroke: C.ink, 'stroke-width': 5 }, head));
  else el('path', { d: kind === 'kid' ? 'M 142 -238 Q 140 -262 126 -268' : 'M 142 -236 Q 140 -290 106 -300', stroke: C.ink, 'stroke-width': 13, fill: 'none', 'stroke-linecap': 'round' }, head);
  el('path', { d: 'M 108 -200 Q 120 -250 160 -240 Q 200 -226 206 -190 Q 208 -170 186 -168 Q 150 -168 128 -170 Z', fill: coat, stroke: C.ink, 'stroke-width': LW, 'stroke-linejoin': 'round' }, head);
  if (kind !== 'kid') el('path', { d: 'M 170 -170 L 186 -120 L 196 -168 Z', fill: coat, stroke: C.ink, 'stroke-width': 6, 'stroke-linejoin': 'round' }, head);
  el('path', { d: 'M 126 -232 L 104 -250 L 120 -222 Z', fill: coat, stroke: C.ink, 'stroke-width': 5 }, head);
  const eye = oneEye(head, 162, -214, 9); el('circle', { cx: 203, cy: -186, r: 4, fill: C.ink }, head);
  tf(root, 0, 0, s);
  return { root, legs, head };
}
function goatAnim(gt, t, x, y, s, rot = 0, face = 1, walk = 0, chew = 1) {
  tf(gt.root, x, y, s * face, rot, s);
  gt.legs.forEach((L, i) => L.setAttribute('transform', `rotate(${walk ? Math.sin(t * 10 + i * 1.7) * 14 : 0} ${[-70, -40, 50, 80][i]} -90)`));
  gt.head.setAttribute('transform', `rotate(${chew ? Math.sin(t * 7) * 2 : 0} 130 -190)`);
}
function eagleEl(parent) {   // faces right, (0,0) = body
  const root = el('g', {}, parent), g = el('g', { filter: 'url(#boil)' }, root);
  const wL = el('path', { d: 'M -20 -10 Q -160 -170 -330 -120 L -290 -100 L -320 -70 L -270 -60 L -290 -30 L -230 -30 Q -120 0 -20 20 Z', fill: '#5A3B26', stroke: C.ink, 'stroke-width': LW, 'stroke-linejoin': 'round' }, g);
  el('path', { d: 'M -60 0 L -170 40 L -150 10 L -180 0 L -60 -20 Z', fill: '#5A3B26', stroke: C.ink, 'stroke-width': 6 }, g);
  el('ellipse', { cx: 0, cy: 0, rx: 90, ry: 44, fill: '#6E4A30', stroke: C.ink, 'stroke-width': LW }, g);
  const wR = el('path', { d: 'M 10 -10 Q -60 -200 -230 -190 L -190 -165 L -220 -140 L -170 -130 L -185 -100 L -130 -95 Q -60 -40 10 10 Z', fill: '#7A5233', stroke: C.ink, 'stroke-width': LW, 'stroke-linejoin': 'round' }, g);
  el('circle', { cx: 86, cy: -18, r: 40, fill: C.honey, stroke: C.ink, 'stroke-width': LW }, g);
  el('path', { d: 'M 118 -30 Q 160 -26 156 4 Q 140 -4 120 -4 Z', fill: C.honey, stroke: C.ink, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
  oneEye(g, 98, -28, 9); el('path', { d: 'M 82 -46 L 112 -40', stroke: C.ink, 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
  el('path', { d: 'M 10 40 l -10 40 m 10 -40 l 10 40 m 20 -40 l -6 40 m 6 -40 l 14 38', stroke: C.honey, 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
  return { root, wL, wR };
}
function eagleAnim(e, t, x, y, s, rot = 0, flap = 1) { tf(e.root, x, y, s, rot); const a = flap ? Math.sin(t * 9) * 14 : 0; e.wL.setAttribute('transform', `rotate(${a} -20 0)`); e.wR.setAttribute('transform', `rotate(${a * .8} 0 0)`); }
function cougarEl(parent) {   // faces right, (0,0) = paws line centre
  const root = el('g', {}, parent), g = el('g', { filter: 'url(#boil)' }, root);
  const tail = el('path', { d: 'M -150 -90 Q -260 -60 -250 40 Q -246 70 -220 60', stroke: C.tan, 'stroke-width': 26, fill: 'none', 'stroke-linecap': 'round' }, g);
  el('path', { d: 'M -150 -90 Q -260 -60 -250 40', stroke: C.ink, 'stroke-width': 34, fill: 'none', 'stroke-linecap': 'round', opacity: 0 }, g);
  [-120, -80, 70, 110].forEach(x => el('rect', { x: x - 14, y: -80, width: 30, height: 80, rx: 12, fill: C.tan, stroke: C.ink, 'stroke-width': 6 }, g));
  el('ellipse', { cx: -10, cy: -110, rx: 170, ry: 62, fill: C.tan, stroke: C.ink, 'stroke-width': LW }, g);
  el('path', { d: 'M 130 -190 L 140 -230 L 162 -196 M 196 -196 L 214 -230 L 222 -188', fill: C.tan, stroke: C.ink, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
  el('circle', { cx: 180, cy: -160, r: 52, fill: C.tan, stroke: C.ink, 'stroke-width': LW }, g);
  el('ellipse', { cx: 200, cy: -132, rx: 26, ry: 18, fill: C.cream, stroke: C.ink, 'stroke-width': 5 }, g);
  const ey = eyes(g, 18, -170, 10); ey.forEach(e => e.setAttribute('transform', 'translate(186 0)'));
  el('path', { d: 'M 160 -194 L 186 -184 M 230 -194 L 206 -184', stroke: C.ink, 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
  el('path', { d: 'M 208 -140 l 0 -6', stroke: C.ink, 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
  return { root, tail };
}
// a cliff face: jagged ink mass with a halftone shade, ledges at given heights
function cliff(parent, pts, fill = C.rock, shade = C.ink) { const g = el('g', {}, parent); const d = 'M' + pts.map(p => p.join(' ')).join(' L') + ' Z'; el('path', { d, fill, stroke: C.ink, 'stroke-width': 8, 'stroke-linejoin': 'round' }, g);
  const id = 'cl' + Math.floor(Math.random() * 1e9); const cp = el('clipPath', { id }, document.querySelector('defs')); el('path', { d }, cp); const h = el('g', { 'clip-path': `url(#${id})` }, g); halftone(h, { color: shade, step: 18, angle: 35, f: (x, y) => .25 + .25 * Math.sin(x / 90 + y / 70), maxK: .55 }); return g; }
