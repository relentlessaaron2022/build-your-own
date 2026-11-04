"""Regression test for analytics double-counting: ingest_analytics used to
insert a fresh, ingestion-timestamped PinMetric row on every run from an
overlapping date range, so downstream sums (dashboard, weekly report,
winner/loser) double-counted the same Pinterest activity."""
from __future__ import annotations

import datetime as dt

from sqlalchemy import select

from app.analytics.ingest import _extract_daily_totals, _upsert_pin_metric
from app.db import Campaign, Pin, PinConcept, PinMetric, get_session


def _make_published_pin() -> int:
    with get_session() as session:
        campaign = Campaign(name="C", site="s", landing_url="https://example.com", category="c", status="active")
        session.add(campaign)
        session.commit()
        concept = PinConcept(
            campaign_id=campaign.id, headline="H", description="D", cta="CTA", keyword="k",
            visual_style="bold_headline", landing_url="https://example.com", board_id="Board",
            headline_family="list", fingerprint="fp-analytics", status="ready",
        )
        session.add(concept)
        session.commit()
        pin = Pin(
            concept_id=concept.id, image_path="/tmp/x.png", board_id="Board",
            destination_url="https://example.com", status="published", pinterest_pin_id="pin123",
        )
        session.add(pin)
        session.commit()
        return pin.id


def test_extract_daily_totals_buckets_by_day():
    response = {
        "all": {
            "daily_metrics": [
                {"date": "2026-01-01", "metrics": {"IMPRESSION": 100, "SAVE": 5, "OUTBOUND_CLICK": 2}},
                {"date": "2026-01-02", "metrics": {"IMPRESSION": 200, "SAVE": 10, "OUTBOUND_CLICK": 4}},
            ]
        }
    }
    totals = _extract_daily_totals(response)
    assert set(totals.keys()) == {dt.date(2026, 1, 1), dt.date(2026, 1, 2)}
    assert totals[dt.date(2026, 1, 1)]["IMPRESSION"] == 100
    assert totals[dt.date(2026, 1, 2)]["IMPRESSION"] == 200


def test_upsert_pin_metric_does_not_duplicate_on_overlapping_runs():
    pin_id = _make_published_pin()
    day = dt.date(2026, 1, 1)

    with get_session() as session:
        _upsert_pin_metric(session, pin_id, day, {"IMPRESSION": 100, "SAVE": 5, "OUTBOUND_CLICK": 2})
        session.commit()

    # Simulate a second ingestion run whose lookback window overlaps the
    # first and returns a revised (higher) total for the same day.
    with get_session() as session:
        _upsert_pin_metric(session, pin_id, day, {"IMPRESSION": 150, "SAVE": 8, "OUTBOUND_CLICK": 3})
        session.commit()

    with get_session() as session:
        rows = session.execute(select(PinMetric).where(PinMetric.pin_id == pin_id)).scalars().all()

    assert len(rows) == 1, "overlapping ingestion runs must upsert the same day, not insert a second row"
    assert rows[0].impressions == 150  # reflects the latest (revised) totals, not summed with the first
