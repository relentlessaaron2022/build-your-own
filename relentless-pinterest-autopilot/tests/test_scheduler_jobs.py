"""Regression tests for the bugs found in the Qodo review of PR #1:
fresh-install campaign commit, queue replenishment across generation
rounds, atomic pin claiming, and the publish-test kill switch.
"""
from __future__ import annotations

from sqlalchemy import select

from app import state
from app.db import Campaign, Pin, PinConcept, get_session
from app.scheduler.jobs import (
    _claim_pin,
    _get_or_create_offer_campaign,
    _release_claim,
    generation_job,
    publish_one_test_pin,
    publish_slot_size,
)


def test_get_or_create_offer_campaign_commits_new_campaign():
    """Regression test: this used to flush-but-not-commit a new campaign,
    so a second session (as generate_campaign_concepts opens) couldn't
    see it on a fresh database and raised before producing any concepts."""
    offer = {
        "name": "Test Offer",
        "site_id": "test_site",
        "landing_url": "https://example.com/offer",
        "category": "test",
        "active": True,
    }
    with get_session() as session:
        campaign = _get_or_create_offer_campaign(session, offer)
        campaign_id = campaign.id

    # A brand-new session must be able to see the committed campaign.
    with get_session() as session:
        found = session.get(Campaign, campaign_id)
        assert found is not None
        assert found.name == "Test Offer - Primary"


def test_generation_job_on_fresh_database_does_not_raise():
    """End-to-end regression test for the fresh-install crash: no
    scripts/init_db.py seeding has happened, so this exercises the
    create-a-new-campaign path directly."""
    result = generation_job(force=True)
    assert result["skipped"] is False
    assert result["campaigns"], "generation_job should have produced at least one campaign's worth of concepts"
    assert result["campaigns"][0]["total"] > 0


def test_generation_job_replenishes_queue_across_rounds(monkeypatch):
    """Regression test for the queue running dry after the first batch:
    generation_job must keep looping (via batch_offset) until the queue
    clears MIN_QUEUE_DAYS, not stop after one static, fingerprint-colliding
    batch."""
    import app.config as config_module

    monkeypatch.setattr(config_module.settings, "daily_pin_target", 5)
    monkeypatch.setattr(config_module.settings, "min_queue_days", 14)

    result = generation_job(force=True)
    assert result["rounds_run"] > 1, "a single 25-concept batch cannot reach a 14-day queue at 5/day"
    assert result["queue_needed_more"] is False


def test_claim_pin_is_exclusive():
    """Regression test for concurrent publishers double-sending a pin:
    only the first caller to claim a queued pin should succeed."""
    with get_session() as session:
        campaign = Campaign(
            name="Claim Test", site="s", landing_url="https://example.com", category="c", status="active"
        )
        session.add(campaign)
        session.commit()
        concept = PinConcept(
            campaign_id=campaign.id, headline="H", description="D", cta="CTA", keyword="k",
            visual_style="bold_headline", landing_url="https://example.com", board_id="Board",
            headline_family="list", fingerprint="fp1", status="ready",
        )
        session.add(concept)
        session.commit()
        pin = Pin(concept_id=concept.id, image_path="/tmp/x.png", board_id="Board",
                   destination_url="https://example.com", status="queued")
        session.add(pin)
        session.commit()
        pin_id = pin.id

    with get_session() as session_a, get_session() as session_b:
        first_claim = _claim_pin(session_a, pin_id)
        second_claim = _claim_pin(session_b, pin_id)

    assert first_claim is True
    assert second_claim is False

    with get_session() as session:
        assert session.get(Pin, pin_id).status == "publishing"


def test_release_claim_reverts_status():
    with get_session() as session:
        campaign = Campaign(name="C", site="s", landing_url="https://example.com", category="c", status="active")
        session.add(campaign)
        session.commit()
        concept = PinConcept(
            campaign_id=campaign.id, headline="H", description="D", cta="CTA", keyword="k",
            visual_style="bold_headline", landing_url="https://example.com", board_id="Board",
            headline_family="list", fingerprint="fp2", status="ready",
        )
        session.add(concept)
        session.commit()
        pin = Pin(concept_id=concept.id, image_path="/tmp/x.png", board_id="Board",
                   destination_url="https://example.com", status="publishing")
        session.add(pin)
        session.commit()
        pin_id = pin.id
        _release_claim(session, pin_id, "queued")

    with get_session() as session:
        assert session.get(Pin, pin_id).status == "queued"


def test_publish_slot_size_matches_daily_target():
    """Regression test: this used to be hardcoded to 2 regardless of the
    configured target, publishing 10/day (5 slots x 2) against a default
    DAILY_PIN_TARGET of 5."""
    assert publish_slot_size(daily_target=5) == 1  # 5 slots/day -> 1 per slot
    assert publish_slot_size(daily_target=10) == 2
    assert publish_slot_size(daily_target=1) == 1  # never zero


def test_publish_test_respects_pause():
    """Regression test: `pinterest pause` must stop every write path, not
    just the scheduled publish_job -- publish-test used to bypass it."""
    state.pause_publishing()
    try:
        result = publish_one_test_pin()
        assert result["success"] is False
        assert result["reason"] == "paused"
    finally:
        state.resume_publishing()
