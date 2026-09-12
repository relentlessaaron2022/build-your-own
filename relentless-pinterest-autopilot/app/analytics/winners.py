"""Winner/loser classification using rolling account benchmarks (median),
not fixed numbers, per the spec.

A pin is a WINNER once it has enough impressions to trust the numbers AND
its CTR, save rate, or conversions are substantially above the account's
own recent median. A pin is DEPRIORITIZED once it has enough impressions
and is substantially below median across the board -- its concept is
retired so no further variations get built from a losing idea, but its
history is kept (nothing is deleted).
"""
from __future__ import annotations

import datetime as dt
import statistics
from dataclasses import dataclass

from sqlalchemy import func, select

from app.db import Pin, PinConcept, PinMetric, get_session
from app.logging_config import get_logger

logger = get_logger(__name__)

MIN_IMPRESSIONS_FOR_JUDGMENT = 500
WINNER_MULTIPLIER = 1.5
LOSER_MULTIPLIER = 0.5
BENCHMARK_WINDOW_DAYS = 30  # "rolling" per the spec -- not all-time history


@dataclass
class PinPerformance:
    pin_id: int
    concept_id: int
    impressions: int
    ctr: float
    save_rate: float
    conversions: int


def _aggregate_pin_performance(session, window_days: int = BENCHMARK_WINDOW_DAYS) -> list[PinPerformance]:
    """Sum each pin's metrics over the last `window_days` only. Summing
    all-time history (the previous behavior) contradicts "rolling account
    benchmark": an account's early, unrepresentative performance would
    permanently drag on today's median instead of the benchmark tracking
    recent reality, and old pins would keep looking better/worse forever
    as more days silently accumulate into their lifetime totals."""
    since = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=window_days)
    rows = session.execute(
        select(
            Pin.id,
            Pin.concept_id,
            func.sum(PinMetric.impressions),
            func.sum(PinMetric.outbound_clicks),
            func.sum(PinMetric.saves),
            func.sum(PinMetric.conversions),
        )
        .join(PinMetric, PinMetric.pin_id == Pin.id)
        .where(Pin.status == "published", PinMetric.date >= since)
        .group_by(Pin.id)
    ).all()

    performances = []
    for pin_id, concept_id, impressions, clicks, saves, conversions in rows:
        impressions = impressions or 0
        clicks = clicks or 0
        saves = saves or 0
        conversions = conversions or 0
        ctr = clicks / impressions if impressions else 0.0
        save_rate = saves / impressions if impressions else 0.0
        performances.append(PinPerformance(pin_id, concept_id, impressions, ctr, save_rate, conversions))
    return performances


def compute_benchmarks(performances: list[PinPerformance]) -> dict:
    judged = [p for p in performances if p.impressions >= MIN_IMPRESSIONS_FOR_JUDGMENT]
    if not judged:
        return {"median_ctr": 0.0, "median_save_rate": 0.0, "median_conversions": 0.0, "sample_size": 0}
    return {
        "median_ctr": statistics.median(p.ctr for p in judged),
        "median_save_rate": statistics.median(p.save_rate for p in judged),
        "median_conversions": statistics.median(p.conversions for p in judged),
        "sample_size": len(judged),
    }


def evaluate_winners_and_losers() -> dict:
    with get_session() as session:
        performances = _aggregate_pin_performance(session)
        benchmarks = compute_benchmarks(performances)

        if benchmarks["sample_size"] == 0:
            logger.info("Not enough published-pin data yet to compute winner/loser benchmarks")
            return {"winners": [], "deprioritized": [], "benchmarks": benchmarks}

        winners, deprioritized = [], []

        for perf in performances:
            if perf.impressions < MIN_IMPRESSIONS_FOR_JUDGMENT:
                continue

            concept = session.get(PinConcept, perf.concept_id)
            if concept is None or concept.status in ("winner", "deprioritized"):
                continue

            is_winner = (
                perf.ctr > benchmarks["median_ctr"] * WINNER_MULTIPLIER
                or perf.save_rate > benchmarks["median_save_rate"] * WINNER_MULTIPLIER
                or (benchmarks["median_conversions"] > 0 and perf.conversions > benchmarks["median_conversions"] * WINNER_MULTIPLIER)
            )
            is_loser = (
                perf.ctr < benchmarks["median_ctr"] * LOSER_MULTIPLIER
                and perf.save_rate < benchmarks["median_save_rate"] * LOSER_MULTIPLIER
            )

            if is_winner:
                concept.status = "winner"
                winners.append(perf.concept_id)
            elif is_loser:
                concept.status = "deprioritized"
                deprioritized.append(perf.concept_id)

        session.commit()

    logger.info("Winner/loser evaluation: %s winners, %s deprioritized", len(winners), len(deprioritized))
    return {"winners": winners, "deprioritized": deprioritized, "benchmarks": benchmarks}
