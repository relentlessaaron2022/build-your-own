"""Font resolution. Brand config names fonts like "DejaVuSans-Bold.ttf";
this resolves that name to an actual usable font file, checking common
Linux system font locations, falling back to Pillow's bitmap default so
rendering never crashes even on a minimal system with no fonts installed.
"""
from __future__ import annotations

from pathlib import Path

from PIL import ImageFont

from app.logging_config import get_logger

logger = get_logger(__name__)

_SEARCH_DIRS = [
    Path("/usr/share/fonts/truetype/dejavu"),
    Path("/usr/share/fonts/truetype/liberation"),
    Path("/usr/share/fonts/truetype"),
    Path("/usr/share/fonts"),
    Path("/Library/Fonts"),
    Path("C:/Windows/Fonts"),
]

_cache: dict[tuple[str, int], "ImageFont.FreeTypeFont"] = {}


def _find_font_path(font_name: str) -> Path | None:
    for base in _SEARCH_DIRS:
        candidate = base / font_name
        if candidate.exists():
            return candidate
        if base.exists():
            matches = list(base.rglob(font_name))
            if matches:
                return matches[0]
    return None


def load_font(font_name: str, size: int) -> ImageFont.ImageFont:
    key = (font_name, size)
    if key in _cache:
        return _cache[key]

    path = _find_font_path(font_name)
    if path:
        font = ImageFont.truetype(str(path), size)
    else:
        logger.warning("Font %s not found on system, falling back to bitmap default", font_name)
        try:
            font = ImageFont.load_default(size=size)
        except TypeError:
            font = ImageFont.load_default()
    _cache[key] = font
    return font
