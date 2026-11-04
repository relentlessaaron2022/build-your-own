// {{NAME}} — the page. Everything here runs in the window.
// BAMA gives you: h() to build elements, store.get/set to save data,
// invoke() to call the Mac side (main.js), toast(), form() and ask() for dialogs.
const { h, toast, form, store, invoke } = BAMA;
const $ = (id) => document.getElementById(id);

let items = [];
let selected = null;

async function boot() {
  items = await store.get('items', []);
  selected = items[0]?.id || null;
  paint();
  const info = await invoke('{{ID}}:hello', 'friend');
  $('status').textContent = info || 'Browser preview';
}

function paint() {
  $('list').replaceChildren(...items.map((it) => h('li', {
    class: it.id === selected ? 'active' : '',
    onclick: () => { selected = it.id; paint(); },
  }, it.title)));

  const it = items.find((x) => x.id === selected);
  if (!it) { $('detail').replaceChildren(h('div', { class: 'empty' }, h('h3', {}, 'Nothing here yet'), 'Press ＋ New item to start.')); return; }
  const notes = h('textarea', { class: 'textarea', rows: 12, style: { width: '100%' }, oninput: () => { it.notes = notes.value; store.set('items', items); } });
  notes.value = it.notes || '';
  $('detail').replaceChildren(h('h2', {}, it.title), notes,
    h('div', { class: 'row', style: { marginTop: '12px' } },
      h('button', { class: 'btn danger', onclick: () => { items = items.filter((x) => x !== it); selected = items[0]?.id || null; store.set('items', items); paint(); } }, 'Delete')));
}

$('addBtn').onclick = async () => {
  const title = await BAMA.ask('New item', 'Title');
  if (!title) return;
  const it = { id: BAMA.uid(), title, notes: '' };
  items.push(it); selected = it.id;
  await store.set('items', items);
  paint(); toast('Saved');
};

boot();
