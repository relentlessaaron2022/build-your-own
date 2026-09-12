"""5x5 campaign generator: 5 search-intent angles x 5 headline/visual
combinations = ~25 unique pin concepts per campaign, per the spec.

Uniqueness is enforced two ways: (1) headline family and visual style are
offset per keyword so no two concepts in a batch share the same
family+style+keyword combo, and (2) every concept's fingerprint is checked
against existing concepts in the same campaign before it's persisted.
"""
from __future__ import annotations

from sqlalchemy import select

from app.copy.descriptions import generate_description
from app.copy.headlines import HEADLINE_FAMILIES, generate_headline
from app.creative.templates import VISUAL_STYLES
from app.db import Campaign, PinConcept, get_session
from app.duplicate import concept_fingerprint
from app.keywords.engine import generate_keywords
from app.logging_config import get_logger

logger = get_logger(__name__)

ANGLES_PER_CAMPAIGN = 5
CONCEPTS_PER_ANGLE = 5


def generate_campaign_concepts(
    *,
    campaign_id: int,
    topic: str,
    landing_url: str,
    brand_key: str,
    seed_keywords: list[str] | None = None,
    board_names: list[str] | None = None,
) -> list[PinConcept]:
    keyword_data = generate_keywords(topic, seed_keywords=seed_keywords)
    angles = (keyword_data.get("secondary") or [topic])[:ANGLES_PER_CAMPAIGN]
    while len(angles) < ANGLES_PER_CAMPAIGN:
        angles.append(keyword_data["primary"])

    board_names = board_names or [""]
    created: list[PinConcept] = []

    with get_session() as session:
        campaign = session.get(Campaign, campaign_id)
        if campaign is None:
            raise ValueError(f"No campaign with id={campaign_id}")

        existing_fingerprints = {
            row[0]
            for row in session.execute(
                select(PinConcept.fingerprint).where(PinConcept.campaign_id == campaign_id)
            ).all()
        }

        for angle_idx, angle_keyword in enumerate(angles):
            for concept_idx in range(CONCEPTS_PER_ANGLE):
                variant_seed = angle_idx * CONCEPTS_PER_ANGLE + concept_idx
                family = HEADLINE_FAMILIES[(angle_idx + concept_idx) % len(HEADLINE_FAMILIES)]
                visual_style = VISUAL_STYLES[(angle_idx + 2 * concept_idx) % len(VISUAL_STYLES)]

                headline_data = generate_headline(angle_keyword, family, variant_seed=variant_seed)
                desc_data = generate_description(
                    headline_data["headline"], angle_keyword, brand_key, variant_seed=variant_seed
                )
                board_name = board_names[variant_seed % len(board_names)]

                fingerprint = concept_fingerprint(
                    headline_data["headline"], visual_style, angle_keyword, landing_url, desc_data["cta"]
                )
                if fingerprint in existing_fingerprints:
                    logger.info("Skipping duplicate concept fingerprint for '%s'", headline_data["headline"])
                    continue

                concept = PinConcept(
                    campaign_id=campaign_id,
                    headline=headline_data["headline"],
                    subheadline=headline_data["subheadline"],
                    description=desc_data["description"],
                    cta=desc_data["cta"],
                    keyword=angle_keyword,
                    visual_style=visual_style,
                    landing_url=landing_url,
                    board_id=board_name,
                    headline_family=family,
                    fingerprint=fingerprint,
                    status="draft",
                )
                session.add(concept)
                existing_fingerprints.add(fingerprint)
                created.append(concept)

        session.commit()
        for c in created:
            session.refresh(c)

    logger.info("Generated %s new pin concepts for campaign %s", len(created), campaign_id)
    return created
