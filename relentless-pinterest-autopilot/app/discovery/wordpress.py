"""Content discovery via the WordPress REST API.

Public read access needs no credentials at all -- /wp-json/wp/v2/posts is
open by default on virtually every WordPress install. Application
password credentials (if supplied) only raise the rate limit / let draft
content through, so this degrades gracefully with zero configuration.
"""
from __future__ import annotations

import datetime as dt
from typing import Any

import requests
from requests.auth import HTTPBasicAuth

from app.logging_config import get_logger

logger = get_logger(__name__)

TIMEOUT = 15


def fetch_wordpress_posts(
    base_url: str,
    username: str = "",
    app_password: str = "",
    per_page: int = 20,
) -> list[dict[str, Any]]:
    """Return a list of normalized content dicts from the WP REST API.

    Returns an empty list (never raises) if the site isn't WordPress or is
    unreachable -- callers should fall back to RSS/sitemap discovery.
    """
    url = base_url.rstrip("/") + "/wp-json/wp/v2/posts"
    params = {"per_page": per_page, "orderby": "date", "order": "desc", "_embed": "1"}
    auth = HTTPBasicAuth(username, app_password) if username and app_password else None

    try:
        resp = requests.get(url, params=params, auth=auth, timeout=TIMEOUT)
        resp.raise_for_status()
        posts = resp.json()
    except requests.RequestException as exc:
        logger.info("WordPress REST API unavailable for %s: %s", base_url, exc)
        return []
    except ValueError as exc:
        logger.info("WordPress REST API returned non-JSON for %s: %s", base_url, exc)
        return []

    results = []
    for post in posts:
        title = _strip_html(post.get("title", {}).get("rendered", ""))
        excerpt = _strip_html(post.get("excerpt", {}).get("rendered", ""))
        image_url = ""
        embedded = post.get("_embedded", {})
        media = embedded.get("wp:featuredmedia")
        if media and isinstance(media, list):
            image_url = media[0].get("source_url", "")

        categories = []
        terms = embedded.get("wp:term", [])
        for group in terms:
            for term in group:
                if term.get("taxonomy") == "category":
                    categories.append(term.get("name", ""))

        results.append(
            {
                "url": post.get("link", ""),
                "title": title,
                "body_excerpt": excerpt,
                "image_url": image_url,
                "publish_date": _parse_date(post.get("date_gmt")),
                "category": categories[0] if categories else "",
            }
        )
    return results


def _strip_html(value: str) -> str:
    import re

    text = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", text).strip()


def _parse_date(value: str | None) -> dt.datetime | None:
    if not value:
        return None
    try:
        return dt.datetime.fromisoformat(value).replace(tzinfo=dt.timezone.utc)
    except ValueError:
        return None
