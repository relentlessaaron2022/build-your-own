// Relay page: macro list, step editor, run log.
const { h, toast, form, invoke, on, debounce, uid } = BAMA;
const { STEPS, TEMPLATES } = RelayCatalog;
const $ = (id) => document.getElementById(id);

Object.assign(window.BAMA_MOCKS, {
  'relay:list': () => BAMA.store.get('macros', TEMPLATES.slice(0, 3).map((t) => ({ ...JSON.parse(JSON.stringify(t)), id: uid(), enabled: false }))),
  'relay:save': (list) => { BAMA.store.set('macros', list); return {}; },
  'relay:run': async (id) => { appendLog({ at: Date.now(), macro: S.list.find((m) => m.id === id)?.name, msg: 'Macros run in the Mac app (npm start relay)', kind: 'warn' }); return { ok: false }; },
  'relay:logs': () => [],
  'relay:preview': (step) => [{ from: 'example.png', to: (step.pattern || '{name}').replace('{n:3}', '001').replace('{n}', '1').replace('{name}', 'example') + '.png' }],
});

const S = { list: [], sel: null, running: new Set(), problems: {} };
const cur = () => S.list.find((m) => m.id === S.sel);
const persist = debounce(async () => { S.problems = (await invoke('relay:save', S.list)) || {}; paintList(); paintProblem(); }, 500);

async function boot() {
  S.list = (await invoke('relay:list')) || [];
  S.sel = S.list[0]?.id || null;
  ((await invoke('relay:logs')) || []).forEach(appendLog);
  paintList(); paintEditor();
}
on('relay:log', appendLog);
on('relay:running', (ids) => { S.running = new Set(ids); paintList(); paintRunBtn(); });
on('relay:problems', (p) => { S.problems = p || {}; paintList(); paintProblem(); });

function appendLog(e) {
  const t = new Date(e.at).toLocaleTimeString();
  $('log').append(h('div', { class: e.kind || '' }, `${t}  ${e.macro ? `[${e.macro}] ` : ''}${e.msg}`));
  $('log').scrollTop = $('log').scrollHeight;
}

function triggerSummary(t = {}) {
  if (t.type === 'hotkey') return `⌨︎ ${t.accelerator || 'no keys yet'}`;
  if (t.type === 'folder') return `📂 ${t.path || 'no folder yet'}`;
  if (t.type === 'schedule') return t.mode === 'daily' ? `⏰ daily ${t.time || ''}` : `⏱ every ${t.minutes || 60} min`;
  return '▶ manual';
}
function paintList() {
  $('macroList').replaceChildren(...S.list.map((m) => h('li', { class: 'macro-row' + (m.id === S.sel ? ' active' : ''), onclick: () => { S.sel = m.id; paintList(); paintEditor(); } },
    h('span', { class: 'dot' + (S.running.has(m.id) ? ' run' : m.enabled ? ' on' : '') }),
    h('div', { class: 'grow' }, h('div', {}, m.name), h('div', { class: 'faint', style: { fontSize: '11.5px' } }, triggerSummary(m.trigger), S.problems[m.id] ? ' · ⚠︎' : '')))));
  if (!S.list.length) $('macroList').append(h('li', { class: 'faint' }, 'No macros yet'));
}

// ---------- editor ----------
function fieldInput(step, [key, label, placeholder, kind], onChange) {
  let input;
  if (Array.isArray(kind)) input = h('select', { class: 'select' }, kind.map((o) => h('option', { value: o, selected: (step[key] ?? placeholder) === o }, o)));
  else if (kind === 'textarea') { input = h('textarea', { class: 'textarea mono', rows: Math.max(3, String(step[key] ?? '').split('\n').length) }); input.value = step[key] ?? ''; input.placeholder = placeholder; }
  else input = h('input', { class: 'input', value: step[key] ?? '', placeholder });
  input.addEventListener('input', () => { step[key] = input.value; onChange(); });
  return h('label', { class: 'field' + (kind === 'textarea' || key === 'pattern' ? ' wide' : '') }, label, input);
}

function paintEditor() {
  const m = cur();
  if (!m) { $('editor').replaceChildren(h('div', { class: 'empty' }, h('h3', {}, 'Make your first macro'), 'Start from a template, or build one step at a time.')); return; }
  m.trigger = m.trigger || { type: 'manual' };
  const t = m.trigger;
  const changed = () => persist();

  const name = h('input', { class: 'name-input', value: m.name, oninput: (e) => { m.name = e.target.value; changed(); paintList(); } });
  const typeSel = h('select', { class: 'select', onchange: (e) => { m.trigger = { type: e.target.value }; if (e.target.value === 'schedule') m.trigger.mode = 'daily'; changed(); paintEditor(); paintList(); } },
    [['manual', 'Only when I press Run'], ['hotkey', 'Keyboard shortcut'], ['folder', 'A file lands in a folder'], ['schedule', 'On a schedule']].map(([v, l]) => h('option', { value: v, selected: t.type === v }, l)));
  const trig = h('div', { class: 'trigger' }, h('label', { class: 'field' }, 'Trigger', typeSel));
  const tfield = (key, label, ph) => h('label', { class: 'field' }, label, h('input', { class: 'input', value: t[key] || '', placeholder: ph, oninput: (e) => { t[key] = e.target.value; changed(); paintList(); } }));
  if (t.type === 'hotkey') trig.append(tfield('accelerator', 'Shortcut', 'Alt+Shift+S'), h('div', { class: 'faint', style: { fontSize: '11.5px', paddingBottom: '6px' } }, 'Use Cmd, Alt, Shift, Ctrl with + between them'));
  if (t.type === 'folder') trig.append(tfield('path', 'Folder to watch', '~/Downloads'), tfield('filter', 'Only these types (optional)', 'pdf, png'),
    h('div', { class: 'faint', style: { fontSize: '11.5px', paddingBottom: '6px', width: '100%' } }, 'The new file is available to steps as {file}, {name} and {ext}.'));
  if (t.type === 'schedule') {
    trig.append(h('label', { class: 'field' }, 'Repeat', h('select', { class: 'select', onchange: (e) => { t.mode = e.target.value; changed(); paintEditor(); } },
      h('option', { value: 'daily', selected: t.mode === 'daily' }, 'Every day at'), h('option', { value: 'every', selected: t.mode === 'every' }, 'Every N minutes'))));
    if (t.mode === 'every') trig.append(tfield('minutes', 'Minutes', '60'));
    else trig.append(h('label', { class: 'field' }, 'Time', h('input', { class: 'input', type: 'time', value: t.time || '09:00', oninput: (e) => { t.time = e.target.value; changed(); paintList(); } })));
  }

  const steps = h('div', { class: 'col', style: { gap: 0 } });
  (m.steps || []).forEach((step, i) => {
    const def = STEPS[step.type] || { label: step.type, fields: [] };
    const previewBox = h('div');
    const card = h('div', { class: 'card' },
      h('div', { class: 'head' }, h('strong', {}, def.label),
        ['rename', 'sort_files'].includes(step.type) ? h('button', { class: 'btn sm', onclick: () => preview(step, previewBox) }, 'Preview') : null,
        h('button', { class: 'btn sm ghost', title: 'Move up', disabled: i === 0, onclick: () => { m.steps.splice(i - 1, 0, m.steps.splice(i, 1)[0]); changed(); paintEditor(); } }, '↑'),
        h('button', { class: 'btn sm ghost', title: 'Move down', disabled: i === m.steps.length - 1, onclick: () => { m.steps.splice(i + 1, 0, m.steps.splice(i, 1)[0]); changed(); paintEditor(); } }, '↓'),
        h('button', { class: 'btn sm ghost', title: step.disabled ? 'Turn on' : 'Skip this step', onclick: () => { step.disabled = !step.disabled; changed(); paintEditor(); } }, step.disabled ? 'Off' : 'On'),
        h('button', { class: 'btn sm ghost danger', title: 'Delete step', onclick: () => { m.steps.splice(i, 1); changed(); paintEditor(); } }, '✕')),
      h('div', { class: 'fields' }, def.fields.map((f) => fieldInput(step, f, changed))),
      h('label', { class: 'check faint', style: { fontSize: '12px' } }, h('input', { type: 'checkbox', checked: !!step.continueOnError, onchange: (e) => { step.continueOnError = e.target.checked; changed(); } }), 'Keep going if this step fails'),
      previewBox);
    if (i) steps.append(h('div', { class: 'connector' }));
    steps.append(h('div', { class: 'step' + (step.disabled ? ' off' : '') }, h('div', { class: 'num' }, i + 1), card));
  });

  const adder = h('select', { class: 'select', onchange: (e) => {
    const type = e.target.value; if (!type) return;
    const step = { type };
    STEPS[type].fields.forEach(([k, , ph, kind]) => { step[k] = Array.isArray(kind) ? ph : (k === 'rules' || k === 'pattern' || k === 'max' || k === 'start' || k === 'format' || k === 'seconds' ? ph : ''); });
    (m.steps = m.steps || []).push(step); changed(); paintEditor();
  } }, h('option', { value: '' }, '＋ Add a step…'), Object.entries(STEPS).map(([k, v]) => h('option', { value: k }, v.label)));

  $('editor').replaceChildren(h('div', { class: 'editor-inner' },
    h('div', { class: 'row' }, name,
      h('label', { class: 'check', title: 'Arms the trigger' }, h('input', { type: 'checkbox', checked: !!m.enabled, onchange: (e) => { m.enabled = e.target.checked; changed(); paintList(); } }), 'Enabled'),
      h('button', { class: 'btn primary', id: 'runBtn', onclick: () => (S.running.has(m.id) ? invoke('relay:stop', m.id) : invoke('relay:run', m.id)) }, 'Run now')),
    h('div', { class: 'problem', id: 'problem' }),
    h('div', { class: 'card' }, trig),
    steps.childElementCount ? steps : h('div', { class: 'faint' }, 'No steps yet. Add one below.'),
    h('div', { class: 'row' }, adder, h('span', { class: 'spacer' }),
      h('button', { class: 'btn sm', onclick: () => { const c = JSON.parse(JSON.stringify(m)); c.id = uid(); c.name += ' copy'; c.enabled = false; S.list.push(c); S.sel = c.id; changed(); paintList(); paintEditor(); } }, 'Duplicate macro'),
      h('button', { class: 'btn sm danger', onclick: async () => { if (await invoke('dialog:confirm', `Delete "${m.name}"?`)) { S.list = S.list.filter((x) => x !== m); S.sel = S.list[0]?.id || null; changed(); paintList(); paintEditor(); } } }, 'Delete macro')),
    h('div', { class: 'faint', style: { fontSize: '12px' } }, 'Tokens you can use in any field: {date} {time} {n} {n:3} {name} {ext} {file} {clipboard} {output}, plus any variable you set.')));
  paintRunBtn(); paintProblem();
}
function paintRunBtn() { const b = $('runBtn'); const m = cur(); if (b && m) b.textContent = S.running.has(m.id) ? 'Stop' : 'Run now'; }
function paintProblem() { const el = $('problem'); const m = cur(); if (el && m) el.textContent = S.problems[m.id] ? `⚠︎ ${S.problems[m.id]}` : ''; }

async function preview(step, box) {
  try {
    const plan = await invoke('relay:preview', step);
    box.replaceChildren(h('div', { class: 'plan' }, plan.length ? plan.map((p) => h('div', { class: p.conflict ? 'bad' : '' }, `${p.from}  →  ${p.to}${p.conflict ? '   (name clash)' : ''}`)) : 'No matching files.'));
  } catch (e) { box.replaceChildren(h('div', { class: 'plan bad' }, String(e.message).replace(/^Error invoking remote method '[^']+': (Error: )?/, ''))); }
}

$('newMacro').onclick = () => { const m = { id: uid(), name: 'New macro', enabled: false, trigger: { type: 'manual' }, steps: [] }; S.list.push(m); S.sel = m.id; persist(); paintList(); paintEditor(); };
$('fromTemplate').onclick = async () => {
  const r = await form('Start from a template', [{ name: 't', label: 'Template', type: 'select', value: 0, options: TEMPLATES.map((t, i) => [i, t.name]) }], { ok: 'Add' });
  if (!r) return;
  const m = { ...JSON.parse(JSON.stringify(TEMPLATES[+r.t])), id: uid(), enabled: false };
  S.list.push(m); S.sel = m.id; persist(); paintList(); paintEditor(); toast('Added. Check the folders, then tick Enabled.');
};
$('clearLog').onclick = () => $('log').replaceChildren();
boot();
