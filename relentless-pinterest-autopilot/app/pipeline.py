"""Materializes a PinConcept into a renderable, quality-checked Pin row.

This is the CREATIVE CONCEPTS -> PIN GRAPHICS -> DUPLICATE CHECK ->
QUALITY CONTROL -> QUEUE stretch of the core workflow diagram in the spec.
Concept generation (campaign.py) and Pinterest publishing (scheduler/jobs.py)
are deliberately kept out of this module so each stage can be retried
independently.
"""
from __future__ import annotations

from sqlalchemy import select

from app.campaign import spawn_replacement_concept
from app.config import brand_key_for_url, brand_for_key
from app.creative.provider import get_default_provider
from app.db import Campaign, Pin, PinConcept, get_session
from app.duplicate import normalized_copy_hash, perceptual_image_hash
from app.keywords.engine import slugify
from app.logging_config import get_logger
from app.quality import run_quality_checks
from app.utm import add_utm_params

logger = get_logger(__name__)


def _existing_pins_for_dedupe(session) -> list[dict]:
    rows = session.execute(
        select(Pin.image_hash, PinConcept.headline, PinConcept.description)
        .join(PinConcept, Pin.concept_id == PinConcept.id)
        .where(Pin.status.in_(["queued", "scheduled", "published"]))
    ).all()
    return [
        {"image_hash": image_hash, "text": f"{headline} {description}"}
        for image_hash, headline, description in rows
    ]


def materialize_concept(concept_id: int, check_network: bool = False) -> Pin | None:
    with get_session() as session:
        concept = session.get(PinConcept, concept_id)
        if concept is None:
            raise ValueError(f"No pin concept with id={concept_id}")
        campaign = session.get(Campaign, concept.campaign_id)

        brand_key = brand_key_for_url(concept.landing_url) or "relentless_aaron"
        brand = brand_for_key(brand_key)

        provider = get_default_provider()
        image_path = provider.generate(
            {
                "id": concept.id,
                "headline": concept.headline,
                "subheadline": concept.subheadline,
                "visual_style": concept.visual_style,
            },
            brand,
        )
        image_hash = perceptual_image_hash(image_path)
        text_for_dupe = f"{concept.headline} {concept.description}"

        utm_campaign = slugify(campaign.category or campaign.name) if campaign else "autopilot"
        destination_url = add_utm_params(concept.landing_url, utm_campaign, pin_id=concept.id)

        existing_pins = _existing_pins_for_dedupe(session)

        result = run_quality_checks(
            headline=concept.headline,
            description=concept.description,
            destination_url=destination_url,
            landing_url=concept.landing_url,
            board_name=concept.board_id,
            campaign_active=(campaign.status == "active" if campaign else False),
            image_path=str(image_path),
            image_hash=image_hash,
            text_for_dupe_check=text_for_dupe,
            existing_pins=existing_pins,
            check_network=check_network,
        )

        if not result.passed:
            concept.status = "rejected"
            spawn_replacement_concept(session, concept)
            session.commit()
            logger.warning("Concept %s failed QC: %s", concept_id, "; ".join(result.failures))
            return None

        pin = Pin(
            concept_id=concept.id,
            image_path=str(image_path),
            image_hash=image_hash,
            text_hash=normalized_copy_hash(text_for_dupe),
            board_id=concept.board_id,
            destination_url=destination_url,
            status="queued",
        )
        session.add(pin)
        concept.status = "ready"
        session.commit()
        session.refresh(pin)
        logger.info("Materialized concept %s into pin %s (queued)", concept_id, pin.id)
        return pin


def materialize_all_draft_concepts(campaign_id: int | None = None, check_network: bool = False) -> dict:
    with get_session() as session:
        query = select(PinConcept.id).where(PinConcept.status == "draft")
        if campaign_id is not None:
            query = query.where(PinConcept.campaign_id == campaign_id)
        concept_ids = [row[0] for row in session.execute(query).all()]

    materialized, regenerated = 0, 0
    for cid in concept_ids:
        pin = materialize_concept(cid, check_network=check_network)
        if pin is not None:
            materialized += 1
        else:
            regenerated += 1

    return {"materialized": materialized, "regenerate": regenerated, "total": len(concept_ids)}
