# Handoff: Built Different (for the session running on the Mac)

Repo: `relentlessaaron2022/build-your-own`, branch `claude/install-skill-repos-sa9cbv`.
Local working folder on the Mac: `~/Desktop/AI EDITOR` with `RAW/` (source media), `REFERENCES/` (inspiration), `DONE/` (finished videos go here).

## The brand and the rules
- Series: **BUILT DIFFERENT**. Every film ends "Produced by Relentless Aaron."
- Style: Halftone Dossier (case files, exhibits, stamps, halftone dots), 16:9 plus 9:16 vertical, Kokoro voice `am_onyx` at 0.95.
- Facts: verified only, with a RESEARCH.md table per episode. If sources disagree, leave it out.
- Living people: drawn silhouettes only. No footage, no likeness, no implied endorsement; a non-affiliation line in CREDITS.
- Size: each full film under 100 MB (re-encode two-pass if over). No part 1/part 2 split needed.
- Writing: calm, precise voice; no AI-tell words.

## Done (all in `documentaries/`)
| # | Episode | Folder |
|---|---|---|
| 1 | The Cliff File (mountain goats) | `goat-cliffs/` |
| 2 | The Honeybee File | `bee-kingdom/` |
| 3 | The Ant Kingdom (dossier cut) | `ant-dossier/` |
| 4 | The 17-Minute Breath (David Blaine) | `blaine-breath/` |

Tracker sheet (Google Drive, folder "Built Different"): https://docs.google.com/spreadsheets/d/1W0f_Cyphyc_385UmCuGXrsD7DE10BRXsWXVD9aODo1c/edit
On completion of each episode: update the sheet row, email the owner a short note with both links.

## Next up (episodes 5–20)
5 Steph Curry · 6 Octopus · 7 Bajau sea nomads · 8 Peregrine falcon · 9 Alex Honnold · 10 Tardigrade · 11 Daniel Kish · 12 Mantis shrimp · 13 Tibetan highlanders · 14 Wood frog · 15 Usain Bolt · 16 Arctic tern · 17 Stephen Wiltshire · 18 Immortal jellyfish · 19 Wim Hof · 20 Axolotl

## How an episode is built
1. Research → `RESEARCH.md`; script → `script.txt` (~450–500 words).
2. Voice: Kokoro (`github-report/money-series/tools/voice.py`, then `words.py` for word timings).
3. Scenes: copy `blaine-breath/` as the template (`scenes-film.js` = characters/props, `scenes-build.js` = scenes); assemble `index.html` the same way.
4. `build.sh` (16:9) then `build-v.sh` (9:16), using the Lemo-Opuscar library (`lemo-opuscar` skill sets it up).
5. Check stills, fix overlaps, check sizes, commit, push, copy both mp4s into `~/Desktop/AI EDITOR/DONE/`.

## Other open items
- Music video idea: the owner's own song + lyrics, with the lyrics building an object (book, skyline, cell door, vault), 9:16 + 16:9. Waiting on the audio file and lyrics (they can go in `RAW/`).
- The Drive connector can't upload files over 10 MB, so the tracker links point to GitHub.
- vidIQ is out of credits (2 left).
