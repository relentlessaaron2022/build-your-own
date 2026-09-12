"""The six scheduled jobs from the spec: discovery, generation, publish,
analytics, optimization, weekly_strategy. Each is a plain function so it
can be run standalone from the CLI (`pinterest generate`, `pinterest
publish-test`, ...) or wired into APScheduler by scheduler/runner.py --
the schedule itself lives in runner.py, not here.
"""
from __future__ import annotations

import datetime as dt

from sqlalchemy import select

from app import state
from app.analytics.ingest import ingest_analytics
from app.analytics.winners import evaluate_winners_and_losers
from app.campaign import generate_campaign_concepts
from app.config import get_offer, load_boards, load_offers, settings
from app.db import Campaign, Pin, get_session
from app.discovery.orchestrator import run_discovery_all_sites
from app.logging_config import get_logger
from app.optimizer.variations import run_optimization_cycle
from app.pinterest.client import (
    CredentialsMissingError,
    PinterestAPIError,
    PinterestClient,
    RateLimitError,
    RETRY_SCHEDULE_SECONDS,
    TransientAPIError,
)
from app.pipeline import materialize_all_draft_concepts
from app.queue_manager import needs_generation

logger = get_logger(__name__)

PINS_PER_PUBLISH_SLOT = 2


def _get_or_create_offer_campaign(session, offer: dict) -> Campaign:
    name = f"{offer['name']} - Primary"
    existing = session.execute(
        select(Campaign).where(Campaign.name == name, Campaign.site == offer["site_id"])
    ).scalar_one_or_none()
    if existing:
        return existing
    campaign = Campaign(
        name=name,
        site=offer["site_id"],
        landing_url=offer["landing_url"],
        category=offer["category"],
        objective=f"Drive Pinterest traffic to {offer['name']}",
        status="active" if offer.get("active", True) else "paused",
    )
    session.add(campaign)
    session.flush()
    return campaign


def discovery_job() -> dict:
    logger.info("Running discovery_job")
    return {"sites": run_discovery_all_sites()}


def generation_job(force: bool = False) -> dict:
    if not state.generation_enabled() and not force:
        logger.info("generation_job skipped: GENERATION_ENABLED is false")
        return {"skipped": True}

    logger.info("Running generation_job")
    results = []

    for offer in load_offers():
        if not offer.get("active", True):
            continue
        with get_session() as session:
            campaign = _get_or_create_offer_campaign(session, offer)
            campaign_id = campaign.id

        board_names = [
            b["name"] for b in load_boards() if b.get("category") == offer.get("category")
        ] or [b["name"] for b in load_boards()[:1]]

        concepts = generate_campaign_concepts(
            campaign_id=campaign_id,
            topic=offer["seed_keywords"][0] if offer.get("seed_keywords") else offer["name"],
            landing_url=offer["landing_url"],
            brand_key=offer.get("brand_key", "relentless_aaron"),
            seed_keywords=offer.get("seed_keywords"),
            board_names=board_names,
        )
        materialized = materialize_all_draft_concepts(campaign_id=campaign_id)
        results.append({"offer": offer["id"], "concepts_created": len(concepts), **materialized})

    return {"skipped": False, "campaigns": results, "queue_needed_more": needs_generation()}


def _resolve_pinterest_board_id(board_name: str) -> str | None:
    for b in load_boards():
        if b.get("name") == board_name and b.get("pinterest_board_id"):
            return b["pinterest_board_id"]
    return None


def publish_job() -> dict:
    if not state.publishing_enabled():
        logger.info("publish_job skipped: publishing is paused")
        return {"skipped": True, "reason": "paused"}

    if not settings.pinterest_credentials_present:
        logger.info("publish_job skipped: Pinterest credentials not configured")
        return {"skipped": True, "reason": "missing_credentials"}

    client = PinterestClient()
    published, failed, retried, skipped_no_board = 0, 0, 0, 0

    with get_session() as session:
        now = dt.datetime.now(dt.timezone.utc)
        pins = session.execute(
            select(Pin)
            .where(Pin.status.in_(["queued", "scheduled"]))
            .where((Pin.scheduled_at.is_(None)) | (Pin.scheduled_at <= now))
            .order_by(Pin.created_at.asc())
            .limit(PINS_PER_PUBLISH_SLOT)
        ).scalars().all()

        for pin in pins:
            board_pinterest_id = _resolve_pinterest_board_id(pin.board_id)
            if not board_pinterest_id:
                logger.warning(
                    "Pin %s cannot publish: board '%s' has no pinterest_board_id. "
                    "Run `pinterest sync-boards` once Pinterest is authorized.",
                    pin.id, pin.board_id,
                )
                skipped_no_board += 1
                continue

            concept = pin.concept
            try:
                response = client.create_pin(
                    board_id=board_pinterest_id,
                    title=concept.headline,
                    description=concept.description,
                    link=pin.destination_url,
                    image_path=pin.image_path,
                    alt_text=concept.headline,
                )
                pin.pinterest_pin_id = response.get("id", "")
                pin.status = "published"
                pin.published_at = dt.datetime.now(dt.timezone.utc)
                pin.last_error = ""
                published += 1
                logger.info("Published pin %s as Pinterest pin %s", pin.id, pin.pinterest_pin_id)

            except RateLimitError as exc:
                logger.warning("Pinterest rate limit hit, stopping publish_job early: %s", exc)
                session.commit()
                return {"skipped": False, "published": published, "failed": failed, "retried": retried, "rate_limited": True}

            except CredentialsMissingError as exc:
                logger.warning("publish_job aborted: %s", exc)
                session.commit()
                return {"skipped": True, "reason": "missing_credentials", "detail": str(exc)}

            except TransientAPIError as exc:
                if pin.retry_count < len(RETRY_SCHEDULE_SECONDS):
                    delay = RETRY_SCHEDULE_SECONDS[pin.retry_count]
                    pin.scheduled_at = dt.datetime.now(dt.timezone.utc) + dt.timedelta(seconds=delay)
                    pin.retry_count += 1
                    pin.status = "scheduled"
                    pin.last_error = str(exc)
                    retried += 1
                    logger.warning("Transient error publishing pin %s, retrying in %ss: %s", pin.id, delay, exc)
                else:
                    pin.status = "failed"
                    pin.last_error = str(exc)
                    failed += 1
                    logger.error("Pin %s exhausted retries: %s", pin.id, exc)

            except PinterestAPIError as exc:
                pin.status = "failed"
                pin.last_error = str(exc)
                concept.status = "regenerate"
                failed += 1
                logger.error("Pin %s failed permanently: %s", pin.id, exc)

        session.commit()

    return {
        "skipped": False,
        "published": published,
        "failed": failed,
        "retried": retried,
        "skipped_no_board": skipped_no_board,
    }


def analytics_job() -> dict:
    logger.info("Running analytics_job")
    ingest_result = ingest_analytics()
    winner_result = evaluate_winners_and_losers()
    return {"ingest": ingest_result, "winners": winner_result}


def optimization_job() -> dict:
    if not state.auto_optimization_enabled():
        logger.info("optimization_job skipped: AUTO_OPTIMIZATION_ENABLED is false")
        return {"skipped": True}
    logger.info("Running optimization_job")
    return run_optimization_cycle()


def weekly_strategy_job() -> dict:
    from app.reporting.weekly import generate_weekly_report, save_weekly_report

    logger.info("Running weekly_strategy_job")
    report = generate_weekly_report()
    path = save_weekly_report(report)
    return {"report_path": str(path), **report}


def publish_one_test_pin(concept_id: int | None = None) -> dict:
    """Phase 1 milestone helper: publish exactly one queued pin right now,
    bypassing the hourly cron schedule, for `pinterest publish-test`."""
    if not settings.pinterest_credentials_present:
        return {
            "success": False,
            "reason": "missing_credentials",
            "required_env": [
                "PINTEREST_CLIENT_ID",
                "PINTEREST_CLIENT_SECRET",
                "PINTEREST_REFRESH_TOKEN",
            ],
        }

    client = PinterestClient()
    with get_session() as session:
        query = select(Pin).where(Pin.status.in_(["queued", "scheduled"]))
        if concept_id is not None:
            query = query.where(Pin.concept_id == concept_id)
        pin = session.execute(query.order_by(Pin.created_at.asc()).limit(1)).scalar_one_or_none()

        if pin is None:
            return {"success": False, "reason": "no_queued_pins"}

        board_pinterest_id = _resolve_pinterest_board_id(pin.board_id)
        if not board_pinterest_id:
            return {
                "success": False,
                "reason": "board_not_synced",
                "board_name": pin.board_id,
                "hint": "Run `pinterest sync-boards` first.",
            }

        concept = pin.concept
        try:
            response = client.create_pin(
                board_id=board_pinterest_id,
                title=concept.headline,
                description=concept.description,
                link=pin.destination_url,
                image_path=pin.image_path,
                alt_text=concept.headline,
            )
        except PinterestAPIError as exc:
            pin.status = "failed"
            pin.last_error = str(exc)
            session.commit()
            return {"success": False, "reason": "api_error", "detail": str(exc)}

        pin.pinterest_pin_id = response.get("id", "")
        pin.status = "published"
        pin.published_at = dt.datetime.now(dt.timezone.utc)
        session.commit()

        return {"success": True, "pin_id": pin.id, "pinterest_pin_id": pin.pinterest_pin_id}
