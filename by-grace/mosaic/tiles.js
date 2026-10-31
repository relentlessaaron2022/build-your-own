// tiles.js — the 21 paintings of the mosaic. Each builder paints in a 680 × 800 local box and returns its strokes in painting order.
const TW = 680, TH = 800;
// background washes by column: storm indigo (left) → dusk violet → rose → dawn gold (right)
const BGT = ['#2f3d5c', '#3d4a68', '#56597a', '#7b7389', '#a88d8a', '#d3a574', '#e3b263'];
const BGB = ['#4a5a78', '#5d6884', '#7a7a92', '#a596a0', '#c9ab98', '#e5c28e', '#f0d28e'];
const VERM = '#c8442a';
function bg(S, col, holes = [], poly = R(14, 14, TW - 28, TH - 28), o = {}) {
  fill(S, poly, y => mixc(o.top || BGT[col], o.bot || BGB[col], clamp(y / TH)), o.w || 84, { holes, a: o.a });
}

const NOTES = ['candle', 'seed', 'pillow', 'prayer', 'storm', 'cupboard', 'open door', 'waiting', 'the gate', 'the court', 'the tree',
  'kneeling', 'wings', 'hands', 'rose', 'walking away', 'bread', 'heartbeat', 'fire', 'voices', 'morning'];

const TILE = [
  // 0 candle — flame first, then the dark around it
  c => { const S = [];
    line(S, qcurve(340, 400, 337, 262, 7, 10), 48, VERM, { prof: 'leaf', nb: 3, a: .88 });
    line(S, qcurve(340, 392, 340, 318, 2, 8), 18, '#f0b347', { prof: 'leaf', a: .9 });
    fill(S, E(340, 335, 150, 160), ['#ecc77f', '#f0d396'], 46, { a: .3, holes: [[340, 330, 40, 75]] });
    bg(S, c, [[340, 335, 175, 185], [340, 540, 70, 150]]);
    fill(S, R(305, 410, 70, 250), ['#e6d4b0', '#dcc7a0'], 24, { a: .6 });
    line(S, qcurve(305, 412, 305, 660, 0, 8), 4, INK2); line(S, qcurve(375, 412, 375, 660, 0, 8), 4, INK2);
    line(S, qcurve(340, 410, 341, 392, 0, 3), 4, INK);
    fill(S, E(340, 668, 130, 22), '#6e5444', 18, { a: .8 });
    line(S, qcurve(20, 700, 660, 702, 3, 20), 6, INK2, { a: .7 });
    return S; },
  // 1 seed in the soil, a moon over it
  c => { const S = [];
    bg(S, c, [[520, 140, 44, 44]], R(14, 14, TW - 28, 320));
    fill(S, E(520, 140, 40, 40), '#e8dcc0', 20, { a: .6 });
    fill(S, R(14, 320, TW - 28, TH - 334), ['#5e4636', '#6b5040', '#54402f'], 52, { a: .66 });
    line(S, path([[14, 326], [200, 318], [420, 330], [666, 322]], 6), 5, INK, { a: .8 });
    line(S, path([[40, 450], [300, 440], [640, 455]], 6), 3, '#3f2f25', { a: .5 }); line(S, path([[40, 690], [360, 700], [640, 688]], 6), 3, '#3f2f25', { a: .5 });
    fill(S, E(340, 565, 36, 23), '#d2ae72', 14, { a: .85 });
    line(S, qcurve(306, 565, 374, 562, -10, 8), 3, INK);
    for (const [dx, b] of [[-14, -12], [0, 6], [14, 14]]) line(S, qcurve(340 + dx * .5, 586, 340 + dx * 3, 680, b, 8), 2.5, '#2e241c', { prof: 'tip' });
    return S; },
  // 2 pillow, tears, rain on the window
  c => { const S = [];
    bg(S, c);
    fill(S, R(392, 110, 220, 260), ['#26324d', '#2c3956'], 38, { a: .75 });
    for (let i = 0; i < 12; i++) { const x = 405 + i * 18 + rnd(-5, 5), y = 130 + rnd(0, 120); line(S, qcurve(x, y, x - 14, y + rnd(60, 110), 0, 5), 2.4, '#a9b6cc', { a: .7 }); }
    poly2line(S, R(392, 110, 220, 260), 5, INK); line(S, qcurve(502, 110, 502, 370, 0, 6), 4, INK); line(S, qcurve(392, 240, 612, 240, 0, 6), 4, INK);
    fill(S, [[14, 610], [666, 570], [666, 786], [14, 786]], ['#6d5d7a', '#62536f'], 50, { a: .7 });
    fill(S, E(250, 560, 175, 68), ['#ddd3da', '#d3c8d2'], 28, { a: .78 });
    line(S, qcurve(80, 580, 420, 585, 30, 14), 4, INK2, { a: .6 });
    for (const [x, y] of [[300, 500], [322, 528], [282, 546]]) line(S, qcurve(x, y, x + 2, y + 26, 2, 5), 12, '#5b7fae', { prof: 'leaf', a: .85 });
    return S; },
  // 3 mama praying at the bedside, the lamp gone out
  c => { const S = [];
    bg(S, c);
    fill(S, R(14, 640, TW - 28, 146), ['#3a3550', '#332f48'], 44, { a: .8 });
    fill(S, [[330, 470], [666, 470], [666, 650], [330, 650]], ['#cfc6d6', '#c6bccf'], 36, { a: .75 });
    fill(S, R(330, 560, 336, 90), ['#6d5d7a', '#62536f'], 36, { a: .8 });
    const k = '#3b3236';
    fillV(S, [[170, 640], [190, 470], [250, 400], [300, 430], [290, 560], [260, 640]], k, 30, { a: .9 });
    fill(S, E(318, 418, 40, 44), k, 22, { a: .92 });
    line(S, qcurve(270, 440, 352, 486, 6, 8), 26, k, { a: .9 }); line(S, qcurve(262, 470, 350, 500, 8, 8), 24, k, { a: .9 });
    line(S, qcurve(120, 640, 270, 640, 0, 8), 40, k, { a: .9 });
    fill(S, [[540, 470], [604, 470], [594, 410], [550, 410]], '#6b5a4a', 16, { a: .85 });
    line(S, path([[572, 400], [560, 340], [584, 280], [566, 200]], 5), 3, '#a7a3b2', { a: .65 });
    return S; },
  // 4 storm over the house, one lit window
  c => { const S = [];
    bg(S, c);
    for (const e of [E(200, 140, 200, 90), E(460, 120, 230, 100), E(330, 220, 280, 80)]) fill(S, e, ['#33374a', '#3a3f53'], 46, { a: .7 });
    for (let i = 0; i < 20; i++) { const x = 40 + i * 32 + rnd(-8, 8), y = 270 + rnd(-10, 60); line(S, qcurve(x, y, x - 40, y + rnd(160, 260), 0, 6), 2.4, '#a0abc0', { a: .55 }); }
    fill(S, R(14, 628, TW - 28, 158), ['#4b5544', '#434c3d'], 46, { a: .8 });
    fill(S, R(222, 432, 236, 200), ['#7d6a5e', '#74625a'], 34, { a: .85 });
    fill(S, [[200, 438], [340, 318], [480, 438]], ['#4a3a35', '#42332f'], 28, { a: .9 });
    fill(S, R(270, 480, 58, 58), '#efbd5c', 20, { a: .9 });
    fill(S, R(372, 520, 46, 110), '#3b2f2b', 20, { a: .9 });
    poly2line(S, R(222, 432, 236, 200), 3, INK, { a: .6 });
    return S; },
  // 5 the cupboard, nearly empty
  c => { const S = [];
    bg(S, c);
    fill(S, R(168, 118, 344, 604), ['#8c6a4f', '#80614a'], 42, { a: .85 });
    fill(S, R(198, 150, 284, 540), ['#3e3129', '#35291f'], 38, { a: .8 });
    for (const y of [330, 510]) line(S, qcurve(198, y, 482, y, 0, 8), 12, '#a07d5c', { a: .9 });
    fill(S, R(300, 440, 54, 70), '#d9c08a', 16, { a: .9 });
    line(S, qcurve(298, 438, 356, 438, 0, 5), 6, INK);
    fill(S, [[512, 118], [624, 160], [624, 690], [512, 722]], ['#7a5a42', '#6f523c'], 28, { a: .85 });
    fill(S, E(540, 420, 7, 7), '#2b2520', 6, { a: .9 });
    line(S, qcurve(14, 740, 666, 744, 0, 16), 5, INK2, { a: .6 });
    return S; },
  // 6 a door opens with light
  c => { const S = [];
    fill(S, R(262, 172, 196, 478), ['#f0cc72', '#f3d58a'], 40, { a: .6 });
    for (const p of [R(14, 14, 248, 772), R(458, 14, 208, 772), R(262, 14, 196, 158)]) bg(S, c, [], p, { w: 54 });
    fill(S, [[262, 650], [458, 650], [610, 786], [110, 786]], ['#efcf84', '#f2d79a'], 34, { a: .5 });
    fill(S, [[262, 172], [196, 148], [196, 694], [262, 650]], ['#4a3a33', '#41332d'], 22, { a: .9 });
    poly2line(S, R(262, 172, 196, 478), 5, INK, { a: .7 });
    return S; },
  // 7 a closed door and a chair: waiting
  c => { const S = [];
    bg(S, c);
    fill(S, R(14, 660, TW - 28, 126), ['#4f4a52', '#47424a'], 42, { a: .8 });
    fill(S, R(250, 160, 180, 500), ['#6a4c3c', '#5f4436'], 34, { a: .88 });
    poly2line(S, R(275, 190, 130, 190), 3, INK, { a: .6 }); poly2line(S, R(275, 410, 130, 210), 3, INK, { a: .6 });
    fill(S, E(410, 420, 8, 8), '#d9b36a', 6, { a: .9 });
    line(S, qcurve(258, 662, 424, 662, 0, 8), 6, '#e9c06a', { a: .85 });
    const ch = '#5a4436';
    line(S, qcurve(470, 520, 606, 520, 0, 8), 10, ch); line(S, qcurve(598, 520, 610, 370, -4, 8), 9, ch);
    for (const x of [478, 598]) line(S, qcurve(x, 522, x, 664, 0, 6), 8, ch);
    line(S, qcurve(604, 420, 512, 422, 0, 6), 6, ch);
    return S; },
  // 8 the garden gate, open, a path into light
  c => { const S = [];
    bg(S, c, [], R(14, 14, TW - 28, 380));
    fill(S, E(340, 372, 250, 54), ['#e8c27a', '#eccb8c'], 30, { a: .5 });
    fill(S, R(14, 380, TW - 28, 406), ['#3f4f3e', '#4a5a45'], 50, { a: .78 });
    fill(S, [[310, 380], [372, 380], [570, 786], [110, 786]], ['#c9b58e', '#d2c09a'], 36, { a: .66 });
    fill(S, E(120, 430, 150, 72), ['#2f3f33', '#36483a'], 36, { a: .85 }); fill(S, E(570, 430, 150, 72), ['#2f3f33', '#36483a'], 36, { a: .85 });
    for (const x of [150, 470]) line(S, qcurve(x, 720, x, 470, 0, 6), 14, '#4a3a30');
    for (let i = 0; i < 6; i++) { const x0 = 470 + i * 24, y0 = 520 + i * 6; line(S, qcurve(x0, y0, x0, y0 + 190, 0, 5), 5, INK2); }
    line(S, qcurve(470, 520, 600, 556, 0, 6), 6, INK2); line(S, qcurve(470, 690, 600, 726, 0, 6), 6, INK2);
    return S; },
  // 9 an empty court at dusk
  c => { const S = [];
    bg(S, c);
    fill(S, R(14, 560, TW - 28, 226), ['#8d7c6e', '#857466'], 46, { a: .8 });
    line(S, qcurve(60, 700, 620, 700, -60, 16), 4, '#e9e1d2', { a: .7 });
    line(S, qcurve(500, 562, 500, 180, 0, 10), 14, '#3a3536');
    fill(S, R(360, 150, 200, 128), ['#d8d0c4', '#cfc6b8'], 24, { a: .7 }); poly2line(S, R(360, 150, 200, 128), 4, INK, { a: .8 });
    line(S, qctrl(380, 290, 420, 312, 460, 290, 10), 6, '#b0592e'); line(S, qctrl(380, 290, 420, 276, 460, 290, 10), 4, '#b0592e', { a: .7 });
    for (let i = 0; i < 5; i++) line(S, qcurve(384 + i * 18, 296, 394 + i * 14, 350, 0, 5), 2, INK2, { a: .6 });
    fill(S, E(200, 712, 34, 34), '#a85a33', 16, { a: .9 });
    line(S, qcurve(170, 700, 232, 722, -8, 6), 2.5, INK); line(S, qcurve(200, 678, 200, 746, 6, 6), 2.5, INK);
    return S; },
  // 10 the seed, now a tree
  c => { const S = [];
    bg(S, c);
    fill(S, R(14, 624, TW - 28, 162), ['#5f6b4c', '#566244'], 46, { a: .8 });
    const tr = mk(qcurve(340, 650, 330, 320, 16, 14), 54, '#5a4232', { prof: 'trunk', nb: 6 }); S.push(tr); S.push(edgeOf(tr, 1, 4, INK2, .7));
    for (const [a, l] of [[-2.3, 150], [-0.8, 160], [-1.9, 120], [-1.2, 130]]) line(S, polar(334, 380, a, l, 10, 8), 16, '#5a4232', { prof: 'tip', nb: 3 });
    clump(S, 340, 250, 160, 90, ['#6f8a55', '#93a86a', '#4f6b43'], { l0: 24, l1: 48, w0: 16, w1: 30, sx: 1.3, sy: .75 });
    for (const [dx, b] of [[-90, -10], [80, 12], [-30, -6]]) line(S, qcurve(340, 650, 340 + dx, 760, b, 8), 4, '#3f3125', { prof: 'tip', a: .5 });
    return S; },
  // 11 knees on the floor, head lifted
  c => { const S = [];
    bg(S, c);
    fill(S, E(390, 110, 220, 100), ['#efd9a4', '#f2e0b2'], 32, { a: .5 });
    fill(S, R(14, 640, TW - 28, 146), ['#5d5560', '#554e58'], 44, { a: .8 });
    const k = '#3b3236';
    line(S, qcurve(212, 636, 392, 640, 4, 10), 46, k, { a: .92 });
    line(S, qcurve(384, 630, 360, 468, -8, 10), 56, k, { a: .92 });
    line(S, qcurve(360, 478, 352, 300, -6, 10), 96, k, { a: .92, nb: 6 });
    line(S, qcurve(354, 300, 362, 262, 0, 4), 30, k, { a: .92 });
    fill(S, [[328, 250], [346, 196], [392, 186], [414, 222], [404, 262], [362, 276]], k, 22, { a: .92 });
    line(S, qcurve(316, 318, 296, 478, -8, 8), 28, k, { a: .9 }); line(S, qcurve(392, 318, 414, 476, 8, 8), 28, k, { a: .9 });
    return S; },
  // 12 wings of mercy, birds rising
  c => { const S = [];
    bg(S, c);
    for (let i = 0; i < 8; i++) { const a = -1.75 + i * .16; line(S, polar(170, 720, a + .9, 360 + i * 22, -26, 12), 70 - i * 3, i % 2 ? '#efe1cf' : '#e8d6c0', { prof: 'leaf', nb: 4, a: .7 }); }
    for (const [x, y, s] of [[260, 600, .8], [360, 470, 1], [470, 380, 1.15], [420, 260, .7], [560, 200, .9], [300, 330, .6]]) bird(S, x, y, s);
    return S; },
  // 13 open hands, the scars
  c => { const S = [];
    bg(S, c);
    fill(S, E(340, 410, 60, 60), '#eccf86', 24, { a: .55 });
    const Lh = [[90, 786], [120, 610], [182, 530], [300, 560], [336, 632], [300, 786]];
    fill(S, Lh, ['#9b6b52', '#8a5d47'], 28, { a: .82 }); fill(S, mirror(Lh, 340), ['#9b6b52', '#8a5d47'], 28, { a: .82 });
    for (const [x, y, d] of [[210, 600, 1], [240, 640, -1], [470, 610, -1], [440, 655, 1]]) line(S, qcurve(x - 28, y, x + 28, y + 10 * d, 6, 6), 2.6, INK, { a: .7 });
    for (const m of [1, -1]) for (let f = 0; f < 4; f++) { const x = 340 - m * (150 - f * 30); line(S, qcurve(x, 560, x - m * (8 + f * 2), 470 + f * 6, m * 6, 6), 26, '#956650', { prof: 'tip', a: .85 }); }
    poly2line(S, Lh, 2.5, INK2, { a: .45 }); poly2line(S, mirror(Lh, 340), 2.5, INK2, { a: .45 });
    return S; },
  // 14 a rose on a thorny stem
  c => { const S = [];
    bg(S, c);
    const st = mk(qcurve(330, 780, 350, 330, 40, 16), 13, '#4f6b43', { prof: 'even', nb: 0, a: .9 }); S.push(st);
    for (let i = 3; i < 14; i += 2) { const [x, y] = st.pts[i], d = i % 4 ? 1 : -1; line(S, polar(x, y, d > 0 ? -.5 : Math.PI + .5, 22, 0, 4), 7, '#3e5535', { prof: 'tip' }); }
    line(S, qcurve(338, 560, 440, 510, -22, 8), 34, '#5f7f4c', { prof: 'leaf', nb: 3 }); line(S, qcurve(342, 640, 240, 600, 22, 8), 30, '#5f7f4c', { prof: 'leaf', nb: 3 });
    for (let i = 0; i < 12; i++) { const a = i * .9, r = 14 + i * 4.6; line(S, polar(350 + Math.cos(a) * r * .5, 290 + Math.sin(a) * r * .4, a + 1.6, 44 + i * 3, 10, 8), 26 + i * 2, pick(['#a23c52', '#b9506a', '#8a2e44']), { prof: 'leaf', nb: 3, a: .82 }); }
    return S; },
  // 15 two figures walking away down the road
  c => { const S = [];
    bg(S, c, [], R(14, 14, TW - 28, 420));
    fill(S, R(14, 430, TW - 28, 356), ['#b8936a', '#ae8a62'], 48, { a: .8 });
    fill(S, [[326, 430], [356, 430], [600, 786], [80, 786]], ['#9a7a5a', '#93744f'], 36, { a: .8 });
    line(S, qcurve(14, 432, 666, 430, 2, 16), 3, INK2, { a: .6 });
    person(S, 322, 540, 92, '#3d3230'); person(S, 372, 528, 84, '#3d3230');
    line(S, qcurve(322, 542, 280, 620, 0, 6), 8, '#7d6248', { a: .55 }); line(S, qcurve(372, 530, 336, 612, 0, 6), 8, '#7d6248', { a: .55 });
    return S; },
  // 16 bread and a cup on the table
  c => { const S = [];
    bg(S, c);
    fill(S, R(14, 520, TW - 28, 266), ['#8a6748', '#805f42'], 50, { a: .82 });
    fill(S, [[160, 500], [560, 520], [604, 704], [116, 692]], ['#ece0c6', '#e6d6b8'], 34, { a: .62 });
    fill(S, E(296, 560, 128, 58), ['#c58b4e', '#b47a40'], 26, { a: .88 });
    for (let i = 0; i < 3; i++) line(S, qcurve(236 + i * 50, 532, 262 + i * 50, 586, 4, 5), 4, '#6e4526', { a: .8 });
    fill(S, [[432, 448], [512, 448], [502, 582], [442, 582]], ['#7a4a3a', '#6f4234'], 22, { a: .88 });
    line(S, qctrl(432, 448, 472, 470, 512, 448, 8), 4, INK); line(S, qctrl(432, 448, 472, 428, 512, 448, 8), 4, INK, { a: .7 });
    return S; },
  // 17 seventy-two heartbeats: the line in vermilion
  c => { const S = [];
    bg(S, c, [], undefined, { top: '#ead2a6', bot: '#efdcb4' });
    for (let x = 80; x < 640; x += 80) line(S, qcurve(x, 60, x, 740, 0, 8), 1.6, INK2, { a: .16 });
    for (let y = 100; y < 740; y += 80) line(S, qcurve(40, y, 640, y, 0, 8), 1.6, INK2, { a: .16 });
    const v = [[30, 420], [180, 420], [205, 395], [230, 420], [262, 420], [288, 240], [314, 610], [340, 420], [420, 420], [445, 398], [470, 420], [500, 420], [526, 240], [552, 610], [578, 420], [650, 420]];
    S.push(mk(path(v, 6), 12, VERM, { prof: 'even', nb: 0, a: .92, rough: .25 }));
    return S; },
  // 18 faith is a fire
  c => { const S = [];
    bg(S, c, [], undefined, { top: '#4b3d40', bot: '#7b6252' });
    for (let i = 0; i < 14; i++) { const x = 340 + rnd(-90, 90), h = rnd(150, 340); line(S, qcurve(x, 640, x + rnd(-30, 30), 640 - h, rnd(-30, 30), 10), rnd(40, 80) * (1 - Math.abs(x - 340) / 200), pick([VERM, '#e07a35', '#f0b347']), { prof: 'leaf', nb: 4, a: .82 }); }
    line(S, qcurve(190, 690, 500, 620, 0, 8), 40, '#5a3e30', { nb: 5 }); line(S, qcurve(190, 620, 500, 690, 0, 8), 40, '#4e3529', { nb: 5 });
    for (let i = 0; i < 12; i++) fill(S, E(340 + rnd(-140, 140), rnd(140, 330), 5, 5), '#f0b347', 6, { a: .9 });
    return S; },
  // 19 a room of raised hands
  c => { const S = [];
    bg(S, c);
    fill(S, E(340, 140, 270, 120), ['#f6dc9a', '#f8e3ae'], 34, { a: .5 });
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6 - r; i++) {
      const x = 70 + i * 108 + r * 54 + rnd(-10, 10), y = 520 + r * 100, s = .8 + r * .2, col = mixc('#6a5248', '#3e302c', r / 2);
      if (rnd() < .7) { const sd = rnd() < .5 ? -1 : 1; line(S, qcurve(x + sd * 22 * s, y + 20, x + sd * 46 * s, y - 150 * s, sd * 10, 8), 16 * s, col, { a: .9 }); fill(S, E(x + sd * 48 * s, y - 160 * s, 12 * s, 16 * s), col, 10, { a: .9 }); }
      fill(S, E(x, y, 34 * s, 40 * s), col, 18, { a: .92 });
      fill(S, [[x - 60 * s, y + 40 * s], [x + 60 * s, y + 40 * s], [x + 70 * s, 800], [x - 70 * s, 800]], col, 30, { a: .92 });
    }
    return S; },
  // 20 morning: the sun over the hills
  c => { const S = [];
    bg(S, c);
    for (let i = 0; i < 9; i++) line(S, polar(340, 470, -Math.PI + .2 + i * .34, 300, 0, 8), 5, '#f2c46a', { a: .6 });
    fill(S, E(340, 480, 108, 108), [VERM, '#cf5233'], 30, { a: .88 });
    fill(S, [[14, 470], [200, 440], [420, 500], [666, 450], [666, 786], [14, 786]], ['#a99566', '#9f8b5c'], 44, { a: .9 });
    fill(S, [[14, 590], [260, 540], [520, 600], [666, 560], [666, 786], [14, 786]], ['#6f7550', '#666c49'], 44, { a: .9 });
    fill(S, [[14, 700], [300, 660], [666, 710], [666, 786], [14, 786]], ['#4f5a40', '#48523a'], 40, { a: .9 });
    for (const [x, y, s] of [[160, 250, .5], [215, 220, .4], [520, 300, .45]]) bird(S, x, y, s);
    return S; },
];
