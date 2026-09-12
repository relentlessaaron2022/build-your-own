"""Content discovery via XML sitemap -- last-resort fallback that at least
finds URLs when neither the WordPress REST API nor RSS are available.

A sitemap index (<sitemapindex>) lists CHILD SITEMAP document URLs, not
pages -- those need to be fetched and parsed themselves before any real
page URL is available. An earlier version tried to shortcut this by
guessing a site "base" from the first child URL and re-probing
CANDIDATE_PATHS beneath it; that guess is unreliable (it can resolve back
onto the very same index, recursing without a visited-URL guard) and its
fallback emitted the sitemap index's own child-document URLs as if they
were discovered pages. This version fetches child sitemaps directly and
only ever treats <urlset> entries as content.
"""
from __future__ import annotations

from typing import Any
from xml.etree import ElementTree as ET

import requests

from app.logging_config import get_logger

logger = get_logger(__name__)

TIMEOUT = 15
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
CANDIDATE_PATHS = ["/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml"]
MAX_SITEMAP_DOCUMENTS = 20  # bounds total requests regardless of index depth/fan-out


def _fetch_xml(url: str) -> ET.Element | None:
    try:
        resp = requests.get(url, timeout=TIMEOUT)
        resp.raise_for_status()
        return ET.fromstring(resp.content)
    except (requests.RequestException, ET.ParseError) as exc:
        logger.debug("Sitemap document unavailable at %s: %s", url, exc)
        return None


def _locs(root: ET.Element) -> list[str]:
    return [el.text for el in root.findall(".//sm:loc", NS) if el.text]


def fetch_sitemap_urls(base_url: str, max_urls: int = 30) -> list[dict[str, Any]]:
    base_url = base_url.rstrip("/")

    entry_url, entry_root = None, None
    for path in CANDIDATE_PATHS:
        candidate_url = base_url + path
        root = _fetch_xml(candidate_url)
        if root is not None and _locs(root):
            entry_url, entry_root = candidate_url, root
            break

    if entry_root is None:
        logger.info("No sitemap found for %s", base_url)
        return []

    content_urls: list[str] = []
    visited: set[str] = set()
    queue: list[tuple[str, ET.Element]] = [(entry_url, entry_root)]

    while queue and len(visited) < MAX_SITEMAP_DOCUMENTS and len(content_urls) < max_urls:
        doc_url, root = queue.pop(0)
        if doc_url in visited:
            continue
        visited.add(doc_url)

        if root.tag.endswith("sitemapindex"):
            # Every <loc> here is a child sitemap DOCUMENT, not a page --
            # fetch each directly rather than guessing a base to re-probe.
            for child_url in _locs(root):
                if child_url not in visited:
                    child_root = _fetch_xml(child_url)
                    if child_root is not None:
                        queue.append((child_url, child_root))
        else:
            # A <urlset> document: these loc entries are real pages.
            content_urls.extend(_locs(root))

    logger.info("Sitemap discovery found %s URLs starting from %s", len(content_urls), entry_url)
    return [
        {"url": u, "title": "", "body_excerpt": "", "image_url": "", "publish_date": None, "category": ""}
        for u in content_urls[:max_urls]
    ]
