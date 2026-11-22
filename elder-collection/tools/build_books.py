#!/usr/bin/env python3
"""Assemble the three book interiors for each edition.

  Book 1  Clipart Bundle catalog  -> NN-slug-1-clipart-catalog-<target>.pdf  (+ full-size PNG ZIP)
  Book 2  Coloring Book           -> NN-slug-2-coloring-book-<target>.pdf
  Book 3  Story Book              -> NN-slug-3-story-book-<target>.pdf

Two targets:
  print    300 DPI art, for Amazon KDP paperback interiors (fonts embedded, KDP-safe margins)
  digital  compressed art, for Etsy / Gumroad downloads (keeps each PDF under Etsy's 20 MB file cap)

Missing art is drawn as a labeled placeholder box so you can proof layouts before
the images exist. Real PNGs drop in automatically on the next run.

Usage:
  python tools/build_books.py 1 2                     editions 1 and 2, both targets
  python tools/build_books.py 1 --target print
  python tools/build_books.py 1 --per-page 4          coloring book at 4 drawings a page (default 6)
  python tools/build_books.py 1 --double-sided        coloring art on both sides (default: blank backs)

Needs: pip install reportlab pillow
"""
import argparse
import json
import re
import zipfile
from pathlib import Path

from PIL import Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import (BaseDocTemplate, CondPageBreak, Flowable, Frame, KeepTogether, PageBreak,
                                PageTemplate, Paragraph, Spacer, Table, TableStyle)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output"
FONTS = ROOT / "style" / "fonts"
W, H = letter
# KDP no-bleed minimums: 0.25" outside, 0.375-0.5" gutter for 24-300 pages. 0.6" clears all of them.
M = 0.6 * inch

INK = colors.HexColor("#3B2A1E")      # cocoa
MUSTARD = colors.HexColor("#B8862A")
TEAL = colors.HexColor("#2F5D62")
RUST = colors.HexColor("#A4502B")
CREAM = colors.HexColor("#F6EEDC")
GRAY = colors.HexColor("#9A8F80")

for name, file in [("Lora", "Lora-Regular"), ("Lora-Bold", "Lora-Bold"), ("Lora-Italic", "Lora-Italic"),
                   ("Fraunces", "Fraunces-Display"), ("Work", "WorkSans-Regular"),
                   ("Work-Semi", "WorkSans-SemiBold"), ("Brush", "CaveatBrush-Regular")]:
    pdfmetrics.registerFont(TTFont(name, str(FONTS / f"{file}.ttf")))
pdfmetrics.registerFontFamily("Lora", normal="Lora", bold="Lora-Bold", italic="Lora-Italic", boldItalic="Lora-Bold")
from reportlab import rl_config  # noqa: E402
rl_config.canvas_basefontname = "Work"  # so no un-embedded Helvetica sneaks in (KDP rejects those)
SERIF, SERIF_B, SERIF_I, DISPLAY, SANS, SANS_B, BRUSH = ("Lora", "Lora-Bold", "Lora-Italic", "Fraunces",
                                                         "Work", "Work-Semi", "Brush")

TARGETS = {"print": {"px": 2400, "q": 90}, "digital": {"px": 700, "q": 72}}
YEAR = 2026

CRAFT_IDEAS = [
    "Greeting cards: birthday, anniversary, Grandparents Day, sympathy and thank-you cards.",
    "Stickers and planner pages: print on sticker paper and kiss-cut with a Cricut or Silhouette.",
    "Scrapbooks and memory books for family reunions and milestone birthdays.",
    "Sublimation and DTF prints: T-shirts, tote bags, mugs, aprons and church-event shirts.",
    "Invitations for 70th, 80th, 90th and 100th birthday parties and anniversary dinners.",
    "Church programs, Mother's Day and Father's Day bulletins, and repast cards.",
    "Classroom and Sunday school posters, bulletin boards and Black History Month displays.",
    "Social media posts, reels and story graphics for elder-care, ministry and family pages.",
    "Senior-center activity calendars, bingo cards and name tags.",
    "Junk journals, ephemera kits and printable gift tags.",
    "Wall art: frame a single elder or a word-art phrase for a living room or a care-home room.",
    "Memorial and celebration-of-life keepsakes, handled with care and respect.",
]

LICENSE = (
    "You may use these images in your own projects and in products you sell (cards, shirts, mugs, "
    "printed goods, social posts and similar) as long as the clipart is part of a finished design. "
    "You may not resell, share or give away the images themselves as clipart, digital stamps, "
    "templates, or in any AI training set. Credit is appreciated but not required."
)


# ---------- data ----------

def all_specs():
    return [json.loads(p.read_text()) for p in sorted((ROOT / "editions").glob("*.json"))]


def load_edition(n):
    spec = json.loads(next((ROOT / "editions").glob(f"{n:02d}-*.json")).read_text())
    d = next(OUT.glob(f"{n:02d}-*"), None)
    if d is None:
        raise SystemExit(f"Run tools/build_prompts.py first (no shot list for edition {n}).")
    items = [json.loads(l) for l in open(d / "prompts.jsonl")]
    return spec, d, items


ID_LINE = re.compile(r"^(E\d\d-\d\d\d)\s*[:\-]\s*(.+)$")


def parse_manuscript(n):
    """Sections: # Back Cover, # Dedication, # Introduction, # Chapter N, # Closing.
    Inside a chapter, a block of lines like 'E01-012: caption' is that chapter's picture gallery."""
    p = next((ROOT / "manuscripts").glob(f"{n:02d}-*.md"), None)
    ms = {"back": [], "dedication": [], "intro": [], "closing": [], "chapters": {}, "pictures": {}}
    if not p:
        return ms
    text = re.sub(r"<!--.*?-->", "", p.read_text(), flags=re.S)
    section = None
    for block in re.split(r"\n\s*\n", text):
        block = block.strip()
        if not block:
            continue
        if block.startswith("# "):
            head, _, rest = block.partition("\n")
            h = head[2:].strip().lower()
            if h.startswith("chapter"):
                section = int(re.findall(r"\d+", h)[0])
                ms["chapters"][section], ms["pictures"][section] = [], []
            else:
                section = {"back cover": "back", "dedication": "dedication", "introduction": "intro",
                           "closing": "closing"}.get(h)
            block = rest.strip()
            if not block or section is None:
                continue
        lines = block.splitlines()
        if isinstance(section, int) and all(ID_LINE.match(l.strip()) for l in lines):
            ms["pictures"][section] += [ID_LINE.match(l.strip()).groups() for l in lines]
        elif isinstance(section, int):
            ms["chapters"][section].append(" ".join(l.strip() for l in lines))
        elif section:
            ms[section].append(" ".join(l.strip() for l in lines))
    return ms


# ---------- art ----------

def prepared(d, rel, target, lineart=False):
    """Flatten transparent PNG onto white and size it for the target. Returns a path or None."""
    src = d / rel
    if not src.exists():
        return None
    t = TARGETS[target]
    dst = d / "cache" / target / (src.stem + ("-line.png" if lineart else ".jpg"))
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return dst
    dst.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(src).convert("RGBA")
    bg = Image.new("RGBA", im.size, "white")
    bg.alpha_composite(im)
    im = bg.convert("L" if lineart else "RGB")
    im.thumbnail((t["px"], t["px"]), Image.LANCZOS)
    if lineart:
        im.save(dst, optimize=True)
    else:
        im.save(dst, quality=t["q"], optimize=True, progressive=True)
    return dst


def wrap(text, font, size, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if stringWidth(t, font, size) <= width:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def draw_art(c, img, x, y, w, h, label, lineart=False):
    if img:
        c.drawImage(str(img), x, y, w, h, preserveAspectRatio=True, anchor="c")
        return
    c.saveState()
    c.setStrokeColor(GRAY)
    c.setFillColor(colors.white if lineart else CREAM)
    if lineart:
        c.setDash(3, 3)
    c.roundRect(x + 4, y + 4, w - 8, h - 8, 10, fill=1, stroke=1)
    c.setFillColor(GRAY)
    c.setFont(SANS, 7.5)
    lines = wrap(label, SANS, 7.5, w - 24)[:6]
    ty = y + h / 2 + len(lines) * 5
    for ln in lines:
        c.drawCentredString(x + w / 2, ty, ln)
        ty -= 10
    c.restoreState()


def label(it):
    return f"{it['id']}  |  {it['title']}"


def more_from_relentless(c, spec):
    c.setFillColor(INK); c.setFont(DISPLAY, 26)
    c.drawCentredString(W / 2, H - 1.4 * inch, "More From Relentless")
    c.setFont(SERIF_I, 12); c.setFillColor(TEAL)
    c.drawCentredString(W / 2, H - 1.75 * inch, "The Elders Collection: every edition comes as a story book, a coloring book and a clipart bundle.")
    y = H - 2.5 * inch
    for s in all_specs():
        c.setFillColor(MUSTARD if s["number"] == spec["number"] else INK)
        c.setFont(SANS_B, 12); c.drawString(1.2 * inch, y, f"{s['number']:>2}.  {s['theme']}")
        c.setFont(SERIF_I, 11); c.setFillColor(GRAY)
        c.drawString(1.55 * inch, y - 15, s["titles"]["story"].split(":", 1)[-1].strip())
        y -= 0.62 * inch
    c.showPage()


def copyright_page(c, title):
    c.setFillColor(INK); c.setFont(SERIF, 9.5)
    lines = [title, "", f"Copyright © {YEAR} Relentless. All rights reserved.",
             "No part of this book may be reproduced, scanned or shared in any form without written",
             "permission, except brief quotations in reviews.", "",
             "Illustrations were created with AI image tools under the art direction of Relentless,",
             "then selected and edited by hand. The elders in these pages are fictional characters.", "",
             "First edition."]
    y = 2.6 * inch
    for ln in lines:
        c.drawString(M, y, ln); y -= 13
    c.showPage()


# ---------- Book 1: clipart catalog ----------

def build_clipart(spec, d, items, target):
    out = d / f"{d.name}-1-clipart-catalog-{target}.pdf"
    c = canvas.Canvas(str(out), pagesize=letter)
    c.setTitle(spec["titles"]["clipart"]); c.setAuthor("Relentless")

    c.setFillColor(CREAM); c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(INK); c.setFont(SANS_B, 15)
    c.drawCentredString(W / 2, H - 0.95 * inch, "250 TRANSPARENT PNG CLIPARTS")
    c.setFillColor(MUSTARD); c.setFont(DISPLAY, 40)
    c.drawCentredString(W / 2, H - 1.6 * inch, spec["theme"].split(":")[0])
    if ":" in spec["theme"]:
        c.setFillColor(TEAL); c.setFont(BRUSH, 24)
        c.drawCentredString(W / 2, H - 2.05 * inch, spec["theme"].split(":", 1)[1].strip())
    cell = (W - 2 * M) / 3
    picks = [i for i in items if i["category"] in ("solo", "pair")][:9]
    for k, it in enumerate(picks):
        x = M + (k % 3) * cell
        y = H - 2.4 * inch - (k // 3 + 1) * cell
        draw_art(c, prepared(d, it["color_file"], target), x, y, cell, cell, label(it))
    c.setFillColor(INK); c.setFont(SANS, 9.5)
    c.drawCentredString(W / 2, 0.55 * inch, "Transparent PNG  ·  Commercial use for finished products  ·  Relentless")
    c.showPage()

    y = H - M - 10
    c.setFillColor(INK); c.setFont(DISPLAY, 22); c.drawString(M, y, "What's Inside"); y -= 26
    counts = {}
    for it in items:
        counts[it["category"]] = counts.get(it["category"], 0) + 1
    names = {"solo": "single elders", "pair": "pairs, couples and grandbabies", "group": "group scenes",
             "prop": "theme objects", "wordart": "hand-lettered phrases"}
    c.setFont(SERIF, 11)
    for k, v in counts.items():
        c.drawString(M + 12, y, f"{v}   {names[k]}"); y -= 15
    y -= 4
    for ln in wrap("Every image is its own transparent PNG in your download folder. This PDF is your "
                   "catalog: find an image by its number, or print a page and cut along the dashed lines.",
                   SERIF, 11, W - 2 * M - 12):
        c.drawString(M + 12, y, ln); y -= 15
    y -= 18
    c.setFont(DISPLAY, 22); c.drawString(M, y, "Ideas for Crafters"); y -= 22
    c.setFont(SERIF, 10.5)
    for idea in CRAFT_IDEAS:
        for i, ln in enumerate(wrap(idea, SERIF, 10.5, W - 2 * M - 24)):
            c.drawString(M + 12, y, ("•  " if i == 0 else "   ") + ln); y -= 14
        y -= 3
    y -= 14
    c.setFont(DISPLAY, 22); c.drawString(M, y, "License"); y -= 20
    c.setFont(SERIF, 10.5)
    for ln in wrap(LICENSE, SERIF, 10.5, W - 2 * M):
        c.drawString(M, y, ln); y -= 14
    c.showPage()

    cols, rows = 2, 3
    cw, ch = (W - 2 * M) / cols, (H - 2 * M - 14) / rows
    for p in range(0, len(items), cols * rows):
        page = items[p:p + cols * rows]
        c.setStrokeColor(GRAY); c.setDash(4, 4); c.setLineWidth(0.5)
        for k in range(1, cols):
            c.line(M + k * cw, M, M + k * cw, H - M - 14)
        for k in range(1, rows):
            c.line(M, M + k * ch, W - M, M + k * ch)
        c.setDash()
        for k, it in enumerate(page):
            x = M + (k % cols) * cw
            y = H - M - 14 - (k // cols + 1) * ch
            draw_art(c, prepared(d, it["color_file"], target), x + 8, y + 18, cw - 16, ch - 26, label(it))
            c.setFillColor(GRAY); c.setFont(SANS, 7)
            c.drawCentredString(x + cw / 2, y + 6, it["id"])
        c.setFont(SANS, 8); c.setFillColor(GRAY)
        c.drawString(M, H - M, f"{spec['theme']}  ·  cut along the dashed lines")
        c.drawRightString(W - M, H - M, f"{p + 1}-{p + len(page)} of {len(items)}")
        c.showPage()
    more_from_relentless(c, spec)
    c.save()
    return out


def build_png_zip(d, items):
    pngs = [d / it["color_file"] for it in items if (d / it["color_file"]).exists()]
    if pngs:
        with zipfile.ZipFile(d / f"{d.name}-clipart-PNGs.zip", "w", zipfile.ZIP_STORED) as z:
            for pth in pngs:
                z.write(pth, pth.name)
    return len(pngs)


# ---------- Book 2: coloring book ----------

LAYOUTS = {1: (1, 1), 2: (1, 2), 4: (2, 2), 6: (2, 3)}


def build_coloring(spec, d, items, target, per_page=6, single_sided=True):
    out = d / f"{d.name}-2-coloring-book-{target}.pdf"
    c = canvas.Canvas(str(out), pagesize=letter)
    c.setTitle(spec["titles"]["coloring"]); c.setAuthor("Relentless")
    title = spec["titles"]["coloring"]
    main, _, sub = title.partition(":")

    # 1 title page, 2 copyright, 3 belongs-to, 4 blank, 5 test page, 6 blank
    c.setFillColor(INK); c.setFont(DISPLAY, 38); c.drawCentredString(W / 2, H * 0.62, main)
    c.setFont(SERIF_I, 16)
    for i, ln in enumerate(wrap(sub.strip(), SERIF_I, 16, W - 2 * M)):
        c.drawCentredString(W / 2, H * 0.62 - 36 - i * 21, ln)
    c.setFont(SANS_B, 12); c.drawCentredString(W / 2, M, "RELENTLESS")
    c.showPage()
    copyright_page(c, title)
    c.setFillColor(INK); c.setFont(DISPLAY, 28); c.drawCentredString(W / 2, H * 0.6, "This Book Belongs To")
    c.setLineWidth(1); c.line(W * 0.2, H * 0.5, W * 0.8, H * 0.5)
    c.setFont(SERIF_I, 13)
    c.drawCentredString(W / 2, H * 0.4, "Slow down. Pick a color. Every one of these faces has a story.")
    c.showPage(); c.showPage()
    c.setFillColor(INK); c.setFont(DISPLAY, 24); c.drawCentredString(W / 2, H - 1.3 * inch, "Test Your Colors")
    c.setFont(SERIF_I, 11)
    c.drawCentredString(W / 2, H - 1.6 * inch, "Try your markers and pencils here first. The page behind every drawing is blank, so nothing bleeds through.")
    sw = (W - 2 * M) / 5
    c.setStrokeColor(INK); c.setLineWidth(1.2)
    for r in range(6):
        for k in range(5):
            c.circle(M + sw * k + sw / 2, H - 2.6 * inch - r * 1.25 * inch, 0.45 * inch)
    c.showPage(); c.showPage()

    cols, rows = LAYOUTS[per_page]
    cw, ch = (W - 2 * M) / cols, (H - 2 * M) / rows
    pages = 0
    for p in range(0, len(items), per_page):
        page = items[p:p + per_page]
        for k, it in enumerate(page):
            x = M + (k % cols) * cw
            y = H - M - (k // cols + 1) * ch
            draw_art(c, prepared(d, it["lineart_file"], target, lineart=True), x + 6, y + 6, cw - 12, ch - 12, label(it), lineart=True)
        c.setFont(SANS, 7); c.setFillColor(GRAY)
        c.drawCentredString(W / 2, M / 2, f"{page[0]['id']} – {page[-1]['id']}")
        c.showPage()
        pages += 1
        if single_sided:
            c.showPage()
    more_from_relentless(c, spec)
    c.save()
    return out, pages


# ---------- Book 3: story book ----------

class Art(Flowable):
    def __init__(self, img, w, h, lbl):
        super().__init__()
        self.img, self.width, self.height, self.lbl = img, w, h, lbl

    def draw(self):
        draw_art(self.canv, self.img, 0, 0, self.width, self.height, self.lbl)


class ChapterMark(Flowable):
    """Zero-size marker that feeds the table of contents."""
    def __init__(self, text):
        super().__init__()
        self.text = text

    def wrap(self, *a):
        return 0, 0

    def draw(self):
        pass


class CastPage(Flowable):
    """'Meet the Elders of Calloway Street': 8 cast members a page, portrait from style/refs/ when it exists."""
    def __init__(self, people, first):
        super().__init__()
        self.people, self.first = people, first

    def wrap(self, aw, ah):
        self.aw, self.ah = aw, ah
        return aw, ah

    def draw(self):
        c = self.canv
        top = self.ah
        if self.first:
            c.setFillColor(MUSTARD); c.setFont(SANS_B, 9.5); c.drawCentredString(self.aw / 2, top - 12, "MEET THE ELDERS OF")
            c.setFillColor(INK); c.setFont(DISPLAY, 26); c.drawCentredString(self.aw / 2, top - 44, "Calloway Street")
            top -= 64
        cw, rh = self.aw / 2, top / 4
        for k, p in enumerate(self.people):
            x, y = (k % 2) * cw, top - (k // 2 + 1) * rh
            ref = ROOT / "style" / "refs" / f"{p['id']}.png"
            img = None
            if ref.exists():
                img = ref.parent / "cache" / f"{p['id']}.jpg"
                if not img.exists():
                    img.parent.mkdir(exist_ok=True)
                    im = Image.open(ref).convert("RGBA"); bg = Image.new("RGBA", im.size, "white"); bg.alpha_composite(im)
                    w, h = bg.size; bg.crop((0, 0, w // 3, h)).convert("RGB").save(img, quality=88)  # front view only
            draw_art(c, img, x, y + 6, rh * 0.62, rh - 12, p["name"])
            tx = x + rh * 0.62 + 8
            c.setFillColor(INK); c.setFont(DISPLAY, 13); c.drawString(tx, y + rh - 28, p["name"])
            c.setFont(SERIF, 10); yy = y + rh - 46
            for ln in wrap(p["bio"], SERIF, 10, cw - rh * 0.62 - 20):
                c.drawString(tx, yy, ln); yy -= 13


class StoryDoc(BaseDocTemplate):
    def afterFlowable(self, f):
        if isinstance(f, ChapterMark):
            self.notify("TOCEntry", (0, f.text, self.page))


def build_story(spec, d, items, target):
    out = d / f"{d.name}-3-story-book-{target}.pdf"
    ms = parse_manuscript(spec["number"])
    by_id = {it["id"]: it for it in items}

    body = ParagraphStyle("body", fontName=SERIF, fontSize=11.5, leading=17, textColor=INK, spaceAfter=9, firstLineIndent=18)
    first = ParagraphStyle("first", parent=body, firstLineIndent=0)
    h1 = ParagraphStyle("h1", fontName=DISPLAY, fontSize=30, leading=36, textColor=INK, alignment=TA_CENTER, spaceAfter=8)
    kicker = ParagraphStyle("k", fontName=SANS_B, fontSize=9.5, leading=12, textColor=MUSTARD, alignment=TA_CENTER, spaceAfter=8)
    cap = ParagraphStyle("cap", fontName=SERIF_I, fontSize=12, leading=16, textColor=TEAL, alignment=TA_CENTER)
    center = ParagraphStyle("c", parent=body, alignment=TA_CENTER, firstLineIndent=0, fontName=SERIF_I, fontSize=13, leading=19)
    todo = ParagraphStyle("todo", parent=first, textColor=GRAY, fontName=SERIF_I)

    def footer(cv, doc):
        if doc.page > 4:
            cv.setFont(SANS, 8); cv.setFillColor(GRAY)
            cv.drawCentredString(W / 2, M / 2, str(doc.page))

    doc = StoryDoc(str(out), pagesize=letter, leftMargin=M, rightMargin=M, topMargin=M, bottomMargin=M,
                   title=spec["titles"]["story"], author="Relentless", initialFontName=SANS)
    doc.addPageTemplates([PageTemplate("p", [Frame(M, M, W - 2 * M, H - 2 * M, id="f", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)], onPage=footer)])
    fw, fh = W - 2 * M, H - 2 * M
    main, _, sub = spec["titles"]["story"].partition(":")

    def paras(blocks, missing):
        if not blocks:
            return [Paragraph(missing, todo)]
        return [Paragraph(b, first if i == 0 else body) for i, b in enumerate(blocks)]

    s = [Spacer(1, fh * 0.28), Paragraph(main, h1),
         Paragraph(sub.strip(), ParagraphStyle("s", parent=cap, fontSize=17, leading=22)),
         Spacer(1, 40), Paragraph("RELENTLESS", kicker), PageBreak()]

    class Copy(Flowable):
        def wrap(self, aw, ah):
            return aw, ah

        def draw(self):
            self.canv.saveState()
            self.canv.translate(-M, -M)
            copyright_page(_Shim(self.canv), spec["titles"]["story"])
            self.canv.restoreState()
    s += [Copy(), PageBreak()]

    s += [Spacer(1, fh * 0.32)] + [Paragraph(p, center) for p in (ms["dedication"] or ["For the ones who stayed on the porch long enough for us to come back."])] + [PageBreak()]

    toc = TableOfContents()
    toc.tableStyle = TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                 ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("FONTNAME", (0, 0), (-1, -1), SANS)])
    toc.levelStyles = [ParagraphStyle("toc", fontName=SERIF, fontSize=12.5, leading=22, textColor=INK, leftIndent=12)]
    s += [Paragraph("CONTENTS", kicker), Spacer(1, 12), toc, PageBreak()]

    cast = json.loads((ROOT / "style" / "cast.json").read_text())["cast"]
    for half in (cast[:8], cast[8:]):
        s += [CastPage(half, first=half[0] is cast[0]), PageBreak()]

    s += [ChapterMark("Introduction"), Paragraph("INTRODUCTION", kicker), Spacer(1, 8)]
    s += paras(ms["intro"], "[Introduction not written yet.]") + [PageBreak()]

    art_h = (fh - 80) / 2
    for n, title in enumerate(spec["chapters"], start=1):
        s += [ChapterMark(f"{n}.  {title}"), Spacer(1, 30), Paragraph(f"CHAPTER {n}", kicker), Paragraph(title, h1), Spacer(1, 14)]
        s += paras(ms["chapters"].get(n), f"[Story for '{title}' not written yet.]")
        s.append(PageBreak())
        pics = ms["pictures"].get(n) or [(it["id"], it["words"] and f"“{it['words']}”" or "")
                                         for it in items if it["chapter"] == n][:10]
        for i in range(0, len(pics), 2):
            cells = []
            for pid, text in pics[i:i + 2]:
                it = by_id[pid]
                cells += [[Art(prepared(d, it["color_file"], target), fw, art_h - 30, label(it))], [Paragraph(text, cap)]]
            t = Table(cells, colWidths=[fw])
            t.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                                   ("FONTNAME", (0, 0), (-1, -1), SANS)]))
            s += [t, PageBreak()]

    if ms["closing"]:
        s += [ChapterMark("A Word Before You Go"), Spacer(1, 30), Paragraph("A WORD BEFORE YOU GO", kicker), Spacer(1, 8)]
        s += paras(ms["closing"], "") + [PageBreak()]

    s += [Paragraph("YOUR TURN", kicker), Paragraph("Write Down What They Told You", ParagraphStyle("h2", parent=h1, fontSize=22, leading=28)),
          Spacer(1, 6), Paragraph("Name the elder. Write the sentence the way they said it. Then write what it means to you now.", center), Spacer(1, 10)]
    s += [Table([[""]] * 22, colWidths=[fw], rowHeights=[0.36 * inch] * 22,
                style=TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.5, GRAY), ("FONTNAME", (0, 0), (-1, -1), SANS)])), PageBreak()]

    class More(Flowable):
        def wrap(self, aw, ah):
            return aw, ah

        def draw(self):
            self.canv.saveState()
            self.canv.translate(-M, -M)
            more_from_relentless(_Shim(self.canv), spec)
            self.canv.restoreState()
    s.append(More())
    doc.multiBuild(s)
    return out, doc.page


class _Shim:
    """Lets the canvas-based helper pages draw inside a platypus flowable without ending the page."""
    def __init__(self, c):
        self._c = c

    def showPage(self):
        pass

    def __getattr__(self, k):
        return getattr(self._c, k)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("editions", nargs="*", type=int)
    ap.add_argument("--target", choices=["print", "digital", "both"], default="both")
    ap.add_argument("--per-page", type=int, default=6, choices=sorted(LAYOUTS))
    ap.add_argument("--double-sided", action="store_true")
    a = ap.parse_args()
    targets = ["print", "digital"] if a.target == "both" else [a.target]
    for n in a.editions or range(1, 11):
        spec, d, items = load_edition(n)
        have = build_png_zip(d, items)
        for t in targets:
            p1 = build_clipart(spec, d, items, t)
            p2, cp = build_coloring(spec, d, items, t, a.per_page, not a.double_sided)
            p3, sp = build_story(spec, d, items, t)
            sizes = " ".join(f"{p.name.split('-', 3)[-1]}={p.stat().st_size / 1e6:.1f}MB" for p in (p1, p2, p3))
            print(f"Edition {n:>2} [{t}] art {have}/250 | coloring {cp} art pages | story {sp} pages | {sizes}")


if __name__ == "__main__":
    main()
