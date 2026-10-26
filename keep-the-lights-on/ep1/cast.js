// cast.js — the phone (hero), her (back view only, night bonnet), pillows, his arms and silhouette, shower curtain, steam
// Character-local coordinates: origin = ground point between the feet, y down.
import * as T from './toon.js';
import { P, pieEye, mouth, glove, hose, ribbon } from './chars.js';
import { clamp, lerp, hash, TAU } from '/core/lib.js';
const { shape, stroke, ell, arc, rr, spline, quad, push, pop, translate, rotate, scale, S } = T;

// ——— the phone: a slab that stands on stubby legs, face on the screen ———
export const PH = { w: 170, h: 300 };
// p: { x, y, k, rot, sx, sy, screen: 'awake'|'dim'|'dark', eyes:{type,lx,ly,lid}, mouth:{type,w}, light 0..1, armL/armR {x,y,hand,front}, legs, wink }
export function phone(p) {
  const { w, h } = PH;
  push(); translate(p.x, p.y); scale(p.k || 1); if (p.rot) rotate(p.rot); scale(p.sx || 1, p.sy || 1);
  const legY = p.legs === false ? 0 : -34;
  if (p.legs !== false) {
    for (const s of [-1, 1]) hose([s * 34, legY + 6], [s * 40, -6], s * 4, 13);
    for (const s of [-1, 1]) shape(ell(s * 46, -8, 26, 12, 18), { fill: P.ink, lw: S.lw * .8 });
  }
  const arm = (key, s) => { const A = p[key]; if (!A) return; const sh = [s * (w / 2 - 6), legY - h * .52]; hose(sh, [A.x, A.y], A.bend ?? s * -16, 12); glove(A.x, A.y, A.rot ?? Math.atan2(A.y - sh[1], A.x - sh[0]), A.hand || 'open', A.hk || .85, { flip: s < 0 }); };
  for (const [k, s] of [['armL', -1], ['armR', 1]]) if (p[k] && !p[k].front) arm(k, s);
  const by = legY - h;
  shape(rr(-w / 2, by, w, h, 34), { fill: P.ink, lw: S.lw });
  const scr = p.screen || 'awake', sc = scr === 'awake' ? P.white : scr === 'dim' ? P.mid : P.dark;
  shape(rr(-w / 2 + 14, by + 26, w - 28, h - 52, 20), { fill: sc, lw: S.lw * .7, shade: () => { if (scr === 'awake') T.fillOnly(rr(w / 2 - 44, by + 26, 30, h - 52, 0), P.pale, { boil: 0 }); } });
  // notification light on the top bezel
  const L = clamp(p.light ?? 0, 0, 1);
  shape(ell(0, by + 13, 7, 5, 12), { fill: L > .5 ? P.white : P.dmid, lw: S.lw * .5 });
  if (L > .5) for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .42; stroke([[Math.cos(a) * 16, by + 13 + Math.sin(a) * 14], [Math.cos(a) * 34, by + 13 + Math.sin(a) * 30]], S.lw * .7, { line: P.white }); }
  // face on the screen
  if (scr !== 'dark' || p.eyes) {
    const E = p.eyes || { type: 'shut' }, ey = by + 104, lid = scr === 'awake' ? P.white : sc;
    if (p.wink !== 'L') pieEye(-30, ey, 22, 31, { ...E, lidCol: lid, side: 1, lwk: .8 }); else pieEye(-30, ey, 22, 31, { type: 'shut' });
    if (p.wink !== 'R' && !p.oneEye) pieEye(30, ey, 22, 31, { ...E, lidCol: lid, side: -1, lwk: .8 }); else if (!p.oneEye) pieEye(30, ey, 22, 31, { type: 'shut' });
    const M = p.mouth || { type: 'flat', w: 30 };
    if (M.type !== 'none') mouth(0, by + 178, M.w || 56, M.type, M);
  }
  for (const [k, s] of [['armL', -1], ['armR', 1]]) if (p[k] && p[k].front) arm(k, s);
  pop();
}
// soft glow of a lit screen, in scene-canvas pixels (lighter)
export function glow(g, sx, sy, r, a) {
  if (a <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(sx, sy, 0, sx, sy, r); gr.addColorStop(0, `rgba(255,252,240,${a})`); gr.addColorStop(1, 'rgba(255,252,240,0)');
  g.fillStyle = gr; g.fillRect(sx - r, sy - r, 2 * r, 2 * r); g.restore();
}

// ——— pillow: plump, breathing, can be lifted at one end ———
export function pillow(x, y, w, h, o = {}) {
  push(); translate(x, y); const br = o.br || 0, lift = o.lift || 0;
  scale(1 + br * .5, 1 - br); if (o.rot) rotate(o.rot);
  const pts = spline([[-w / 2, -6], [-w / 2 - 10, -h * .55], [-w * .3, -h - 4], [0, -h + 8], [w * .3, -h - 6 - lift], [w / 2 + 12, -h * .5 - lift * .6], [w / 2, -4], [0, 4]], true, 7);
  shape(pts, { fill: P.white, shade: () => { T.fillOnly([[w * .18, -h * 1.4], [w, -h * 1.4], [w, 20], [w * .24, 20]], P.light, { boil: 0 }); } });
  stroke(quad([-w * .3, -h * .55], [0, -h * .45], [w * .3, -h * .55], 10), S.lw * .5, { line: P.mid });
  for (const s of [-1, 1]) { stroke([[s * w * .47, -h * .7], [s * w * .58, -h * .8]], S.lw * .6); stroke([[s * w * .47, -h * .3], [s * w * .58, -h * .2]], S.lw * .6); }
  pop();
}

// ——— her, from behind: nightshirt, night bonnet, noodle limbs, white gloves ———
// p: { x, y, k, sy (crouch squash), lean, legL/legR {x,y} feet, armL/armR {x,y,hand}, bob }
export function her(p) {
  push(); translate(p.x, p.y); scale(p.k || 1); scale(p.sx || 1, p.sy || 1); if (p.lean) rotate(p.lean);
  const hip = -170;
  // legs + shoes (back view: shoes are ink ovals, the heel toward us)
  for (const [key, s] of [['legL', -1], ['legR', 1]]) { const L = p[key] || { x: s * 30, y: 0 }; hose([s * 28, hip + 20], [L.x, L.y - 10], L.bend ?? s * 6, 15); }
  for (const [key, s] of [['legL', -1], ['legR', 1]]) { const L = p[key] || { x: s * 30, y: 0 }; shape(ell(L.x, L.y - 8, 24, 14, 18), { fill: P.ink, lw: S.lw * .8 }); shape(ell(L.x - 6, L.y - 12, 6, 3, 10), { fill: P.white, stroke: false, boil: .3 }); }
  // arms behind the shirt
  const arm = (key, s) => { const A = p[key]; if (!A) return; const sh = [s * 74, -400]; hose(sh, [A.x, A.y], A.bend ?? s * -18, 14); glove(A.x, A.y, A.rot ?? Math.atan2(A.y - sh[1], A.x - sh[0]), A.hand || 'open', .95, { flip: s < 0 }); };
  for (const [k, s] of [['armL', -1], ['armR', 1]]) if (p[k] && !p[k].front) arm(k, s);
  // nightshirt: a bell from the shoulders to the hem
  const shirt = spline([[-70, -428], [0, -436], [70, -428], [92, -380], [104, -260], [118, -166], [60, -152], [0, -158], [-60, -152], [-118, -166], [-104, -260], [-92, -380]], true, 6);
  shape(shirt, { fill: P.white, shade: () => { T.fillOnly([[44, -460], [140, -460], [140, -130], [62, -130]], P.light, { boil: 0 }); } });
  stroke(quad([-30, -360], [-40, -260], [-36, -170], 10), S.lw * .55, { line: P.mid });
  stroke(quad([24, -340], [30, -250], [22, -168], 10), S.lw * .55, { line: P.mid });
  // nape + bonnet with a ruffled rim and a bow
  shape(ell(0, -446, 30, 22, 18), { fill: P.ink, lw: S.lw * .8 });
  const bon = spline([[-96, -480], [-100, -540], [-60, -592], [0, -604], [60, -592], [100, -540], [96, -480], [60, -462], [0, -458], [-60, -462]], true, 7);
  shape(bon, { fill: P.pale, shade: () => { T.fillOnly([[30, -620], [120, -620], [120, -450], [44, -450]], P.light, { boil: 0 }); } });
  for (let i = 0; i <= 8; i++) { const u = i / 8, xx = lerp(-92, 92, u), yy = -472 + Math.sin(u * Math.PI) * 14; shape(ell(xx, yy, 13, 10, 12), { fill: P.white, lw: S.lw * .6 }); }
  stroke(quad([-80, -520], [0, -548], [80, -520], 12), S.lw * .6, { line: P.dmid });
  for (const s of [-1, 1]) shape(spline([[0, -462], [s * 26, -476], [s * 34, -456], [s * 22, -444]], true, 5), { fill: P.dark, lw: S.lw * .6 });
  for (const [k, s] of [['armL', -1], ['armR', 1]]) if (p[k] && p[k].front) arm(k, s);
  pop();
}

// ——— steam puff (cloud of 5 lobes), scale grows with age ———
export function puff(x, y, r, seed = 0, col = P.pale) {
  const lobes = [];
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + hash(seed + i) * .6, d = r * (.45 + hash(seed * 3 + i) * .2); lobes.push(ell(x + Math.cos(a) * d, y + Math.sin(a) * d * .7, r * (.42 + hash(seed + i * 7) * .18), r * (.36 + hash(seed + i * 5) * .14), 20)); }
  lobes.push(ell(x, y, r * .62, r * .5, 22));
  const ps = lobes.map(l => shape(l, { stroke: false }));
  ps.forEach(q => T.outline(q, S.lw * 1.6));
  T.g.setTransform(1, 0, 0, 1, 0, 0); T.g.fillStyle = col; ps.forEach(q => T.g.fill(q));
}

// ——— his long noodle arms (gloves), reaching from (sx,sy) to (hx,hy) ———
export function reach(sx, sy, hx, hy, bend, hand = 'grab', flip = false) {
  hose([sx, sy], [hx, hy], bend, 15);
  glove(hx, hy, Math.atan2(hy - sy, hx - sx), hand, 1, { flip });
}
// a soft silhouette (behind the curtain): head + torso blob
export function silhouette(x, y, k, lean = 0, bonnet = false) {
  push(); translate(x, y); scale(k); rotate(lean);
  const body = spline([[-70, -40], [-86, -300], [-60, -420], [0, -440], [60, -420], [86, -300], [70, -40], [0, -20]], true, 6);
  T.fillOnly(body, P.dmid, { boil: .4 });
  T.fillOnly(ell(0, -500, bonnet ? 74 : 54, bonnet ? 66 : 62, 24), P.dmid, { boil: .4 });
  pop();
}
