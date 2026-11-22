// ============================================================
// vertical 9:16 layer (?fmt=v): header (case no., title, exhibit chip) above the 16:9 page, big captions below.
// call buildVertical({ title, caseNo, chips, KEY }) at the end of buildAll(); render() calls vUpdate(t).
// ============================================================
let vUpdate = () => {};
function buildVertical({ title, caseNo, chips, KEY }) {
  if (!VERT) return;
  show(hud, false);
  const B = document.getElementById('vbg'), G = document.getElementById('vfg');
  el('rect', { width: 1080, height: 1920, fill: C.paper }, B);
  halftone(B, { w: 1080, h: 1920, color: C.teal, step: 24, angle: 15, maxK: .55, f: (x, y) => .2 + clamp((Math.abs(y - 905) - 330) / 500) * .9 }).setAttribute('class', 'mul');
  el('rect', { x: 0, y: 586, width: 1080, height: 14, fill: C.ink }, B); el('rect', { x: 0, y: 1207, width: 1080, height: 14, fill: C.ink }, B);
  el('rect', { x: 0, y: 1221, width: 1080, height: 8, fill: C.teal, class: 'mul' }, B);
  const cn = txt(G, caseNo, { x: 540, y: 150, 'font-size': 34, 'font-family': F.mono, 'font-weight': 800, fill: C.ink, 'text-anchor': 'middle', 'letter-spacing': 4 });
  const rec = el('circle', { cx: 540 - (measure(caseNo, 34, F.mono, 800) + 4 * caseNo.length) / 2 - 30, cy: 139, r: 11, fill: C.red }, G);
  const tl = chars(G, title, { x: 540, y: 300, size: Math.min(100, 100 * 900 / measure(title, 100, F.serif)), family: F.serif, weight: 400, fill: C.ink, anchor: 'middle', shadow: { fill: C.teal, dx: 7, dy: 7 } });
  const chip = el('g', {}, G), chipBg = el('rect', { y: -40, height: 80, rx: 10, fill: C.ink }, chip);
  const ca = txt(chip, '', { y: 16, 'font-size': 46, 'font-family': F.sans, fill: C.honey }), cb = txt(chip, '', { y: 16, 'font-size': 46, 'font-family': F.sans, fill: C.cream });
  const pr = txt(G, 'PRODUCED BY RELENTLESS AARON', { x: 540, y: 1830, 'font-size': 30, 'font-family': F.mono, 'font-weight': 800, fill: C.ink, 'text-anchor': 'middle', 'letter-spacing': 3 });
  // captions: shorter groups, bigger type
  const groups = []; let gg = []; for (const w of WD) { if (gg.length && (gg.length >= 5 || /[.,!?:;]$/.test(gg[gg.length - 1].w) || w.s - gg[gg.length - 1].e > .45)) { groups.push(gg); gg = []; } gg.push(w); } if (gg.length) groups.push(gg);
  const CAPS = groups.map((ws, gi) => { const parts = ws.map((w, i) => [w.w + (i < ws.length - 1 ? ' ' : ''), KEY.test(norm(w.w)) ? C.honey : null]); const c = caption(G, parts, { x: 540, y: 1370, size: 62 });
    const wd = parts.reduce((a, [s]) => a + measure(s, 62, F.sans, 400), 0) + 68; if (wd > 1000) tf(c.inner, 0, 0, 1000 / wd); show(c.g, false); return { c, t0: ws[0].s - .05, t1: Math.min(ws[ws.length - 1].e + .35, groups[gi + 1] ? groups[gi + 1][0].s - .05 : 1e9) }; });
  const vfade = el('rect', { width: 1080, height: 1920, fill: C.ink, opacity: 0 }, G);
  let last = '';
  vUpdate = t => {
    const c = chips.find(c => t >= c[0] && t < c[1]); show(chip, !!c);
    if (c && last !== c[2]) { last = c[2]; ca.textContent = c[2]; cb.textContent = c[3]; const wa = measure(c[2], 46, F.sans, 400), wb = measure(c[3], 46, F.sans, 400), W = wa + wb + 24 + 60;
      chipBg.setAttribute('x', -W / 2); chipBg.setAttribute('width', W); ca.setAttribute('x', -W / 2 + 30); cb.setAttribute('x', -W / 2 + 30 + wa + 24); }
    if (c) tf(chip, 540, 450, lerp(.6, 1, E.back(seg(t, c[0], c[0] + .35))));
    charsPop(tl, t, .3, .04); op(rec, Math.floor(t * 2) % 2 ? .25 : 1);
    CAPS.forEach(k => { const on = t >= k.t0 && t < k.t1 && t < END + .3; show(k.c.g, on); if (on) captionAnim(k.c, t, k.t0); });
    op(vfade, seg(t, DUR - .7, DUR - .05));
  };
}
