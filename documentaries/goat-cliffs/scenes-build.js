function buildAll() {
  const T = {
    case: at('Case number zero'), subj: at('The subject lives where'), ledge: at('A ledge as wide'), air: at('Nothing below it but air.'), she: at('And there she is,'), mg: at('The mountain goat.'), fix: at('And before we go further,'), notgoat: at('She is not a goat'), antelope: at('She is a goat-antelope,'), stuck: at('The name stuck.'),
    e1: at('Exhibit one.'), splits: at('Each hoof splits into two'), pad: at('Underneath, a soft, rubbery pad.'), rim: at('Around it, a hard outer rim.'), catches: at('The rim catches the edge.'), nps: at('The Park Service says it'), defense: at('Climbing where nothing else'),
    e2: at('Exhibit two.'), birth: at('When it is time to'), lookCliff: at('She looks for a cliff.'), shelf: at('A steep, hidden shelf,'), weighs: at('The kid weighs about'), minutes: at('Within minutes, it is standing.'), lesson: at('First lesson of life,'),
    e3: at('Exhibit three.'), eagles: at('Golden eagles hunt these cliffs.'), move: at('Their move is simple.'), strike: at('Strike a young goat,'), watched: at('So scientists watched.'), twelve: at('For twelve years.'), went: at('When eagles went after'), notOnce: at('Not once.'), every: at('Because every time, the'), stood: at('She stood over her kid.'), horns: at('She put her horns'),
    e4: at('Exhibit four.'), lion: at('The mountain lion.'), study: at('One study calls it'), patient: at('It is patient.'), why: at('And that is why she'), higher: at('Higher, steeper, narrower.'), meter: at('Every meter up is'),
    e5: at('Exhibit five.'), alps: at('In the Italian Alps,'), fortynine: at('Forty-nine meters of concrete,'), ibex: at('And on it, Alpine ibex.'), mothers: at('Mothers and young ones,'), showing: at('They are not showing off.'), minerals: at('They need the minerals.'),
    e6: at('Now the hardest exhibit'), notEagle: at('The eagle is not what'), winter: at('It is winter.'), bc: at('In British Columbia, biologists'), cold: at('Cold. Hunger.'), protects: at('The cliff protects them'), outlast: at('They just have to outlast'),
    verdict: at('Verdict.'), born: at('She was born on the'), eats: at('She eats on the edge.'), raises: at('She raises her young'), safest: at('And the edge is the'), maybe: at('Maybe that is the part'), scares: at('The place that scares'), notDanger: at('The climb is not the'), isDef: at('The climb is the defense.'), stay: at('Stay up there.'), outlastW: at('Outlast the winter.'),
    end: at('The Cliff File. Produced'), produced: at('Produced by Relentless Aaron.'),
  };
  const S = [0, T.mg - .15, T.e1 - .15, T.e2 - .15, T.e3 - .15, T.e4 - .15, T.e5 - .15, T.e6 - .15, T.verdict - .15, T.end - .15, END + .6, DUR];
  S.forEach((s, i) => cue(s, 'sect' + i));
  S.slice(1, 10).forEach((s, i) => { WIPES.push([s, [C.teal, C.rock, C.honey, C.teal, C.night, C.concrete, C.cream, C.red, C.ink][i]]); cue(s - .2, 'whoosh'); });
  const ess = T.isDef + .45; cue(ess, 'ess');

  // ---------- S0 · the ledge: a goat on a dinner-plate shelf, nothing below ----------
  scene(S[0], S[1], g => {
    bg(g, C.sky); halftone(g, { color: C.teal, step: 22, angle: 15, f: (x, y) => .15 + .5 * clamp(y / 1080), maxK: .6 }).setAttribute('class', 'mul');
    const cl = cliff(g, [[1100, -40], [1960, -40], [1960, 1120], [1260, 1120], [1300, 900], [1220, 760], [1290, 640], [1180, 560], [1240, 470], [1160, 360], [1220, 240], [1140, 120]]);
    const shelf = el('path', { d: 'M 1000 562 L 1200 562 L 1190 590 L 1010 590 Z', fill: C.rock2, stroke: C.ink, 'stroke-width': 7, 'stroke-linejoin': 'round' }, g);
    const goat = goatEl(g, .62);
    const drop = el('g', {}, g); el('path', { d: 'M 1060 620 L 1060 1040', stroke: C.ink, 'stroke-width': 5, 'stroke-dasharray': '14 10' }, drop); el('path', { d: 'M 1040 1010 L 1060 1040 L 1080 1010', stroke: C.ink, 'stroke-width': 5, fill: 'none' }, drop); txt(drop, 'AIR', { x: 1000, y: 860, 'font-size': 70, 'font-family': F.bagel, fill: C.ink, 'text-anchor': 'end' });
    const plate = el('g', {}, g); el('ellipse', { cx: 0, cy: 0, rx: 110, ry: 26, fill: C.cream, stroke: C.ink, 'stroke-width': 6 }, plate); el('ellipse', { cx: 0, cy: -2, rx: 70, ry: 14, fill: 'none', stroke: C.ink, 'stroke-width': 4 }, plate); mono(plate, '= THE LEDGE', 130, 10, 28);
    const no = mono(g, 'CASE NO. 008', 140, 170, 40, C.ink);
    const subj = line(g, 'SUBJECT LIVES WHERE', 140, 300, 64), subj2 = line(g, 'YOU WOULD NOT STAND.', 140, 380, 64, C.red);
    const rent = line(g, 'CALM, LIKE THE MOUNTAIN OWES HER RENT.', 140, 960, 40, C.ink);
    return t => { const z = 1 + .05 * seg(t, 0, S[1]); tf(g, 960 * (1 - z), 540 * (1 - z), z); goatAnim(goat, t, 1100, 562, .62, 0, -1, 0, t > T.she);
      op(no, seg(t, T.case, T.case + .2)); charsPop(subj, t, T.subj, .025); charsPop(subj2, t, T.subj + .8, .025);
      tf(plate, 560, 640, pop(t, T.ledge + .4, .4)); show(plate, t >= T.ledge); op(drop, seg(t, T.air, T.air + .4)); charsPop(rent, t, T.she + 1.2, .015); show(rent.g, t >= T.she); };
  });
  // ---------- S1 · the mugshot + the correction ----------
  scene(S[1], S[2], g => {
    bg(g, C.paper); halftone(g, { color: C.teal, step: 22, angle: 15, f: edge(900, 1.5), maxK: .62 }).setAttribute('class', 'mul');
    const chart = el('g', {}, g); for (let i = 0; i <= 8; i++) { el('line', { x1: 420, x2: 1220, y1: 160 + i * 80, y2: 160 + i * 80, stroke: C.ink, 'stroke-width': i % 2 ? 2 : 5 }, chart); }
    const goat = goatEl(g, 1.7);
    const plate = el('g', {}, g); el('rect', { x: -330, y: -70, width: 660, height: 140, rx: 10, fill: C.ink }, plate); txt(plate, 'MOUNTAIN GOAT', { x: 0, y: 6, 'font-size': 62, 'font-family': F.sans, fill: C.cream, 'text-anchor': 'middle' }); mono(plate, 'OREAMNOS AMERICANUS · CASE 008', 0, 50, 24, C.honey, 'middle');
    const corr = stampEl(g, 'NOT A GOAT', { size: 110, color: C.red, family: F.sans }); cue(T.notgoat + .7, 'stamp'); SHAKES.push([T.notgoat + .7, 20, .35]);
    const ant = el('g', {}, g); el('rect', { x: 0, y: 0, width: 560, height: 200, rx: 12, fill: C.cream, stroke: C.ink, 'stroke-width': 7 }, ant); txt(ant, 'GOAT-ANTELOPE', { x: 30, y: 84, 'font-size': 54, 'font-family': F.serif, fill: C.ink }); mono(ant, 'COUSIN OF THE CHAMOIS', 32, 150, 30, C.teal);
    FLASHES.push(S[1] + .4, S[1] + 1.2); cue(S[1] + .4, 'shutter'); cue(S[1] + 1.2, 'shutter');
    return t => { goatAnim(goat, t, 760, 760, 1.7, 0, 1, 0, 1); tf(plate, 820, lerp(1250, 900, E.back(seg(t, S[1] + .2, S[1] + .6)))); stampAnim(corr, t, T.notgoat + .7, 1480, 330, -8);
      tf(ant, lerp(2000, 1280, E.back(seg(t, T.antelope, T.antelope + .45))), 560); show(ant, t >= T.antelope); };
  });
  // ---------- S2 · Exhibit 01: the feet ----------
  scene(S[2], S[3], g => {
    bg(g, C.paper); const head = exhibitHead(g, '01', 'THE FEET', T.e1);
    const hoof = el('g', {}, g); const toes = [-1, 1].map(sd => { const tg = el('g', {}, hoof); el('path', { d: `M 0 -200 Q ${sd * 150} -200 ${sd * 160} 40 Q ${sd * 150} 120 ${sd * 60} 120 Q ${sd * 10} 110 ${sd * 10} 0 Z`, fill: C.ink, stroke: C.ink, 'stroke-width': 8, 'stroke-linejoin': 'round' }, tg);
      const p = el('path', { d: `M ${sd * 24} -150 Q ${sd * 120} -150 ${sd * 128} 30 Q ${sd * 120} 92 ${sd * 60} 92 Q ${sd * 26} 86 ${sd * 24} 0 Z`, fill: '#E8B9A0', stroke: C.ink, 'stroke-width': 5 }, tg); return { tg, p, sd }; });
    const padH = halftone(hoof, { x0: -140, y0: -160, w: 280, h: 260, color: C.red, step: 14, angle: 20, f: (x, y) => .35, maxK: .5 }); padH.setAttribute('class', 'mul');
    const lPad = el('g', {}, g); el('path', { d: 'M 0 0 L -120 -60', stroke: C.ink, 'stroke-width': 5 }, lPad); txt(lPad, 'SOFT, RUBBERY PAD', { x: -130, y: -70, 'font-size': 40, 'font-family': F.sans, fill: C.red, 'text-anchor': 'end' });
    const lRim = el('g', {}, g); el('path', { d: 'M 0 0 L 120 -60', stroke: C.ink, 'stroke-width': 5 }, lRim); txt(lRim, 'HARD OUTER RIM', { x: 130, y: -70, 'font-size': 40, 'font-family': F.sans, fill: C.ink });
    const spread = mono(g, '← TWO TOES SPREAD →', 1000, 950, 34, C.teal, 'middle');
    const grip = line(g, 'THE RIM CATCHES. THE PAD GRIPS.', 140, 500, 56);
    const q = el('g', {}, g); el('rect', { x: 0, y: 0, width: 860, height: 230, rx: 12, fill: C.cream, stroke: C.ink, 'stroke-width': 7 }, q); txt(q, '“HER MAIN DEFENSE:', { x: 36, y: 86, 'font-size': 50, 'font-family': F.serif, fill: C.ink }); txt(q, 'CLIMBING.”', { x: 36, y: 150, 'font-size': 50, 'font-family': F.serif, fill: C.red }); mono(q, 'NATIONAL PARK SERVICE', 38, 205, 26, C.teal);
    const st = stampEl(g, 'NO GEAR. JUST FEET.', { size: 70, color: C.red, family: F.sans }); cue(T.defense + 2.2, 'stamp');
    return t => { head(t); const H = within(t, T.splits, T.nps); show(hoof, H); show(spread, H); const sp = E.back(seg(t, T.splits + 1.2, T.splits + 1.9)) * 40;
      toes.forEach(o => o.tg.setAttribute('transform', `translate(${o.sd * sp} 0) rotate(${o.sd * sp * .2})`)); tf(hoof, 1000, 690, pop(t, T.splits, .45)); op(spread, seg(t, T.splits + 1.4, T.splits + 1.7));
      show(lPad, within(t, T.pad, T.nps)); tf(lPad, 920, 650, pop(t, T.pad + .3, .3)); show(lRim, within(t, T.rim, T.nps)); tf(lRim, 1130, 560, pop(t, T.rim + .3, .3)); op(padH, t >= T.pad ? 1 : 0);
      show(grip.g, within(t, T.catches, T.nps)); charsPop(grip, t, T.catches, .025);
      show(q, t >= T.nps); tf(q, lerp(-900, 140, E.back(seg(t, T.nps, T.nps + .45))), 470); stampAnim(st, t, T.defense + 2.2, 1300, 820, -6); };
  });
  // ---------- S3 · Exhibit 02: the ledge (birth) ----------
  scene(S[3], S[4], g => {
    bg(g, C.sky); halftone(g, { color: C.teal, step: 22, angle: 15, f: (x, y) => .1 + .4 * clamp(y / 1080), maxK: .6 }).setAttribute('class', 'mul');
    const head = exhibitHead(g, '02', 'THE LEDGE', T.e2);
    const cl = cliff(g, [[860, 1120], [900, 860], [1010, 760], [1380, 760], [1400, 700], [1360, 600], [1500, 420], [1960, 380], [1960, 1120]]);
    const mom = goatEl(g, .85), kid = goatEl(g, .42, 'kid');
    const tag = mono(g, 'LATE SPRING · STEEP · HIDDEN', 140, 470, 32, C.ink);
    const kg = big(g, '≈ 3 KG', 140, 640, 150, C.red); const kgl = line(g, 'ABOUT A NEWBORN BABY', 150, 720, 44);
    const clk = txt(g, '0:00', { x: 140, y: 640, 'font-size': 150, 'font-family': F.bagel, fill: C.teal }); const clkl = line(g, 'MINUTES TO STAND', 150, 720, 44);
    const hold = stampEl(g, 'HOLD ON.', { size: 130, color: C.red, family: F.sans }); cue(T.lesson + 2.4, 'stamp'); SHAKES.push([T.lesson + 2.4, 18, .35]);
    return t => { head(t); goatAnim(mom, t, 1180, 762, .85, 0, -1, 0, 1); const up = E.out(seg(t, T.minutes + .2, T.minutes + 1.6)); show(kid.root, t >= T.weighs - .3);
      goatAnim(kid, t, 1020, 762, .42, lerp(-70, 0, up) + (up < 1 ? Math.sin(t * 20) * 4 * (1 - up) : 0), 1, 0, 0);
      op(tag, within(t, T.shelf, T.weighs) ? 1 : 0); show(kg.g, within(t, T.weighs, T.minutes)); show(kgl.g, within(t, T.weighs, T.minutes)); charsPop(kg, t, T.weighs + .5, .05); charsPop(kgl, t, T.weighs + 1, .02);
      const CK = within(t, T.minutes, T.lesson + 2); show(clk, CK); show(clkl.g, CK); const m = Math.round(lerp(0, 10, seg(t, T.minutes, T.minutes + 1.5))); clk.textContent = m + ' MIN'; charsPop(clkl, t, T.minutes + .4, .02);
      stampAnim(hold, t, T.lesson + 2.4, 520, 640, -6); };
  });
  // ---------- S4 · Exhibit 03: the sky ----------
  scene(S[4], S[5], g => {
    bg(g, C.sky); halftone(g, { color: C.honey, step: 22, angle: 45, f: radial(1600, 160, 300, 1.1), maxK: .6 });
    const head = exhibitHead(g, '03', 'THE SKY', T.e3);
    const cl = cliff(g, [[-40, 1120], [-40, 820], [300, 800], [560, 820], [760, 790], [1020, 840], [1100, 1120]]);
    const mom = goatEl(g, .8), kid = goatEl(g, .4, 'kid');
    const eagle = eagleEl(g);
    const path = el('path', { d: 'M 1800 200 Q 1300 160 900 700', stroke: C.red, 'stroke-width': 8, fill: 'none', 'stroke-dasharray': '18 12' }, g);
    const plan = el('g', {}, g); ['1. STRIKE', '2. KNOCK OFF', '3. LET GRAVITY WORK'].forEach((s, i) => mono(plan, s, 0, i * 50, 34, [C.ink, C.ink, C.red][i]));
    const n12 = big(g, '12 YEARS', 140, 600, 150, C.teal), wl = mono(g, 'OF WATCHING · HAMEL & CÔTÉ, 2009', 150, 670, 30, C.ink);
    const zero = el('g', {}, g); txt(zero, 'SUCCESSFUL EAGLE ATTACKS', { x: 0, y: 0, 'font-size': 40, 'font-family': F.sans, fill: C.ink }); const z0 = txt(zero, '0', { x: 0, y: 170, 'font-size': 190, 'font-family': F.bagel, fill: C.red });
    const def = stampEl(g, 'DEFENDED', { size: 120, color: C.red, family: F.sans }); cue(T.horns + 1.6, 'stamp'); SHAKES.push([T.horns + 1.6, 22, .4]);
    cue(T.strike + .4, 'whoosh');
    return t => { head(t);
      const dive = E.in(seg(t, T.strike, T.strike + 1.4)), retreat = E.out(seg(t, T.horns + .8, T.horns + 2.2));
      let ex, ey, er; if (t < T.watched) { ex = lerp(lerp(2100, 1500, E.out(seg(t, T.eagles, T.eagles + 2))), 980, dive); ey = lerp(220, 620, dive); er = lerp(0, 30, dive); }
      else { const k = seg(t, T.went, T.went + 1.4); ex = lerp(1700, 1050, E.out(k)) + retreat * 900; ey = lerp(240, 560, E.out(k)) - retreat * 500; er = lerp(10, -10, k) - retreat * 30; }
      eagleAnim(eagle, t, ex, ey, .8, er, 1); show(eagle.root, t >= T.eagles); show(path, within(t, T.move, T.watched)); path.setAttribute('stroke-dasharray', `${(1200 * seg(t, T.move, T.move + 1)).toFixed(0)} 4000`);
      show(plan, within(t, T.move, T.watched)); tf(plan, 140, 470); op(plan, seg(t, T.move + .3, T.move + .6));
      const guard = E.out(seg(t, T.stood, T.stood + 1)); goatAnim(mom, t, lerp(380, 620, guard), 800, .8, 0, 1, guard > 0 && guard < 1, 0); goatAnim(kid, t, 700, 815, .4, 0, 1, 0, 0);
      mom.head.setAttribute('transform', `rotate(${-28 * E.back(seg(t, T.horns, T.horns + .5))} 130 -190)`);
      show(n12.g, within(t, T.twelve, T.every)); show(wl, within(t, T.twelve, T.every)); charsPop(n12, t, T.twelve, .05); op(wl, seg(t, T.twelve + .8, T.twelve + 1.1));
      show(zero, within(t, T.notOnce - .6, T.stood)); tf(zero, 140, 480); z0.textContent = '0'; op(zero, seg(t, T.notOnce - .6, T.notOnce - .3));
      stampAnim(def, t, T.horns + 1.6, 1300, 480, -6); };
  });
  // ---------- S5 · Exhibit 04: the cat (night) ----------
  scene(S[5], S[6], g => {
    bg(g, C.night); halftone(g, { color: C.night2, step: 24, angle: 20, f: edge(820, 1.3), maxK: .7 });
    const head = exhibitHead(g, '04', 'THE CAT', T.e4, true);
    const cl = cliff(g, [[400, 1120], [520, 860], [700, 820], [820, 640], [1000, 600], [1100, 420], [1300, 380], [1420, 200], [1640, 160], [1700, -40], [1960, -40], [1960, 1120]], '#4A403A', '#000');
    const goat = goatEl(g, .5), cat = cougarEl(g);
    const meter = el('g', {}, g); el('rect', { x: -20, y: -400, width: 40, height: 440, rx: 20, fill: 'none', stroke: C.cream, 'stroke-width': 5 }, meter); const mf = el('rect', { x: -12, y: 30, width: 24, height: 0, rx: 12, fill: C.honey }, meter); const mt = txt(meter, '+0 M', { x: 50, y: 0, 'font-size': 60, 'font-family': F.bagel, fill: C.honey });
    const bb = mono(g, '"PROBABLY BEST BUILT" TO HUNT HER · ONE STUDY', 140, 470, 28, C.honey);
    const tr = ['PATIENT.', 'CLIMBS.', 'WAITS.'].map((s, i) => line(g, s, 140, 560 + i * 90, 70, [C.cream, C.cream, C.red][i]));
    const earn = stampEl(g, 'EARN EVERY METER', { size: 84, color: C.red, family: F.sans }); cue(T.meter + 1.6, 'stamp'); SHAKES.push([T.meter + 1.6, 18, .35]);
    const route = [[620, 830], [900, 620], [1180, 410], [1520, 190]];
    return t => { head(t); const climb = seg(t, T.why, T.meter + 1), seg3 = climb * 3, i = Math.min(2, Math.floor(seg3)), f = E.io(seg3 - i), p0 = route[i], p1 = route[i + 1];
      goatAnim(goat, t, lerp(p0[0], p1[0], f), lerp(p0[1], p1[1], f), .5, 0, 1, f > 0 && f < 1, 0);
      const ci = Math.min(1, Math.floor(seg3 * .8)), cx = lerp(-400, 560, E.out(seg(t, T.lion, T.lion + 1.5))) + 200 * seg(t, T.why, T.meter); goatAnim; tf(cat.root, cx, 900 - 150 * seg(t, T.why, T.meter), .62); cat.tail.setAttribute('transform', `rotate(${Math.sin(t * 2) * 6} -150 -90)`);
      op(bb, within(t, T.study, T.why) ? 1 : 0); tr.forEach((l, k) => { show(l.g, within(t, T.patient, T.why)); charsPop(l, t, T.patient + k * .9, .04); });
      show(meter, t >= T.why); tf(meter, 1780, 900); const h = 400 * climb; mf.setAttribute('y', (30 - h).toFixed(1)); mf.setAttribute('height', h.toFixed(1)); mt.setAttribute('y', (20 - h).toFixed(1)); mt.textContent = '+' + Math.round(climb * 300) + ' M';
      stampAnim(earn, t, T.meter + 1.6, 820, 470, -6); };
  });
  // ---------- S6 · Exhibit 05: the wall ----------
  scene(S[6], S[7], g => {
    bg(g, C.sky); halftone(g, { color: C.teal, step: 22, angle: 15, f: (x, y) => .15 + .4 * clamp(y / 1080), maxK: .6 }).setAttribute('class', 'mul');
    const head = exhibitHead(g, '05', 'THE WALL', T.e5);
    const dam = el('g', {}, g); el('path', { d: 'M 1000 1120 L 1120 400 L 1460 400 L 1460 1120 Z', fill: C.concrete, stroke: C.ink, 'stroke-width': 8 }, dam); for (let k = 0; k < 7; k++) el('line', { x1: 1000 + 120 * (k + 1) / 8, y1: 1120 - 720 * (k + 1) / 8, x2: 1460, y2: 1120 - 720 * (k + 1) / 8, stroke: C.ink, 'stroke-width': 3, opacity: .4 }, dam);
    halftone(dam, { x0: 1000, y0: 400, w: 460, h: 720, color: C.cream, step: 18, angle: 0, f: (x, y) => x > 1000 + (1120 - y) / 6 && R1() > .6 ? .5 : 0, maxK: .5 });
    const ibx = [0, 1, 2, 3].map(i => goatEl(g, i === 1 ? .32 : .4, 'ibex'));
    const h49 = el('g', {}, g); el('path', { d: 'M 1540 400 L 1540 1060 M 1520 400 L 1560 400 M 1520 1060 L 1560 1060', stroke: C.ink, 'stroke-width': 6 }, h49); txt(h49, '49 M', { x: 1580, y: 760, 'font-size': 90, 'font-family': F.bagel, fill: C.red });
    const deg = mono(g, '≈ 80° · NEAR-VERTICAL', 1580, 830, 30, C.ink); const loc = mono(g, 'CINGINO DAM · PIEDMONT, ITALY', 140, 470, 32, C.teal);
    const sp = el('g', {}, g); for (let k = 0; k < 10; k++) el('path', { d: 'M 0 -12 L 4 -4 L 12 0 L 4 4 L 0 12 L -4 4 L -12 0 L -4 -4 Z', fill: C.cream, stroke: C.ink, 'stroke-width': 2, transform: `translate(${1060 + (k * 37) % 300 + (k > 5 ? 60 : 0)} ${480 + k * 58})` }, sp);
    const who = line(g, 'MOTHERS AND YOUNG ONES.', 140, 600, 54), salt = line(g, 'THEY NEED THE MINERALS.', 140, 600, 54, C.red);
    const st = stampEl(g, 'SALT LICK', { size: 100, color: C.red, family: F.sans }); cue(T.minerals + 1.2, 'stamp');
    return t => { head(t); op(loc, seg(t, T.alps + .5, T.alps + .8)); tf(dam, 0, lerp(700, 0, E.out(seg(t, T.alps, T.alps + 1.2))));
      show(h49, t >= T.fortynine); op(h49, seg(t, T.fortynine + .3, T.fortynine + .6)); op(deg, seg(t, T.fortynine + 1.6, T.fortynine + 1.9));
      ibx.forEach((b, i) => { const u = ((t - T.ibex) * .03 + i * .23) % 1, y = lerp(1060, 440, u), x = 1000 + (1120 - y) / 6 + 10 + Math.sin(u * 20 + i) * 6; show(b.root, t >= T.ibex); goatAnim(b, t + i, x, y, i === 1 ? .32 : .4, -80, 1, 1, 0); });
      show(sp, t >= T.mothers + 1); op(sp, .5 + .5 * Math.sin(t * 6));
      show(who.g, within(t, T.mothers, T.minerals)); charsPop(who, t, T.mothers, .025); show(salt.g, t >= T.minerals); charsPop(salt, t, T.minerals, .025); stampAnim(st, t, T.minerals + 1.2, 520, 800, -6); };
  });
  // ---------- S7 · the hardest exhibit: winter ----------
  scene(S[7], S[8], g => {
    bg(g, '#DDE6E6'); halftone(g, { color: C.teal, step: 22, angle: 15, f: edge(900, 1.4), maxK: .6 }).setAttribute('class', 'mul');
    const head = exhibitHead(g, '06', 'THE REAL KILLER', T.e6);
    const eg = el('g', {}, g); const e1 = line(eg, 'NOT THE EAGLE.', 0, 0, 60, C.ink), e2 = line(eg, 'NOT THE CAT.', 0, 80, 60, C.ink);
    const wint = stampEl(g, 'WINTER', { size: 170, color: C.teal, family: F.sans }); cue(T.winter + .3, 'stamp'); SHAKES.push([T.winter + .3, 22, .4]);
    const pct = big(g, '40–60%', 140, 620, 190, C.red), pl = line(g, 'OF KIDS DIE IN THEIR FIRST WINTER', 150, 700, 46), src = mono(g, 'BRITISH COLUMBIA MINISTRY OF ENVIRONMENT', 150, 760, 26, C.teal);
    const three = ['COLD.', 'HUNGER.', 'SNOW OVER THE FOOD.'].map((s, i) => line(g, s, 140, 540 + i * 100, 70, [C.teal, C.ink, C.red][i]));
    const kid = goatEl(g, .55, 'kid'), snowpile = el('path', { d: 'M 1100 1080 Q 1300 880 1560 920 Q 1760 900 1960 1000 L 1960 1080 Z', fill: C.snow, stroke: C.ink, 'stroke-width': 7 }, g);
    const out = stampEl(g, 'OUTLAST IT', { size: 110, color: C.red, family: F.sans }); cue(T.outlast + 1.4, 'stamp'); SHAKES.push([T.outlast + 1.4, 18, .35]);
    const flakes = el('g', {}, g); const FL = Array.from({ length: 140 }, () => [R1() * 1920, R1() * 1080, 3 + R1() * 7, .5 + R1()]).map(([x, y, r, v]) => ({ e: el('circle', { r, fill: '#FFFFFF', stroke: C.ink, 'stroke-width': 1.5 }, flakes), x, y, v }));
    return t => { head(t); show(eg, within(t, T.notEagle, T.bc)); tf(eg, 140, 540); charsPop(e1, t, T.notEagle, .03); charsPop(e2, t, T.notEagle + 1.3, .03);
      stampAnim(wint, t, T.winter + .3, 1300, 620, -6); show(wint.g, within(t, T.winter, T.bc));
      const P = within(t, T.bc, T.cold); [pct, pl].forEach(x => show(x.g, P)); show(src, P); charsPop(pct, t, T.bc + 1.2, .05); charsPop(pl, t, T.bc + 2, .015); op(src, seg(t, T.bc + 2.8, T.bc + 3.1));
      three.forEach((l, k) => { show(l.g, within(t, T.cold, T.protects)); charsPop(l, t, T.cold + k * .8, .03); });
      show(kid.root, t >= T.protects); goatAnim(kid, t, 1380, 940, .55, 0, -1, 0, 0); show(snowpile, t >= T.protects); stampAnim(out, t, T.outlast + 1.4, 600, 640, -6);
      const wind = seg(t, T.winter, T.winter + 2); FL.forEach(f => { f.e.setAttribute('cx', ((f.x + t * 60 * f.v * (1 + 3 * wind)) % 1960).toFixed(1)); f.e.setAttribute('cy', ((f.y + t * 90 * f.v) % 1100).toFixed(1)); }); op(flakes, .4 + .6 * wind); };
  });
  // ---------- S8 · the verdict (silence before DEFENSE) ----------
  scene(S[8], S[9], g => {
    bg(g, C.paper); halftone(g, { color: C.red, step: 22, angle: 70, f: radial(960, 560, 900, 1.2), maxK: .62 }).setAttribute('class', 'mul');
    const v = headline(g, 'THE VERDICT', 140, 260, 160);
    const ls = [['BORN ON THE EDGE.', T.born], ['EATS ON THE EDGE.', T.eats], ['RAISES HER YOUNG ON THE EDGE.', T.raises]].map(([s, t0], i) => ({ c: line(g, s, 140, 420 + i * 90, 60, i === 2 ? C.red : C.ink), t0 }));
    const safest = line(g, 'THE EDGE IS THE SAFEST PLACE SHE KNOWS.', 140, 720, 50, C.teal);
    const sc = line(g, 'WHAT SCARES EVERYBODY ELSE', 140, 470, 66), sc2 = line(g, 'MIGHT BE WHAT KEEPS YOU ALIVE.', 140, 560, 66, C.teal);
    const nd = line(g, 'THE CLIMB IS NOT THE DANGER.', 140, 470, 66);
    const st = stampEl(g, 'THE CLIMB IS THE DEFENSE', { size: 104, color: C.red, family: F.sans }); cue(ess, 'bigstamp'); SHAKES.push([ess, 28, .45]); FLASHES.push(ess);
    const goat = goatEl(g, .7); const peak = cliff(g, [[1280, 1120], [1500, 820], [1600, 840], [1760, 1120]]);
    const fin = ['STAY UP THERE.', 'HOLD ON.', 'OUTLAST THE WINTER.'].map((s, i) => line(g, s, 140, 440 + i * 110, 74, [C.ink, C.teal, C.red][i]));
    return t => { charsPop(v, t, T.verdict, .05);
      const A = within(t, T.born, T.maybe); ls.forEach(l => { show(l.c.g, A); charsPop(l.c, t, l.t0, .02); }); show(safest.g, A); charsPop(safest, t, T.safest + .3, .015);
      const B = within(t, T.scares, T.notDanger); show(sc.g, B); show(sc2.g, B); charsPop(sc, t, T.scares, .02); charsPop(sc2, t, T.scares + 1.4, .02);
      show(nd.g, within(t, T.notDanger, ess)); charsPop(nd, t, T.notDanger, .02);
      stampAnim(st, t, ess, 960, 560, -5); show(st.g, within(t, ess - .1, T.stay));
      fin.forEach((l, k) => { show(l.g, t >= T.stay); charsPop(l, t, T.stay + k * 1.1, .03); }); show(peak, t >= T.stay); show(goat.root, t >= T.stay); goatAnim(goat, t, 1560, lerp(1200, 830, E.out(seg(t, T.stay, T.stay + 1))), .7, 0, -1, 0, 1); };
  });
  // ---------- S9 · the drawer ----------
  scene(S[9], S[11], g => {
    bg(g, C.ink); halftone(g, { color: C.night2, step: 24, angle: 20, f: edge(860, 1.2), maxK: .7 });
    const drawer = el('g', {}, g); el('rect', { x: 260, y: 520, width: 1400, height: 420, rx: 16, fill: '#6b4f3a', stroke: C.cream, 'stroke-width': 6 }, drawer);
    for (let i = 0; i < 18; i++) { const x = 300 + i * 74; el('rect', { x, y: 440, width: 64, height: 480, rx: 6, fill: '#E9D9B6', stroke: C.ink, 'stroke-width': 4 }, drawer); txt(drawer, 'CLIFF', { x: x + 40, y: 470, 'font-size': 22, 'font-family': F.mono, 'font-weight': 800, fill: C.ink, transform: `rotate(90 ${x + 40} 470)` }); }
    const folder = el('g', {}, g); el('rect', { x: -230, y: -160, width: 460, height: 320, rx: 12, fill: C.sky, stroke: C.ink, 'stroke-width': 7 }, folder); el('rect', { x: -230, y: -196, width: 180, height: 50, rx: 8, fill: C.sky, stroke: C.ink, 'stroke-width': 7 }, folder);
    txt(folder, 'CASE 008', { x: 0, y: -30, 'font-size': 60, 'font-family': F.sans, fill: C.ink, 'text-anchor': 'middle' }); txt(folder, 'THE GOAT', { x: 0, y: 50, 'font-size': 64, 'font-family': F.serif, fill: C.ink, 'text-anchor': 'middle' });
    const closed = stampEl(g, 'CASE CLOSED', { size: 110, color: C.red, family: F.sans }); const tc = S[9] + .5; cue(tc, 'stamp'); cue(tc + 1.3, 'drawer');
    const pr = chars(g, 'PRODUCED BY RELENTLESS AARON', { x: 960, y: 220, size: 64, family: F.sans, weight: 400, fill: C.honey, anchor: 'middle' });
    const title = chars(g, 'THE CLIFF FILE', { x: 960, y: 420, size: 140, family: F.serif, weight: 400, fill: C.cream, anchor: 'middle', shadow: { fill: C.red, dx: 8, dy: 8 } });
    const end = END + .6;
    return t => { const slide = E.io(seg(t, tc + 1.3, tc + 2.5)); tf(folder, lerp(960, 1700, slide), lerp(560, 640, slide), lerp(1, .3, slide), lerp(-3, 0, slide)); op(folder, 1 - seg(t, tc + 2.3, tc + 2.6));
      stampAnim(closed, t, tc, 960, 600, -8); op(closed.g, t < tc + 1.3 ? .93 : 0); charsPop(pr, t, T.produced, .02);
      tf(drawer, 0, lerp(700, 0, E.back(seg(t, tc + .9, tc + 1.4)))); charsPop(title, t, Math.max(end, tc + 2.6) + .2, .05); };
  });

  // ---------- HUD ----------
  const hudG = el('g', {}, hud); const caseNo = txt(hudG, 'CASE FILE No.008 · OREAMNOS', { x: 60, y: 62, 'font-size': 22, 'font-family': F.mono, 'font-weight': 800 });
  const chip = el('g', {}, hudG), chipBg = el('rect', { x: 60, y: 76, height: 40, rx: 6 }, chip), chipA = txt(chip, '', { x: 74, y: 105, 'font-size': 24, 'font-family': F.sans }), chipB = txt(chip, '', { y: 105, 'font-size': 24, 'font-family': F.sans });
  const date = el('g', {}, hudG), dateBg = el('rect', { x: 1690, y: 40, width: 170, height: 50, rx: 8, fill: 'none', 'stroke-width': 4 }, date), rec = el('circle', { cx: 1716, cy: 65, r: 9, fill: C.red }, date), dateT = txt(date, '2026.11', { x: 1736, y: 75, 'font-size': 28, 'font-family': F.mono, 'font-weight': 800 });
  const chips = [[S[1], S[2], 'SUBJECT', 'MUGSHOT'], [S[2], S[3], 'EXHIBIT 01', 'FEET'], [S[3], S[4], 'EXHIBIT 02', 'LEDGE'], [S[4], S[5], 'EXHIBIT 03', 'SKY'], [S[5], S[6], 'EXHIBIT 04', 'CAT'], [S[6], S[7], 'EXHIBIT 05', 'WALL'], [S[7], S[8], 'EXHIBIT 06', 'WINTER'], [S[8], S[9], 'RULING', 'VERDICT']];
  hudUpdate = t => { const c = chips.find(c => t >= c[0] && t < c[1]); show(hudG, !!c); if (!c) return; const dark = t >= S[5] && t < S[6], ink = dark ? C.cream : C.ink;
    caseNo.setAttribute('fill', ink); chipBg.setAttribute('fill', dark ? C.cream : C.ink); chipA.textContent = c[2]; chipA.setAttribute('fill', dark ? C.red : C.honey); chipB.textContent = c[3]; chipB.setAttribute('fill', dark ? C.ink : C.cream);
    const wa = measure(c[2], 24, F.sans, 400), wb = measure(c[3], 24, F.sans, 400); chipB.setAttribute('x', 74 + wa + 14); chipBg.setAttribute('width', wa + wb + 42); dateBg.setAttribute('stroke', ink); dateT.setAttribute('fill', ink); op(rec, Math.floor(t * 2) % 2 ? .25 : 1); };

  // ---------- caption bar ----------
  const KEY = /^(\d[\d,]*\+?|zero|eight|edge|cliff|air|hoof|pad|rim|defense|minutes|twelve|once|horns|eagles|lion|higher|fortynine|ibex|salt|minerals|winter|forty|sixty|outlast|climb|hold|goatantelope)$/i;
  const groups = []; let gg = []; for (const w of WD) { if (gg.length && (gg.length >= 8 || /[.,!?:;]$/.test(gg[gg.length - 1].w) || w.s - gg[gg.length - 1].e > .45)) { groups.push(gg); gg = []; } gg.push(w); } if (gg.length) groups.push(gg);
  const CAPS = groups.map(ws => { const parts = []; ws.forEach((w, i) => parts.push([w.w + (i < ws.length - 1 ? ' ' : ''), KEY.test(norm(w.w)) ? C.honey : null])); const c = caption(hud, parts, { x: 960, y: 1010, size: 40 }); show(c.g, false); return { c, t0: ws[0].s - .05, t1: ws[ws.length - 1].e + .35 }; });
  capUpdate = t => CAPS.forEach(k => { const on = t >= k.t0 && t < k.t1 && t < END + .3; show(k.c.g, on); if (on) captionAnim(k.c, t, k.t0); });

  // ---------- dot wipe ----------
  const dotsG = el('g', {}, wipe), wipeDots = []; for (let y = 0; y <= 1160; y += 80) for (let x = 0; x <= 2000; x += 80) wipeDots.push({ e: el('circle', { cx: x, cy: y, r: 0 }, dotsG), x, y });
  wipeUpdate = t => { const w = WIPES.find(([b]) => Math.abs(t - b) < .22); show(dotsG, !!w); if (!w) return; dotsG.setAttribute('fill', w[1]); const u = (t - w[0] + .22) / .44;
    wipeDots.forEach(d => { const delay = (d.x / 1920 * .6 + d.y / 1080 * .4) * .35, p = clamp((u - delay) / .65); d.e.setAttribute('r', (Math.sin(p * Math.PI) * 62).toFixed(1)); }); };
  buildVertical({ title: 'THE CLIFF FILE', caseNo: 'CASE FILE No.008 · OREAMNOS', chips, KEY });
  window.EV = EV.sort((a, b) => a.t - b.t);
}
