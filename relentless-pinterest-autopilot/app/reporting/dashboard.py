"""Minimal Flask dashboard: today's numbers, last-7-days leaderboard,
queue/scheduled/failed pins, active campaigns, winner concepts, errors --
every panel the spec's DASHBOARD section calls for. Run with `pinterest
dashboard` (defaults to http://127.0.0.1:5151)."""
from __future__ import annotations

import datetime as dt

from flask import Flask, render_template
from sqlalchemy import func, select

from app.db import Campaign, Pin, PinConcept, PinMetric, get_session

app = Flask(__name__)


def _today_stats() -> dict:
    today_start = dt.datetime.now(dt.timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    with get_session() as session:
        published = session.execute(
            select(func.count(Pin.id)).where(Pin.published_at >= today_start)
        ).scalar_one()
        totals = session.execute(
            select(
                func.coalesce(func.sum(PinMetric.impressions), 0),
                func.coalesce(func.sum(PinMetric.outbound_clicks), 0),
                func.coalesce(func.sum(PinMetric.saves), 0),
                func.coalesce(func.sum(PinMetric.conversions), 0),
            ).where(PinMetric.date >= today_start)
        ).one()
    impressions, clicks, saves, conversions = totals
    return {
        "pins_published": published,
        "impressions": impressions,
        "clicks": clicks,
        "saves": saves,
        "conversions": conversions,
    }


def _last_7_days() -> dict:
    since = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=7)
    with get_session() as session:
        top_pins = session.execute(
            select(PinConcept.headline, func.sum(PinMetric.outbound_clicks).label("clicks"))
            .join(Pin, Pin.concept_id == PinConcept.id)
            .join(PinMetric, PinMetric.pin_id == Pin.id)
            .where(PinMetric.date >= since)
            .group_by(PinConcept.headline)
            .order_by(func.sum(PinMetric.outbound_clicks).desc())
            .limit(5)
        ).all()

        lowest_performers = session.execute(
            select(PinConcept.headline, func.sum(PinMetric.impressions).label("impressions"))
            .join(Pin, Pin.concept_id == PinConcept.id)
            .join(PinMetric, PinMetric.pin_id == Pin.id)
            .where(PinMetric.date >= since)
            .group_by(PinConcept.headline)
            .having(func.sum(PinMetric.impressions) > 0)
            .order_by(func.sum(PinMetric.outbound_clicks).asc())
            .limit(5)
        ).all()

        top_keywords = session.execute(
            select(PinConcept.keyword, func.sum(PinMetric.outbound_clicks).label("clicks"))
            .join(Pin, Pin.concept_id == PinConcept.id)
            .join(PinMetric, PinMetric.pin_id == Pin.id)
            .where(PinMetric.date >= since)
            .group_by(PinConcept.keyword)
            .order_by(func.sum(PinMetric.outbound_clicks).desc())
            .limit(5)
        ).all()

        top_boards = session.execute(
            select(Pin.board_id, func.sum(PinMetric.saves).label("saves"))
            .join(PinMetric, PinMetric.pin_id == Pin.id)
            .where(PinMetric.date >= since)
            .group_by(Pin.board_id)
            .order_by(func.sum(PinMetric.saves).desc())
            .limit(5)
        ).all()

        best_landing_pages = session.execute(
            select(PinConcept.landing_url, func.sum(PinMetric.outbound_clicks).label("clicks"))
            .join(Pin, Pin.concept_id == PinConcept.id)
            .join(PinMetric, PinMetric.pin_id == Pin.id)
            .where(PinMetric.date >= since)
            .group_by(PinConcept.landing_url)
            .order_by(func.sum(PinMetric.outbound_clicks).desc())
            .limit(5)
        ).all()

    return {
        "top_pins": top_pins,
        "lowest_performers": lowest_performers,
        "top_keywords": top_keywords,
        "top_boards": top_boards,
        "best_landing_pages": best_landing_pages,
    }


def _operational_status() -> dict:
    with get_session() as session:
        queue_count = session.execute(
            select(func.count(Pin.id)).where(Pin.status.in_(["queued", "scheduled"]))
        ).scalar_one()
        scheduled_pins = session.execute(
            select(Pin.id, Pin.scheduled_at).where(Pin.status == "scheduled").order_by(Pin.scheduled_at.asc()).limit(10)
        ).all()
        failed_pins = session.execute(
            select(Pin.id, Pin.last_error).where(Pin.status == "failed").order_by(Pin.updated_at.desc()).limit(10)
        ).all()
        active_campaigns = session.execute(
            select(Campaign.name).where(Campaign.status == "active")
        ).scalars().all()
        winner_concepts = session.execute(
            select(PinConcept.headline).where(PinConcept.status.in_(["winner", "winner_recycled"])).limit(10)
        ).scalars().all()

    return {
        "queue_count": queue_count,
        "scheduled_pins": scheduled_pins,
        "failed_pins": failed_pins,
        "active_campaigns": active_campaigns,
        "winner_concepts": winner_concepts,
    }


@app.route("/")
def index():
    return render_template(
        "dashboard.html",
        today=_today_stats(),
        last7=_last_7_days(),
        ops=_operational_status(),
        generated_at=dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    )


def run_dashboard(host: str = "127.0.0.1", port: int = 5151, debug: bool = False) -> None:
    app.run(host=host, port=port, debug=debug)
