# The Relentless Elders Collection

**10 editions × 3 books = 30 products. 250 original images per edition. 2,500 images total.**

The competition sells 27 to 28 PNGs per bundle. We sell 250, and the same art does three jobs:

| Book | What it is | Built from | Where it sells |
|---|---|---|---|
| **1. Clipart Bundle** | 250 transparent PNGs (ZIP) + a PDF catalog with cut lines | color art | Etsy, Creative Market, Gumroad, Shopify |
| **2. Coloring Book** | 250 line-art drawings, 6 per page, every page single-sided so markers don't bleed (~100 pages) | line art made *from* the color art | Amazon KDP paperback (B&W), Etsy printable PDF |
| **3. Story Book** | Meet-the-cast spread, introduction, 10 chapter stories, 100 hand-picked illustrations each with a caption, a closing, and lined "Your Turn" pages (80 pages) | color art + manuscript | Amazon KDP paperback (standard color), Etsy printable PDF |

## The 10 editions

| # | Edition | Story book title |
|---|---|---|
| 1 | Elder Wisdom | What They Told Us When We Finally Listened |
| 2 | No Filter: Elder Sarcasm | Unbothered, Unbossed and Absolutely Right |
| 3 | Elder Activities: Still Out Here | Elders Who Refused to Sit Down |
| 4 | Elders Who Care: Giving Back | The Ones Who Stayed and Showed Up |
| 5 | Elder Joy: A Life Well Lived | Examining a Life Earned |
| 6 | Still Courting: Elder Love *(proposed)* | Love Stories With Gray Hair |
| 7 | Sunday Best: Elder Style *(proposed)* | Style, Pride and the Art of Showing Up Sharp |
| 8 | The Kitchen Table *(proposed)* | Recipes Nobody Wrote Down |
| 9 | Sunday Morning: Elder Faith *(proposed)* | The Prayers That Carried Us |
| 10 | Roots and Legacy *(proposed)* | What We Carry Forward |

Editions 1 to 5 are the ones you named. Editions 6 to 10 are proposals; swap any of them by editing its file in `editions/`.

## The 250-image mix (every edition)

- **120 single elders**: 24 theme actions, each drawn by 5 different cast members
- **50 pairs**: couples, two friends, or an elder with a grandchild
- **20 group scenes**: 3 to 4 elders together
- **40 theme objects**: props a crafter can use on their own (cake, church fan, dominoes...)
- **20 hand-lettered phrases**: word art ("Chile, Please", "Still Courting", "Roots Run Deep"...)

## One cast across all 30 books

`style/cast.json` holds **16 original elders** (Pops Earl, Miss Mavis, Deacon Ross, Aunt Birdie, Mother Gloria, Brother Walter in his wheelchair, Miss Lula Mae with her cane, and the rest) plus 8 couples. Each person's look is locked word for word, and each gets a reference sheet before any book art is made. Customers will start to recognize Miss Mavis, and that is how the collection becomes a brand. The look is described in `style/STYLE_LOCK.md`: soft watercolor caricature, big glasses, big hair, an earthy mustard/teal/olive/rust palette. The genre matches the sample you shared, but the characters are our own.

## Folder map

```
style/cast.json            the 16 elders + couples (locked descriptions)
style/STYLE_LOCK.md        the art direction every prompt carries
editions/NN-*.json         each theme: actions, pairs, groups, props, phrases, 10 chapter titles, book titles
manuscripts/NN-*.md        Book 3 text: introduction, 10 chapter stories, captions per image
tools/build_prompts.py     -> output/NN-*/prompts.jsonl + prompts.csv (the 250-image shot list)
tools/generate_images.py   OpenAI image generation: reference sheets, color art, line art
tools/build_books.py       -> the 3 books per edition, in a print version (300 DPI, KDP) and a digital version (<20 MB, Etsy)
tools/package.py           -> dist/NN-*/ sorted by platform: KDP interiors + cover wraps, Etsy files + listing images,
                              Drive upload folder, and CHECKLIST.txt (PASS/FIX for every platform rule)
style/fonts/               book fonts (SIL Open Font License), embedded in every PDF as KDP requires
publishing/PUBLISHING.md   how to upload to Etsy, Amazon KDP and Google Drive, step by step
publishing/listings/       ready-to-paste titles, tags, descriptions, keywords and categories
proofs/                    Editions 1 and 2 layout proofs with placeholder boxes (no art yet)
```

## How to run it

```bash
pip install openai pillow reportlab
export OPENAI_API_KEY=sk-...

python tools/build_prompts.py                          # 2,500 prompts (already done, rerun after edits)
python tools/generate_images.py --refs                 # 16 cast sheets -> style/refs/  (review them!)
python tools/generate_images.py --edition 1 --limit 10 # test batch
python tools/generate_images.py --edition 1            # 250 color images
python tools/generate_images.py --edition 1 --lineart  # 250 coloring-page versions
python tools/build_books.py 1                          # the 3 books for edition 1 (print + digital)
python tools/package.py 1                              # upload-ready folders in dist/01-elder-wisdom/
```

Then follow `publishing/PUBLISHING.md`.

All scripts pick up where they left off. Delete any PNG you don't like and rerun to redraw it.

**Using images you already made in ChatGPT/OpenAI instead?** Name each file with its ID (e.g. `E01-004.png`) and drop it into `output/01-elder-wisdom/images/color/` (or `lineart/`). The book builder picks it up. The prompts are in `prompts.csv` if you'd rather paste them by hand.

## Cost and time (estimate; check current OpenAI pricing)

Per edition: 250 color images + 250 line-art edits = 500 calls. At high quality that's roughly $100 to $130 per edition, or about $1,000 to $1,300 for all ten. Medium quality is about a quarter of that and is fine for test runs. At 4 parallel workers an edition takes a few hours.

## What's done and what's still open

- [x] 10 editions defined, 2,500 prompts written and balanced across the cast
- [x] Generator for reference sheets, color art and matched line art
- [x] PDF builder for all 3 books, with proofs in `proofs/`
- [x] **Editions 1 and 2 written in full:** back-cover copy, dedication, introduction, 10 stories, 100 captions each, closing
- [x] KDP cover wraps with spine math, Etsy listing images, Drive download page, and listing copy for Editions 1 and 2
- [x] Fonts embedded, KDP margins, single-sided coloring pages, digital PDFs sized for Etsy
- [ ] **Relentless:** replace the two `[bracketed]` notes in each manuscript (intro memory, closing sign-off) with your own words
- [ ] Generate and approve the 16 cast reference sheets
- [ ] Generate the art for Editions 1 and 2 (500 color + 500 line art)
- [ ] Spell-check every word-art image (AI sometimes misspells lettering)
- [ ] Put the Drive link in each edition file, rerun `package.py`, then upload
- [ ] Editions 3 to 10 manuscripts and listings
