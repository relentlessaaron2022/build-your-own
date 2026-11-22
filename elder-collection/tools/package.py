#!/usr/bin/env python3
"""Turn built books into upload-ready packages for Amazon KDP, Etsy and Google Drive.

Run after build_books.py:
  python tools/build_books.py 1 2
  python tools/package.py 1 2

Writes dist/NN-slug/:
  amazon-kdp/coloring-book/  interior.pdf + cover.pdf (full wrap: back, spine, front, with bleed)
  amazon-kdp/story-book/     interior.pdf + cover.pdf
  etsy/clipart/              Download-Your-Clipart.pdf (link to the Drive folder), catalog PDF, listing images
  etsy/coloring-book/        digital coloring book PDF + listing images
  etsy/story-book/           digital story book PDF + listing images
  google-drive/              full-size PNG ZIP + print PDFs (upload this folder to Drive, share "anyone with link")
  CHECKLIST.txt              every size / page-count rule checked, PASS or FIX

Set each edition's Drive link in editions/NN-*.json -> "links": {"clipart_drive": "https://drive.google.com/..."}
then rerun package.py so the download PDF points to it.
"""
import argparse
import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_books as bb  # noqa: E402  (registers fonts, shared colors and helpers)

ROOT = bb.ROOT
DIST = ROOT / "dist"
BLEED = 0.125 * inch
TRIM_W, TRIM_H = 8.5 * inch, 11 * inch
# KDP paper thickness per page (inches). Check KDP's cover calculator before each upload.
SPINE_PER_PAGE = {"bw-white": 0.002252, "standard-color": 0.002252, "premium-color": 0.002347}
ETSY_MAX_MB, ETSY_MAX_FILES, KDP_MAX_MB = 20, 5, 650
HEX = {"cream": "#F6EEDC", "ink": "#3B2A1E", "mustard": "#B8862A", "teal": "#2F5D62", "gray": "#9A8F80"}


def pages(pdf):
    return len(PdfReader(str(pdf)).pages)


def mb(p):
    return p.stat().st_size / 1e6


# ---------- KDP cover wrap ----------

def cover(spec, d, items, kind, interior, out, blurb):
    n = pages(interior)
    paper = "bw-white" if kind == "coloring" else "standard-color"
    spine = n * SPINE_PER_PAGE[paper] * inch
    cw, chh = 2 * BLEED + 2 * TRIM_W + spine, TRIM_H + 2 * BLEED
    c = canvas.Canvas(str(out), pagesize=(cw, chh))
    c.setTitle(f"{spec['titles'][kind]} cover")
    c.setFillColor(bb.CREAM); c.rect(0, 0, cw, chh, fill=1, stroke=0)
    back_x, spine_x, front_x = BLEED, BLEED + TRIM_W, BLEED + TRIM_W + spine
    safe = 0.5 * inch
    main, _, sub = spec["titles"][kind].partition(":")

    # front
    fx, fy = front_x, BLEED
    c.setFillColor(bb.TEAL); c.rect(front_x, chh - BLEED - 0.55 * inch, TRIM_W + BLEED, 0.55 * inch + BLEED, fill=1, stroke=0)
    c.setFillColor(bb.CREAM); c.setFont(bb.SANS_B, 13)
    c.drawCentredString(fx + TRIM_W / 2, chh - BLEED - 0.36 * inch,
                        "A COLORING BOOK  ·  250 ILLUSTRATIONS" if kind == "coloring" else "STORIES & ILLUSTRATIONS")
    c.setFillColor(bb.INK); c.setFont(bb.DISPLAY, 46)
    lines = bb.wrap(main, bb.DISPLAY, 46, TRIM_W - 2 * safe)
    y = chh - BLEED - 1.45 * inch
    for ln in lines:
        c.drawCentredString(fx + TRIM_W / 2, y, ln); y -= 50
    c.setFillColor(bb.RUST); c.setFont(bb.BRUSH, 24)
    for ln in bb.wrap(sub.strip(), bb.BRUSH, 24, TRIM_W - 2 * safe):
        c.drawCentredString(fx + TRIM_W / 2, y, ln); y -= 28
    art_top, art_bot = y - 10, fy + 1.2 * inch
    if kind == "coloring":
        picks = [i for i in items if i["category"] in ("pair", "group")][:4]
        gw, gh = (TRIM_W - 2 * safe) / 2, (art_top - art_bot) / 2
        for k, it in enumerate(picks):
            x = fx + safe + (k % 2) * gw
            yy = art_top - (k // 2 + 1) * gh
            c.setFillColor(bb.colors.white); c.roundRect(x + 6, yy + 6, gw - 12, gh - 12, 12, fill=1, stroke=0)
            bb.draw_art(c, bb.prepared(d, it["lineart_file"], "print", lineart=True), x + 12, yy + 12, gw - 24, gh - 24, bb.label(it), lineart=True)
    else:
        hero = next(i for i in items if i["category"] == "group")
        bb.draw_art(c, bb.prepared(d, hero["color_file"], "print"), fx + safe, art_bot, TRIM_W - 2 * safe, art_top - art_bot, bb.label(hero))
    c.setFillColor(bb.INK); c.setFont(bb.SANS_B, 16)
    c.drawCentredString(fx + TRIM_W / 2, fy + 0.7 * inch, "R E L E N T L E S S")

    # spine (KDP allows spine text only above 79 pages)
    if n > 79:
        c.saveState()
        c.translate(spine_x + spine / 2, chh / 2); c.rotate(-90)
        size = min(14, spine / inch * 72 * 0.55)
        c.setFillColor(bb.INK); c.setFont(bb.DISPLAY, size)
        c.drawCentredString(-0.6 * inch, -size / 3, main)
        c.setFont(bb.SANS_B, size * 0.75); c.drawCentredString(TRIM_H / 2 - 1.3 * inch, -size / 3, "RELENTLESS")
        c.restoreState()

    # back: blurb top, art strip, barcode zone (bottom right, 2" x 1.2") left clear for KDP
    bx = back_x + safe
    c.setFillColor(bb.INK); c.setFont(bb.DISPLAY, 22)
    c.drawString(bx, chh - BLEED - 1.0 * inch, main)
    y = chh - BLEED - 1.45 * inch
    c.setFont(bb.SERIF, 12)
    for para in blurb:
        for ln in bb.wrap(para, bb.SERIF, 12, TRIM_W - 2 * safe):
            c.drawString(bx, y, ln); y -= 17
        y -= 8
    strip = [i for i in items if i["category"] == "solo"][::25][:4]
    sw = (TRIM_W - 2 * safe) / 4
    for k, it in enumerate(strip):
        f = it["lineart_file"] if kind == "coloring" else it["color_file"]
        bb.draw_art(c, bb.prepared(d, f, "print", lineart=kind == "coloring"), bx + k * sw, BLEED + 1.9 * inch, sw, min(2.6 * inch, y - BLEED - 2.0 * inch), bb.label(it), lineart=kind == "coloring")
    c.setFont(bb.SANS, 9); c.setFillColor(bb.GRAY)
    c.drawString(bx, BLEED + 0.6 * inch, "Relentless  ·  The Elders Collection, Edition %d of 10" % spec["number"])
    c.save()
    return n, spine / inch


# ---------- Etsy listing images (3000 x 2250, Etsy's recommended 4:3) ----------

def font(name, size):
    files = {"display": "Fraunces-Display", "serif": "Lora-Regular", "sans": "WorkSans-SemiBold", "brush": "CaveatBrush-Regular"}
    return ImageFont.truetype(str(bb.FONTS / f"{files[name]}.ttf"), size)


def thumb(d, it, lineart, box):
    w, h = box
    tile = Image.new("RGB", box, "white" if lineart else HEX["cream"])
    p = bb.prepared(d, it["lineart_file"] if lineart else it["color_file"], "digital", lineart=lineart)
    if p:
        im = Image.open(p).convert("RGB"); im.thumbnail((w - 20, h - 20))
        tile.paste(im, ((w - im.width) // 2, (h - im.height) // 2))
    else:
        dr = ImageDraw.Draw(tile)
        dr.rounded_rectangle((10, 10, w - 10, h - 10), 24, outline=HEX["gray"], width=3)
        dr.text((w // 2, h // 2), it["id"], fill=HEX["gray"], font=font("sans", 40), anchor="mm")
    return tile


def listing_image(path, d, items, top, title, sub, footer, lineart=False, cols=5, rows=2):
    W, H = 3000, 2250
    im = Image.new("RGB", (W, H), HEX["cream"])
    dr = ImageDraw.Draw(im)
    dr.text((W // 2, 150), top, fill=HEX["ink"], font=font("sans", 90), anchor="mm")
    dr.text((W // 2, 340), title, fill=HEX["mustard"], font=font("display", 210), anchor="mm")
    dr.text((W // 2, 520), sub, fill=HEX["teal"], font=font("brush", 110), anchor="mm")
    gx, gy, gw, gh = 120, 640, W - 240, H - 640 - 230
    tw, th = gw // cols, gh // rows
    for k, it in enumerate(items[: cols * rows]):
        im.paste(thumb(d, it, lineart, (tw - 20, th - 20)), (gx + (k % cols) * tw + 10, gy + (k // cols) * th + 10))
    dr.rectangle((0, H - 190, W, H), fill=HEX["teal"])
    dr.text((W // 2, H - 95), footer, fill=HEX["cream"], font=font("sans", 72), anchor="mm")
    im.save(path, quality=88)


# ---------- Etsy download page ----------

def download_pdf(spec, path, link):
    c = canvas.Canvas(str(path), pagesize=bb.letter)
    W, H = bb.letter
    c.setTitle(f"{spec['titles']['clipart']} - download")
    c.setFillColor(bb.CREAM); c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(bb.INK); c.setFont(bb.SANS_B, 13); c.drawCentredString(W / 2, H - 1.1 * inch, "THANK YOU FOR YOUR ORDER")
    c.setFillColor(bb.MUSTARD); c.setFont(bb.DISPLAY, 34); c.drawCentredString(W / 2, H - 1.75 * inch, spec["theme"].split(":")[0])
    c.setFillColor(bb.TEAL); c.setFont(bb.BRUSH, 20); c.drawCentredString(W / 2, H - 2.15 * inch, "250 transparent PNG clipart")
    bw, bh = 4.6 * inch, 0.9 * inch
    bx, by = (W - bw) / 2, H - 3.5 * inch
    c.setFillColor(bb.TEAL); c.roundRect(bx, by, bw, bh, 18, fill=1, stroke=0)
    c.setFillColor(bb.CREAM); c.setFont(bb.SANS_B, 20); c.drawCentredString(W / 2, by + bh / 2 - 7, "CLICK HERE TO DOWNLOAD")
    c.linkURL(link, (bx, by, bx + bw, by + bh), relative=0)
    c.setFillColor(bb.GRAY); c.setFont(bb.SANS, 8.5); c.drawCentredString(W / 2, by - 16, link)
    y = by - 0.7 * inch
    steps = ["Click the button. It opens a Google Drive folder. No account needed.",
             "Download the ZIP file. On a phone, it's easier to download on a computer.",
             "Unzip it. You'll find 250 PNG files with transparent backgrounds, numbered to match the catalog PDF.",
             "Open the catalog PDF that came with this listing to browse every image and find ideas for using them."]
    c.setFillColor(bb.INK); c.setFont(bb.DISPLAY, 18); c.drawString(1 * inch, y, "How to get your files"); y -= 24
    c.setFont(bb.SERIF, 11)
    for i, s in enumerate(steps, 1):
        for j, ln in enumerate(bb.wrap(s, bb.SERIF, 11, W - 2.4 * inch)):
            c.drawString(1.2 * inch, y, (f"{i}.  " if j == 0 else "     ") + ln); y -= 15
    y -= 16
    c.setFont(bb.DISPLAY, 18); c.drawString(1 * inch, y, "License"); y -= 22
    c.setFont(bb.SERIF, 10.5)
    for ln in bb.wrap(bb.LICENSE, bb.SERIF, 10.5, W - 2 * inch):
        c.drawString(1 * inch, y, ln); y -= 14
    y -= 20
    c.setFillColor(bb.TEAL); c.setFont(bb.SERIF_I, 12)
    for ln in bb.wrap("If you love these elders, a review on Etsy helps more than you know. And there are nine more "
                      "editions of the Elders Collection, each with a clipart bundle, a coloring book and a story book.",
                      bb.SERIF_I, 12, W - 2 * inch):
        c.drawCentredString(W / 2, y, ln); y -= 17
    c.setFillColor(bb.INK); c.setFont(bb.SANS_B, 12); c.drawCentredString(W / 2, 0.8 * inch, "RELENTLESS")
    c.save()


def coloring_blurb(spec):
    return [f"Two hundred fifty original drawings of Black elders living their fullest years, from the {spec['theme'].split(':')[0]} edition "
            "of the Relentless Elders Collection.",
            "Every drawing sits on its own side of the page, so markers never bleed onto the next one. Big shapes for relaxing "
            "coloring, small details for those who want them, and characters you'll want to give a name.",
            "For grown folks, grandbabies, senior centers, church groups and anybody who could use an hour of quiet."]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("editions", nargs="+", type=int)
    a = ap.parse_args()
    for num in a.editions:
        spec, d, items = bb.load_edition(num)
        ms = bb.parse_manuscript(num)
        need = [d / f"{d.name}-{k}-{t}.pdf" for k in ("1-clipart-catalog", "2-coloring-book", "3-story-book") for t in ("print", "digital")]
        if not all(p.exists() for p in need):
            sys.exit(f"Build edition {num} first: python tools/build_books.py {num}")
        out = DIST / d.name
        if out.exists():
            shutil.rmtree(out)
        k_col, k_sto = out / "amazon-kdp" / "coloring-book", out / "amazon-kdp" / "story-book"
        e_cli, e_col, e_sto = out / "etsy" / "clipart", out / "etsy" / "coloring-book", out / "etsy" / "story-book"
        drive = out / "google-drive"
        for p in (k_col, k_sto, e_cli, e_col, e_sto, drive):
            p.mkdir(parents=True)
        art = sum((d / it["color_file"]).exists() for it in items)
        line = sum((d / it["lineart_file"]).exists() for it in items)
        checks = []

        def check(ok, msg):
            checks.append(("PASS" if ok else "FIX ") + "  " + msg)

        # KDP
        for kind, folder, key, blurb in (("coloring", k_col, "2-coloring-book", coloring_blurb(spec)),
                                         ("story", k_sto, "3-story-book", ms["back"] or ["[Back cover text missing]"])):
            interior = folder / "interior.pdf"
            shutil.copy(d / f"{d.name}-{key}-print.pdf", interior)
            n, sp = cover(spec, d, items, kind, interior, folder / "cover.pdf", blurb)
            check(24 <= n <= 828, f"KDP {kind} interior: {n} pages (KDP range 24-828)")
            if kind == "story":
                check(n >= 72, f"KDP story book meets the 72-page minimum for standard color ({n} pages)")
            check(mb(interior) < KDP_MAX_MB, f"KDP {kind} interior {mb(interior):.1f} MB (limit {KDP_MAX_MB} MB)")
            check(n > 79, f"KDP {kind} spine text {'printed' if n > 79 else 'left off'} (spine {sp:.3f} in; text needs 80+ pages)")

        # Etsy
        link = spec.get("links", {}).get("clipart_drive") or "https://drive.google.com/ADD-YOUR-SHARED-FOLDER-LINK"
        download_pdf(spec, e_cli / "1-Download-Your-Clipart.pdf", link)
        shutil.copy(d / f"{d.name}-1-clipart-catalog-digital.pdf", e_cli / "2-Clipart-Catalog-and-Ideas.pdf")
        shutil.copy(d / f"{d.name}-2-coloring-book-digital.pdf", e_col / f"{spec['slug']}-coloring-book.pdf")
        shutil.copy(d / f"{d.name}-3-story-book-digital.pdf", e_sto / f"{spec['slug']}-story-book.pdf")
        check("ADD-YOUR" not in link, "Etsy download page links to the real Google Drive folder")
        for folder in (e_cli, e_col, e_sto):
            files = list(folder.glob("*.pdf"))
            check(len(files) <= ETSY_MAX_FILES, f"Etsy {folder.name}: {len(files)} files (limit {ETSY_MAX_FILES})")
            for f in files:
                check(mb(f) <= ETSY_MAX_MB, f"Etsy {folder.name}/{f.name}: {mb(f):.1f} MB (limit {ETSY_MAX_MB} MB)")

        theme, sub = spec["theme"].split(":")[0], (spec["theme"].split(":", 1)[1].strip() if ":" in spec["theme"] else "")
        people = [i for i in items if i["category"] in ("solo", "pair")]
        for folder in (e_cli, e_col, e_sto):
            (folder / "listing-images").mkdir()
        listing_image(e_cli / "listing-images" / "01-cover.jpg", d, people[::12], "250 PNG CLIPARTS", theme, sub,
                      "Transparent PNG  ·  Commercial use  ·  Instant download")
        listing_image(e_cli / "listing-images" / "02-whats-inside.jpg", d,
                      [i for i in items if i["category"] in ("group", "prop", "wordart")][::5], "WHAT'S INSIDE",
                      "120 · 50 · 20 · 40 · 20", "Elders  ·  Pairs  ·  Groups  ·  Objects  ·  Word Art",
                      "Elders, pairs, groups, objects and hand-lettered phrases", cols=6, rows=2)
        listing_image(e_col / "listing-images" / "01-cover.jpg", d, people[::21], "COLORING BOOK", theme, sub,
                      "250 drawings  ·  single-sided pages  ·  printable PDF", lineart=True, cols=4, rows=2)
        listing_image(e_sto / "listing-images" / "01-cover.jpg", d, people[5::30], "STORIES & ILLUSTRATIONS", theme, sub,
                      "10 stories  ·  100 illustrations  ·  printable PDF", cols=4, rows=1)

        # Drive (full-size)
        z = d / f"{d.name}-clipart-PNGs.zip"
        if z.exists():
            shutil.copy(z, drive / z.name)
        for key in ("2-coloring-book", "3-story-book"):
            shutil.copy(d / f"{d.name}-{key}-print.pdf", drive)
        check(art == 250, f"Color art: {art}/250 images generated")
        check(line == 250, f"Line art: {line}/250 coloring pages generated")
        check("[" not in " ".join(ms["intro"] + ms["closing"]), "Manuscript has no [bracketed] notes left for Relentless")

        (out / "CHECKLIST.txt").write_text(f"{spec['theme']} — upload checklist\n\n" + "\n".join(checks) + "\n")
        fixes = sum(c.startswith("FIX") for c in checks)
        print(f"Edition {num}: dist/{d.name}  ({len(checks) - fixes} pass, {fixes} to fix)")
        for c_ in checks:
            if c_.startswith("FIX"):
                print("   ", c_)


if __name__ == "__main__":
    main()
