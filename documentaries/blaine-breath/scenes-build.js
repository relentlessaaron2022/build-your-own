function buildAll() {
  const T = {
    case: at('Case number zero'), subj: at('The subject did not'), april: at('April thirtieth,'), stage: at('A live television stage.'), sphere: at('A sphere of water.'), man: at('A man inside it,'), judge: at('And a judge from'),
    tryit: at('Try it right now.'), hold: at('Hold your breath and'), think: at('Then think about this.'), went: at('He went seventeen minutes'), how: at('How is that possible?'),
    e1: at('Exhibit one.'), earlier: at('Two years earlier,'), week: at('he lived for a week'), chains: at('Then he tried to'), seven: at('At seven minutes and'), conv: at('his body began to'), divers: at('Divers pulled him out.'), most: at('Most people would call'), data: at('He called it data.'),
    e2: at('Exhibit two.'), own: at('By his own account,'), smaller: at('A smaller body burns'), hr: at('He says his resting'), notMuscle: at('He was not building'), quieter: at('He was building a'),
    e3: at('Exhibit three.'), carry: at('Here is something you'), face: at('Put your face in'), slows: at('Your heart slows down.'), vessels: at('The blood vessels in'), spleen: at('Your spleen squeezes out'), seals: at('Seals do this.'), whales: at('Whales do this.'), you: at('You do this.'), train: at('Most of us just'),
    e4: at('Exhibit four.'), strange: at('Here is the strange'), need: at('The desperate need to'), co2: at('It is carbon dioxide'), burning: at('That burning in your'), notFire: at('Not the fire.'), sit: at('He trained to sit'),
    e5: at('Exhibit five.'), before: at('Before he went under,'), rules: at('The rules allowed it.'), tank: at('It loaded his blood'), notMagic: at('So no, it was'), physio: at('It was physiology, pushed'), edge: at('And the edge pushed'), monitors: at('On the monitors, his'),
    warning: at('A warning for the'), breathing: at('Breathing hard before going'), pools: at('People drown that way'), dont: at('Do not try this.'),
    verdict: at('Verdict.'), months: at('Months later, someone broke'), today: at('Today the record is'), fall: at('Records fall.'), notLesson: at('That is not the lesson.'), lesson: at('The lesson is the distance'), between: at('Between the man pulled'), notBorn: at('He was not born'), built: at('He built different.'), oneBreath: at('One breath at a'),
    end: at('Built Different. Produced'), produced: at('Produced by Relentless Aaron.'),
  };
  const S = [0, T.how - .15, T.e1 - .15, T.e2 - .15, T.e3 - .15, T.e4 - .15, T.e5 - .15, T.warning - .15, T.verdict - .15, T.end - .15, END + .6, DUR];
  S.forEach((s, i) => cue(s, 'sect' + i));
  S.slice(1, 10).forEach((s, i) => { WIPES.push([s, [C.red, C.teal, C.honey, C.deep, C.night, C.teal, C.red, C.cream, C.ink][i]]); cue(s - .2, 'whoosh'); });
  const ess = T.built + .3; cue(ess, 'ess');

  // ---------- S0 · cold open: the sphere on a live stage, the clock ----------
  scene(S[0], S[1], g => {
    bg(g, C.night); halftone(g, { color: C.night2, step: 24, angle: 20, f: edge(820, 1.2), maxK: .7 });
    const beam = el('path', { d: 'M 1180 -40 L 1520 -40 L 1760 1120 L 940 1120 Z', fill: C.cream, opacity: .08 }, g);
    const sph = sphereEl(g, 330), man = humanEl(sph.inner, C.ink, C.cream);
    const no = mono(g, 'BUILT DIFFERENT · CASE NO. 009', 120, 150, 36, C.honey);
    const subj = line(g, 'THE SUBJECT', 120, 270, 76, C.cream), subj2 = line(g, 'DID NOT BREATHE.', 120, 360, 76, C.red);
    const date = el('g', {}, g); el('rect', { x: 0, y: 0, width: 520, height: 64, rx: 10, fill: C.cream }, date); txt(date, 'APRIL 30, 2008 · LIVE TV', { x: 24, y: 44, 'font-size': 32, 'font-family': F.mono, 'font-weight': 800, fill: C.ink });
    const jg = el('g', {}, g); el('rect', { x: 0, y: 0, width: 130, height: 170, rx: 12, fill: C.cream, stroke: C.ink, 'stroke-width': 6 }, jg); el('rect', { x: 35, y: -18, width: 60, height: 34, rx: 8, fill: C.steel, stroke: C.ink, 'stroke-width': 5 }, jg);
    [40, 75, 110, 145].forEach(y => el('line', { x1: 22, x2: 108, y1: y, y2: y, stroke: C.ink, 'stroke-width': 5 }, jg)); mono(jg, 'A GUINNESS JUDGE, WATCHING', 160, 100, 28, C.cream);
    const clk = txt(g, '0:00', { x: 120, y: 760, 'font-size': 240, 'font-family': F.bagel, fill: C.cream }); const clkL = mono(g, 'HIS CLOCK', 128, 820, 30, C.honey);
    const you = el('g', {}, g); el('rect', { x: 0, y: 0, width: 560, height: 120, rx: 14, fill: C.honey, stroke: C.ink, 'stroke-width': 6 }, you); txt(you, 'YOUR CLOCK', { x: 26, y: 76, 'font-size': 40, 'font-family': F.sans, fill: C.ink }); const youT = txt(you, '0:00', { x: 530, y: 86, 'font-size': 76, 'font-family': F.bagel, fill: C.red, 'text-anchor': 'end' });
    const big17 = stampEl(g, '17:04', { size: 190, color: C.red, family: F.bagel }); cue(T.went + 1.1, 'bigstamp'); SHAKES.push([T.went + 1.1, 26, .45]); FLASHES.push(T.went + 1.1);
    cue(T.judge + .4, 'shutter'); FLASHES.push(T.judge + .4);
    return t => { const z = 1 + .04 * seg(t, 0, S[1]); tf(g, 960 * (1 - z), 540 * (1 - z), z);
      op(no, seg(t, T.case, T.case + .3)); charsPop(subj, t, T.subj, .03); charsPop(subj2, t, T.subj + .7, .03);
      show(date, t >= T.april); tf(date, lerp(-520, 120, E.back(seg(t, T.april, T.april + .45))), 430);
      show(sph.root, t >= T.sphere - .2); tf(sph.root, 1350, 560, pop(t, T.sphere - .2, .5)); op(beam, seg(t, T.stage, T.stage + .6) * .9 + .1);
      show(man.root, t >= T.man); humanPose(man, Math.sin(t * .8) * 10, 150 + Math.sin(t * 1.1) * 12, .62, Math.sin(t * .5) * 3, 24, -24, 8, -8); sph.bubbleAnim(t, 1 - seg(t, T.man, T.man + 1.5));
      show(jg, t >= T.judge); tf(jg, 120, lerp(1200, 880, E.back(seg(t, T.judge, T.judge + .45))));
      const CL = within(t, T.judge + 1.2, T.tryit) || t >= T.went; show(clk, CL); show(clkL, CL); clk.textContent = t < T.went ? fmtClock(seg(t, T.judge + 1.2, T.tryit) * 63) : fmtClock(Math.min(1024, 60 + seg(t, T.went, T.went + 1.1) * 964));
      const Y = within(t, T.tryit, T.went); show(you, Y); tf(you, 120, 600); youT.textContent = fmtClock(Math.max(0, t - T.hold));
      show(jg, t >= T.judge && t < T.tryit); stampAnim(big17, t, T.went + 1.1, 1350, 900, -6); show(big17.g, t >= T.went + 1.05); };
  });
  // ---------- S1 · How is that possible? ----------
  scene(S[1], S[2], g => {
    bg(g, C.paper); halftone(g, { color: C.red, step: 22, angle: 70, f: radial(960, 540, 950, 1.1), maxK: .62 }).setAttribute('class', 'mul');
    const h1 = headline(g, 'HOW IS THAT', 960, 470, 170, C.ink, C.teal), h2 = headline(g, 'POSSIBLE?', 960, 670, 210, C.red, C.ink);
    [h1, h2].forEach(h => { const w = measure(h === h1 ? 'HOW IS THAT' : 'POSSIBLE?', h === h1 ? 170 : 210, F.serif); h.g.setAttribute('transform', `translate(${-w / 2} 0)`); });
    cue(S[1] + .25, 'stamp'); SHAKES.push([S[1] + .25, 16, .3]);
    return t => { charsPop(h1, t, S[1] + .1, .035); charsPop(h2, t, S[1] + .45, .05); };
  });
  // ---------- S2 · Exhibit 01: the failure (2006) ----------
  scene(S[2], S[3], g => {
    bg(g, C.paper); const head = exhibitHead(g, '01', 'THE FAILURE', T.e1);
    const sph = sphereEl(g, 290), man = humanEl(sph.inner, C.ink, C.cream); const ch = chainEl(sph.inner, -150, -40, 150, 60, 9), ch2 = chainEl(sph.inner, -150, 60, 150, -40, 9);
    const yr = mono(g, '2006 · NEW YORK', 140, 470, 34, C.teal);
    const days = el('g', {}, g); const D = Array.from({ length: 7 }, (_, i) => { const d = el('g', {}, days); el('rect', { x: i * 92, y: 0, width: 78, height: 78, rx: 10, fill: C.cream, stroke: C.ink, 'stroke-width': 5 }, d); const x = el('path', { d: `M ${i * 92 + 16} 16 L ${i * 92 + 62} 62 M ${i * 92 + 62} 16 L ${i * 92 + 16} 62`, stroke: C.red, 'stroke-width': 9, 'stroke-linecap': 'round' }, d); return x; });
    const dl = line(g, 'ONE WEEK IN THE WATER', 140, 650, 44);
    const clk = txt(g, '0:00', { x: 140, y: 760, 'font-size': 210, 'font-family': F.bagel, fill: C.ink }); const clkL = mono(g, 'BREATH HELD · IN CHAINS', 148, 820, 30, C.teal);
    const pulled = stampEl(g, 'PULLED OUT', { size: 110, color: C.red, family: F.sans }); cue(T.divers + .6, 'stamp'); SHAKES.push([T.divers + .6, 22, .4]);
    const most = line(g, 'THE END OF THE STORY?', 140, 560, 64);
    const data = stampEl(g, 'DATA.', { size: 170, color: C.teal, family: F.sans }); cue(T.data + .7, 'stamp'); SHAKES.push([T.data + .7, 18, .35]);
    return t => { head(t); op(yr, seg(t, T.earlier, T.earlier + .3)); show(yr, t < T.most);
      show(sph.root, t >= T.earlier); tf(sph.root, 1360, 640, pop(t, T.earlier, .5)); const shake = within(t, T.conv, T.divers + .3) ? Math.sin(t * 60) * 10 : 0;
      const out = E.in(seg(t, T.divers, T.divers + .9)); humanPose(man, shake, 160 - out * 700, .58, shake * .3, 20, -20, 6, -6); sph.bubbleAnim(t, within(t, T.conv, T.divers + 1) ? 1 : .15);
      show(ch, t >= T.chains); show(ch2, t >= T.chains); op(ch, seg(t, T.chains, T.chains + .4)); op(ch2, seg(t, T.chains, T.chains + .4)); [ch, ch2].forEach(c => c.setAttribute('transform', `translate(${shake} ${-out * 700})`));
      show(days, within(t, T.week, T.chains)); tf(days, 140, 520); D.forEach((x, i) => op(x, seg(t, T.week + .3 + i * .22, T.week + .45 + i * .22))); show(dl.g, within(t, T.week, T.chains)); charsPop(dl, t, T.week + 1.8, .015);
      const CL = within(t, T.chains + .6, T.most); show(clk, CL); show(clkL, CL); clk.textContent = fmtClock(Math.min(428, seg(t, T.chains + .6, T.seven + 1.4) * 428)); clk.setAttribute('fill', t >= T.seven ? C.red : C.ink);
      stampAnim(pulled, t, T.divers + .6, 760, 560, -7); show(pulled.g, within(t, T.divers, T.most));
      show(most.g, within(t, T.most, T.data)); charsPop(most, t, T.most, .025); stampAnim(data, t, T.data + .7, 600, 600, -6); };
  });
  // ---------- S3 · Exhibit 02: the body ----------
  scene(S[3], S[4], g => {
    bg(g, C.paper); halftone(g, { color: C.teal, step: 22, angle: 15, f: edge(900, 1.5), maxK: .55 }).setAttribute('class', 'mul'); const head = exhibitHead(g, '02', 'THE BODY', T.e2);
    const man = humanEl(g, C.ink, C.cream);
    const acc = mono(g, 'BY HIS OWN ACCOUNT', 140, 470, 32, C.teal);
    const lb = txt(g, '−0 LB', { x: 140, y: 650, 'font-size': 170, 'font-family': F.bagel, fill: C.red }); const lbl = line(g, 'IN ABOUT THREE MONTHS', 150, 720, 44);
    const less = line(g, 'SMALLER BODY. LESS OXYGEN BURNED.', 140, 820, 40, C.teal);
    const mon = monitorEl(g, 760, 300); const restL = mono(g, 'RESTING HEART RATE, HE SAYS', 140, 470, 32, C.teal);
    const nm = line(g, 'NOT MUSCLE.', 140, 560, 76); const strike = el('rect', { x: 130, y: 520, width: 0, height: 14, fill: C.red }, g);
    const st = stampEl(g, 'A QUIETER MACHINE', { size: 92, color: C.red, family: F.sans }); cue(T.quieter + 1.4, 'stamp'); SHAKES.push([T.quieter + 1.4, 18, .35]);
    return t => { head(t); const thin = E.io(seg(t, T.own + .5, T.smaller + .5));
      humanPose(man, 1420, 900, .95, 0, 12, -12, 3, -3); man.root.setAttribute('transform', `translate(1420 900) scale(${(lerp(1.35, .95, thin) * .95).toFixed(3)} .95)`);
      const A = within(t, T.own, T.hr); show(acc, A); show(lb, A); show(lbl.g, A); show(less.g, within(t, T.smaller, T.hr)); lb.textContent = '−' + Math.round(50 * thin) + (thin > .99 ? '+' : '') + ' LB'; charsPop(lbl, t, T.own + 1, .015); charsPop(less, t, T.smaller, .015);
      const M = within(t, T.hr, T.notMuscle); show(mon.root, M); show(restL, M); tf(mon.root, 140, 520); mon.update(t, lerp(72, 38, E.io(seg(t, T.hr + .8, T.hr + 3))));
      const N = t >= T.notMuscle; show(nm.g, N); show(strike, N); charsPop(nm, t, T.notMuscle, .03); strike.setAttribute('width', (520 * E.out(seg(t, T.notMuscle + 1, T.notMuscle + 1.4))).toFixed(0));
      stampAnim(st, t, T.quieter + 1.4, 600, 760, -5); };
  });
  // ---------- S4 · Exhibit 03: the reflex ----------
  scene(S[4], S[5], g => {
    bg(g, C.sky); halftone(g, { color: C.teal, step: 22, angle: 15, f: (x, y) => .1 + .4 * clamp(y / 1080), maxK: .6 }).setAttribute('class', 'mul'); const head = exhibitHead(g, '03', 'THE REFLEX', T.e3);
    const man = humanEl(g, C.ink, C.cream); const water = el('rect', { x: 1060, y: 0, width: 900, height: 1200, fill: C.water, opacity: .75 }, g); const wl = el('path', { d: '', stroke: C.deep, 'stroke-width': 8, fill: 'none' }, g);
    const heart = el('path', { d: heartPath(3.2), fill: C.red, stroke: C.ink, 'stroke-width': 4 }, g);
    const carry = line(g, 'YOU ALREADY CARRY THIS.', 140, 480, 52, C.teal);
    const items = [['HEART SLOWS', T.slows, C.red], ['LIMB VESSELS TIGHTEN', T.vessels, C.ink], ['SPLEEN RELEASES RED CELLS', T.spleen, C.teal]].map(([s, t0, c], i) => { const r = el('g', {}, g); el('circle', { cx: 0, cy: -16, r: 22, fill: c, stroke: C.ink, 'stroke-width': 5 }, r); txt(r, String(i + 1), { x: 0, y: -4, 'font-size': 30, 'font-family': F.sans, fill: C.cream, 'text-anchor': 'middle' }); txt(r, s, { x: 44, y: 0, 'font-size': 46, 'font-family': F.sans, fill: c }); return { r, t0 }; });
    const roll = el('g', {}, g); const seal = sealEl(roll), whale = whaleEl(roll), you = humanEl(roll, C.ink, C.cream);
    const rl = [['SEALS', T.seals, 420], ['WHALES', T.whales, 960], ['YOU', T.you, 1500]].map(([s, t0, x]) => ({ c: line(roll, s, x, 960, 60, C.ink, 'middle'), t0 }));
    const train = stampEl(g, 'MOST OF US NEVER TRAIN IT', { size: 70, color: C.red, family: F.sans }); cue(T.train + 1.6, 'stamp');
    return t => { head(t); const R = t < T.seals; [man.root, water, wl, heart].forEach(e => show(e, R)); items.forEach(o => show(o.r, R)); show(carry.g, within(t, T.carry, T.face + .5) && R);
      charsPop(carry, t, T.carry, .02); humanPose(man, 1460, 1000, 1.05, 0, 14, -14, 3, -3);
      const lvl = lerp(1200, 560, E.io(seg(t, T.face, T.face + 1.6))); water.setAttribute('y', lvl.toFixed(0)); wl.setAttribute('d', `M 1060 ${lvl} ` + Array.from({ length: 10 }, (_, k) => `Q ${1105 + k * 90} ${lvl - 14 * Math.sin(t * 3 + k)} ${1150 + k * 90} ${lvl}`).join(' '));
      const bpm = t < T.slows ? 80 : lerp(80, 45, seg(t, T.slows, T.slows + 2)); const beat = Math.exp(-((t * bpm / 60) % 1) * 8); heart.setAttribute('transform', `translate(1460 700) scale(${(1 + .12 * beat).toFixed(3)})`); show(heart, R && t >= T.slows - .2);
      items.forEach((o, i) => { tf(o.r, lerp(-800, 140, E.back(seg(t, o.t0, o.t0 + .45))), 600 + i * 110); });
      show(roll, t >= T.seals); tf(seal, 420, 820, pop(t, T.seals, .4)); tf(whale, 960, 820, pop(t, T.whales, .4) * .8); humanPose(you, 1500, 840, pop(t, T.you, .4) * .5); rl.forEach(o => { show(o.c.g, t >= o.t0); charsPop(o.c, t, o.t0 + .2, .04); });
      stampAnim(train, t, T.train + 1.6, 960, 420, -4); };
  });
  // ---------- S5 · Exhibit 04: the burn (dark) ----------
  scene(S[5], S[6], g => {
    bg(g, C.night); halftone(g, { color: C.night2, step: 24, angle: 20, f: edge(820, 1.3), maxK: .7 }); const head = exhibitHead(g, '04', 'THE BURN', T.e4, true);
    const gauge = (x, label, col) => { const G = el('g', {}, g); el('rect', { x: -60, y: -520, width: 120, height: 520, rx: 30, fill: 'none', stroke: C.cream, 'stroke-width': 7 }, G); const f = el('rect', { x: -48, y: -10, width: 96, height: 0, rx: 22, fill: col }, G);
      txt(G, label, { x: 0, y: 70, 'font-size': 52, 'font-family': F.mono, 'font-weight': 800, fill: col, 'text-anchor': 'middle' }); tf(G, x, 900); return { G, f }; };
    const o2 = gauge(1300, 'O₂', C.mint), co2 = gauge(1620, 'CO₂', C.red);
    const not = line(g, 'NOT RUNNING OUT OF OXYGEN.', 140, 520, 52, C.cream), is = line(g, 'CARBON DIOXIDE BUILDING UP.', 140, 610, 52, C.red);
    const bell = bellEl(g); const alarm = line(g, 'AN ALARM.', 140, 560, 90, C.honey), fire = line(g, 'NOT THE FIRE.', 140, 680, 90, C.red);
    const man = humanEl(g, C.cream, C.ink); const rings = el('g', {}, g); const RG = [0, 1, 2].map(() => el('circle', { cx: 0, cy: 0, r: 0, fill: 'none', stroke: C.red, 'stroke-width': 6 }, rings));
    const calm = stampEl(g, 'STAY CALM INSIDE IT', { size: 80, color: C.red, family: F.sans }); cue(T.sit + 2.2, 'stamp'); SHAKES.push([T.sit + 2.2, 18, .35]);
    cue(T.burning + .5, 'buzz');
    return t => { head(t); const G = t < T.burning; show(o2.G, G); show(co2.G, G); const k = seg(t, T.need, T.co2 + 2.5);
      const set = (o, v) => { const h = 500 * v; o.f.setAttribute('y', (-10 - h).toFixed(1)); o.f.setAttribute('height', h.toFixed(1)); }; set(o2, lerp(.92, .7, k)); set(co2, lerp(.08, .95, k));
      show(not.g, within(t, T.need, T.burning)); show(is.g, within(t, T.co2, T.burning)); charsPop(not, t, T.need + .4, .015); charsPop(is, t, T.co2, .015);
      const B = within(t, T.burning, T.sit); show(bell.root, B); tf(bell.root, 1460, 560, pop(t, T.burning, .4) * 1.3); bell.g.setAttribute('transform', `rotate(${Math.sin(t * 40) * 12})`); bell.waves.forEach(w => op(w, Math.floor(t * 8) % 2 ? 1 : .3));
      show(alarm.g, B); show(fire.g, within(t, T.notFire, T.sit)); charsPop(alarm, t, T.burning + 1.4, .04); charsPop(fire, t, T.notFire, .04);
      const M = t >= T.sit; show(man.root, M); show(rings, M); humanPose(man, 1400, 880, .9, 0, 30, -30, 0, 0); RG.forEach((r, i) => { const u = ((t - T.sit) * .5 + i / 3) % 1; r.setAttribute('cx', 1400); r.setAttribute('cy', 700); r.setAttribute('r', (180 + u * 360).toFixed(1)); op(r, 1 - u); });
      stampAnim(calm, t, T.sit + 2.2, 600, 600, -5); };
  });
  // ---------- S6 · Exhibit 05: the fine print ----------
  scene(S[6], S[7], g => {
    bg(g, C.paper); halftone(g, { color: C.honey, step: 22, angle: 45, f: radial(1500, 600, 700, 1.1), maxK: .6 }).setAttribute('class', 'mul'); const head = exhibitHead(g, '05', 'THE FINE PRINT', T.e5);
    const tank = tankEl(g);
    const pre = txt(g, '0 MIN', { x: 140, y: 650, 'font-size': 170, 'font-family': F.bagel, fill: C.teal }); const prl = line(g, 'OF PURE OXYGEN FIRST', 150, 720, 44);
    const rules = mono(g, 'THE RULES ALLOWED UP TO 30 MINUTES', 150, 790, 30, C.ink);
    const fuel = el('g', {}, g); el('path', { d: 'M -200 0 A 200 200 0 0 1 200 0', stroke: C.ink, 'stroke-width': 26, fill: 'none' }, fuel); const fArc = el('path', { d: '', stroke: C.teal, 'stroke-width': 18, fill: 'none', 'stroke-linecap': 'round' }, fuel); const needle = el('line', { x1: 0, y1: 0, x2: 0, y2: -170, stroke: C.red, 'stroke-width': 10, 'stroke-linecap': 'round' }, fuel); el('circle', { cx: 0, cy: 0, r: 20, fill: C.ink }, fuel); txt(fuel, 'FULL TANK', { x: 0, y: 70, 'font-size': 44, 'font-family': F.sans, fill: C.ink, 'text-anchor': 'middle' });
    const nm = stampEl(g, 'NOT MAGIC', { size: 130, color: C.red, family: F.sans }); cue(T.notMagic + .6, 'stamp'); SHAKES.push([T.notMagic + .6, 22, .4]);
    const ph = line(g, 'PHYSIOLOGY', 140, 560, 80, C.teal), ph2 = line(g, '+ DISCIPLINE', 140, 660, 80, C.red);
    const mon = monitorEl(g, 820, 320); const xb = line(g, 'EXTRA BEATS', 1080, 900, 56, C.red);
    return t => { head(t); const A = t < T.notMagic; show(tank, A); tf(tank, 1480, 1000, pop(t, T.before, .45));
      show(pre, A && t >= T.before); show(prl.g, A && t >= T.before); pre.textContent = Math.round(23 * E.out(seg(t, T.before + .4, T.before + 2.4))) + ' MIN'; charsPop(prl, t, T.before + .8, .015); show(rules, within(t, T.rules, T.notMagic)); op(rules, seg(t, T.rules, T.rules + .3));
      show(fuel, within(t, T.tank, T.notMagic)); tf(fuel, 1020, 700, .8); const fk = E.out(seg(t, T.tank + .3, T.tank + 1.8)), ang = lerp(-90, 80, fk); needle.setAttribute('transform', `rotate(${ang})`);
      const a1 = (ang - 90) * Math.PI / 180; fArc.setAttribute('d', `M -200 0 A 200 200 0 0 1 ${(200 * Math.cos(a1)).toFixed(1)} ${(200 * Math.sin(a1)).toFixed(1)}`);
      stampAnim(nm, t, T.notMagic + .6, 1200, 560, -6); show(nm.g, within(t, T.notMagic, T.edge));
      const P = within(t, T.physio, T.edge); show(ph.g, P); show(ph2.g, P); charsPop(ph, t, T.physio + .4, .04); charsPop(ph2, t, T.physio + 1.6, .04);
      const M = t >= T.edge; show(mon.root, M); tf(mon.root, 140, 470); mon.update(t, lerp(70, 50, seg(t, T.edge, T.monitors + 1.5)), t >= T.monitors + 1.5); show(xb.g, t >= T.monitors + 1.8); charsPop(xb, t, T.monitors + 1.8, .03); };
  });
  // ---------- S7 · the warning ----------
  scene(S[7], S[8], g => {
    bg(g, C.red); halftone(g, { color: C.ink, step: 22, angle: 30, f: edge(900, 1.3), maxK: .55 });
    const tag = el('g', {}, g); el('rect', { x: 0, y: 0, width: 420, height: 60, rx: 8, fill: C.ink }, tag); txt(tag, 'FOR THE RECORD', { x: 24, y: 43, 'font-size': 32, 'font-family': F.mono, 'font-weight': 800, fill: C.honey, 'letter-spacing': 3 }); tf(tag, 140, 140);
    const w = headline(g, 'WARNING', 140, 360, 170, C.cream, C.ink);
    const l1 = line(g, 'BREATHING HARD BEFORE GOING UNDER', 140, 500, 54, C.cream), l2 = line(g, '→ BLACKOUT. NO WARNING.', 140, 590, 54, C.honey);
    const l3 = line(g, 'PEOPLE DROWN THIS WAY IN POOLS.', 140, 700, 54, C.cream);
    const dont = stampEl(g, 'DO NOT TRY THIS', { size: 120, color: C.cream, family: F.sans }); cue(T.dont + .5, 'bigstamp'); SHAKES.push([T.dont + .5, 26, .45]); FLASHES.push(T.dont + .5);
    return t => { charsPop(w, t, T.warning, .05); show(l1.g, t >= T.breathing); charsPop(l1, t, T.breathing, .012); show(l2.g, t >= T.breathing + 2.2); charsPop(l2, t, T.breathing + 2.2, .02);
      show(l3.g, t >= T.pools); charsPop(l3, t, T.pools, .015); stampAnim(dont, t, T.dont + .5, 1000, 880, -4); };
  });
  // ---------- S8 · the verdict ----------
  scene(S[8], S[9], g => {
    bg(g, C.paper); halftone(g, { color: C.teal, step: 22, angle: 70, f: radial(960, 560, 900, 1.2), maxK: .55 }).setAttribute('class', 'mul');
    const v = headline(g, 'THE VERDICT', 140, 260, 150);
    const bars = [['BLAINE · 2008', 1024, C.ink, T.months - .3], ['SIETAS · SEP 2008', 1039, C.teal, T.months + 1.2], ['MARIČIĆ · 2025', 1743, C.red, T.today + .3]].map(([s, sec, col, t0], i) => { const b = el('g', {}, g); const r = el('rect', { x: 0, y: 0, width: 0, height: 70, rx: 10, fill: col }, b);
      mono(b, s, 0, -14, 28, C.ink); const v2 = txt(b, fmtClock(sec), { x: 0, y: 54, 'font-size': 52, 'font-family': F.bagel, fill: C.ink }); tf(b, 140, 450 + i * 150); return { b, r, v2, w: sec * .85, t0 }; });
    const ox = mono(g, 'ALL OXYGEN-ASSISTED · GUINNESS WORLD RECORDS', 140, 880, 26, C.teal);
    const fall = line(g, 'RECORDS FALL.', 140, 960, 60, C.red);
    const two = [['2006', 428, C.ink], ['2008', 1024, C.red]].map(([y, sec, col], i) => { const b = el('g', {}, g); const r = el('rect', { x: 0, y: 0, width: 0, height: 110, rx: 12, fill: col }, b); txt(b, y, { x: 0, y: -18, 'font-size': 40, 'font-family': F.sans, fill: C.ink }); const tt = txt(b, fmtClock(sec), { x: 0, y: 84, 'font-size': 76, 'font-family': F.bagel, fill: C.cream }); tf(b, 140, 470 + i * 220); return { b, r, tt, w: sec * 1.4 }; });
    const gap = mono(g, '+ ALMOST TEN MINUTES · TWO YEARS', 140, 960, 34, C.teal);
    const nb = line(g, 'HE WAS NOT BORN DIFFERENT.', 140, 500, 66);
    const st = stampEl(g, 'BUILT DIFFERENT', { size: 150, color: C.red, family: F.sans }); cue(ess, 'bigstamp'); SHAKES.push([ess, 28, .45]); FLASHES.push(ess);
    const ob = line(g, 'ONE BREATH AT A TIME.', 960, 920, 70, C.teal, 'middle');
    return t => { charsPop(v, t, T.verdict, .05);
      const A = within(t, T.months, T.lesson); bars.forEach(o => { show(o.b, A); const k = E.out(seg(t, o.t0, o.t0 + 1)); o.r.setAttribute('width', (o.w * k).toFixed(0)); o.v2.setAttribute('x', (o.w * k + 20).toFixed(0)); }); show(ox, A); op(ox, seg(t, T.today + 1.2, T.today + 1.5));
      show(fall.g, within(t, T.fall, T.lesson)); charsPop(fall, t, T.fall, .04);
      const L = within(t, T.lesson, T.notBorn); two.forEach((o, i) => { show(o.b, L); const k = E.out(seg(t, T.lesson + .6 + i * 1.6, T.lesson + 1.6 + i * 1.6)); o.r.setAttribute('width', (o.w * k).toFixed(0)); o.tt.setAttribute('x', 24); op(o.tt, k); }); show(gap, L); op(gap, seg(t, T.between + 1.5, T.between + 1.8));
      show(nb.g, within(t, T.notBorn, ess)); charsPop(nb, t, T.notBorn, .025);
      stampAnim(st, t, ess, 960, 600, -5); show(st.g, t >= ess - .1); show(ob.g, t >= T.oneBreath); charsPop(ob, t, T.oneBreath, .03); };
  });
  // ---------- S9 · the drawer ----------
  scene(S[9], S[11], g => {
    bg(g, C.ink); halftone(g, { color: C.night2, step: 24, angle: 20, f: edge(860, 1.2), maxK: .7 });
    const drawer = el('g', {}, g); el('rect', { x: 260, y: 520, width: 1400, height: 420, rx: 16, fill: '#6b4f3a', stroke: C.cream, 'stroke-width': 6 }, drawer);
    for (let i = 0; i < 18; i++) { const x = 300 + i * 74; el('rect', { x, y: 440, width: 64, height: 480, rx: 6, fill: '#E9D9B6', stroke: C.ink, 'stroke-width': 4 }, drawer); txt(drawer, 'BD', { x: x + 40, y: 470, 'font-size': 22, 'font-family': F.mono, 'font-weight': 800, fill: C.ink, transform: `rotate(90 ${x + 40} 470)` }); }
    const folder = el('g', {}, g); el('rect', { x: -230, y: -160, width: 460, height: 320, rx: 12, fill: C.water, stroke: C.ink, 'stroke-width': 7 }, folder); el('rect', { x: -230, y: -196, width: 180, height: 50, rx: 8, fill: C.water, stroke: C.ink, 'stroke-width': 7 }, folder);
    txt(folder, 'CASE 009', { x: 0, y: -30, 'font-size': 60, 'font-family': F.sans, fill: C.ink, 'text-anchor': 'middle' }); txt(folder, 'THE BREATH', { x: 0, y: 50, 'font-size': 60, 'font-family': F.serif, fill: C.ink, 'text-anchor': 'middle' });
    const closed = stampEl(g, 'CASE CLOSED', { size: 110, color: C.red, family: F.sans }); const tc = S[9] + .5; cue(tc, 'stamp'); cue(tc + 1.3, 'drawer');
    const pr = chars(g, 'PRODUCED BY RELENTLESS AARON', { x: 960, y: 220, size: 64, family: F.sans, weight: 400, fill: C.honey, anchor: 'middle' });
    const title = chars(g, 'BUILT DIFFERENT', { x: 960, y: 420, size: 140, family: F.serif, weight: 400, fill: C.cream, anchor: 'middle', shadow: { fill: C.red, dx: 8, dy: 8 } });
    const end = END + .6;
    return t => { const slide = E.io(seg(t, tc + 1.3, tc + 2.5)); tf(folder, lerp(960, 1700, slide), lerp(560, 640, slide), lerp(1, .3, slide), lerp(-3, 0, slide)); op(folder, 1 - seg(t, tc + 2.3, tc + 2.6));
      stampAnim(closed, t, tc, 960, 600, -8); op(closed.g, t < tc + 1.3 ? .93 : 0); charsPop(pr, t, T.produced, .02);
      tf(drawer, 0, lerp(700, 0, E.back(seg(t, tc + .9, tc + 1.4)))); charsPop(title, t, Math.max(end, tc + 2.6) + .2, .05); };
  });

  // ---------- HUD ----------
  const hudG = el('g', {}, hud); const caseNo = txt(hudG, 'BUILT DIFFERENT · CASE No.009', { x: 60, y: 62, 'font-size': 22, 'font-family': F.mono, 'font-weight': 800 });
  const chip = el('g', {}, hudG), chipBg = el('rect', { x: 60, y: 76, height: 40, rx: 6 }, chip), chipA = txt(chip, '', { x: 74, y: 105, 'font-size': 24, 'font-family': F.sans }), chipB = txt(chip, '', { y: 105, 'font-size': 24, 'font-family': F.sans });
  const date = el('g', {}, hudG), dateBg = el('rect', { x: 1690, y: 40, width: 170, height: 50, rx: 8, fill: 'none', 'stroke-width': 4 }, date), rec = el('circle', { cx: 1716, cy: 65, r: 9, fill: C.red }, date), dateT = txt(date, '2026.11', { x: 1736, y: 75, 'font-size': 28, 'font-family': F.mono, 'font-weight': 800 });
  const chips = [[S[2], S[3], 'EXHIBIT 01', 'FAILURE'], [S[3], S[4], 'EXHIBIT 02', 'BODY'], [S[4], S[5], 'EXHIBIT 03', 'REFLEX'], [S[5], S[6], 'EXHIBIT 04', 'BURN'], [S[6], S[7], 'EXHIBIT 05', 'FINE PRINT'], [S[7], S[8], 'NOTICE', 'WARNING'], [S[8], S[9], 'RULING', 'VERDICT']];
  hudUpdate = t => { const c = chips.find(c => t >= c[0] && t < c[1]); show(hudG, !!c); if (!c) return; const dark = (t >= S[5] && t < S[6]) || (t >= S[7] && t < S[8]), ink = dark ? C.cream : C.ink;
    caseNo.setAttribute('fill', ink); chipBg.setAttribute('fill', dark ? C.cream : C.ink); chipA.textContent = c[2]; chipA.setAttribute('fill', dark ? C.red : C.honey); chipB.textContent = c[3]; chipB.setAttribute('fill', dark ? C.ink : C.cream);
    const wa = measure(c[2], 24, F.sans, 400), wb = measure(c[3], 24, F.sans, 400); chipB.setAttribute('x', 74 + wa + 14); chipBg.setAttribute('width', wa + wb + 42); dateBg.setAttribute('stroke', ink); dateT.setAttribute('fill', ink); op(rec, Math.floor(t * 2) % 2 ? .25 : 1); };

  // ---------- caption bar ----------
  const KEY = /^(\d[\d,]*\+?|seventeen|seven|eight|four|minutes|seconds|fifty|thirtyeight|twentythree|twentynine|oxygen|carbon|dioxide|alarm|fire|reflex|spleen|heart|data|chains|warning|physiology|discipline|different|breath|possible|failure|calm)$/i;
  const groups = []; let gg = []; for (const w of WD) { if (gg.length && (gg.length >= 8 || /[.,!?:;]$/.test(gg[gg.length - 1].w) || w.s - gg[gg.length - 1].e > .45)) { groups.push(gg); gg = []; } gg.push(w); } if (gg.length) groups.push(gg);
  const CAPS = groups.map((ws, gi) => { const parts = []; ws.forEach((w, i) => parts.push([w.w + (i < ws.length - 1 ? ' ' : ''), KEY.test(norm(w.w)) ? C.honey : null])); const c = caption(hud, parts, { x: 960, y: 1010, size: 40 }); show(c.g, false); return { c, t0: ws[0].s - .05, t1: Math.min(ws[ws.length - 1].e + .35, groups[gi + 1] ? groups[gi + 1][0].s - .05 : 1e9) }; });
  capUpdate = t => CAPS.forEach(k => { const on = t >= k.t0 && t < k.t1 && t < END + .3; show(k.c.g, on); if (on) captionAnim(k.c, t, k.t0); });

  // ---------- dot wipe ----------
  const dotsG = el('g', {}, wipe), wipeDots = []; for (let y = 0; y <= 1160; y += 80) for (let x = 0; x <= 2000; x += 80) wipeDots.push({ e: el('circle', { cx: x, cy: y, r: 0 }, dotsG), x, y });
  wipeUpdate = t => { const w = WIPES.find(([b]) => Math.abs(t - b) < .22); show(dotsG, !!w); if (!w) return; dotsG.setAttribute('fill', w[1]); const u = (t - w[0] + .22) / .44;
    wipeDots.forEach(d => { const delay = (d.x / 1920 * .6 + d.y / 1080 * .4) * .35, p = clamp((u - delay) / .65); d.e.setAttribute('r', (Math.sin(p * Math.PI) * 62).toFixed(1)); }); };
  buildVertical({ title: 'BUILT DIFFERENT', caseNo: 'CASE No.009 · THE 17-MINUTE BREATH', chips, KEY });
  window.EV = EV.sort((a, b) => a.t - b.t);
}
