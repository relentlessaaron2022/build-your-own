// Fonts for the English Halftone Dossier (Google Fonts, all SIL OFL 1.1) → fonts/ + fonts.css
import fs from 'fs';
const get = async (u, o) => { const r = await fetch(u, o); if (!r.ok) throw new Error(`${u}: HTTP ${r.status}`); return r; };
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const fams = ['Alfa+Slab+One', 'Bagel+Fat+One', 'JetBrains+Mono:wght@800', 'Archivo+Black', 'Chewy'];
let out = '', n = 0; fs.mkdirSync('fonts', { recursive: true });
for (const f of fams) {
  let css = await (await get(`https://fonts.googleapis.com/css2?family=${f}&display=block`, { headers: { 'User-Agent': UA } })).text();
  const urls = [...new Set(css.match(/https:\/\/[^)]+\.woff2/g) || [])];
  for (const u of urls) { const name = `f${n++}.woff2`; fs.writeFileSync('fonts/' + name, Buffer.from(await (await get(u)).arrayBuffer())); css = css.split(u).join('fonts/' + name); }
  out += css; console.log(f, urls.length);
}
fs.writeFileSync('fonts.css', out);
