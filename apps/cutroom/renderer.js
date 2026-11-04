// Cutroom page: bin, viewer, timeline, inspector, export.
const { h, toast, form, store, invoke, on, debounce, uid, fmtTime, basename } = BAMA;
const C = CutroomLib;
const $ = (id) => document.getElementById(id);

const blank = () => ({
  name: 'Untitled cut',
  settings: { preset: '1080p', fps: 30, fit: 'fit', fadeIn: 0, fadeOut: 1, crf: 18 },
  media: [], clips: [], music: null,
});
const S = { p: blank(), sel: null, pps: 60, playing: null, playhead: 0, file: null, thumbs: {} };
const sel = () => S.p.clips.find((c) => c.id === S.sel);
const save = debounce(() => store.set('project', strip(S.p)), 400);
const strip = (p) => JSON.parse(JSON.stringify(p, (k, v) => (k === 'url' ? undefined : v)));
const changed = () => { save(); paintTimeline(); paintStatus(); };

// ---------- media ----------
const fileUrl = (m) => m.url || ('file://' + encodeURI(m.path).replace(/#/g, '%23').replace(/\?/g, '%3F'));
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|mkv|avi)$/i, IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|tiff?|heic)$/i, AUDIO_EXT = /\.(mp3|wav|m4a|aac|aiff?|flac|ogg)$/i;

async function addMediaFiles(files) {
  // files: [{path, url?, name}]
  for (const f of files) {
    const name = f.name || basename(f.path);
    let info;
    if (BAMA.native) {
      try { info = await invoke('cutroom:probe', f.path); } catch (e) { toast(`${name}: ${e.message}`, 'bad'); continue; }
    } else {
      info = await probeInBrowser(f, name);
    }
    if (info.kind === 'audio') { setMusic({ path: f.path, url: f.url, name, duration: info.duration }); continue; }
    const m = { id: uid(), name, path: f.path, url: f.url, kind: info.kind, duration: info.duration, hasAudio: info.hasAudio, width: info.width, height: info.height };
    S.p.media.push(m);
    loadThumb(m);
  }
  paintBin(); save();
}
function probeInBrowser(f, name) {
  if (IMAGE_EXT.test(name)) return Promise.resolve({ kind: 'image', duration: 4, hasAudio: false });
  if (AUDIO_EXT.test(name)) return new Promise((res) => { const a = new Audio(f.url); a.onloadedmetadata = () => res({ kind: 'audio', duration: a.duration }); a.onerror = () => res({ kind: 'audio', duration: 0 }); });
  return new Promise((res) => {
    const v = document.createElement('video'); v.preload = 'metadata'; v.src = f.url;
    v.onloadedmetadata = () => res({ kind: 'video', duration: v.duration, hasAudio: true, width: v.videoWidth, height: v.videoHeight });
    v.onerror = () => res({ kind: 'video', duration: 5, hasAudio: false });
  });
}
async function loadThumb(m) {
  if (S.thumbs[m.id]) return;
  if (m.kind === 'image') S.thumbs[m.id] = fileUrl(m);
  else if (BAMA.native) S.thumbs[m.id] = await invoke('cutroom:thumb', m.path, Math.min(1, m.duration / 3));
  paintBin(); paintTimeline();
}
async function importMedia() {
  if (!BAMA.native) return pickInBrowser('video/*,image/*,audio/*', true).then(addMediaFiles);
  const paths = await invoke('dialog:open', { multiple: true, title: 'Add media', filters: [{ name: 'Media', extensions: ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'heic', 'mp3', 'wav', 'm4a', 'aac', 'aif', 'aiff', 'flac'] }] });
  if (paths) addMediaFiles(paths.map((p) => ({ path: p })));
}
function pickInBrowser(accept, multiple) {
  return new Promise((res) => {
    const i = h('input', { type: 'file', accept, multiple });
    i.onchange = () => res([...i.files].map((f) => ({ path: f.name, url: URL.createObjectURL(f), name: f.name })));
    i.click();
  });
}
function setMusic(m) { S.p.music = { volume: 0.6, fadeOut: 2, start: 0, duck: true, ...(S.p.music || {}), ...m }; changed(); paintInspector(); toast(`Music: ${m.name}`); }
async function chooseMusic() {
  if (!BAMA.native) { const f = await pickInBrowser('audio/*', false); if (f[0]) addMediaFiles(f); return; }
  const p = await invoke('dialog:open', { title: 'Choose music', filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'm4a', 'aac', 'aif', 'aiff', 'flac', 'ogg'] }] });
  if (p) addMediaFiles([{ path: p }]);
}

// ---------- clips ----------
function clipFromMedia(m) {
  return {
    id: uid(), mediaId: m.id, kind: m.kind, name: m.name, path: m.path, url: m.url, hasAudio: m.hasAudio,
    duration: m.kind === 'video' ? m.duration : 4, in: 0, out: m.kind === 'video' ? m.duration : undefined,
    look: 'none', volume: 1, speed: 1, motion: m.kind === 'image' ? 'in' : 'none',
    transition: { type: S.p.clips.length ? 'cut' : 'cut', duration: 0.8 },
  };
}
function addClip(c, at) {
  if (at == null) S.p.clips.push(c); else S.p.clips.splice(at, 0, c);
  S.sel = c.id; changed(); paintInspector(); showClip(c);
}
async function addTitle() {
  const c = { id: uid(), kind: 'title', name: 'Title', duration: 3, text: 'YOUR TITLE', sub: 'A Relentless film', style: 'center', bg: '#0b0b0d', color: '#ffffff', accent: '#f97316', size: 1, look: 'none', motion: 'none', transition: { type: 'fadeblack', duration: 0.6 } };
  addClip(c, S.sel ? S.p.clips.findIndex((x) => x.id === S.sel) + 1 : undefined);
}
function removeClip() {
  const i = S.p.clips.findIndex((c) => c.id === S.sel);
  if (i < 0) return;
  S.p.clips.splice(i, 1);
  S.sel = (S.p.clips[i] || S.p.clips[i - 1] || {}).id || null;
  changed(); paintInspector();
}
function splitClip() {
  const c = sel();
  if (!c || c.kind !== 'video') return toast('Pick a video clip, park the playhead inside it, then split');
  const t = $('vid').currentTime;
  if (t <= c.in + 0.1 || t >= c.out - 0.1) return toast('Move the playhead inside the clip first');
  const b = { ...JSON.parse(JSON.stringify(c)), id: uid(), url: c.url, in: t, transition: { type: 'cut', duration: 0.8 } };
  c.out = t;
  S.p.clips.splice(S.p.clips.indexOf(c) + 1, 0, b);
  changed(); toast('Split');
}
function setPoint(which) {
  const c = sel();
  if (!c || c.kind !== 'video') return;
  const t = $('vid').currentTime;
  if (which === 'in') c.in = Math.min(t, c.out - 0.1); else c.out = Math.max(t, c.in + 0.1);
  changed(); paintInspector();
}

// ---------- title cards ----------
function drawTitle(canvas, c, W, H) {
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d');
  g.fillStyle = c.bg; g.fillRect(0, 0, W, H);
  const s = (W < H ? W : H) / 1080 * (c.size || 1);
  g.textAlign = c.style === 'lower' ? 'left' : 'center'; g.textBaseline = 'middle';
  const font = (wt, px) => `${wt} ${Math.round(px * s)}px -apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif`;
  const lines = String(c.text || '').split('\n');
  if (c.style === 'lower') {
    const x = W * 0.07, y = H * 0.78;
    g.fillStyle = c.accent; g.fillRect(x, y - 70 * s, 10 * s, 140 * s);
    g.fillStyle = c.color; g.font = font(700, 72); g.fillText(lines[0] || '', x + 34 * s, y - 22 * s);
    g.globalAlpha = 0.75; g.font = font(400, 40); g.fillText(c.sub || '', x + 34 * s, y + 42 * s); g.globalAlpha = 1;
    return;
  }
  const big = c.style === 'bold' ? 150 : 96;
  g.fillStyle = c.color; g.font = font(c.style === 'bold' ? 900 : 700, big);
  const lh = big * 1.1 * s;
  const top = H / 2 - ((lines.length - 1) * lh) / 2 - (c.sub ? 30 * s : 0);
  lines.forEach((l, i) => g.fillText(l, W / 2, top + i * lh));
  if (c.sub) {
    g.fillStyle = c.accent; g.fillRect(W / 2 - 40 * s, top + (lines.length - 1) * lh + 70 * s, 80 * s, 5 * s);
    g.fillStyle = c.color; g.globalAlpha = 0.8; g.font = font(400, 40); g.fillText(c.sub, W / 2, top + (lines.length - 1) * lh + 130 * s); g.globalAlpha = 1;
  }
}

// ---------- viewer & playback ----------
const vid = $('vid'), img = $('img'), tcan = $('titleCanvas');
function showOnly(el) { [vid, img, tcan].forEach((x) => x.classList.toggle('hidden', x !== el)); $('viewerEmpty').classList.toggle('hidden', !!el); }
function showClip(c, play = false) {
  if (!c) { showOnly(null); return; }
  const P = C.PRESETS[S.p.settings.preset];
  if (c.kind === 'video') {
    showOnly(vid);
    const url = fileUrl(c);
    if (vid.dataset.src !== url) { vid.src = url; vid.dataset.src = url; }
    const seek = () => { vid.currentTime = c.in || 0; vid.volume = Math.min(1, c.volume ?? 1); vid.playbackRate = c.speed || 1; if (play) vid.play().catch(() => {}); };
    if (vid.readyState >= 1) seek(); else vid.onloadedmetadata = seek;
  } else if (c.kind === 'image') { showOnly(img); img.src = fileUrl(c); }
  else { showOnly(tcan); drawTitle(tcan, c, P.w / 2, P.h / 2); }
  tcan.style.aspectRatio = `${P.w}/${P.h}`;
}
function stop() {
  if (S.playing) { cancelAnimationFrame(S.playing.raf); clearTimeout(S.playing.timer); }
  S.playing = null; vid.pause(); $('playProg').textContent = '▶ Program';
}
function playProgram(fromIndex = 0) {
  stop();
  if (!S.p.clips.length) return;
  const tl = C.timeline(S.p.clips);
  S.playing = { i: fromIndex };
  $('playProg').textContent = '❚❚ Pause';
  const step = () => {
    if (!S.playing) return;
    const i = S.playing.i;
    const c = S.p.clips[i];
    if (!c) { stop(); return; }
    S.sel = c.id; paintTimeline(); paintInspector();
    showClip(c, true);
    const t0 = performance.now();
    const len = C.clipLength(c);
    const tick = () => {
      if (!S.playing || S.playing.i !== i) return;
      const local = c.kind === 'video' ? vid.currentTime - (c.in || 0) : (performance.now() - t0) / 1000;
      S.playhead = tl[i].start + Math.max(0, local);
      paintPlayhead();
      // hand off to the next clip where the transition would begin
      const next = S.p.clips[i + 1] ? C.transitionFor(S.p.clips, i + 1).duration : 0;
      if (local >= len - next / 2 - 0.02 || (c.kind === 'video' && vid.ended)) { S.playing.i++; step(); return; }
      S.playing.raf = requestAnimationFrame(tick);
    };
    S.playing.raf = requestAnimationFrame(tick);
  };
  step();
}
vid.addEventListener('timeupdate', () => {
  const c = sel();
  if (!S.playing && c && c.kind === 'video') {
    if (!vid.paused && vid.currentTime >= c.out) vid.pause();
    const tl = C.timeline(S.p.clips); const i = S.p.clips.indexOf(c);
    if (i >= 0) { S.playhead = tl[i].start + Math.max(0, vid.currentTime - c.in); paintPlayhead(); }
  }
});

// ---------- timeline ----------
function paintTimeline() {
  const tl = C.timeline(S.p.clips);
  const total = C.totalDuration(S.p.clips);
  const pps = S.pps;
  const inner = $('tlInner');
  inner.style.width = Math.max($('tlScroll').clientWidth, (total + 10) * pps + 20) + 'px';
  // ruler
  const step = pps > 100 ? 1 : pps > 40 ? 2 : pps > 20 ? 5 : 10;
  const ruler = $('ruler'); ruler.replaceChildren();
  for (let t = 0; t <= total + 10; t += step) ruler.append(h('span', { style: { left: 10 + t * pps + 'px' } }, fmtTime(t).replace(/\.\d$/, '')));
  // video lane
  const lane = $('laneV'); lane.replaceChildren();
  let dragId = null;
  S.p.clips.forEach((c, i) => {
    const { start, len } = tl[i];
    const thumb = c.kind === 'title' ? null : S.thumbs[c.mediaId];
    const b = h('div', {
      class: `clip-block ${c.kind}` + (c.id === S.sel ? ' sel' : ''), draggable: true,
      style: { left: 10 + start * pps + 'px', width: Math.max(8, len * pps - 2) + 'px', backgroundImage: thumb ? `url("${thumb}")` : '' },
      onclick: () => { stop(); S.sel = c.id; paintTimeline(); paintInspector(); showClip(c); },
    }, h('div', { class: 'cb-label' }, c.kind === 'title' ? `T  ${c.text.split('\n')[0]}` : c.name, ` · ${len.toFixed(1)}s`));
    // trim handles
    const handle = (side) => {
      const el = h('div', { class: 'handle ' + side, draggable: false });
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); e.preventDefault(); el.setPointerCapture(e.pointerId);
        const x0 = e.clientX, in0 = c.in || 0, out0 = c.out, d0 = c.duration;
        const move = (ev) => {
          const dt = (ev.clientX - x0) / pps;
          if (c.kind === 'video') {
            if (side === 'l') c.in = Math.max(0, Math.min(out0 - 0.1, in0 + dt));
            else c.out = Math.min(c.duration, Math.max(in0 + 0.1, out0 + dt));
          } else if (side === 'r') c.duration = Math.max(0.5, Math.round((d0 + dt) * 10) / 10);
          paintTimeline();
        };
        const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); changed(); paintInspector(); showClip(c); };
        el.addEventListener('pointermove', move); el.addEventListener('pointerup', up);
      });
      return el;
    };
    b.append(handle('l'), handle('r'));
    b.addEventListener('dragstart', (e) => { if (e.target.classList.contains('handle')) { e.preventDefault(); return; } dragId = c.id; b.classList.add('dragging'); });
    b.addEventListener('dragend', () => b.classList.remove('dragging'));
    b.addEventListener('dragover', (e) => { e.preventDefault(); b.classList.add('drop'); });
    b.addEventListener('dragleave', () => b.classList.remove('drop'));
    b.addEventListener('drop', (e) => {
      e.preventDefault(); b.classList.remove('drop');
      const mediaId = e.dataTransfer.getData('text/media');
      if (mediaId) { const m = S.p.media.find((x) => x.id === mediaId); if (m) addClip(clipFromMedia(m), i); return; }
      if (!dragId || dragId === c.id) return;
      const from = S.p.clips.findIndex((x) => x.id === dragId);
      const [moved] = S.p.clips.splice(from, 1);
      S.p.clips.splice(S.p.clips.indexOf(c), 0, moved);
      changed();
    });
    lane.append(b);
    if (i > 0) {
      const t = tl[i].transition;
      lane.append(h('div', {
        class: 'tx-badge' + (t.type !== 'cut' ? ' on' : ''), style: { left: 10 + (start + t.duration / 2) * pps + 'px' },
        title: 'Click to change the transition', onclick: (e) => { e.stopPropagation(); S.sel = c.id; paintTimeline(); paintInspector(); document.getElementById('txSel')?.focus(); },
      }, t.type === 'cut' ? '|' : C.TRANSITIONS[t.type]));
    }
  });
  lane.ondragover = (e) => e.preventDefault();
  lane.ondrop = (e) => {
    const mediaId = e.dataTransfer.getData('text/media');
    if (mediaId && e.target === lane) { const m = S.p.media.find((x) => x.id === mediaId); if (m) addClip(clipFromMedia(m)); }
  };
  if (!S.p.clips.length) lane.append(h('div', { class: 'faint', style: { padding: '30px 6px' } }, 'Drag media here, or press + on any item in the bin.'));
  // music lane
  const ml = $('laneM'); ml.replaceChildren();
  if (S.p.music) ml.append(h('div', { class: 'music-block', style: { left: 10 + (S.p.music.delay || 0) * pps + 'px', width: Math.max(40, (total - (S.p.music.delay || 0)) * pps) + 'px' } }, `♫ ${S.p.music.name} · ${Math.round(S.p.music.volume * 100)}%`));
  else ml.append(h('div', { class: 'faint', style: { padding: '8px 6px', fontSize: '11.5px' } }, 'Music lane: press ♫ Music to lay a track under the cut.'));
  paintPlayhead();
}
function paintPlayhead() {
  $('playhead').style.left = 10 + S.playhead * S.pps + 'px';
  $('tc').textContent = `${fmtTime(S.playhead)} / ${fmtTime(C.totalDuration(S.p.clips))}`;
}
$('ruler').addEventListener('click', (e) => {
  const t = (e.clientX - $('tlInner').getBoundingClientRect().left - 10) / S.pps;
  const tl = C.timeline(S.p.clips);
  let i = tl.findIndex((x) => t >= x.start && t < x.start + x.len);
  if (i < 0) i = S.p.clips.length - 1;
  const c = S.p.clips[i]; if (!c) return;
  stop(); S.sel = c.id; paintTimeline(); paintInspector(); showClip(c);
  if (c.kind === 'video') { const seek = () => { vid.currentTime = (c.in || 0) + (t - tl[i].start); }; if (vid.readyState >= 1) setTimeout(seek, 30); else vid.addEventListener('loadedmetadata', seek, { once: true }); }
  S.playhead = Math.max(0, t); paintPlayhead();
});

// ---------- bin ----------
function paintBin() {
  const bin = $('bin');
  bin.replaceChildren(...S.p.media.map((m) => {
    const t = S.thumbs[m.id];
    const el = h('div', { class: 'media', draggable: true, ondblclick: () => addClip(clipFromMedia(m)) },
      h('div', { class: 'th', style: { backgroundImage: t ? `url("${t}")` : '' } }, t ? '' : m.kind === 'video' ? '▶' : '▣'),
      h('div', { class: 'grow' }, h('div', { class: 'nm' }, m.name), h('div', { class: 'du' }, m.kind === 'video' ? fmtTime(m.duration) + (m.hasAudio ? '' : ' · no sound') : 'still')),
      h('button', { class: 'btn sm icon', title: 'Add to end of timeline', onclick: () => addClip(clipFromMedia(m)) }, '＋'));
    el.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/media', m.id));
    return el;
  }));
  if (!S.p.media.length) bin.append(h('div', { class: 'empty' }, h('h3', {}, 'Bring your footage'), 'Animated clips, phone video, stills, artwork. Drop them anywhere on this panel.'));
}
const sidebar = document.querySelector('.sidebar');
sidebar.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); sidebar.classList.add('bin-drop'); } });
sidebar.addEventListener('dragleave', () => sidebar.classList.remove('bin-drop'));
sidebar.addEventListener('drop', (e) => {
  sidebar.classList.remove('bin-drop');
  if (!e.dataTransfer.files.length) return;
  e.preventDefault();
  addMediaFiles([...e.dataTransfer.files].map((f) => (BAMA.native ? { path: window.bama.pathFor(f) } : { path: f.name, name: f.name, url: URL.createObjectURL(f) })));
});

// ---------- inspector ----------
const field = (label, input) => h('label', { class: 'field' }, label, input);
const range = (val, min, max, stepv, oninput, fmt = (v) => v) => {
  const out = h('span', { class: 'faint' }, fmt(val));
  const r = h('input', { type: 'range', min, max, step: stepv, value: val, oninput: () => { out.textContent = fmt(+r.value); oninput(+r.value); } });
  return h('div', {}, r, out);
};
const select = (val, opts, onchange, id) => h('select', { class: 'select', id, onchange: (e) => onchange(e.target.value) },
  Object.entries(opts).map(([k, v]) => h('option', { value: k, selected: k === val }, typeof v === 'string' ? v : v.label)));

function paintInspector() {
  const c = sel();
  const parts = [];
  if (c) {
    const i = S.p.clips.indexOf(c);
    parts.push(h('h5', {}, c.kind === 'title' ? 'Title card' : c.kind === 'image' ? 'Still image' : 'Video clip'));
    if (c.kind === 'title') {
      const ta = h('textarea', { class: 'textarea', rows: 2, oninput: () => { c.text = ta.value; changed(); showClip(c); } }); ta.value = c.text;
      parts.push(field('Title', ta),
        field('Subtitle', h('input', { class: 'input', value: c.sub, oninput: (e) => { c.sub = e.target.value; changed(); showClip(c); } })),
        field('Layout', select(c.style, { center: 'Centered', bold: 'Big & bold', lower: 'Lower third' }, (v) => { c.style = v; changed(); showClip(c); })),
        h('div', { class: 'row' },
          field('Background', h('input', { type: 'color', value: c.bg, oninput: (e) => { c.bg = e.target.value; changed(); showClip(c); } })),
          field('Text', h('input', { type: 'color', value: c.color, oninput: (e) => { c.color = e.target.value; showClip(c); changed(); } })),
          field('Accent', h('input', { type: 'color', value: c.accent, oninput: (e) => { c.accent = e.target.value; showClip(c); changed(); } }))),
        field('Text size', range(c.size || 1, 0.5, 2, 0.05, (v) => { c.size = v; showClip(c); changed(); }, (v) => `${Math.round(v * 100)}%`)));
    } else parts.push(h('div', { class: 'muted', style: { wordBreak: 'break-all' } }, c.name));
    if (c.kind === 'video') {
      parts.push(h('div', { class: 'row' },
        field('In (s)', h('input', { class: 'input', type: 'number', step: 0.1, value: (+c.in).toFixed(2), onchange: (e) => { c.in = Math.max(0, Math.min(+e.target.value, c.out - 0.1)); changed(); showClip(c); } })),
        field('Out (s)', h('input', { class: 'input', type: 'number', step: 0.1, value: (+c.out).toFixed(2), onchange: (e) => { c.out = Math.min(c.duration, Math.max(+e.target.value, c.in + 0.1)); changed(); } }))),
        field('Speed', select(String(c.speed || 1), { 0.5: '0.5× slow motion', 0.75: '0.75×', 1: '1× normal', 1.5: '1.5×', 2: '2× fast' }, (v) => { c.speed = +v; changed(); })),
        field('Clip volume', range(c.volume ?? 1, 0, 2, 0.05, (v) => { c.volume = v; vid.volume = Math.min(1, v); save(); }, (v) => `${Math.round(v * 100)}%`)));
    } else {
      parts.push(field('Duration (s)', h('input', { class: 'input', type: 'number', step: 0.5, min: 0.5, value: c.duration, onchange: (e) => { c.duration = Math.max(0.5, +e.target.value); changed(); } })));
      if (c.kind === 'image') parts.push(field('Motion', select(c.motion || 'none', { none: 'Hold still', in: 'Slow push in', out: 'Slow pull out' }, (v) => { c.motion = v; changed(); })));
    }
    if (c.kind !== 'title') parts.push(field('Framing', select(c.fit || '', { '': `Project default (${S.p.settings.fit})`, fit: 'Fit (letterbox)', fill: 'Fill (crop to frame)' }, (v) => { c.fit = v || undefined; changed(); })));
    parts.push(field('Color look', select(c.look || 'none', C.LOOKS, (v) => { c.look = v; changed(); })));
    if (i > 0) {
      parts.push(h('h5', {}, 'Transition in'),
        h('div', { class: 'row' },
          h('div', { class: 'grow' }, select(c.transition?.type || 'cut', C.TRANSITIONS, (v) => { c.transition = { ...(c.transition || {}), type: v }; changed(); }, 'txSel')),
          h('input', { class: 'input', type: 'number', min: 0.1, max: 5, step: 0.1, style: { width: '70px' }, title: 'Seconds', value: c.transition?.duration ?? 0.8, onchange: (e) => { c.transition = { ...(c.transition || {}), duration: +e.target.value }; changed(); } })),
        h('button', { class: 'btn sm', onclick: () => { S.p.clips.forEach((x, j) => { if (j > 0) x.transition = { ...c.transition }; }); changed(); toast('Applied to every cut'); } }, 'Use on every cut'));
    }
    parts.push(h('div', { class: 'row' },
      h('button', { class: 'btn sm', onclick: () => { const d = { ...JSON.parse(JSON.stringify(c)), id: uid(), url: c.url }; S.p.clips.splice(i + 1, 0, d); S.sel = d.id; changed(); paintInspector(); } }, 'Duplicate'),
      h('button', { class: 'btn sm danger', onclick: removeClip }, 'Remove')));
  } else parts.push(h('div', { class: 'faint' }, 'Select a clip on the timeline to trim it, add a transition, or grade it.'));

  const st = S.p.settings;
  parts.push(h('h5', { style: { marginTop: '18px' } }, 'Project'),
    field('Default framing', select(st.fit, { fit: 'Fit (letterbox)', fill: 'Fill (crop to frame)' }, (v) => { st.fit = v; changed(); })),
    h('div', { class: 'row' },
      field('Frame rate', select(String(st.fps), { 24: '24 film', 25: '25', 30: '30', 60: '60' }, (v) => { st.fps = +v; changed(); })),
      field('Quality', select(String(st.crf), { 14: 'Master', 18: 'High', 23: 'Web', 28: 'Draft' }, (v) => { st.crf = +v; changed(); }))),
    h('div', { class: 'row' },
      field('Fade in (s)', h('input', { class: 'input', type: 'number', min: 0, step: 0.5, value: st.fadeIn, onchange: (e) => { st.fadeIn = +e.target.value; save(); } })),
      field('Fade out (s)', h('input', { class: 'input', type: 'number', min: 0, step: 0.5, value: st.fadeOut, onchange: (e) => { st.fadeOut = +e.target.value; save(); } }))));
  if (S.p.music) {
    const m = S.p.music;
    parts.push(h('h5', {}, 'Music'), h('div', { class: 'muted' }, m.name),
      field('Volume', range(m.volume, 0, 1.5, 0.05, (v) => { m.volume = v; changed(); }, (v) => `${Math.round(v * 100)}%`)),
      h('div', { class: 'row' },
        field('Start into song (s)', h('input', { class: 'input', type: 'number', min: 0, step: 0.5, value: m.start || 0, onchange: (e) => { m.start = +e.target.value; save(); } })),
        field('Fade out (s)', h('input', { class: 'input', type: 'number', min: 0, step: 0.5, value: m.fadeOut, onchange: (e) => { m.fadeOut = +e.target.value; save(); } }))),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!m.duck, onchange: (e) => { m.duck = e.target.checked; save(); } }), 'Duck music under dialogue'),
      h('button', { class: 'btn sm danger', onclick: () => { S.p.music = null; changed(); paintInspector(); } }, 'Remove music'));
  }
  $('inspector').replaceChildren(h('div', { class: 'insp' }, parts));
}
function paintStatus() {
  const P = C.PRESETS[S.p.settings.preset];
  $('status').replaceChildren(
    h('span', {}, `${S.p.clips.length} clips`), h('span', {}, `Runtime ${fmtTime(C.totalDuration(S.p.clips))}`),
    h('span', {}, `${P.w}×${P.h} @ ${S.p.settings.fps}fps`), h('span', { class: 'spacer' }),
    h('span', { id: 'ffStatus' }, BAMA.native ? '' : 'Browser preview: export needs the Mac app'));
}

// ---------- project files ----------
async function loadProject(p) {
  stop(); S.p = { ...blank(), ...p, settings: { ...blank().settings, ...(p.settings || {}) } }; S.sel = S.p.clips[0]?.id || null; S.thumbs = {};
  $('projName').value = S.p.name;
  paintPreset(); paintBin(); paintTimeline(); paintInspector(); paintStatus(); showClip(sel());
  S.p.media.forEach(loadThumb);
}
async function saveProjectAs() {
  if (!BAMA.native) { const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(strip(S.p), null, 2)])), download: `${S.p.name}.cutroom.json` }); a.click(); return; }
  const f = S.file || await invoke('dialog:save', { defaultPath: `${S.p.name}.cutroom.json`, filters: [{ name: 'Cutroom project', extensions: ['json'] }] });
  if (!f) return;
  S.file = f; await invoke('fs:writeText', f, JSON.stringify(strip(S.p), null, 2)); toast('Project saved');
}
async function openProject() {
  if (!BAMA.native) return toast('Open projects in the Mac app');
  const f = await invoke('dialog:open', { filters: [{ name: 'Cutroom project', extensions: ['json'] }] });
  if (!f) return;
  try { S.file = f; await loadProject(JSON.parse(await invoke('fs:readText', f))); } catch (e) { toast('Could not open: ' + e.message, 'bad'); }
}

// ---------- export ----------
async function exportFilm() {
  if (!S.p.clips.length) return toast('The timeline is empty');
  if (!BAMA.native) return toast('Export runs ffmpeg on your Mac. Launch with: npm start cutroom', 'bad');
  const tools = await invoke('cutroom:tools');
  if (!tools.ffmpeg) return toast('ffmpeg not found. Install it once with:  brew install ffmpeg', 'bad');
  const out = await invoke('dialog:save', { defaultPath: `${S.p.name}.mp4`, filters: [{ name: 'MP4 video', extensions: ['mp4'] }] });
  if (!out) return;
  const P = C.PRESETS[S.p.settings.preset];
  const titlePngs = {};
  const cv = document.createElement('canvas');
  for (const c of S.p.clips.filter((x) => x.kind === 'title')) { drawTitle(cv, c, P.w, P.h); titlePngs[c.id] = cv.toDataURL('image/png').split(',')[1]; }
  $('renderSheet').classList.remove('hidden');
  $('renderStage').textContent = 'Starting…'; $('renderBar').style.width = '0%'; $('renderNote').textContent = '';
  try {
    const r = await invoke('cutroom:render', strip(S.p), out, titlePngs);
    toast(`Exported ${fmtTime(r.duration)}`);
    invoke('notify', 'Cutroom', `${basename(out)} is ready`);
    invoke('shell:showItem', out);
  } catch (e) { toast(String(e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, ''), 'bad'); }
  $('renderSheet').classList.add('hidden');
}
on('cutroom:progress', (p) => { $('renderStage').textContent = p.stage; $('renderBar').style.width = p.pct + '%'; $('renderNote').textContent = p.note || ''; });
$('cancelRender').onclick = () => invoke('cutroom:cancel');

// ---------- wiring ----------
function paintPreset() { $('preset').replaceChildren(...Object.entries(C.PRESETS).map(([k, v]) => h('option', { value: k, selected: k === S.p.settings.preset }, v.label))); }
$('preset').onchange = (e) => { S.p.settings.preset = e.target.value; changed(); showClip(sel()); };
$('projName').oninput = (e) => { S.p.name = e.target.value; save(); };
$('importBtn').onclick = importMedia;
$('titleBtn').onclick = addTitle;
$('musicBtn').onclick = chooseMusic;
$('exportBtn').onclick = exportFilm;
$('saveBtn').onclick = saveProjectAs;
$('openBtn').onclick = openProject;
$('newBtn').onclick = async () => { if (await invoke('dialog:confirm', 'Start a new cut?', 'Save first if you want to keep this one.')) { S.file = null; loadProject(blank()); save(); } };
$('playProg').onclick = () => (S.playing ? stop() : playProgram(Math.max(0, S.p.clips.findIndex((c) => c.id === S.sel))));
$('playClip').onclick = () => { stop(); const c = sel(); if (c) showClip(c, true); };
$('stopBtn').onclick = stop;
$('setIn').onclick = () => setPoint('in');
$('setOut').onclick = () => setPoint('out');
$('splitBtn').onclick = splitClip;
$('zoom').oninput = (e) => { S.pps = +e.target.value; paintTimeline(); };
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, select') || document.querySelector('.modal-back')) return;
  const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); $('playProg').click(); }
  else if (k === 'i') setPoint('in');
  else if (k === 'o') setPoint('out');
  else if (k === 's' && !e.metaKey) splitClip();
  else if (k === 's' && e.metaKey) { e.preventDefault(); saveProjectAs(); }
  else if (k === 'backspace' || k === 'delete') removeClip();
  else if (k === 'arrowright' || k === 'arrowleft') {
    const i = S.p.clips.findIndex((c) => c.id === S.sel) + (k === 'arrowright' ? 1 : -1);
    const c = S.p.clips[Math.max(0, Math.min(S.p.clips.length - 1, i))];
    if (c) { stop(); S.sel = c.id; paintTimeline(); paintInspector(); showClip(c); }
  } else if (k === 'e' && e.metaKey) { e.preventDefault(); exportFilm(); }
});
window.addEventListener('resize', debounce(paintTimeline, 100));

(async () => {
  const saved = await store.get('project', null);
  await loadProject(saved || blank());
  if (BAMA.native) {
    const t = await invoke('cutroom:tools');
    const el = document.getElementById('ffStatus');
    if (el) el.textContent = t.ffmpeg ? `ffmpeg ✓ ${t.ffmpeg}` : 'ffmpeg missing: brew install ffmpeg';
  }
})();
