#!/usr/bin/env node
// Optional: regenerate apps/<id>/icon.png (1024×1024) for every app.
// Needs Playwright (npx playwright install chromium). The build uses these PNGs.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const LOOK = {
  summon: { a: '#f97316', b: '#7c2d12', glyph: 'bolt' },
  manuscript: { a: '#fde68a', b: '#92400e', glyph: 'pen' },
  cutroom: { a: '#fb7185', b: '#4c0519', glyph: 'film' },
  forge: { a: '#60a5fa', b: '#1e1b4b', glyph: 'code' },
  relay: { a: '#4ade80', b: '#064e3b', glyph: 'flow' },
};
const GLYPHS = {
  bolt: '<path d="M560 150 L330 560 H500 L450 874 L700 430 H530 Z" fill="#fff"/>',
  pen: '<path d="M300 760 L340 600 L640 300 L724 384 L424 684 Z" fill="#fff"/><path d="M660 280 L700 240 Q720 220 744 244 L784 284 Q808 308 788 328 L748 368 Z" fill="#fff" opacity=".85"/><rect x="290" y="790" width="440" height="34" rx="17" fill="#fff" opacity=".7"/>',
  film: '<rect x="250" y="300" width="524" height="424" rx="40" fill="none" stroke="#fff" stroke-width="44"/><path d="M460 420 L620 512 L460 604 Z" fill="#fff"/><g fill="#fff">' + [0, 1, 2, 3].map((i) => `<rect x="${300 + i * 120}" y="236" width="60" height="44" rx="10"/><rect x="${300 + i * 120}" y="744" width="60" height="44" rx="10"/>`).join('') + '</g>',
  code: '<path d="M420 330 L260 512 L420 694" fill="none" stroke="#fff" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/><path d="M604 330 L764 512 L604 694" fill="none" stroke="#fff" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/><path d="M560 280 L464 744" stroke="#fff" stroke-width="44" stroke-linecap="round" opacity=".8"/>',
  flow: '<circle cx="330" cy="360" r="78" fill="#fff"/><circle cx="694" cy="512" r="78" fill="#fff"/><circle cx="330" cy="664" r="78" fill="#fff"/><path d="M400 390 L620 480 M400 634 L620 544" stroke="#fff" stroke-width="40" stroke-linecap="round"/>',
  spark: '<path d="M512 230 L580 444 L794 512 L580 580 L512 794 L444 580 L230 512 L444 444 Z" fill="#fff"/>',
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
  const apps = fs.readdirSync(path.join(ROOT, 'apps')).filter((d) => fs.existsSync(path.join(ROOT, 'apps', d, 'app.json')));
  for (const id of apps) {
    const look = LOOK[id] || { a: '#a78bfa', b: '#2e1065', glyph: 'spark' };
    // macOS icon grid: 824px rounded square centered on a 1024 canvas
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${look.a}"/><stop offset="1" stop-color="${look.b}"/></linearGradient>
      <filter id="s" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="14" stdDeviation="18" flood-opacity=".28"/></filter></defs>
      <rect x="100" y="100" width="824" height="824" rx="185" fill="url(#g)" filter="url(#s)"/>
      <rect x="100" y="100" width="824" height="412" rx="185" fill="#fff" opacity=".08"/>
      <g transform="translate(512 512) scale(.78) translate(-512 -512)">${GLYPHS[look.glyph]}</g></svg>`;
    await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
    await page.screenshot({ path: path.join(ROOT, 'apps', id, 'icon.png'), omitBackground: true, clip: { x: 0, y: 0, width: 1024, height: 1024 } });
    console.log('icon:', id);
  }
  await browser.close();
})();
