from app.campaign import generate_campaign_concepts
from app.db import Campaign, get_session
from app.pipeline import materialize_all_draft_concepts


def _make_campaign() -> int:
    with get_session() as session:
        campaign = Campaign(
            name="Prompt Mastery Studio - Primary",
            site="relentlessaaron",
            landing_url="https://relentlessaaron.net/prompt-mastery-studio",
            category="ai_prompts",
            objective="test",
            status="active",
        )
        session.add(campaign)
        session.commit()
        session.refresh(campaign)
        return campaign.id


def test_generate_campaign_concepts_produces_25_unique_concepts():
    campaign_id = _make_campaign()
    concepts = generate_campaign_concepts(
        campaign_id=campaign_id,
        topic="ChatGPT prompts for entrepreneurs",
        landing_url="https://relentlessaaron.net/prompt-mastery-studio",
        brand_key="prompt_mastery",
        seed_keywords=[
            "AI prompts for small business",
            "AI productivity prompts",
            "AI marketing prompts",
            "prompt engineering for beginners",
            "ChatGPT tips",
        ],
        board_names=["AI Prompts & ChatGPT", "AI for Entrepreneurs"],
    )
    assert len(concepts) == 25
    fingerprints = [c.fingerprint for c in concepts]
    assert len(set(fingerprints)) == len(fingerprints)  # no duplicate fingerprints


def test_materialize_pipeline_queues_most_concepts_and_flags_the_rest():
    campaign_id = _make_campaign()
    generate_campaign_concepts(
        campaign_id=campaign_id,
        topic="ChatGPT prompts for entrepreneurs",
        landing_url="https://relentlessaaron.net/prompt-mastery-studio",
        brand_key="prompt_mastery",
        seed_keywords=[
            "AI prompts for small business",
            "AI productivity prompts",
            "AI marketing prompts",
            "prompt engineering for beginners",
            "ChatGPT tips",
        ],
        board_names=["AI Prompts & ChatGPT", "AI for Entrepreneurs"],
    )
    result = materialize_all_draft_concepts(campaign_id=campaign_id, check_network=False)
    assert result["total"] == 25
    # The vast majority should clear QC; a handful of legitimate near-duplicates
    # (same headline family + template + adjacent keyword) are expected to be
    # caught and marked regenerate rather than published.
    assert result["materialized"] >= 20
    assert result["materialized"] + result["regenerate"] == 25
