# Handoff: The Relentless Elders Collection

**Repository:** `relentlessaaron2022/build-your-own`, branch `claude/elder-clipart-bundles-wo345d`, folder `elder-collection/`
**Status as of this handoff:** Editions 1 and 2 are written, laid out and packaged for Etsy and Amazon KDP. **No art exists yet.** Every image spot is a labeled placeholder. Editions 3–10 have a theme and shot list but no manuscript.

---

## 1. What we're building

10 editions × 3 books = **30 products**, all from one bank of art.

| Book | What the buyer gets | Sold on |
|---|---|---|
| 1. Clipart Bundle | 250 transparent PNGs (ZIP via Google Drive) + catalog PDF with craft ideas and license | Etsy |
| 2. Coloring Book | 250 line drawings, 6 per page, blank backs, ~100 pages | Amazon KDP paperback (B&W) + Etsy PDF |
| 3. Story Book | Cast spread, intro, 10 stories, 100 captioned color illustrations, closing, journal pages, 80 pages | Amazon KDP paperback (standard color) + Etsy PDF |

**Edge over competitors:** they sell 27–28 images per bundle. We sell 250, and the same 16 named characters run through all 30 books, so customers collect a cast, not just a set of images.

**The 10 editions:** 1 Elder Wisdom · 2 No Filter · 3 Elder Activities · 4 Elders Who Care · 5 Elder Joy · 6 Still Courting · 7 Sunday Best · 8 The Kitchen Table · 9 Sunday Morning · 10 Roots and Legacy. The first five are the client's themes. Editions 6–10 were proposed and approved ("I trust the themes").

---

## 2. Status board

| Item | Ed 1 | Ed 2 | Ed 3–10 |
|---|---|---|---|
| Theme + 250-image shot list | ✅ | ✅ | ✅ |
| Story manuscript (10 stories, 100 captions, cover copy) | ✅ ~7,900 words | ✅ ~7,700 words | ❌ |
| Etsy + KDP listing copy | ✅ | ✅ | ❌ |
| Layout proofs (placeholders) | ✅ | ✅ | can build anytime |
| KDP cover wraps | ✅ proof | ✅ proof | can build anytime |
| Cast reference sheets (16) | ❌ | ❌ | shared, done once |
| Color art (250) | ❌ | ❌ | ❌ |
| Line art (250) | ❌ | ❌ | ❌ |
| Relentless's personal lines | ❌ 2 spots | ❌ 2 spots | — |
| Google Drive link | ❌ | ❌ | — |
| Uploaded to Etsy / KDP | ❌ | ❌ | ❌ |

---

## 3. Open items, in order

| # | Task | Owner | Notes |
|---|---|---|---|
| 1 | Generate 16 cast reference sheets, review and re-roll until each elder looks right | Relentless (or Claude with an OpenAI key) | `python tools/generate_images.py --refs`. Everything after this depends on these looking right. |
| 2 | Test batch: 10 images of Edition 1 | same | `--edition 1 --limit 10`. Check the style before spending on all of them. |
| 3 | Full art for Editions 1 and 2 (500 color + 500 line art) | same | About $200–260 at high quality. Resumable: stop and restart anytime. |
| 4 | **Spell-check all 40 word-art images** | Relentless | AI misspells lettering. Delete the bad PNG and rerun to redraw it. |
| 5 | Replace the 4 `[Relentless: ...]` notes with real words | **Relentless only** | `manuscripts/01-elder-wisdom.md` lines 32 and 478; `manuscripts/02-no-filter.md` lines 28 and 474. A real memory of an elder, plus a sign-off. **Don't invent these.** |
| 6 | Upload `dist/NN-*/google-drive/` to Drive, share "anyone with link", paste the link into `editions/NN-*.json` under `"links": {"clipart_drive": "..."}` | Relentless | Then rerun `package.py`. The Etsy download button is dead until this is done. |
| 7 | Rebuild and package | anyone | `python tools/build_books.py 1 2 && python tools/package.py 1 2`. `dist/NN-*/CHECKLIST.txt` should show all PASS. |
| 8 | Upload to KDP and Etsy | Relentless | Follow `publishing/PUBLISHING.md`. Page through KDP's Previewer before publishing. |
| 9 | Editions 3–10: manuscripts + listings | Claude | Same format as 1 and 2. See section 7. |

---

## 4. Where everything lives

```
elder-collection/
  HANDOFF.md                 this file
  README.md                  overview + run commands
  style/cast.json            the 16 elders: locked look, bio, couples. Single source of truth for characters.
  style/STYLE_LOCK.md        art direction carried by every prompt
  style/fonts/               Lora, Fraunces, Work Sans, Caveat Brush (all SIL Open Font License)
  editions/NN-*.json         per edition: titles, 24 solo actions, 12 pair actions, 10 group scenes,
                             40 props, 20 word-art phrases, 10 chapter titles, (later) Drive link
  manuscripts/NN-*.md        story book text + which 10 images go in each chapter, with captions
  publishing/PUBLISHING.md   platform rules and step-by-step upload guide
  publishing/listings/NN-*.md  Etsy titles/tags/descriptions, KDP titles/subtitles/keywords/categories, prices
  tools/build_prompts.py     editions + cast -> output/NN-*/prompts.jsonl/.csv (2,500 prompts)
  tools/generate_images.py   OpenAI: --refs, --edition N, --lineart, --limit, --only
  tools/build_books.py       -> 3 books per edition, print (300 DPI) + digital (compressed)
  tools/package.py           -> dist/NN-*/ with amazon-kdp/, etsy/, google-drive/, CHECKLIST.txt
  proofs/                    current placeholder proofs for Eds 1–2 + KDP cover proofs
  output/                    shot lists (in git); images, PDFs, caches (NOT in git, back up to Drive)
  dist/                      upload-ready packages (NOT in git, regenerate anytime)
```

**Not in git, on purpose:** images (several hundred MB per edition), built PDFs, `dist/`, and `style/refs/`. Back these up to Google Drive. The cloud session that built this is temporary, so generated art must be saved off the machine.

---

## 5. How to run it

```bash
cd elder-collection
pip install openai pillow reportlab pypdf
export OPENAI_API_KEY=sk-...          # optional: OPENAI_IMAGE_MODEL, OPENAI_IMAGE_QUALITY=medium for tests

python tools/build_prompts.py                          # rebuild shot lists after editing editions/ or cast.json
python tools/generate_images.py --refs                 # 16 cast sheets -> style/refs/
python tools/generate_images.py --edition 1 --limit 10 # test
python tools/generate_images.py --edition 1            # 250 color
python tools/generate_images.py --edition 1 --lineart  # 250 coloring versions, drawn from the color art
python tools/build_books.py 1 2                        # print + digital PDFs
python tools/package.py 1 2                            # dist/ folders + CHECKLIST.txt
```

**Using art made by hand in ChatGPT instead:** name each file by its ID (`E01-004.png`) and drop it into `output/01-elder-wisdom/images/color/` (or `lineart/`). The prompts are in `prompts.csv`.

**Warning:** rerunning `build_prompts.py` after changing the action lists, cast order or the Walter rule can reassign which elder is in which image ID. The manuscript captions name specific elders per ID. If you change the shot list for Editions 1–2, re-check captions with the validation in section 8.

---

## 6. Decisions made, and why

| Decision | Why |
|---|---|
| One cast of 16 across all 30 books | Brand recognition and consistency. Each elder gets a reference sheet, and every image is generated as an edit of it. |
| Original characters, not copies of the sample bundle | The sample was a genre reference. Copying it would invite takedowns. |
| Line art made *from* the color image | So each coloring page matches its clipart. Writing a separate prompt drifts. |
| Story book uses 100 curated images, not 250 | Client felt 143 pages was heavy. 80 pages keeps color printing cost down, and the images fit their chapters. |
| 80 pages exactly | KDP allows spine text only above 79 pages. The "Meet the Elders" spread got us there and helps the brand. |
| Coloring pages single-sided | The top complaint in coloring-book reviews is marker bleed-through. |
| Clipart delivered via Google Drive | Etsy caps digital files at 5 per listing and 20 MB each. 250 PNGs are hundreds of MB. Standard practice. |
| Print and digital versions of each book | KDP wants 300 DPI. Etsy needs files under 20 MB. Stress-tested with 500 full-size images: Etsy PDFs 2–5 MB, KDP interiors ≤12 MB. |
| Fonts embedded, Open Font License | KDP rejects PDFs with non-embedded fonts. The license allows commercial use. |
| Brother Walter always drawn seated | He's a wheelchair user. The generator never gives him standing-only actions. |
| Fictional neighborhood (Calloway Street, Greater Hope Missionary Baptist) | Stories can be vivid without fabricating anything about real people. |
| Bracketed spots for Relentless's own memories | Biographical truth is non-negotiable. Nothing personal was invented. |
| "Illustrations created with AI tools" line on copyright pages and Etsy listings | Honesty, plus Etsy's disclosure expectations. |

---

## 7. Writing Editions 3–10 (for whoever picks this up)

**Format:** copy `manuscripts/01-elder-wisdom.md`. The sections are `# Back Cover`, `# Dedication`, `# Introduction`, `# Chapter 1`…`# Chapter 10`, `# Closing`. Each chapter is prose (~550–700 words), then a block of exactly 10 lines `ENN-xxx: caption`. That block becomes the chapter's gallery.

**Picking images:** chapter titles are in `editions/NN-*.json`. Pick 10 image IDs per chapter from `output/NN-*/prompts.csv` that fit the chapter, 100 unique per book. Name an elder in a caption only if that elder is in that image.

**Continuity bible** (keep consistent across books):
- Ages in 2026 are in `cast.json` bios. Couples: Pops & Mavis (54 yrs), Booker & Lula Mae (66 yrs, married 1960), Otis & Pearl (51 yrs), Jasper & Hattie, Reggie & Vivian (30 yrs), Clarence was married to Denise (passed 2019).
- Places: Calloway Street, Aunt Birdie's porch and rocking chair (built by Booker, 1972), the community garden on the old burned lot (2000), Greater Hope Missionary Baptist (Booker and Gloria, 4th pew left since 1964), youth center on Twelfth Street (Clarence), Kroger on Fifth, Miller's Pond.
- Recurring threads: Pops's pocket notebook (1974), Birdie's pencil and Toya, Lula Mae's letters in a cookie tin, the thermostat war, Wednesday-night faith debates, Friday spades at Otis's.
- Each closing teases the next edition. Edition 2's closing points to Edition 3 ("they're getting up off the porch").

**Voice rules (client's):** calm and precise, specific detail, mixed sentence length, light slang, emotion before information, ending with hope and a next step. Avoid: however, moreover, indeed, delve, tapestry, testament, vibrant, realm, landscape, seamless, robust, utilize, embark, underscore, "in conclusion", "it's important to note". Never fabricate Relentless's biography. **Keep a certain former president's name out of everything.**

**Listings:** copy `publishing/listings/01-elder-wisdom.md`. Etsy titles must be 140 characters or fewer, with 13 tags of up to 20 characters each.

---

## 8. Quality checks before release

```bash
# Manuscript: 10 chapters, 100 unique valid image IDs, no banned words, names match images
python3 - <<'E'
import sys, re, json; sys.path.insert(0, 'tools'); import build_books as b
n = 1  # edition
ms = b.parse_manuscript(n); spec, d, items = b.load_edition(n); ids = {i['id']: i for i in items}
pics = [p for c in ms['pictures'].values() for p, _ in c]
print(len(ms['chapters']), len(pics), len(set(pics)), [p for p in pics if p not in ids])
E
pdffonts dist/01-elder-wisdom/amazon-kdp/story-book/interior.pdf   # "emb" column must be all "yes"
cat dist/01-elder-wisdom/CHECKLIST.txt                              # everything PASS
```

Then by eye: every word-art spelling, every cast sheet, a printed test page of the coloring book, and KDP's online Previewer.

---

## 9. Platform facts to re-verify on launch day

These were correct to the best of our knowledge when built. Platforms change them.
- **Etsy:** 5 files per digital listing, 20 MB each. Listing photos 3000 × 2250 recommended. 13 tags, 20 characters each. Disclose AI use.
- **KDP paperback:** interior up to 650 MB. 24–828 pages (B&W). Standard color has a minimum page count, around 72. No-bleed margins: 0.25 in outside, 0.375–0.5 in gutter (we use 0.6 in all around). Spine 0.002252 in per page on white paper. Spine text above 79 pages. Barcode area bottom-right of the back cover, which is left clear. **AI disclosure is required:** the images are AI-generated, and the text counts as AI-generated under KDP's definition unless Relentless rewrites it.
- **Copyright:** purely AI-generated images generally can't be registered in the US. The clipart license is enforceable as a contract. The real moat is the named cast and the stories.

---

## 10. Costs

| Item | Estimate |
|---|---|
| Cast reference sheets (16, plus re-rolls) | $5–15 |
| Art per edition (250 color + 250 line art, high quality) | ~$100–130 |
| Editions 1–2 | ~$200–260 |
| All 10 | ~$1,000–1,300 (about a quarter of that at medium quality) |
| KDP, Etsy | KDP free (free ISBN). Etsy $0.20 per listing plus fees per sale. |

Starting prices (test and adjust; listing files have more detail): clipart $9.99 launch / $14.99 regular · coloring PDF $5.99 · KDP coloring paperback $11.99–12.99 · story paperback priced after KDP shows the color printing cost (aim for a $3+ royalty) · three-book Etsy bundle $16.99.

---

## 11. Resuming in a new Claude session

Tell it: *"Read `elder-collection/HANDOFF.md` on branch `claude/elder-clipart-bundles-wo345d` and continue with item N."* Everything it needs is in the repo. If it should generate art, have it ask for the OpenAI key through the secure credential form. Never paste the key into chat.
