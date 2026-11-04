"""Shared publish eligibility for publishers and usable-queue accounting."""
from sqlalchemy import select
from app.config import load_offers
from app.db import Campaign, Pin, PinConcept, SourceContent

def active_pin_query(offers: list[dict] | None = None):
    offers = load_offers() if offers is None else offers
    disabled_names = [f"{offer['name']} - Primary" for offer in offers if not offer.get("active", True)]
    disabled_urls = [offer["landing_url"] for offer in offers if not offer.get("active", True) and offer.get("landing_url")]
    query = (select(Pin.id).join(PinConcept).join(Campaign)
            .outerjoin(SourceContent, PinConcept.source_id == SourceContent.id)
            .where(Campaign.status == "active")
            .where(Campaign.name.not_in(disabled_names))
            .where((PinConcept.source_id.is_(None)) | (SourceContent.status == "promoted"))
            .where(Pin.status.in_(["queued", "scheduled"])))
    for url in disabled_urls:
        query = query.where(~Pin.destination_url.startswith(url, autoescape=True))
    return query

