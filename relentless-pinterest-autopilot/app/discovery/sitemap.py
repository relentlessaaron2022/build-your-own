"""Content discovery via XML sitemap -- last-resort fallback that at least
finds URLs when neither the WordPress REST API nor RSS are available."""
from __future__ import annotations

from typing import Any
from xml.etree import ElementTree as ET

import requests

from app.logging_config import get_logger

logger = get_logger(__name__)

TIMEOUT = 15
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
CANDIDATE_PATHS = ["/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml"]


def fetch_sitemap_urls(base_url: str, max_urls: int = 30) -> list[dict[str, Any]]:
    base_url = base_url.rstrip("/")
    for path in CANDIDATE_PATHS:
        sitemap_url = base_url + path
        try:
            resp = requests.get(sitemap_url, timeout=TIMEOUT)
            resp.raise_for_status()
            root = ET.fromstring(resp.content)
        except (requests.RequestException, ET.ParseError) as exc:
            logger.debug("Sitemap unavailable at %s: %s", sitemap_url, exc)
            continue

        urls = [el.text for el in root.findall(".//sm:loc", NS) if el.text]
        if not urls:
            continue

        # A sitemap index points at child sitemaps; fetch the first child.
        if root.tag.endswith("sitemapindex") and urls:
            return fetch_sitemap_urls(urls[0].rsplit("/sitemap", 1)[0], max_urls=max_urls) or [
                {"url": u, "title": "", "body_excerpt": "", "image_url": "", "publish_date": None, "category": ""}
                for u in urls[:max_urls]
            ]

        logger.info("Sitemap discovery found %s URLs at %s", len(urls), sitemap_url)
        return [
            {"url": u, "title": "", "body_excerpt": "", "image_url": "", "publish_date": None, "category": ""}
            for u in urls[:max_urls]
        ]
    logger.info("No sitemap found for %s", base_url)
    return []
