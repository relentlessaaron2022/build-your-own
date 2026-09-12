"""Pin description + CTA generation.

Descriptions are keyword-rich (Pinterest is a search engine first) and
pull their CTA from the brand's approved_ctas list so every pin stays on
voice. Banned phrases are scrubbed defensively even though templates
shouldn't produce them.
"""
from __future__ import annotations

from app.config import brand_for_key

_DESCRIPTION_TEMPLATES = [
    "{headline}. {keyword_line} {value_line}",
    "{value_line} {keyword_line} {headline}.",
    "{keyword_line} Here's what actually works: {headline_lower}.",
]

_VALUE_LINES = [
    "Practical, no-fluff ideas you can use today.",
    "Built for people who don't have hours to spare.",
    "Straightforward steps, not another vague framework.",
    "The kind of advice that pays for itself fast.",
]


def _scrub_banned(text: str, banned_phrases: list[str]) -> str:
    for phrase in banned_phrases:
        if phrase.lower() in text.lower():
            text = text.replace(phrase, "").replace(phrase.title(), "").replace(phrase.upper(), "")
    return " ".join(text.split())


def generate_description(
    headline: str,
    keyword: str,
    brand_key: str,
    variant_seed: int = 0,
) -> dict:
    brand = brand_for_key(brand_key)
    banned_phrases = brand.get("banned_phrases", [])
    approved_ctas = brand.get("approved_ctas") or ["Learn More"]

    keyword_line = f"{keyword.capitalize()}." if keyword else ""
    value_line = _VALUE_LINES[variant_seed % len(_VALUE_LINES)]
    template = _DESCRIPTION_TEMPLATES[variant_seed % len(_DESCRIPTION_TEMPLATES)]

    description = template.format(
        headline=headline,
        headline_lower=headline.rstrip(".").lower(),
        keyword_line=keyword_line,
        value_line=value_line,
    )
    description = _scrub_banned(description, banned_phrases)

    cta = approved_ctas[variant_seed % len(approved_ctas)]

    return {"description": description, "cta": cta}
