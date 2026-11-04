#!/usr/bin/env node
// npm run build <app>      — package one app as a Mac .app inside a .dmg and .zip
// npm run build:all        — package every app
// Options: --arch=x64 | arm64 | universal   (default builds the Mac you are on)
//          --dir           just the .app folder, no dmg (faster)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const flag = (k) => { const a = args.find((x) => x.startsWith(`--${k}`)); return a ? (a.split('=')[1] || true) : null; };
const all = fs.readdirSync(path.join(ROOT, 'apps')).filter((d) => fs.existsSync(path.join(ROOT, 'apps', d, 'app.json')));
const ids = flag('all') ? all : args.filter((a) => !a.startsWith('--'));

if (!ids.length || ids.some((i) => !all.includes(i))) {
  console.log(`Usage: npm run build <app> [--arch=x64|arm64|universal] [--dir]\nApps: ${all.join(', ')}`);
  process.exit(1);
}
if (process.platform !== 'darwin') console.warn('Note: Mac packages build best on a Mac. Other systems can only make the --dir .app folder.\n');

// Only bundle the heavy modules into the apps that use them.
const HEAVY = { 'monaco-editor': ['forge'], '@anthropic-ai/sdk': ['forge'], 'ffmpeg-static': ['cutroom'], 'ffprobe-static': ['cutroom'] };

async function buildOne(id) {
  const builder = require('electron-builder');
  const { Platform, Arch } = builder;
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps', id, 'app.json'), 'utf8'));
  const exclude = Object.entries(HEAVY).filter(([, users]) => !users.includes(id)).map(([mod]) => `!node_modules/${mod}/**`);
  const icon = path.join(ROOT, 'apps', id, 'icon.png');
  const archFlag = flag('arch');
  const arch = archFlag === 'universal' ? [Arch.universal] : archFlag === 'arm64' ? [Arch.arm64] : archFlag === 'x64' ? [Arch.x64] : [process.arch === 'arm64' ? Arch.arm64 : Arch.x64];
  const targets = flag('dir') ? ['dir'] : ['dmg', 'zip'];

  console.log(`\n▶ Building ${m.name} (${targets.join(', ')}, ${arch.map((a) => Arch[a]).join(', ')})`);
  await builder.build({
    targets: Platform.MAC.createTarget(targets, ...arch),
    config: {
      appId: m.bundleId || `com.relentless.${id}`,
      productName: m.name,
      copyright: `© ${new Date().getFullYear()} Relentless`,
      directories: { output: path.join('dist', id), buildResources: path.join('apps', id) },
      files: ['package.json', 'shell/**', 'kit/**', `apps/${id}/**`, ...exclude, '!**/*.map', '!tests/**', '!templates/**', '!scripts/**'],
      asarUnpack: ['node_modules/ffmpeg-static/**', 'node_modules/ffprobe-static/**'],
      extraMetadata: { bamaApp: id, name: id, productName: m.name, main: 'shell/main.js' },
      mac: {
        icon: fs.existsSync(icon) ? icon : undefined,
        category: 'public.app-category.productivity',
        hardenedRuntime: false,
        gatekeeperAssess: false,
        identity: process.env.CSC_NAME || process.env.CSC_LINK ? undefined : null, // unsigned unless you set up a Developer ID
        extendInfo: {
          NSAppleEventsUsageDescription: `${m.name} uses System Events to automate apps you choose.`,
          NSDesktopFolderUsageDescription: `${m.name} works with files you pick on your Desktop.`,
          NSDocumentsFolderUsageDescription: `${m.name} works with files you pick in Documents.`,
          NSDownloadsFolderUsageDescription: `${m.name} works with files you pick in Downloads.`,
          LSApplicationCategoryType: 'public.app-category.productivity',
        },
      },
      dmg: { title: m.name },
    },
  });
  console.log(`✓ ${m.name} → dist/${id}/`);
}

(async () => {
  for (const id of ids) {
    try { await buildOne(id); } catch (e) { console.error(`✗ ${id}: ${e.message}`); process.exitCode = 1; }
  }
})();
