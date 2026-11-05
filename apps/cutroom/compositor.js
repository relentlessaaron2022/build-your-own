// Cutroom compositor: draws one frame of the project onto a canvas.
// The live preview and the export both call draw(), so what you see
// while editing is exactly what ends up in the file.
(function () {
  const L = window.CutroomLib;
  const { num, clamp, rnd } = L;

  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  class Compositor {
    constructor(canvas, { exporting = false, mediaUrl } = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.exporting = exporting;
      this.mediaUrl = mediaUrl || ((m) => m.url || m.path);
      this.videos = new Map(); // item id -> <video>
      this.audios = new Map(); // item id -> <audio>
      this.images = new Map(); // media id -> <img>
      this.P = null;
      this.boxes = [];
      this.tmp = [];
      this.grainTile = null;
      this.playing = false;
    }
    setProject(P) { this.P = P; this.media = Object.fromEntries(P.media.map((m) => [m.id, m])); }
    resize(w, h) { if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; this.tmp = []; } }
    temp(i) {
      const { width: w, height: h } = this.canvas;
      if (!this.tmp[i] || this.tmp[i].width !== w || this.tmp[i].height !== h) this.tmp[i] = mk(w, h);
      const c = this.tmp[i], g = c.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
      g.clearRect(0, 0, w, h);
      return c;
    }

    // ---------- sources ----------
    video(it) {
      const m = this.media[it.mediaId];
      if (!m) return null;
      const url = this.mediaUrl(m);
      let v = this.videos.get(it.id);
      if (!v || v.dataset.src !== url) {
        if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
        v = document.createElement('video');
        v.crossOrigin = 'anonymous'; v.preload = 'auto'; v.playsInline = true; v.muted = this.exporting;
        v.dataset.src = url; v.src = url;
        this.videos.set(it.id, v);
      }
      return v;
    }
    image(mediaId) {
      const m = this.media[mediaId];
      if (!m) return null;
      const url = this.mediaUrl(m);
      let img = this.images.get(mediaId);
      if (!img || img.dataset.src !== url) {
        img = new Image(); img.crossOrigin = 'anonymous'; img.dataset.src = url; img.src = url;
        this.images.set(mediaId, img);
      }
      return img;
    }
    audio(it) {
      const m = this.media[it.mediaId];
      if (!m) return null;
      const url = this.mediaUrl(m);
      let a = this.audios.get(it.id);
      if (!a || a.dataset.src !== url) {
        if (a) a.pause();
        a = new Audio(); a.crossOrigin = 'anonymous'; a.preload = 'auto'; a.dataset.src = url; a.src = url;
        this.audios.set(it.id, a);
      }
      return a;
    }
    ready(el) { return el && (el.tagName === 'IMG' ? el.complete && el.naturalWidth > 0 : el.readyState >= 2); }

    // ---------- what is on screen at time t ----------
    layers(t) {
      const P = this.P, out = [];
      for (let ti = P.tracks.length - 1; ti >= 0; ti--) { // bottom of the list draws first
        const tr = P.tracks[ti];
        if (tr.hidden || tr.type === 'audio') continue;
        if (tr.type === 'main') {
          const lay = L.layoutMain(tr.items);
          const active = [];
          tr.items.forEach((c, i) => { if (t >= lay[i].start && t < lay[i].end) active.push({ it: c, i, lay: lay[i] }); });
          if (active.length === 2) {
            const [A, B] = active;
            const p = clamp((t - B.lay.start) / Math.max(0.001, B.lay.transition.duration), 0, 1);
            out.push({ kind: 'main', track: tr, A: { it: A.it, local: t - A.lay.start, len: A.lay.len }, B: { it: B.it, local: t - B.lay.start, len: B.lay.len }, tr: B.lay.transition.type, p });
          } else if (active.length) {
            const a = active[active.length - 1];
            out.push({ kind: 'main', track: tr, A: { it: a.it, local: t - a.lay.start, len: a.lay.len } });
          }
          continue;
        }
        for (const it of tr.items) {
          const len = L.itemLength(it);
          if (t >= it.start && t < it.start + len) out.push({ kind: tr.type, track: tr, it, local: t - it.start, len });
        }
      }
      const caps = P.captions;
      if (caps && caps.items.length && !caps.hidden) {
        const c = caps.items.find((x) => t >= x.start && t < x.end);
        if (c) out.push({ kind: 'caption', cap: c, local: t - c.start });
      }
      return out;
    }
    // Every visual video item that needs a frame at time t, with its source time.
    videoNeeds(t) {
      const needs = [];
      const add = (it, local) => { if (it.type === 'video') needs.push({ it, src: L.sourceTime(it, local) }); };
      for (const ly of this.layers(t)) {
        if (ly.kind === 'main') { add(ly.A.it, ly.A.local); if (ly.B) add(ly.B.it, ly.B.local); }
        else if (ly.kind === 'overlay') add(ly.it, ly.local);
      }
      return needs;
    }

    // Seek every needed video to the exact frame (export, scrubbing).
    async seek(t) {
      const fps = num(this.P.fps, 30);
      await Promise.all(this.videoNeeds(t).map(({ it, src }) => new Promise((resolve) => {
        const v = this.video(it);
        if (!v) return resolve();
        const go = () => {
          if (Math.abs(v.currentTime - src) < 0.5 / fps && v.readyState >= 2) return resolve();
          const done = () => { clearTimeout(timer); v.removeEventListener('seeked', done); resolve(); };
          const timer = setTimeout(done, 3000);
          v.addEventListener('seeked', done);
          v.currentTime = src;
        };
        if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once: true });
      })));
      await Promise.all([...new Set(this.P.tracks.flatMap((tr) => tr.items).filter((it) => it.type === 'image').map((it) => it.mediaId))]
        .map((id) => { const img = this.image(id); return img && !img.complete ? new Promise((r) => { img.onload = img.onerror = r; }) : null; }));
    }

    // Keep media elements playing in step with the clock during preview.
    sync(t, playing) {
      const active = new Set();
      for (const { it, src } of this.videoNeeds(t)) {
        const v = this.video(it);
        if (!v) continue;
        active.add(it.id);
        const tr = L.findItem(this.P, it.id)?.track;
        const span = L.itemSpan(this.P, tr, it);
        v.volume = clamp(num(it.volume, 1) * this.fadeGain(it, t - span.start, span.len, tr), 0, 1);
        v.muted = this.exporting || this.forceMute || it.mute || !!(tr && tr.muted);
        v.playbackRate = num(it.speed, 1);
        if (playing) {
          if (v.paused) { if (Math.abs(v.currentTime - src) > 0.05) v.currentTime = src; v.play().catch(() => {}); }
          else if (Math.abs(v.currentTime - src) > 0.25) v.currentTime = src;
        } else if (!v.paused) v.pause();
      }
      for (const [id, v] of this.videos) if (!active.has(id) && !v.paused) v.pause();
      if (playing) for (const { it, src } of this.videoNeeds(t + 0.8)) {
        if (active.has(it.id)) continue;
        const v = this.video(it);
        if (v && v.paused && Math.abs(v.currentTime - src) > 0.3 && !v.seeking) v.currentTime = Math.max(0, src - 0.8 * num(it.speed, 1));
      }
      // audio tracks
      const liveA = new Set();
      for (const tr of this.P.tracks) {
        if (tr.type !== 'audio') continue;
        for (const it of tr.items) {
          const len = L.itemLength(it);
          if (t < it.start || t >= it.start + len) continue;
          const a = this.audio(it);
          if (!a) continue;
          liveA.add(it.id);
          const src = num(it.in) + (t - it.start) * num(it.speed, 1);
          a.volume = clamp(num(it.volume, 1) * this.fadeGain(it, t - it.start, len, tr), 0, 1);
          a.muted = !!this.forceMute || !!tr.muted || !!it.mute;
          a.playbackRate = num(it.speed, 1);
          if (playing) {
            if (a.paused) { a.currentTime = src; a.play().catch(() => {}); }
            else if (Math.abs(a.currentTime - src) > 0.25) a.currentTime = src;
          } else if (!a.paused) a.pause();
        }
      }
      for (const [id, a] of this.audios) if (!liveA.has(id) && !a.paused) a.pause();
    }
    fadeGain(it, local, len) {
      let g = 1;
      if (num(it.fadeIn) > 0 && local < it.fadeIn) g *= local / it.fadeIn;
      if (num(it.fadeOut) > 0 && local > len - it.fadeOut) g *= (len - local) / it.fadeOut;
      return clamp(g, 0, 1);
    }
    stopAll() { for (const v of this.videos.values()) v.pause(); for (const a of this.audios.values()) a.pause(); }
    dispose() {
      this.stopAll();
      for (const v of this.videos.values()) { v.removeAttribute('src'); v.load(); }
      for (const a of this.audios.values()) { a.removeAttribute('src'); a.load(); }
      this.videos.clear(); this.audios.clear();
    }

    // ---------- drawing ----------
    draw(t) {
      const { ctx } = this, { width: W, height: H } = this.canvas;
      const P = this.P;
      this.boxes = [];
      this.t = t;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
      ctx.fillStyle = P.canvas.bg === 'color' ? P.canvas.color : '#000';
      ctx.fillRect(0, 0, W, H);
      const layers = this.layers(t);
      const main = layers.find((l) => l.kind === 'main');
      if (P.canvas.bg === 'blur' && main) this.drawBackdrop(main.B && main.p > 0.5 ? main.B : main.A);
      for (const ly of layers) {
        if (ly.kind === 'main') this.drawMain(ly);
        else if (ly.kind === 'overlay') this.drawVisual(ctx, ly.it, ly.local, ly.len, {});
        else if (ly.kind === 'effect') this.applyEffect(ctx, ly.it.effect, num(ly.it.amount, 0.7), ly.local, ly.it.id);
        else if (ly.kind === 'text') ly.it.type === 'sticker' ? this.drawSticker(ly) : this.drawText(ly);
        else if (ly.kind === 'caption') this.drawCaption(ly);
      }
    }
    sourceFor(it) {
      if (it.type === 'video') { const v = this.video(it); return v && v.readyState >= 2 ? v : null; }
      if (it.type === 'image') { const img = this.image(it.mediaId); return img && img.complete && img.naturalWidth ? img : null; }
      return null;
    }
    dims(src) { return src.tagName === 'VIDEO' ? [src.videoWidth, src.videoHeight] : [src.naturalWidth || src.width, src.naturalHeight || src.height]; }
    drawBackdrop(layer) {
      const src = this.sourceFor(layer.it);
      if (!src) return;
      const { ctx } = this, { width: W, height: H } = this.canvas;
      const [sw, sh] = this.dims(src);
      if (!sw) return;
      const s = Math.max(W / sw, H / sh) * 1.15;
      ctx.save();
      ctx.filter = `blur(${Math.round(Math.min(W, H) * 0.04)}px) brightness(0.65) saturate(1.2)`;
      ctx.drawImage(src, (W - sw * s) / 2, (H - sh * s) / 2, sw * s, sh * s);
      ctx.restore();
    }

    drawMain(ly) {
      const { ctx } = this, { width: W, height: H } = this.canvas;
      if (!ly.B) { this.drawVisual(ctx, ly.A.it, ly.A.local, ly.A.len, { main: true }); return; }
      const p = ly.p, e = L.EASE.inout(p);
      const A = (mod) => this.drawVisual(ctx, ly.A.it, ly.A.local, ly.A.len, { main: true, ...mod });
      const B = (mod) => this.drawVisual(ctx, ly.B.it, ly.B.local, ly.B.len, { main: true, ...mod });
      const overlay = (color, a) => { ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore(); };
      switch (ly.tr) {
        case 'fade': A({}); B({ alpha: e }); break;
        case 'black': case 'white': {
          const col = ly.tr === 'black' ? '#000' : '#fff';
          if (p < 0.5) { A({}); overlay(col, p * 2); } else { B({}); overlay(col, (1 - p) * 2); }
          break;
        }
        case 'flash': (p < 0.5 ? A : B)({}); overlay('#fff', 1 - Math.abs(2 * p - 1)); break;
        case 'slideLeft': A({}); B({ dx: 1 - e }); break;
        case 'slideRight': A({}); B({ dx: -(1 - e) }); break;
        case 'slideUp': A({}); B({ dy: 1 - e }); break;
        case 'slideDown': A({}); B({ dy: -(1 - e) }); break;
        case 'pushLeft': A({ dx: -e }); B({ dx: 1 - e }); break;
        case 'pushRight': A({ dx: e }); B({ dx: -(1 - e) }); break;
        case 'wipeLeft': A({}); B({ clip: (g) => g.rect(W * (1 - e), 0, W * e + 1, H) }); break;
        case 'wipeRight': A({}); B({ clip: (g) => g.rect(0, 0, W * e, H) }); break;
        case 'wipeDown': A({}); B({ clip: (g) => g.rect(0, 0, W, H * e) }); break;
        case 'circle': A({}); B({ clip: (g) => { g.arc(W / 2, H / 2, Math.hypot(W, H) / 2 * e, 0, Math.PI * 2); } }); break;
        case 'zoomIn': A({ scale: 1 + e * 0.6, alpha: 1 - e }); B({ scale: 0.85 + 0.15 * e, alpha: e }); break;
        case 'zoomOut': A({ scale: 1 - 0.3 * e, alpha: 1 - e }); B({ scale: 1.4 - 0.4 * e, alpha: e }); break;
        case 'spin': if (p < 0.5) A({ rot: e * 360, scale: 1 - e }); else B({ rot: -(1 - e) * 360, scale: e }); break;
        case 'blur': A({ blur: e * 40, alpha: 1 - e * 0.5 }); B({ blur: (1 - e) * 40, alpha: e }); break;
        case 'whip': {
          const b = Math.sin(Math.PI * p) * 50;
          if (p < 0.5) A({ dx: -e * 0.8, blur: b }); else B({ dx: (1 - e) * 0.8, blur: b });
          break;
        }
        case 'glitch': (p < 0.5 ? A : B)({}); this.applyEffect(ctx, 'glitch', 1 - Math.abs(2 * p - 1), p * 3, 'tr'); break;
        default: A({}); B({ alpha: e });
      }
    }

    // Draw a video or image item with transform, keyframes, animation, looks and effects.
    drawVisual(ctx, it, local, len, mod) {
      const src = this.sourceFor(it);
      if (!src) return;
      const { width: W, height: H } = this.canvas;
      const [sw, sh] = this.dims(src);
      if (!sw || !sh) return;
      const tf = L.transformAt(it, local);
      const an = L.animState(it.anim, local, len);
      const fit = it.fit === 'fill' ? Math.max(W / sw, H / sh) : Math.min(W / sw, H / sh);
      const scale = fit * tf.scale * an.scale * num(mod.scale, 1);
      const dw = sw * scale, dh = sh * scale;
      const cx = W / 2 + (tf.x + an.dx + num(mod.dx)) * W, cy = H / 2 + (tf.y + an.dy + num(mod.dy)) * H;
      const rot = (tf.rot + an.rot + num(mod.rot)) * Math.PI / 180;
      const look = L.resolveLook(it);
      const k = Math.min(W, H) / 1080;
      const blur = (look.blur * 0.3 + an.blur + num(mod.blur)) * k;

      const layer = this.temp(0), g = layer.getContext('2d');
      g.filter = cssFilter(look, blur);
      g.translate(cx, cy); g.rotate(rot); g.scale(it.flipH ? -1 : 1, it.flipV ? -1 : 1);
      g.drawImage(src, -dw / 2, -dh / 2, dw, dh);
      g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none';
      this.postLook(g, look, local);
      for (const fx of it.effects || []) this.applyEffect(g, fx.type, num(fx.amount, 0.7), local, it.id + fx.type);

      ctx.save();
      if (mod.clip) { ctx.beginPath(); mod.clip(ctx); ctx.clip(); }
      ctx.globalAlpha = clamp(tf.opacity * an.alpha * num(mod.alpha, 1), 0, 1);
      ctx.globalCompositeOperation = it.blend && it.blend !== 'normal' ? it.blend : 'source-over';
      ctx.drawImage(layer, 0, 0);
      ctx.restore();
      if (!mod.alpha || mod.alpha > 0.5) this.boxes.push({ id: it.id, cx, cy, w: Math.abs(dw), h: Math.abs(dh), rot, main: !!mod.main });
    }
    postLook(g, look, t) {
      const { width: W, height: H } = g.canvas;
      // tints are masked to the clip's own pixels so letterbox areas stay clean
      const tint = (color, alpha, mode) => {
        const m = this.temp(2), mg = m.getContext('2d');
        mg.fillStyle = color; mg.fillRect(0, 0, W, H);
        mg.globalCompositeOperation = 'destination-in'; mg.drawImage(g.canvas, 0, 0);
        g.save(); g.globalCompositeOperation = mode; g.globalAlpha = alpha; g.drawImage(m, 0, 0); g.restore();
      };
      if (look.warmth) tint(look.warmth > 0 ? '#ff8a1f' : '#2f7bff', clamp(Math.abs(look.warmth) / 100 * 0.5, 0, 0.7), 'soft-light');
      if (look.fade > 0) tint('#4a443d', clamp(look.fade / 100, 0, 0.6), 'lighten');
      g.save();
      g.globalCompositeOperation = 'source-atop';
      if (look.vignette > 0) {
        const r = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.hypot(W, H) * 0.6);
        r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, `rgba(0,0,0,${clamp(look.vignette / 100, 0, 1) * 0.85})`);
        g.fillStyle = r; g.fillRect(0, 0, W, H);
      }
      g.restore();
      if (look.grain > 0) { g.save(); g.globalCompositeOperation = 'source-atop'; this.grain(g, look.grain / 100 * 0.5, t, 'source-atop'); g.restore(); }
      if (look.glow > 0) {
        const src = this.temp(3), sg = src.getContext('2d'); sg.drawImage(g.canvas, 0, 0);
        g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = clamp(look.glow / 100, 0, 1) * 0.6;
        g.filter = `blur(${Math.round(Math.min(W, H) * 0.015)}px)`; g.drawImage(src, 0, 0); g.restore();
      }
    }
    grain(g, amount, t, mode = 'overlay') {
      if (!this.grainTile) {
        this.grainTile = mk(256, 256);
        const gg = this.grainTile.getContext('2d'), id = gg.createImageData(256, 256);
        for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
        gg.putImageData(id, 0, 0);
      }
      const { width: W, height: H } = g.canvas;
      g.save();
      g.globalCompositeOperation = mode === 'source-atop' ? 'source-atop' : 'overlay'; g.globalAlpha = clamp(amount, 0, 1) * (mode === 'source-atop' ? 0.35 : 1);
      const f = Math.floor(t * 24);
      g.translate(-rnd(f) * 256, -rnd(f + 3) * 256);
      g.fillStyle = g.createPattern(this.grainTile, 'repeat');
      g.fillRect(0, 0, W + 256, H + 256);
      g.restore();
    }

    // ---------- effects (work on any canvas: one clip, or everything below an effect layer) ----------
    applyEffect(g, type, amt, t, seed = '') {
      const { width: W, height: H } = g.canvas;
      const k = Math.min(W, H) / 1080;
      const snap = () => { const c = this.temp(1); c.getContext('2d').drawImage(g.canvas, 0, 0); return c; };
      const reset = () => { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; };
      const sd = hash(seed);
      reset();
      switch (type) {
        case 'shake': {
          const f = Math.floor(t * 24) + sd;
          const s = snap(); g.clearRect(0, 0, W, H);
          const dx = (rnd(f) - 0.5) * 0.05 * W * amt, dy = (rnd(f + 11) - 0.5) * 0.05 * H * amt;
          g.translate(W / 2 + dx, H / 2 + dy); g.scale(1 + 0.05 * amt, 1 + 0.05 * amt); g.drawImage(s, -W / 2, -H / 2); reset();
          break;
        }
        case 'pulse': {
          const beat = (t * 2) % 1, s = 1 + 0.08 * amt * Math.pow(1 - beat, 3);
          const c = snap(); g.clearRect(0, 0, W, H);
          g.translate(W / 2, H / 2); g.scale(s, s); g.drawImage(c, -W / 2, -H / 2); reset();
          break;
        }
        case 'rgb': this.rgbSplit(g, (0.006 + 0.012 * amt) * W * (0.7 + 0.3 * Math.sin(t * 7))); break;
        case 'glitch': {
          const f = Math.floor(t * 10) + sd;
          if (rnd(f) > 0.25 + (1 - amt) * 0.6) break;
          this.rgbSplit(g, 0.02 * W * amt * (0.5 + rnd(f + 1)));
          const s = snap();
          const bands = 3 + Math.floor(rnd(f + 2) * 6);
          for (let i = 0; i < bands; i++) {
            const y = rnd(f + i * 3) * H, h = (0.02 + rnd(f + i * 5) * 0.08) * H, dx = (rnd(f + i * 7) - 0.5) * 0.15 * W * amt;
            g.drawImage(s, 0, y, W, h, dx, y, W, h);
          }
          break;
        }
        case 'vhs': {
          this.rgbSplit(g, 0.006 * W * amt);
          g.globalAlpha = 0.18 * amt; g.fillStyle = '#000';
          for (let y = 0; y < H; y += Math.max(2, Math.round(4 * k))) g.fillRect(0, y, W, Math.max(1, Math.round(1.5 * k)));
          reset();
          const by = ((t * 0.15) % 1.2 - 0.1) * H;
          g.globalAlpha = 0.12 * amt; g.fillStyle = '#fff'; g.fillRect(0, by, W, H * 0.04); reset();
          this.grain(g, 0.3 * amt, t);
          g.font = `600 ${Math.round(44 * k)}px "Courier New", Menlo, monospace`; g.fillStyle = 'rgba(255,255,255,.9)';
          g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 4 * k; g.textBaseline = 'top';
          g.fillText('PLAY ▶', W * 0.06, H * 0.05);
          const s = Math.floor(t), stamp = `SP  0:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
          g.textBaseline = 'bottom'; g.fillText(stamp, W * 0.06, H * 0.95); reset();
          break;
        }
        case 'oldfilm': {
          const c = snap(); g.clearRect(0, 0, W, H);
          const flick = 1 + (rnd(Math.floor(t * 18) + sd) - 0.5) * 0.18 * amt;
          g.filter = `sepia(${0.75 * amt}) contrast(1.1) brightness(${flick})`; g.drawImage(c, 0, 0); reset();
          this.grain(g, 0.4 * amt, t);
          g.strokeStyle = 'rgba(30,20,10,.5)'; g.lineWidth = Math.max(1, 2 * k);
          const f = Math.floor(t * 12);
          for (let i = 0; i < 3; i++) if (rnd(f + i) < 0.5 * amt) { const x = rnd(f * 3 + i) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (rnd(f + i + 9) - 0.5) * 20 * k, H); g.stroke(); }
          const r = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.6);
          r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, `rgba(20,10,0,${0.7 * amt})`); g.fillStyle = r; g.fillRect(0, 0, W, H);
          break;
        }
        case 'flash': { const ph = (t * 2) % 1; g.globalAlpha = Math.pow(1 - ph, 4) * amt; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); break; }
        case 'strobe': if (Math.floor(t * 12) % 2 === 0) { g.globalCompositeOperation = 'difference'; g.globalAlpha = amt; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); } break;
        case 'pixelate': {
          const block = Math.max(3, Math.round(Math.min(W, H) * (0.008 + 0.04 * amt)));
          const sw = Math.max(1, Math.round(W / block)), sh = Math.max(1, Math.round(H / block));
          const small = mk(sw, sh); small.getContext('2d').drawImage(g.canvas, 0, 0, sw, sh);
          g.clearRect(0, 0, W, H); g.imageSmoothingEnabled = false; g.drawImage(small, 0, 0, W, H); g.imageSmoothingEnabled = true;
          break;
        }
        case 'mirror': { const c = snap(); g.save(); g.translate(W, 0); g.scale(-1, 1); g.drawImage(c, 0, 0, W / 2, H, 0, 0, W / 2, H); g.restore(); break; }
        case 'glow': { const c = snap(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.7 * amt; g.filter = `blur(${Math.round(18 * k)}px) brightness(1.2)`; g.drawImage(c, 0, 0); break; }
        case 'blur': { const c = snap(); g.clearRect(0, 0, W, H); g.filter = `blur(${Math.round(20 * amt * k)}px)`; g.drawImage(c, 0, 0); break; }
        case 'bw': { const c = snap(); g.clearRect(0, 0, W, H); g.filter = `grayscale(${amt}) contrast(${1 + 0.2 * amt})`; g.drawImage(c, 0, 0); break; }
        case 'letterbox': { const bh = H * 0.13 * amt; g.fillStyle = '#000'; g.fillRect(0, 0, W, bh); g.fillRect(0, H - bh, W, bh); break; }
        case 'lightleak': {
          g.globalCompositeOperation = 'screen';
          const blobs = [['255,120,40', 0.2, 0.3], ['255,60,120', 0.8, 0.7], ['255,200,80', 0.5, 0.1]];
          blobs.forEach(([c, x0, y0], i) => {
            const x = (x0 + 0.25 * Math.sin(t * 0.6 + i * 2)) * W, y = (y0 + 0.2 * Math.cos(t * 0.5 + i)) * H, r = Math.max(W, H) * 0.55;
            const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${0.55 * amt})`); gr.addColorStop(1, `rgba(${c},0)`);
            g.fillStyle = gr; g.fillRect(0, 0, W, H);
          });
          break;
        }
        case 'scanlines': { g.globalAlpha = 0.25 * amt; g.fillStyle = '#000'; for (let y = 0; y < H; y += Math.max(3, Math.round(6 * k))) g.fillRect(0, y, W, Math.max(1, Math.round(2 * k))); break; }
        case 'snow': case 'sparkles': case 'confetti': case 'hearts': this.particles(g, type, amt, t, sd); break;
        default: break;
      }
      reset();
    }
    rgbSplit(g, off) {
      const { width: W, height: H } = g.canvas;
      const src = this.temp(1); src.getContext('2d').drawImage(g.canvas, 0, 0);
      const chan = (i, color) => {
        const c = this.temp(4 + i), cg = c.getContext('2d');
        cg.drawImage(src, 0, 0);
        cg.globalCompositeOperation = 'multiply'; cg.fillStyle = color; cg.fillRect(0, 0, W, H);
        cg.globalCompositeOperation = 'destination-in'; cg.drawImage(src, 0, 0);
        return c;
      };
      const r = chan(0, '#f00'), gr = chan(1, '#0f0'), b = chan(2, '#00f');
      g.save(); g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
      g.drawImage(r, -off, 0); g.drawImage(gr, 0, 0); g.drawImage(b, off, 0);
      g.restore();
    }
    particles(g, type, amt, t, sd) {
      const { width: W, height: H } = g.canvas, k = Math.min(W, H) / 1080;
      const n = Math.round(20 + 70 * amt);
      g.save();
      for (let i = 0; i < n; i++) {
        const a = rnd(i + sd), b = rnd(i * 7 + sd), c = rnd(i * 13 + sd);
        const speed = 0.08 + b * 0.15;
        let x = a * W, y;
        if (type === 'hearts') { y = H - ((c + t * speed) % 1.1) * H * 1.1; x += Math.sin(t * 2 + i) * 20 * k; }
        else { y = ((c + t * speed * (type === 'confetti' ? 2.2 : 1)) % 1.1 - 0.05) * H; x += Math.sin(t * (1 + b) + i) * 30 * k; }
        if (type === 'snow') { g.globalAlpha = 0.5 + 0.5 * b; g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, (2 + 5 * c) * k, 0, Math.PI * 2); g.fill(); }
        else if (type === 'sparkles') {
          const tw = 0.5 + 0.5 * Math.sin(t * 6 + i * 3); g.globalAlpha = tw; g.fillStyle = i % 3 ? '#fff6c8' : '#ffffff';
          const s = (6 + 14 * c) * k * tw; g.beginPath();
          for (let j = 0; j < 8; j++) { const ang = j * Math.PI / 4, r = j % 2 ? s * 0.25 : s; g.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r); }
          g.fill();
        } else if (type === 'confetti') {
          g.globalAlpha = 0.95; g.fillStyle = ['#f97316', '#facc15', '#22c55e', '#3b82f6', '#ec4899', '#a855f7'][i % 6];
          g.translate(x, y); g.rotate(t * 4 + i); g.fillRect(-6 * k, -3 * k, 12 * k, 6 * k); g.setTransform(1, 0, 0, 1, 0, 0);
        } else {
          g.globalAlpha = Math.min(1, (y / H) * 1.4); g.font = `${Math.round((30 + 40 * c) * k)}px sans-serif`; g.textAlign = 'center';
          g.fillText(i % 4 ? '💖' : '💕', x, y);
        }
      }
      g.restore();
    }

    // ---------- text ----------
    drawText(ly) {
      const it = ly.it, s = it.style || {};
      const text = s.upper ? String(it.text || '').toUpperCase() : String(it.text || '');
      this.renderTextBlock(it, ly.local, ly.len, text, s, null);
    }
    drawSticker(ly) {
      const it = ly.it;
      this.renderTextBlock(it, ly.local, ly.len, it.emoji, { ...L.TEXT_PRESETS.classic.style, size: num(it.size, 220), shadow: false, weight: 400, font: 'Apple Color Emoji' }, null);
    }
    drawCaption(ly) {
      const st = this.P.captions.style || {}, cap = ly.cap;
      const words = L.wordsFor(cap).map((w) => ({ ...w, w: st.upper ? w.w.toUpperCase() : w.w }));
      const style = { ...L.TEXT_PRESETS.classic.style, font: st.font, size: num(st.size, 64), weight: 800, color: st.color, stroke: num(st.stroke, 8),
        shadow: !!st.shadow || !st.stroke, box: false, align: 'center' };
      const fake = { id: 'caption-' + cap.id, tf: { x: 0, y: num(st.y, 0.28), scale: 1, rot: 0, opacity: 1 }, kf: {},
        anim: { in: { type: st.anim === 'fade' ? 'fade' : st.anim === 'pop' ? 'pop' : 'none', dur: 0.18 }, out: { type: 'none' } } };
      this.renderTextBlock(fake, ly.local, cap.end - cap.start, words.map((w) => w.w).join(' '), style, { words, t: this.t, highlight: st.highlight, box: !!st.box, pop: st.anim === 'pop' });
    }
    font(s, px) { return `${s.italic ? 'italic ' : ''}${num(s.weight, 700)} ${px}px "${s.font || 'Helvetica Neue'}", -apple-system, "Helvetica Neue", Arial, sans-serif`; }
    // Lays out and draws text with stroke, shadow, glow, background boxes, letter animations and karaoke words.
    renderTextBlock(it, local, len, text, s, karaoke) {
      const { ctx } = this, { width: W, height: H } = this.canvas;
      const k = Math.min(W, H) / 1080;
      const tf = L.transformAt(it, local);
      const an = L.animState(it.anim, local, len);
      const px = Math.max(4, num(s.size, 96) * k);
      ctx.save();
      ctx.font = this.font(s, px);
      try { ctx.letterSpacing = `${num(s.spacing) * k}px`; } catch (_) { /* older engines */ }
      const maxW = W * 0.88 / Math.max(0.2, tf.scale);
      // word wrap
      const lines = [];
      if (karaoke) {
        let line = [];
        karaoke.words.forEach((w, i) => {
          const test = [...line, i].map((j) => karaoke.words[j].w).join(' ');
          if (line.length && ctx.measureText(test).width > maxW) { lines.push(line); line = [i]; } else line.push(i);
        });
        if (line.length) lines.push(line);
      } else {
        for (const para of text.split('\n')) {
          let cur = '';
          for (const w of para.split(' ')) {
            const test = cur ? cur + ' ' + w : w;
            if (cur && ctx.measureText(test).width > maxW) { lines.push(cur); cur = w; } else cur = test;
          }
          lines.push(cur);
        }
      }
      const lineText = (ln) => (karaoke ? ln.map((j) => karaoke.words[j].w).join(' ') : ln);
      const lh = px * num(s.lineHeight, 1.15);
      const widths = lines.map((ln) => ctx.measureText(lineText(ln)).width);
      const blockW = Math.max(1, ...widths), blockH = lh * lines.length;
      const cx = W / 2 + (tf.x + an.dx) * W, cy = H / 2 + (tf.y + an.dy) * H;
      ctx.translate(cx, cy);
      ctx.rotate((tf.rot + an.rot) * Math.PI / 180);
      const sc = tf.scale * an.scale; ctx.scale(sc, sc);
      ctx.globalAlpha = clamp(tf.opacity * an.alpha, 0, 1);
      if (an.blur > 0) ctx.filter = `blur(${an.blur * k}px)`;
      ctx.textBaseline = 'middle';
      const align = s.align || 'center';
      const xFor = (w) => (align === 'left' ? -blockW / 2 : align === 'right' ? blockW / 2 - w : -w / 2);
      const pad = px * 0.28;
      // background boxes, one per line
      if (s.box) {
        ctx.save(); ctx.globalAlpha *= clamp(num(s.boxOpacity, 0.7), 0, 1); ctx.fillStyle = s.boxColor || '#000';
        lines.forEach((ln, i) => {
          const y = -blockH / 2 + i * lh;
          roundRect(ctx, xFor(widths[i]) - pad, y - pad * 0.15, widths[i] + pad * 2, lh + pad * 0.3, num(s.boxRadius, 16) * k);
          ctx.fill();
        });
        ctx.restore();
      }
      const letters = an.letters;
      const total = lines.reduce((n, ln) => n + lineText(ln).length, 0);
      let charIndex = 0;
      const paint = (str, x, y, color, extra = {}) => {
        ctx.save();
        if (extra.alpha != null) ctx.globalAlpha *= extra.alpha;
        if (extra.dy || extra.scale) { const ow = extra.ow || 0; ctx.translate(x + ow / 2, y + (extra.dy || 0)); if (extra.scale) ctx.scale(extra.scale, extra.scale); x = -ow / 2; y = 0; }
        if (num(s.glow) > 0) { ctx.shadowColor = color; ctx.shadowBlur = num(s.glow) * k; ctx.fillStyle = color; ctx.fillText(str, x, y); }
        if (s.shadow) { ctx.shadowColor = s.shadowColor || 'rgba(0,0,0,.5)'; ctx.shadowBlur = num(s.shadowBlur, 12) * k; ctx.shadowOffsetX = num(s.shadowX) * k; ctx.shadowOffsetY = num(s.shadowY, 6) * k; }
        if (num(s.stroke) > 0) {
          ctx.lineJoin = 'round'; ctx.miterLimit = 2; ctx.lineWidth = num(s.stroke) * 2 * k; ctx.strokeStyle = s.strokeColor || '#000';
          ctx.strokeText(str, x, y); ctx.shadowColor = 'transparent';
        }
        ctx.fillStyle = color; ctx.fillText(str, x, y);
        ctx.restore();
      };
      lines.forEach((ln, li) => {
        const y = -blockH / 2 + li * lh + lh / 2;
        let x = xFor(widths[li]);
        if (karaoke) {
          ctx.textAlign = 'left';
          ln.forEach((j, n) => {
            const w = karaoke.words[j];
            const word = w.w + (n < ln.length - 1 ? ' ' : '');
            const ww = ctx.measureText(word).width, wordW = ctx.measureText(w.w).width;
            const on = karaoke.t >= w.t0 && karaoke.t < w.t1;
            if (on && karaoke.box) {
              ctx.save(); ctx.fillStyle = karaoke.highlight; roundRect(ctx, x - pad * 0.5, y - lh / 2, wordW + pad, lh, 12 * k); ctx.fill(); ctx.restore();
              paint(w.w, x, y, s.color);
            } else {
              const pop = on && karaoke.pop ? 1 + 0.12 * Math.max(0, 1 - (karaoke.t - w.t0) / 0.15) : 1;
              paint(w.w, x, y, on ? karaoke.highlight : s.color, pop !== 1 ? { scale: pop, ow: wordW } : {});
            }
            x += ww;
          });
          return;
        }
        const str = ln;
        if (!letters) { ctx.textAlign = 'left'; paint(str, x, y, s.color); return; }
        ctx.textAlign = 'left';
        const p = letters.p;
        if (letters.type === 'typewriter') {
          const showN = Math.round(total * p) - charIndex;
          if (showN > 0) paint(str.slice(0, showN), x, y, s.color);
          charIndex += str.length;
          return;
        }
        for (let ci = 0; ci < str.length; ci++) {
          const ch = str[ci];
          const cw = ctx.measureText(ch).width + num(s.spacing) * k;
          const order = (charIndex + ci) / Math.max(1, total);
          const local2 = clamp((p * 1.6 - order * 0.6), 0, 1); // staggered 0..1 per letter
          const e = L.EASE.out(local2);
          if (letters.type === 'wave') paint(ch, x, y, s.color, { alpha: e, dy: (1 - L.EASE.back(local2)) * px * 0.8, ow: cw });
          else paint(ch, x, y, s.color, { alpha: e, scale: 0.6 + 0.4 * e, ow: cw });
          x += cw;
        }
        charIndex += str.length;
      });
      ctx.restore();
      this.boxes.push({ id: it.id, cx, cy, w: (blockW + pad * 2) * sc, h: blockH * sc, rot: (tf.rot + an.rot) * Math.PI / 180, text: true });
    }

    // Box of the topmost item under a canvas point.
    hit(x, y) {
      for (let i = this.boxes.length - 1; i >= 0; i--) {
        const b = this.boxes[i];
        const dx = x - b.cx, dy = y - b.cy, c = Math.cos(-b.rot), s = Math.sin(-b.rot);
        const lx = dx * c - dy * s, ly = dx * s + dy * c;
        if (Math.abs(lx) <= b.w / 2 && Math.abs(ly) <= b.h / 2) return b;
      }
      return null;
    }
  }

  function cssFilter(l, blur) {
    const f = [];
    if (l.brightness) f.push(`brightness(${1 + l.brightness / 100 * 0.6})`);
    if (l.contrast) f.push(`contrast(${1 + l.contrast / 100})`);
    if (l.saturation) f.push(`saturate(${Math.max(0, 1 + l.saturation / 100)})`);
    if (l.hue) f.push(`hue-rotate(${l.hue}deg)`);
    if (l.sepia) f.push(`sepia(${clamp(l.sepia / 100, 0, 1)})`);
    if (l.gray) f.push(`grayscale(${clamp(l.gray / 100, 0, 1)})`);
    if (blur > 0.2) f.push(`blur(${blur.toFixed(1)}px)`);
    return f.length ? f.join(' ') : 'none';
  }
  function roundRect(g, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function hash(s) { let h = 0; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h % 1000); }

  Compositor.cssFilter = cssFilter;
  window.Compositor = Compositor;
})();
