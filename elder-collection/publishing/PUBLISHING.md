# Publishing Guide: Etsy, Amazon KDP, Google Drive

`python tools/package.py N` builds `dist/NN-slug/` with folders named after where each file goes. Its `CHECKLIST.txt` marks every rule below PASS or FIX. Platform rules change, so confirm limits on each platform's help pages before a big upload day.

## The plan for each edition

| Product | Sell it on | File(s) | Format |
|---|---|---|---|
| Clipart Bundle (250 PNG) | Etsy (+ Gumroad / Shopify if you want) | Download page PDF + catalog PDF; the PNG ZIP lives on Google Drive | Digital |
| Coloring Book | Amazon KDP paperback **and** Etsy printable PDF | KDP: interior + cover. Etsy: digital PDF | Print + digital |
| Story Book | Amazon KDP paperback **and** Etsy printable PDF | KDP: interior + cover. Etsy: digital PDF | Print + digital |
| Bundle of all three | Etsy | One listing with the three PDFs | Digital |

## Why the clipart goes through Google Drive

Etsy digital listings allow **5 files, 20 MB each**. 250 full-size transparent PNGs come to several hundred MB, far over that. Most big clipart sellers handle it the same way:

1. Upload `dist/NN-slug/google-drive/` to a folder in your Drive.
2. Right-click the ZIP: **Share → General access → Anyone with the link → Viewer**. Copy the link.
3. Paste it into `editions/NN-*.json`:
   ```json
   "links": { "clipart_drive": "https://drive.google.com/..." }
   ```
4. Rerun `python tools/package.py N`. The **CLICK HERE TO DOWNLOAD** button in `1-Download-Your-Clipart.pdf` now points to your folder.
5. On Etsy, upload `1-Download-Your-Clipart.pdf` and `2-Clipart-Catalog-and-Ideas.pdf` as the listing's digital files.

Keep the Drive folder for as long as the listing is live. Deleting or moving it breaks every past buyer's download. Use one Drive folder per edition, named `Relentless Elders - 01 Elder Wisdom - Clipart`.

The coloring and story book PDFs are built in a compressed digital version that stays under 20 MB, so they upload to Etsy directly with no Drive step.

## Amazon KDP (paperbacks)

**Coloring book:** 8.5 × 11 in, black & white interior, white paper, matte cover. Every drawing has a blank back so markers don't bleed through, which reviewers on coloring books ask for constantly. About 100 pages.

**Story book:** 8.5 × 11 in, **standard color** interior (much cheaper to print than premium color, and right for watercolor art), white paper, glossy or matte cover. 80 pages, including the "Meet the Elders" cast spread.

Upload steps (Bookshelf → Create → Paperback):
1. **Details:** copy the title, subtitle, description and keywords from `publishing/listings/NN-*.md`. Author name: Relentless (or your full pen name. Use the same one on all 30 books so Amazon groups them).
2. **Series:** add each book to a series called *The Relentless Elders Collection*. Amazon then shows readers the rest of the books.
3. **Content:** print ISBN (free KDP ISBN is fine), interior `amazon-kdp/<book>/interior.pdf`, "No bleed", cover `amazon-kdp/<book>/cover.pdf` ("Upload a cover you already have").
4. **AI disclosure:** KDP asks whether the text and images are AI-generated. **Answer honestly.** The images are AI-generated. The story text was drafted with AI; under KDP's definition that counts as AI-generated even after you edit it, unless you rewrite it yourself. The disclosure is not shown to customers, but leaving it out can get a book or an account pulled.
5. Open the **Previewer** and page through the whole book before you publish. It catches anything KDP will reject.
6. **Pricing:** KDP shows the printing cost once the interior is uploaded. Set the list price so royalty is at least $2.50–$3.50 per copy. Price the story book higher than the coloring book, since color printing costs more.

The cover PDF's spine width is calculated from the page count (0.002252 in per page for white paper). If you add or remove pages, rerun `package.py` so the cover matches, and check it against KDP's cover calculator.

KDP prints its own barcode in the bottom right of the back cover. The covers leave that corner clear.

**Kindle eBook (optional, later):** the story book works as a fixed-layout Kindle book made in Kindle Create. A coloring book makes no sense as a Kindle book, so skip it.

## Etsy listings

- **Images:** `etsy/<product>/listing-images/` holds 3000 × 2250 JPGs (Etsy's recommended 4:3). Add 3–5 more when the art exists: mockups of a mug, a card or a T-shirt, and one shot of a printed coloring page partly colored in. Mockups sell clipart.
- **Titles, tags, descriptions:** in `publishing/listings/NN-*.md`. Etsy allows 13 tags of up to 20 characters each, and every tag there fits.
- **AI disclosure:** Etsy asks sellers to say when AI tools were used. Each listing description already includes a plain line saying so. Keep it in.
- **Category:** Craft Supplies & Tools → Clip Art (clipart); Books, Movies & Music → Books → Coloring Books (coloring); Books → Children's / Fiction (story book) or Paper & Party Supplies → Digital Prints.

## Rights, in plain terms

- The fonts (Lora, Fraunces, Work Sans, Caveat Brush) are SIL Open Font License, free for commercial use, and embedded in every PDF.
- In the US, purely AI-generated images generally can't be registered for copyright, so someone could copy the art. Your clipart license is still a contract with every buyer. Your strongest protection is the brand: the named cast, the stories and the series. That's why the books lean so hard on Pops Earl, Miss Mavis and the rest.
- Keep the generation records (`output/NN-*/prompts.jsonl` and the images) backed up on Drive. They show where every image came from.
