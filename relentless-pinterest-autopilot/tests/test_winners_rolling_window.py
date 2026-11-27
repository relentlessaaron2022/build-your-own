"""Regression test: winner/loser benchmarking used to sum a pin's
all-time metrics, contradicting its own "rolling account benchmark"
description -- old performance would permanently skew today's median."""
from __future__ import annotations

import datetime as dt

from app.analytics.winners import _aggregate_pin_performance
from app.db import Campaign, Pin, PinConcept, PinMetric, get_session


def _make_published_pin_with_metric(days_ago: int, impressions: int) -> int:
    with get_session() as session:
        campaign = Campaign(name="C", site="s", landing_url="https://example.com", category="c", status="active")
        session.add(campaign)
        session.commit()
        concept = PinConcept(
            campaign_id=campaign.id, headline=f"H{days_ago}", description="D", cta="CTA", keyword="k",
            visual_style="bold_headline", landing_url="https://example.com", board_id="Board",
            headline_family="list", fingerprint=f"fp-{days_ago}", status="ready",
        )
        session.add(concept)
        session.commit()
        pin = Pin(
            concept_id=concept.id, image_path="/tmp/x.png", board_id="Board",
            destination_url="https://example.com", status="published", pinterest_pin_id=f"pin{days_ago}",
        )
        session.add(pin)
        session.commit()
        metric_date = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days_ago)
        session.add(PinMetric(pin_id=pin.id, impressions=impressions, saves=0, outbound_clicks=0, date=metric_date))
        session.commit()
        return pin.id


def test_old_metrics_outside_window_are_excluded():
    recent_pin_id = _make_published_pin_with_metric(days_ago=5, impressions=1000)
    ancient_pin_id = _make_published_pin_with_metric(days_ago=200, impressions=999999)

    with get_session() as session:
        performances = _aggregate_pin_performance(session, window_days=30)

    pin_ids = {p.pin_id for p in performances}
    assert recent_pin_id in pin_ids
    assert ancient_pin_id not in pin_ids, "metrics older than the rolling window must not enter the benchmark"
