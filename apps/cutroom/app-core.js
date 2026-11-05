// Cutroom core: state, history, media, player, on-canvas handles.
const L = CutroomLib;
const { h, toast, form, store, invoke, on, debounce, uid, basename } = BAMA;
const $ = (id) => document.getElementById(id);
const cleanErr = (e) => String((e && e.message) || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, '');

const S = {
  P: L.newProject(), sel: null, t: 0, playing: false, pps: 80, snap: true,
  hist: [], fut: [], last: '', lib: 'media', insp: 'basic', clip: null, file: null,
  strips: {}, peaks: {}, seekTok: 0, rec: null,
};
const mediaUrl = (m) => (m.url ? m.url : BAMA.mediaUrl(m.proxy || m.path));
const mediaById = (id) => S.P.media.find((m) => m.id === id);
const total = () => L.duration(S.P);
const fmtTC = (t) => { t = Math.max(0, t || 0); const m = Math.floor(t / 60), s = Math.floor(t % 60), cs = Math.floor((t % 1) * 100); return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`; };

// ---------- history ----------
const saveProject = debounce(() => store.set('project2', S.P), 600);
function commit(opts = {}) {
  const now = JSON.stringify(S.P);
  if (now !== S.last) {
    if (S.last) S.hist.push(S.last);
    if (S.hist.length > 150) S.hist.shift();
    S.last = now; S.fut = [];
    saveProject();
  }
  refresh(opts);
}
function undo() { if (!S.hist.length) return; S.fut.push(S.last); S.last = S.hist.pop(); S.P = JSON.parse(S.last); afterLoad(); toast('Undo'); }
function redo() { if (!S.fut.length) return; S.hist.push(S.last); S.last = S.fut.pop(); S.P = JSON.parse(S.last); afterLoad(); toast('Redo'); }
function afterLoad() { if (S.sel && !L.findItem(S.P, S.sel)) S.sel = null; comp.setProject(S.P); saveProject(); refresh({}); }
function refresh({ inspector = true, library = false } = {}) {
  comp.setProject(S.P);
  cleanupTracks();
  renderTimeline();
  if (inspector) renderInspector();
  if (library) renderLibrary();
  $('projName').value = S.P.name;
  $('undoBtn').disabled = !S.hist.length; $('redoBtn').disabled = !S.fut.length;
  $('playerEmpty').classList.toggle('hidden', total() > 0);
  sizePlayer();
  seekTo(Math.min(S.t, total()));
}
function cleanupTracks() {
  const seen = {};
  S.P.tracks = S.P.tracks.filter((tr) => {
    seen[tr.type] = (seen[tr.type] || 0) + 1;
    return tr.type === 'main' || tr.items.length || seen[tr.type] === 1 && tr.type !== 'effect';
  });
}

// ---------- selection & item helpers ----------
const selected = () => (S.sel ? L.findItem(S.P, S.sel) : null);
function select(id, tab) {
  S.sel = id;
  if (tab) S.insp = tab;
  const f = selected();
  if (f && !inspTabs(f.item, f.track).some(([k]) => k === S.insp)) S.insp = inspTabs(f.item, f.track)[0][0];
  renderTimeline(); renderInspector(); paintGizmo();
}
const spanOf = (track, it) => L.itemSpan(S.P, track, it);
function localOf(track, it) { const s = spanOf(track, it); return L.clamp(S.t - s.start, 0, s.len); }
// Changing a property that has keyframes edits (or adds) the keyframe at the playhead.
function setProp(it, track, prop, v) {
  if (it.kf && it.kf[prop] && it.kf[prop].length) L.setKeyframe(it, prop, localOf(track, it), v);
  else { it.tf = it.tf || L.TF(); it.tf[prop] = v; }
}
function mainItemAt(t) {
  const main = L.mainTrack(S.P), lay = L.layoutMain(main.items);
  const i = lay.findIndex((l) => t >= l.start && t < l.end);
  return i >= 0 ? { item: main.items[i], index: i, lay: lay[i] } : null;
}

// ---------- media import ----------
const IMG = /\.(png|jpe?g|webp|gif|bmp|tiff?|heic|heif|avif)$/i, AUD = /\.(mp3|wav|m4a|aac|aiff?|flac|ogg|opus|caf)$/i;
function playable(url, tag) {
  return new Promise((resolve) => {
    const el = document.createElement(tag);
    el.preload = 'auto'; el.muted = true; el.crossOrigin = 'anonymous';
    const done = (ok) => { clearTimeout(timer); if (tag !== 'img') { el.removeAttribute('src'); el.load?.(); } resolve(ok); };
    const timer = setTimeout(() => done(false), 8000);
    if (tag === 'img') { el.onload = () => done(el.naturalWidth > 0); el.onerror = () => done(false); }
    // a video only counts when its picture decodes: some files play their sound but not their image
    else { el.oncanplay = () => done(tag !== 'video' || el.videoWidth > 0); el.onerror = () => done(false); }
    el.src = url;
  });
}
async function importFiles(files) {
  const added = [];
  for (const f of files) {
    const name = f.name || basename(f.path);
    try {
      let m;
      if (BAMA.native) {
        const info = await invoke('cutroom:probe', f.path);
        m = { id: uid(), name, path: f.path, ...info };
        const tag = m.kind === 'image' ? 'img' : m.kind === 'audio' ? 'audio' : 'video';
        if (!(await playable(BAMA.mediaUrl(f.path), tag))) {
          toast(`Optimizing ${name} for editing…`);
          m.proxy = await invoke('cutroom:proxy', f.path, m.kind);
        }
      } else m = await probeInBrowser(f, name);
      S.P.media.push(m);
      added.push(m);
      analyze(m);
    } catch (e) { toast(`${name}: ${cleanErr(e)}`, 'bad'); }
  }
  return added;
}
function probeInBrowser(f, name) {
  const base = { id: uid(), name, path: f.path || name, url: f.url };
  if (IMG.test(name)) return new Promise((res) => { const i = new Image(); i.onload = () => res({ ...base, kind: 'image', duration: 0, width: i.naturalWidth, height: i.naturalHeight }); i.onerror = () => res({ ...base, kind: 'image', duration: 0 }); i.src = f.url; });
  if (AUD.test(name)) return new Promise((res) => { const a = new Audio(); a.onloadedmetadata = () => res({ ...base, kind: 'audio', duration: a.duration || 0, hasAudio: true }); a.onerror = () => res({ ...base, kind: 'audio', duration: 0 }); a.src = f.url; });
  return new Promise((res) => {
    const v = document.createElement('video'); v.preload = 'metadata'; v.muted = true;
    v.onloadedmetadata = () => res({ ...base, kind: 'video', duration: v.duration || 0, width: v.videoWidth, height: v.videoHeight, hasAudio: true });
    v.onerror = () => res({ ...base, kind: 'video', duration: 0, hasAudio: false });
    v.src = f.url;
  });
}
// Filmstrips and waveforms load in the background.
async function analyze(m) {
  if (!BAMA.native) { if (m.kind === 'image') S.strips[m.id] = m.url; return; }
  const file = m.proxy || m.path;
  if (m.kind === 'video') invoke('cutroom:strip', file, m.duration, Math.round(L.clamp(m.duration / 2, 4, 24))).then((u) => { if (u) { S.strips[m.id] = u; renderTimeline(); renderLibrary(); } });
  if (m.kind === 'image') S.strips[m.id] = mediaUrl(m);
  if (m.kind === 'audio' || m.hasAudio) invoke('cutroom:peaks', file).then((p) => { S.peaks[m.id] = p; renderTimeline(); }).catch(() => {});
}
async function pickFiles(accept = 'all') {
  if (BAMA.native) {
    const exts = { all: ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'heic', 'tif', 'tiff', 'mp3', 'wav', 'm4a', 'aac', 'aif', 'aiff', 'flac', 'ogg'],
      audio: ['mp3', 'wav', 'm4a', 'aac', 'aif', 'aiff', 'flac', 'ogg', 'mp4', 'mov'] }[accept];
    const paths = await invoke('dialog:open', { multiple: true, filters: [{ name: 'Media', extensions: exts }] });
    return paths ? paths.map((p) => ({ path: p })) : [];
  }
  return new Promise((res) => {
    const i = h('input', { type: 'file', multiple: true, accept: accept === 'audio' ? 'audio/*' : 'video/*,image/*,audio/*' });
    i.onchange = () => res([...i.files].map((f) => ({ name: f.name, path: f.name, url: URL.createObjectURL(f) })));
    i.click();
  });
}
async function importAndPlace(files) {
  const ms = await importFiles(files);
  for (const m of ms) { if (m.kind === 'audio') addAudio(m); else addToMain(m); }
  if (ms.length) commit({ library: true });
}

// ---------- adding to the timeline ----------
function addToMain(m) {
  const main = L.mainTrack(S.P);
  const c = L.newClip(m);
  const at = mainItemAt(S.t);
  if (at && S.t > 0) main.items.splice(at.index + 1, 0, c); else main.items.push(c);
  S.sel = c.id;
  return c;
}
function addOverlay(m) {
  const c = L.newClip(m, { start: L.r3(S.t) });
  c.tf.scale = 0.5;
  if (m.kind === 'image') c.duration = 3;
  else c.out = Math.min(m.duration, 10);
  L.placeItem(S.P, 'overlay', c);
  S.sel = c.id;
  return c;
}
function addAudio(m, role = 'music') {
  const a = L.newAudio(m, { start: L.r3(role === 'music' && !S.P.tracks.some((t) => t.type === 'audio' && t.items.length) ? 0 : S.t), role });
  L.placeItem(S.P, 'audio', a);
  S.sel = a.id;
  return a;
}
function addFree(item) {
  item.start = L.r3(S.t);
  L.placeItem(S.P, item.type, item);
  S.sel = item.id;
  commit();
}

// ---------- player ----------
const screen = $('screen');
const comp = new Compositor(screen, { mediaUrl });
comp.setProject(S.P);
function sizePlayer() {
  const box = $('player');
  const full = L.canvasSize(S.P.canvas.aspect, 1080);
  const ar = full.w / full.h;
  const bw = box.clientWidth - 24, bh = box.clientHeight - 24;
  let cw = bw, ch = bw / ar;
  if (ch > bh) { ch = bh; cw = bh * ar; }
  screen.style.width = Math.max(40, Math.floor(cw)) + 'px';
  screen.style.height = Math.max(40, Math.floor(ch)) + 'px';
  const q = Math.min(+$('previewQ').value, Math.round(Math.min(cw, ch) * (window.devicePixelRatio || 1)));
  const px = L.canvasSize(S.P.canvas.aspect, Math.max(240, q));
  comp.resize(px.w, px.h);
}
function seekTo(t) {
  S.t = L.clamp(t, 0, total());
  paintPlayhead();
  if (S.playing) { S.t0 = S.t; S.wall = performance.now(); comp.sync(S.t, true); return; }
  const tok = ++S.seekTok;
  comp.sync(S.t, false);
  comp.draw(S.t);
  comp.seek(S.t).then(() => { if (tok === S.seekTok && !S.playing) { comp.draw(S.t); paintGizmo(); } });
}
function play() {
  const T = total();
  if (T <= 0) return;
  if (S.t >= T - 0.03) S.t = 0;
  S.playing = true; S.t0 = S.t; S.wall = performance.now();
  $('playBtn').textContent = '❚❚';
  $('gizmo').classList.add('hidden');
  comp.sync(S.t, true);
  const loop = () => {
    if (!S.playing) return;
    const t = S.t0 + (performance.now() - S.wall) / 1000;
    if (t >= T) { pause(); seekTo(T); if (S.rec) stopRecording(); return; }
    S.t = t;
    comp.sync(t, true); comp.draw(t);
    paintPlayhead();
    S.raf = requestAnimationFrame(loop);
  };
  S.raf = requestAnimationFrame(loop);
}
function pause() {
  S.playing = false; cancelAnimationFrame(S.raf); comp.stopAll();
  $('playBtn').textContent = '▶';
  seekTo(S.t);
}
const togglePlay = () => (S.playing ? pause() : play());

// ---------- on-canvas handles ----------
const gizmo = $('gizmo');
function canvasScale() { return screen.clientWidth / screen.width; }
function paintGizmo() {
  const b = S.sel && !S.playing ? comp.boxes.find((x) => x.id === S.sel || (S.sel === '__captions' && x.id.startsWith('caption-'))) : null;
  if (!b) { gizmo.classList.add('hidden'); return; }
  const k = canvasScale();
  gizmo.classList.remove('hidden');
  gizmo.style.width = b.w * k + 'px'; gizmo.style.height = b.h * k + 'px';
  gizmo.style.left = screen.offsetLeft + (b.cx - b.w / 2) * k + 'px';
  gizmo.style.top = screen.offsetTop + (b.cy - b.h / 2) * k + 'px';
  gizmo.style.transform = `rotate(${b.rot}rad)`;
}
function dragGizmo(e, mode) {
  e.preventDefault(); e.stopPropagation();
  const isCap = S.sel === '__captions';
  const f = isCap ? null : selected();
  if (!isCap && !f) return;
  const b = comp.boxes.find((x) => x.id === S.sel || (isCap && x.id.startsWith('caption-')));
  if (!b) return;
  const k = canvasScale(), rect = screen.getBoundingClientRect();
  const cx = rect.left + b.cx * k, cy = rect.top + b.cy * k;
  const local = f ? localOf(f.track, f.item) : 0;
  const tf0 = f ? L.transformAt(f.item, local) : { x: 0, y: S.P.captions.style.y };
  const x0 = e.clientX, y0 = e.clientY, d0 = Math.hypot(x0 - cx, y0 - cy) || 1, a0 = Math.atan2(y0 - cy, x0 - cx);
  gizmo.setPointerCapture(e.pointerId);
  const move = (ev) => {
    if (mode === 'move') {
      const nx = tf0.x + (ev.clientX - x0) / rect.width, ny = tf0.y + (ev.clientY - y0) / rect.height;
      if (isCap) S.P.captions.style.y = L.r3(L.clamp(ny, -0.48, 0.48));
      else { setProp(f.item, f.track, 'x', L.r3(Math.abs(nx) < 0.01 ? 0 : nx)); setProp(f.item, f.track, 'y', L.r3(Math.abs(ny) < 0.01 ? 0 : ny)); }
    } else if (mode === 'scale' && f) {
      setProp(f.item, f.track, 'scale', L.r3(L.clamp(tf0.scale * Math.hypot(ev.clientX - cx, ev.clientY - cy) / d0, 0.05, 10)));
    } else if (mode === 'rot' && f) {
      let r = tf0.rot + (Math.atan2(ev.clientY - cy, ev.clientX - cx) - a0) * 180 / Math.PI;
      for (const snapA of [-180, -90, 0, 90, 180]) if (Math.abs(r - snapA) < 4) r = snapA;
      setProp(f.item, f.track, 'rot', Math.round(r));
    }
    comp.draw(S.t); paintGizmo();
  };
  const up = () => { gizmo.removeEventListener('pointermove', move); gizmo.removeEventListener('pointerup', up); commit(); };
  gizmo.addEventListener('pointermove', move); gizmo.addEventListener('pointerup', up);
}
gizmo.addEventListener('pointerdown', (e) => dragGizmo(e, e.target.classList.contains('gz-scale') ? 'scale' : e.target.classList.contains('gz-rot') ? 'rot' : 'move'));
gizmo.addEventListener('dblclick', () => { const f = selected(); if (f && f.item.type === 'text') { S.insp = 'text'; renderInspector(); setTimeout(() => document.querySelector('#inspector textarea')?.focus(), 0); } });
screen.addEventListener('pointerdown', (e) => {
  const r = screen.getBoundingClientRect(), k = screen.width / r.width;
  const b = comp.hit((e.clientX - r.left) * k, (e.clientY - r.top) * k);
  if (!b) { select(null); return; }
  select(b.id.startsWith('caption-') ? '__captions' : b.id);
  if (S.sel) requestAnimationFrame(() => dragGizmo(e, 'move'));
});
window.addEventListener('resize', debounce(() => { sizePlayer(); seekTo(S.t); renderTimeline(); }, 80));
