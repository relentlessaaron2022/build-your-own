"""Weekly summary report -- matches the example format in the spec
(Pins published, impressions, outbound clicks, CTR, conversions, best
keyword, best creative, best headline family, one recommendation)."""
from __future__ import annotations

import datetime as dt
from collections import Counter
from pathlib import Path

from sqlalchemy import func, select

from app.config import REPORTS_DIR
from app.db import Pin, PinConcept, PinMetric, get_session


def generate_weekly_report(days: int = 7) -> dict:
    since = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)

    with get_session() as session:
        pins_published = session.execute(
            select(func.count(Pin.id)).where(Pin.published_at >= since)
        ).scalar_one()

        totals = session.execute(
            select(
                func.coalesce(func.sum(PinMetric.impressions), 0),
                func.coalesce(func.sum(PinMetric.outbound_clicks), 0),
                func.coalesce(func.sum(PinMetric.conversions), 0),
            ).where(PinMetric.date >= since)
        ).one()
        impressions, outbound_clicks, conversions = totals
        ctr = (outbound_clicks / impressions) if impressions else 0.0

        keyword_rows = session.execute(
            select(PinConcept.keyword, func.sum(PinMetric.outbound_clicks))
            .join(Pin, Pin.concept_id == PinConcept.id)
            .join(PinMetric, PinMetric.pin_id == Pin.id)
            .where(PinMetric.date >= since)
            .group_by(PinConcept.keyword)
            .order_by(func.sum(PinMetric.outbound_clicks).desc())
            .limit(1)
        ).first()
        best_keyword = keyword_rows[0] if keyword_rows else None

        creative_rows = session.execute(
            select(PinConcept.visual_style, func.sum(PinMetric.saves))
            .join(Pin, Pin.concept_id == PinConcept.id)
            .join(PinMetric, PinMetric.pin_id == Pin.id)
            .where(PinMetric.date >= since)
            .group_by(PinConcept.visual_style)
            .order_by(func.sum(PinMetric.saves).desc())
            .limit(1)
        ).first()
        best_creative = creative_rows[0] if creative_rows else None

        family_rows = session.execute(
            select(PinConcept.headline_family, func.sum(PinMetric.outbound_clicks))
            .join(Pin, Pin.concept_id == PinConcept.id)
            .join(PinMetric, PinMetric.pin_id == Pin.id)
            .where(PinMetric.date >= since)
            .group_by(PinConcept.headline_family)
            .order_by(func.sum(PinMetric.outbound_clicks).desc())
            .limit(1)
        ).first()
        best_headline_family = family_rows[0] if family_rows else None

    if best_keyword:
        recommendation = f"Increase content built around '{best_keyword}' -- it's outperforming the rest of the account."
    else:
        recommendation = "Not enough data yet. Keep the queue full and revisit this report next week."

    return {
        "period_days": days,
        "pins_published": pins_published,
        "impressions": impressions,
        "outbound_clicks": outbound_clicks,
        "ctr": round(ctr * 100, 2),
        "conversions": conversions,
        "best_keyword": best_keyword,
        "best_creative": best_creative,
        "best_headline_family": best_headline_family,
        "recommendation": recommendation,
    }


def format_report_markdown(report: dict) -> str:
    return (
        "# Pinterest Weekly Report\n\n"
        f"- Pins published: {report['pins_published']}\n"
        f"- Impressions: {report['impressions']:,}\n"
        f"- Outbound clicks: {report['outbound_clicks']:,}\n"
        f"- CTR: {report['ctr']}%\n"
        f"- Conversions: {report['conversions']}\n"
        f"- Best keyword: {report['best_keyword'] or 'n/a'}\n"
        f"- Best creative: {report['best_creative'] or 'n/a'}\n"
        f"- Best headline family: {report['best_headline_family'] or 'n/a'}\n\n"
        f"**Recommendation:** {report['recommendation']}\n"
    )


def save_weekly_report(report: dict) -> Path:
    filename = f"weekly-report-{dt.date.today().isoformat()}.md"
    path = REPORTS_DIR / filename
    path.write_text(format_report_markdown(report), encoding="utf-8")
    return path
