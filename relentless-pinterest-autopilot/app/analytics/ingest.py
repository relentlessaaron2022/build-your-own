"""Pulls per-pin analytics from the Pinterest API and upserts PinMetric
rows. Requires live Pinterest credentials -- if they're not configured
this reports that clearly rather than crashing the rest of the system
(the spec: "isolate credential-dependent features and continue").

Metrics are stored one row per (pin, calendar day) -- see the
uq_pin_metrics_pin_id_date constraint -- and upserted rather than
inserted. An earlier version inserted a fresh row on every run timestamped
at ingestion time, from a request window that overlaps the previous run's;
since every downstream consumer (dashboard, weekly report, winner/loser
classification) sums all stored rows, that meant the exact same Pinterest
activity got counted again on every subsequent ingestion. Upserting per
day fixes the double-count and, as a bonus, lets a wider lookback window
safely pick up Pinterest's own late revisions to a recent day's numbers.
"""
from __future__ import annotations

import datetime as dt

from sqlalchemy import select

from app.config import settings
from app.db import Pin, PinMetric, get_session
from app.logging_config import get_logger
from app.pinterest.client import CredentialsMissingError, PinterestAPIError, PinterestClient

logger = get_logger(__name__)

DEFAULT_LOOKBACK_DAYS = 3


def ingest_analytics(lookback_days: int = DEFAULT_LOOKBACK_DAYS) -> dict:
    if not settings.pinterest_credentials_present:
        logger.info("Skipping analytics ingestion: Pinterest credentials not configured")
        return {"skipped": True, "reason": "Pinterest credentials not configured"}

    client = PinterestClient()
    end_date = dt.date.today()
    start_date = end_date - dt.timedelta(days=lookback_days)

    updated, failed = 0, 0
    with get_session() as session:
        published_pins = session.execute(
            select(Pin).where(Pin.status == "published", Pin.pinterest_pin_id != "")
        ).scalars().all()

        for pin in published_pins:
            try:
                data = client.get_pin_analytics(pin.pinterest_pin_id, start_date, end_date)
            except (CredentialsMissingError, PinterestAPIError) as exc:
                logger.warning("Analytics fetch failed for pin %s: %s", pin.id, exc)
                failed += 1
                continue

            for day, totals in _extract_daily_totals(data).items():
                _upsert_pin_metric(session, pin.id, day, totals)
                updated += 1

        session.commit()

    return {"skipped": False, "updated": updated, "failed": failed}


def _extract_daily_totals(analytics_response: dict) -> dict[dt.date, dict[str, int]]:
    """Pinterest's analytics response nests metrics per calendar day.
    Returns {day: {metric_name: value}} -- one bucket per day, not a
    single summed total, so callers can upsert each day independently."""
    per_day: dict[dt.date, dict[str, int]] = {}
    all_data = analytics_response.get("all", {}).get("daily_metrics", [])
    for day_bucket in all_data:
        date_str = day_bucket.get("date")
        if not date_str:
            continue
        try:
            day = dt.date.fromisoformat(date_str)
        except ValueError:
            logger.warning("Skipping analytics bucket with unparseable date: %r", date_str)
            continue
        bucket = per_day.setdefault(day, {})
        for metric_name, value in day_bucket.get("metrics", {}).items():
            bucket[metric_name] = bucket.get(metric_name, 0) + (value or 0)
    return per_day


def _upsert_pin_metric(session, pin_id: int, day: dt.date, totals: dict[str, int]) -> None:
    day_dt = dt.datetime.combine(day, dt.time.min, tzinfo=dt.timezone.utc)
    impressions = totals.get("IMPRESSION", 0)
    saves = totals.get("SAVE", 0)
    outbound_clicks = totals.get("OUTBOUND_CLICK", 0)
    engagement_rate = (saves + outbound_clicks) / impressions if impressions else 0.0
    save_rate = saves / impressions if impressions else 0.0
    ctr = outbound_clicks / impressions if impressions else 0.0

    existing = session.execute(
        select(PinMetric).where(PinMetric.pin_id == pin_id, PinMetric.date == day_dt)
    ).scalar_one_or_none()

    if existing:
        existing.impressions = impressions
        existing.saves = saves
        existing.outbound_clicks = outbound_clicks
        existing.engagement_rate = engagement_rate
        existing.save_rate = save_rate
        existing.ctr = ctr
    else:
        session.add(
            PinMetric(
                pin_id=pin_id,
                impressions=impressions,
                saves=saves,
                outbound_clicks=outbound_clicks,
                engagement_rate=engagement_rate,
                save_rate=save_rate,
                ctr=ctr,
                conversions=0,  # populated by an attribution integration if/when one exists
                revenue=0.0,
                date=day_dt,
            )
        )
