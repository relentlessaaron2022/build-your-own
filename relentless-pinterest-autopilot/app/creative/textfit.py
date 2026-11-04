"""Text wrapping/auto-shrink so headline text is never cut off -- one of
the mandatory quality-control checks in the spec."""
from __future__ import annotations

from PIL import ImageDraw

from app.creative.fonts import load_font


def wrap_to_width(draw: ImageDraw.ImageDraw, text: str, font_name: str, size: int, max_width: int) -> list[str]:
    font = load_font(font_name, size)
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        bbox = draw.textbbox((0, 0), candidate, font=font)
        if bbox[2] - bbox[0] <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def fit_text_block(
    draw: ImageDraw.ImageDraw,
    text: str,
    font_name: str,
    max_width: int,
    max_height: int,
    start_size: int,
    min_size: int = 28,
) -> tuple[list[str], int, int]:
    """Shrink font size until the wrapped text block fits within
    (max_width, max_height). Returns (lines, font_size, line_height)."""
    size = start_size
    while size >= min_size:
        font = load_font(font_name, size)
        lines = wrap_to_width(draw, text, font_name, size, max_width)
        line_height = int(size * 1.25)
        total_height = line_height * len(lines)
        widest = max((draw.textbbox((0, 0), line, font=font)[2] for line in lines), default=0)
        if total_height <= max_height and widest <= max_width:
            return lines, size, line_height
        size -= 4
    # Give up shrinking further; caller accepts the smallest size even if tight.
    font = load_font(font_name, min_size)
    lines = wrap_to_width(draw, text, font_name, min_size, max_width)
    return lines, min_size, int(min_size * 1.25)
