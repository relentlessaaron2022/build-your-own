// BAMA shell — the one main process every BAMA app runs on.
// It picks which app to load, opens the window, wires the shared bridge
// (storage, dialogs, files, clipboard, notifications), then hands the
// app its own main-process module so it can add Mac-specific powers.

const path = require('path');
const fs = require('fs');
const {
  app, BrowserWindow, ipcMain, dialog, shell, clipboard,
  Notification, Menu, globalShortcut, nativeTheme, protocol,
} = require('electron');

// bama-media://file/<absolute path> streams local media to pages with
// byte-range support (for seeking) and CORS (so canvases can read frames).
protocol.registerSchemesAsPrivileged([{
  scheme: 'bama-media',
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true, bypassCSP: true },
}]);
const MIME = { '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mkv': 'video/x-matroska',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.wav': 'audio/wav', '.aif': 'audio/aiff', '.aiff': 'audio/aiff',
  '.flac': 'audio/flac', '.ogg': 'audio/ogg', '.opus': 'audio/ogg', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.heic': 'image/heic', '.bmp': 'image/bmp', '.svg': 'image/svg+xml' };
function serveMedia(request) {
  const url = new URL(request.url);
  const file = decodeURIComponent(url.pathname);
  let st;
  try { st = fs.statSync(file); } catch (_) { return new Response('Not found', { status: 404 }); }
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const base = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' };
  const range = request.headers.get('range');
  const body = (start, end) => require('stream').Readable.toWeb(fs.createReadStream(file, { start, end }));
  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    let start = m && m[1] ? parseInt(m[1], 10) : 0;
    let end = m && m[2] ? parseInt(m[2], 10) : st.size - 1;
    if (m && !m[1] && m[2]) { start = Math.max(0, st.size - parseInt(m[2], 10)); end = st.size - 1; }
    end = Math.min(end, st.size - 1);
    if (start > end || start >= st.size) return new Response(null, { status: 416, headers: { ...base, 'Content-Range': `bytes */${st.size}` } });
    return new Response(body(start, end), { status: 206, headers: { ...base, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': String(end - start + 1) } });
  }
  return new Response(body(0, Math.max(0, st.size - 1)), { status: 200, headers: { ...base, 'Content-Length': String(st.size) } });
}

const ROOT = path.join(__dirname, '..');

function resolveAppId() {
  const fromArg = process.argv.find((a) => a.startsWith('--bama-app='));
  if (fromArg) return fromArg.split('=')[1];
  if (process.env.BAMA_APP) return process.env.BAMA_APP;
  try {
    const pkg = require(path.join(ROOT, 'package.json'));
    if (pkg.bamaApp) return pkg.bamaApp;
  } catch (_) { /* fall through */ }
  return 'summon';
}

const APP_ID = resolveAppId();
const APP_DIR = path.join(ROOT, 'apps', APP_ID);
if (!fs.existsSync(path.join(APP_DIR, 'app.json'))) {
  console.error(`[bama] No app named "${APP_ID}" in apps/. Run: npm run new ${APP_ID}`);
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(path.join(APP_DIR, 'app.json'), 'utf8'));
app.setName(manifest.name);

// ---------- tiny JSON store, one file per app ----------
const storeFile = () => path.join(app.getPath('userData'), `${APP_ID}.store.json`);
let storeCache = null;
function storeLoad() {
  if (storeCache) return storeCache;
  try { storeCache = JSON.parse(fs.readFileSync(storeFile(), 'utf8')); }
  catch (_) { storeCache = {}; }
  return storeCache;
}
let storeTimer = null;
function storeSave() {
  clearTimeout(storeTimer);
  storeTimer = setTimeout(() => {
    fs.mkdirSync(path.dirname(storeFile()), { recursive: true });
    const tmp = storeFile() + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(storeCache, null, 2));
    fs.renameSync(tmp, storeFile());
  }, 150);
}
const store = {
  get: (key, fallback = null) => (key in storeLoad() ? storeLoad()[key] : fallback),
  set: (key, value) => { storeLoad()[key] = value; storeSave(); return true; },
  flush: () => { if (storeTimer) { clearTimeout(storeTimer); storeTimer = null;
    fs.mkdirSync(path.dirname(storeFile()), { recursive: true });
    fs.writeFileSync(storeFile(), JSON.stringify(storeLoad(), null, 2)); } },
};

// ---------- window ----------
let win = null;
function createWindow() {
  const w = manifest.window || {};
  const saved = store.get('__bounds');
  win = new BrowserWindow({
    width: (saved && saved.width) || w.width || 1200,
    height: (saved && saved.height) || w.height || 800,
    x: saved ? saved.x : undefined,
    y: saved ? saved.y : undefined,
    minWidth: w.minWidth || 640,
    minHeight: w.minHeight || 420,
    title: manifest.name,
    titleBarStyle: w.frameless ? undefined : 'hiddenInset',
    frame: !w.frameless,
    transparent: !!w.transparent,
    vibrancy: w.vibrancy || 'under-window',
    visualEffectState: 'active',
    alwaysOnTop: !!w.alwaysOnTop,
    resizable: w.resizable !== false,
    show: !w.startHidden,
    skipTaskbar: !!w.startHidden,
    backgroundColor: w.transparent ? '#00000000' : (nativeTheme.shouldUseDarkColors ? '#141416' : '#f6f5f2'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.loadFile(path.join(APP_DIR, 'index.html'));
  const remember = () => { if (!win.isMinimized() && !manifest.window?.frameless) store.set('__bounds', win.getBounds()); };
  win.on('resize', remember);
  win.on('move', remember);
  // links open in the real browser, never inside the app
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  return win;
}

// ---------- shared bridge ----------
const handle = (channel, fn) => ipcMain.handle(channel, (_e, ...args) => fn(...args));

handle('bama:manifest', () => ({ id: APP_ID, ...manifest, platform: process.platform, version: app.getVersion() }));
handle('store:get', (key, fallback) => store.get(key, fallback));
handle('store:set', (key, value) => store.set(key, value));

handle('dialog:open', async (opts = {}) => {
  const props = ['openFile'];
  if (opts.directory) props.splice(0, 1, 'openDirectory', 'createDirectory');
  if (opts.multiple) props.push('multiSelections');
  const r = await dialog.showOpenDialog(win, { properties: props, filters: opts.filters, title: opts.title });
  return r.canceled ? null : (opts.multiple ? r.filePaths : r.filePaths[0]);
});
handle('dialog:save', async (opts = {}) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: opts.defaultPath, filters: opts.filters, title: opts.title });
  return r.canceled ? null : r.filePath;
});
handle('dialog:confirm', async (message, detail) => {
  const r = await dialog.showMessageBox(win, { type: 'question', buttons: ['OK', 'Cancel'], defaultId: 0, cancelId: 1, message, detail });
  return r.response === 0;
});

handle('fs:readText', (p) => fs.readFileSync(p, 'utf8'));
handle('fs:writeText', (p, text) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); return true; });
handle('fs:writeBase64', (p, b64) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, Buffer.from(b64, 'base64')); return true; });
handle('fs:exists', (p) => fs.existsSync(p));
handle('fs:stat', (p) => { const s = fs.statSync(p); return { size: s.size, mtime: s.mtimeMs, dir: s.isDirectory() }; });
handle('path:home', () => app.getPath('home'));
handle('path:userData', () => app.getPath('userData'));

handle('shell:openPath', (p) => shell.openPath(p));
handle('shell:showItem', (p) => { shell.showItemInFolder(p); return true; });
handle('shell:openExternal', (url) => shell.openExternal(url));

handle('clipboard:read', () => clipboard.readText());
handle('clipboard:write', (text) => { clipboard.writeText(String(text)); return true; });

handle('notify', (title, body) => {
  if (Notification.isSupported()) new Notification({ title, body }).show();
  return true;
});
handle('window:hide', () => { win && win.hide(); return true; });
handle('window:show', () => { if (win) { win.show(); win.focus(); } return true; });

// ---------- menu ----------
function buildMenu(extra = []) {
  const template = [
    { label: manifest.name, submenu: [
      { role: 'about' }, { type: 'separator' },
      { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
      { type: 'separator' }, { role: 'quit' },
    ] },
    ...extra,
    { role: 'editMenu' },
    { label: 'View', submenu: [
      { role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' },
      { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
      { type: 'separator' }, { role: 'togglefullscreen' },
    ] },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---------- boot ----------
app.whenReady().then(() => {
  protocol.handle('bama-media', serveMedia);
  createWindow();
  const ctx = {
    app, win: () => win, ipcMain, handle, store, manifest, appDir: APP_DIR,
    globalShortcut, buildMenu,
    send: (channel, ...args) => win && !win.isDestroyed() && win.webContents.send(channel, ...args),
  };
  buildMenu();
  const appMain = path.join(APP_DIR, 'main.js');
  if (fs.existsSync(appMain)) require(appMain)(ctx);

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); else win.show(); });
});

app.on('will-quit', () => { globalShortcut.unregisterAll(); store.flush(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin' || !manifest.keepAlive) app.quit(); });
