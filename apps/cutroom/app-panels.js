// Cutroom panels: the library on the left and the inspector on the right.

// ---------- small UI builders ----------
function slider(label, value, min, max, step, onInput, o = {}) {
  const fmt = o.fmt || ((v) => (Math.round(v * 100) / 100).toString());
  const parse = o.parse || ((s) => parseFloat(s));
  const val = h('input', { class: 'val', value: fmt(value) });
  const r = h('input', { type: 'range', min, max, step, value });
  r.addEventListener('input', () => { val.value = fmt(+r.value); onInput(+r.value); });
  r.addEventListener('change', () => (o.onChange ? o.onChange() : commit({ inspector: false })));
  val.addEventListener('change', () => { const v = L.clamp(parse(val.value), min, max); if (Number.isFinite(v)) { r.value = v; onInput(v); (o.onChange ? o.onChange() : commit()); } });
  const kids = [h('span', {}, label), r, val];
  if (o.kf) kids.push(kfButton(o.kf.item, o.kf.track, o.kf.prop));
  return h('div', { class: 'prop' + (o.kf ? '' : ' nokf') }, ...kids);
}
function kfButton(it, track, prop) {
  const local = localOf(track, it);
  const list = (it.kf && it.kf[prop]) || [];
  const on = list.some((k) => Math.abs(k.t - local) < 1 / 60);
  return h('button', { class: 'kf' + (on ? ' on' : list.length ? ' has' : ''), title: on ? 'Remove keyframe here' : 'Add keyframe at the playhead',
    onclick: () => {
      if (on) L.removeKeyframe(it, prop, local);
      else L.setKeyframe(it, prop, local, L.transformAt(it, local)[prop]);
      commit();
    } }, on || list.length ? '◆' : '◇');
}
const pick = (opts, value, onChange, attrs = {}) => h('select', { class: 'select', onchange: (e) => onChange(e.target.value), ...attrs },
  (Array.isArray(opts) ? opts.map((o) => (Array.isArray(o) ? o : [o, o])) : Object.entries(opts).map(([k, v]) => [k, typeof v === 'string' ? v : v.label]))
    .map(([k, v]) => h('option', { value: k, selected: String(k) === String(value) }, v)));
const seg = (opts, value, onPick) => h('div', { class: 'seg2' }, opts.map(([k, l]) => h('button', { class: String(k) === String(value) ? 'active' : '', onclick: () => onPick(k) }, l)));
const field = (label, el) => h('label', { class: 'field' }, label, el);
const colorIn = (value, onInput) => { const c = h('input', { type: 'color', class: 'color', value: toHex(value) }); c.addEventListener('input', () => onInput(c.value)); c.addEventListener('change', () => commit({ inspector: false })); return c; };
const check = (label, value, onChange) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!value, onchange: (e) => { onChange(e.target.checked); commit(); } }), label);
const toHex = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#000000');
const live = () => { comp.draw(S.t); paintGizmo(); };
const pct = (v) => `${Math.round(v * 100)}%`;

// ---------- library ----------
function renderLibrary() {
  document.querySelectorAll('#libTabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === S.lib));
  const body = $('libBody');
  const views = { media: libMedia, audio: libAudio, text: libText, stickers: libStickers, effects: libEffects, transitions: libTransitions, filters: libFilters, captions: libCaptions };
  body.replaceChildren(...[].concat((views[S.lib] || libMedia)()).filter(Boolean));
}
function libMedia() {
  const visual = S.P.media.filter((m) => m.kind !== 'audio' && !m.hidden);
  const zone = h('div', { class: 'drop-zone' }, 'Drop videos and photos here', h('br'), h('span', { class: 'faint' }, 'Click a clip to add it to the main track at the playhead'));
  return [
    h('button', { class: 'btn primary', onclick: async () => importAndPlace(await pickFiles()) }, '＋ Import media'),
    visual.length ? h('div', { class: 'grid' }, visual.map(mediaTile)) : zone,
  ];
}
function mediaTile(m) {
  const strip = S.strips[m.id];
  const thumb = h('div', { class: 'thumb', style: strip ? { backgroundImage: `url("${strip}")`, backgroundSize: m.kind === 'video' && BAMA.native ? `${Math.round(L.clamp(m.duration / 2, 4, 24)) * 100}% 100%` : 'cover', backgroundPosition: '0 0' } : {} }, strip ? '' : m.kind === 'video' ? '▶' : '▣');
  if (!strip && m.kind === 'video' && m.url) { const v = h('video', { src: m.url, muted: true, style: { width: '100%', height: '100%', objectFit: 'cover' } }); v.addEventListener('loadeddata', () => { v.currentTime = Math.min(0.5, m.duration / 3); }); thumb.append(v); }
  return h('div', { class: 'tile', title: m.name, onclick: () => { addToMain(m); commit(); } }, thumb,
    m.kind === 'video' ? h('span', { class: 'badge' }, fmtTC(m.duration).slice(0, 5)) : h('span', { class: 'badge' }, 'Photo'),
    h('button', { class: 'plus', title: 'Add as overlay (picture in picture)', onclick: (e) => { e.stopPropagation(); addOverlay(m); commit(); } }, '▣'),
    h('div', { class: 'cap' }, m.name));
}
function libAudio() {
  const tracks = S.P.media.filter((m) => m.kind === 'audio' && !m.hidden && !m.sfx);
  return [
    h('div', { class: 'row' },
      h('button', { class: 'btn primary grow', onclick: async () => { const ms = await importFiles(await pickFiles('audio')); ms.forEach((m) => addAudio(m.kind === 'audio' ? m : m)); if (ms.length) commit({ library: true }); } }, '＋ Import music'),
      h('button', { class: 'btn' + (S.rec ? ' recording' : ''), id: 'recBtn', onclick: () => (S.rec ? stopRecording() : startRecording()) }, S.rec ? '■ Stop' : '● Voiceover')),
    h('div', { class: 'faint', style: { fontSize: '11.5px' } }, 'Voiceover records from your microphone while the video plays from the playhead.'),
    h('h5', {}, 'Sound effects'),
    h('div', { class: 'grid' }, Object.entries(SFX).map(([k, v]) => h('div', { class: 'tile', onclick: () => addSfx(k) },
      h('div', { class: 'thumb', style: { background: '#1a2b26', fontSize: '22px' } }, v.icon), h('div', { class: 'cap' }, v.label)))),
    tracks.length ? h('h5', {}, 'Your audio') : null,
    ...tracks.map((m) => h('div', { class: 'row', style: { fontSize: '12px' } }, h('span', {}, '♪'), h('span', { class: 'grow', style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, m.name),
      h('span', { class: 'faint' }, fmtTC(m.duration).slice(0, 5)),
      h('button', { class: 'btn sm', onclick: () => { addAudio(m, 'music'); commit(); } }, '＋'))),
  ];
}
function libText() {
  return [
    h('button', { class: 'btn primary', onclick: () => addFree(L.newText('Your text')) }, '＋ Add text'),
    h('h5', {}, 'Styles'),
    h('div', { class: 'grid' }, Object.entries(L.TEXT_PRESETS).map(([k, p]) => {
      const st = p.style;
      const css = { fontFamily: `"${st.font}", sans-serif`, fontWeight: st.weight, color: st.color, letterSpacing: st.spacing / 6 + 'px', textTransform: st.upper ? 'uppercase' : 'none' };
      if (st.stroke) css.webkitTextStroke = `${Math.min(2, st.stroke / 5)}px ${st.strokeColor}`;
      if (st.glow) css.textShadow = `0 0 8px ${st.color}`;
      else if (st.shadow) css.textShadow = `${st.shadowX / 3}px ${st.shadowY / 3}px ${st.shadowBlur / 3}px ${st.shadowColor}`;
      const inner = st.box ? h('span', { style: { ...css, background: st.boxColor, padding: '2px 6px', borderRadius: '4px' } }, p.text || 'Abc') : h('span', { style: css }, p.text || 'Abc');
      return h('div', { class: 'tile', onclick: () => addFree(L.newText(p.text || p.label, { style: { ...st } })) }, h('div', { class: 'textpreset' }, inner), h('div', { class: 'cap' }, p.label));
    })),
  ];
}
function libStickers() {
  S.stickerCat = S.stickerCat || 'Hype';
  return [
    h('div', { class: 'chips' }, Object.keys(L.STICKERS).map((c) => h('button', { class: 'chip' + (c === S.stickerCat ? ' active' : ''), onclick: () => { S.stickerCat = c; renderLibrary(); } }, c))),
    h('div', { class: 'grid small' }, L.STICKERS[S.stickerCat].map((e) => h('div', { class: 'emoji', title: 'Add at the playhead', onclick: () => addFree(L.newSticker(e)) }, e))),
    h('div', { class: 'faint', style: { fontSize: '11.5px' } }, 'Drag a sticker on the preview to place it. The corner handle resizes, the top handle rotates.'),
  ];
}
function libEffects() {
  const f = selected();
  const clip = f && ['video', 'image'].includes(f.item.type) ? f.item : null;
  S.fxMode = clip ? (S.fxMode || 'layer') : 'layer';
  return [
    clip ? seg([['layer', 'Add as layer'], ['clip', 'Apply to selected clip']], S.fxMode, (k) => { S.fxMode = k; renderLibrary(); }) : null,
    h('div', { class: 'faint', style: { fontSize: '11.5px' } }, S.fxMode === 'clip' ? 'Effects stack on the clip and move with it.' : 'An effect layer changes everything under it on the timeline. Drag its edges to set when it starts and stops.'),
    h('div', { class: 'grid' }, Object.entries(L.EFFECTS).map(([k, v]) => h('div', { class: 'tile', onclick: () => {
      if (S.fxMode === 'clip' && clip) { clip.effects = clip.effects || []; clip.effects.push({ type: k, amount: 0.7 }); S.insp = 'fx'; commit(); toast(`${v.label} added to clip`); }
      else addFree(L.newEffect(k));
    } }, h('div', { class: 'thumb', style: { background: 'linear-gradient(135deg,#2a2233,#1b2030)', fontSize: '24px' } }, v.icon), h('div', { class: 'cap' }, v.label)))),
  ];
}
function transitionTarget() {
  const main = L.mainTrack(S.P);
  const f = selected();
  if (f && f.track === main && main.items.indexOf(f.item) > 0) return f.item;
  const at = mainItemAt(S.t);
  if (at && at.index > 0) return at.item;
  return main.items[1] || null;
}
function libTransitions() {
  const target = transitionTarget();
  const main = L.mainTrack(S.P);
  if (!target) return [h('div', { class: 'empty' }, h('h3', {}, 'Add two clips first'), 'Transitions go between clips on the main track.')];
  const idx = main.items.indexOf(target);
  const cur = target.transition || { type: 'none', duration: 0.6 };
  return [
    h('div', { class: 'faint', style: { fontSize: '12px' } }, `Between clip ${idx} and ${idx + 1}. Click a ✚ on the timeline to pick another cut.`),
    h('div', { class: 'grid' }, Object.entries(L.TRANSITIONS).map(([k, label]) => h('div', { class: 'tile' + (cur.type === k ? ' active' : ''), onclick: () => { target.transition = { ...cur, type: k }; commit({ library: true }); seekTo(L.layoutMain(main.items)[idx].start - 0.3); } },
      h('div', { class: 'thumb', style: { background: 'linear-gradient(90deg,#2b3a55 50%,#55332b 50%)', fontSize: '18px' } }, k === 'none' ? '|' : '⧉'), h('div', { class: 'cap' }, label)))),
    slider('Duration', cur.duration ?? 0.6, 0.1, 3, 0.05, (v) => { target.transition = { ...target.transition, duration: v }; }, { fmt: (v) => v.toFixed(2) + 's', onChange: () => commit({ library: true }) }),
    h('button', { class: 'btn', onclick: () => { main.items.forEach((c, i) => { if (i) c.transition = { ...target.transition }; }); commit(); toast('Applied to every cut'); } }, 'Apply to all cuts'),
  ];
}
function libFilters() {
  const f = selected();
  const target = f && ['video', 'image'].includes(f.item.type) ? f.item : mainItemAt(S.t)?.item;
  if (!target) return [h('div', { class: 'empty' }, h('h3', {}, 'Add a clip first'), 'Filters change the color of a clip.')];
  const thumbs = h('div', { class: 'grid' });
  const snapshot = document.createElement('canvas');
  const sw = 160, sh = Math.round(160 * screen.height / screen.width);
  snapshot.width = sw; snapshot.height = sh;
  snapshot.getContext('2d').drawImage(screen, 0, 0, sw, sh);
  for (const [k, fl] of Object.entries(L.FILTERS)) {
    const c = document.createElement('canvas'); c.width = sw; c.height = sh;
    const g = c.getContext('2d');
    const look = L.resolveLook({ filter: { preset: k, amount: 1 }, adjust: {} });
    g.filter = Compositor.cssFilter(look, 0); g.drawImage(snapshot, 0, 0); g.filter = 'none';
    if (look.warmth) { g.globalCompositeOperation = 'soft-light'; g.globalAlpha = Math.abs(look.warmth) / 100 * 0.5; g.fillStyle = look.warmth > 0 ? '#ff8a1f' : '#2f7bff'; g.fillRect(0, 0, sw, sh); }
    Object.assign(c.style, { width: '100%', aspectRatio: `${sw}/${sh}`, display: 'block', maxHeight: '110px', objectFit: 'cover' });
    thumbs.append(h('div', { class: 'tile' + ((target.filter?.preset || 'none') === k ? ' active' : ''), onclick: () => { target.filter = { preset: k, amount: target.filter?.amount ?? 1 }; commit({ library: true }); } }, c, h('div', { class: 'cap' }, fl.label)));
  }
  return [
    thumbs,
    slider('Strength', target.filter?.amount ?? 1, 0, 1, 0.01, (v) => { target.filter = { ...(target.filter || { preset: 'none' }), amount: v }; live(); }, { fmt: pct }),
    h('button', { class: 'btn', onclick: () => { for (const tr of S.P.tracks) for (const it of tr.items) if (['video', 'image'].includes(it.type)) { it.filter = { ...target.filter }; it.adjust = { ...(target.adjust || L.ADJ()) }; } commit(); toast('Look applied to every clip'); } }, 'Apply this look to all clips'),
  ];
}
function libCaptions() {
  const C = S.P.captions;
  const out = [];
  if (BAMA.native) {
    const w = S.whisper;
    if (!w) { invoke('cutroom:whisper:status').then((st) => { S.whisper = st; if (S.lib === 'captions') renderLibrary(); }); out.push(h('div', { class: 'faint' }, 'Checking for speech recognition…')); }
    else if (!w.bin) out.push(h('div', { class: 'card-note' }, h('strong', {}, 'Auto captions'), 'Cutroom turns speech into captions with whisper.cpp. It is free and runs entirely on your Mac. Install it once in Terminal:',
      h('code', {}, 'brew install whisper-cpp'), h('button', { class: 'btn sm', onclick: () => { S.whisper = null; renderLibrary(); } }, 'Check again')));
    else {
      S.capModel = S.capModel || (w.models['base.en'] ? 'base.en' : Object.keys(w.models).find((m) => w.models[m]) || 'base.en');
      S.capLang = S.capLang || 'en';
      const have = w.models[S.capModel];
      out.push(h('div', { class: 'card-note' }, h('strong', {}, 'Auto captions'),
        h('div', { class: 'row2' },
          field('Model', pick({ 'base.en': `English, fast${w.models['base.en'] ? ' ✓' : ''}`, 'small.en': `English, accurate${w.models['small.en'] ? ' ✓' : ''}`, base: `Any language${w.models.base ? ' ✓' : ''}`, small: `Any language, accurate${w.models.small ? ' ✓' : ''}` }, S.capModel, (v) => { S.capModel = v; if (!v.endsWith('.en') && S.capLang === 'en') S.capLang = 'auto'; renderLibrary(); })),
          field('Language', pick(S.capModel.endsWith('.en') ? { en: 'English' } : { auto: 'Detect', en: 'English', es: 'Spanish', fr: 'French', pt: 'Portuguese', de: 'German', it: 'Italian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', hi: 'Hindi', ar: 'Arabic', sw: 'Swahili', yo: 'Yoruba' }, S.capLang, (v) => { S.capLang = v; }))),
        have ? h('button', { class: 'btn primary', onclick: autoCaptions }, C.items.length ? '↻ Redo auto captions' : '✨ Generate captions')
          : h('button', { class: 'btn primary', onclick: () => downloadModel(S.capModel) }, `⤓ Download model (${w.sizes[S.capModel]} MB, once)`),
        h('span', { class: 'faint', style: { fontSize: '11px' } }, 'Listens to your clips and voiceovers. Music tracks are skipped.')));
    }
  } else out.push(h('div', { class: 'card-note' }, 'Auto captions run in the Mac app (npm start cutroom). You can still type captions here.'));
  out.push(h('div', { class: 'row', style: { flexWrap: 'wrap' } },
    h('button', { class: 'btn sm', onclick: () => { const t = L.r3(S.t); C.items.push({ id: uid(), start: t, end: L.r3(t + 2), text: 'New caption' }); C.items.sort((a, b) => a.start - b.start); commit({ library: true }); } }, '＋ Caption at playhead'),
    h('button', { class: 'btn sm', onclick: importSrt }, 'Import .srt'),
    C.items.length ? h('button', { class: 'btn sm', onclick: exportSrt }, 'Export .srt') : null,
    C.items.length ? h('button', { class: 'btn sm danger', onclick: async () => { if (await invoke('dialog:confirm', 'Remove all captions?')) { C.items = []; C.words = null; commit({ library: true }); } } }, 'Clear') : null));
  if (C.items.length) {
    out.push(h('h5', {}, 'Look'),
      h('div', { class: 'chips' }, Object.entries(L.CAPTION_PRESETS).map(([k, p]) => h('button', { class: 'chip' + (C.style.preset === k ? ' active' : ''), onclick: () => { Object.assign(C.style, { preset: k, font: p.font, color: p.color, highlight: p.highlight, stroke: p.stroke, box: p.box, upper: p.upper, shadow: !!p.shadow }); commit({ library: true }); } }, p.label))),
      h('div', { class: 'faint', style: { fontSize: '11.5px' } }, 'Click a caption on the preview to restyle it in the inspector, or drag it up and down.'),
      h('h5', {}, `${C.items.length} captions`),
      ...C.items.map((c) => {
        const inp = h('input', { class: 'input', value: c.text });
        inp.addEventListener('input', () => { c.text = inp.value; c.words = null; live(); });
        inp.addEventListener('change', () => commit({ inspector: false }));
        inp.addEventListener('focus', () => seekTo(c.start + 0.01));
        return h('div', { class: 'cap-row' + (S.t >= c.start && S.t < c.end ? ' on' : '') }, h('span', { class: 't', onclick: () => seekTo(c.start + 0.01) }, fmtTC(c.start).slice(0, 8)), inp,
          h('button', { class: 'btn sm ghost', title: 'Delete', onclick: () => { C.items = C.items.filter((x) => x !== c); commit({ library: true }); } }, '×'));
      }));
  }
  return out;
}

// ---------- inspector ----------
function inspTabs(it, track) {
  if (!it) return [['project', 'Project']];
  if (it.type === 'video' || it.type === 'image') {
    const tabs = [['basic', 'Basic'], ['anim', 'Animate'], ['look', 'Color'], ['fx', 'Effects']];
    if (it.type === 'video') tabs.push(['speed', 'Speed'], ['audio', 'Audio']);
    if (track.type === 'main' && track.items.indexOf(it) > 0) tabs.push(['transition', 'Transition']);
    return tabs;
  }
  if (it.type === 'text') return [['text', 'Text'], ['style', 'Style'], ['anim', 'Animate'], ['basic', 'Position']];
  if (it.type === 'sticker') return [['basic', 'Position'], ['anim', 'Animate']];
  if (it.type === 'effect') return [['effect', 'Effect']];
  if (it.type === 'audio') return [['audio', 'Audio'], ['beats', 'Beats']];
  return [['basic', 'Basic']];
}
function renderInspector() {
  const box = $('inspector');
  if (S.sel === '__captions') { box.replaceChildren(h('div', { class: 'insp-tabs' }, h('button', { class: 'active' }, 'Captions')), h('div', { class: 'insp' }, inspCaptions())); return; }
  const f = selected();
  const it = f ? f.item : null, track = f ? f.track : null;
  const tabs = inspTabs(it, track);
  if (!tabs.some(([k]) => k === S.insp)) S.insp = tabs[0][0];
  const views = { project: inspProject, basic: inspBasic, anim: inspAnim, look: inspLook, fx: inspFx, speed: inspSpeed, audio: inspAudio, transition: inspTransition, text: inspText, style: inspStyle, effect: inspEffect, beats: inspBeats };
  box.replaceChildren(
    h('div', { class: 'insp-tabs' }, tabs.map(([k, l]) => h('button', { class: k === S.insp ? 'active' : '', onclick: () => { S.insp = k; renderInspector(); } }, l))),
    h('div', { class: 'insp' }, [].concat(views[S.insp](it, track)).filter(Boolean)));
}
function durationRow(it) {
  if (it.type === 'video' || it.type === 'audio') return null;
  return slider('Duration', it.duration, 0.1, Math.max(30, it.duration * 2), 0.05, (v) => { it.duration = L.r3(v); renderTimeline(); live(); }, { fmt: (v) => v.toFixed(2) + 's' });
}
function inspProject() {
  const P = S.P;
  return [
    h('h5', {}, 'Canvas'),
    field('Size', pick(Object.fromEntries(Object.entries(L.ASPECTS).map(([k, v]) => [k, v.label])), P.canvas.aspect, (v) => { P.canvas.aspect = v; $('aspect').value = v; commit(); })),
    field('Background', seg([['blur', 'Blurred'], ['color', 'Color'], ['black', 'Black']], P.canvas.bg, (k) => { P.canvas.bg = k; commit(); })),
    P.canvas.bg === 'color' ? field('Color', colorIn(P.canvas.color, (v) => { P.canvas.color = v; live(); })) : null,
    field('Frame rate', seg([[24, '24'], [25, '25'], [30, '30'], [60, '60']], P.fps, (k) => { P.fps = +k; commit(); })),
    h('div', { class: 'faint', style: { fontSize: '12px', lineHeight: 1.6 } },
      `${S.P.media.length} media · ${fmtTC(total())} long`, h('br'), h('br'),
      h('strong', {}, 'Shortcuts'), h('br'),
      'Space play · S split · ⌫ delete · ⌘D duplicate · ⌘C / ⌘V copy and paste · ⌘Z undo · K keyframe · ← → step frame · ⇧← → one second · ⌘E export'),
  ];
}
function inspBasic(it, track) {
  const local = localOf(track, it);
  const tf = L.transformAt(it, local);
  const kf = (prop) => ({ item: it, track, prop });
  const set = (prop) => (v) => { setProp(it, track, prop, v); live(); };
  const visual = it.type === 'video' || it.type === 'image';
  const len = spanOf(track, it).len;
  return [
    visual ? field('Fit', seg([['fit', 'Fit'], ['fill', 'Fill frame']], it.fit || 'fit', (k) => { it.fit = k; commit(); })) : null,
    h('h5', {}, 'Transform'),
    slider('Scale', tf.scale, 0.05, 4, 0.01, set('scale'), { fmt: pct, parse: (s) => parseFloat(s) / 100, kf: kf('scale') }),
    slider('Position X', tf.x, -1, 1, 0.005, set('x'), { fmt: (v) => Math.round(v * 100) + '', parse: (s) => parseFloat(s) / 100, kf: kf('x') }),
    slider('Position Y', tf.y, -1, 1, 0.005, set('y'), { fmt: (v) => Math.round(v * 100) + '', parse: (s) => parseFloat(s) / 100, kf: kf('y') }),
    slider('Rotate', tf.rot, -180, 180, 1, set('rot'), { fmt: (v) => Math.round(v) + '°', kf: kf('rot') }),
    slider('Opacity', tf.opacity, 0, 1, 0.01, set('opacity'), { fmt: pct, parse: (s) => parseFloat(s) / 100, kf: kf('opacity') }),
    it.type === 'sticker' ? slider('Size', it.size || 220, 40, 800, 1, (v) => { it.size = v; live(); }, { fmt: (v) => Math.round(v) + '' }) : null,
    visual ? h('div', { class: 'seg2' },
      h('button', { class: it.flipH ? 'active' : '', onclick: () => { it.flipH = !it.flipH; commit(); } }, '⇋ Flip'),
      h('button', { class: it.flipV ? 'active' : '', onclick: () => { it.flipV = !it.flipV; commit(); } }, '⇵ Flip'),
      h('button', { onclick: () => { it.tf = L.TF(); it.kf = {}; commit(); } }, 'Reset')) : null,
    track.type === 'overlay' ? field('Blend', pick({ normal: 'Normal', screen: 'Screen (drop black)', multiply: 'Multiply (drop white)', overlay: 'Overlay', lighten: 'Lighten', darken: 'Darken', 'color-dodge': 'Color dodge', difference: 'Difference' }, it.blend || 'normal', (v) => { it.blend = v; commit(); })) : null,
    h('h5', {}, 'Motion'),
    field('Camera move', pick({ '': 'Choose a move…', ...Object.fromEntries(Object.entries(L.MOTION_PRESETS).map(([k, v]) => [k, v.label])), clear: 'Remove all keyframes' }, '', (v) => {
      if (v === 'clear') it.kf = {}; else if (v) L.applyMotion(it, v, len);
      commit();
    })),
    h('div', { class: 'faint', style: { fontSize: '11.5px' } }, '◆ adds a keyframe at the playhead. Move the playhead, change a value, and Cutroom animates between them.'),
    durationRow(it),
  ];
}
function inspAnim(it) {
  const a = (it.anim = it.anim || { in: {}, out: {}, loop: {} });
  a.in = a.in || { type: 'none', dur: 0.5 }; a.out = a.out || { type: 'none', dur: 0.5 }; a.loop = a.loop || { type: 'none', speed: 1 };
  const isText = it.type === 'text';
  const filt = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => isText || !L.LETTER_ANIMS.has(k)));
  const preview = (which) => { const f = selected(); const sp = spanOf(f.track, it); seekTo(which === 'out' ? sp.end - a.out.dur - 0.05 : sp.start); setTimeout(play, 30); };
  return [
    h('h5', {}, 'Entrance'), pick(filt(L.ANIM_IN), a.in.type, (v) => { a.in.type = v; commit(); preview('in'); }),
    slider('Length', a.in.dur, 0.1, 3, 0.05, (v) => { a.in.dur = v; live(); }, { fmt: (v) => v.toFixed(2) + 's' }),
    h('h5', {}, 'Exit'), pick(filt(L.ANIM_OUT), a.out.type, (v) => { a.out.type = v; commit(); preview('out'); }),
    slider('Length', a.out.dur, 0.1, 3, 0.05, (v) => { a.out.dur = v; live(); }, { fmt: (v) => v.toFixed(2) + 's' }),
    h('h5', {}, 'Loop'), pick(L.ANIM_LOOP, a.loop.type, (v) => { a.loop.type = v; commit(); }),
    slider('Speed', a.loop.speed || 1, 0.25, 4, 0.05, (v) => { a.loop.speed = v; live(); }, { fmt: (v) => v.toFixed(2) + '×' }),
  ];
}
function inspLook(it) {
  it.adjust = it.adjust || L.ADJ();
  it.filter = it.filter || { preset: 'none', amount: 1 };
  const ranges = { blur: [0, 100], fade: [0, 100], vignette: [0, 100], grain: [0, 100], hue: [-180, 180] };
  return [
    h('h5', {}, 'Filter'),
    pick(L.FILTERS, it.filter.preset, (v) => { it.filter.preset = v; commit(); }),
    slider('Strength', it.filter.amount, 0, 1, 0.01, (v) => { it.filter.amount = v; live(); }, { fmt: pct }),
    h('h5', {}, 'Adjust'),
    ...Object.entries(L.ADJUST_KEYS).map(([k, label]) => { const [mn, mx] = ranges[k] || [-100, 100]; return slider(label, it.adjust[k] || 0, mn, mx, 1, (v) => { it.adjust[k] = v; live(); }, { fmt: (v) => Math.round(v) + '' }); }),
    h('button', { class: 'btn sm', onclick: () => { it.adjust = L.ADJ(); it.filter = { preset: 'none', amount: 1 }; commit(); } }, 'Reset color'),
  ];
}
function inspFx(it) {
  it.effects = it.effects || [];
  return [
    ...it.effects.map((fx, i) => h('div', { class: 'card', style: { padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' } },
      h('div', { class: 'row' }, h('strong', { class: 'grow' }, `${L.EFFECTS[fx.type]?.icon || ''} ${L.EFFECTS[fx.type]?.label || fx.type}`), h('button', { class: 'btn sm ghost', onclick: () => { it.effects.splice(i, 1); commit(); } }, '×')),
      slider('Strength', fx.amount ?? 0.7, 0, 1, 0.01, (v) => { fx.amount = v; live(); }, { fmt: pct }))),
    pick({ '': '＋ Add an effect to this clip…', ...Object.fromEntries(Object.entries(L.EFFECTS).map(([k, v]) => [k, `${v.icon} ${v.label}`])) }, '', (v) => { if (v) { it.effects.push({ type: v, amount: 0.7 }); commit(); } }),
    h('div', { class: 'faint', style: { fontSize: '11.5px' } }, 'Want an effect across several clips? Use the Effects tab on the left to add an effect layer.'),
  ];
}
function inspSpeed(it, track) {
  return [
    slider('Speed', it.speed || 1, 0.1, 4, 0.05, (v) => { it.speed = L.r3(v); renderTimeline(); live(); }, { fmt: (v) => v.toFixed(2) + '×' }),
    seg([[0.25, '0.25×'], [0.5, '0.5×'], [1, '1×'], [1.5, '1.5×'], [2, '2×'], [3, '3×']], it.speed || 1, (k) => { it.speed = +k; commit(); }),
    h('div', { class: 'faint', style: { fontSize: '11.5px' } }, `Clip length: ${spanOf(track, it).len.toFixed(2)}s. Sound keeps its pitch.`),
    h('div', { class: 'seg2' },
      h('button', { class: it.reversed ? 'active' : '', onclick: () => reverseClip(it) }, it.reversed ? '⇆ Reversed' : '⇆ Reverse'),
      h('button', { onclick: freezeFrame }, '❄︎ Freeze frame')),
  ];
}
function inspAudio(it, track) {
  const isAudio = it.type === 'audio';
  return [
    slider('Volume', it.volume ?? 1, 0, 2, 0.01, (v) => { it.volume = L.r3(v); comp.sync(S.t, S.playing); }, { fmt: pct, parse: (s) => parseFloat(s) / 100 }),
    !isAudio ? check('Mute clip', it.mute, (v) => { it.mute = v; }) : null,
    h('div', { class: 'row2' },
      slider('Fade in', it.fadeIn || 0, 0, 5, 0.1, (v) => { it.fadeIn = v; }, { fmt: (v) => v.toFixed(1) + 's' }),
      slider('Fade out', it.fadeOut || 0, 0, 5, 0.1, (v) => { it.fadeOut = v; }, { fmt: (v) => v.toFixed(1) + 's' })),
    isAudio ? field('This is', seg([['music', '🎵 Music'], ['voice', '🎙 Voice'], ['sfx', '💥 Sound effect']], it.role || 'music', (k) => { it.role = k; commit(); })) : null,
    isAudio ? slider('Speed', it.speed || 1, 0.5, 2, 0.05, (v) => { it.speed = L.r3(v); renderTimeline(); }, { fmt: (v) => v.toFixed(2) + '×' }) : null,
    h('h5', {}, 'Voice changer'),
    h('div', { class: 'chips' }, Object.entries(L.VOICES).map(([k, v]) => h('button', { class: 'chip' + ((it.voice || 'none') === k ? ' active' : ''), onclick: () => { it.voice = k; commit(); } }, v.label))),
    check('Reduce background noise', it.denoise, (v) => { it.denoise = v; }),
    h('div', { class: 'faint', style: { fontSize: '11.5px' } }, 'Voice effects and noise reduction are applied in the exported file.'),
    !isAudio && track ? h('button', { class: 'btn sm', onclick: () => extractAudio(it, track) }, '⇣ Extract audio to its own track') : null,
  ];
}
function inspTransition(it) {
  const tr = it.transition || { type: 'none', duration: 0.6 };
  return [
    h('div', { class: 'chips' }, Object.entries(L.TRANSITIONS).map(([k, l]) => h('button', { class: 'chip' + (tr.type === k ? ' active' : ''), onclick: () => { it.transition = { ...tr, type: k }; commit(); const main = L.mainTrack(S.P); seekTo(L.layoutMain(main.items)[main.items.indexOf(it)].start - 0.3); } }, l))),
    slider('Duration', tr.duration ?? 0.6, 0.1, 3, 0.05, (v) => { it.transition = { ...it.transition, duration: v }; renderTimeline(); live(); }, { fmt: (v) => v.toFixed(2) + 's' }),
    h('button', { class: 'btn sm', onclick: () => { L.mainTrack(S.P).items.forEach((c, i) => { if (i) c.transition = { ...it.transition }; }); commit(); toast('Applied to every cut'); } }, 'Apply to all cuts'),
  ];
}
function inspText(it) {
  const s = it.style;
  const ta = h('textarea', { class: 'textarea', rows: 3 });
  ta.value = it.text;
  ta.addEventListener('input', () => { it.text = ta.value; live(); });
  ta.addEventListener('change', () => commit({ inspector: false }));
  const setS = (k) => (v) => { s[k] = v; live(); };
  return [
    ta,
    field('Style', pick({ '': 'Apply a style…', ...Object.fromEntries(Object.entries(L.TEXT_PRESETS).map(([k, v]) => [k, v.label])) }, '', (v) => { if (v) { it.style = { ...L.TEXT_PRESETS[v].style }; commit(); } })),
    field('Font', pick(L.FONTS, s.font, (v) => { s.font = v; commit(); }, { style: { fontFamily: s.font } })),
    slider('Size', s.size, 12, 320, 1, setS('size'), { fmt: (v) => Math.round(v) + '' }),
    h('div', { class: 'seg2' },
      h('button', { class: s.weight >= 700 ? 'active' : '', onclick: () => { s.weight = s.weight >= 700 ? 400 : 800; commit(); } }, h('b', {}, 'B')),
      h('button', { class: s.italic ? 'active' : '', onclick: () => { s.italic = !s.italic; commit(); } }, h('i', {}, 'I')),
      h('button', { class: s.upper ? 'active' : '', onclick: () => { s.upper = !s.upper; commit(); } }, 'AA'),
      ...['left', 'center', 'right'].map((a) => h('button', { class: s.align === a ? 'active' : '', onclick: () => { s.align = a; commit(); } }, { left: '⇤', center: '≡', right: '⇥' }[a]))),
    field('Color', colorIn(s.color, setS('color'))),
    slider('Spacing', s.spacing || 0, -10, 60, 1, setS('spacing'), { fmt: (v) => Math.round(v) + '' }),
    slider('Line height', s.lineHeight || 1.15, 0.7, 2.5, 0.05, setS('lineHeight'), { fmt: (v) => v.toFixed(2) }),
    durationRow(it),
  ];
}
function inspStyle(it) {
  const s = it.style;
  const setS = (k) => (v) => { s[k] = v; live(); };
  return [
    h('h5', {}, 'Outline'),
    slider('Width', s.stroke || 0, 0, 30, 0.5, setS('stroke'), { fmt: (v) => v.toFixed(1) }),
    field('Color', colorIn(s.strokeColor, setS('strokeColor'))),
    h('h5', {}, 'Shadow'),
    check('Drop shadow', s.shadow, (v) => { s.shadow = v; }),
    s.shadow ? field('Color', colorIn(s.shadowColor, setS('shadowColor'))) : null,
    s.shadow ? slider('Blur', s.shadowBlur ?? 12, 0, 60, 1, setS('shadowBlur'), { fmt: (v) => Math.round(v) + '' }) : null,
    s.shadow ? slider('Offset X', s.shadowX || 0, -30, 30, 1, setS('shadowX'), { fmt: (v) => Math.round(v) + '' }) : null,
    s.shadow ? slider('Offset Y', s.shadowY ?? 6, -30, 30, 1, setS('shadowY'), { fmt: (v) => Math.round(v) + '' }) : null,
    h('h5', {}, 'Glow'),
    slider('Glow', s.glow || 0, 0, 80, 1, setS('glow'), { fmt: (v) => Math.round(v) + '' }),
    h('h5', {}, 'Background'),
    check('Background box', s.box, (v) => { s.box = v; }),
    s.box ? field('Color', colorIn(s.boxColor, setS('boxColor'))) : null,
    s.box ? slider('Opacity', s.boxOpacity ?? 0.7, 0, 1, 0.01, setS('boxOpacity'), { fmt: pct }) : null,
    s.box ? slider('Roundness', s.boxRadius ?? 16, 0, 60, 1, setS('boxRadius'), { fmt: (v) => Math.round(v) + '' }) : null,
  ];
}
function inspEffect(it) {
  return [
    h('div', { class: 'chips' }, Object.entries(L.EFFECTS).map(([k, v]) => h('button', { class: 'chip' + (it.effect === k ? ' active' : ''), onclick: () => { it.effect = k; commit(); } }, `${v.icon} ${v.label}`))),
    slider('Strength', it.amount ?? 0.7, 0, 1, 0.01, (v) => { it.amount = v; live(); }, { fmt: pct }),
    durationRow(it),
    h('div', { class: 'faint', style: { fontSize: '11.5px' } }, 'An effect layer changes every track below it on the timeline.'),
  ];
}
function inspBeats(it) {
  const n = (it.beats || []).length;
  return [
    h('div', { class: 'faint', style: { fontSize: '12px', lineHeight: 1.5 } }, 'Cutroom listens for the hits in the song and marks them in yellow on the ruler. Clips snap to the marks, or line up on them all at once.'),
    slider('Sensitivity', S.beatSens || 1.4, 0.8, 2.5, 0.05, (v) => { S.beatSens = v; }, { fmt: (v) => v.toFixed(2), onChange: () => {} }),
    h('button', { class: 'btn primary', onclick: () => detectBeats(it) }, n ? `↻ Find beats again (${n} now)` : '♪ Find beats'),
    n ? h('button', { class: 'btn', onclick: () => {
      const beats = beatTimes().filter((b) => b >= it.start);
      const c = L.syncToBeats(S.P, beats, 0);
      commit(); toast(c ? `${c} clips now cut on the beat` : 'Add clips to the main track first');
    } }, '✂︎ Cut main clips to the beat') : null,
    n ? h('button', { class: 'btn sm danger', onclick: () => { it.beats = []; commit(); } }, 'Clear beat marks') : null,
  ];
}
function inspCaptions() {
  const st = S.P.captions.style;
  const set = (k) => (v) => { st[k] = v; live(); };
  const regroup = (n) => { st.words = n; if (S.P.captions.words) S.P.captions.items = L.groupCaptions(S.P.captions.words, { maxWords: n, maxChars: n * 9 }); commit({ library: true }); };
  return [
    h('div', { class: 'chips' }, Object.entries(L.CAPTION_PRESETS).map(([k, p]) => h('button', { class: 'chip' + (st.preset === k ? ' active' : ''), onclick: () => { Object.assign(st, { preset: k, font: p.font, color: p.color, highlight: p.highlight, stroke: p.stroke, box: p.box, upper: p.upper, shadow: !!p.shadow }); commit(); } }, p.label))),
    field('Font', pick(L.FONTS, st.font, (v) => { st.font = v; commit(); })),
    slider('Size', st.size || 64, 20, 160, 1, set('size'), { fmt: (v) => Math.round(v) + '' }),
    slider('Height', st.y ?? 0.28, -0.45, 0.45, 0.01, set('y'), { fmt: (v) => Math.round(v * 100) + '' }),
    h('div', { class: 'row2' }, field('Text', colorIn(st.color, set('color'))), field('Spoken word', colorIn(st.highlight, set('highlight')))),
    slider('Outline', st.stroke ?? 8, 0, 20, 0.5, set('stroke'), { fmt: (v) => v.toFixed(1) }),
    check('Highlight box behind the spoken word', st.box, (v) => { st.box = v; }),
    check('ALL CAPS', st.upper, (v) => { st.upper = v; }),
    field('Words on screen', seg([[1, '1'], [2, '2'], [3, '3'], [4, '4'], [6, '6']], st.words || 3, (k) => regroup(+k))),
    field('Animation', seg([['pop', 'Pop'], ['fade', 'Fade'], ['none', 'None']], st.anim || 'pop', (k) => { st.anim = k; commit(); })),
  ];
}
