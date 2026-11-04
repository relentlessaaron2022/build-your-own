// Forge page: Monaco editor, file tree, search, run panel, and Claude.
const { h, toast, form, store, invoke, on, debounce, uid, basename, esc } = BAMA;
const $ = (id) => document.getElementById(id);

// ---------- preview-mode sample project ----------
const DEMO = {
  '/demo/README.md': '# Demo project\n\nOpen the Mac app to edit real folders.\n',
  '/demo/src/app.js': "import { greet } from './greet.js';\n\nconst names = ['Ava', 'Marcus', 'Jun'];\nfor (const n of names) {\n  console.log(greet(n));\n}\n",
  '/demo/src/greet.js': "export function greet(name) {\n  return 'Hello, ' + name + '!';\n}\n",
  '/demo/index.html': '<!doctype html>\n<title>Demo</title>\n<script type="module" src="src/app.js"></script>\n',
};
Object.assign(window.BAMA_MOCKS, {
  'dialog:open': () => '/demo',
  'forge:list': (dir) => {
    const kids = new Map();
    for (const p of Object.keys(DEMO)) if (p.startsWith(dir + '/')) { const rest = p.slice(dir.length + 1).split('/'); kids.set(rest[0], rest.length > 1); }
    return [...kids].map(([name, isDir]) => ({ name, path: `${dir}/${name}`, dir: isDir })).sort((a, b) => (b.dir - a.dir) || a.name.localeCompare(b.name));
  },
  'forge:read': (p) => DEMO[p] ?? '',
  'forge:write': (p, t) => { DEMO[p] = t; return true; },
  'forge:files': (root) => Object.keys(DEMO).map((p) => p.slice(root.length + 1)),
  'forge:search': (root, q) => Object.entries(DEMO).flatMap(([p, t]) => t.split('\n').map((l, i) => ({ file: p.slice(root.length + 1), line: i + 1, text: l.trim() })).filter((x) => x.text.toLowerCase().includes(q.toLowerCase()))),
  'forge:hasKey': () => false,
  'forge:run': (id) => { setTimeout(() => { appendOut('Commands run in the Mac app (npm start forge).\n'); }, 50); return true; },
});

const S = { root: null, open: [], active: null, models: {}, expanded: new Set(), chat: [], busy: null, runId: null, files: null, diff: null };
const LANG = { js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', json: 'json', html: 'html', htm: 'html', css: 'css', scss: 'scss', less: 'less', md: 'markdown', py: 'python', rb: 'ruby', go: 'go', rs: 'rust', swift: 'swift', java: 'java', kt: 'kotlin', c: 'c', h: 'c', cpp: 'cpp', cs: 'csharp', php: 'php', sh: 'shell', zsh: 'shell', yml: 'yaml', yaml: 'yaml', xml: 'xml', sql: 'sql', toml: 'ini', ini: 'ini', lua: 'lua', r: 'r', dart: 'dart', vue: 'html', svelte: 'html' };
const langOf = (p) => LANG[(p.split('.').pop() || '').toLowerCase()] || 'plaintext';
const rel = (p) => (S.root && p.startsWith(S.root) ? p.slice(S.root.length + 1) : p);

// ---------- Monaco ----------
let monaco, editor, diffEditor;
require.config({ paths: { vs: new URL('../../node_modules/monaco-editor/min/vs', location.href).href.replace(/\/$/, '') } });
require(['vs/editor/editor.main'], () => {
  monaco = window.monaco;
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  monaco.editor.defineTheme('forge-dark', { base: 'vs-dark', inherit: true, rules: [], colors: { 'editor.background': '#1f1f23', 'editorCursor.foreground': '#f97316', 'editor.lineHighlightBackground': '#26262b' } });
  monaco.editor.defineTheme('forge-light', { base: 'vs', inherit: true, rules: [], colors: { 'editor.background': '#ffffff', 'editorCursor.foreground': '#c2410c' } });
  editor = monaco.editor.create($('editor'), {
    theme: dark ? 'forge-dark' : 'forge-light', automaticLayout: true, fontSize: 13, minimap: { enabled: true, scale: 1 },
    fontFamily: 'SF Mono, Menlo, ui-monospace, monospace', smoothScrolling: true, cursorSmoothCaretAnimation: 'on', padding: { top: 10 },
    scrollBeyondLastLine: false, renderWhitespace: 'selection', bracketPairColorization: { enabled: true }, tabSize: 2,
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => monaco.editor.setTheme(e.matches ? 'forge-dark' : 'forge-light'));
  editor.onDidChangeCursorSelection(() => { paintChips(); paintStatus(); });
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, saveActive);
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, openKbar);
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () => focusAi(true));
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, quickOpen);
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, toggleRun);
  boot();
});

async function boot() {
  const last = await store.get('root', null);
  if (last) await openRoot(last);
  else if (!BAMA.native) await openRoot('/demo');
  S.chat = []; paintChat(); paintStatus();
  if (!(await invoke('forge:hasKey'))) addMsg('assistant', BAMA.native
    ? 'Add your Anthropic API key with the ⚙︎ button to start. It is stored encrypted in your macOS keychain.'
    : 'This is the browser preview. Launch the Mac app (`npm start forge`) and add your Anthropic API key to talk to Claude.');
}

// ---------- folder & tree ----------
async function openRoot(dir) {
  S.root = dir; S.files = null; S.expanded = new Set([dir]);
  store.set('root', dir);
  $('folderName').textContent = basename(dir);
  $('welcome').classList.add('hidden');
  await paintTree();
  const tabs = await store.get('tabs:' + dir, []);
  for (const p of tabs) await openFile(p, true).catch(() => {});
  const act = await store.get('active:' + dir, null);
  if (act && S.models[act]) activate(act);
}
async function pickFolder() {
  const d = await invoke('dialog:open', { directory: true, title: 'Open folder' });
  if (d) { closeAll(); openRoot(d); }
}
async function paintTree() {
  if (!S.root) return;
  const box = h('div', { style: { padding: '6px 0' } });
  const walk = async (dir, depth) => {
    let items = [];
    try { items = await invoke('forge:list', dir); } catch (e) { return; }
    for (const it of items) {
      const open = S.expanded.has(it.path);
      const row = h('div', {
        class: 'tree-row' + (it.path === S.active ? ' active' : ''), style: { paddingLeft: 8 + depth * 12 + 'px' }, title: rel(it.path),
        onclick: async () => {
          if (it.dir) { open ? S.expanded.delete(it.path) : S.expanded.add(it.path); paintTree(); }
          else openFile(it.path);
        },
        oncontextmenu: (e) => { e.preventDefault(); treeMenu(it); },
      }, h('span', { class: 'tw' }, it.dir ? (open ? '▾' : '▸') : ''), h('span', {}, it.dir ? '📁' : fileIcon(it.name)), h('span', { class: 'nm' }, it.name));
      box.append(row);
      if (it.dir && open) await walk(it.path, depth + 1);
    }
  };
  await walk(S.root, 0);
  box.append(h('div', { class: 'row', style: { padding: '10px' } },
    h('button', { class: 'btn sm', onclick: () => newPath(false) }, '＋ File'), h('button', { class: 'btn sm', onclick: () => newPath(true) }, '＋ Folder')));
  $('sideFiles').replaceChildren(box);
}
function fileIcon(n) {
  const e = n.split('.').pop();
  return { js: '🟨', ts: '🟦', tsx: '🟦', jsx: '🟨', json: '🧾', md: '📝', html: '🌐', css: '🎨', py: '🐍', swift: '🕊', png: '🖼', jpg: '🖼', svg: '🖼' }[e] || '📄';
}
async function newPath(isDir, base = S.root) {
  const name = await BAMA.ask(isDir ? 'New folder' : 'New file', 'Path inside the project', '');
  if (!name) return;
  const p = `${base}/${name.replace(/^\/+/, '')}`;
  try { await invoke('forge:create', p, isDir); S.files = null; await paintTree(); if (!isDir) openFile(p); } catch (e) { toast(cleanErr(e), 'bad'); }
}
async function treeMenu(it) {
  const r = await form(it.name, [{ name: 'action', label: 'Action', type: 'select', value: 'rename', options: [['rename', 'Rename…'], ['reveal', 'Reveal in Finder'], ['ask', 'Ask Claude about this file'], ['trash', 'Move to Trash']] }], { ok: 'Go' });
  if (!r) return;
  if (r.action === 'reveal') invoke('shell:showItem', it.path);
  else if (r.action === 'ask') { if (!it.dir) { await openFile(it.path); focusAi(true); $('aiInput').value = 'Explain what this file does and point out anything risky.'; } }
  else if (r.action === 'rename') {
    const n = await BAMA.ask('Rename', 'New name', it.name);
    if (n && n !== it.name) { const to = it.path.slice(0, -it.name.length) + n; await invoke('forge:rename', it.path, to); closeTab(it.path, true); S.files = null; paintTree(); }
  } else if (r.action === 'trash' && await invoke('dialog:confirm', `Move ${it.name} to the Trash?`)) { await invoke('forge:trash', it.path); closeTab(it.path, true); S.files = null; paintTree(); }
}

// ---------- tabs & files ----------
async function openFile(p, quiet = false) {
  if (!S.models[p]) {
    let text;
    try { text = await invoke('forge:read', p); } catch (e) { if (!quiet) toast(cleanErr(e), 'bad'); throw e; }
    const model = monaco.editor.createModel(text, langOf(p), monaco.Uri.file(p));
    S.models[p] = { model, saved: model.getAlternativeVersionId(), view: null };
    model.onDidChangeContent(() => paintTabs());
    S.open.push(p);
    persistTabs();
  }
  activate(p);
}
function activate(p) {
  if (S.active && S.models[S.active]) S.models[S.active].view = editor.saveViewState();
  S.active = p;
  const m = S.models[p];
  editor.setModel(m.model);
  if (m.view) editor.restoreViewState(m.view);
  editor.focus();
  store.set('active:' + S.root, p);
  paintTabs(); paintChips(); paintStatus();
  document.querySelectorAll('.tree-row').forEach((r) => r.classList.toggle('active', r.title === rel(p)));
}
const isDirty = (p) => S.models[p] && S.models[p].model.getAlternativeVersionId() !== S.models[p].saved;
function paintTabs() {
  $('filetabs').replaceChildren(...S.open.map((p) => h('div', {
    class: 'filetab' + (p === S.active ? ' active' : '') + (isDirty(p) ? ' dirty' : ''), title: rel(p),
    onclick: () => activate(p), onauxclick: (e) => { if (e.button === 1) closeTab(p); },
  }, fileIcon(p), basename(p), h('span', { class: 'x', onclick: (e) => { e.stopPropagation(); closeTab(p); } }, '×'))));
}
async function closeTab(p, force = false) {
  if (!S.models[p]) return;
  if (!force && isDirty(p) && !(await invoke('dialog:confirm', `Close ${basename(p)} without saving?`))) return;
  S.models[p].model.dispose(); delete S.models[p];
  const i = S.open.indexOf(p); S.open.splice(i, 1);
  persistTabs();
  if (S.active === p) { S.active = null; const next = S.open[i] || S.open[i - 1]; if (next) activate(next); else { editor.setModel(null); paintTabs(); paintStatus(); } }
  else paintTabs();
}
function closeAll() { [...S.open].forEach((p) => closeTab(p, true)); }
const persistTabs = () => S.root && store.set('tabs:' + S.root, S.open);
async function saveActive() {
  const p = S.active; if (!p) return;
  const m = S.models[p];
  try { await invoke('forge:write', p, m.model.getValue()); m.saved = m.model.getAlternativeVersionId(); paintTabs(); toast(`Saved ${basename(p)}`); }
  catch (e) { toast(cleanErr(e), 'bad'); }
}

// ---------- quick open ----------
async function quickOpen() {
  if (!S.root) return;
  if (!S.files) S.files = await invoke('forge:files', S.root);
  let selIdx = 0, list = [];
  const input = h('input', { class: 'input', placeholder: 'Type a file name…' });
  const box = h('div', { class: 'qo-list' });
  const back = h('div', { class: 'modal-back' }, h('div', { class: 'modal' }, input, box));
  const score = (q, s) => { s = s.toLowerCase(); let i = 0; for (const ch of q) { i = s.indexOf(ch, i); if (i < 0) return -1; i++; } return 1000 - s.length + (s.includes(q) ? 500 : 0) + (basename(s).startsWith(q) ? 800 : 0); };
  const paint = () => {
    const q = input.value.toLowerCase().replace(/\s/g, '');
    list = S.files.map((f) => [f, q ? score(q, f) : 0]).filter(([, s]) => s >= 0).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([f]) => f);
    selIdx = Math.min(selIdx, Math.max(0, list.length - 1));
    box.replaceChildren(...list.map((f, i) => h('div', { class: i === selIdx ? 'sel' : '', onclick: () => go(f) }, h('strong', {}, basename(f)), '  ', h('span', { class: 'faint' }, f))));
  };
  const go = (f) => { back.remove(); if (f) openFile(`${S.root}/${f}`); };
  input.addEventListener('input', () => { selIdx = 0; paint(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { selIdx++; paint(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { selIdx = Math.max(0, selIdx - 1); paint(); e.preventDefault(); }
    else if (e.key === 'Enter') go(list[selIdx]);
    else if (e.key === 'Escape') go(null);
  });
  back.addEventListener('mousedown', (e) => { if (e.target === back) go(null); });
  document.body.append(back); paint(); input.focus();
}

// ---------- search ----------
const runSearch = debounce(async () => {
  const q = $('searchQ').value;
  if (!q || !S.root) { $('searchResults').replaceChildren(); return; }
  let hits;
  try { hits = await invoke('forge:search', S.root, q, { regex: $('searchRe').checked, caseSensitive: $('searchCase').checked }); }
  catch (e) { $('searchResults').replaceChildren(h('div', { class: 'hit faint' }, cleanErr(e))); return; }
  $('searchResults').replaceChildren(h('div', { class: 'hit faint' }, `${hits.length}${hits.length >= 500 ? '+' : ''} matches`),
    ...hits.map((x) => h('div', { class: 'hit', onclick: async () => { await openFile(`${S.root}/${x.file}`); editor.revealLineInCenter(x.line); editor.setPosition({ lineNumber: x.line, column: 1 }); } },
      h('div', { class: 'f' }, `${x.file}:${x.line}`), h('code', {}, x.text))));
}, 250);

// ---------- run panel ----------
function toggleRun() { $('runpanel').classList.toggle('hidden'); if (!$('runpanel').classList.contains('hidden')) $('runCmd').focus(); }
function appendOut(t) { const o = $('runOut'); o.textContent += t; if (o.textContent.length > 200000) o.textContent = o.textContent.slice(-150000); o.scrollTop = o.scrollHeight; }
async function runCmd() {
  const cmd = $('runCmd').value.trim();
  if (!cmd || !S.root) return;
  if (S.runId) await invoke('forge:kill', S.runId);
  S.runId = uid();
  appendOut(`\n$ ${cmd}\n`);
  store.set('lastCmd:' + S.root, cmd);
  await invoke('forge:run', S.runId, cmd, S.root);
}
on('forge:out', (id, t) => { if (id === S.runId) appendOut(t); });
on('forge:exit', (id, code) => { if (id === S.runId) { appendOut(`\n[exited with code ${code}]\n`); S.runId = null; } });

// ---------- Claude ----------
const SYSTEM_CHAT = `You are Claude, working inside Forge, a code editor on the user's Mac. You can see the files the user shares with you but you cannot run commands or edit files yourself. When you suggest a change, show the complete updated code for the part that changes in a fenced code block tagged with the language, and say which file it belongs in. Be direct and concrete. If something is ambiguous, say what you are assuming.`;
const SYSTEM_EDIT = `You are rewriting a selection of code inside an editor. Reply with exactly one fenced code block containing only the replacement for the selected code, and nothing before or after it. Keep the surrounding indentation and style. Do not repeat code outside the selection.`;

function selectionText() {
  const m = editor && editor.getModel(); if (!m) return '';
  const s = editor.getSelection(); return s && !s.isEmpty() ? m.getValueInRange(s) : '';
}
function paintChips() {
  const chips = [];
  if (S.active && $('ctxFile').checked) chips.push(h('span', { class: 'pill' }, '📄 ', basename(S.active)));
  const sel = selectionText();
  if (sel) chips.push(h('span', { class: 'pill accent' }, `✂︎ ${sel.split('\n').length} selected lines`));
  if ($('ctxOpen').checked && S.open.length > 1) chips.push(h('span', { class: 'pill' }, `+${S.open.length - 1} open tabs`));
  $('chips').replaceChildren(...chips);
}
function contextBlock() {
  const parts = [];
  const files = new Set();
  if ($('ctxFile').checked && S.active) files.add(S.active);
  if ($('ctxOpen').checked) S.open.forEach((p) => files.add(p));
  for (const p of files) parts.push(`<file path="${rel(p)}">\n${S.models[p].model.getValue()}\n</file>`);
  const sel = selectionText();
  if (sel) { const s = editor.getSelection(); parts.push(`<selection file="${rel(S.active)}" lines="${s.startLineNumber}-${s.endLineNumber}">\n${sel}\n</selection>`); }
  if (S.files) parts.push(`<project_files>\n${S.files.slice(0, 400).join('\n')}\n</project_files>`);
  return parts.join('\n\n');
}
function focusAi(open) { if (open) $('aipanel').classList.remove('closed'); $('aiInput').focus(); paintChips(); }

async function ask(text, { extraContext = '' } = {}) {
  if (S.busy) return;
  if (!S.files && S.root) S.files = await invoke('forge:files', S.root);
  const ctx = [contextBlock(), extraContext].filter(Boolean).join('\n\n');
  S.chat.push({ role: 'user', content: ctx ? `${ctx}\n\n${text}` : text, display: text });
  const reply = { role: 'assistant', content: '', streaming: true };
  S.chat.push(reply);
  paintChat();
  const id = uid(); S.busy = id;
  $('aiSend').textContent = 'Stop';
  const off = on('forge:ai:delta', (rid, t) => { if (rid === id) { reply.content += t; paintChatDebounced(); } });
  try {
    const r = await invoke('forge:ai', id, { system: SYSTEM_CHAT, effort: $('effort').value, messages: S.chat.filter((m) => !m.error && !m.local).slice(0, -1).map(({ role, content }) => ({ role, content })) });
    if (!BAMA.native) reply.content = 'Claude answers in the Mac app. Run `npm start forge`, then add your API key with ⚙︎.';
    else if (r && r.stop_reason === 'refusal') reply.content += '\n\n_Claude declined this request._';
    else if (r && r.stop_reason === 'max_tokens') reply.content += '\n\n_Reply was cut off at the length limit._';
  } catch (e) { reply.content = cleanErr(e); reply.error = true; }
  off(); S.busy = null; reply.streaming = false; $('aiSend').textContent = 'Send';
  paintChat();
}
function addMsg(role, content) { S.chat.push({ role, content, local: true }); paintChat(); }
const paintChatDebounced = debounce(() => paintChat(), 40);
function paintChat() {
  const box = $('chat');
  box.replaceChildren(...S.chat.map((m) => {
    if (m.role === 'user') return h('div', { class: 'msg user' }, m.display || m.content);
    const el = h('div', { class: 'msg assistant' + (m.error ? ' err' : '') });
    if (m.streaming && !m.content) el.append(h('div', { class: 'thinking' }, 'Thinking…'));
    else renderMarkdown(el, m.content);
    return el;
  }));
  box.scrollTop = box.scrollHeight;
}
function renderMarkdown(el, md) {
  const chunks = md.split(/```/);
  chunks.forEach((chunk, i) => {
    if (i % 2 === 1) {
      const nl = chunk.indexOf('\n');
      const lang = nl >= 0 ? chunk.slice(0, nl).trim() : '';
      const code = (nl >= 0 ? chunk.slice(nl + 1) : chunk).replace(/\n$/, '');
      el.append(h('div', { class: 'codeblock' },
        h('div', { class: 'cbh' }, h('span', { class: 'grow' }, lang || 'code'),
          h('button', { class: 'btn sm ghost', onclick: () => { invoke('clipboard:write', code); toast('Copied'); } }, 'Copy'),
          h('button', { class: 'btn sm ghost', onclick: () => insertCode(code) }, 'Insert'),
          h('button', { class: 'btn sm ghost', onclick: () => proposeWholeFile(code) }, 'Replace file…')),
        h('pre', {}, code)));
      return;
    }
    for (const para of chunk.split(/\n{2,}/)) {
      if (!para.trim()) continue;
      const lines = para.split('\n');
      if (lines.every((l) => /^\s*([-*]|\d+\.)\s/.test(l))) {
        const ordered = /^\s*\d+\./.test(lines[0]);
        el.append(h(ordered ? 'ol' : 'ul', {}, lines.map((l) => h('li', { html: inline(l.replace(/^\s*([-*]|\d+\.)\s/, '')) }))));
      } else el.append(h('p', { html: inline(para).replace(/\n/g, '<br>') }));
    }
  });
}
const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1<em>$2</em>');
function insertCode(code) {
  if (!S.active) return toast('Open a file first');
  editor.executeEdits('claude', [{ range: editor.getSelection(), text: code, forceMoveMarkers: true }]);
  editor.focus();
}
function proposeWholeFile(code) {
  if (!S.active) return toast('Open a file first');
  showDiff(S.models[S.active].model.getFullModelRange(), code, 'Replace the whole file');
}

// ---------- ⌘K inline edit ----------
function openKbar() {
  if (!S.active) return;
  const s = editor.getSelection();
  if (s.isEmpty()) { const line = s.startLineNumber; editor.setSelection(new monaco.Selection(line, 1, line, editor.getModel().getLineMaxColumn(line))); }
  $('kbar').classList.remove('hidden'); $('kInput').value = ''; $('kInput').focus();
}
function closeKbar() { $('kbar').classList.add('hidden'); editor && editor.focus(); }
async function runKedit() {
  const instruction = $('kInput').value.trim();
  if (!instruction) return;
  const range = editor.getSelection();
  const model = editor.getModel();
  const selected = model.getValueInRange(range);
  const full = model.getValue();
  $('kGo').textContent = 'Working…'; $('kGo').disabled = true;
  const id = uid(); let out = '';
  const off = on('forge:ai:delta', (rid, t) => { if (rid === id) out += t; });
  try {
    if (!BAMA.native) throw new Error('Inline edits need the Mac app and your API key');
    const r = await invoke('forge:ai', id, { system: SYSTEM_EDIT, effort: 'medium', messages: [{ role: 'user', content:
      `<file path="${rel(S.active)}" language="${langOf(S.active)}">\n${full}\n</file>\n\n<selection lines="${range.startLineNumber}-${range.endLineNumber}">\n${selected}\n</selection>\n\nChange the selection: ${instruction}` }] });
    if (r && r.stop_reason === 'refusal') throw new Error('Claude declined this edit');
    const m = out.match(/```[^\n]*\n([\s\S]*?)```/);
    const code = (m ? m[1] : out).replace(/\n$/, selected.endsWith('\n') ? '\n' : '');
    closeKbar();
    showDiff(range, code, instruction);
  } catch (e) { toast(cleanErr(e), 'bad'); }
  off(); $('kGo').textContent = 'Generate'; $('kGo').disabled = false;
}
function showDiff(range, replacement, note) {
  const model = S.models[S.active].model;
  const original = model.getValue();
  const proposed = monaco.editor.createModel(original, model.getLanguageId());
  proposed.applyEdits([{ range, text: replacement }]);
  S.diff = { range, replacement, proposed, path: S.active };
  $('diffEditor').classList.remove('hidden'); $('diffbar').classList.remove('hidden'); $('diffNote').textContent = note;
  if (!diffEditor) diffEditor = monaco.editor.createDiffEditor($('diffEditor'), { automaticLayout: true, renderSideBySide: false, readOnly: true, theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'forge-dark' : 'forge-light' });
  diffEditor.setModel({ original: monaco.editor.createModel(original, model.getLanguageId()), modified: proposed });
}
function endDiff(accept) {
  if (!S.diff) return;
  if (accept && S.models[S.diff.path]) {
    const m = S.models[S.diff.path].model;
    m.pushEditOperations([], [{ range: m.getFullModelRange(), text: S.diff.proposed.getValue() }], () => null);
    toast('Change applied. ⌘Z undoes it, ⌘S saves.');
  }
  const models = diffEditor.getModel(); diffEditor.setModel(null); models.original.dispose(); models.modified.dispose();
  S.diff = null; $('diffEditor').classList.add('hidden'); $('diffbar').classList.add('hidden'); editor.focus();
}

// ---------- settings ----------
async function settings() {
  const has = await invoke('forge:hasKey');
  const r = await form('Forge settings', [
    { name: 'key', label: has ? 'Anthropic API key (saved; paste a new one to replace)' : 'Anthropic API key', type: 'password', placeholder: 'sk-ant-…' },
    { name: 'font', label: 'Editor font size', type: 'number', value: editor.getOption(monaco.editor.EditorOption.fontSize) },
    { name: 'minimap', label: 'Show minimap', type: 'checkbox', value: editor.getOption(monaco.editor.EditorOption.minimap).enabled },
    { name: 'wrap', label: 'Wrap long lines', type: 'checkbox', value: editor.getOption(monaco.editor.EditorOption.wordWrap) !== 'off' },
  ], { ok: 'Save', note: 'Get a key at console.anthropic.com. It is encrypted with your macOS keychain and only sent to Anthropic.' });
  if (!r) return;
  if (r.key) { try { await invoke('forge:setKey', r.key); toast('API key saved'); } catch (e) { toast(cleanErr(e), 'bad'); } }
  const opts = { fontSize: +r.font || 13, minimap: { enabled: r.minimap }, wordWrap: r.wrap ? 'on' : 'off' };
  editor.updateOptions(opts); store.set('editorOpts', opts);
}
store.get('editorOpts', null).then((o) => { if (o) { const t = setInterval(() => { if (editor) { editor.updateOptions(o); clearInterval(t); } }, 100); } });

function paintStatus() {
  const parts = [h('span', {}, S.root ? basename(S.root) : 'No folder')];
  if (editor && S.active) {
    const p = editor.getPosition();
    parts.push(h('span', {}, rel(S.active)), h('span', { class: 'spacer' }), h('span', {}, `Ln ${p.lineNumber}, Col ${p.column}`), h('span', {}, langOf(S.active)));
  }
  $('status').replaceChildren(...parts);
}
const cleanErr = (e) => String((e && e.message) || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, '');

// ---------- wiring ----------
$('openFolder').onclick = pickFolder; $('welcomeOpen').onclick = pickFolder;
$('quickOpen').onclick = quickOpen; $('toggleRun').onclick = toggleRun;
$('toggleAi').onclick = () => $('aipanel').classList.toggle('closed');
$('settingsBtn').onclick = settings;
$('aiNew').onclick = () => { S.chat = []; paintChat(); };
$('aiSend').onclick = () => { if (S.busy) { invoke('forge:ai:abort', S.busy); return; } const t = $('aiInput').value.trim(); if (t) { $('aiInput').value = ''; ask(t); } };
$('aiInput').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('aiSend').click(); } });
$('ctxFile').onchange = paintChips; $('ctxOpen').onchange = paintChips;
$('kGo').onclick = runKedit; $('kClose').onclick = closeKbar;
$('kInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') runKedit(); if (e.key === 'Escape') closeKbar(); });
$('diffAccept').onclick = () => endDiff(true); $('diffReject').onclick = () => endDiff(false);
$('runGo').onclick = runCmd; $('runStop').onclick = () => S.runId && invoke('forge:kill', S.runId);
$('runClear').onclick = () => { $('runOut').textContent = ''; };
$('runCmd').addEventListener('keydown', (e) => { if (e.key === 'Enter') runCmd(); });
$('runExplain').onclick = () => { const out = $('runOut').textContent.slice(-12000); if (!out.trim()) return; focusAi(true); ask('Explain this output. If it is an error, tell me the likely cause and the fix.', { extraContext: `<terminal_output>\n${out}\n</terminal_output>` }); };
document.querySelectorAll('.sidebar .tabs button').forEach((b) => b.onclick = () => {
  document.querySelectorAll('.sidebar .tabs button').forEach((x) => x.classList.toggle('active', x === b));
  $('sideFiles').classList.toggle('hidden', b.dataset.side !== 'files'); $('sideSearch').classList.toggle('hidden', b.dataset.side !== 'search');
  if (b.dataset.side === 'search') $('searchQ').focus();
});
$('searchQ').addEventListener('input', runSearch); $('searchRe').onchange = runSearch; $('searchCase').onchange = runSearch;
document.addEventListener('keydown', (e) => {
  if (S.diff && e.metaKey && e.key === 'Enter') { e.preventDefault(); endDiff(true); }
  else if (S.diff && e.key === 'Escape') endDiff(false);
  else if (e.metaKey && e.key.toLowerCase() === 'p' && !e.target.closest('.monaco-editor')) { e.preventDefault(); quickOpen(); }
  else if (e.metaKey && e.key.toLowerCase() === 'l' && !e.target.closest('.monaco-editor')) { e.preventDefault(); focusAi(true); }
  else if (e.metaKey && e.key.toLowerCase() === 'j' && !e.target.closest('.monaco-editor')) { e.preventDefault(); toggleRun(); }
  else if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); document.querySelector('[data-side=search]').click(); }
});
window.addEventListener('beforeunload', (e) => { if (S.open.some(isDirty)) { e.preventDefault(); e.returnValue = ''; } });
store.get('lastCmd', '').then((c) => { if (c) $('runCmd').value = c; });
