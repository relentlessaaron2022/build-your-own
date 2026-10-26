// film.js — 1930s film post, upright: a 3:4 rounded film gate (1080×1440) centred in a 1080×1920 vertical frame, gate weave, flicker, scratches, dust, hairs, vignette
// Adapted from styles/rubber-hose/demo/film.js (4:3 gate in 16:9) for a vertical feed.
import { hash, vnoise } from '/core/lib.js';
export const FW = 1080, FH = 1920, GW = 1080, GH = 1440;
export const GATE = { x: 0, y: (FH - GH) / 2, w: GW, h: GH, r: 34 };

export function makeFilm(main) {
  const g = main.getContext('2d');
  const scene = document.createElement('canvas'); scene.width = GW; scene.height = GH;
  return { g, scene, sg: scene.getContext('2d') };
}

// t = seconds; o.jump = extra vertical jump (at cuts)
export function post(F, t, o = {}) {
  const g = F.g, f = Math.floor(t * 24 + 1e-6);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#000'; g.fillRect(0, 0, FW, FH);
  const wx = (vnoise(t * 1.3) - .5) * 2.4 + (hash(f * 7.1) > .985 ? (hash(f) - .5) * 5 : 0);
  const wy = (vnoise(t * 1.1 + 40) - .5) * 2.6 + (hash(f * 3.3) > .985 ? (hash(f + 9) - .5) * 6 : 0) + (o.jump || 0);
  const { x, y, w, h, r } = GATE;
  g.save();
  g.beginPath(); g.roundRect(x + 6, y, w - 12, h, r); g.clip();
  g.filter = 'blur(0.55px) contrast(1.14)';
  g.drawImage(F.scene, x + wx, y + wy);
  g.filter = 'none';
  if (!o.clean) {
    const fl = (hash(f * 1.618) - .5) * .08 + (vnoise(t * 3) - .5) * .04;
    g.fillStyle = fl > 0 ? `rgba(255,252,240,${fl})` : `rgba(0,0,0,${-fl})`; g.fillRect(x, y, w, h);
    const seg = Math.floor(t * 2.3);
    for (let i = 0; i < 3; i++) {
      if (hash(seg * 13.7 + i * 3.1) < .45) continue;
      const sx = x + hash(seg * 5.3 + i) * w + Math.sin(t * 7 + i) * 6, light = hash(seg + i * 9) > .4;
      g.strokeStyle = light ? 'rgba(245,242,230,.5)' : 'rgba(10,10,8,.45)'; g.lineWidth = .8 + hash(seg * 2 + i) * 1.4;
      g.beginPath(); const y0 = y + hash(seg * 3 + i) * h * .5; g.moveTo(sx, y0); g.lineTo(sx + (hash(f + i) - .5) * 3, y0 + h * (.4 + hash(seg + i * 5) * .6)); g.stroke();
    }
    const nd = 3 + Math.floor(hash(f * 2.7) * 6);
    for (let i = 0; i < nd; i++) {
      const dx = x + hash(f * 11.1 + i * 1.7) * w, dy = y + hash(f * 17.3 + i * 2.9) * h, rr = .8 + hash(f + i * 4.4) * 2.8, dark = hash(f * 1.3 + i) > .35;
      g.fillStyle = dark ? 'rgba(12,11,10,.75)' : 'rgba(250,248,240,.7)';
      g.beginPath(); g.ellipse(dx, dy, rr * (1 + hash(i + f) * 1.5), rr, hash(i * 3 + f) * 3, 0, 7); g.fill();
    }
    if (hash(Math.floor(t * 1.5) * 9.9) > .82) {
      const s0 = Math.floor(t * 1.5), hx = x + hash(s0 * 2.2) * w, hy = y + hash(s0 * 4.4) * h;
      g.strokeStyle = 'rgba(15,14,12,.6)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(hx, hy);
      for (let i = 1; i <= 8; i++) g.lineTo(hx + i * 7 + Math.sin(i * 1.3 + s0) * 8, hy + Math.sin(i * .9 + s0 * 2) * 10 + i * 3);
      g.stroke();
    }
  }
  const cx = x + w / 2, cy = y + h / 2;
  const vg = g.createRadialGradient(cx, cy, 420, cx, cy, 980);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(.7, 'rgba(0,0,0,.18)'); vg.addColorStop(1, 'rgba(0,0,0,.62)');
  g.fillStyle = vg; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 14; g.filter = 'blur(6px)'; g.beginPath(); g.roundRect(x + 6, y, w - 12, h, r); g.stroke(); g.filter = 'none';
  g.restore();
}
