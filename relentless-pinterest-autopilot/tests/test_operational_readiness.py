import datetime as dt
import json
from unittest.mock import Mock

import pytest
from sqlalchemy import select

from app.config import settings
from app.db import Campaign, Pin, PinConcept, get_session
from app.scheduler import jobs
from app.pinterest.client import PinterestClient, PinterestAPIError, RateLimitError, TransientAPIError


def seed(count=1, campaign_status="active", pin_status="queued", retry_count=0):
    with get_session() as session:
        campaign = Campaign(name="Test", site="s", landing_url="https://example.com", category="test", status=campaign_status)
        session.add(campaign)
        session.flush()
        for i in range(count):
            concept = PinConcept(campaign_id=campaign.id, headline=f"Sheet set {i}", description="Details", landing_url=campaign.landing_url, status="ready")
            session.add(concept)
            session.flush()
            session.add(Pin(concept_id=concept.id, board_id="Bedding", destination_url=f"https://example.com?utm_content=pin_{i}", image_path="test.png", status=pin_status, retry_count=retry_count))
        session.commit()


@pytest.fixture
def publisher(monkeypatch):
    monkeypatch.setattr(settings, "pinterest_access_token", "test-only")
    monkeypatch.setattr(jobs.state, "publishing_enabled", lambda: True)
    monkeypatch.setattr(jobs, "_resolve_pinterest_board_id", lambda name: "board-id")
    client = Mock()
    client.create_pin.return_value = {"id": "remote-pin"}
    client.find_pin_by_link.return_value = None
    monkeypatch.setattr(jobs, "PinterestClient", lambda: client)
    return client


@pytest.mark.parametrize("target", [0, 1, 6])
def test_daily_target_is_a_hard_cap_across_slots(monkeypatch, publisher, target):
    monkeypatch.setattr(settings, "daily_pin_target", target)
    seed(12)
    for _ in range(7):
        jobs.publish_job()
    assert publisher.create_pin.call_count == target


def test_paused_campaign_does_not_publish(publisher):
    seed(campaign_status="paused")
    jobs.publish_job()
    assert jobs.publish_one_test_pin()["reason"] == "no_queued_pins"
    publisher.create_pin.assert_not_called()


def test_disabled_offer_stops_already_queued_campaign(monkeypatch, publisher):
    seed()
    monkeypatch.setattr(jobs, "load_offers", lambda: [{"name": "Test", "active": False}])
    with get_session() as session:
        campaign = session.scalar(select(Campaign))
        campaign.name = "Test - Primary"
        session.commit()
    jobs.publish_job()
    publisher.create_pin.assert_not_called()


def test_retry_worker_does_not_drain_fresh_queue(publisher):
    seed(3)
    jobs.publish_job(retry_only=True)
    publisher.create_pin.assert_not_called()


def test_retry_reconciles_before_recreating(publisher):
    seed(pin_status="scheduled", retry_count=1)
    publisher.find_pin_by_link.return_value = "already-published"
    result = jobs.publish_job(retry_only=True)
    assert result["published"] == 1
    publisher.create_pin.assert_not_called()
    with get_session() as session:
        assert session.scalar(select(Pin)).pinterest_pin_id == "already-published"


def test_reconciliation_failure_never_sends_another_create(publisher):
    seed(pin_status="scheduled", retry_count=1)
    publisher.find_pin_by_link.side_effect = TransientAPIError("unavailable")
    jobs.publish_job(retry_only=True)
    publisher.create_pin.assert_not_called()


def test_rate_limit_preserves_delayed_retry(publisher):
    seed()
    publisher.create_pin.side_effect = RateLimitError(600)
    jobs.publish_job()
    with get_session() as session:
        pin = session.scalar(select(Pin))
        assert pin.status == "scheduled"
        assert pin.retry_count == 1
        assert pin.scheduled_at > dt.datetime.now(dt.timezone.utc).replace(tzinfo=None) + dt.timedelta(minutes=9)


def test_missing_remote_pin_id_is_not_success(publisher):
    seed()
    publisher.create_pin.return_value = {}
    result = jobs.publish_job()
    assert result["published"] == 0
    with get_session() as session:
        assert session.scalar(select(Pin)).status != "published"


def test_pin_reconciliation_searches_beyond_first_board_page(monkeypatch):
    client = PinterestClient()
    response = Mock(side_effect=[{"items": [{"id": "other", "link": "other"}], "bookmark": "next"}, {"items": [{"id": "found", "link": "target"}]}])
    monkeypatch.setattr(client, "_request", response)
    assert client.find_pin_by_link("board", "target") == "found"
    assert response.call_args_list[1].kwargs["params"]["bookmark"] == "next"


def test_repeated_bookmark_does_not_report_reconciliation_complete(monkeypatch):
    client = PinterestClient()
    monkeypatch.setattr(client, "_request", lambda *a, **k: {"items": [], "bookmark": "repeat"})
    with pytest.raises(PinterestAPIError, match="incomplete"):
        client.find_pin_by_link("board", "target")


def test_scheduler_has_minute_retries_and_explicit_timezone():
    from app.scheduler.runner import build_scheduler
    scheduler = build_scheduler()
    assert scheduler.get_job("retry_job").trigger.interval.total_seconds() == 60
    assert str(scheduler.get_job("publish_job").trigger.timezone) == settings.scheduler_timezone
    assert "fri" in str(scheduler.get_job("weekly_strategy_job").trigger)


def test_health_does_not_invent_liveness(monkeypatch, tmp_path):
    from app import health
    monkeypatch.setattr(health, "HEARTBEAT_PATH", tmp_path / "heartbeat.json")
    report = health.health_report()
    assert report["ready"] is False
    assert report["scheduler_heartbeat_fresh"] is False
    health.record_heartbeat()
    assert health.health_report()["scheduler_heartbeat_fresh"] is True
    health.HEARTBEAT_PATH.write_text(json.dumps({"at": "2020-01-01T00:00:00+00:00"}))
    assert health.health_report()["scheduler_heartbeat_fresh"] is False


def test_concurrent_publisher_is_refused(publisher):
    import fcntl
    from app.config import DATA_DIR
    with (DATA_DIR / "publisher.lock").open("a") as handle:
        fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        assert jobs.publish_job()["reason"] == "publisher_busy"
        assert jobs.publish_one_test_pin()["reason"] == "publisher_busy"
    publisher.create_pin.assert_not_called()
