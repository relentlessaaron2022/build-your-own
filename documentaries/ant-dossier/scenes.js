// ============================================================
// THE ANT KINGDOM, DOSSIER CUT: palette, fonts, voice clock
// ============================================================
const C = { paper: '#F2E7D0', ink: '#2B1D14', teal: '#2F8F8A', honey: '#F2B233', red: '#D8432F', cream: '#FFF6E4', night: '#1F1813', night2: '#3B2D22', orange: '#E07B2C', mint: '#7FB8A4', rust: '#B5492E', roach: '#8A5A36', leaf: '#5E9A4B', water: '#2F8F8A' };
const F = { serif: "'Alfa Slab One'", bagel: "'Bagel Fat One'", mono: "'JetBrains Mono'", sans: "'Archivo Black'", cute: "'Chewy'" };
const FPS = 30;
let WD = [], DUR = 200, END = 190;
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function at(phrase, after = 0) { const q = phrase.split(' ').map(norm).filter(Boolean);
  for (let i = 0; i < WD.length; i++) { if (WD[i].s < after) continue; if (q.every((x, j) => WD[i + j] && norm(WD[i + j].w) === x)) return WD[i].s; } throw new Error('phrase not found: ' + phrase); }
const OFF = 1.5;
const EV = [];
const cue = (t, kind) => { EV.push({ t: +t.toFixed(3), kind }); return t; };

// ============================================================
// characters: the ant and the cockroach (thick ink outline, flat fills, glossy eyes) + a crowd glyph
// ============================================================
const LW = 7;
function eyes(g, dx, y, r) { return [-dx, dx].map(x => { const e = el('g', {}, g); el('ellipse', { cx: x, cy: y, rx: r, ry: r * 1.15, fill: C.ink }, e); el('circle', { cx: x - r * .3, cy: y - r * .4, r: r * .32, fill: C.cream }, e); el('circle', { cx: x + r * .3, cy: y + r * .3, r: r * .14, fill: C.cream }, e); return e; }); }
function antEl(parent, s = 1, body = C.rust) {   // faces right; (0,0) = thorax
  const root = el('g', {}, parent), g = el('g', { filter: 'url(#boil)' }, root);
  const legs = [-14, 0, 14].map((x, i) => { const L = el('g', {}, g); el('path', { d: `M ${x} 0 L ${x - 18 + i * 10} 44 L ${x - 30 + i * 14} 60`, stroke: C.ink, 'stroke-width': 6, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, L); return L; });
  el('ellipse', { cx: -78, cy: 4, rx: 50, ry: 40, fill: body, stroke: C.ink, 'stroke-width': LW }, g);
  el('path', { d: 'M -96 -26 Q -70 -38 -48 -24', stroke: C.cream, 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round', opacity: .6 }, g);
  el('circle', { cx: -28, cy: 2, r: 12, fill: body, stroke: C.ink, 'stroke-width': 6 }, g);
  el('ellipse', { cx: 0, cy: -2, rx: 26, ry: 18, fill: body, stroke: C.ink, 'stroke-width': LW }, g);
  const head = el('g', {}, g);
  el('path', { d: 'M 60 -20 Q 70 -70 96 -74 L 112 -52 M 46 -24 Q 44 -78 64 -94 L 84 -84', stroke: C.ink, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, head);
  const jaw = el('path', { d: 'M 74 20 Q 96 24 100 10 M 74 26 Q 92 40 104 28', stroke: C.ink, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, head);
  el('circle', { cx: 52, cy: 0, r: 32, fill: body, stroke: C.ink, 'stroke-width': LW }, head);
  const ey = eyes(head, 11, -6, 9); ey.forEach(e => e.setAttribute('transform', 'translate(58 0)'));
  tf(root, 0, 0, s);
  return { root, legs, eyes: ey, jaw };
}
function antAnim(a, t, x, y, s, rot = 0, face = 1, walk = 1) {
  tf(a.root, x, y + (walk ? Math.abs(Math.sin(t * 9)) * -4 : Math.sin(t * 2) * 2), s * face, rot, s);
  a.legs.forEach((L, i) => L.setAttribute('transform', `rotate(${walk ? Math.sin(t * 18 + i * 2.1) * 16 : 0} ${[-14, 0, 14][i]} 0)`));
}
function roachEl(parent) {   // faces right; (0,0) = body centre
  const root = el('g', {}, parent), g = el('g', { filter: 'url(#boil)' }, root);
  for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) el('path', { d: `M ${-40 + i * 50} ${sd * 40} L ${-70 + i * 60} ${sd * 110} L ${-110 + i * 70} ${sd * 140}`, stroke: C.ink, 'stroke-width': 9, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
  el('ellipse', { cx: 0, cy: 0, rx: 190, ry: 92, fill: C.roach, stroke: C.ink, 'stroke-width': LW }, g);
  el('path', { d: 'M -180 0 L 120 0', stroke: C.ink, 'stroke-width': 6 }, g);
  el('path', { d: 'M -150 -50 Q -40 -70 100 -40 M -150 50 Q -40 70 100 40', stroke: '#B07A4E', 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }, g);
  el('ellipse', { cx: 170, cy: 0, rx: 62, ry: 70, fill: '#A6703F', stroke: C.ink, 'stroke-width': LW }, g);
  el('path', { d: 'M 220 -30 Q 330 -140 420 -110 M 220 30 Q 330 140 420 120', stroke: C.ink, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, g);
  const ey = eyes(g, 22, -6, 14); ey.forEach(e => e.setAttribute('transform', 'translate(196 0)'));
  const brows = el('path', { d: 'M 170 -36 L 200 -48 M 236 -48 L 262 -36', stroke: C.ink, 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
  const sweat = el('path', { d: 'M 260 -70 Q 272 -50 262 -40 Q 248 -50 260 -70 Z', fill: C.cream, stroke: C.ink, 'stroke-width': 4 }, g);
  return { root, sweat };
}
// crowd glyph: a tiny ant, fill inherited from the <use>
function antGlyphDef() { const d = document.querySelector('defs'), g = el('g', { id: 'antG' }, d);
  el('path', { d: 'M -6 0 L -10 9 M 0 0 L 0 10 M 6 0 L 10 9 M -6 0 L -10 -9 M 0 0 L 0 -10 M 6 0 L 10 -9', stroke: C.ink, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g);
  el('ellipse', { cx: -14, cy: 0, rx: 9, ry: 7 }, g); el('ellipse', { cx: 0, cy: 0, rx: 6, ry: 4.5 }, g); el('circle', { cx: 10, cy: 0, r: 5.5 }, g); }
function glyph(parent, fill = C.ink) { const u = el('use', { href: '#antG', fill }, parent); return u; }
function crowd(parent, n, fill) { return Array.from({ length: n }, () => glyph(parent, fill)); }

// ============================================================
// the stage
// ============================================================
const world = document.getElementById('world'), cam = document.getElementById('cam'), hud = document.getElementById('hud'), wipe = document.getElementById('wipe'), flash = document.getElementById('flash'), fade = document.getElementById('fade');
const scenes = [];
function scene(t0, t1, build) { const g = el('g', {}, world); const s = { g, t0, t1 }; s.update = build(g, s); scenes.push(s); return s; }
let hudUpdate = () => {}, wipeUpdate = () => {}, capUpdate = () => {};
const SHAKES = [], FLASHES = [], WIPES = [];
const headline = (g, s, x, y, size, fill = C.ink, sh = C.teal) => chars(g, s, { x, y, size, family: F.serif, weight: 400, fill, shadow: { fill: sh, dx: 8, dy: 8 } });
const mono = (g, s, x, y, size, fill = C.ink, anchor = 'start') => txt(g, s, { x, y, 'font-size': size, 'font-family': F.mono, 'font-weight': 800, fill, 'text-anchor': anchor, 'letter-spacing': 2 });
const big = (g, s, x, y, size, fill = C.red, anchor = 'start') => chars(g, s, { x, y, size, family: F.bagel, weight: 400, fill, anchor, shadow: { fill: C.ink, dx: 10, dy: 10 } });
const line = (g, s, x, y, size, fill = C.ink, anchor = 'start') => chars(g, s, { x, y, size, family: F.sans, weight: 400, fill, anchor });
let clipN = 0;
function bigNumeral(g, s, x, y, size, fill, dots) { const id = 'cn' + clipN++; const cp = el('clipPath', { id }, document.querySelector('defs')); txt(cp, s, { x, y, 'font-size': size, 'font-family': F.bagel, 'text-anchor': 'end' });
  const n = el('g', {}, g); txt(n, s, { x, y, 'font-size': size, 'font-family': F.bagel, fill, 'text-anchor': 'end' }); const h = el('g', { 'clip-path': `url(#${id})` }, n); halftone(h, { color: dots, step: 22, angle: 30, f: (px, py) => .3 + .5 * clamp((py - (y - size * .8)) / size), maxK: .66 }); return n; }
function exhibitHead(g, num, title, tA, dark = false, label = 'EXHIBIT') {
  const n = bigNumeral(g, num, 2010, 1030, 820, dark ? C.night2 : '#EDB9A6', dark ? '#5a4535' : C.rust);
  const tag = el('g', {}, g); const tw = measure(label + ' ' + num, 30, F.mono, 800) + 60; el('rect', { x: 0, y: 0, width: tw, height: 56, rx: 8, fill: dark ? C.cream : C.ink }, tag); txt(tag, label + ' ' + num, { x: 22, y: 40, 'font-size': 30, 'font-family': F.mono, 'font-weight': 800, fill: dark ? C.ink : C.honey, 'letter-spacing': 3 });
  const hl = headline(g, title, 140, 340, 130, dark ? C.cream : C.ink, dark ? C.red : C.teal);
  const f = t => { tf(n, lerp(400, 0, E.out(seg(t, tA - .3, tA + .4))), 0); op(n, t >= tA - .3 ? 1 : 0); tf(tag, 140, lerp(-80, 140, E.back(seg(t, tA, tA + .4)))); charsPop(hl, t, tA + .25, .04, .38, 70); };
  f.vis = v => [n, tag, hl.g].forEach(e => show(e, v)); return f;
}
const within = (t, a, b) => t >= a && t < b;
const R1 = rng(99);

function buildAll() {
  antGlyphDef();
  const T = {
    look: at('Look closely.'), giant: at('A giant, by any'), arrive: at('the ants arrive.'), how: at('How is that even'), notStronger: at('The ants are not stronger.'), notAlone: at('But none of them is alone.'),
    little: at('When the little ones come'), fall: at('even giants fall.'), mystery: at('This is the mystery,'),
    e1: at('Start with the numbers,'), y2022: at('In 2022, a team'), est: at('Their estimate:'), twenty: at('A twenty, followed by'), cons: at('And they called that'), two5: at('That is roughly two'), scale: at('Put them all on'), combined: at('combined.'), species: at('Scientists have named more'), antarctica: at('except Antarctica.'), long: at('They were here long'),
    e2: at('So here is the question.'), who: at('Who is in charge?'), nobody: at('Nobody.'), queen: at('The queen does not'), eggs: at('She lays eggs.'), notCommand: at('But she does not command'), signals: at('the colony runs on signals.'), pher: at('Ants talk through chemicals'), finds: at('When a worker finds food,'), follow: at('Other workers follow it.'), good: at('If the food is good,'), runs: at('When the food runs out,'), memo: at('No meeting.'), louder: at('The best route simply'), danger: at('And when danger appears,'), dozens: at('What started as a few'),
    e3: at('Then there are the tools.'), mand: at('They are called mandibles.'), jaws: at('Jaws that grip,'), oneSet: at('One set of mandibles'), thousand: at('A thousand sets,'), video: at('That is what you are seeing'), more: at('They only need to be more,'), name: at('Scientists have a name'), collective: at('Collective behavior.'), simple: at('Each ant follows simple,'), together: at('Together, the colony solves'), four: at('To see how far'),
    c1: at('Case file one.'), rain: at('In the rainforests of'), noHome: at('They have no permanent home.'), build: at('Each night, they build'), biv: at('They call it a bivouac.'), raid: at('By day, they raid.'), swarm: at('A swarm front up'),
    c2: at('Case file two.'), long2: at('Long before human beings'), fifty: at('By many scientific estimates,'), leaf: at('Leafcutter ants carry pieces'), feeds: at('The fungus feeds the colony.'), partner: at('A partnership, older than'),
    c3: at('Case file three.'), floods: at('When floods come,'), colony3: at('But a colony does'), grip: at('The ants grip each other'), thousands: at('Thousands of them, floating'), days: at('Researchers have watched these'), noAnt: at('No ant built that raft.'), every: at('Every ant is the raft.'),
    c4: at('Case file four.'), argentine: at('A little brown ant'), today: at('Today, one of its'), family: at('Inside that supercolony,'), rival: at('But when they meet'), largest: at('One of the largest cooperative'),
    verdict: at('So what does all of'), biggest: at('The biggest creature does'), strongest: at('The strongest individual does'), advantage: at('And having every advantage'), community: at('Think about that in your'), nobody2: at('Nobody needs to see'), oneAnt: at('One ant is small.'), force: at('A thousand ants are a force.'), nature: at('Nature keeps reminding us'), powerful: at('into the powerful.'), magic: at('And maybe that is the real'), bigger: at('they become something much'),
    end: at('The Ant Kingdom. Produced'), produced: at('Produced by Relentless Aaron.'),
  };
  const S = [0, T.little - .15, T.e1 - .15, T.e2 - .15, T.e3 - .15, T.c1 - .15, T.c2 - .15, T.c3 - .15, T.c4 - .15, T.verdict - .15, T.end - .15, END + .6, DUR];
  S.forEach((s, i) => cue(s, 'sect' + i));
  S.slice(1, 11).forEach((s, i) => { WIPES.push([s, [C.rust, C.teal, C.red, C.honey, C.night, C.leaf, C.teal, C.red, C.honey, C.ink][i]]); cue(s - .2, 'whoosh'); });
  const ess = T.powerful + .55; cue(ess, 'ess');

  // ---------- S0 · the giant: a cockroach on dark ink, and the ants arrive ----------
  scene(S[0], S[1], g => {
    bg(g, C.night); halftone(g, { color: C.night2, step: 24, angle: 20, f: edge(860, 1.3), maxK: .7 });
    const halo = halftone(g, { color: C.rust, step: 22, angle: 45, f: radial(960, 560, 420, 1.3), maxK: .62 });
    const no = mono(g, 'CASE NO. 006', 140, 170, 40, C.honey);
    const roach = roachEl(g);
    const subj = line(g, 'SUBJECT: A COCKROACH', 140, 260, 60, C.cream);
    const gnt = line(g, 'A GIANT, BY ANY MEASURE.', 140, 340, 46, C.honey);
    const N = 190, A = crowd(g, N, C.rust), P = A.map((_, i) => { const a = R1() * 6.283, tgtA = R1() * 6.283, tr = .8 + R1() * .5; const d = i < 6 ? i * .7 : 4.2 + (i - 6) * .045;
      return { sx: 960 + Math.cos(a) * 1250, sy: 560 + Math.sin(a) * 800, tx: 960 + Math.cos(tgtA) * 210 * tr, ty: 580 + Math.sin(tgtA) * 105 * tr, d, sp: 2.2 + R1() * 1.2 }; });
    const ns = line(g, 'NOT STRONGER.', 140, 880, 60, C.cream), na = line(g, 'NOT ALONE.', 140, 880, 60, C.honey);
    const st = stampEl(g, 'OUTNUMBERED', { size: 110, color: C.red, family: F.sans }); cue(T.notAlone + 1.1, 'stamp'); SHAKES.push([T.notAlone + 1.1, 16, .3]);
    for (let i = 0; i < 6; i++) cue(T.arrive - 1.2 + i * .7, 'tick');
    return t => { const z = 1 + .06 * seg(t, 0, S[1]); tf(g, 960 * (1 - z), 540 * (1 - z), z); op(halo, .5 + .3 * Math.sin(t * 2));
      const panic = seg(t, T.how, T.notAlone); tf(roach.root, 960 + Math.sin(t * (6 + 30 * panic)) * (2 + 6 * panic), 580, .95); op(roach.sweat, panic);
      op(no, seg(t, T.look, T.look + .2)); charsPop(subj, t, T.look + .6, .025); charsPop(gnt, t, T.giant, .02);
      A.forEach((u, i) => { const p = P[i], k = E.out(seg(t, T.arrive - 1.2 + p.d, T.arrive - 1.2 + p.d + p.sp)); const x = lerp(p.sx, p.tx, k), y = lerp(p.sy, p.ty, k); u.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(Math.atan2(p.ty - p.sy, p.tx - p.sx) * 57.3).toFixed(0)}) scale(1.6)`); show(u, t >= T.arrive - 1.2 + p.d); });
      show(ns.g, within(t, T.notStronger, T.notAlone)); charsPop(ns, t, T.notStronger, .03); show(na.g, t >= T.notAlone); charsPop(na, t, T.notAlone, .04); stampAnim(st, t, T.notAlone + 1.1, 1480, 330, -8); };
  });
  // ---------- S1 · the mugshot: one ant, and the thesis ----------
  scene(S[1], S[2], g => {
    bg(g, C.paper); halftone(g, { color: C.teal, step: 22, angle: 15, f: edge(900, 1.5), maxK: .62 }).setAttribute('class', 'mul');
    const chart = el('g', {}, g); for (let i = 0; i <= 6; i++) { el('line', { x1: 260, x2: 1060, y1: 380 + i * 70, y2: 380 + i * 70, stroke: C.ink, 'stroke-width': i % 2 ? 2 : 5 }, chart); mono(chart, String(6 - i), 230, 392 + i * 70, 26, C.ink, 'end'); } mono(chart, 'mm (enlarged)', 1080, 392, 22);
    const ant = antEl(g, 2);
    const plate = el('g', {}, g); el('rect', { x: -300, y: -60, width: 600, height: 120, rx: 10, fill: C.ink }, plate); txt(plate, 'THE ANT', { x: 0, y: 4, 'font-size': 64, 'font-family': F.sans, fill: C.cream, 'text-anchor': 'middle' }); mono(plate, 'FORMICIDAE · CASE 006', 0, 44, 24, C.honey, 'middle');
    const h1 = headline(g, 'WHEN THE LITTLE ONES', 140, 200, 92), h2 = headline(g, 'COME TOGETHER,', 140, 300, 92);
    const st = stampEl(g, 'EVEN GIANTS FALL', { size: 78, color: C.red, family: F.sans }); cue(T.fall + .5, 'stamp'); SHAKES.push([T.fall + .5, 20, .35]);
    const ttl = el('g', {}, g); el('rect', { x: -330, y: -100, width: 660, height: 200, rx: 14, fill: C.rust, stroke: C.ink, 'stroke-width': 8 }, ttl); txt(ttl, 'THE ANT', { x: 0, y: -10, 'font-size': 84, 'font-family': F.serif, fill: C.cream, 'text-anchor': 'middle' }); txt(ttl, 'KINGDOM', { x: 0, y: 76, 'font-size': 84, 'font-family': F.serif, fill: C.cream, 'text-anchor': 'middle' });
    FLASHES.push(S[1] + .4, S[1] + 1.2); cue(S[1] + .4, 'shutter'); cue(S[1] + 1.2, 'shutter');
    return t => { antAnim(ant, t, 640, 560, 2, 0, 1, 0); tf(plate, 640, lerp(1250, 830, E.back(seg(t, S[1] + .2, S[1] + .6))));
      charsPop(h1, t, T.little, .03); charsPop(h2, t, T.little + .7, .03); stampAnim(st, t, T.fall + .5, 1400, 440, -7);
      tf(ttl, 1440, 780, pop(t, T.mystery, .45), -4); show(ttl, t >= T.mystery); };
  });
  // ---------- S2 · Exhibit 01: the numbers ----------
  scene(S[2], S[3], g => {
    bg(g, C.paper); const head = exhibitHead(g, '01', 'THE NUMBERS', T.e1);
    const study = el('g', {}, g); for (let i = 0; i < 6; i++) { el('rect', { x: i * 14, y: -i * 14, width: 260, height: 330, rx: 8, fill: C.cream, stroke: C.ink, 'stroke-width': 6 }, study); } for (let k = 0; k < 6; k++) el('line', { x1: 100, x2: 300, y1: -10 + k * 40, y2: -10 + k * 40, stroke: C.ink, 'stroke-width': 5, opacity: .5 }, study);
    const s1 = big(g, '~500', 600, 620, 200, C.rust), s2 = line(g, 'STUDIES, ONE COUNT · 2022', 610, 700, 46);
    const q1 = big(g, '20 QUADRILLION', 140, 580, 150, C.red); const zeros = mono(g, '', 150, 680, 60, C.ink); const ANTS = 'ANTS ALIVE RIGHT NOW';
    const qa = mono(g, ANTS, 150, 760, 32, C.teal);
    const cons = stampEl(g, 'CONSERVATIVE', { size: 96, color: C.teal, family: F.sans }); cue(T.cons + .9, 'stamp'); SHAKES.push([T.cons + .9, 14, .3]);
    const p1 = big(g, '2,500,000', 140, 600, 190, C.rust), p2 = line(g, 'ANTS FOR EVERY HUMAN BEING', 150, 690, 50);
    const sc = el('g', {}, g); el('path', { d: 'M 0 0 L -60 240 L 60 240 Z', fill: C.ink }, sc); const beam = el('g', {}, sc); el('rect', { x: -420, y: -12, width: 840, height: 24, rx: 12, fill: C.ink }, beam);
    const panL = el('g', {}, beam), panR = el('g', {}, beam); [panL, panR].forEach((p, i) => { el('path', { d: 'M -150 0 Q 0 90 150 0 Z', fill: C.cream, stroke: C.ink, 'stroke-width': 7 }, p); });
    const heap = crowd(panL, 70, C.rust); heap.forEach((u, i) => { const a = R1(), b = R1(); tf(u, (a - .5) * 230, -6 - b * 60 * (1 - Math.abs(a - .5) * 1.6), 1.4, R1() * 360); });
    txt(panL, 'ANTS', { x: 0, y: 70, 'font-size': 40, 'font-family': F.sans, fill: C.ink, 'text-anchor': 'middle' }); txt(panR, 'WILD BIRDS + WILD MAMMALS', { x: 0, y: 70, 'font-size': 26, 'font-family': F.sans, fill: C.ink, 'text-anchor': 'middle' });
    el('path', { d: 'M -60 -30 q 30 -40 60 -10 q 30 -30 50 0 q -40 10 -55 40 Z', fill: C.teal, stroke: C.ink, 'stroke-width': 6 }, panR); el('ellipse', { cx: 70, cy: -40, rx: 46, ry: 30, fill: C.orange, stroke: C.ink, 'stroke-width': 6 }, panR);
    const n12 = big(g, '12,000+', 140, 600, 200, C.rust), l12 = line(g, 'NAMED SPECIES', 150, 690, 56);
    const ant = stampEl(g, 'EVERY CONTINENT BUT ANTARCTICA', { size: 44, color: C.red, family: F.sans }); cue(T.antarctica + .3, 'stamp');
    const lng = line(g, 'HERE LONG BEFORE US.', 150, 880, 56, C.teal);
    const DIG = '20,000,000,000,000,000';
    return t => { head(t);
      const A = within(t, T.y2022, T.est), B = within(t, T.est, T.two5), Cc = within(t, T.two5, T.scale), D = within(t, T.scale, T.species), Ee = t >= T.species;
      show(study, A); tf(study, 240, 520, pop(t, T.y2022, .4), -4); show(s1.g, A); show(s2.g, A); charsPop(s1, t, T.y2022 + .5, .05); charsPop(s2, t, T.y2022 + 1, .02);
      show(q1.g, B); show(zeros, B); show(qa, B); charsPop(q1, t, T.est + .4, .04); const nz = Math.floor(clamp((t - T.twenty) / 2.4) * DIG.length); zeros.textContent = t >= T.twenty ? DIG.slice(0, Math.max(2, nz)) : ''; op(qa, seg(t, T.est + 1.4, T.est + 1.7)); stampAnim(cons, t, T.cons + .9, 1450, 780, -6); show(cons.g, B);
      show(p1.g, Cc); show(p2.g, Cc); charsPop(p1, t, T.two5 + .5, .05); charsPop(p2, t, T.two5 + 1.1, .02);
      show(sc, D); tf(sc, 960, 470, pop(t, T.scale, .4)); beam.setAttribute('transform', `rotate(${(-14 * E.back(seg(t, T.combined - 1.2, T.combined - .2))).toFixed(2)})`); tf(panL, -300, 0); tf(panR, 300, 0);
      show(n12.g, Ee); show(l12.g, Ee); charsPop(n12, t, T.species + .4, .05); charsPop(l12, t, T.species + 1, .03); stampAnim(ant, t, T.antarctica + .3, 1250, 790, -4); show(ant.g, Ee); charsPop(lng, t, T.long, .03); show(lng.g, Ee); };
  });
  // ---------- S3 · Exhibit 02: who is in charge? ----------
  scene(S[3], S[4], g => {
    bg(g, C.paper); const head = exhibitHead(g, '02', 'WHO IS IN CHARGE?', T.who);
    const nob = stampEl(g, 'NOBODY.', { size: 150, color: C.red, family: F.sans }); cue(T.nobody + .2, 'stamp'); SHAKES.push([T.nobody + .2, 22, .4]);
    const q = antEl(g, 1.9, C.rust); const crown = el('g', {}, g); el('path', { d: 'M -60 30 L -70 -40 L -30 0 L 0 -55 L 30 0 L 70 -40 L 60 30 Z', fill: C.honey, stroke: C.ink, 'stroke-width': 7, 'stroke-linejoin': 'round' }, crown);
    const card = el('g', {}, g); el('rect', { x: 0, y: 0, width: 640, height: 260, rx: 12, fill: C.cream, stroke: C.ink, 'stroke-width': 7 }, card); txt(card, 'THE QUEEN', { x: 36, y: 80, 'font-size': 60, 'font-family': F.serif, fill: C.ink });
    const j1 = mono(card, 'JOB: LAY EGGS', 38, 150, 34, C.teal), j2 = mono(card, 'ORDERS GIVEN: 0', 38, 210, 34, C.red);
    const sig = headline(g, 'THE SIGNALS', 140, 340, 130);
    const nest = el('g', {}, g); el('ellipse', { cx: 0, cy: 0, rx: 120, ry: 60, fill: C.ink }, nest); mono(nest, 'NEST', 0, 110, 30, C.ink, 'middle');
    const food = el('g', {}, g); el('circle', { cx: 0, cy: 0, r: 60, fill: C.honey, stroke: C.ink, 'stroke-width': 7 }, food); el('circle', { cx: -18, cy: -14, r: 12, fill: C.cream }, food); mono(food, 'FOOD', 0, 110, 30, C.ink, 'middle');
    const PX = u => { const x = lerp(380, 1560, u); return [x, 720 - Math.sin(u * Math.PI) * 170 + Math.sin(u * 9) * 18]; };
    let d = ''; for (let i = 0; i <= 80; i++) { const [x, y] = PX(i / 80); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
    const trail = el('path', { d, fill: 'none', stroke: C.teal, 'stroke-linecap': 'round', opacity: .85 }, g); const trailLbl = mono(g, 'PHEROMONE TRAIL', 960, 470, 30, C.teal, 'middle');
    const walkers = crowd(g, 40, C.rust);
    const memo = line(g, 'NO MEETING. NO MEMO.', 140, 900, 56), loud = line(g, 'THE BEST ROUTE GETS LOUDER.', 140, 900, 56, C.teal);
    const rings = el('g', {}, g); const RG = [0, 1, 2].map(() => el('circle', { cx: 0, cy: 0, r: 10, fill: 'none', stroke: C.red, 'stroke-width': 10 }, rings));
    const alarm = stampEl(g, 'ALARM', { size: 120, color: C.red, family: F.sans }); cue(T.danger + 1.4, 'stamp'); SHAKES.push([T.danger + 1.4, 18, .35]);
    const swarmA = crowd(g, 80, C.rust), SP = swarmA.map(() => [R1() * 6.283, R1()]);
    const cnt = txt(g, '3', { x: 1500, y: 640, 'font-size': 170, 'font-family': F.bagel, fill: C.red, 'text-anchor': 'middle' }); const cl = mono(g, 'DEFENDERS', 1500, 700, 30, C.ink, 'middle');
    for (let i = 0; i < 12; i++) cue(T.dozens + .4 + i * .14, 'tick');
    return t => { const pre = t < T.signals; head.vis(pre); if (pre) head(t);
      stampAnim(nob, t, T.nobody + .2, 1200, 560, -8); show(nob.g, t < T.queen);
      const Q = within(t, T.queen, T.signals); show(q.root, Q); show(crown, Q); show(card, Q); antAnim(q, t, 520, 620, 1.9, 0, 1, 0); tf(crown, 620, lerp(300, 470, E.out(seg(t, T.queen, T.queen + .4)))); op(crown, t < T.notCommand ? 1 : .25);
      tf(card, lerp(2000, 1100, E.back(seg(t, T.queen + .2, T.queen + .6))), 460); op(j1, t >= T.eggs ? 1 : 0); op(j2, t >= T.notCommand + .8 ? 1 : 0);
      const SG = t >= T.signals; show(sig.g, SG); charsPop(sig, t, T.signals, .04);
      const TR = within(t, T.pher, T.danger); show(nest, TR); show(food, TR); tf(nest, 380, 760, pop(t, T.pher, .35)); tf(food, 1560, 760, pop(t, T.finds, .35));
      const w = 4 + 30 * E.out(seg(t, T.follow, T.runs)) * (1 - seg(t, T.runs + .6, T.runs + 3)); trail.setAttribute('stroke-width', w.toFixed(1)); trail.setAttribute('stroke-dasharray', `${(1400 * seg(t, T.finds, T.finds + 1.8)).toFixed(0)} 4000`); show(trail, TR); op(trailLbl, TR && t > T.finds + 1 ? 1 : 0);
      const nOn = Math.round(2 + 38 * seg(t, T.follow, T.runs - .5) * (1 - seg(t, T.runs + .4, T.runs + 2.5)));
      walkers.forEach((u, i) => { const ph = ((t * .09 + i / 40) % 1), back = i % 2, uu = back ? 1 - ph : ph, [x, y] = PX(uu), [x2, y2] = PX(Math.min(1, uu + .01)); u.setAttribute('transform', `translate(${x.toFixed(1)} ${(y + (back ? 14 : -14)).toFixed(1)}) rotate(${((Math.atan2(y2 - y, x2 - x) * 57.3) + (back ? 180 : 0)).toFixed(0)}) scale(1.5)`); show(u, TR && i < nOn); });
      show(memo.g, within(t, T.memo, T.louder)); charsPop(memo, t, T.memo, .03); show(loud.g, within(t, T.louder, T.danger)); charsPop(loud, t, T.louder, .025);
      const AL = t >= T.danger; show(rings, AL); RG.forEach((r, i) => { const k = (Math.max(0, t - T.danger) * .8 + i / 3) % 1; r.setAttribute('r', (20 + k * 300).toFixed(1)); op(r, 1 - k); }); tf(rings, 700, 660);
      stampAnim(alarm, t, T.danger + 1.4, 700, 660, -6); show(alarm.g, within(t, T.danger + 1.3, T.dozens));
      const n = Math.round(lerp(3, 60, E.in(seg(t, T.dozens + .3, T.dozens + 2.2)))); cnt.textContent = String(n); show(cnt, t >= T.dozens); show(cl, t >= T.dozens);
      swarmA.forEach((u, i) => { const [a, r] = SP[i]; show(u, t >= T.dozens && i < n * 1.3); const R = 60 + r * 200 + Math.sin(t * 3 + i) * 6; u.setAttribute('transform', `translate(${(700 + Math.cos(a + t * .4) * R).toFixed(1)} ${(660 + Math.sin(a + t * .4) * R * .7).toFixed(1)}) rotate(${((a + t * .4) * 57.3 + 90).toFixed(0)}) scale(1.5)`); }); };
  });
  // ---------- S4 · Exhibit 03: the jaws ----------
  scene(S[4], S[5], g => {
    bg(g, C.paper); const head = exhibitHead(g, '03', 'THE JAWS', T.e3);
    const hd = el('g', {}, g); const mL = el('path', { d: 'M 0 0 Q 140 -20 200 60 Q 150 30 110 50 Q 80 20 0 30 Z', fill: C.rust, stroke: C.ink, 'stroke-width': 8, 'stroke-linejoin': 'round' }, hd), mR = el('path', { d: 'M 0 0 Q 140 20 200 -60 Q 150 -30 110 -50 Q 80 -20 0 -30 Z', fill: C.rust, stroke: C.ink, 'stroke-width': 8, 'stroke-linejoin': 'round' }, hd);
    const hc = el('g', {}, hd); el('circle', { cx: -120, cy: 0, r: 170, fill: C.rust, stroke: C.ink, 'stroke-width': 9 }, hc); halftone(hc, { x0: -290, y0: -170, w: 340, h: 340, color: C.ink, step: 18, angle: 30, f: (x, y) => Math.hypot(x + 120, y) < 160 ? .2 + .5 * clamp((y + 60) / 220) : 0, maxK: .6 }).setAttribute('class', 'mul');
    const he = eyes(hc, 60, -40, 26); he.forEach(e => e.setAttribute('transform', 'translate(-150 0)'));
    const verbs = ['GRIP', 'BITE', 'CUT', 'CARRY'].map((v, i) => { const s = stampEl(g, v, { size: 60, color: [C.teal, C.red, C.rust, C.ink][i], family: F.sans }); return s; });
    const x1 = big(g, '×1', 140, 640, 180, C.ink), x1k = big(g, '×1,000', 140, 640, 180, C.red);
    const crowdJ = crowd(g, 120, C.rust), CJ = crowdJ.map(() => [R1() * 6.283, .4 + R1() * .6]);
    const weak = mono(g, 'NOTE: OFTEN ALREADY WEAKENED OR INJURED', 150, 760, 30, C.teal);
    const more = stampEl(g, 'MORE, NOT BIGGER', { size: 84, color: C.red, family: F.sans }); cue(T.more + .9, 'stamp'); SHAKES.push([T.more + .9, 16, .3]);
    const col = stampEl(g, 'COLLECTIVE BEHAVIOR', { size: 92, color: C.teal, family: F.sans }); cue(T.collective + .5, 'stamp'); SHAKES.push([T.collective + .5, 18, .35]);
    const rule = line(g, 'SIMPLE LOCAL RULES', 140, 560, 64), arrow = line(g, '→ ANSWERS NO ANT UNDERSTANDS', 140, 660, 50, C.teal);
    const files = ['ARMY', 'FARMERS', 'RAFT', 'EMPIRE'].map((n, i) => { const f = el('g', {}, g); el('rect', { x: -170, y: -130, width: 340, height: 260, rx: 12, fill: [C.honey, '#D9E7C4', '#BFE0DA', '#F3C3B5'][i], stroke: C.ink, 'stroke-width': 7 }, f); el('rect', { x: -170, y: -164, width: 130, height: 44, rx: 8, fill: [C.honey, '#D9E7C4', '#BFE0DA', '#F3C3B5'][i], stroke: C.ink, 'stroke-width': 7 }, f); mono(f, 'CASE 0' + (i + 1), 0, -40, 30, C.ink, 'middle'); txt(f, n, { x: 0, y: 40, 'font-size': 52, 'font-family': F.sans, fill: C.ink, 'text-anchor': 'middle' }); return f; });
    files.forEach((_, i) => cue(T.four + 1.4 + i * .35, 'tick')); verbs.forEach((_, i) => cue(T.jaws + i * .45, 'stamp'));
    return t => { head(t); const H = within(t, T.mand, T.name); show(hd, H); const open = .5 + .5 * Math.sin(t * 5); mL.setAttribute('transform', `rotate(${(open * 18).toFixed(1)})`); mR.setAttribute('transform', `rotate(${(-open * 18).toFixed(1)})`); tf(hd, 1260, 640, pop(t, T.mand, .4));
      verbs.forEach((v, i) => { stampAnim(v, t, T.jaws + i * .45, 300 + (i % 2) * 330, 560 + Math.floor(i / 2) * 150, [-6, 5, -4, 7][i]); show(v.g, within(t, T.jaws, T.oneSet)); });
      show(x1.g, within(t, T.oneSet, T.thousand)); charsPop(x1, t, T.oneSet + .3, .05); show(x1k.g, within(t, T.thousand, T.video)); charsPop(x1k, t, T.thousand + .3, .05);
      crowdJ.forEach((u, i) => { const [a, r] = CJ[i]; show(u, within(t, T.thousand, T.name) && i < 120 * seg(t, T.thousand, T.thousand + 1.5)); const R = 220 + r * 160; u.setAttribute('transform', `translate(${(1180 + Math.cos(a) * R).toFixed(1)} ${(640 + Math.sin(a) * R * .75).toFixed(1)}) rotate(${(a * 57.3 + 180).toFixed(0)}) scale(1.4)`); });
      show(weak, within(t, T.video, T.name)); op(weak, seg(t, T.video + .4, T.video + .7)); stampAnim(more, t, T.more + .9, 560, 620, -6); show(more.g, within(t, T.more, T.name));
      stampAnim(col, t, T.collective + .5, 960, 600, -5); show(col.g, within(t, T.collective, T.simple));
      show(rule.g, within(t, T.simple, T.four)); show(arrow.g, within(t, T.together, T.four)); charsPop(rule, t, T.simple + .3, .03); charsPop(arrow, t, T.together + .2, .02);
      files.forEach((f, i) => { const k = E.back(seg(t, T.four + 1.4 + i * .35, T.four + 1.85 + i * .35)); tf(f, 330 + i * 420, lerp(1300, 660, k), 1, [-4, 3, -2, 5][i]); show(f, t >= T.four); }); };
  });
  // ---------- S5 · Case 01: the army (night) ----------
  scene(S[5], S[6], g => {
    bg(g, C.night); halftone(g, { color: C.night2, step: 24, angle: 20, f: edge(820, 1.3), maxK: .7 });
    const glow = halftone(g, { color: C.rust, step: 22, angle: 45, f: radial(760, 640, 420, 1.1), maxK: .66 });
    const head = exhibitHead(g, '01', 'THE ARMY', T.c1, true, 'CASE');
    const rain = mono(g, 'CENTRAL & SOUTH AMERICA · HUNDREDS OF THOUSANDS OF WORKERS', 140, 430, 28, C.honey);
    const nh = stampEl(g, 'NO FIXED ADDRESS', { size: 70, color: C.red, family: F.sans }); cue(T.noHome + .5, 'stamp');
    const q = glyph(g, C.honey); const dome = crowd(g, 260, C.rust), DP = dome.map(() => { const a = Math.PI + R1() * Math.PI, r = Math.sqrt(R1()); return [760 + Math.cos(a) * 280 * r, 760 + Math.sin(a) * 230 * r, R1() * 6.283, R1()]; });
    const biv = line(g, 'BIVOUAC: A NEST MADE OF ANTS', 140, 900, 50, C.cream);
    const front = crowd(g, 220, C.rust), FP = front.map(() => [R1(), R1(), R1()]);
    const br = el('g', {}, g); el('path', { d: 'M 0 -230 L 30 -230 M 15 -230 L 15 230 M 0 230 L 30 230', stroke: C.honey, 'stroke-width': 7 }, br); txt(br, 'UP TO 10 M', { x: 50, y: 14, 'font-size': 54, 'font-family': F.bagel, fill: C.honey });
    const raid = stampEl(g, 'RAID', { size: 140, color: C.red, family: F.sans }); cue(T.raid + .4, 'stamp'); SHAKES.push([T.raid + .4, 22, .4]); cue(T.raid + .2, 'buzz');
    return t => { head(t); op(rain, seg(t, T.rain + .6, T.rain + 1)); show(rain, t < T.raid); stampAnim(nh, t, T.noHome + .5, 1460, 500, -6); show(nh.g, within(t, T.noHome, T.raid));
      const B = within(t, T.build, T.raid); show(q, B); q.setAttribute('transform', 'translate(760 700) scale(4)'); op(glow, B ? .8 : .3);
      dome.forEach((u, i) => { const [x, y, a, d] = DP[i], k = E.out(seg(t, T.build + d * 2, T.build + d * 2 + .8)); show(u, B && k > 0); u.setAttribute('transform', `translate(${lerp(x + Math.cos(a) * 900, x, k).toFixed(1)} ${lerp(y + Math.sin(a) * 600, y, k).toFixed(1)}) rotate(${(a * 57.3).toFixed(0)}) scale(1.7)`); });
      show(biv.g, within(t, T.biv, T.raid)); charsPop(biv, t, T.biv, .025);
      const RD = t >= T.raid, adv = (t - T.raid) * 130; front.forEach((u, i) => { const [a, b, c] = FP[i]; const x = -300 + adv + a * 520 * (1 - b * .5), y = 400 + b * 470; show(u, RD); u.setAttribute('transform', `translate(${x.toFixed(1)} ${(y + Math.sin(t * 8 + i) * 4).toFixed(1)}) rotate(${(Math.sin(t * 6 + c * 9) * 20).toFixed(0)}) scale(1.6)`); });
      show(br, t >= T.swarm); tf(br, Math.min(1700, 260 + adv + 20), 635, 1); op(br, seg(t, T.swarm, T.swarm + .3)); stampAnim(raid, t, T.raid + .4, 1400, 470, -7); show(raid.g, RD && t < T.swarm + 1.5); };
  });
  // ---------- S6 · Case 02: the farmers ----------
  scene(S[6], S[7], g => {
    bg(g, C.paper); const head = exhibitHead(g, '02', 'THE FARMERS', T.c2, false, 'CASE');
    const n50 = big(g, '50,000,000', 140, 590, 170, C.leaf), y50 = line(g, 'YEARS OF FARMING (ABOUT)', 150, 680, 50); const us = mono(g, 'HUMAN FARMING: ~12,000 YEARS', 150, 750, 30, C.teal);
    const ground = el('g', {}, g); el('rect', { x: 0, y: 560, width: 1920, height: 520, fill: '#7A5A3C' }, ground); halftone(ground, { y0: 560, h: 520, color: C.ink, step: 20, angle: 20, f: () => .3, maxK: .6 }).setAttribute('class', 'mul');
    el('rect', { x: 0, y: 548, width: 1920, height: 16, fill: C.leaf }, ground); const ch = el('ellipse', { cx: 1180, cy: 800, rx: 360, ry: 150, fill: C.night, stroke: C.ink, 'stroke-width': 8 }, ground);
    el('path', { d: 'M 420 556 Q 520 640 820 760', stroke: C.night, 'stroke-width': 60, fill: 'none', 'stroke-linecap': 'round' }, ground);
    const fung = el('g', {}, g); halftone(fung, { x0: 840, y0: 680, w: 680, h: 240, color: C.cream, step: 16, angle: 0, f: (x, y) => clamp(1 - Math.hypot((x - 1180) / 320, (y - 810) / 110)), maxK: .7 });
    const carriers = Array.from({ length: 5 }, () => { const a = antEl(g, .55); const lf = el('path', { d: 'M -40 -10 Q 0 -110 70 -90 Q 50 -20 -40 -10 Z', fill: C.leaf, stroke: C.ink, 'stroke-width': 6 }, a.root); return { a, lf }; });
    const cyc = el('g', {}, g); [['FUNGUS FEEDS THE COLONY', -50, C.cream], ['COLONY TENDS THE FUNGUS', 50, C.honey]].forEach(([s, y, c]) => txt(cyc, s, { x: 0, y, 'font-size': 40, 'font-family': F.sans, fill: c, 'text-anchor': 'middle' }));
    const st = stampEl(g, 'OLDER THAN US', { size: 110, color: C.red, family: F.sans }); cue(T.partner + 1.4, 'stamp'); SHAKES.push([T.partner + 1.4, 18, .35]);
    return t => { head(t); const A = t < T.leaf; show(n50.g, A); show(y50.g, A); show(us, A); charsPop(n50, t, T.fifty + .6, .04); charsPop(y50, t, T.fifty + 1.3, .02); op(us, seg(t, T.fifty + 2.6, T.fifty + 2.9));
      show(ground, !A); show(fung, !A); tf(fung, 1180 * (1 - seg(t, T.leaf + 1, T.feeds)), 810 * (1 - seg(t, T.leaf + 1, T.feeds)), seg(t, T.leaf + 1, T.feeds)); op(fung, seg(t, T.leaf + 1, T.leaf + 1.6));
      carriers.forEach((c, i) => { const ph = ((t - T.leaf) * .12 + i / 5) % 1; antAnim(c.a, t + i, lerp(-80, 470, ph), 510, .55); show(c.a.root, !A && t >= T.leaf); });
      show(cyc, t >= T.feeds); tf(cyc, 1180, 810, pop(t, T.feeds, .4)); stampAnim(st, t, T.partner + 1.4, 560, 440, -6); };
  });
  // ---------- S7 · Case 03: the raft ----------
  scene(S[7], S[8], g => {
    bg(g, C.paper); const head = exhibitHead(g, '03', 'THE RAFT', T.c3, false, 'CASE');
    const water = el('g', {}, g); const waves = [0, 1, 2, 3].map(i => el('path', { fill: i % 2 ? '#3FA39C' : C.teal, opacity: .9 }, water));
    const lone = antEl(g, .8);
    const raft = el('g', {}, g); const RA = crowd(raft, 230, C.rust), RP = RA.map(() => { const a = R1() * 6.283, r = Math.sqrt(R1()); return [Math.cos(a) * 300 * r, Math.sin(a) * 60 * r, R1() * 360, R1() * 6.283]; });
    const brood = el('g', {}, raft); for (let i = 0; i < 9; i++) el('ellipse', { cx: -60 + i * 15, cy: -40 - (i % 3) * 8, rx: 9, ry: 13, fill: C.cream, stroke: C.ink, 'stroke-width': 3 }, brood); const qg = glyph(brood, C.honey); qg.setAttribute('transform', 'translate(60 -46) scale(3)');
    const thL = mono(g, 'QUEEN + YOUNG: ON BOARD', 960, 470, 30, C.ink, 'middle');
    const cal = el('g', {}, g); const boxes = []; for (let i = 0; i < 21; i++) boxes.push(el('rect', { x: (i % 7) * 66, y: Math.floor(i / 7) * 66, width: 54, height: 54, rx: 6, fill: C.cream, stroke: C.ink, 'stroke-width': 4 }, cal)); mono(cal, 'AFLOAT: DAYS. EVEN WEEKS.', 0, -24, 30, C.red);
    const na = line(g, 'NO ANT BUILT THAT RAFT.', 140, 470, 60);
    const ev = stampEl(g, 'EVERY ANT IS THE RAFT', { size: 84, color: C.red, family: F.sans }); cue(T.every + .9, 'stamp'); SHAKES.push([T.every + .9, 18, .35]);
    for (let i = 0; i < 21; i++) cue(T.days + .5 + i * .1, 'tick');
    return t => { head(t); const lvl = 760;
      waves.forEach((w, i) => { let d = `M 0 1080 L 0 ${lvl + i * 40}`; for (let x = 0; x <= 1920; x += 40) d += ` L ${x} ${(lvl + i * 40 + Math.sin(x / 120 + t * (1.4 + i * .3) + i) * 16).toFixed(1)}`; w.setAttribute('d', d + ' L 1920 1080 Z'); }); show(water, t >= T.floods);
      const L = within(t, T.floods, T.colony3 + .5); show(lone.root, L); antAnim(lone, t, 960, lvl - 10 + Math.sin(t * 5) * 14, .8, Math.sin(t * 4) * 25, 1, 1);
      const form = E.io(seg(t, T.grip - .5, T.grip + 2.5)); show(raft, t >= T.colony3); const bob = Math.sin(t * 1.6) * 8; tf(raft, 960, lvl - 20 + bob, 1, Math.sin(t * 1.2) * 2);
      RA.forEach((u, i) => { const [x, y, r, a] = RP[i]; u.setAttribute('transform', `translate(${lerp(Math.cos(a) * 1100, x, form).toFixed(1)} ${lerp(Math.sin(a) * 300 + 80, y, form).toFixed(1)}) rotate(${(r + (1 - form) * t * 90).toFixed(0)}) scale(1.6)`); show(u, t >= T.colony3 + (i / 230) * 1.2); });
      show(brood, t >= T.thousands + 1); op(thL, within(t, T.thousands + 1.5, T.days) ? 1 : 0);
      show(cal, within(t, T.days, T.noAnt)); tf(cal, 1340, 260); boxes.forEach((b, i) => b.setAttribute('fill', t > T.days + .5 + i * .1 ? C.red : C.cream));
      show(na.g, within(t, T.noAnt, T.every + .8)); charsPop(na, t, T.noAnt, .03); stampAnim(ev, t, T.every + .9, 960, 480, -5); };
  });
  // ---------- S8 · Case 04: the empire ----------
  scene(S[8], S[9], g => {
    bg(g, C.paper); const head = exhibitHead(g, '04', 'THE EMPIRE', T.c4, false, 'CASE');
    const sea = el('g', {}, g); halftone(sea, { y0: 380, h: 700, color: C.teal, step: 20, angle: 15, f: (x, y) => y > 620 + Math.sin(x / 140) * 40 - (x > 1300 ? (x - 1300) * .25 : 0) ? .45 : 0, maxK: .6 }).setAttribute('class', 'mul');
    const coast = 'M 1700 520 Q 1560 600 1420 620 Q 1240 640 1100 600 Q 960 580 840 640 Q 700 700 560 690 Q 420 680 320 740 Q 250 790 200 860';
    el('path', { d: coast, stroke: C.ink, 'stroke-width': 7, fill: 'none', 'stroke-dasharray': '2 0' }, sea);
    const route = el('path', { d: coast, stroke: C.red, 'stroke-width': 16, fill: 'none', 'stroke-linecap': 'round' }, g); const RL = 1700;
    const it = mono(g, 'ITALY', 1640, 480, 34, C.ink, 'middle'), sp = mono(g, 'ATLANTIC SPAIN', 250, 930, 34, C.ink, 'middle');
    const km = txt(g, '0 KM', { x: 960, y: 520, 'font-size': 120, 'font-family': F.bagel, fill: C.red, 'text-anchor': 'middle' }); const kml = mono(g, 'ONE SUPERCOLONY · ABOUT', 960, 420, 30, C.ink, 'middle');
    const ship = el('g', {}, g); el('path', { d: 'M -120 0 L 120 0 L 90 50 L -90 50 Z', fill: C.ink }, ship); el('rect', { x: -50, y: -60, width: 100, height: 60, fill: C.cream, stroke: C.ink, 'stroke-width': 6 }, ship); el('rect', { x: -10, y: -110, width: 20, height: 50, fill: C.red }, ship);
    const from = mono(g, 'FROM SOUTH AMERICA · ABOUT A CENTURY AGO · PROBABLY BY SHIP', 140, 470, 28, C.teal);
    const fa = antEl(g, .9, C.rust), fb = antEl(g, .9, C.rust), fam = stampEl(g, 'FAMILY', { size: 90, color: C.teal, family: F.sans }); cue(T.family + 2.4, 'stamp');
    const rv = antEl(g, .9, '#4F6F8F'), death = stampEl(g, 'TO THE DEATH', { size: 110, color: C.red, family: F.sans }); cue(T.rival + 1.6, 'stamp'); SHAKES.push([T.rival + 1.6, 22, .4]);
    const lg = line(g, 'MADE ENTIRELY OF LITTLE ONES.', 140, 470, 60, C.ink);
    return t => { head(t);
      const SH = within(t, T.argentine, T.today); show(ship, SH); tf(ship, lerp(-200, 1100, seg(t, T.argentine, T.today)), 640 + Math.sin(t * 2) * 8); op(from, SH ? seg(t, T.argentine + .6, T.argentine + 1) : 0);
      const M = t >= T.today; show(sea, true); route.setAttribute('stroke-dasharray', `${(RL * E.io(seg(t, T.today + .3, T.today + 3))).toFixed(0)} 4000`); show(route, M); show(it, M || SH); show(sp, M);
      const K = within(t, T.today, T.family); show(km, K); show(kml, K); km.textContent = (Math.round(6000 * E.io(seg(t, T.today + .3, T.today + 3)) / 100) * 100).toLocaleString('en-US') + ' KM';
      const FM = within(t, T.family, T.largest); show(fa.root, FM); show(fb.root, FM); const meet = E.out(seg(t, T.family + .5, T.family + 2.2)); antAnim(fa, t, lerp(1640, 1060, meet), 560, .9, 0, -1, meet < 1); antAnim(fb, t, lerp(260, 860, meet), 760 - 200 * meet, .9, 0, 1, meet < 1);
      stampAnim(fam, t, T.family + 2.4, 960, 760, -5); show(fam.g, within(t, T.family, T.rival));
      show(rv.root, within(t, T.rival, T.largest)); const cl = E.out(seg(t, T.rival + .3, T.rival + 1.4)); antAnim(rv, t, lerp(1900, 1200, cl) + (t > T.rival + 1.5 ? Math.sin(t * 40) * 6 : 0), 560, .9, 0, -1, cl < 1); stampAnim(death, t, T.rival + 1.6, 1140, 380, -6); show(death.g, within(t, T.rival, T.largest));
      show(lg.g, t >= T.largest); charsPop(lg, t, T.largest + 1.2, .03); };
  });
  // ---------- S9 · the verdict (silence before UNITY), then the many become one giant ----------
  scene(S[9], S[10], g => {
    bg(g, C.paper); halftone(g, { color: C.red, step: 22, angle: 70, f: radial(960, 560, 900, 1.2), maxK: .62 }).setAttribute('class', 'mul');
    const v = headline(g, 'THE VERDICT', 140, 260, 160);
    const l1 = line(g, 'THE BIGGEST DOES NOT ALWAYS WIN.', 140, 420, 56), l2 = line(g, 'THE STRONGEST DOES NOT ALWAYS SURVIVE.', 140, 510, 56, C.red), l3 = line(g, 'EVERY ADVANTAGE MEANS LITTLE', 140, 640, 56), l4 = line(g, 'AGAINST A UNITED FORCE.', 140, 720, 56, C.teal);
    const chipsV = ['COMMUNITY', 'FAMILY', 'BUSINESS', 'MOVEMENT'].map((s, i) => { const c = el('g', {}, g); const w = measure(s, 56, F.sans, 400) + 70; el('rect', { x: -w / 2, y: -50, width: w, height: 100, rx: 14, fill: [C.honey, C.teal, C.rust, C.ink][i] }, c); txt(c, s, { x: 0, y: 20, 'font-size': 56, 'font-family': F.sans, fill: i === 0 ? C.ink : C.cream, 'text-anchor': 'middle' }); return c; });
    const rules = ['DO YOUR PART.', 'FOLLOW THE SIGNAL.', 'HOLD ON TO THE ONES BESIDE YOU.'].map((s, i) => line(g, s, 140, 470 + i * 110, 64, [C.ink, C.teal, C.red][i]));
    const e1 = big(g, '1 ANT = SMALL', 140, 560, 130, C.ink), e2 = big(g, '1,000 = A FORCE', 140, 760, 130, C.red);
    const st = stampEl(g, 'UNITY', { size: 260, color: C.red, family: F.sans }); cue(ess, 'bigstamp'); SHAKES.push([ess, 28, .45]); FLASHES.push(ess);
    // the giant made of little ones
    const pts = []; const R = rng(5); while (pts.length < 420) { const x = R() * 1100 - 550, y = R() * 500 - 250; const inB = ((x + 280) / 230) ** 2 + (y / 170) ** 2 < 1 || ((x - 20) / 110) ** 2 + (y / 80) ** 2 < 1 || ((x - 250) / 130) ** 2 + ((y + 10) / 120) ** 2 < 1; if (inB) pts.push([x, y]); }
    const legsP = []; for (const [x0, sd] of [[-40, -1], [20, -1], [80, -1], [-40, 1], [20, 1], [80, 1]]) for (let k = 0; k < 14; k++) legsP.push([x0 + (x0 - 20) * k * .1 - k * 6, sd * (60 + k * 13)]);
    for (const sd of [-1, 1]) for (let k = 0; k < 14; k++) legsP.push([330 + k * 14, sd * (-60 - k * 10) * -1 - 10 * sd]);
    const all = pts.concat(legsP); const GA = crowd(g, all.length, C.rust), GP = all.map(() => [R() * 6.283, R()]);
    chipsV.forEach((_, i) => cue(T.community + .6 + i * .55, 'tick'));
    const bg2 = line(g, 'SOMETHING MUCH BIGGER THAN THEMSELVES.', 960, 960, 50, C.ink, 'middle');
    return t => { charsPop(v, t, T.verdict, .05);
      const A = within(t, T.verdict, T.community); [l1, l2, l3, l4].forEach(l => show(l.g, A)); charsPop(l1, t, T.biggest, .02); charsPop(l2, t, T.strongest, .02); charsPop(l3, t, T.advantage, .02); charsPop(l4, t, T.advantage + 1.4, .02);
      chipsV.forEach((c, i) => { show(c, within(t, T.community, T.nobody2)); tf(c, [520, 1400, 520, 1400][i], [500, 500, 700, 700][i], pop(t, T.community + .6 + i * .55, .4), [-3, 2, 3, -2][i]); });
      rules.forEach((r, i) => { show(r.g, within(t, T.nobody2, T.oneAnt)); charsPop(r, t, T.nobody2 + 1.5 + i * 1.3, .025); });
      show(e1.g, within(t, T.oneAnt, T.nature)); show(e2.g, within(t, T.force, T.nature)); charsPop(e1, t, T.oneAnt, .04); charsPop(e2, t, T.force, .04);
      stampAnim(st, t, ess, 960, 600, -6); show(st.g, within(t, ess - .1, T.magic + .4)); show(v.g, t < T.magic);
      const form = E.io(seg(t, T.magic + .4, T.bigger + .5));
      GA.forEach((u, i) => { const [x, y] = all[i], [a, r] = GP[i]; const sx = 960 + Math.cos(a) * (900 + r * 300), sy = 560 + Math.sin(a) * (600 + r * 200), d = r * .5, k = E.out(clamp((form - d * .5) / (1 - d * .5)));
        show(u, t >= T.magic + .4); u.setAttribute('transform', `translate(${lerp(sx, 980 + x, k).toFixed(1)} ${lerp(sy, 560 + y, k).toFixed(1)}) rotate(${(lerp(a * 57.3, 0, k) + Math.sin(t * 3 + i) * 10).toFixed(0)}) scale(1.5)`); });
      show(bg2.g, t >= T.bigger); charsPop(bg2, t, T.bigger + .2, .02); };
  });
  // ---------- S10 · the drawer: the file joins the colony ----------
  scene(S[10], S[12], g => {
    bg(g, C.ink); halftone(g, { color: C.night2, step: 24, angle: 20, f: edge(860, 1.2), maxK: .7 });
    const drawer = el('g', {}, g); el('rect', { x: 260, y: 520, width: 1400, height: 420, rx: 16, fill: '#6b4f3a', stroke: C.cream, 'stroke-width': 6 }, drawer);
    for (let i = 0; i < 18; i++) { const x = 300 + i * 74; el('rect', { x, y: 440, width: 64, height: 480, rx: 6, fill: '#E9D9B6', stroke: C.ink, 'stroke-width': 4 }, drawer); txt(drawer, 'COLONY', { x: x + 40, y: 470, 'font-size': 22, 'font-family': F.mono, 'font-weight': 800, fill: C.ink, transform: `rotate(90 ${x + 40} 470)` }); }
    const folder = el('g', {}, g); el('rect', { x: -230, y: -160, width: 460, height: 320, rx: 12, fill: '#F3C3B5', stroke: C.ink, 'stroke-width': 7 }, folder); el('rect', { x: -230, y: -196, width: 180, height: 50, rx: 8, fill: '#F3C3B5', stroke: C.ink, 'stroke-width': 7 }, folder);
    txt(folder, 'CASE 006', { x: 0, y: -30, 'font-size': 60, 'font-family': F.sans, fill: C.ink, 'text-anchor': 'middle' }); txt(folder, 'THE ANT', { x: 0, y: 50, 'font-size': 64, 'font-family': F.serif, fill: C.ink, 'text-anchor': 'middle' });
    const closed = stampEl(g, 'CASE CLOSED', { size: 110, color: C.red, family: F.sans }); const tc = S[10] + .6; cue(tc, 'stamp'); cue(tc + 1.3, 'drawer');
    const pr = chars(g, 'PRODUCED BY RELENTLESS AARON', { x: 960, y: 220, size: 64, family: F.sans, weight: 400, fill: C.honey, anchor: 'middle' });
    const title = chars(g, 'THE ANT KINGDOM', { x: 960, y: 420, size: 140, family: F.serif, weight: 400, fill: C.cream, anchor: 'middle', shadow: { fill: C.red, dx: 8, dy: 8 } });
    const end = END + .6;
    return t => { const slide = E.io(seg(t, tc + 1.3, tc + 2.5)); tf(folder, lerp(960, 1700, slide), lerp(560, 640, slide), lerp(1, .3, slide), lerp(-3, 0, slide)); op(folder, 1 - seg(t, tc + 2.3, tc + 2.6));
      stampAnim(closed, t, tc, 960, 600, -8); op(closed.g, t < tc + 1.3 ? .93 : 0); charsPop(pr, t, T.produced, .02);
      tf(drawer, 0, lerp(700, 0, E.back(seg(t, tc + .9, tc + 1.4)))); charsPop(title, t, Math.max(end, tc + 2.6) + .2, .05); };
  });

  // ---------- HUD ----------
  const hudG = el('g', {}, hud); const caseNo = txt(hudG, 'CASE FILE No.006 · FORMICIDAE', { x: 60, y: 62, 'font-size': 22, 'font-family': F.mono, 'font-weight': 800 });
  const chip = el('g', {}, hudG), chipBg = el('rect', { x: 60, y: 76, height: 40, rx: 6 }, chip), chipA = txt(chip, '', { x: 74, y: 105, 'font-size': 24, 'font-family': F.sans }), chipB = txt(chip, '', { y: 105, 'font-size': 24, 'font-family': F.sans });
  const date = el('g', {}, hudG), dateBg = el('rect', { x: 1690, y: 40, width: 170, height: 50, rx: 8, fill: 'none', 'stroke-width': 4 }, date), rec = el('circle', { cx: 1716, cy: 65, r: 9, fill: C.red }, date), dateT = txt(date, '2026.11', { x: 1736, y: 75, 'font-size': 28, 'font-family': F.mono, 'font-weight': 800 });
  const chips = [[S[1], S[2], 'SUBJECT', 'THE ANT'], [S[2], S[3], 'EXHIBIT 01', 'NUMBERS'], [S[3], S[4], 'EXHIBIT 02', 'NO BOSS'], [S[4], S[5], 'EXHIBIT 03', 'JAWS'], [S[5], S[6], 'CASE 01', 'ARMY'], [S[6], S[7], 'CASE 02', 'FARMERS'], [S[7], S[8], 'CASE 03', 'RAFT'], [S[8], S[9], 'CASE 04', 'EMPIRE'], [S[9], S[10], 'RULING', 'VERDICT']];
  hudUpdate = t => { const c = chips.find(c => t >= c[0] && t < c[1]); show(hudG, !!c); if (!c) return; const dark = t >= S[5] && t < S[6], ink = dark ? C.cream : C.ink;
    caseNo.setAttribute('fill', ink); chipBg.setAttribute('fill', dark ? C.cream : C.ink); chipA.textContent = c[2]; chipA.setAttribute('fill', dark ? C.red : C.honey); chipB.textContent = c[3]; chipB.setAttribute('fill', dark ? C.ink : C.cream);
    const wa = measure(c[2], 24, F.sans, 400), wb = measure(c[3], 24, F.sans, 400); chipB.setAttribute('x', 74 + wa + 14); chipBg.setAttribute('width', wa + wb + 42); dateBg.setAttribute('stroke', ink); dateT.setAttribute('fill', ink); op(rec, Math.floor(t * 2) % 2 ? .25 : 1); };

  // ---------- caption bar ----------
  const KEY = /^(\d[\d,]*\+?|2022|twenty|quadrillion|million|thousand|nobody|alone|together|giants|fall|unity|force|raft|army|farming|fungus|mandibles|pheromones|signals|bivouac|family|death|conservative|antarctica|six|fifty|kilometers|powerful|little)$/i;
  const groups = []; let gg = []; for (const w of WD) { if (gg.length && (gg.length >= 8 || /[.,!?:;]$/.test(gg[gg.length - 1].w) || w.s - gg[gg.length - 1].e > .45)) { groups.push(gg); gg = []; } gg.push(w); } if (gg.length) groups.push(gg);
  const CAPS = groups.map(ws => { const parts = []; ws.forEach((w, i) => parts.push([w.w + (i < ws.length - 1 ? ' ' : ''), KEY.test(norm(w.w)) ? C.honey : null])); const c = caption(hud, parts, { x: 960, y: 1010, size: 40 }); show(c.g, false); return { c, t0: ws[0].s - .05, t1: ws[ws.length - 1].e + .35 }; });
  capUpdate = t => CAPS.forEach(k => { const on = t >= k.t0 && t < k.t1 && t < END + .3; show(k.c.g, on); if (on) captionAnim(k.c, t, k.t0); });

  // ---------- dot wipe ----------
  const dotsG = el('g', {}, wipe), wipeDots = []; for (let y = 0; y <= 1160; y += 80) for (let x = 0; x <= 2000; x += 80) wipeDots.push({ e: el('circle', { cx: x, cy: y, r: 0 }, dotsG), x, y });
  wipeUpdate = t => { const w = WIPES.find(([b]) => Math.abs(t - b) < .22); show(dotsG, !!w); if (!w) return; dotsG.setAttribute('fill', w[1]); const u = (t - w[0] + .22) / .44;
    wipeDots.forEach(d => { const delay = (d.x / 1920 * .6 + d.y / 1080 * .4) * .35, p = clamp((u - delay) / .65); d.e.setAttribute('r', (Math.sin(p * Math.PI) * 62).toFixed(1)); }); };
  buildVertical({ title: 'THE ANT KINGDOM', caseNo: 'CASE FILE No.006 · FORMICIDAE', chips, KEY });
  window.EV = EV.sort((a, b) => a.t - b.t);
}
