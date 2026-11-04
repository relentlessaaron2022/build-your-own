// Summon page: one input, ranked results, keyboard-first.
const { h, toast, form, store, invoke, on, debounce } = BAMA;
const { score, calc, expand } = SummonLib;

// Preview-mode stand-ins so the palette works in a browser.
Object.assign(window.BAMA_MOCKS, {
  'summon:apps': () => ['Safari', 'Finder', 'Notes', 'Music', 'Terminal', 'System Settings', 'Calendar', 'Preview', 'Photos', 'Mail']
    .map((n) => ({ name: n, path: `/Applications/${n}.app` })),
  'summon:files': (q) => (q.length > 2 ? [{ name: `${q}-draft.md`, path: `/Users/you/Documents/${q}-draft.md` }] : []),
  'summon:clips': () => [{ text: 'Relentless energy, every single page.', at: Date.now(), pinned: true }],
  'summon:icon': () => null,
});

const BUILTIN = [
  { id: 'lock', name: 'Lock Screen', icon: '🔒', sub: 'Sleep the display' },
  { id: 'sleep', name: 'Sleep', icon: '🌙', sub: 'Put the Mac to sleep' },
  { id: 'dark-mode', name: 'Toggle Dark Mode', icon: '◐', sub: 'Flip system appearance' },
  { id: 'empty-trash', name: 'Empty Trash', icon: '🗑', sub: 'Asks before it runs', confirm: true },
  { id: 'screensaver', name: 'Start Screen Saver', icon: '✦', sub: 'System' },
  { id: 'mute', name: 'Toggle Mute', icon: '🔇', sub: 'Output volume' },
  { id: 'restart-finder', name: 'Restart Finder', icon: '↻', sub: 'Fixes a stuck Finder' },
  { id: 'restart-dock', name: 'Restart Dock', icon: '↻', sub: 'Fixes a stuck Dock' },
];
const DEFAULT_LINKS = [
  { key: 'g', name: 'Google', url: 'https://www.google.com/search?q={query}' },
  { key: 'yt', name: 'YouTube', url: 'https://www.youtube.com/results?search_query={query}' },
  { key: 'gh', name: 'GitHub', url: 'https://github.com/search?q={query}' },
  { key: 'amz', name: 'Amazon', url: 'https://www.amazon.com/s?k={query}' },
  { key: 'map', name: 'Maps', url: 'https://maps.apple.com/?q={query}' },
];

const state = { mode: 'all', q: '', items: [], sel: 0, apps: [], clips: [], snippets: [], links: [], files: [], icons: {} };
const $q = document.getElementById('q');
const $results = document.getElementById('results');
const $hint = document.getElementById('footHint');

async function boot() {
  state.apps = await invoke('summon:apps') || [];
  state.clips = await invoke('summon:clips') || [];
  state.snippets = await store.get('snippets', [
    { key: 'sig', name: 'Email sign-off', text: 'Stay relentless,\n— R' },
    { key: 'today', name: "Today's date", text: '{date}' },
  ]);
  state.links = await store.get('links', DEFAULT_LINKS);
  on('summon:clips', (c) => { state.clips = c; if (state.mode === 'clip') render(); });
  on('summon:shown', () => { $q.select(); $q.focus(); refresh(); });
  render();
}

// ---- building results ----
function build() {
  const q = state.q.trim();
  const groups = [];
  const top = (arr, key, n) => arr.map((x) => ({ x, s: score(q, key(x)) })).filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s).slice(0, n).map((r) => r.x);

  if (state.mode === 'clip') {
    const list = q ? state.clips.filter((c) => c.text.toLowerCase().includes(q.toLowerCase())) : state.clips;
    groups.push(['Clipboard history', list.slice(0, 80).map(clipItem)]);
    return groups;
  }
  if (state.mode === 'snip') {
    groups.push(['Snippets', top(state.snippets, (s) => `${s.key} ${s.name}`, 100).map(snipItem)]);
    return groups;
  }
  if (state.mode === 'links') {
    groups.push(['Quicklinks', top(state.links, (l) => `${l.key} ${l.name}`, 100).map((l) => linkItem(l, ''))]);
    return groups;
  }

  if (!q) {
    groups.push(['Suggestions', state.apps.slice(0, 6).map(appItem)]);
    groups.push(['Commands', BUILTIN.slice(0, 4).map(cmdItem)]);
    if (state.clips[0]) groups.push(['Last copied', [clipItem(state.clips[0])]]);
    return groups;
  }
  const math = calc(q);
  if (math != null) groups.push(['Calculator', [{
    kind: 'Copy', icon: '=', title: h('span', { class: 'calc' }, String(math)), sub: q,
    run: () => copy(String(math)), alt: () => copy(String(math)),
  }]]);

  // "yt lo-fi beats" -> quicklink with a query
  const [first, ...rest] = q.split(/\s+/);
  const link = state.links.find((l) => l.key === first.toLowerCase());
  if (link && rest.length) groups.push(['Quicklink', [linkItem(link, rest.join(' '))]]);

  const snip = state.snippets.find((s) => s.key === q.toLowerCase());
  if (snip) groups.push(['Snippet', [snipItem(snip)]]);

  const apps = top(state.apps, (a) => a.name, 8);
  if (apps.length) groups.push(['Applications', apps.map(appItem)]);
  const cmds = top(BUILTIN, (c) => c.name, 4);
  if (cmds.length) groups.push(['Commands', cmds.map(cmdItem)]);
  if (state.files.length) groups.push(['Files', state.files.slice(0, 12).map(fileItem)]);
  groups.push(['Search the web', [linkItem(state.links[0] || DEFAULT_LINKS[0], q)]]);
  return groups;
}

const appItem = (a) => ({ kind: 'Application', icon: '◻', iconPath: a.path, title: a.name, sub: a.path,
  run: () => openPath(a.path), alt: () => invoke('summon:reveal', a.path) });
const fileItem = (f) => ({ kind: 'File', icon: '📄', iconPath: f.path, title: f.name, sub: f.path.replace(/^\/Users\/[^/]+/, '~'),
  run: () => openPath(f.path), alt: () => invoke('summon:reveal', f.path) });
const cmdItem = (c) => ({ kind: 'Command', icon: c.icon, title: c.name, sub: c.sub, run: () => system(c) });
const clipItem = (c) => ({ kind: c.pinned ? 'Pinned' : timeAgo(c.at), icon: c.pinned ? '📌' : '📋',
  title: c.text.replace(/\s+/g, ' ').slice(0, 140), sub: `${c.text.length} chars`,
  run: () => invoke('summon:paste', c.text), alt: () => copy(c.text), clip: c });
const snipItem = (s) => ({ kind: s.key, icon: '✂︎', title: s.name, sub: s.text.replace(/\s+/g, ' ').slice(0, 90),
  run: async () => invoke('summon:paste', expand(s.text, { clipboard: await invoke('clipboard:read') || '' })),
  alt: async () => copy(expand(s.text, { clipboard: await invoke('clipboard:read') || '' })), snip: s });
const linkItem = (l, query) => ({ kind: l.key, icon: '↗', title: query ? `${l.name}: ${query}` : l.name, sub: l.url,
  run: () => { invoke('shell:openExternal', expand(l.url, { query })); hide(); }, link: l });

// ---- actions ----
async function openPath(p) { await invoke('summon:open', p); hide(); }
async function copy(t) { await invoke('clipboard:write', t); toast('Copied'); }
async function system(c) {
  if (c.confirm && !(await invoke('dialog:confirm', `${c.name}?`))) return;
  const r = await invoke('summon:system', c.id);
  if (r && !r.ok) toast(r.error, 'bad'); else hide();
}
function hide() { invoke('window:hide'); }
function timeAgo(t) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// ---- rendering ----
function render() {
  const groups = build();
  state.items = groups.flatMap(([, items]) => items);
  state.sel = Math.min(state.sel, Math.max(0, state.items.length - 1));
  $results.replaceChildren();
  let n = 0;
  for (const [label, items] of groups) {
    if (!items.length) continue;
    $results.append(h('div', { class: 'group' }, label));
    for (const it of items) {
      const idx = n++;
      const ic = h('div', { class: 'ic' }, it.icon);
      if (it.iconPath) loadIcon(it.iconPath, ic);
      $results.append(h('div', {
        class: 'item' + (idx === state.sel ? ' sel' : ''), 'data-idx': idx,
        onmousemove: () => { if (state.sel !== idx) { state.sel = idx; paintSel(); } },
        onclick: () => it.run(),
      }, ic, h('div', { class: 't' }, h('div', {}, it.title), it.sub ? h('div', { class: 'sub' }, it.sub) : null),
      h('div', { class: 'kind' }, it.kind)));
    }
  }
  if (!state.items.length) $results.append(h('div', { class: 'empty' }, h('h3', {}, 'Nothing here yet'),
    state.mode === 'clip' ? 'Copy something and it lands here.' : 'Try another word, or press ＋ New.'));
  $hint.textContent = { clip: '⌫ delete · ⌘P pin', snip: '⌘E edit · ⌫ delete', links: '⌘E edit · ⌫ delete' }[state.mode] || '';
  document.getElementById('addBtn').classList.toggle('hidden', !['snip', 'links'].includes(state.mode));
}
function paintSel() {
  $results.querySelectorAll('.item').forEach((el) => el.classList.toggle('sel', Number(el.dataset.idx) === state.sel));
  const el = $results.querySelector('.item.sel');
  if (el) el.scrollIntoView({ block: 'nearest' });
}
async function loadIcon(p, el) {
  if (!(p in state.icons)) state.icons[p] = await invoke('summon:icon', p);
  if (state.icons[p]) el.replaceChildren(h('img', { src: state.icons[p], alt: '' }));
}

const searchFiles = debounce(async () => {
  if (state.mode !== 'all') return;
  const q = state.q.trim();
  state.files = q.length >= 2 ? (await invoke('summon:files', q)) || [] : [];
  if (q === state.q.trim()) render();
}, 220);

function refresh() { state.sel = 0; render(); searchFiles(); }
function setMode(m) {
  state.mode = m;
  document.querySelectorAll('#modes button').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
  refresh();
}

// ---- snippets & quicklinks editing ----
async function editSnippet(s) {
  const r = await form(s ? 'Edit snippet' : 'New snippet', [
    { name: 'key', label: 'Keyword (type it to find the snippet)', value: s?.key || '' },
    { name: 'name', label: 'Name', value: s?.name || '' },
    { name: 'text', label: 'Text — {date} {time} {clipboard} fill in automatically', type: 'textarea', value: s?.text || '' },
  ], { ok: 'Save' });
  if (!r || !r.key || !r.text) return;
  state.snippets = s ? state.snippets.map((x) => (x === s ? r : x)) : [...state.snippets, r];
  await store.set('snippets', state.snippets); render();
}
async function editLink(l) {
  const r = await form(l ? 'Edit quicklink' : 'New quicklink', [
    { name: 'key', label: 'Keyword', value: l?.key || '' },
    { name: 'name', label: 'Name', value: l?.name || '' },
    { name: 'url', label: 'URL — {query} is what you type after the keyword', value: l?.url || 'https://' },
  ], { ok: 'Save' });
  if (!r || !r.key || !r.url) return;
  state.links = l ? state.links.map((x) => (x === l ? r : x)) : [...state.links, r];
  await store.set('links', state.links); render();
}

// ---- keyboard ----
$q.addEventListener('input', () => {
  state.q = $q.value;
  const m = state.q.match(/^(clip|snip|links?)\s/);
  if (m && state.mode === 'all') { setMode(m[1].startsWith('link') ? 'links' : m[1]); $q.value = state.q = ''; }
  refresh();
});
document.addEventListener('keydown', async (e) => {
  if (document.querySelector('.modal-back')) return;
  const it = state.items[state.sel];
  if (e.key === 'ArrowDown') { e.preventDefault(); state.sel = Math.min(state.items.length - 1, state.sel + 1); paintSel(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); state.sel = Math.max(0, state.sel - 1); paintSel(); }
  else if (e.key === 'Enter' && it) { e.preventDefault(); (e.metaKey && it.alt ? it.alt : it.run)(); }
  else if (e.key === 'Escape') { if ($q.value) { $q.value = state.q = ''; refresh(); } else if (state.mode !== 'all') setMode('all'); else hide(); }
  else if (e.key === 'Tab') {
    e.preventDefault();
    const modes = ['all', 'clip', 'snip', 'links'];
    setMode(modes[(modes.indexOf(state.mode) + (e.shiftKey ? 3 : 1)) % 4]);
  } else if (e.metaKey && e.key.toLowerCase() === 'p' && it?.clip) { e.preventDefault(); state.clips = await invoke('summon:clipPin', it.clip.text); render(); }
  else if (e.metaKey && e.key.toLowerCase() === 'e' && it?.snip) { e.preventDefault(); editSnippet(it.snip); }
  else if (e.metaKey && e.key.toLowerCase() === 'e' && it?.link) { e.preventDefault(); editLink(it.link); }
  else if ((e.key === 'Backspace' && e.metaKey) || (e.key === 'Backspace' && !$q.value && state.mode !== 'all')) {
    if (it?.clip) { e.preventDefault(); state.clips = await invoke('summon:clipDelete', it.clip.text) || state.clips.filter((c) => c !== it.clip); render(); }
    else if (it?.snip) { e.preventDefault(); state.snippets = state.snippets.filter((s) => s !== it.snip); await store.set('snippets', state.snippets); render(); }
    else if (it?.link) { e.preventDefault(); state.links = state.links.filter((l) => l !== it.link); await store.set('links', state.links); render(); }
  }
});
document.getElementById('modes').addEventListener('click', (e) => { const m = e.target.dataset.mode; if (m) { setMode(m); $q.focus(); } });
document.getElementById('addBtn').addEventListener('click', () => (state.mode === 'snip' ? editSnippet() : editLink()));

boot();
