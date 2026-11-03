# The Relentless Elders Collection

**10 editions × 3 books = 30 products. 250 original images per edition. 2,500 images total.**

The competition sells 27 to 28 PNGs per bundle. We sell 250, and the same art does three jobs:

| Book | What it is | Built from | Where it sells |
|---|---|---|---|
| **1. Clipart Bundle** | 250 transparent PNGs (ZIP) + a PDF catalog with cut lines | color art | Etsy, Creative Market, Gumroad, Shopify |
| **2. Coloring Book** | 250 line-art drawings, 6 per page by default (42 pages + front matter); 4, 2 or 1 per page also available | line art made *from* the color art | Amazon KDP paperback, PDF download |
| **3. Story Book** | 10 chapters: a short story opens each chapter, then 25 illustrations with an overture/caption under each (~143 pages) | color art + manuscript | Amazon KDP paperback & Kindle, PDF |

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
tools/build_books.py       -> the 3 PDFs (+ PNG ZIP) per edition
proofs/                    Edition 1 layout proofs with placeholder boxes (no art yet)
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
python tools/build_books.py 1                          # the 3 books for edition 1
```

All scripts pick up where they left off. Delete any PNG you don't like and rerun to redraw it.

**Using images you already made in ChatGPT/OpenAI instead?** Name each file with its ID (e.g. `E01-004.png`) and drop it into `output/01-elder-wisdom/images/color/` (or `lineart/`). The book builder picks it up. The prompts are in `prompts.csv` if you'd rather paste them by hand.

## Cost and time (estimate; check current OpenAI pricing)

Per edition: 250 color images + 250 line-art edits = 500 calls. At high quality that's roughly $100 to $130 per edition, or about $1,000 to $1,300 for all ten. Medium quality is about a quarter of that and is fine for test runs. At 4 parallel workers an edition takes a few hours.

## What's done and what's still open

- [x] 10 editions defined, 2,500 prompts written and balanced across the cast
- [x] Generator for reference sheets, color art and matched line art
- [x] PDF builder for all 3 books, with proofs in `proofs/`
- [x] Edition 1 manuscript sample: introduction, Chapters 1 and 2, captions for Chapter 1
- [ ] Generate and approve the 16 cast reference sheets
- [ ] Generate the art (2,500 color + 2,500 line art)
- [ ] Write the remaining story-book text: Edition 1 Chapters 3 to 10, then Editions 2 to 10
- [ ] Spell-check every word-art image (AI sometimes misspells lettering)
- [ ] Covers (front/back/spine) sized to KDP's calculator once page counts are final
- [ ] Brand fonts (proofs use plain Times/Helvetica)
