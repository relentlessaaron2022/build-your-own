// Manuscript page.
const { h, toast, form, store, invoke, debounce } = BAMA;
const M = ManuscriptLib;

const S = { index: [], p: null, sel: null, view: 'editor', open: {}, sessionStart: 0, sessionBase: 0 };
const $ = (id) => document.getElementById(id);

// ---------- persistence ----------
const save = debounce(async () => {
  if (!S.p) return;
  S.p.updated = Date.now();
  await store.set('project:' + S.p.id, S.p);
  const entry = S.index.find((x) => x.id === S.p.id);
  if (entry) entry.title = S.p.title; else S.index.push({ id: S.p.id, title: S.p.title });
  await store.set('projects', S.index);
}, 400);
const touch = () => { save(); paintStatus(); paintGoal(); };

async function boot() {
  S.index = await store.get('projects', []);
  const lastId = await store.get('lastProject', null);
  const pick = S.index.find((x) => x.id === lastId) || S.index[0];
  if (pick) await openProject(pick.id);
  else await newProject(true);
}
async function openProject(id) {
  const p = await store.get('project:' + id, null);
  if (!p) { toast('That project is missing', 'bad'); return; }
  S.p = p; S.open = (await store.get('open:' + id, null)) || {};
  S.sel = (await store.get('sel:' + id, null)) || firstDoc() || p.roots.draft;
  if (!p.nodes[S.sel]) S.sel = p.roots.draft;
  S.sessionBase = M.countWords(p, p.roots.draft); S.sessionStart = Date.now();
  store.set('lastProject', id);
  paintAll();
}
function firstDoc() {
  return M.descendants(S.p, S.p.roots.draft).find((n) => n.type === 'doc')?.id;
}
async function newProject(first = false) {
  const r = await form(first ? 'Start your first project' : 'New project', [
    { name: 'title', label: 'Title', value: first ? 'Untitled Book' : '' },
    { name: 'template', label: 'Template', type: 'select', value: 'novel', options: Object.entries(M.TEMPLATES).map(([k, t]) => [k, t.name]) },
  ], { ok: 'Create' });
  if (!r) { if (first) { S.p = M.createProject('Untitled Book', 'novel'); S.index = [{ id: S.p.id, title: S.p.title }]; await store.set('project:' + S.p.id, S.p); await store.set('projects', S.index); await openProject(S.p.id); } return; }
  const p = M.createProject(r.title || 'Untitled', r.template);
  await store.set('project:' + p.id, p);
  S.index.push({ id: p.id, title: p.title });
  await store.set('projects', S.index);
  await openProject(p.id);
}

// ---------- painting ----------
function paintAll() { paintProjects(); paintBinder(); paintStage(); paintInspector(); paintStatus(); paintGoal(); }
function paintProjects() {
  const sel = $('projectPick');
  sel.replaceChildren(...S.index.map((x) => h('option', { value: x.id, selected: x.id === S.p.id }, x.title)),
    h('option', { value: '__rename' }, 'Rename this project…'));
}
const node = (id) => S.p.nodes[id];
const selNode = () => node(S.sel);

let drag = null;
function paintBinder() {
  const tree = h('div', { class: 'tree' });
  const rootsOrder = ['draft', 'characters', 'places', 'research', 'trash'];
  const icons = { draft: '📖', characters: '👤', places: '📍', research: '🗂', trash: '🗑' };
  const row = (id, depth, rootKey) => {
    const n = node(id);
    const hasKids = n.children.length > 0;
    const isOpen = S.open[id] !== false;
    const el = h('div', {
      class: 'tnode' + (id === S.sel ? ' active' : '') + (n.root ? ' root' : ''),
      style: { paddingLeft: 6 + depth * 14 + 'px' }, draggable: !n.root, 'data-id': id,
      onclick: () => select(id),
      ondblclick: () => !n.root || rootKey !== 'trash' ? rename(el, id) : null,
    },
    h('span', { class: 'tw', onclick: (e) => { e.stopPropagation(); S.open[id] = !isOpen; store.set('open:' + S.p.id, S.open); paintBinder(); } }, hasKids ? (isOpen ? '▾' : '▸') : ''),
    h('span', { class: 'ti' }, n.root ? icons[rootKey] : n.type === 'folder' ? '📁' : '📄'),
    n.label ? h('span', { class: 'dot', style: { background: n.label } }) : null,
    h('span', { class: 'tt' }, n.title || 'Untitled'),
    n.root && rootKey === 'draft' ? h('span', { class: 'tc' }, M.countWords(S.p, id).toLocaleString()) : null,
    n.root && rootKey === 'trash' && hasKids ? h('button', { class: 'btn sm ghost', onclick: (e) => { e.stopPropagation(); emptyTrash(); } }, 'Empty') : null);
    // drag & drop reorder
    el.addEventListener('dragstart', (e) => { drag = id; e.dataTransfer.effectAllowed = 'move'; });
    el.addEventListener('dragover', (e) => {
      if (!drag || drag === id) return;
      e.preventDefault();
      const r = el.getBoundingClientRect(); const y = (e.clientY - r.top) / r.height;
      el.classList.remove('drop-in', 'drop-before', 'drop-after');
      const canNest = n.type === 'folder' || n.root;
      el.classList.add(n.root || (canNest && y > 0.3 && y < 0.7) ? 'drop-in' : y < 0.5 ? 'drop-before' : 'drop-after');
    });
    el.addEventListener('dragleave', () => el.classList.remove('drop-in', 'drop-before', 'drop-after'));
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      const mode = el.classList.contains('drop-in') ? 'in' : el.classList.contains('drop-before') ? 'before' : 'after';
      el.classList.remove('drop-in', 'drop-before', 'drop-after');
      let ok;
      if (mode === 'in') { ok = M.move(S.p, drag, id); S.open[id] = true; }
      else { const parent = M.parentOf(S.p, id); ok = M.move(S.p, drag, parent.id, parent.children.indexOf(id) + (mode === 'after' ? 1 : 0)); }
      drag = null;
      if (ok) { touch(); paintBinder(); paintStage(); } else toast("Can't move a folder inside itself");
    });
    tree.append(el);
    if (hasKids && isOpen) n.children.forEach((c) => row(c, depth + 1, rootKey));
  };
  rootsOrder.forEach((k) => row(S.p.roots[k], 0, k));
  $('binder').replaceChildren(tree);
}
function rename(el, id) {
  const n = node(id);
  const input = h('input', { value: n.title });
  const tt = el.querySelector('.tt');
  tt.replaceWith(input); input.focus(); input.select();
  const done = (commit) => { if (commit && input.value.trim()) { n.title = input.value.trim(); touch(); } paintBinder(); paintStage(); };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); e.stopPropagation(); });
  input.addEventListener('blur', () => done(true));
}
function select(id) {
  S.sel = id; store.set('sel:' + S.p.id, id);
  // folders default to the corkboard; docs to the editor
  if (node(id).type === 'folder' && S.view === 'editor') S.view = 'cork';
  else if (node(id).type === 'doc' && S.view !== 'editor' && !node(id).children.length) S.view = 'editor';
  paintViews(); paintBinder(); paintStage(); paintInspector(); paintStatus();
}
function paintViews() { document.querySelectorAll('#views button').forEach((b) => b.classList.toggle('active', b.dataset.view === S.view)); }

function paintStage() {
  paintViews();
  const n = selNode();
  const stage = $('stage');
  if (S.view === 'editor') stage.replaceChildren(editorView(n));
  else if (S.view === 'cork') stage.replaceChildren(corkView(n.type === 'doc' && !n.children.length ? M.parentOf(S.p, n.id) : n));
  else if (S.view === 'outline') stage.replaceChildren(outlineView(n.type === 'doc' && !n.children.length ? M.parentOf(S.p, n.id) : n));
  else stage.replaceChildren(flowView(n));
}

function autosize(ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
function editorView(n) {
  if (n.type === 'folder' && !n.body && n.children.length) {
    return h('div', { class: 'empty' }, h('h3', {}, n.title), 'This is a folder. Open the corkboard to arrange it, or pick a document in the binder.',
      h('div', { style: { marginTop: '14px' } }, h('button', { class: 'btn', onclick: () => { S.view = 'cork'; paintStage(); } }, 'Open corkboard')));
  }
  const title = h('input', { class: 'doc-title', value: n.title, placeholder: 'Title', oninput: () => { n.title = title.value; touch(); debounce(paintBinder, 300)(); } });
  const body = h('textarea', { class: 'doc-body', placeholder: 'Start where it hurts. Fix it later.', spellcheck: true });
  body.value = n.body;
  body.addEventListener('input', () => {
    n.body = body.value; autosize(body); touch();
    if (document.body.classList.contains('typewriter')) keepCaretCentered(body);
  });
  setTimeout(() => { autosize(body); body.focus(); }, 0);
  return h('div', { class: 'editor-wrap', id: 'editorWrap' }, h('div', { class: 'editor-col' }, title, body));
}
function keepCaretCentered(ta) {
  const wrap = $('editorWrap');
  const before = ta.value.slice(0, ta.selectionStart);
  const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 30;
  const approxLines = before.split('\n').reduce((s, l) => s + Math.max(1, Math.ceil(l.length / 70)), 0);
  wrap.scrollTop = ta.offsetTop + approxLines * lineH - wrap.clientHeight / 2;
}

function corkView(folder) {
  const grid = h('div', { class: 'cork' });
  let dragId = null;
  folder.children.forEach((id, i) => {
    const n = node(id);
    const t = h('input', { class: 'ct', value: n.title, oninput: () => { n.title = t.value; touch(); }, onchange: paintBinder });
    const syn = h('textarea', { placeholder: 'One or two lines: what happens here, and why it matters.', oninput: () => { n.synopsis = syn.value; touch(); } });
    syn.value = n.synopsis;
    const card = h('div', { class: 'index-card' + (id === S.sel ? ' sel' : ''), draggable: true, style: { borderTopColor: n.label || '' } },
      t, syn, h('div', { class: 'cf' }, h('span', {}, n.status), h('span', {}, `${M.countWords(S.p, id).toLocaleString()} words`)));
    card.addEventListener('dblclick', (e) => { if (e.target === card || e.target.classList.contains('cf')) { S.sel = id; S.view = 'editor'; paintAll(); } });
    card.addEventListener('dragstart', () => { dragId = id; card.classList.add('dragging'); });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('dragover', (e) => { e.preventDefault(); card.classList.add('drop'); });
    card.addEventListener('dragleave', () => card.classList.remove('drop'));
    card.addEventListener('drop', (e) => { e.preventDefault(); if (dragId && dragId !== id) { M.move(S.p, dragId, folder.id, i); touch(); paintBinder(); paintStage(); } });
    grid.append(card);
  });
  grid.append(h('button', { class: 'add-card', onclick: () => { const n = M.insert(S.p, folder.id, 'doc', 'New scene'); touch(); S.sel = n.id; paintBinder(); paintStage(); paintInspector(); } }, '＋ Add card'));
  return h('div', { class: 'main' }, h('div', { class: 'toolbar' }, h('strong', {}, folder.title), h('span', { class: 'faint' }, `${folder.children.length} cards · drag to reorder · double-click the footer to write`)), grid);
}

function outlineView(folder) {
  const rows = [];
  const walk = (id, depth) => node(id).children.forEach((c) => {
    const n = node(c);
    rows.push(h('tr', { ondblclick: () => { S.sel = c; S.view = 'editor'; paintAll(); } },
      h('td', { style: { paddingLeft: 10 + depth * 18 + 'px' } }, n.type === 'folder' ? '📁 ' : '📄 ', n.title),
      h('td', { class: 'muted' }, n.synopsis || '—'),
      h('td', {}, n.status),
      h('td', { class: 'num' }, M.countWords(S.p, c).toLocaleString())));
    walk(c, depth + 1);
  });
  walk(folder.id, 0);
  return h('div', { class: 'outline' }, h('table', {},
    h('thead', {}, h('tr', {}, h('th', {}, 'Title'), h('th', {}, 'Synopsis'), h('th', {}, 'Status'), h('th', { style: { textAlign: 'right' } }, 'Words'))),
    h('tbody', {}, rows.length ? rows : h('tr', {}, h('td', { colspan: 4, class: 'faint' }, 'Nothing inside this folder yet.')))));
}

function flowView(start) {
  const docs = [start, ...M.descendants(S.p, start.id)].filter((n) => n.type === 'doc');
  const col = h('div', { class: 'editor-col flow' });
  for (const n of docs) {
    const ta = h('textarea', { class: 'doc-body', style: { minHeight: '60px' } });
    ta.value = n.body;
    ta.addEventListener('input', () => { n.body = ta.value; autosize(ta); touch(); });
    setTimeout(() => autosize(ta), 0);
    col.append(h('div', { class: 'sec' }, h('h3', {}, n.title), ta));
  }
  if (!docs.length) col.append(h('div', { class: 'empty' }, 'No documents in here yet.'));
  return h('div', { class: 'editor-wrap' }, col);
}

function paintInspector() {
  const n = selNode();
  const syn = h('textarea', { class: 'textarea', rows: 4, placeholder: 'Synopsis', oninput: () => { n.synopsis = syn.value; touch(); } }); syn.value = n.synopsis || '';
  const notes = h('textarea', { class: 'textarea', rows: 7, placeholder: 'Notes only you will see', oninput: () => { n.notes = notes.value; touch(); } }); notes.value = n.notes || '';
  const status = h('select', { class: 'select', onchange: () => { n.status = status.value; touch(); if (S.view !== 'editor') paintStage(); } },
    [...M.STATUSES, 'Exclude'].map((s) => h('option', { selected: s === n.status, value: s }, s === 'Exclude' ? 'Exclude from compile' : s)));
  const label = h('select', { class: 'select', onchange: () => { n.label = label.value; touch(); paintBinder(); if (S.view === 'cork') paintStage(); } },
    M.LABELS.map(([v, l]) => h('option', { value: v, selected: v === (n.label || '') }, l)));
  const snaps = h('div', {}, (n.snapshots || []).map((s) => h('div', { class: 'snap' },
    h('span', { class: 'grow' }, new Date(s.at).toLocaleString(), s.label ? ` · ${s.label}` : '', h('span', { class: 'faint' }, ` · ${s.words}w`)),
    h('button', { class: 'btn sm', onclick: async () => {
      if (!(await invoke('dialog:confirm', 'Restore this snapshot?', 'Your current text is saved as a snapshot first.'))) return;
      M.snapshot(n, 'Before restore'); n.body = s.body; touch(); paintStage(); paintInspector();
    } }, 'Restore'))));
  $('inspector').replaceChildren(h('div', { class: 'insp' },
    h('div', { class: 'section-label', style: { margin: 0 } }, n.root ? 'Folder' : n.type === 'folder' ? 'Folder' : 'Document'),
    h('label', { class: 'field' }, 'Synopsis', syn),
    h('div', { class: 'row' }, h('label', { class: 'field grow' }, 'Status', status), h('label', { class: 'field grow' }, 'Label', label)),
    h('label', { class: 'field' }, 'Notes', notes),
    n.type === 'doc' ? h('div', { class: 'col' },
      h('div', { class: 'row' }, h('div', { class: 'section-label grow', style: { margin: 0 } }, 'Snapshots'),
        h('button', { class: 'btn sm', onclick: async () => { const l = await BAMA.ask('Take snapshot', 'Label (optional)'); if (l === null) return; M.snapshot(n, l); touch(); paintInspector(); toast('Snapshot saved'); } }, 'Take snapshot')),
      snaps.childElementCount ? snaps : h('div', { class: 'faint' }, 'Freeze a version before a big rewrite.')) : null,
    h('div', { class: 'section-label', style: { margin: '6px 0 0' } }, 'Project'),
    h('div', { class: 'row' },
      h('label', { class: 'field grow' }, 'Word target', h('input', { class: 'input', type: 'number', value: S.p.target, onchange: (e) => { S.p.target = +e.target.value || 0; touch(); } })),
      h('label', { class: 'field grow' }, 'Session target', h('input', { class: 'input', type: 'number', value: S.p.sessionTarget, onchange: (e) => { S.p.sessionTarget = +e.target.value || 0; touch(); } }))),
    h('label', { class: 'field' }, 'Deadline', h('input', { class: 'input', type: 'date', value: S.p.deadline || '', onchange: (e) => { S.p.deadline = e.target.value; touch(); } }))));
}

function paintGoal() {
  if (!S.p) return;
  const total = M.countWords(S.p, S.p.roots.draft);
  const session = Math.max(0, total - S.sessionBase);
  const pct = (a, b) => (b ? Math.min(100, (a / b) * 100) : 0);
  let perDay = '';
  if (S.p.deadline && S.p.target > total) {
    const days = Math.ceil((new Date(S.p.deadline) - new Date()) / 864e5);
    if (days > 0) perDay = `${Math.ceil((S.p.target - total) / days).toLocaleString()}/day to hit ${S.p.deadline}`;
  }
  $('goal').replaceChildren(
    h('div', { class: 'row' }, h('span', { class: 'grow' }, 'Session'), h('span', { class: 'faint' }, `${session.toLocaleString()} / ${(S.p.sessionTarget || 0).toLocaleString()}`)),
    h('div', { class: 'bar' + (session >= S.p.sessionTarget && S.p.sessionTarget ? ' ok' : '') }, h('div', { style: { width: pct(session, S.p.sessionTarget) + '%' } })),
    h('div', { class: 'row' }, h('span', { class: 'grow' }, 'Manuscript'), h('span', { class: 'faint' }, `${total.toLocaleString()} / ${(S.p.target || 0).toLocaleString()}`)),
    h('div', { class: 'bar' + (total >= S.p.target && S.p.target ? ' ok' : '') }, h('div', { style: { width: pct(total, S.p.target) + '%' } })),
    h('div', { class: 'faint' }, perDay));
}
function paintStatus() {
  const n = selNode();
  const w = M.words(n.body);
  const mins = Math.round((Date.now() - S.sessionStart) / 60000);
  $('status').replaceChildren(
    h('span', {}, `${w.toLocaleString()} words`), h('span', {}, `${n.body.length.toLocaleString()} characters`),
    h('span', {}, `~${Math.max(1, Math.round(w / 250))} min read`), h('span', { class: 'spacer' }),
    h('span', {}, `Writing ${mins} min`), h('span', {}, 'Saved automatically'));
}

// ---------- actions ----------
function addNode(type) {
  const cur = selNode();
  let parentId, index;
  if (cur.type === 'folder' || cur.root) { parentId = cur.id; index = undefined; }
  else { const par = M.parentOf(S.p, cur.id); parentId = par.id; index = par.children.indexOf(cur.id) + 1; }
  if (parentId === S.p.roots.trash) parentId = S.p.roots.draft;
  const n = M.insert(S.p, parentId, type, type === 'folder' ? 'New folder' : 'Untitled');
  S.open[parentId] = true; touch();
  select(n.id);
  const el = document.querySelector(`.tnode[data-id="${n.id}"]`);
  if (el) rename(el, n.id);
}
async function delNode() {
  const n = selNode();
  if (n.root) return toast('Top-level folders stay put');
  const parent = M.parentOf(S.p, n.id);
  if (parent.id === S.p.roots.trash) return;
  M.trash(S.p, n.id); touch();
  S.sel = parent.children[0] || parent.id;
  paintAll(); toast('Moved to Trash');
}
async function emptyTrash() {
  if (!(await invoke('dialog:confirm', 'Empty the Trash?', 'Documents in the Trash are deleted for good.'))) return;
  M.emptyTrash(S.p); if (!S.p.nodes[S.sel]) S.sel = S.p.roots.draft; touch(); paintAll();
}
async function compile() {
  const r = await form('Compile manuscript', [
    { name: 'format', label: 'Format', type: 'select', value: 'md', options: [['md', 'Markdown (.md)'], ['html', 'Web page / print to PDF (.html)'], ['txt', 'Plain text (.txt)']] },
    { name: 'separator', label: 'Scene break', value: '* * *' },
    { name: 'synopses', label: 'Include synopses', type: 'checkbox', value: false },
  ], { ok: 'Compile', note: 'Builds one file from everything under the draft folder. Items marked "Exclude from compile" are skipped.' });
  if (!r) return;
  const text = M.compile(S.p, r.format, { separator: r.separator, synopses: r.synopses });
  const name = `${S.p.title.replace(/[^\w\- ]+/g, '').trim() || 'manuscript'}.${r.format}`;
  if (BAMA.native) {
    const file = await invoke('dialog:save', { defaultPath: name });
    if (!file) return;
    await invoke('fs:writeText', file, text);
    toast('Compiled'); invoke('shell:showItem', file);
  } else {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })), download: name });
    a.click(); toast('Compiled');
  }
}
function toggleFocus() { document.body.classList.toggle('focus'); if (S.view !== 'editor') { S.view = 'editor'; paintStage(); } }

// ---------- wiring ----------
$('views').addEventListener('click', (e) => { const v = e.target.dataset.view; if (v) { S.view = v; paintStage(); } });
$('addDoc').onclick = () => addNode('doc');
$('addFolder').onclick = () => addNode('folder');
$('delNode').onclick = delNode;
$('newProject').onclick = () => newProject();
$('compileBtn').onclick = compile;
$('focusBtn').onclick = toggleFocus;
$('projectPick').onchange = async (e) => {
  if (e.target.value === '__rename') {
    const t = await BAMA.ask('Rename project', 'Title', S.p.title);
    if (t) { S.p.title = t; touch(); setTimeout(paintProjects, 450); } else paintProjects();
    return;
  }
  openProject(e.target.value);
};
document.addEventListener('keydown', (e) => {
  if (!e.metaKey && !e.ctrlKey) { if (e.key === 'Escape' && document.body.classList.contains('focus')) toggleFocus(); return; }
  const k = e.key.toLowerCase();
  if (['1', '2', '3', '4'].includes(k)) { e.preventDefault(); S.view = ['editor', 'cork', 'outline', 'flow'][+k - 1]; paintStage(); }
  else if (k === 'n' && !e.shiftKey) { e.preventDefault(); addNode('doc'); }
  else if (k === 'f' && e.shiftKey) { e.preventDefault(); toggleFocus(); }
  else if (k === 't' && e.shiftKey) { e.preventDefault(); document.body.classList.toggle('typewriter'); toast('Typewriter scrolling ' + (document.body.classList.contains('typewriter') ? 'on' : 'off')); }
  else if (k === 's') { e.preventDefault(); M.snapshot(selNode(), 'Quick save'); touch(); paintInspector(); toast('Snapshot saved'); }
});
setInterval(paintStatus, 30000);
boot();
