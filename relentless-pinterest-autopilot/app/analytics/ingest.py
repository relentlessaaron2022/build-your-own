"""Pulls per-pin analytics from the Pinterest API and upserts PinMetric
rows. Requires live Pinterest credentials -- if they're not configured
this reports that clearly rather than crashing the rest of the system
(the spec: "isolate credential-dependent features and continue")."""
from __future__ import annotations

import datetime as dt

from sqlalchemy import select

from app.config import settings
from app.db import Pin, PinMetric, get_session
from app.logging_config import get_logger
from app.pinterest.client import CredentialsMissingError, PinterestAPIError, PinterestClient

logger = get_logger(__name__)


def ingest_analytics(lookback_days: int = 1) -> dict:
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

            totals = _extract_totals(data)
            impressions = totals.get("IMPRESSION", 0)
            saves = totals.get("SAVE", 0)
            outbound_clicks = totals.get("OUTBOUND_CLICK", 0)

            metric = PinMetric(
                pin_id=pin.id,
                impressions=impressions,
                saves=saves,
                outbound_clicks=outbound_clicks,
                engagement_rate=(saves + outbound_clicks) / impressions if impressions else 0.0,
                save_rate=saves / impressions if impressions else 0.0,
                ctr=outbound_clicks / impressions if impressions else 0.0,
                conversions=0,  # populated by an attribution integration if/when one exists
                revenue=0.0,
                date=dt.datetime.now(dt.timezone.utc),
            )
            session.add(metric)
            updated += 1

        session.commit()

    return {"skipped": False, "updated": updated, "failed": failed}


def _extract_totals(analytics_response: dict) -> dict:
    """Pinterest's analytics response nests daily buckets; sum across the
    requested range into simple totals per metric type."""
    totals: dict[str, int] = {}
    all_data = analytics_response.get("all", {}).get("daily_metrics", [])
    for day in all_data:
        for metric_name, value in day.get("metrics", {}).items():
            totals[metric_name] = totals.get(metric_name, 0) + (value or 0)
    return totals
