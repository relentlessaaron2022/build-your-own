// Cutroom engine: project model, timeline math, keyframes, animations,
// presets, audio mix graph (ffmpeg), captions, and beat detection.
// Shared by the page (window.CutroomLib) and Node (main process + tests).
(function (root) {
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // ---------------- canvas ----------------
  const ASPECTS = {
    '9:16': { label: '9:16 · Reels, TikTok, Shorts', w: 9, h: 16 },
    '16:9': { label: '16:9 · YouTube, widescreen', w: 16, h: 9 },
    '1:1': { label: '1:1 · Square', w: 1, h: 1 },
    '4:5': { label: '4:5 · Instagram feed', w: 4, h: 5 },
    '3:4': { label: '3:4 · Portrait', w: 3, h: 4 },
    '4:3': { label: '4:3 · Classic', w: 4, h: 3 },
    '21:9': { label: '21:9 · Cinema', w: 21, h: 9 },
  };
  // short side in pixels
  const RESOLUTIONS = { 720: '720p', 1080: '1080p', 1440: '2K', 2160: '4K' };
  function canvasSize(aspect, shortSide = 1080) {
    const a = ASPECTS[aspect] || ASPECTS['9:16'];
    const even = (v) => Math.round(v / 2) * 2;
    if (a.w >= a.h) return { w: even(shortSide * a.w / a.h), h: even(shortSide) };
    return { w: even(shortSide), h: even(shortSide * a.h / a.w) };
  }

  // ---------------- model ----------------
  const TF = () => ({ x: 0, y: 0, scale: 1, rot: 0, opacity: 1 });
  const ADJ = () => ({ brightness: 0, contrast: 0, saturation: 0, warmth: 0, hue: 0, fade: 0, vignette: 0, grain: 0, blur: 0 });
  function newProject() {
    return {
      version: 2, name: 'Untitled project', fps: 30,
      canvas: { aspect: '9:16', bg: 'blur', color: '#000000' },
      media: [],
      tracks: [
        { id: 'text1', type: 'text', name: 'Text', items: [] },
        { id: 'ovl1', type: 'overlay', name: 'Overlay', items: [] },
        { id: 'main', type: 'main', name: 'Main', items: [] },
        { id: 'aud1', type: 'audio', name: 'Audio', items: [] },
      ],
      captions: { items: [], style: { preset: 'bold', font: 'Futura', size: 64, y: 0.28, color: '#ffffff', highlight: '#ffe600', stroke: 8, upper: true, words: 3, anim: 'pop', box: false } },
      export: { res: 1080, quality: 'high', encoder: 'x264', loudness: true },
    };
  }
  function newClip(media, extra = {}) {
    const isVideo = media.kind === 'video';
    return {
      id: uid(), type: isVideo ? 'video' : 'image', mediaId: media.id, name: media.name,
      in: 0, out: isVideo ? media.duration : undefined, duration: isVideo ? undefined : 3,
      speed: 1, volume: 1, mute: false, fadeIn: 0, fadeOut: 0, voice: 'none', denoise: false,
      fit: 'fit', blend: 'normal', flipH: false, flipV: false,
      tf: TF(), kf: {}, anim: { in: { type: 'none', dur: 0.5 }, out: { type: 'none', dur: 0.5 }, loop: { type: 'none', speed: 1 } },
      filter: { preset: 'none', amount: 1 }, adjust: ADJ(), effects: [],
      transition: { type: 'none', duration: 0.6 },
      ...extra,
    };
  }
  function newText(text = 'Your text', extra = {}) {
    return {
      id: uid(), type: 'text', start: 0, duration: 3, text,
      style: { ...TEXT_PRESETS.classic.style },
      tf: TF(), kf: {}, anim: { in: { type: 'pop', dur: 0.4 }, out: { type: 'fade', dur: 0.3 }, loop: { type: 'none', speed: 1 } },
      ...extra,
    };
  }
  function newSticker(emoji, extra = {}) {
    return { id: uid(), type: 'sticker', start: 0, duration: 3, emoji, size: 220, tf: { ...TF(), x: 0.22, y: -0.22 }, kf: {},
      anim: { in: { type: 'pop', dur: 0.35 }, out: { type: 'fade', dur: 0.3 }, loop: { type: 'float', speed: 1 } }, ...extra };
  }
  function newEffect(effect, extra = {}) {
    return { id: uid(), type: 'effect', start: 0, duration: 3, effect, amount: 0.7, ...extra };
  }
  function newAudio(media, extra = {}) {
    return { id: uid(), type: 'audio', mediaId: media.id, name: media.name, start: 0, in: 0, out: media.duration,
      speed: 1, volume: 1, fadeIn: 0, fadeOut: 0, voice: 'none', denoise: false, role: 'music', beats: [], ...extra };
  }

  // ---------------- timing ----------------
  function itemLength(it) {
    if (it.type === 'video' || it.type === 'audio') return Math.max(0.05, (num(it.out) - num(it.in)) / num(it.speed, 1));
    return Math.max(0.05, num(it.duration, 3));
  }
  const mainTrack = (P) => P.tracks.find((t) => t.type === 'main');

  // Transition into main clip i, clamped so neighbours can both have one.
  function transitionFor(items, i) {
    if (i <= 0) return { type: 'none', duration: 0 };
    const t = items[i].transition || {};
    if (!t.type || t.type === 'none') return { type: 'none', duration: 0 };
    const max = Math.min(itemLength(items[i - 1]), itemLength(items[i])) * 0.45;
    return { type: t.type, duration: r3(clamp(num(t.duration, 0.6), 0.1, Math.max(0.1, max))) };
  }
  function layoutMain(items) {
    let end = 0;
    return items.map((c, i) => {
      const tr = transitionFor(items, i);
      const start = i === 0 ? 0 : Math.max(0, end - tr.duration);
      const len = itemLength(c);
      end = start + len;
      return { start: r3(start), len: r3(len), end: r3(end), transition: tr };
    });
  }
  function itemSpan(P, track, it) {
    if (track.type === 'main') {
      const lay = layoutMain(track.items)[track.items.indexOf(it)];
      return { start: lay.start, end: lay.end, len: lay.len };
    }
    const len = itemLength(it);
    return { start: num(it.start), end: num(it.start) + len, len };
  }
  function duration(P) {
    let visual = 0, audio = 0;
    for (const tr of P.tracks) {
      if (tr.type === 'main') { const l = layoutMain(tr.items); if (l.length) visual = Math.max(visual, l[l.length - 1].end); continue; }
      for (const it of tr.items) {
        const end = num(it.start) + itemLength(it);
        if (tr.type === 'audio') audio = Math.max(audio, end); else visual = Math.max(visual, end);
      }
    }
    for (const c of P.captions?.items || []) visual = Math.max(visual, c.end);
    return r3(visual || audio);
  }
  // Source time inside the media file for a clip at local (timeline) time.
  const sourceTime = (it, local) => clamp(num(it.in) + local * num(it.speed, 1), 0, num(it.out, Infinity) - 0.001);

  // ---------------- easing & keyframes ----------------
  const EASE = {
    linear: (p) => p,
    in: (p) => p * p * p,
    out: (p) => 1 - Math.pow(1 - p, 3),
    inout: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    back: (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
    bounce: (p) => {
      const n1 = 7.5625, d1 = 2.75;
      if (p < 1 / d1) return n1 * p * p;
      if (p < 2 / d1) return n1 * (p -= 1.5 / d1) * p + 0.75;
      if (p < 2.5 / d1) return n1 * (p -= 2.25 / d1) * p + 0.9375;
      return n1 * (p -= 2.625 / d1) * p + 0.984375;
    },
  };
  const KF_PROPS = ['x', 'y', 'scale', 'rot', 'opacity'];
  function kfValue(list, t, base) {
    if (!list || !list.length) return base;
    if (t <= list[0].t) return list[0].v;
    const last = list[list.length - 1];
    if (t >= last.t) return last.v;
    for (let i = 0; i < list.length - 1; i++) {
      const a = list[i], b = list[i + 1];
      if (t >= a.t && t <= b.t) {
        const p = (t - a.t) / Math.max(1e-6, b.t - a.t);
        return a.v + (b.v - a.v) * (EASE[b.e || 'inout'] || EASE.inout)(p);
      }
    }
    return base;
  }
  function transformAt(it, local) {
    const tf = it.tf || TF(), out = {};
    for (const k of KF_PROPS) out[k] = kfValue(it.kf && it.kf[k], local, num(tf[k], k === 'scale' || k === 'opacity' ? 1 : 0));
    return out;
  }
  // Set or update a keyframe at local time t (within 1/60s of an existing one).
  function setKeyframe(it, prop, t, v) {
    it.kf = it.kf || {};
    const list = (it.kf[prop] = it.kf[prop] || []);
    const hit = list.find((k) => Math.abs(k.t - t) < 1 / 60);
    if (hit) hit.v = v; else list.push({ t: r3(t), v, e: 'inout' });
    list.sort((a, b) => a.t - b.t);
  }
  function removeKeyframe(it, prop, t) {
    if (!it.kf || !it.kf[prop]) return;
    it.kf[prop] = it.kf[prop].filter((k) => Math.abs(k.t - t) >= 1 / 60);
    if (!it.kf[prop].length) delete it.kf[prop];
  }
  const MOTION_PRESETS = {
    zoomIn: { label: 'Slow zoom in', make: (len) => ({ scale: [[0, 1], [len, 1.25]] }) },
    zoomOut: { label: 'Slow zoom out', make: (len) => ({ scale: [[0, 1.25], [len, 1]] }) },
    panLeft: { label: 'Pan to the left', make: (len) => ({ scale: [[0, 1.2], [len, 1.2]], x: [[0, 0.08], [len, -0.08]] }) },
    panRight: { label: 'Pan to the right', make: (len) => ({ scale: [[0, 1.2], [len, 1.2]], x: [[0, -0.08], [len, 0.08]] }) },
    rise: { label: 'Rise up', make: (len) => ({ scale: [[0, 1.15], [len, 1.15]], y: [[0, 0.06], [len, -0.06]] }) },
    punch: { label: 'Punch in', make: (len) => ({ scale: [[0, 1], [Math.min(0.25, len / 3), 1.35], [len, 1.4]] }) },
    tilt: { label: 'Dutch tilt', make: (len) => ({ rot: [[0, -3], [len, 3]], scale: [[0, 1.15], [len, 1.15]] }) },
  };
  function applyMotion(it, key, len) {
    const spec = MOTION_PRESETS[key];
    it.kf = {};
    if (!spec) return;
    for (const [prop, pts] of Object.entries(spec.make(len))) it.kf[prop] = pts.map(([t, v]) => ({ t: r3(t), v, e: 'inout' }));
  }

  // ---------------- animations ----------------
  const ANIM_IN = { none: 'None', fade: 'Fade', pop: 'Pop', zoomIn: 'Zoom in', zoomOut: 'Zoom from big', slideUp: 'Slide up', slideDown: 'Slide down', slideLeft: 'Slide from right', slideRight: 'Slide from left', blur: 'Blur in', spin: 'Spin in', drop: 'Drop & bounce', typewriter: 'Typewriter', wave: 'Wave letters', letters: 'Letter by letter' };
  const ANIM_OUT = { none: 'None', fade: 'Fade', pop: 'Shrink', zoomOut: 'Zoom away', zoomIn: 'Zoom through', slideUp: 'Slide up', slideDown: 'Slide down', slideLeft: 'Slide left', slideRight: 'Slide right', blur: 'Blur out', spin: 'Spin out', typewriter: 'Erase', letters: 'Letters out' };
  const ANIM_LOOP = { none: 'None', pulse: 'Pulse', float: 'Float', shake: 'Shake', wiggle: 'Wiggle', flicker: 'Flicker', swing: 'Swing', heartbeat: 'Heartbeat' };
  const LETTER_ANIMS = new Set(['typewriter', 'wave', 'letters']);
  const rnd = (n) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

  function animOne(type, p, dir) {
    // p: 0 hidden .. 1 fully shown; dir 'in' | 'out'
    const s = { alpha: 1, dx: 0, dy: 0, scale: 1, rot: 0, blur: 0, letters: null };
    const e = EASE.out(p), back = EASE.back(p);
    switch (type) {
      case 'fade': s.alpha = p; break;
      case 'pop': s.scale = dir === 'in' ? Math.max(0, back) : e; s.alpha = Math.min(1, p * 3); break;
      case 'zoomIn': s.scale = dir === 'in' ? 0.3 + 0.7 * e : 1 + (1 - e) * 1.5; s.alpha = e; break;
      case 'zoomOut': s.scale = dir === 'in' ? 1 + (1 - e) * 1.2 : 0.3 + 0.7 * e; s.alpha = e; break;
      case 'slideUp': s.dy = (dir === 'in' ? 1 : -1) * (1 - e) * 0.25; s.alpha = e; break;
      case 'slideDown': s.dy = (dir === 'in' ? -1 : 1) * (1 - e) * 0.25; s.alpha = e; break;
      case 'slideLeft': s.dx = (dir === 'in' ? 1 : -1) * (1 - e) * 0.6; s.alpha = e; break;
      case 'slideRight': s.dx = (dir === 'in' ? -1 : 1) * (1 - e) * 0.6; s.alpha = e; break;
      case 'blur': s.blur = (1 - e) * 30; s.alpha = e; break;
      case 'spin': s.rot = (1 - e) * (dir === 'in' ? -270 : 270); s.scale = e; s.alpha = e; break;
      case 'drop': s.dy = -(1 - EASE.bounce(p)) * 0.4; s.alpha = Math.min(1, p * 4); break;
      case 'typewriter': case 'wave': case 'letters': s.letters = { type, p }; break;
      default: break;
    }
    return s;
  }
  function loopState(loop, t) {
    const s = { dx: 0, dy: 0, scale: 1, rot: 0, alpha: 1 };
    if (!loop || loop.type === 'none') return s;
    const sp = num(loop.speed, 1), w = t * sp;
    switch (loop.type) {
      case 'pulse': s.scale = 1 + 0.06 * Math.sin(w * Math.PI * 2); break;
      case 'float': s.dy = 0.012 * Math.sin(w * Math.PI * 1.2); break;
      case 'shake': s.dx = (rnd(Math.floor(w * 30)) - 0.5) * 0.012; s.dy = (rnd(Math.floor(w * 30) + 7) - 0.5) * 0.012; break;
      case 'wiggle': s.rot = 6 * Math.sin(w * Math.PI * 3); break;
      case 'flicker': s.alpha = rnd(Math.floor(w * 18)) < 0.15 ? 0.35 : 1; break;
      case 'swing': s.rot = 10 * Math.sin(w * Math.PI * 1.4); break;
      case 'heartbeat': { const f = (w % 1); s.scale = 1 + 0.1 * (Math.exp(-((f - 0.1) ** 2) / 0.002) + 0.6 * Math.exp(-((f - 0.3) ** 2) / 0.002)); break; }
      default: break;
    }
    return s;
  }
  // Combined animation state for an item at local time t of length len.
  function animState(anim, t, len) {
    const out = { alpha: 1, dx: 0, dy: 0, scale: 1, rot: 0, blur: 0, letters: null };
    if (!anim) return out;
    const merge = (s) => {
      out.alpha *= s.alpha; out.dx += s.dx; out.dy += s.dy; out.scale *= s.scale; out.rot += s.rot; out.blur += s.blur || 0;
      if (s.letters) out.letters = s.letters;
    };
    const ai = anim.in || {}, ao = anim.out || {};
    const di = Math.min(num(ai.dur, 0.5), len / 2), dout = Math.min(num(ao.dur, 0.5), len / 2);
    if (ai.type && ai.type !== 'none' && t < di) merge(animOne(ai.type, clamp(t / di, 0, 1), 'in'));
    else if (ao.type && ao.type !== 'none' && t > len - dout) {
      const s = animOne(ao.type, clamp((len - t) / dout, 0, 1), 'out');
      if (s.letters) s.letters.out = true;
      merge(s);
    }
    merge(loopState(anim.loop, t));
    return out;
  }

  // ---------------- looks ----------------
  // Each filter is a set of adjustments; amount 0..1 blends toward neutral.
  const FILTERS = {
    none: { label: 'Original' },
    vivid: { label: 'Vivid', saturation: 35, contrast: 10 },
    pop: { label: 'Pop', saturation: 60, contrast: 18, brightness: 3 },
    golden: { label: 'Golden', warmth: 45, saturation: 18, brightness: 4 },
    sunset: { label: 'Sunset', warmth: 60, hue: -8, saturation: 25, vignette: 25 },
    coolblue: { label: 'Blue hour', warmth: -40, saturation: -5, contrast: 6 },
    cinematic: { label: 'Cinematic', contrast: 16, saturation: -10, warmth: 8, vignette: 35, fade: 5 },
    moody: { label: 'Moody', brightness: -10, contrast: 22, saturation: -22, warmth: -12, vignette: 45 },
    faded: { label: 'Faded', contrast: -15, brightness: 5, saturation: -25, fade: 18 },
    matte: { label: 'Matte', contrast: -20, fade: 22, saturation: -8 },
    pastel: { label: 'Pastel', saturation: -30, brightness: 10, contrast: -10, fade: 20 },
    retro: { label: 'Retro film', sepia: 35, contrast: -8, saturation: -15, fade: 12, grain: 30, vignette: 30 },
    vintage: { label: 'Vintage', sepia: 55, contrast: -12, vignette: 50, grain: 40 },
    noir: { label: 'Noir', gray: 100, contrast: 30, vignette: 30 },
    softbw: { label: 'Soft B&W', gray: 100, contrast: -8, fade: 12 },
    night: { label: 'Night city', brightness: -14, warmth: -45, saturation: -20, contrast: 12 },
    cyber: { label: 'Cyber', hue: 35, saturation: 45, contrast: 12, warmth: -30 },
    dreamy: { label: 'Dreamy', brightness: 8, saturation: 10, fade: 10, glow: 45 },
  };
  const ADJUST_KEYS = { brightness: 'Brightness', contrast: 'Contrast', saturation: 'Saturation', warmth: 'Warmth', hue: 'Hue', fade: 'Fade', vignette: 'Vignette', grain: 'Grain', blur: 'Blur' };
  // Resolve filter preset + manual adjust into one set of numbers.
  function resolveLook(it) {
    const f = FILTERS[it.filter?.preset] || FILTERS.none, a = num(it.filter?.amount, 1);
    const adj = it.adjust || {};
    const look = {};
    for (const k of ['brightness', 'contrast', 'saturation', 'warmth', 'hue', 'fade', 'vignette', 'grain', 'blur', 'sepia', 'gray', 'glow']) {
      look[k] = num(f[k]) * a + num(adj[k]);
    }
    return look;
  }

  const EFFECTS = {
    shake: { label: 'Camera shake', icon: '〰️' },
    pulse: { label: 'Beat pulse', icon: '💓' },
    rgb: { label: 'RGB split', icon: '🌈' },
    glitch: { label: 'Glitch', icon: '⚡️' },
    vhs: { label: 'VHS tape', icon: '📼' },
    oldfilm: { label: 'Old film', icon: '🎞' },
    flash: { label: 'Flash', icon: '✨' },
    strobe: { label: 'Strobe', icon: '🔦' },
    pixelate: { label: 'Pixelate', icon: '👾' },
    mirror: { label: 'Mirror', icon: '🪞' },
    glow: { label: 'Glow', icon: '🌟' },
    letterbox: { label: 'Cinema bars', icon: '🎬' },
    lightleak: { label: 'Light leak', icon: '🌅' },
    blur: { label: 'Dream blur', icon: '💭' },
    bw: { label: 'Black & white', icon: '⚫️' },
    snow: { label: 'Snowfall', icon: '❄️' },
    sparkles: { label: 'Sparkles', icon: '💫' },
    confetti: { label: 'Confetti', icon: '🎉' },
    hearts: { label: 'Floating hearts', icon: '💖' },
    scanlines: { label: 'Scan lines', icon: '📺' },
  };
  const TRANSITIONS = {
    none: 'Cut', fade: 'Crossfade', black: 'Dip to black', white: 'Dip to white', flash: 'Flash',
    slideLeft: 'Slide left', slideRight: 'Slide right', slideUp: 'Slide up', slideDown: 'Slide down',
    pushLeft: 'Push left', pushRight: 'Push right', wipeLeft: 'Wipe left', wipeRight: 'Wipe right', wipeDown: 'Wipe down',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', spin: 'Spin', blur: 'Blur', whip: 'Whip pan', glitch: 'Glitch', circle: 'Circle reveal',
  };
  const FONTS = ['Futura', 'Avenir Next', 'Helvetica Neue', 'Impact', 'Arial Black', 'Gill Sans', 'Optima', 'Georgia', 'Didot', 'Baskerville',
    'American Typewriter', 'Courier New', 'Menlo', 'Marker Felt', 'Chalkboard SE', 'Noteworthy', 'Bradley Hand', 'Snell Roundhand',
    'Copperplate', 'Rockwell', 'Phosphate', 'Trebuchet MS', 'Verdana'];
  const baseStyle = { font: 'Futura', size: 96, weight: 800, italic: false, color: '#ffffff', align: 'center', spacing: 0, lineHeight: 1.15,
    stroke: 0, strokeColor: '#000000', shadow: false, shadowColor: '#000000', shadowBlur: 12, shadowX: 0, shadowY: 6,
    box: false, boxColor: '#000000', boxOpacity: 0.7, boxRadius: 18, upper: false, glow: 0 };
  const TEXT_PRESETS = {
    classic: { label: 'Classic', style: { ...baseStyle, shadow: true, shadowColor: 'rgba(0,0,0,.45)' } },
    outline: { label: 'Bold outline', style: { ...baseStyle, font: 'Arial Black', weight: 900, stroke: 10, upper: true } },
    yellow: { label: 'Yellow pop', style: { ...baseStyle, font: 'Impact', weight: 400, color: '#ffe600', stroke: 9, shadow: true, shadowY: 8, upper: true } },
    neon: { label: 'Neon', style: { ...baseStyle, font: 'Avenir Next', weight: 700, color: '#7df9ff', glow: 30 } },
    pink: { label: 'Hot pink', style: { ...baseStyle, font: 'Futura', weight: 800, color: '#ff4fa3', glow: 22, upper: true } },
    boxed: { label: 'Boxed', style: { ...baseStyle, font: 'Helvetica Neue', weight: 700, color: '#111111', box: true, boxColor: '#ffffff', boxOpacity: 1, size: 72 } },
    label: { label: 'Label', style: { ...baseStyle, font: 'Avenir Next', weight: 800, color: '#ffffff', box: true, boxColor: '#f97316', boxOpacity: 1, size: 70, upper: true } },
    subtitle: { label: 'Subtitle', style: { ...baseStyle, font: 'Helvetica Neue', weight: 600, size: 58, box: true, boxOpacity: 0.55, boxRadius: 10 } },
    retro: { label: 'Retro', style: { ...baseStyle, font: 'Phosphate', weight: 400, color: '#ff8a00', shadow: true, shadowColor: '#6d28d9', shadowBlur: 0, shadowX: 7, shadowY: 7, upper: true } },
    cinema: { label: 'Cinematic', style: { ...baseStyle, font: 'Didot', weight: 400, size: 72, spacing: 14, upper: true, shadow: true, shadowColor: 'rgba(0,0,0,.5)' } },
    hand: { label: 'Handwritten', style: { ...baseStyle, font: 'Marker Felt', weight: 400, size: 100, shadow: true, shadowColor: 'rgba(0,0,0,.4)' } },
    type: { label: 'Typewriter', style: { ...baseStyle, font: 'American Typewriter', weight: 400, size: 70, color: '#f5f1e6' } },
    subscribe: { label: 'Subscribe', text: 'SUBSCRIBE', style: { ...baseStyle, font: 'Helvetica Neue', weight: 800, size: 64, box: true, boxColor: '#e11d1d', boxOpacity: 1, boxRadius: 14 } },
  };
  const CAPTION_PRESETS = {
    bold: { label: 'Bold karaoke', font: 'Futura', color: '#ffffff', highlight: '#ffe600', stroke: 8, box: false, upper: true },
    green: { label: 'Green pop', font: 'Arial Black', color: '#ffffff', highlight: '#39ff14', stroke: 9, box: false, upper: true },
    boxed: { label: 'Word box', font: 'Avenir Next', color: '#ffffff', highlight: '#f97316', stroke: 0, box: true, upper: false },
    clean: { label: 'Clean', font: 'Helvetica Neue', color: '#ffffff', highlight: '#ffffff', stroke: 0, box: false, upper: false, shadow: true },
    film: { label: 'Film subtitle', font: 'Georgia', color: '#fff7d6', highlight: '#fff7d6', stroke: 0, box: false, upper: false, shadow: true },
  };
  const STICKERS = {
    Faces: '😂 🤣 😍 🥰 😎 🤯 😱 🥺 😭 😤 🤔 🙄 😴 🤩 🥳 😈 💀 👻 🤡 🙈'.split(' '),
    Hands: '👍 👎 👏 🙌 🤝 🙏 💪 👀 ✌️ 🤞 🫶 👉 👆 👇 🫡 🤙'.split(' '),
    Hype: '🔥 💯 ⚡️ 💥 ✨ 🌟 ⭐️ 💫 🎉 🎊 🏆 👑 💎 🚀 💰 💸'.split(' '),
    Love: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💖 💘 💔 💋 🌹 🌸'.split(' '),
    Signs: '➡️ ⬅️ ⬆️ ⬇️ ↩️ ✅ ❌ ⚠️ ❗️ ❓ 🔴 🟢 🔵 ⭕️ 🆕 🆒 🔞 🎯'.split(' '),
    Studio: '🎬 🎥 📸 🎤 🎧 🎵 🎶 🎹 🥁 🎸 📚 ✍️ 💻 📱 🎮 🍿'.split(' '),
  };

  // ---------------- audio ----------------
  const VOICES = {
    none: { label: 'Original', f: '' },
    deep: { label: 'Deep', f: 'asetrate=48000*0.78,aresample=48000,atempo=1.2821' },
    chipmunk: { label: 'Chipmunk', f: 'asetrate=48000*1.4,aresample=48000,atempo=0.7143' },
    monster: { label: 'Monster', f: 'asetrate=48000*0.62,aresample=48000,atempo=1.6129,aecho=0.8:0.7:40:0.3' },
    robot: { label: 'Robot', f: "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75" },
    echo: { label: 'Echo', f: 'aecho=0.8:0.88:260:0.35' },
    cave: { label: 'Cave', f: 'aecho=0.8:0.9:700|1300:0.35|0.25' },
    radio: { label: 'Radio', f: 'highpass=f=300,lowpass=f=3400,acompressor=threshold=0.1:ratio=6' },
    phone: { label: 'Phone call', f: 'highpass=f=500,lowpass=f=2200' },
    megaphone: { label: 'Megaphone', f: 'highpass=f=600,lowpass=f=2600,volume=1.8,alimiter=limit=0.9' },
    underwater: { label: 'Underwater', f: 'lowpass=f=450,aecho=0.6:0.6:60:0.4' },
  };
  function atempoChain(speed) {
    let f = num(speed, 1);
    if (Math.abs(f - 1) < 1e-3) return '';
    const parts = [];
    while (f > 2) { parts.push(2); f /= 2; }
    while (f < 0.5) { parts.push(0.5); f /= 0.5; }
    parts.push(r3(f));
    return parts.map((p) => `atempo=${p}`).join(',');
  }
  // Every sound on the timeline, as ffmpeg inputs + one mix filter.
  // include: 'all' | 'voice' (skips music and sound effects; for captions)
  function audioSources(P, include = 'all') {
    const media = Object.fromEntries(P.media.map((m) => [m.id, m]));
    const out = [];
    for (const tr of P.tracks) {
      if (tr.muted) continue;
      if (tr.type === 'main') {
        const lay = layoutMain(tr.items);
        tr.items.forEach((c, i) => {
          const m = media[c.mediaId];
          if (c.type !== 'video' || c.mute || !m || !m.hasAudio || num(c.volume, 1) <= 0) return;
          const next = tr.items[i + 1] ? transitionFor(tr.items, i + 1).duration : 0;
          out.push({ item: c, media: m, start: lay[i].start, len: lay[i].len,
            fadeIn: Math.max(num(c.fadeIn), lay[i].transition.duration), fadeOut: Math.max(num(c.fadeOut), next) });
        });
      } else if (tr.type === 'overlay' || tr.type === 'audio') {
        for (const it of tr.items) {
          const m = media[it.mediaId];
          if (!m || it.mute || num(it.volume, 1) <= 0) continue;
          if (it.type === 'video' && !m.hasAudio) continue;
          if (it.type !== 'video' && it.type !== 'audio') continue;
          if (include === 'voice' && it.type === 'audio' && it.role !== 'voice') continue;
          out.push({ item: it, media: m, start: num(it.start), len: itemLength(it), fadeIn: num(it.fadeIn), fadeOut: num(it.fadeOut) });
        }
      }
    }
    return out;
  }
  function buildAudioMix(P, { total = duration(P), base = 0, include = 'all', loudness = false } = {}) {
    const srcs = audioSources(P, include);
    const inputs = [], parts = [], labels = [];
    srcs.forEach((s, i) => {
      const it = s.item, sp = num(it.speed, 1);
      const srcLen = r3(s.len * sp);
      inputs.push(['-ss', String(r3(num(it.in))), '-t', String(srcLen), '-i', s.media.proxy || s.media.path]);
      const f = [`[${base + i}:a]aresample=48000`, 'aformat=sample_fmts=fltp:channel_layouts=stereo'];
      const at = atempoChain(sp); if (at) f.push(at);
      const voice = VOICES[it.voice]?.f; if (voice) f.push(voice);
      if (it.denoise) f.push('afftdn=nf=-25');
      f.push(`volume=${r3(num(it.volume, 1))}`);
      f.push(`atrim=0:${r3(s.len)}`, 'asetpts=PTS-STARTPTS');
      if (s.fadeIn > 0) f.push(`afade=t=in:st=0:d=${r3(Math.min(s.fadeIn, s.len))}`);
      if (s.fadeOut > 0) f.push(`afade=t=out:st=${r3(Math.max(0, s.len - s.fadeOut))}:d=${r3(Math.min(s.fadeOut, s.len))}`);
      const ms = Math.round(s.start * 1000);
      if (ms > 0) f.push(`adelay=delays=${ms}:all=1`);
      parts.push(f.join(',') + `[s${i}]`);
      labels.push(`[s${i}]`);
    });
    const T = r3(Math.max(0.1, total));
    let tail = `atrim=0:${T},apad=whole_dur=${T}`;
    if (loudness && srcs.length) tail += ',loudnorm=I=-14:TP=-1.5:LRA=11';
    tail += ',aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo';
    if (labels.length) parts.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=longest,${tail}[aout]`);
    else parts.push(`anullsrc=r=48000:cl=stereo,${tail}[aout]`);
    return { inputs: inputs.flat(), filter: parts.join(';'), out: '[aout]', count: srcs.length, total: T };
  }

  // ---------------- beats ----------------
  // Onset detection on a mono signal. Returns beat times in seconds.
  function detectBeats(samples, sr, { minGap = 0.28, sensitivity = 1.4 } = {}) {
    const hop = Math.max(1, Math.round(sr * 0.01)), win = hop * 4;
    const n = Math.floor((samples.length - win) / hop);
    if (n < 10) return [];
    const env = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let j = 0, o = i * hop; j < win; j++) s += samples[o + j] * samples[o + j];
      env[i] = Math.sqrt(s / win);
    }
    const flux = new Float32Array(n);
    for (let i = 1; i < n; i++) flux[i] = Math.max(0, env[i] - env[i - 1]);
    const half = 50; // ±0.5 s
    const prefix = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + flux[i];
    let mean = prefix[n] / n, varsum = 0;
    for (let i = 0; i < n; i++) varsum += (flux[i] - mean) ** 2;
    const std = Math.sqrt(varsum / n);
    const beats = [];
    let last = -Infinity;
    for (let i = 1; i < n - 1; i++) {
      const a = Math.max(0, i - half), b = Math.min(n, i + half);
      const local = (prefix[b] - prefix[a]) / (b - a);
      const thr = local * sensitivity + std * 0.5;
      if (flux[i] > thr && flux[i] >= flux[i - 1] && flux[i] >= flux[i + 1]) {
        const t = (i * hop + win / 2) / sr;
        if (t - last >= minGap) { beats.push(r3(t)); last = t; }
        else if (beats.length && flux[i] > flux[Math.round((last * sr - win / 2) / hop)]) { beats[beats.length - 1] = r3(t); last = t; }
      }
    }
    return beats;
  }

  // ---------------- captions ----------------
  function parseWhisperJSON(json, offset = 0) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    const words = [];
    for (const seg of data.transcription || []) {
      const raw = String(seg.text || '');
      const text = raw.trim();
      if (!text || /^\[.*\]$|^\(.*\)$/.test(text)) continue;
      const t0 = num(seg.offsets?.from) / 1000 + offset, t1 = num(seg.offsets?.to) / 1000 + offset;
      // pieces without a leading space belong to the previous word ("don" + "'t")
      if (words.length && !/^\s/.test(raw) && !/^[A-Z0-9"“(]/.test(text)) { const w = words[words.length - 1]; w.w += text; w.t1 = t1; continue; }
      words.push({ w: text, t0: r3(t0), t1: r3(Math.max(t1, t0 + 0.05)) });
    }
    return words;
  }
  function groupCaptions(words, { maxWords = 3, maxChars = 22, maxGap = 0.7 } = {}) {
    const caps = [];
    let cur = null;
    for (const w of words) {
      const len = cur ? cur.words.map((x) => x.w).join(' ').length + 1 + w.w.length : w.w.length;
      if (!cur || cur.words.length >= maxWords || len > maxChars || w.t0 - cur.end > maxGap || /[.?!]$/.test(cur.words[cur.words.length - 1].w)) {
        cur = { id: uid(), start: w.t0, end: w.t1, words: [] };
        caps.push(cur);
      }
      cur.words.push({ ...w });
      cur.end = w.t1;
    }
    for (let i = 0; i < caps.length; i++) {
      caps[i].text = caps[i].words.map((x) => x.w).join(' ');
      const next = caps[i + 1];
      if (next && next.start - caps[i].end < 0.35) caps[i].end = next.start; // no flicker between captions
    }
    return caps;
  }
  // Spread words evenly across a caption whose text was typed or edited by hand.
  function wordsFor(cap) {
    const ws = String(cap.text || '').split(/\s+/).filter(Boolean);
    const known = cap.words && cap.words.length === ws.length ? cap.words : null;
    const span = Math.max(0.1, cap.end - cap.start);
    return ws.map((w, i) => (known ? { ...known[i], w } : { w, t0: cap.start + (span * i) / ws.length, t1: cap.start + (span * (i + 1)) / ws.length }));
  }
  const fmtSrt = (t) => {
    const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
    const p = (v, w = 2) => String(v).padStart(w, '0');
    return `${p(h)}:${p(m)}:${p(s)},${p(ms % 1000, 3)}`;
  };
  const toSRT = (caps) => caps.map((c, i) => `${i + 1}\n${fmtSrt(c.start)} --> ${fmtSrt(c.end)}\n${c.text}\n`).join('\n');
  function parseSRT(text) {
    const toSec = (s) => { const m = s.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000 : 0; };
    return String(text).replace(/\r/g, '').split(/\n\s*\n/).map((block) => {
      const lines = block.trim().split('\n');
      const ti = lines.findIndex((l) => l.includes('-->'));
      if (ti < 0) return null;
      const [a, b] = lines[ti].split('-->');
      const txt = lines.slice(ti + 1).join(' ').replace(/<[^>]+>/g, '').trim();
      return txt ? { id: uid(), start: r3(toSec(a)), end: r3(toSec(b)), text: txt } : null;
    }).filter(Boolean);
  }

  // ---------------- editing ----------------
  function findItem(P, id) {
    for (const tr of P.tracks) { const it = tr.items.find((x) => x.id === id); if (it) return { track: tr, item: it }; }
    return null;
  }
  function splitKeyframes(it, at) {
    const a = {}, b = {};
    for (const [prop, list] of Object.entries(it.kf || {})) {
      const v = kfValue(list, at, 0);
      a[prop] = [...list.filter((k) => k.t < at), { t: r3(at), v, e: 'inout' }];
      b[prop] = [{ t: 0, v, e: 'inout' }, ...list.filter((k) => k.t > at).map((k) => ({ ...k, t: r3(k.t - at) }))];
    }
    return [a, b];
  }
  // Split the item at timeline time t. Returns the new right-hand item or null.
  function splitAt(P, id, t) {
    const f = findItem(P, id);
    if (!f) return null;
    const { track, item } = f;
    const span = itemSpan(P, track, item);
    const local = t - span.start;
    if (local < 0.05 || local > span.len - 0.05) return null;
    const right = clone(item);
    right.id = uid();
    if (item.type === 'video' || item.type === 'audio') {
      const cut = r3(num(item.in) + local * num(item.speed, 1));
      item.out = cut; right.in = cut;
    } else {
      item.duration = r3(local); right.duration = r3(span.len - local);
    }
    if (track.type !== 'main') right.start = r3(span.start + local);
    if (item.kf) { const [a, b] = splitKeyframes(item, local); item.kf = a; right.kf = b; }
    if (item.anim) { item.anim.out = { ...(item.anim.out || {}), type: 'none' }; right.anim.in = { ...(right.anim.in || {}), type: 'none' }; }
    if (right.transition) right.transition = { type: 'none', duration: 0.6 };
    if (item.type === 'audio' && item.beats) right.beats = item.beats.slice();
    track.items.splice(track.items.indexOf(item) + 1, 0, right);
    if (track.type !== 'main') track.items.sort((a, b) => a.start - b.start);
    return right;
  }
  // Put a free item on the first track of its kind with room, adding a track if needed.
  function placeItem(P, type, item) {
    const kinds = { text: 'text', sticker: 'text', effect: 'effect', video: 'overlay', image: 'overlay', audio: 'audio' };
    const kind = kinds[item.type] || type;
    const len = itemLength(item);
    const free = (tr) => tr.items.every((x) => x.start + itemLength(x) <= item.start + 1e-3 || x.start >= item.start + len - 1e-3);
    let track = P.tracks.find((tr) => tr.type === kind && free(tr));
    if (!track) {
      const names = { text: 'Text', effect: 'Effects', overlay: 'Overlay', audio: 'Audio' };
      track = { id: uid(), type: kind, name: names[kind], items: [] };
      const mainIdx = P.tracks.findIndex((t) => t.type === 'main');
      if (kind === 'audio') P.tracks.push(track);
      else if (kind === 'text') P.tracks.unshift(track);
      else P.tracks.splice(mainIdx, 0, track); // overlays and effects sit just above main
    }
    track.items.push(item);
    track.items.sort((a, b) => a.start - b.start);
    return track;
  }
  // Re-time main clips so each cut lands on a beat.
  function syncToBeats(P, beats, startAt = 0) {
    const main = mainTrack(P);
    const marks = beats.filter((b) => b > startAt + 0.2).sort((a, b) => a - b);
    let prev = startAt, changed = 0;
    for (let i = 0; i < main.items.length && i < marks.length; i++) {
      const c = main.items[i], len = marks[i] - prev;
      if (len < 0.15) continue;
      c.transition = { ...(c.transition || {}), type: 'none' };
      if (c.type === 'video') {
        const m = P.media.find((x) => x.id === c.mediaId);
        const maxLen = ((m ? m.duration : Infinity) - num(c.in)) / num(c.speed, 1);
        if (len > maxLen) { prev += itemLength(c); continue; }
        c.out = r3(num(c.in) + len * num(c.speed, 1));
      } else c.duration = r3(len);
      prev = marks[i]; changed++;
    }
    return changed;
  }

  const api = {
    uid, clamp, clone, num, r3, rnd, ASPECTS, RESOLUTIONS, canvasSize, newProject, newClip, newText, newSticker, newEffect, newAudio, TF, ADJ,
    itemLength, mainTrack, transitionFor, layoutMain, itemSpan, duration, sourceTime,
    EASE, KF_PROPS, kfValue, transformAt, setKeyframe, removeKeyframe, MOTION_PRESETS, applyMotion,
    ANIM_IN, ANIM_OUT, ANIM_LOOP, LETTER_ANIMS, animState,
    FILTERS, ADJUST_KEYS, resolveLook, EFFECTS, TRANSITIONS, FONTS, TEXT_PRESETS, CAPTION_PRESETS, STICKERS,
    VOICES, atempoChain, audioSources, buildAudioMix, detectBeats,
    parseWhisperJSON, groupCaptions, wordsFor, toSRT, parseSRT,
    findItem, splitAt, placeItem, syncToBeats,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CutroomLib = api;
})(typeof window !== 'undefined' ? window : globalThis);
