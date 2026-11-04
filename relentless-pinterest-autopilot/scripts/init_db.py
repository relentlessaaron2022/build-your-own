#!/usr/bin/env python3
"""One-time setup: create tables and seed a Campaign per configured offer.

Run from the project root: `python scripts/init_db.py`
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import load_offers  # noqa: E402
from app.db import Campaign, get_session, init_db  # noqa: E402


def seed_campaigns() -> None:
    with get_session() as session:
        for offer in load_offers():
            name = f"{offer['name']} - Primary"
            existing = (
                session.query(Campaign)
                .filter_by(name=name, site=offer["site_id"])
                .one_or_none()
            )
            if existing:
                continue
            session.add(
                Campaign(
                    name=name,
                    site=offer["site_id"],
                    landing_url=offer["landing_url"],
                    category=offer["category"],
                    objective=f"Drive Pinterest traffic to {offer['name']}",
                    status="active" if offer.get("active", True) else "paused",
                )
            )
        session.commit()


if __name__ == "__main__":
    init_db()
    seed_campaigns()
    print("Database initialized and offer campaigns seeded.")
