"""The six scheduled jobs from the spec: discovery, generation, publish,
analytics, optimization, weekly_strategy. Each is a plain function so it
can be run standalone from the CLI (`pinterest generate`, `pinterest
publish-test`, ...) or wired into APScheduler by scheduler/runner.py --
the schedule itself lives in runner.py, not here.
"""
from __future__ import annotations

import datetime as dt
import math

from sqlalchemy import func, select, update

from app import state
from app.analytics.ingest import ingest_analytics
from app.analytics.winners import evaluate_winners_and_losers
from app.campaign import ANGLES_PER_CAMPAIGN, CONCEPTS_PER_ANGLE, generate_campaign_concepts, spawn_replacement_concept
from app.config import load_boards, load_offers, settings
from app.db import Campaign, Pin, PinConcept, get_session
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

BATCH_SIZE = ANGLES_PER_CAMPAIGN * CONCEPTS_PER_ANGLE
MAX_GENERATION_ROUNDS = 6  # safety cap: each round can add up to BATCH_SIZE concepts per active offer
PUBLISH_SLOTS_PER_DAY = 5  # must match the cron hours wired in scheduler/runner.py


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
    session.commit()  # must be durable before other sessions (generate_campaign_concepts) look it up
    session.refresh(campaign)
    return campaign


def discovery_job() -> dict:
    logger.info("Running discovery_job")
    return {"sites": run_discovery_all_sites()}


def generation_job(force: bool = False) -> dict:
    if not state.generation_enabled() and not force:
        logger.info("generation_job skipped: GENERATION_ENABLED is false")
        return {"skipped": True}

    logger.info("Running generation_job")

    active_offers = [o for o in load_offers() if o.get("active", True)]
    results_by_offer: dict[str, dict] = {}
    rounds_run = 0

    # Loop batches until the queue clears MIN_QUEUE_DAYS or we hit the
    # safety cap. Without this, generation_job would call
    # generate_campaign_concepts with identical inputs every 6 hours: the
    # same 25 fingerprints already exist, every candidate gets skipped as
    # a duplicate, and the queue silently runs dry once the first batch
    # is consumed. batch_offset (derived from how many concepts the
    # campaign already has) rotates the angle pool and headline/CTA
    # numbering so each round is genuinely new instead of colliding.
    for rounds_run in range(1, MAX_GENERATION_ROUNDS + 1):
        added_any = False

        for offer in active_offers:
            with get_session() as session:
                campaign = _get_or_create_offer_campaign(session, offer)
                campaign_id = campaign.id
                existing_count = session.execute(
                    select(func.count(PinConcept.id)).where(PinConcept.campaign_id == campaign_id)
                ).scalar_one()

            batch_offset = existing_count // BATCH_SIZE
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
                batch_offset=batch_offset,
            )
            materialized = materialize_all_draft_concepts(campaign_id=campaign_id)

            entry = results_by_offer.setdefault(
                offer["id"], {"offer": offer["id"], "concepts_created": 0, "materialized": 0, "regenerate": 0, "total": 0}
            )
            entry["concepts_created"] += len(concepts)
            entry["materialized"] += materialized["materialized"]
            entry["regenerate"] += materialized["regenerate"]
            entry["total"] += materialized["total"]

            if concepts:
                added_any = True

        if not needs_generation() or not added_any:
            break

    return {
        "skipped": False,
        "campaigns": list(results_by_offer.values()),
        "queue_needed_more": needs_generation(),
        "rounds_run": rounds_run,
    }


def _resolve_pinterest_board_id(board_name: str) -> str | None:
    for b in load_boards():
        if b.get("name") == board_name and b.get("pinterest_board_id"):
            return b["pinterest_board_id"]
    return None


def publish_slot_size(daily_target: int | None = None) -> int:
    """How many pins one publish_job invocation should send, derived from
    the configured daily target spread across the scheduler's 5 daily
    slots (see PUBLISH_HOURS in scheduler/runner.py) -- rounding up rather
    than a hardcoded constant, so DAILY_PIN_TARGET actually controls
    publish volume instead of a fixed number that used to publish twice
    the configured target every day."""
    daily_target = daily_target if daily_target is not None else settings.daily_pin_target
    return max(1, math.ceil(daily_target / PUBLISH_SLOTS_PER_DAY))


def _claim_pin(session, pin_id: int) -> bool:
    """Atomically transition one pin from queued/scheduled to publishing.
    Returns True only if THIS call made the transition -- if another
    process (an overlapping scheduler run, or a concurrent `pinterest
    publish`/`publish-test` invocation) already claimed it, the
    conditional UPDATE affects zero rows and this returns False. Claiming
    happens (and commits) before any Pinterest API call, so two workers
    can never both send the same pin."""
    result = session.execute(
        update(Pin).where(Pin.id == pin_id, Pin.status.in_(["queued", "scheduled"])).values(status="publishing")
    )
    session.commit()
    return result.rowcount == 1


def _release_claim(session, pin_id: int, status: str = "queued") -> None:
    session.execute(update(Pin).where(Pin.id == pin_id).values(status=status))
    session.commit()


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
        candidate_ids = session.execute(
            select(Pin.id)
            .where(Pin.status.in_(["queued", "scheduled"]))
            .where((Pin.scheduled_at.is_(None)) | (Pin.scheduled_at <= now))
            .order_by(Pin.created_at.asc())
            .limit(publish_slot_size())
        ).scalars().all()

    for pin_id in candidate_ids:
        with get_session() as session:
            if not _claim_pin(session, pin_id):
                continue  # another worker claimed this pin first

            pin = session.get(Pin, pin_id)
            board_pinterest_id = _resolve_pinterest_board_id(pin.board_id)
            if not board_pinterest_id:
                logger.warning(
                    "Pin %s cannot publish: board '%s' has no pinterest_board_id. "
                    "Run `pinterest sync-boards` once Pinterest is authorized.",
                    pin.id, pin.board_id,
                )
                _release_claim(session, pin_id, "queued")
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
                session.commit()

            except RateLimitError as exc:
                logger.warning("Pinterest rate limit hit, stopping publish_job early: %s", exc)
                _release_claim(session, pin_id, "queued")
                return {"skipped": False, "published": published, "failed": failed, "retried": retried, "rate_limited": True}

            except CredentialsMissingError as exc:
                logger.warning("publish_job aborted: %s", exc)
                _release_claim(session, pin_id, "queued")
                return {"skipped": True, "reason": "missing_credentials", "detail": str(exc)}

            except TransientAPIError as exc:
                # A timeout or 5xx doesn't tell us whether Pinterest
                # actually created the pin before failing to respond.
                # Reconcile against the board before blindly retrying --
                # the destination link's unique utm_content=pin_<id> tag
                # makes an exact match trustworthy. If reconciliation
                # itself fails (e.g. also rate-limited), fall back to the
                # original retry schedule rather than blocking on it.
                existing_pin_id = None
                try:
                    existing_pin_id = client.find_pin_by_link(board_pinterest_id, pin.destination_url)
                except PinterestAPIError as reconcile_exc:
                    logger.warning("Reconciliation check failed for pin %s: %s", pin.id, reconcile_exc)

                if existing_pin_id:
                    pin.pinterest_pin_id = existing_pin_id
                    pin.status = "published"
                    pin.published_at = dt.datetime.now(dt.timezone.utc)
                    pin.last_error = ""
                    published += 1
                    logger.info(
                        "Pin %s: prior attempt actually succeeded (found %s on board), not retrying",
                        pin.id, existing_pin_id,
                    )
                elif pin.retry_count < len(RETRY_SCHEDULE_SECONDS):
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
                session.commit()

            except PinterestAPIError as exc:
                pin.status = "failed"
                pin.last_error = str(exc)
                concept.status = "rejected"
                spawn_replacement_concept(session, concept)
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
    if not state.publishing_enabled():
        # This is a real, live Pinterest write. `pinterest pause` must
        # stop every path that can publish, not just the scheduled job --
        # otherwise the kill switch has a hole a user would only find by
        # accident.
        return {"success": False, "reason": "paused", "hint": "Run `pinterest resume` first."}

    if not settings.pinterest_credentials_present:
        return {
            "success": False,
            "reason": "missing_credentials",
            "required_env": [
                "PINTEREST_CLIENT_ID",
                "PINTEREST_CLIENT_SECRET",
                "PINTEREST_REFRESH_TOKEN (or PINTEREST_ACCESS_TOKEN)",
            ],
        }

    client = PinterestClient()
    with get_session() as session:
        query = select(Pin.id).where(Pin.status.in_(["queued", "scheduled"]))
        if concept_id is not None:
            query = query.where(Pin.concept_id == concept_id)
        pin_id = session.execute(query.order_by(Pin.created_at.asc()).limit(1)).scalar_one_or_none()

        if pin_id is None:
            return {"success": False, "reason": "no_queued_pins"}

        if not _claim_pin(session, pin_id):
            return {"success": False, "reason": "pin_claimed_elsewhere"}

        pin = session.get(Pin, pin_id)
        board_pinterest_id = _resolve_pinterest_board_id(pin.board_id)
        if not board_pinterest_id:
            _release_claim(session, pin_id, "queued")
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
