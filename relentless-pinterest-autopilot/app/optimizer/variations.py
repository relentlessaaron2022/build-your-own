"""Winner recycling: when a concept wins, never repost the same creative --
generate new descendants that change headline, layout, image, CTA,
supporting text, design, and keyword variation while keeping the same
underlying idea, per the spec's example (`10 ChatGPT Prompts Every
Entrepreneur Needs` -> five differently-angled descendants).

Loser retirement is handled in analytics/winners.py (marks the concept
DEPRIORITIZED so no more variations get built from it); this module only
ever touches WINNER concepts.
"""
from __future__ import annotations

from sqlalchemy import select

from app.copy.descriptions import generate_description
from app.copy.headlines import HEADLINE_FAMILIES, generate_headline
from app.creative.templates import VISUAL_STYLES
from app.db import PinConcept, get_session
from app.duplicate import concept_fingerprint
from app.keywords.engine import generate_keywords
from app.logging_config import get_logger

logger = get_logger(__name__)

VARIANTS_PER_WINNER = 5


def _related_keyword(original_keyword: str, index: int) -> str:
    variations = generate_keywords(original_keyword).get("secondary", [])
    if index < len(variations):
        return variations[index]
    return original_keyword


def generate_winner_variations(concept_id: int, count: int = VARIANTS_PER_WINNER) -> list[PinConcept]:
    created: list[PinConcept] = []
    with get_session() as session:
        parent = session.get(PinConcept, concept_id)
        if parent is None:
            raise ValueError(f"No pin concept with id={concept_id}")

        existing_fingerprints = {
            row[0]
            for row in session.execute(
                select(PinConcept.fingerprint).where(PinConcept.campaign_id == parent.campaign_id)
            ).all()
        }

        for i in range(count):
            family = HEADLINE_FAMILIES[(HEADLINE_FAMILIES.index(parent.headline_family) + 1 + i) % len(HEADLINE_FAMILIES)]
            visual_style = VISUAL_STYLES[(VISUAL_STYLES.index(parent.visual_style) + 1 + i) % len(VISUAL_STYLES)]
            keyword = _related_keyword(parent.keyword, i)

            # Bias the variant_seed away from the parent's own seed so CTA/copy differ too.
            variant_seed = i + 17

            headline_data = generate_headline(keyword, family, variant_seed=variant_seed)
            brand_key = None
            from app.config import brand_key_for_url

            brand_key = brand_key_for_url(parent.landing_url) or "relentless_aaron"
            desc_data = generate_description(headline_data["headline"], keyword, brand_key, variant_seed=variant_seed)

            fingerprint = concept_fingerprint(
                headline_data["headline"], visual_style, keyword, parent.landing_url, desc_data["cta"]
            )
            if fingerprint in existing_fingerprints:
                continue

            child = PinConcept(
                campaign_id=parent.campaign_id,
                source_id=parent.source_id,
                headline=headline_data["headline"],
                subheadline=headline_data["subheadline"],
                description=desc_data["description"],
                cta=desc_data["cta"],
                keyword=keyword,
                visual_style=visual_style,
                landing_url=parent.landing_url,
                board_id=parent.board_id,
                headline_family=family,
                fingerprint=fingerprint,
                parent_concept_id=parent.id,
                status="draft",
            )
            session.add(child)
            existing_fingerprints.add(fingerprint)
            created.append(child)

        parent.status = "winner_recycled"
        session.commit()
        for c in created:
            session.refresh(c)

    logger.info("Generated %s winner variations from concept %s", len(created), concept_id)
    return created


def run_optimization_cycle() -> dict:
    """Find every concept still marked WINNER (not yet recycled) and spin
    up its descendants. Called by the daily optimization_job."""
    with get_session() as session:
        winner_ids = [
            row[0] for row in session.execute(select(PinConcept.id).where(PinConcept.status == "winner")).all()
        ]

    total_created = 0
    for concept_id in winner_ids:
        children = generate_winner_variations(concept_id)
        total_created += len(children)

    return {"winners_processed": len(winner_ids), "variations_created": total_created}
