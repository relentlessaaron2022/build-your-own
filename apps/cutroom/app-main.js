// Cutroom actions, sound effects, voiceover, captions, export, and startup.

// ---------- busy overlay ----------
let busyCancel = null;
function showBusy(stage, { cancel = null, preview = null } = {}) {
  $('busyStage').textContent = stage; $('busyBar').style.width = '0%'; $('busyNote').textContent = '';
  $('busyPreview').replaceChildren(...(preview ? [preview] : []));
  busyCancel = cancel; $('busyCancel').classList.toggle('hidden', !cancel);
  $('busy').classList.remove('hidden');
}
function updateBusy(pct, note, stage) { if (stage) $('busyStage').textContent = stage; $('busyBar').style.width = L.clamp(pct, 0, 100) + '%'; if (note != null) $('busyNote').textContent = note; }
const hideBusy = () => $('busy').classList.add('hidden');
$('busyCancel').onclick = () => busyCancel && busyCancel();
on('cutroom:progress', (p) => { if (!$('busy').classList.contains('hidden')) updateBusy(p.pct, p.note, p.stage); });

// ---------- editing actions ----------
function splitSelected() {
  let id = S.sel;
  const f = selected();
  if (!f || (() => { const sp = spanOf(f.track, f.item); return S.t <= sp.start || S.t >= sp.end; })()) { const at = mainItemAt(S.t); id = at ? at.item.id : null; }
  if (!id) return toast('Move the playhead over a clip to split it');
  const right = L.splitAt(S.P, id, S.t);
  if (!right) return toast('Too close to the edge of the clip');
  S.sel = right.id; commit();
}
function deleteSelected() {
  if (S.sel === '__captions') { const c = S.P.captions.items.find((x) => S.t >= x.start && S.t < x.end); if (c) { S.P.captions.items = S.P.captions.items.filter((x) => x !== c); commit({ library: true }); } return; }
  const f = selected();
  if (!f) return;
  f.track.items.splice(f.track.items.indexOf(f.item), 1);
  S.sel = null; commit();
}
function duplicateSelected() {
  const f = selected();
  if (!f) return;
  const c = L.clone(f.item); c.id = uid();
  if (f.track.type === 'main') f.track.items.splice(f.track.items.indexOf(f.item) + 1, 0, c);
  else { c.start = L.r3(f.item.start + L.itemLength(f.item)); L.placeItem(S.P, c.type, c); }
  S.sel = c.id; commit();
}
function copySelected() { const f = selected(); if (f) { S.clip = { item: L.clone(f.item), main: f.track.type === 'main' }; toast('Copied'); } }
function paste() {
  if (!S.clip) return;
  const c = L.clone(S.clip.item); c.id = uid();
  if (S.clip.main) { const main = L.mainTrack(S.P), at = mainItemAt(S.t); main.items.splice(at ? at.index + 1 : main.items.length, 0, c); }
  else { c.start = L.r3(S.t); L.placeItem(S.P, c.type, c); }
  S.sel = c.id; commit();
}
function keyframeAll() {
  const f = selected();
  if (!f || !['video', 'image', 'text', 'sticker'].includes(f.item.type)) return toast('Select a clip, text or sticker first');
  const it = f.item, local = localOf(f.track, it), tf = L.transformAt(it, local);
  const has = L.KF_PROPS.every((p) => (it.kf?.[p] || []).some((k) => Math.abs(k.t - local) < 1 / 60));
  for (const p of L.KF_PROPS) has ? L.removeKeyframe(it, p, local) : L.setKeyframe(it, p, local, tf[p]);
  S.insp = 'basic'; commit();
  toast(has ? 'Keyframe removed' : 'Keyframe added. Move the playhead, then drag or resize on the preview.');
}
async function toBytes(canvas, type = 'image/png', q) {
  const blob = await new Promise((r) => canvas.toBlob(r, type, q));
  return { blob, bytes: new Uint8Array(await blob.arrayBuffer()) };
}
function toBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
async function freezeFrame() {
  const at = mainItemAt(S.t);
  if (!at || at.item.type !== 'video') return toast('Park the playhead on a video clip on the main track');
  pause();
  await comp.seek(S.t);
  const v = comp.video(at.item);
  if (!v || !v.videoWidth) return toast('That frame is not ready yet. Try again.');
  const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext('2d').drawImage(v, 0, 0);
  const { blob, bytes } = await toBytes(c, 'image/png');
  const base = { id: uid(), name: 'Freeze frame', kind: 'image', duration: 0, width: c.width, height: c.height };
  const m = BAMA.native ? { ...base, path: await invoke('cutroom:saveAsset', 'freeze.png', bytes) } : { ...base, path: 'freeze.png', url: URL.createObjectURL(blob) };
  S.P.media.push(m); analyze(m);
  const main = L.mainTrack(S.P);
  const right = L.splitAt(S.P, at.item.id, S.t);
  const still = L.newClip(m, { duration: 2, fit: at.item.fit, filter: L.clone(at.item.filter), adjust: L.clone(at.item.adjust), tf: L.clone(at.item.tf) });
  main.items.splice(right ? main.items.indexOf(right) : at.index + 1, 0, still);
  S.sel = still.id; commit({ library: true }); toast('Freeze frame added');
}
async function reverseClip(it) {
  if (it.reversed) { Object.assign(it, { mediaId: it.reversed.mediaId, in: it.reversed.in, out: it.reversed.out }); delete it.reversed; commit(); return; }
  if (!BAMA.native) return toast('Reverse runs in the Mac app');
  const m = mediaById(it.mediaId);
  showBusy('Reversing clip');
  try {
    const p = await invoke('cutroom:reverse', m.proxy || m.path, it.in, it.out);
    const rm = { id: uid(), name: `${m.name} (reversed)`, path: p, kind: 'video', duration: L.r3(it.out - it.in), width: m.width, height: m.height, hasAudio: m.hasAudio, hidden: true };
    S.P.media.push(rm); analyze(rm);
    it.reversed = { mediaId: it.mediaId, in: it.in, out: it.out };
    it.mediaId = rm.id; it.in = 0; it.out = rm.duration;
    commit();
  } catch (e) { toast(cleanErr(e), 'bad'); }
  hideBusy();
}
function extractAudio(it, track) {
  const m = mediaById(it.mediaId);
  if (!m || !m.hasAudio) return toast('This clip has no sound');
  const sp = spanOf(track, it);
  const a = L.newAudio(m, { start: L.r3(sp.start), in: it.in, out: it.out, speed: it.speed || 1, volume: it.volume ?? 1, role: 'voice', name: `${m.name} · sound` });
  L.placeItem(S.P, 'audio', a);
  it.mute = true; S.sel = a.id; commit();
  toast('Sound moved to its own track');
}
async function detectBeats(it) {
  if (!it) {
    it = S.P.tracks.filter((t) => t.type === 'audio').flatMap((t) => t.items).find((x) => x.role !== 'voice' && x.role !== 'sfx');
    if (!it) return toast('Add a music track first (Audio tab)');
  }
  if (!BAMA.native) return toast('Beat detection runs in the Mac app');
  const m = mediaById(it.mediaId);
  showBusy('Finding beats');
  try { it.beats = await invoke('cutroom:beats', m.proxy || m.path, S.beatSens || 1.4); toast(`${it.beats.length} beats marked on the ruler`); }
  catch (e) { toast(cleanErr(e), 'bad'); }
  hideBusy();
  S.sel = it.id; S.insp = 'beats'; commit();
}

// ---------- sound effects, synthesized on the spot ----------
function noise(ctx, dur) {
  const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource(); s.buffer = b; return s;
}
const env = (ctx, g, pts) => { g.gain.setValueAtTime(pts[0][1], 0); for (const [t, v, exp] of pts.slice(1)) exp ? g.gain.exponentialRampToValueAtTime(Math.max(v, 1e-4), t) : g.gain.linearRampToValueAtTime(v, t); };
const SFX = {
  whoosh: { label: 'Whoosh', icon: '💨', dur: 0.9, make(c) { const n = noise(c, 0.9), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(300, 0); f.frequency.exponentialRampToValueAtTime(2600, 0.4); f.frequency.exponentialRampToValueAtTime(400, 0.9); env(c, g, [[0, 0], [0.38, 0.9], [0.9, 0]]); n.connect(f).connect(g).connect(c.destination); n.start(0); } },
  pop: { label: 'Pop', icon: '🫧', dur: 0.2, make(c) { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(900, 0); o.frequency.exponentialRampToValueAtTime(170, 0.09); env(c, g, [[0, 0.9], [0.16, 0.001, 1]]); o.connect(g).connect(c.destination); o.start(0); o.stop(0.2); } },
  ding: { label: 'Ding', icon: '🔔', dur: 1.6, make(c) { [[1318.5, 0.5], [2637, 0.18], [3951, 0.07]].forEach(([fq, a]) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = fq; env(c, g, [[0, a], [1.5, 0.001, 1]]); o.connect(g).connect(c.destination); o.start(0); o.stop(1.6); }); } },
  boom: { label: 'Boom', icon: '💥', dur: 1.8, make(c) { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(120, 0); o.frequency.exponentialRampToValueAtTime(36, 0.7); env(c, g, [[0, 1], [1.7, 0.001, 1]]); o.connect(g).connect(c.destination); o.start(0); o.stop(1.8); const n = noise(c, 0.6), f = c.createBiquadFilter(), g2 = c.createGain(); f.type = 'lowpass'; f.frequency.value = 900; env(c, g2, [[0, 0.5], [0.55, 0.001, 1]]); n.connect(f).connect(g2).connect(c.destination); n.start(0); } },
  click: { label: 'Click', icon: '🖱', dur: 0.05, make(c) { const n = noise(c, 0.02), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'highpass'; f.frequency.value = 2000; env(c, g, [[0, 0.9], [0.015, 0.001, 1]]); n.connect(f).connect(g).connect(c.destination); n.start(0); } },
  riser: { label: 'Riser', icon: '📈', dur: 2.4, make(c) { const n = noise(c, 2.4), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'bandpass'; f.Q.value = 3; f.frequency.setValueAtTime(300, 0); f.frequency.exponentialRampToValueAtTime(6000, 2.3); env(c, g, [[0, 0.001], [2.3, 0.8, 1], [2.4, 0]]); n.connect(f).connect(g).connect(c.destination); n.start(0); const o = c.createOscillator(), og = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, 0); o.frequency.exponentialRampToValueAtTime(880, 2.3); env(c, og, [[0, 0.001], [2.3, 0.12, 1], [2.4, 0]]); o.connect(og).connect(c.destination); o.start(0); o.stop(2.4); } },
  drop: { label: 'Drop', icon: '📉', dur: 0.8, make(c) { const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(1400, 0); o.frequency.exponentialRampToValueAtTime(70, 0.75); env(c, g, [[0, 0.7], [0.78, 0.001, 1]]); o.connect(g).connect(c.destination); o.start(0); o.stop(0.8); } },
  shutter: { label: 'Camera', icon: '📸', dur: 0.25, make(c) { [0, 0.08].forEach((t) => { const n = noise(c, 0.05), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'highpass'; f.frequency.value = 1500; g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.045); n.connect(f).connect(g).connect(c.destination); n.start(t); }); } },
  notify: { label: 'Notification', icon: '📲', dur: 0.6, make(c) { [[880, 0], [1318.5, 0.14]].forEach(([fq, t]) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = fq; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.45); }); } },
  typing: { label: 'Typing', icon: '⌨️', dur: 1.8, make(c) { for (let i = 0; i < 16; i++) { const t = i * 0.1 + Math.random() * 0.04, n = noise(c, 0.03), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'bandpass'; f.frequency.value = 2500 + Math.random() * 1500; g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.025); n.connect(f).connect(g).connect(c.destination); n.start(t); } } },
  scratch: { label: 'Record scratch', icon: '💿', dur: 0.5, make(c) { const n = noise(c, 0.5), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'bandpass'; f.Q.value = 4; f.frequency.setValueAtTime(2500, 0); f.frequency.exponentialRampToValueAtTime(500, 0.18); f.frequency.exponentialRampToValueAtTime(3200, 0.45); env(c, g, [[0, 0.9], [0.48, 0.001, 1]]); n.connect(f).connect(g).connect(c.destination); n.start(0); } },
  heartbeat: { label: 'Heartbeat', icon: '🫀', dur: 1.0, make(c) { [0, 0.22].forEach((t, i) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); g.gain.setValueAtTime(i ? 0.6 : 0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.2); }); } },
};
function wavBytes(buf) {
  const ch = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate, out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
  out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const data = [...Array(ch)].map((_, i) => buf.getChannelData(i));
  for (let i = 0, o = 44; i < n; i++) for (let c = 0; c < ch; c++, o += 2) out.setInt16(o, L.clamp(data[c][i], -1, 1) * 0x7fff, true);
  return new Uint8Array(out.buffer);
}
async function addSfx(key) {
  let m = S.P.media.find((x) => x.sfx === key);
  if (!m) {
    const d = SFX[key];
    const ctx = new OfflineAudioContext(2, Math.ceil(48000 * d.dur), 48000);
    d.make(ctx);
    const bytes = wavBytes(await ctx.startRendering());
    const base = { id: uid(), name: d.label, kind: 'audio', duration: d.dur, hasAudio: true, sfx: key };
    m = BAMA.native ? { ...base, path: await invoke('cutroom:saveAsset', `${key}.wav`, bytes) } : { ...base, path: `${key}.wav`, url: URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' })) };
    S.P.media.push(m); analyze(m);
  }
  addAudio(m, 'sfx'); commit();
  new Audio(mediaUrl(m)).play().catch(() => {});
}

// ---------- voiceover ----------
async function startRecording() {
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
  catch (e) { return toast('Microphone is blocked. Allow it in System Settings → Privacy & Security → Microphone.', 'bad'); }
  const type = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
  const rec = new MediaRecorder(stream, type ? { mimeType: type } : {});
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  S.rec = { rec, stream, chunks, start: S.t, t0: performance.now() };
  comp.forceMute = true;
  rec.start(250);
  if (total() > 0) play();
  renderLibrary(); toast('Recording… press Stop when you are done');
}
async function stopRecording() {
  const r = S.rec;
  if (!r) return;
  S.rec = null;
  if (S.playing) pause();
  comp.forceMute = false;
  await new Promise((res) => { r.rec.onstop = res; r.rec.stop(); });
  r.stream.getTracks().forEach((t) => t.stop());
  const blob = new Blob(r.chunks, { type: r.rec.mimeType || 'audio/webm' });
  const dur = (performance.now() - r.t0) / 1000;
  let m;
  try {
    if (BAMA.native) {
      const raw = await invoke('cutroom:saveAsset', 'voiceover.webm', new Uint8Array(await blob.arrayBuffer()));
      const file = await invoke('cutroom:proxy', raw, 'audio');
      const info = await invoke('cutroom:probe', file);
      m = { id: uid(), name: 'Voiceover', path: file, kind: 'audio', duration: info.duration || dur, hasAudio: true };
    } else m = { id: uid(), name: 'Voiceover', path: 'voiceover.webm', url: URL.createObjectURL(blob), kind: 'audio', duration: dur, hasAudio: true };
  } catch (e) { toast(cleanErr(e), 'bad'); renderLibrary(); return; }
  S.P.media.push(m); analyze(m);
  const a = L.newAudio(m, { start: L.r3(r.start), role: 'voice' });
  L.placeItem(S.P, 'audio', a);
  S.sel = a.id; commit({ library: true }); toast('Voiceover added');
}

// ---------- captions ----------
async function downloadModel(name) {
  showBusy('Downloading speech model');
  try { await invoke('cutroom:whisper:download', name); toast('Speech model ready'); }
  catch (e) { toast(cleanErr(e), 'bad'); }
  hideBusy(); S.whisper = null; renderLibrary();
}
async function autoCaptions() {
  const mix = L.buildAudioMix(S.P, { include: 'voice', base: 0 });
  if (!mix.count) return toast('Nothing to listen to yet. Add clips with sound or record a voiceover.');
  showBusy('Transcribing speech');
  try {
    const words = await invoke('cutroom:transcribe', mix, S.capModel, S.capLang);
    if (!words.length) toast('No speech found');
    const n = S.P.captions.style.words || 3;
    S.P.captions.words = words;
    S.P.captions.items = L.groupCaptions(words, { maxWords: n, maxChars: n * 9 });
    S.sel = '__captions';
    commit({ library: true });
    toast(`${S.P.captions.items.length} captions made. Click any line to fix a word.`);
  } catch (e) { toast(cleanErr(e), 'bad'); }
  hideBusy();
}
async function importSrt() {
  let text;
  if (BAMA.native) { const p = await invoke('dialog:open', { filters: [{ name: 'Subtitles', extensions: ['srt', 'vtt'] }] }); if (!p) return; text = await invoke('fs:readText', p); }
  else text = await new Promise((res) => { const i = h('input', { type: 'file', accept: '.srt,.vtt' }); i.onchange = () => i.files[0].text().then(res); i.click(); });
  const caps = L.parseSRT(text);
  if (!caps.length) return toast('No captions found in that file', 'bad');
  S.P.captions.items = caps; S.P.captions.words = null; commit({ library: true }); toast(`${caps.length} captions imported`);
}
async function exportSrt() {
  const text = L.toSRT(S.P.captions.items);
  if (BAMA.native) { const p = await invoke('dialog:save', { defaultPath: `${S.P.name}.srt` }); if (p) { await invoke('fs:writeText', p, text); toast('Saved'); } }
  else h('a', { href: URL.createObjectURL(new Blob([text])), download: `${S.P.name}.srt` }).click();
}

// ---------- export ----------
async function exportVideo(preset) {
  if (total() <= 0) return toast('Add something to the timeline first');
  if (!BAMA.native) return toast('Export runs in the Mac app. Start it with: npm start cutroom', 'bad');
  const tools = await invoke('cutroom:tools');
  if (!tools.ffmpeg) return toast('ffmpeg is missing. In Terminal run: brew install ffmpeg', 'bad');
  const ex = (S.P.export = { res: 1080, quality: 'high', encoder: 'x264', loudness: true, format: 'mp4', ...(S.P.export || {}) });
  const r = preset || await form('Export video', [
    { name: 'res', label: 'Resolution', type: 'select', value: ex.res, options: Object.entries(L.RESOLUTIONS).map(([k, v]) => [k, `${v} · ${L.canvasSize(S.P.canvas.aspect, +k).w}×${L.canvasSize(S.P.canvas.aspect, +k).h}`]) },
    { name: 'fps', label: 'Frame rate', type: 'select', value: S.P.fps, options: [24, 25, 30, 50, 60] },
    { name: 'quality', label: 'Quality', type: 'select', value: ex.quality, options: [['high', 'High (best for uploading)'], ['standard', 'Standard'], ['small', 'Smaller file']] },
    { name: 'encoder', label: 'Encoder', type: 'select', value: ex.encoder, options: [['x264', 'Best quality (software)'], ['hardware', 'Faster (Mac hardware)']] },
    { name: 'format', label: 'Format', type: 'select', value: ex.format, options: [['mp4', 'MP4'], ['mov', 'QuickTime MOV']] },
    { name: 'loudness', label: 'Even out loudness for social apps (-14 LUFS)', type: 'checkbox', value: ex.loudness },
  ], { ok: 'Export', note: `${L.ASPECTS[S.P.canvas.aspect].label} · ${fmtTC(total())}` });
  if (!r) return;
  Object.assign(ex, { res: +r.res, quality: r.quality, encoder: r.encoder, loudness: r.loudness, format: r.format });
  const out = (preset && preset.out) || await invoke('dialog:save', { defaultPath: `${S.P.name}.${r.format}`, filters: [{ name: 'Video', extensions: [r.format] }] });
  if (!out) return;
  pause();
  const fps = +r.fps, size = L.canvasSize(S.P.canvas.aspect, +r.res);
  const N = Math.max(1, Math.round(total() * fps));
  const canvas = document.createElement('canvas'); canvas.width = size.w; canvas.height = size.h;
  const snapshot = L.clone(S.P);
  const ec = new Compositor(canvas, { exporting: true, mediaUrl });
  ec.setProject(snapshot);
  const mix = L.buildAudioMix(snapshot, { total: N / fps, base: 1, loudness: r.loudness });
  let cancelled = false;
  showBusy('Exporting', { cancel: () => { cancelled = true; }, preview: canvas });
  const t0 = performance.now();
  try {
    await invoke('cutroom:export:start', { out, w: size.w, h: size.h, fps, quality: r.quality, encoder: r.encoder, mix });
    for (let f = 0; f < N; f++) {
      if (cancelled) throw new Error('Export cancelled');
      const t = f / fps;
      await ec.seek(t);
      ec.draw(t);
      const { bytes } = await toBytes(canvas, 'image/jpeg', 0.95);
      await invoke('cutroom:export:frame', bytes);
      if (f % 3 === 0 || f === N - 1) {
        const el = (performance.now() - t0) / 1000, eta = (el / (f + 1)) * (N - f - 1);
        updateBusy(((f + 1) / N) * 100, `Frame ${f + 1} of ${N} · about ${eta < 60 ? Math.ceil(eta) + 's' : Math.ceil(eta / 60) + ' min'} left`);
      }
    }
    updateBusy(100, 'Finishing the file…', 'Exporting');
    const res = await invoke('cutroom:export:finish');
    hideBusy();
    toast(`Exported ${(res.size / 1e6).toFixed(1)} MB`);
    invoke('notify', 'Cutroom', `${basename(out)} is ready`);
    if (!preset) invoke('shell:showItem', out);
    return res;
  } catch (e) {
    await invoke('cutroom:export:cancel');
    hideBusy();
    toast(cleanErr(e), cancelled ? '' : 'bad');
  } finally { ec.dispose(); }
}
async function saveFrame() {
  const size = L.canvasSize(S.P.canvas.aspect, 1080);
  const c = document.createElement('canvas'); c.width = size.w; c.height = size.h;
  const ec = new Compositor(c, { exporting: true, mediaUrl }); ec.setProject(S.P);
  await ec.seek(S.t); ec.draw(S.t);
  const { blob, bytes } = await toBytes(c, 'image/png');
  ec.dispose();
  if (BAMA.native) {
    const p = await invoke('dialog:save', { defaultPath: `${S.P.name} frame.png`, filters: [{ name: 'PNG image', extensions: ['png'] }] });
    if (p) { await invoke('fs:writeBase64', p, toBase64(bytes)); toast('Frame saved'); }
  } else h('a', { href: URL.createObjectURL(blob), download: `${S.P.name} frame.png` }).click();
}

// ---------- project ----------
async function projectMenu() {
  const r = await form('Project', [{ name: 'a', label: 'What would you like to do?', type: 'select', value: 'save', options: [['save', 'Save project as…'], ['open', 'Open project…'], ['new', 'New project'], ['frame', 'Save this frame as an image (thumbnails)']] }], { ok: 'Go' });
  if (!r) return;
  if (r.a === 'frame') return saveFrame();
  if (r.a === 'new') { if (await invoke('dialog:confirm', 'Start a new project?', 'Save first if you want to keep this one.')) { S.P = L.newProject(); S.file = null; S.sel = null; S.hist = []; S.fut = []; S.last = ''; S.t = 0; commit({ library: true }); } return; }
  if (!BAMA.native) return toast('Project files are saved from the Mac app');
  if (r.a === 'save') {
    const p = S.file || await invoke('dialog:save', { defaultPath: `${S.P.name}.cutroom`, filters: [{ name: 'Cutroom project', extensions: ['cutroom'] }] });
    if (p) { S.file = p; await invoke('fs:writeText', p, JSON.stringify(S.P, null, 1)); toast('Project saved'); }
  } else {
    const p = await invoke('dialog:open', { filters: [{ name: 'Cutroom project', extensions: ['cutroom', 'json'] }] });
    if (!p) return;
    try { loadProject(JSON.parse(await invoke('fs:readText', p))); S.file = p; } catch (e) { toast('Could not open that file: ' + cleanErr(e), 'bad'); }
  }
}
function loadProject(P) {
  if (!P || P.version !== 2) { S.P = L.newProject(); if (P && P.clips) toast('That project was made with the older Cutroom. Starting fresh.'); }
  else S.P = { ...L.newProject(), ...P, captions: { ...L.newProject().captions, ...(P.captions || {}) } };
  S.sel = null; S.hist = []; S.fut = []; S.last = JSON.stringify(S.P); S.t = 0;
  comp.setProject(S.P);
  S.P.media.forEach(analyze);
  renderLibrary(); refresh();
}

// ---------- wiring ----------
$('libTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { S.lib = b.dataset.tab; renderLibrary(); } });
$('aspect').replaceChildren(...Object.entries(L.ASPECTS).map(([k, v]) => h('option', { value: k }, v.label)));
$('aspect').onchange = (e) => { S.P.canvas.aspect = e.target.value; commit(); };
$('projName').oninput = (e) => { S.P.name = e.target.value; saveProject(); };
$('projName').onchange = () => commit({ inspector: false });
$('undoBtn').onclick = undo; $('redoBtn').onclick = redo; $('menuBtn').onclick = projectMenu;
$('exportBtn').onclick = () => exportVideo();
$('emptyImport').onclick = async () => importAndPlace(await pickFiles());
$('playBtn').onclick = togglePlay;
$('toStart').onclick = () => seekTo(0); $('toEnd').onclick = () => seekTo(total());
$('prevFrame').onclick = () => seekTo(S.t - 1 / S.P.fps); $('nextFrame').onclick = () => seekTo(S.t + 1 / S.P.fps);
$('previewQ').onchange = () => { sizePlayer(); seekTo(S.t); };
$('fullBtn').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : $('player').requestFullscreen());
document.addEventListener('fullscreenchange', () => setTimeout(() => { sizePlayer(); seekTo(S.t); }, 100));
$('splitBtn').onclick = splitSelected; $('delBtn').onclick = deleteSelected; $('dupBtn').onclick = duplicateSelected;
$('freezeBtn').onclick = freezeFrame;
$('reverseBtn').onclick = () => { const f = selected(); if (f && f.item.type === 'video') reverseClip(f.item); else toast('Select a video clip to reverse'); };
$('kfBtn').onclick = keyframeAll;
$('beatBtn').onclick = () => { const f = selected(); detectBeats(f && f.item.type === 'audio' ? f.item : null); };
$('snapBtn').onclick = () => { S.snap = !S.snap; renderTimeline(); };
$('zoom').oninput = (e) => { S.pps = +e.target.value; renderTimeline(); };

document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, select') || document.querySelector('.modal-back')) return;
  const k = e.key.toLowerCase(), cmd = e.metaKey || e.ctrlKey;
  if (k === ' ') { e.preventDefault(); togglePlay(); }
  else if (cmd && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (cmd && k === 'y') { e.preventDefault(); redo(); }
  else if (cmd && k === 'd') { e.preventDefault(); duplicateSelected(); }
  else if (cmd && k === 'c') { copySelected(); }
  else if (cmd && k === 'v') { e.preventDefault(); paste(); }
  else if (cmd && k === 'e') { e.preventDefault(); exportVideo(); }
  else if (cmd && k === 's') { e.preventDefault(); projectMenu(); }
  else if (cmd && k === 'b') { e.preventDefault(); splitSelected(); }
  else if (k === 's' && !cmd) splitSelected();
  else if (k === 'k' && !cmd) keyframeAll();
  else if (k === 'backspace' || k === 'delete') { e.preventDefault(); deleteSelected(); }
  else if (k === 'arrowleft') { e.preventDefault(); seekTo(S.t - (e.shiftKey ? 1 : 1 / S.P.fps)); }
  else if (k === 'arrowright') { e.preventDefault(); seekTo(S.t + (e.shiftKey ? 1 : 1 / S.P.fps)); }
  else if (k === 'home') seekTo(0);
  else if (k === 'end') seekTo(total());
  else if (k === '=' || k === '+') { S.pps = L.clamp(S.pps * 1.25, 8, 400); $('zoom').value = S.pps; renderTimeline(); }
  else if (k === '-') { S.pps = L.clamp(S.pps / 1.25, 8, 400); $('zoom').value = S.pps; renderTimeline(); }
  else if (k === 'escape') select(null);
});
// drop files from Finder anywhere on the window
document.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); $('player').classList.add('over'); } });
document.addEventListener('dragleave', (e) => { if (!e.relatedTarget) $('player').classList.remove('over'); });
document.addEventListener('drop', (e) => {
  $('player').classList.remove('over');
  if (!e.dataTransfer.files.length) return;
  e.preventDefault();
  importAndPlace([...e.dataTransfer.files].map((f) => (BAMA.native ? { path: window.bama.pathFor(f), name: f.name } : { name: f.name, path: f.name, url: URL.createObjectURL(f) })));
});

$('tlResize').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const y0 = e.clientY, h0 = $('timeline').offsetHeight;
  const mv = (ev) => { $('timeline').style.height = L.clamp(h0 - (ev.clientY - y0), 170, window.innerHeight * 0.7) + 'px'; sizePlayer(); comp.draw(S.t); };
  const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); store.set('tlHeight', $('timeline').offsetHeight); renderTimeline(); seekTo(S.t); };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
});
store.get('tlHeight', null).then((hh) => { if (hh) { $('timeline').style.height = hh + 'px'; sizePlayer(); } });

(async () => {
  const saved = await store.get('project2', null);
  loadProject(saved);
  $('aspect').value = S.P.canvas.aspect;
  S.lib = 'media';
  renderLibrary();
  if (BAMA.native) invoke('cutroom:tools').then((t) => { if (!t.ffmpeg) toast('ffmpeg is missing, so exports will not work yet. In Terminal run: brew install ffmpeg', 'bad'); });
})();
