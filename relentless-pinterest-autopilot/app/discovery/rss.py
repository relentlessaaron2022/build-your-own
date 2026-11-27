"""Content discovery via RSS feed -- the fallback when WordPress REST API
discovery yields nothing (non-WordPress site, REST disabled, etc.)."""
from __future__ import annotations

import datetime as dt
from typing import Any

import feedparser

from app.logging_config import get_logger

logger = get_logger(__name__)

CANDIDATE_PATHS = ["/feed", "/feed/", "/rss", "/rss.xml", "/atom.xml"]


def fetch_rss_posts(base_url: str) -> list[dict[str, Any]]:
    base_url = base_url.rstrip("/")
    for path in CANDIDATE_PATHS:
        feed_url = base_url + path
        parsed = feedparser.parse(feed_url)
        if parsed.bozo and not parsed.entries:
            continue
        if not parsed.entries:
            continue

        results = []
        for entry in parsed.entries:
            results.append(
                {
                    "url": entry.get("link", ""),
                    "title": entry.get("title", ""),
                    "body_excerpt": _clean_summary(entry.get("summary", "")),
                    "image_url": _extract_image(entry),
                    "publish_date": _parse_entry_date(entry),
                    "category": (entry.get("tags", [{}])[0].get("term", "") if entry.get("tags") else ""),
                }
            )
        logger.info("RSS discovery found %s items at %s", len(results), feed_url)
        return results
    logger.info("No RSS feed found for %s", base_url)
    return []


def _clean_summary(summary: str) -> str:
    import re

    text = re.sub(r"<[^>]+>", " ", summary or "")
    return re.sub(r"\s+", " ", text).strip()


def _extract_image(entry) -> str:
    media = entry.get("media_content") or entry.get("media_thumbnail")
    if media:
        return media[0].get("url", "")
    links = entry.get("links", [])
    for link in links:
        if link.get("type", "").startswith("image/"):
            return link.get("href", "")
    return ""


def _parse_entry_date(entry) -> dt.datetime | None:
    parsed_time = entry.get("published_parsed") or entry.get("updated_parsed")
    if not parsed_time:
        return None
    return dt.datetime(*parsed_time[:6], tzinfo=dt.timezone.utc)
