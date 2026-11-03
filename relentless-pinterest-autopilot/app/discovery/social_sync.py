"""Authorized social API readers. No login scraping or publishing to social accounts."""
import os
import datetime as dt

import feedparser
import requests

from app.config import load_social_accounts
from app.discovery.social import import_social_posts


def _json_get(url, token, params):
    response = requests.get(url, headers={"Authorization": f"Bearer {token}"}, params=params, timeout=30)
    if response.status_code >= 400:
        # Do not log response bodies, access tokens, or provider pagination URLs.
        raise ValueError(f"Social API returned HTTP {response.status_code}; inspect account permissions")
    payload = response.json()
    if not isinstance(payload, dict):
        raise ValueError("Social API returned an invalid/error response")
    error = payload.get("error")
    if error and (not isinstance(error, dict) or error.get("code") not in ("ok", 0)):
        raise ValueError("Social API returned an invalid/error response")
    return payload


def fetch_account_posts(account: dict) -> list[dict]:
    platform = account["platform"]
    account_id = account.get("account_id", "")
    if not account_id or not account_id.replace("-", "").replace("_", "").isalnum():
        raise ValueError("Configure the exact account/channel ID before enabling social sync")
    approved = account.get("auto_approve") is True
    if platform == "youtube":
        response = requests.get("https://www.youtube.com/feeds/videos.xml", params={"channel_id": account_id}, timeout=30)
        if response.status_code != 200:
            raise ValueError(f"YouTube feed returned HTTP {response.status_code}")
        feed = feedparser.parse(response.content)
        if feed.bozo and not feed.entries:
            raise ValueError("Invalid YouTube channel feed")
        return [{"platform": "youtube", "url": e.get("link", ""), "title": e.get("title", ""),
                 "text": e.get("summary", ""), "published_at": e.get("published"), "approved": approved}
                for e in feed.entries if e.get("link") and e.get("title")]

    token = os.getenv(account.get("token_env", ""), "")
    if not token:
        raise ValueError("Missing social account token; set the configured token_env locally")
    if platform == "tiktok":
        return _fetch_tiktok(account_id, token, approved)
    # Explicit version configuration avoids silently choosing a Meta API version.
    version = os.getenv("META_GRAPH_VERSION", "")
    if platform in {"facebook", "instagram"}:
        import re
        if not re.fullmatch(r"v\d+\.\d+", version):
            raise ValueError("Set META_GRAPH_VERSION to the version enabled for your Meta app")
    if platform == "facebook":
        url = f"https://graph.facebook.com/{version}/{account_id}/posts"
        fields = "id,message,created_time,permalink_url"
    elif platform == "instagram":
        url = f"https://graph.facebook.com/{version}/{account_id}/media"
        fields = "id,caption,timestamp,permalink"
    elif platform == "threads":
        url = f"https://graph.threads.net/v1.0/{account_id}/threads"
        fields = "id,text,timestamp,permalink"
    else:
        raise ValueError(f"No automatic reader for platform {platform}")

    posts = []
    after = None
    seen = set()
    for page in range(5):
        params = {"fields": fields, "limit": 25}
        if after:
            params["after"] = after
        payload = _json_get(url, token, params)
        if not isinstance(payload.get("data"), list):
            raise ValueError("Social API data must be a list")
        for item in payload["data"]:
            text = item.get("message") or item.get("caption") or item.get("text") or ""
            link = item.get("permalink_url") or item.get("permalink")
            if not text.strip() or not link:
                continue
            posts.append({"platform": platform, "url": link, "title": text.splitlines()[0][:100] or text[:100],
                          "text": text, "published_at": item.get("created_time") or item.get("timestamp"), "approved": approved})
        paging = payload.get("paging", {})
        if not paging.get("next"):
            return posts
        # Never follow provider-supplied URLs (which can contain bearer tokens).
        after = paging.get("cursors", {}).get("after")
        if not after or after in seen:
            raise ValueError("Social pagination is incomplete or repeated")
        seen.add(after)
    # This is a bounded recent-post sync, not a full historical archive import.
    return posts


def _fetch_tiktok(account_id, token, approved):
    # The Display API is scoped to the token's owner. Verify its stable ID
    # rather than assuming that the display name identifies the right account.
    identity = _json_get("https://open.tiktokapis.com/v2/user/info/", token, {"fields": "open_id"})
    if identity.get("data", {}).get("user", {}).get("open_id") != account_id:
        raise ValueError("TikTok token owner does not match the configured account ID")
    posts = []
    cursor = None
    seen = set()
    for _ in range(5):
        body = {"max_count": 20}
        if cursor is not None:
            body["cursor"] = cursor
        response = requests.post(
            "https://open.tiktokapis.com/v2/video/list/",
            params={"fields": "id,title,video_description,create_time,share_url"},
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=body, timeout=30,
        )
        if response.status_code != 200:
            raise ValueError(f"TikTok video API returned HTTP {response.status_code}")
        payload = response.json()
        if payload.get("error", {}).get("code", "ok") != "ok":
            raise ValueError("TikTok video API returned an error; check video.list authorization")
        data = payload.get("data", {})
        for video in data.get("videos", []):
            text = video.get("video_description") or video.get("title") or ""
            if not text.strip() or not video.get("share_url"):
                continue
            posts.append({"platform": "tiktok", "url": video["share_url"],
                          "title": (video.get("title") or text)[:100], "text": text,
                          "published_at": dt.datetime.fromtimestamp(video["create_time"], dt.timezone.utc).isoformat(),
                          "approved": approved})
        if not data.get("has_more"):
            return posts
        cursor = data.get("cursor")
        if cursor is None or cursor in seen:
            raise ValueError("TikTok pagination is incomplete or repeated")
        seen.add(cursor)
    return posts


def sync_social_accounts() -> list[dict]:
    results = []
    for account in load_social_accounts():
        label = account["id"]
        if not account.get("enabled", False):
            results.append({"account": label, "skipped": True, "reason": "not_connected"})
            continue
        try:
            posts = fetch_account_posts(account)
            result = import_social_posts(posts, account.get("site_id", "relentlessaaron"))
            results.append({"account": label, "found": len(posts), **result})
        except (ValueError, requests.RequestException, KeyError, TypeError) as exc:
            # A broken/expired account must not prevent the other accounts syncing.
            results.append({"account": label, "error": type(exc).__name__, "reason": str(exc) if isinstance(exc, ValueError) else "Provider request or response failed"})
    return results
