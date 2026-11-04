// The only doorway between an app's page and the Mac.
// Pages call window.bama.invoke('channel', ...args) and listen with window.bama.on.
const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('bama', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, fn) => {
    const listener = (_e, ...args) => fn(...args);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  // File drag-and-drop: Electron 32+ removed File.path, so expose the helper.
  pathFor: (file) => {
    try { return webUtils.getPathForFile(file); } catch (_) { return file && file.path; }
  },
  isNative: true,
});
