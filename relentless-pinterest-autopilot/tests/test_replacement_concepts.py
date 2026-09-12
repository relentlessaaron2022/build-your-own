"""Regression test: concepts that failed QC or permanently failed
publishing used to be marked "regenerate" with nothing ever consuming
that status -- since their fingerprint was already recorded, future
campaign generation would skip recreating them, so the campaign silently
lost a concept forever instead of getting a genuinely different
replacement."""
from __future__ import annotations

from sqlalchemy import select

from app.campaign import spawn_replacement_concept
from app.db import Campaign, PinConcept, get_session
from app.duplicate import concept_fingerprint


def test_spawn_replacement_concept_produces_new_unique_fingerprint():
    with get_session() as session:
        campaign = Campaign(
            name="Replacement Test", site="relentlessaaron", landing_url="https://relentlessaaron.net",
            category="ai_prompts", status="active",
        )
        session.add(campaign)
        session.commit()

        original_fingerprint = concept_fingerprint(
            "Original Headline", "bold_headline", "ai prompts", "https://relentlessaaron.net", "Learn More"
        )
        failed = PinConcept(
            campaign_id=campaign.id,
            headline="Original Headline",
            description="Original description.",
            cta="Learn More",
            keyword="ai prompts",
            visual_style="bold_headline",
            landing_url="https://relentlessaaron.net",
            board_id="AI Prompts & ChatGPT",
            headline_family="list",
            fingerprint=original_fingerprint,
            status="draft",
        )
        session.add(failed)
        session.commit()
        failed_id = failed.id

        failed.status = "rejected"
        replacement = spawn_replacement_concept(session, failed)
        session.commit()

        assert replacement is not None
        assert replacement.status == "draft"
        assert replacement.parent_concept_id == failed_id
        assert replacement.fingerprint != original_fingerprint
        # A real replacement, not a cosmetic copy: different template and/or family.
        assert (replacement.headline_family, replacement.visual_style) != ("list", "bold_headline")

    with get_session() as session:
        fingerprints = {
            row[0] for row in session.execute(
                select(PinConcept.fingerprint).where(PinConcept.campaign_id == campaign.id)
            ).all()
        }
        assert len(fingerprints) == 2  # original + replacement, no collision
