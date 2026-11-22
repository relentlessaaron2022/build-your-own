// THE ANT KINGDOM: "When the little ones come together, even giants fall." Produced by Relentless Aaron.
// One camera glides over one dark evidence board: prints, case-file stamps, big numbers, a pheromone trail, a map.
// Every item lands on the narrator's word (audio/words.json). window.EV lists the cues for the sound effects.
const W = 1920, H = 1080, cv = document.getElementById('out'), ctx = cv.getContext('2d');
const F = { a: s => `400 ${s}px Anton`, b8: s => `800 ${s}px Barlow`, b6: s => `600 ${s}px Barlow`, m: s => `500 ${s}px Plex`, h: s => `600 ${s}px Caveat` };
await Promise.all([F.a(40), F.b8(40), F.b6(40), F.m(30), F.h(40)].map(f => document.fonts.load(f)));
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - x, 3), eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, back = x => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const K = { ink: '#efe6d2', dim: '#8d8576', red: '#d23a2a', gold: '#e8b54a', board: '#1a1714', paper: '#f3ecdd' };

// ---------- the voice ----------
const OFF = 1.5;
const WD = (await (await fetch('audio/words.json')).json()).words.map(w => ({ ...w, s: w.s + OFF, e: w.e + OFF }));
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function at(phrase, after = 0) { const q = phrase.split(' ').map(norm).filter(Boolean);
  for (let i = 0; i < WD.length; i++) { if (WD[i].s < after) continue; if (q.every((x, j) => WD[i + j] && norm(WD[i + j].w) === x)) return WD[i].s; } throw new Error('phrase not found: ' + phrase); }
const END = WD[WD.length - 1].e, CRED = END + 1.2, DUR = Math.ceil((CRED + 14) * 10) / 10;
const speaking = t => WD.some(w => t >= w.s && t < w.e);

// ---------- the photos, graded once into one warm, slightly faded look ----------
const CREDITS = await (await fetch('photos/credits.json')).json();
const IMG = {}; await Promise.all(CREDITS.map(c => new Promise(r => { const i = new Image(); i.onload = () => { const g = document.createElement('canvas'); g.width = i.width; g.height = i.height; const x = g.getContext('2d');
  x.filter = c.key === 'europe_map' ? 'grayscale(1) sepia(.55) contrast(1.15) brightness(.92)' : 'saturate(.78) contrast(1.06) sepia(.16) brightness(.97)'; x.drawImage(i, 0, 0); IMG[c.key] = g; r(); }; i.src = 'photos/' + c.file; })));

// ---------- the world: nine clusters on one board ----------
const CL = { open: [0, 0], nums: [2600, 0], nobody: [5200, 0], tools: [5200, 1700], army: [0, 1700], farm: [2600, 1700], raft: [0, 3400], empire: [2600, 3400], lesson: [5200, 3400] };
const P = (c, x, y) => [CL[c][0] + x, CL[c][1] + y];
const EV = [], ev = (t, kind) => { EV.push({ t: +t.toFixed(3), kind }); return t; };
const items = [];
const add = (o) => { items.push(o); return o; };
// item builders (positions in world px; `t` = when it lands)
const photo = (c, key, x, y, w, rot, t, cap) => add({ k: 'photo', c, key, p: P(c, x, y), w, rot, t: ev(t, 'drop'), cap });
const title = (c, s, x, y, size, col, t, align = 'left') => add({ k: 'title', c, s, p: P(c, x, y), size, col, t: ev(t, 'slam'), align });
const note = (c, s, x, y, size, col, t, align = 'left') => add({ k: 'note', c, s, p: P(c, x, y), size, col, t, align });
const stamp = (c, s, x, y, rot, col, t, size = 70) => add({ k: 'stamp', c, s, p: P(c, x, y), rot, col, size, t: ev(t, 'stamp') });
const card = (c, lines, x, y, w, t, head) => add({ k: 'card', c, lines, p: P(c, x, y), w, t: ev(t, 'drop'), head });
const counter = (c, to, x, y, size, col, t, dur, fmt) => add({ k: 'counter', c, to, p: P(c, x, y), size, col, t: ev(t, 'count'), dur, fmt });
const string = (a, b, t) => add({ k: 'string', a, b, t: ev(t, 'string') });

// --- cold open ---
const T0 = at('Look closely.');
photo('open', 'cockroach_ants', 100, 420, 1050, -.02, T0 - .6);
note('open', 'a giant, by any measure', 1290, 420, 64, K.ink, at('A giant, by any'));
title('open', 'HOW IS THAT EVEN POSSIBLE?', 1290, 640, 76, K.ink, at('How is that even possible?'));
note('open', 'none of them is alone', 1290, 760, 64, K.gold, at('But none of them is alone.'));
title('open', 'WHEN THE LITTLE ONES COME TOGETHER,', 160, 1120, 96, K.ink, at('When the little ones come together,'));
title('open', 'EVEN GIANTS FALL.', 160, 1240, 140, K.red, at('even giants fall.'));
stamp('open', 'THE ANT KINGDOM', 1560, 1200, -.06, K.gold, at('of the ant kingdom.'), 74);
// --- the numbers ---
note('nums', 'start with the numbers', 120, 140, 70, K.gold, at('Start with the numbers,'));
card('nums', ['~500 studies', 'every continent', 'every major habitat'], 120, 230, 560, at('nearly five hundred studies'), 'PNAS · 2022');
counter('nums', 20000000000000000, 120, 900, 120, K.ink, at('about twenty quadrillion ants'), 3.2, n => Math.round(n).toLocaleString('en-US'));
title('nums', '≈ 20 QUADRILLION ANTS', 120, 1010, 84, K.gold, at('A twenty, followed by fifteen'));
stamp('nums', 'CONSERVATIVE', 1720, 960, .06, K.red, at('And they called that number') + 1.2, 64);
counter('nums', 2.5, 900, 260, 220, K.gold, at('That is roughly two and'), 1.6, n => n.toFixed(1) + 'M');
note('nums', 'ants for every human being', 910, 330, 58, K.ink, at('That is roughly two and') + .8);
add({ k: 'bars', c: 'nums', p: P('nums', 900, 640), t: ev(at('Put them all on a scale,'), 'drop'), t2: at('ants outweigh every wild bird') });
title('nums', '12,000+ SPECIES', 120, 1200, 90, K.ink, at('Scientists have named more than'));
note('nums', 'every continent but Antarctica', 120, 1275, 58, K.dim, at('They live on every continent'));
photo('nums', 'colony', 1450, 1080, 560, .03, at('They were here long before'), 'working together the entire time');
// --- nobody is in charge: the trail ---
title('nobody', 'WHO IS IN CHARGE?', 120, 220, 110, K.ink, at('Who is in charge?'));
title('nobody', 'NOBODY.', 120, 400, 190, K.red, at('Nobody.'));
card('nobody', ['lays eggs', 'gives no orders', 'draws no plan'], 120, 520, 520, at('The queen does not give orders.'), 'THE QUEEN');
note('nobody', 'the colony runs on signals', 760, 560, 70, K.gold, at('Instead, the colony runs on signals.'));
add({ k: 'trail', c: 'nobody', p: P('nobody', 760, 700), t: ev(at('When a worker finds food,'), 'string'), t1: at('Other workers follow it.'), t2: at('If the food is good,'), t3: at('When the food runs out,') });
title('nobody', 'NO MEETING. NO MEMO.', 760, 1240, 80, K.ink, at('No meeting.'));
photo('nobody', 'ant_trail', 1500, 230, 560, .04, at('Ants talk through chemicals'), 'pheromone trail');
stamp('nobody', 'ALARM', 1760, 1000, -.08, K.red, at('An alarm.'), 90);
// --- tools: mandibles, collective behavior ---
photo('tools', 'mandibles', 120, 140, 760, -.03, at('Then there are the tools.'), 'mandibles: grip · bite · cut · carry');
note('tools', 'one set is small…', 1000, 260, 70, K.ink, at('One set of mandibles is small.'));
note('tools', '…a thousand sets are something else', 1000, 350, 70, K.gold, at('A thousand sets,'));
photo('tools', 'cockroach_ants', 1050, 470, 700, .03, at('That is what you are seeing'));
note('tools', 'often already weakened or injured', 1060, 1040, 54, K.dim, at('Often, the insect is already'));
title('tools', 'COLLECTIVE BEHAVIOR', 120, 1180, 120, K.gold, at('Collective behavior.'));
note('tools', 'simple local rules → problems no single ant could understand', 120, 1270, 54, K.ink, at('Each ant follows simple,'));
// --- case file 1: the army ---
stamp('army', 'CASE FILE 01 · THE ARMY', 520, 150, -.03, K.red, at('Case file one.'), 70);
photo('army', 'army_ants', 120, 280, 760, -.02, at('In the rainforests of Central'), 'Eciton burchellii');
title('army', 'HUNDREDS OF THOUSANDS', 980, 380, 88, K.ink, at('hundreds of thousands of workers.'));
photo('army', 'bivouac', 1000, 470, 420, .04, at('Each night, they build one,'), 'living structures');
title('army', 'THE BIVOUAC', 1480, 640, 80, K.gold, at('They call it a bivouac.'));
note('army', 'a nest made of their own bodies', 1480, 710, 50, K.ink, at('They call it a bivouac.') + .6);
photo('army', 'carry', 120, 900, 700, .02, at('By day, they raid.'), 'raid: carrying captured prey');
title('army', 'SWARM FRONT: UP TO 10 M WIDE', 900, 1220, 80, K.red, at('A swarm front up to ten'));
// --- case file 2: the farmers ---
stamp('farm', 'CASE FILE 02 · THE FARMERS', 560, 150, .03, K.red, at('Case file two.'), 70);
title('farm', '~50 MILLION YEARS OF FARMING', 120, 380, 92, K.gold, at('around fifty million years ago.'));
add({ k: 'timeline', c: 'farm', p: P('farm', 120, 470), t: ev(at('By many scientific estimates,'), 'string') });
photo('farm', 'leafcutter', 120, 640, 760, -.03, at('Leafcutter ants carry pieces'), 'leafcutter ants');
photo('farm', 'fungus', 1000, 640, 760, .03, at('to feed underground gardens of fungus.'), 'the fungus garden');
note('farm', 'the fungus feeds the colony · the colony tends the fungus', 300, 1260, 58, K.ink, at('The fungus feeds the colony.'));
// --- case file 3: the raft ---
stamp('raft', 'CASE FILE 03 · THE RAFT', 520, 150, -.04, K.red, at('Case file three.'), 70);
photo('raft', 'fire_ant', 120, 300, 640, -.03, at('When floods come,'), 'one fire ant');
photo('raft', 'fire_raft', 860, 300, 900, .02, at('But a colony does something remarkable.'), 'a living raft after heavy rain');
note('raft', 'claws · jaws · sticky foot pads', 860, 1000, 56, K.ink, at('The ants grip each other'));
note('raft', 'afloat for days, even weeks', 860, 1080, 56, K.gold, at('Researchers have watched these rafts'));
title('raft', 'NO ANT BUILT THE RAFT.', 120, 1200, 96, K.ink, at('No ant built that raft.'));
title('raft', 'EVERY ANT IS THE RAFT.', 120, 1320, 96, K.gold, at('Every ant is the raft.'));
// --- case file 4: the empire ---
stamp('empire', 'CASE FILE 04 · THE EMPIRE', 560, 150, .04, K.red, at('Case file four.'), 70);
photo('empire', 'argentine', 120, 300, 520, -.04, at('A little brown ant from'), 'the Argentine ant');
note('empire', 'arrived ~a century ago, probably on ships', 120, 800, 50, K.ink, at('arrived in Europe about a'));
photo('empire', 'europe_map', 760, 260, 1000, .01, at('Today, one of its supercolonies') - .6);
add({ k: 'route', c: 'empire', p: P('empire', 760, 260), w: 1000, t: ev(at('about six thousand kilometers'), 'string'), dur: 3.2 });
title('empire', '~6,000 KM', 1250, 1250, 120, K.red, at('about six thousand kilometers') + 1);
card('empire', ['same supercolony: no fighting', 'rival supercolony: to the death'], 120, 980, 620, at('Inside that supercolony,'), 'THE RULE');
stamp('empire', 'TO THE DEATH', 450, 1290, -.05, K.red, at('they fight to the death.'), 64);
// --- the lesson ---
photo('lesson', 'weaver', 1300, 160, 640, .03, at('So what does all of this mean'), 'weaver ants, building together');
title('lesson', 'THE BIGGEST DOESN\'T ALWAYS WIN.', 120, 260, 80, K.ink, at('The biggest creature does not always win.'));
title('lesson', 'THE STRONGEST DOESN\'T ALWAYS SURVIVE.', 120, 370, 80, K.ink, at('The strongest individual does not'));
[['COMMUNITY', 'Think about that in your community.'], ['FAMILY', 'In your family.'], ['BUSINESS', 'In your business.'], ['MOVEMENT', 'In any movement']].forEach(([s, p], i) => stamp('lesson', s, 260 + i * 300, 560 + (i % 2) * 70, (i % 2 ? .05 : -.05), i % 2 ? K.gold : K.red, at(p), 54));
note('lesson', 'do your part · follow the signal · hold on to the ones beside you', 120, 800, 58, K.ink, at('Nobody needs to see the whole'));
title('lesson', 'ONE ANT IS SMALL.', 120, 1000, 130, K.ink, at('One ant is small.'));
title('lesson', 'A THOUSAND ANTS ARE A FORCE.', 120, 1160, 130, K.gold, at('A thousand ants are a force.'));
// red string ties the case files back to the opening
string(P('open', 1050, 900), P('army', 500, 280), at('To see how far that idea goes,'));
string(P('army', 1700, 900), P('farm', 400, 640), at('Case file two.') - .4);
string(P('farm', 900, 1300), P('raft', 400, 300), at('Case file three.') - .4);
string(P('raft', 1700, 900), P('empire', 900, 300), at('Case file four.') - .4);
string(P('empire', 1700, 1000), P('lesson', 200, 260), at('So what does all of this mean'));

// ---------- the camera: one shot per beat (centre x, centre y, view width) ----------
const SH = [
  [0, 'open', 1050, 900, 2600], [T0, 'open', 1000, 720, 1500], [at('A giant, by any'), 'open', 1250, 700, 1900], [at('When the little ones come together,'), 'open', 1050, 1150, 2300], [at('of the ant kingdom.'), 'open', 1050, 900, 2500],
  [at('Start with the numbers,') - .5, 'nums', 700, 560, 1700], [at('about twenty quadrillion ants'), 'nums', 1000, 900, 2000], [at('That is roughly two and'), 'nums', 1350, 450, 1500], [at('Put them all on a scale,'), 'nums', 1350, 700, 1500], [at('Scientists have named more than'), 'nums', 1100, 1100, 2100],
  [at('So here is the question.') - .4, 'nobody', 700, 450, 1700], [at('The queen does not give orders.'), 'nobody', 700, 650, 1600], [at('Instead, the colony runs on signals.'), 'nobody', 1250, 850, 1800], [at('Ants talk through chemicals'), 'nobody', 1500, 600, 1900], [at('When a worker finds food,'), 'nobody', 1300, 900, 1500], [at('No meeting.'), 'nobody', 1200, 1050, 1900], [at('And when danger appears,'), 'nobody', 1500, 900, 1600],
  [at('Then there are the tools.') - .4, 'tools', 600, 520, 1500], [at('One set of mandibles is small.'), 'tools', 1100, 450, 1700], [at('That is what you are seeing'), 'tools', 1400, 760, 1500], [at('Scientists have a name for this.'), 'tools', 900, 1050, 2100],
  [at('To see how far that idea goes,'), 'open', 2400, 1500, 5200],
  [at('Case file one.'), 'army', 800, 520, 1900], [at('Each night, they build one,'), 'army', 1350, 650, 1500], [at('By day, they raid.'), 'army', 900, 1050, 1900],
  [at('Case file two.'), 'farm', 900, 450, 1800], [at('Leafcutter ants carry pieces'), 'farm', 950, 900, 2000],
  [at('Case file three.'), 'raft', 900, 500, 1800], [at('But a colony does something remarkable.'), 'raft', 1300, 650, 1500], [at('No ant built that raft.'), 'raft', 900, 1100, 1900],
  [at('Case file four.'), 'empire', 600, 450, 1500], [at('Today, one of its supercolonies'), 'empire', 1260, 760, 1500], [at('Inside that supercolony,'), 'empire', 800, 1080, 1800],
  [at('So what does all of this mean'), 'lesson', 1000, 450, 2000], [at('Think about that in your community.'), 'lesson', 900, 620, 1700], [at('One ant is small.'), 'lesson', 900, 1080, 1900],
  [at('And maybe that is the real magic.'), 'open', 3600, 2300, 8600],
];
SH.forEach(s => ev(s[0], 'whoosh'));
const shot = t => { let i = 0; while (i + 1 < SH.length && t >= SH[i + 1][0]) i++; return i; };
const camAt = i => { const [, c, x, y, w] = SH[i]; return [CL[c][0] + x, CL[c][1] + y, w]; };
function camera(t) { const i = shot(t), a = camAt(Math.max(0, i - 1)), b = camAt(i), k = i ? eio(seg(t, SH[i][0], SH[i][0] + 1.9)) : 1, drift = .02 * seg(t, SH[i][0], (SH[i + 1] || [DUR])[0]);
  let w = lerp(a[2], b[2], k) * (1 - drift); const far = Math.hypot(b[0] - a[0], b[1] - a[1]); if (far > 1500 && k > 0 && k < 1) w *= 1 + .35 * Math.sin(Math.PI * k);   // long moves pull back mid-flight
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), w, SH[i][1]]; }

// ---------- drawing ----------
const BOARD = (() => { const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'); g.fillStyle = K.board; g.fillRect(0, 0, 1024, 1024); const id = g.getImageData(0, 0, 1024, 1024), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (hash(i * .37) - .5) * 14 + (hash(Math.floor(i / 4096) * 3.1) - .5) * 6; d[i] += n; d[i + 1] += n * .9; d[i + 2] += n * .7; } g.putImageData(id, 0, 0); return ctx.createPattern(c, 'repeat'); })();
function txt(s, x, y, font, col, align = 'left') { ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y); }
function drawItem(o, t, focus) { if (t < o.t - .05 && o.k !== 'trail') return; const k = seg(t, o.t, o.t + .45), dimA = o.c && o.c !== focus ? .38 : 1;
  ctx.save(); ctx.globalAlpha = dimA;
  if (o.k === 'photo') { const im = IMG[o.key]; if (!im) { ctx.restore(); return; } const w = o.w, h = w * im.height / im.width, [x, y] = o.p, pad = w * .035, cap = o.cap ? 54 : 0, s = lerp(1.08, 1, eo(k));
    ctx.translate(x + w / 2, y + h / 2); ctx.rotate(o.rot); ctx.scale(s, s); ctx.globalAlpha = dimA * clamp(k * 2.2);
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; ctx.fillStyle = K.paper; ctx.fillRect(-w / 2 - pad, -h / 2 - pad, w + 2 * pad, h + 2 * pad + cap); ctx.shadowColor = 'transparent';
    ctx.drawImage(im, -w / 2, -h / 2, w, h); if (o.cap) txt(o.cap, -w / 2, h / 2 + pad + 38, F.h(40), '#3a332a');
    ctx.fillStyle = K.red; ctx.beginPath(); ctx.arc(0, -h / 2 - pad + 14, 11, 0, 7); ctx.fill(); }
  else if (o.k === 'title') { const sc = lerp(1.25, 1, back(k)); ctx.translate(o.p[0], o.p[1]); ctx.scale(sc, sc); ctx.globalAlpha = dimA * clamp(k * 3); txt(o.s, 0, 0, F.a(o.size), o.col, o.align); }
  else if (o.k === 'note') { const n = Math.ceil(o.s.length * seg(t, o.t, o.t + o.s.length * .035)); txt(o.s.slice(0, n), o.p[0], o.p[1], F.h(o.size), o.col, o.align); }
  else if (o.k === 'stamp') { const sc = lerp(1.9, 1, eo(seg(t, o.t, o.t + .18))); ctx.translate(o.p[0], o.p[1]); ctx.rotate(o.rot); ctx.scale(sc, sc); ctx.globalAlpha = dimA * clamp(k * 5) * .92; ctx.font = F.a(o.size); const w = ctx.measureText(o.s).width + 60, h = o.size * 1.35;
    ctx.strokeStyle = o.col; ctx.lineWidth = 7; ctx.strokeRect(-w / 2, -h / 2, w, h); ctx.lineWidth = 2; ctx.strokeRect(-w / 2 + 9, -h / 2 + 9, w - 18, h - 18); txt(o.s, 0, o.size * .36, F.a(o.size), o.col, 'center'); }
  else if (o.k === 'card') { const [x, y] = o.p, h = 110 + o.lines.length * 66; ctx.translate(x, y + (1 - eo(k)) * 40); ctx.globalAlpha = dimA * clamp(k * 2); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14; ctx.fillStyle = K.paper; ctx.fillRect(0, 0, o.w, h); ctx.shadowColor = 'transparent';
    ctx.fillStyle = K.red; ctx.fillRect(0, 0, o.w, 64); txt(o.head, 28, 46, F.a(40), '#fff'); o.lines.forEach((l, j) => { if (t > o.t + .3 + j * .35) txt('— ' + l, 28, 130 + j * 66, F.b6(42), '#2a241c'); }); }
  else if (o.k === 'counter') { const v = o.to * eo(seg(t, o.t, o.t + o.dur)); ctx.globalAlpha = dimA * clamp(k * 3); txt(o.fmt(v), o.p[0], o.p[1], F.a(o.size), o.col); }
  else if (o.k === 'bars') { const [x, y] = o.p, k2 = eo(seg(t, o.t2, o.t2 + 1.4)); ctx.globalAlpha = dimA * clamp(k * 2); txt('BIOMASS', x, y - 160, F.m(30), K.dim);
    [['ANTS', 1, K.gold], ['WILD BIRDS + WILD MAMMALS, COMBINED', .82, K.dim]].forEach(([l, v, c], j) => { const yy = y - 100 + j * 120; ctx.fillStyle = c; ctx.fillRect(x, yy, 900 * v * (j ? eo(k) : k2), 70); txt(l, x, yy + 110 - 6, F.b8(34), K.ink); }); }
  else if (o.k === 'trail') { // food at the right, nest at the left; dots walk the trail, which thickens, then fades when the food runs out
    const [x, y] = o.p, len = 1100, pts = []; for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([x + u * len, y + 220 + Math.sin(u * 6.3) * 110 - u * 60]); }
    const grow = seg(t, o.t, o.t + 1.5), str = 2 + 14 * seg(t, o.t2, o.t2 + 3) * (1 - seg(t, o.t3, o.t3 + 2.5));
    if (t > o.t - .3) { ctx.globalAlpha = dimA * clamp(seg(t, o.t - .3, o.t + .3)); ctx.fillStyle = K.gold; ctx.beginPath(); ctx.arc(x + len + 50, y + 160, 40 * (1 - .7 * seg(t, o.t3, o.t3 + 2)), 0, 7); ctx.fill(); txt('FOOD', x + len + 50, y + 260, F.a(40), K.gold, 'center');
      ctx.fillStyle = '#5a4a36'; ctx.beginPath(); ctx.ellipse(x - 40, y + 230, 70, 44, 0, 0, 7); ctx.fill(); txt('NEST', x - 40, y + 330, F.a(40), K.ink, 'center');
      ctx.strokeStyle = 'rgba(232,181,74,.55)'; ctx.lineWidth = str; ctx.lineCap = 'round'; ctx.beginPath(); pts.slice(0, Math.max(2, Math.ceil(61 * grow))).forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke();
      const n = Math.floor(2 + 34 * seg(t, o.t1, o.t2 + 3) * (1 - .9 * seg(t, o.t3, o.t3 + 3))); ctx.fillStyle = K.ink; for (let i = 0; i < n; i++) { const u = ((t * .12 + hash(i)) % 1) * grow, p = pts[Math.floor(u * 60)]; ctx.beginPath(); ctx.ellipse(p[0], p[1], 7, 4, 0, 0, 7); ctx.fill(); }
      if (t > o.t2) txt('the best route simply gets louder', x + 200, y + 40, F.h(52), K.gold); } }
  else if (o.k === 'timeline') { const [x, y] = o.p, k2 = eo(seg(t, o.t, o.t + 2.4)); ctx.globalAlpha = dimA; ctx.strokeStyle = K.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1500 * k2, y); ctx.stroke();
    txt('ANT FARMING BEGINS', x, y + 60, F.b8(32), K.gold); if (k2 > .97) { ctx.fillStyle = K.red; ctx.fillRect(x + 1497, y - 20, 6, 40); txt('HUMANS ↓', x + 1500, y - 34, F.b8(30), K.red, 'right'); txt('NOW', x + 1500, y + 60, F.b8(32), K.ink, 'right'); } }
  else if (o.k === 'route') { // the supercolony along the coast, Italy → the Atlantic coast of Spain (map pixel coordinates of the 1524 px map)
    const sc = o.w / 1524, R = [[527, 1033], [440, 1035], [380, 1050], [333, 1068], [267, 1120], [233, 1135], [200, 1173], [147, 1240], [100, 1253], [53, 1230], [27, 1150], [33, 1060], [53, 993]].map(([a, b]) => [o.p[0] + a * sc, o.p[1] + b * sc]);
    const k2 = seg(t, o.t, o.t + o.dur); if (k2 > 0) { ctx.strokeStyle = K.red; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = K.red; ctx.shadowBlur = 20; ctx.beginPath(); const n = Math.max(2, Math.ceil(R.length * k2)); R.slice(0, n).forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.stroke(); ctx.shadowBlur = 0;
      txt('ITALY', R[0][0] + 10, R[0][1] - 26, F.a(46), K.red); if (k2 > .95) txt('ATLANTIC SPAIN', R[R.length - 1][0] - 10, R[R.length - 1][1] - 30, F.a(40), K.red); } }
  else if (o.k === 'string') { const k2 = eo(seg(t, o.t, o.t + 1.2)), fade = 1 - seg(t, o.t + 6, o.t + 9); if (k2 > 0 && fade > 0) { ctx.globalAlpha = .85 * fade; ctx.strokeStyle = K.red; ctx.lineWidth = 6; const [a, b] = [o.a, o.b], mx = (a[0] + b[0]) / 2, my = Math.max(a[1], b[1]) + 220;
      ctx.beginPath(); for (let i = 0; i <= 40 * k2; i++) { const u = i / 40, px = (1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * mx + u * u * b[0], py = (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * my + u * u * b[1]; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); } }
  ctx.restore(); }
// captions: white on a black bar, the spoken word in gold
const CAP = (() => { const out = []; let g = []; for (const w of WD) { if (g.length && (g.length >= 8 || /[.,!?:;]$/.test(g[g.length - 1].w) || w.s - g[g.length - 1].e > .45)) { out.push(g); g = []; } g.push(w); } if (g.length) out.push(g); return out.map(c => ({ t0: c[0].s - .05, t1: c[c.length - 1].e + .3, words: c })); })();
function captions(t) { const c = CAP.find(c => t >= c.t0 && t < c.t1); if (!c || t > END + .3) return; const f = F.b6(46), words = c.words.map(w => w.w), fw = ctx.measureText ? (ctx.font = f, ctx.measureText(words.join(' ')).width) : 0;
  ctx.fillStyle = 'rgba(0,0,0,.62)'; ctx.fillRect(W / 2 - fw / 2 - 24, 968, fw + 48, 70); let x = W / 2 - fw / 2; c.words.forEach(w => { txt(w.w, x, 1016, f, t >= w.s && t < w.e + .08 ? K.gold : '#fff'); ctx.font = f; x += ctx.measureText(w.w + ' ').width; }); }
const GRAIN = Array.from({ length: 4 }, (_, j) => { const c = document.createElement('canvas'); c.width = 480; c.height = 270; const g = c.getContext('2d'), id = g.createImageData(480, 270); for (let i = 0; i < id.data.length; i += 4) { const v = hash(i * .13 + j * 977) * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 18; } g.putImageData(id, 0, 0); return c; });
function finish(t) { const vg = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  const fl = .02 * Math.sin(t * 37) * Math.sin(t * 13); ctx.fillStyle = `rgba(255,236,200,${Math.max(0, fl)})`; ctx.fillRect(0, 0, W, H); }
// opening title and closing credits
function openTitle(t) { if (t > T0 + .3) return; const k = 1 - seg(t, T0 - .6, T0 + .3); ctx.fillStyle = `rgba(10,9,8,${k})`; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = k * seg(t, .1, .8); txt('RELENTLESS AARON PRESENTS', W / 2, H / 2 + 14, F.m(34), K.gold, 'center'); ctx.globalAlpha = 1; }
function endCredits(t) { if (t < CRED) return; const k = seg(t, CRED, CRED + 1); ctx.fillStyle = `rgba(10,9,8,${k})`; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = k;
  txt('THE ANT KINGDOM', W / 2, 250, F.a(130), K.ink, 'center'); txt('When the little ones come together, even giants fall.', W / 2, 330, F.h(56), K.gold, 'center'); txt('PRODUCED BY RELENTLESS AARON', W / 2, 430, F.a(60), K.red, 'center');
  const roll = seg(t, CRED + 2, DUR - 1), lines = ['PHOTOGRAPHS (Wikimedia Commons)', ...CREDITS.map(c => `${c.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '')}: ${c.author.slice(0, 48)} · ${c.license}`),
    '', 'SOURCES', 'Schultheiss et al., PNAS 2022: the abundance, biomass and distribution of ants on Earth', 'Giraud, Pedersen & Keller, PNAS 2002: the Argentine ant supercolony in Europe', 'Mlot, Tovey & Hu, PNAS 2011: fire ant rafts', 'Narration: synthetic voice (Kokoro)'];
  ctx.save(); ctx.beginPath(); ctx.rect(0, 480, W, H - 520); ctx.clip(); lines.forEach((l, i) => txt(l, W / 2, 560 + i * 40 - roll * (lines.length * 40 - 380), l === l.toUpperCase() && l ? F.b8(30) : F.b6(26), l === l.toUpperCase() ? K.gold : K.ink, 'center')); ctx.restore(); ctx.globalAlpha = 1; }

async function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const [cx, cy, vw, focus] = camera(t), z = W / vw; ctx.setTransform(z, 0, 0, z, W / 2 - cx * z, H / 2 - cy * z);
  ctx.fillStyle = BOARD; ctx.fillRect(cx - vw, cy - vw, vw * 2, vw * 2);
  const wide = vw > 4000; for (const o of items) drawItem(o, t, wide ? o.c : focus);
  ctx.setTransform(1, 0, 0, 1, 0, 0); finish(t); captions(t); openTitle(t); endCredits(t);
}
window.EV = EV.sort((a, b) => a.t - b.t); window.DUR = DUR; window.render = render; window.READY = true;
