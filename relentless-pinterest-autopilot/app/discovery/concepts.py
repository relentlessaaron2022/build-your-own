"""Turn eligible discovered articles/posts into source-linked pin concepts."""
from sqlalchemy import select

from app.config import load_boards
from app.db import Campaign, PinConcept, SourceContent, get_session
from app.duplicate import concept_fingerprint


def generate_discovered_concepts() -> int:
    count = 0
    boards = load_boards()
    with get_session() as session:
        sources = session.scalars(select(SourceContent).join(Campaign).where(
            SourceContent.status == "promoted", Campaign.status == "active"
        )).all()
        for source in sources:
            if session.scalar(select(PinConcept.id).where(PinConcept.source_id == source.id).limit(1)):
                continue
            campaign = session.get(Campaign, source.campaign_id)
            matching = [b for b in boards if b.get("category") == campaign.category]
            if not matching or not source.title.strip():
                continue
            headline = source.title.strip()[:100]
            description = (source.body_excerpt or source.title).strip()[:700]
            cta = "Read the original"
            concept = PinConcept(
                campaign_id=campaign.id, source_id=source.id, headline=headline,
                description=description, cta=cta, keyword=headline,
                visual_style="bold_headline", headline_family="source_title",
                landing_url=source.url, board_id=matching[count % len(matching)]["name"],
                fingerprint=concept_fingerprint(headline, "bold_headline", headline, source.url, cta),
                status="draft",
            )
            session.add(concept)
            session.flush()
            count += 1
        session.commit()
    return count


def materialize_discovered_concepts() -> dict:
    from app.pipeline import materialize_concept

    with get_session() as session:
        ids = session.scalars(select(PinConcept.id).join(SourceContent, PinConcept.source_id == SourceContent.id)
                              .join(Campaign, PinConcept.campaign_id == Campaign.id)
                              .where(PinConcept.status == "draft", SourceContent.status == "promoted", Campaign.status == "active")).all()
    materialized = sum(materialize_concept(concept_id) is not None for concept_id in ids)
    return {"total": len(ids), "materialized": materialized, "regenerate": len(ids) - materialized}
