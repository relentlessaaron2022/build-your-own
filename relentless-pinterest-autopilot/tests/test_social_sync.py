from unittest.mock import Mock

import pytest

from app.discovery import social_sync as sync


@pytest.mark.parametrize("platform,text_field,link_field,time_field", [
    ("instagram", "caption", "permalink", "timestamp"),
    ("facebook", "message", "permalink_url", "created_time"),
    ("threads", "text", "permalink", "timestamp"),
])
def test_authorized_graph_readers_normalize_posts(monkeypatch, platform, text_field, link_field, time_field):
    monkeypatch.setenv("SOCIAL_TEST_TOKEN", "dummy")
    monkeypatch.setenv("META_GRAPH_VERSION", "v99.0")  # fake explicit version; no network
    fake = Mock(return_value={"data": [{text_field: "Original caption", link_field: f"https://{platform}.com/p/123", time_field: "2026-11-01T12:00:00Z"}]})
    monkeypatch.setattr(sync, "_json_get", fake)
    posts = sync.fetch_account_posts({"platform": platform, "account_id": "123", "token_env": "SOCIAL_TEST_TOKEN", "auto_approve": True})
    assert posts[0]["platform"] == platform
    assert posts[0]["text"] == "Original caption"
    assert posts[0]["approved"] is True
    assert "dummy" not in fake.call_args.args[0]


def test_graph_pagination_does_not_follow_token_bearing_next_url(monkeypatch):
    monkeypatch.setenv("SOCIAL_TEST_TOKEN", "dummy")
    monkeypatch.setenv("META_GRAPH_VERSION", "v99.0")
    fake = Mock(side_effect=[{"data": [], "paging": {"next": "https://untrusted.test/?access_token=secret", "cursors": {"after": "cursor"}}}, {"data": []}])
    monkeypatch.setattr(sync, "_json_get", fake)
    sync.fetch_account_posts({"platform": "instagram", "account_id": "123", "token_env": "SOCIAL_TEST_TOKEN"})
    assert fake.call_args_list[0].args[0] == fake.call_args_list[1].args[0]
    assert fake.call_args_list[1].args[2]["after"] == "cursor"


def test_missing_token_blocks_requests(monkeypatch):
    monkeypatch.delenv("MISSING_TEST_TOKEN", raising=False)
    fake = Mock()
    monkeypatch.setattr(sync, "_json_get", fake)
    with pytest.raises(ValueError, match="Missing social account token"):
        sync.fetch_account_posts({"platform": "threads", "account_id": "123", "token_env": "MISSING_TEST_TOKEN"})
    fake.assert_not_called()


def test_youtube_uses_channel_feed_without_token(monkeypatch):
    response = Mock(status_code=200, content=b'''<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Original video</title><link href="https://www.youtube.com/watch?v=example"/><published>2026-11-01T12:00:00Z</published></entry></feed>''')
    fake = Mock(return_value=response)
    monkeypatch.setattr(sync.requests, "get", fake)
    result = sync.fetch_account_posts({"platform": "youtube", "account_id": "UCexample"})
    assert result[0]["title"] == "Original video"
    assert result[0]["approved"] is False
    assert "Authorization" not in fake.call_args.kwargs


def test_one_broken_account_does_not_block_others(monkeypatch):
    monkeypatch.setattr(sync, "load_social_accounts", lambda: [
        {"id": "broken", "platform": "instagram", "enabled": True},
        {"id": "good", "platform": "threads", "enabled": True},
        {"id": "disconnected", "enabled": False},
    ])
    monkeypatch.setattr(sync, "fetch_account_posts", Mock(side_effect=[ValueError("Missing token"), []]))
    monkeypatch.setattr(sync, "import_social_posts", lambda posts, site_id: {"inserted": 0})
    results = sync.sync_social_accounts()
    assert results[0]["error"] == "ValueError"
    assert results[1]["inserted"] == 0
    assert results[2]["reason"] == "not_connected"


def test_threads_export_is_supported(tmp_path):
    from app.discovery.social import import_social_export
    path = tmp_path / "posts.json"
    path.write_text('[{"platform":"threads","url":"https://www.threads.com/@example/post/123","title":"Original post","approved":true}]')
    assert import_social_export(str(path), "relentlessaaron")["approved"] == 1


def test_tiktok_checks_identity_then_reads_video_list(monkeypatch):
    monkeypatch.setenv("TIKTOK_TEST_TOKEN", "dummy")
    identity = Mock(status_code=200)
    identity.json.return_value = {"data": {"user": {"open_id": "owner-id"}}, "error": {"code": "ok"}}
    monkeypatch.setattr(sync.requests, "get", Mock(return_value=identity))
    videos = Mock(status_code=200)
    videos.json.return_value = {"error": {"code": "ok"}, "data": {"videos": [
        {"title": "My video", "video_description": "Original caption", "share_url": "https://www.tiktok.com/@example/video/1", "create_time": 1793534400}
    ], "has_more": False}}
    writer = Mock(return_value=videos)
    monkeypatch.setattr(sync.requests, "post", writer)
    posts = sync.fetch_account_posts({"platform": "tiktok", "account_id": "owner-id", "token_env": "TIKTOK_TEST_TOKEN"})
    assert posts[0]["platform"] == "tiktok"
    assert posts[0]["approved"] is False
    assert writer.call_args.kwargs["headers"]["Authorization"] == "Bearer dummy"


def test_tiktok_token_for_wrong_owner_is_refused(monkeypatch):
    monkeypatch.setenv("TIKTOK_TEST_TOKEN", "dummy")
    monkeypatch.setattr(sync, "_json_get", lambda *a: {"data": {"user": {"open_id": "someone-else"}}})
    writer = Mock()
    monkeypatch.setattr(sync.requests, "post", writer)
    with pytest.raises(ValueError, match="owner does not match"):
        sync.fetch_account_posts({"platform": "tiktok", "account_id": "owner-id", "token_env": "TIKTOK_TEST_TOKEN"})
    writer.assert_not_called()


def test_failed_social_api_is_not_treated_as_empty_feed(monkeypatch):
    response = Mock(status_code=200)
    response.json.return_value = {"error": {"code": 190, "message": "Expired token"}}
    monkeypatch.setattr(sync.requests, "get", lambda *a, **k: response)
    with pytest.raises(ValueError):
        sync._json_get("https://graph.facebook.com/test", "dummy", {})
