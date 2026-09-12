"""5x5 campaign generator: 5 search-intent angles x 5 headline/visual
combinations = ~25 unique pin concepts per campaign, per the spec.

Uniqueness is enforced two ways: (1) headline family and visual style are
offset per keyword so no two concepts in a batch share the same
family+style+keyword combo, and (2) every concept's fingerprint is checked
against existing concepts in the same campaign before it's persisted.
"""
from __future__ import annotations

from sqlalchemy import select

from app.config import brand_key_for_url
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


def _angle_pool(topic: str, keyword_data: dict, seed_keywords: list[str] | None) -> list[str]:
    """All distinct search-intent angles available for this topic: the
    primary keyword, every secondary keyword, every long-tail phrase, and
    any seed keywords not already covered. Deduplicated, order preserved.
    A single 5x5 batch only uses the first 5 -- batch_offset below rotates
    through the rest so repeated generation cycles don't immediately
    collide on fingerprint once the first 25 concepts exist.
    """
    pool = [keyword_data["primary"], *keyword_data.get("secondary", []), *keyword_data.get("long_tail", [])]
    for kw in seed_keywords or []:
        if kw not in pool:
            pool.append(kw)
    seen = set()
    deduped = []
    for item in pool:
        if item not in seen:
            seen.add(item)
            deduped.append(item)
    return deduped or [topic]


def generate_campaign_concepts(
    *,
    campaign_id: int,
    topic: str,
    landing_url: str,
    brand_key: str,
    seed_keywords: list[str] | None = None,
    board_names: list[str] | None = None,
    batch_offset: int = 0,
) -> list[PinConcept]:
    """Generate one 5x5 (~25-concept) batch. `batch_offset` selects which
    slice of the angle pool and which headline/CTA variant numbering this
    batch uses, so calling this repeatedly for the same campaign (e.g.
    generation_job replenishing the queue over many cycles) produces
    genuinely new concepts instead of immediately colliding with the
    fingerprints the first batch already created.
    """
    keyword_data = generate_keywords(topic, seed_keywords=seed_keywords)
    pool = _angle_pool(topic, keyword_data, seed_keywords)
    start = (batch_offset * ANGLES_PER_CAMPAIGN) % len(pool)
    angles = [pool[(start + i) % len(pool)] for i in range(ANGLES_PER_CAMPAIGN)]
    variant_base = batch_offset * ANGLES_PER_CAMPAIGN * CONCEPTS_PER_ANGLE

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
                variant_seed = variant_base + angle_idx * CONCEPTS_PER_ANGLE + concept_idx
                family = HEADLINE_FAMILIES[(angle_idx + concept_idx + batch_offset) % len(HEADLINE_FAMILIES)]
                visual_style = VISUAL_STYLES[(angle_idx + 2 * concept_idx + batch_offset) % len(VISUAL_STYLES)]

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


def spawn_replacement_concept(session, failed_concept: PinConcept, max_attempts: int = 4) -> PinConcept | None:
    """When a concept fails QC or permanently fails publishing, its
    fingerprint is now recorded, so campaign generation's own duplicate
    guard would refuse to ever recreate it -- marking it a terminal
    status and stopping there would silently shrink the campaign by one
    concept forever. This spawns one genuinely different replacement
    (next headline family, next visual style, a fresh variant) in its
    place, added as a new draft for the next materialize pass to pick up.
    Returns None (having logged a warning) in the rare case no unique
    fingerprint is found within max_attempts.
    """
    existing_fingerprints = {
        row[0]
        for row in session.execute(
            select(PinConcept.fingerprint).where(PinConcept.campaign_id == failed_concept.campaign_id)
        ).all()
    }
    brand_key = brand_key_for_url(failed_concept.landing_url) or "relentless_aaron"

    for i in range(max_attempts):
        family = HEADLINE_FAMILIES[
            (HEADLINE_FAMILIES.index(failed_concept.headline_family) + 1 + i) % len(HEADLINE_FAMILIES)
        ]
        visual_style = VISUAL_STYLES[
            (VISUAL_STYLES.index(failed_concept.visual_style) + 1 + i) % len(VISUAL_STYLES)
        ]
        variant_seed = failed_concept.id * 7 + i

        headline_data = generate_headline(failed_concept.keyword, family, variant_seed=variant_seed)
        desc_data = generate_description(
            headline_data["headline"], failed_concept.keyword, brand_key, variant_seed=variant_seed
        )
        fingerprint = concept_fingerprint(
            headline_data["headline"], visual_style, failed_concept.keyword, failed_concept.landing_url, desc_data["cta"]
        )
        if fingerprint in existing_fingerprints:
            continue

        replacement = PinConcept(
            campaign_id=failed_concept.campaign_id,
            source_id=failed_concept.source_id,
            headline=headline_data["headline"],
            subheadline=headline_data["subheadline"],
            description=desc_data["description"],
            cta=desc_data["cta"],
            keyword=failed_concept.keyword,
            visual_style=visual_style,
            landing_url=failed_concept.landing_url,
            board_id=failed_concept.board_id,
            headline_family=family,
            fingerprint=fingerprint,
            parent_concept_id=failed_concept.id,
            status="draft",
        )
        session.add(replacement)
        return replacement

    logger.warning(
        "Could not find a unique replacement for rejected concept %s after %s attempts",
        failed_concept.id, max_attempts,
    )
    return None
