#!/usr/bin/env node
// npm start <app>   — launch one BAMA app in Electron.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const apps = fs.readdirSync(path.join(ROOT, 'apps')).filter((d) => fs.existsSync(path.join(ROOT, 'apps', d, 'app.json')));
const id = process.argv[2];

if (!id || !apps.includes(id)) {
  console.log(`\nUsage: npm start <app>\n\nApps:\n${apps.map((a) => {
    const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps', a, 'app.json'), 'utf8'));
    return `  ${a.padEnd(12)} ${m.tagline || ''}`;
  }).join('\n')}\n`);
  process.exit(id ? 1 : 0);
}

let electron;
try { electron = require('electron'); } catch (_) { electron = null; }
if (!electron || typeof electron !== 'string' || !fs.existsSync(electron)) {
  console.error('Electron is not installed yet. Run:  npm install');
  process.exit(1);
}
const child = spawn(electron, [ROOT, `--bama-app=${id}`], { stdio: 'inherit', env: { ...process.env, BAMA_APP: id } });
child.on('close', (code) => process.exit(code || 0));
