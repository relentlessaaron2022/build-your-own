"""Keyword engine: one primary keyword, 3-8 secondary keywords, several
long-tail phrases, and search-intent angles for a topic.

Works with zero external credentials via a deterministic heuristic
generator. If OPENAI_API_KEY is set, an LLM pass is used instead for
sharper, less template-y phrasing -- but the system never blocks on it.
"""
from __future__ import annotations

import json
import re

import requests

from app.config import settings
from app.logging_config import get_logger

logger = get_logger(__name__)

SECONDARY_MODIFIERS = [
    "for entrepreneurs",
    "for small business",
    "for beginners",
    "that save time",
    "for productivity",
    "for marketing",
    "tips",
    "examples",
]

LONG_TAIL_TEMPLATES = [
    "how to use {topic}",
    "best {topic}",
    "{topic} that actually work",
    "{topic} step by step",
    "why {topic} matters",
]

INTENT_ANGLES = [
    "beginner education",
    "time-saving productivity",
    "revenue growth",
    "avoiding common mistakes",
    "tool comparison",
]

OPENAI_URL = "https://api.openai.com/v1/chat/completions"


def _heuristic_keywords(topic: str, seed_keywords: list[str] | None = None) -> dict:
    topic = topic.strip()
    seeds = [s for s in (seed_keywords or []) if s.lower() != topic.lower()]

    secondary = list(dict.fromkeys(seeds))  # de-dup, preserve order
    for modifier in SECONDARY_MODIFIERS:
        if len(secondary) >= 8:
            break
        candidate = f"{topic} {modifier}"
        if candidate.lower() not in [s.lower() for s in secondary]:
            secondary.append(candidate)
    secondary = secondary[:8] if len(secondary) >= 3 else secondary + [f"{topic} guide", f"{topic} tips", f"{topic} examples"][: 3 - len(secondary)]

    long_tail = [t.format(topic=topic) for t in LONG_TAIL_TEMPLATES]

    return {
        "primary": topic,
        "secondary": secondary[:8],
        "long_tail": long_tail,
        "intent_angles": INTENT_ANGLES,
    }


def _llm_keywords(topic: str, seed_keywords: list[str] | None = None) -> dict | None:
    if not settings.openai_available:
        return None

    prompt = (
        "You generate Pinterest SEO keyword research. Given a topic, return strict JSON with keys "
        '"primary" (string), "secondary" (3-8 strings), "long_tail" (3-6 strings), '
        '"intent_angles" (3-6 short search-intent phrases like "beginner education" or '
        '"time-saving productivity"). No prose, only JSON.\n\n'
        f"Topic: {topic}\n"
        f"Known related keywords: {', '.join(seed_keywords or [])}"
    )
    try:
        resp = requests.post(
            OPENAI_URL,
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "response_format": {"type": "json_object"},
            },
            timeout=30,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        data = json.loads(content)
        if not data.get("primary") or not data.get("secondary"):
            return None
        return data
    except Exception as exc:  # noqa: BLE001 - any failure here should fall back, never crash
        logger.warning("LLM keyword generation failed, falling back to heuristic: %s", exc)
        return None


def generate_keywords(topic: str, seed_keywords: list[str] | None = None) -> dict:
    """Return {"primary", "secondary", "long_tail", "intent_angles"} for topic."""
    result = _llm_keywords(topic, seed_keywords)
    if result:
        return result
    return _heuristic_keywords(topic, seed_keywords)


def slugify(text: str) -> str:
    text = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return text
