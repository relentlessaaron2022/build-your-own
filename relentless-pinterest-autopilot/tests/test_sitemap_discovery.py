"""Regression tests for sitemap-index handling: an earlier version
reconstructed a guessed "base URL" from a child sitemap document and
recursively re-probed CANDIDATE_PATHS beneath it, which could loop
indefinitely and, on failure, emitted the sitemap documents' own URLs as
if they were discovered pages."""
from __future__ import annotations

from xml.etree import ElementTree as ET

import app.discovery.sitemap as sitemap_module
from app.discovery.sitemap import fetch_sitemap_urls

SM = "http://www.sitemaps.org/schemas/sitemap/0.9"


def _urlset(urls: list[str]) -> ET.Element:
    root = ET.Element(f"{{{SM}}}urlset")
    for u in urls:
        entry = ET.SubElement(root, f"{{{SM}}}url")
        loc = ET.SubElement(entry, f"{{{SM}}}loc")
        loc.text = u
    return root


def _sitemapindex(urls: list[str]) -> ET.Element:
    root = ET.Element(f"{{{SM}}}sitemapindex")
    for u in urls:
        entry = ET.SubElement(root, f"{{{SM}}}sitemap")
        loc = ET.SubElement(entry, f"{{{SM}}}loc")
        loc.text = u
    return root


def test_sitemap_index_fetches_children_directly(monkeypatch):
    documents = {
        "https://example.com/sitemap.xml": _sitemapindex(
            ["https://example.com/sitemap-posts.xml", "https://example.com/sitemap-pages.xml"]
        ),
        "https://example.com/sitemap-posts.xml": _urlset(["https://example.com/post-1", "https://example.com/post-2"]),
        "https://example.com/sitemap-pages.xml": _urlset(["https://example.com/about"]),
    }
    monkeypatch.setattr(sitemap_module, "_fetch_xml", lambda url: documents.get(url))

    results = fetch_sitemap_urls("https://example.com", max_urls=30)
    urls = {r["url"] for r in results}

    assert urls == {"https://example.com/post-1", "https://example.com/post-2", "https://example.com/about"}
    # Neither sitemap document URL should ever appear as "discovered content".
    assert "https://example.com/sitemap-posts.xml" not in urls
    assert "https://example.com/sitemap-pages.xml" not in urls


def test_sitemap_index_self_reference_does_not_loop_forever(monkeypatch):
    """A pathological index that (directly or via a guessed-base bug)
    resolves back to itself must not recurse without bound."""
    self_referencing_index = _sitemapindex(["https://example.com/sitemap.xml"])
    monkeypatch.setattr(sitemap_module, "_fetch_xml", lambda url: self_referencing_index)

    # Must return promptly (no page URLs -- the index only ever points at
    # itself) instead of recursing until the call stack overflows.
    results = fetch_sitemap_urls("https://example.com", max_urls=30)
    assert results == []
