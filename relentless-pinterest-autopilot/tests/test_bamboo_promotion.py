from sqlalchemy import select
from app.config import load_offers, load_boards, brand_key_for_url
from app.copy.headlines import HEADLINE_FAMILIES, generate_headline
from app.copy.descriptions import generate_description
from app.keywords.engine import generate_keywords
from app.db import Campaign, PinConcept, Pin, get_session
from app.scheduler.jobs import _active_pin_query

PUBLIC_BAMBOO = "https://bamboo-solid-2000-series.relentless-a-2737.chatgpt.site"

def test_default_offer_is_bamboo_and_prompt_mastery_is_disabled():
    offers = load_offers()
    assert [o["id"] for o in offers if o.get("active", True)] == ["bamboo_sheets"]
    assert next(o for o in offers if o["id"] == "prompt_mastery_studio")["active"] is False
    bamboo = next(o for o in offers if o["id"] == "bamboo_sheets")
    assert bamboo["landing_url"] == PUBLIC_BAMBOO
    assert bamboo["category"] == "bedding"
    assert any(b["category"] == "bedding" for b in load_boards())
    assert brand_key_for_url(PUBLIC_BAMBOO) == "bamboo_sheets"

def test_bamboo_keywords_do_not_call_llm_or_use_business_modifiers(monkeypatch):
    import app.keywords.engine as engine
    def forbidden(*args, **kwargs):
        raise AssertionError("Reviewed bedding profile should not invoke an LLM")
    monkeypatch.setattr(engine, "_llm_keywords", forbidden)
    words = generate_keywords("bamboo sheet sets", brand_key="bamboo_sheets")
    combined = str(words).lower()
    assert "queen" in combined and "king" in combined
    assert not any(term in combined for term in ["entrepreneur", "productivity", "chatgpt"])

def test_all_bamboo_headline_families_use_product_copy():
    for family in HEADLINE_FAMILIES:
        for seed in range(8):
            headline = generate_headline("Queen sheet sets", family, seed, brand_key="bamboo_sheets")
            description = generate_description(headline["headline"], "Queen sheet sets", "bamboo_sheets", seed)
            combined = (headline["headline"] + description["description"] + description["cta"]).lower()
            assert len(headline["headline"]) <= 100
            assert not any(term in combined for term in ["entrepreneur", "24/7 business", "workday", "pays for itself", "get the prompts", "100% bamboo", "2000 thread count"])
            assert any(term in combined for term in ["sheet", "bedroom", "queen"])

def test_old_queued_prompt_destination_cannot_publish_even_under_other_campaign():
    with get_session() as session:
        campaign = Campaign(name="Discovered content", site="relentlessaaron", category="publishing", landing_url="https://relentlessaaron.net", status="active")
        session.add(campaign); session.flush()
        for i, url in enumerate(["https://relentlessaaron.net/prompt-mastery-studio?utm_content=old", PUBLIC_BAMBOO]):
            concept = PinConcept(campaign_id=campaign.id, headline="H", description="D", landing_url=url, status="ready", fingerprint=f"bamboo-test-{i}")
            session.add(concept); session.flush()
            session.add(Pin(concept_id=concept.id, destination_url=url, board_id="B", status="queued"))
        session.commit()
        selected = session.scalars(_active_pin_query()).all()
        destinations = [session.get(Pin, pin_id).destination_url for pin_id in selected]
        assert destinations == [PUBLIC_BAMBOO]

def test_disabled_prompt_pins_do_not_inflate_usable_queue():
    from app.queue_manager import queued_pin_count
    with get_session() as session:
        campaign = Campaign(name="Historical queue", site="relentlessaaron", category="publishing", landing_url="https://relentlessaaron.net", status="active")
        session.add(campaign); session.flush()
        for i, url in enumerate(["https://relentlessaaron.net/prompt-mastery-studio?utm_content=old", PUBLIC_BAMBOO]):
            concept = PinConcept(campaign_id=campaign.id, headline="H", description="D", landing_url=url, status="ready", fingerprint=f"queue-test-{i}")
            session.add(concept); session.flush()
            session.add(Pin(concept_id=concept.id, destination_url=url, board_id="B", status="queued"))
        session.commit()
    assert queued_pin_count() == 1
