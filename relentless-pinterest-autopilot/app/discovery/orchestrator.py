"""Orchestrates content discovery for one or all configured sites: try
WordPress REST API, fall back to RSS, fall back to sitemap; score each
item; upsert into SourceContent; promote items above threshold by
attaching them to (or creating) a Campaign.
"""
from __future__ import annotations

from sqlalchemy import select

from app.config import brand_for_key, get_site, load_sites, settings
from app.db import Campaign, SourceContent, get_session
from app.discovery.rss import fetch_rss_posts
from app.discovery.scorer import meets_threshold, score_content
from app.discovery.sitemap import fetch_sitemap_urls
from app.discovery.wordpress import fetch_wordpress_posts
from app.logging_config import get_logger

logger = get_logger(__name__)


def _discover_raw(site: dict) -> list[dict]:
    base_url = site["base_url"]
    discovery_cfg = site.get("discovery", {})

    if discovery_cfg.get("wordpress_api", True):
        posts = fetch_wordpress_posts(
            base_url,
            username=settings.wordpress_username if settings.wordpress_site_url in base_url else "",
            app_password=settings.wordpress_app_password if settings.wordpress_site_url in base_url else "",
        )
        if posts:
            return posts

    if discovery_cfg.get("rss", True):
        posts = fetch_rss_posts(base_url)
        if posts:
            return posts

    if discovery_cfg.get("sitemap", True):
        return fetch_sitemap_urls(base_url)

    return []


def _get_or_create_campaign(session, site: dict) -> Campaign:
    name = f"{site['name']} - Evergreen Discovery"
    existing = session.execute(
        select(Campaign).where(Campaign.name == name, Campaign.site == site["id"])
    ).scalar_one_or_none()
    if existing:
        return existing
    campaign = Campaign(
        name=name,
        site=site["id"],
        landing_url=site["base_url"],
        category="evergreen_discovery",
        objective="Drive Pinterest traffic to organically discovered evergreen content.",
        status="active",
    )
    session.add(campaign)
    session.flush()
    return campaign


def run_discovery_for_site(site_id: str, threshold: float = 55.0) -> dict:
    site = get_site(site_id)
    if not site:
        raise ValueError(f"Unknown site_id: {site_id}")

    brand = brand_for_key(site.get("brand_key", ""))
    banned_phrases = brand.get("banned_phrases", [])

    raw_items = _discover_raw(site)
    logger.info("Discovered %s raw items for %s", len(raw_items), site_id)

    inserted, updated, promoted = 0, 0, 0
    with get_session() as session:
        campaign = _get_or_create_campaign(session, site)

        for item in raw_items:
            url = item.get("url")
            if not url:
                continue

            existing = session.execute(
                select(SourceContent).where(SourceContent.url == url)
            ).scalar_one_or_none()

            scores = score_content(
                title=item.get("title", ""),
                body_excerpt=item.get("body_excerpt", ""),
                image_url=item.get("image_url", ""),
                category=item.get("category", ""),
                landing_url=site["base_url"],
                publish_date=item.get("publish_date"),
                banned_phrases=banned_phrases,
            )
            is_suitable = meets_threshold(scores["composite_score"], threshold)

            if existing:
                existing.title = item.get("title", "") or existing.title
                existing.body_excerpt = item.get("body_excerpt", "") or existing.body_excerpt
                existing.image_url = item.get("image_url", "") or existing.image_url
                existing.evergreen_score = scores["evergreen_score"]
                existing.commercial_score = scores["commercial_score"]
                if is_suitable and existing.status == "discovered":
                    existing.status = "promoted"
                    existing.campaign_id = campaign.id
                    promoted += 1
                updated += 1
            else:
                record = SourceContent(
                    campaign_id=campaign.id if is_suitable else None,
                    url=url,
                    title=item.get("title", ""),
                    body_excerpt=item.get("body_excerpt", ""),
                    image_url=item.get("image_url", ""),
                    publish_date=item.get("publish_date"),
                    category=item.get("category", ""),
                    evergreen_score=scores["evergreen_score"],
                    commercial_score=scores["commercial_score"],
                    status="promoted" if is_suitable else "discovered",
                )
                session.add(record)
                inserted += 1
                if is_suitable:
                    promoted += 1

        session.commit()

    result = {"site_id": site_id, "found": len(raw_items), "inserted": inserted, "updated": updated, "promoted": promoted}
    logger.info("Discovery complete for %s: %s", site_id, result)
    return result


def run_discovery_all_sites(threshold: float = 55.0) -> list[dict]:
    return [run_discovery_for_site(site["id"], threshold=threshold) for site in load_sites()]
