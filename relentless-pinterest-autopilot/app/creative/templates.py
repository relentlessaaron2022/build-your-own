"""Pillow-based Pin graphic templates.

Five templates minimum per the spec: Bold Headline, Checklist, Curiosity,
Before/After, Authority. All render at the default Pinterest size
(1000x1500, 2:3) so no per-template dimension math is needed elsewhere.
Every render is deterministic given the same inputs, which matters for
duplicate detection downstream (same inputs -> same perceptual hash ->
correctly flagged as a repeat rather than a "new" pin).
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

from app.creative.fonts import load_font
from app.creative.textfit import fit_text_block, wrap_to_width

CANVAS_SIZE = (1000, 1500)

VISUAL_STYLES = ["bold_headline", "checklist", "curiosity", "before_after", "authority"]


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def _base_canvas(brand: dict) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    colors = brand.get("colors", {})
    bg = _hex_to_rgb(colors.get("background", "#111111"))
    img = Image.new("RGB", CANVAS_SIZE, bg)
    draw = ImageDraw.Draw(img)
    return img, draw


def _draw_brand_footer(draw: ImageDraw.ImageDraw, brand: dict, fonts: dict) -> None:
    colors = brand.get("colors", {})
    accent = _hex_to_rgb(colors.get("accent", "#FFFFFF"))
    name = brand.get("display_name", "")
    if not name:
        return
    font = load_font(fonts["body"], 28)
    draw.text((60, CANVAS_SIZE[1] - 70), name, font=font, fill=accent)


def render_bold_headline(headline: str, subheadline: str, brand: dict, **_) -> Image.Image:
    colors = brand.get("colors", {})
    primary = _hex_to_rgb(colors.get("primary", "#0B0B0B"))
    secondary = _hex_to_rgb(colors.get("secondary", "#D4AF37"))
    accent = _hex_to_rgb(colors.get("accent", "#FFFFFF"))
    fonts = brand.get("typography", {"headline_font": "DejaVuSans-Bold.ttf", "body_font": "DejaVuSans.ttf"})
    fonts = {"headline": fonts.get("headline_font", "DejaVuSans-Bold.ttf"), "body": fonts.get("body_font", "DejaVuSans.ttf")}

    img, draw = _base_canvas(brand)
    draw.rectangle([(0, 0), (CANVAS_SIZE[0], 24)], fill=secondary)

    lines, size, line_height = fit_text_block(draw, headline, fonts["headline"], max_width=860, max_height=700, start_size=96)
    font = load_font(fonts["headline"], size)
    total_height = line_height * len(lines)
    y = (CANVAS_SIZE[1] - total_height) // 2 - 100
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        x = (CANVAS_SIZE[0] - (bbox[2] - bbox[0])) // 2
        draw.text((x, y), line, font=font, fill=accent)
        y += line_height

    if subheadline:
        sub_font = load_font(fonts["body"], 34)
        sub_lines = wrap_to_width(draw, subheadline, fonts["body"], 34, 780)
        for line in sub_lines:
            bbox = draw.textbbox((0, 0), line, font=sub_font)
            x = (CANVAS_SIZE[0] - (bbox[2] - bbox[0])) // 2
            draw.text((x, y + 20), line, font=sub_font, fill=secondary)
            y += 46

    _draw_brand_footer(draw, brand, fonts)
    _ = primary
    return img


def render_checklist(headline: str, subheadline: str, brand: dict, checklist_items: list[str] | None = None, **_) -> Image.Image:
    colors = brand.get("colors", {})
    secondary = _hex_to_rgb(colors.get("secondary", "#D4AF37"))
    accent = _hex_to_rgb(colors.get("accent", "#FFFFFF"))
    fonts = brand.get("typography", {})
    fonts = {"headline": fonts.get("headline_font", "DejaVuSans-Bold.ttf"), "body": fonts.get("body_font", "DejaVuSans.ttf")}

    img, draw = _base_canvas(brand)

    lines, size, line_height = fit_text_block(draw, headline, fonts["headline"], max_width=860, max_height=380, start_size=64)
    font = load_font(fonts["headline"], size)
    y = 90
    for line in lines:
        draw.text((70, y), line, font=font, fill=accent)
        y += line_height

    y += 40
    items = checklist_items or [subheadline] if subheadline else []
    if not items:
        items = ["Save this for later", "Try it today", "Share with your team"]
    item_font = load_font(fonts["body"], 42)
    box_size = 40
    for item in items[:6]:
        draw.rectangle([(70, y), (70 + box_size, y + box_size)], outline=secondary, width=4)
        draw.line([(70 + 8, y + 20), (70 + 16, y + 30)], fill=secondary, width=4)
        draw.line([(70 + 16, y + 30), (70 + 32, y + 10)], fill=secondary, width=4)
        item_lines = wrap_to_width(draw, item, fonts["body"], 42, 800)
        line_y = y - 2
        for il in item_lines:
            draw.text((70 + box_size + 24, line_y), il, font=item_font, fill=accent)
            line_y += 52
        y += max(70, 52 * len(item_lines) + 20)

    _draw_brand_footer(draw, brand, fonts)
    return img


def render_curiosity(headline: str, subheadline: str, brand: dict, **_) -> Image.Image:
    colors = brand.get("colors", {})
    secondary = _hex_to_rgb(colors.get("secondary", "#D4AF37"))
    accent = _hex_to_rgb(colors.get("accent", "#FFFFFF"))
    fonts = brand.get("typography", {})
    fonts = {"headline": fonts.get("headline_font", "DejaVuSans-Bold.ttf"), "body": fonts.get("body_font", "DejaVuSans.ttf")}

    img, draw = _base_canvas(brand)
    draw.ellipse([(-200, -200), (400, 400)], outline=secondary, width=6)
    draw.ellipse([(650, 1150), (1250, 1750)], outline=secondary, width=6)

    lines, size, line_height = fit_text_block(draw, headline, fonts["headline"], max_width=820, max_height=640, start_size=80)
    font = load_font(fonts["headline"], size)
    total_height = line_height * len(lines)
    y = (CANVAS_SIZE[1] - total_height) // 2
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        x = (CANVAS_SIZE[0] - (bbox[2] - bbox[0])) // 2
        draw.text((x, y), line, font=font, fill=accent)
        y += line_height

    if subheadline:
        sub_font = load_font(fonts["body"], 32)
        bbox = draw.textbbox((0, 0), subheadline, font=sub_font)
        x = (CANVAS_SIZE[0] - (bbox[2] - bbox[0])) // 2
        draw.text((x, y + 30), subheadline, font=sub_font, fill=secondary)

    _draw_brand_footer(draw, brand, fonts)
    return img


def render_before_after(headline: str, subheadline: str, brand: dict, before_label: str = "BEFORE", after_label: str = "AFTER", **_) -> Image.Image:
    colors = brand.get("colors", {})
    primary = _hex_to_rgb(colors.get("primary", "#0B0B0B"))
    secondary = _hex_to_rgb(colors.get("secondary", "#D4AF37"))
    accent = _hex_to_rgb(colors.get("accent", "#FFFFFF"))
    fonts = brand.get("typography", {})
    fonts = {"headline": fonts.get("headline_font", "DejaVuSans-Bold.ttf"), "body": fonts.get("body_font", "DejaVuSans.ttf")}

    img, draw = _base_canvas(brand)
    half = CANVAS_SIZE[1] // 2
    draw.rectangle([(0, 0), (CANVAS_SIZE[0], half)], fill=primary)
    draw.rectangle([(0, half), (CANVAS_SIZE[0], CANVAS_SIZE[1])], fill=_hex_to_rgb(colors.get("background", "#111111")))
    draw.line([(0, half), (CANVAS_SIZE[0], half)], fill=secondary, width=8)

    label_font = load_font(fonts["headline"], 44)
    draw.text((60, 50), before_label, font=label_font, fill=secondary)
    draw.text((60, half + 40), after_label, font=label_font, fill=secondary)

    lines, size, line_height = fit_text_block(draw, headline, fonts["headline"], max_width=860, max_height=260, start_size=56)
    font = load_font(fonts["headline"], size)
    y = half + 120
    for line in lines:
        draw.text((60, y), line, font=font, fill=accent)
        y += line_height

    if subheadline:
        sub_font = load_font(fonts["body"], 32)
        sub_lines = wrap_to_width(draw, subheadline, fonts["body"], 32, 860)
        y2 = 140
        for line in sub_lines:
            draw.text((60, y2), line, font=sub_font, fill=accent)
            y2 += 40

    _draw_brand_footer(draw, brand, fonts)
    return img


def render_authority(headline: str, subheadline: str, brand: dict, **_) -> Image.Image:
    colors = brand.get("colors", {})
    secondary = _hex_to_rgb(colors.get("secondary", "#D4AF37"))
    accent = _hex_to_rgb(colors.get("accent", "#FFFFFF"))
    fonts = brand.get("typography", {})
    fonts = {"headline": fonts.get("headline_font", "DejaVuSans-Bold.ttf"), "body": fonts.get("body_font", "DejaVuSans.ttf")}

    img, draw = _base_canvas(brand)
    draw.rectangle([(0, 0), (CANVAS_SIZE[0], 10)], fill=secondary)
    draw.rectangle([(0, CANVAS_SIZE[1] - 10), (CANVAS_SIZE[0], CANVAS_SIZE[1])], fill=secondary)

    name = brand.get("display_name", "")
    name_font = load_font(fonts["headline"], 40)
    bbox = draw.textbbox((0, 0), name.upper(), font=name_font)
    x = (CANVAS_SIZE[0] - (bbox[2] - bbox[0])) // 2
    draw.text((x, 90), name.upper(), font=name_font, fill=secondary)

    lines, size, line_height = fit_text_block(draw, headline, fonts["headline"], max_width=820, max_height=560, start_size=72)
    font = load_font(fonts["headline"], size)
    total_height = line_height * len(lines)
    y = (CANVAS_SIZE[1] - total_height) // 2
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        x = (CANVAS_SIZE[0] - (bbox[2] - bbox[0])) // 2
        draw.text((x, y), line, font=font, fill=accent)
        y += line_height

    if subheadline:
        sub_font = load_font(fonts["body"], 30)
        bbox = draw.textbbox((0, 0), subheadline, font=sub_font)
        x = (CANVAS_SIZE[0] - (bbox[2] - bbox[0])) // 2
        draw.text((x, y + 40), subheadline, font=sub_font, fill=secondary)

    return img


RENDERERS = {
    "bold_headline": render_bold_headline,
    "checklist": render_checklist,
    "curiosity": render_curiosity,
    "before_after": render_before_after,
    "authority": render_authority,
}


def render_template(style: str, headline: str, subheadline: str, brand: dict, **kwargs) -> Image.Image:
    renderer = RENDERERS.get(style, render_bold_headline)
    return renderer(headline, subheadline, brand, **kwargs)


def save_pin_image(image: Image.Image, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    assert image.size == CANVAS_SIZE, f"Pin image must be {CANVAS_SIZE}, got {image.size}"
    image.save(output_path, format="PNG")
    return output_path
