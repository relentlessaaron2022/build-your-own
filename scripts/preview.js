#!/usr/bin/env node
// Browser preview: serves every app's page with a stand-in bridge.
// Good for design work and UI tests. Mac powers (files, hotkeys, ffmpeg) need `npm start <app>`.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT || process.argv[2] || 4747);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };

function listApps() {
  return fs.readdirSync(path.join(ROOT, 'apps'))
    .filter((d) => fs.existsSync(path.join(ROOT, 'apps', d, 'app.json')))
    .map((d) => ({ id: d, ...JSON.parse(fs.readFileSync(path.join(ROOT, 'apps', d, 'app.json'), 'utf8')) }));
}

function home() {
  const cards = listApps().map((a) => `<a class="card" href="/apps/${a.id}/index.html"><h3>${a.name}</h3><p>${a.tagline || ''}</p><code>npm start ${a.id}</code></a>`).join('');
  return `<!doctype html><meta charset="utf-8"><title>BAMA Preview</title><link rel="stylesheet" href="/kit/bama.css">
<style>body{overflow:auto;padding:40px}main{max-width:960px;margin:auto}h1{font-size:28px;margin:0 0 4px}h1 b{color:var(--accent)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-top:24px}.card{text-decoration:none;color:inherit;display:block}
.card:hover{border-color:var(--accent)}.card h3{margin:0 0 6px}.card p{color:var(--text-2);margin:0 0 10px}code{font:12px var(--mono);color:var(--text-3)}</style>
<main><h1>BA<b>MA</b> · Build Any Mac App</h1><p class="muted">Browser preview of every app in the suite. Native features are stubbed here.</p><div class="grid">${cards}</div></main>`;
}

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/' || url === '/index.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(home()); }
  const file = path.normalize(path.join(ROOT, url));
  if (!file.startsWith(ROOT) || file.includes(`${path.sep}.git`)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`BAMA preview → http://localhost:${PORT}`));
