// {{NAME}} — the Mac side. Runs in Node with full access to files, shell and system.
// Add a handler here, then call it from renderer.js with invoke('{{ID}}:name', ...args).
const os = require('os');

module.exports = function app({ handle, send, store, win }) {
  handle('{{ID}}:hello', (who) => `Hello ${who}, from ${os.hostname()} · macOS ${os.release()}`);
};
