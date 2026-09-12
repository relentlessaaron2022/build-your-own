"""Pinterest-suitability scoring, per the weighted formula in the spec:

    Evergreen value:     30%
    Search potential:    25%
    Commercial intent:   20%
    Visual potential:    15%
    Brand alignment:     10%

Every sub-score is heuristic and 0-100; heuristics are intentionally simple
and file-local so they're easy to retune without touching callers.
"""
from __future__ import annotations

import datetime as dt
import re

WEIGHTS = {
    "evergreen": 0.30,
    "search": 0.25,
    "commercial": 0.20,
    "visual": 0.15,
    "brand": 0.10,
}

DEFAULT_THRESHOLD = 55.0

EVERGREEN_SIGNAL_WORDS = [
    "guide", "how to", "tips", "best", "prompts", "checklist", "beginner",
    "strategy", "framework", "template", "steps",
]
TIME_SENSITIVE_WORDS = ["breaking", "today", "this week", "2024", "2025", "yesterday"]
COMMERCIAL_SIGNAL_WORDS = ["buy", "course", "studio", "product", "offer", "guide", "toolkit", "template", "download"]


def score_evergreen(title: str, body_excerpt: str, publish_date: dt.datetime | None) -> float:
    text = f"{title} {body_excerpt}".lower()
    score = 40.0
    score += sum(8 for w in EVERGREEN_SIGNAL_WORDS if w in text)
    score -= sum(15 for w in TIME_SENSITIVE_WORDS if w in text)
    if publish_date:
        age_days = (dt.datetime.now(dt.timezone.utc) - publish_date).days
        if age_days > 180:
            score += 10  # survived the test of time
    return max(0.0, min(100.0, score))


def score_search_potential(title: str, keywords: list[str] | None = None) -> float:
    score = 45.0
    word_count = len(title.split())
    if 4 <= word_count <= 12:
        score += 20
    if keywords:
        score += min(30, 6 * len(keywords))
    if re.search(r"\b(how to|what is|why|best)\b", title.lower()):
        score += 10
    return max(0.0, min(100.0, score))


def score_commercial_intent(title: str, body_excerpt: str, landing_url: str) -> float:
    text = f"{title} {body_excerpt} {landing_url}".lower()
    score = 30.0
    score += sum(10 for w in COMMERCIAL_SIGNAL_WORDS if w in text)
    return max(0.0, min(100.0, score))


def score_visual_potential(image_url: str, category: str) -> float:
    score = 30.0 if image_url else 10.0
    if category:
        score += 15
    return max(0.0, min(100.0, score))


def score_brand_alignment(title: str, banned_phrases: list[str] | None = None) -> float:
    text = title.lower()
    score = 70.0
    for phrase in banned_phrases or []:
        if phrase.lower() in text:
            score -= 40
    return max(0.0, min(100.0, score))


def score_content(
    *,
    title: str,
    body_excerpt: str = "",
    image_url: str = "",
    category: str = "",
    landing_url: str = "",
    publish_date: dt.datetime | None = None,
    keywords: list[str] | None = None,
    banned_phrases: list[str] | None = None,
) -> dict[str, float]:
    evergreen = score_evergreen(title, body_excerpt, publish_date)
    search = score_search_potential(title, keywords)
    commercial = score_commercial_intent(title, body_excerpt, landing_url)
    visual = score_visual_potential(image_url, category)
    brand = score_brand_alignment(title, banned_phrases)

    composite = (
        evergreen * WEIGHTS["evergreen"]
        + search * WEIGHTS["search"]
        + commercial * WEIGHTS["commercial"]
        + visual * WEIGHTS["visual"]
        + brand * WEIGHTS["brand"]
    )

    return {
        "evergreen_score": round(evergreen, 2),
        "commercial_score": round(commercial, 2),
        "search_score": round(search, 2),
        "visual_score": round(visual, 2),
        "brand_score": round(brand, 2),
        "composite_score": round(composite, 2),
    }


def meets_threshold(composite_score: float, threshold: float = DEFAULT_THRESHOLD) -> bool:
    return composite_score >= threshold
