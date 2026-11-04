// Relay main process: stores macros, arms their triggers, runs them.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile, exec } = require('child_process');
const { shell, clipboard, Notification, Tray, Menu, nativeImage } = require('electron');
const E = require('./engine.js');

const HOME = os.homedir();
const pexec = (bin, args) => new Promise((res, rej) => execFile(bin, args, { timeout: 120000, maxBuffer: 16 * 1024 * 1024 }, (err, out, errOut) => (err ? rej(new Error(String(errOut || err.message).trim())) : res(out))));
const pshell = (cmd, cwd) => new Promise((res, rej) => exec(cmd, { cwd: cwd || HOME, shell: process.env.SHELL || '/bin/zsh', timeout: 600000, maxBuffer: 16 * 1024 * 1024 }, (err, out, errOut) => (err ? rej(new Error(String(errOut || err.message).trim())) : res(out + (errOut ? '\n' + errOut : '')))));
const TEMP_EXT = /\.(crdownload|download|part|tmp|partial)$/i;

module.exports = function relay({ handle, send, store, globalShortcut, win }) {
  let macros = store.get('macros', null);
  if (!macros) { macros = E.TEMPLATES.slice(0, 3).map((t) => ({ ...JSON.parse(JSON.stringify(t)), id: Math.random().toString(36).slice(2), enabled: false })); store.set('macros', macros); }
  const logs = [];
  const running = new Map();
  const log = (entry) => { logs.push(entry); if (logs.length > 500) logs.shift(); send('relay:log', entry); };

  const io = {
    home: HOME, log,
    exec: pexec, shell: pshell,
    openUrl: (u) => shell.openExternal(u),
    openPath: async (p) => { const err = await shell.openPath(p); if (err) throw new Error(err); },
    notify: async (title, body) => { if (Notification.isSupported()) new Notification({ title, body }).show(); },
    clipboard: async (t) => clipboard.writeText(t),
    readClipboard: async () => clipboard.readText(),
  };

  async function run(id, vars = {}) {
    const m = macros.find((x) => x.id === id);
    if (!m) throw new Error('Macro not found');
    if (running.has(id)) { log({ at: Date.now(), macro: m.name, msg: 'Already running, skipped', kind: 'warn' }); return { ok: false }; }
    const token = { cancelled: false };
    running.set(id, token); send('relay:running', [...running.keys()]);
    try { return await E.runMacro(m, { ...io, cancelled: () => token.cancelled }, vars); }
    finally { running.delete(id); send('relay:running', [...running.keys()]); m.lastRun = Date.now(); store.set('macros', macros); }
  }

  // ---------- triggers ----------
  const watchers = [];
  let scheduleTimer = null;
  function arm() {
    globalShortcut.unregisterAll();
    watchers.splice(0).forEach((w) => w.close());
    clearInterval(scheduleTimer);
    const problems = {};
    for (const m of macros) {
      if (!m.enabled || !m.trigger) continue;
      const t = m.trigger;
      if (t.type === 'hotkey' && t.accelerator) {
        try { if (!globalShortcut.register(t.accelerator, () => run(m.id).catch(() => {}))) problems[m.id] = `${t.accelerator} is taken by another app`; }
        catch (e) { problems[m.id] = `Bad shortcut: ${e.message}`; }
      }
      if (t.type === 'folder' && t.path) {
        const dir = E.expandHome(t.path, HOME);
        if (!fs.existsSync(dir)) { problems[m.id] = `Folder not found: ${t.path}`; continue; }
        const seen = new Set(fs.readdirSync(dir));
        const exts = E.extList(t.filter);
        const pending = new Map();
        try {
          watchers.push(fs.watch(dir, (_ev, name) => {
            if (!name || name.startsWith('.') || TEMP_EXT.test(name) || seen.has(name) || pending.has(name)) return;
            const full = path.join(dir, name);
            // wait until the file stops growing (downloads, exports, AirDrop)
            let lastSize = -1;
            const check = () => {
              let st; try { st = fs.statSync(full); } catch (_) { pending.delete(name); return; }
              if (!st.isFile()) { pending.delete(name); seen.add(name); return; }
              if (st.size !== lastSize) { lastSize = st.size; pending.set(name, setTimeout(check, 1200)); return; }
              pending.delete(name); seen.add(name);
              if (!exts.length || exts.includes(path.extname(name).slice(1).toLowerCase())) {
                run(m.id, { file: full, name: path.basename(name, path.extname(name)), ext: path.extname(name) }).catch(() => {});
              }
            };
            pending.set(name, setTimeout(check, 800));
          }));
        } catch (e) { problems[m.id] = e.message; }
      }
    }
    scheduleTimer = setInterval(() => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      for (const m of macros) {
        const t = m.trigger;
        if (!m.enabled || !t || t.type !== 'schedule') continue;
        if (t.mode === 'every') {
          const mins = Math.max(1, +t.minutes || 60);
          if (!m.lastRun || Date.now() - m.lastRun >= mins * 60000) run(m.id).catch(() => {});
        } else if (t.mode === 'daily' && t.time === hhmm) {
          const today = now.toDateString();
          if (m.lastDaily !== today) { m.lastDaily = today; run(m.id).catch(() => {}); }
        }
      }
    }, 20000);
    send('relay:problems', problems);
    paintTray();
    return problems;
  }

  // ---------- menu bar ----------
  let tray = null;
  function paintTray() {
    try {
      if (!tray) { tray = new Tray(nativeImage.createEmpty()); tray.setTitle('⚡︎'); tray.setToolTip('Relay'); }
      tray.setContextMenu(Menu.buildFromTemplate([
        ...macros.map((m) => ({ label: m.name, click: () => run(m.id).catch(() => {}) })),
        { type: 'separator' },
        { label: 'Open Relay', click: () => { const w = win(); if (w) { w.show(); w.focus(); } } },
      ]));
    } catch (_) { /* tray is optional */ }
  }

  // ---------- bridge ----------
  handle('relay:list', () => macros);
  handle('relay:save', (list) => { macros = list; store.set('macros', macros); return arm(); });
  handle('relay:run', (id) => run(id));
  handle('relay:stop', (id) => { const t = running.get(id); if (t) t.cancelled = true; return true; });
  handle('relay:logs', () => logs);
  handle('relay:catalog', () => ({ steps: E.STEPS, templates: E.TEMPLATES }));
  handle('relay:preview', (step, vars = {}) => {
    const folder = E.expandHome(E.fill(step.folder, { ...E.stamp(), ...vars }), HOME);
    if (!fs.existsSync(folder)) throw new Error(`Folder not found: ${step.folder}`);
    if (step.type === 'rename') {
      return E.renamePlan(folder, E.listFiles(folder, E.extList(step.filter)), { ...step, regex: !!step.regex }, { ...E.stamp(), ...vars }).slice(0, 200);
    }
    if (step.type === 'sort_files') return E.sortPlan(folder, E.listFiles(folder), step.rules).slice(0, 200).map((p) => ({ from: path.basename(p.from), to: path.relative(folder, p.to) }));
    return [];
  });
  arm();
};
