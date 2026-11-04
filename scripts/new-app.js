#!/usr/bin/env node
// npm run new "My App" -- "What it does in one line"
// Scaffolds apps/<id>/ from templates/starter.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const name = process.argv[2];
const tagline = process.argv[3] || 'Built with BAMA.';
if (!name) {
  console.log('Usage: npm run new "App Name" -- "One-line description"');
  process.exit(1);
}
const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
if (!id) { console.error('Pick a name with letters or numbers in it.'); process.exit(1); }
const dest = path.join(ROOT, 'apps', id);
if (fs.existsSync(dest)) { console.error(`apps/${id} already exists.`); process.exit(1); }

const src = path.join(ROOT, 'templates', 'starter');
fs.mkdirSync(dest, { recursive: true });
for (const file of fs.readdirSync(src)) {
  const text = fs.readFileSync(path.join(src, file), 'utf8')
    .replace(/\{\{NAME\}\}/g, name)
    .replace(/\{\{ID\}\}/g, id)
    .replace(/\{\{TAGLINE\}\}/g, tagline.replace(/"/g, '\\"'));
  fs.writeFileSync(path.join(dest, file), text);
}
console.log(`
Created apps/${id}/

  app.json      name, window size, bundle id
  index.html    the layout
  renderer.js   what happens on screen
  main.js       Mac-side powers (files, shell, system)

Run it:      npm start ${id}
Package it:  npm run build ${id}
`);
