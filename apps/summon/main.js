// Summon main process: global hotkey, app index, Spotlight file search,
// clipboard history, and a handful of system commands.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { clipboard, shell, app: electronApp } = require('electron');

const APP_DIRS = ['/Applications', '/Applications/Utilities', '/System/Applications',
  '/System/Applications/Utilities', path.join(os.homedir(), 'Applications')];

const SYSTEM = {
  'lock': ['pmset', ['displaysleepnow']],
  'sleep': ['pmset', ['sleepnow']],
  'dark-mode': ['osascript', ['-e', 'tell application "System Events" to tell appearance preferences to set dark mode to not dark mode']],
  'empty-trash': ['osascript', ['-e', 'tell application "Finder" to empty trash']],
  'screensaver': ['open', ['-a', 'ScreenSaverEngine']],
  'restart-finder': ['killall', ['Finder']],
  'restart-dock': ['killall', ['Dock']],
  'show-desktop': ['osascript', ['-e', 'tell application "System Events" to key code 103']],
  'mute': ['osascript', ['-e', 'set volume output muted not (output muted of (get volume settings))']],
};

module.exports = function summon({ handle, win, globalShortcut, manifest, store, send }) {
  // ---- hotkey toggles the palette ----
  const toggle = () => {
    const w = win();
    if (!w) return;
    if (w.isVisible() && w.isFocused()) { w.hide(); return; }
    w.center(); w.show(); w.focus(); send('summon:shown');
  };
  const hotkey = store.get('hotkey', manifest.hotkey || 'Alt+Space');
  if (!globalShortcut.register(hotkey, toggle)) console.warn('[summon] hotkey taken:', hotkey);
  win().on('blur', () => { if (store.get('hideOnBlur', true)) win().hide(); });
  handle('summon:setHotkey', (acc) => {
    globalShortcut.unregisterAll();
    const ok = globalShortcut.register(acc, toggle);
    if (ok) store.set('hotkey', acc); else globalShortcut.register(hotkey, toggle);
    return ok;
  });

  // ---- installed apps ----
  let appCache = null;
  function scanApps() {
    const out = [];
    for (const dir of APP_DIRS) {
      let entries = [];
      try { entries = fs.readdirSync(dir); } catch (_) { continue; }
      for (const name of entries) {
        if (name.endsWith('.app')) out.push({ name: name.replace(/\.app$/, ''), path: path.join(dir, name) });
      }
    }
    const seen = new Set();
    return out.filter((a) => (seen.has(a.name) ? false : seen.add(a.name))).sort((a, b) => a.name.localeCompare(b.name));
  }
  handle('summon:apps', (refresh) => { if (!appCache || refresh) appCache = scanApps(); return appCache; });

  const iconCache = new Map();
  handle('summon:icon', async (p) => {
    if (iconCache.has(p)) return iconCache.get(p);
    try {
      const img = await electronApp.getFileIcon(p, { size: 'normal' });
      const url = img.toDataURL();
      iconCache.set(p, url);
      return url;
    } catch (_) { return null; }
  });

  // ---- Spotlight file search ----
  handle('summon:files', (q) => new Promise((resolve) => {
    if (!q || q.length < 2 || process.platform !== 'darwin') return resolve([]);
    execFile('mdfind', ['-name', q], { timeout: 2500, maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
      if (err && !stdout) return resolve([]);
      const lines = String(stdout).split('\n').filter(Boolean)
        .filter((p) => !p.includes('/Library/') && !p.includes('/.'))
        .slice(0, 30);
      resolve(lines.map((p) => ({ name: path.basename(p), path: p })));
    });
  }));

  handle('summon:open', (p) => shell.openPath(p));
  handle('summon:reveal', (p) => { shell.showItemInFolder(p); return true; });
  handle('summon:system', (id) => new Promise((resolve) => {
    const cmd = SYSTEM[id];
    if (!cmd) return resolve({ ok: false, error: 'Unknown command' });
    execFile(cmd[0], cmd[1], { timeout: 8000 }, (err) => resolve(err ? { ok: false, error: err.message } : { ok: true }));
  }));

  // ---- clipboard history ----
  let clips = store.get('clips', []);
  let last = clipboard.readText();
  setInterval(() => {
    const now = clipboard.readText();
    if (!now || now === last) return;
    last = now;
    if (now.length > 20000) return; // skip giant blobs
    clips = [{ text: now, at: Date.now(), pinned: false }, ...clips.filter((c) => c.text !== now)];
    const pinned = clips.filter((c) => c.pinned);
    const rest = clips.filter((c) => !c.pinned).slice(0, store.get('clipLimit', 200));
    clips = [...pinned, ...rest].sort((a, b) => (b.pinned - a.pinned) || (b.at - a.at));
    store.set('clips', clips);
    send('summon:clips', clips);
  }, 800);
  handle('summon:clips', () => clips);
  handle('summon:clipPin', (text) => {
    clips = clips.map((c) => (c.text === text ? { ...c, pinned: !c.pinned } : c));
    store.set('clips', clips); return clips;
  });
  handle('summon:clipDelete', (text) => { clips = clips.filter((c) => c.text !== text); store.set('clips', clips); return clips; });
  handle('summon:clipClear', () => { clips = clips.filter((c) => c.pinned); store.set('clips', clips); return clips; });
  handle('summon:paste', (text) => {
    clipboard.writeText(text); last = text;
    win().hide();
    // send Cmd+V to the app that was in front before Summon opened
    setTimeout(() => execFile('osascript', ['-e', 'tell application "System Events" to keystroke "v" using command down'], () => {}), 120);
    return true;
  });
};
