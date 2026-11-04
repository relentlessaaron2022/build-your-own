// Manuscript core: project model, tree operations, word counts, compile.
(function (root) {
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const words = (s) => (String(s || '').match(/[\p{L}\p{N}'’-]+/gu) || []).length;

  const STATUSES = ['To do', 'First draft', 'Revised', 'Final'];
  const LABELS = [['', 'None'], ['#ef4444', 'Red'], ['#f97316', 'Orange'], ['#eab308', 'Gold'], ['#22c55e', 'Green'], ['#3b82f6', 'Blue'], ['#a855f7', 'Purple']];

  function node(type, title, extra = {}) {
    return { id: uid(), type, title, synopsis: '', notes: '', status: STATUSES[0], label: '', body: '', children: [], snapshots: [], created: Date.now(), ...extra };
  }

  const TEMPLATES = {
    novel: {
      name: 'Novel',
      draft: [['folder', 'Part One', [['doc', 'Chapter 1'], ['doc', 'Chapter 2']]], ['folder', 'Part Two', [['doc', 'Chapter 3']]]],
      characters: [['doc', 'Protagonist', [], 'Name:\nWants:\nNeeds:\nWound:\nSecret:\nArc:']],
      places: [['doc', 'Main setting', [], 'What it smells like:\nWho runs it:\nWhat it costs to live here:']],
      research: [['doc', 'Notes']],
    },
    nonfiction: {
      name: 'Non-fiction book',
      draft: [['doc', 'Introduction'], ['folder', 'Part I', [['doc', 'Chapter 1'], ['doc', 'Chapter 2']]], ['doc', 'Conclusion']],
      characters: [['doc', 'Reader avatar', [], 'Who they are:\nWhere they are stuck:\nWhat they want to feel by the last page:']],
      places: [],
      research: [['doc', 'Sources'], ['doc', 'Stories & anecdotes'], ['doc', 'Stats & facts']],
    },
    screenplay: {
      name: 'Screenplay',
      draft: [
        ['folder', 'Act One', [['doc', 'Opening image', [], 'EXT. CITY STREET - NIGHT\n\n'], ['doc', 'Inciting incident']]],
        ['folder', 'Act Two', [['doc', 'Midpoint']]],
        ['folder', 'Act Three', [['doc', 'Climax'], ['doc', 'Final image']]],
      ],
      characters: [['doc', 'Lead', [], 'Name:\nAge:\nWant:\nNeed:\nFlaw:']],
      places: [['doc', 'Locations']],
      research: [['doc', 'Logline & treatment']],
    },
    blank: { name: 'Blank', draft: [['doc', 'Untitled']], characters: [], places: [], research: [] },
  };

  function createProject(title, templateKey = 'novel') {
    const t = TEMPLATES[templateKey] || TEMPLATES.blank;
    const nodes = {};
    const add = (spec) => {
      const [type, name, kids = [], body = ''] = spec;
      const n = node(type, name, { body });
      nodes[n.id] = n;
      n.children = kids.map(add);
      return n.id;
    };
    const root = (title2, specs) => { const r = node('folder', title2, { root: true }); nodes[r.id] = r; r.children = specs.map(add); return r.id; };
    const roots = {
      draft: root(templateKey === 'screenplay' ? 'Screenplay' : 'Manuscript', t.draft),
      characters: root(templateKey === 'nonfiction' ? 'Audience' : 'Characters', t.characters),
      places: root('Places', t.places),
      research: root('Research', t.research),
      trash: root('Trash', []),
    };
    return { id: uid(), title, template: templateKey, target: templateKey === 'nonfiction' ? 50000 : 80000, sessionTarget: 1000, deadline: '', nodes, roots, created: Date.now(), updated: Date.now() };
  }

  function parentOf(p, id) {
    for (const n of Object.values(p.nodes)) if (n.children.includes(id)) return n;
    return null;
  }
  function isAncestor(p, maybeAncestor, id) {
    let cur = parentOf(p, id);
    while (cur) { if (cur.id === maybeAncestor) return true; cur = parentOf(p, cur.id); }
    return false;
  }
  function insert(p, parentId, type, title, index) {
    const n = node(type, title);
    p.nodes[n.id] = n;
    const parent = p.nodes[parentId];
    const at = index == null ? parent.children.length : index;
    parent.children.splice(at, 0, n.id);
    return n;
  }
  // move id to be a child of parentId at index (or before/after a sibling)
  function move(p, id, parentId, index) {
    if (id === parentId || isAncestor(p, id, parentId) || p.nodes[id].root) return false;
    const old = parentOf(p, id);
    if (!old) return false;
    const oldIdx = old.children.indexOf(id);
    old.children.splice(oldIdx, 1);
    const parent = p.nodes[parentId];
    let at = index == null ? parent.children.length : index;
    if (old === parent && oldIdx < at) at -= 1;
    parent.children.splice(Math.max(0, Math.min(at, parent.children.length)), 0, id);
    return true;
  }
  function trash(p, id) { return move(p, id, p.roots.trash); }
  function emptyTrash(p) {
    const drop = (id) => { p.nodes[id].children.forEach(drop); delete p.nodes[id]; };
    p.nodes[p.roots.trash].children.forEach(drop);
    p.nodes[p.roots.trash].children = [];
  }
  function descendants(p, id) {
    const out = [];
    const walk = (i) => { for (const c of p.nodes[i].children) { out.push(p.nodes[c]); walk(c); } };
    walk(id);
    return out;
  }
  function countWords(p, id) {
    const n = p.nodes[id];
    return words(n.body) + n.children.reduce((s, c) => s + countWords(p, c), 0);
  }
  function snapshot(n, label = '') {
    n.snapshots.unshift({ at: Date.now(), label, body: n.body, words: words(n.body) });
    n.snapshots = n.snapshots.slice(0, 50);
  }

  // Compile the draft into one document.
  function compile(p, format = 'md', { synopses = false, separator = '* * *' } = {}) {
    const lines = [];
    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const walk = (id, depth) => {
      const n = p.nodes[id];
      if (n.status === 'Exclude') return;
      const level = Math.min(depth, 6);
      const isFolder = n.type === 'folder' || n.children.length > 0;
      if (format === 'md') lines.push(`${'#'.repeat(level)} ${n.title}`, '');
      else if (format === 'html') lines.push(`<h${level}>${esc(n.title)}</h${level}>`);
      else lines.push(isFolder ? n.title.toUpperCase() : n.title, '');
      if (synopses && n.synopsis) lines.push(format === 'html' ? `<p><em>${esc(n.synopsis)}</em></p>` : `_${n.synopsis}_`, '');
      if (n.body.trim()) {
        if (format === 'html') n.body.trim().split(/\n{2,}/).forEach((para) => lines.push(`<p>${esc(para).replace(/\n/g, '<br>')}</p>`));
        else lines.push(n.body.trim(), '');
      }
      n.children.forEach((c, i) => {
        walk(c, depth + 1);
        if (separator && p.nodes[c].type === 'doc' && i < n.children.length - 1 && p.nodes[n.children[i + 1]].type === 'doc') {
          lines.push(format === 'html' ? `<p class="sep">${esc(separator)}</p>` : separator, '');
        }
      });
    };
    const draft = p.nodes[p.roots.draft];
    if (format === 'md') lines.push(`# ${p.title}`, '');
    else if (format === 'txt') lines.push(p.title.toUpperCase(), '');
    draft.children.forEach((c) => walk(c, 2));
    const body = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    if (format !== 'html') return body;
    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(p.title)}</title>
<style>body{font:18px/1.7 Georgia,serif;max-width:680px;margin:60px auto;padding:0 20px;color:#1c1b19}
h1{font-size:2.2em;text-align:center;margin-bottom:2em}h2{margin-top:3em;page-break-before:always}p{text-indent:1.5em;margin:0 0 .4em}h2+p,h3+p,.sep+p{text-indent:0}.sep{text-align:center;margin:1.5em 0;text-indent:0}</style>
</head><body><h1>${esc(p.title)}</h1>\n${body}</body></html>\n`;
  }

  const api = { uid, words, STATUSES, LABELS, TEMPLATES, createProject, parentOf, isAncestor, insert, move, trash, emptyTrash, descendants, countWords, snapshot, compile };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ManuscriptLib = api;
})(typeof window !== 'undefined' ? window : globalThis);
