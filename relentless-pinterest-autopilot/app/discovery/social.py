"""Import the owner's social content exports; never scrape signed-in accounts."""
import datetime as dt
import json
from pathlib import Path
from urllib.parse import urlparse

from sqlalchemy import select

from app.config import get_site
from app.db import Campaign, SourceContent, get_session

PLATFORMS = {"instagram": {"instagram.com"}, "facebook": {"facebook.com", "fb.watch"},
             "youtube": {"youtube.com", "youtu.be"}, "tiktok": {"tiktok.com"}, "threads": {"threads.net", "threads.com"}}


def import_social_export(path: str, site_id: str) -> dict:
    """Import normalized, owner-supplied posts into reviewable discovery rows.

    Items are NOT auto-approved. An explicit approved=true per item moves
    it into the generation pipeline. Media is not downloaded/reused.
    """
    return import_social_posts(json.loads(Path(path).read_text()), site_id)


def import_social_posts(payload: list[dict], site_id: str) -> dict:
    site = get_site(site_id)
    if not site:
        raise ValueError(f"Unknown site: {site_id}")
    if not isinstance(payload, list):
        raise ValueError("Social export must be a JSON list of posts")
    validated = []
    for item in payload:
        if not isinstance(item, dict):
            raise ValueError("Every social post must be an object")
        platform, url = item.get("platform"), item.get("url", "")
        parsed = urlparse(url)
        host = (parsed.hostname or "").removeprefix("www.").removeprefix("m.")
        if platform not in PLATFORMS or parsed.scheme != "https" or host not in PLATFORMS[platform]:
            raise ValueError("Each post needs a supported platform and its HTTPS post URL")
        if not isinstance(item.get("title"), str) or not item["title"].strip():
            raise ValueError("Each post needs a title")
        published = dt.datetime.fromisoformat(item["published_at"].replace("Z", "+00:00")) if item.get("published_at") else None
        if published and published.tzinfo is None:
            published = published.replace(tzinfo=dt.timezone.utc)
        validated.append((item, platform, url, published))
    inserted = updated = approved = 0
    with get_session() as session:
        name = f"{site['name']} - Social Content"
        campaign = session.scalar(select(Campaign).where(Campaign.name == name, Campaign.site == site_id))
        if campaign is None:
            campaign = Campaign(name=name, site=site_id, landing_url=site["base_url"], category=site.get("board_category", "publishing"), status="active")
            session.add(campaign)
            session.flush()
        for item, platform, url, published in validated:
            source = session.scalar(select(SourceContent).where(SourceContent.url == url))
            if source is None:
                source = SourceContent(url=url)
                session.add(source)
                inserted += 1
            else:
                updated += 1
            source.campaign_id = campaign.id
            source.title = item["title"].strip()[:500]
            source.body_excerpt = str(item.get("text", ""))[:4000]
            source.publish_date = published
            source.category = platform
            source.status = "promoted" if item.get("approved") is True else "discovered"
            approved += source.status == "promoted"
        session.commit()
    return {"inserted": inserted, "updated": updated, "approved": approved,
            "note": "Imported normalized posts; live sync depends on enabled account configuration."}
