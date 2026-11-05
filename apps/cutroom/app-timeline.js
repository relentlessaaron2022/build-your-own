// Cutroom timeline: tracks, items, trimming, dragging, snapping, scrubbing.
const RULER = 26, PAD = 14;
const ROW_H = { captions: 28, text: 34, overlay: 46, effect: 28, main: 64, audio: 44 };
const TYPE_ICON = { text: 'T', overlay: '▣', effect: '✨', main: '🎞', audio: '♪', captions: '💬' };
const xOf = (t) => PAD + t * S.pps;
const tOf = (x) => Math.max(0, (x - PAD) / S.pps);

function timelineRows() {
  const rows = [];
  let y = RULER;
  if (S.P.captions.items.length) { rows.push({ kind: 'captions', y, h: ROW_H.captions }); y += ROW_H.captions; }
  for (const tr of S.P.tracks) { const hgt = ROW_H[tr.type] || 40; rows.push({ kind: tr.type, track: tr, y, h: hgt }); y += hgt; }
  return { rows, height: y + 30 };
}
// Beat markers on the timeline, from every audio item that has them.
function beatTimes() {
  const out = [];
  for (const tr of S.P.tracks) if (tr.type === 'audio') for (const it of tr.items) for (const b of it.beats || []) {
    if (b < it.in || b > it.out) continue;
    out.push(L.r3(it.start + (b - it.in) / (it.speed || 1)));
  }
  return out.sort((a, b) => a - b);
}

function renderTimeline() {
  const T = total();
  const canvas = $('tlCanvas'), scroll = $('tlScroll');
  const { rows, height } = timelineRows();
  const width = Math.max(scroll.clientWidth, xOf(T + Math.max(20, 600 / S.pps)));
  canvas.style.width = width + 'px'; canvas.style.height = Math.max(height, scroll.clientHeight) + 'px';
  canvas.replaceChildren();

  // ruler
  const ruler = h('div', { class: 'ruler', style: { width: width + 'px' } });
  const steps = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120];
  const major = steps.find((s) => s * S.pps >= 70) || 300;
  const minor = major / (major >= 1 ? (major % 5 === 0 ? 5 : 4) : 5);
  for (let t = 0; xOf(t) < width; t += minor) {
    const isMajor = Math.abs(t / major - Math.round(t / major)) < 1e-6;
    ruler.append(h('span', { class: isMajor ? '' : 'minor', style: { left: xOf(t) + 'px' } }, isMajor ? fmtRuler(t, major) : ''));
  }
  for (const b of beatTimes()) ruler.append(h('div', { class: 'beat', style: { left: xOf(b) + 'px' } }));
  canvas.append(ruler);

  // heads
  const heads = $('tlHeads');
  heads.replaceChildren(...rows.map((r) => {
    const tr = r.track;
    const visual = r.kind !== 'audio';
    const btns = [];
    if (r.kind === 'captions') btns.push(h('button', { class: S.P.captions.hidden ? 'off' : '', title: 'Show / hide captions', onclick: () => { S.P.captions.hidden = !S.P.captions.hidden; commit(); } }, S.P.captions.hidden ? '◌' : '👁'));
    else {
      if (visual) btns.push(h('button', { class: tr.hidden ? 'off' : '', title: 'Show / hide track', onclick: () => { tr.hidden = !tr.hidden; commit(); } }, tr.hidden ? '◌' : '👁'));
      if (['main', 'overlay', 'audio'].includes(r.kind)) btns.push(h('button', { class: tr.muted ? 'off' : '', title: 'Mute track', onclick: () => { tr.muted = !tr.muted; commit(); } }, tr.muted ? '🔇' : '🔊'));
    }
    return h('div', { class: 'tl-head', style: { height: r.h + 'px' } }, h('span', {}, TYPE_ICON[r.kind] || ''), h('span', { class: 'nm' }, r.kind === 'captions' ? 'Captions' : tr.name), ...btns);
  }));
  heads.scrollTop = scroll.scrollTop;

  // rows and items
  for (const r of rows) {
    const row = h('div', { class: `track-row ${r.kind}`, style: { top: r.y + 'px', height: r.h + 'px', width: width + 'px' }, 'data-row': r.kind === 'captions' ? 'captions' : r.track.id });
    canvas.append(row);
    if (r.kind === 'captions') {
      for (const c of S.P.captions.items) row.append(itemEl({ id: c.id, cap: c }, 'caption', c.start, c.end - c.start, c.text));
      continue;
    }
    const tr = r.track;
    if (tr.type === 'main') {
      const lay = L.layoutMain(tr.items);
      tr.items.forEach((c, i) => {
        const el = itemEl(c, c.type, lay[i].start, lay[i].len, c.name, tr);
        row.append(el);
        if (i > 0) {
          const tx = lay[i].transition;
          row.append(h('div', { class: 'tx' + (tx.type !== 'none' ? ' on' : ''), title: tx.type !== 'none' ? L.TRANSITIONS[tx.type] : 'Add a transition',
            style: { left: xOf(lay[i].start + tx.duration / 2) + 'px' }, onpointerdown: (e) => e.stopPropagation(),
            onclick: () => { select(c.id, 'transition'); S.lib = 'transitions'; renderLibrary(); } }, tx.type !== 'none' ? '⧉' : '+'));
        }
      });
      if (!tr.items.length) row.append(h('div', { class: 'faint', style: { position: 'absolute', left: PAD + 'px', top: '22px', fontSize: '12px' } }, 'Main track: import media and it lands here. Clips play one after another.'));
      continue;
    }
    for (const it of tr.items) {
      const label = it.type === 'text' ? it.text : it.type === 'sticker' ? it.emoji : it.type === 'effect' ? `${L.EFFECTS[it.effect]?.icon || ''} ${L.EFFECTS[it.effect]?.label || it.effect}` : it.name;
      row.append(itemEl(it, it.type, it.start, L.itemLength(it), label, tr));
    }
  }
  canvas.append(h('div', { class: 'playhead', id: 'playhead', style: { left: xOf(S.t) + 'px' } }));
  $('snapBtn').classList.toggle('on', S.snap);
  paintPlayhead();
}
function fmtRuler(t, step) {
  const m = Math.floor(t / 60), s = t % 60;
  return step < 1 ? `${m}:${s.toFixed(1).padStart(4, '0')}` : `${m}:${String(Math.round(s)).padStart(2, '0')}`;
}

function itemEl(it, type, start, len, label, track) {
  const w = Math.max(6, len * S.pps);
  const cls = ['item', type];
  if (track && track.type === 'overlay') cls.push('overlay');
  if (type === 'audio' && it.role === 'voice') cls.push('voice');
  if (S.sel === it.id) cls.push('sel');
  const el = h('div', { class: cls.join(' '), style: { left: xOf(start) + 'px', width: w + 'px' }, 'data-id': it.id, title: label });
  const m = it.mediaId ? mediaById(it.mediaId) : null;
  if ((type === 'video' || type === 'image') && m && S.strips[m.id]) {
    el.style.backgroundImage = `url("${S.strips[m.id]}")`;
    if (type === 'video') {
      const sp = it.speed || 1;
      el.style.backgroundSize = `${(m.duration / sp) * S.pps}px 100%`;
      el.style.backgroundPosition = `${-(it.in / sp) * S.pps}px 0`;
      el.style.backgroundRepeat = 'no-repeat';
    }
  }
  if (type === 'audio' || (type === 'video' && m && S.peaks[m.id] && track && track.type === 'main')) {
    const peaks = m && S.peaks[m.id];
    if (peaks && (type === 'audio' || !it.mute)) {
      const cv = h('canvas', { width: Math.min(4000, Math.round(w)), height: type === 'audio' ? 40 : 18 });
      if (type !== 'audio') Object.assign(cv.style, { top: 'auto', height: '18px' });
      drawWave(cv, peaks, it.in || 0, (it.in || 0) + len * (it.speed || 1), type === 'audio' ? 'rgba(180,255,220,.9)' : 'rgba(255,255,255,.55)');
      el.append(cv);
    }
  }
  const lbl = type === 'video' || type === 'audio' ? `${label}${it.speed && it.speed !== 1 ? `  ${it.speed}×` : ''}${it.mute ? '  🔇' : ''}${it.voice && it.voice !== 'none' ? '  🎙' : ''}` : label;
  el.append(h('div', { class: 'lbl' }, type === 'text' ? `T  ${lbl}` : lbl));
  // keyframe diamonds
  const kts = new Set(Object.values(it.kf || {}).flat().map((k) => k.t));
  for (const kt of kts) if (kt <= len) el.append(h('div', { class: 'kfd', style: { left: kt * S.pps + 'px' } }));
  el.append(h('div', { class: 'h l', 'data-h': 'l' }), h('div', { class: 'h r', 'data-h': 'r' }));
  return el;
}
function drawWave(cv, peaks, from, to, color) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height;
  g.fillStyle = color;
  const a = from * 50, b = to * 50, per = (b - a) / W;
  for (let x = 0; x < W; x++) {
    let m = 0;
    for (let i = Math.floor(a + x * per); i < a + (x + 1) * per && i < peaks.length; i++) m = Math.max(m, peaks[i] || 0);
    const hh = Math.max(1, m * H * 0.9);
    g.fillRect(x, (H - hh) / 2, 1, hh);
  }
}
function paintPlayhead() {
  const ph = $('playhead');
  if (ph) ph.style.left = xOf(S.t) + 'px';
  $('tc').textContent = fmtTC(S.t);
  $('tcTotal').textContent = '/ ' + fmtTC(total());
  if (S.playing) {
    const sc = $('tlScroll'), x = xOf(S.t);
    if (x > sc.scrollLeft + sc.clientWidth - 60) sc.scrollLeft = x - 120;
  }
}

// ---------- snapping ----------
function snapPoints(exceptId) {
  const pts = [0, S.t];
  for (const tr of S.P.tracks) {
    if (tr.type === 'main') { L.layoutMain(tr.items).forEach((l, i) => { if (tr.items[i].id !== exceptId) pts.push(l.start, l.end); }); continue; }
    for (const it of tr.items) if (it.id !== exceptId) pts.push(it.start, it.start + L.itemLength(it));
  }
  for (const c of S.P.captions.items) if (c.id !== exceptId) pts.push(c.start, c.end);
  return pts.concat(beatTimes());
}
function nearest(t, pts) {
  if (!S.snap) return null;
  const tol = 8 / S.pps;
  let best = null;
  for (const p of pts) if (Math.abs(p - t) < tol && (best == null || Math.abs(p - t) < Math.abs(best - t))) best = p;
  return best;
}
function snap(t, pts) {
  if (!S.snap) { hideSnap(); return t; }
  const tol = 8 / S.pps;
  let best = null;
  for (const p of pts) if (Math.abs(p - t) < tol && (best == null || Math.abs(p - t) < Math.abs(best - t))) best = p;
  if (best == null) { hideSnap(); return t; }
  showSnap(best);
  return best;
}
function showSnap(t) {
  let l = $('snapline');
  if (!l) { l = h('div', { class: 'snapline', id: 'snapline' }); $('tlCanvas').append(l); }
  l.style.left = xOf(t) + 'px';
}
const hideSnap = () => $('snapline')?.remove();

// ---------- pointer handling ----------
const tlCanvas = $('tlCanvas');
tlCanvas.addEventListener('pointerdown', (e) => {
  const itemEl2 = e.target.closest('.item');
  if (!itemEl2) { scrub(e); return; }
  const id = itemEl2.dataset.id;
  const handle = e.target.dataset.h;
  const cap = S.P.captions.items.find((c) => c.id === id);
  if (cap) { S.sel = '__captions'; S.lib = 'captions'; renderLibrary(); renderInspector(); dragCaption(e, cap, handle, itemEl2); return; }
  if (S.sel !== id) select(id);
  const f = L.findItem(S.P, id);
  const el = tlCanvas.querySelector(`.item[data-id="${id}"]`) || itemEl2;
  if (handle) trimItem(e, f, handle, el);
  else if (f.track.type === 'main') dragMain(e, f, el);
  else dragFree(e, f, el);
});
function capture(e, move, up) {
  const target = e.target;
  try { if (target.isConnected) target.setPointerCapture(e.pointerId); } catch (_) { /* window listeners carry the drag */ }
  const mv = (ev) => move(ev);
  const u = (ev) => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', u); hideSnap(); up(ev); };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', u);
}
function scrub(e) {
  const rect = tlCanvas.getBoundingClientRect();
  const go = (ev) => { if (S.playing) pause(); seekTo(tOf(ev.clientX - rect.left)); paintGizmo(); };
  go(e);
  capture(e, go, () => { renderInspector(); });
}
function trimItem(e, f, side, el) {
  const { item: it, track } = f;
  const x0 = e.clientX, sp = it.speed || 1;
  const s0 = { in: it.in, out: it.out, duration: it.duration, start: it.start };
  const span0 = spanOf(track, it);
  const m = it.mediaId ? mediaById(it.mediaId) : null;
  const pts = snapPoints(it.id);
  const timed = it.type === 'video' || it.type === 'audio';
  capture(e, (ev) => {
    let dt = (ev.clientX - x0) / S.pps;
    if (side === 'r') {
      dt = snap(span0.end + dt, pts) - span0.end;
      if (timed) it.out = L.r3(L.clamp(s0.out + dt * sp, s0.in + 0.1 * sp, m ? m.duration : Infinity));
      else it.duration = L.r3(Math.max(0.1, s0.duration + dt));
    } else {
      dt = snap(span0.start + dt, pts) - span0.start;
      if (timed) {
        const nin = L.clamp(s0.in + dt * sp, 0, s0.out - 0.1 * sp);
        const realDt = (nin - s0.in) / sp;
        it.in = L.r3(nin);
        if (track.type !== 'main') it.start = L.r3(Math.max(0, s0.start + realDt));
      } else {
        const d = L.clamp(dt, track.type === 'main' ? -Infinity : -s0.start, s0.duration - 0.1);
        it.duration = L.r3(s0.duration - d);
        if (track.type !== 'main') it.start = L.r3(s0.start + d);
      }
    }
    const sp2 = spanOf(track, it);
    el.style.left = xOf(sp2.start) + 'px'; el.style.width = Math.max(6, sp2.len * S.pps) + 'px';
    seekTo(side === 'r' ? sp2.end - 0.001 : sp2.start);
  }, () => commit());
}
function rowAt(clientY) {
  const rect = tlCanvas.getBoundingClientRect(), y = clientY - rect.top;
  return timelineRows().rows.find((r) => y >= r.y && y < r.y + r.h);
}
const fits = (it, kind) => ({ text: ['text', 'sticker'], overlay: ['video', 'image'], main: ['video', 'image'], effect: ['effect'], audio: ['audio'] }[kind] || []).includes(it.type);
function markRow(r) { tlCanvas.querySelectorAll('.track-row.drop').forEach((x) => x.classList.remove('drop')); if (r) tlCanvas.querySelector(`.track-row[data-row="${r.track ? r.track.id : r.kind}"]`)?.classList.add('drop'); }
function dragFree(e, f, el) {
  const { item: it, track } = f;
  const x0 = e.clientX, start0 = it.start, len = L.itemLength(it);
  const pts = snapPoints(it.id);
  let moved = false, target = null, ns = start0;
  capture(e, (ev) => {
    if (!moved && Math.abs(ev.clientX - x0) < 3 && Math.abs(ev.clientY - e.clientY) < 3) return;
    moved = true; el.classList.add('dragging');
    const raw = Math.max(0, start0 + (ev.clientX - x0) / S.pps);
    const a = nearest(raw, pts), b = nearest(raw + len, pts);
    if (a != null && (b == null || Math.abs(a - raw) <= Math.abs(b - raw - len))) { ns = a; showSnap(a); }
    else if (b != null) { ns = Math.max(0, b - len); showSnap(b); }
    else { ns = raw; hideSnap(); }
    el.style.left = xOf(ns) + 'px';
    const r = rowAt(ev.clientY);
    target = r && r.track && fits(it, r.kind) ? r : null;
    markRow(target && target.track !== track ? target : null);
    if (target) el.style.top = (target.y - timelineRows().rows.find((x) => x.track === track).y + 3) + 'px';
  }, (ev) => {
    markRow(null);
    if (!moved) return;
    it.start = L.r3(Math.max(0, ns));
    if (target && target.track !== track) {
      track.items.splice(track.items.indexOf(it), 1);
      if (target.kind === 'main') {
        delete it.start;
        const lay = L.layoutMain(target.track.items);
        const tt = tOf(ev.clientX - tlCanvas.getBoundingClientRect().left);
        let idx = lay.findIndex((l) => tt < (l.start + l.end) / 2); if (idx < 0) idx = lay.length;
        it.tf.scale = 1; it.tf.x = 0; it.tf.y = 0;
        target.track.items.splice(idx, 0, it);
      } else target.track.items.push(it);
    }
    track.items.sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    if (target && target.track.type !== 'main') target.track.items.sort((a, b) => a.start - b.start);
    commit();
  });
}
function dragMain(e, f, el) {
  const { item: it, track } = f;
  const x0 = e.clientX;
  let moved = false, idx = null, target = null, mark = null;
  const rect = tlCanvas.getBoundingClientRect();
  capture(e, (ev) => {
    if (!moved && Math.abs(ev.clientX - x0) < 4 && Math.abs(ev.clientY - e.clientY) < 4) return;
    moved = true; el.classList.add('dragging');
    el.style.transform = `translate(${ev.clientX - x0}px, ${ev.clientY - e.clientY}px)`;
    const r = rowAt(ev.clientY);
    target = r && r.track && r.track !== track && r.kind === 'overlay' ? r : null;
    markRow(target);
    const tt = tOf(ev.clientX - rect.left);
    const lay = L.layoutMain(track.items);
    idx = lay.findIndex((l) => tt < (l.start + l.end) / 2); if (idx < 0) idx = lay.length;
    if (!mark) { mark = h('div', { class: 'insert-mark' }); tlCanvas.append(mark); }
    const mr = timelineRows().rows.find((x) => x.track === track);
    Object.assign(mark.style, { left: xOf(idx < lay.length ? lay[idx].start : (lay.at(-1)?.end || 0)) - 1 + 'px', top: mr.y + 'px', height: mr.h + 'px', display: target ? 'none' : 'block' });
  }, (ev) => {
    mark?.remove(); markRow(null);
    if (!moved) return;
    const from = track.items.indexOf(it);
    if (target) { // main clip becomes an overlay at the drop time
      track.items.splice(from, 1);
      it.start = L.r3(Math.max(0, tOf(parseFloat(el.style.left) + (ev.clientX - x0))));
      it.tf.scale = it.tf.scale === 1 ? 0.5 : it.tf.scale;
      it.transition = { type: 'none', duration: 0.6 };
      target.track.items.push(it); target.track.items.sort((a, b) => a.start - b.start);
    } else if (idx != null) {
      track.items.splice(from, 1);
      track.items.splice(idx > from ? idx - 1 : idx, 0, it);
    }
    commit();
  });
}
function dragCaption(e, cap, side, el) {
  const x0 = e.clientX, a0 = cap.start, b0 = cap.end;
  const pts = snapPoints(cap.id);
  capture(e, (ev) => {
    const dt = (ev.clientX - x0) / S.pps;
    if (side === 'l') cap.start = L.r3(L.clamp(snap(a0 + dt, pts), 0, b0 - 0.1));
    else if (side === 'r') cap.end = L.r3(Math.max(cap.start + 0.1, snap(b0 + dt, pts)));
    else { const ns = Math.max(0, snap(a0 + dt, pts)); cap.start = L.r3(ns); cap.end = L.r3(ns + (b0 - a0)); }
    if (cap.words) cap.words = null; // timing changed; words re-spread evenly
    el.style.left = xOf(cap.start) + 'px'; el.style.width = (cap.end - cap.start) * S.pps + 'px';
    seekTo(cap.start + 0.01);
  }, () => { S.P.captions.items.sort((a, b) => a.start - b.start); commit({ library: true }); });
}
$('tlScroll').addEventListener('scroll', () => { $('tlHeads').scrollTop = $('tlScroll').scrollTop; });
$('tlScroll').addEventListener('wheel', (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  e.preventDefault();
  const sc = $('tlScroll'), rect = sc.getBoundingClientRect();
  const tAt = tOf(e.clientX - rect.left + sc.scrollLeft);
  S.pps = L.clamp(S.pps * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 8, 400);
  $('zoom').value = S.pps;
  renderTimeline();
  sc.scrollLeft = xOf(tAt) - (e.clientX - rect.left);
}, { passive: false });
