#!/usr/bin/env python3
"""Assemble the three books for each edition.

  Book 1  Clipart Bundle   -> <slug>-1-clipart-bundle.pdf  + <slug>-clipart-PNGs.zip
  Book 2  Coloring Book    -> <slug>-2-coloring-book.pdf
  Book 3  Story Book       -> <slug>-3-story-book.pdf

Missing art is drawn as a labeled placeholder box, so you can proof layouts
before a single image exists. Real PNGs drop in automatically on the next run.

Usage:
  python tools/build_books.py                 all 10 editions
  python tools/build_books.py 1 5             editions 1 and 5
  python tools/build_books.py 1 --per-page 4  coloring book with 4 images a page instead of 6
  python tools/build_books.py 1 --single-sided  blank page behind every coloring page (marker bleed)

Needs: pip install reportlab pillow
"""
import argparse
import json
import re
import zipfile
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (BaseDocTemplate, Flowable, Frame, PageBreak, PageTemplate,
                                Paragraph, Spacer, Table, TableStyle)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output"
W, H = letter
M = 0.6 * inch  # safe margin, inside KDP's minimum for no-bleed interiors

INK = colors.HexColor("#3B2A1E")      # cocoa
MUSTARD = colors.HexColor("#C9962B")
TEAL = colors.HexColor("#2F5D62")
CREAM = colors.HexColor("#F6EEDC")
GRAY = colors.HexColor("#9A8F80")

SERIF, SERIF_B, SERIF_I = "Times-Roman", "Times-Bold", "Times-Italic"
SANS, SANS_B = "Helvetica", "Helvetica-Bold"

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
    "Wall art: frame a single elder or a word-art phrase for a living room or nursing-home room.",
    "Memorial and celebration-of-life keepsakes, handled with care and respect.",
]

LICENSE = (
    "You may use these images in your own projects and in products you sell (cards, shirts, mugs, "
    "printed goods, social posts and similar) as long as the clipart is part of a finished design. "
    "You may not resell, share or give away the images themselves as clipart, digital stamps, "
    "templates or in any AI training set. Credit is appreciated but not required."
)


# ---------- helpers ----------

def load_edition(n):
    spec = json.loads(next((ROOT / "editions").glob(f"{n:02d}-*.json")).read_text())
    d = next(OUT.glob(f"{n:02d}-*"), None)
    if d is None:
        raise SystemExit(f"Run tools/build_prompts.py first (no shot list for edition {n}).")
    items = [json.loads(l) for l in open(d / "prompts.jsonl")]
    return spec, d, items


def wrap(text, font, size, width):
    from reportlab.pdfbase.pdfmetrics import stringWidth
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


def draw_art(c, path, x, y, w, h, label, lineart=False):
    """Draw the PNG fitted into the box, or a placeholder if it doesn't exist yet."""
    if path.exists():
        c.drawImage(str(path), x, y, w, h, preserveAspectRatio=True, anchor="c", mask="auto")
        return
    c.saveState()
    c.setStrokeColor(GRAY)
    c.setFillColor(colors.white if lineart else CREAM)
    c.setDash(3, 3) if lineart else None
    c.roundRect(x + 4, y + 4, w - 8, h - 8, 10, fill=1, stroke=1)
    c.setFillColor(GRAY)
    c.setFont(SANS, 8)
    lines = wrap(label, SANS, 8, w - 24)[:6]
    ty = y + h / 2 + len(lines) * 5
    for ln in lines:
        c.drawCentredString(x + w / 2, ty, ln)
        ty -= 10
    c.restoreState()


def short_label(it):
    return f"{it['id']}  |  {it['title']}"


# ---------- Book 1: clipart bundle ----------

def build_clipart(spec, d, items):
    out = d / f"{d.name}-1-clipart-bundle.pdf"
    c = canvas.Canvas(str(out), pagesize=letter)
    c.setTitle(spec["titles"]["clipart"])
    c.setAuthor("Relentless")

    # Cover with a 3x3 preview
    c.setFillColor(CREAM); c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(INK); c.setFont(SANS_B, 16)
    c.drawCentredString(W / 2, H - 1.0 * inch, "250 PNG CLIPARTS")
    c.setFillColor(MUSTARD); c.setFont(SERIF_B, 34)
    c.drawCentredString(W / 2, H - 1.6 * inch, spec["theme"].split(":")[0])
    if ":" in spec["theme"]:
        c.setFillColor(TEAL); c.setFont(SERIF_I, 18)
        c.drawCentredString(W / 2, H - 2.0 * inch, spec["theme"].split(":", 1)[1].strip())
    cell = (W - 2 * M) / 3
    picks = [i for i in items if i["category"] in ("solo", "pair")][:9]
    for k, it in enumerate(picks):
        x = M + (k % 3) * cell
        y = H - 2.4 * inch - (k // 3 + 1) * cell
        draw_art(c, d / it["color_file"], x, y, cell, cell, short_label(it))
    c.setFillColor(INK); c.setFont(SANS, 10)
    c.drawCentredString(W / 2, 0.6 * inch, "Transparent PNG  ·  300 DPI  ·  Personal & Small-Business Commercial Use  ·  Relentless")
    c.showPage()

    # Inside page: what's included, ideas, license
    y = H - M - 10
    c.setFillColor(INK); c.setFont(SERIF_B, 20); c.drawString(M, y, "What's Inside"); y -= 26
    counts = {}
    for it in items:
        counts[it["category"]] = counts.get(it["category"], 0) + 1
    names = {"solo": "single elders", "pair": "pairs and couples", "group": "group scenes",
             "prop": "theme objects", "wordart": "hand-lettered phrases"}
    c.setFont(SANS, 11)
    for k, v in counts.items():
        c.drawString(M + 12, y, f"{v}  {names[k]}"); y -= 15
    c.drawString(M + 12, y, "Every image is a separate transparent PNG in the ZIP. This PDF is the catalog and cut-out sheet."); y -= 30
    c.setFont(SERIF_B, 20); c.drawString(M, y, "Ideas for Crafters"); y -= 22
    c.setFont(SANS, 10.5)
    for idea in CRAFT_IDEAS:
        for i, ln in enumerate(wrap(idea, SANS, 10.5, W - 2 * M - 24)):
            c.drawString(M + 12, y, ("•  " if i == 0 else "   ") + ln); y -= 14
        y -= 3
    y -= 16
    c.setFont(SERIF_B, 20); c.drawString(M, y, "License"); y -= 20
    c.setFont(SANS, 10.5)
    for ln in wrap(LICENSE, SANS, 10.5, W - 2 * M):
        c.drawString(M, y, ln); y -= 14
    c.showPage()

    # Catalog / cut-out pages: 2 x 3 grid with dashed cut lines
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
            draw_art(c, d / it["color_file"], x + 8, y + 18, cw - 16, ch - 26, short_label(it))
            c.setFillColor(GRAY); c.setFont(SANS, 7)
            c.drawCentredString(x + cw / 2, y + 6, it["id"])
        c.setFont(SANS, 8); c.setFillColor(GRAY)
        c.drawString(M, H - M, f"{spec['theme']}  ·  cut along the dashed lines")
        c.drawRightString(W - M, H - M, f"{p + 1}-{p + len(page)} of {len(items)}")
        c.showPage()
    c.save()

    pngs = [d / it["color_file"] for it in items if (d / it["color_file"]).exists()]
    if pngs:
        with zipfile.ZipFile(d / f"{d.name}-clipart-PNGs.zip", "w", zipfile.ZIP_STORED) as z:
            for pth in pngs:
                z.write(pth, pth.name)
    return out, len(pngs)


# ---------- Book 2: coloring book ----------

LAYOUTS = {1: (1, 1), 2: (1, 2), 4: (2, 2), 6: (2, 3)}


def build_coloring(spec, d, items, per_page=6, single_sided=False):
    out = d / f"{d.name}-2-coloring-book.pdf"
    c = canvas.Canvas(str(out), pagesize=letter)
    c.setTitle(spec["titles"]["coloring"]); c.setAuthor("Relentless")

    title = spec["titles"]["coloring"]
    main, _, sub = title.partition(":")
    c.setFillColor(INK); c.setFont(SERIF_B, 36); c.drawCentredString(W / 2, H * 0.62, main)
    c.setFont(SERIF_I, 16)
    for i, ln in enumerate(wrap(sub.strip(), SERIF_I, 16, W - 2 * M)):
        c.drawCentredString(W / 2, H * 0.62 - 34 - i * 20, ln)
    c.setFont(SANS, 11); c.drawCentredString(W / 2, M, "Relentless")
    c.showPage()

    c.setFont(SERIF_B, 24); c.drawCentredString(W / 2, H * 0.6, "This Book Belongs To")
    c.setLineWidth(1); c.line(W * 0.2, H * 0.5, W * 0.8, H * 0.5)
    c.setFont(SERIF_I, 13)
    c.drawCentredString(W / 2, H * 0.4, "Slow down. Pick a color. Every one of these faces has a story.")
    c.showPage()
    if single_sided:
        c.showPage()

    cols, rows = LAYOUTS[per_page]
    cw, ch = (W - 2 * M) / cols, (H - 2 * M) / rows
    page_no = 0
    for p in range(0, len(items), per_page):
        page = items[p:p + per_page]
        for k, it in enumerate(page):
            x = M + (k % cols) * cw
            y = H - M - (k // cols + 1) * ch
            draw_art(c, d / it["lineart_file"], x + 6, y + 6, cw - 12, ch - 12, short_label(it), lineart=True)
        page_no += 1
        c.setFont(SANS, 7); c.setFillColor(GRAY)
        c.drawCentredString(W / 2, M / 2, f"{page[0]['id']} – {page[-1]['id']}")
        c.showPage()
        if single_sided:
            c.showPage()
    c.save()
    return out, page_no


# ---------- Book 3: story book ----------

class Art(Flowable):
    def __init__(self, path, w, h, label):
        super().__init__()
        self.path, self.width, self.height, self.label = path, w, h, label

    def draw(self):
        draw_art(self.canv, self.path, 0, 0, self.width, self.height, self.label)


def parse_manuscript(d):
    p = next((ROOT / "manuscripts").glob(f"{d.name[:2]}-*.md"), None)
    ms = {"intro": [], "chapters": {}, "captions": {}}
    if not p:
        return ms
    section = None
    for block in re.split(r"\n\s*\n", p.read_text()):
        block = block.strip()
        if not block or block.startswith("<!--"):
            continue
        if block.startswith("# "):
            head, _, rest = block.partition("\n")
            h = head[2:].strip().lower()
            if h.startswith("introduction"):
                section = "intro"
            elif h.startswith("chapter"):
                section = int(re.findall(r"\d+", h)[0])
                ms["chapters"][section] = []
            elif h.startswith("captions"):
                section = "captions"
            block = rest.strip()
            if not block:
                continue
        if section == "captions":
            for ln in block.splitlines():
                m = re.match(r"(E\d\d-\d\d\d)\s*[:\-]\s*(.+)", ln.strip())
                if m:
                    ms["captions"][m.group(1)] = m.group(2).strip()
        elif section == "intro":
            ms["intro"].append(block)
        elif isinstance(section, int):
            ms["chapters"][section].append(block)
    return ms


def build_story(spec, d, items):
    out = d / f"{d.name}-3-story-book.pdf"
    ms = parse_manuscript(d)
    body = ParagraphStyle("body", fontName=SERIF, fontSize=12, leading=17, textColor=INK, spaceAfter=10, firstLineIndent=18)
    h1 = ParagraphStyle("h1", fontName=SERIF_B, fontSize=28, leading=34, textColor=INK, alignment=TA_CENTER, spaceAfter=8)
    kicker = ParagraphStyle("k", fontName=SANS_B, fontSize=10, leading=12, textColor=MUSTARD, alignment=TA_CENTER, spaceAfter=6)
    cap = ParagraphStyle("cap", fontName=SERIF_I, fontSize=12, leading=15, textColor=TEAL, alignment=TA_CENTER)
    todo = ParagraphStyle("todo", parent=body, textColor=GRAY, fontName=SERIF_I, firstLineIndent=0)

    def footer(cv, doc):
        cv.setFont(SANS, 8); cv.setFillColor(GRAY)
        cv.drawCentredString(W / 2, M / 2, str(doc.page))

    doc = BaseDocTemplate(str(out), pagesize=letter, leftMargin=M, rightMargin=M, topMargin=M, bottomMargin=M,
                          title=spec["titles"]["story"], author="Relentless")
    doc.addPageTemplates([PageTemplate("p", [Frame(M, M, W - 2 * M, H - 2 * M, id="f")], onPage=footer)])
    fw, fh = W - 2 * M, H - 2 * M

    main, _, sub = spec["titles"]["story"].partition(":")
    s = [Spacer(1, fh * 0.3), Paragraph(main, h1), Paragraph(sub.strip(), ParagraphStyle("s", parent=cap, fontSize=16, leading=20)),
         Spacer(1, 40), Paragraph("RELENTLESS", kicker), PageBreak()]

    s.append(Paragraph("INTRODUCTION", kicker))
    for para in ms["intro"] or ["[Introduction not written yet. Add it under '# Introduction' in the manuscript file.]"]:
        s.append(Paragraph(para, body if ms["intro"] else todo))
    s.append(PageBreak())

    by_ch = {}
    for it in items:
        by_ch.setdefault(it["chapter"], []).append(it)
    art_h = (fh - 70) / 2
    for n, title in enumerate(spec["chapters"], start=1):
        s += [Spacer(1, 40), Paragraph(f"CHAPTER {n}", kicker), Paragraph(title, h1), Spacer(1, 16)]
        story = ms["chapters"].get(n)
        for para in story or [f"[Story for '{title}' not written yet. Add it under '# Chapter {n}' in the manuscript file.]"]:
            s.append(Paragraph(para, body if story else todo))
        s.append(PageBreak())
        pics = by_ch.get(n, [])
        for i in range(0, len(pics), 2):
            rows = []
            for it in pics[i:i + 2]:
                text = ms["captions"].get(it["id"]) or (it["words"] and f"“{it['words']}”") or ""
                rows.append([Art(d / it["color_file"], fw, art_h - 24, short_label(it))])
                rows.append([Paragraph(text, cap)])
            t = Table(rows, colWidths=[fw])
            t.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
            s += [t, PageBreak()]
    doc.build(s)
    return out, doc.page


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("editions", nargs="*", type=int)
    ap.add_argument("--per-page", type=int, default=6, choices=sorted(LAYOUTS))
    ap.add_argument("--single-sided", action="store_true")
    a = ap.parse_args()
    for n in a.editions or range(1, 11):
        spec, d, items = load_edition(n)
        p1, have = build_clipart(spec, d, items)
        p2, cpages = build_coloring(spec, d, items, a.per_page, a.single_sided)
        p3, spages = build_story(spec, d, items)
        print(f"Edition {n:>2}: art {have}/250 | {p1.name} | {p2.name} ({cpages} coloring pages) | {p3.name} ({spages} pages)")


if __name__ == "__main__":
    main()
