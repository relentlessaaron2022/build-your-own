// doc.mjs — write SCRIPTS.md: monologues, timed visual plans and source notes, from the same data the videos use.
import fs from 'fs'; import { STORIES } from '../stories.js';
const SRC = JSON.parse(fs.readFileSync(new URL('./sources.json', import.meta.url)));
const TITLE = 3.6, GAP = .45, fmt = s => `${Math.floor(s / 60)}:${String((s % 60).toFixed(1)).padStart(4, '0')}`;
const DESC = sc => ({ sketch: () => `Pen & wash sketch (${sc.place}); note “${sc.note}”; SKETCH tag`, name: () => `Name card: ${sc.name} — ${sc.caption}`, big: () => `Big type: ${sc.big.join(' ')} — ${sc.small}${sc.stamp ? `; stamp ${sc.stamp}` : ''}`,
  claim: () => `Family-account card (${sc.who}): ${sc.lines.join(' ')}`, questions: () => `Open questions: ${sc.items.join(' / ')}`, list: () => `List: ${sc.items.join(' / ')}${sc.stamp ? `; stamp ${sc.stamp}` : ''}`,
  commentary: () => `Commentary type: ${sc.lines.join(' ')}`, hotline: () => `Hotline card: ${sc.label} ${sc.number}`, signoff: () => 'Spy cut-paper sign-off: THIS IS RELENTLESS TIMES' })[sc.type]();
let md = '# Relentless Times — five one-minute reports\n\nOriginal monologues, timed visual plans and source notes. Facts checked October 31, 2026; allegations and family accounts are labeled as such. Voice: AI (Kokoro `am_michael`), no music. Format: vertical 1080×1920, 30 fps.\n';
for (const [k, s] of Object.entries(STORIES)) {
  const dur = JSON.parse(fs.readFileSync(new URL(`../vo/${k}/dur.json`, import.meta.url))); let t = TITLE;
  md += `\n---\n\n## ${s.title.join(' ')} · ${s.place} · ${s.date}\n\n### Monologue\n\n${s.lines.map(l => l.text).join('\n\n')}\n\n### Timed visual plan\n\n| Time | Shows | Strap tab · headline | Source |\n|---|---|---|---|\n| 0:00.0 | Spy cut-paper title: ${s.title.join(' / ')} | — | — |\n`;
  s.lines.forEach((l, i) => { const d = dur['l' + String(i).padStart(2, '0')]; md += `| ${fmt(t)} | ${DESC(l.scene)} | ${l.tab ? `${l.tab} · ${l.hl}` : '—'} | ${l.src || '—'} |\n`; t += d + GAP; });
  md += `\nLength ≈ ${fmt(t + 1.75)}.\n\n### Source notes\n\n${SRC[k].sources.map(([a, u]) => `- [${a}](${u})`).join('\n')}\n\nVerification:\n${SRC[k].notes.map(n => `- ${n}`).join('\n')}\n`;
}
fs.writeFileSync(new URL('../SCRIPTS.md', import.meta.url), md); console.log('SCRIPTS.md', md.length, 'chars');
