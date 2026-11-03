import json

import pytest
from sqlalchemy import select

from app.db import Campaign, PinConcept, SourceContent, get_session
from app.discovery import concepts
from app.discovery.social import import_social_export


def export_file(tmp_path, approved=True):
    path = tmp_path / "social.json"
    path.write_text(json.dumps([{
        "platform": "instagram", "url": "https://www.instagram.com/p/example/",
        "title": "A story from the writing desk", "text": "My original caption.", "approved": approved,
        "published_at": "2026-11-01T12:00:00Z",
    }]))
    return str(path)


def test_social_export_flows_into_source_linked_concept(tmp_path):
    path = export_file(tmp_path)
    assert import_social_export(path, "relentlessaaron")["inserted"] == 1
    assert concepts.generate_discovered_concepts() == 1
    with get_session() as session:
        concept = session.scalar(select(PinConcept))
        assert concept.source_id is not None
        assert concept.headline == "A story from the writing desk"
        assert concept.landing_url == "https://www.instagram.com/p/example/"
        assert concept.board_id in {"Creator Business & Publishing", "Author Marketing"}
    # Reimporting or repeatedly generating must not copy the same post again.
    assert import_social_export(path, "relentlessaaron")["updated"] == 1
    assert concepts.generate_discovered_concepts() == 0


def test_unapproved_social_post_is_not_generated(tmp_path):
    import_social_export(export_file(tmp_path, approved=False), "relentlessaaron")
    assert concepts.generate_discovered_concepts() == 0


def test_import_validates_all_items_before_writing(tmp_path):
    path = tmp_path / "bad.json"
    path.write_text(json.dumps([{"platform": "instagram", "url": "https://instagram.com.attacker.test/p/x", "title": "Invalid"}]))
    with pytest.raises(ValueError):
        import_social_export(str(path), "relentlessaaron")
    with get_session() as session:
        assert session.scalar(select(SourceContent)) is None


def test_website_discovery_is_consumed_by_generation():
    with get_session() as session:
        campaign = Campaign(name="Website Discovery", site="relentlessaaron", category="publishing", landing_url="https://relentlessaaron.net", status="active")
        session.add(campaign)
        session.flush()
        session.add(SourceContent(campaign_id=campaign.id, url="https://relentlessaaron.net/my-story", title="My original story", body_excerpt="An excerpt from my story.", status="promoted"))
        session.commit()
    assert concepts.generate_discovered_concepts() == 1
    with get_session() as session:
        concept = session.scalar(select(PinConcept))
        assert concept.landing_url == "https://relentlessaaron.net/my-story"
        assert concept.description == "An excerpt from my story."
    # Exercise the actual creative/QC/queue pipeline, not just row creation.
    assert concepts.materialize_discovered_concepts()["materialized"] == 1


def test_no_matching_board_does_not_fallback_to_irrelevant_board(monkeypatch, tmp_path):
    import_social_export(export_file(tmp_path), "relentlessaaron")
    monkeypatch.setattr(concepts, "load_boards", lambda: [{"name": "AI", "category": "ai_prompts"}])
    assert concepts.generate_discovered_concepts() == 0
