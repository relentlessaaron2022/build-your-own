"""Regression test: one malformed post in a WordPress REST API response
used to raise (AttributeError/TypeError) partway through normalization,
aborting discovery for the whole site instead of skipping that entry."""
from app.discovery.wordpress import _normalize_post, fetch_wordpress_posts


def test_normalize_post_happy_path():
    post = {
        "link": "https://example.com/post-1",
        "title": {"rendered": "Hello <b>World</b>"},
        "excerpt": {"rendered": "An excerpt."},
        "date_gmt": "2026-01-01T00:00:00",
        "_embedded": {},
    }
    result = _normalize_post(post)
    assert result["url"] == "https://example.com/post-1"
    assert result["title"] == "Hello World"


def test_malformed_posts_are_skipped_not_fatal(monkeypatch):
    import app.discovery.wordpress as wp_module

    class FakeResponse:
        status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            return [
                {"link": "https://example.com/good-1", "title": {"rendered": "Good"}, "excerpt": {"rendered": ""}},
                {"link": "https://example.com/bad", "title": "not-a-dict-so-.get-rendered-fails"},
                {"link": "https://example.com/good-2", "title": {"rendered": "Good 2"}, "excerpt": {"rendered": ""}},
            ]

    monkeypatch.setattr(wp_module.requests, "get", lambda *a, **k: FakeResponse())

    results = fetch_wordpress_posts("https://example.com")
    urls = {r["url"] for r in results}
    assert urls == {"https://example.com/good-1", "https://example.com/good-2"}


def test_non_list_response_returns_empty(monkeypatch):
    import app.discovery.wordpress as wp_module

    class FakeResponse:
        status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            return {"code": "rest_no_route", "message": "not found"}

    monkeypatch.setattr(wp_module.requests, "get", lambda *a, **k: FakeResponse())

    assert fetch_wordpress_posts("https://example.com") == []
