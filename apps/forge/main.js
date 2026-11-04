// Forge main process: project files, a run panel, search, and Claude.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { safeStorage } = require('electron');
const Anthropic = require('@anthropic-ai/sdk').default;

const IGNORE = new Set(['node_modules', '.git', '.DS_Store', 'dist', 'build', '.next', '.cache', '__pycache__', '.venv', 'venv', '.turbo', 'coverage', 'DerivedData', 'Pods']);
const MODEL = 'claude-opus-5-5';

module.exports = function forge({ handle, send, store }) {
  // ---------- files ----------
  handle('forge:list', (dir) => fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => !IGNORE.has(d.name) && !(d.name.startsWith('.') && d.name !== '.env.example' && d.name !== '.gitignore'))
    .map((d) => ({ name: d.name, path: path.join(dir, d.name), dir: d.isDirectory() }))
    .sort((a, b) => (b.dir - a.dir) || a.name.localeCompare(b.name)));
  handle('forge:read', (p) => {
    const st = fs.statSync(p);
    if (st.size > 5 * 1024 * 1024) throw new Error('File is larger than 5 MB');
    const buf = fs.readFileSync(p);
    if (buf.subarray(0, 8000).includes(0)) throw new Error('Binary file');
    return buf.toString('utf8');
  });
  handle('forge:write', (p, text) => { fs.writeFileSync(p, text); return true; });
  handle('forge:create', (p, isDir) => {
    if (fs.existsSync(p)) throw new Error('Already exists');
    if (isDir) fs.mkdirSync(p, { recursive: true }); else { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, ''); }
    return true;
  });
  handle('forge:rename', (from, to) => { fs.renameSync(from, to); return true; });
  handle('forge:trash', async (p) => { await require('electron').shell.trashItem(p); return true; });

  // every file under the project, for quick-open and AI context
  function walk(root, limit = 5000) {
    const out = [];
    const go = (dir) => {
      if (out.length >= limit) return;
      let ents = [];
      try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
      for (const d of ents) {
        if (IGNORE.has(d.name) || d.name.startsWith('.')) continue;
        const p = path.join(dir, d.name);
        if (d.isDirectory()) go(p); else out.push(p);
        if (out.length >= limit) return;
      }
    };
    go(root);
    return out;
  }
  handle('forge:files', (root) => walk(root).map((p) => path.relative(root, p)));
  handle('forge:search', (root, query, { regex = false, caseSensitive = false } = {}) => {
    if (!query) return [];
    let re;
    try { re = new RegExp(regex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi'); }
    catch (e) { throw new Error('Bad pattern: ' + e.message); }
    const hits = [];
    for (const p of walk(root)) {
      let text;
      try { if (fs.statSync(p).size > 1024 * 1024) continue; text = fs.readFileSync(p, 'utf8'); } catch (_) { continue; }
      if (text.includes('\u0000')) continue;
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        re.lastIndex = 0;
        if (re.test(lines[i])) { hits.push({ file: path.relative(root, p), line: i + 1, text: lines[i].trim().slice(0, 200) }); if (hits.length >= 500) return hits; }
      }
    }
    return hits;
  });

  // ---------- run panel ----------
  const procs = new Map();
  handle('forge:run', (id, cmd, cwd) => {
    const shell = process.env.SHELL || '/bin/zsh';
    const p = spawn(shell, ['-lc', cmd], { cwd, env: { ...process.env, FORCE_COLOR: '0' } });
    procs.set(id, p);
    p.stdout.on('data', (d) => send('forge:out', id, String(d)));
    p.stderr.on('data', (d) => send('forge:out', id, String(d)));
    p.on('close', (code) => { procs.delete(id); send('forge:exit', id, code); });
    p.on('error', (e) => send('forge:out', id, `\n${e.message}\n`));
    return true;
  });
  handle('forge:kill', (id) => { const p = procs.get(id); if (p) p.kill('SIGTERM'); return true; });

  // ---------- Claude ----------
  // The API key is encrypted with the macOS keychain via safeStorage.
  const getKey = () => {
    if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
    const enc = store.get('apiKeyEnc');
    if (!enc) return null;
    try { return safeStorage.decryptString(Buffer.from(enc, 'base64')); } catch (_) { return null; }
  };
  handle('forge:hasKey', () => !!getKey());
  handle('forge:setKey', (key) => {
    if (!key) { store.set('apiKeyEnc', null); return true; }
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Keychain encryption is not available');
    store.set('apiKeyEnc', safeStorage.encryptString(key.trim()).toString('base64'));
    return true;
  });

  const streams = new Map();
  handle('forge:ai', async (id, { system, messages, effort = 'high' }) => {
    const apiKey = getKey();
    if (!apiKey) throw new Error('Add your Anthropic API key in Forge settings first');
    const client = new Anthropic({ apiKey });
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      system,
      messages,
      thinking: { type: 'adaptive' },
      output_config: { effort },
      // If a safety classifier declines, the API retries on a recommended model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
    streams.set(id, stream);
    stream.on('text', (text) => send('forge:ai:delta', id, text));
    try {
      const final = await stream.finalMessage();
      return { stop_reason: final.stop_reason, usage: final.usage };
    } catch (err) {
      if (err instanceof Anthropic.APIUserAbortError) return { stop_reason: 'aborted' };
      if (err instanceof Anthropic.AuthenticationError) throw new Error('That API key was rejected. Check it in settings.');
      if (err instanceof Anthropic.RateLimitError) throw new Error('Rate limited. Wait a moment and try again.');
      if (err instanceof Anthropic.APIConnectionError) throw new Error('Could not reach the Anthropic API. Check your connection.');
      if (err instanceof Anthropic.APIError) throw new Error(`API error ${err.status}: ${err.message}`);
      throw err;
    } finally {
      streams.delete(id);
    }
  });
  handle('forge:ai:abort', (id) => { const s = streams.get(id); if (s) s.abort(); return true; });
};
